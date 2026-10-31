// Talk4 settings.
// AI features go through a private relay (Google Apps Script) that holds the Gemini key.
// The key itself is never stored in this public website.
export const AI = {
  proxy: "",        // the Apps Script web app URL (https://script.google.com/macros/s/.../exec)
  freeTurns: 5,     // AI replies allowed during the free trial
};
