// ============================================================================
// sync.js  —  pushes unsynced local records to the Google Sheet, when online.
// ============================================================================
// Strategy:
//   - Loop over every record where synced === false.
//   - POST each one to the Apps Script web app URL.
//   - If the server confirms success, flip synced -> true locally.
//   - If we're offline or the POST fails, leave it alone; try again later.
//
// The unique `id` is sent with each record. The Apps Script checks it and
// skips ids it has already seen, so a double-tap or retry never duplicates.
// ============================================================================

// Try to upload everything still pending. Returns {sent, failed, total}.
async function syncAll(onProgress) {
  const pending = await getUnsynced();
  let sent = 0;
  let failed = 0;

  for (const record of pending) {
    try {
      const ok = await uploadOne(record);
      if (ok) {
        await markSynced(record.id);
        sent++;
      } else {
        failed++;
      }
    } catch (err) {
      // Network error / offline: stop early, we'll retry next time.
      failed++;
      break;
    }
    if (onProgress) onProgress({ sent, failed, total: pending.length });
  }

  return { sent, failed, total: pending.length };
}

// Upload a single record. Returns true on confirmed success.
async function uploadOne(record) {
  const body = {
    secret: SHARED_SECRET,
    id: record.id,
    createdAt: record.createdAt,
    ...record.payload
  };

  const response = await fetch(APPS_SCRIPT_URL, {
    method: "POST",
    // Apps Script web apps accept text/plain without a CORS preflight,
    // which keeps things simple. We send JSON as a string.
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify(body)
  });

  if (!response.ok) return false;
  const result = await response.json();
  // Server returns { ok: true } on success (new row OR already-seen duplicate)
  return result && result.ok === true;
}
