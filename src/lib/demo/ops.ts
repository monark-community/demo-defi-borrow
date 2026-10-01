"use client"

/**
 * Every state change the demo can make. Transaction-backed operations are
 * called by the UI only once the simulated transaction confirms (see
 * chain.ts `useTx`), with the transaction hash. Market and clock changes
 * are demo-only controls; they re-check the loan's terms afterwards, which
 * is what an on-chain keeper would do.
 */

import { blockTime } from "./chain"
import { randomAddress, randomHash, randomId } from "./ids"
import { borrowerLevel, graceEndsAt, levelDiscount, liquidationBreakdown, loanApr, positionOf, quoteApr, interestFor } from "./loan-math"
import { demoNow, getDemo, update } from "./store"
import { exampleLoan } from "./seed"
import { DAY_MS, round6 } from "./tokens"
import type {
  CollateralSymbol,
  DemoState,
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

/** Move accrued interest into the stored loan, up to `now`. */
function settle(s: DemoState, now: number): DemoState {
  const loan = s.loan
  if (!loan || loan.status !== "active") return s
  const accrued = interestFor(loan.outstanding, loanApr(loan, s.market), now - loan.lastAccrualAt)
  return { ...s, loan: { ...loan, accrued: loan.accrued + accrued, lastAccrualAt: now } }
}

/* ----------------------------------------------------------- transactions */

/** The allowance confirmed just before opening a loan, recorded as the loan's first event. */
let lastApprovalHash: { symbol: CollateralSymbol; hash: string; at: number; amount: number } | null = null

export function approveCollateral(symbol: CollateralSymbol, amount: number, hash: string) {
  const now = demoNow()
  const active = getDemo()?.loan?.status === "active"
  update((s) => ({
    ...s,
    wallet: { ...s.wallet, allowances: { ...s.wallet.allowances, [symbol]: round6(amount) } },
    // With a loan open, the allowance goes straight into its log; otherwise it waits for the loan.
    loan:
      active && s.loan
        ? { ...s.loan, events: [...s.loan.events, event("approved", hash, now, { amount: round6(amount), symbol })] }
        : s.loan,
  }))
  lastApprovalHash = active ? null : { symbol, hash, at: now, amount }
}

export interface OpenLoanInput {
  borrowSymbol: LoanSymbol
  amount: number
  collateralSymbol: CollateralSymbol
  collateral: number
  rateKind: RateKind
  termDays: TermDays
}

export function openLoan(input: OpenLoanInput, hash: string) {
  const now = demoNow()
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
      id: randomId("loan"),
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
    let next: DemoState = { ...s, loan, keeper: null }
    next = addBalance(next, input.collateralSymbol, -input.collateral)
    next = addBalance(next, input.borrowSymbol, input.amount)
    next = {
      ...next,
      wallet: {
        ...next.wallet,
        allowances: {
          ...next.wallet.allowances,
          [input.collateralSymbol]: round6(Math.max(0, next.wallet.allowances[input.collateralSymbol] - input.collateral)),
        },
      },
    }
    return next
  })
}

/** Repay `amount` of the loan token, or everything when `amount` is "full". Interest is paid first. */
export function repay(amount: number | "full", hash: string) {
  const now = demoNow()
  update((raw) => {
    const s = settle(raw, now)
    const loan = s.loan
    if (!loan || loan.status !== "active") return raw
    const owed = loan.outstanding + loan.accrued
    const full = amount === "full" || amount >= owed - 0.000001
    const pay = round6(full ? owed : amount)
    const interestPaid = round6(Math.min(pay, loan.accrued))
    const principalPaid = round6(Math.min(loan.outstanding, pay - interestPaid))
    let next = addBalance(s, loan.borrowSymbol, -pay)
    if (full) {
      const onTime = now <= loan.dueAt
      next = {
        ...next,
        loan: {
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
        },
        borrower: { ...next.borrower, onTimeRepayments: next.borrower.onTimeRepayments + (onTime ? 1 : 0) },
        keeper: null,
      }
    } else {
      next = {
        ...next,
        loan: {
          ...loan,
          outstanding: round6(loan.outstanding - principalPaid),
          accrued: Math.max(0, loan.accrued - interestPaid),
          totalInterestPaid: round6(loan.totalInterestPaid + interestPaid),
          events: [...loan.events, event("repaid", hash, now, { amount: pay, symbol: loan.borrowSymbol, interestPaid, principalPaid })],
        },
      }
    }
    return next
  })
}

