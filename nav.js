// Talk4 bottom tab bar, shared by every tool page. Each tool is a real page (voice input and the
// camera only work reliably on iPhone that way), but people only ever need the one address.
(() => {
  const TABS = [
    ["talk", "talk.html", "💬", "通訳"], ["words", "words.html", "📝", "覚える"], ["group", "group.html", "👥", "3-4人"],
    ["exchange", "exchange.html", "🤝", "交流"], ["class", "class.html", "📘", "教室"], ["plans", "plans.html", "💳", "料金"],
  ];
  const here = (location.pathname.split("/").pop() || "talk.html");
  const css = document.createElement("style");
  css.textContent = `body{padding-bottom:calc(58px + env(safe-area-inset-bottom,0px))!important}
  .t4nav{position:fixed;left:0;right:0;bottom:0;z-index:9;display:flex;background:#1c1a18;border-top:1px solid #33302b;padding-bottom:env(safe-area-inset-bottom,0px)}
  .t4nav a{flex:1;color:#9d968a;text-decoration:none;font:11px "Noto Sans JP",system-ui,sans-serif;padding:6px 2px 7px;display:flex;flex-direction:column;align-items:center;gap:1px;-webkit-tap-highlight-color:transparent}
  .t4nav a span{font-size:21px;line-height:1.1}
  .t4nav a[aria-current="page"]{color:#d8ae55}
  @media print{.t4nav{display:none}body{padding-bottom:0!important}}`;
  document.head.append(css);
  const nav = document.createElement("nav"); nav.className = "t4nav"; nav.setAttribute("aria-label", "Talk4");
  for (const [id, file, icon, name] of TABS) {
    const a = document.createElement("a"); a.href = file; a.innerHTML = `<span>${icon}</span>${name}`;
    if (file === here) a.setAttribute("aria-current", "page");
    nav.append(a);
  }
  // keep a copy of every page on the phone so Talk4 still opens with a weak connection
  if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(() => {});
  const add = () => document.body.append(nav);
  document.body ? add() : document.addEventListener("DOMContentLoaded", add);
})();
