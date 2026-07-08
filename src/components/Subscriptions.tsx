import { useState } from "react";
import { catColor } from "../lib/categories";
import { fmtUSD } from "../lib/format";
import type { Subscription } from "../lib/types";
import { Card, Eyebrow, Kpi } from "./ui";

export default function Subscriptions({ subs }: { subs: Subscription[] }) {
  const flagged = subs.filter((s) => s.suggestCancel);
  const potential = flagged.reduce((s, x) => s + x.monthly, 0);
  // "Cancelling" is a local what-if: it only removes the row from the
  // projected totals above, nothing else.
  const [cancelled, setCancelled] = useState<Record<string, boolean>>({});
  const toggle = (k: string) => setCancelled((c) => ({ ...c, [k]: !c[k] }));
  return (
    <div>
      <Eyebrow>02 — Subscription Detector</Eyebrow>
      <h1 style={{ fontSize: 29, margin: "6px 0 2px", letterSpacing: "-.01em" }}>Recurring charges, found automatically.</h1>
      <p style={{ color: "var(--muted)", margin: "0 0 22px", fontSize: 14.5 }}>
        We scanned your transactions for anything that repeats on a schedule.
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 18 }}>
        <Kpi label="Detected subscriptions" value={subs.length} />
        <Kpi
          label="Total per month"
          value={fmtUSD(subs.filter((s) => !cancelled[s.key]).reduce((s, x) => s + x.monthly, 0))}
          accent
        />
        <Kpi label="Per year" value={fmtUSD(subs.filter((s) => !cancelled[s.key]).reduce((s, x) => s + x.monthly * 12, 0))} />
        <Kpi
          label="Potential savings"
          value={fmtUSD(potential) + "/mo"}
          sub={<span style={{ color: "var(--warn)" }}>{flagged.length} flagged</span>}
        />
      </div>
      {flagged.length > 0 && (
        <Card style={{ marginBottom: 16, borderColor: "#EFD9C6", background: "linear-gradient(180deg,#FCEFE6,#FFFCFD)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <span style={{ color: "var(--warn)", fontSize: 15 }}>⚠</span>
            <span style={{ fontWeight: 600, fontSize: 14.5 }}>Worth a second look</span>
          </div>
          <div style={{ fontSize: 13, color: "var(--muted)" }}>
            Cancelling the {flagged.length} flagged items below would save about{" "}
            <b style={{ color: "var(--warn)" }}>{fmtUSD(potential * 12)}</b> a year.
          </div>
        </Card>
      )}
      <Card style={{ padding: 0, overflow: "hidden" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "2fr 1fr 1fr 1.4fr 90px",
            padding: "12px 20px",
            borderBottom: "1px solid var(--line)",
          }}
        >
          {["Service", "Cadence", "Amount", "Status", "Action"].map((h, i) => (
            <div key={i} className="eyebrow" style={{ fontSize: 9.5 }}>
              {h}
            </div>
          ))}
        </div>
        {subs.map((s) => (
          <div
            key={s.key}
            style={{
              display: "grid",
              gridTemplateColumns: "2fr 1fr 1fr 1.4fr 90px",
              alignItems: "center",
              padding: "13px 20px",
              borderBottom: "1px solid var(--line)",
              opacity: cancelled[s.key] ? 0.45 : 1,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 11, minWidth: 0 }}>
              <span
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 9,
                  background: catColor(s.category) + "26",
                  color: catColor(s.category),
                  display: "grid",
                  placeItems: "center",
                  fontWeight: 700,
                  flexShrink: 0,
                }}
              >
                {s.name[0]}
              </span>
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 13.5,
                    fontWeight: 600,
                    textDecoration: cancelled[s.key] ? "line-through" : "none",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {s.name}
                </div>
                <div style={{ fontSize: 11, color: "var(--muted2)" }}>
                  {s.count}× · last {s.lastDate}
                </div>
              </div>
            </div>
            <div style={{ fontSize: 12.5, color: "var(--muted)" }}>{s.cadence}</div>
            <div>
              <span className="mono" style={{ fontWeight: 600, fontSize: 13.5 }}>
                {fmtUSD(s.monthly, 2)}
              </span>
              <span style={{ fontSize: 11, color: "var(--muted2)" }}>/mo</span>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
              {s.flags.length ? (
                s.flags.map((f, i) => (
                  <span
                    key={i}
                    title={f.why}
                    style={{
                      fontSize: 10.5,
                      padding: "3px 8px",
                      borderRadius: 99,
                      background: "#F7E7D6",
                      color: "#A66A2C",
                      border: "1px solid #EBD3B8",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {f.t}
                  </span>
                ))
              ) : (
                <span style={{ fontSize: 11, color: "var(--muted2)" }}>Looks fine</span>
              )}
            </div>
            <div>
              <button
                onClick={() => toggle(s.key)}
                style={{
                  fontSize: 11.5,
                  padding: "6px 11px",
                  borderRadius: 8,
                  border: "1px solid var(--line2)",
                  background: cancelled[s.key] ? "var(--panel2)" : "transparent",
                  color: cancelled[s.key] ? "var(--muted)" : s.suggestCancel ? "var(--accent)" : "var(--muted)",
                }}
              >
                {cancelled[s.key] ? "Undo" : "Cancel"}
              </button>
            </div>
          </div>
        ))}
      </Card>
      <div style={{ fontSize: 11.5, color: "var(--muted2)", marginTop: 12 }}>
        Detection groups similar merchant names and looks for consistent timing and amounts. "Cancel" is a local simulation —
        it just updates your projected total here.
      </div>
    </div>
  );
}
