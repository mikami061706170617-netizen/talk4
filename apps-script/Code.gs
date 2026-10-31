// Talk4 AI relay (Google Apps Script).
// Keeps the Gemini key private: the app sends its request here, this script adds the key and calls Gemini.
// Setup: Project Settings → Script properties → add GEMINI_KEY = your key. Deploy → Web app → Execute as: Me, Who has access: Anyone.

const DAILY_LIMIT = 1500; // stop for the day after this many AI calls (protects the free quota)

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents || "{}");
    if (!underLimit_()) return json_({ error: { message: "daily limit reached" } });
    const key = PropertiesService.getScriptProperties().getProperty("GEMINI_KEY");
    if (!key) return json_({ error: { message: "GEMINI_KEY is not set" } });
    // Try the best Flash model first; if it is busy, fall back to the next one
    let res = null;
    // "high" (listening to audio) uses the full Flash models first; everything else uses the fast Lite ones first
    const list = pickModels_(key), lite = list.filter(m => /lite/.test(m)), full = list.filter(m => !/lite/.test(m));
    const order = body.quality === "high" ? full.concat(lite) : lite.concat(full);
    for (const model of order) {
      res = UrlFetchApp.fetch("https://generativelanguage.googleapis.com/v1beta/models/" + model + ":generateContent", {
        method: "post", contentType: "application/json", headers: { "x-goog-api-key": key },
        payload: JSON.stringify(body.request || {}), muteHttpExceptions: true,
      });
      const code = res.getResponseCode();
      CacheService.getScriptCache().put("last", model + " " + code, 3600);
      if (code !== 429 && code !== 503 && code !== 500) break;
    }
    return ContentService.createTextOutput(res.getContentText()).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return json_({ error: { message: String(err) } });
  }
}

function doGet() {
  const c = CacheService.getScriptCache();
  return json_({ ok: true, service: "talk4-ai", models: JSON.parse(c.get("models") || "null"), last: c.get("last") });
}

function pickModels_(key) {
  const cache = CacheService.getScriptCache(), hit = cache.get("models3");
  if (hit) return JSON.parse(hit);
  let models = ["gemini-2.5-flash-lite", "gemini-2.5-flash"];
  try {
    const r = UrlFetchApp.fetch("https://generativelanguage.googleapis.com/v1beta/models?pageSize=200", { headers: { "x-goog-api-key": key }, muteHttpExceptions: true });
    const names = (JSON.parse(r.getContentText()).models || [])
      .filter(m => (m.supportedGenerationMethods || []).indexOf("generateContent") >= 0)
      .map(m => m.name.replace("models/", ""))
      .filter(n => /flash/.test(n) && !/(image|tts|audio|live|thinking|exp|8b|embedding)/.test(n));
    const ver = n => parseFloat((n.match(/gemini-(\d+(?:\.\d+)?)/) || [0, 0])[1]);
    const sorted = names.sort((a, b) => (/preview/.test(a) - /preview/.test(b)) || ver(b) - ver(a) || a.length - b.length);
    const lite = sorted.filter(n => /lite/.test(n)).slice(0, 3), full = sorted.filter(n => !/lite/.test(n)).slice(0, 3);
    if (lite.length || full.length) models = lite.concat(full);
  } catch (e) {}
  cache.put("models3", JSON.stringify(models), 21600); cache.put("models", JSON.stringify(models), 21600);
  return models;
}

function underLimit_() {
  const lock = LockService.getScriptLock(); lock.waitLock(5000);
  try {
    const p = PropertiesService.getScriptProperties(), day = Utilities.formatDate(new Date(), "Asia/Tbilisi", "yyyy-MM-dd");
    const k = "count_" + day, n = Number(p.getProperty(k) || 0);
    if (n >= DAILY_LIMIT) return false;
    p.setProperty(k, String(n + 1));
    return true;
  } finally { lock.releaseLock(); }
}

function json_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
