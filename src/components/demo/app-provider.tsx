"use client"

import { useTheme } from "next-themes"
import { createContext, useContext, useEffect, type ReactNode } from "react"
import { Toaster } from "sonner"

import type { Dictionary } from "@/i18n"
import type { Locale } from "@/i18n/config"
import { checkTerms } from "@/lib/demo/ops"
import { initDemo } from "@/lib/demo/store"

import { WalletPrompt } from "./wallet-prompt"

export interface AppCopy {
  locale: Locale
  app: Dictionary["app"]
  terms: Dictionary["loanTerms"]
  disclaimer: string
  demoBadge: string
}

const AppContext = createContext<AppCopy | null>(null)

export function useAppCopy(): AppCopy {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error("useAppCopy must be used inside <AppProvider>")
  return ctx
}

export function AppProvider({ value, children }: { value: AppCopy; children: ReactNode }) {
  const { resolvedTheme } = useTheme()
  useEffect(() => {
    initDemo()
    // Resume any automatic enforcement that was due while the page was closed.
    checkTerms()
  }, [])

  return (
    <AppContext.Provider value={value}>
      {children}
      <WalletPrompt />
      <Toaster
        theme={resolvedTheme === "dark" ? "dark" : "light"}
        // Top-right, just under the sticky 64px header and the app strip:
        // page titles are left-aligned, so that corner never holds the
        // loan figures a toast reports on. On phones sonner goes full width
        // below the header, above the page title rather than the numbers.
        position="top-right"
        offset={{ top: 80, right: 24 }}
        mobileOffset={{ top: 72, left: 16, right: 16 }}
        toastOptions={{
          classNames: {
            toast: "!rounded-2xl !border !border-border !bg-popover !text-popover-foreground !font-sans !shadow-md",
            description: "!text-muted-foreground",
          },
        }}
      />
    </AppContext.Provider>
  )
}
