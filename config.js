// Talk4 settings.
// AI features go through a private relay (Cloudflare Worker, Apps Script as backup) that holds the Gemini key.
// The key itself is never stored in this public website.
export const AI = {
  proxy: "https://talk4-ai.ancient-pine-270e.workers.dev",   // Cloudflare relay (fast); if it fails, nav.js retries the backup below
  backup: "https://script.google.com/macros/s/AKfycbyzD8Md1xuk8MZ7DxFgAQfOgUm9JCGfS8joqfInXLl3Iy-qPbl-S2BsZTEiqwBwykMX/exec", // Apps Script relay
  freeTurns: 5,     // AI replies allowed during the free trial
};
