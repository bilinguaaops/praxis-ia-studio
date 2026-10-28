-- ============================================================================
-- PRAXIS PRO - ALIGNEMENT OFFICIEL DES CRÉDITS OFFERTS À 15 COPIES
-- ============================================================================
-- Ce script met à jour directement votre base de données PostgreSQL / Supabase
-- pour aligner tous les comptes de découverte / essai sur exactement 15 crédits.
-- ============================================================================

-- 1. Mettre à jour la grille des plans (Plan gratuit 'free' = 15 crédits)
UPDATE public.plans
SET included_credits = 15
WHERE id = 'free';

-- 2. Aligner les soldes de crédits gratuits existants dans credit_balances
UPDATE public.credit_balances
SET free_credits = 15,
    total_available_credits = GREATEST(
      0, 
      15 + COALESCE(purchased_credits, 0) + COALESCE(subscription_credits, 0) - COALESCE(total_copies_corrected, 0)
    ),
    updated_at = timezone('utc'::text, now())
WHERE free_credits = 30 OR free_credits = 50;

-- 3. Aligner l'historique du grand livre (ledger) pour l'attribution initiale
UPDATE public.credit_ledger
SET delta = 15
WHERE action_type = 'initial_grant' AND (delta = 30 OR delta = 50);

-- 4. Confirmer la mise à jour
SELECT 
    p.id, 
    p.email, 
    cb.free_credits, 
    cb.total_available_credits, 
    cb.total_copies_corrected
FROM public.profiles p
JOIN public.credit_balances cb ON cb.teacher_id = p.id
ORDER BY cb.updated_at DESC
LIMIT 20;
