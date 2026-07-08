import { cleanMerchant, merchantKey } from "./categories";
import { fmtUSD } from "./format";
import type { Subscription, SubFlag, Transaction } from "./types";

/**
 * Find recurring charges with no merchant list and no hardcoding:
 *
 * 1. Group expenses by a normalized merchant key (rent is excluded —
 *    it's recurring, but it isn't a "subscription").
 * 2. A group is a candidate only if it has 3+ charges whose amounts
 *    stay within ±25% of the median (subscriptions cost the same
 *    every time; coffee runs don't).
 * 3. The median gap between charges must land in a known cadence
 *    window (weekly / biweekly / monthly / quarterly / yearly), and
 *    most gaps must actually sit near that median — otherwise it's
 *    just a store you visit often.
 * 4. Flags are layered on top: price increases (latest charge > first
 *    by 8%+), overlapping streaming services, duplicate fitness
 *    memberships, and unusually expensive subscriptions.
 */
export function detectSubscriptions(txns: Transaction[]): Subscription[] {
  const expenses = txns.filter((t) => t.amount < 0 && t.category !== "Housing");
  const groups: Record<string, Transaction[]> = {};
  expenses.forEach((t) => {
    const k = merchantKey(t.description);
    if (!k) return;
    (groups[k] = groups[k] || []).push(t);
  });
  const median = (arr: number[]) => {
    const s = [...arr].sort((a, b) => a - b);
    return s[Math.floor(s.length / 2)];
  };
  const subs: Subscription[] = [];
  Object.entries(groups).forEach(([k, list]) => {
    if (list.length < 3) return;
    const sorted = [...list].sort((a, b) => (a.date < b.date ? -1 : 1));
    const amts = sorted.map((t) => Math.abs(t.amount));
    const medAmt = median(amts);
    const spread = (Math.max(...amts) - Math.min(...amts)) / medAmt;
    if (spread > 0.25) return;
    const times = sorted.map((t) => new Date(t.date).getTime());
    const gaps: number[] = [];
    for (let i = 1; i < times.length; i++) gaps.push((times[i] - times[i - 1]) / 86400000);
    const medGap = median(gaps);
    let cadence: string | null = null,
      perMonth = 0;
    if (medGap >= 6 && medGap <= 8) {
      cadence = "Weekly";
      perMonth = 4.33;
    } else if (medGap >= 12 && medGap <= 17) {
      cadence = "Biweekly";
      perMonth = 2.17;
    } else if (medGap >= 26 && medGap <= 34) {
      cadence = "Monthly";
      perMonth = 1;
    } else if (medGap >= 85 && medGap <= 95) {
      cadence = "Quarterly";
      perMonth = 1 / 3;
    } else if (medGap >= 360 && medGap <= 370) {
      cadence = "Yearly";
      perMonth = 1 / 12;
    }
    if (!cadence) return;
    const regular =
      gaps.filter((g) => Math.abs(g - medGap) <= medGap * 0.4).length >= Math.ceil(gaps.length * 0.6);
    if (!regular) return;
    // A true monthly subscription bills ~once per month it spans; more
    // than that means it's a frequently-visited merchant, not a plan.
    const monthsSpan = new Set(sorted.map((t) => t.date.slice(0, 7))).size;
    if (cadence === "Monthly" && sorted.length > monthsSpan + 1) return;
    const first = amts[0],
      last = amts[amts.length - 1];
    const priceIncrease = last > first * 1.08 && last - first > 0.5;
    subs.push({
      key: k,
      name: cleanMerchant(sorted[sorted.length - 1].description),
      cadence,
      monthly: last * perMonth,
      latest: last,
      first,
      count: sorted.length,
      lastDate: sorted[sorted.length - 1].date,
      priceIncrease,
      category: sorted[sorted.length - 1].category,
      sampleDesc: sorted[sorted.length - 1].description,
      flags: [],
      suggestCancel: false,
    });
  });
  const streamingKw = ["netflix", "hulu", "disney", "hbo", "max", "paramount", "peacock", "youtube premium", "prime video"];
  const fitnessKw = ["gym", "fitness", "planet", "classpass", "equinox", "peloton"];
  const isStreaming = (s: Subscription) => streamingKw.some((k) => s.sampleDesc.toLowerCase().includes(k));
  const isFitness = (s: Subscription) => fitnessKw.some((k) => s.sampleDesc.toLowerCase().includes(k));
  const streamCount = subs.filter(isStreaming).length;
  const fitCount = subs.filter(isFitness).length;
  subs.forEach((s) => {
    const flags: SubFlag[] = [];
    if (s.priceIncrease)
      flags.push({
        t: "Price increased",
        why: `Went from ${fmtUSD(s.first, 2)} to ${fmtUSD(s.latest, 2)}`,
      });
    if (isStreaming(s) && streamCount >= 3)
      flags.push({
        t: "Overlapping streaming",
        why: `You pay for ${streamCount} streaming services`,
      });
    if (isFitness(s) && fitCount >= 2)
      flags.push({
        t: "Duplicate fitness",
        why: `${fitCount} fitness memberships overlap`,
      });
    if (s.monthly >= 45 && s.category === "Subscriptions")
      flags.push({
        t: "High cost",
        why: `${fmtUSD(s.monthly, 2)}/mo — one of your priciest`,
      });
    s.flags = flags;
    s.suggestCancel = flags.length > 0;
  });
  subs.sort((a, b) => b.monthly - a.monthly);
  return subs;
}
