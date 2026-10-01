// Visual check of every page and key flow with Playwright.
// Usage: pnpm build && pnpm start -p 3133   (in another terminal)
//        BASE_URL=http://localhost:3133 pnpm screenshots
// Output: docs/screenshots/<locale>-<width>-<theme>-<name>.png
import { mkdir } from "node:fs/promises"
import { fileURLToPath } from "node:url"
import { chromium } from "playwright"

const BASE = process.env.BASE_URL ?? "http://localhost:3000"
const OUT = fileURLToPath(new URL("../docs/screenshots/", import.meta.url))
const ONLY = process.env.ONLY // optional filter, e.g. "en-390-light"

const sizes = { 390: { width: 390, height: 844 }, 1440: { width: 1440, height: 900 } }
const variants = []
for (const w of [390, 1440]) for (const theme of ["light", "dark"]) variants.push({ locale: "en", w, theme, full: true })
for (const w of [390, 1440]) variants.push({ locale: "fr", w, theme: "light", full: false })

const L = {
  en: {
    connect: "Connect demo wallet",
    confirm: "Confirm",
    reject: "Reject",
    yourLoans: "Your loans",
    loanTitle: /against/,
    simulate: "Simulate the market",
    request: "Request a loan",
    cont: "Continue",
    amount: "Amount",
    lock: "Amount to lock",
    safe: /Use the safe amount/,
    ack: /I understand my collateral/,
    sign: "Start signing",
    retry: "Try again",
    goLoan: "Go to your loan",
    controls: "Demo controls",
    failNext: "Fail the next transaction",
    menu: "Open menu",
  },
  fr: {
    connect: "Connecter le portefeuille de démo",
    confirm: "Confirmer",
    reject: "Refuser",
    yourLoans: "Vos prêts",
    loanTitle: /contre/,
    simulate: "Simuler le marché",
    request: "Demander un prêt",
    cont: "Continuer",
    amount: "Montant",
    lock: "Montant à bloquer",
    safe: /Utiliser le montant sûr/,
    ack: /Je comprends que ma garantie/,
    sign: "Commencer la signature",
    retry: "Réessayer",
    goLoan: "Voir votre prêt",
    controls: "Contrôles de la démo",
    failNext: "Faire échouer la prochaine transaction",
    menu: "Ouvrir le menu",
  },
}

async function newPage(browser, { locale, w, theme }) {
  const context = await browser.newContext({
    viewport: sizes[w],
    colorScheme: theme,
    locale: locale === "fr" ? "fr-CA" : "en-CA",
    reducedMotion: "reduce",
  })
  await context.addInitScript((t) => {
    try {
      window.localStorage.setItem("theme", t)
    } catch {}
  }, theme)
  const page = await context.newPage()
  page.on("pageerror", (e) => console.log("  ! pageerror", e.message))
  return { context, page }
}

const shot = async (page, v, name, fullPage = false) => {
  await page.waitForTimeout(350)
  // Full-page captures start at the top so the sticky header doesn't land mid-page.
  if (fullPage) {
    await page.evaluate(() => window.scrollTo(0, 0))
    await page.waitForTimeout(150)
  }
  await page.screenshot({ path: `${OUT}${v.locale}-${v.w}-${v.theme}-${name}.png`, fullPage })
  console.log("  ✓", `${v.locale}-${v.w}-${v.theme}-${name}`)
}

const prompt = (page) => page.getByRole("dialog").filter({ has: page.getByRole("button", { name: L.en.reject }).or(page.getByRole("button", { name: L.fr.reject })) })

async function confirmPrompt(page, t) {
  const p = prompt(page)
  await p.waitFor()
  await p.getByRole("button", { name: t.confirm }).click()
  await p.waitFor({ state: "hidden" })
}

async function connect(page, v, capture) {
  const t = L[v.locale]
  await page.goto(`${BASE}/${v.locale}/app`, { waitUntil: "networkidle" })
  const btn = page.getByRole("main").getByRole("button", { name: t.connect })
  await btn.waitFor()
  if (capture) await shot(page, v, "app-01-gate", true)
  await btn.click()
  await prompt(page).waitFor()
  if (capture) await shot(page, v, "flow1-connect-prompt")
  await confirmPrompt(page, t)
  await page.getByRole("heading", { level: 1, name: t.yourLoans, exact: true }).waitFor({ timeout: 10000 })
}

