/** A single parsed or generated transaction. Demo rows use numeric ids,
 * parser rows use "p1"-style ids, LLM rows "l0"/"v0"-style ids. */
export interface Transaction {
  id: number | string;
  date: string; // YYYY-MM-DD
  merchant: string;
  description: string;
  amount: number; // negative = spending, positive = income
  category: string;
}

export interface Account {
  name: string;
  type: "asset" | "liability";
  kind: string;
  value: number; // liabilities are negative
}

export interface Goal {
  id: number;
  name: string;
  target: number;
  saved: number;
  color: string;
}

export type Budgets = Record<string, number>;

export interface SubFlag {
  t: string;
  why: string;
}

export interface Subscription {
  key: string;
  name: string;
  cadence: string;
  monthly: number;
  latest: number;
  first: number;
  count: number;
  lastDate: string;
  priceIncrease: boolean;
  category: string;
  sampleDesc: string;
  flags: SubFlag[];
  suggestCancel: boolean;
}

export interface MonthBucket {
  income: number;
  spend: number;
  cats: Record<string, number>;
}

export interface SeriesPoint {
  key?: string;
  label: string;
  v: number;
}

export interface Analytics {
  byMonth: Record<string, MonthBucket>;
  monthKeys: string[];
  cur: string;
  prev: string | undefined;
  catTotals: Record<string, number>;
  spendSeries: SeriesPoint[];
  incomeSeries: SeriesPoint[];
  topMerchants: [string, number][];
  curCats: Record<string, number>;
  merchantSpend: Record<string, number>;
  avgIncome: number;
  avgSpend: number;
  avgNet: number;
  curSpend: number;
  curIncome: number;
  prevSpend: number;
  prevIncome: number;
  spendChange: number;
  incomeChange: number;
}

export type InsightTone = "good" | "warn" | "bad" | "info";

export interface Insight {
  tone: InsightTone;
  title: string;
  body: string;
}

export interface ParseResult {
  rows: Transaction[];
  warnings: string[];
}
