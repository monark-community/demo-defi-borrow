"use client"

import { CoinsIcon, HandCoinsIcon } from "lucide-react"
import { useState, type ReactNode } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { t } from "@/i18n/t"
import { useTx } from "@/lib/demo/chain"
import { COLLATERAL_PARAMS, parseAmount } from "@/lib/demo/tokens"
import { healthFactor, positionOf } from "@/lib/demo/loan-math"
import { faucet, repay } from "@/lib/demo/ops"
import { useDemo, useDemoNow } from "@/lib/demo/store"
import type { Loan } from "@/lib/demo/types"
import { formatHealth, formatNumber, formatPercent, formatToken } from "@/lib/format"
import { cn } from "@/lib/utils"

import { Amount } from "./amount"
import { useAppCopy } from "./app-provider"
import { Disclaimer } from "./disclaimer"
import { TxFeedback } from "./tx-feedback"

type Mode = "partial" | "full"

export function RepayDialog({ loan, disabled }: { loan: Loan; disabled?: boolean }) {
  const demo = useDemo()
  const now = useDemoNow(1000)
  const { app, terms, locale, disclaimer } = useAppCopy()
  const r = app.repay
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<Mode>("partial")
  const [text, setText] = useState("")
  const [touched, setTouched] = useState(false)
  const tx = useTx()
  if (!demo) return null

  const sym = loan.borrowSymbol
  const pos = positionOf(loan, demo.market, now)
  const owed = pos.owed
  const interestNow = owed - loan.outstanding
  const balance = demo.wallet.balances[sym]
  const parsed = parseAmount(text)
  const pay = mode === "full" ? owed : (parsed ?? 0)

  let error: string | null = null
  if (mode === "partial") {
    if (parsed === null || parsed <= 0) error = r.errors.empty
    else if (parsed > owed + 0.000001) error = r.errors.tooMuch
  }
  const short = pay - balance
  const lacking = !error && short > 0.000001

  const interestPart = Math.min(pay, interestNow)
  const principalPart = Math.max(0, Math.min(loan.outstanding, pay - interestPart))
  const remaining = Math.max(0, owed - pay)
  const { liquidationThreshold } = COLLATERAL_PARAMS[loan.collateralSymbol]
  const healthAfter = healthFactor(pos.collateralUsd, liquidationThreshold, remaining * demo.market.prices[sym])

  const busy = tx.busy
  const submit = async () => {
    setTouched(true)
    if (error || lacking || busy) return
    const full = mode === "full"
    const payText = formatToken(pay, sym, locale)
    const ok = await tx.run(
      {
        title: full ? r.submitFull : t(app.summaries.repay, { amount: payText }),
        rows: [
          { label: app.summaries.rows.pays, value: payText },
          { label: app.summaries.rows.newHealth, value: full ? terms.noDebt : formatHealth(healthAfter, locale) },
          ...(full ? [{ label: app.summaries.rows.receiveBack, value: formatToken(loan.collateral, loan.collateralSymbol, locale) }] : []),
        ],
        movesValue: true,
      },
      (hash) => repay(full ? "full" : pay, hash)
    )
    if (ok) {
      setOpen(false)
      toast.success(full ? r.doneFull : t(r.done, { amount: payText }))
      reset()
    }
  }

  const reset = () => {
    setText("")
    setTouched(false)
    setMode("partial")
    tx.reset()
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (busy) return
        setOpen(o)
        if (!o) reset()
      }}
    >
      <DialogTrigger asChild>
        <Button size="lg" className="flex-1" disabled={disabled}>
          <HandCoinsIcon aria-hidden="true" />
          {app.actions.repay}
        </Button>
      </DialogTrigger>
      <DialogContent closeLabel={app.close} className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-extrabold">{r.title}</DialogTitle>
          <DialogDescription>{r.body}</DialogDescription>
        </DialogHeader>

        <div role="radiogroup" aria-label={r.title} className="grid grid-cols-2 gap-1 rounded-full border p-1">
          {(["partial", "full"] as const).map((m) => (
            <button
              key={m}
              type="button"
              role="radio"
              aria-checked={mode === m}
              disabled={busy}
              onClick={() => {
                setMode(m)
                tx.reset()
              }}
              className={cn(
                "h-10 rounded-full text-sm font-bold transition-colors",
                mode === m ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {m === "partial" ? r.partial : r.full}
            </button>
          ))}
        </div>

        {mode === "partial" ? (
          <div className="flex flex-col gap-2">
            <Label htmlFor="repay-amount" className="font-bold">
              {r.amount}
            </Label>
            <div className="relative">
              <Input
                id="repay-amount"
                inputMode="decimal"
                autoComplete="off"
                value={text}
                disabled={busy}
                onChange={(e) => {
                  setText(e.target.value)
                  tx.reset()
                }}
                onBlur={() => setTouched(true)}
                aria-invalid={touched && !!error}
                aria-describedby="repay-hint repay-error"
                className="h-12 pr-20 tabular-nums text-lg"
              />
              <span className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-sm font-semibold text-muted-foreground">{sym}</span>
            </div>
            <p id="repay-hint" className="text-xs text-muted-foreground">
              {t(r.wallet, { amount: formatToken(balance, sym, locale) })}
            </p>
            <div className="flex flex-wrap gap-2" role="group" aria-label={r.quick}>
              {[0.25, 0.5].map((f) => (
                <Button
                  key={f}
                  size="xs"
                  variant="outline"
                  disabled={busy}
                  onClick={() => {
                    setText(formatNumber(Math.floor(owed * f * 100) / 100, "en", 2).replace(/,/g, ""))
                    tx.reset()
                  }}
                >
                  {formatPercent(f, locale)}
                </Button>
              ))}
            </div>
            <p id="repay-error" role={touched && error ? "alert" : undefined} className="min-h-5 text-sm text-destructive">
              {touched && error ? error : ""}
            </p>
          </div>
        ) : (
          <div className="rounded-2xl border bg-muted/40 p-4">
            <p className="tabular-nums text-2xl font-bold ">{formatToken(owed, sym, locale, 4)}</p>
            <p className="mt-1 text-xs text-muted-foreground">{r.fullNote}</p>
            <p className="mt-3 text-sm font-semibold">{t(r.unlock, { amount: formatToken(loan.collateral, loan.collateralSymbol, locale) })}</p>
          </div>
        )}

        {!error || mode === "full" ? (
          <dl className="divide-y rounded-2xl border text-sm">
            <div className="px-4 py-2.5 text-xs font-bold text-muted-foreground">{r.covers}</div>
            <Row label={r.interest}>
              <Amount value={interestPart} symbol={sym} digits={4} />
            </Row>
            <Row label={r.principal}>
              <Amount value={principalPart} symbol={sym} />
            </Row>
            <Row label={r.remaining}>
              <Amount value={remaining} symbol={sym} />
            </Row>
            <Row label={r.newHealth}>
              <span className="tabular-nums font-semibold">{remaining <= 0.000001 ? terms.noDebt : formatHealth(healthAfter, locale)}</span>
            </Row>
          </dl>
        ) : null}

        {lacking ? (
          <div role="alert" className="flex flex-col gap-2 rounded-2xl border border-warning/50 bg-warning/10 p-3.5 text-sm sm:flex-row sm:items-center sm:justify-between">
            <span className="font-semibold">{t(r.errors.balance, { amount: formatNumber(Math.ceil(short * 100) / 100, locale, 2), token: sym })}</span>
            <Button size="sm" variant="outline" onClick={() => faucet()} className="shrink-0">
              <CoinsIcon aria-hidden="true" />
              {r.getTokens}
            </Button>
          </div>
        ) : null}

        <TxFeedback state={tx.state} onRetry={() => void submit()} onDismiss={tx.reset} />

        <div className="flex flex-col gap-3">
          <Button size="lg" onClick={() => void submit()} disabled={busy || lacking}>
            {mode === "full" ? r.submitFull : t(r.submit, { amount: parsed ? formatToken(parsed, sym, locale) : sym })}
          </Button>
          <Disclaimer text={disclaimer} />
        </div>
      </DialogContent>
    </Dialog>
  )
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-2.5">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-semibold">{children}</dd>
    </div>
  )
}