async function marketing(page, v) {
  const pages = [["home", ""]]
  if (v.full) pages.push(["how-it-works", "/how-it-works"], ["credits", "/credits"], ["pricing", "/pricing"], ["404", "/this-page-does-not-exist"])
  for (const [name, path] of pages) {
    await page.goto(`${BASE}/${v.locale}${path}`, { waitUntil: "networkidle" })
    await page.waitForTimeout(400)
    await shot(page, v, `page-${name}`, true)
  }
  if (v.w < 768 && v.full) {
    await page.goto(`${BASE}/${v.locale}`, { waitUntil: "networkidle" })
    await page.getByRole("button", { name: L[v.locale].menu }).click()
    await page.getByRole("dialog").waitFor()
    await shot(page, v, "page-mobile-menu")
  }
}

async function setFailNext(page, t) {
  await page.getByRole("button", { name: t.controls }).click()
  await page.getByLabel(t.failNext).click()
  await page.keyboard.press("Escape")
  await page.getByRole("dialog").waitFor({ state: "hidden" })
}

async function requestLoan(page, v, capture) {
  const t = L[v.locale]
  await page.getByRole("link", { name: t.request }).click()
  await page.getByRole("heading", { level: 1, name: t.request }).waitFor()
  await page.getByRole("button", { name: t.cont }).click()
  if (capture) await shot(page, v, "flow2-step1-errors", true)
  await page.getByLabel(t.amount, { exact: true }).fill("2000")
  if (capture) await shot(page, v, "flow2-step1-need", true)
  await page.getByRole("button", { name: t.cont }).click()
  await page.getByLabel(t.lock).fill("0.7")
  await page.getByRole("button", { name: t.cont }).click()
  if (capture) await shot(page, v, "flow2-step2-over-limit", true)
  await page.getByRole("button", { name: t.safe }).click()
  if (capture) await shot(page, v, "flow2-step2-lock", true)
  await page.getByRole("button", { name: t.cont }).click()
  if (capture) await shot(page, v, "flow2-step3-terms", true)
  await page.getByRole("button", { name: t.cont }).click()
  if (capture) {
    await shot(page, v, "flow2-step4-review", true)
    await setFailNext(page, t)
  }
  await page.getByLabel(t.ack).click()
  await page.getByRole("button", { name: t.sign }).click()
  await prompt(page).waitFor()
  if (capture) await shot(page, v, "flow2-approve-prompt")
  await confirmPrompt(page, t)
  if (capture) {
    await shot(page, v, "flow2-approve-pending")
    await page.getByRole("button", { name: t.retry }).waitFor({ timeout: 10000 })
    await shot(page, v, "flow2-approve-failed", true)
    await page.getByRole("button", { name: t.retry }).click()
    await confirmPrompt(page, t)
  }
  await confirmPrompt(page, t)
  if (capture) await shot(page, v, "flow2-lock-pending")
  await page.getByRole("link", { name: t.goLoan }).waitFor({ timeout: 10000 })
  if (capture) await shot(page, v, "flow2-opened", true)
  await page.getByRole("link", { name: t.goLoan }).click()
  await page.getByRole("heading", { level: 1, name: t.loanTitle }).waitFor()
  await page.waitForTimeout(500)
  await shot(page, v, "app-03-active-loan", true)
}

