// ============================================================================
// db.js  —  LOCAL storage. Every record is saved here FIRST, offline.
// ============================================================================
// We use IndexedDB (the browser's built-in offline database) via the tiny
// `idb` helper library, which makes it readable. The raw IndexedDB API is
// painful; idb wraps it in promises.
//
// KEY IDEA: each record has a `synced` flag.
//   synced = false  -> still only on this device, waiting to upload
//   synced = true   -> successfully sent to the Google Sheet
// ============================================================================

const DB_NAME = "ftc-scout-db";
const DB_VERSION = 1;
const STORE = "matches";

// Open (and on first run, create) the database.
async function openDb() {
  // idb is loaded globally from the CDN script in index.html as `idb`
  return idb.openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE)) {
        // keyPath "id" = each record has a unique id we generate ourselves.
        const store = db.createObjectStore(STORE, { keyPath: "id" });
        store.createIndex("by-synced", "synced");
      }
    }
  });
}

// Generate a unique id so re-syncing can never create duplicate sheet rows.
function makeId() {
  return (
    Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8)
  );
}

// Save a brand-new scouting record locally. Returns the stored record.
async function saveRecord(data) {
  const db = await openDb();
  const record = {
    id: makeId(),
    createdAt: new Date().toISOString(),
    synced: false,        // brand new -> not yet uploaded
    payload: data         // the actual form fields
  };
  await db.put(STORE, record);
  return record;
}

// Get every record (newest first).
async function getAllRecords() {
  const db = await openDb();
  const all = await db.getAll(STORE);
  return all.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

// Get only the records still waiting to upload.
async function getUnsynced() {
  const all = await getAllRecords();
  return all.filter((r) => r.synced === false);
}

// Mark a record as successfully uploaded.
async function markSynced(id) {
  const db = await openDb();
  const record = await db.get(STORE, id);
  if (record) {
    record.synced = true;
    record.syncedAt = new Date().toISOString();
    await db.put(STORE, record);
  }
}

// Count how many records still need uploading (for the badge).
async function countUnsynced() {
  return (await getUnsynced()).length;
}
