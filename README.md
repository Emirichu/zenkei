<p align="center">
  <img src="docs/banner.svg" alt="Zenkei — a private, in-browser personal finance dashboard" width="100%" />
</p>

<p align="center">
  <a href="./LICENSE"><img src="https://img.shields.io/badge/license-MIT-D96A8A" alt="MIT license" /></a>
  <img src="https://img.shields.io/badge/API%20keys-none%20required-5E9E86" alt="No API keys required" />
  <img src="https://img.shields.io/badge/works-offline-5B93A6" alt="Works offline" />
  <img src="https://img.shields.io/badge/made%20with-React%20·%20Vite%20·%20TypeScript-C9924A" alt="Made with React, Vite, TypeScript" />
  <img src="https://img.shields.io/badge/Rocket%20Money-not%20affiliated-A89AA1" alt="Not affiliated with Rocket Money" />
  <img src="https://img.shields.io/badge/financial%20advice-this%20is%20not-D25C63" alt="Not financial advice" />
</p>

**Zenkei** (全景, "the whole picture") is a Rocket Money–style personal finance dashboard that runs entirely in your browser: spending, subscriptions, budgets, net worth, planning, and an AI coach — with **no bank connection, no login, and no server**. Your data never leaves your device.

> Live demo: **[zenkei.io](https://zenkei.io)**

## Why I built this

Subscription trackers and budgeting apps all want the same thing first: your bank credentials. I wanted to see how much of that product you can rebuild with *zero* trust required — where the interesting parts (finding recurring charges, parsing messy statements, categorizing transactions, generating insights) are just algorithms running on your own machine. Zenkei is that experiment, and a portfolio piece: every chart is hand-built SVG, every parser is written from scratch, and the whole thing deploys as a static site.

## Screenshots

<!-- After deploying, drop a screenshot into docs/ and update the path below. -->
<p align="center">
  <img src="docs/screenshot-overview.png" alt="Zenkei overview tab (screenshot coming soon)" width="90%" />
</p>

## Features

| Tab | What it does |
| --- | --- |
| **Overview** | Category donut, spending-over-time chart, top merchants, recent activity, month-over-month deltas |
| **Subscriptions** | Detects recurring charges automatically; flags overlapping streaming services, duplicate memberships, and price increases; simulate cancellations |
| **Budgets** | Spend vs. budget per category with editable limits |
| **Net Worth** | Assets vs. liabilities, allocation donut, trend line |
| **Plan** | A "safe to spend" number, savings goals with months-to-goal, 6-month cash-flow forecast |
| **AI Coach** | Money-health score (0–100), plain-English insights, and an "ask your money anything" chat — all computed on-device; optionally add an OpenAI key for a written coaching note |
| **Import** | Paste CSV or messy statement text, upload a CSV, or upload a screenshot (read with in-browser OCR via Tesseract.js, or a vision model if you provide a key) |

Everything auto-saves to your browser's local storage: imported transactions, budget limits, and goals survive a refresh. With no input at all, Zenkei ships with six months of realistic, deterministic demo data so the dashboard looks alive the moment it loads.

The layout is responsive: on phones the sidebar becomes a top bar with swipeable tabs, cards stack into a single column, and wide tables scroll sideways inside their card.

## How the subscription detector works

No merchant database, no hardcoded list — just the shape of the data ([src/lib/subscriptions.ts](src/lib/subscriptions.ts)):

1. **Group** expenses by a normalized merchant key, so `NETFLIX.COM 0199` and `Netflix.com` land in the same bucket (rent is excluded — recurring, but not a subscription).
2. **Filter by amount stability**: a group needs 3+ charges whose amounts stay within ±25% of the median. Subscriptions cost the same every time; coffee runs don't.
3. **Check the cadence**: the median gap between charges has to land in a known window (weekly, biweekly, monthly, quarterly, yearly), and most gaps have to actually sit near that median — otherwise it's just a store you visit often. Monthly candidates also can't bill much more than once per calendar month spanned.
4. **Flag what's worth a look**: price increases (latest charge ≥ 8% over the first), 3+ overlapping streaming services, 2+ fitness memberships, and unusually expensive subscriptions.

## How the parser works

The import tab accepts almost anything ([src/lib/parser.ts](src/lib/parser.ts)). It sniffs the input and picks one of two modes:

- **CSV mode** — detects the delimiter (`,` `;` `|` tab), maps columns from the header row if there is one, and otherwise infers them: the first cell that parses as a date, the longest non-numeric cell as the description, the rightmost money-like cell as the amount. Separate debit/credit columns work too.
- **Freeform mode** — for messy pasted statement text, each line is scanned for a date-ish token and a trailing amount; whatever's left over becomes the description. `CR`/`DR` suffixes, parentheses, and income words (payroll, refund, deposit…) decide the sign.

Parsed rows then go through a rules-based categorizer (~250 merchant keywords across 12 categories) and a merchant-name cleaner that strips card jargon, store numbers, and trailing state/zip codes. If you paste an OpenAI key, parsing can be delegated to an LLM instead — and if that call fails, it falls back to the built-in parser.

## Honest caveats

- The detector needs **3+ occurrences** of a charge, so a subscription you started last month won't show up yet — with monthly billing you need roughly three months of history.
- Sign inference on unsigned amounts is a heuristic. A refund from a merchant with no income keywords will be read as spending.
- OCR quality depends on the screenshot. A clean, cropped shot of just the transaction table works; a full-page photo of a monitor doesn't.
- The Net Worth tab uses illustrative demo accounts — there's no UI to edit them yet.
- Auto-save is per-browser local storage: it doesn't sync between devices, and clearing site data clears Zenkei.
- The categorizer is keyword-based and English/US-centric out of the box.

## Privacy

There is no backend, no analytics, and no tracking. Transactions, budgets, and goals live in `localStorage` in your browser. The only network calls are: Google Fonts, the Tesseract.js OCR library (fetched from a CDN on first screenshot import), and — only if *you* paste your own OpenAI key — direct browser-to-OpenAI requests. The key is held in component state for the current tab and never stored.

## Run it locally

```bash
npm install
npm run dev      # dev server at http://localhost:5173
npm run build    # type-checks and builds to dist/
npm run preview  # serves the production build
```

Built with React 18, Vite, and TypeScript. No chart library — the donut, area chart, and score ring are hand-built SVG components in [src/components/charts](src/components/charts). New to the codebase? Start with [docs/CODE_TOUR.md](docs/CODE_TOUR.md).

## Deploy

Zenkei builds to a fully static `dist/` folder, so it hosts anywhere. On Vercel: import the repo, pick the **Vite** framework preset (build `npm run build`, output `dist` — also pinned in [vercel.json](vercel.json)), and deploy. No environment variables needed.

## Disclaimer

Zenkei is a personal portfolio project, **not financial advice**. It ships with realistic sample data so you can explore it without importing anything.

Rocket Money is a trademark of its respective owner. Zenkei is an independent, open-source project and is **not affiliated with, endorsed by, or sponsored by** Rocket Money or Rocket Companies. Any reference to Rocket Money is for descriptive comparison only.

## License

MIT — see [LICENSE](./LICENSE).
