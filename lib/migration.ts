// Migration localStorage → Supabase au premier login.
// Chaque source (diagnostic, patrimoine, objectifs) est migrée
// indépendamment avec sa propre vérification de conflit :
// si la table Supabase est non-vide pour ce user, cette source
// est considérée comme déjà traitée et ignorée.
// Le marqueur local n'est posé qu'une fois les trois sources traitées
// avec succès — un échec partiel est donc auto-réparant à la prochaine
// visite.

import type { SupabaseClient } from "@supabase/supabase-js";
import { loadRaw, loadPatrimoine, GOALS_V2_KEY } from "@/lib/storage";

// ── Marqueur local ────────────────────────────────────────────────────────────

const MIGRATION_MARKER_KEY = "capitalpilot:migrated:v1" as const;

type MigrationMarker = { userId: string; migratedAt: number };

function getMigrationMarker(): MigrationMarker | null {
  try {
    const raw = localStorage.getItem(MIGRATION_MARKER_KEY);
    return raw ? (JSON.parse(raw) as MigrationMarker) : null;
  } catch {
    return null;
  }
}

function setMigrationMarker(userId: string): void {
  try {
    localStorage.setItem(
      MIGRATION_MARKER_KEY,
      JSON.stringify({ userId, migratedAt: Date.now() }),
    );
  } catch { /* QuotaExceededError — ignoré */ }
}

// ── Sources ───────────────────────────────────────────────────────────────────

async function migrateDiagnostic(
  supabase: SupabaseClient,
  userId: string,
): Promise<void> {
  // Vérification de conflit : la table a-t-elle déjà des données pour ce user ?
  const { count, error: countError } = await supabase
    .from("diagnostics")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);

  if (countError) throw countError;
  if ((count ?? 0) > 0) return; // données existantes — on laisse Supabase gagner

  const localData = loadRaw();
  if (!localData) return; // rien à migrer

  const { error } = await supabase
    .from("diagnostics")
    .insert({ user_id: userId, data: localData });

  if (error) throw error;
}

async function migratePatrimoine(
  supabase: SupabaseClient,
  userId: string,
): Promise<void> {
  const { count, error: countError } = await supabase
    .from("patrimoine_entries")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);

  if (countError) throw countError;
  if ((count ?? 0) > 0) return;

  const { entries } = loadPatrimoine();
  if (entries.length === 0) return;

  const rows = entries.map((e) => ({
    user_id: userId,
    month: e.month,
    total_value: e.totalValue,
    contributions: e.contributions ?? 0,
    envelopes: e.valuations,
  }));

  // upsert par sécurité : la contrainte unique (user_id, month) empêche
  // les doublons si une entrée a été partiellement insérée lors d'une
  // tentative précédente.
  const { error } = await supabase
    .from("patrimoine_entries")
    .upsert(rows, { onConflict: "user_id,month" });

  if (error) throw error;
}

async function migrateObjectives(
  supabase: SupabaseClient,
  userId: string,
): Promise<void> {
  const { count, error: countError } = await supabase
    .from("objectives")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);

  if (countError) throw countError;
  if ((count ?? 0) > 0) return;

  // Lecture du store goals:v2 — les erreurs JSON sont silencieuses
  let goalsStore: unknown;
  try {
    const raw = localStorage.getItem(GOALS_V2_KEY);
    if (!raw) return;
    goalsStore = JSON.parse(raw);
  } catch {
    return; // JSON corrompu — rien à migrer
  }

  if (!goalsStore || typeof goalsStore !== "object" || Array.isArray(goalsStore)) return;

  const store = goalsStore as {
    lifeObjectives?: unknown[];
    immediateProgress?: Record<string, unknown>;
  };

  const hasContent =
    (Array.isArray(store.lifeObjectives) && store.lifeObjectives.length > 0) ||
    (store.immediateProgress != null &&
      Object.keys(store.immediateProgress).length > 0);

  if (!hasContent) return;

  const { error } = await supabase
    .from("objectives")
    .insert({ user_id: userId, data: goalsStore });

  if (error) throw error;
}

// ── Point d'entrée public ─────────────────────────────────────────────────────

/**
 * Migre les données localStorage vers Supabase au premier login.
 *
 * - Idempotente via le marqueur local (userId-aware).
 * - Chaque source est vérifiée indépendamment : un échec partiel laisse les
 *   sources non-traitées sans marqueur → auto-réparant à la prochaine visite.
 * - Lance une exception si une source échoue (le marqueur n'est alors PAS posé).
 */
export async function migrateLocalDataToSupabase(
  supabase: SupabaseClient,
  userId: string,
): Promise<void> {
  // Court-circuit si déjà migré pour ce user
  const marker = getMigrationMarker();
  if (marker?.userId === userId) return;

  // Migration de chaque source (throws on error → pas de marqueur)
  await migrateDiagnostic(supabase, userId);
  await migratePatrimoine(supabase, userId);
  await migrateObjectives(supabase, userId);

  // Toutes les sources traitées → on pose le marqueur
  setMigrationMarker(userId);
}
