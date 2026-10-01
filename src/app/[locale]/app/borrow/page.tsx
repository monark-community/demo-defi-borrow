import type { Metadata } from "next"

import { BorrowWizard } from "@/components/demo/borrow-wizard"
import { isLocale } from "@/i18n/config"
import { getDictionary } from "@/i18n"
import { pageMetadata } from "@/lib/metadata"

export async function generateMetadata({ params }: PageProps<"/[locale]/app/borrow">): Promise<Metadata> {
  const { locale } = await params
  if (!isLocale(locale)) return {}
  const m = getDictionary(locale).meta.pages.borrow
  return pageMetadata(locale, "/app/borrow", m.title, m.description)
}

export default function BorrowPage() {
  return <BorrowWizard />
}
