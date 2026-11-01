// Talk4 "AI ears": when the phone's own voice input can't listen (iPhone has no Georgian; home-screen
// apps on iPhone often block it; some browsers have none), record the voice and let the AI write it down.
// Every page uses the same rules, so a language that failed once goes straight to the AI next time.
let AI = null;
const ready = import("./config.js?v=" + Math.floor(Date.now() / 600000)).then(m => AI = m.AI).catch(() => {});
const NAMES = { ja: "Japanese", en: "English", ka: "Georgian", ru: "Russian", ko: "Korean", zh: "Simplified Chinese" };
const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
const IOS = /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
const KEY = "t4-aiears";
const load = () => { try { return JSON.parse(localStorage.getItem(KEY) || "{}"); } catch { return {}; } };
export const SERIOUS = ["service-not-allowed", "language-not-supported", "network", "audio-capture", "not-allowed", "start"];

export function needAI(lang) { return !SR || !!load()[lang] || (IOS && (lang === "ka" || navigator.standalone)); }
export function markAI(lang) { const o = load(); o[lang] = true; try { localStorage.setItem(KEY, JSON.stringify(o)); } catch {} }

let cur = null;
export function stopAI() { cur?.stop(); }
export function busy() { return !!cur; }

/** Listen once. Resolves { alts: [text], err }. Stops 1.5 s after the voice ends (long: 2.5 s), or when stopAI() is called. */
export async function aiOnce(lang, long = false, onLevel) {
  if (cur) { cur.stop(); return { alts: [], err: "aborted" }; }
  await ready;
  if (!AI?.proxy) return { alts: [], err: "noai" };
  let stream;
  try { stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true, channelCount: 1 } }); }
  catch { return { alts: [], err: "not-allowed" }; }
  const ctx = new (window.AudioContext || window.webkitAudioContext)(); try { await ctx.resume(); } catch {}
  const src = ctx.createMediaStreamSource(stream), proc = ctx.createScriptProcessor(4096, 1, 1);
  const chunks = []; let heard = false, lastLoud = 0, noise = 0.01, done = false; const t0 = Date.now();
  const quiet = long === "talk" ? 10000 : long ? 2500 : 1500;   // conversation: 10 s of silence; answers: 2.5 s; one word: 1.5 s
  return new Promise(resolve => {
    const stop = async () => {
      if (done) return; done = true; cur = null;
      try { proc.disconnect(); src.disconnect(); stream.getTracks().forEach(t => t.stop()); ctx.close(); } catch {}
      if (!heard) return resolve({ alts: [], err: null });
      onLevel?.("wait");
      try {
        const r = await fetch(AI.proxy, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: JSON.stringify({ request: { contents: [{ parts: [{ inline_data: { mime_type: "audio/wav", data: toWav(chunks, ctx.sampleRate) } },
            { text: `Write down exactly what is said in this recording, word for word, even if it is said wrongly or with an accent — do not correct it. The speaker is speaking ${NAMES[lang]}; use ${NAMES[lang]} script. Reply ONLY JSON {"text":""}; empty text if there is no speech.` }] }],
            generationConfig: { responseMimeType: "application/json", temperature: 0, thinkingConfig: { thinkingLevel: "minimal" } } } }) });
        const j = await r.json(), raw = j.candidates?.[0]?.content?.parts?.map(p => p.text || "").join("") || "";
        const text = (JSON.parse(raw.replace(/^```json|```$/g, "").trim()).text || "").trim();
        resolve({ alts: text ? [text] : [], err: null });
      } catch { resolve({ alts: [], err: "network" }); }
    };
    cur = { stop };
    proc.onaudioprocess = e => {
      if (done) return;
      const d = e.inputBuffer.getChannelData(0); chunks.push(new Float32Array(d));
      let sum = 0; for (let k = 0; k < d.length; k += 8) sum += d[k] * d[k]; const rms = Math.sqrt(sum / (d.length / 8));
      if (!heard) noise = noise * 0.9 + rms * 0.1;
      if (rms > Math.max(0.006, noise * 2.5)) { heard = true; lastLoud = Date.now(); onLevel?.("on"); }
      const now = Date.now();
      if ((heard && now - lastLoud > quiet) || (!heard && now - t0 > 8000) || now - t0 > (long ? 180000 : 20000)) stop();
    };
    src.connect(proc); proc.connect(ctx.destination);
  });
}

export function toWav(chunks, rate) {
  const target = 16000, len = chunks.reduce((a, c) => a + c.length, 0), ratio = rate / target, n = Math.floor(len / ratio);
  const all = new Float32Array(len); let o = 0; for (const c of chunks) { all.set(c, o); o += c.length; }
  let peak = 0; for (let k = 0; k < len; k += 4) peak = Math.max(peak, Math.abs(all[k]));
  const boost = peak > 0 ? Math.min(12, 0.9 / peak) : 1;   // quiet or far voices are made as loud as close ones
  const buf = new DataView(new ArrayBuffer(44 + n * 2)), w = (p, t) => [...t].forEach((ch, k) => buf.setUint8(p + k, ch.charCodeAt(0)));
  w(0, "RIFF"); buf.setUint32(4, 36 + n * 2, true); w(8, "WAVE"); w(12, "fmt "); buf.setUint32(16, 16, true); buf.setUint16(20, 1, true); buf.setUint16(22, 1, true);
  buf.setUint32(24, target, true); buf.setUint32(28, target * 2, true); buf.setUint16(32, 2, true); buf.setUint16(34, 16, true); w(36, "data"); buf.setUint32(40, n * 2, true);
  for (let k = 0; k < n; k++) { const v = Math.max(-1, Math.min(1, all[Math.floor(k * ratio)] * boost)); buf.setInt16(44 + k * 2, v < 0 ? v * 0x8000 : v * 0x7fff, true); }
  let bin = ""; const u8 = new Uint8Array(buf.buffer); for (let k = 0; k < u8.length; k += 0x8000) bin += String.fromCharCode(...u8.subarray(k, k + 0x8000));
  return btoa(bin);
}
