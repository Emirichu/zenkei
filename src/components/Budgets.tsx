import { monthLabel } from "../lib/analytics";
import { catColor } from "../lib/categories";
import { fmtSignedUSD, fmtUSD } from "../lib/format";
import type { Analytics, Budgets as BudgetsMap } from "../lib/types";
import { Card, Eyebrow, Kpi } from "./ui";

export default function Budgets({
  analytics,
  budgets,
  setBudgets,
}: {
  analytics: Analytics;
  budgets: BudgetsMap;
  setBudgets: React.Dispatch<React.SetStateAction<BudgetsMap>>;
}) {
  const a = analytics;
  const cats = Object.keys(budgets);
  const totalBudget = cats.reduce((s, c) => s + budgets[c], 0);
  const totalSpent = cats.reduce((s, c) => s + (a.curCats[c] || 0), 0);
  return (
    <div>
      <Eyebrow>03 · Budgets</Eyebrow>
      <h1 style={{ fontSize: 29, margin: "6px 0 2px", letterSpacing: "-.01em" }}>Spend vs budget.</h1>
      <p style={{ color: "var(--muted)", margin: "0 0 22px", fontSize: 14.5 }}>
        {monthLabel(a.cur)} · click any number to adjust your limit.
      </p>
      <div className="g3" style={{ gap: 14, marginBottom: 18 }}>
        <Kpi label="Total budget" value={fmtUSD(totalBudget)} />
        <Kpi label="Spent so far" value={fmtUSD(totalSpent)} accent={totalSpent <= totalBudget} />
        <Kpi
          label="Remaining"
          value={fmtSignedUSD(totalBudget - totalSpent).replace(".00", "")}
          accent={totalBudget - totalSpent >= 0}
        />
      </div>
      <Card>
        {cats.map((c, i) => {
          const spent = a.curCats[c] || 0,
            limit = budgets[c];
          const pct = Math.min((spent / limit) * 100, 100);
          const over = spent > limit;
          return (
            <div key={c} style={{ padding: "13px 0", borderTop: i ? "1px solid var(--line)" : "none" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 7 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                  <span style={{ width: 10, height: 10, borderRadius: 3, background: catColor(c) }} />
                  <span style={{ fontSize: 14, fontWeight: 600 }}>{c}</span>
                  {over && (
                    <span
                      style={{
                        fontSize: 10.5,
                        padding: "2px 7px",
                        borderRadius: 99,
                        background: "#F7E0E1",
                        color: "var(--danger)",
                        border: "1px solid #EEC9CB",
                      }}
                    >
                      over
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 13 }}>
                  <span className="mono" style={{ fontWeight: 600, color: over ? "var(--danger)" : "var(--text)" }}>
                    {fmtUSD(spent)}
                  </span>
                  <span style={{ color: "var(--muted2)" }}> / </span>
                  <input
                    type="number"
                    value={limit}
                    onChange={(e) => setBudgets((b) => ({ ...b, [c]: Math.max(0, Number(e.target.value) || 0) }))}
                    style={{
                      width: 64,
                      background: "var(--panel2)",
                      border: "1px solid var(--line2)",
                      borderRadius: 6,
                      color: "var(--muted)",
                      padding: "2px 6px",
                      fontSize: 12.5,
                      fontFamily: "IBM Plex Mono",
                    }}
                  />
                </div>
              </div>
              <div style={{ height: 8, background: "#F0E4E8", borderRadius: 99, overflow: "hidden" }}>
                <div
                  className="grow"
                  style={{
                    width: pct + "%",
                    height: "100%",
                    borderRadius: 99,
                    transformOrigin: "left",
                    background: over
                      ? "linear-gradient(90deg,#D25C63,#D98A5A)"
                      : pct > 85
                        ? "linear-gradient(90deg,#C9924A,#5E9E86)"
                        : catColor(c),
                  }}
                />
              </div>
            </div>
          );
        })}
      </Card>
    </div>
  );
}
