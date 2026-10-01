"use client"

import { ArrowRightIcon, PlayIcon, PlusIcon } from "lucide-react"
import Link from "next/link"
import type { ReactNode } from "react"

import { Padlock } from "@/components/loan/padlock"
import { RiskBadge } from "@/components/loan/risk-badge"
import { Button } from "@/components/ui/button"
import { InfoTip } from "@/components/ui/info-tip"
import { href } from "@/i18n/config"
import { t } from "@/i18n/t"
import { borrowerLevel, daysBetween } from "@/lib/demo/loan-math"
import { loadExample } from "@/lib/demo/ops"
import { lockedBySymbol, portfolioOf, type Portfolio } from "@/lib/demo/portfolio"
import { useDemo, useDemoNow } from "@/lib/demo/store"
import { TOKENS } from "@/lib/demo/tokens"
import type { CollateralSymbol, Loan, TokenSymbol } from "@/lib/demo/types"
import { formatDate, formatHealth, formatToken, formatUsd } from "@/lib/format"
import { cn } from "@/lib/utils"

import { Amount } from "./amount"
import { AppHeader } from "./app-header"
import { useAppCopy } from "./app-provider"
import { ClosedLoanCard, LoanCard, useLoanName } from "./loan-card"
import { MarketStrip } from "./market-strip"

/** /app: every loan at a glance (or the empty state), then wallet, level and history. */
export function LoanHome() {
  const demo = useDemo()
  const now = useDemoNow(1000)
  const { app, locale } = useAppCopy()
  if (!demo) return null
  const pf = portfolioOf(demo, now)
  const any = pf.open.length + pf.closed.length > 0

  return (
    <div className="flex flex-col gap-6">
      <AppHeader
        actions={
          any ? (
            <Button asChild size="sm">
              <Link href={href(locale, "/app/borrow")}>
                <PlusIcon aria-hidden="true" />
                {app.loans.request}
              </Link>
            </Button>
          ) : null
        }
      >
        <h1 className="text-3xl font-extrabold tracking-display sm:text-4xl">{app.loans.title}</h1>
      </AppHeader>

      <MarketStrip focus={pf.weakest?.loan.collateralSymbol} />

      {!any ? (
        <EmptyLoan />
      ) : (
        <>
          {pf.open.length > 0 ? <PortfolioSummary pf={pf} /> : null}
          <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {pf.open.map(({ loan, pos }) => (
              <li key={loan.id} className="flex *:flex-1">
                <LoanCard loan={loan} pos={pos} />
              </li>
            ))}
            {pf.closed.map((loan) => (
              <li key={loan.id} className="flex *:flex-1">
                <ClosedLoanCard loan={loan} />
              </li>
            ))}
          </ul>
        </>
      )}

      <div className="mt-2 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <WalletCard />
        <LevelCard />
        <HistoryCard />
      </div>
    </div>
  )
}

/** Totals across open loans, and which loan to look at first. */
function PortfolioSummary({ pf }: { pf: Portfolio }) {
  const now = useDemoNow(60_000)
  const { app, terms, locale } = useAppCopy()
  const name = useLoanName()
  const s = app.loans.summary
  const o = app.owe
  const n = pf.open.length
  const days = pf.nextDue ? daysBetween(now, pf.nextDue.loan.dueAt) : 0
  const dueText = days > 0 ? t(o.inDays, { n: days }) : days === 0 ? o.dueToday : t(o.overdue, { n: -days })
  const cells: { label: string; value: string; badge?: ReactNode; hint?: string }[] = [
    { label: s.owed, value: formatUsd(pf.owedUsd, locale), hint: n === 1 ? s.owedHintOne : t(s.owedHint, { n }) },
    { label: s.locked, value: formatUsd(pf.collateralUsd, locale) },
  ]
  if (pf.weakest) {
    cells.push({
      label: s.weakest,
      value: formatHealth(pf.weakest.pos.health, locale),
      badge: <RiskBadge risk={pf.weakest.pos.risk} label={terms.risk[pf.weakest.pos.risk]} />,
      hint: name(pf.weakest.loan),
    })
  }
  if (pf.nextDue) {
    cells.push({ label: s.nextDue, value: formatDate(pf.nextDue.loan.dueAt, locale), hint: `${name(pf.nextDue.loan)} · ${dueText}` })
  }

  return (
    <section aria-label={s.title} className="rounded-3xl border bg-card">
      <dl className="grid grid-cols-2 lg:grid-cols-4">
        {cells.map((c, i) => (
          <div
            key={c.label}
            className={cn(
              "flex min-w-0 flex-col gap-1 p-4 sm:p-5",
              i % 2 === 1 && "border-l",
              i >= 2 && "border-t lg:border-t-0",
              i === 2 && "lg:border-l"
            )}
          >
            <dt className="eyebrow text-muted-foreground">{c.label}</dt>
            <dd className="flex flex-wrap items-center gap-2 text-xl font-bold tabular-nums sm:text-2xl">
              {c.value}
              {c.badge}
            </dd>
            {c.hint ? <dd className="truncate text-xs text-muted-foreground">{c.hint}</dd> : null}
          </div>
        ))}
      </dl>
    </section>
  )
}

function EmptyLoan() {
  const { app, locale } = useAppCopy()
  const e = app.empty
  return (
    <section aria-labelledby="empty-title" className="grid items-center gap-8 rounded-3xl border bg-card p-6 sm:p-10 md:grid-cols-[auto_1fr]">
      <Padlock locked={false} className="mx-auto h-28 w-24 md:mx-0" />
      <div>
        <h2 id="empty-title" className="text-2xl font-extrabold tracking-display sm:text-3xl">
          {e.title}
        </h2>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          <Button asChild size="lg">
            <Link href={href(locale, "/app/borrow")}>
              {e.request}
              <ArrowRightIcon aria-hidden="true" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" onClick={() => loadExample()}>
            <PlayIcon aria-hidden="true" />
            {e.example}
          </Button>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">{e.exampleHint}</p>
      </div>
    </section>
  )
}

