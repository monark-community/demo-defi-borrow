"use client"

import { LockIcon, RotateCcwIcon, XCircleIcon } from "lucide-react"
import { useState, type ReactNode } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { t } from "@/i18n/t"
import { useTx } from "@/lib/demo/chain"
import { healthFactor, liquidationPrice, positionOf, rescueOptions } from "@/lib/demo/loan-math"
import { addCollateral, approveCollateral } from "@/lib/demo/ops"
import { useDemo, useDemoNow } from "@/lib/demo/store"
import { COLLATERAL_PARAMS, RESCUE_HEALTH, SAFE_HEALTH, parseAmount } from "@/lib/demo/tokens"
import type { Loan } from "@/lib/demo/types"
import { ceilDisplay, formatHealth, formatToken, formatUsd } from "@/lib/format"

import { useAppCopy } from "./app-provider"
import { Disclaimer } from "./disclaimer"
import { TxSteps } from "./tx-steps"

export function AddCollateralDialog({ loan, disabled }: { loan: Loan; disabled?: boolean }) {
  const demo = useDemo()
  const now = useDemoNow(1000)
  const { app, locale, disclaimer } = useAppCopy()
  const a = app.add
  const [open, setOpen] = useState(false)
  const [text, setText] = useState("")
  const [touched, setTouched] = useState(false)
  const approveTx = useTx()
  const addTx = useTx()
  if (!demo) return null

  const sym = loan.collateralSymbol
  const balance = demo.wallet.balances[sym]
  const allowance = demo.wallet.allowances[sym]
  const parsed = parseAmount(text)
  const pos = positionOf(loan, demo.market, now)
  const { liquidationThreshold } = COLLATERAL_PARAMS[sym]
  const rescue = pos.health < SAFE_HEALTH ? ceilDisplay(rescueOptions(loan, demo.market, now, RESCUE_HEALTH).addCollateral, sym) : 0

  let error: string | null = null
  if (parsed === null || parsed <= 0) error = a.errors.empty
  else if (parsed > balance + 0.000001) error = a.errors.balance

  const newCollateral = loan.collateral + (parsed ?? 0)
  const healthAfter = healthFactor(newCollateral * demo.market.prices[sym], liquidationThreshold, pos.debtUsd)
  const liqAfter = liquidationPrice(pos.debtUsd, newCollateral, liquidationThreshold)
  const busy = approveTx.busy || addTx.busy
  const needsApproval = !!parsed && allowance + 0.000001 < parsed
  const failed = approveTx.state.phase === "failed" ? approveTx.state : addTx.state.phase === "failed" ? addTx.state : null

  const reset = () => {
    setText("")
    setTouched(false)
    approveTx.reset()
    addTx.reset()
  }

  const submit = async () => {
    setTouched(true)
    if (error || busy || parsed === null) return
    const amountText = formatToken(parsed, sym, locale)
    if (allowance + 0.000001 < parsed) {
      const ok = await approveTx.run(
        {
          title: t(app.summaries.approve, { amount: amountText }),
          rows: [{ label: app.summaries.rows.spender, value: app.summaries.rows.contract }],
          movesValue: false,
        },
        (hash) => approveCollateral(sym, parsed, hash)
      )
      if (!ok) return
    }
    const ok = await addTx.run(
      {
        title: t(app.summaries.add, { amount: amountText }),
        rows: [
          { label: app.summaries.rows.lock, value: amountText },
          { label: app.summaries.rows.newHealth, value: formatHealth(healthAfter, locale) },
        ],
        movesValue: true,
      },
      (hash) => addCollateral(parsed, hash)
    )
    if (ok) {
      setOpen(false)
      toast.success(t(a.done, { amount: amountText }))
      reset()
    }
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
        <Button size="lg" variant="outline" className="flex-1" disabled={disabled}>
          <LockIcon aria-hidden="true" />
          {app.actions.add}
        </Button>
      </DialogTrigger>
      <DialogContent closeLabel={app.close} className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-extrabold">{a.title}</DialogTitle>
          <DialogDescription>{t(a.body, { token: sym })}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-2">
          <Label htmlFor="add-amount" className="font-bold">
            {a.amount}
          </Label>
          <div className="relative">
            <Input
              id="add-amount"
              inputMode="decimal"
              autoComplete="off"
              value={text}
              disabled={busy}
              onChange={(e) => {
                setText(e.target.value)
                approveTx.reset()
                addTx.reset()
              }}
              onBlur={() => setTouched(true)}
              aria-invalid={touched && !!error}
              aria-describedby="add-hint add-error"
              className="h-12 pr-20 tabular-nums text-lg"
            />
            <span className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-sm font-semibold text-muted-foreground">{sym}</span>
          </div>
          <p id="add-hint" className="text-xs text-muted-foreground">
            {t(a.wallet, { amount: formatToken(balance, sym, locale) })}
          </p>
          {rescue > 0 ? (
            <Button
              size="sm"
              variant="outline"
              className="self-start"
              disabled={busy || rescue > balance}
              onClick={() => setText(String(rescue))}
            >
              {t(a.suggested, { amount: formatToken(rescue, sym, locale) })}
            </Button>
          ) : null}
          <p id="add-error" role={touched && error ? "alert" : undefined} className="min-h-5 text-sm text-destructive">
            {touched && error ? error : ""}
          </p>
        </div>

        {!error ? (
          <dl className="divide-y rounded-2xl border text-sm">
            <Row label={a.newHealth}>
              <span className="tabular-nums">
                {formatHealth(pos.health, locale)} → {formatHealth(healthAfter, locale)}
              </span>
            </Row>
            <Row label={a.newLiq}>
              <span className="tabular-nums">
                {formatUsd(pos.liqPrice, locale)} → {formatUsd(liqAfter, locale)}
              </span>
            </Row>
          </dl>
        ) : null}

        {parsed && !error && (needsApproval || approveTx.state.phase !== "idle") ? (
          <TxSteps
            steps={[
              { label: t(a.step1, { amount: formatToken(parsed, sym, locale) }), state: approveTx.state },
              { label: t(a.step2, { amount: formatToken(parsed, sym, locale) }), state: addTx.state },
            ]}
          />
        ) : parsed && !error && addTx.state.phase !== "idle" ? (
          <TxSteps steps={[{ label: t(a.step2, { amount: formatToken(parsed, sym, locale) }), state: addTx.state }]} />
        ) : null}

        {failed ? (
          <div role="alert" className="flex items-start gap-2 rounded-2xl border border-destructive/40 bg-destructive/5 p-3.5 text-sm">
            <XCircleIcon className="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden="true" />
            <span>
              <span className="font-bold text-destructive">{app.tx.failed}. </span>
              {failed.error === "rejected" ? app.tx.rejected : app.tx.reverted}
            </span>
          </div>
        ) : null}

        <div className="flex flex-col gap-3">
          <Button size="lg" onClick={() => void submit()} disabled={busy}>
            {failed ? <RotateCcwIcon aria-hidden="true" /> : <LockIcon aria-hidden="true" />}
            {failed ? app.tx.retry : a.submit}
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
