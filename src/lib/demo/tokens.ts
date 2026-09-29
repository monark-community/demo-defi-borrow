import type { CollateralParams, CollateralSymbol, LoanSymbol, TermDays, Token, TokenSymbol } from "./types"

/** Testnet tokens and reference prices shared with the Monark DeFi demos. */
export const TOKENS: Record<TokenSymbol, Token> = {
  tETH: { symbol: "tETH", decimals: 18, usd: 3200 },
  tWBTC: { symbol: "tWBTC", decimals: 8, usd: 64000 },
  tLINK: { symbol: "tLINK", decimals: 18, usd: 14.5 },
  tUSDC: { symbol: "tUSDC", decimals: 6, usd: 1 },
  tDAI: { symbol: "tDAI", decimals: 18, usd: 1 },
}

export const COLLATERALS: CollateralSymbol[] = ["tETH", "tWBTC", "tLINK"]
export const LOAN_TOKENS: LoanSymbol[] = ["tUSDC", "tDAI"]
export const TERMS: TermDays[] = [30, 90, 180]

/** Risk parameters per collateral. */
export const COLLATERAL_PARAMS: Record<CollateralSymbol, CollateralParams> = {
  tETH: { maxLtv: 0.75, liquidationThreshold: 0.82 },
  tWBTC: { maxLtv: 0.7, liquidationThreshold: 0.78 },
  tLINK: { maxLtv: 0.55, liquidationThreshold: 0.65 },
}

/** Variable APR (percent) in normal demand. */
export const BASE_VARIABLE_APR: Record<LoanSymbol, number> = { tUSDC: 5.4, tDAI: 5.1 }
/** Extra variable APR when the pool is in high demand. */
export const HIGH_DEMAND_PREMIUM = 2
/** A fixed rate costs this much more than today's variable rate. */
export const FIXED_PREMIUM = 1.25

export const LIQUIDATION_PENALTY = 0.05
export const GRACE_DAYS = 3
export const DAY_MS = 86_400_000

/** Health factor bands. */
export const SAFE_HEALTH = 1.5
/** Target used for "suggested" amounts (a little above the safe line). */
export const SUGGESTED_HEALTH = 1.75
/** Target used when suggesting how to get back to safe. */
export const RESCUE_HEALTH = 1.6

export const NETWORK_NAME = "Sepolia testnet"

/** Round to 6 decimals, the precision every stored amount uses. */
export function round6(n: number): number {
  return Math.round(n * 1e6) / 1e6
}

/** Whole-token number to base units (bigint string) for `token-amount`. */
export function toBase(amount: number, symbol: TokenSymbol): string {
  const { decimals } = TOKENS[symbol]
  const micro = BigInt(Math.round(amount * 1e6))
  return decimals >= 6 ? (micro * 10n ** BigInt(decimals - 6)).toString() : (micro / 10n ** BigInt(6 - decimals)).toString()
}

/** Parse a user-typed decimal ("1 250,5", "1250.50"). Returns null if invalid. */
export function parseAmount(input: string): number | null {
  const cleaned = input.replace(/[\s  _]/g, "").replace(",", ".")
  if (!cleaned) return null
  if (!/^\d+(\.\d{0,6})?$|^\.\d{1,6}$/.test(cleaned)) return null
  const n = Number(cleaned)
  return Number.isFinite(n) ? n : null
}
