"use client"

import { TokenAmount } from "@/components/ui/token-amount"
import { intlLocale } from "@/i18n/config"
import { TOKENS, toBase } from "@/lib/demo/tokens"
import type { TokenSymbol } from "@/lib/demo/types"
import { DISPLAY_DECIMALS } from "@/lib/format"

import { useAppCopy } from "./app-provider"

/** Every token amount in the app goes through the registry's `token-amount` (DeFi family convention). */
export function Amount({
  value,
  symbol,
  usd,
  digits,
  className,
}: {
  value: number
  symbol: TokenSymbol
  /** Show the USD value underneath, at the current price. */
  usd?: number
  digits?: number
  className?: string
}) {
  const { locale } = useAppCopy()
  return (
    <TokenAmount
      value={toBase(value, symbol)}
      decimals={TOKENS[symbol].decimals}
      symbol={symbol}
      fractionDigits={digits ?? DISPLAY_DECIMALS[symbol]}
      locale={intlLocale[locale]}
      usdValue={usd}
      className={className}
    />
  )
}
