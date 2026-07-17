/** The Coach tab's money-health ring: a 0-100 score drawn as a partial
 * circle via stroke-dasharray, in the band color passed by the caller. */
export default function ScoreRing({ score, color }: { score: number; color: string }) {
  const R = 54,
    C = 2 * Math.PI * R,
    dash = (score / 100) * C;
  return (
    <svg width="150" height="150" viewBox="0 0 140 140">
      <circle cx="70" cy="70" r={R} fill="none" stroke="#F0E4E8" strokeWidth="12" />
      <circle
        cx="70"
        cy="70"
        r={R}
        fill="none"
        stroke={color}
        strokeWidth="12"
        strokeLinecap="round"
        strokeDasharray={`${dash} ${C - dash}`}
        transform="rotate(-90 70 70)"
        className="grow"
        style={{ transformOrigin: "center" }}
      />
      <text x="70" y="66" textAnchor="middle" fill="#312B33" fontSize="34" fontWeight="600" fontFamily="'Shippori Mincho', serif">
        {score}
      </text>
      <text x="70" y="88" textAnchor="middle" fill="#A89AA1" fontSize="10" fontFamily="IBM Plex Mono" style={{ letterSpacing: ".1em" }}>
        OUT OF 100
      </text>
    </svg>
  );
}
