"use client"

import { useRef } from "react"
import { FastForwardIcon, RotateCcwIcon, TrendingDownIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { intlLocale } from "@/i18n/config"
import { t } from "@/i18n/t"
import { checkTerms, setHighDemand, setPrice, skipDays } from "@/lib/demo/ops"
import { useDemo, useDemoNow } from "@/lib/demo/store"
import { TOKENS } from "@/lib/demo/tokens"
import type { Loan } from "@/lib/demo/types"
import { formatDate, formatUsd } from "@/lib/format"

import { useAppCopy } from "./app-provider"

const PRESETS = [-0.1, -0.25, -0.4]

/** Demo-only market controls: the collateral price, pool demand and the clock. */
export function MarketPanel({ loan }: { loan: Loan }) {
  const demo = useDemo()
  const now = useDemoNow(1000)
  const { app, locale } = useAppCopy()
  const m = app.market
  const settle = useRef<number | undefined>(undefined)
  if (!demo) return null
  const symbol = loan.collateralSymbol
  const ref = TOKENS[symbol].usd
  const price = demo.market.prices[symbol]
  const busy = !!demo.keeper
  const step = ref >= 1000 ? 10 : 0.05

  return (
    <section aria-labelledby="market-title" className="scroll-mt-24 rounded-3xl border border-dashed border-input bg-secondary/40 p-5 sm:p-6">
      <h2 id="market-title" className="text-lg font-bold">
        {m.title}
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">{t(m.body, { token: symbol })}</p>

      <div className="mt-5">
        <div className="flex items-baseline justify-between gap-3">
          <Label htmlFor="price-slider" className="text-sm font-bold">
            {t(m.price, { token: symbol })}
          </Label>
          <output htmlFor="price-slider" className="tabular-nums text-lg font-bold ">
            {formatUsd(price, locale)}
          </output>
        </div>
        <Slider
          id="price-slider"
          className="mt-2"
          min={Math.round(ref * 0.3)}
          max={Math.round(ref * 1.3)}
          step={step}
          value={[price]}
          disabled={busy}
          aria-label={t(m.price, { token: symbol })}
          aria-valuetext={formatUsd(price, locale)}
          onValueChange={([v]) => {
            if (v === undefined) return
            setPrice(symbol, v, false)
            // Keyboard changes don't always "commit", so settle the terms once the value rests.
            window.clearTimeout(settle.current)
            settle.current = window.setTimeout(checkTerms, 450)
          }}
          onValueCommit={() => {
            window.clearTimeout(settle.current)
            checkTerms()
          }}
        />
        <p className="mt-1 text-xs text-muted-foreground">{t(m.reference, { price: formatUsd(ref, locale) })}</p>
        <div role="group" aria-label={m.presets} className="mt-3 flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <Button key={p} size="sm" variant="outline" disabled={busy} onClick={() => setPrice(symbol, ref * (1 + p))}>
              <TrendingDownIcon aria-hidden="true" />
              {new Intl.NumberFormat(intlLocale[locale], { style: "percent", signDisplay: "always" }).format(p)}
            </Button>
          ))}
          <Button size="sm" variant="ghost" disabled={busy || price === ref} onClick={() => setPrice(symbol, ref)}>
            <RotateCcwIcon aria-hidden="true" />
            {m.reset}
          </Button>
        </div>
      </div>

      <div className="mt-5 flex items-start justify-between gap-4 border-t border-dashed border-input pt-4">
        <div>
          <Label htmlFor="demand" className="text-sm font-bold">
            {m.demand}
          </Label>
          <p className="mt-1 text-xs text-muted-foreground">{loan.rateKind === "fixed" ? m.demandFixed : m.demandHint}</p>
        </div>
        <Switch id="demand" checked={demo.market.highDemand} disabled={busy} onCheckedChange={(v) => setHighDemand(v)} />
      </div>

      <div className="mt-4 border-t border-dashed border-input pt-4">
        <p className="text-sm font-bold">{m.skip}</p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <Button size="sm" variant="outline" disabled={busy} onClick={() => skipDays(7)}>
            <FastForwardIcon aria-hidden="true" />
            {m.skip7}
          </Button>
          <Button size="sm" variant="outline" disabled={busy} onClick={() => skipDays(30)}>
            <FastForwardIcon aria-hidden="true" />
            {m.skip30}
          </Button>
          <span className="text-xs text-muted-foreground">{t(m.clock, { date: formatDate(now, locale) })}</span>
        </div>
      </div>
      <p className="mt-4 text-xs text-muted-foreground">{m.oracle}</p>
    </section>
  )
}
