/**
 * Centralized localStorage access for CapitalPilot.
 * All keys and schema version are defined here to avoid magic strings across files.
 */

export const STORAGE_KEY = "capitalpilot:v5" as const;
export const SCHEMA_VERSION = 5 as const;
export const TRACKING_KEY = "capitalpilot:tracking:v1" as const;
export const WAITLIST_KEY = "capitalpilot:waitlist" as const;

/**
 * Persist a payload to localStorage, stamping it with the current schema version.
 * Silent no-op if called server-side or if storage is full.
 */
export function savePayload(payload: object): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ ...payload, schemaVersion: SCHEMA_VERSION }),
    );
  } catch {
    // QuotaExceededError — silently ignore, diagnostic still runs
  }
}

/**
 * Load and parse raw data from localStorage.
 * Returns null if:
 *  - called server-side
 *  - key is absent
 *  - JSON is malformed
 *  - schemaVersion is missing or does not match SCHEMA_VERSION (stale data cleared)
 */
export function loadRaw(): unknown {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    const p = parsed as Record<string, unknown>;
    if (p.schemaVersion !== SCHEMA_VERSION) {
      // Stale schema — wipe so the user gets a clean slate
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}
