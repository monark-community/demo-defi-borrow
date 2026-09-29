import { readFile } from "node:fs/promises"
import { join } from "node:path"

import { ImageResponse } from "next/og"

import { isLocale, locales } from "@/i18n/config"
import { getDictionary } from "@/i18n"
import { formatHealth, formatUsd } from "@/lib/format"

export const alt = "BorrowX by Monark"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }))
}

/** Pairing, tagline and the safety runway, drawn flat on cream. */
export default async function OpenGraphImage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params
  const locale = isLocale(raw) ? raw : "en"
  const d = getDictionary(locale)
  const mark = await readFile(join(process.cwd(), "public/brand/monark-mark.svg"), "utf8")
  const markSrc = `data:image/svg+xml;base64,${Buffer.from(mark).toString("base64")}`
  const muted = "#625952"

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#FFF9F3", color: "#15110E", padding: 72 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={markSrc} width={64} height={64} alt="" />
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: 44, fontWeight: 800, lineHeight: 1 }}>BorrowX</span>
            <span style={{ fontSize: 22, color: muted, marginTop: 6 }}>{d.common.byMonark}</span>
          </div>
        </div>
        <div style={{ fontSize: 64, fontWeight: 800, lineHeight: 1.06, letterSpacing: -1.5, maxWidth: 940 }}>{d.meta.ogTagline}</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "flex", position: "relative", height: 22, width: 1056, borderRadius: 11, overflow: "hidden" }}>
            <div style={{ width: 520, background: "#F2C3BC" }} />
            <div style={{ width: 262, background: "#EFD9A8" }} />
            <div style={{ flex: 1, background: "#C4DFCB" }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 22, color: muted }}>
            <span>{d.common.demoBadge}</span>
            <span style={{ color: "#B65000", fontWeight: 700 }}>{`tETH ${formatUsd(3200, locale)} · ${d.loanTerms.health} ${formatHealth(1.5744, locale)}`}</span>
          </div>
        </div>
      </div>
    ),
    size
  )
}
