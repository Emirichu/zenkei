import { categorize, CATS, cleanMerchant } from "./categories";
import { iso } from "./format";
import type { ParseResult, Transaction } from "./types";

export function detectDelimiter(line: string): string {
  const counts: Record<string, number> = {
    ",": (line.match(/,/g) || []).length,
    "\t": (line.match(/\t/g) || []).length,
    ";": (line.match(/;/g) || []).length,
    "|": (line.match(/\|/g) || []).length,
  };
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
}

/** Split one CSV line, honoring quoted fields and escaped ("") quotes. */
export function splitCSVLine(line: string, delim: string): string[] {
  const out: string[] = [];
  let cur = "";
  let q = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (q && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else q = !q;
    } else if (c === delim && !q) {
      out.push(cur);
      cur = "";
    } else cur += c;
  }
  out.push(cur);
  return out.map((s) => s.trim().replace(/^"|"$/g, ""));
}

export interface ParsedAmount {
  n: number;
  neg: boolean;
  pos: boolean;
}

/** Read "$1,234.56", "(45.00)", "12.99 DR" etc. Sign markers are kept
 * separate from the magnitude so the caller can decide direction. */
export function parseAmount(raw: unknown): ParsedAmount | null {
  if (raw == null) return null;
  let s = String(raw).trim();
  if (!s) return null;
  const neg = /^\(.*\)$/.test(s) || /-/.test(s) || /\bDR\b|\bDEBIT\b/i.test(s);
  const pos = /\bCR\b|\bCREDIT\b/i.test(s);
  s = s.replace(/[()]/g, "").replace(/[^0-9.\-]/g, "");
  if (s === "" || s === ".") return null;
  let n = parseFloat(s);
  if (isNaN(n)) return null;
  n = Math.abs(n);
  return { n, neg, pos };
}

/** Accepts ISO dates, US-style m/d/y, and "Jul 3, 2026"-style text. */
export function parseDate(raw: unknown): string | null {
  if (!raw) return null;
  const s = String(raw).trim();
  let m: RegExpMatchArray | null;
  if ((m = s.match(/^(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})/)))
    return `${m[1]}-${String(m[2]).padStart(2, "0")}-${String(m[3]).padStart(2, "0")}`;
  if ((m = s.match(/^(\d{1,2})[-\/](\d{1,2})[-\/](\d{2,4})/))) {
    const a = m[1],
      b = m[2];
    let y = m[3];
    if (y.length === 2) y = "20" + y;
    return `${y}-${String(a).padStart(2, "0")}-${String(b).padStart(2, "0")}`;
  }
  const months: Record<string, number> = {
    jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
    jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
  };
  if ((m = s.match(/([a-z]{3,})\.?\s+(\d{1,2}),?\s*(\d{4})?/i))) {
    const mo = months[m[1].slice(0, 3).toLowerCase()];
    if (mo) {
      const y = m[3] || "2026";
      return `${y}-${String(mo).padStart(2, "0")}-${String(m[2]).padStart(2, "0")}`;
    }
  }
  const d = new Date(s);
  if (!isNaN(d.getTime())) return iso(d);
  return null;
}

export interface HeaderMap {
  date: number;
  desc: number;
  amount: number;
  debit: number;
  credit: number;
  cat: number;
}

export function findHeaderMap(cells: string[]): HeaderMap {
  const map: HeaderMap = { date: -1, desc: -1, amount: -1, debit: -1, credit: -1, cat: -1 };
  cells.forEach((c, i) => {
    const l = c.toLowerCase();
    if (map.date < 0 && /(date|posted|transaction date)/.test(l)) map.date = i;
    if (map.desc < 0 && /(desc|name|merchant|memo|payee|detail|narration)/.test(l)) map.desc = i;
    if (map.amount < 0 && /(amount|amt|value|total)/.test(l)) map.amount = i;
    if (map.debit < 0 && /(debit|withdraw|money out|paid out)/.test(l)) map.debit = i;
    if (map.credit < 0 && /(credit|deposit|money in|paid in)/.test(l)) map.credit = i;
    if (map.cat < 0 && /(category|type)/.test(l)) map.cat = i;
  });
  return map;
}

/**
 * The on-device parser. Two modes, chosen by sniffing the input:
 *
 * - CSV mode: detect the delimiter, map columns from the header row if
 *   there is one, otherwise infer them (first parseable date, longest
 *   non-numeric cell as description, rightmost money-like cell as
 *   amount). Separate debit/credit columns are supported.
 * - Freeform mode: for messy pasted statement text, find a date-ish
 *   token and a trailing amount on each line; whatever's left is the
 *   description. "CR"/"DR" suffixes and income words decide the sign.
 */
