import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

import { DemoControls } from "./demo-controls"

/** A demo page's title row, with the one network + demo controls pill on the right. */
export function AppHeader({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <header className={cn("flex flex-wrap items-center gap-3", className)}>
      {children}
      <div className="ml-auto">
        <DemoControls />
      </div>
    </header>
  )
}
