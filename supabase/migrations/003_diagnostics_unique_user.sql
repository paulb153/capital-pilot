-- ============================================================
-- CapitalPilot — Migration 003
-- Dédoublonne la table diagnostics et ajoute une contrainte
-- UNIQUE sur user_id.
--
-- Contexte : la table diagnostics (créée en 001) n'avait pas
-- de contrainte UNIQUE sur user_id, ce qui permettait de créer
-- plusieurs lignes par utilisateur. Cette migration nettoie
-- l'état existant et permet les upserts avec
-- ON CONFLICT (user_id) depuis le client.
--
-- À coller dans le SQL Editor de Supabase, onglet "New query".
-- ============================================================


-- ── Étape 1 : Dédoublonnage ─────────────────────────────────
-- Pour chaque user_id, conserve uniquement la ligne la plus
-- récente (created_at DESC) et supprime les doublons.

DELETE FROM public.diagnostics
WHERE id NOT IN (
  SELECT DISTINCT ON (user_id) id
  FROM public.diagnostics
  ORDER BY user_id, created_at DESC
);


-- ── Étape 2 : Contrainte UNIQUE sur user_id ─────────────────
-- Garantit l'unicité au niveau base, ce qui permet les upserts
-- avec ON CONFLICT (user_id) depuis le client.

ALTER TABLE public.diagnostics
  ADD CONSTRAINT diagnostics_user_id_unique UNIQUE (user_id);


-- ── Vérification (facultatif) ────────────────────────────────
-- SELECT user_id, count(*) FROM public.diagnostics GROUP BY user_id HAVING count(*) > 1;
-- Doit retourner 0 ligne.
