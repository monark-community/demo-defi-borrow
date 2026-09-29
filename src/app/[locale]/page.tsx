import { ArrowDownLeftIcon, ArrowRightIcon, CheckIcon, CircleHelpIcon, CoinsIcon, HandCoinsIcon, LockIcon, ReceiptTextIcon, ShieldAlertIcon, UnlockIcon } from "lucide-react"
import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"

import { HeroLoanCard } from "@/components/home/hero-loan-card"
import { RiskBadge } from "@/components/loan/risk-badge"
import { SafetyRunway } from "@/components/loan/safety-runway"
import { SectionDivider } from "@/components/site/section-divider"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import { href, isLocale } from "@/i18n/config"
import { getDictionary } from "@/i18n"
import { liquidationPrice } from "@/lib/demo/loan-math"
import { pageMetadata } from "@/lib/metadata"

import lectureImg from "../../../public/images/lecture-hall.jpg"

export async function generateMetadata({ params }: PageProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params
  if (!isLocale(locale)) return {}
  return pageMetadata(locale, "/", null, getDictionary(locale).meta.description)
}

const QUESTION_ICONS = [CoinsIcon, ShieldAlertIcon, ReceiptTextIcon]
const STEP_ICONS = [HandCoinsIcon, LockIcon, ArrowDownLeftIcon, UnlockIcon]
const STATES = ["safe", "atRisk", "liquidatable"] as const

