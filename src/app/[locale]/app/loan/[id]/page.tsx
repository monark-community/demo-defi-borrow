import type { Metadata } from "next"

import { LoanPage } from "@/components/demo/loan-page"
import { isLocale } from "@/i18n/config"
import { getDictionary } from "@/i18n"
import { SEEDED_LOAN_IDS } from "@/lib/demo/seed"
import { pageMetadata } from "@/lib/metadata"

/**
 * Loans live in the visitor's browser, so ids are only known there. The
 * seeded ones prerender; any other id renders on demand, and the client
 * shows the loan (or "not found") once the demo state has loaded.
 */
export function generateStaticParams() {
  return SEEDED_LOAN_IDS.map((id) => ({ id }))
}

export async function generateMetadata({ params }: PageProps<"/[locale]/app/loan/[id]">): Promise<Metadata> {
  const { locale } = await params
  if (!isLocale(locale)) return {}
  const m = getDictionary(locale).meta.pages.app
  // Per-visitor pages: canonical is the demo itself, and they stay out of search.
  return { ...pageMetadata(locale, "/app", m.title, m.description), robots: { index: false, follow: true } }
}

export default async function LoanDetailPage({ params }: PageProps<"/[locale]/app/loan/[id]">) {
  const { id } = await params
  return <LoanPage id={id} />
}
