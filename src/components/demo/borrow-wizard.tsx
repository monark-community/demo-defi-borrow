"use client"

import { ArrowLeftIcon, ArrowRightIcon, CheckIcon, PenLineIcon, RotateCcwIcon, SparklesIcon, XCircleIcon } from "lucide-react"
import Link from "next/link"
import { useState, type ReactNode } from "react"

import { Padlock } from "@/components/loan/padlock"
import { RiskBadge } from "@/components/loan/risk-badge"
import { SafetyRunway } from "@/components/loan/safety-runway"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { InfoTip } from "@/components/ui/info-tip"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { href } from "@/i18n/config"
import { t } from "@/i18n/t"
import { useTx } from "@/lib/demo/chain"
import {
  borrowerLevel,
  collateralFor,
  healthFactor,
  levelDiscount,
  levelLtvBonus,
  liquidationPrice,
  projectedInterest,
  quoteApr,
  riskLevel,
} from "@/lib/demo/loan-math"
import { approveCollateral, openLoan } from "@/lib/demo/ops"
import { useDemo, useDemoNow } from "@/lib/demo/store"
import { COLLATERALS, COLLATERAL_PARAMS, DAY_MS, LOAN_TOKENS, SUGGESTED_HEALTH, TERMS, parseAmount } from "@/lib/demo/tokens"
import type { CollateralSymbol, LoanSymbol, RateKind, TermDays } from "@/lib/demo/types"
import { ceilDisplay, formatApr, formatDate, formatHealth, formatNumber, formatPercent, formatToken, formatUsd } from "@/lib/format"
import { cn } from "@/lib/utils"

import { useAppCopy } from "./app-provider"
import { AppHeader } from "./app-header"
import { TxSteps } from "./tx-steps"

type Step = 1 | 2 | 3 | 4
const MIN_BORROW = 50
const MAX_BORROW = 250_000
const QUICK = [500, 1000, 2500]

