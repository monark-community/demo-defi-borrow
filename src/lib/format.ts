import { intlLocale, type Locale } from "@/i18n/config"
import type { TokenSymbol } from "@/lib/demo/types"

/** Sensible display precision per token (stablecoins to the cent, volatile assets finer). */
export const DISPLAY_DECIMALS: Record<TokenSymbol, number> = {
  tUSDC: 2,
  tDAI: 2,
  tETH: 4,
  tWBTC: 5,
  tLINK: 2,
}

export function formatNumber(n: number, locale: Locale, maxFrac = 2, minFrac = 0): string {
  return new Intl.NumberFormat(intlLocale[locale], { maximumFractionDigits: maxFrac, minimumFractionDigits: minFrac }).format(n)
}

/** "1,234.56 tUSDC" / "1 234,56 tUSDC". */
export function formatToken(amount: number, symbol: TokenSymbol, locale: Locale, maxFrac = DISPLAY_DECIMALS[symbol]): string {
  return `${formatNumber(amount, locale, maxFrac)} ${symbol}`
}

export function formatUsd(amount: number, locale: Locale, frac = 2): string {
  return new Intl.NumberFormat(intlLocale[locale], {
    style: "currency",
    currency: "USD",
    currencyDisplay: "narrowSymbol",
    maximumFractionDigits: frac,
    minimumFractionDigits: frac,
  }).format(amount)
}

/** APR and APY are always shown with 2 decimals (Monark DeFi family convention). */
export function formatApr(percent: number, locale: Locale): string {
  return new Intl.NumberFormat(intlLocale[locale], { style: "percent", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(percent / 100)
}

/** A fraction as a whole percent, rounded down so we never overstate a safety margin. */
export function formatDrop(fraction: number, locale: Locale): string {
  return new Intl.NumberFormat(intlLocale[locale], { style: "percent", maximumFractionDigits: 0 }).format(Math.floor(fraction * 100) / 100)
}

export function formatPercent(fraction: number, locale: Locale, maxFrac = 0): string {
  return new Intl.NumberFormat(intlLocale[locale], { style: "percent", maximumFractionDigits: maxFrac }).format(fraction)
}

export function formatHealth(health: number, locale: Locale): string {
  if (!Number.isFinite(health)) return "∞"
  return formatNumber(Math.floor(health * 100) / 100, locale, 2, 2)
}

export function formatDate(ms: number, locale: Locale): string {
  return new Intl.DateTimeFormat(intlLocale[locale], { dateStyle: "medium" }).format(new Date(ms))
}

export function formatDateTime(ms: number, locale: Locale): string {
  return new Intl.DateTimeFormat(intlLocale[locale], { dateStyle: "medium", timeStyle: "short" }).format(new Date(ms))
}

export function shortAddress(address: string): string {
  return address.length > 12 ? `${address.slice(0, 6)}…${address.slice(-4)}` : address
}
