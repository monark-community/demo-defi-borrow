"use client"

import { Loader2Icon, WalletIcon, XCircleIcon } from "lucide-react"
import Image from "next/image"
import type { ReactNode } from "react"

import { AppLoading } from "@/components/ui/app-loading"
import { Button } from "@/components/ui/button"
import { useDemo, useStorageOk } from "@/lib/demo/store"
import { connectWallet } from "@/lib/demo/wallet"

import { useAppCopy } from "./app-provider"

/**
 * The demo app under the site header. No strip of its own: the network and
 * demo controls sit in one pill beside each page title (AppHeader), and the
 * testnet line lives in the wallet prompt, once per transaction.
 * Gates on wallet connection.
 */
export function AppFrame({ children }: { children: ReactNode }) {
  const demo = useDemo()
  const storageOk = useStorageOk()
  const { app } = useAppCopy()

  return (
    <div className="flex flex-1 flex-col">
      {!storageOk ? (
        <p role="alert" className="mx-auto mt-4 w-full max-w-6xl px-4 text-sm text-warning sm:px-6">
          {app.storageError}
        </p>
      ) : null}
      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-8 sm:px-6 lg:py-10">
        {!demo ? <AppLoading label={app.loading} /> : demo.wallet.status !== "connected" ? <ConnectGate /> : children}
      </div>
    </div>
  )
}

function ConnectGate() {
  const demo = useDemo()
  const { app } = useAppCopy()
  const g = app.gate
  const connecting = demo?.wallet.status === "connecting"
  const rejected = demo?.wallet.lastError === "rejected"

  return (
    <section aria-labelledby="gate-title" className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-center py-8 text-center">
      <Image src="/brand/monark-mark.svg" alt="" width={56} height={56} unoptimized className="size-14" />
      <h1 id="gate-title" className="mt-6 text-3xl font-extrabold tracking-display">
        {g.title}
      </h1>
      <p className="mt-3 text-muted-foreground">{g.body}</p>
      <Button
        size="lg"
        className="mt-8 w-full sm:w-auto"
        disabled={connecting}
        onClick={() =>
          void connectWallet({
            title: app.summaries.signIn,
            rows: [{ label: app.summaries.signInRow, value: app.summaries.signInValue }],
            movesValue: false,
            noFee: true,
          })
        }
      >
        {connecting ? <Loader2Icon className="animate-spin" aria-hidden="true" /> : <WalletIcon aria-hidden="true" />}
        {connecting ? app.wallet.connecting : g.connect}
      </Button>
      <div aria-live="polite" className="mt-4 min-h-6">
        {rejected ? (
          <p role="alert" className="flex items-start gap-2 text-left text-sm text-destructive">
            <XCircleIcon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            {g.rejected}
          </p>
        ) : null}
      </div>
    </section>
  )
}
