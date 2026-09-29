/**
 * Pure loan maths, shared by the demo, the marketing pages and the wizard.
 * No state, no side effects: everything here is easy to test and to port
 * to Solidity-style fixed-point maths.
 */
import {
  BASE_VARIABLE_APR,
  COLLATERAL_PARAMS,
  DAY_MS,
  FIXED_PREMIUM,
  GRACE_DAYS,
  HIGH_DEMAND_PREMIUM,
  LIQUIDATION_PENALTY,
  SAFE_HEALTH,
  round6,
} from "./tokens"
import type { BorrowerRecord, CollateralSymbol, Loan, LoanSymbol, MarketState, RateKind, RiskLevel } from "./types"

const YEAR_MS = 365 * DAY_MS

/* ---------------------------------------------------------------- levels */

export type BorrowerLevel = "new" | "steady" | "trusted"

export function borrowerLevel(record: BorrowerRecord): BorrowerLevel {
  if (record.onTimeRepayments >= 3) return "trusted"
  if (record.onTimeRepayments >= 1) return "steady"
  return "new"
}

/** APR discount in percentage points for a level. */
export function levelDiscount(level: BorrowerLevel): number {
  return level === "trusted" ? 0.5 : level === "steady" ? 0.25 : 0
}

/** Extra max-LTV (fraction) for a level. */
export function levelLtvBonus(level: BorrowerLevel): number {
  return level === "trusted" ? 0.05 : 0
}

/* ----------------------------------------------------------------- rates */

export function variableApr(symbol: LoanSymbol, market: MarketState, discount = 0): number {
  return BASE_VARIABLE_APR[symbol] + (market.highDemand ? HIGH_DEMAND_PREMIUM : 0) - discount
}

/** The APR a new loan would get today. */
export function quoteApr(symbol: LoanSymbol, kind: RateKind, market: MarketState, discount: number): number {
  const v = variableApr(symbol, market, discount)
  return kind === "fixed" ? v + FIXED_PREMIUM : v
}

/** The APR currently charged on an open loan. */
export function loanApr(loan: Loan, market: MarketState): number {
  return loan.rateKind === "fixed" && loan.fixedApr !== null ? loan.fixedApr : variableApr(loan.borrowSymbol, market, loan.discount)
}

/** Simple interest on `principal` over `ms` at `apr` percent. */
export function interestFor(principal: number, apr: number, ms: number): number {
  if (ms <= 0 || principal <= 0) return 0
  return (principal * (apr / 100) * ms) / YEAR_MS
}

/** Interest accrued since the last settlement, not yet stored. */
export function pendingInterest(loan: Loan, market: MarketState, now: number): number {
  if (loan.status !== "active") return 0
  return interestFor(loan.outstanding, loanApr(loan, market), now - loan.lastAccrualAt)
}

/** Everything owed right now: principal + accrued interest (unrounded, for live display). */
export function owedNow(loan: Loan, market: MarketState, now: number): number {
  if (loan.status !== "active") return 0
  return loan.outstanding + loan.accrued + pendingInterest(loan, market, now)
}

/** Interest a new loan would cost if held to the due date. */
export function projectedInterest(amount: number, apr: number, termDays: number): number {
  return interestFor(amount, apr, termDays * DAY_MS)
}

/* ---------------------------------------------------------------- health */

export function collateralValue(symbol: CollateralSymbol, amount: number, market: MarketState): number {
  return amount * market.prices[symbol]
}

/** Health factor: collateral value × liquidation threshold ÷ debt. Infinity with no debt. */
export function healthFactor(collateralUsd: number, threshold: number, debtUsd: number): number {
  if (debtUsd <= 0) return Number.POSITIVE_INFINITY
  return (collateralUsd * threshold) / debtUsd
}

export function riskLevel(health: number): RiskLevel {
  if (health >= SAFE_HEALTH) return "safe"
  if (health >= 1) return "atRisk"
  return "liquidatable"
}

/** Collateral price at which health reaches 1.00. */
export function liquidationPrice(debtUsd: number, collateralAmount: number, threshold: number): number {
  if (collateralAmount <= 0) return Number.POSITIVE_INFINITY
  return debtUsd / (collateralAmount * threshold)
}

