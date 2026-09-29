"use client"

import { ClockIcon } from "lucide-react"
import { useEffect, useState } from "react"

import { Padlock } from "@/components/loan/padlock"
import { RiskBadge } from "@/components/loan/risk-badge"
import { SafetyRunway, type RunwayLabels } from "@/components/loan/safety-runway"
import type { Locale } from "@/i18n/config"
import { healthFactor, liquidationPrice, riskLevel } from "@/lib/demo/loan-math"
import { COLLATERAL_PARAMS } from "@/lib/demo/tokens"
import type { RiskLevel } from "@/lib/demo/types"
import { formatHealth, formatNumber } from "@/lib/format"

const DEBT = 2000
const COLLATERAL = 1.2
const REF = 3200
const { liquidationThreshold } = COLLATERAL_PARAMS.tETH

/**
 * The home hero: a live example loan. tETH drifts calmly around $3,200 and
 * the safety runway, health factor and sentence follow it. Motion stops
 * for visitors who prefer reduced motion.
 */
export function HeroLoanCard({
  locale,
  copy,
  runway,
  risk,
  healthLabel,
}: {
  locale: Locale
  copy: { label: string; title: string; borrowed: string; locked: string; price: string; due: string }
  runway: RunwayLabels
  risk: Record<RiskLevel, string>
  healthLabel: string
}) {
  const [price, setPrice] = useState(REF)

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    let tick = 0
    const id = window.setInterval(() => {
      tick += 1
      // A slow swell with a little noise: ±6% around the reference price.
      const swell = Math.sin(tick / 2.2) * 0.05 + (Math.random() - 0.5) * 0.02
      setPrice(Math.round(REF * (1 + swell) * 100) / 100)
    }, 1600)
    return () => window.clearInterval(id)
  }, [])

  const liq = liquidationPrice(DEBT, COLLATERAL, liquidationThreshold)
  const health = healthFactor(price * COLLATERAL, liquidationThreshold, DEBT)
  const level = riskLevel(health)

  return (
    <div className="relative rounded-3xl border bg-card p-5 sm:p-7" role="group" aria-label={copy.label}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="eyebrow text-muted-foreground">{copy.label}</p>
          <p className="mt-1.5 text-xl font-extrabold tracking-tight sm:text-2xl">{copy.title}</p>
        </div>
        <Padlock locked className="h-12 w-10 shrink-0" />
      </div>

      <dl className="mt-5 grid grid-cols-3 gap-3 border-y py-4 text-sm">
        <div>
          <dt className="text-xs text-muted-foreground">{copy.borrowed}</dt>
          <dd className="mt-0.5 font-mono font-bold">{formatNumber(DEBT, locale)} <span className="font-sans text-xs text-muted-foreground">tUSDC</span></dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">{copy.locked}</dt>
          <dd className="mt-0.5 font-mono font-bold">{formatNumber(COLLATERAL, locale, 1)} <span className="font-sans text-xs text-muted-foreground">tETH</span></dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">{healthLabel}</dt>
          <dd className="mt-0.5 font-mono font-bold tabular-nums">{formatHealth(health, locale)}</dd>
        </div>
      </dl>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        <RiskBadge risk={level} label={risk[level]} />
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
          <ClockIcon className="size-3.5" aria-hidden="true" />
          {copy.due}
        </span>
      </div>

      <SafetyRunway className="mt-3" symbol="tETH" price={price} liqPrice={liq} locale={locale} labels={runway} scaleMax={REF * 1.3} live={false} />
    </div>
  )
}
