"use client"

import { ArrowLeftIcon } from "lucide-react"
import Link from "next/link"

import { Padlock } from "@/components/loan/padlock"
import { Button } from "@/components/ui/button"
import { href } from "@/i18n/config"
import { useDemo } from "@/lib/demo/store"

import { ActiveLoan } from "./active-loan"
import { AppHeader } from "./app-header"
import { useAppCopy } from "./app-provider"
import { ClosedLoan } from "./closed-loan"
import { useLoanName } from "./loan-card"
import { MarketStrip } from "./market-strip"

/** /app/loan/[id]: one loan, open, closed or already in history. */
export function LoanPage({ id }: { id: string }) {
  const demo = useDemo()
  const { app, locale } = useAppCopy()
  const name = useLoanName()
  if (!demo) return null
  const current = demo.loans.find((l) => l.id === id)
  const loan = current ?? demo.history.find((l) => l.id === id)
  const active = loan?.status === "active"

  return (
    <div className="flex flex-col gap-6">
      <header>
        <Link
          href={href(locale, "/app")}
          className="inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground"
        >
          <ArrowLeftIcon className="size-4" aria-hidden="true" />
          {app.loans.back}
        </Link>
        <AppHeader className="mt-1">
          <h1 className="text-3xl font-extrabold tracking-display sm:text-4xl">{loan ? name(loan) : app.loans.title}</h1>
        </AppHeader>
      </header>

      {!loan ? (
        <section className="mx-auto flex max-w-lg flex-col items-center py-10 text-center">
          <Padlock locked={false} className="h-24 w-20" />
          <p className="mt-6 text-lg font-semibold">{app.loans.notFound}</p>
          <Button asChild size="lg" className="mt-6">
            <Link href={href(locale, "/app")}>{app.loans.back}</Link>
          </Button>
        </section>
      ) : active ? (
        <>
          <MarketStrip focus={loan.collateralSymbol} />
          <ActiveLoan loan={loan} />
        </>
      ) : (
        <ClosedLoan loan={loan} archived={!current} />
      )}
    </div>
  )
}
