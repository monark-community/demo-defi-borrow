# BorrowX: site plan

Status: shipped on `develop`. This plan describes what the site does and is kept in sync with the code (see "Decisions made while building" at the end). A simplification pass (less text, context on demand, one top bar, standard header) is recorded in `docs/simplification.md`.

- Product: **BorrowX**, the borrower's side of the Monark DeFi family.
- Authoritative description: https://www.monark.io/en/project/defi-borrow
- Branding: **Monark-branded** (`true`). `lovable-migration/monark-brand-guidelines.md` is binding.
- Stack: Next.js 16 (App Router, `src/`, TypeScript strict), pnpm, Tailwind CSS v4, shadcn/ui on the Monark UI registry (`@monark`), `lucide-react`. No chart library: the only "charts" are a price track and a timeline, drawn in SVG/CSS.

---

## 1. Product brief

**What the documentation says.** BorrowX focuses on *the borrowing experience* of a DeFi protocol: users request loans, submit collateral and monitor repayment. Collateral is locked in a smart contract; loan terms (APR, expiration) are enforced automatically. The deliverables list wallet sign-in, collateral deposit and loan creation, full and partial repayment with interest accrual, a continuously computed health factor with simulated liquidation, a borrowing dashboard with sliders and collateral visuals, and, as a bonus, fixed/variable interest and borrowing tiers that simulate credit scoring. It can run standalone or plug into a liquidity pool such as VaultLend. It is a teaching project: financial modelling, precise maths, time-based state.

**Target users.**

