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
    version: 1,
    wallet: {
      status: "disconnected",
      address: seededAddress("borrowx-demo-wallet"),
      name: "Sam Rivera",
      lastError: null,
      balances: { ...START_BALANCES },
      allowances: Object.fromEntries(COLLATERALS.map((c) => [c, 0])) as DemoState["wallet"]["allowances"],
    },
    market: referenceMarket(),
    loan: null,
    keeper: null,
    history: [pastLoan(now)],
    borrower: { onTimeRepayments: 1, liquidations: 0 },
    settings: { slow: false, failNext: false, timeOffsetMs: 0 },
  }
}

/**
 * A loan already 41 days into a 90-day term, for visitors who want to see
 * tracking straight away: 2,000 tUSDC against 1.2 tETH, variable rate, with
 * one partial repayment of 400 tUSDC twelve days ago.
 */
export function exampleLoan(now: number, market: MarketState, discount: number): Loan {
  const openedAt = now - 41 * DAY_MS
  const paidAt = now - 12 * DAY_MS
  const apr = variableApr("tUSDC", market, discount)
  const firstInterest = round6(interestFor(2000, apr, paidAt - openedAt))
  const principalPaid = round6(400 - firstInterest)
  const outstanding = round6(2000 - principalPaid)
  return {
    id: "loan-example",
    contract: seededAddress("loan-example"),
    status: "active",
    borrowSymbol: "tUSDC",
    principal: 2000,
    outstanding,
    accrued: round6(interestFor(outstanding, apr, now - paidAt)),
    lastAccrualAt: now,
    totalInterestPaid: firstInterest,
    collateralSymbol: "tETH",
    collateral: 1.2,
    withdrawable: 0,
    rateKind: "variable",
    fixedApr: null,
    discount,
    termDays: 90,
    openedAt,
    dueAt: openedAt + 90 * DAY_MS,
    closedAt: null,
    onTime: null,
    liquidation: null,
    events: [
      { id: "e1", at: openedAt - 60_000, kind: "approved", hash: seededHash("e1"), amount: 1.2, symbol: "tETH" },
      { id: "e2", at: openedAt, kind: "opened", hash: seededHash("e2"), amount: 2000, symbol: "tUSDC" },
      {
        id: "e3",
        at: paidAt,
        kind: "repaid",
        hash: seededHash("e3"),
        amount: 400,
        symbol: "tUSDC",
        interestPaid: firstInterest,
        principalPaid,
      },
    ],
  }
}
