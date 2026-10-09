"use client"

import Image from "next/image"
import { useMemo } from "react"

import { WalletPrompt as MonarkWalletPrompt } from "@/components/ui/wallet-prompt"
import { estimateFee } from "@/lib/demo/chain"
import { useDemo, usePrompt } from "@/lib/demo/store"
import { NETWORK_NAME } from "@/lib/demo/tokens"

import { useAppCopy } from "./app-provider"

/** The simulated wallet's confirmation sheet, fed from the demo store. Closing it counts as a rejection. */
export function WalletPrompt() {
  const prompt = usePrompt()
  const demo = useDemo()
  const { app, disclaimer, locale } = useAppCopy()
  const p = app.prompt
  // A fresh fee estimate per request.
  const fee = useMemo(() => (prompt ? estimateFee() : ""), [prompt])
  const summary = prompt?.summary
  const feeText =
    fee && !summary?.noFee ? `${Number(fee).toLocaleString(locale === "fr" ? "fr-CA" : "en-CA", { maximumFractionDigits: 5 })} tETH` : undefined

  return (
    <MonarkWalletPrompt
      open={!!prompt}
      title={summary?.title ?? p.title}
      description={p.title}
      site={
        <>
          <Image src="/brand/monark-mark.svg" alt="" width={20} height={20} unoptimized />
          {p.site}
        </>
      }
      account={demo ? { name: demo.wallet.name, address: demo.wallet.address } : undefined}
      rows={summary?.rows}
      network={NETWORK_NAME}
      networkLabel={p.network}
      fee={feeText}
      feeLabel={p.fee}
      // The testnet line appears once per value-moving transaction; a free signature says it moves nothing.
      disclaimer={summary?.movesValue ? disclaimer : summary?.noFee ? p.simulated : null}
      warning={!!summary?.movesValue}
      confirmLabel={p.confirm}
      rejectLabel={p.reject}
      closeLabel={app.close}
      onConfirm={() => prompt?.resolve(true)}
      onReject={() => prompt?.resolve(false)}
    />
  )
}
