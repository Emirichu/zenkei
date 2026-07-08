import type { CSSProperties, ReactNode } from "react";

/* Small shared UI bits: the glassy card, mono eyebrow labels,
 * up/down deltas, KPI tiles, and the two button styles. */

export const Card = ({
  children,
  style,
  className,
}: {
  children?: ReactNode;
  style?: CSSProperties;
  className?: string;
}) => (
  <div
    className={"fade-in card " + (className || "")}
    style={{
      background: "rgba(255,252,253,0.72)",
      backdropFilter: "blur(12px)",
      WebkitBackdropFilter: "blur(12px)",
      border: "1px solid var(--line)",
      borderRadius: "var(--radius)",
      padding: 20,
      boxShadow: "0 1px 3px rgba(150,70,95,0.05), 0 10px 28px -18px rgba(150,70,95,0.14)",
      ...style,
    }}
  >
    {children}
  </div>
);

export const Eyebrow = ({ children, style }: { children?: ReactNode; style?: CSSProperties }) => (
  <div className="eyebrow" style={style}>
    {children}
  </div>
);

/** Percent change with direction. `invert` flips which direction is
 * "good" (spending going up is bad; income going up is good). */
export function Delta({ value, invert }: { value: number; invert?: boolean }) {
  const up = value >= 0;
  const good = invert ? !up : up;
  return (
    <span className="mono" style={{ fontSize: 12, fontWeight: 600, color: good ? "var(--good)" : "var(--danger)" }}>
      {up ? "▲" : "▼"} {Math.abs(value).toFixed(1)}%
    </span>
  );
}

export function Kpi({
  label,
  value,
  sub,
  accent,
}: {
  label: ReactNode;
  value: ReactNode;
  sub?: ReactNode;
  accent?: boolean;
}) {
  return (
    <Card style={{ padding: "16px 18px" }}>
      <div className="eyebrow" style={{ fontSize: 10, marginBottom: 10 }}>
        {label}
      </div>
      <div
        style={{
          fontSize: 25,
          fontWeight: 600,
          letterSpacing: "-.01em",
          color: accent ? "var(--good)" : "var(--text)",
          fontFamily: "'Shippori Mincho', Georgia, serif",
        }}
      >
        {value}
      </div>
      <div style={{ marginTop: 6, fontSize: 12, color: "var(--muted)" }}>{sub}</div>
    </Card>
  );
}

export const btnPrimary: CSSProperties = {
  padding: "11px 16px",
  borderRadius: 10,
  border: "none",
  background: "linear-gradient(135deg,#E0789A,#C85579)",
  color: "#FFF7FA",
  fontWeight: 600,
  fontSize: 13.5,
};

export const btnGhost: CSSProperties = {
  padding: "6px 11px",
  borderRadius: 8,
  border: "1px solid var(--line2)",
  background: "transparent",
  color: "var(--muted)",
  fontSize: 12,
};
