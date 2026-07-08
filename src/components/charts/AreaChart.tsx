import { useState } from "react";
import { fmtUSD } from "../../lib/format";
import type { SeriesPoint } from "../../lib/types";

/** Hand-built area chart with a gradient fill, grid lines, per-point
 * hover targets, and a floating value tooltip. Coordinates are mapped
 * into a fixed viewBox, so the SVG scales with its container. */
export default function AreaChart({
  points,
  w = 640,
  h = 210,
  color = "#D96A8A",
  fmt = (v: number) => fmtUSD(v),
}: {
  points: SeriesPoint[];
  w?: number;
  h?: number;
  color?: string;
  fmt?: (v: number) => string;
}) {
  const pad = { l: 8, r: 8, t: 16, b: 26 };
  const iw = w - pad.l - pad.r,
    ih = h - pad.t - pad.b;
  const vals = points.map((p) => p.v);
  const max = Math.max(...vals) * 1.12 || 1,
    min = Math.min(0, ...vals);
  const x = (i: number) => pad.l + (points.length === 1 ? iw / 2 : (i / (points.length - 1)) * iw);
  const y = (v: number) => pad.t + ih - ((v - min) / (max - min || 1)) * ih;
  const [hover, setHover] = useState<number | null>(null);
  const line = points.map((p, i) => `${i === 0 ? "M" : "L"} ${x(i)} ${y(p.v)}`).join(" ");
  const area = `${line} L ${x(points.length - 1)} ${pad.t + ih} L ${x(0)} ${pad.t + ih} Z`;
  return (
    <svg width="100%" viewBox={`0 0 ${w} ${h}`} style={{ overflow: "visible" }} onMouseLeave={() => setHover(null)}>
      <defs>
        <linearGradient id={"g" + color.replace("#", "")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.24" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75, 1].map((g, i) => (
        <line key={i} x1={pad.l} x2={w - pad.r} y1={pad.t + ih * g} y2={pad.t + ih * g} stroke="#EEE0E4" strokeWidth="1" />
      ))}
      <path d={area} fill={`url(#g${color.replace("#", "")})`} className="grow" style={{ transformOrigin: "bottom" }} />
      <path d={line} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
      {points.map((p, i) => (
        <g key={i}>
          <circle cx={x(i)} cy={y(p.v)} r={hover === i ? 5 : 3.2} fill={color} stroke="#FFFCFD" strokeWidth="2" />
          <rect x={x(i) - 16} y={pad.t} width="32" height={ih} fill="transparent" onMouseEnter={() => setHover(i)} />
          <text x={x(i)} y={h - 8} textAnchor="middle" fill="#A89AA1" fontSize="10.5" fontFamily="IBM Plex Mono">
            {p.label}
          </text>
        </g>
      ))}
      {hover != null && (
        <g>
          <line x1={x(hover)} x2={x(hover)} y1={pad.t} y2={pad.t + ih} stroke={color} strokeOpacity="0.4" strokeDasharray="3 3" />
          <rect
            x={Math.min(Math.max(x(hover) - 42, 0), w - 84)}
            y={pad.t - 2}
            width="84"
            height="22"
            rx="6"
            fill="#FFFCFD"
            stroke="#E4D0D7"
          />
          <text
            x={Math.min(Math.max(x(hover), 42), w - 42)}
            y={pad.t + 13}
            textAnchor="middle"
            fill="#312B33"
            fontSize="11.5"
            fontWeight="600"
            fontFamily="Inter"
          >
            {fmt(points[hover].v)}
          </text>
        </g>
      )}
    </svg>
  );
}
