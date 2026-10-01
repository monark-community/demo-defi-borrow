# Simplification pass

Owner feedback on the rebuilt demo sites: *"Simplify, reduce text quantity, revise flows so that context is only given when necessary. Two top bars on homepage is too busy; demo banners only on demo/app pages."* This pass applies the method and checklist of the TrustRate pilot (`address-review-system/docs/simplification.md`, §4) to BorrowX, under the binding rules in `monark-brand-guidelines.md` (§8 "Restraint", §10, §11). BorrowX is Monark-branded, so the header and footer were also brought to the current standard. No feature or flow was removed.

How the numbers are measured (both scripts are in `scripts/`, run against `pnpm start -p 3134`):

- `node scripts/wordcount.mjs`: words per page, English, at 1440px. *Visible* is the `innerText` of `<main>`; *total* also counts closed disclosures and popovers present in the DOM; *chrome* is everything outside `<main>` (header and footer). The app pages include data (wallet balances, activity, amounts), not only UI copy. The active loan is the "running example".
- `node scripts/dictcount.mjs`: words of UI copy in `src/i18n/dictionaries/{en,fr}.ts`, per section.

## 1. Before

| Page | Visible in main | Total in main | Chrome |
|-|-:|-:|-:|
| Home | 586 | 586 | 83 |
| How it works | 780 | 780 | 83 |
| Credits | 90 | 90 | 83 |
| 404 | 27 | 27 | 83 |
| App: connect gate | 56 | 56 | 86 |
| App: no loan | 138 | 138 | 88 |
| App: borrow, step 1 | 102 | 113 | 88 |
| App: borrow, step 2 | 174 | 185 | 88 |
| App: borrow, step 3 | 164 | 175 | 88 |
| App: borrow, step 4 (review) | 175 | 186 | 88 |
| App: active loan (example) | 336 | 341 | 88 |
| **Total** | **2,628** | **2,677** | **946** |

Dictionary copy: **EN 3,219 words** (meta 126 · common 141 · loanTerms 44 · home 701 · app 1,300 · how 679 · credits 76 · pricing 151); **FR 3,564 words**.

### Inventory

- **Shell.** Header: "BorrowX · by Monark" pairing, links on the right, EN/FR, theme, primary action; inside `/app` an extra dashed "Demo · simulated data" badge. Footer: 20-word product line; legal band repeated the testnet line on every page.
- **Two bars in the app.** Under the header, a strip with the network badge, the testnet line and "Demo controls".
- **Testnet line six times per screen:** hero, closing CTA, how-it-works CTA, app strip, under Repay / Add collateral, in the repay, add-collateral and withdraw forms, in the wizard's review step, and in the wallet prompt.
- **Home** (hero + 6 sections): eyebrow, 27-word sub; "Three questions" (intro + 3 × 25 words, restating the hero and the runway); four steps (eyebrow + 22-word intro + 4 × 12 words); runway (eyebrow + 45-word body + 3 states with a sentence each); learning (eyebrow + 40-word body + 3 bullets); FAQ with 6 questions (20–45-word answers, two of them mechanics); closing with a body line; two dividers.
- **How it works:** eyebrow + 45-word intro; every section with a paragraph; contract interface always open.
- **App:** gate with 3 feature bullets; empty state with eyebrow and body; wizard intro + a body line on steps 1–3 + a hint under the safe amount + a risk line that the acknowledgement repeated; market panel intro and oracle note; level card note; "Safe" shown both next to the page title and in the health card; APR shown in the health card and in the loan details.
- **Repeated messages:** full repayment showed a toast *and* the "Loan repaid" card; withdrawing showed a toast *and* "Collateral withdrawn to your wallet." in the card.

## 2. What changed

### Header and footer (standard shell, §2 and §10)
- `brand.tsx`: butterfly mark 28px + "BorrowX" in Nunito Sans 800 18px on one line; no "by Monark". Accessible label "BorrowX, by Monark: home". Replaces `pairing.tsx`.
- Links left, right after the brand (`nav-links.tsx`: muted, active in foreground, no pill).
- Right side, in order: `demo-chip.tsx` (primary tint 8% light / 15% dark, `primary-ink` text) → EN/FR pill → 36px theme toggle → primary action ("Launch demo", or the connect-wallet control inside `/app`).
- Below `lg`: brand + menu button only; the sheet holds the links, Demo chip, EN/FR, theme and action.
- `app-demo-badge.tsx` removed: the Demo chip marks the whole site.
- Footer: Monark band opens with "BorrowX is built by Monark" / « BorrowX est conçu par Monark ». Product line cut to 8 words. Legal band keeps "Demo · simulated data" only (testnet line removed). The "Part of the Monark DeFi demos" row (Fluidswap, Yieldmine, VaultLend) stays: it is the DeFi family convention.

### Marketing pages: one top bar
Home, how it works, credits and 404 have only the header. The testnet line under the hero and the two CTAs is gone.