export default async function HomePage({ params }: PageProps<"/[locale]">) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()
  const dict = getDictionary(locale)
  const h = dict.home
  const lt = dict.loanTerms
  const exampleLiq = liquidationPrice(2000, 1.2, 0.82)

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden" aria-labelledby="hero-title">
        <Image
          src="/brand/monark-mesh.svg"
          alt=""
          width={569}
          height={571}
          unoptimized
          priority
          aria-hidden="true"
          className="pointer-events-none absolute -top-28 -right-44 w-[34rem] max-w-none opacity-[0.10] select-none sm:-right-28 lg:-top-20 lg:-right-24 lg:w-[48rem] dark:opacity-[0.16]"
        />
        <div className="relative mx-auto grid max-w-6xl gap-12 px-4 pt-12 pb-16 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-center lg:gap-14 lg:pt-20 lg:pb-24">
          <div>
            <p className="eyebrow text-primary-ink">{h.eyebrow}</p>
            <h1 id="hero-title" className="mt-4 text-[2.25rem] leading-[1.08] font-extrabold tracking-display sm:text-5xl lg:text-[3.75rem]">
              {h.title}
            </h1>
            <p className="mt-5 max-w-[34rem] text-lg text-muted-foreground sm:text-xl">{h.sub}</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button asChild size="lg">
                <Link href={href(locale, "/app")}>
                  {h.ctaPrimary}
                  <ArrowRightIcon aria-hidden="true" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href={href(locale, "/how-it-works")}>{h.ctaSecondary}</Link>
              </Button>
            </div>
            <p className="mt-6 text-xs text-muted-foreground">{dict.common.disclaimer}</p>
          </div>
          <HeroLoanCard locale={locale} copy={h.card} runway={lt.runway} risk={lt.risk} healthLabel={lt.health} />
        </div>
      </section>

      <SectionDivider />

      {/* Three questions */}
      <section aria-labelledby="questions-title" className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 lg:py-20">
        <div className="max-w-2xl">
          <h2 id="questions-title" className="text-3xl font-bold tracking-display sm:text-[2rem]">
            {h.questions.title}
          </h2>
          <p className="mt-4 text-muted-foreground">{h.questions.intro}</p>
        </div>
        <ul className="mt-10 grid gap-8 md:grid-cols-3 md:gap-10">
          {h.questions.items.map((item, i) => {
            const Icon = QUESTION_ICONS[i] ?? CircleHelpIcon
            return (
              <li key={item.q}>
                <Icon className="size-7 text-primary" strokeWidth={1.75} aria-hidden="true" />
                <h3 className="mt-4 text-xl font-bold">{item.q}</h3>
                <p className="mt-2 text-muted-foreground">{item.a}</p>
              </li>
            )
          })}
        </ul>
      </section>

      {/* Four steps */}
      <section aria-labelledby="steps-title" className="border-y bg-secondary/50">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-20">
          <div className="grid gap-4 lg:grid-cols-2 lg:items-end">
            <div>
              <p className="eyebrow text-primary-ink">{h.steps.eyebrow}</p>
              <h2 id="steps-title" className="mt-3 text-3xl font-bold tracking-display sm:text-[2rem]">
                {h.steps.title}
              </h2>
            </div>
            <p className="text-muted-foreground">{h.steps.body}</p>
          </div>
          <ol className="relative mt-12 grid gap-8 md:grid-cols-4 md:gap-6">
            {/* The orange thread that ties the steps together. */}
            <span aria-hidden="true" className="absolute top-6 bottom-6 left-6 w-0.5 bg-primary md:top-6 md:right-[12.5%] md:bottom-auto md:left-[12.5%] md:h-0.5 md:w-auto" />
            {h.steps.items.map((step, i) => {
              const Icon = STEP_ICONS[i] ?? LockIcon
              return (
                <li key={step.title} className="relative flex gap-4 md:flex-col md:items-center md:text-center">
                  <span className="relative flex size-12 shrink-0 items-center justify-center rounded-full border-2 border-primary bg-background">
                    <Icon className="size-5 text-foreground" strokeWidth={1.75} aria-hidden="true" />
                  </span>
                  <div>
                    <p className="text-xs font-bold text-muted-foreground">{String(i + 1).padStart(2, "0")}</p>
                    <h3 className="mt-0.5 text-lg font-bold">{step.title}</h3>
                    <p className="mt-1.5 text-sm text-muted-foreground">{step.body}</p>
                  </div>
                </li>
              )
            })}
          </ol>
        </div>
      </section>

      {/* Safety runway */}
      <section aria-labelledby="runway-title" className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 lg:py-20">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:items-center lg:gap-14">
          <div>
            <p className="eyebrow text-primary-ink">{h.runway.eyebrow}</p>
            <h2 id="runway-title" className="mt-3 text-3xl font-bold tracking-display sm:text-[2rem]">
              {h.runway.title}
            </h2>
            <p className="mt-4 text-muted-foreground">{h.runway.body}</p>
          </div>
          <div className="rounded-3xl border bg-card p-5 sm:p-7">
            <p className="text-sm font-semibold">{h.runway.example}</p>
            <SafetyRunway className="mt-3" symbol="tETH" price={3200} liqPrice={exampleLiq} locale={locale} labels={lt.runway} scaleMax={3200 * 1.3} />
            <ul className="mt-6 flex flex-col gap-4 border-t pt-5">
              {h.runway.states.map((s, i) => (
                <li key={s.label} className="grid gap-1 sm:grid-cols-[9rem_1fr] sm:gap-4">
                  <div>
                    <RiskBadge risk={STATES[i] ?? "safe"} label={s.label} />
                  </div>
                  <p className="text-sm">
                    <span className="font-bold">{s.range}.</span> <span className="text-muted-foreground">{s.body}</span>
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Learning */}
      <section aria-labelledby="learning-title" className="border-y bg-secondary/50">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:items-center lg:gap-14 lg:py-20">
          <div className="overflow-hidden rounded-3xl border">
            <Image
              src={lectureImg}
              alt={h.learning.photoAlt}
              placeholder="blur"
              sizes="(min-width: 1024px) 560px, 100vw"
              className="aspect-[4/3] h-auto w-full object-cover"
            />
          </div>
          <div>
            <p className="eyebrow text-primary-ink">{h.learning.eyebrow}</p>
            <h2 id="learning-title" className="mt-3 text-3xl font-bold tracking-display sm:text-[2rem]">
              {h.learning.title}
            </h2>
            <p className="mt-4 text-muted-foreground">{h.learning.body}</p>
            <ul className="mt-6 flex flex-col gap-2.5">
              {h.learning.points.map((p) => (
                <li key={p} className="flex items-start gap-2.5">
                  <CheckIcon className="mt-1 size-4 shrink-0 text-primary" aria-hidden="true" />
                  {p}
                </li>
              ))}
            </ul>
            <Button asChild variant="outline" size="lg" className="mt-8">
              <Link href={href(locale, "/how-it-works")}>
                {h.learning.cta}
                <ArrowRightIcon aria-hidden="true" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section aria-labelledby="faq-title" className="mx-auto w-full max-w-3xl px-4 py-16 sm:px-6 lg:py-20">
        <h2 id="faq-title" className="text-3xl font-bold tracking-display sm:text-[2rem]">
          {h.faq.title}
        </h2>
        <Accordion type="single" collapsible className="mt-8">
          {h.faq.items.map((item, i) => (
            <AccordionItem key={item.q} value={`q${i}`}>
              <AccordionTrigger className="py-4 text-base font-bold">{item.q}</AccordionTrigger>
              <AccordionContent className="text-base text-muted-foreground">{item.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>

      <SectionDivider />

      {/* Closing */}
      <section aria-labelledby="closing-title" className="mx-auto w-full max-w-6xl px-4 py-16 text-center sm:px-6 lg:py-20">
        <h2 id="closing-title" className="text-3xl font-extrabold tracking-display sm:text-4xl">
          {h.closing.title}
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">{h.closing.body}</p>
        <Button asChild size="lg" className="mt-8">
          <Link href={href(locale, "/app")}>
            {h.closing.cta}
            <ArrowRightIcon aria-hidden="true" />
          </Link>
        </Button>
        <p className="mt-4 text-xs text-muted-foreground">{dict.common.disclaimer}</p>
      </section>
    </>
  )
}