export function parseTransactions(text: string): ParseResult {
  const raw = (text || "")
    .replace(/\r/g, "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  if (!raw.length) return { rows: [], warnings: ["No text found."] };
  const warnings: string[] = [];
  const rows: Transaction[] = [];
  let idc = 1;
  const delim = detectDelimiter(raw[0]);
  const looksCSV =
    (raw[0].match(new RegExp("\\" + delim, "g")) || []).length >= 1 &&
    raw.filter((l) => l.includes(delim)).length >= raw.length * 0.6;
  if (looksCSV) {
    const first = splitCSVLine(raw[0], delim);
    const hmap = findHeaderMap(first);
    const hasHeader = hmap.date >= 0 || hmap.amount >= 0 || hmap.desc >= 0 || hmap.debit >= 0;
    const start = hasHeader ? 1 : 0;
    const map = hasHeader ? hmap : null;
    for (let i = start; i < raw.length; i++) {
      const cells = splitCSVLine(raw[i], delim);
      if (cells.length < 2) continue;
      let dateI: number | undefined,
        descI: number | undefined,
        amtI: number | undefined,
        debI: number | undefined,
        credI: number | undefined,
        catI: number | undefined;
      if (map) {
        dateI = map.date;
        descI = map.desc;
        amtI = map.amount;
        debI = map.debit;
        credI = map.credit;
        catI = map.cat;
      }
      if (dateI == null || dateI < 0) {
        dateI = cells.findIndex((c) => parseDate(c));
      }
      if (descI == null || descI < 0) {
        let best = -1,
          bl = 0;
        cells.forEach((c, j) => {
          if (!parseDate(c) && isNaN(parseFloat(c.replace(/[^0-9.\-]/g, ""))) && c.length > bl) {
            bl = c.length;
            best = j;
          }
        });
        descI = best;
      }
      let amount: number | null = null;
      if ((debI != null && debI >= 0) || (credI != null && credI >= 0)) {
        const deb = debI != null && debI >= 0 ? parseAmount(cells[debI]) : null;
        const cred = credI != null && credI >= 0 ? parseAmount(cells[credI]) : null;
        if (cred && cred.n) amount = cred.n;
        else if (deb && deb.n) amount = -deb.n;
      } else {
        if (amtI == null || amtI < 0) {
          for (let j = cells.length - 1; j >= 0; j--) {
            const p = parseAmount(cells[j]);
            if (p && p.n) {
              amtI = j;
              break;
            }
          }
        }
        const p = amtI != null && amtI >= 0 ? parseAmount(cells[amtI]) : null;
        if (p) {
          if (p.pos) amount = p.n;
          else if (p.neg) amount = -p.n;
          else {
            // No explicit sign: assume spending unless the row smells like income.
            const rowText = cells.join(" ");
            amount = /\b(payroll|deposit|salary|refund|reimburs|dividend|interest paid|transfer from|zelle from|venmo from|cashback)\b/i.test(rowText)
              ? p.n
              : -p.n;
          }
        }
      }
      const dateStr = dateI >= 0 ? parseDate(cells[dateI]) : null;
      const desc = descI >= 0 ? cells[descI] : cells.filter((_c, j) => j !== dateI && j !== amtI).join(" ");
      if (amount == null || !desc) {
        continue;
      }
      const cat =
        catI != null && catI >= 0 && cells[catI] && CATS[cells[catI]] ? cells[catI] : categorize(desc, amount);
      rows.push({
        id: "p" + idc++,
        date: dateStr || "2026-07-01",
        merchant: cleanMerchant(desc),
        description: desc,
        amount: Math.round(amount * 100) / 100,
        category: cat,
      });
    }
    if (!rows.length)
      warnings.push("Detected a CSV but couldn't map columns. Try including a header row like: Date, Description, Amount.");
  } else {
    for (const line of raw) {
      if (/^(date|description|balance|opening|closing|statement|account)\b/i.test(line) && !/\d/.test(line.replace(/[^0-9]/g, ""))) continue;
      const dateM = line.match(/\b(\d{4}[-\/]\d{1,2}[-\/]\d{1,2}|\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4}|[A-Za-z]{3,}\.?\s+\d{1,2}(?:,?\s*\d{4})?)\b/);
      let amtM: { [key: number]: string } | null = line.match(
        /(?:^|\s)(\(?-?\$?\s?\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?\)?)(?:\s*(CR|DR|credit|debit))?\s*$/i
      );
      if (!amtM) {
        const nums = line.match(/(-?\$?\s?\d+(?:\.\d{1,2}))/g);
        if (nums) {
          const last = nums[nums.length - 1];
          amtM = { 0: last, 1: last };
        }
      }
      if (!amtM) {
        continue;
      }
      const p = parseAmount(amtM[1]);
      if (!p || !p.n) {
        continue;
      }
      const creditWord = /\b(cr|credit|deposit|payroll|refund|salary)\b/i.test(line);
      const amount = p.pos || creditWord ? p.n : -p.n;
      let desc = line;
      if (dateM) desc = desc.replace(dateM[0], "");
      desc = desc.replace(amtM[1], "").replace(/\b(CR|DR|credit|debit)\b/gi, "");
      desc = desc.replace(/\s{2,}/g, " ").trim();
      if (!desc) {
        desc = "Unknown";
      }
      const cat = categorize(desc, amount);
      rows.push({
        id: "p" + idc++,
        date: dateM ? parseDate(dateM[0]) || "2026-07-01" : "2026-07-01",
        merchant: cleanMerchant(desc),
        description: desc,
        amount: Math.round(amount * 100) / 100,
        category: cat,
      });
    }
    if (!rows.length)
      warnings.push("Couldn't find transactions. Each line should contain a date and an amount, e.g.  07/02/2026  NETFLIX.COM  15.99");
  }
  rows.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  return { rows, warnings };
}
