# 🌸 Zenkei

**A free, open-source take on Rocket Money that runs entirely in your browser.**

Zenkei is a Rocket Money-style personal finance dashboard, rebuilt from scratch as a portfolio project. It recreates the core of Rocket Money (spending tracking, subscription detection, budgets, and net worth) and reimagines it to be completely private, with **no bank connection, no login, and no server**. It also adds an AI coach that explains your money in plain words. Everything runs on your device, and nothing is ever uploaded.

> Live demo: **[zenkei.io](https://zenkei.io)**

---

## Screenshots

<!-- Add a screenshot named screenshot.png to the repo root, then uncomment the line below. A screenshot or GIF is the single biggest thing that makes a repo look good. -->
<!-- ![Zenkei dashboard](./screenshot.png) -->

_Drop a `screenshot.png` in the repo root and uncomment the image line above._

## Features

- **Spending overview** — charts by category and over time, top merchants, recent activity.
- **Subscription detector** — automatically finds recurring charges, totals them monthly and yearly, and flags overlapping streaming, duplicate memberships, and price increases worth cancelling.
- **Budgets** — spend vs. budget per category with editable limits.
- **Net worth** — assets vs. liabilities with an allocation breakdown and trend.
- **Plan** — a "safe-to-spend" number, savings goals with months-to-goal, and a 6-month cash-flow forecast.
- **AI Coach** — a money-health score, plain-English insights, and an "ask your money anything" chat, all computed on-device (with an optional OpenAI key for a written coaching note).
- **Import anything** — paste CSV or messy statement text, upload a CSV, or drop in a **screenshot** of a statement. A smart on-device parser cleans and categorizes it. Screenshots are read with in-browser OCR, or with a vision model if you add your own key.
- **Auto-save** — your imported data, budgets, and goals persist locally in your browser.

## Privacy

Zenkei has no backend. There are no accounts and no analytics. Your financial data lives only in your browser via local storage and is never sent anywhere. The only optional network calls happen if *you* choose to paste your own OpenAI API key for AI parsing, and those go directly from your browser to OpenAI.

## Tech

- Single `index.html` file, no build step required.
- **React 18** (inlined, so it works fully offline).
- Hand-built **SVG charts** (donut, area, progress rings) — no chart library.
- A rules-based transaction parser and subscription-detection engine written from scratch.
- In-browser OCR via **Tesseract.js** (loaded on demand) for screenshot import.
- Optional **OpenAI** (LLM + vision) integration for higher-accuracy parsing and coaching.

## Run it locally

It's one file. Just open `index.html` in any modern browser. That's it.

```bash
# or serve it, if you prefer
python3 -m http.server
```

## Deploy

Because it's a single static file, it deploys anywhere: Netlify, Cloudflare Pages, GitHub Pages, Vercel, or any static host. Point your domain at it and you're live.

## Roadmap

- CSV export of cleaned data
- Optional cloud sync (accounts) via a hosted backend
- Recurring-bill calendar
- Dark mode

## Disclaimer

Zenkei is a personal project and a portfolio demo, not financial advice. It ships with realistic sample data so you can explore it immediately.

Rocket Money is a trademark of its respective owner. Zenkei is an independent, open-source project and is **not affiliated with, endorsed by, or sponsored by** Rocket Money or Rocket Companies. Any reference to Rocket Money is for descriptive comparison only.

## License

MIT — see [LICENSE](./LICENSE).
