import Image from "next/image"
import Link from "next/link"

/**
 * The Monark product brand (brand guidelines §2): the colour butterfly mark,
 * then the product name, on one line. No "by Monark" here: that credit lives
 * in the footer's Monark band.
 */
export function Brand({ href, name, label }: { href: string; name: string; label: string }) {
  return (
    <Link href={href} aria-label={label} className="flex shrink-0 items-center gap-2.5 rounded-md py-1 pr-1 whitespace-nowrap">
      <Image src="/brand/monark-mark.svg" alt="" width={28} height={28} unoptimized priority className="size-7" />
      <span className="text-lg leading-none font-extrabold tracking-[-0.02em] text-foreground">{name}</span>
    </Link>
  )
}
