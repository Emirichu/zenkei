import { categorize, cleanMerchant } from "./categories";
import { iso } from "./format";
import type { Account, Budgets, Goal, Transaction } from "./types";

/** Deterministic PRNG so the demo data is identical on every load. */
export function mulberry32(a: number) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Six months of realistic, seeded transactions: payroll, rent, utilities,
 * a pile of subscriptions (one with a mid-year price bump), groceries,
 * dining, transport, shopping, and occasional travel. */
export function generateDemoData(): Transaction[] {
  const rnd = mulberry32(20260706);
  const pick = <T,>(arr: T[]): T => arr[Math.floor(rnd() * arr.length)];
  const around = (base: number, spread: number) =>
    Math.round((base + (rnd() * 2 - 1) * spread) * 100) / 100;
  const txns: Transaction[] = [];
  let id = 1;
  const add = (dateStr: string, desc: string, amount: number, category?: string) => {
    txns.push({
      id: id++,
      date: dateStr,
      merchant: cleanMerchant(desc),
      description: desc,
      amount: Math.round(amount * 100) / 100,
      category: category || categorize(desc, amount),
    });
  };
  const months = [0, 1, 2, 3, 4, 5];
  const year = 2026;
  const endDay = (m: number) => new Date(year, m + 1, 0).getDate();
  const subs: [string, number, number, { bumpFrom: number; to: number }?][] = [
    ["NETFLIX.COM", 2, 15.49, { bumpFrom: 3, to: 17.99 }],
    ["Spotify USA", 4, 11.99],
    ["Amazon Prime*Membership", 6, 14.99],
    ["APPLE.COM/BILL ICLOUD", 9, 2.99],
    ["DISNEY PLUS", 11, 13.99],
    ["HULU 877-8244", 11, 17.99],
    ["YouTube Premium", 14, 13.99],
    ["NYTIMES DIGITAL", 16, 17.0],
    ["ADOBE CREATIVE CLOUD", 18, 54.99],
    ["OPENAI CHATGPT PLUS", 20, 20.0],
    ["PLANET FITNESS CLUB", 21, 24.99],
    ["Peloton Membership", 23, 12.99],
    ["Dropbox*Plus", 24, 11.99],
    ["Audible*Membership", 26, 14.95],
    ["ClassPass Inc", 27, 49.0],
  ];
  months.forEach((m) => {
    const ed = endDay(m);
    add(iso(new Date(year, m, 1)), "ACME ROBOTICS PAYROLL DIRECT DEP", 2920.0 + around(0, 20), "Income");
    add(iso(new Date(year, m, 15)), "ACME ROBOTICS PAYROLL DIRECT DEP", 2920.0 + around(0, 20), "Income");
    if (rnd() < 0.5 && 8 <= ed) add(iso(new Date(year, m, 8)), "ZELLE FROM JAMIE R FREELANCE", around(420, 120), "Income");
    add(iso(new Date(year, m, 1)), "SUNSET RIDGE APARTMENTS RENT", -2150.0, "Housing");
    if (7 <= ed) add(iso(new Date(year, m, 7)), "PG&E ELECTRIC UTILITY", -around(118, 34), "Utilities");
    if (9 <= ed) add(iso(new Date(year, m, 9)), "COMCAST XFINITY INTERNET", -80.0, "Utilities");
    if (12 <= ed) add(iso(new Date(year, m, 12)), "T-MOBILE WIRELESS", -75.0, "Utilities");
    if (6 <= ed) add(iso(new Date(year, m, 6)), "CITY WATER & SEWER", -around(48, 12), "Utilities");
    subs.forEach(([name, day, amt, opt]) => {
      if (day <= ed) {
        let a = amt;
        if (opt && opt.bumpFrom != null && m >= opt.bumpFrom) a = opt.to;
        add(iso(new Date(year, m, day)), name, -a, "Subscriptions");
      }
    });
    const gStores = ["WHOLE FOODS MKT 10432", "TRADER JOE'S #221", "SAFEWAY STORE 1567", "COSTCO WHOLESALE #488"];
    [3, 10, 17, 24].forEach((d) => {
      if (d <= ed && rnd() < 0.92) add(iso(new Date(year, m, d)), pick(gStores), -around(96, 42), "Groceries");
    });
    const dPlaces = ["STARBUCKS STORE 774", "CHIPOTLE 2214", "DOORDASH*SWEETGREEN", "BLUE BOTTLE COFFEE", "TACOS EL GORDO", "PANERA BREAD #33", "SUSHI YAMA", "GRUBHUB*THAI BASIL", "SHAKE SHACK NYC"];
    const dCount = 6 + Math.floor(rnd() * 5);
    for (let i = 0; i < dCount; i++) {
      const d = 1 + Math.floor(rnd() * ed);
      add(iso(new Date(year, m, d)), pick(dPlaces), -around(19, 13), "Dining");
    }
    const tPlaces = ["UBER *TRIP", "LYFT *RIDE", "SHELL OIL 5567", "CHEVRON 9921", "BART CLIPPER TRANSIT", "FASTRAK TOLL"];
    const tCount = 4 + Math.floor(rnd() * 4);
    for (let i = 0; i < tCount; i++) {
      const d = 1 + Math.floor(rnd() * ed);
      add(iso(new Date(year, m, d)), pick(tPlaces), -around(26, 16), "Transport");
    }
    const sPlaces = ["AMAZON.COM*A12BC", "TARGET 00021", "BEST BUY #418", "NIKE.COM", "APPLE STORE R123", "IKEA EMERYVILLE"];
    const sCount = 3 + Math.floor(rnd() * 4);
    for (let i = 0; i < sCount; i++) {
      const d = 1 + Math.floor(rnd() * ed);
      add(iso(new Date(year, m, d)), pick(sPlaces), -around(58, 45), "Shopping");
    }
    if (rnd() < 0.8) {
      const d = 1 + Math.floor(rnd() * ed);
      add(iso(new Date(year, m, d)), pick(["CVS PHARMACY 4471", "WALGREENS 882", "ONE MEDICAL COPAY"]), -around(34, 20), "Health");
    }
    if (rnd() < 0.7) {
      const d = 1 + Math.floor(rnd() * ed);
      add(iso(new Date(year, m, d)), pick(["AMC THEATRES 09", "TICKETMASTER EVENT", "STEAM GAMES"]), -around(38, 22), "Entertainment");
    }
    if (m === 2 || m === 5) {
      add(iso(new Date(year, m, 12)), "DELTA AIR LINES", -around(340, 120), "Travel");
      add(iso(new Date(year, m, 13)), "MARRIOTT HOTELS", -around(220, 80), "Travel");
    }
  });
  txns.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  return txns;
}

