# FTC Scouting App — Student Build Plan

An offline-first **Progressive Web App (PWA)** that collects scouting data at a
FIRST Tech Challenge competition, stores it on the device with no internet, and
syncs to a **Google Sheet** when a connection is available.

**Stack:** plain HTML / CSS / JavaScript · IndexedDB (offline storage) · Google
Apps Script (backend) · GitHub Pages (free HTTPS hosting). No frameworks, no
servers to manage, no cloud billing.

---

## How the whole thing works (the big picture)

1. A scouter fills in a match form on their phone/tablet — works with **zero**
   internet.
2. Tapping **Save** writes the record into the browser's **IndexedDB** with a
   flag `synced: false`. The data is now safe on the device.
3. When the device is online, **Sync** loops through every `synced: false`
   record and POSTs it to a **Google Apps Script** URL.
4. The Apps Script appends a row to the **Google Sheet** and replies "ok".
5. The app flips that record to `synced: true`. Done.

Every record gets a **unique id**, and the backend ignores ids it has already
seen — so retries and double-taps can never create duplicate rows.

```
[ Phone/Tablet PWA ]                         [ Google Cloud ]
  form  --> IndexedDB (synced:false) --POST--> Apps Script --> Google Sheet
                ^                                                  |
                +------------- mark synced:true <-- "ok" ----------+
```

---

## Roles (split the work across the team)

| Group | Owns |
|-------|------|
| **Data team** | The data model: every field, type, and the Sheet headers (Step 1) |
| **Backend team** | The Google Sheet + Apps Script + deployment (Step 2) |
| **Frontend team** | The form UI and counters (`config.js`, `app.js`, `styles.css`) |
| **Infra team** | GitHub Pages hosting + PWA/offline (Steps 3, 5) |

Everyone should understand the "big picture" diagram above before splitting up.

---

## The most important rule of the project

> **Build a thin end-to-end slice FIRST.**
> Get *one* field to travel all the way from form → offline storage → synced
> row in the Sheet before building the real form. Once that round trip works,
> everything else is just adding detail on top of a proven pipeline.

The skeleton you've been given already implements this full pipeline. Your job
is to run it, understand it, then expand it.

---

## Step 1 — Lock down the data model (do this on paper first)

Before touching code, the data team decides **exactly** what gets collected.
Write it as a table: field name, type, example. This becomes both the form and
the Sheet's column headers.

The skeleton ships with a starter model in `config.js`. Field types supported:

- `number` — a numeric text box
- `counter` — a big **+ / −** stepper (best for scoring during a fast match)
- `select` — a dropdown of fixed choices
- `checkbox` — yes/no
- `text` — free notes

**Starter match-scouting fields (already in `config.js`):**

| key | label | type |
|-----|-------|------|
| scouterName | Your name (scouter) | text (remembered) |
| matchNumber | Match # | number |
| teamNumber | Team # scouted | number |
| alliance | Alliance | select (Red/Blue) |
| autoSamples | Auto: samples scored | counter |
| autoPark | Auto: parked | checkbox |
| teleopSamples | Teleop: samples scored | counter |
| teleopSpecimens | Teleop: specimens scored | counter |
| endgameLevel | Endgame ascent level | select |
| penalties | Penalties (count) | counter |
| brokeDown | Robot broke down | checkbox |
| driverSkill | Driver skill (1–5) | select |
| notes | Notes | text |

> **Action:** review these against *this season's* actual scoring rules and edit
> the `MATCH_FIELDS` array in `config.js`. The form rebuilds itself from this
> list automatically — add or remove a field and the UI follows.

**Two things to decide now so they don't bite you later:**
- *Who* is scouting — the `scouterName` field is included and remembered on the
  device (`remember: true`), so each scouter types it once per event.
- *Which match/team* each record is for — already covered by `matchNumber` and
  `teamNumber`.

---

## Step 2 — Build the Google Sheet + Apps Script backend

This is the "server", but you never manage a server — Google runs it.

1. Create a new **Google Sheet**. Rename a tab to exactly `Matches`.
2. In **row 1**, add these headers **in this exact order**:

   ```
   id  createdAt  scouterName  matchNumber  teamNumber  alliance  autoSamples  autoPark
   teleopSamples  teleopSpecimens  endgameLevel  penalties  brokeDown
   driverSkill  notes
   ```

   These match the `key` values in `config.js`, plus `id` and `createdAt`
   which the app adds automatically. **If you change `config.js`, change these
   headers and the `COLUMNS` list in `Code.gs` to match.**
3. **Extensions → Apps Script**. Delete the sample code. Paste the contents of
   **`Code.gs`** (provided).
4. In `Code.gs`, set `SHARED_SECRET` to a random string of your choosing.
5. **Deploy → New deployment → Web app**:
   - *Execute as:* **Me**
   - *Who has access:* **Anyone**
   - Click Deploy, authorize when prompted, and **copy the `/exec` URL**.
