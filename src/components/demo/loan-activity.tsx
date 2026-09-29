"use client"

import { ArrowDownLeftIcon, ArrowUpRightIcon, CircleAlertIcon, KeyRoundIcon, LockIcon, UnlockIcon } from "lucide-react"

import { TxStatus } from "@/components/ui/tx-status"
import { t } from "@/i18n/t"
import type { Loan, LoanEvent } from "@/lib/demo/types"
import { formatDateTime, formatToken } from "@/lib/format"

import { useAppCopy } from "./app-provider"

const ICONS: Record<LoanEvent["kind"], typeof LockIcon> = {
  approved: KeyRoundIcon,
  opened: ArrowDownLeftIcon,
  repaid: ArrowUpRightIcon,
  repaidFull: ArrowUpRightIcon,
  collateralAdded: LockIcon,
  withdrawn: UnlockIcon,
  liquidated: CircleAlertIcon,
}

/** Every transaction of the loan, newest first, each with its hash. */
export function LoanActivity({ loan }: { loan: Loan }) {
  const { app, locale } = useAppCopy()
  const a = app.activity
  const events = [...loan.events].sort((x, y) => y.at - x.at)

  return (
    <section aria-labelledby="activity-title" className="rounded-3xl border bg-card p-5 sm:p-6">
      <h2 id="activity-title" className="eyebrow text-muted-foreground">
        {a.title}
      </h2>
      {events.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">{a.empty}</p>
      ) : (
        <ol className="mt-4 flex flex-col divide-y">
          {events.map((e) => {
            const Icon = ICONS[e.kind]
            const amount = e.amount !== undefined && e.symbol ? formatToken(e.amount, e.symbol, locale) : ""
            return (
              <li key={e.id} className="flex gap-3 py-3 first:pt-0 last:pb-0">
                <span
                  className={
                    e.kind === "liquidated"
                      ? "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-destructive"
                      : "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary text-foreground"
                  }
                  aria-hidden="true"
                >
                  <Icon className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">{t(a.kinds[e.kind], { amount })}</p>
                  {e.interestPaid !== undefined && e.principalPaid !== undefined && e.symbol ? (
                    <p className="text-xs text-muted-foreground">
                      {t(a.split, {
                        interest: formatToken(e.interestPaid, e.symbol, locale),
                        principal: formatToken(e.principalPaid, e.symbol, locale),
                      })}
                    </p>
                  ) : null}
                  <p className="text-xs text-muted-foreground">{formatDateTime(e.at, locale)}</p>
                  <TxStatus status="confirmed" hash={e.hash} label={app.tx.confirmed} className="mt-1.5 max-w-full" />
                </div>
              </li>
            )
          })}
        </ol>
      )}
    </section>
  )
}
