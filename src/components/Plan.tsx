import { useState } from "react";
import { monthLabel, nextMonths } from "../lib/analytics";
import { DEMO_ACCOUNTS } from "../lib/demoData";
import { fmtSignedUSD, fmtUSD } from "../lib/format";
import type { Analytics, Goal, Subscription } from "../lib/types";
import AreaChart from "./charts/AreaChart";
import { btnPrimary, Card, Eyebrow } from "./ui";

export default function Plan({
  analytics,
  subs,
  goals,
  setGoals,
}: {
  analytics: Analytics;
  subs: Subscription[];
  goals: Goal[];
  setGoals: React.Dispatch<React.SetStateAction<Goal[]>>;
}) {
  const a = analytics;
  // Safe-to-spend = average income − fixed bills − a 20% savings target.
  const income = a.avgIncome;
  const bills = (a.curCats.Housing || 0) + (a.curCats.Utilities || 0) + subs.reduce((s, x) => s + x.monthly, 0);
  const savingsTarget = income * 0.2;
  const safe = Math.max(0, income - bills - savingsTarget);
  const perWeek = safe / 4.33,
    perDay = safe / 30;
  const cashStart = DEMO_ACCOUNTS.filter((x) => x.kind === "Cash").reduce((s, x) => s + x.value, 0);
  const monthlyNet = a.avgNet;
  const fKeys = nextMonths(a.cur, 6);
  const forecast = [
    { label: monthLabel(a.cur), v: Math.round(cashStart) },
    ...fKeys.map((k, i) => ({ label: monthLabel(k), v: Math.round(cashStart + monthlyNet * (i + 1)) })),
  ];
  const endCash = forecast[forecast.length - 1].v;
  const monthlySave = Math.max(0, a.avgNet);
  const [name, setName] = useState("");
  const [target, setTarget] = useState("");
  const addGoal = () => {
    if (!name.trim() || !Number(target)) return;
    setGoals((g) => [...g, { id: Date.now(), name: name.trim(), target: Number(target), saved: 0, color: "#5B93A6" }]);
    setName("");
    setTarget("");
  };
  const bd: [string, number, string][] = [
    ["Monthly income", income, "var(--good)"],
    ["Bills & subscriptions", -bills, "var(--muted)"],
    ["Savings target (20%)", -savingsTarget, "var(--muted)"],
  ];
  return (
    <div>
      <Eyebrow>05 — Plan</Eyebrow>
      <h1 style={{ fontSize: 29, margin: "6px 0 2px", letterSpacing: "-.01em" }}>Plan ahead.</h1>
      <p style={{ color: "var(--muted)", margin: "0 0 22px", fontSize: 14.5 }}>
        What's safe to spend, your goals, and where your cash is heading.
      </p>
      <div className="g2" style={{ gap: 16, marginBottom: 16 }}>
        <Card style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <Eyebrow style={{ marginBottom: 10 }}>Safe to spend</Eyebrow>
          <div
            style={{
              fontSize: 40,
              fontWeight: 600,
              fontFamily: "'Shippori Mincho', serif",
              color: "var(--accent)",
              lineHeight: 1,
            }}
          >
            {fmtUSD(safe)}
            <span style={{ fontSize: 16, color: "var(--muted2)" }}> /mo</span>
          </div>
          <div style={{ marginTop: 10, display: "flex", gap: 18, fontSize: 13.5, color: "var(--muted)" }}>
            <span>
              <b style={{ color: "var(--text)" }}>{fmtUSD(perWeek)}</b> / week
            </span>
            <span>
              <b style={{ color: "var(--text)" }}>{fmtUSD(perDay)}</b> / day
            </span>
          </div>
          <div style={{ marginTop: 12, fontSize: 12.5, color: "var(--muted)", lineHeight: 1.55 }}>
            After your typical bills, subscriptions and a 20% savings goal, this is your guilt-free spending money.
          </div>
        </Card>
        <Card>
          <Eyebrow style={{ marginBottom: 12 }}>How that's calculated</Eyebrow>
          {bd.map(([label, val], i) => (
            <div
              key={i}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "9px 0",
                borderTop: i ? "1px solid var(--line)" : "none",
              }}
            >
              <span style={{ fontSize: 13.5, color: "var(--muted)" }}>{label}</span>
              <span className="mono" style={{ fontWeight: 600, color: val >= 0 ? "var(--good)" : "var(--text)" }}>
                {val >= 0 ? "+" : "−"}
                {fmtUSD(Math.abs(val))}
              </span>
            </div>
          ))}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "11px 0 2px",
              borderTop: "2px solid var(--line2)",
              marginTop: 4,
            }}
          >
            <span style={{ fontSize: 14, fontWeight: 600 }}>Safe to spend</span>
            <span className="mono" style={{ fontWeight: 700, color: "var(--accent)", fontSize: 15 }}>
              {fmtUSD(safe)}
            </span>
          </div>
        </Card>
      </div>
      <Card style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
          <Eyebrow>Cash-flow forecast</Eyebrow>
          <div style={{ fontSize: 12.5, color: "var(--muted)" }}>Projected cash · next 6 months</div>
        </div>
        <AreaChart points={forecast} color="#6E88C4" />
        <div style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 8 }}>
          At your recent pace of{" "}
          <b style={{ color: monthlyNet >= 0 ? "var(--good)" : "var(--danger)" }}>
            {fmtSignedUSD(monthlyNet).replace(".00", "")}/mo
          </b>
          , your cash goes from {fmtUSD(cashStart)} today to about <b>{fmtUSD(endCash)}</b> by{" "}
          {forecast[forecast.length - 1].label}.
        </div>
      </Card>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <Eyebrow>Savings goals</Eyebrow>
        <span style={{ fontSize: 12, color: "var(--muted2)" }}>at {fmtUSD(monthlySave)}/mo saved</span>
      </div>
      <div className="g2" style={{ gap: 12, marginBottom: 16 }}>
        {goals.map((g) => {
          const pct = Math.min((g.saved / g.target) * 100, 100);
          const done = g.saved >= g.target;
          const rem = Math.max(0, g.target - g.saved);
          const mo = monthlySave > 0 ? Math.ceil(rem / monthlySave) : null;
          return (
            <Card key={g.id} style={{ padding: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 9 }}>
                <span style={{ fontWeight: 600, fontSize: 14 }}>{g.name}</span>
                {done ? (
                  <span
                    style={{
                      fontSize: 10.5,
                      padding: "2px 9px",
                      borderRadius: 99,
                      background: "#E4F0E9",
                      color: "var(--good)",
                      border: "1px solid #CBE4D6",
                    }}
                  >
                    Funded ✓
                  </span>
                ) : (
                  <span style={{ fontSize: 11.5, color: "var(--muted)" }}>~{mo} mo to go</span>
                )}
              </div>
              <div style={{ height: 8, background: "#F0E4E8", borderRadius: 99, overflow: "hidden" }}>
                <div
                  className="grow"
                  style={{ width: pct + "%", height: "100%", borderRadius: 99, transformOrigin: "left", background: g.color }}
                />
              </div>
              <div style={{ marginTop: 7, fontSize: 12.5, color: "var(--muted)" }}>
                <b className="mono" style={{ color: "var(--text)" }}>
                  {fmtUSD(g.saved)}
                </b>{" "}
                of {fmtUSD(g.target)} · {pct.toFixed(0)}%
              </div>
            </Card>
          );
        })}
      </div>
      <Card>
        <Eyebrow style={{ marginBottom: 10 }}>Add a goal</Eyebrow>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Goal name (e.g. Car fund)"
            style={{
              flex: "2 1 200px",
              background: "#FFFDFE",
              border: "1px solid var(--line2)",
              borderRadius: 9,
              color: "var(--text)",
              padding: "9px 12px",
              fontSize: 13,
            }}
          />
          <input
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            type="number"
            placeholder="Target $"
            style={{
              flex: "1 1 120px",
              background: "#FFFDFE",
              border: "1px solid var(--line2)",
              borderRadius: 9,
              color: "var(--text)",
              padding: "9px 12px",
              fontSize: 13,
              fontFamily: "IBM Plex Mono",
            }}
          />
          <button onClick={addGoal} style={{ ...btnPrimary, padding: "9px 16px" }}>
            Add goal
          </button>
        </div>
      </Card>
    </div>
  );
}
