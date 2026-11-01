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
