// Talk4 settings.
// AI features go through a private relay (Google Apps Script) that holds the Gemini key.
// The key itself is never stored in this public website.
export const AI = {
  proxy: "https://script.google.com/macros/s/AKfycbyzD8Md1xuk8MZ7DxFgAQfOgUm9JCGfS8joqfInXLl3Iy-qPbl-S2BsZTEiqwBwykMX/exec", // the Apps Script web app URL (https://script.google.com/macros/s/.../exec)
  freeTurns: 5,     // AI replies allowed during the free trial
};
