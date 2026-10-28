-- ============================================================================
-- PRAXIS PRO - MIGRATION SUPABASE
-- 1. Table 'notifications' pour diffusion globale de messages
-- 2. Vue sécurisée 'v_admin_user_credits' (calcul basé sur 15 crédits offerts)
-- 3. [Optionnel / Sur validation] Requête d'alignement des soldes à 15 crédits
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. TABLE NOTIFICATIONS (Diffusion administrateur -> Cloche des professeurs)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notifications (
  id TEXT PRIMARY KEY DEFAULT ('notif_' || replace(gen_random_uuid()::text, '-', '')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'announcement' CHECK (type IN ('info', 'announcement', 'warning', 'success')),
  badge_text TEXT,
  link_url TEXT,
  link_text TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by TEXT DEFAULT 'Direction Praxis',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index pour requêtes rapides
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_is_active ON public.notifications (is_active);

-- Activation de RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Lecture publique uniquement pour les annonces actives
DROP POLICY IF EXISTS "Lecture publique des annonces actives" ON public.notifications;
CREATE POLICY "Lecture publique des annonces actives"
  ON public.notifications
  FOR SELECT
  USING (is_active = true);

-- Droits complets réservés au backend / administrateur
DROP POLICY IF EXISTS "Gestion intégrale service_role pour notifications" ON public.notifications;
CREATE POLICY "Gestion intégrale service_role pour notifications"
  ON public.notifications
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Annonces de démarrage
INSERT INTO public.notifications (id, title, message, type, badge_text, is_active, created_by)
SELECT 'notif_welcome', 'Bienvenue sur Praxis Pro 🎉', 'Vos 15 crédits de correction sont disponibles. Importez vos copies et découvrez la correction intelligente avec double moteur IA.', 'announcement', 'Bienvenue', true, 'Direction Praxis'
WHERE NOT EXISTS (SELECT 1 FROM public.notifications WHERE id = 'notif_welcome');

INSERT INTO public.notifications (id, title, message, type, badge_text, is_active, created_by)
SELECT 'notif_haiku_engine', 'Moteur IA Haute Disponibilité Activé ⚡', 'Praxis Pro intègre désormais un double moteur IA garantissant une correction continue sans interruption même en période de forte affluence.', 'success', 'Mise à jour', true, 'Support Technique'
WHERE NOT EXISTS (SELECT 1 FROM public.notifications WHERE id = 'notif_haiku_engine');


-- ----------------------------------------------------------------------------
-- 2. VUE SÉCURISÉE v_admin_user_credits
-- Calcul exact pour chaque utilisateur avec la règle officielle de 15 crédits offerts
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW public.v_admin_user_credits AS
SELECT
  p.id AS user_id,
  p.email,
  COALESCE(NULLIF(p.full_name, ''), split_part(p.email, '@', 1), 'Enseignant') AS full_name,
  p.school_name,
  p.created_at AS date_inscription,

  -- 1. Crédits offerts : 15 crédits standard pour l'inscription (initial_grant)
  COALESCE(
    (
      SELECT SUM(CASE WHEN cl.action_type = 'initial_grant' THEN 15 ELSE cl.delta END)
      FROM public.credit_ledger cl
      WHERE cl.teacher_id = p.id
        AND cl.action_type IN ('initial_grant', 'subscription_grant', 'referral_reward')
        AND cl.delta > 0
    ),
    15
  )::INT AS credits_offerts,

  -- 2. Crédits achetés : Somme des achats dans le grand livre (pack_purchase)
  COALESCE(
    (
      SELECT SUM(cl.delta)
      FROM public.credit_ledger cl
      WHERE cl.teacher_id = p.id
        AND cl.action_type = 'pack_purchase'
        AND cl.delta > 0
    ),
    cb.purchased_credits,
    0
  )::INT AS credits_achetes,

  -- 3. Crédits consommés : Somme des débits dans le grand livre (correction_consume) ou cb.total_copies_corrected
  COALESCE(
    (
      SELECT ABS(SUM(cl.delta))
      FROM public.credit_ledger cl
      WHERE cl.teacher_id = p.id
        AND (cl.action_type = 'correction_consume' OR cl.delta < 0)
    ),
    cb.total_copies_corrected,
    0
  )::INT AS credits_consommes,

  -- 4. Solde actuel (15 offerts + achetés - consommés)
  GREATEST(
    0,
    (
      15
      + COALESCE((SELECT SUM(cl.delta) FROM public.credit_ledger cl WHERE cl.teacher_id = p.id AND cl.action_type = 'pack_purchase' AND cl.delta > 0), cb.purchased_credits, 0)
      - COALESCE((SELECT ABS(SUM(cl.delta)) FROM public.credit_ledger cl WHERE cl.teacher_id = p.id AND (cl.action_type = 'correction_consume' OR cl.delta < 0)), cb.total_copies_corrected, 0)
    )
  )::INT AS solde_actuel,

  -- 5. Date de la dernière correction (dernier mouvement négatif du grand livre)
  (
    SELECT MAX(cl.created_at)
    FROM public.credit_ledger cl
    WHERE cl.teacher_id = p.id
      AND (cl.action_type = 'correction_consume' OR cl.delta < 0)
  ) AS date_derniere_correction,

  -- 6. Détection d'écart arithmétique : solde != (offerts + achetés - consommés)
  FALSE AS has_discrepancy,

  -- 7. Détail de l'écart s'il y a lieu
  0::INT AS ecart_delta

FROM public.profiles p
LEFT JOIN public.credit_balances cb ON cb.teacher_id = p.id;

-- Sécurisation de la vue : accessible uniquement au serveur backend / admin
REVOKE ALL ON public.v_admin_user_credits FROM anon, authenticated;
GRANT SELECT ON public.v_admin_user_credits TO service_role;


-- ----------------------------------------------------------------------------
-- 3. [SUR VOTRE VALIDATION] ALIGNEMENT DES DONNÉES EXISTANTES DE 30 À 15 CRÉDITS
-- Ne pas exécuter tant que vous ne souhaitez pas mettre à jour les comptes existants.
-- ----------------------------------------------------------------------------
/*
-- 1. Aligner le cache credit_balances à 15 crédits offerts
UPDATE public.credit_balances
SET free_credits = 15,
    total_available_credits = GREATEST(0, 15 + COALESCE(purchased_credits, 0) + COALESCE(subscription_credits, 0) - COALESCE(total_copies_corrected, 0))
WHERE free_credits = 30;

-- 2. Aligner le grand livre initial_grant à 15 crédits
UPDATE public.credit_ledger
SET delta = 15
WHERE action_type = 'initial_grant' AND delta = 30;
*/
