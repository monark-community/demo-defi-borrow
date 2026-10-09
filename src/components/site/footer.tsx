import Link from "next/link"

import { MONARK_SOCIALS, SiteFooter as MonarkSiteFooter } from "@/components/ui/site-footer"
import { href, REPO_URL, SIBLINGS, type Locale } from "@/i18n/config"
import type { Dictionary } from "@/i18n"

/** The @monark/ui three-band footer with BorrowX's pages and the Monark DeFi family. */
export function SiteFooter({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const c = dict.common
  const f = c.footer
  const socials = MONARK_SOCIALS.map((s) => ({ ...s, label: f.social[s.key as keyof typeof f.social] ?? s.label }))

  return (
    <MonarkSiteFooter
      product={c.product}
      description={f.product}
      links={[
        { href: href(locale), label: c.nav.overview },
        { href: href(locale, "/how-it-works"), label: c.nav.how },
        { href: href(locale, "/app"), label: c.nav.demo },
        { href: href(locale, "/credits"), label: c.nav.credits },
      ]}
      resources={[
        { href: `https://www.monark.io/${locale}/project/defi-borrow`, label: f.projectPage },
        { href: REPO_URL, label: f.repo },
      ]}
      socials={socials}
      copyright={`© ${new Date().getFullYear()} ${f.legal}`}
      demoNotice={c.demoBadge}
      legalLinks={[{ href: href(locale, "/credits"), label: f.photos }]}
      LinkComponent={Link}
      labels={{ productNav: f.productNav, builtBy: f.builtBy, monarkHome: f.monarkHome, tagline: f.tagline, socials: f.socialLabel }}
    >
      <nav aria-label={f.family} className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm md:justify-end">
        <span className="text-muted-foreground">{f.family}</span>
        <ul className="flex flex-wrap gap-x-4 gap-y-1">
          {SIBLINGS.map((s) => (
            <li key={s.name}>
              <a href={s.url} className="inline-flex min-h-11 items-center font-semibold text-primary-ink underline-offset-4 hover:underline md:min-h-0">
                {s.name}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </MonarkSiteFooter>
  )
}
