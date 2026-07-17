import { monthLabel } from "./analytics";
import { CATS } from "./categories";
import { DEMO_ACCOUNTS } from "./demoData";
import { fmtUSD } from "./format";
import type { Analytics, Budgets, Insight, Subscription, Transaction } from "./types";

/** Rule-based, on-device insights: savings rate vs the 20% rule,
 * month-over-month swings (and which category drove them), budget
 * overages, subscription waste, top category, and discretionary load. */
export function generateInsights(a: Analytics, subs: Subscription[], budgets: Budgets): Insight[] {
  const out: Insight[] = [];
  const net = a.curIncome - a.curSpend;
  const sr = a.curIncome ? (net / a.curIncome) * 100 : 0;
  if (sr >= 20)
    out.push({
      tone: "good",
      title: `Strong savings rate — ${sr.toFixed(0)}%`,
      body: `You kept ${fmtUSD(net)} of your ${fmtUSD(a.curIncome)} income this month, comfortably above the 20% rule of thumb.`,
    });
  else if (sr >= 0)
    out.push({
      tone: "warn",
      title: `Savings rate is ${sr.toFixed(0)}%`,
      body: `You saved ${fmtUSD(net)} this month. Reaching 20% (${fmtUSD(a.curIncome * 0.2)}) would mean freeing up about ${fmtUSD(Math.max(0, a.curIncome * 0.2 - net))}.`,
    });
  else
    out.push({
      tone: "bad",
      title: `Spending outpaced income`,
      body: `You're down ${fmtUSD(-net)} this month. Worth finding a couple of categories to pull back on.`,
    });
  if (a.prevSpend > 0) {
    if (a.spendChange > 8) {
      const pc = a.byMonth[a.prev!].cats,
        cc = a.curCats;
      let drv: string | null = null,
        dm = 0;
      Object.keys(cc).forEach((c) => {
        const d = (cc[c] || 0) - (pc[c] || 0);
        if (d > dm) {
          dm = d;
          drv = c;
        }
      });
      out.push({
        tone: "warn",
        title: `Spending up ${a.spendChange.toFixed(0)}% vs last month`,
        body: `That's ${fmtUSD(a.curSpend - a.prevSpend)} more${drv ? `, mostly from ${drv} (+${fmtUSD(dm)})` : ""}.`,
      });
    } else if (a.spendChange < -5) {
      out.push({
        tone: "good",
        title: `Spending down ${Math.abs(a.spendChange).toFixed(0)}% vs last month`,
        body: `You spent ${fmtUSD(a.prevSpend - a.curSpend)} less than last month. Nice work.`,
      });
    }
  }
  const overs = Object.keys(budgets)
    .map((c) => ({ c, over: (a.curCats[c] || 0) - budgets[c] }))
    .filter((x) => x.over > 0)
    .sort((x, y) => y.over - x.over);
  if (overs.length) {
    const tot = overs.reduce((s, x) => s + x.over, 0);
    out.push({
      tone: "bad",
      title: `Over budget in ${overs.length} categor${overs.length > 1 ? "ies" : "y"}`,
      body: `${overs.slice(0, 3).map((x) => `${x.c} +${fmtUSD(x.over)}`).join(", ")}${overs.length > 3 ? "…" : ""}. Total overage ${fmtUSD(tot)}.`,
    });
  }
  const subTotal = subs.reduce((s, x) => s + x.monthly, 0);
  const flagged = subs.filter((s) => s.suggestCancel);
  const save = flagged.reduce((s, x) => s + x.monthly, 0);
  if (flagged.length)
    out.push({
      tone: "warn",
      title: `${flagged.length} subscriptions worth a look`,
      body: `You spend ${fmtUSD(subTotal)}/mo across ${subs.length} recurring services. Cancelling the flagged ones frees up ${fmtUSD(save)}/mo — around ${fmtUSD(save * 12)} a year.`,
    });
  else if (subs.length)
    out.push({
      tone: "info",
      title: `${fmtUSD(subTotal)}/mo in subscriptions`,
      body: `Across ${subs.length} recurring services. Nothing looks wasteful right now.`,
    });
  const cats = Object.entries(a.curCats).sort((x, y) => y[1] - x[1]);
  if (cats.length && a.curSpend > 0) {
    const [tc, tv] = cats[0];
    out.push({
      tone: "info",
      title: `${tc} leads your spending`,
      body: `${fmtUSD(tv)} this month — ${((tv / a.curSpend) * 100).toFixed(0)}% of everything you spent.`,
    });
  }
  const disc = (a.curCats.Dining || 0) + (a.curCats.Entertainment || 0) + (a.curCats.Shopping || 0);
  if (a.curSpend > 0 && disc / a.curSpend > 0.3)
    out.push({
      tone: "warn",
      title: `Discretionary spending is ${((disc / a.curSpend) * 100).toFixed(0)}%`,
      body: `Dining, shopping and entertainment came to ${fmtUSD(disc)} — usually the easiest place to trim.`,
    });
  return out;
}

/** 0-100 money-health score. Starts at 50, then: savings rate moves it
 * up to ±30, staying inside total budget +12 (overage scales down to
 * −18), flagged-subscription waste up to −12, and the month-over-month
 * spending trend ±6. Clamped to 5-99 so it never reads as a grade. */
