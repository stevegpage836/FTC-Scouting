// ============================================================================
// config.js  —  the ONE place students edit to wire the app to their backend.
// ============================================================================

// PASTE YOUR DEPLOYED GOOGLE APPS SCRIPT WEB APP URL HERE.
// You get this in Step 2 of the build plan (Deploy > New deployment > Web app).
// It looks like: https://script.google.com/macros/s/AKfycb..../exec
const APPS_SCRIPT_URL = "PASTE_YOUR_APPS_SCRIPT_URL_HERE";

// A shared secret so random people can't POST junk into your sheet.
// Set the SAME string here and in the Apps Script (see backend code).
const SHARED_SECRET = "change-this-to-a-random-string";

// ----------------------------------------------------------------------------
// DATA MODEL
// ----------------------------------------------------------------------------
// This is the single source of truth for what the match-scouting form collects.
// The app builds the form automatically from this list, and these `key` values
// MUST match the column headers in your Google Sheet (the "Matches" tab).
//
// To add/remove a field: edit this array. The form and storage follow along.
//
// type can be:  "number" | "text" | "counter" | "select" | "checkbox"
// ----------------------------------------------------------------------------
const MATCH_FIELDS = [
  { key: "matchNumber",  label: "Match #",            type: "number" },
  { key: "teamNumber",   label: "Team # scouted",     type: "number" },
  { key: "alliance",     label: "Alliance",           type: "select",  options: ["Red", "Blue"] },
  { key: "autoSamples",  label: "Auto: samples scored", type: "counter" },
  { key: "autoPark",     label: "Auto: parked",       type: "checkbox" },
  { key: "teleopSamples",label: "Teleop: samples scored", type: "counter" },
  { key: "teleopSpecimens", label: "Teleop: specimens scored", type: "counter" },
  { key: "endgameLevel", label: "Endgame ascent level", type: "select", options: ["0 - None", "1", "2", "3"] },
  { key: "penalties",    label: "Penalties (count)",  type: "counter" },
  { key: "brokeDown",    label: "Robot broke down",   type: "checkbox" },
  { key: "driverSkill",  label: "Driver skill (1-5)", type: "select",  options: ["1", "2", "3", "4", "5"] },
  { key: "notes",        label: "Notes",              type: "text" }
];
