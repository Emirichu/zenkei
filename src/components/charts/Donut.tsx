import { fmtUSD } from "../../lib/format";

export interface DonutSlice {
  label: string;
  value: number;
  color: string;
}

/** Hand-built donut chart: each slice is a full circle whose visible
 * arc is carved out with stroke-dasharray, offset by the running total
 * of the slices before it, rotated so 12 o'clock is the start. */
export default function Donut({
  data,
  size = 190,
  thickness = 26,
  centerLabel,
  centerValue,
}: {
  data: DonutSlice[];
  size?: number;
  thickness?: number;
  centerLabel?: string;
  centerValue?: string;
}) {
  const total = data.reduce((a, b) => a + b.value, 0) || 1;
  const r = (size - thickness) / 2,
    cx = size / 2,
    cy = size / 2,
    C = 2 * Math.PI * r;
  let offset = 0;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#F0E4E8" strokeWidth={thickness} />
      {data.map((d, i) => {
        const frac = d.value / total,
          len = frac * C;
        const el = (
          <circle
            key={i}
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={d.color}
            strokeWidth={thickness}
            strokeDasharray={`${len} ${C - len}`}
            strokeDashoffset={-offset}
            transform={`rotate(-90 ${cx} ${cy})`}
            strokeLinecap="butt"
          >
            <title>
              {d.label}
              {": "}
              {fmtUSD(d.value)}
            </title>
          </circle>
        );
        offset += len;
        return el;
      })}
      <text
        x={cx}
        y={cy - 4}
        textAnchor="middle"
        fill="#312B33"
        fontSize="22"
        fontWeight="600"
        fontFamily="'Shippori Mincho', Georgia, serif"
      >
        {centerValue}
      </text>
      <text
        x={cx}
        y={cy + 16}
        textAnchor="middle"
        fill="#A89AA1"
        fontSize="10.5"
        style={{ letterSpacing: ".08em", textTransform: "uppercase" }}
        fontFamily="IBM Plex Mono"
      >
        {centerLabel}
      </text>
    </svg>
  );
}