export const DEMO_ACCOUNTS: Account[] = [
  { name: "Everyday Checking", type: "asset", kind: "Cash", value: 8420 },
  { name: "High-Yield Savings", type: "asset", kind: "Cash", value: 22500 },
  { name: "401(k) · Fidelity", type: "asset", kind: "Investments", value: 64280 },
  { name: "Brokerage · Schwab", type: "asset", kind: "Investments", value: 18940 },
  { name: "Roth IRA", type: "asset", kind: "Investments", value: 12310 },
  { name: "2019 Honda (est.)", type: "asset", kind: "Property", value: 14000 },
  { name: "Chase Sapphire", type: "liability", kind: "Credit Card", value: -3450 },
  { name: "Student Loan", type: "liability", kind: "Loans", value: -18700 },
  { name: "Auto Loan", type: "liability", kind: "Loans", value: -9180 },
];

export const NETWORTH_TREND = [
  { m: "Jan", v: 96500 },
  { m: "Feb", v: 99100 },
  { m: "Mar", v: 101200 },
  { m: "Apr", v: 104600 },
  { m: "May", v: 106900 },
  { m: "Jun", v: 108120 },
  { m: "Jul", v: 109120 },
];

export const DEFAULT_BUDGETS: Budgets = {
  Housing: 2150,
  Groceries: 520,
  Dining: 320,
  Transport: 180,
  Shopping: 260,
  Utilities: 300,
  Subscriptions: 260,
  Health: 90,
  Entertainment: 80,
  Travel: 200,
  Other: 80,
};

export const DEFAULT_GOALS: Goal[] = [
  { id: 1, name: "Emergency fund", target: 9000, saved: 5200, color: "#5E9E86" },
  { id: 2, name: "Trip to Japan", target: 4200, saved: 1450, color: "#D96A8A" },
  { id: 3, name: "New laptop", target: 1800, saved: 1800, color: "#6E88C4" },
  { id: 4, name: "Down payment", target: 40000, saved: 12300, color: "#C9924A" },
];