- **Students and workshop participants** (Monark's education mission) who want to *feel* how a collateralised loan behaves: what locking collateral means, why a price drop matters, what a due date does on-chain.
- **Developers** in the Monark community building or reviewing a borrowing front end, who need a reference for a clear, honest borrower UX.
- **Ambassadors and partners** running DeFi 101 sessions, who need a safe, simulated tool to demo live.

**Core job to be done.** *"Before I borrow against my crypto, tell me in plain words how much I can safely take, what would make me lose my collateral, and what I owe right now, then walk me through it one step at a time."*

**Positioning in the family.** BorrowX is the **borrower's simple, guided experience, one loan at a time**. It does not show pool-wide risk (VaultLend), lending yield (Yieldmine) or trading (Fluidswap).

**Domain concepts** (each explained in plain words the first time the site uses it):

| Concept | Meaning in BorrowX |
|-|-|
| Collateral | The tokens you lock to secure the loan (tETH, tWBTC or tLINK). You get them back when you repay. |
| Loan asset | What you borrow: tUSDC or tDAI, testnet stablecoins worth $1. |
| Loan-to-value (LTV) | How much you borrow compared with what you lock. Each collateral has a **maximum LTV** (tETH 75%). |
| Liquidation threshold | The LTV at which your collateral can be sold to repay the loan (tETH 82%). |
| Health factor | Collateral value × liquidation threshold ÷ what you owe. **Safe** at 1.50 or more, **at risk** between 1.00 and 1.50, **liquidatable** below 1.00. |
| Liquidation price | The collateral price at which the health factor reaches 1.00. BorrowX leads with this: "tETH can fall 36% before your collateral is sold." |
| Safety runway | BorrowX's visual: a price track from today's price down to the liquidation price, coloured green / amber / red. |
| APR, fixed or variable | The yearly interest rate. **Fixed** is locked when the loan opens. **Variable** follows demand in the pool and can go up or down. |
| Accrued interest | Interest added every second on what is still owed (simple interest on the outstanding principal). |
| Term and due date | 30, 90 or 180 days. After the due date there is a 3-day grace period; then the contract closes the loan by selling collateral. |
| Liquidation | A liquidator repays your debt and receives collateral worth the debt plus a 5% penalty. The rest of your collateral comes back to you. |
| Borrower level | A simulated credit score: on-time repayments move you from *New* to *Steady* to *Trusted*, which lowers your rate. A liquidation resets it. |

**What the Lovable version got wrong or left out.**

- It was a lender-style market dashboard (total liquidity, "45.2K active users", "top lending pools") that overlaps with Yieldmine and VaultLend instead of serving a borrower.
- No loan *terms* at all: no duration, no due date, no expiration, although automatic enforcement of APR and expiry is the heart of the brief. Fixed/variable was a dead select.
- The health factor was a bare number with jargon ("Health Factor 2.50"). Nothing told the borrower *what price* would get them liquidated, and nothing ever moved the price, so liquidation was never shown.
- Borrow, deposit and repay changed numbers instantly: no wallet prompt, no pending, confirmed or failed states, no transaction hashes, nothing persisted.
- Hype and unverifiable claims ("audited by top security firms with $2.8B+ locked", "no credit checks"), mainnet token names (USDC, USDT), a blue-to-purple gradient logo, English only, no disclaimers.
- Repaying never returned the collateral; there was no end to a loan.

## 2. Value proposition

**BorrowX shows students and builders in the Monark community exactly what a crypto-backed loan will cost and what could make them lose their collateral, before they sign, then guides them through borrowing, protecting and repaying one loan in plain language, on a safe simulated testnet.**

Supporting benefits, as outcomes:

1. **You know your limit before you sign.** You see the price that would put your collateral at risk and how far away it is, not a bare ratio.
2. **You are never surprised by what you owe.** The amount due ticks up live, the due date is always in view, and every payment shows what it covered.
3. **You learn the mechanics by living them.** Move the market, skip ahead in time, and watch a loan become risky, get rescued or get liquidated, with each step explained.

## 3. Hero

- **Headline** (7 words): *Borrow against your crypto, with eyes open.*
  FR: *Empruntez sur vos cryptos, en toute lucidité.*
- **Subheadline:** *See what you lock, what you owe, and the price that would cost you your collateral.*
  FR: *Voyez ce que vous bloquez, ce que vous devez et le prix qui vous coûterait votre garantie.*
- **Primary CTA:** "Start a demo loan" / « Démarrer un prêt de démo » → `/{locale}/app`.
- **Secondary CTA:** "How loans work" / « Comprendre les prêts » → `/{locale}/how-it-works`.
- **Visual:** a **live loan card built in code** (product UI, not a photo): 2,000 tUSDC borrowed against 1.2 tETH. Its safety runway shows the tETH price drifting calmly (±6%), the "today" marker sliding along the track, the health factor and the sentence "tETH can fall 36% before your collateral is sold" updating with it. It is the product's point of view in one picture: a loan is a distance to a price. The mesh butterfly sits large and cropped behind the hero (see §8).

## 4. Page map

All routes live under `/{locale}` (`en`, `fr`). `/` and any locale-less path redirect to the visitor's preferred language (fallback English) via `src/proxy.ts`.

| Route | Purpose | Sections, in order |
|-|-|-|
| `/{locale}` | Home: make the idea clear in 30 seconds and send people into the demo. | Hero with the live loan card · A loan in four steps (line diagram) · The safety runway (static runway with the three states) · Learn lending by living it (photo + one line) · FAQ (4 questions) · Closing call to action (heading + button) |
| `/{locale}/app` | The interactive demo: your one loan. | Connect gate (disconnected) · **No loan**: empty state with "Request a loan" and "Explore a running example" · **Active loan**: what you owe (live), health and safety runway, actions (repay, add collateral), market simulator (move the price, skip ahead in time), repayment path, loan activity · **Closed loan**: repaid or liquidated summary, withdraw collateral, start a new loan · Wallet balances · Loan history |
| `/{locale}/app/borrow` | Guided loan request. | Step 1 What you need · Step 2 What you lock (with suggested safe amount) · Step 3 Your terms (term, fixed or variable, cost) · Step 4 Review and sign (two transactions: allow, then lock and borrow) · Live summary with safety runway beside the steps (below on mobile) |
| `/{locale}/how-it-works` | The mechanics, for students, developers and careful borrowers. Justified because the documentation frames BorrowX as a teaching project about lending maths and time-based state. | Intro (one line) · A loan's life (diagram) · Collateral and limits (parameters table) · Health factor and the safety runway (worked example) · Interest, fixed or variable (formula + example) · Due dates and enforcement · Liquidation, step by step (worked example) · Borrower levels · For developers (one line; the contract interface behind a "Show the contract interface" disclosure) · Call to action |
| `/{locale}/credits` | Photo, font, icon and brand credits (required by the asset rules). | Photos · Type and icons · Monark brand assets |
| `/{locale}/pricing` | **Internal strategy review only.** Never linked, excluded from the sitemap, `noindex, nofollow`. | "Free, part of Monark" · What a borrower pays (network fees only, 0% protocol fee in the demo) · Partner cohorts · Reasoning |
| 404 | Friendly not-found with the vertical Monark logo, links home and to the demo. | |

The demo keeps one route for the loan (`/app`) instead of `/app/loan/[id]` because BorrowX is deliberately one loan at a time; past loans are a short history list.

**Header** (standard Monark shell, guidelines §2 and §10): butterfly mark 28px + "BorrowX" (Nunito Sans 800, 18px) on one line, no "by Monark" → home · links left, right after the brand: *Overview*, *How it works*, *Demo* (active in foreground) · right side: Demo chip (primary 8% light / 15% dark) → EN/FR pill → 36px theme toggle → *Launch demo*. Inside `/app` the primary action becomes the `connect-wallet` component. Below `lg`: brand + menu button opening a full-height sheet (links, Demo chip, EN/FR, theme, action). Marketing pages have this one bar only.

**App chrome:** no strip under the header. Each app page title row carries one pill on the right, "● Sepolia testnet | Demo controls" (icon-only on phones), that opens the demo controls.

**Footer** (three bands): product line ("The borrower's side of the Monark DeFi demos.") + links (Overview, How it works, Demo, Credits) and a "Part of the Monark DeFi demos" row (Fluidswap, Yieldmine, VaultLend) · "BorrowX is built by Monark" / « BorrowX est conçu par Monark », Monark logo + tagline, links to the project page and the GitHub repo, social icons · "© {year} Monark · Open source", "Demo · simulated data", photo credits link. The testnet notice appears only in the wallet prompt of value-moving transactions (guidelines §11).

## 5. Feature highlights

| Feature | User benefit | Where it appears | Proven by flow |
|-|-|-|-|
| Safety runway (liquidation price in plain words) | You know the price that would cost you your collateral | Home hero and runway section; borrow wizard summary; dashboard health card | Flows 2, 4 |
| Guided four-step request with a suggested safe amount | You can't accidentally borrow at the edge | `/app/borrow`; home "four steps" | Flow 2 |
| Live amount owed and repayment path | You always know what you owe and by when | Dashboard "You owe" card and repayment path | Flow 3 |
| Partial and full repayment, collateral unlock | Paying back is as clear as borrowing; you get your collateral back | Dashboard repay dialog; closed-loan summary | Flow 3 |
| Market simulator and time skip | You can learn what makes a loan risky without risking anything | Dashboard "Try it" panel; how-it-works | Flows 4, 5 |
| Automatic enforcement (liquidation, due date) explained | You see exactly what happens and what you keep | Dashboard liquidated summary; how-it-works | Flow 5 |

## 6. Key flows

Every value-moving step goes through the simulated wallet prompt (confirm or reject), then *pending* with a transaction hash for a realistic block time (1.2 to 2.4 s, or 3 to 6 s with "slow network"), then *confirmed* or *failed*. "Fail the next transaction" in the demo controls forces one revert.

**Flow 1: Connect the demo wallet.**
1. `/app` shows the connect gate. 2. "Connect demo wallet" opens the wallet prompt with a sign-in message (no fee). 3. *Pending:* "Connecting…" on the button. 4. *Confirmed:* the gate gives way to the loan area and the header shows the wallet. *Failed:* rejecting shows "You declined the sign-in request. Nothing was shared." with the button ready again.

**Flow 2: Request a loan.**
1. Empty state → "Request a loan". 2. Step 1: choose tUSDC or tDAI and the amount (quick chips 500 / 1,000 / 2,500). 3. Step 2: choose collateral (tETH, tWBTC, tLINK, with wallet balances) and the amount; "Use the safe amount" fills the amount that gives a health factor of 1.75; the safety runway and sentence update live; errors for more than the wallet holds or above the maximum LTV. 4. Step 3: term (30 / 90 / 180 days) and rate (fixed or variable), with interest by the due date and total to repay. 5. Step 4: plain-language summary, one acknowledgement checkbox, then **transaction 1 "Allow BorrowX to use your tETH"** and **transaction 2 "Lock 1.2 tETH and borrow 2,000 tUSDC"**, each with signing, pending and confirmed states. *Confirmed:* the collateral drops into the lock, and the visitor lands on the active loan. *Failed:* either transaction can be rejected or revert; the step shows the reason and "Try again", and a confirmed allowance is kept so only the failed step repeats.

**Flow 3: Repay, then take the collateral back.**
1. Active loan → "Repay". 2. Choose partial (amount, with 25% / 50% chips) or "Repay everything" (principal + interest to the second). The dialog shows what the payment covers: interest first, then principal, and the new health factor. 3. Wallet prompt → pending → *confirmed:* the amount owed drops, a stamp is added to the repayment path, the activity log gets a receipt. *Failed:* rejected or reverted with a reason and retry; *not enough tUSDC* is caught before signing with a link to the test-token faucet. 4. After full repayment the loan is **Repaid**, the lock opens, and "Withdraw 1.2 tETH" sends the collateral back (its own transaction). The borrower level may go up.

**Flow 4: A price drop, and a rescue.**
1. In the "Try it: move the market" panel, drag the tETH price or pick "-25%". 2. The runway marker slides into amber; the loan shows **At risk** with a banner explaining the new liquidation distance. 3. "Add collateral" (with a suggested amount to get back to Safe) or a partial repayment → prompt → pending → *confirmed:* back to **Safe**, runway updated. *Failed:* as above.

**Flow 5: Liquidation, or a missed due date.**
1. Drop the price below the liquidation price (e.g. "-40%"), or skip ahead past the due date and the 3-day grace period. 2. The loan turns **Liquidatable**, then a simulated liquidator transaction is *pending* with its hash. 3. *Confirmed:* the loan is **Liquidated**; a summary explains what happened in numbers (debt repaid by the liquidator, collateral sold including the 5% penalty, collateral left for you) and offers "Withdraw what's left" and "Start a new loan". The borrower level resets to *New*.

## 7. Content

Tone: the Monark voice, open, practical, optimistic, never hype. Every term is explained once. French is written natively (Québec-neutral, "vous"), keeping *wallet/portefeuille*, *on-chain* and token symbols.

The full microcopy lives in `src/i18n/dictionaries/en.ts` and `fr.ts`; the sections below are the draft that seeded them.

### Home

| Section | English | French |
|-|-|-|
| Headline | Borrow against your crypto, with eyes open. | Empruntez sur vos cryptos, en toute lucidité. |
| Sub | See what you lock, what you owe, and the price that would cost you your collateral. | Voyez ce que vous bloquez, ce que vous devez et le prix qui vous coûterait votre garantie. |
| CTAs | Start a demo loan · How loans work | Démarrer un prêt de démo · Comprendre les prêts |
| Steps title | A loan in four steps | Un prêt en quatre étapes |
| Steps | 1 Choose what you need (tUSDC or tDAI, with the rate up front). 2 Lock your collateral (it stays in the contract, not with a person). 3 Receive the loan (in the same transaction). 4 Repay, get it back (any time before the due date). | 1 Choisissez ce qu'il vous faut. 2 Bloquez votre garantie. 3 Recevez le prêt. 4 Remboursez, récupérez. |
| Runway | **The safety runway.** The longer the green stretch, the more room your loan has. States: Safe (health 1.50 or more) · At risk (1.00 to 1.50: add collateral or repay) · Liquidatable (below 1.00: collateral can be sold) | **La piste de sécurité.** Plus la zone verte est longue, plus votre prêt a de marge. |
| Learning | **Learn lending by living it.** Move the market, skip ahead a month, and watch the contract react. → Read how loans work | **Apprendre le prêt en le vivant.** Faites bouger le marché, avancez d'un mois et voyez le contrat réagir. |
| Closing | **Try a loan you can't lose money on.** → Start a demo loan | **Essayez un prêt sans rien risquer.** → Démarrer un prêt de démo |

**FAQ** (home only, 4 questions): *Is this real money?* · *Why do I have to lock more than I borrow?* · *What happens if the price of my collateral drops?* · *How is BorrowX different from VaultLend and Yieldmine?* Answers are one line (12–15 words); fixed vs. variable and early repayment are covered in the interest section of `/how-it-works`. Full copy in the dictionaries.

### Demo app (main strings)

| Where | English | French |
|-|-|-|
| Gate | **Your loan, one step at a time.** Borrow test tokens against test collateral. · Connect demo wallet | **Votre prêt, une étape à la fois.** Empruntez des jetons de test contre une garantie de test. · Connecter le portefeuille de démo |
| Gate rejected | You declined the sign-in request. Nothing was shared. | Vous avez refusé la demande de connexion. Rien n'a été partagé. |
| Empty state | **What do you need to borrow?** · Request a loan · Explore a running example (2,000 tUSDC, 41 days in.) | **De quoi avez-vous besoin ?** · Demander un prêt · Explorer un exemple en cours |
| Owe card | You owe · principal · interest so far · Due {date} · in {n} days | Vous devez · capital · intérêts à ce jour · Échéance le {date} · dans {n} jours |
| Health | Safe · At risk · Liquidatable — "{token} can fall {pct} before your collateral can be sold." / "Your collateral can be sold now." | En sécurité · À risque · Liquidable — « Le {token} peut baisser de {pct} avant que votre garantie puisse être vendue. » / « Votre garantie peut être vendue dès maintenant. » |
| At-risk banner | Your loan is at risk. Add {amount} or repay {amount} to get back to safe. | Votre prêt est à risque. Ajoutez {amount} ou remboursez {amount} pour revenir en sécurité. |
| Market panel | **Try it: move the market** (info icon: "Demo only. In a real protocol, prices come from an oracle.") · -10% / -25% / -40% · Reset price · High demand in the pool · +7 days · +30 days | **À vous de jouer : faites bouger le marché** (icône d'info) · Rétablir le prix · +7 jours · +30 jours |
| Repaid | **Loan repaid.** Your collateral is unlocked. · Withdraw {amount} | **Prêt remboursé.** Votre garantie est débloquée. · Retirer {amount} |
| Liquidated | **Your loan was liquidated.** tETH fell to {price}, below your liquidation price. (The breakdown shows the debt repaid, the collateral sold with the 5% penalty, and what is left.) | **Votre prêt a été liquidé.** Le tETH est descendu à {price}, sous votre prix de liquidation. |
| Overdue | The due date has passed. You have until {date} to repay before the contract closes the loan. | L'échéance est passée. Vous avez jusqu'au {date} pour rembourser avant que le contrat ne ferme le prêt. |
| Tx states | Confirm in your wallet… · Waiting for the network… · Confirmed · Failed. You rejected the request in your wallet. / The transaction failed on the network. Nothing moved. · Try again | Confirmez dans votre portefeuille… · En attente du réseau… · Confirmée · Échec. Vous avez refusé la demande dans votre portefeuille. / La transaction a échoué sur le réseau. Rien n'a bougé. · Réessayer |
| Validation | Enter an amount. · That's more than your wallet holds. · That's above the {pct} limit for {token}: lock more or borrow less. · You need {amount} more tUSDC. Get test tokens | Saisissez un montant. · C'est plus que ce que contient votre portefeuille. · C'est au-delà de la limite de {pct} pour le {token} : bloquez plus ou empruntez moins. · Il vous manque {amount} tUSDC. Obtenir des jetons de test |
| History empty | Loans you close will appear here. | Les prêts que vous fermez apparaîtront ici. |
| Storage error | Storage is blocked: the demo resets when you leave. | Stockage bloqué : la démo se réinitialise quand vous partez. |
| Controls | Demo controls · Slow network · Fail the next transaction · Get test stablecoins (500 tUSDC and 500 tDAI) · Reset demo (Start over with the example wallet? Your loan and history will be cleared.) | Contrôles de la démo · Réseau lent · Faire échouer la prochaine transaction · Obtenir des stablecoins de test (500 tUSDC et 500 tDAI) · Réinitialiser la démo (Recommencer avec le portefeuille d'exemple ? Votre prêt et votre historique seront effacés.) |

### How it works

Headings (EN / FR): *How a BorrowX loan works* / *Comment fonctionne un prêt BorrowX* · *A loan's life* / *La vie d'un prêt* · *Collateral and limits* / *Garanties et limites* · *Health factor and the safety runway* / *Facteur de santé et piste de sécurité* · *Interest, fixed or variable* / *Intérêts, fixes ou variables* · *Due dates are enforced* / *Les échéances sont appliquées* · *Liquidation, step by step* / *La liquidation, étape par étape* · *Borrower levels* / *Niveaux d'emprunteur* · *For developers* / *Pour les développeurs*. Worked examples use 2,000 tUSDC against 1.2 tETH at $3,200: health 1.57, liquidation price $2,032.52 (a 36% fall), 90 days variable at 5.15% ≈ 25.40 tUSDC of interest. Full body copy in the dictionaries.

### Errors and empty states (site-wide)

- 404: *Page not found* / *Page introuvable* — "This page doesn't exist. Your demo loan is where you left it." / « Cette page n'existe pas. Votre prêt de démo vous attend. »
- Error boundary: *Something went wrong* / *Un problème est survenu* — "The page hit an unexpected error. Your demo data is still saved in this browser." / « La page a rencontré une erreur inattendue. Vos données de démo sont toujours enregistrées dans ce navigateur. » · Try again / Réessayer.

## 8. Aesthetics (Monark-branded)

Colour, type, logo, header and footer come from the guidelines (§3 token block pasted over the `@monark/ui` theme, Nunito Sans, butterfly mark + "BorrowX" product brand, standard shell). What this plan decides:

- **Layouts and rhythm.** Marketing pages are short and airy: a hero, then alternating plain and `secondary`-tinted bands, the branded section divider used once per page. The app is denser and calmer: a single column on mobile; on desktop a two-column grid where the money (you owe, health) sits left and actions and the market simulator sit right. Numbers are big and tabular (monospace only for amounts, addresses and hashes, through `token-amount` and `wallet`).
- **Hero visual.** The live loan card with its safety runway (§3), set on a near-white card over cream.
- **Mesh butterfly.** Yes, once: large, cropped off the top right of the home hero at ~10% opacity (16% on espresso), behind the loan card. Nowhere else. No gradients anywhere.
- **Illustrations.** No Monark illustration files are reused (their glow versions don't fit); all diagrams are new flat line art in orange strokes (1.75px, round caps), drawn in JSX: the four-step loan path, the safety runway, the padlock (collateral lock), the loan-life timeline and the liquidation breakdown bar.
- **Photography direction.** Warm, natural-light photos of students learning together, wood and daylight tones that sit on cream and espresso; used only on the home "Learn lending by living it" band and the top of `/how-it-works`, always next to a clear line of copy. No coins, charts or hoodies.
- **Status colours.** Muted green (safe), amber (at risk) and red (liquidatable), always with the word; never orange, which stays the action colour.
- **Signature moments.**
  1. **The safety runway moves.** In the borrow wizard, every change of amount or collateral slides the liquidation marker along the track and rewrites the sentence "tETH can fall 36%…"; on the dashboard, dragging the market price slides the "today" marker toward it, crossing from green into amber and red.
  2. **The lock.** On "Lock and borrow", the collateral chip travels into a line-art padlock that closes when the transaction confirms; on full repayment, the shackle lifts and the collateral is ready to withdraw.
  3. **Interest you can watch.** The amount owed ticks up every second (to 4 decimals), and each repayment drops a small stamp on the repayment path between today and the due date.

## 9. Assets

| Asset | Purpose | Placement |
|-|-|-|
| `public/images/lecture-hall.jpg` (Unsplash, Vitaly Gariev) | Students talking in a warm lecture hall: the learning audience | Home, "Learn lending by living it" band |
| `public/images/study-table.jpg` (Unsplash, Alexis Brown) | Two people reading and taking notes at a wooden table: careful, self-paced learning | `/how-it-works` intro |
| `public/brand/*` | Monark mark, horizontal and vertical logos (light/dark), mesh butterfly, social icons | Header, footer, 404, hero, OG image |
| `src/app/icon.svg` | Favicon: the Monark mark (products use the butterfly as their mark) | Browser tab |
| `opengraph-image` | Generated per locale: pairing, tagline and a runway drawing | Social previews |

Icons: `lucide-react` only (1.75px stroke). Diagrams built in code: safety runway, padlock, four-step path, loan-life timeline, liquidation breakdown bar, hero loan card. Credits in `docs/assets.md` and on `/credits`.

## 10. Pricing strategy

**Free, included in the Monark bundle.** BorrowX is a testnet reference implementation for teaching and for community developers; charging for it would contradict its purpose and Monark's accessibility value. The demo takes **no protocol fee**; a borrower on a real testnet deployment only pays network fees (test ETH). A possible later offer is **partner cohorts**: Monark-run workshops for universities and partners (setup, funded test wallets, a facilitator guide), priced per engagement, not per user. No price points are shown for it.

`/pricing` exists as a designed page for internal review only: never linked, not in the sitemap, `robots: { index: false, follow: false }`. Nothing else on the site mentions prices.

## 11. Out of scope

- No real chain, wallet, oracle or backend; no wagmi/viem yet (the data layer in `src/lib/demo/` is shaped so it could be swapped in).
- One loan at a time; no multi-collateral loans, no borrowing more on an open loan, no loan refinancing.
- No pool-level views (liquidity, utilisation, other borrowers' positions): that is VaultLend and Yieldmine.
- No partial liquidations: a liquidation closes the loan in one step (explained as a simplification on `/how-it-works`).
- No real credit scoring or identity: borrower levels are a simulation from the demo's own history.
- No accounts, email or notifications; state lives in this browser only.

## Decisions made while building

- **Amounts are not monospace.** The guidelines reserve monospace for addresses, hashes and code, so amounts (including the registry `token-amount`) use Nunito Sans with tabular figures.
- **Stored amounts are 6-decimal numbers**, converted to base units only for `token-amount`. Suggested amounts are rounded up to each token's display precision (tETH 4 decimals) so they read cleanly.
- **The amount owed shows 6 decimals** so interest visibly ticks every second (at 5% on 2,000 tUSDC it moves about 0.000003 per second).
- **Adding collateral uses the same two-transaction pattern** as opening a loan (allowance, then add), and allowances are logged in the loan activity.
- **Market panel:** a slider (30% to 130% of the reference price) plus -10% / -25% / -40% presets and a reset. Enforcement is checked when the slider rests (keyboard changes included), not on every pixel, so dragging through the red zone and back doesn't liquidate.
- **Liquidation is automatic but visible:** a keeper job shows a pending transaction with its hash for a block or two before the loan closes; actions are disabled meanwhile.
- **Toasts** sit top-right below the header (desktop) and full width below the header (mobile), so they never cover the amount owed or the runway they report on. One message, once: no toast after a full repayment or a withdrawal (the loan card says it); partial repayments, added collateral, the faucet and reset keep theirs.
- **Context on demand** (simplification pass): no intro paragraphs above forms; the "why" sits behind info icons (`src/components/ui/info-tip.tsx`, a popover that works on touch) on "Loan asset", "Collateral", the safe amount, the market panel and the borrower level. The testnet line appears only in the wallet prompt of value-moving transactions.
- **Risk shown once:** the page title no longer repeats the Safe / At risk badge (it is on the health card), and the APR is only in "Your loan".
- **One route for the loan** (`/app`) plus `/app/borrow`; a loan that is repaid or liquidated stays on `/app` until the visitor withdraws collateral and starts a new one.