/** Collateral price at which health falls to the safe line (1.50). */
export function atRiskPrice(debtUsd: number, collateralAmount: number, threshold: number): number {
  return liquidationPrice(debtUsd, collateralAmount, threshold) * SAFE_HEALTH
}

/** How far (fraction) the collateral price can fall before liquidation. 0 when already liquidatable. */
export function dropToLiquidation(price: number, liqPrice: number): number {
  if (!Number.isFinite(liqPrice)) return 1
  return Math.max(0, 1 - liqPrice / price)
}

export interface Position {
  owed: number
  debtUsd: number
  collateralUsd: number
  health: number
  risk: RiskLevel
  liqPrice: number
  atRiskPrice: number
  drop: number
  apr: number
  ltv: number
}

/** A full snapshot of an active loan at `now`. */
export function positionOf(loan: Loan, market: MarketState, now: number): Position {
  const owed = owedNow(loan, market, now)
  const debtUsd = owed * market.prices[loan.borrowSymbol]
  const { liquidationThreshold } = COLLATERAL_PARAMS[loan.collateralSymbol]
  const collateralUsd = collateralValue(loan.collateralSymbol, loan.collateral, market)
  const health = healthFactor(collateralUsd, liquidationThreshold, debtUsd)
  const liqPrice = liquidationPrice(debtUsd, loan.collateral, liquidationThreshold)
  return {
    owed,
    debtUsd,
    collateralUsd,
    health,
    risk: riskLevel(health),
    liqPrice,
    atRiskPrice: liqPrice * SAFE_HEALTH,
    drop: dropToLiquidation(market.prices[loan.collateralSymbol], liqPrice),
    apr: loanApr(loan, market),
    ltv: collateralUsd > 0 ? debtUsd / collateralUsd : 0,
  }
}

/** Collateral needed so that `debtUsd` sits at `targetHealth`. */
export function collateralFor(debtUsd: number, symbol: CollateralSymbol, market: MarketState, targetHealth: number): number {
  const { liquidationThreshold } = COLLATERAL_PARAMS[symbol]
  return (debtUsd * targetHealth) / (liquidationThreshold * market.prices[symbol])
}

/** How to get an at-risk loan back to `targetHealth`: add collateral, or repay. */
export function rescueOptions(loan: Loan, market: MarketState, now: number, targetHealth: number) {
  const p = positionOf(loan, market, now)
  const { liquidationThreshold } = COLLATERAL_PARAMS[loan.collateralSymbol]
  const needCollateral = Math.max(0, collateralFor(p.debtUsd, loan.collateralSymbol, market, targetHealth) - loan.collateral)
  const maxDebtUsd = (p.collateralUsd * liquidationThreshold) / targetHealth
  const repay = Math.max(0, (p.debtUsd - maxDebtUsd) / market.prices[loan.borrowSymbol])
  return { addCollateral: ceil6(needCollateral), repay: ceil2(repay) }
}

/* ----------------------------------------------------------- liquidation */

/** What a liquidation at `price` would do to a debt of `owed` against `collateral`. */
export function liquidationBreakdown(owed: number, loanPrice: number, collateral: number, price: number) {
  const debtUsd = owed * loanPrice
  const wanted = (debtUsd * (1 + LIQUIDATION_PENALTY)) / price
  const seized = round6(Math.min(collateral, wanted))
  const penalty = round6(Math.min(seized, (debtUsd * LIQUIDATION_PENALTY) / price))
  return { seized, penalty, returned: round6(Math.max(0, collateral - seized)) }
}

/* ----------------------------------------------------------------- terms */

export function graceEndsAt(loan: Loan): number {
  return loan.dueAt + GRACE_DAYS * DAY_MS
}

export function daysBetween(from: number, to: number): number {
  return Math.ceil((to - from) / DAY_MS)
}

/* --------------------------------------------------------------- helpers */

export function ceil6(n: number): number {
  return Math.ceil(n * 1e6 - 1e-6) / 1e6
}

export function ceil2(n: number): number {
  return Math.ceil(n * 100 - 1e-6) / 100
}
