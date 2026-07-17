// Utilitaires de synchronisation Supabase ↔ format local.
// Étendu à chaque étape de migration (patrimoine → objectifs → diagnostic).

import type { SupabaseClient } from "@supabase/supabase-js";
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

// ── Objectives ────────────────────────────────────────────────────────────────
// Un seul blob par user (confirmé par lib/migration.ts : INSERT { user_id, data: goalsStore }).
// Pas de conversion de champs : `data` EST le ObjectivesStore côté page.
// Après 002_objectives_unique_user.sql, user_id est UNIQUE → upsert possible.

/** Shape d'une ligne Supabase dans objectives. */
export type ObjectivesRow = {
  id: string;
  user_id: string;
  data: Record<string, unknown>; // ObjectivesStore complet
  created_at: string;
  updated_at: string;
};

// ── Diagnostics ───────────────────────────────────────────────────────────────
// Un seul blob par user (contrainte UNIQUE user_id après migration 003).
// `data` contient le payload complet (salary, dépenses, capital…) tel que
// écrit par savePayload(), qui y stamp { schemaVersion: 5 }.

/** Shape d'une ligne Supabase dans diagnostics. */
export type DiagnosticsRow = {
  id: string;
  user_id: string;
  data: Record<string, unknown>; // payload complet avec schemaVersion: 5
  created_at: string;
};

/**
 * Résultat de la lecture Supabase du diagnostic :
 * - "ok"    → payload disponible dans Supabase
 * - "empty" → Supabase confirmé vide ET marqueur de migration présent
 *             (l'utilisateur n'a pas encore de diagnostic)
 * - "local" → Supabase vide sans marqueur OU erreur réseau
 *             (le caller doit tomber back sur localStorage)
 */
export type DiagnosticResult =
  | { status: "ok"; payload: Record<string, unknown> }
  | { status: "empty" }
  | { status: "local" };

/**
 * Lit le diagnostic d'un utilisateur connecté depuis Supabase.
 * Inclut un retry de 1 s si la session PostgREST n'est pas encore
 * committée juste après un login OAuth (RLS retourne [] sans erreur).
 */
export async function readDiagnosticFromSupabase(
  supabase: SupabaseClient,
  userId: string,
): Promise<DiagnosticResult> {
  const doQuery = () =>
    supabase
      .from("diagnostics")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1);

  let { data: rows, error } = await doQuery();

  if (!error && (!rows || rows.length === 0)) {
    await new Promise<void>(r => setTimeout(r, 1_000));
    ({ data: rows, error } = await doQuery());
  }

  if (error) {
    console.error("[sync] Erreur lecture diagnostics :", error);
    return { status: "local" };
  }

  if (rows && rows.length > 0) {
    return { status: "ok", payload: (rows[0] as DiagnosticsRow).data };
  }

  return isMigrationComplete(userId) ? { status: "empty" } : { status: "local" };
}
