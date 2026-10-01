"use client"

import { CircleAlertIcon, ClockIcon, Loader2Icon, TriangleAlertIcon } from "lucide-react"

import { Padlock } from "@/components/loan/padlock"
import { RiskBadge } from "@/components/loan/risk-badge"
import { SafetyRunway } from "@/components/loan/safety-runway"
import { TxStatus } from "@/components/ui/tx-status"
import { t } from "@/i18n/t"
import { daysBetween, graceEndsAt, positionOf, rescueOptions } from "@/lib/demo/loan-math"
import { useDemo, useDemoNow } from "@/lib/demo/store"
import { COLLATERAL_PARAMS, RESCUE_HEALTH } from "@/lib/demo/tokens"
import type { Loan } from "@/lib/demo/types"
import { formatDate, formatHealth, formatNumber, formatPercent, formatToken, formatUsd } from "@/lib/format"
import { cn } from "@/lib/utils"

import { AddCollateralDialog } from "./add-collateral-dialog"
import { Amount } from "./amount"
import { useAppCopy } from "./app-provider"
import { LoanActivity } from "./loan-activity"
import { LoanDetails } from "./loan-details"
import { RepayDialog } from "./repay-dialog"
import { RepaymentPath } from "./repayment-path"

/**
 * One open loan. The two things that matter lead, side by side: what you
 * owe (with the actions) and how safe the loan is. Its timeline follows,
 * then the terms and the transaction log. The market simulator lives in
 * the strip above the page, not in the loan's layout.
 */
export function ActiveLoan({ loan }: { loan: Loan }) {
  return (
    <div className="flex flex-col gap-6">
      <LoanBanner loan={loan} />
      <div className="grid gap-6 lg:grid-cols-2">
        <OweCard loan={loan} />
        <HealthCard loan={loan} />
      </div>
      <RepaymentPath loan={loan} />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)] lg:items-start">
        <LoanDetails loan={loan} />
        <LoanActivity loan={loan} />
      </div>
    </div>
  )
}

/** Keeper in progress, liquidatable, at risk or overdue: one banner, most urgent first. */
function LoanBanner({ loan }: { loan: Loan }) {
  const demo = useDemo()
  const now = useDemoNow()
  const { app, locale } = useAppCopy()
  const b = app.banners
  if (!demo) return null
  const pos = positionOf(loan, demo.market, now)
  const price = formatUsd(pos.liqPrice, locale)
  const keeper = demo.keepers[loan.id]

  if (keeper) {
    return (
      <div role="status" aria-live="polite" className="flex flex-col gap-3 rounded-2xl border border-destructive/50 bg-destructive/10 p-4">
        <p className="flex items-start gap-2 font-semibold">
          <Loader2Icon className="mt-0.5 size-4 shrink-0 animate-spin text-destructive" aria-hidden="true" />
          {keeper.reason === "term" ? b.keeperTerm : t(b.keeperPrice, { token: loan.collateralSymbol, price })}
        </p>
        <TxStatus status="pending" hash={keeper.hash} label={app.tx.pending} className="self-start" />
      </div>
    )
  }
  if (pos.risk === "liquidatable") {
    return (
      <p role="alert" className="flex items-start gap-2 rounded-2xl border border-destructive/50 bg-destructive/10 p-4 text-sm font-semibold">
        <CircleAlertIcon className="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden="true" />
        {t(b.liquidatable, { token: loan.collateralSymbol })}
      </p>
    )
  }
  if (now > loan.dueAt) {
    return (
      <p role="alert" className="flex items-start gap-2 rounded-2xl border border-warning/50 bg-warning/10 p-4 text-sm font-semibold">
        <ClockIcon className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden="true" />
        {t(b.overdue, { date: formatDate(graceEndsAt(loan), locale) })}
      </p>
    )
  }
  if (pos.risk === "atRisk") {
    const r = rescueOptions(loan, demo.market, now, RESCUE_HEALTH)
    return (
      <p role="alert" className="flex items-start gap-2 rounded-2xl border border-warning/50 bg-warning/10 p-4 text-sm font-semibold">
        <TriangleAlertIcon className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden="true" />
        {t(b.atRisk, {
          add: formatToken(r.addCollateral, loan.collateralSymbol, locale),
          repay: formatToken(r.repay, loan.borrowSymbol, locale),
        })}
      </p>
    )
  }
  return null
}

