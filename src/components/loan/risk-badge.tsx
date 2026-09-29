import { CircleAlertIcon, ShieldCheckIcon, TriangleAlertIcon } from "lucide-react"

import type { RiskLevel } from "@/lib/demo/types"
import { cn } from "@/lib/utils"

const TONE: Record<RiskLevel, string> = {
  safe: "border-success/40 bg-success/10 text-success",
  atRisk: "border-warning/40 bg-warning/10 text-warning",
  liquidatable: "border-destructive/40 bg-destructive/10 text-destructive",
}

const ICON = { safe: ShieldCheckIcon, atRisk: TriangleAlertIcon, liquidatable: CircleAlertIcon }

/** Health state as colour + icon + word: never colour alone. */
export function RiskBadge({ risk, label, className }: { risk: RiskLevel; label: string; className?: string }) {
  const Icon = ICON[risk]
  return (
    <span className={cn("inline-flex h-7 items-center gap-1.5 rounded-full border px-2.5 text-xs font-bold", TONE[risk], className)}>
      <Icon className="size-3.5" aria-hidden="true" />
      {label}
    </span>
  )
}
