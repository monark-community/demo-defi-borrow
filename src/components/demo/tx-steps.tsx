"use client"

import { CheckIcon, Loader2Icon, WalletIcon, XIcon } from "lucide-react"

import { TxStatus } from "@/components/ui/tx-status"
import type { TxState } from "@/lib/demo/types"
import { cn } from "@/lib/utils"

import { useAppCopy } from "./app-provider"

export interface TxStep {
  label: string
  state: TxState
  /** Already done earlier (e.g. an allowance that is still valid). */
  done?: boolean
}

/** A numbered list of transactions with each one's live state. */
export function TxSteps({ steps, className }: { steps: TxStep[]; className?: string }) {
  const { app } = useAppCopy()
  return (
    <ol className={cn("flex flex-col gap-3", className)}>
      {steps.map((step, i) => {
        const phase = step.done ? "confirmed" : step.state.phase
        return (
          <li key={step.label} className="flex items-start gap-3">
            <span
              aria-hidden="true"
              className={cn(
                "mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold",
                phase === "confirmed" && "border-success bg-success/10 text-success",
                phase === "failed" && "border-destructive bg-destructive/10 text-destructive",
                (phase === "signing" || phase === "pending") && "border-primary text-primary",
                phase === "idle" && "border-input text-muted-foreground"
              )}
            >
              {phase === "confirmed" ? (
                <CheckIcon className="size-4" />
              ) : phase === "failed" ? (
                <XIcon className="size-4" />
              ) : phase === "pending" ? (
                <Loader2Icon className="size-4 animate-spin" />
              ) : phase === "signing" ? (
                <WalletIcon className="size-3.5" />
              ) : (
                i + 1
              )}
            </span>
            <div className="min-w-0 flex-1">
              <p className={cn("text-sm font-semibold", phase === "idle" && "text-muted-foreground")}>{step.label}</p>
              <p className="sr-only">
                {phase === "confirmed" ? app.tx.confirmed : phase === "failed" ? app.tx.failed : phase === "pending" ? app.tx.pending : phase === "signing" ? app.tx.signing : ""}
              </p>
              {phase === "signing" ? <p className="mt-1 text-xs text-muted-foreground">{app.tx.signing}</p> : null}
              {step.state.hash && !step.done ? (
                <TxStatus
                  className="mt-1.5"
                  status={phase === "confirmed" ? "confirmed" : phase === "failed" ? "failed" : "pending"}
                  hash={step.state.hash}
                  label={phase === "confirmed" ? app.tx.confirmed : phase === "failed" ? app.tx.failed : app.tx.pending}
                />
              ) : null}
            </div>
          </li>
        )
      })}
    </ol>
  )
}