export function moneyScore(a: Analytics, subs: Subscription[], budgets: Budgets): number {
  const net = a.curIncome - a.curSpend;
  const sr = a.curIncome ? net / a.curIncome : 0;
  let score = 50;
  score += Math.max(-30, Math.min(30, sr * 100));
  const totB = Object.values(budgets).reduce((s, x) => s + x, 0);
  const totS = Object.keys(budgets).reduce((s, c) => s + (a.curCats[c] || 0), 0);
  score += totS <= totB ? 12 : Math.max(-18, -((totS - totB) / totB) * 40);
  const waste = subs.filter((s) => s.suggestCancel).reduce((s, x) => s + x.monthly, 0);
  score -= Math.min(12, (a.curSpend ? waste / a.curSpend : 0) * 120);
  if (a.prevSpend > 0) {
    if (a.spendChange > 10) score -= 6;
    else if (a.spendChange < -5) score += 6;
  }
  return Math.max(5, Math.min(99, Math.round(score)));
}

/** The "ask your money anything" chat, answered entirely on-device:
 * keyword-match the question to subscriptions, a category, savings
 * rate, income, net worth, top merchant/category, or overall spend. */
export function answerQuery(text: string, a: Analytics, subs: Subscription[], _txns: Transaction[]): string {
  const q = text.toLowerCase();
  if (/subscription|subscrib|recurring/.test(q)) {
    const tot = subs.reduce((s, x) => s + x.monthly, 0);
    const fl = subs.filter((s) => s.suggestCancel).length;
    return `You have ${subs.length} recurring subscriptions totaling ${fmtUSD(tot)}/mo (${fmtUSD(tot * 12)}/yr). ${fl ? `${fl} are flagged as worth reviewing.` : "None look wasteful right now."}`;
  }
  const catNames = Object.keys(CATS);
  const catHit = catNames.find(
    (c) =>
      c !== "Income" &&
      (q.includes(c.toLowerCase()) ||
        (c === "Dining" && /\bdine|dining|eat|restaurant|food|coffee\b/.test(q)) ||
        (c === "Transport" && /transport|gas|uber|lyft|commut|fuel\b/.test(q)) ||
        (c === "Groceries" && /grocer|supermarket/.test(q)) ||
        (c === "Entertainment" && /entertain|movie|game|concert/.test(q)) ||
        (c === "Health" && /health|pharmacy|doctor|gym/.test(q)))
  );
  if (catHit) {
    const cur = a.curCats[catHit] || 0;
    const tot = a.catTotals[catHit] || 0;
    const avg = tot / (a.monthKeys.length || 1);
    return `You spent ${fmtUSD(cur)} on ${catHit} in ${monthLabel(a.cur)}, averaging ${fmtUSD(avg)}/mo over the last ${a.monthKeys.length} months.`;
  }
  if (/savings rate|how much.*save|do i save/.test(q)) {
    const net = a.curIncome - a.curSpend;
    const sr = a.curIncome ? (net / a.curIncome) * 100 : 0;
    return `Your savings rate in ${monthLabel(a.cur)} was ${sr.toFixed(0)}% — you kept ${fmtUSD(net)} of ${fmtUSD(a.curIncome)} income.`;
  }
  if (/income|earn|make|salary|paid|paycheck/.test(q))
    return `You brought in ${fmtUSD(a.curIncome)} in ${monthLabel(a.cur)}, averaging ${fmtUSD(a.avgIncome)}/mo.`;
  if (/net worth|networth/.test(q)) {
    const A = DEMO_ACCOUNTS.filter((x) => x.type === "asset").reduce((s, x) => s + x.value, 0);
    const L = DEMO_ACCOUNTS.filter((x) => x.type === "liability").reduce((s, x) => s + x.value, 0);
    return `Your net worth is ${fmtUSD(A + L)} — ${fmtUSD(A)} in assets minus ${fmtUSD(-L)} in liabilities.`;
  }
  if (/biggest|most|top|largest|highest/.test(q)) {
    if (/merchant|store|place|where/.test(q)) {
      const top = Object.entries(a.merchantSpend || {}).sort((x, y) => y[1] - x[1])[0];
      if (top) return `Your top merchant is ${top[0]} at ${fmtUSD(top[1])} over the last ${a.monthKeys.length} months.`;
    }
    const c = Object.entries(a.curCats).sort((x, y) => y[1] - x[1])[0];
    if (c) return `Your biggest category in ${monthLabel(a.cur)} is ${c[0]} at ${fmtUSD(c[1])} — ${((c[1] / a.curSpend) * 100).toFixed(0)}% of spending.`;
  }
  if (a.merchantSpend) {
    const m = Object.keys(a.merchantSpend).find((name) => name.length > 3 && q.includes(name.toLowerCase().split(" ")[0]));
    if (m) return `You've spent ${fmtUSD(a.merchantSpend[m])} at ${m} over the last ${a.monthKeys.length} months.`;
  }
  if (/spend|spent|spending/.test(q))
    return `You spent ${fmtUSD(a.curSpend)} in ${monthLabel(a.cur)}, averaging ${fmtUSD(a.avgSpend)}/mo.`;
  return `I can answer questions about spending by category, subscriptions, income, savings rate, top merchants, and net worth. Try "how much did I spend on dining?" or "what's my biggest expense?"`;
}
