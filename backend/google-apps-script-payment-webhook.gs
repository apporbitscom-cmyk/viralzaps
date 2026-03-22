/**
 * Paste into Google Apps Script (Extensions → Apps Script from your payment spreadsheet).
 *
 * 1. Project Settings (gear) → Script properties:
 *    WEBHOOK_SECRET = same value as GOOGLE_APPS_SCRIPT_WEBHOOK_SECRET in backend .env
 *    Optional: SPREADSHEET_ID = your sheet ID (defaults below if unset)
 * 2. Deploy → New deployment → Web app → Execute as: Me → Who has access: Anyone
 * 3. After ANY code change: Deploy → Manage deployments → ✏️ → Version: New version → Deploy
 * 4. Copy Web app URL (ends with /exec) → GOOGLE_APPS_SCRIPT_WEBHOOK_URL
 */

var DEFAULT_SPREADSHEET_ID = '1DvuVVXrK_pIgflAWImM497l0Pwe_h-EJm20neNZv0PM';

var HEADER_ROW = [
  'Timestamp (UTC)',
  'Type',
  'Customer name',
  'Email',
  'Payment ID (transaction)',
  'Order / subscription ID',
  'Amount',
  'Currency',
  'Description',
  'Payment method',
  'Receipt',
  'Order notes'
];

/** Open browser on the /exec URL — should show this text if deployment is live. */
function doGet(e) {
  return ContentService.createTextOutput('Viralzaps payment webhook: OK (use POST with JSON from your backend).');
}

function getSpreadsheet_() {
  var props = PropertiesService.getScriptProperties();
  var id = (props.getProperty('SPREADSHEET_ID') || '').trim();
  if (!id) id = DEFAULT_SPREADSHEET_ID;
  try {
    return SpreadsheetApp.openById(id);
  } catch (err1) {
    var active = SpreadsheetApp.getActiveSpreadsheet();
    if (active) return active;
    throw new Error('Cannot open spreadsheet. Set Script property SPREADSHEET_ID or bind this script to the sheet (Extensions → Apps Script from the sheet).');
  }
}

function doPost(e) {
  var out = { ok: false };
  try {
    if (!e || !e.postData || !e.postData.contents) {
      out.error = 'no body';
      return json_(out);
    }
    var data = JSON.parse(e.postData.contents);
    var expected = (PropertiesService.getScriptProperties().getProperty('WEBHOOK_SECRET') || '').toString().trim();
    var got = (data.secret != null ? String(data.secret) : '').trim();
    if (!expected || !got || got !== expected) {
      out.error = 'unauthorized';
      return json_(out);
    }
    if (!data.row || !data.row.length) {
      out.error = 'missing row';
      return json_(out);
    }
    var ss = getSpreadsheet_();
    var name = data.sheetName || 'Sheet1';
    var sheet = ss.getSheetByName(name);
    if (!sheet) {
      sheet = ss.insertSheet(name);
    }
    ensureHeader_(sheet);
    sheet.appendRow(data.row);
    out.ok = true;
    return json_(out);
  } catch (err) {
    out.error = err && err.message ? err.message : String(err);
    return json_(out);
  }
}

function ensureHeader_(sheet) {
  var a1 = sheet.getRange(1, 1).getValue();
  if (a1 === '' || a1 === null) {
    sheet.getRange(1, 1, 1, HEADER_ROW.length).setValues([HEADER_ROW]);
  }
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
