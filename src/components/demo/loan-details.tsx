"use client"

import { WalletAddress, WalletCopyButton } from "@/components/ui/wallet"
import { t } from "@/i18n/t"
import { loanApr } from "@/lib/demo/loan-math"
import { useDemo } from "@/lib/demo/store"
import type { Loan } from "@/lib/demo/types"
import { formatApr, formatDate } from "@/lib/format"

import { useAppCopy } from "./app-provider"

export function LoanDetails({ loan }: { loan: Loan }) {
  const demo = useDemo()
  const { app, terms, locale } = useAppCopy()
  if (!demo) return null
  const apr = formatApr(loanApr(loan, demo.market), locale)
  const rows = [
    { label: app.loan.rate, value: loan.rateKind === "fixed" ? t(app.loan.rateFixed, { apr }) : t(app.loan.rateVariable, { apr }) },
    { label: app.loan.term, value: `${t(terms.days, { n: loan.termDays })} · ${t(app.loan.opened, { date: formatDate(loan.openedAt, locale) })}` },
  ]
  return (
    <section aria-labelledby="details-title" className="rounded-3xl border bg-card p-5 sm:p-6">
      <h2 id="details-title" className="eyebrow text-muted-foreground">
        {app.loan.title}
      </h2>
      <dl className="mt-3 flex flex-col divide-y text-sm">
        {rows.map((r) => (
          <div key={r.label} className="flex flex-col gap-0.5 py-2.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
            <dt className="text-muted-foreground">{r.label}</dt>
            <dd className="font-semibold sm:text-right">{r.value}</dd>
          </div>
        ))}
        <div className="flex flex-col gap-0.5 py-2.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <dt className="text-muted-foreground">{app.loan.contract}</dt>
          <dd className="inline-flex items-center gap-1">
            <WalletAddress address={loan.contract} className="text-sm" />
            <WalletCopyButton address={loan.contract} copyLabel={app.wallet.copy} copiedLabel={app.wallet.copied} className="size-9" />
          </dd>
        </div>
      </dl>
    </section>
  )
}
