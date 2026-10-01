"use client"

import { useEffect, useState, useSyncExternalStore } from "react"

import { createSeed } from "./seed"
import type { DemoSettings, DemoState, Loan, TxSummary, WalletState } from "./types"

/**
 * The demo's single source of truth: a tiny external store persisted to
 * localStorage (every access in try/catch). Swapping to a real chain means
 * replacing this module, chain.ts and ops.ts; the UI only uses the hooks
 * and the operations.
 */

const STORAGE_KEY = "borrowx-demo-v1"

let state: DemoState | null = null
let storageOk = true
const listeners = new Set<() => void>()

function emit() {
  for (const l of listeners) l()
}

function persist() {
  if (!state) return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    storageOk = true
  } catch {
    storageOk = false
  }
}

/** Version 1 held a single `loan` and `keeper`; version 2 holds a list of loans. */
interface DemoStateV1 extends Omit<DemoState, "version" | "loans" | "keepers"> {
  version: 1
  loan: Loan | null
}

function migrate(parsed: DemoState | DemoStateV1): DemoState | null {
  if (parsed?.version === 1) {
    const { loan, ...rest } = parsed
    // A pending liquidation is dropped: checkTerms re-detects it on load.
    return { ...rest, version: 2, loans: loan ? [loan] : [], keepers: {} } as DemoState
  }
  if (parsed?.version === 2 && Array.isArray(parsed.loans)) return { ...parsed, keepers: parsed.keepers ?? {} }
  return null
}

function load(): DemoState | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = migrate(JSON.parse(raw) as DemoState | DemoStateV1)
    if (!parsed || !parsed.wallet || !Array.isArray(parsed.history)) return null
    // A reload never resumes a half-finished connection.
    if (parsed.wallet.status === "connecting") parsed.wallet.status = "disconnected"
    // Nor a liquidation that was mid-flight: checkTerms starts it again.
    parsed.keepers = {}
    return parsed
  } catch {
    storageOk = false
    return null
  }
}

/** Load saved state, or seed the example wallet. Idempotent. */
export function initDemo(): DemoState {
  if (!state) {
    state = load() ?? createSeed(Date.now())
    persist()
    emit()
  }
  return state
}

export function resetDemo() {
  const connected = state?.wallet.status === "connected"
  state = createSeed(Date.now())
  if (connected) state.wallet.status = "connected"
  persist()
  emit()
}

export function update(fn: (s: DemoState) => DemoState) {
  if (!state) return
  state = fn(state)
  persist()
  emit()
}

export function setWallet(patch: Partial<WalletState>) {
  update((s) => ({ ...s, wallet: { ...s.wallet, ...patch } }))
}

export function setSettings(patch: Partial<DemoSettings>) {
  update((s) => ({ ...s, settings: { ...s.settings, ...patch } }))
}

export function getDemo() {
  return state
}

/** The demo clock: real time plus the visitor's "skip ahead" offset. */
export function demoNow(): number {
  return Date.now() + (state?.settings.timeOffsetMs ?? 0)
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

/** Current demo state, or null until it has loaded on the client. */
export function useDemo(): DemoState | null {
  return useSyncExternalStore(subscribe, () => state, () => null)
}

export function useStorageOk(): boolean {
  return useSyncExternalStore(subscribe, () => storageOk, () => true)
}

/** The demo clock, re-read every `intervalMs` (live interest, countdowns). */
export function useDemoNow(intervalMs = 1000): number {
  const demo = useDemo()
  const offset = demo?.settings.timeOffsetMs ?? 0
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), intervalMs)
    return () => window.clearInterval(id)
  }, [intervalMs])
  return now + offset
}

/* ---------------------------------------------------------------------------
 * Simulated wallet prompt: a promise resolved by the WalletPrompt dialog.
 * ------------------------------------------------------------------------ */

export interface PromptRequest {
  summary: TxSummary
  resolve: (approved: boolean) => void
}

let prompt: PromptRequest | null = null
const promptListeners = new Set<() => void>()

export function requestSignature(summary: TxSummary): Promise<boolean> {
  return new Promise((resolve) => {
    prompt?.resolve(false)
    prompt = {
      summary,
      resolve: (ok) => {
        prompt = null
        for (const l of promptListeners) l()
        resolve(ok)
      },
    }
    for (const l of promptListeners) l()
  })
}

export function usePrompt(): PromptRequest | null {
  return useSyncExternalStore(
    (l) => {
      promptListeners.add(l)
      return () => promptListeners.delete(l)
    },
    () => prompt,
    () => null
  )
}