function OweCard({ loan }: { loan: Loan }) {
  const demo = useDemo()
  const now = useDemoNow(1000)
  const { app, locale } = useAppCopy()
  const o = app.owe
  if (!demo) return null
  const pos = positionOf(loan, demo.market, now)
  const interest = pos.owed - loan.outstanding
  const days = daysBetween(now, loan.dueAt)
  const busy = !!demo.keepers[loan.id]
  const dueText = days > 0 ? t(o.inDays, { n: days }) : days === 0 ? o.dueToday : t(o.overdue, { n: -days })

  return (
    <section aria-labelledby="owe-title" className="flex flex-col rounded-3xl border bg-card p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="owe-title" className="eyebrow text-muted-foreground">
          {o.title}
        </h2>
        <p className={cn("inline-flex items-center gap-1.5 text-sm font-semibold", days < 0 && "text-warning")}>
          <ClockIcon className="size-4" aria-hidden="true" />
          {t(o.due, { date: formatDate(loan.dueAt, locale) })} · {dueText}
        </p>
      </div>
      <p className="mt-3 flex flex-wrap items-baseline gap-x-2 tabular-nums text-4xl font-bold tracking-tight  sm:text-5xl">
        <span>{formatNumber(pos.owed, locale, 6, 6)}</span>
        <span className="font-sans text-xl font-bold text-muted-foreground">{loan.borrowSymbol}</span>
      </p>
      <p className="mt-2 inline-flex items-center gap-2 text-xs text-muted-foreground">
        <span className="bx-pulse size-2 rounded-full bg-primary" aria-hidden="true" />
        {o.live}
      </p>
      <dl className="mt-5 mb-5 grid grid-cols-2 gap-4 border-t pt-4 text-sm">
        <div>
          <dt className="text-muted-foreground">{o.principal}</dt>
          <dd className="mt-1 font-semibold">
            <Amount value={loan.outstanding} symbol={loan.borrowSymbol} />
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">{o.interest}</dt>
          <dd className="mt-1 font-semibold">
            <Amount value={interest} symbol={loan.borrowSymbol} digits={6} />
          </dd>
        </div>
      </dl>
      <div className="mt-auto flex flex-col gap-3 border-t pt-5">
        <div className="flex flex-col gap-2 sm:flex-row">
          <RepayDialog loan={loan} disabled={busy} />
          <AddCollateralDialog loan={loan} disabled={busy} />
        </div>
        {busy ? <p className="text-xs text-muted-foreground">{app.actions.busy}</p> : null}
      </div>
    </section>
  )
}

function HealthCard({ loan }: { loan: Loan }) {
  const demo = useDemo()
  const now = useDemoNow(1000)
  const { app, terms, locale } = useAppCopy()
  if (!demo) return null
  const pos = positionOf(loan, demo.market, now)
  const params = COLLATERAL_PARAMS[loan.collateralSymbol]

  return (
    <section aria-labelledby="health-title" className="rounded-3xl border bg-card p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="health-title" className="eyebrow text-muted-foreground">
          {app.health.title}
        </h2>
        <RiskBadge risk={pos.risk} label={terms.risk[pos.risk]} />
      </div>
      <p className="mt-3 flex items-baseline gap-2">
        <span className="tabular-nums text-4xl font-bold ">{formatHealth(pos.health, locale)}</span>
        <span className="text-sm text-muted-foreground">{terms.health}</span>
      </p>
      <SafetyRunway
        className="mt-4"
        symbol={loan.collateralSymbol}
        price={demo.market.prices[loan.collateralSymbol]}
        liqPrice={pos.liqPrice}
        locale={locale}
        labels={terms.runway}
      />
      <dl className="mt-5 grid gap-4 border-t pt-4 text-sm sm:grid-cols-2">
        <div className="flex items-center gap-3">
          <Padlock locked className="h-10 w-9 shrink-0" />
          <div>
            <dt className="text-muted-foreground">{app.health.collateral}</dt>
            <dd className="font-semibold">
              <Amount value={loan.collateral} symbol={loan.collateralSymbol} usd={pos.collateralUsd} />
            </dd>
          </div>
        </div>
        <div>
          <dt className="text-muted-foreground">{app.health.ltv}</dt>
          <dd className="mt-1 font-semibold">
            {formatPercent(pos.ltv, locale, 1)}{" "}
            <span className="font-normal text-muted-foreground">· {t(app.health.limit, { pct: formatPercent(params.liquidationThreshold, locale) })}</span>
          </dd>
        </div>
      </dl>
    </section>
  )
}
