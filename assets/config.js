/* ============================================================
   FORTNITE SURVIVOR — config.js

   PASSWORDS: Change these before game night. Each player uses
   their own password to unlock their private screen.

   SHEETS SYNC: Paste the Apps Script Web App URL here to enable
   live cross-device sync (see README.md Step 2).
   ============================================================ */

window.SURVIVOR_CONFIG = {

  // Each player's private password — change to anything you want.
  passwords: {
    1: "brock",   // Player 1 → Brock
    2: "tyler",   // Player 2 → Tyler
    3: "aldo",    // Player 3 → Aldo
    4: "danny",   // Player 4 → Danny
  },

  // Leave blank for local-only mode, or paste your Apps Script URL:
  // sheetsWebAppUrl: "https://script.google.com/macros/s/AKfycbyS7PKrcw21KGSLZaF8Rn1BuHGis64HiLeCa46kAR3G1tQPK5unBv7SoVq618H-TtcL/exec",
  sheetsWebAppUrl: "",

};
