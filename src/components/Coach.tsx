import { useMemo, useState } from "react";
import { monthLabel } from "../lib/analytics";
import { fmtUSD } from "../lib/format";
import { answerQuery, generateInsights, moneyScore } from "../lib/insights";
import { llmAdvice } from "../lib/openai";
import type { Analytics, Budgets, InsightTone, Subscription, Transaction } from "../lib/types";
import ScoreRing from "./charts/ScoreRing";
import { btnPrimary, Card, Eyebrow } from "./ui";

const TONE: Record<InsightTone, string> = {
  good: "var(--good)",
  warn: "var(--warn)",
  bad: "var(--danger)",
  info: "var(--accent)",
};

export default function Coach({
  analytics,
  subs,
  budgets,
  txns,
}: {
  analytics: Analytics;
  subs: Subscription[];
  budgets: Budgets;
  txns: Transaction[];
}) {
  const a = analytics;
  const insights = useMemo(() => generateInsights(a, subs, budgets), [a, subs, budgets]);
  const score = useMemo(() => moneyScore(a, subs, budgets), [a, subs, budgets]);
  const band = score >= 80 ? "Excellent" : score >= 60 ? "On track" : score >= 40 ? "Fair" : "Needs attention";
  const bandColor = score >= 60 ? "var(--good)" : score >= 40 ? "var(--warn)" : "var(--danger)";
  const net = a.curIncome - a.curSpend,
    sr = a.curIncome ? (net / a.curIncome) * 100 : 0;
  const flaggedN = subs.filter((s) => s.suggestCancel).length;
  const [apiKey, setApiKey] = useState("");
  const [advice, setAdvice] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [q, setQ] = useState("");
  const [chat, setChat] = useState<{ q: string; a: string }[]>([]);
  const ask = (text?: string) => {
    const t = (text || q).trim();
    if (!t) return;
    const ans = answerQuery(t, a, subs, txns || []);
    setChat((c) => [...c, { q: t, a: ans }]);
    setQ("");
  };
  const SUGGEST = [
    "How much did I spend on dining?",
    "What's my biggest expense?",
    "How much are my subscriptions?",
    "What's my savings rate?",
  ];
  const buildSummary = () => {
    const cats = Object.entries(a.curCats)
      .sort((x, y) => y[1] - x[1])
      .map(([c, v]) => `${c} ${fmtUSD(v)}`)
      .join(", ");
    const flagged = subs.filter((s) => s.suggestCancel).map((s) => s.name);
    return `Personal finance snapshot for ${monthLabel(a.cur)}. Income ${fmtUSD(a.curIncome)}, spending ${fmtUSD(a.curSpend)}, net ${fmtUSD(net)}, savings rate ${sr.toFixed(0)}%. Month-over-month spending change ${a.spendChange.toFixed(0)}%. Spending by category: ${cats}. ${subs.length} subscriptions totaling ${fmtUSD(subs.reduce((s, x) => s + x.monthly, 0))} per month; flagged to review: ${flagged.join(", ") || "none"}. Give warm, specific advice on what to do next.`;
  };
  const run = async () => {
    setErr("");
    setBusy(true);
    setAdvice("");
    try {
      setAdvice(await llmAdvice(buildSummary(), apiKey.trim()));
    } catch (e) {
      setErr(String((e as Error).message || e));
    }
    setBusy(false);
  };
  return (
    <div>
      <Eyebrow>06 · AI Coach</Eyebrow>
      <h1 style={{ fontSize: 29, margin: "6px 0 2px", letterSpacing: "-.01em" }}>Your money, in plain words.</h1>
      <p style={{ color: "var(--muted)", margin: "0 0 22px", fontSize: 14.5 }}>
        Insights from your {a.cur ? monthLabel(a.cur) : "recent"} activity, worked out right here on your device.
      </p>
      <div className="g-coach" style={{ gap: 16, marginBottom: 18 }}>
        <Card style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
          <Eyebrow style={{ marginBottom: 8 }}>Money health</Eyebrow>
          <ScoreRing score={score} color={bandColor} />
          <div style={{ marginTop: 4, fontWeight: 600, color: bandColor, fontSize: 15 }}>{band}</div>
        </Card>
        <Card style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <Eyebrow style={{ marginBottom: 12 }}>This month at a glance</Eyebrow>
          <div style={{ fontSize: 16.5, lineHeight: 1.7, color: "var(--text)" }}>
            You earned <b>{fmtUSD(a.curIncome)}</b> and spent <b>{fmtUSD(a.curSpend)}</b>,{" "}
            {net >= 0 ? (
              <span>
                keeping <b style={{ color: "var(--good)" }}>{fmtUSD(net)}</b>, a {sr.toFixed(0)}% savings rate.
              </span>
            ) : (
              <span>
                going over by <b style={{ color: "var(--danger)" }}>{fmtUSD(-net)}</b>.
              </span>
            )}{" "}
            {flaggedN > 0 && (
              <span>
                There {flaggedN === 1 ? "is" : "are"} <b style={{ color: "var(--warn)" }}>{flaggedN}</b> subscription
                {flaggedN > 1 ? "s" : ""} worth reviewing.
              </span>
            )}
          </div>
        </Card>
      </div>
      <Eyebrow style={{ marginBottom: 10 }}>What stands out</Eyebrow>
      <div className="g2" style={{ gap: 12, marginBottom: 20 }}>
        {insights.map((it, i) => (
          <div
            key={i}
            className="fade-in"
            style={{
              background: "var(--panel)",
              border: "1px solid var(--line)",
              borderLeft: `3px solid ${TONE[it.tone]}`,
              borderRadius: 12,
              padding: "14px 16px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
              <span style={{ width: 7, height: 7, borderRadius: 99, background: TONE[it.tone], flexShrink: 0 }} />
              <span style={{ fontWeight: 600, fontSize: 13.5 }}>{it.title}</span>
            </div>
            <div style={{ fontSize: 12.5, color: "var(--muted)", lineHeight: 1.55 }}>{it.body}</div>
          </div>
        ))}
      </div>
      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <span style={{ fontSize: 15 }}>💬</span>
          <span style={{ fontWeight: 600, fontSize: 14.5 }}>Ask your money anything</span>
        </div>
        {chat.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 12, maxHeight: 280, overflowY: "auto" }}>
            {chat.map((m, i) => (
              <div key={i}>
                <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 5 }}>
                  <span
                    style={{
                      background: "var(--accent)",
                      color: "#fff",
                      padding: "7px 12px",
                      borderRadius: "12px 12px 3px 12px",
                      fontSize: 13,
                      maxWidth: "80%",
                    }}
                  >
                    {m.q}
                  </span>
                </div>
                <div style={{ display: "flex", justifyContent: "flex-start" }}>
                  <span
                    style={{
                      background: "var(--bg2)",
                      border: "1px solid var(--line)",
                      color: "var(--text)",
                      padding: "9px 13px",
                      borderRadius: "12px 12px 12px 3px",
                      fontSize: 13.5,
                      lineHeight: 1.55,
                      maxWidth: "88%",
                    }}
                  >
                    {m.a}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
        {chat.length === 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginBottom: 12 }}>
            {SUGGEST.map((s, i) => (
              <button
                key={i}
                onClick={() => ask(s)}
                style={{
                  fontSize: 12,
                  padding: "6px 11px",
                  borderRadius: 99,
                  border: "1px solid var(--line2)",
                  background: "var(--panel2)",
                  color: "var(--muted)",
                }}
              >
                {s}
              </button>
            ))}
          </div>
        )}
        <div style={{ display: "flex", gap: 8 }}>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") ask();
            }}
            placeholder="e.g. how much did I spend on groceries?"
            style={{
              flex: 1,
              background: "#FFFDFE",
              border: "1px solid var(--line2)",
              borderRadius: 9,
              color: "var(--text)",
              padding: "10px 12px",
              fontSize: 13,
            }}
          />
          <button onClick={() => ask()} style={{ ...btnPrimary, padding: "10px 16px" }}>
            Ask
          </button>
        </div>
        <div style={{ fontSize: 11, color: "var(--muted2)", marginTop: 8 }}>
          Answered on-device from your transactions. No key needed.
        </div>
      </Card>
      <Card>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
          <span style={{ fontSize: 15 }}>✨</span>
          <span style={{ fontWeight: 600, fontSize: 14.5 }}>Personalized coaching note</span>
          <span style={{ fontSize: 11, color: "var(--muted2)" }}>optional · needs an OpenAI key</span>
        </div>
        <div style={{ fontSize: 12.5, color: "var(--muted)", marginBottom: 10 }}>
          The insights above are computed on-device with no key. For a written, personalized note, add your key and Zenkei
          will draft one. Your key stays in this browser tab.
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="sk-…"
            style={{
              flex: "1 1 240px",
              background: "#FFFDFE",
              border: "1px solid var(--line2)",
              borderRadius: 8,
              color: "var(--text)",
              padding: "9px 11px",
              fontSize: 12.5,
              fontFamily: "IBM Plex Mono",
            }}
          />
          <button
            onClick={run}
            disabled={busy || !apiKey.trim()}
            style={{ ...btnPrimary, opacity: !apiKey.trim() || busy ? 0.5 : 1 }}
          >
            {busy ? "Thinking…" : "Write my note"}
          </button>
        </div>
        {err && <div style={{ marginTop: 10, fontSize: 12, color: "var(--warn)" }}>{err}</div>}
        {advice && (
          <div
            style={{
              marginTop: 14,
              padding: "14px 16px",
              background: "var(--bg2)",
              border: "1px solid var(--line)",
              borderRadius: 10,
              fontSize: 13.5,
              lineHeight: 1.65,
              whiteSpace: "pre-wrap",
            }}
          >
            {advice}
          </div>
        )}
      </Card>
    </div>
  );
}