### Home (hero + 6 sections → hero + 5)
- Hero: no eyebrow; sub 27 → 16 words; secondary CTA "See how loans work" → "How loans work".
- "Three questions" removed: Q1 and Q2 are the runway section, Q3 is the hero and step 4.
- Four steps: heading only; step lines 12 → 3–9 words.
- Safety runway: heading + one 11-word line; states show the badge and the range only; example caption shortened.
- Learning: heading + one line + photo + button; bullets removed.
- FAQ: 6 → 4 questions, answers 12–15 words. "Fixed or variable" and "Repay early" are covered on `/how-it-works` (interest section). This is the only FAQ on the site.
- Closing: heading + button. One divider instead of two.

### How it works
- No eyebrow; intro 45 → 11 words.
- Every section: at most one short line; stage lines ≤ 8 words; formula notes, examples and liquidation steps one line each; the collateral note moved into the levels card (it duplicated "Trusted").
- For developers: one line; the contract interface is behind a "Show the contract interface" disclosure.
- CTA: heading + button. One divider instead of two.

### App (`/app/...`)
- **No bar under the header.** The strip is gone; one pill ("● Sepolia testnet | Demo controls", icon-only on phones) sits on the right of each page title (`app-header.tsx`) and opens the demo controls.
- **Testnet line once per transaction:** only in the wallet prompt, for value-moving transactions. Removed from the Repay / Add collateral card, both dialogs, the withdraw step and the wizard's review step. The allowance prompt no longer shows the "signing a message is free" line (it only belonged to sign-in).
- Gate: feature bullets removed; line 16 → 6 words.
- No loan: eyebrow and body removed; example hint 8 → 5 words.
- Wizard: intro removed; step 1–3 body lines removed; "Loan asset", "Collateral" and the safe-amount button get an info icon (`src/components/ui/info-tip.tsx`, copied from the pilot) instead of a paragraph. Term and rate hints shortened. Review: the risk line is gone; the acknowledgement (now semibold) already states the price and date. Summary placeholder 10 → 6 words. "You already have a loan" body 17 → 8 words.
- Active loan: "Safe" only in the health card (removed next to the title); APR only in "Your loan" (removed from the health card); the market panel's intro and oracle note moved into an info icon; the "Reference price" line removed (Reset price is there); pool-demand hint 3–4 words; level-card note moved into an info icon, level hints ≤ 8 words.
- Repay: description 12 → 4 words, full-repayment note 11 → 5 words. Add collateral: description 9 → 5 words.
- Closed loan: liquidation explanations 20–35 → 7–9 words (the breakdown below shows the numbers).
- Demo controls: hints ≤ 6 words; reset confirmation 8 → 7 words.
- **One message, once:** no toast after a full repayment (the page becomes "Loan repaid") or after withdrawing (the card says "Collateral withdrawn to your wallet."). Partial repayment, added collateral, faucet and reset keep their toast (the dialog closes, nothing else says it). Toasts now sit 80px from the top (no strip to clear).

French was rewritten to the same brevity in `fr.ts`; keys are identical (typed dictionary) and unused keys were removed.

## 3. After

| Page | Visible before | Visible after | Change | Total before | Total after | Chrome before | Chrome after |
|-|-:|-:|-:|-:|-:|-:|-:|
| Home | 586 | 253 | −57% | 586 | 253 | 83 | 69 |
| How it works | 780 | 396 | −49% | 780 | 460 | 83 | 69 |
| Credits | 90 | 66 | −27% | 90 | 66 | 83 | 69 |
| 404 | 27 | 23 | −15% | 27 | 23 | 83 | 69 |
| App: connect gate | 56 | 16 | −71% | 56 | 16 | 86 | 69 |
| App: no loan | 138 | 85 | −38% | 138 | 85 | 88 | 71 |
| App: borrow, step 1 | 102 | 71 | −30% | 113 | 82 | 88 | 71 |
| App: borrow, step 2 | 174 | 126 | −28% | 185 | 137 | 88 | 71 |
| App: borrow, step 3 | 164 | 129 | −21% | 175 | 140 | 88 | 71 |
| App: borrow, step 4 (review) | 175 | 135 | −23% | 186 | 146 | 88 | 71 |
| App: active loan (example) | 336 | 260 | −23% | 341 | 265 | 88 | 71 |
| **Total** | **2,628** | **1,560** | **−41%** | **2,677** | **1,673** | **946** | **771** |

Marketing pages alone (home, how it works, credits, 404): 1,483 → 738 visible words (−50%). Most remaining app words are data: amounts, balances, dates, activity lines and the wizard's live summary.

Dictionary copy: **EN 3,219 → 2,157 words (−33%)**, FR 3,564 → 2,383 (−33%). Per section (EN): meta 126 → 126 · common 141 → 133 · loanTerms 44 → 44 · home 701 → 270 · app 1,300 → 1,013 · how 679 → 367 · credits 76 → 52 · pricing 151 → 151 (internal, unlinked page, left as is).

### Screenshots
- Before: `docs/screenshots/before/en-1440-light-page-home.png`, `docs/screenshots/before/en-1440-light-app-03-active-loan.png`.
- After: `docs/screenshots/en-1440-light-page-home.png`, `docs/screenshots/en-1440-light-app-03-active-loan.png`, and every other page and flow step in `docs/screenshots/` (EN 390/1440 light/dark, FR 390/1440 light). No file was renamed or removed, so the project image was not re-rendered.
