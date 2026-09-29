import { cn } from "@/lib/utils"

/** Line-art padlock: the collateral lock. The shackle lifts when the loan no longer holds it. */
export function Padlock({ locked, className }: { locked: boolean; className?: string }) {
  return (
    <svg viewBox="0 0 64 76" fill="none" aria-hidden="true" className={cn("text-primary", className)}>
      <path
        d="M20 36V24a12 12 0 0 1 24 0v12"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        className="transition-transform duration-300 ease-out"
        style={{ transform: locked ? "translateY(0)" : "translateY(-10px)" }}
      />
      <rect x="9" y="35" width="46" height="36" rx="9" stroke="currentColor" strokeWidth="3" className="fill-card" />
      <circle cx="32" cy="50" r="4" stroke="currentColor" strokeWidth="2.5" />
      <path d="M32 54v7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  )
}
