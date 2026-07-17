-- ============================================================
-- CapitalPilot — Migration 002
-- Dédoublonne la table objectives et ajoute une contrainte
-- UNIQUE sur user_id.
--
-- Contexte : la migration initiale (001) et le code de la page
-- objectifs pouvaient créer plusieurs lignes par utilisateur
-- (race condition entre MigrationRunner et une écriture manuelle).
-- Cette migration nettoie l'état existant et garantit qu'il n'y a
-- désormais qu'une seule ligne par utilisateur.
--
-- À coller dans le SQL Editor de Supabase, onglet "New query".
-- ============================================================


-- ── Étape 1 : Dédoublonnage ─────────────────────────────────
-- Pour chaque user_id, conserve uniquement la ligne la plus
-- récente (updated_at DESC) et supprime les doublons.

DELETE FROM public.objectives
WHERE id NOT IN (
  SELECT DISTINCT ON (user_id) id
  FROM public.objectives
  ORDER BY user_id, updated_at DESC
);


-- ── Étape 2 : Contrainte UNIQUE sur user_id ─────────────────
-- Garantit l'unicité au niveau base, ce qui permet les upserts
-- avec ON CONFLICT (user_id) depuis le client.

ALTER TABLE public.objectives
  ADD CONSTRAINT objectives_user_id_unique UNIQUE (user_id);


-- ── Vérification (facultatif) ────────────────────────────────
-- SELECT user_id, count(*) FROM public.objectives GROUP BY user_id HAVING count(*) > 1;
-- Doit retourner 0 ligne.
