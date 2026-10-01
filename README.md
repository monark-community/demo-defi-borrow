# BorrowX by Monark

**Borrow against your crypto, with eyes open.** BorrowX is the borrower's side of the Monark DeFi demos: a guided experience across your loans that shows what you lock, what you receive, the price that would put your collateral at risk, and what you owe right now.

It is a testnet reference implementation for Monark's community of students, developers, ambassadors and partners. Everything runs on a **simulated testnet** in the browser: no real chain, wallet, funds or backend.

- Project brief: https://www.monark.io/en/project/defi-borrow
- Sibling demos: [Fluidswap](https://fluidswap.monark.io/) (trading), [Yieldmine](https://yieldmine.monark.io/) (lending for yield), [VaultLend](https://vaultlend.monark.io/) (protocol risk)
- Site plan: [`docs/site-plan.md`](docs/site-plan.md) · Assets and credits: [`docs/assets.md`](docs/assets.md)

> Testnet demo · not financial advice · no real funds

## What you can do in the demo

1. **Connect** the demo wallet (sign or reject a sign-in message).
2. **Request a loan** in four steps: what you need (tUSDC or tDAI), what you lock (tETH, tWBTC or tLINK, with a suggested safe amount), your terms (30/90/180 days, fixed or variable), then review and sign two transactions (allowance, then lock and borrow).
3. **Track it**: the overview sums up every open loan (total owed, lowest health, next due date) with a card per loan; each loan's page shows the amount owed ticking up every second, the safety runway with its liquidation price, and the repayment path with the due date and grace period.
4. **Repay** in part or in full, then withdraw your collateral.
5. **Move the market** from the strip under the title ("Simulate the market") or skip ahead in time, and watch loans become at risk, get rescued with more collateral, or get liquidated automatically. One price move hits every loan that uses that collateral.
6. **Hold several loans**: "Explore a running example" loads three, and "New loan" opens another beside them.

## Run it locally

Requirements: Node 22 and pnpm 10.

```bash
pnpm install
pnpm dev            # http://localhost:3000
```

Other scripts:

```bash
pnpm lint           # ESLint (next/core-web-vitals + TypeScript)
pnpm typecheck      # next typegen && tsc --noEmit
pnpm build          # production build (every page prerenders)
pnpm start          # serve the production build
pnpm screenshots    # Playwright screenshots of every page and flow (needs a running server, see below)
```

`BASE_URL=http://localhost:3000 pnpm screenshots` writes to `docs/screenshots/<locale>-<width>-<theme>-<name>.png` (390px and 1440px, light and dark, plus French). Install the browser once with `pnpm exec playwright install chromium`.

No environment variables are needed. `NEXT_PUBLIC_SITE_URL` optionally overrides the canonical URL (default `https://borrowx.monark.io`).

## How the simulation works

All mock data and behaviour live in a small typed data layer, `src/lib/demo/`. UI components only call its hooks and operations, so it can be replaced by wagmi/viem and a real contract without touching the UI.

| File | Role |
|-|-|
| `types.ts` | Domain types: loan, events, wallet, market, keeper job, transaction states. |
| `tokens.ts` | The shared Monark DeFi testnet tokens and reference prices (tETH $3,200, tWBTC $64,000, tUSDC $1, tDAI $1, tLINK $14.50), collateral parameters, rates. |
| `loan-math.ts` | Pure maths: health factor, liquidation price, simple interest, liquidation breakdown, borrower levels. |
| `store.ts` | External store persisted to `localStorage` (every access in try/catch), the demo clock, and the wallet-prompt promise. |
| `chain.ts` | `useTx()`: wallet prompt → pending with a hash (1.2–2.4 s, or 3–6 s on "slow network") → confirmed or failed. |
| `wallet.ts` | Simulated connection (sign-in message, reject path). |
| `ops.ts` | Every state change, by loan id: approve, open, repay, add collateral, withdraw, archive, market moves, time skips, and the per-loan keeper that liquidates a loan below health 1.00 or past its grace period. |
| `portfolio.ts` | Views across loans: totals, the weakest loan, the next due, collateral locked per token. |
| `seed.ts` | The example wallet (Sam Rivera), a past repaid loan, and the three "running example" loans. |

Rules the demo enforces:

- Health factor = collateral value × liquidation threshold ÷ debt. Safe ≥ 1.50, at risk 1.00–1.50, liquidatable < 1.00 (always shown with a word, not colour alone).
- Collateral: tETH 75% max LTV / 82% liquidation threshold, tWBTC 70% / 78%, tLINK 55% / 65%.
- Variable APR: 5.40% tUSDC, 5.10% tDAI (+2.00 points in high demand). Fixed = variable + 1.25 points, locked at opening. Borrower levels take 0.25 or 0.50 points off.
- Interest is simple interest on the outstanding principal, per second; repayments pay interest first.
- After the due date there is a 3-day grace period; then the loan is liquidated like a price liquidation: the liquidator repays the debt and receives collateral worth the debt plus 5%, and the rest comes back to the borrower.

The **Demo controls** (the "Sepolia testnet" pill beside each app page title) toggle a slow network, force the next transaction to fail, add test stablecoins, and **Reset demo**.

## Project structure

```
src/
  app/
    [locale]/            en and fr routes: home, how-it-works, credits, pricing (unlinked), app/, app/borrow/, app/loan/[id]/, 404, error, OG image
    globals.css          Monark 2026 tokens (cream / espresso), motion
    sitemap.ts robots.ts icon.svg
  proxy.ts               redirects / to the visitor's language
  components/
    site/                standard Monark header (brand, Demo chip), footer, locale and theme switches
    loan/                safety runway, padlock, risk badge (shared by site and app)
    home/                hero loan card
    demo/                the interactive app (overview, loan page, market strip, wizard, dialogs, wallet prompt, tx feedback)
    ui/                  shadcn/ui and @monark registry components (wallet, connect-wallet, token-amount, network-badge, tx-status)
  i18n/                  typed EN/FR dictionaries
  lib/demo/              simulated chain, wallet and loan (see above)
docs/                    site plan, assets, screenshots
scripts/screenshots.mjs  Playwright visual check
```

## Deploy to Vercel

Import the repository in Vercel and deploy with the framework defaults (Next.js, `pnpm install`, `pnpm build`). No `vercel.json` and no environment variables are required. Node is pinned to 22.x in `package.json`.

## Stack

Next.js 16 (App Router, TypeScript strict), Tailwind CSS 4, shadcn/ui on the [Monark UI registry](https://ui.monark.io), Lucide icons, Nunito Sans. Branded per the Monark brand guidelines (flat orange, cream and espresso themes, "BorrowX by Monark").

## License and credits

Open source by the Monark community. Photos from Unsplash (see `docs/assets.md` and `/credits`).
