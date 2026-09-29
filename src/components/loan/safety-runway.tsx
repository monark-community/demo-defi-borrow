import type { Locale } from "@/i18n/config"
import { t } from "@/i18n/t"
import { dropToLiquidation, riskLevel } from "@/lib/demo/loan-math"
import { SAFE_HEALTH } from "@/lib/demo/tokens"
import type { RiskLevel } from "@/lib/demo/types"
import { formatDrop, formatUsd } from "@/lib/format"
import { cn } from "@/lib/utils"

export interface RunwayLabels {
  label: string
  today: string
  atRisk: string
  liquidation: string
  sentence: string
  sentenceNow: string
}

const MARKER_TONE: Record<RiskLevel, string> = {
  safe: "border-success",
  atRisk: "border-warning",
  liquidatable: "border-destructive",
}

/**
 * The safety runway: a price track from $0 to a little above today's price,
 * coloured red below the liquidation price, amber up to the at-risk price
 * and green above. The "today" pin and both thresholds glide when their
 * values change, which is the whole point: a loan is a distance to a price.
 */
export function SafetyRunway({
  symbol,
  price,
  liqPrice,
  locale,
  labels,
  scaleMax,
  showSentence = true,
  live = true,
  className,
}: {
  symbol: string
  price: number
  liqPrice: number
  locale: Locale
  labels: RunwayLabels
  /** Right edge of the track (USD). Defaults to a little above today's price. */
  scaleMax?: number
  showSentence?: boolean
  /** Announce sentence changes to screen readers (off for decorative loops). */
  live?: boolean
  className?: string
}) {
  const atRisk = liqPrice * SAFE_HEALTH
  const finite = Number.isFinite(liqPrice)
  const max = scaleMax ?? Math.max(price * 1.18, finite ? atRisk * 1.12 : price * 1.18)
  const pct = (v: number) => `${Math.min(100, Math.max(0, (v / max) * 100))}%`
  const pos = Math.min(100, Math.max(0, (price / max) * 100))
  const health = finite ? price / liqPrice : Number.POSITIVE_INFINITY
  const risk = riskLevel(health)
  const drop = dropToLiquidation(price, liqPrice)
  const priceText = formatUsd(price, locale)
  // Keep the "today" label inside the track at the edges.
  const align = pos > 78 ? "right" : pos < 22 ? "left" : "center"

  return (
    <figure className={cn("w-full", className)} aria-label={t(labels.label, { token: symbol })}>
      <div className="relative h-11">
        <div
          className={cn(
            "bx-glide absolute bottom-1 flex flex-col whitespace-nowrap",
            align === "center" && "-translate-x-1/2 items-center",
            align === "right" && "-translate-x-full items-end",
            align === "left" && "items-start"
          )}
          style={{ left: `${pos}%` }}
        >
          <span className="text-[0.7rem] font-semibold text-muted-foreground">{labels.today}</span>
          <span className="tabular-nums text-sm font-bold ">{priceText}</span>
        </div>
      </div>
      <div className="relative h-3.5 rounded-full bg-muted" aria-hidden="true">
        {finite ? (
          <>
            <div className="bx-glide absolute inset-y-0 left-0 rounded-l-full bg-destructive/35" style={{ width: pct(liqPrice) }} />
            <div
              className="bx-glide absolute inset-y-0 bg-warning/40"
              style={{ left: pct(liqPrice), width: `calc(${pct(atRisk)} - ${pct(liqPrice)})` }}
            />
            <div className="bx-glide absolute inset-y-0 right-0 rounded-r-full bg-success/35" style={{ left: pct(atRisk) }} />
            <div className="bx-glide absolute -inset-y-1 w-0.5 -translate-x-1/2 rounded-full bg-destructive" style={{ left: pct(liqPrice) }} />
          </>
        ) : (
          <div className="absolute inset-0 rounded-full bg-success/35" />
        )}
        <div
          className={cn(
            "bx-glide absolute top-1/2 size-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] bg-card",
            MARKER_TONE[risk]
          )}
          style={{ left: `${pos}%` }}
        />
      </div>
      {finite ? (
        <dl className="mt-2.5 flex flex-wrap justify-between gap-x-4 gap-y-1 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-destructive" aria-hidden="true" />
            <dt className="text-muted-foreground">{labels.liquidation}</dt>
            <dd className="tabular-nums font-semibold ">{formatUsd(liqPrice, locale)}</dd>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-warning" aria-hidden="true" />
            <dt className="text-muted-foreground">{labels.atRisk}</dt>
            <dd className="tabular-nums font-semibold ">{formatUsd(atRisk, locale)}</dd>
          </div>
        </dl>
      ) : null}
      {showSentence && finite ? (
        <figcaption className="mt-3 text-sm font-semibold" aria-live={live ? "polite" : undefined}>
          {risk === "liquidatable"
            ? t(labels.sentenceNow, { token: symbol, price: formatUsd(liqPrice, locale) })
            : t(labels.sentence, { token: symbol, pct: formatDrop(drop, locale) })}
        </figcaption>
      ) : null}
    </figure>
  )
}
