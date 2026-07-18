-- ============================================================
-- CapitalPilot — Migration 004
-- Tables premium : user_profiles + premium_codes
-- Fonction SECURITY DEFINER : redeem_premium_code
--
-- À coller dans le SQL Editor de Supabase, onglet "New query".
-- ============================================================


-- ── 1. Table user_profiles ────────────────────────────────────────────────────
-- Stocke l'état premium d'un utilisateur.
-- L'utilisateur peut LIRE sa propre ligne (SELECT), mais ne peut
-- PAS écrire directement (pas de policy INSERT/UPDATE/DELETE).
-- La seule porte d'entrée vers is_premium=true est la fonction
-- redeem_premium_code (SECURITY DEFINER).

CREATE TABLE IF NOT EXISTS public.user_profiles (
  user_id       uuid        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  is_premium    boolean     NOT NULL DEFAULT false,
  premium_since timestamptz,
  premium_code  text,
  created_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- L'utilisateur peut lire son propre profil
CREATE POLICY "user_profiles: select own"
  ON public.user_profiles FOR SELECT
  USING (user_id = auth.uid());

-- Pas de policy INSERT / UPDATE / DELETE pour l'utilisateur.
-- Seule redeem_premium_code (SECURITY DEFINER) peut écrire.


-- ── 2. Table premium_codes ────────────────────────────────────────────────────
-- Table de codes d'activation. Complètement invisible au client
-- (RLS activé, aucune policy).

CREATE TABLE IF NOT EXISTS public.premium_codes (
  code        text    PRIMARY KEY,
  max_uses    integer NOT NULL DEFAULT 1,
  used_count  integer NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.premium_codes ENABLE ROW LEVEL SECURITY;

-- Aucune policy : la table est inaccessible au client.
-- Seule la fonction SECURITY DEFINER y accède.


-- ── 3. Fonction redeem_premium_code ──────────────────────────────────────────
-- SECURITY DEFINER : s'exécute avec les droits du propriétaire de la
-- fonction (postgres), pas ceux de l'appelant.
-- SET search_path = public : évite l'escalade de privilège via des
-- fonctions/tables homonymes dans d'autres schémas.
--
-- Retourne jsonb :
--   { "ok": true }                          → succès
--   { "ok": false, "error": "<code>" }     → échec
--
-- Codes d'erreur :
--   "not_authenticated"  → aucun utilisateur connecté
--   "invalid_code"       → code inconnu
--   "code_exhausted"     → code épuisé (used_count >= max_uses)

CREATE OR REPLACE FUNCTION public.redeem_premium_code(code_input text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id   uuid;
  v_used      integer;
  v_max       integer;
BEGIN
  -- Vérifie qu'un utilisateur est connecté
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_authenticated');
  END IF;

  -- Cherche le code (insensible à la casse via UPPER)
  SELECT used_count, max_uses
    INTO v_used, v_max
    FROM public.premium_codes
   WHERE code = UPPER(code_input);

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_code');
  END IF;

  -- Vérifie les utilisations restantes
  IF v_used >= v_max THEN
    RETURN jsonb_build_object('ok', false, 'error', 'code_exhausted');
  END IF;

  -- Incrémente le compteur d'utilisations
  UPDATE public.premium_codes
     SET used_count = used_count + 1
   WHERE code = UPPER(code_input);

  -- Active le premium pour cet utilisateur (upsert idempotent)
  INSERT INTO public.user_profiles (user_id, is_premium, premium_since, premium_code)
  VALUES (v_user_id, true, now(), UPPER(code_input))
  ON CONFLICT (user_id) DO UPDATE
    SET is_premium    = true,
        premium_since = EXCLUDED.premium_since,
        premium_code  = EXCLUDED.premium_code;

  RETURN jsonb_build_object('ok', true);
END;
$$;


-- ── 4. Premier code d'accès ───────────────────────────────────────────────────
-- Code fondateur : 50 utilisations maximum.

INSERT INTO public.premium_codes (code, max_uses, used_count)
VALUES ('FONDATEUR', 50, 0)
ON CONFLICT (code) DO NOTHING;


-- ── Vérification (facultatif) ────────────────────────────────────────────────
-- SELECT * FROM public.premium_codes;
-- SELECT * FROM public.user_profiles;