const ORDER: TokenSymbol[] = ["tETH", "tWBTC", "tLINK", "tUSDC", "tDAI"]

function WalletCard() {
  const demo = useDemo()
  const { app, locale } = useAppCopy()
  if (!demo) return null
  const locked = lockedBySymbol(demo.loans)
  return (
    <section aria-labelledby="wallet-title" className="rounded-3xl border bg-card p-5 sm:p-6">
      <h2 id="wallet-title" className="eyebrow text-muted-foreground">
        {app.balances.title}
      </h2>
      <ul className="mt-3 flex flex-col divide-y">
        {ORDER.map((sym) => {
          const lockedHere = sym in locked ? locked[sym as CollateralSymbol] : 0
          return (
            <li key={sym} className="flex items-center justify-between gap-3 py-2.5">
              <span className="inline-flex items-center gap-2 text-sm font-bold">
                <TokenDot symbol={sym} />
                {sym}
              </span>
              <span className="text-right text-sm">
                <Amount value={demo.wallet.balances[sym]} symbol={sym} usd={demo.wallet.balances[sym] * demo.market.prices[sym]} />
                {lockedHere > 0 ? (
                  <span className="block text-xs text-primary-ink">{t(app.balances.locked, { amount: formatToken(lockedHere, sym, locale) })}</span>
                ) : null}
              </span>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

/** A small, flat token marker (no logos: these are testnet tokens). */
function TokenDot({ symbol }: { symbol: TokenSymbol }) {
  const stable = TOKENS[symbol].usd === 1
  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex size-6 items-center justify-center rounded-full border text-[0.6rem] font-extrabold",
        stable ? "border-input bg-secondary text-foreground" : "border-primary text-primary-ink"
      )}
    >
      {symbol.slice(1, 2)}
    </span>
  )
}

function LevelCard() {
  const demo = useDemo()
  const { app } = useAppCopy()
  if (!demo) return null
  const level = borrowerLevel(demo.borrower)
  const steps = ["new", "steady", "trusted"] as const
  const idx = steps.indexOf(level)
  const hint =
    level === "steady" ? t(app.level.hints.steady, { n: Math.max(1, 3 - demo.borrower.onTimeRepayments) }) : app.level.hints[level]
  return (
    <section aria-labelledby="level-title" className="rounded-3xl border bg-card p-5 sm:p-6">
      <div className="-my-2 flex items-center justify-between gap-2">
        <h2 id="level-title" className="eyebrow text-muted-foreground">
          {app.level.title}
        </h2>
        <InfoTip label={app.info}>{app.level.simulated}</InfoTip>
      </div>
      <p className="mt-3 text-2xl font-extrabold">{app.level.names[level]}</p>
      <ol className="mt-3 grid grid-cols-3 gap-1.5" aria-label={app.level.title}>
        {steps.map((s, i) => (
          <li key={s} className="flex flex-col gap-1.5">
            <span className={cn("h-2 rounded-full", i <= idx ? "bg-primary" : "bg-muted")} aria-hidden="true" />
            <span className={cn("text-xs", i === idx ? "font-bold" : "text-muted-foreground")} aria-current={i === idx ? "step" : undefined}>
              {app.level.names[s]}
            </span>
          </li>
        ))}
      </ol>
      <p className="mt-4 text-sm">{hint}</p>
    </section>
  )
}

function HistoryCard() {
  const demo = useDemo()
  const { app, locale } = useAppCopy()
  if (!demo) return null
  const h = app.history
  return (
    <section aria-labelledby="history-title" className="rounded-3xl border bg-card p-5 sm:p-6 md:col-span-2 lg:col-span-1">
      <h2 id="history-title" className="eyebrow text-muted-foreground">
        {h.title}
      </h2>
      {demo.history.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">{h.empty}</p>
      ) : (
        <ul className="mt-3 flex flex-col divide-y">
          {demo.history.map((l) => (
            <HistoryRow key={l.id} loan={l} locale={locale} />
          ))}
        </ul>
      )}
    </section>
  )
}

function HistoryRow({ loan, locale }: { loan: Loan; locale: "en" | "fr" }) {
  const { app } = useAppCopy()
  const h = app.history
  const liquidated = loan.status === "liquidated"
  return (
    <li className="flex flex-col gap-1 py-3 first:pt-0 last:pb-0">
      <div className="flex items-center justify-between gap-2">
        <Link href={href(locale, `/app/loan/${loan.id}`)} className="text-sm font-bold underline-offset-4 hover:underline">
          {t(h.row, {
            amount: formatToken(loan.principal, loan.borrowSymbol, locale),
            collateral: loan.collateralSymbol,
          })}
        </Link>
        <span
          className={cn(
            "rounded-full border px-2 py-0.5 text-xs font-bold",
            liquidated ? "border-destructive/40 text-destructive" : "border-success/40 text-success"
          )}
        >
          {liquidated ? h.liquidated : h.repaid}
        </span>
      </div>
      <p className="text-xs text-muted-foreground">
        {loan.closedAt ? t(h.closed, { date: formatDate(loan.closedAt, locale) }) : null}
        {!liquidated ? ` · ${loan.onTime ? h.onTime : h.late} · ${t(h.interest, { amount: formatToken(loan.totalInterestPaid, loan.borrowSymbol, locale) })}` : null}
      </p>
    </li>
  )
}
