# BorrowX by Monark: site plan

Status: planned, then built on `develop`. This plan is kept in sync with what ships.

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
- **Subheadline:** *BorrowX walks you through one loan at a time: what you lock, what you receive, the price that would put your collateral at risk, and what you owe today.*
  FR: *BorrowX vous accompagne un prêt à la fois : ce que vous bloquez, ce que vous recevez, le prix qui mettrait votre garantie en danger et ce que vous devez aujourd'hui.*
- **Primary CTA:** "Start a demo loan" / « Démarrer un prêt de démo » → `/{locale}/app`.
- **Secondary CTA:** "See how loans work" / « Comprendre les prêts » → `/{locale}/how-it-works`.
- **Visual:** a **live loan card built in code** (product UI, not a photo): 2,000 tUSDC borrowed against 1.2 tETH. Its safety runway shows the tETH price drifting calmly (±6%), the "today" marker sliding along the track, the health factor and the sentence "tETH can fall 36% before your collateral is sold" updating with it. It is the product's point of view in one picture: a loan is a distance to a price. The mesh butterfly sits large and cropped behind the hero (see §8).

## 4. Page map

All routes live under `/{locale}` (`en`, `fr`). `/` and any locale-less path redirect to the visitor's preferred language (fallback English) via `src/proxy.ts`.

| Route | Purpose | Sections, in order |
|-|-|-|
| `/{locale}` | Home: make the idea clear in 30 seconds and send people into the demo. | Hero with the live loan card · "Three questions before you borrow" (the three outcomes) · A loan in four steps (line diagram) · The safety runway explained (static runway with the three states) · Made for learning (photo + copy) · FAQ · Closing call to action |
| `/{locale}/app` | The interactive demo: your one loan. | Connect gate (disconnected) · **No loan**: empty state with "Request a loan" and "Explore a running example" · **Active loan**: what you owe (live), health and safety runway, actions (repay, add collateral), market simulator (move the price, skip ahead in time), repayment path, loan activity · **Closed loan**: repaid or liquidated summary, withdraw collateral, start a new loan · Wallet balances · Loan history |
| `/{locale}/app/borrow` | Guided loan request. | Step 1 What you need · Step 2 What you lock (with suggested safe amount) · Step 3 Your terms (term, fixed or variable, cost) · Step 4 Review and sign (two transactions: allow, then lock and borrow) · Live summary with safety runway beside the steps (below on mobile) |
| `/{locale}/how-it-works` | The mechanics, for students, developers and careful borrowers. Justified because the documentation frames BorrowX as a teaching project about lending maths and time-based state. | Intro · A loan's life (diagram) · Collateral and limits (parameters table) · Health factor and the safety runway (worked example) · Interest, fixed or variable (formula + example) · Due dates and enforcement · Liquidation, step by step (worked example) · Borrower levels · For developers (contract interface + how the demo's data layer mirrors it; standalone or plugged into a pool like VaultLend) · Call to action |
| `/{locale}/credits` | Photo, font, icon and brand credits (required by the asset rules). | Photos · Type and icons · Monark brand assets |
| `/{locale}/pricing` | **Internal strategy review only.** Never linked, excluded from the sitemap, `noindex, nofollow`. | "Free, part of Monark" · What a borrower pays (network fees only, 0% protocol fee in the demo) · Partner cohorts · Reasoning |
| 404 | Friendly not-found with the vertical Monark logo, links home and to the demo. | |

The demo keeps one route for the loan (`/app`) instead of `/app/loan/[id]` because BorrowX is deliberately one loan at a time; past loans are a short history list.

**Header** (standard Monark shell): "BorrowX by Monark" pairing → home · links: *Overview*, *How it works*, *Demo* (pill highlight on the active one) · EN/FR switch · theme toggle · primary pill *Launch demo*. Inside `/app` the primary action becomes the `connect-wallet` component and a "Demo · simulated data" badge appears. Mobile: pairing + menu button opening a full-height sheet.

