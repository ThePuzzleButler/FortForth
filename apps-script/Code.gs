/**
 * FORTNITE SURVIVOR — Google Sheets sync backend
 *
 * What this does:
 * Stores the entire game state as one JSON blob in cell A1 of a sheet
 * tab called "GameState". The website fetches/saves that blob, so all
 * four players' phones stay in sync through your Google Sheet.
 *
 * SETUP (one-time, ~5 minutes):
 * 1. Go to sheets.google.com, create a new blank spreadsheet
 *    (e.g. "Fortnite Survivor Data").
 * 2. In that sheet, go to Extensions → Apps Script.
 * 3. Delete any starter code in Code.gs and paste in this whole file.
 * 4. Click Deploy → New deployment.
 *    - Select type: "Web app"
 *    - Description: anything (e.g. "Survivor sync")
 *    - Execute as: "Me"
 *    - Who has access: "Anyone"
 * 5. Click Deploy, authorize the script when prompted (you'll see a
 *    "Google hasn't verified this app" warning — click Advanced →
 *    Go to [project name] → Allow. This is normal for personal scripts).
 * 6. Copy the Web app URL it gives you (ends in /exec).
 * 7. Paste that URL into assets/config.js as sheetsWebAppUrl.
 *
 * That's it — every player's browser will now read/write through
 * this script, and you can literally watch the state JSON appear
 * in cell A1 of the "GameState" tab if you want to peek.
 */

const SHEET_NAME = "GameState";

function getSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.getRange("A1").setValue("{}");
  }
  return sheet;
}

function doGet(e) {
  const sheet = getSheet_();
  const data = sheet.getRange("A1").getValue() || "{}";
  return ContentService.createTextOutput(data).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(5000); // avoid two players' writes clobbering each other
  try {
    const sheet = getSheet_();
    const body = e.postData && e.postData.contents ? e.postData.contents : "{}";
    sheet.getRange("A1").setValue(body);
  } finally {
    lock.releaseLock();
  }
  return ContentService.createTextOutput(JSON.stringify({ ok: true })).setMimeType(
    ContentService.MimeType.JSON
  );
}
