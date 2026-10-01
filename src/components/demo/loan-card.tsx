"use client"

import { ArrowRightIcon, ClockIcon, Loader2Icon, UnlockIcon } from "lucide-react"
import Link from "next/link"

import { RiskBadge } from "@/components/loan/risk-badge"
import { SafetyRunway } from "@/components/loan/safety-runway"
import { href } from "@/i18n/config"
import { t } from "@/i18n/t"
import { daysBetween, type Position } from "@/lib/demo/loan-math"
import { useDemo, useDemoNow } from "@/lib/demo/store"
import type { Loan } from "@/lib/demo/types"
import { formatDate, formatHealth, formatNumber, formatToken } from "@/lib/format"
import { cn } from "@/lib/utils"

import { useAppCopy } from "./app-provider"

/** "2,000 tUSDC against tETH": how every loan is named. Stable for the loan's whole life. */
export function useLoanName() {
  const { app, locale } = useAppCopy()
  return (loan: Loan) => t(app.loans.cardTitle, { amount: formatToken(loan.principal, loan.borrowSymbol, locale), collateral: loan.collateralSymbol })
}

/** One open loan on the overview: what you owe, its health and a small runway. The whole card opens the loan. */
export function LoanCard({ loan, pos }: { loan: Loan; pos: Position }) {
  const demo = useDemo()
  const now = useDemoNow(1000)
  const { app, terms, locale } = useAppCopy()
  const name = useLoanName()
  const o = app.owe
  if (!demo) return null
  const keeper = demo.keepers[loan.id]
  const days = daysBetween(now, loan.dueAt)
  const dueText = days > 0 ? t(o.inDays, { n: days }) : days === 0 ? o.dueToday : t(o.overdue, { n: -days })

  return (
    <article
      className={cn(
        "relative flex flex-col rounded-3xl border bg-card p-5 transition-colors has-[a:hover]:border-foreground/30 has-[a:focus-visible]:outline-2 has-[a:focus-visible]:outline-offset-2 has-[a:focus-visible]:outline-ring sm:p-6",
        pos.risk === "atRisk" && "border-warning/50",
        (pos.risk === "liquidatable" || keeper) && "border-destructive/50"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-base leading-snug font-bold">
          <Link href={href(locale, `/app/loan/${loan.id}`)} className="outline-none after:absolute after:inset-0 after:rounded-3xl">
            {name(loan)}
          </Link>
        </h3>
        <RiskBadge risk={pos.risk} label={terms.risk[pos.risk]} className="shrink-0" />
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-4">
        <div>
          <dt className="text-xs text-muted-foreground">{app.loans.owed}</dt>
          <dd className="mt-0.5 text-2xl font-bold whitespace-nowrap tabular-nums">
            {formatNumber(pos.owed, locale, 2, 2)} <span className="text-sm text-muted-foreground">{loan.borrowSymbol}</span>
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">{app.loans.health}</dt>
          <dd className="mt-0.5 text-2xl font-bold tabular-nums">{formatHealth(pos.health, locale)}</dd>
        </div>
      </dl>

      <SafetyRunway
        className="mt-3"
        symbol={loan.collateralSymbol}
        price={demo.market.prices[loan.collateralSymbol]}
        liqPrice={pos.liqPrice}
        locale={locale}
        labels={terms.runway}
        live={false}
      />

      <div className="mt-auto flex items-center justify-between gap-3 border-t pt-4 text-sm">
        {keeper ? (
          <p role="status" className="inline-flex items-center gap-1.5 font-semibold text-destructive">
            <Loader2Icon className="size-4 animate-spin" aria-hidden="true" />
            {app.loans.liquidating}
          </p>
        ) : (
          <p className={cn("inline-flex items-center gap-1.5", days <= 7 ? "font-semibold text-warning" : "text-muted-foreground")}>
            <ClockIcon className="size-4 shrink-0" aria-hidden="true" />
            {/* The exact date is on the loan page; a week out, the countdown is what matters. */}
            {days <= 7 ? `${t(o.due, { date: formatDate(loan.dueAt, locale) })} · ${dueText}` : t(o.due, { date: formatDate(loan.dueAt, locale) })}
          </p>
        )}
        <span aria-hidden="true" className="inline-flex shrink-0 items-center gap-1 font-semibold whitespace-nowrap text-primary-ink">
          {app.loans.view}
          <ArrowRightIcon className="size-4" />
        </span>
      </div>
    </article>
  )
}

/** A closed loan still on the overview: collateral to withdraw, then move it to history. */
export function ClosedLoanCard({ loan }: { loan: Loan }) {
  const { app, locale } = useAppCopy()
  const name = useLoanName()
  const liquidated = loan.status === "liquidated"
  const note = loan.withdrawable > 0 ? (liquidated ? app.loans.closedLiquidated : app.loans.closedRepaid) : app.loans.closedDone
  return (
    <article className="relative flex flex-col gap-3 rounded-3xl border border-dashed bg-card p-5 has-[a:hover]:border-foreground/30 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-base leading-snug font-bold">
          <Link href={href(locale, `/app/loan/${loan.id}`)} className="outline-none after:absolute after:inset-0 after:rounded-3xl focus-visible:underline">
            {name(loan)}
          </Link>
        </h3>
        <span
          className={cn(
            "inline-flex h-7 shrink-0 items-center rounded-full border px-2.5 text-xs font-bold",
            liquidated ? "border-destructive/40 text-destructive" : "border-success/40 text-success"
          )}
        >
          {liquidated ? app.history.liquidated : app.history.repaid}
        </span>
      </div>
      <p className="inline-flex items-center gap-1.5 text-sm font-semibold">
        <UnlockIcon className="size-4 text-muted-foreground" aria-hidden="true" />
        {note}
      </p>
      {loan.withdrawable > 0 ? (
        <p className="text-sm text-muted-foreground">{t(app.closed.withdraw, { amount: formatToken(loan.withdrawable, loan.collateralSymbol, locale) })}</p>
      ) : null}
    </article>
  )
}