**Footer** (three bands): product line + links (Overview, How it works, Demo, Credits) and a "Part of the Monark DeFi demos" row (Fluidswap, Yieldmine, VaultLend) · Monark logo + tagline, links to the project page and the GitHub repo, social icons · "© {year} Monark · Open source", "Demo · simulated data", the testnet notice, photo credits link.

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
| Eyebrow | Borrowing, explained as you go | L'emprunt, expliqué pas à pas |
| Headline | Borrow against your crypto, with eyes open. | Empruntez sur vos cryptos, en toute lucidité. |
| Sub | BorrowX walks you through one loan at a time: what you lock, what you receive, the price that would put your collateral at risk, and what you owe today. | BorrowX vous accompagne un prêt à la fois : ce que vous bloquez, ce que vous recevez, le prix qui mettrait votre garantie en danger et ce que vous devez aujourd'hui. |
| CTAs | Start a demo loan · See how loans work | Démarrer un prêt de démo · Comprendre les prêts |
| Questions title | Three questions to ask before you borrow | Trois questions à se poser avant d'emprunter |
| Questions intro | Most lending apps show you ratios. BorrowX answers the questions a careful borrower actually asks. | La plupart des applications de prêt affichent des ratios. BorrowX répond aux questions qu'un emprunteur prudent se pose vraiment. |
| Q1 | **How much can I safely borrow?** BorrowX suggests an amount that leaves room for the market to move, and tells you the price that would put your collateral at risk. | **Combien puis-je emprunter sans risque ?** BorrowX propose un montant qui laisse de la marge au marché et vous indique le prix qui mettrait votre garantie en danger. |
| Q2 | **What could go wrong?** If your collateral loses value, you see it coming: safe, at risk, then liquidatable, each with a plain explanation and a way out. | **Qu'est-ce qui pourrait mal tourner ?** Si votre garantie perd de la valeur, vous le voyez venir : en sécurité, à risque, puis liquidable, chaque fois avec une explication claire et une porte de sortie. |
| Q3 | **What do I owe right now?** Interest adds up every second and the due date is always in view. Every payment shows what it paid off. | **Combien est-ce que je dois maintenant ?** Les intérêts s'ajoutent à chaque seconde et l'échéance reste toujours visible. Chaque paiement montre ce qu'il a remboursé. |
| Steps title | A loan in four steps | Un prêt en quatre étapes |
| Steps | 1 Choose what you need (tUSDC or tDAI, and how much). 2 Lock your collateral (tETH, tWBTC or tLINK stays in the contract, not with a person). 3 Receive the loan in your wallet in one transaction. 4 Repay when you like, before the due date, and your collateral unlocks. | 1 Choisissez ce qu'il vous faut (tUSDC ou tDAI, et le montant). 2 Bloquez votre garantie (vos tETH, tWBTC ou tLINK restent dans le contrat, pas chez quelqu'un). 3 Recevez le prêt dans votre portefeuille en une transaction. 4 Remboursez quand vous voulez avant l'échéance, et votre garantie se débloque. |
| Runway title | The safety runway | La piste de sécurité |
| Runway body | Your loan is safe as long as your collateral is worth enough. The runway shows today's price, the price where your loan becomes at risk, and the price where your collateral can be sold. The longer the green stretch, the more room you have. | Votre prêt est en sécurité tant que votre garantie vaut assez. La piste montre le prix d'aujourd'hui, le prix où votre prêt devient à risque et celui où votre garantie peut être vendue. Plus la zone verte est longue, plus vous avez de marge. |
| States | Safe: health 1.50 or more, there is room for the price to move. · At risk: between 1.00 and 1.50, add collateral or repay a little. · Liquidatable: below 1.00, part of your collateral can be sold to repay the loan. | En sécurité : santé de 1,50 ou plus, le prix a de la marge. · À risque : entre 1,00 et 1,50, ajoutez de la garantie ou remboursez un peu. · Liquidable : sous 1,00, une partie de votre garantie peut être vendue pour rembourser le prêt. |
| Learning title | Made for learning, together | Pensé pour apprendre, ensemble |
| Learning body | BorrowX is a Monark reference project for students, developers and workshop leaders. Everything runs on a simulated testnet: move the market, skip ahead a month, and watch what a smart contract does with your loan, without risking a cent. | BorrowX est un projet de référence de Monark pour les étudiants, les développeurs et les animateurs d'ateliers. Tout se passe sur un testnet simulé : faites bouger le marché, avancez d'un mois et observez ce qu'un contrat intelligent fait de votre prêt, sans risquer un sou. |
| Learning CTA | Read how loans work | Lire le fonctionnement des prêts |
| FAQ | see below | voir plus bas |
| Closing | **Try a loan you can't lose money on.** Borrow, move the market, repay. It takes about two minutes. → Start a demo loan | **Essayez un prêt sans rien risquer.** Empruntez, faites bouger le marché, remboursez. Deux minutes suffisent. → Démarrer un prêt de démo |

