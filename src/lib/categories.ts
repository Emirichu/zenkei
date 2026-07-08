/* Palette + category config (warm, sakura-style) */
export const CATS: Record<string, { color: string }> = {
  Income: { color: "#5E9E86" },
  Housing: { color: "#C9924A" },
  Groceries: { color: "#7BA37F" },
  Dining: { color: "#D96A8A" },
  Transport: { color: "#4E6E96" },
  Shopping: { color: "#9B7CB0" },
  Utilities: { color: "#D4A24E" },
  Subscriptions: { color: "#5B93A6" },
  Health: { color: "#6FA292" },
  Entertainment: { color: "#D97757" },
  Travel: { color: "#6E88C4" },
  Other: { color: "#A89AA1" },
};

export const catColor = (c: string) => (CATS[c] && CATS[c].color) || "#A89AA1";

/* The categorizer's brain: ordered keyword rules. First match wins,
 * so more specific categories (Subscriptions) come before broad ones. */
export const RULES: [string, string[]][] = [
  ["Subscriptions", ["netflix", "spotify", "hulu", "disney", "hbo", "max ", "youtube premium", "prime video", "paramount", "peacock", "apple.com/bill", "icloud", "google storage", "dropbox", "adobe", "chatgpt", "openai", "claude", "anthropic", "nytimes", "ny times", "wsj", "medium", "patreon", "substack", "audible", "kindle unlimited", "microsoft 365", "office 365", "notion", "canva", "figma", "github", "peloton digital", "classpass", "masterclass", "linkedin premium", "1password", "xbox game", "playstation plus", "nintendo online"]],
  ["Housing", ["rent", "apartment", "apartments", "landlord", "mortgage", "hoa", "property mgmt", "leasing", "realty", "zillow rent"]],
  ["Utilities", ["pg&e", "pge", "con edison", "coned", "electric", "water dept", "water util", "gas company", "comcast", "xfinity", "spectrum", "at&t", "att ", "verizon", "t-mobile", "tmobile", "internet", "utility", "waste mgmt", "sewer"]],
  ["Groceries", ["whole foods", "trader joe", "safeway", "kroger", "costco", "walmart grocery", "aldi", "publix", "wegmans", "sprouts", "grocery", "supermarket", "ralphs", "albertsons", "food lion", "h-e-b", "heb "]],
  ["Dining", ["starbucks", "chipotle", "mcdonald", "doordash", "uber eats", "ubereats", "grubhub", "postmates", "restaurant", "cafe", "coffee", "pizza", "sushi", "taco", "burger", "chick-fil", "panera", "dunkin", "shake shack", "bar &", "grill", "kitchen", "bistro", "deli", "bakery", "five guys", "sweetgreen", "subway "]],
  ["Transport", ["uber", "lyft", "shell", "chevron", "exxon", "mobil", "bp ", "gas station", "fuel", "76 ", "arco", "parking", "transit", "metro", "subway metro", "bart", "caltrain", "toll", "fastrak", "dmv", "auto repair", "jiffy lube", "tire"]],
  ["Travel", ["airlines", "airline", "delta", "united air", "american air", "southwest", "jetblue", "alaska air", "hotel", "marriott", "hilton", "airbnb", "expedia", "booking.com", "hertz", "enterprise rent", "avis", "tsa", "airport"]],
  ["Health", ["pharmacy", "cvs", "walgreens", "rite aid", "doctor", "dentist", "clinic", "hospital", "medical", "gym", "fitness", "planet fit", "equinox", "peloton", "yoga", "therapy", "optometry", "vision", "urgent care", "copay"]],
  ["Shopping", ["amazon", "amzn", "target", "best buy", "apple store", "nike", "adidas", "macy", "nordstrom", "ikea", "home depot", "lowe", "etsy", "ebay", "wayfair", "sephora", "ulta", "zara", "h&m", "uniqlo", "gap ", "old navy", "lululemon", "bookstore"]],
  ["Entertainment", ["cinema", "movie", "amc ", "regal", "fandango", "theater", "concert", "ticketmaster", "stubhub", "steam games", "game stop", "gamestop", "event", "museum", "bowling", "arcade"]],
  ["Income", ["payroll", "direct deposit", "salary", "paycheck", "deposit from", "interest paid", "dividend", "refund", "reimbursement", "venmo cashout", "zelle from", "tax refund", "cashback"]],
];

export function categorize(desc: string, amount?: number | null): string {
  const d = (desc || "").toLowerCase();
  // Money coming in is income, whatever the description says.
  if (amount != null && amount > 0) return "Income";
  for (const [cat, kws] of RULES) {
    if (cat === "Income") continue;
    for (const kw of kws) {
      if (d.includes(kw)) return cat;
    }
  }
  return "Other";
}

/** Turn raw statement noise ("NETFLIX.COM 310-555-0199 CA") into a
 * display name ("Netflix.com"): strip card jargon, store numbers,
 * dates, trailing state/zip, then Title Case the first few words. */
export function cleanMerchant(desc: string): string {
  let s = (desc || "").replace(/\s+/g, " ").trim();
  s = s.replace(/\b(purchase|pos|debit|card|payment|recurring|autopay|ach|pending|visa|mastercard|ppd|web id[:#]?\s*\w+)\b/gi, "");
  s = s.replace(/\bx{2,}\d+\b/gi, "").replace(/#?\d{4,}/g, "").replace(/\*+/g, " ");
  s = s.replace(/\b\d{1,2}[\/-]\d{1,2}([\/-]\d{2,4})?\b/g, "");
  s = s.replace(/\s{2,}/g, " ").replace(/[|·•]+/g, " ").trim();
  s = s.replace(/,\s*[A-Z]{2}\b.*$/, "");
  s = s.replace(/\s+\d{5}(-\d{4})?$/, "");
  if (!s) return (desc || "Unknown").trim();
  return s
    .split(" ")
    .filter(Boolean)
    .slice(0, 4)
    .map((w) => (w.length >= 2 ? w[0].toUpperCase() + w.slice(1).toLowerCase() : w.toUpperCase()))
    .join(" ");
}

/** Normalize a description to a grouping key so "NETFLIX.COM 0199" and
 * "Netflix.com" land in the same bucket for subscription detection. */
export function merchantKey(desc: string): string {
  return (desc || "")
    .toLowerCase()
    .replace(/[^a-z ]+/g, " ")
    .replace(/\b(inc|llc|co|com|bill|autopay|recurring|payment|pos|purchase|the)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .slice(0, 3)
    .join(" ");
}