6. **Test it before touching the app:** paste the `/exec` URL into a browser.
   You should see `{"ok":true,"message":"FTC Scout backend is running."}`.

> **Milestone:** the backend exists and responds. Half the system is done.

---

## Step 3 — Host the app on GitHub Pages (free HTTPS)

A PWA *must* be served over HTTPS for offline features to work. GitHub Pages
gives you that for free and teaches Git along the way.

1. Create a GitHub repo, e.g. `ftc-scouting-app`.
2. Put the contents of the **`app/`** folder at the repo root (or in a `/docs`
   folder).
3. Repo **Settings → Pages →** Source: deploy from branch `main`, folder root
   (or `/docs`).
4. Wait ~1 minute; GitHub gives you a URL like
   `https://yourteam.github.io/ftc-scouting-app/`.

> **Milestone:** the app loads in a browser at a public HTTPS URL.

---

## Step 4 — Wire the app to your backend

Open **`config.js`** and set two values:

```js
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfyc.../exec";
const SHARED_SECRET   = "the-same-random-string-as-in-Code.gs";
```

The `SHARED_SECRET` **must** be identical in `config.js` and `Code.gs`, or the
backend will reject the data.

> **Milestone (the big one):** open the app, fill the form, tap **Save**, then
> **Sync now**. A new row should appear in your Google Sheet. The full
> offline-to-online round trip now works end to end.

---

## Step 5 — Confirm it actually works offline

This is the requirement that matters most at a venue with bad WiFi.

1. Load the app once while online (so the service worker caches it).
2. Turn on **airplane mode**.
3. Reload the app — it should still open (served from cache).
4. Fill in and **Save** several matches. The "pending sync" badge climbs.
5. Turn WiFi back on. The app auto-syncs (it listens for the `online` event),
   or tap **Sync now**. The badge drops to 0 and rows land in the Sheet.

> If reload fails offline, check that the service worker registered (browser
> DevTools → Application → Service Workers) and that `CACHE_VERSION` lists every
> file.

---

## Step 6 — Expand the real app

With the pipeline proven, build out features in roughly this order:

1. **Full match form** — finalize every field in `MATCH_FIELDS` against the
   season's scoring.
2. **Pit scouting** — add a second form + a `Pit` tab in the Sheet and a second
   `COLUMNS` list / handler in `Code.gs`. (Tip: add a `type` field to records
   and route to the right tab in `doPost`.)
3. **Scouter identity** — done: `scouterName` is remembered between matches.
4. **Match schedule import** — FTC publishes event match schedules via the
   official FIRST API; pre-loading the schedule lets scouters pick a match
   instead of typing it. This is a phase-two enhancement, not a first step.
5. **Analysis** — build summary tables/charts *inside the Google Sheet*
   (averages per team, etc.). The Sheet is already your database; pivot tables
   are the fastest path to useful rankings.

---

## What each file does (so students can navigate the code)

| File | Responsibility |
|------|----------------|
| `index.html` | Page structure; loads scripts in order config → db → sync → app |
| `config.js` | **The one file you edit most.** Backend URL, secret, and the field list that *generates the form* |
| `db.js` | Local IndexedDB storage; the `synced` flag; unique-id generation |
| `sync.js` | Uploads unsynced records to Apps Script; flips them to synced |
| `app.js` | Builds the form from the schema, wires Save/Sync, badges, toasts |
| `styles.css` | Mobile-first styling; big counters and buttons |
| `service-worker.js` | Caches the app for offline use; **bump `CACHE_VERSION` on every change** |
| `manifest.json` | Makes the app installable to the home screen |
| `Code.gs` | **Backend** — paste into Apps Script, deploy as a Web app |

---

## Common gotchas

- **Changed the form but the Sheet didn't update?** The `key` in `config.js`,
  the Sheet header, and the `COLUMNS` list in `Code.gs` must all match.
- **Edited app files but phones still show the old version?** Increase
  `CACHE_VERSION` in `service-worker.js` (v1 → v2). Old caches are then purged.
- **Sync says "bad secret".** `SHARED_SECRET` differs between `config.js` and
  `Code.gs`.
- **Offline reload fails.** A file is missing from the `APP_SHELL` list in
  `service-worker.js`, or you opened it over `http://`/`file://` instead of
  HTTPS.
- **Duplicate rows.** Shouldn't happen — the backend de-dupes on `id`. If it
  does, confirm the `id` column is column **A** in the Sheet.

---

## Suggested timeline

| Session | Goal |
|---------|------|
| 1 | Big picture + finalize the data model on paper (Step 1) |
| 2 | Build Sheet + Apps Script, test the `/exec` URL (Step 2) |
| 3 | Host skeleton on GitHub Pages, wire `config.js`, get first synced row (Steps 3–4) |
| 4 | Verify offline behavior thoroughly (Step 5) |
| 5+ | Expand: full form, pit scouting, scouter names, analysis (Step 6) |

You already have a working skeleton that does the entire round trip. Run it,
read it, then make it yours.