/** The guided four-step loan request, with a live summary and safety runway beside it. */
export function BorrowWizard() {
  const demo = useDemo()
  const now = useDemoNow(5000)
  const { app, terms, locale } = useAppCopy()
  const b = app.borrow
  const [step, setStep] = useState<Step>(1)
  const [borrowSymbol, setBorrowSymbol] = useState<LoanSymbol>("tUSDC")
  const [amountText, setAmountText] = useState("")
  const [collateralSymbol, setCollateralSymbol] = useState<CollateralSymbol>("tETH")
  const [collateralText, setCollateralText] = useState("")
  const [termDays, setTermDays] = useState<TermDays>(90)
  const [rateKind, setRateKind] = useState<RateKind>("variable")
  const [ack, setAck] = useState(false)
  const [showErrors, setShowErrors] = useState(false)
  /** The new loan's id, once its transaction confirms. */
  const [opened, setOpened] = useState<string | null>(null)
  const approveTx = useTx()
  const openTx = useTx()

  if (!demo) return null

  const level = borrowerLevel(demo.borrower)
  const discount = levelDiscount(level)
  const params = COLLATERAL_PARAMS[collateralSymbol]
  const maxLtv = params.maxLtv + levelLtvBonus(level)
  const collPrice = demo.market.prices[collateralSymbol]
  const amount = parseAmount(amountText)
  const collateral = parseAmount(collateralText)
  const balance = demo.wallet.balances[collateralSymbol]
  const apr = quoteApr(borrowSymbol, rateKind, demo.market, discount)
  const interest = amount ? projectedInterest(amount, apr, termDays) : 0
  const dueAt = now + termDays * DAY_MS
  const debtUsd = (amount ?? 0) * demo.market.prices[borrowSymbol]
  const collUsd = (collateral ?? 0) * collPrice
  const liqPrice = amount && collateral ? liquidationPrice(debtUsd, collateral, params.liquidationThreshold) : Number.POSITIVE_INFINITY
  const health = amount && collateral ? healthFactor(collUsd, params.liquidationThreshold, debtUsd) : Number.POSITIVE_INFINITY
  const suggested = amount ? ceilDisplay(collateralFor(debtUsd, collateralSymbol, demo.market, SUGGESTED_HEALTH), collateralSymbol) : 0
  const minForLimit = amount ? ceilDisplay(debtUsd / (maxLtv * collPrice), collateralSymbol) : 0

  const amountError =
    amount === null || amount <= 0
      ? b.errors.amount
      : amount < MIN_BORROW
        ? t(b.errors.tooSmall, { token: borrowSymbol })
        : amount > MAX_BORROW
          ? t(b.errors.tooBig, { token: borrowSymbol })
          : null
  const collateralError =
    collateral === null || collateral <= 0
      ? b.errors.amount
      : collateral > balance + 0.000001
        ? b.errors.balance
        : amount && debtUsd > collUsd * maxLtv + 0.000001
          ? t(b.errors.overLimit, {
              pct: formatPercent(maxLtv, locale),
              token: collateralSymbol,
              min: formatToken(minForLimit, collateralSymbol, locale),
            })
          : null

  const stepValid = (s: Step) => (s === 1 ? !amountError : s === 2 ? !amountError && !collateralError : true)

  const go = (s: Step) => {
    setShowErrors(false)
    setStep(s)
  }
  const next = () => {
    if (!stepValid(step)) {
      setShowErrors(true)
      return
    }
    go((step + 1) as Step)
  }

  const allowanceOk = collateral !== null && demo.wallet.allowances[collateralSymbol] + 0.000001 >= collateral
  const busy = approveTx.busy || openTx.busy
  const failed = approveTx.state.phase === "failed" ? approveTx.state : openTx.state.phase === "failed" ? openTx.state : null
  const amountLabel = amount ? formatToken(amount, borrowSymbol, locale) : ""
  const collLabel = collateral ? formatToken(collateral, collateralSymbol, locale, 6) : ""
  const totalLabel = formatToken((amount ?? 0) + interest, borrowSymbol, locale)

  const sign = async () => {
    if (!ack) {
      setShowErrors(true)
      return
    }
    if (busy || amount === null || collateral === null) return
    if (!allowanceOk) {
      const ok = await approveTx.run(
        {
          title: t(app.summaries.approve, { amount: collLabel }),
          rows: [{ label: app.summaries.rows.spender, value: app.summaries.rows.contract }],
          movesValue: false,
        },
        (hash) => approveCollateral(collateralSymbol, collateral, hash)
      )
      if (!ok) return
    }
    const ok = await openTx.run(
      {
        title: t(app.summaries.open, { collateral: collLabel, amount: amountLabel }),
        rows: [
          { label: app.summaries.rows.lock, value: collLabel },
          { label: app.summaries.rows.receive, value: amountLabel },
          { label: app.summaries.rows.rate, value: `${rateKind === "fixed" ? terms.fixed : terms.variable} · ${formatApr(apr, locale)}` },
          { label: app.summaries.rows.due, value: formatDate(dueAt, locale) },
        ],
        movesValue: true,
      },
      (hash) => {
        setOpened(openLoan({ borrowSymbol, amount, collateralSymbol, collateral, rateKind, termDays }, hash))
      }
    )
    if (!ok) return
  }

  const done = opened !== null && openTx.state.phase === "confirmed"

  return (
    <div className="flex flex-col gap-8">
      <header>
        <Link href={href(locale, "/app")} className="inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground">
          <ArrowLeftIcon className="size-4" aria-hidden="true" />
          {app.loans.title}
        </Link>
        <AppHeader className="mt-1">
          <h1 className="text-3xl font-extrabold tracking-display sm:text-4xl">{b.title}</h1>
        </AppHeader>
      </header>

      <ol className="grid grid-cols-4 gap-2" aria-label={b.title}>
        {b.steps.map((label, i) => {
          const s = (i + 1) as Step
          const state = s < step || done ? "done" : s === step ? "current" : "todo"
          const canJump = s < step && !busy && !done
          const content = (
            <>
              <span className={cn("h-1.5 w-full rounded-full", state === "todo" ? "bg-muted" : "bg-primary")} aria-hidden="true" />
              <span className="mt-2 flex items-center gap-1.5 text-left">
                <span
                  className={cn(
                    "flex size-5 shrink-0 items-center justify-center rounded-full text-[0.65rem] font-bold",
                    state === "done" ? "bg-primary text-primary-foreground" : state === "current" ? "bg-foreground text-background" : "bg-muted text-muted-foreground"
                  )}
                  aria-hidden="true"
                >
                  {state === "done" ? <CheckIcon className="size-3" /> : s}
                </span>
                <span className={cn("hidden text-xs font-semibold sm:inline", state === "todo" && "text-muted-foreground")}>{label}</span>
                <span className="sr-only sm:hidden">{label}</span>
              </span>
            </>
          )
          return (
            <li key={label} aria-current={state === "current" ? "step" : undefined}>
              {canJump ? (
                <button type="button" onClick={() => go(s)} className="flex w-full flex-col rounded-md text-left">
                  {content}
                </button>
              ) : (
                <div className="flex flex-col">{content}</div>
              )}
            </li>
          )
        })}
      </ol>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] lg:items-start">
        <section aria-labelledby="step-title" className="rounded-3xl border bg-card p-5 sm:p-7">
          <p className="eyebrow text-primary-ink">{t(b.stepOf, { n: step })}</p>

          {step === 1 ? (
            <div>
              <h2 id="step-title" className="mt-2 text-2xl font-extrabold tracking-display">
                {b.need.title}
              </h2>
              <fieldset className="mt-6">
                <legend className="flex items-center gap-1 text-sm font-bold">
                  {b.need.asset}
                  <InfoTip label={app.info} className="-my-2">
                    {b.need.body}
                  </InfoTip>
                </legend>
                <div role="radiogroup" aria-label={b.need.asset} className="mt-2 grid grid-cols-2 gap-2">
                  {LOAN_TOKENS.map((sym) => (
                    <Choice key={sym} checked={borrowSymbol === sym} onSelect={() => setBorrowSymbol(sym)}>
                      <span className="text-base font-extrabold">{sym}</span>
                      <span className="text-xs text-muted-foreground">{formatApr(quoteApr(sym, "variable", demo.market, discount), locale)} · {terms.variable}</span>
                    </Choice>
                  ))}
                </div>
              </fieldset>
              <AmountField
                id="borrow-amount"
                label={b.need.amount}
                symbol={borrowSymbol}
                value={amountText}
                onChange={setAmountText}
                error={showErrors ? amountError : null}
              />
              <div role="group" aria-label={b.need.quick} className="mt-3 flex flex-wrap gap-2">
                {QUICK.map((q) => (
                  <Button key={q} size="sm" variant="outline" onClick={() => setAmountText(String(q))}>
                    {formatNumber(q, locale)} {borrowSymbol}
                  </Button>
                ))}
              </div>
            </div>
          ) : null}

          {step === 2 ? (
            <div>
              <h2 id="step-title" className="mt-2 text-2xl font-extrabold tracking-display">
                {b.lock.title}
              </h2>
              <fieldset className="mt-6">
                <legend className="flex items-center gap-1 text-sm font-bold">
                  {b.lock.asset}
                  <InfoTip label={app.info} className="-my-2">
                    {b.lock.body}
                  </InfoTip>
                </legend>
                <div role="radiogroup" aria-label={b.lock.asset} className="mt-2 grid gap-2 sm:grid-cols-3">
                  {COLLATERALS.map((sym) => {
                    const p = COLLATERAL_PARAMS[sym]
                    return (
                      <Choice key={sym} checked={collateralSymbol === sym} onSelect={() => setCollateralSymbol(sym)}>
                        <span className="text-base font-extrabold">{sym}</span>
                        <span className="text-xs text-muted-foreground">
                          {t(b.lock.balance, { amount: formatToken(demo.wallet.balances[sym], sym, locale) })}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {t(b.lock.limit, { pct: formatPercent(p.maxLtv + levelLtvBonus(level), locale) })}
                        </span>
                      </Choice>
                    )
                  })}
                </div>
              </fieldset>
              <AmountField
                id="collateral-amount"
                label={b.lock.amount}
                symbol={collateralSymbol}
                value={collateralText}
                onChange={setCollateralText}
                error={showErrors ? collateralError : null}
                hint={collateral ? t(b.lock.worth, { usd: formatUsd(collUsd, locale) }) : t(b.lock.balance, { amount: formatToken(balance, collateralSymbol, locale) })}
              />
              {amount && suggested > 0 ? (
                <div className="mt-3 flex items-center gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={suggested > balance}
                    onClick={() => setCollateralText(String(suggested))}
                  >
                    <SparklesIcon aria-hidden="true" />
                    {t(b.lock.suggest, { amount: formatToken(suggested, collateralSymbol, locale) })}
                  </Button>
                  <InfoTip label={app.info}>{b.lock.suggestHint}</InfoTip>
                </div>
              ) : null}
            </div>
          ) : null}

          {step === 3 ? (
            <div>
              <h2 id="step-title" className="mt-2 text-2xl font-extrabold tracking-display">
                {b.terms.title}
              </h2>
              <fieldset className="mt-6">
                <legend className="text-sm font-bold">{b.terms.term}</legend>
                <div role="radiogroup" aria-label={b.terms.term} className="mt-2 grid grid-cols-3 gap-2">
                  {TERMS.map((d) => (
                    <Choice key={d} checked={termDays === d} onSelect={() => setTermDays(d)} center>
                      <span className="text-base font-extrabold">{t(terms.days, { n: d })}</span>
                    </Choice>
                  ))}
                </div>
                <p className="mt-2 text-xs text-muted-foreground">{t(b.terms.termHint, { date: formatDate(dueAt, locale) })}</p>
              </fieldset>
              <fieldset className="mt-6">
                <legend className="text-sm font-bold">{b.terms.rate}</legend>
                <div role="radiogroup" aria-label={b.terms.rate} className="mt-2 grid gap-2 sm:grid-cols-2">
                  {(["variable", "fixed"] as const).map((k) => (
                    <Choice key={k} checked={rateKind === k} onSelect={() => setRateKind(k)}>
                      <span className="flex items-baseline justify-between gap-2">
                        <span className="text-base font-extrabold">{k === "fixed" ? terms.fixed : terms.variable}</span>
                        <span className="tabular-nums text-sm font-bold">{formatApr(quoteApr(borrowSymbol, k, demo.market, discount), locale)}</span>
                      </span>
                      <span className="text-xs text-muted-foreground">{k === "fixed" ? b.terms.fixedHint : b.terms.variableHint}</span>
                    </Choice>
                  ))}
                </div>
                {discount > 0 ? (
                  <p className="mt-2 text-xs text-muted-foreground">
                    {t(b.terms.discount, { level: app.level.names[level], pts: formatNumber(discount, locale, 2, 2) })}
                  </p>
                ) : null}
              </fieldset>
              <dl className="mt-6 divide-y rounded-2xl border text-sm">
                <div className="flex items-center justify-between gap-4 px-4 py-3">
                  <dt className="text-muted-foreground">{b.terms.interest}</dt>
                  <dd className="tabular-nums font-semibold">{formatToken(interest, borrowSymbol, locale)}</dd>
                </div>
                <div className="flex items-center justify-between gap-4 px-4 py-3">
                  <dt className="text-muted-foreground">{t(b.terms.total, { date: formatDate(dueAt, locale) })}</dt>
                  <dd className="tabular-nums font-bold">{totalLabel}</dd>
                </div>
              </dl>
            </div>
          ) : null}

          {step === 4 ? (
            <div>
              <h2 id="step-title" className="mt-2 text-2xl font-extrabold tracking-display">
                {done ? b.review.done : b.review.title}
              </h2>
              {done ? (
                <div className="mt-4 flex flex-col items-start gap-4">
                  <div className="flex items-center gap-4">
                    <span className="bx-drop rounded-full border-2 border-primary px-3 py-1 tabular-nums text-sm font-bold">{collLabel}</span>
                    <Padlock locked className="h-16 w-14" />
                  </div>
                  <p className="text-muted-foreground">{t(b.review.doneBody, { amount: amountLabel, collateral: collLabel })}</p>
                  <Button asChild size="lg">
                    <Link href={href(locale, opened ? `/app/loan/${opened}` : "/app")}>
                      {b.review.view}
                      <ArrowRightIcon aria-hidden="true" />
                    </Link>
                  </Button>
                </div>
              ) : (
                <>
                  <p className="mt-3 text-lg">
                    {t(b.review.sentence, { collateral: collLabel, amount: amountLabel, total: totalLabel, date: formatDate(dueAt, locale) })}
                  </p>
                  <div className="mt-6 flex items-start gap-3 rounded-2xl border p-4">
                    <Checkbox
                      id="ack"
                      checked={ack}
                      disabled={busy}
                      onCheckedChange={(v) => setAck(v === true)}
                      aria-invalid={showErrors && !ack}
                      aria-describedby="ack-error"
                      className="mt-0.5"
                    />
                    <Label htmlFor="ack" className="text-sm leading-relaxed font-semibold">
                      {t(b.review.ack, { price: formatUsd(liqPrice, locale), date: formatDate(dueAt, locale) })}
                    </Label>
                  </div>
                  <p id="ack-error" role={showErrors && !ack ? "alert" : undefined} className="mt-1 min-h-5 text-sm text-destructive">
                    {showErrors && !ack ? b.review.ackRequired : ""}
                  </p>
                  <h3 className="mt-4 text-sm font-bold">{b.review.steps}</h3>
                  <TxSteps
                    className="mt-3"
                    steps={[
                      { label: t(b.review.step1, { amount: collLabel }), state: approveTx.state, done: allowanceOk && approveTx.state.phase === "idle" },
                      { label: t(b.review.step2, { collateral: collLabel, amount: amountLabel }), state: openTx.state },
                    ]}
                  />
                  {openTx.state.phase === "pending" ? (
                    <div className="mt-4 flex items-center gap-4" aria-hidden="true">
                      <span className="bx-drop rounded-full border-2 border-primary px-3 py-1 tabular-nums text-sm font-bold">{collLabel}</span>
                      <Padlock locked={false} className="h-14 w-12" />
                    </div>
                  ) : null}
                  {failed ? (
                    <div role="alert" className="mt-4 flex items-start gap-2 rounded-2xl border border-destructive/40 bg-destructive/5 p-3.5 text-sm">
                      <XCircleIcon className="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden="true" />
                      <span>
                        <span className="font-bold text-destructive">{app.tx.failed}. </span>
                        {failed.error === "rejected" ? app.tx.rejected : app.tx.reverted}
                      </span>
                    </div>
                  ) : null}
                  <div className="mt-6 flex flex-col gap-3">
                    <Button size="lg" onClick={() => void sign()} disabled={busy} className="sm:self-start">
                      {failed ? <RotateCcwIcon aria-hidden="true" /> : <PenLineIcon aria-hidden="true" />}
                      {failed ? app.tx.retry : approveTx.state.phase === "confirmed" ? b.review.continue : b.review.go}
                    </Button>
                  </div>
                </>
              )}
            </div>
          ) : null}

          {!done ? (
            <div className="mt-8 flex items-center justify-between gap-3 border-t pt-5">
              {step > 1 ? (
                <Button variant="ghost" onClick={() => go((step - 1) as Step)} disabled={busy}>
                  <ArrowLeftIcon aria-hidden="true" />
                  {b.back}
                </Button>
              ) : (
                <span />
              )}
              {step < 4 ? (
                <Button size="lg" onClick={next}>
                  {b.next}
                  <ArrowRightIcon aria-hidden="true" />
                </Button>
              ) : null}
            </div>
          ) : null}
        </section>

        <aside aria-labelledby="summary-title" className="rounded-3xl border bg-card p-5 sm:p-6 lg:sticky lg:top-24">
          <div className="flex items-center justify-between gap-3">
            <h2 id="summary-title" className="eyebrow text-muted-foreground">
              {b.summary.title}
            </h2>
            {Number.isFinite(health) ? <RiskBadge risk={riskLevel(health)} label={terms.risk[riskLevel(health)]} /> : null}
          </div>
          <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
            <SummaryItem label={b.summary.borrow} value={amount ? amountLabel : "—"} />
            <SummaryItem label={b.summary.lock} value={collateral ? collLabel : "—"} />
            <SummaryItem label={b.summary.rate} value={`${rateKind === "fixed" ? terms.fixed : terms.variable} · ${formatApr(apr, locale)}`} />
            <SummaryItem label={b.summary.due} value={formatDate(dueAt, locale)} />
            <SummaryItem label={terms.health} value={Number.isFinite(health) ? formatHealth(health, locale) : "—"} />
            <SummaryItem label={b.summary.total} value={amount ? totalLabel : "—"} />
          </dl>
          <div className="mt-5 border-t pt-4">
            {amount && collateral ? (
              <SafetyRunway symbol={collateralSymbol} price={collPrice} liqPrice={liqPrice} locale={locale} labels={terms.runway} />
            ) : (
              <p className="text-sm text-muted-foreground">{b.summary.incomplete}</p>
            )}
          </div>
        </aside>
      </div>
    </div>
  )
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="truncate font-semibold">{value}</dd>
    </div>
  )
}

