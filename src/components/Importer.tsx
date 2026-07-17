import { useMemo, useRef, useState } from "react";
import { catColor } from "../lib/categories";
import { fmtSignedUSD, fmtUSD } from "../lib/format";
import { ocrImage } from "../lib/ocr";
import { llmParse, llmVision } from "../lib/openai";
import { parseTransactions } from "../lib/parser";
import type { Transaction } from "../lib/types";
import { btnGhost, btnPrimary, Card, Eyebrow } from "./ui";

const SAMPLE_TEXT = `07/01/2026  SUNSET RIDGE APARTMENTS RENT        2,150.00 DR
07/02/2026  NETFLIX.COM  310-555-0199 CA          17.99 DR
07/03/2026  WHOLE FOODS MKT #10432                 84.21 DR
07/03/2026  ACME ROBOTICS PAYROLL DIRECT DEP    2,920.00 CR
07/04/2026  UBER *TRIP HELP.UBER.COM               22.40 DR
07/05/2026  STARBUCKS STORE 00774 SEATTLE           6.85 DR
07/05/2026  SHELL OIL 574433 SF CA                 48.10 DR`;

export default function Importer({
  onImport,
  usingImported,
  count,
}: {
  onImport: (rows: Transaction[]) => void;
  usingImported: boolean;
  count: number;
}) {
  const [text, setText] = useState("");
  const [result, setResult] = useState<Transaction[] | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [useLLM, setUseLLM] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [err, setErr] = useState("");
  const [ocrMsg, setOcrMsg] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const imgRef = useRef<HTMLInputElement>(null);
  const onImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    setErr("");
    setResult(null);
    setWarnings([]);
    setBusy(true);
    try {
      if (useLLM && apiKey.trim()) {
        setOcrMsg("Reading screenshot with AI…");
        const rows = await llmVision(f, apiKey.trim());
        setResult(rows);
        if (!rows.length) setWarnings(["No transactions found in that image."]);
      } else {
        setOcrMsg("Reading screenshot…");
        const txt = await ocrImage(f, (p) => setOcrMsg("Reading screenshot… " + Math.round(p * 100) + "%"));
        setText(txt);
        const { rows, warnings } = parseTransactions(txt);
        setResult(rows);
        setWarnings(
          rows.length
            ? warnings
            : ["Couldn't read transactions from that screenshot. A clear, cropped image of just the transaction list works best (or add an OpenAI key above for AI reading)."]
        );
      }
    } catch (err) {
      setErr(String((err as Error).message || err));
    }
    setOcrMsg("");
    setBusy(false);
    e.target.value = "";
  };
  const run = async () => {
    setErr("");
    setBusy(true);
    setResult(null);
    setWarnings([]);
    try {
      if (useLLM && apiKey.trim()) {
        const rows = await llmParse(text, apiKey.trim());
        setResult(rows);
        if (!rows.length) setWarnings(["Model returned no rows."]);
      } else {
        // A short beat so "Analyzing…" is visible. Instant results read as broken.
        await new Promise((r) => setTimeout(r, 450));
        const { rows, warnings } = parseTransactions(text);
        setResult(rows);
        setWarnings(warnings);
      }
    } catch (e) {
      setErr(String((e as Error).message || e) + " — falling back to built-in parser.");
      const { rows, warnings } = parseTransactions(text);
      setResult(rows);
      setWarnings(warnings);
    }
    setBusy(false);
  };
  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    const rd = new FileReader();
    rd.onload = () => setText(String(rd.result));
    rd.readAsText(f);
  };
  const apply = () => {
    if (result && result.length) {
      onImport(result);
    }
  };
  const summary = useMemo(() => {
    if (!result) return null;
    const spend = result.filter((r) => r.amount < 0).reduce((s, r) => s - r.amount, 0);
    const inc = result.filter((r) => r.amount >= 0).reduce((s, r) => s + r.amount, 0);
    return { spend, inc };
  }, [result]);
  return (
    <div>
      <Eyebrow>07 — Import Your Data</Eyebrow>
      <h1 style={{ fontSize: 29, margin: "6px 0 2px", letterSpacing: "-.01em" }}>Paste anything. Get clean data.</h1>
      <p style={{ color: "var(--muted)", margin: "0 0 22px", fontSize: 14.5 }}>
        Drop in a CSV export or messy copied statement text. It's parsed and categorized right here in your browser —
        nothing is uploaded.
      </p>
      <div className="g-import" style={{ gap: 16 }}>
        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, flexWrap: "wrap", gap: 8 }}>
            <Eyebrow>Your transactions</Eyebrow>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button onClick={() => setText(SAMPLE_TEXT)} style={btnGhost}>
                Try sample
              </button>
              <button onClick={() => fileRef.current?.click()} style={btnGhost}>
                Upload CSV
              </button>
              <button onClick={() => imgRef.current?.click()} style={btnGhost}>
                📷 Screenshot
              </button>
              <input ref={fileRef} type="file" accept=".csv,.txt,.tsv" onChange={onFile} style={{ display: "none" }} />
              <input ref={imgRef} type="file" accept="image/*" onChange={onImage} style={{ display: "none" }} />
            </div>
          </div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={"Paste CSV or statement lines here…\n\ne.g.\n07/02/2026  NETFLIX.COM  17.99\n07/03/2026  WHOLE FOODS  84.21"}
            style={{
              width: "100%",
              height: 250,
              resize: "vertical",
              background: "#FFFDFE",
              border: "1px solid var(--line2)",
              borderRadius: 10,
              color: "var(--text)",
              padding: 14,
              fontSize: 12.5,
              fontFamily: "IBM Plex Mono",
              lineHeight: 1.6,
            }}
          />
          <div style={{ marginTop: 12, padding: "11px 13px", border: "1px solid var(--line)", borderRadius: 10, background: "var(--bg2)" }}>
            <label style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 12.5, cursor: "pointer" }}>
              <input type="checkbox" checked={useLLM} onChange={(e) => setUseLLM(e.target.checked)} />
              <span>
                Use a real LLM (optional) <span style={{ color: "var(--muted2)" }}>— paste an OpenAI key</span>
              </span>
            </label>
            {useLLM && (
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-…  (stays in this browser tab, never stored)"
                style={{
                  marginTop: 9,
                  width: "100%",
                  background: "#FFFDFE",
                  border: "1px solid var(--line2)",
                  borderRadius: 8,
                  color: "var(--text)",
                  padding: "8px 10px",
                  fontSize: 12,
                  fontFamily: "IBM Plex Mono",
                }}
              />
            )}
            {!useLLM && (
              <div style={{ fontSize: 11, color: "var(--muted2)", marginTop: 6 }}>
                Leave off to use the built-in on-device parser (no key needed). With a key, screenshots are read by AI.
              </div>
            )}
          </div>
          <button
            onClick={run}
            disabled={busy || !text.trim()}
            style={{ ...btnPrimary, marginTop: 12, width: "100%", opacity: !text.trim() || busy ? 0.5 : 1 }}
          >
            {busy ? ocrMsg || "Analyzing…" : "✨ Parse & categorize"}
          </button>
          {ocrMsg && <div style={{ marginTop: 10, fontSize: 11.5, color: "var(--muted)" }}>{ocrMsg}</div>}
          {err && <div style={{ marginTop: 10, fontSize: 11.5, color: "var(--warn)" }}>{err}</div>}
        </Card>
        <Card>
          <Eyebrow style={{ marginBottom: 10 }}>Parsed result</Eyebrow>
          {!result && (
            <div style={{ color: "var(--muted2)", fontSize: 13, padding: "40px 0", textAlign: "center" }}>
              Your cleaned, categorized transactions will appear here.
            </div>
          )}
          {warnings.map((w, i) => (
            <div key={i} style={{ fontSize: 12, color: "var(--warn)", marginBottom: 8 }}>
              ⚠ {w}
            </div>
          ))}
          {result && result.length > 0 && summary && (
            <div>
              <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
                <div style={{ flex: 1, padding: "10px 12px", background: "var(--bg2)", borderRadius: 9, border: "1px solid var(--line)" }}>
                  <div className="eyebrow" style={{ fontSize: 9 }}>
                    Rows
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 600, fontFamily: "'Shippori Mincho', serif" }}>{result.length}</div>
                </div>
                <div style={{ flex: 1, padding: "10px 12px", background: "var(--bg2)", borderRadius: 9, border: "1px solid var(--line)" }}>
                  <div className="eyebrow" style={{ fontSize: 9 }}>
                    Spend
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 600, fontFamily: "'Shippori Mincho', serif" }}>{fmtUSD(summary.spend)}</div>
                </div>
                <div style={{ flex: 1, padding: "10px 12px", background: "var(--bg2)", borderRadius: 9, border: "1px solid var(--line)" }}>
                  <div className="eyebrow" style={{ fontSize: 9 }}>
                    Income
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 600, color: "var(--good)", fontFamily: "'Shippori Mincho', serif" }}>
                    {fmtUSD(summary.inc)}
                  </div>
                </div>
              </div>
              <div style={{ maxHeight: 210, overflowY: "auto", border: "1px solid var(--line)", borderRadius: 9 }}>
                {result.slice(0, 40).map((t, i) => (
                  <div
                    key={t.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "8px 12px",
                      borderTop: i ? "1px solid var(--line)" : "none",
                    }}
                  >
                    <span style={{ width: 7, height: 7, borderRadius: 2, background: catColor(t.category), flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {t.merchant}
                      </div>
                      <div style={{ fontSize: 10.5, color: "var(--muted2)" }}>
                        {t.category} · {t.date}
                      </div>
                    </div>
                    <span
                      className="mono"
                      style={{ fontSize: 12.5, fontWeight: 600, color: t.amount >= 0 ? "var(--good)" : "var(--text)" }}
                    >
                      {fmtSignedUSD(t.amount)}
                    </span>
                  </div>
                ))}
              </div>
              <button onClick={apply} style={{ ...btnPrimary, marginTop: 12, width: "100%" }}>
                Load into dashboard →
              </button>
            </div>
          )}
          {result && result.length === 0 && (
            <div style={{ color: "var(--muted)", fontSize: 13 }}>No transactions detected. Check the format hint on the left.</div>
          )}
        </Card>
      </div>
      {usingImported && (
        <div style={{ marginTop: 14, fontSize: 12.5, color: "var(--good)" }}>
          ✓ Dashboard is currently showing your imported {count} transactions.
        </div>
      )}
    </div>
  );
}
