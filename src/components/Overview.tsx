import { monthLabel } from "../lib/analytics";
import { catColor } from "../lib/categories";
import { fmtSignedUSD, fmtUSD } from "../lib/format";
import type { Analytics, Subscription, Transaction } from "../lib/types";
import AreaChart from "./charts/AreaChart";
import Donut from "./charts/Donut";
import { Card, Delta, Eyebrow, Kpi } from "./ui";

export default function Overview({
  analytics,
  txns,
  subs,
}: {
  analytics: Analytics;
  txns: Transaction[];
  subs: Subscription[];
}) {
  const a = analytics;
  const net = a.curIncome - a.curSpend;
  const savingsRate = a.curIncome ? (net / a.curIncome) * 100 : 0;
  const subTotal = subs.reduce((s, x) => s + x.monthly, 0);
  const catData = Object.entries(a.curCats)
    .sort((x, y) => y[1] - x[1])
    .map(([k, v]) => ({ label: k, value: v, color: catColor(k) }));
  const recent = txns.slice(0, 8);
  return (
    <div>
      <Eyebrow>01 · Overview</Eyebrow>
      <h1 style={{ fontSize: 29, margin: "6px 0 2px", letterSpacing: "-.01em" }}>Good to see you.</h1>
      <p style={{ color: "var(--muted)", margin: "0 0 22px", fontSize: 14.5 }}>
        Here's your money for {a.cur ? monthLabel(a.cur) : "this month"}.
      </p>
      <div className="g4" style={{ gap: 14, marginBottom: 16 }}>
        <Kpi
          label="Net this month"
          value={fmtSignedUSD(net).replace(".00", "")}
          accent={net >= 0}
          sub={<span>{savingsRate.toFixed(0)}% savings rate</span>}
        />
        <Kpi label="Spending" value={fmtUSD(a.curSpend)} sub={<Delta value={a.spendChange} invert />} />
        <Kpi label="Income" value={fmtUSD(a.curIncome)} sub={<Delta value={a.incomeChange} />} />
        <Kpi
          label="Subscriptions"
          value={fmtUSD(subTotal) + "/mo"}
          sub={<span style={{ color: "var(--warn)" }}>{subs.filter((s) => s.suggestCancel).length} to review</span>}
        />
      </div>
      <div className="g-hero" style={{ gap: 16, marginBottom: 16 }}>
        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
            <div>
              <Eyebrow>Spending over time</Eyebrow>
            </div>
            <div style={{ fontSize: 12.5, color: "var(--muted)" }}>Last {a.monthKeys.length} months</div>
          </div>
          <AreaChart points={a.spendSeries} color="#D96A8A" />
        </Card>
        <Card>
          <Eyebrow style={{ marginBottom: 10 }}>By category · this month</Eyebrow>
          <div className="donut-row">
            <Donut data={catData} centerValue={fmtUSD(a.curSpend)} centerLabel="spent" />
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 7, minWidth: 0 }}>
              {catData.slice(0, 6).map((d) => (
                <div key={d.label} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5 }}>
                  <span style={{ width: 9, height: 9, borderRadius: 3, background: d.color, flexShrink: 0 }} />
                  <span
                    style={{
                      color: "var(--muted)",
                      flex: 1,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {d.label}
                  </span>
                  <span className="mono" style={{ fontWeight: 600 }}>
                    {fmtUSD(d.value)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>
      <div className="g2" style={{ gap: 16 }}>
        <Card>
          <Eyebrow style={{ marginBottom: 14 }}>Top merchants</Eyebrow>
          {(() => {
            const max = Math.max(...a.topMerchants.map((m) => m[1])) || 1;
            return a.topMerchants.map(([m, v]) => (
              <div key={m} style={{ marginBottom: 11 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, marginBottom: 4 }}>
                  <span style={{ color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {m}
                  </span>
                  <span className="mono" style={{ color: "var(--muted)" }}>
                    {fmtUSD(v)}
                  </span>
                </div>
                <div style={{ height: 6, background: "#F0E4E8", borderRadius: 99, overflow: "hidden" }}>
                  <div
                    className="grow"
                    style={{
                      width: (v / max) * 100 + "%",
                      height: "100%",
                      background: "linear-gradient(90deg,#D96A8A,#EFA9BF)",
                      borderRadius: 99,
                      transformOrigin: "left",
                    }}
                  />
                </div>
              </div>
            ));
          })()}
        </Card>
        <Card style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "20px 20px 12px" }}>
            <Eyebrow>Recent activity</Eyebrow>
          </div>
          <div>
            {recent.map((t, i) => (
              <div
                key={t.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "9px 20px",
                  borderTop: i ? "1px solid var(--line)" : "none",
                }}
              >
                <span style={{ width: 8, height: 8, borderRadius: 3, background: catColor(t.category), flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {t.merchant}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--muted2)" }}>
                    {t.category} · {t.date}
                  </div>
                </div>
                <span
                  className="mono"
                  style={{ fontSize: 13, fontWeight: 600, color: t.amount >= 0 ? "var(--good)" : "var(--text)" }}
                >
                  {fmtSignedUSD(t.amount)}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
