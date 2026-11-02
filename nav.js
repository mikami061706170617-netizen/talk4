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
  const isRelay = u => typeof u === "string" && /script\.google(usercontent)?\.com\/macros\//.test(u);
  const realFetch = window.fetch.bind(window);
  window.fetch = async (u, o) => {
    if (!isRelay(u) || !o || o.method !== "POST" || typeof o.body !== "string") return realFetch(u, o);
    try { const b = JSON.parse(o.body); b.code = T4plan.code(); b.trial = !b.code && T4plan.trialLeft() > 0; o = { ...o, body: JSON.stringify(b) }; } catch {}
    const r = await realFetch(u, o);
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
