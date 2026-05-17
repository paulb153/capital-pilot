/**
 * Centralized localStorage access for CapitalPilot.
 * All keys and schema version are defined here to avoid magic strings across files.
 */

export const STORAGE_KEY = "capitalpilot:v5" as const;
export const SCHEMA_VERSION = 5 as const;
export const TRACKING_KEY = "capitalpilot:tracking:v1" as const;
export const WAITLIST_KEY = "capitalpilot:waitlist" as const;
export const GOAL_V1_KEY = "capitalpilot:goal:v1" as const;
export const GOALS_V2_KEY = "capitalpilot:goals:v2" as const;

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

// ── Migration goal:v1 → goals:v2 ─────────────────────────────────────────

type GoalV1 = {
  label: string;
  targetAmount: number;
  targetYear: number;
  supportLabel?: string;
  ratePct?: number;
  createdAt?: number;
};

type LifeObjectiveMigrated = {
  id: string;
  label: string;
  emoji: string;
  targetAmount: number;
  targetYear: number;
  supportLabel: string;
  ratePct: number;
  allocatedMonthly: number;
  createdAt: number;
  completed: boolean;
};

type GoalsStore = {
  immediateProgress: Record<string, number>;
  lifeObjectives: LifeObjectiveMigrated[];
  celebratedIds: string[];
};

function parseGoalsStore(raw: string): GoalsStore {
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return {
        immediateProgress:
          parsed.immediateProgress &&
          typeof parsed.immediateProgress === "object" &&
          !Array.isArray(parsed.immediateProgress)
            ? parsed.immediateProgress
            : {},
        lifeObjectives: Array.isArray(parsed.lifeObjectives) ? parsed.lifeObjectives : [],
        celebratedIds: Array.isArray(parsed.celebratedIds) ? parsed.celebratedIds : [],
      };
    }
  } catch { /* ignore */ }
  return { immediateProgress: {}, lifeObjectives: [], celebratedIds: [] };
}

/**
 * Migre l'objectif stocké dans `capitalpilot:goal:v1` vers le premier
 * élément de `capitalpilot:goals:v2`.
 *
 * - Idempotente : si un objectif avec le même label+année existe déjà
 *   dans goals:v2, aucune insertion n'est effectuée.
 * - Nettoyage : goal:v1 est supprimé après migration réussie (ou si corrompu).
 * - No-op si goal:v1 est absent ou si localStorage n'est pas disponible.
 */
export function migrateGoalV1ToV2(): void {
  if (typeof localStorage === "undefined") return;

  const rawV1 = localStorage.getItem(GOAL_V1_KEY);
  if (!rawV1) return;

  try {
    const v1 = JSON.parse(rawV1) as GoalV1;

    // Champs obligatoires manquants ou corrompus → supprimer silencieusement
    if (!v1 || typeof v1 !== "object" || !v1.label || !v1.targetAmount || !v1.targetYear) {
      localStorage.removeItem(GOAL_V1_KEY);
      return;
    }

    const rawV2 = localStorage.getItem(GOALS_V2_KEY);
    const store: GoalsStore = rawV2
      ? parseGoalsStore(rawV2)
      : { immediateProgress: {}, lifeObjectives: [], celebratedIds: [] };

    // Déduplique sur label + année
    const alreadyMigrated = store.lifeObjectives.some(
      (o) => o.label === v1.label && o.targetYear === v1.targetYear,
    );
    if (alreadyMigrated) {
      localStorage.removeItem(GOAL_V1_KEY);
      return;
    }

    const migrated: LifeObjectiveMigrated = {
      id: `migrated-${v1.createdAt ?? Date.now()}`,
      label: v1.label,
      emoji: "🎯",
      targetAmount: v1.targetAmount,
      targetYear: v1.targetYear,
      supportLabel: v1.supportLabel ?? "PEA / ETF",
      ratePct: v1.ratePct ?? 7,
      allocatedMonthly: 0,
      createdAt: v1.createdAt ?? Date.now(),
      completed: false,
    };

    store.lifeObjectives = [migrated, ...store.lifeObjectives];
    localStorage.setItem(GOALS_V2_KEY, JSON.stringify(store));
    localStorage.removeItem(GOAL_V1_KEY);
  } catch { /* ignore — JSON corrompu ou localStorage indisponible */ }
}

// ── Patrimoine v1 ─────────────────────────────────────────────────────────────

export const PATRIMOINE_V1_KEY = "capitalpilot:patrimoine:v1" as const;

export type PatrimoineValuations = {
  pea?: number;
  cto?: number;
  avFondsEuro?: number;
  avUC?: number;
  immobilier?: number;
  crowdfunding?: number;
  crypto?: number;
  per?: number;
  autres?: number;
  checkingAmount?: number;
  livretAAmount?: number;
  extras?: Record<string, number>;
};

export type PatrimoineEntry = {
  month: string;           // "YYYY-MM"
  valuations: PatrimoineValuations;
  totalValue: number;
  contributions?: number;  // versements totaux ce mois — optional for retrocompat
  createdAt: number;
};

export type PatrimoineStore = { entries: PatrimoineEntry[] };

/**
 * Load patrimoine entries from localStorage.
 * Returns { entries: [] } on error, absent key, or invalid data.
 */
export function loadPatrimoine(): PatrimoineStore {
  if (typeof localStorage === "undefined") return { entries: [] };
  try {
    const raw = localStorage.getItem(PATRIMOINE_V1_KEY);
    if (!raw) return { entries: [] };
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return { entries: [] };
    const p = parsed as Record<string, unknown>;
    if (!Array.isArray(p.entries)) return { entries: [] };
    return { entries: p.entries as PatrimoineEntry[] };
  } catch {
    return { entries: [] };
  }
}

/**
 * Upsert a patrimoine entry by month, then persist sorted ASC by month.
 */
export function savePatrimoineEntry(entry: PatrimoineEntry): void {
  if (typeof localStorage === "undefined") return;
  try {
    const store = loadPatrimoine();
    const idx = store.entries.findIndex((e) => e.month === entry.month);
    if (idx >= 0) {
      store.entries[idx] = entry;
    } else {
      store.entries.push(entry);
    }
    store.entries.sort((a, b) => a.month.localeCompare(b.month));
    localStorage.setItem(PATRIMOINE_V1_KEY, JSON.stringify(store));
  } catch {
    // QuotaExceededError — silently ignore
  }
}

/**
 * Returns the delta (last - second-to-last) in euros, or null if fewer than 2 entries.
 */
export function patrimoineDelta(entries: PatrimoineEntry[]): number | null {
  if (entries.length < 2) return null;
  return entries[entries.length - 1].totalValue - entries[entries.length - 2].totalValue;
}

/**
 * Returns the total performance percentage from firstValue to currentValue.
 * Returns null if firstValue is 0.
 */
export function patrimoinePerf(firstValue: number, currentValue: number): number | null {
  if (firstValue === 0) return null;
  return ((currentValue - firstValue) / firstValue) * 100;
}
