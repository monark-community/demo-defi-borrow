"use client"

/**
 * Every state change the demo can make. Transaction-backed operations are
 * called by the UI only once the simulated transaction confirms (see
 * chain.ts `useTx`), with the transaction hash. Market and clock changes
 * are demo-only controls; they re-check every loan's terms afterwards,
 * which is what an on-chain keeper would do. Loan operations take the loan
 * id, like the contract's `loanId`.
 */

import { blockTime } from "./chain"
import { randomAddress, randomHash, randomId } from "./ids"
import { borrowerLevel, graceEndsAt, levelDiscount, liquidationBreakdown, loanApr, positionOf, quoteApr, interestFor } from "./loan-math"
import { demoNow, getDemo, update } from "./store"
import { exampleLoans } from "./seed"
import { DAY_MS, round6 } from "./tokens"
import type {
  CollateralSymbol,
  DemoState,
  KeeperJob,
  LiquidationReason,
  Loan,
  LoanEvent,
  LoanSymbol,
  RateKind,
  TermDays,
  TokenSymbol,
} from "./types"

function event(kind: LoanEvent["kind"], hash: string, at: number, extra: Partial<LoanEvent> = {}): LoanEvent {
  return { id: randomId("ev"), at, kind, hash, ...extra }
}

function addBalance(s: DemoState, symbol: TokenSymbol, delta: number): DemoState {
  return {
    ...s,
    wallet: { ...s.wallet, balances: { ...s.wallet.balances, [symbol]: round6(Math.max(0, s.wallet.balances[symbol] + delta)) } },
  }
}

function spendAllowance(s: DemoState, symbol: CollateralSymbol, amount: number): DemoState {
  return {
    ...s,
    wallet: { ...s.wallet, allowances: { ...s.wallet.allowances, [symbol]: round6(Math.max(0, s.wallet.allowances[symbol] - amount)) } },
  }
}

/** Move accrued interest into every open loan, up to `now`. */
function settle(s: DemoState, now: number): DemoState {
  return {
    ...s,
    loans: s.loans.map((loan) =>
      loan.status === "active"
        ? { ...loan, accrued: loan.accrued + interestFor(loan.outstanding, loanApr(loan, s.market), now - loan.lastAccrualAt), lastAccrualAt: now }
        : loan
    ),
  }
}

function findLoan(s: DemoState, id: string): Loan | undefined {
  return s.loans.find((l) => l.id === id)
}

function withLoan(s: DemoState, loan: Loan): DemoState {
  return { ...s, loans: s.loans.map((l) => (l.id === loan.id ? loan : l)) }
}

function withoutKeeper(s: DemoState, id: string): DemoState {
  if (!s.keepers[id]) return s
  const keepers = { ...s.keepers }
  delete keepers[id]
  return { ...s, keepers }
}

/* ----------------------------------------------------------- transactions */

/** The allowance confirmed just before opening a loan, recorded as the loan's first event. */
let lastApprovalHash: { symbol: CollateralSymbol; hash: string; at: number; amount: number } | null = null

/**
 * Grant an allowance. When it is for an open loan (adding collateral) it goes
 * straight into that loan's log; otherwise it waits for the new loan.
 */
export function approveCollateral(symbol: CollateralSymbol, amount: number, hash: string, loanId?: string) {
  const now = demoNow()
  update((s) => {
    const next = { ...s, wallet: { ...s.wallet, allowances: { ...s.wallet.allowances, [symbol]: round6(amount) } } }
    const loan = loanId ? findLoan(s, loanId) : undefined
    return loan ? withLoan(next, { ...loan, events: [...loan.events, event("approved", hash, now, { amount: round6(amount), symbol })] }) : next
  })
  lastApprovalHash = loanId ? null : { symbol, hash, at: now, amount }
}

export interface OpenLoanInput {
  borrowSymbol: LoanSymbol
  amount: number
  collateralSymbol: CollateralSymbol
  collateral: number
  rateKind: RateKind
  termDays: TermDays
}

