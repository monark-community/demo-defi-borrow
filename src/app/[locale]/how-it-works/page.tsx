import { ArrowRightIcon, CircleAlertIcon } from "lucide-react"
import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import type { ReactNode } from "react"

import { SafetyRunway } from "@/components/loan/safety-runway"
import { SectionDivider } from "@/components/site/section-divider"
import { Button } from "@/components/ui/button"
import { href, isLocale, PROJECT_DOC_URL, REPO_URL } from "@/i18n/config"
import { getDictionary } from "@/i18n"
import { liquidationPrice } from "@/lib/demo/loan-math"
import { COLLATERALS, COLLATERAL_PARAMS, TOKENS } from "@/lib/demo/tokens"
import { formatPercent, formatUsd } from "@/lib/format"
import { pageMetadata } from "@/lib/metadata"

import studyImg from "../../../../public/images/study-table.jpg"

export async function generateMetadata({ params }: PageProps<"/[locale]/how-it-works">): Promise<Metadata> {
  const { locale } = await params
  if (!isLocale(locale)) return {}
  const m = getDictionary(locale).meta.pages.how
  return pageMetadata(locale, "/how-it-works", m.title, m.description)
}

function H2({ id, children }: { id: string; children: ReactNode }) {
  return (
    <h2 id={id} className="scroll-mt-24 text-3xl font-bold tracking-display sm:text-[2rem]">
      {children}
    </h2>
  )
}

