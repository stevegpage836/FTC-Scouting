// ============================================================================
// Code.gs  —  GOOGLE APPS SCRIPT BACKEND  (this runs on Google's servers)
// ============================================================================
// This is NOT part of the PWA. You paste this into the Apps Script editor
// attached to your Google Sheet (Extensions > Apps Script), then deploy it as
// a Web app. The app POSTs scouting records here and this appends rows.
//
// SETUP CHECKLIST:
//   1. Create a Google Sheet with a tab named exactly "Matches".
//   2. In row 1 of "Matches", add these column headers, IN THIS ORDER:
//        id | createdAt | matchNumber | teamNumber | alliance |
//        autoSamples | autoPark | teleopSamples | teleopSpecimens |
//        endgameLevel | penalties | brokeDown | driverSkill | notes
//      (these must match the `key` values in the app's config.js,
//       plus id + createdAt which the app adds automatically)
//   3. Extensions > Apps Script. Delete the sample code. Paste THIS file.
//   4. Set SHARED_SECRET below to the SAME string as in the app's config.js.
//   5. Deploy > New deployment > type "Web app".
//        Execute as: Me
//        Who has access: Anyone
//      Copy the resulting /exec URL into the app's config.js (APPS_SCRIPT_URL).
// ============================================================================

const SHARED_SECRET = "change-this-to-a-random-string"; // MUST match config.js
const SHEET_NAME = "Matches";

// The column order written to the sheet. Must match your header row.
const COLUMNS = [
  "id", "createdAt", "matchNumber", "teamNumber", "alliance",
  "autoSamples", "autoPark", "teleopSamples", "teleopSpecimens",
  "endgameLevel", "penalties", "brokeDown", "driverSkill", "notes"
];

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);

    // Reject requests without the shared secret.
    if (data.secret !== SHARED_SECRET) {
      return json({ ok: false, error: "bad secret" });
    }

    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);

    // De-duplicate: if this id was already written, succeed without re-adding.
    // (Lets the app safely retry uploads without creating duplicate rows.)
    if (idExists(sheet, data.id)) {
      return json({ ok: true, duplicate: true });
    }

    // Build the row in the fixed column order.
    const row = COLUMNS.map(function (col) {
      return data[col] !== undefined ? data[col] : "";
    });
    sheet.appendRow(row);

    return json({ ok: true });
  } catch (err) {
    return json({ ok: false, error: String(err) });
  }
}

// Optional: lets you open the URL in a browser to confirm it's deployed.
function doGet() {
  return json({ ok: true, message: "FTC Scout backend is running." });
}

// Check whether an id is already present in column A (the id column).
function idExists(sheet, id) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return false; // only the header row exists
  const ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
  for (var i = 0; i < ids.length; i++) {
    if (ids[i][0] === id) return true;
  }
  return false;
}

// Helper: return a JSON response.
function json(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