/** Open a new loan beside any others, and return its id. */
export function openLoan(input: OpenLoanInput, hash: string): string {
  const now = demoNow()
  const id = randomId("loan")
  update((s) => {
    const discount = levelDiscount(borrowerLevel(s.borrower))
    const apr = quoteApr(input.borrowSymbol, input.rateKind, s.market, discount)
    const events: LoanEvent[] = []
    if (lastApprovalHash && lastApprovalHash.symbol === input.collateralSymbol) {
      events.push(event("approved", lastApprovalHash.hash, lastApprovalHash.at, { amount: lastApprovalHash.amount, symbol: input.collateralSymbol }))
    }
    events.push(event("opened", hash, now, { amount: input.amount, symbol: input.borrowSymbol }))
    lastApprovalHash = null
    const loan: Loan = {
      id,
      contract: randomAddress(),
      status: "active",
      borrowSymbol: input.borrowSymbol,
      principal: round6(input.amount),
      outstanding: round6(input.amount),
      accrued: 0,
      lastAccrualAt: now,
      totalInterestPaid: 0,
      collateralSymbol: input.collateralSymbol,
      collateral: round6(input.collateral),
      withdrawable: 0,
      rateKind: input.rateKind,
      fixedApr: input.rateKind === "fixed" ? apr : null,
      discount,
      termDays: input.termDays,
      openedAt: now,
      dueAt: now + input.termDays * DAY_MS,
      closedAt: null,
      onTime: null,
      liquidation: null,
      events,
    }
    let next: DemoState = settle({ ...s, loans: [...s.loans, loan] }, now)
    next = addBalance(next, input.collateralSymbol, -input.collateral)
    next = addBalance(next, input.borrowSymbol, input.amount)
    return spendAllowance(next, input.collateralSymbol, input.collateral)
  })
  return id
}

/** Repay `amount` of the loan token, or everything when `amount` is "full". Interest is paid first. */
export function repay(loanId: string, amount: number | "full", hash: string) {
  const now = demoNow()
  update((raw) => {
    const s = settle(raw, now)
    const loan = findLoan(s, loanId)
    if (!loan || loan.status !== "active") return raw
    const owed = loan.outstanding + loan.accrued
    const full = amount === "full" || amount >= owed - 0.000001
    const pay = round6(full ? owed : amount)
    const interestPaid = round6(Math.min(pay, loan.accrued))
    const principalPaid = round6(Math.min(loan.outstanding, pay - interestPaid))
    const next = addBalance(s, loan.borrowSymbol, -pay)
    if (full) {
      const onTime = now <= loan.dueAt
      const closed = withLoan(withoutKeeper(next, loanId), {
        ...loan,
        status: "repaid",
        outstanding: 0,
        accrued: 0,
        totalInterestPaid: round6(loan.totalInterestPaid + interestPaid),
        withdrawable: loan.collateral,
        collateral: 0,
        closedAt: now,
        onTime,
        events: [...loan.events, event("repaidFull", hash, now, { amount: pay, symbol: loan.borrowSymbol, interestPaid, principalPaid })],
      })
      return { ...closed, borrower: { ...closed.borrower, onTimeRepayments: closed.borrower.onTimeRepayments + (onTime ? 1 : 0) } }
    }
    return withLoan(next, {
      ...loan,
      outstanding: round6(loan.outstanding - principalPaid),
      accrued: Math.max(0, loan.accrued - interestPaid),
      totalInterestPaid: round6(loan.totalInterestPaid + interestPaid),
      events: [...loan.events, event("repaid", hash, now, { amount: pay, symbol: loan.borrowSymbol, interestPaid, principalPaid })],
    })
  })
}

export function addCollateral(loanId: string, amount: number, hash: string) {
  const now = demoNow()
  update((raw) => {
    const s = settle(raw, now)
    const loan = findLoan(s, loanId)
    if (!loan || loan.status !== "active") return raw
    const next = spendAllowance(addBalance(s, loan.collateralSymbol, -amount), loan.collateralSymbol, amount)
    return withLoan(next, {
      ...loan,
      collateral: round6(loan.collateral + amount),
      events: [...loan.events, event("collateralAdded", hash, now, { amount, symbol: loan.collateralSymbol })],
    })
  })
  checkTerms()
}

export function withdrawCollateral(loanId: string, hash: string) {
  const now = demoNow()
  update((s) => {
    const loan = findLoan(s, loanId)
    if (!loan || loan.status === "active" || loan.withdrawable <= 0) return s
    const next = addBalance(s, loan.collateralSymbol, loan.withdrawable)
    return withLoan(next, {
      ...loan,
      withdrawable: 0,
      events: [...loan.events, event("withdrawn", hash, now, { amount: loan.withdrawable, symbol: loan.collateralSymbol })],
    })
  })
}