**FAQ** (home):

1. *Is this real money?* No. BorrowX is a demo on a simulated testnet. Tokens like tETH and tUSDC have no value, and no transaction leaves your browser. / *Est-ce de l'argent réel ?* Non. BorrowX est une démo sur un testnet simulé. Les jetons comme tETH et tUSDC n'ont aucune valeur et aucune transaction ne quitte votre navigateur.
2. *Why do I have to lock more than I borrow?* There is no credit check on-chain, so the loan is secured by collateral worth more than the loan. If you don't repay, the contract can sell it instead of chasing you. / *Pourquoi bloquer plus que ce que j'emprunte ?* Il n'y a pas d'enquête de crédit on-chain : le prêt est donc garanti par des actifs qui valent plus que le prêt. Si vous ne remboursez pas, le contrat peut les vendre plutôt que de vous poursuivre.
3. *What happens if the price of my collateral drops?* Your health factor goes down. Below 1.50 your loan is at risk and BorrowX suggests how much to add or repay. Below 1.00 a liquidator can repay your debt and take collateral worth the debt plus a 5% penalty; the rest comes back to you. / *Que se passe-t-il si le prix de ma garantie baisse ?* Votre facteur de santé diminue. Sous 1,50, votre prêt est à risque et BorrowX vous suggère combien ajouter ou rembourser. Sous 1,00, un liquidateur peut rembourser votre dette et prendre de la garantie d'une valeur égale à la dette plus une pénalité de 5 % ; le reste vous revient.
4. *Fixed or variable rate?* A fixed rate is locked when the loan opens. A variable rate starts lower but follows demand in the pool, so it can rise. / *Taux fixe ou variable ?* Un taux fixe est verrouillé à l'ouverture du prêt. Un taux variable part plus bas, mais suit la demande dans le pool : il peut donc monter.
5. *Can I repay early or in parts?* Yes, any amount, any time before the due date. Interest is only charged for the time you actually borrowed. / *Puis-je rembourser plus tôt ou en plusieurs fois ?* Oui, n'importe quel montant, à tout moment avant l'échéance. Les intérêts ne sont calculés que sur la durée réelle de l'emprunt.
6. *How is BorrowX different from VaultLend and Yieldmine?* BorrowX is the borrower's view of one loan. Yieldmine is for people supplying assets to earn yield, and VaultLend shows the protocol's risk across all positions. / *En quoi BorrowX diffère-t-il de VaultLend et Yieldmine ?* BorrowX est le point de vue de l'emprunteur, pour un prêt. Yieldmine s'adresse à ceux qui prêtent leurs actifs pour obtenir un rendement, et VaultLend montre le risque du protocole sur l'ensemble des positions.

### Demo app (main strings)

