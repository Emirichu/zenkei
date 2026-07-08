export const fmtUSD = (n: number, dec = 0) =>
  (n < 0 ? "-" : "") +
  "$" +
  Math.abs(n).toLocaleString("en-US", {
    minimumFractionDigits: dec,
    maximumFractionDigits: dec,
  });

export const fmtSignedUSD = (n: number) =>
  (n >= 0 ? "+" : "-") +
  "$" +
  Math.abs(n).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export const iso = (d: Date) => d.toISOString().slice(0, 10);
