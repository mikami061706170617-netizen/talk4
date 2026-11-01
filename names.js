// Talk4 names: people, companies and places the user registers once, so they are always written
// the same way in every language and never translated by meaning (三上 → "three up").
// Saved on this phone only (localStorage "t4-names").
// Each entry: { forms: ["三上", "みかみ", "ミカミ"], ja, en, ka, ru, ko, zh }
const KEY = "t4-names";
export const LANGS = ["ja", "en", "ka", "ru", "ko", "zh"];

export function getNames() { try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; } }
export function setNames(list) { try { localStorage.setItem(KEY, JSON.stringify(list)); } catch {} }

const esc = x => x.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
// Every way the name can appear (what the user typed, plus how it is written in each language)
const allForms = n => [...new Set([...(n.forms || []), ...LANGS.map(l => n[l])].filter(Boolean))].sort((a, b) => b.length - a.length);
const re = f => /^[A-Za-z]/.test(f) ? new RegExp(`\\b${esc(f)}\\b`, "gi") : new RegExp(esc(f), "g");

// Before the free translator: put names into Latin letters, so they are kept as names, not translated by meaning
export function preNames(text, from) {
  for (const n of getNames()) {
    const en = n.en || n.forms?.[0]; if (!en) continue;
    for (const f of allForms(n)) if (f !== en && !/^[A-Za-z]/.test(f)) text = text.replace(re(f), en);
  }
  return text;
}
// After translating: whatever form came out, write the name the way it is written in the listener's language
export function postNames(text, to) {
  if (!text) return text;
  for (const n of getNames()) {
    const target = n[to] || n.en; if (!target) continue;
    for (const f of allForms(n)) if (f !== target) text = text.replace(re(f), target);
  }
  return text;
}
// For the AI: the list of names and the rule
export function namesPrompt(langs) {
  const list = getNames().map(n => (n.forms || []).concat(langs.map(l => n[l] ? `${l}: ${n[l]}` : "").filter(Boolean)).join(" / ")).join("\n");
  return `Personal names, company names and place names are never translated by meaning: write them by sound in each language.` +
    (list ? `\nThese names must always be written exactly like this (any of these spellings means the same name):\n${list}` : "");
}

// Ask the AI once how each new name is written in all languages
export async function spellNames(proxy, words) {
  const prompt = `These are personal names, company names or place names (not words to translate). For each, give how it is written by SOUND in each language: ja (Japanese, katakana for foreign names, keep kanji if given), en (Latin letters), ka (Georgian letters), ru (Cyrillic), ko (Hangul), zh (Chinese characters commonly used, or transliteration). Use the hint after "=" if there is one.
${words.join("\n")}
Reply ONLY JSON {"names":[{"ja":"","en":"","ka":"","ru":"","ko":"","zh":""}]} in the same order.`;
  const r = await fetch(proxy, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ request: { contents: [{ parts: [{ text: prompt }] }], generationConfig: { responseMimeType: "application/json", temperature: 0, thinkingConfig: { thinkingLevel: "minimal" } } } }) });
  const j = await r.json(), raw = (j.candidates?.[0]?.content?.parts || []).map(p => p.text || "").join("").replace(/^```json|```$/g, "").trim();
  return JSON.parse(raw).names || [];
}
