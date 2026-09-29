"use client"

import { ArrowRightIcon, CheckCircle2Icon, CircleAlertIcon, UnlockIcon } from "lucide-react"
import Link from "next/link"

import { Padlock } from "@/components/loan/padlock"
import { Button } from "@/components/ui/button"
import { TxStatus } from "@/components/ui/tx-status"
import { href } from "@/i18n/config"
import { t } from "@/i18n/t"
import { useTx } from "@/lib/demo/chain"
import { archiveLoan, withdrawCollateral } from "@/lib/demo/ops"
import type { Loan } from "@/lib/demo/types"
import { formatToken, formatUsd } from "@/lib/format"

import { Amount } from "./amount"
import { useAppCopy } from "./app-provider"
import { LoanActivity } from "./loan-activity"
import { TxFeedback } from "./tx-feedback"

/** A repaid or liquidated loan: what happened, then take the collateral back and start again. */
export function ClosedLoan({ loan }: { loan: Loan }) {
  const { app, locale } = useAppCopy()
  const c = app.closed
  const tx = useTx()
  const liquidated = loan.status === "liquidated"
  const repaidEvent = loan.events.find((e) => e.kind === "repaidFull")
  const withdrawn = loan.events.some((e) => e.kind === "withdrawn")
  const canStart = loan.withdrawable <= 0
  const collText = formatToken(loan.withdrawable, loan.collateralSymbol, locale)

  const withdraw = async () => {
    const amount = collText
    // The card itself confirms it ("Collateral withdrawn to your wallet."), so no toast.
    await tx.run(
      {
        title: t(app.summaries.withdraw, { amount }),
        rows: [{ label: app.summaries.rows.receiveBack, value: amount }],
        movesValue: true,
      },
      (hash) => withdrawCollateral(hash)
    )
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] lg:items-start">
      <section
        aria-labelledby="closed-title"
        className={
          liquidated ? "rounded-3xl border border-destructive/40 bg-card p-5 sm:p-7" : "rounded-3xl border border-success/40 bg-card p-5 sm:p-7"
        }
      >
        <div className="flex items-start gap-4">
          {liquidated ? (
            <CircleAlertIcon className="mt-1 size-9 shrink-0 text-destructive" strokeWidth={1.75} aria-hidden="true" />
          ) : (
            <Padlock locked={false} className="h-14 w-12 shrink-0" />
          )}
          <div className="min-w-0">
            <h2 id="closed-title" className="text-2xl font-extrabold tracking-display sm:text-3xl">
              {liquidated ? c.liquidatedTitle : c.repaidTitle}
            </h2>
            {liquidated && loan.liquidation ? (
              <p className="mt-2 text-muted-foreground">
                {loan.liquidation.reason === "term"
                  ? c.liquidatedTerm
                  : t(c.liquidatedPrice, { token: loan.collateralSymbol, price: formatUsd(loan.liquidation.price, locale) })}
              </p>
            ) : (
              <>
                <p className="mt-2 text-muted-foreground">
                  {t(c.repaidBody, {
                    amount: formatToken(loan.principal + loan.totalInterestPaid, loan.borrowSymbol, locale),
                    interest: formatToken(loan.totalInterestPaid, loan.borrowSymbol, locale),
                  })}
                </p>
                <p className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-success">
                  <CheckCircle2Icon className="size-4" aria-hidden="true" />
                  {loan.onTime ? c.repaidOnTime : c.repaidLate}
                </p>
                {repaidEvent ? <TxStatus status="confirmed" hash={repaidEvent.hash} label={app.tx.confirmed} className="mt-3 max-w-full" /> : null}
              </>
            )}
          </div>
        </div>

        {liquidated && loan.liquidation ? <Breakdown loan={loan} /> : null}

        <div className="mt-6 flex flex-col gap-3 border-t pt-5">
          {loan.withdrawable > 0 ? (
            <>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button size="lg" onClick={() => void withdraw()} disabled={tx.busy}>
                  <UnlockIcon aria-hidden="true" />
                  {t(c.withdraw, { amount: collText })}
                </Button>
              </div>
              <TxFeedback state={tx.state} onRetry={() => void withdraw()} onDismiss={tx.reset} />
            </>
          ) : (
            <p className="inline-flex items-center gap-2 text-sm font-semibold">
              <CheckCircle2Icon className="size-4 text-success" aria-hidden="true" />
              {withdrawn ? c.withdrawn : c.nothingLeft}
            </p>
          )}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Button size="lg" variant={canStart ? "default" : "outline"} disabled={!canStart} onClick={() => archiveLoan()}>
              {c.startNew}
              <ArrowRightIcon aria-hidden="true" />
            </Button>
            {liquidated ? (
              <Button asChild variant="link">
                <Link href={href(locale, "/how-it-works#liquidation")}>{c.learn}</Link>
              </Button>
            ) : null}
          </div>
          {!canStart ? <p className="text-xs text-muted-foreground">{c.withdrawFirst}</p> : null}
        </div>
      </section>
      <LoanActivity loan={loan} />
    </div>
  )
}

function Breakdown({ loan }: { loan: Loan }) {
  const { app, locale } = useAppCopy()
  const c = app.closed
  const l = loan.liquidation!
  const total = l.seized + l.returned
  const seizedPct = total > 0 ? ((l.seized - l.penalty) / total) * 100 : 0
  const penaltyPct = total > 0 ? (l.penalty / total) * 100 : 0
  const sym = loan.collateralSymbol

  return (
    <div className="mt-6 rounded-2xl border p-4">
      <h3 className="text-sm font-bold">{t(c.breakdownTitle, { token: sym })}</h3>
      <div className="mt-3 flex h-4 overflow-hidden rounded-full bg-success/40" aria-hidden="true">
        <div className="bg-destructive/60" style={{ width: `${seizedPct}%` }} />
        <div className="bg-destructive" style={{ width: `${penaltyPct}%` }} />
      </div>
      <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="flex items-center gap-1.5 text-muted-foreground">{c.debt}</dt>
          <dd className="mt-0.5 font-semibold">
            <Amount value={l.debtRepaid} symbol={loan.borrowSymbol} />
          </dd>
        </div>
        <div>
          <dt className="flex items-center gap-1.5 text-muted-foreground">
            <span className="size-2.5 rounded-full bg-destructive/60" aria-hidden="true" />
            {c.seized}
          </dt>
          <dd className="mt-0.5 font-semibold">
            <Amount value={l.seized} symbol={sym} />
          </dd>
          <dd className="text-xs text-muted-foreground">
            <span className="mr-1 inline-block size-2 rounded-full bg-destructive" aria-hidden="true" />
            {c.penalty} {formatToken(l.penalty, sym, locale)}
          </dd>
        </div>
        <div>
          <dt className="flex items-center gap-1.5 text-muted-foreground">
            <span className="size-2.5 rounded-full bg-success/60" aria-hidden="true" />
            {c.returned}
          </dt>
          <dd className="mt-0.5 font-semibold">
            <Amount value={l.returned} symbol={sym} />
          </dd>
        </div>
      </dl>
      <p className="mt-3 text-sm text-muted-foreground">{t(c.keep, { amount: formatToken(loan.principal, loan.borrowSymbol, locale) })}</p>
      <TxStatus status="confirmed" hash={l.hash} label={app.tx.confirmed} className="mt-3 max-w-full" />
    </div>
  )
}
