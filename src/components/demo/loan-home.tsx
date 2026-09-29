"use client"

import { ArrowRightIcon, PlayIcon } from "lucide-react"
import Link from "next/link"

import { Padlock } from "@/components/loan/padlock"
import { Button } from "@/components/ui/button"
import { InfoTip } from "@/components/ui/info-tip"
import { href } from "@/i18n/config"
import { t } from "@/i18n/t"
import { borrowerLevel } from "@/lib/demo/loan-math"
import { loadExample } from "@/lib/demo/ops"
import { useDemo } from "@/lib/demo/store"
import { TOKENS } from "@/lib/demo/tokens"
import type { Loan, TokenSymbol } from "@/lib/demo/types"
import { formatDate, formatToken } from "@/lib/format"
import { cn } from "@/lib/utils"

import { ActiveLoan } from "./active-loan"
import { Amount } from "./amount"
import { AppHeader } from "./app-header"
import { useAppCopy } from "./app-provider"
import { ClosedLoan } from "./closed-loan"

/** /app: the visitor's one loan (none, active or closed), then wallet, level and history. */
export function LoanHome() {
  const demo = useDemo()
  const { app } = useAppCopy()
  if (!demo) return null
  const loan = demo.loan

  return (
    <div className="flex flex-col gap-8">
      <AppHeader>
        <h1 className="text-3xl font-extrabold tracking-display sm:text-4xl">{app.loan.title}</h1>
      </AppHeader>

      {!loan ? <EmptyLoan /> : loan.status === "active" ? <ActiveLoan loan={loan} /> : <ClosedLoan loan={loan} />}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <WalletCard />
        <LevelCard />
        <HistoryCard />
      </div>
    </div>
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
  const loan = demo.loan
  return (
    <section aria-labelledby="wallet-title" className="rounded-3xl border bg-card p-5 sm:p-6">
      <h2 id="wallet-title" className="eyebrow text-muted-foreground">
        {app.balances.title}
      </h2>
      <ul className="mt-3 flex flex-col divide-y">
        {ORDER.map((sym) => {
          const locked = loan?.status === "active" && loan.collateralSymbol === sym ? loan.collateral : 0
          return (
            <li key={sym} className="flex items-center justify-between gap-3 py-2.5">
              <span className="inline-flex items-center gap-2 text-sm font-bold">
                <TokenDot symbol={sym} />
                {sym}
              </span>
              <span className="text-right text-sm">
                <Amount value={demo.wallet.balances[sym]} symbol={sym} usd={demo.wallet.balances[sym] * demo.market.prices[sym]} />
                {locked > 0 ? (
                  <span className="block text-xs text-primary-ink">{t(app.balances.locked, { amount: formatToken(locked, sym, locale) })}</span>
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
        <span className="text-sm font-bold">
          {t(h.row, {
            amount: formatToken(loan.principal, loan.borrowSymbol, locale),
            collateral: loan.collateralSymbol,
          })}
        </span>
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
