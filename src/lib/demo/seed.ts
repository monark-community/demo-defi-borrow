import { seededAddress, seededHash } from "./ids"
import { interestFor, variableApr } from "./loan-math"
import { COLLATERALS, DAY_MS, FIXED_PREMIUM, TOKENS, round6 } from "./tokens"
import type { DemoState, Loan, MarketState, TokenSymbol } from "./types"

/** The demo wallet's starting balances. */
export const START_BALANCES: Record<TokenSymbol, number> = {
  tETH: 3.5,
  tWBTC: 0.12,
  tLINK: 800,
  tUSDC: 240,
  tDAI: 60,
}

export function referenceMarket(): MarketState {
  return {
    prices: Object.fromEntries(Object.values(TOKENS).map((t) => [t.symbol, t.usd])) as Record<TokenSymbol, number>,
    highDemand: false,
  }
}

/** A past loan, repaid on time: 900 tDAI against 0.6 tETH for 30 days at a fixed rate. */
function pastLoan(now: number): Loan {
  const openedAt = now - 88 * DAY_MS
  const repaidAt = openedAt + 27 * DAY_MS
  const apr = 5.1 + FIXED_PREMIUM
  const interest = round6(interestFor(900, apr, repaidAt - openedAt))
  return {
    id: "loan-2026-07",
    contract: seededAddress("loan-2026-07"),
    status: "repaid",
    borrowSymbol: "tDAI",
    principal: 900,
    outstanding: 0,
    accrued: 0,
    lastAccrualAt: repaidAt,
    totalInterestPaid: interest,
    collateralSymbol: "tETH",
    collateral: 0,
    withdrawable: 0,
    rateKind: "fixed",
    fixedApr: apr,
    discount: 0,
    termDays: 30,
    openedAt,
    dueAt: openedAt + 30 * DAY_MS,
    closedAt: repaidAt,
    onTime: true,
    liquidation: null,
    events: [
      { id: "p1", at: openedAt - 90_000, kind: "approved", hash: seededHash("p1"), amount: 0.6, symbol: "tETH" },
      { id: "p2", at: openedAt, kind: "opened", hash: seededHash("p2"), amount: 900, symbol: "tDAI" },
      {
        id: "p3",
        at: repaidAt,
        kind: "repaidFull",
        hash: seededHash("p3"),
        amount: round6(900 + interest),
        symbol: "tDAI",
        interestPaid: interest,
        principalPaid: 900,
      },
      { id: "p4", at: repaidAt + 120_000, kind: "withdrawn", hash: seededHash("p4"), amount: 0.6, symbol: "tETH" },
    ],
  }
}

export function createSeed(now: number): DemoState {
  return {
    version: 2,
    wallet: {
      status: "disconnected",
      address: seededAddress("borrowx-demo-wallet"),
      name: "Sam Rivera",
      lastError: null,
      balances: { ...START_BALANCES },
      allowances: Object.fromEntries(COLLATERALS.map((c) => [c, 0])) as DemoState["wallet"]["allowances"],
    },
    market: referenceMarket(),
    loans: [],
    keepers: {},
    history: [pastLoan(now)],
    borrower: { onTimeRepayments: 1, liquidations: 0 },
    settings: { slow: false, failNext: false, timeOffsetMs: 0 },
  }
}

interface ExampleSpec {
  id: string
  borrowSymbol: Loan["borrowSymbol"]
  principal: number
  collateralSymbol: Loan["collateralSymbol"]
  collateral: number
  rateKind: Loan["rateKind"]
  termDays: Loan["termDays"]
  /** Days since the loan opened. */
  ageDays: number
  /** An optional partial repayment, `daysAgo` before now. */
  payment?: { amount: number; daysAgo: number }
}

/**
 * Three loans already running, so the overview has something to compare:
 * - a comfortable tETH loan 41 days into 90, with one partial repayment;
 * - a tLINK loan opened close to its limit, already At risk at today's price;
 * - a small tETH loan due in 3 days. It shares its collateral with the
 *   first, so one tETH price move shifts both.
 */
