// Talk4 names: people, companies and places, written the same way in every language and never
// translated by meaning (三上 → "three up"). Common names are built in; the user adds their own
// (saved on this phone only, localStorage "t4-names").
//
// Name or ordinary word? (ノド the person vs 喉 the throat)
//  - Spellings that can only be a name are fixed automatically: katakana and Latin spellings (as a whole
//    word, so アナ is not touched inside アナウンス) and kanji names of 2+ characters (三上, 田中).
//  - Spellings that are also ordinary words (喉, のど, 森, みかみ) count as a name ONLY when a title follows:
//    さん, 様, 君, くん, ちゃん, 先生, 社長, 部長, 氏… — "のどが痛い" stays "my throat hurts".
//  - Everything else is left to the AI, which is told the names and decides from the sentence.
const KEY = "t4-names";
export const LANGS = ["ja", "en", "ka", "ru", "ko", "zh"];
const n = (forms, en, ka, ru, ko, zh) => ({ forms: forms.split("/"), ja: forms.split("/")[0], en, ka, ru, ko, zh, builtin: true });

// Common names, so they work without registering. Kept to names that are not everyday words.
const BUILTIN = [
  // Georgian names (as Japanese voice input writes them)
  n("ギオルギ/ギオルギー", "Giorgi", "გიორგი", "Гиорги", "기오르기"), n("ダト/ダトー", "Dato", "დათო", "Дато", "다토"),
  n("ダヴィット/ダビット/ダヴィド", "Davit", "დავითი", "Давид", "다비트"), n("ディマ", "Dima", "დიმა", "Дима", "디마"),
  n("ニノ", "Nino", "ნინო", "Нино", "니노"), n("タマル/タマリ", "Tamar", "თამარი", "Тамар", "타마르"),
  n("ラシャ", "Lasha", "ლაშა", "Лаша", "라샤"), n("レヴァン/レバン", "Levan", "ლევანი", "Леван", "레반"),
  n("ノダル", "Nodar", "ნოდარი", "Нодар", "노다르"), n("イラクリ/イラクリー", "Irakli", "ირაკლი", "Ираклий", "이라클리"),
  n("ズラブ", "Zurab", "ზურაბი", "Зураб", "주라브"), n("ルカ", "Luka", "ლუკა", "Лука", "루카"),
  n("ニカ", "Nika", "ნიკა", "Ника", "니카"), n("サンドロ", "Sandro", "სანდრო", "Сандро", "산드로"),
  n("マリアム", "Mariam", "მარიამი", "Мариам", "마리암"), n("サロメ", "Salome", "სალომე", "Саломе", "살로메"),
  n("ナティア", "Natia", "ნათია", "Натия", "나티아"), n("ケティ", "Keti", "ქეთი", "Кети", "케티"),
  n("ギア", "Gia", "გია", "Гия", "기아"), n("マカ", "Maka", "მაკა", "Мака", "마카"), n("ゴガ", "Goga", "გოგა", "Гога", "고가"),
  n("ソソ", "Soso", "სოსო", "Сосо", "소소"), n("ベカ", "Beka", "ბექა", "Бека", "베카"), n("ショタ", "Shota", "შოთა", "Шота", "쇼타"),
  // English / Canadian names
  n("ジョン", "John", "ჯონი", "Джон", "존"), n("マイケル", "Michael", "მაიკლი", "Майкл", "마이클"), n("マイク", "Mike", "მაიკი", "Майк", "마이크"),
  n("デイビッド/デビッド", "David", "დევიდი", "Дэвид", "데이비드"), n("クリス", "Chris", "კრისი", "Крис", "크리스"),
  n("マット", "Matt", "მეტი", "Мэтт", "맷"), n("ライアン", "Ryan", "რაიანი", "Райан", "라이언"), n("ジェームズ", "James", "ჯეიმსი", "Джеймс", "제임스"),
  n("ダニエル", "Daniel", "დანიელი", "Дэниел", "대니얼"), n("ジェイソン", "Jason", "ჯეისონი", "Джейсон", "제이슨"),
  n("ケビン/ケヴィン", "Kevin", "კევინი", "Кевин", "케빈"), n("ブライアン", "Brian", "ბრაიანი", "Брайан", "브라이언"),
  n("エリック", "Eric", "ერიკი", "Эрик", "에릭"), n("スティーブ", "Steve", "სტივი", "Стив", "스티브"), n("ポール", "Paul", "პოლი", "Пол", "폴"),
  n("マーク", "Mark", "მარკი", "Марк", "마크"), n("アレックス", "Alex", "ალექსი", "Алекс", "알렉스"),
  n("エミリー", "Emily", "ემილი", "Эмили", "에밀리"), n("サラ", "Sarah", "სარა", "Сара", "사라"), n("ジェシカ", "Jessica", "ჯესიკა", "Джессика", "제시카"),
  n("ケイト", "Kate", "ქეითი", "Кейт", "케이트"), n("ローラ", "Laura", "ლორა", "Лора", "로라"), n("アンナ", "Anna", "ანა", "Анна", "안나"),
  n("ジェニファー", "Jennifer", "ჯენიფერი", "Дженнифер", "제니퍼"), n("ミシェル", "Michelle", "მიშელი", "Мишель", "미셸"),
  // Japanese family names (kanji names that a translator might translate by meaning)
  ...[["三上","Mikami"],["佐藤","Sato"],["鈴木","Suzuki"],["高橋","Takahashi"],["田中","Tanaka"],["伊藤","Ito"],["渡辺","Watanabe"],["山本","Yamamoto"],
     ["中村","Nakamura"],["小林","Kobayashi"],["加藤","Kato"],["吉田","Yoshida"],["山田","Yamada"],["佐々木","Sasaki"],["山口","Yamaguchi"],
     ["松本","Matsumoto"],["井上","Inoue"],["木村","Kimura"],["斎藤","Saito"],["山崎","Yamazaki"],["中島","Nakajima"],["前田","Maeda"],
     ["藤田","Fujita"],["後藤","Goto"],["岡田","Okada"],["長谷川","Hasegawa"],["村上","Murakami"],["近藤","Kondo"],["坂本","Sakamoto"],
     ["遠藤","Endo"],["青木","Aoki"],["藤井","Fujii"],["西村","Nishimura"],["福田","Fukuda"],["太田","Ota"],["三浦","Miura"],["藤原","Fujiwara"],
     ["松田","Matsuda"],["原田","Harada"],["小野","Ono"],["田村","Tamura"],["竹内","Takeuchi"],["金子","Kaneko"],["和田","Wada"],["中山","Nakayama"],
     ["石井","Ishii"],["上田","Ueda"],["森田","Morita"],["黒川","Kurokawa"],["山中","Yamanaka"],["恭平","Kyohei"],["あさみ","Asami"]]
    .map(([ja, en]) => ({ forms: [ja], ja, en, builtin: true })),
];

