import { DEMO_ACCOUNTS, NETWORTH_TREND } from "../lib/demoData";
import { fmtUSD } from "../lib/format";
import AreaChart from "./charts/AreaChart";
import Donut from "./charts/Donut";
import { Card, Delta, Eyebrow } from "./ui";

export default function NetWorth() {
  const assets = DEMO_ACCOUNTS.filter((a) => a.type === "asset");
  const liabs = DEMO_ACCOUNTS.filter((a) => a.type === "liability");
  const totalA = assets.reduce((s, a) => s + a.value, 0);
  const totalL = liabs.reduce((s, a) => s + a.value, 0);
  const net = totalA + totalL;
  const trend = NETWORTH_TREND.map((p) => ({ label: p.m, v: p.v }));
  const change = ((net - NETWORTH_TREND[0].v) / NETWORTH_TREND[0].v) * 100;
  const kinds: Record<string, number> = {};
  assets.forEach((a) => (kinds[a.kind] = (kinds[a.kind] || 0) + a.value));
  const kindColors: Record<string, string> = {
    Cash: "#5E9E86",
    Investments: "#4E6E96",
    Property: "#C9924A",
  };
  const donutData = Object.entries(kinds).map(([k, v]) => ({ label: k, value: v, color: kindColors[k] || "#A89AA1" }));
  return (
    <div>
      <Eyebrow>04 — Net Worth</Eyebrow>
      <h1 style={{ fontSize: 29, margin: "6px 0 2px", letterSpacing: "-.01em" }}>{fmtUSD(net)}</h1>
      <p style={{ color: "var(--muted)", margin: "0 0 22px", fontSize: 14.5 }}>
        Assets minus liabilities · <Delta value={change} /> over 7 months
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "1.55fr 1fr", gap: 16, marginBottom: 16 }}>
        <Card>
          <Eyebrow style={{ marginBottom: 8 }}>Net worth trend</Eyebrow>
          <AreaChart points={trend} color="#4E6E96" />
        </Card>
        <Card>
          <Eyebrow style={{ marginBottom: 10 }}>Asset allocation</Eyebrow>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <Donut data={donutData} centerValue={fmtUSD(totalA)} centerLabel="assets" />
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
              {donutData.map((d) => (
                <div key={d.label} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5 }}>
                  <span style={{ width: 9, height: 9, borderRadius: 3, background: d.color }} />
                  <span style={{ color: "var(--muted)", flex: 1 }}>{d.label}</span>
                  <span className="mono" style={{ fontWeight: 600 }}>
                    {fmtUSD(d.value)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
            <Eyebrow>Assets</Eyebrow>
            <span className="mono" style={{ color: "var(--good)", fontWeight: 600 }}>
              {fmtUSD(totalA)}
            </span>
          </div>
          {assets.map((a, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "10px 0",
                borderTop: i ? "1px solid var(--line)" : "none",
              }}
            >
              <div>
                <div style={{ fontSize: 13.5 }}>{a.name}</div>
                <div style={{ fontSize: 11, color: "var(--muted2)" }}>{a.kind}</div>
              </div>
              <span className="mono" style={{ fontWeight: 600 }}>
                {fmtUSD(a.value)}
              </span>
            </div>
          ))}
        </Card>
        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
            <Eyebrow>Liabilities</Eyebrow>
            <span className="mono" style={{ color: "var(--danger)", fontWeight: 600 }}>
              {fmtUSD(totalL)}
            </span>
          </div>
          {liabs.map((a, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "10px 0",
                borderTop: i ? "1px solid var(--line)" : "none",
              }}
            >
              <div>
                <div style={{ fontSize: 13.5 }}>{a.name}</div>
                <div style={{ fontSize: 11, color: "var(--muted2)" }}>{a.kind}</div>
              </div>
              <span className="mono" style={{ fontWeight: 600, color: "var(--danger)" }}>
                {fmtUSD(a.value)}
              </span>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}
