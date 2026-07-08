# Code tour

A plain-English walk through the Zenkei codebase for someone seeing it for the first time. Total reading time: ~10 minutes.

## The one-paragraph version

Zenkei is a static React app. On load it either reads your previously imported transactions from `localStorage` or generates six months of seeded demo data. Every tab is a pure function of that one transaction list: analytics are rolled up in [`src/lib`](../src/lib), rendered by components in [`src/components`](../src/components). There is no backend, no router, and no global state library — one `App` component owns all the state and passes it down.

```
index.html            entry page: fonts, meta, an error fallback, and the module script
src/
  main.tsx            mounts <App /> into #root
  App.tsx             all app state (nav, transactions, budgets, goals) + tab switching
  index.css           the sakura theme: CSS variables, fonts, animations
  lib/                pure logic — no React imports here (except types)
  components/         the UI — one file per tab, plus shared bits and charts
```

## src/lib — the logic

Each module is pure and independently testable. If you want to understand Zenkei, read these in order:

### `types.ts`
The shared vocabulary. The most important type is `Transaction`: `{ id, date, merchant, description, amount, category }`, where `amount` is negative for spending and positive for income. Everything else is derived from arrays of these.

### `categories.ts`
The categorizer. `RULES` is an ordered list of ~250 keywords across 12 categories — first match wins, so specific categories (Subscriptions) are checked before broad ones (Shopping). `cleanMerchant` turns statement noise like `NETFLIX.COM 310-555-0199 CA` into a display name (`Netflix.com`) by stripping card jargon, store numbers, dates, and trailing state/zip. `merchantKey` normalizes harder — lowercase, strip non-letters and filler words, keep the first three words — so different-looking charges from the same merchant group together.

### `demoData.ts`
The seeded demo world. `mulberry32` is a tiny deterministic PRNG, so `generateDemoData()` produces the *same* six months of transactions on every load: biweekly payroll, rent, utilities, 15 subscriptions (Netflix gets a mid-year price bump on purpose, so the detector has something to find), plus randomized-but-plausible groceries, dining, transport, shopping, and travel. Also home to the demo net-worth accounts, default budgets, and default goals.

### `subscriptions.ts`
The subscription detector — the algorithmic heart of the project. In short: group expenses by `merchantKey`, keep groups of 3+ charges with near-identical amounts (±25% of median), compute the median gap between charges, and accept the group only if that gap lands in a known cadence window (weekly / biweekly / monthly / quarterly / yearly) *and* most gaps sit near the median. Then a flagging pass marks price increases, overlapping streaming services, duplicate fitness memberships, and high-cost subscriptions. The README has a longer explanation of why each rule exists.

### `parser.ts`
The import parser. `parseTransactions` sniffs whether the text looks like a CSV (delimiter frequency across lines) and branches:

- **CSV path**: `detectDelimiter` → `splitCSVLine` (quote-aware) → `findHeaderMap` (regex-matches header names like "posted", "payee", "money out"). Missing columns are inferred — first parseable date, longest non-numeric cell, rightmost money-like cell. Debit/credit column pairs are handled.
- **Freeform path**: per line, find a date-ish token and a trailing amount; the leftovers are the description.

Two helpers do the dirty work: `parseAmount` (handles `$1,234.56`, `(45.00)`, `12.99 DR`) and `parseDate` (ISO, US-style, "Jul 3, 2026"). Unsigned amounts default to spending unless the row contains income words.

### `analytics.ts`
`computeAnalytics` rolls the transaction list into everything the UI needs in one pass: per-month income/spend/category buckets, chart series, top merchants, per-merchant totals, averages, and month-over-month percentage changes. `nextMonths` and `monthLabel` are small date helpers for the forecast chart.

### `insights.ts`
The on-device "AI". Three functions:

- `generateInsights` — rule-based observations (savings rate vs. the 20% rule, what drove a spending spike, budget overages, subscription waste, discretionary share).
- `moneyScore` — the 0–100 health score: start at 50, add up to ±30 for savings rate, +12 / down to −18 for budget adherence, up to −12 for flagged-subscription waste, ±6 for the spending trend, clamp to 5–99.
- `answerQuery` — the chat. Keyword-matches a question to subscriptions, a category, savings rate, income, net worth, top merchant/category, or overall spend, and answers from the analytics object. No network, no model.

### `storage.ts`, `ocr.ts`, `openai.ts`
Small and self-contained. `storage.ts` wraps `localStorage` behind a feature test so private-mode browsers just lose auto-save instead of crashing. `ocr.ts` lazy-loads Tesseract.js from a CDN only when a screenshot is uploaded. `openai.ts` holds the three optional bring-your-own-key calls (text parse, vision parse, coaching note); nothing in it runs unless the user pastes a key.

## src/components — the UI

### `App.tsx`
Owns the four pieces of state: current tab, imported transactions (or `null` → demo data), budgets, goals. The three data pieces initialize from `localStorage` and write back through `useEffect`. `analytics` and `subs` are `useMemo`-derived from whichever transaction list is active. Tab switching is a simple conditional render — no router, so the URL never carries state.

### `Sidebar.tsx`
Navigation plus the hand-drawn SVG artwork: the five-petal sakura logo (one petal path rotated 72° at a time) and the little cherry-tree scene. Also the data-source card that shows Demo Mode vs. Your Data, "Back to demo", and Reset.

### `charts/`
No chart library — three hand-built SVG components:

- **`Donut.tsx`** — each slice is a full circle whose visible arc is carved with `stroke-dasharray`, offset by the running total of previous slices.
- **`AreaChart.tsx`** — maps points into a fixed viewBox, draws a gradient-filled area, grid lines, and invisible per-point hover rectangles that drive a floating tooltip.
- **`ScoreRing.tsx`** — the Coach tab's 0–100 ring, same dasharray trick as the donut.

### The tabs
`Overview`, `Subscriptions`, `Budgets`, `NetWorth`, `Plan`, `Coach`, `Importer` — one file each, all pure renderings of props except for small local state (the cancel-simulation toggles, chat history, form inputs). `ui.tsx` holds the shared `Card`, `Eyebrow`, `Delta`, `Kpi` components and button styles.

The `Importer` is the busiest: it wires the textarea/file/screenshot inputs into `parseTransactions` (or the OpenAI paths when a key is provided, with fallback to the built-in parser on failure), previews the result, and hands the rows up to `App` via `onImport`.

## The theme

All styling is inline `style` objects plus one small [`index.css`](../src/index.css) that defines the palette as CSS variables (`--bg`, `--accent`, `--good`…), the two animations (`fade-in`, `grow`), and the typography: Shippori Mincho for headings, Inter for body text, IBM Plex Mono for numbers and labels.

## How to extend it

- **Add a category**: add a color in `CATS` and keywords in `RULES` (`categories.ts`), plus a default limit in `DEFAULT_BUDGETS` (`demoData.ts`).
- **Add an insight**: push another rule into `generateInsights` (`insights.ts`) — it's just an ordered list of checks.
- **Teach the chat something**: add a regex branch to `answerQuery` (`insights.ts`).
- **Support a new statement format**: extend `parseDate`/`parseAmount` or the header regexes in `findHeaderMap` (`parser.ts`).
