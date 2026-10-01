/**
 * Views across all of the borrower's loans: totals for the overview, the
 * loan that needs attention first, and collateral locked per token. Pure,
 * like loan-math.
 */
import { positionOf, type Position } from "./loan-math"
import { COLLATERALS } from "./tokens"
import type { CollateralSymbol, DemoState, Loan } from "./types"

export interface LoanView {
  loan: Loan
  pos: Position
}

export interface Portfolio {
  /** Open loans in a stable order (oldest first), so cards don't jump while a price moves. */
  open: LoanView[]
  /** Closed loans still waiting to be withdrawn or filed under history. */
  closed: Loan[]
  owedUsd: number
  collateralUsd: number
  /** The open loan with the lowest health factor. */
  weakest: LoanView | null
  /** The open loan due soonest. */
  nextDue: LoanView | null
}

export function portfolioOf(demo: DemoState, now: number): Portfolio {
  const open = demo.loans
    .filter((l) => l.status === "active")
    .map((loan) => ({ loan, pos: positionOf(loan, demo.market, now) }))
    .sort((a, b) => a.loan.openedAt - b.loan.openedAt)
  const weakest = open.reduce<LoanView | null>((w, v) => (!w || v.pos.health < w.pos.health ? v : w), null)
  const nextDue = open.reduce<LoanView | null>((n, v) => (!n || v.loan.dueAt < n.loan.dueAt ? v : n), null)
  return {
    open,
    closed: demo.loans.filter((l) => l.status !== "active"),
    owedUsd: open.reduce((sum, v) => sum + v.pos.debtUsd, 0),
    collateralUsd: open.reduce((sum, v) => sum + v.pos.collateralUsd, 0),
    weakest,
    nextDue,
  }
}

/** Collateral locked in open loans, per token. */
export function lockedBySymbol(loans: Loan[]): Record<CollateralSymbol, number> {
  const locked = Object.fromEntries(COLLATERALS.map((c) => [c, 0])) as Record<CollateralSymbol, number>
  for (const l of loans) if (l.status === "active") locked[l.collateralSymbol] += l.collateral
  return locked
}

/** Open loans backed by `symbol`: the ones a move in its price touches. */
export function loansBackedBy(loans: Loan[], symbol: CollateralSymbol): Loan[] {
  return loans.filter((l) => l.status === "active" && l.collateralSymbol === symbol)
}
