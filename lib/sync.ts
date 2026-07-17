// Utilitaires de synchronisation Supabase ↔ format local.
// Étendu à chaque étape de migration (patrimoine → objectifs → diagnostic).

import type { PatrimoineEntry, PatrimoineValuations } from "@/lib/storage";

// ── Marqueur de migration ─────────────────────────────────────────────────────
// Clé définie aussi dans lib/migration.ts (privée là-bas — pas d'export).
// On accepte la duplication plutôt que de toucher à migration.ts.
const MIGRATION_MARKER_KEY = "capitalpilot:migrated:v1" as const;

/**
 * Vérifie que la migration localStorage → Supabase a bien été complétée pour
 * cet userId sur ce navigateur.
 *
 * Usage : si vrai, Supabase fait foi même si la table est vide (l'utilisateur
 * a peut-être supprimé toutes ses entrées). Si faux, fallback localStorage
 * acceptable — la migration passera derrière.
 */
export function isMigrationComplete(userId: string): boolean {
  if (typeof localStorage === "undefined") return false;
  try {
    const raw = localStorage.getItem(MIGRATION_MARKER_KEY);
    if (!raw) return false;
    const marker = JSON.parse(raw) as { userId?: string };
    return marker.userId === userId;
  } catch {
    return false;
  }
}

// ── Patrimoine ────────────────────────────────────────────────────────────────

/** Shape d'une ligne Supabase dans patrimoine_entries. */
export type PatrimoineRow = {
  user_id: string;
  month: string;            // "YYYY-MM"
  total_value: number;      // numeric Supabase
  contributions: number;    // numeric NOT NULL DEFAULT 0
  envelopes: PatrimoineValuations; // jsonb
};

/**
 * Ligne Supabase → PatrimoineEntry (format local).
 *
 * - envelopes  → valuations
 * - contributions = 0 → undefined (sémantique locale : absent = non renseigné,
 *   pour éviter d'afficher "dont +0 € versés" dans le delta mensuel)
 * - createdAt = 0 (non stocké en Supabase ; jamais affiché ni utilisé pour le tri)
 */
export function supabaseRowToPatrimoineEntry(row: PatrimoineRow): PatrimoineEntry {
  return {
    month: row.month,
    valuations: row.envelopes ?? {},
    totalValue: Number(row.total_value),
    contributions: row.contributions > 0 ? Number(row.contributions) : undefined,
    createdAt: 0,
  };
}

/**
 * PatrimoineEntry (format local) → ligne Supabase.
 *
 * - valuations → envelopes
 * - contributions undefined → 0 (colonne NOT NULL)
 */
export function patrimoineEntryToSupabaseRow(
  entry: PatrimoineEntry,
  userId: string,
): PatrimoineRow {
  return {
    user_id: userId,
    month: entry.month,
    total_value: entry.totalValue,
    contributions: entry.contributions ?? 0,
    envelopes: entry.valuations,
  };
}