export function addCollateral(amount: number, hash: string) {
  const now = demoNow()
  update((raw) => {
    const s = settle(raw, now)
    const loan = s.loan
    if (!loan || loan.status !== "active") return raw
    let next = addBalance(s, loan.collateralSymbol, -amount)
    next = {
      ...next,
      wallet: {
        ...next.wallet,
        allowances: {
          ...next.wallet.allowances,
          [loan.collateralSymbol]: round6(Math.max(0, next.wallet.allowances[loan.collateralSymbol] - amount)),
        },
      },
      loan: {
        ...loan,
        collateral: round6(loan.collateral + amount),
        events: [...loan.events, event("collateralAdded", hash, now, { amount, symbol: loan.collateralSymbol })],
      },
    }
    return next
  })
  checkTerms()
}

export function withdrawCollateral(hash: string) {
  const now = demoNow()
  update((s) => {
    const loan = s.loan
    if (!loan || loan.status === "active" || loan.withdrawable <= 0) return s
    const next = addBalance(s, loan.collateralSymbol, loan.withdrawable)
    return {
      ...next,
      loan: {
        ...loan,
        withdrawable: 0,
        events: [...loan.events, event("withdrawn", hash, now, { amount: loan.withdrawable, symbol: loan.collateralSymbol })],
      },
    }
  })
}

/** File the closed loan under history so a new one can start. */
export function archiveLoan() {
  update((s) => {
    if (!s.loan || s.loan.status === "active") return s
    return { ...s, history: [s.loan, ...s.history], loan: null, keeper: null }
  })
}

/* ----------------------------------------------------------- demo helpers */

/** Load a loan that is already 41 days into its term. */
export function loadExample() {
  const now = demoNow()
  update((s) => {
    if (s.loan) return s
    const loan = exampleLoan(now, s.market, levelDiscount(borrowerLevel(s.borrower)))
    let next: DemoState = { ...s, loan, keeper: null }
    next = addBalance(next, "tETH", -1.2)
    next = addBalance(next, "tUSDC", 1600)
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

let keeperTimer: ReturnType<typeof setTimeout> | null = null

/**
 * The contract's automatic enforcement: a loan below health 1.00, or past
 * its due date and grace period, is closed by a liquidator transaction.
 */
export function checkTerms() {
  const s = getDemo()
  if (!s?.loan || s.loan.status !== "active") return
  if (s.keeper) {
    scheduleKeeper()
    return
  }
  const now = demoNow()
  const pos = positionOf(s.loan, s.market, now)
  let reason: LiquidationReason | null = null
  if (pos.health < 1) reason = "price"
  else if (now > graceEndsAt(s.loan)) reason = "term"
  if (!reason) return
  update((st) => ({ ...st, keeper: { reason: reason!, hash: randomHash(), startedAt: Date.now() } }))
  scheduleKeeper()
}

function scheduleKeeper() {
  if (keeperTimer) return
  keeperTimer = setTimeout(() => {
    keeperTimer = null
    applyLiquidation()
  }, blockTime() + 1200)
}

function applyLiquidation() {
  const now = demoNow()
  update((raw) => {
    if (!raw.keeper || !raw.loan || raw.loan.status !== "active") return { ...raw, keeper: null }
    const s = settle(raw, now)
    const loan = s.loan!
    const keeper = raw.keeper
    const owed = round6(loan.outstanding + loan.accrued)
    const price = s.market.prices[loan.collateralSymbol]
    const b = liquidationBreakdown(owed, s.market.prices[loan.borrowSymbol], loan.collateral, price)
    return {
      ...s,
      keeper: null,
      loan: {
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
      },
      borrower: { onTimeRepayments: 0, liquidations: s.borrower.liquidations + 1 },
    }
  })
}
