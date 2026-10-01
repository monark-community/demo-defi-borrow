"use client"

import { useRef, useState } from "react"
import { ChevronDownIcon, FastForwardIcon, RotateCcwIcon, SlidersHorizontalIcon, TrendingDownIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { InfoTip } from "@/components/ui/info-tip"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { intlLocale } from "@/i18n/config"
import { t } from "@/i18n/t"
import { checkTerms, setHighDemand, setPrice, skipDays } from "@/lib/demo/ops"
import { loansBackedBy } from "@/lib/demo/portfolio"
import { useDemo, useDemoNow } from "@/lib/demo/store"
import { COLLATERALS, TOKENS } from "@/lib/demo/tokens"
import type { CollateralSymbol } from "@/lib/demo/types"
import { formatDate, formatUsd } from "@/lib/format"
import { cn } from "@/lib/utils"

import { useAppCopy } from "./app-provider"

const PRESETS = [-0.1, -0.25, -0.4]

/** Open or closed survives moving between the overview and a loan (per page load). */
let rememberedOpen = false

/**
 * Demo-only market controls, kept out of the loan's way: a one-line strip
 * with the collateral prices and the demo date, which opens in place into
 * the simulator (price, pool demand, clock). Opening it in place, right
 * above the loans, keeps the runways in view while the price moves.
 */
export function MarketStrip({ focus }: { focus?: CollateralSymbol }) {
  const demo = useDemo()
  const now = useDemoNow(1000)
  const { app, locale } = useAppCopy()
  const m = app.market
  const [open, setOpenState] = useState(rememberedOpen)
  const [chosen, setChosen] = useState<CollateralSymbol | undefined>(undefined)
  const settle = useRef<number | undefined>(undefined)
  if (!demo) return null

  const setOpen = (o: boolean) => {
    rememberedOpen = o
    setOpenState(o)
  }
  const symbol = chosen ?? focus ?? "tETH"
  const ref = TOKENS[symbol].usd
  const price = demo.market.prices[symbol]
  const busy = Object.keys(demo.keepers).length > 0
  const step = ref >= 1000 ? 10 : 0.05
  const touched = loansBackedBy(demo.loans, symbol).length
  const pct = (p: number) => new Intl.NumberFormat(intlLocale[locale], { style: "percent", signDisplay: "always", maximumFractionDigits: 0 }).format(p)

  return (
    <section aria-label={m.strip} className="rounded-2xl border bg-card">
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 px-4 py-2.5 sm:px-5">
        <ul className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm">
          {COLLATERALS.map((sym) => {
            const change = demo.market.prices[sym] / TOKENS[sym].usd - 1
            return (
              <li key={sym} className="inline-flex items-baseline gap-1.5">
                <span className="font-bold">{sym}</span>
                <span className="tabular-nums">{formatUsd(demo.market.prices[sym], locale)}</span>
                {Math.abs(change) >= 0.005 ? (
                  <span className={cn("text-xs font-bold tabular-nums", change < 0 ? "text-destructive" : "text-success")}>{pct(change)}</span>
                ) : null}
              </li>
            )
          })}
          <li className="text-xs text-muted-foreground">{t(m.clock, { date: formatDate(now, locale) })}</li>
        </ul>
        <Button
          variant="ghost"
          size="sm"
          className="-mr-2 ml-auto"
          aria-expanded={open}
          aria-controls="market-sim"
          onClick={() => setOpen(!open)}
        >
          <SlidersHorizontalIcon aria-hidden="true" />
          {open ? m.hide : m.title}
          <ChevronDownIcon aria-hidden="true" className={cn("transition-transform duration-200", open && "rotate-180")} />
        </Button>
      </div>

      {open ? (
        <div id="market-sim" className="grid gap-6 border-t border-dashed border-input px-4 py-5 sm:px-5 md:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] md:gap-10">
          <div>
            <div className="-my-1 flex items-center justify-between gap-2">
              <p id="sim-token" className="text-sm font-bold">
                {m.token}
              </p>
              <InfoTip label={app.info}>{m.body}</InfoTip>
            </div>
            <div role="radiogroup" aria-labelledby="sim-token" className="mt-2 inline-flex rounded-full border p-0.5">
              {COLLATERALS.map((sym) => (
                <button
                  key={sym}
                  type="button"
                  role="radio"
                  aria-checked={sym === symbol}
                  onClick={() => setChosen(sym)}
                  className={cn(
                    "min-h-9 rounded-full px-3.5 text-sm font-bold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                    sym === symbol ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {sym}
                </button>
              ))}
            </div>

            <div className="mt-4 flex items-baseline justify-between gap-3">
              <Label htmlFor="price-slider" className="text-sm font-bold">
                {t(m.price, { token: symbol })}
              </Label>
              <output htmlFor="price-slider" className="text-lg font-bold tabular-nums">
                {formatUsd(price, locale)}
              </output>
            </div>
            <Slider
              id="price-slider"
              className="mt-2"
              min={Math.round(ref * 0.3 * 100) / 100}
              max={Math.round(ref * 1.3 * 100) / 100}
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
            <div role="group" aria-label={m.presets} className="mt-3 flex flex-wrap gap-2">
              {PRESETS.map((p) => (
                <Button key={p} size="sm" variant="outline" disabled={busy} onClick={() => setPrice(symbol, ref * (1 + p))}>
                  <TrendingDownIcon aria-hidden="true" />
                  {pct(p)}
                </Button>
              ))}
              <Button size="sm" variant="ghost" disabled={busy || price === ref} onClick={() => setPrice(symbol, ref)}>
                <RotateCcwIcon aria-hidden="true" />
                {m.reset}
              </Button>
            </div>
            <p className="mt-3 text-xs text-muted-foreground" aria-live="polite">
              {touched === 0 ? t(m.affectsNone, { token: symbol }) : touched === 1 ? m.affectsOne : t(m.affectsMany, { n: touched })}
            </p>
          </div>

          <div className="flex flex-col gap-5 md:border-l md:border-dashed md:border-input md:pl-10">
            <div className="flex items-start justify-between gap-4">
              <div>
                <Label htmlFor="demand" className="text-sm font-bold">
                  {m.demand}
                </Label>
                <p className="mt-1 text-xs text-muted-foreground">{m.demandHint}</p>
              </div>
              <Switch id="demand" checked={demo.market.highDemand} disabled={busy} onCheckedChange={(v) => setHighDemand(v)} />
            </div>
            <div>
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
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  )
}
