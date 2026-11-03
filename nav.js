// ---------- Moving to talk4.omeletrice.com ----------
// The old address (github.io) passes everything saved on this phone (plan code, settings, names, history)
// to the new address in the link, and the new address saves it. Nobody has to enter anything again.
(() => {
  const NEW = "https://talk4.omeletrice.com";
  const MOVE = false;   // switched on once the new address is live
  try {
    if (/github\.io$/.test(location.hostname) && MOVE) {
      const keep = {};
      for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (/^(t4|talk4)/.test(k)) keep[k] = localStorage.getItem(k); }
      let data = btoa(unescape(encodeURIComponent(JSON.stringify(keep))));
      if (data.length > 400000) { delete keep["talk4-log"]; data = btoa(unescape(encodeURIComponent(JSON.stringify(keep)))); }
      const page = location.pathname.replace(/^\/talk4\/?/, ""), rest = location.hash.replace(/^#/, "");
      document.documentElement.style.visibility = "hidden";
      location.replace(NEW + "/" + page + location.search + "#t4m=" + data + (rest ? "&" + rest : ""));
      return;
    }
    const m = location.hash.match(/[#&]t4m=([^&]*)/);
    if (m) {
      const got = JSON.parse(decodeURIComponent(escape(atob(m[1]))));
      for (const k in got) if (localStorage.getItem(k) === null) localStorage.setItem(k, got[k]);
      const rest = location.hash.replace(/[#&]?t4m=[^&]*&?/, "").replace(/^#?/, "");
      history.replaceState(null, "", location.pathname + location.search + (rest ? "#" + rest : ""));
    }
  } catch {}
})();

// ---------- Plans: which AI this phone gets ----------
// Every AI request goes to the relay with this phone's plan code (if any). The relay decides:
// plan code → the stronger paid AI; first minutes of use → a free trial of it; after that → the standard free AI.
// When the trial ends, a one-time message offers the plan.
(() => {
  const TRIAL_CALLS = 40;                      // about 10 minutes of conversation
  const get = k => { try { return localStorage.getItem(k); } catch { return null; } };
  const set = (k, v) => { try { localStorage.setItem(k, v); } catch {} };
  const ja = (navigator.languages || [navigator.language]).some(c => /^ja/i.test(c || ""));
  window.T4plan = {
    code: () => get("t4c-code") || "",
    trialLeft: () => Math.max(0, TRIAL_CALLS - (+get("t4-trial-calls") || 0)),
    tier: () => get("t4-ai-tier") || "",
  };
  // Staff / plan link: talk.html#k=CODE puts the code on this phone once (then the address is cleaned up)
  try {
    const m = location.hash.match(/[#&]k=([A-Za-z0-9-]{4,40})/);
    if (m) { set("t4c-code", m[1].toUpperCase()); set("t4-ai-tier", "paid"); history.replaceState(null, "", location.pathname + location.search);
      addEventListener("DOMContentLoaded", () => { const d = document.createElement("div"); d.textContent = ja ? "✓ 高精度AIが使えるようになりました" : "✓ Precise AI is on for this phone";
        d.style.cssText = "position:fixed;left:50%;top:14px;transform:translateX(-50%);z-index:99;background:#d8ae55;color:#1a1307;font:700 15px system-ui,sans-serif;padding:10px 16px;border-radius:12px";
        document.body.append(d); setTimeout(() => d.remove(), 3500); }); }
  } catch {}
  const BACKUP = "https://script.google.com/macros/s/AKfycbyzD8Md1xuk8MZ7DxFgAQfOgUm9JCGfS8joqfInXLl3Iy-qPbl-S2BsZTEiqwBwykMX/exec";
  const isRelay = u => typeof u === "string" && (/script\.google(usercontent)?\.com\/macros\//.test(u) || /talk4-ai\.[\w-]+\.workers\.dev/.test(u));
  const realFetch = window.fetch.bind(window);
  window.fetch = async (u, o) => {
    if (!isRelay(u) || !o || o.method !== "POST" || typeof o.body !== "string") return realFetch(u, o);
    try { const b = JSON.parse(o.body); b.code = T4plan.code(); b.trial = !b.code && T4plan.trialLeft() > 0; o = { ...o, body: JSON.stringify(b) }; } catch {}
    // Fast relay first; if it can't be reached or breaks, the backup relay answers instead
    let r;
    try { r = await realFetch(u, o); if (r.status >= 500 && u !== BACKUP) throw new Error("relay " + r.status); }
    catch (e) { if (u === BACKUP || o.signal?.aborted) throw e; r = await realFetch(BACKUP, o); }
    r.clone().json().then(j => {
      if (!j || !j.t4) return;
      const before = get("t4-ai-tier"); set("t4-ai-tier", j.t4);
      if (j.t4 === "trial") set("t4-trial-calls", String((+get("t4-trial-calls") || 0) + 1));
      if (j.t4 === "free" && (before === "trial" || T4plan.trialLeft() === 0) && !get("t4-upsell-shown")) { set("t4-upsell-shown", "1"); upsell(); }
    }).catch(() => {});
    return r;
  };
  function upsell() {
    const d = document.createElement("div");
    d.style.cssText = "position:fixed;left:12px;right:12px;bottom:calc(70px + env(safe-area-inset-bottom,0px));z-index:20;background:#24211e;border:1px solid #d8ae55;border-radius:16px;padding:14px;color:#f4efe6;font:14px/1.5 'Noto Sans JP',system-ui,sans-serif;box-shadow:0 8px 30px rgba(0,0,0,.5)";
    d.innerHTML = ja
      ? `<b style="color:#d8ae55">お試しの「高精度AI」が終わりました</b><br>ここからは無料の標準AIで、このままずっと使えます。<br>聞き取り・訳をもっと正確にしたいときは <b>Talk4 Pro（月₾15）</b> にできます。<div style="display:flex;gap:8px;margin-top:10px"><a href="plans.html#pro" style="flex:1;text-align:center;background:#d8443a;color:#fff;border-radius:10px;padding:10px;text-decoration:none;font-weight:700">Proにする</a><button style="flex:1;background:none;border:1px solid #33302b;color:#f4efe6;border-radius:10px;padding:10px;font:inherit">無料で続ける</button></div>`
      : `<b style="color:#d8ae55">Your free trial of the precise AI has ended</b><br>You can keep using Talk4 free with the standard AI.<br>For the most accurate listening and translation, get <b>Talk4 Pro (₾15/month)</b>.<div style="display:flex;gap:8px;margin-top:10px"><a href="plans.html#pro" style="flex:1;text-align:center;background:#d8443a;color:#fff;border-radius:10px;padding:10px;text-decoration:none;font-weight:700">Get Pro</a><button style="flex:1;background:none;border:1px solid #33302b;color:#f4efe6;border-radius:10px;padding:10px;font:inherit">Keep free</button></div>`;
    d.querySelector("button").onclick = () => d.remove();
    (document.body || document.documentElement).append(d);
  }
})();

// Talk4 bottom tab bar, shared by every tool page. Each tool is a real page (voice input and the
// camera only work reliably on iPhone that way), but people only ever need the one address.
(() => {
  const TABS = [
    ["talk", "talk.html", "💬", "通訳"], ["words", "words.html", "📝", "覚える"], ["group", "group.html", "👥", "3-4人"],
    ["exchange", "exchange.html", "🤝", "交流"], ["class", "class.html", "📘", "教室"], ["cook", "cook.html", "🍳", "料理"], ["plans", "plans.html", "💳", "料金"],
  ];
  // Tab names follow the phone: Japanese phones see Japanese, everyone else English (same rule as the pages).
  const ja = (navigator.languages || [navigator.language]).some(c => /^ja/i.test(c || ""));
  const EN = { talk: "Interpret", words: "Learn", group: "Group", exchange: "Exchange", class: "Class", cook: "Cooking", plans: "Plans" };
  // Days in a row: every day Talk4 is opened counts. Shown on the tab bar so people want to keep it going.
  let streak = 0;
  try {
    const day = d => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
    const today = day(new Date()), yest = day(new Date(Date.now() - 864e5));
    const s = JSON.parse(localStorage.getItem("t4-streak") || "null") || {};
    streak = s.last === today ? s.n : s.last === yest ? s.n + 1 : 1;
    localStorage.setItem("t4-streak", JSON.stringify({ last: today, n: streak, best: Math.max(streak, s.best || 0) }));
  } catch {}
  const here = (location.pathname.split("/").pop() || "talk.html");
  const css = document.createElement("style");
  css.textContent = `body{padding-bottom:calc(58px + env(safe-area-inset-bottom,0px))!important}
  .t4nav{position:fixed;left:0;right:0;bottom:0;z-index:9;display:flex;background:#1c1a18;border-top:1px solid #33302b;padding-bottom:env(safe-area-inset-bottom,0px)}
  .t4nav a{flex:1;color:#9d968a;text-decoration:none;font:11px "Noto Sans JP",system-ui,sans-serif;padding:6px 2px 7px;display:flex;flex-direction:column;align-items:center;gap:1px;-webkit-tap-highlight-color:transparent}
  .t4nav a span{font-size:21px;line-height:1.1}
  .t4nav a[aria-current="page"]{color:#d8ae55}
  .t4nav a{position:relative}.t4nav b{position:absolute;top:2px;left:50%;margin-left:6px;background:#c8553d;color:#fff;font:700 10px/1 system-ui,sans-serif;padding:2px 4px;border-radius:8px}
  @media print{.t4nav{display:none}body{padding-bottom:0!important}}`;
  document.head.append(css);
  const nav = document.createElement("nav"); nav.className = "t4nav"; nav.setAttribute("aria-label", "Talk4");
  for (const [id, file, icon, name] of TABS) {
    const a = document.createElement("a"); a.href = file; a.innerHTML = `<span>${icon}</span>${ja ? name : EN[id]}`;
    if (id === "words" && streak >= 2) {
      const b = document.createElement("b"); b.textContent = "🔥" + streak; a.append(b);
      a.title = ja ? `${streak}日連続！` : `${streak} days in a row!`;
    }
    if (file === here) a.setAttribute("aria-current", "page");
    nav.append(a);
  }
  // keep a copy of every page on the phone so Talk4 still opens with a weak connection
  if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(() => {});
  const add = () => document.body.append(nav);
  document.body ? add() : document.addEventListener("DOMContentLoaded", add);
})();

// ---------- Big view & big typing (every page) ----------
// Tap any line of text (what was said, a translation, a word…) and it opens full screen in large letters:
// easy to read, and easy to show to the other person (↻ turns it around for someone across the table).
// Tapping a text box opens a large typing screen too.
(() => {
  const ja = (navigator.languages || [navigator.language]).some(c => /^ja/i.test(c || ""));
  const T = ja ? { read: "🔊 読む", turn: "↻ 相手に向ける", copy: "📋 コピー", edit: "✎ 直す", close: "✕", ok: "✓ OK", copied: "コピーしました", ph: "ここに入力" }
               : { read: "🔊 Read", turn: "↻ Turn around", copy: "📋 Copy", edit: "✎ Fix", close: "✕", ok: "✓ OK", copied: "Copied", ph: "Type here" };
  const SEL = [
    "#meBig", "#themBig", "#meSmall", "#themSmall", "#meRom", "#themRom", "#logList .logrow",   // interpreter
    ".msg .orig", ".msg .tr .t", ".msg .tr .r",                                                // 3-4 people
    ".card .t", ".card .r", ".card .q", ".card .m", ".word .a", ".quiz .q", ".quiz .ans",       // learn / exchange
    ".answer .t", ".target", ".reading", ".meaning", ".goal", ".words td",                      // exchange / class
    ".tx > div", ".res li", ".res p",                                                           // record
  ].join(",");
  const css = document.createElement("style");
  css.textContent = `.t4z{position:fixed;inset:0;z-index:99999;background:#111010;color:#f4efe6;display:flex;flex-direction:column;padding:calc(14px + env(safe-area-inset-top,0px)) 16px calc(14px + env(safe-area-inset-bottom,0px));font-family:"Noto Sans JP","Noto Sans Georgian","Noto Sans",system-ui,sans-serif}
  .t4z .txt{flex:1;display:flex;align-items:center;justify-content:center;text-align:center;overflow:auto;font-weight:700;line-height:1.35;overflow-wrap:anywhere;transition:transform .25s}
  .t4z.turned .txt{transform:rotate(180deg)}
  .t4z .bar{display:flex;gap:8px;flex-wrap:wrap;justify-content:center}
  .t4z button{border:1px solid #33302b;background:#24211e;color:#f4efe6;border-radius:12px;padding:12px 16px;font:inherit;font-size:17px;cursor:pointer}
  .t4z button.ok{background:#d8ae55;color:#1a1307;border-color:#d8ae55;font-weight:700}
  .t4z textarea{flex:1;width:100%;background:#1c1a18;color:#f4efe6;border:1px solid #d8ae55;border-radius:14px;padding:14px;font:inherit;font-size:28px;line-height:1.4;resize:none;margin-bottom:10px}
  [data-t4z]{cursor:zoom-in}`;
  document.head.append(css);
  const fit = (el, text) => { const n = text.length; el.style.fontSize = (n < 12 ? 15 : n < 30 ? 11 : n < 60 ? 8.5 : n < 120 ? 6.5 : 5) + "vmin"; };
  const guessLang = (el, text) => {
    const l = el.closest("[lang]")?.getAttribute("lang");
    if (l && /^(ja|en|ka|ru|ko|zh)/.test(l) && l !== document.documentElement.lang) return l.slice(0, 2);
    if (/[Ⴀ-ჿ]/.test(text)) return "ka"; if (/[Ѐ-ӿ]/.test(text)) return "ru"; if (/[가-힯]/.test(text)) return "ko";
    if (/[぀-ヿ]/.test(text)) return "ja"; if (/[一-鿿]/.test(text)) return "zh"; return "en";
  };
  function view(el) {
    const text = el.innerText.trim(); if (!text || text === "…") return;
    const lang = guessLang(el, text);
    const z = document.createElement("div"); z.className = "t4z"; z.setAttribute("role", "dialog");
    z.innerHTML = `<div class="txt"></div><div class="bar"></div>`;
    const box = z.querySelector(".txt"); box.textContent = text; box.lang = lang; fit(box, text);
    const add = (label, fn, cls) => { const b = document.createElement("button"); b.textContent = label; if (cls) b.className = cls; b.onclick = e => { e.stopPropagation(); fn(); }; z.querySelector(".bar").append(b); };
    add(T.read, () => {
      if (window.T4speak) return window.T4speak(text, lang);
      try { speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(text); u.lang = { ja: "ja-JP", en: "en-US", ka: "ka-GE", ru: "ru-RU", ko: "ko-KR", zh: "zh-CN" }[lang]; speechSynthesis.speak(u); } catch {}
    });
    add(T.turn, () => z.classList.toggle("turned"));
    add(T.copy, async () => { try { await navigator.clipboard.writeText(text); } catch {} });
    if (window.T4canEdit?.(el)) add(T.edit, () => { z.remove(); window.T4edit(el); });
    add(T.close, () => z.remove(), "ok");
    box.onclick = () => z.remove();
    document.body.append(z);
  }
  document.addEventListener("click", e => {
    if (e.target.closest(".t4z")) return;
    const el = e.target.closest(SEL);
    if (!el || el.closest("button,a") || el.contains(e.target.closest("button,a,select,input,textarea,label"))) return;   // buttons keep their own action
    if (getSelection()?.toString()) return;          // selecting text to copy shouldn't pop the view
    view(el);
  });
  // mark them so they look tappable
  const mark = () => document.querySelectorAll(SEL).forEach(x => { if (!x.closest("button,a")) x.setAttribute("data-t4z", ""); });
  new MutationObserver(() => { clearTimeout(mark.t); mark.t = setTimeout(mark, 300); }).observe(document.documentElement, { childList: true, subtree: true });

  // Big typing: tapping a text box opens a large editor; OK puts the text back and sends it (like pressing Enter)
  let editing = false;
  document.addEventListener("focusin", e => {
    const inp = e.target;
    if (editing || !(inp instanceof HTMLInputElement || inp instanceof HTMLTextAreaElement) || inp.closest(".t4z")) return;
    if (inp instanceof HTMLInputElement && !["text", "search", ""].includes(inp.type)) return;
    if (inp.dataset.small !== undefined || inp.readOnly || inp.disabled) return;
    editing = true;
    const z = document.createElement("div"); z.className = "t4z";
    z.innerHTML = `<textarea></textarea><div class="bar"></div>`;
    const ta = z.querySelector("textarea"); ta.value = inp.value; ta.placeholder = inp.placeholder || T.ph; ta.setAttribute("enterkeyhint", "done");
    const done = send => {
      z.remove(); editing = false;
      inp.value = ta.value; inp.dispatchEvent(new Event("input", { bubbles: true }));
      if (send && ta.value.trim()) inp.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
      inp.blur();
    };
    const add = (label, fn, cls) => { const b = document.createElement("button"); b.textContent = label; if (cls) b.className = cls; b.onclick = fn; z.querySelector(".bar").append(b); };
    add(T.close, () => done(false));
    add(T.ok, () => done(true), "ok");
    ta.addEventListener("keydown", k => { if (k.key === "Enter" && !k.shiftKey && !k.isComposing) { k.preventDefault(); done(true); } });
    document.body.append(z); inp.blur(); setTimeout(() => ta.focus(), 30);
  });
})();
