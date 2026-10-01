/**
 * Domain types for the BorrowX demo. Everything the UI knows about the
 * wallet, the market and the borrower's loans go through these shapes, so
 * the simulated layer in this folder could be replaced by wagmi/viem calls
 * (and a real oracle) without touching UI code.
 *
 * Token amounts are plain numbers in whole-token units, always rounded to
 * 6 decimals by the operations (see `round6`). They are converted to base
 * units only for display through the registry's `token-amount` component.
 * Times are epoch milliseconds on the *demo clock* (real time plus the
 * visitor's "skip ahead" offset).
 */

export type CollateralSymbol = "tETH" | "tWBTC" | "tLINK"
export type LoanSymbol = "tUSDC" | "tDAI"
export type TokenSymbol = CollateralSymbol | LoanSymbol

export interface Token {
  symbol: TokenSymbol
  decimals: number
  /** Reference price in USD shared by the Monark DeFi demos. */
  usd: number
}

export interface CollateralParams {
  /** Largest loan-to-value you can open a loan at (0.75 = 75%). */
  maxLtv: number
  /** Loan-to-value at which the position can be liquidated. */
  liquidationThreshold: number
}

export type RateKind = "fixed" | "variable"
export type TermDays = 30 | 90 | 180
export type RiskLevel = "safe" | "atRisk" | "liquidatable"
export type LoanStatus = "active" | "repaid" | "liquidated"
export type LiquidationReason = "price" | "term"

export type LoanEventKind =
  | "approved"
  | "opened"
  | "repaid"
  | "repaidFull"
  | "collateralAdded"
  | "withdrawn"
  | "liquidated"

export interface LoanEvent {
  id: string
  /** Demo-clock time. */
  at: number
  kind: LoanEventKind
  hash: string
  amount?: number
  symbol?: TokenSymbol
  /** For repayments: how the payment was split. */
  interestPaid?: number
  principalPaid?: number
}

export interface LiquidationSummary {
  reason: LiquidationReason
  /** Collateral price at liquidation (USD). */
  price: number
  /** Debt the liquidator repaid, in the loan token. */
  debtRepaid: number
  /** Collateral the liquidator received (includes the penalty). */
  seized: number
  /** Part of `seized` that is the 5% penalty. */
  penalty: number
  /** Collateral left for the borrower. */
  returned: number
  hash: string
}

export interface Loan {
  id: string
  /** Simulated loan contract address. */
  contract: string
  status: LoanStatus
  borrowSymbol: LoanSymbol
  /** Amount borrowed when the loan opened. */
  principal: number
  /** Principal still owed. */
  outstanding: number
  /** Interest accrued up to `lastAccrualAt` and not yet paid. */
  accrued: number
  lastAccrualAt: number
  totalInterestPaid: number
  collateralSymbol: CollateralSymbol
  /** Collateral locked in the contract. */
  collateral: number
  /** Collateral unlocked and waiting to be withdrawn. */
  withdrawable: number
  rateKind: RateKind
  /** APR (percent) locked at opening for fixed loans. */
  fixedApr: number | null
  /** Borrower-level discount (percentage points) granted at opening. */
  discount: number
  termDays: TermDays
  openedAt: number
  dueAt: number
  closedAt: number | null
  /** True when fully repaid on or before the due date. */
  onTime: boolean | null
  liquidation: LiquidationSummary | null
  events: LoanEvent[]
}

export type WalletStatus = "disconnected" | "connecting" | "connected"

export interface WalletState {
  status: WalletStatus
  address: string
  name: string
  lastError: "rejected" | null
  balances: Record<TokenSymbol, number>
  /** ERC-20 allowances granted to the BorrowX contract. */
  allowances: Record<CollateralSymbol, number>
}

export interface MarketState {
  prices: Record<TokenSymbol, number>
  /** High demand in the pool pushes variable rates up. */
  highDemand: boolean
}

export interface KeeperJob {
  reason: LiquidationReason
  hash: string
  startedAt: number
}

export interface BorrowerRecord {
  onTimeRepayments: number
  liquidations: number
}

export interface DemoSettings {
  slow: boolean
  failNext: boolean
  /** Added to real time to get the demo clock (skip ahead). */
  timeOffsetMs: number
}

export interface DemoState {
  version: 2
  wallet: WalletState
  market: MarketState
  /** Open loans, plus closed ones not yet filed under history. Oldest first. */
  loans: Loan[]
  /** Pending automatic liquidations, by loan id. */
  keepers: Record<string, KeeperJob>
  /** Archived loans, newest first. */
  history: Loan[]
  borrower: BorrowerRecord
  settings: DemoSettings
}

/** Lifecycle of one simulated transaction, as the UI sees it. */
export type TxPhase = "idle" | "signing" | "pending" | "confirmed" | "failed"
export type TxError = "rejected" | "reverted"

export interface TxState {
  phase: TxPhase
  hash?: string
  error?: TxError
}

export interface TxSummary {
  /** Short title, e.g. "Repay 500 tUSDC". */
  title: string
  rows?: { label: string; value: string }[]
  /** Transactions that move value show the testnet disclaimer. */
  movesValue: boolean
  /** Off-chain signature (sign-in): no network fee row. */
  noFee?: boolean
}