async function appFlows(page, v) {
  const t = L[v.locale]
  await connect(page, v, true)
  await shot(page, v, "app-02-empty", true)

  if (v.full) {
    // Rejected sign-in (failure state of flow 1)
    await page.evaluate(() => {
      const s = JSON.parse(localStorage.getItem("borrowx-demo-v1"))
      s.wallet.status = "disconnected"
      localStorage.setItem("borrowx-demo-v1", JSON.stringify(s))
    })
    await page.reload({ waitUntil: "networkidle" })
    await page.getByRole("main").getByRole("button", { name: t.connect }).click()
    await prompt(page).getByRole("button", { name: t.reject }).click()
    await page.getByText("You declined the sign-in request").waitFor()
    await shot(page, v, "flow1-connect-rejected")
    await page.getByRole("main").getByRole("button", { name: t.connect }).click()
    await confirmPrompt(page, t)
    await page.getByRole("heading", { level: 1, name: t.yourLoans, exact: true }).waitFor()
  }

  // Flow 2: request a loan
  await requestLoan(page, v, true)
  if (!v.full) return

  // Flow 3: partial repayment, full repayment, withdraw
  await page.getByRole("button", { name: "Repay", exact: true }).click()
  await page.getByLabel("Amount to repay").fill("500")
  await shot(page, v, "flow3-repay-dialog")
  await page.getByRole("button", { name: /^Repay 500/ }).click()
  await confirmPrompt(page, t)
  await page.getByText("Payment confirmed").waitFor({ timeout: 10000 })
  await shot(page, v, "flow3-repaid-partial")
  await page.getByRole("button", { name: "Repay", exact: true }).click()
  await page.getByRole("radio", { name: "Everything" }).click()
  await shot(page, v, "flow3-repay-full-dialog")
  await page.getByRole("button", { name: "Repay everything" }).click()
  await confirmPrompt(page, t)
  await page.getByRole("heading", { name: "Loan repaid" }).waitFor({ timeout: 10000 })
  await page.waitForTimeout(600)
  await shot(page, v, "flow3-loan-repaid", true)
  await page.getByRole("button", { name: /^Withdraw/ }).click()
  await confirmPrompt(page, t)
  await page.getByText("Collateral withdrawn to your wallet.").waitFor({ timeout: 10000 })
  await shot(page, v, "flow3-withdrawn")
  await page.getByRole("button", { name: "Move to history" }).click()
  await page.getByRole("heading", { level: 1, name: t.yourLoans, exact: true }).waitFor()

  // Flow 4: several loans; one tETH drop hits both tETH loans, then rescue one with collateral
  await page.getByRole("button", { name: "Explore a running example" }).click()
  await page.getByRole("link", { name: "2,000 tUSDC against tETH" }).first().waitFor()
  await page.waitForTimeout(500)
  await shot(page, v, "app-04-overview", true)
  await page.getByRole("button", { name: t.simulate }).click()
  await page.getByRole("radio", { name: "tETH" }).click()
  await page.getByRole("button", { name: /25\s?%/ }).click()
  await page.waitForTimeout(600)
  await shot(page, v, "flow4-overview-price-drop", true)
  await page.getByRole("link", { name: "2,000 tUSDC against tETH" }).first().click()
  await page.getByText("Your loan is at risk").waitFor()
  await page.evaluate(() => window.scrollTo(0, 0))
  await shot(page, v, "flow4-at-risk", true)
  await page.getByRole("button", { name: "Add collateral" }).first().click()
  await page.getByRole("button", { name: /to get back to safe/ }).click()
  await shot(page, v, "flow4-add-collateral")
  await page.getByRole("dialog").getByRole("button", { name: "Add collateral" }).click()
  await confirmPrompt(page, t) // allowance
  await confirmPrompt(page, t) // add
  await page.getByText("Collateral added").waitFor({ timeout: 15000 })
  await page.evaluate(() => window.scrollTo(0, 0))
  await shot(page, v, "flow4-rescued", true)

  // Flow 5: a crash, automatic liquidation (price slider down to its floor, well below the liquidation price)
  await page.getByRole("slider").focus()
  await page.keyboard.press("Home")
  await page.getByText(/A liquidator is closing your loan/).waitFor()
  await page.evaluate(() => window.scrollTo(0, 0))
  await shot(page, v, "flow5-liquidating")
  await page.getByRole("heading", { name: "Your loan was liquidated" }).waitFor({ timeout: 15000 })
  await page.evaluate(() => window.scrollTo(0, 0))
  await shot(page, v, "flow5-liquidated", true)
}

await mkdir(OUT, { recursive: true })
const browser = await chromium.launch()
for (const v of variants) {
  const key = `${v.locale}-${v.w}-${v.theme}`
  if (ONLY && !key.includes(ONLY)) continue
  console.log(key)
  const { context, page } = await newPage(browser, v)
  await marketing(page, v)
  await appFlows(page, v)
  await context.close()
}
await browser.close()
