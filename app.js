// ============================================================================
// app.js  —  ties everything together and runs the UI.
// ============================================================================

// --- Build the form automatically from MATCH_FIELDS in config.js ----------
function buildForm() {
  const form = document.getElementById("scout-form");
  form.innerHTML = "";

  MATCH_FIELDS.forEach((field) => {
    const wrapper = document.createElement("div");
    wrapper.className = "field";

    const label = document.createElement("label");
    label.textContent = field.label;
    label.htmlFor = field.key;
    wrapper.appendChild(label);

    let input;
    switch (field.type) {
      case "counter":
        input = buildCounter(field);
        break;
      case "select":
        input = document.createElement("select");
        input.id = field.key;
        field.options.forEach((opt) => {
          const o = document.createElement("option");
          o.value = opt;
          o.textContent = opt;
          input.appendChild(o);
        });
        break;
      case "checkbox":
        input = document.createElement("input");
        input.type = "checkbox";
        input.id = field.key;
        wrapper.classList.add("field-checkbox");
        break;
      case "text":
        if (field.remember) {
          // Single-line box for short remembered values like a name.
          input = document.createElement("input");
          input.type = "text";
          input.id = field.key;
          input.autocomplete = "off";
          input.value = getRemembered(field.key);
          input.addEventListener("input", () => setRemembered(field.key, input.value));
        } else {
          input = document.createElement("textarea");
          input.id = field.key;
          input.rows = 2;
        }
        break;
      default: // number
        input = document.createElement("input");
        input.type = "number";
        input.id = field.key;
        input.inputMode = "numeric";
    }
    wrapper.appendChild(input);
    form.appendChild(wrapper);
  });
}

// A +/- counter with a big number, for fast scoring during a match.
function buildCounter(field) {
  const box = document.createElement("div");
  box.className = "counter";

  const minus = document.createElement("button");
  minus.type = "button";
  minus.textContent = "\u2212"; // minus sign
  minus.className = "counter-btn";

  const value = document.createElement("input");
  value.type = "number";
  value.id = field.key;
  value.value = "0";
  value.className = "counter-value";
  value.inputMode = "numeric";

  const plus = document.createElement("button");
  plus.type = "button";
  plus.textContent = "+";
  plus.className = "counter-btn";

  minus.addEventListener("click", () => {
    value.value = Math.max(0, (parseInt(value.value || "0", 10) - 1));
  });
  plus.addEventListener("click", () => {
    value.value = parseInt(value.value || "0", 10) + 1;
  });

  box.appendChild(minus);
  box.appendChild(value);
  box.appendChild(plus);
  return box;
}

// --- Remembered values (e.g. scouter name) -------------------------------
// Stored in localStorage so they survive reloads and are pre-filled on every
// new match. Only fields with `remember: true` in config.js use this.
const REMEMBER_PREFIX = "ftc-scout-remember:";

function getRemembered(key) {
  try {
    return localStorage.getItem(REMEMBER_PREFIX + key) || "";
  } catch (e) {
    return "";
  }
}

function setRemembered(key, value) {
  try {
    localStorage.setItem(REMEMBER_PREFIX + key, value.trim());
  } catch (e) {
    /* storage unavailable (private mode) - just don't remember */
  }
}

// Read all form values into a plain object keyed by field key.
function readForm() {
  const data = {};
  MATCH_FIELDS.forEach((field) => {
    const el = document.getElementById(field.key);
    if (!el) return;
    if (field.type === "checkbox") {
      data[field.key] = el.checked ? "Yes" : "No";
    } else {
      data[field.key] = el.value;
    }
  });
  return data;
}

// Reset the form for the next match (keep match # incrementing is optional).
function resetForm() {
  buildForm();
}

// --- Status badge: show how many records are waiting to upload ------------
async function refreshBadge() {
  const n = await countUnsynced();
  const badge = document.getElementById("pending-badge");
  badge.textContent = n + " pending sync";
  badge.className = n > 0 ? "badge badge-warn" : "badge badge-ok";
}

// --- Connection indicator -------------------------------------------------
function refreshOnlineState() {
  const dot = document.getElementById("online-dot");
  if (navigator.onLine) {
    dot.textContent = "\u25CF Online";
    dot.className = "online online-yes";
  } else {
    dot.textContent = "\u25CF Offline";
    dot.className = "online online-no";
  }
}

// --- Wire up buttons ------------------------------------------------------
function wireEvents() {
  document.getElementById("save-btn").addEventListener("click", async () => {
    const data = readForm();
    await saveRecord(data);
    await refreshBadge();
    toast("Saved locally \u2713");
    resetForm();
    // If we happen to be online, try syncing right away.
    if (navigator.onLine) doSync();
  });

  document.getElementById("sync-btn").addEventListener("click", doSync);

  window.addEventListener("online", () => {
    refreshOnlineState();
    doSync(); // auto-sync the moment connectivity returns
  });
  window.addEventListener("offline", refreshOnlineState);
}

async function doSync() {
  if (!navigator.onLine) {
    toast("Still offline \u2014 will sync when connected");
    return;
  }
  if (APPS_SCRIPT_URL.includes("PASTE_YOUR")) {
    toast("Set APPS_SCRIPT_URL in config.js first");
    return;
  }
  toast("Syncing\u2026");
  const result = await syncAll(() => refreshBadge());
  await refreshBadge();
  toast(`Synced ${result.sent} / ${result.total}`);
}

// --- Tiny toast message ---------------------------------------------------
let toastTimer;
function toast(msg) {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("show"), 2500);
}

// --- Startup --------------------------------------------------------------
window.addEventListener("DOMContentLoaded", async () => {
  buildForm();
  wireEvents();
  refreshOnlineState();
  await refreshBadge();

  // Register the service worker so the app works offline.
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./service-worker.js").catch((e) =>
      console.warn("SW registration failed:", e)
    );
  }
});
