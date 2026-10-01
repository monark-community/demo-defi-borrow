"use client"

import { t } from "@/i18n/t"
import { graceEndsAt } from "@/lib/demo/loan-math"
import { useDemoNow } from "@/lib/demo/store"
import type { Loan } from "@/lib/demo/types"
import { formatDate, formatPercent, formatToken } from "@/lib/format"
import { cn } from "@/lib/utils"

import { useAppCopy } from "./app-provider"

/**
 * The loan's life on one line: opened → today → due → grace ends, with a
 * stamp for every repayment. Principal repaid shows as a progress bar.
 */
export function RepaymentPath({ loan }: { loan: Loan }) {
  const now = useDemoNow(1000)
  const { app, locale } = useAppCopy()
  const p = app.path
  const start = loan.openedAt
  const end = graceEndsAt(loan)
  const span = end - start
  const at = (ms: number) => `${Math.min(100, Math.max(0, ((ms - start) / span) * 100))}%`
  const repaid = loan.principal > 0 ? (loan.principal - loan.outstanding) / loan.principal : 0
  const stamps = loan.events.filter((e) => e.kind === "repaid" || e.kind === "repaidFull")

  return (
    <section aria-labelledby="path-title" className="rounded-3xl border bg-card p-5 sm:p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="path-title" className="eyebrow text-muted-foreground">
          {p.title}
        </h2>
        <p className="text-sm font-semibold">{t(p.progress, { pct: formatPercent(repaid, locale) })}</p>
      </div>

      <div className="relative mt-10 mb-12 h-1.5 rounded-full bg-muted" aria-hidden="true">
        {/* elapsed */}
        <div className="bx-glide absolute inset-y-0 left-0 rounded-full bg-primary" style={{ width: at(now) }} />
        {/* grace zone */}
        <div className="absolute inset-y-0 right-0 rounded-r-full bg-warning/40" style={{ left: at(loan.dueAt) }} />
        <Tick left="0%" label={p.opened} sub={formatDate(start, locale)} align="left" below />
        <Tick left={at(loan.dueAt)} label={p.due} sub={formatDate(loan.dueAt, locale)} align="right" below />
        {/* today */}
        <div className="bx-glide absolute -top-7 flex -translate-x-1/2 flex-col items-center" style={{ left: at(now) }}>
          <span className="rounded-full bg-foreground px-2 py-0.5 text-[0.7rem] font-bold text-background">{p.today}</span>
          <span className="mt-0.5 h-4 w-0.5 bg-foreground" />
        </div>
        {stamps.map((e) => (
          <span
            key={e.id}
            className="bx-stamp absolute top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-card bg-success"
            style={{ left: at(e.at) }}
            title={t(p.stamp, { amount: formatToken(e.amount ?? 0, loan.borrowSymbol, locale) })}
          />
        ))}
      </div>

      <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted" aria-hidden="true">
        <div className="bx-glide h-full rounded-full bg-success" style={{ width: `${repaid * 100}%` }} />
      </div>
      <ul className="mt-4 flex flex-col gap-1.5 text-sm">
        {stamps.length ? (
          stamps.map((e) => (
            <li key={e.id} className="flex items-center gap-2">
              <span className="size-2.5 rounded-full bg-success" aria-hidden="true" />
              <span className="font-semibold">{t(p.stamp, { amount: formatToken(e.amount ?? 0, loan.borrowSymbol, locale) })}</span>
              <span className="text-muted-foreground">· {formatDate(e.at, locale)}</span>
            </li>
          ))
        ) : null}
        <li className="flex items-center gap-2 text-muted-foreground">
          <span className="size-2.5 rounded-full bg-warning" aria-hidden="true" />
          {p.grace} · {formatDate(end, locale)}
        </li>
      </ul>
    </section>
  )
}

function Tick({ left, label, sub, align, below }: { left: string; label: string; sub: string; align: "left" | "right"; below?: boolean }) {
  return (
    <div className={cn("absolute flex flex-col", below ? "top-3" : "-top-8", align === "right" ? "-translate-x-full items-end text-right" : "items-start")} style={{ left }}>
      <span className="text-xs font-bold">{label}</span>
      <span className="text-xs whitespace-nowrap text-muted-foreground">{sub}</span>
    </div>
  )
}
