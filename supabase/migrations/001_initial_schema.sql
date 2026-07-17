-- ============================================================
-- CapitalPilot — Schéma initial
-- Migration : 001_initial_schema.sql
--
-- À coller dans le SQL Editor de Supabase (onglet SQL Editor >
-- New query). Les tables sont créées dans le schéma public avec
-- Row Level Security activé : chaque utilisateur ne voit et ne
-- modifie que ses propres données.
-- ============================================================


-- ────────────────────────────────────────────────────────────
-- 1. diagnostics
--
-- Stocke le snapshot du diagnostic financier d'un utilisateur.
-- Le champ `data` est un objet JSON libre qui reflète la
-- structure de payload sauvegardée côté client (salaire,
-- dépenses, capital, etc.).
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.diagnostics (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  data        jsonb       NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Index pour accélérer les requêtes par utilisateur
CREATE INDEX IF NOT EXISTS diagnostics_user_id_idx ON public.diagnostics (user_id);

-- Sécurité au niveau des lignes
ALTER TABLE public.diagnostics ENABLE ROW LEVEL SECURITY;

-- Lecture : uniquement ses propres diagnostics
CREATE POLICY "diagnostics: select own"
  ON public.diagnostics FOR SELECT
  USING (user_id = auth.uid());

-- Insertion : uniquement pour soi-même
CREATE POLICY "diagnostics: insert own"
  ON public.diagnostics FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Mise à jour : uniquement ses propres diagnostics
CREATE POLICY "diagnostics: update own"
  ON public.diagnostics FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Suppression : uniquement ses propres diagnostics
CREATE POLICY "diagnostics: delete own"
  ON public.diagnostics FOR DELETE
  USING (user_id = auth.uid());


-- ────────────────────────────────────────────────────────────
-- 2. patrimoine_entries
--
-- Stocke un point de valorisation mensuel par utilisateur.
-- Contrainte unique sur (user_id, month) : on ne peut avoir
-- qu'une entrée par mois et par utilisateur (upsert possible
-- via ON CONFLICT).
-- `envelopes` contient le détail par enveloppe (PEA, CTO,
-- Livret A, etc.) sous forme JSON.
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.patrimoine_entries (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  month         text        NOT NULL,  -- format 'YYYY-MM', ex : '2026-07'
  total_value   numeric     NOT NULL,
  contributions numeric     NOT NULL DEFAULT 0,
  envelopes     jsonb       NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT patrimoine_entries_user_month_unique UNIQUE (user_id, month)
);

-- Index pour accélérer les requêtes par utilisateur (la contrainte unique
-- crée déjà un index sur (user_id, month), l'index simple sur user_id
-- couvre les requêtes de listing sans filtre sur month)
CREATE INDEX IF NOT EXISTS patrimoine_entries_user_id_idx ON public.patrimoine_entries (user_id);

-- Sécurité au niveau des lignes
ALTER TABLE public.patrimoine_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "patrimoine_entries: select own"
  ON public.patrimoine_entries FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "patrimoine_entries: insert own"
  ON public.patrimoine_entries FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "patrimoine_entries: update own"
  ON public.patrimoine_entries FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "patrimoine_entries: delete own"
  ON public.patrimoine_entries FOR DELETE
  USING (user_id = auth.uid());


-- ────────────────────────────────────────────────────────────
-- 3. objectives
--
-- Stocke les objectifs de vie d'un utilisateur (retraite,
-- achat immobilier, etc.). Le champ `data` contient le tableau
-- d'objectifs tel que géré côté client (goals:v2).
-- `updated_at` est mis à jour manuellement à chaque upsert
-- (ou via un trigger si besoin — voir ci-dessous).
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.objectives (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  data        jsonb       NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS objectives_user_id_idx ON public.objectives (user_id);

ALTER TABLE public.objectives ENABLE ROW LEVEL SECURITY;

CREATE POLICY "objectives: select own"
  ON public.objectives FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "objectives: insert own"
  ON public.objectives FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "objectives: update own"
  ON public.objectives FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "objectives: delete own"
  ON public.objectives FOR DELETE
  USING (user_id = auth.uid());


-- ────────────────────────────────────────────────────────────
-- Trigger : mise à jour automatique de updated_at
--
-- À chaque UPDATE sur `objectives`, updated_at est mis à jour
-- automatiquement sans avoir à le passer depuis le client.
-- ────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.set_updated_at()
  RETURNS trigger
  LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER objectives_set_updated_at
  BEFORE UPDATE ON public.objectives
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();


-- ============================================================
-- VÉRIFICATION (à coller dans une requête séparée)
--
-- Liste les tables créées et leurs policies RLS.
--
-- SELECT
--   t.tablename,
--   t.rowsecurity,
--   p.policyname,
--   p.cmd,
--   p.qual
-- FROM pg_tables t
-- LEFT JOIN pg_policies p
--   ON p.tablename = t.tablename
--   AND p.schemaname = t.schemaname
-- WHERE t.schemaname = 'public'
--   AND t.tablename IN ('diagnostics', 'patrimoine_entries', 'objectives')
-- ORDER BY t.tablename, p.policyname;
-- ============================================================
