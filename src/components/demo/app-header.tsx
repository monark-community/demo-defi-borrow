import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

import { DemoControls } from "./demo-controls"

/** A demo page's title row: optional page actions, then the one network + demo controls pill, on the right. */
export function AppHeader({ children, actions, className }: { children: ReactNode; actions?: ReactNode; className?: string }) {
  return (
    <header className={cn("flex flex-wrap items-center gap-3", className)}>
      {children}
      <div className="ml-auto flex items-center gap-2">
        {actions}
        <DemoControls />
      </div>
    </header>
  )
}
