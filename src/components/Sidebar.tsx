import { LS } from "../lib/storage";

export const NAV = [
  { id: "overview", label: "Overview", num: "01" },
  { id: "subscriptions", label: "Subscriptions", num: "02" },
  { id: "budgets", label: "Budgets", num: "03" },
  { id: "networth", label: "Net Worth", num: "04" },
  { id: "plan", label: "Plan", num: "05" },
  { id: "coach", label: "AI Coach", num: "06" },
  { id: "import", label: "Import Data", num: "07" },
];

/** One sakura petal, rotated 5× to draw the logo flower. */
const PETAL = "M 0 0 C -3.2 -3 -3.6 -8 -2.6 -10.6 Q -1.3 -9.4 0 -8.4 Q 1.3 -9.4 2.6 -10.6 C 3.6 -8 3.2 -3 0 0 Z";

function Logo() {
  return (
    <svg width="30" height="30" viewBox="0 0 32 32">
      <defs>
        <radialGradient id="petGrad" cx="50%" cy="72%" r="72%">
          <stop offset="0%" stopColor="#FCE0EA" />
          <stop offset="58%" stopColor="#F1A2BC" />
          <stop offset="100%" stopColor="#DE6E93" />
        </radialGradient>
      </defs>
      <g transform="translate(16,16.5)">
        <path d={PETAL} fill="url(#petGrad)" transform="rotate(0)" />
        <path d={PETAL} fill="url(#petGrad)" transform="rotate(72)" />
        <path d={PETAL} fill="url(#petGrad)" transform="rotate(144)" />
        <path d={PETAL} fill="url(#petGrad)" transform="rotate(216)" />
        <path d={PETAL} fill="url(#petGrad)" transform="rotate(288)" />
        <circle cx="0" cy="0" r="2.1" fill="#F4C24E" />
        <circle cx="0" cy="-3.1" r="0.8" fill="#E39A2E" />
        <circle cx="2.95" cy="-0.96" r="0.8" fill="#E39A2E" />
        <circle cx="1.82" cy="2.51" r="0.8" fill="#E39A2E" />
        <circle cx="-1.82" cy="2.51" r="0.8" fill="#E39A2E" />
        <circle cx="-2.95" cy="-0.96" r="0.8" fill="#E39A2E" />
      </g>
    </svg>
  );
}

/** The little cherry-tree scene above the data-source card. */
function SakuraScene() {
  return (
    <svg width="100%" viewBox="0 0 200 84" style={{ display: "block" }}>
      <circle cx="165" cy="20" r="12" fill="#F5C2D0" />
      <rect x="0" y="73" width="200" height="3" fill="#DFC7D0" />
      <g>
        <rect x="34" y="52" width="3.5" height="22" rx="1.5" fill="#8A6B5A" />
        <circle cx="36" cy="47" r="11" fill="#F0A9BE" />
        <circle cx="26" cy="52" r="7.5" fill="#EEA0B8" />
        <circle cx="46" cy="52" r="7.5" fill="#F5BECD" />
        <circle cx="36" cy="55" r="7" fill="#F3B6C6" />
      </g>
      <g>
        <rect x="98" y="58" width="3" height="16" rx="1.5" fill="#8A6B5A" />
        <circle cx="99.5" cy="54" r="8" fill="#F0A9BE" />
        <circle cx="92" cy="58" r="6" fill="#F5BECD" />
        <circle cx="107" cy="58" r="6" fill="#EEA0B8" />
      </g>
      <g>
        <rect x="150" y="56" width="3" height="18" rx="1.5" fill="#8A6B5A" />
        <circle cx="151.5" cy="51" r="9" fill="#F0A9BE" />
        <circle cx="143" cy="56" r="6.5" fill="#EEA0B8" />
        <circle cx="160" cy="56" r="6.5" fill="#F5BECD" />
      </g>
      <circle cx="60" cy="30" r="1.6" fill="#F3B6C6" />
      <circle cx="80" cy="42" r="1.4" fill="#EEA0B8" />
      <circle cx="120" cy="34" r="1.6" fill="#F5BECD" />
      <circle cx="132" cy="50" r="1.3" fill="#F3B6C6" />
    </svg>
  );
}

export default function Sidebar({
  nav,
  setNav,
  usingImported,
  importedCount,
  onBackToDemo,
  onReset,
}: {
  nav: string;
  setNav: (id: string) => void;
  usingImported: boolean;
  importedCount: number;
  onBackToDemo: () => void;
  onReset: () => void;
}) {
  return (
    <aside
      style={{
        width: 238,
        borderRight: "1px solid var(--line)",
        padding: "22px 16px",
        position: "sticky",
        top: 0,
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        background: "var(--bg2)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "4px 8px 22px" }}>
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: 10,
            overflow: "hidden",
            background: "linear-gradient(135deg,#FFF3F7,#FBE0EA)",
            display: "grid",
            placeItems: "center",
            boxShadow: "inset 0 0 0 1px rgba(216,120,150,0.16)",
          }}
        >
          <Logo />
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 17, letterSpacing: "-.01em", fontFamily: "'Shippori Mincho', Georgia, serif" }}>
            Zenkei
          </div>
          <div className="eyebrow" style={{ fontSize: 9 }}>
            Personal finance
          </div>
        </div>
      </div>
      <nav style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {NAV.map((n) => (
          <button
            key={n.id}
            onClick={() => setNav(n.id)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "10px 12px",
              borderRadius: 10,
              border: "1px solid " + (nav === n.id ? "var(--line2)" : "transparent"),
              background: nav === n.id ? "var(--panel)" : "transparent",
              color: nav === n.id ? "var(--text)" : "var(--muted)",
              textAlign: "left",
              fontSize: 14,
              fontWeight: nav === n.id ? 600 : 500,
              transition: "all .15s",
            }}
          >
            <span className="mono" style={{ fontSize: 11, color: nav === n.id ? "var(--accent)" : "var(--muted2)" }}>
              {n.num}
            </span>
            {n.label}
          </button>
        ))}
      </nav>
      <div style={{ marginTop: "auto", padding: "14px 12px 4px" }}>
        <div style={{ opacity: 0.75, margin: "0 -4px 12px" }}>
          <SakuraScene />
        </div>
        <div style={{ padding: 12, borderRadius: 10, background: "var(--panel)", border: "1px solid var(--line)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 6 }}>
            <span style={{ width: 7, height: 7, borderRadius: 99, background: "var(--good)" }} />
            <span className="eyebrow" style={{ fontSize: 9 }}>
              {usingImported ? "Your Data" : "Demo Mode"}
            </span>
          </div>
          <div style={{ fontSize: 11.5, color: "var(--muted)", lineHeight: 1.5 }}>
            {usingImported ? `${importedCount} transactions parsed on-device.` : "Realistic sample data. 100% in your browser."}
          </div>
          {usingImported && (
            <button
              onClick={onBackToDemo}
              style={{ marginTop: 8, fontSize: 11.5, color: "var(--accent)", background: "none", border: "none", padding: 0 }}
            >
              ← Back to demo
            </button>
          )}
          {LS && (
            <div
              style={{
                marginTop: 10,
                paddingTop: 9,
                borderTop: "1px solid var(--line)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 6,
              }}
            >
              <span style={{ fontSize: 10.5, color: "var(--muted2)" }}>✓ Auto-saved here</span>
              <button
                onClick={onReset}
                style={{
                  fontSize: 10.5,
                  color: "var(--muted)",
                  background: "none",
                  border: "none",
                  padding: 0,
                  textDecoration: "underline",
                  cursor: "pointer",
                }}
              >
                Reset
              </button>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
