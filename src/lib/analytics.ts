import type { Analytics, MonthBucket, Transaction } from "./types";

/** Roll raw transactions up into everything the dashboard needs:
 * per-month income/spend/category buckets, series for the charts,
 * top merchants, and month-over-month changes. */
export function computeAnalytics(txns: Transaction[]): Analytics {
  const byMonth: Record<string, MonthBucket> = {};
  const catTotals: Record<string, number> = {};
  const merchantSpend: Record<string, number> = {};
  txns.forEach((t) => {
    const mk = t.date.slice(0, 7);
    const b = (byMonth[mk] = byMonth[mk] || { income: 0, spend: 0, cats: {} });
    if (t.amount >= 0) b.income += t.amount;
    else {
      const a = -t.amount;
      b.spend += a;
      b.cats[t.category] = (b.cats[t.category] || 0) + a;
      catTotals[t.category] = (catTotals[t.category] || 0) + a;
      merchantSpend[t.merchant] = (merchantSpend[t.merchant] || 0) + a;
    }
  });
  const monthKeys = Object.keys(byMonth).sort();
  const cur = monthKeys[monthKeys.length - 1];
  const prev = monthKeys[monthKeys.length - 2];
  const spendSeries = monthKeys.map((k) => ({ key: k, label: monthLabel(k), v: byMonth[k].spend }));
  const incomeSeries = monthKeys.map((k) => ({ key: k, label: monthLabel(k), v: byMonth[k].income }));
  const topMerchants = Object.entries(merchantSpend)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6) as [string, number][];
  const curCats = cur ? byMonth[cur].cats : {};
  const pctChange = (a: number, b: number) => (b ? ((a - b) / b) * 100 : 0);
  const nM = monthKeys.length || 1;
  const avgIncome = monthKeys.reduce((s, k) => s + byMonth[k].income, 0) / nM;
  const avgSpend = monthKeys.reduce((s, k) => s + byMonth[k].spend, 0) / nM;
  return {
    byMonth,
    monthKeys,
    cur,
    prev,
    catTotals,
    spendSeries,
    incomeSeries,
    topMerchants,
    curCats,
    merchantSpend,
    avgIncome,
    avgSpend,
    avgNet: avgIncome - avgSpend,
    curSpend: cur ? byMonth[cur].spend : 0,
    curIncome: cur ? byMonth[cur].income : 0,
    prevSpend: prev ? byMonth[prev].spend : 0,
    prevIncome: prev ? byMonth[prev].income : 0,
    spendChange: pctChange(cur ? byMonth[cur].spend : 0, prev ? byMonth[prev].spend : 0),
    incomeChange: pctChange(cur ? byMonth[cur].income : 0, prev ? byMonth[prev].income : 0),
  };
}

/** The n month-keys after lastKey, e.g. "2026-06" → ["2026-07", …]. */
export function nextMonths(lastKey: string, n: number): string[] {
  const out: string[] = [];
  let [y, m] = lastKey.split("-").map(Number);
  for (let i = 0; i < n; i++) {
    m++;
    if (m > 12) {
      m = 1;
      y++;
    }
    out.push(`${y}-${String(m).padStart(2, "0")}`);
  }
  return out;
}

/** "2026-07" → "Jul 26" */
export function monthLabel(k: string): string {
  const [y, m] = k.split("-");
  return (
    ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][parseInt(m) - 1] +
    " " +
    y.slice(2)
  );
}
