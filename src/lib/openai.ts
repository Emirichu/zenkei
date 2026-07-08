/* Optional OpenAI integration. Everything here only runs if the user
 * pastes their own API key; requests go straight from the browser to
 * api.openai.com and the key is held in component state, never stored. */

import { categorize, CATS, cleanMerchant } from "./categories";
import { fileToDataURL } from "./ocr";
import type { Transaction } from "./types";

interface ChatCompletion {
  choices: { message: { content: string } }[];
}

interface RawRow {
  date?: string;
  merchant?: string;
  description?: string;
  amount?: number | string;
  category?: string;
}

/** Parse messy transaction text with an LLM instead of the built-in parser. */
export async function llmParse(text: string, apiKey: string): Promise<Transaction[]> {
  const prompt = `You are a financial data parser. Convert the following raw bank/card transaction text into a JSON array. Each element: {"date":"YYYY-MM-DD","merchant":"clean name","description":"original","amount":number (negative for spending, positive for income),"category":"one of: Income, Housing, Groceries, Dining, Transport, Shopping, Utilities, Subscriptions, Health, Entertainment, Travel, Other"}. Return ONLY the JSON array.\n\nTRANSACTIONS:\n${text.slice(0, 6000)}`;
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + apiKey,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      temperature: 0,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  if (!res.ok) throw new Error("API error " + res.status);
  const data: ChatCompletion = await res.json();
  const content = data.choices[0].message.content.trim().replace(/^```json?/, "").replace(/```$/, "").trim();
  const arr: RawRow[] = JSON.parse(content);
  return arr.map((r, i) => ({
    id: "l" + i,
    date: r.date || "2026-07-01",
    merchant: r.merchant || cleanMerchant(r.description || ""),
    description: r.description || r.merchant || "",
    amount: Number(r.amount) || 0,
    category: r.category && CATS[r.category] ? r.category : categorize(r.description || r.merchant || "", Number(r.amount)),
  }));
}

/** Read a statement screenshot with a vision model. */
export async function llmVision(file: File, apiKey: string): Promise<Transaction[]> {
  const url = await fileToDataURL(file);
  const prompt =
    'Extract every transaction from this bank/card statement screenshot into a JSON array. Each element: {"date":"YYYY-MM-DD","merchant":"clean name","description":"raw text","amount":number (negative for spending, positive for income),"category":"one of: Income, Housing, Groceries, Dining, Transport, Shopping, Utilities, Subscriptions, Health, Entertainment, Travel, Other"}. Return ONLY the JSON array.';
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + apiKey,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      temperature: 0,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            { type: "image_url", image_url: { url } },
          ],
        },
      ],
    }),
  });
  if (!res.ok) throw new Error("API error " + res.status);
  const d: ChatCompletion = await res.json();
  const c = d.choices[0].message.content.trim().replace(/^```json?/, "").replace(/```$/, "").trim();
  const arr: RawRow[] = JSON.parse(c);
  return arr.map((r, i) => ({
    id: "v" + i,
    date: r.date || "2026-07-01",
    merchant: r.merchant || cleanMerchant(r.description || ""),
    description: r.description || r.merchant || "",
    amount: Number(r.amount) || 0,
    category: r.category && CATS[r.category] ? r.category : categorize(r.description || r.merchant || "", Number(r.amount)),
  }));
}

/** Draft the Coach tab's written note from an on-device summary. */
export async function llmAdvice(summary: string, apiKey: string): Promise<string> {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + apiKey,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      temperature: 0.4,
      messages: [
        {
          role: "system",
          content:
            "You are a warm, concise personal finance coach. Reply in 2 short paragraphs of specific, practical, non-judgmental advice. No markdown, no headers, no bullet points.",
        },
        { role: "user", content: summary },
      ],
    }),
  });
  if (!res.ok) throw new Error("API error " + res.status);
  const d: ChatCompletion = await res.json();
  return d.choices[0].message.content.trim();
}
