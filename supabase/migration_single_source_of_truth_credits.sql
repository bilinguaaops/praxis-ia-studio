-- ============================================================================
-- PRAXIS - MIGRATION : SOURCE DE VÉRITÉ UNIQUE & COHÉRENCE MULTI-APPAREILS
-- ============================================================================
-- Objectif : 
-- 1. Garantir que tout nouvel inscrit reçoive STRICTEMENT 15 crédits offerts
--    de manière transactionnelle et idempotente dans credit_balances ET credit_ledger.
-- 2. Garantir qu'aucune nouvelle connexion ne recrée ni ne réinitialise les crédits.
-- 3. Réaligner le solde de credit_balances avec la somme du grand livre (credit_ledger)
--    pour les comptes désynchronisés par l'ancienne migration (notamment 28 vs 13).
-- 4. Fournir la requête de contrôle d'intégrité comptable.
-- ============================================================================

-- 1. Mise à jour de la fonction trigger handle_new_user()
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_full_name TEXT;
    v_phone TEXT;
    v_school TEXT;
    v_generated_code TEXT;
    v_clean_name TEXT;
BEGIN
    -- Extraction des métadonnées envoyées lors du signUp
    v_full_name := COALESCE(
        NEW.raw_user_meta_data->>'full_name',
        split_part(NEW.email, '@', 1),
        'Professeur'
    );
    v_phone := NEW.raw_user_meta_data->>'phone_whatsapp';
    v_school := NEW.raw_user_meta_data->>'school_name';

    -- Génération d'un code de parrainage unique pour l'enseignant
    v_clean_name := upper(regexp_replace(v_full_name, '[^A-Za-z0-9]', '', 'g'));
    IF length(v_clean_name) < 3 THEN
        v_clean_name := 'PROF';
    END IF;
    v_generated_code := 'PRAXIS-' || substring(v_clean_name from 1 for 4) || upper(substring(replace(NEW.id::text, '-', '') from 1 for 4));

    -- 1. Créer le profil avec son code de parrainage personnel (idempotent)
    INSERT INTO public.profiles (
        id,
        role,
        full_name,
        email,
        phone_whatsapp,
        school_name,
        referral_code
    ) VALUES (
        NEW.id,
        'teacher',
        v_full_name,
        NEW.email,
        v_phone,
        v_school,
        v_generated_code
    ) ON CONFLICT (id) DO UPDATE SET
        referral_code = COALESCE(public.profiles.referral_code, EXCLUDED.referral_code);

    -- 2. Créer le solde initial avec exactement 15 corrections gratuites offertes
    -- ON CONFLICT (teacher_id) DO NOTHING garantit qu'aucune réinitialisation
    -- n'est possible en cas de re-déclenchement accidentel.
    INSERT INTO public.credit_balances (
        teacher_id,
        free_credits,
        subscription_credits,
        purchased_credits,
        frozen_subscription_credits,
        total_copies_corrected
    ) VALUES (
        NEW.id,
        15, -- 15 crédits d'essai offerts
        0,
        0,
        0,
        0
    ) ON CONFLICT (teacher_id) DO NOTHING;

    -- 3. Inscription de bienvenue dans le grand livre (ledger) avec delta = 15
    -- Vérification d'existence pour idempotence absolue
    IF NOT EXISTS (
        SELECT 1 FROM public.credit_ledger 
        WHERE teacher_id = NEW.id AND action_type = 'initial_grant'
    ) THEN
        INSERT INTO public.credit_ledger (
            teacher_id,
            delta,
            credit_type,
            action_type,
            metadata
        ) VALUES (
            NEW.id,
            15,
            'free',
            'initial_grant',
            jsonb_build_object('description', '15 corrections gratuites offertes à l''inscription')
        );
    END IF;

    -- 4. Abonnement gratuit initial dans subscriptions
    INSERT INTO public.subscriptions (
        teacher_id,
        plan_id,
        status,
        started_at
    ) VALUES (
        NEW.id,
        'free',
        'active',
        now()
    ) ON CONFLICT DO NOTHING;

    RETURN NEW;
END;
$$;

-- 2. Réalignement des soldes de credit_balances avec le grand livre (credit_ledger)
-- Répare les comptes ayant divergé (ex: solde resté à 28 alors que le ledger valait 13 = 15 - 2)
UPDATE public.credit_balances cb
SET free_credits = GREATEST(0, l.sum_free),
    last_updated_at = timezone('utc'::text, now())
FROM (
    SELECT 
        teacher_id, 
        SUM(delta) AS sum_free
    FROM public.credit_ledger
    WHERE credit_type = 'free'
    GROUP BY teacher_id
) l
WHERE cb.teacher_id = l.teacher_id
  AND cb.free_credits != l.sum_free;

-- Réaligner également total_copies_corrected avec le nombre réel d'actions 'correction_consume'
UPDATE public.credit_balances cb
SET total_copies_corrected = l.consumed_count,
    last_updated_at = timezone('utc'::text, now())
FROM (
    SELECT 
        teacher_id, 
        COUNT(*) AS consumed_count
    FROM public.credit_ledger
    WHERE action_type = 'correction_consume'
    GROUP BY teacher_id
) l
WHERE cb.teacher_id = l.teacher_id
  AND cb.total_copies_corrected != l.consumed_count;

-- 3. Requête SQL de contrôle comptable multi-appareils
-- Doit retourner 0 ligne en 'DISCORDANCE'
SELECT 
    p.id AS teacher_id,
    p.email,
    cb.free_credits,
    COALESCE(l.sum_free, 0) AS ledger_free,
    cb.subscription_credits,
    COALESCE(l.sum_sub, 0) AS ledger_sub,
    cb.purchased_credits,
    COALESCE(l.sum_purchased, 0) AS ledger_purchased,
    cb.total_available_credits AS balance_total,
    COALESCE(l.total_ledger, 0) AS ledger_total,
    cb.total_copies_corrected,
    COALESCE(l.copies_consumed, 0) AS ledger_copies_consumed,
    CASE 
        WHEN cb.total_available_credits = COALESCE(l.total_ledger, 0) 
         AND cb.total_copies_corrected = COALESCE(l.copies_consumed, 0)
        THEN 'COHÉRENT'
        ELSE 'DISCORDANCE'
    END AS diagnostic
FROM public.profiles p
JOIN public.credit_balances cb ON cb.teacher_id = p.id
LEFT JOIN (
    SELECT 
        teacher_id,
        SUM(CASE WHEN credit_type = 'free' THEN delta ELSE 0 END) AS sum_free,
        SUM(CASE WHEN credit_type = 'subscription' THEN delta ELSE 0 END) AS sum_sub,
        SUM(CASE WHEN credit_type = 'purchased' THEN delta ELSE 0 END) AS sum_purchased,
        SUM(CASE WHEN credit_type IN ('free', 'subscription', 'purchased') THEN delta ELSE 0 END) AS total_ledger,
        COUNT(CASE WHEN action_type = 'correction_consume' THEN 1 END) AS copies_consumed
    FROM public.credit_ledger
    GROUP BY teacher_id
) l ON l.teacher_id = p.id
ORDER BY diagnostic DESC, cb.last_updated_at DESC;
