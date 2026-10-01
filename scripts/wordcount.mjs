// Word counts per page (English), for the simplification pass.
// Usage: pnpm build && pnpm start -p 3134   (in another terminal)
//        node scripts/wordcount.mjs          (BASE_URL defaults to http://localhost:3134)
// Prints a Markdown table:
//   visible = words in <main> a visitor can read without opening anything (innerText)
//   total   = every word in <main>, including closed disclosures, FAQ answers, tooltips' text nodes
//   chrome  = visible words outside <main> (header, app bar, footer)
import { chromium } from "playwright"

const BASE = process.env.BASE_URL ?? "http://localhost:3134"

async function measure(page) {
  return page.evaluate(() => {
    const main = document.querySelector("main")
    const words = (s) => (s.match(/[\p{L}\p{N}][\p{L}\p{N}'’.,-]*/gu) ?? []).length
    const all = []
    const walker = document.createTreeWalker(main, NodeFilter.SHOW_TEXT, {
      acceptNode: (n) => (n.parentElement?.closest("script,style,svg") ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT),
    })
    while (walker.nextNode()) all.push(walker.currentNode.nodeValue)
    const visible = words(main.innerText)
    const total = words(all.join(" "))
    const chrome = words(document.body.innerText) - visible
    return { visible, total, chrome }
  })
}

const browser = await chromium.launch()
const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: "en-CA", reducedMotion: "reduce" })
const page = await context.newPage()
const rows = []
const add = async (name) => {
  await page.waitForTimeout(600)
  rows.push({ name, ...(await measure(page)) })
}

for (const [name, path] of [
  ["Home", "/en"],
  ["How it works", "/en/how-it-works"],
  ["Credits", "/en/credits"],
  ["404", "/en/this-page-does-not-exist"],
]) {
  await page.goto(`${BASE}${path}`, { waitUntil: "networkidle" })
  await add(name)
}

const prompt = page.getByRole("dialog").filter({ has: page.getByRole("button", { name: "Reject" }) })
const confirm = async () => {
  await prompt.waitFor()
  await prompt.getByRole("button", { name: "Confirm", exact: true }).click()
  await prompt.waitFor({ state: "hidden" })
}

await page.goto(`${BASE}/en/app`, { waitUntil: "networkidle" })
await page.getByRole("main").getByRole("button", { name: /connect/i }).waitFor()
await add("App: connect gate")
await page.getByRole("main").getByRole("button", { name: /connect/i }).click()
await confirm()
await page.getByRole("heading", { level: 1, name: "Your loan", exact: true }).waitFor()
await add("App: no loan")

await page.getByRole("link", { name: "Request a loan" }).click()
await page.getByRole("heading", { level: 1, name: "Request a loan" }).waitFor()
await add("App: borrow, step 1")
await page.getByLabel("Amount", { exact: true }).fill("2000")
await page.getByRole("button", { name: "Continue" }).click()
await page.getByRole("button", { name: /Use the safe amount/ }).click()
await add("App: borrow, step 2")
await page.getByRole("button", { name: "Continue" }).click()
await add("App: borrow, step 3")
await page.getByRole("button", { name: "Continue" }).click()
await add("App: borrow, step 4 (review)")

await page.goto(`${BASE}/en/app`, { waitUntil: "networkidle" })
await page.getByRole("button", { name: "Explore a running example" }).click()
await page.getByRole("heading", { name: /move the market/i }).waitFor()
await add("App: active loan (example)")

await browser.close()

const sum = (k) => rows.reduce((s, r) => s + r[k], 0)
console.log("| Page | Visible in main | Total in main (incl. collapsed) | Chrome (header, app bar, footer) |")
console.log("|-|-:|-:|-:|")
for (const r of rows) console.log(`| ${r.name} | ${r.visible} | ${r.total} | ${r.chrome} |`)
console.log(`| **Total** | **${sum("visible")}** | **${sum("total")}** | **${sum("chrome")}** |`)