/** File a closed loan under history. */
export function archiveLoan(loanId: string) {
  update((s) => {
    const loan = findLoan(s, loanId)
    if (!loan || loan.status === "active") return s
    return withoutKeeper({ ...s, history: [loan, ...s.history], loans: s.loans.filter((l) => l.id !== loanId) }, loanId)
  })
}

/* ----------------------------------------------------------- demo helpers */

/** Load three loans already under way (see seed.ts). Only from an empty portfolio. */
export function loadExample() {
  const now = demoNow()
  update((s) => {
    if (s.loans.length > 0) return s
    const { loans, deltas } = exampleLoans(now, s.market, levelDiscount(borrowerLevel(s.borrower)))
    let next: DemoState = { ...s, loans, keepers: {} }
    for (const [symbol, delta] of Object.entries(deltas)) next = addBalance(next, symbol as TokenSymbol, delta)
    return next
  })
  checkTerms()
}

export function faucet() {
  update((s) => addBalance(addBalance(s, "tUSDC", 500), "tDAI", 500))
}

/** Change a reference price. While a slider is being dragged, pass `check = false` and call `checkTerms` on release. */
export function setPrice(symbol: TokenSymbol, price: number, check = true) {
  const now = demoNow()
  update((raw) => {
    const s = settle(raw, now)
    return { ...s, market: { ...s.market, prices: { ...s.market.prices, [symbol]: Math.max(0.01, Math.round(price * 100) / 100) } } }
  })
  if (check) checkTerms()
}

export function setHighDemand(highDemand: boolean) {
  const now = demoNow()
  update((raw) => {
    const s = settle(raw, now)
    return { ...s, market: { ...s.market, highDemand } }
  })
}

/** Move the demo clock forward. Interest accrues over the skipped days. */
export function skipDays(days: number) {
  update((s) => ({ ...s, settings: { ...s.settings, timeOffsetMs: s.settings.timeOffsetMs + days * DAY_MS } }))
  checkTerms()
}

/* ------------------------------------------------------------------ keeper */

const keeperTimers = new Map<string, ReturnType<typeof setTimeout>>()

/**
 * The contract's automatic enforcement, loan by loan: a loan below health
 * 1.00, or past its due date and grace period, is closed by a liquidator
 * transaction.
 */
export function checkTerms() {
  const s = getDemo()
  if (!s) return
  const now = demoNow()
  const found: Record<string, KeeperJob> = {}
  for (const loan of s.loans) {
    if (loan.status !== "active") continue
    if (s.keepers[loan.id]) {
      scheduleKeeper(loan.id)
      continue
    }
    const reason: LiquidationReason | null =
      positionOf(loan, s.market, now).health < 1 ? "price" : now > graceEndsAt(loan) ? "term" : null
    if (reason) found[loan.id] = { reason, hash: randomHash(), startedAt: Date.now() }
  }
  if (Object.keys(found).length === 0) return
  update((st) => ({ ...st, keepers: { ...st.keepers, ...found } }))
  for (const id of Object.keys(found)) scheduleKeeper(id)
}

function scheduleKeeper(loanId: string) {
  if (keeperTimers.has(loanId)) return
  keeperTimers.set(
    loanId,
    setTimeout(() => {
      keeperTimers.delete(loanId)
      applyLiquidation(loanId)
    }, blockTime() + 1200)
  )
}

function applyLiquidation(loanId: string) {
  const now = demoNow()
  update((raw) => {
    const keeper = raw.keepers[loanId]
    const current = findLoan(raw, loanId)
    if (!keeper || !current || current.status !== "active") return withoutKeeper(raw, loanId)
    const s = settle(raw, now)
    const loan = findLoan(s, loanId)!
    const owed = round6(loan.outstanding + loan.accrued)
    const price = s.market.prices[loan.collateralSymbol]
    const b = liquidationBreakdown(owed, s.market.prices[loan.borrowSymbol], loan.collateral, price)
    const next = withLoan(withoutKeeper(s, loanId), {
      ...loan,
      status: "liquidated",
      outstanding: 0,
      accrued: 0,
      collateral: 0,
      withdrawable: b.returned,
      closedAt: now,
      onTime: false,
      liquidation: { reason: keeper.reason, price, debtRepaid: owed, seized: b.seized, penalty: b.penalty, returned: b.returned, hash: keeper.hash },
      events: [...loan.events, event("liquidated", keeper.hash, now, { amount: b.seized, symbol: loan.collateralSymbol })],
    })
    return { ...next, borrower: { onTimeRepayments: 0, liquidations: s.borrower.liquidations + 1 } }
  })
}