const EXAMPLES: ExampleSpec[] = [
  {
    id: "loan-example",
    borrowSymbol: "tUSDC",
    principal: 2000,
    collateralSymbol: "tETH",
    collateral: 1.2,
    rateKind: "variable",
    termDays: 90,
    ageDays: 41,
    payment: { amount: 400, daysAgo: 12 },
  },
  { id: "loan-example-link", borrowSymbol: "tDAI", principal: 1500, collateralSymbol: "tLINK", collateral: 220, rateKind: "fixed", termDays: 90, ageDays: 12 },
  { id: "loan-example-due", borrowSymbol: "tDAI", principal: 800, collateralSymbol: "tETH", collateral: 0.6, rateKind: "fixed", termDays: 30, ageDays: 27 },
]

/** Loan ids that exist in a fresh demo (the past loan and the examples), prerendered at build time. */
export const SEEDED_LOAN_IDS = ["loan-2026-07", ...EXAMPLES.map((e) => e.id)]

function exampleLoan(spec: ExampleSpec, now: number, market: MarketState, discount: number): Loan {
  const openedAt = now - spec.ageDays * DAY_MS
  const fixed = spec.rateKind === "fixed"
  const apr = variableApr(spec.borrowSymbol, market, discount) + (fixed ? FIXED_PREMIUM : 0)
  const events: Loan["events"] = [
    { id: `${spec.id}-a`, at: openedAt - 60_000, kind: "approved", hash: seededHash(`${spec.id}-a`), amount: spec.collateral, symbol: spec.collateralSymbol },
    { id: `${spec.id}-o`, at: openedAt, kind: "opened", hash: seededHash(`${spec.id}-o`), amount: spec.principal, symbol: spec.borrowSymbol },
  ]
  let outstanding = spec.principal
  let interestPaid = 0
  let since = openedAt
  if (spec.payment) {
    const paidAt = now - spec.payment.daysAgo * DAY_MS
    interestPaid = round6(interestFor(spec.principal, apr, paidAt - openedAt))
    const principalPaid = round6(spec.payment.amount - interestPaid)
    outstanding = round6(spec.principal - principalPaid)
    since = paidAt
    events.push({
      id: `${spec.id}-r`,
      at: paidAt,
      kind: "repaid",
      hash: seededHash(`${spec.id}-r`),
      amount: spec.payment.amount,
      symbol: spec.borrowSymbol,
      interestPaid,
      principalPaid,
    })
  }
  return {
    id: spec.id,
    contract: seededAddress(spec.id),
    status: "active",
    borrowSymbol: spec.borrowSymbol,
    principal: spec.principal,
    outstanding,
    accrued: round6(interestFor(outstanding, apr, now - since)),
    lastAccrualAt: now,
    totalInterestPaid: interestPaid,
    collateralSymbol: spec.collateralSymbol,
    collateral: spec.collateral,
    withdrawable: 0,
    rateKind: spec.rateKind,
    fixedApr: fixed ? apr : null,
    discount,
    termDays: spec.termDays,
    openedAt,
    dueAt: openedAt + spec.termDays * DAY_MS,
    closedAt: null,
    onTime: null,
    liquidation: null,
    events,
  }
}

/** The example loans, and what they did to the wallet (collateral out, loan tokens in, minus repayments). */
export function exampleLoans(now: number, market: MarketState, discount: number) {
  const loans = EXAMPLES.map((spec) => exampleLoan(spec, now, market, discount))
  const deltas: Partial<Record<TokenSymbol, number>> = {}
  for (const spec of EXAMPLES) {
    deltas[spec.collateralSymbol] = (deltas[spec.collateralSymbol] ?? 0) - spec.collateral
    deltas[spec.borrowSymbol] = (deltas[spec.borrowSymbol] ?? 0) + spec.principal - (spec.payment?.amount ?? 0)
  }
  return { loans, deltas }
}