export function getNames() { try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; } }
export function setNames(list) { try { localStorage.setItem(KEY, JSON.stringify(list)); } catch {} }
const everyName = () => getNames().concat(BUILTIN);   // the user's own spellings win
// Names heard in conversation are remembered automatically (no registering needed):
// the AI reports names of people/companies/places it is sure about, e.g. when someone introduces themselves.
export function learn(found) {
  if (!Array.isArray(found) || !found.length) return;
  const list = getNames(), all = everyName(); let changed = false;
  for (const f of found) {
    const en = (f.en || "").trim(), said = (f.said || "").trim(), ja = (f.ja || "").trim();
    if (!en || !/^[A-Za-z][A-Za-z .'-]{1,40}$/.test(en)) continue;
    const forms = [...new Set([said, ja].filter(x => x && x !== en && x.length <= 20))];
    const known = all.find(x => (x.en || "").toLowerCase() === en.toLowerCase());
    if (known) { if (!known.builtin) { const add = forms.filter(x => !(known.forms || []).includes(x)); if (add.length) { known.forms = [...(known.forms || []), ...add]; changed = true; } } continue; }
    list.unshift({ forms: forms.length ? forms : [en], en, ja: ja || undefined, auto: true }); changed = true;
  }
  if (changed) setNames(list.slice(0, 150));
}
export const learnAsk = `"names": every name of a person, company or place in the line ONLY if it is clearly a name (not an ordinary word): [{"said":"as written in the line","en":"Latin spelling","ja":"Japanese (katakana, or the kanji used)"}], [] if none`;


const esc = x => x.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const TITLE = "(?=\\s*(?:さん|さま|様|君|くん|ちゃん|氏|先生|社長|部長|課長|専務|会長|殿|-san|san\\b))";
const KANA = "ァ-ヶー", KANJI = "\\u4e00-\\u9fff々";
// Which pattern finds this spelling as a name (or null: leave it to the AI)
function finder(f) {
  if (/^[A-Za-z][A-Za-z .'-]*$/.test(f)) return new RegExp(`\\b${esc(f)}\\b`, "gi");                      // John, Mikami
  if (new RegExp(`^[${KANA}]{2,}$`).test(f)) return new RegExp(`(?<![${KANA}])${esc(f)}(?![${KANA}])`, "g"); // ダト (not inside a longer katakana word)
  if (new RegExp(`^[${KANJI}]{2,}$`).test(f)) return new RegExp(esc(f), "g");                                // 三上, 三上恭平
  if (/^[぀-ヿ一-鿿]+$/.test(f)) return new RegExp(`${esc(f)}${TITLE}`, "g");               // 喉, のど, 森: only with さん etc.
  return new RegExp(esc(f), "g");                                                                             // Georgian, Cyrillic, Hangul spellings
}
const allForms = x => [...new Set([...(x.forms || []), ...LANGS.map(l => x[l])].filter(Boolean))].sort((a, b) => b.length - a.length);

// Before the free translator: names into Latin letters, so they are kept as names
export function preNames(text) {
  for (const x of everyName()) {
    const en = x.en; if (!en) continue;
    for (const f of allForms(x)) if (f !== en && !/^[A-Za-z]/.test(f)) { const r = finder(f); if (r) text = text.replace(r, ` ${en} `); }
  }
  return text.replace(/ {2,}/g, " ").replace(/ ([、。，．！？」）])/g, "$1").trim();
}
// After translating: write each name the way the listener's language writes it
export function postNames(text, to) {
  if (!text) return text;
  for (const x of everyName()) {
    const target = x[to]; if (!target) continue;
    for (const f of allForms(x)) if (f !== target) { const r = finder(f); if (r) text = text.replace(r, target); }
  }
  return text;
}
// For the AI: the names that may be in this sentence, and how to tell a name from a word
export function namesPrompt(langs, text = "") {
  const near = everyName().filter(x => !x.builtin || allForms(x).some(f => text.includes(f) || text.toLowerCase().includes(f.toLowerCase())));
  const list = near.slice(0, 30).map(x => allForms(x).join(" / ")).join("\n");
  return `Names of people, companies and places are never translated by meaning: write them by sound. Decide from the sentence whether a word is a name (used as a person: with さん/様, someone who does something, someone you meet or call) or an ordinary word (e.g. のど in "のどが痛い" is the throat, not a person).` +
    (list ? `\nKnown names (any of these spellings is the same name; use them when the word is a name):\n${list}` : "");
}

// Ask the AI once how a new name is written in all languages
export async function spellNames(proxy, words) {
  const prompt = `These are personal names, company names or place names (not words to translate). For each, give how it is written by SOUND in each language: ja (Japanese: keep the kanji if given, otherwise katakana), en (Latin letters), ka (Georgian letters), ru (Cyrillic), ko (Hangul), zh (Chinese characters commonly used, or transliteration). Use the hint after "=" if there is one.
${words.join("\n")}
Reply ONLY JSON {"names":[{"ja":"","en":"","ka":"","ru":"","ko":"","zh":""}]} in the same order.`;
  const r = await fetch(proxy, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ request: { contents: [{ parts: [{ text: prompt }] }], generationConfig: { responseMimeType: "application/json", temperature: 0, thinkingConfig: { thinkingLevel: "minimal" } } } }) });
  const j = await r.json(), raw = (j.candidates?.[0]?.content?.parts || []).map(p => p.text || "").join("").replace(/^```json|```$/g, "").trim();
  return JSON.parse(raw).names || [];
}