| Where | English | French |
|-|-|-|
| Gate | **Your loan, one step at a time.** Connect the demo wallet to borrow test tokens against test collateral. Nothing real is signed. · Connect demo wallet | **Votre prêt, une étape à la fois.** Connectez le portefeuille de démo pour emprunter des jetons de test contre une garantie de test. Rien de réel n'est signé. · Connecter le portefeuille de démo |
| Gate rejected | You declined the sign-in request. Nothing was shared. | Vous avez refusé la demande de connexion. Rien n'a été partagé. |
| Empty state | **No loan yet.** Tell BorrowX what you need and it will show you what to lock and how much room you'll have. · Request a loan · Explore a running example | **Aucun prêt pour l'instant.** Dites à BorrowX ce qu'il vous faut : il vous montrera quoi bloquer et de combien de marge vous disposerez. · Demander un prêt · Explorer un exemple en cours |
| Owe card | You owe · principal · interest so far · Due {date} · in {n} days | Vous devez · capital · intérêts à ce jour · Échéance le {date} · dans {n} jours |
| Health | Safe · At risk · Liquidatable — "{token} can fall {pct} before your collateral can be sold." / "Your collateral can be sold now." | En sécurité · À risque · Liquidable — « Le {token} peut baisser de {pct} avant que votre garantie puisse être vendue. » / « Votre garantie peut être vendue dès maintenant. » |
| At-risk banner | Your loan is at risk. Add {amount} or repay {amount} to get back to safe. | Votre prêt est à risque. Ajoutez {amount} ou remboursez {amount} pour revenir en sécurité. |
| Market panel | **Try it: move the market.** Demo only: change the tETH price or skip ahead in time to see how your loan reacts. · Skip 7 days · Skip 30 days · Reset price | **À vous de jouer : faites bouger le marché.** Démo seulement : changez le prix du tETH ou avancez dans le temps pour voir comment votre prêt réagit. · Avancer de 7 jours · Avancer de 30 jours · Rétablir le prix |
| Repaid | **Loan repaid.** Your collateral is unlocked. · Withdraw {amount} | **Prêt remboursé.** Votre garantie est débloquée. · Retirer {amount} |
| Liquidated | **Your loan was liquidated.** tETH fell to {price}, below your liquidation price. A liquidator repaid {debt} and received {seized} (including the 5% penalty). {left} is yours to withdraw. | **Votre prêt a été liquidé.** Le tETH est descendu à {price}, sous votre prix de liquidation. Un liquidateur a remboursé {debt} et reçu {seized} (pénalité de 5 % comprise). Il vous reste {left} à retirer. |
| Overdue | The due date has passed. You have until {date} to repay before the contract closes the loan. | L'échéance est passée. Vous avez jusqu'au {date} pour rembourser avant que le contrat ne ferme le prêt. |
| Tx states | Confirm in your wallet… · Waiting for the network… · Confirmed · Failed. You rejected the request in your wallet. / The transaction failed on the network. Nothing moved. · Try again | Confirmez dans votre portefeuille… · En attente du réseau… · Confirmée · Échec. Vous avez refusé la demande dans votre portefeuille. / La transaction a échoué sur le réseau. Rien n'a bougé. · Réessayer |
| Validation | Enter an amount. · That's more than your wallet holds. · That's above the {pct} limit for {token}: lock more or borrow less. · You need {amount} more tUSDC. Get test tokens | Saisissez un montant. · C'est plus que ce que contient votre portefeuille. · C'est au-delà de la limite de {pct} pour le {token} : bloquez plus ou empruntez moins. · Il vous manque {amount} tUSDC. Obtenir des jetons de test |
| History empty | Loans you close will appear here. | Les prêts que vous fermez apparaîtront ici. |
| Storage error | Your browser is blocking storage, so the demo will reset when you leave the page. | Votre navigateur bloque le stockage : la démo sera réinitialisée quand vous quitterez la page. |
| Controls | Demo controls · Slow network · Fail the next transaction · Get 500 test tUSDC · Reset demo (Start over with the example wallet? Your loan and history will be cleared.) | Contrôles de la démo · Réseau lent · Faire échouer la prochaine transaction · Obtenir 500 tUSDC de test · Réinitialiser la démo (Recommencer avec le portefeuille d'exemple ? Votre prêt et votre historique seront effacés.) |

### How it works

Headings (EN / FR): *How a BorrowX loan works* / *Comment fonctionne un prêt BorrowX* · *A loan's life* / *La vie d'un prêt* · *Collateral and limits* / *Garanties et limites* · *Health factor and the safety runway* / *Facteur de santé et piste de sécurité* · *Interest, fixed or variable* / *Intérêts, fixes ou variables* · *Due dates are enforced* / *Les échéances sont appliquées* · *Liquidation, step by step* / *La liquidation, étape par étape* · *Borrower levels* / *Niveaux d'emprunteur* · *For developers* / *Pour les développeurs*. Worked examples use 2,000 tUSDC against 1.2 tETH at $3,200: health 1.57, liquidation price $2,032.52 (a 36% fall), 90 days variable at 5.15% ≈ 25.40 tUSDC of interest. Full body copy in the dictionaries.

### Errors and empty states (site-wide)

- 404: *Page not found* / *Page introuvable* — "This page has moved or never existed. Your demo loan is safe where you left it." / « Cette page a été déplacée ou n'a jamais existé. Votre prêt de démo vous attend là où vous l'avez laissé. »
- Error boundary: *Something went wrong* / *Un problème est survenu* — "The page hit an unexpected error. Your demo data is still saved in this browser." / « La page a rencontré une erreur inattendue. Vos données de démo sont toujours enregistrées dans ce navigateur. » · Try again / Réessayer.

## 8. Aesthetics (Monark-branded)

Colour, type, logo, header and footer come from the guidelines (§3 token block pasted over the `@monark/ui` theme, Nunito Sans, "BorrowX by Monark" pairing, standard shell). What this plan decides:

- **Layouts and rhythm.** Marketing pages are short and airy: a hero, then alternating plain and `secondary`-tinted bands, the branded section divider used once per page. The app is denser and calmer: a single column on mobile; on desktop a two-column grid where the money (you owe, health) sits left and actions and the market simulator sit right. Numbers are big and tabular (monospace only for amounts, addresses and hashes, through `token-amount` and `wallet`).
- **Hero visual.** The live loan card with its safety runway (§3), set on a near-white card over cream.
- **Mesh butterfly.** Yes, once: large, cropped off the top right of the home hero at ~10% opacity (16% on espresso), behind the loan card. Nowhere else. No gradients anywhere.
- **Illustrations.** No Monark illustration files are reused (their glow versions don't fit); all diagrams are new flat line art in orange strokes (1.75px, round caps), drawn in JSX: the four-step loan path, the safety runway, the padlock (collateral lock), the loan-life timeline and the liquidation breakdown bar.
- **Photography direction.** Warm, natural-light photos of students learning together, wood and daylight tones that sit on cream and espresso; used only on the home "Made for learning" band and the top of `/how-it-works`, always next to a clear line of copy. No coins, charts or hoodies.
- **Status colours.** Muted green (safe), amber (at risk) and red (liquidatable), always with the word; never orange, which stays the action colour.
- **Signature moments.**
  1. **The safety runway moves.** In the borrow wizard, every change of amount or collateral slides the liquidation marker along the track and rewrites the sentence "tETH can fall 36%…"; on the dashboard, dragging the market price slides the "today" marker toward it, crossing from green into amber and red.
  2. **The lock.** On "Lock and borrow", the collateral chip travels into a line-art padlock that closes when the transaction confirms; on full repayment, the shackle lifts and the collateral is ready to withdraw.
  3. **Interest you can watch.** The amount owed ticks up every second (to 4 decimals), and each repayment drops a small stamp on the repayment path between today and the due date.

## 9. Assets

| Asset | Purpose | Placement |
|-|-|-|
| `public/images/lecture-hall.jpg` (Unsplash, Vitaly Gariev) | Students talking in a warm lecture hall: the learning audience | Home, "Made for learning" band |
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
