"use client"

import { CoinsIcon } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { DemoControls as MonarkDemoControls } from "@/components/ui/demo-controls"
import { faucet } from "@/lib/demo/ops"
import { resetDemo, setSettings, useDemo } from "@/lib/demo/store"
import { NETWORK_NAME } from "@/lib/demo/tokens"

import { useAppCopy } from "./app-provider"

/**
 * The app's one demo element: a pill showing the (simulated) network that
 * opens the demo controls: network speed, forced failure, faucet, reset.
 */
export function DemoControls() {
  const demo = useDemo()
  const { app } = useAppCopy()
  const c = app.controls
  if (!demo) return null

  return (
    <MonarkDemoControls
      networkName={NETWORK_NAME}
      slow={demo.settings.slow}
      onSlowChange={(v) => setSettings({ slow: v })}
      failNext={demo.settings.failNext}
      onFailNextChange={(v) => setSettings({ failNext: v })}
      onReset={() => {
        resetDemo()
        toast.success(c.resetDone)
      }}
      title={c.title}
      openLabel={c.open}
      slowLabel={c.slow}
      slowHint={c.slowHint}
      failNextLabel={c.failNext}
      failNextHint={c.failNextHint}
      resetLabel={c.reset}
      resetHint={c.resetHint}
      resetConfirmTitle={c.resetConfirm}
      resetConfirmBody={c.resetConfirmBody}
      resetConfirmLabel={c.resetDo}
      cancelLabel={c.cancel}
      closeLabel={app.close}
    >
      {/* BorrowX's faucet: test stablecoins to repay with. */}
      <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-bold">{c.faucet}</p>
          <p className="mt-1 text-xs text-muted-foreground">{c.faucetHint}</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="shrink-0"
          onClick={() => {
            faucet()
            toast.success(c.faucetDone)
          }}
        >
          <CoinsIcon aria-hidden="true" />
          {c.faucetDo}
        </Button>
      </div>
    </MonarkDemoControls>
  )
}