function Choice({ checked, onSelect, children, center }: { checked: boolean; onSelect: () => void; children: ReactNode; center?: boolean }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={checked}
      onClick={onSelect}
      className={cn(
        "flex min-h-14 flex-col gap-0.5 rounded-2xl border-2 px-4 py-3 text-left transition-colors duration-150",
        center && "items-center justify-center text-center",
        checked ? "border-primary bg-primary/5" : "border-border hover:border-input"
      )}
    >
      {children}
    </button>
  )
}

function AmountField({
  id,
  label,
  symbol,
  value,
  onChange,
  error,
  hint,
}: {
  id: string
  label: string
  symbol: string
  value: string
  onChange: (v: string) => void
  error: string | null
  hint?: string
}) {
  return (
    <div className="mt-6 flex flex-col gap-2">
      <Label htmlFor={id} className="font-bold">
        {label}
      </Label>
      <div className="relative">
        <Input
          id={id}
          inputMode="decimal"
          autoComplete="off"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={!!error}
          aria-describedby={`${id}-hint ${id}-error`}
          className="h-14 pr-24 tabular-nums text-xl"
        />
        <span className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-sm font-bold text-muted-foreground">{symbol}</span>
      </div>
      {hint ? (
        <p id={`${id}-hint`} className="text-xs text-muted-foreground">
          {hint}
        </p>
      ) : null}
      <p id={`${id}-error`} role={error ? "alert" : undefined} className="min-h-5 text-sm text-destructive">
        {error ?? ""}
      </p>
    </div>
  )
}