export default async function HowItWorksPage({ params }: PageProps<"/[locale]/how-it-works">) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()
  const dict = getDictionary(locale)
  const h = dict.how
  const lt = dict.loanTerms

  return (
    <>
      {/* Intro */}
      <section aria-labelledby="how-title" className="mx-auto grid w-full max-w-6xl gap-10 px-4 pt-12 pb-14 sm:px-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:items-center lg:pt-16">
        <div>
          <p className="eyebrow text-primary-ink">{h.eyebrow}</p>
          <h1 id="how-title" className="mt-3 text-4xl font-extrabold tracking-display sm:text-5xl">
            {h.title}
          </h1>
          <p className="mt-5 max-w-[60ch] text-lg text-muted-foreground">{h.intro}</p>
        </div>
        <div className="overflow-hidden rounded-3xl border">
          <Image src={studyImg} alt={h.photoAlt} placeholder="blur" priority sizes="(min-width: 1024px) 520px, 100vw" className="aspect-[3/2] h-auto w-full object-cover" />
        </div>
      </section>

      <SectionDivider />

      {/* A loan's life */}
      <section aria-labelledby="life-title" className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6 lg:py-16">
        <H2 id="life-title">{h.life.title}</H2>
        <p className="mt-4 max-w-[62ch] text-muted-foreground">{h.life.body}</p>
        <ol className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {h.life.stages.map((s, i) => (
            <li key={s.title} className="relative rounded-2xl border bg-card p-4">
              <span className="flex size-8 items-center justify-center rounded-full border-2 border-primary text-sm font-bold" aria-hidden="true">
                {i + 1}
              </span>
              <h3 className="mt-3 font-bold">{s.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{s.body}</p>
            </li>
          ))}
        </ol>
        <p className="mt-4 flex items-start gap-2 rounded-2xl border border-dashed border-destructive/50 p-4 text-sm">
          <CircleAlertIcon className="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden="true" />
          {h.life.branch}
        </p>
      </section>

      {/* Collateral table */}
      <section aria-labelledby="collateral-title" className="border-y bg-secondary/50">
        <div className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6 lg:py-16">
          <H2 id="collateral-title">{h.collateral.title}</H2>
          <p className="mt-4 max-w-[62ch] text-muted-foreground">{h.collateral.body}</p>
          <div className="mt-8 overflow-x-auto rounded-2xl border bg-card">
            <table className="w-full min-w-[32rem] text-left text-sm">
              <thead>
                <tr className="border-b">
                  {h.collateral.headers.map((th) => (
                    <th key={th} scope="col" className="px-4 py-3 font-bold">
                      {th}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {COLLATERALS.map((sym) => (
                  <tr key={sym}>
                    <th scope="row" className="px-4 py-3 font-bold">
                      {sym}
                    </th>
                    <td className="px-4 py-3 tabular-nums">{formatUsd(TOKENS[sym].usd, locale)}</td>
                    <td className="px-4 py-3 tabular-nums">{formatPercent(COLLATERAL_PARAMS[sym].maxLtv, locale)}</td>
                    <td className="px-4 py-3 tabular-nums">{formatPercent(COLLATERAL_PARAMS[sym].liquidationThreshold, locale)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">{h.collateral.note}</p>
        </div>
      </section>

      {/* Health */}
      <section aria-labelledby="health-title" className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-2 lg:py-16">
        <div>
          <H2 id="health-title">{h.health.title}</H2>
          <p className="mt-4 text-muted-foreground">{h.health.body}</p>
          <p className="mt-5 rounded-2xl border bg-card px-4 py-3 font-mono text-sm">{h.health.formula}</p>
          <ol className="mt-5 flex flex-col gap-2 text-sm">
            {h.health.example.map((line) => (
              <li key={line} className="font-mono">
                {line}
              </li>
            ))}
          </ol>
        </div>
        <div className="rounded-3xl border bg-card p-5 sm:p-7 lg:self-center">
          <SafetyRunway symbol="tETH" price={3200} liqPrice={liquidationPrice(2000, 1.2, 0.82)} locale={locale} labels={lt.runway} scaleMax={3200 * 1.3} />
          <p className="mt-5 border-t pt-4 text-sm text-muted-foreground">{h.health.liq}</p>
        </div>
      </section>

      {/* Interest */}
      <section aria-labelledby="interest-title" className="border-y bg-secondary/50">
        <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-2 lg:py-16">
          <div>
            <H2 id="interest-title">{h.interest.title}</H2>
            <p className="mt-4 text-muted-foreground">{h.interest.body}</p>
            <p className="mt-5 rounded-2xl border bg-card px-4 py-3 font-mono text-sm">{h.interest.formula}</p>
          </div>
          <ul className="flex flex-col gap-3 text-sm lg:self-center">
            <li className="rounded-2xl border bg-card p-4">{h.interest.fixed}</li>
            <li className="rounded-2xl border bg-card p-4">{h.interest.variable}</li>
            <li className="rounded-2xl border border-dashed border-input p-4 font-mono">{h.interest.example}</li>
          </ul>
        </div>
      </section>

      {/* Terms + liquidation */}
      <section className="mx-auto grid w-full max-w-6xl gap-12 px-4 py-14 sm:px-6 lg:grid-cols-2 lg:py-16">
        <div aria-labelledby="terms-title">
          <H2 id="terms-title">{h.terms.title}</H2>
          <p className="mt-4 text-muted-foreground">{h.terms.body}</p>
          <div className="mt-6" aria-hidden="true">
            <div className="relative h-1.5 rounded-full bg-muted">
              <div className="absolute inset-y-0 left-0 w-3/4 rounded-full bg-primary" />
              <div className="absolute inset-y-0 right-0 w-1/4 rounded-r-full bg-warning/50" />
            </div>
            <div className="mt-2 flex justify-between text-xs font-semibold text-muted-foreground">
              <span>{dict.app.path.opened}</span>
              <span>{dict.app.path.due}</span>
              <span>{dict.app.path.grace}</span>
            </div>
          </div>
        </div>
        <div aria-labelledby="liquidation">
          <H2 id="liquidation">{h.liquidation.title}</H2>
          <p className="mt-4 text-muted-foreground">{h.liquidation.body}</p>
          <ol className="mt-5 flex flex-col gap-3">
            {h.liquidation.steps.map((s, i) => (
              <li key={s} className="flex gap-3 text-sm">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-xs font-bold text-destructive" aria-hidden="true">
                  {i + 1}
                </span>
                {s}
              </li>
            ))}
          </ol>
          <p className="mt-4 text-sm text-muted-foreground">{h.liquidation.note}</p>
        </div>
      </section>

      {/* Levels */}
      <section aria-labelledby="levels-title" className="border-y bg-secondary/50">
        <div className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6 lg:py-16">
          <H2 id="levels-title">{h.levels.title}</H2>
          <p className="mt-4 max-w-[62ch] text-muted-foreground">{h.levels.body}</p>
          <ol className="mt-8 grid gap-3 md:grid-cols-3">
            {h.levels.items.map((l, i) => (
              <li key={l.name} className="rounded-2xl border bg-card p-4">
                <div className="flex gap-1" aria-hidden="true">
                  {[0, 1, 2].map((j) => (
                    <span key={j} className={j <= i ? "h-1.5 flex-1 rounded-full bg-primary" : "h-1.5 flex-1 rounded-full bg-muted"} />
                  ))}
                </div>
                <h3 className="mt-3 font-bold">{l.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{l.body}</p>
              </li>
            ))}
          </ol>
          <p className="mt-3 text-sm text-muted-foreground">{h.levels.reset}</p>
        </div>
      </section>

      {/* Developers */}
      <section aria-labelledby="dev-title" className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6 lg:py-16">
        <H2 id="dev-title">{h.developers.title}</H2>
        <p className="mt-4 max-w-[62ch] text-muted-foreground">{h.developers.body}</p>
        <pre className="mt-6 overflow-x-auto rounded-2xl border bg-card p-4 font-mono text-xs leading-relaxed sm:text-sm">
          <code>{h.developers.code}</code>
        </pre>
        <p className="mt-4 max-w-[62ch] text-muted-foreground">{h.developers.pool}</p>
        <ul className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm font-semibold">
          <li>
            <a href={REPO_URL} className="inline-flex min-h-11 items-center text-primary-ink underline underline-offset-4">
              {h.developers.repo}
            </a>
          </li>
          <li>
            <a href={PROJECT_DOC_URL.replace("/en/", `/${locale}/`)} className="inline-flex min-h-11 items-center text-primary-ink underline underline-offset-4">
              {h.developers.doc}
            </a>
          </li>
        </ul>
      </section>

      <SectionDivider />

      <section aria-labelledby="cta-title" className="mx-auto w-full max-w-6xl px-4 py-16 text-center sm:px-6">
        <h2 id="cta-title" className="text-3xl font-extrabold tracking-display">
          {h.cta.title}
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-muted-foreground">{h.cta.body}</p>
        <Button asChild size="lg" className="mt-7">
          <Link href={href(locale, "/app")}>
            {h.cta.button}
            <ArrowRightIcon aria-hidden="true" />
          </Link>
        </Button>
        <p className="mt-4 text-xs text-muted-foreground">{dict.common.disclaimer}</p>
      </section>
    </>
  )
}
