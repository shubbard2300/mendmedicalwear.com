/**
 * MEND Leads — Google Apps Script web app that appends one row per website form
 * submission to the "MEND Leads" Google Sheet. Called by api/lead.js.
 *
 * Setup (once, from inside the MEND Leads sheet):
 *   1. Extensions → Apps Script. Replace Code.gs with this file. Save.
 *   2. Project Settings (gear) → Script properties → Add property:
 *        LEADS_TOKEN = the value in the macOS Keychain item "MEND leads webhook token".
 *   3. Deploy → New deployment → type "Web app":
 *        Execute as: Me    ·    Who has access: Anyone
 *      Authorize when asked, then copy the Web app URL (ends in /exec).
 *   4. That URL becomes Vercel env LEADS_WEBHOOK_URL (production).
 *
 * "Anyone" is required so Vercel can call it without a Google login. The token is
 * what keeps strangers out: a request without the matching token writes nothing.
 * After editing this script, redeploy with Deploy → Manage deployments → Edit →
 * Version: New version, so the /exec URL stays the same.
 */

function doPost(e) {
  var body;
  try {
    body = JSON.parse(e.postData.contents);
  } catch (err) {
    return json_({ ok: false, error: 'bad json' });
  }

  var expected = PropertiesService.getScriptProperties().getProperty('LEADS_TOKEN');
  if (!expected || !body || body.token !== expected) {
    return json_({ ok: false, error: 'unauthorized' });
  }

  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
    var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    var row = body.row || {};
    // Match by header name, so columns can be reordered or added in the sheet.
    sheet.appendRow(headers.map(function (h) { return clean_(row[h]); }));
  } finally {
    lock.releaseLock();
  }
  return json_({ ok: true });
}

// Keep values plain text: no line breaks or pipes (they'd break the Claude-side
// table reader), capped length, and a leading apostrophe on anything a spreadsheet
// would treat as a formula (=, +, -, @) so a form can't inject one.
function clean_(v) {
  if (v === undefined || v === null) return '';
  var s = String(v).replace(/[|\r\n\t]+/g, ' ').trim().slice(0, 1000);
  if (/^[=+\-@]/.test(s)) s = "'" + s;
  return s;
}

function json_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}
