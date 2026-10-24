-- ============================================================================
-- SAAS PRAXIS - MIGRATION ADDITIVE : OFFRE « ÉTABLISSEMENT »
-- ============================================================================
-- Ce script complète le schéma existant sans détruire aucune donnée.
-- Il ajoute :
-- 1. Table institutions (écoles, collèges, lycées)
-- 2. Table institution_members (directeurs institution_admin et enseignants)
-- 3. Table institution_invitations (jetons cryptographiques hachés à usage unique)
-- 4. Table class_enrollments (historique pérenne des inscriptions par année scolaire)
-- 5. Table class_teachers (affectation d'un enseignant par matière avec statut)
-- 6. Extension de public.classes (institution_id, academic_year, is_institution_class)
-- 7. Table institution_credit_balances & institution_credit_ledger (pool mutualisé de crédits)
-- 8. Table institution_access_log (journal d'audit des consultations de copies par la direction)
-- 9. Fonctions SECURITY DEFINER de contrôle d'accès sans récursion RLS
-- 10. Fonctions atomiques de consommation et remboursement de crédits d'établissement
-- 11. Politiques RLS rigoureuses et étanches
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. TABLE INSTITUTIONS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.institutions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    school_type TEXT NOT NULL DEFAULT 'lycee' CHECK (school_type IN ('primaire', 'college', 'lycee', 'groupe_scolaire', 'superieur')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'suspended')),
    plan TEXT NOT NULL DEFAULT 'institution_pilote',
    address TEXT,
    city TEXT,
    country TEXT DEFAULT 'CI',
    contact_email TEXT NOT NULL,
    contact_phone TEXT,
    academic_year TEXT NOT NULL DEFAULT '2026-2027',
    max_teachers INT NOT NULL DEFAULT 20,
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '300 days'),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_institutions_status ON public.institutions(status);
CREATE INDEX IF NOT EXISTS idx_institutions_expires_at ON public.institutions(expires_at);

-- ----------------------------------------------------------------------------
-- 2. TABLE INSTITUTION_MEMBERS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.institution_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'teacher' CHECK (role IN ('institution_admin', 'teacher')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    joined_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_institution_member UNIQUE (institution_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_institution_members_inst ON public.institution_members(institution_id);
CREATE INDEX IF NOT EXISTS idx_institution_members_user ON public.institution_members(user_id);
CREATE INDEX IF NOT EXISTS idx_institution_members_status ON public.institution_members(status);

-- ----------------------------------------------------------------------------
-- 3. TABLE INSTITUTION_INVITATIONS (Jetons cryptographiques hachés)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.institution_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'teacher' CHECK (role IN ('institution_admin', 'teacher')),
    invited_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'canceled', 'expired')),
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '14 days'),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_inst_invitations_email ON public.institution_invitations(email);
CREATE INDEX IF NOT EXISTS idx_inst_invitations_token ON public.institution_invitations(token_hash);

-- ----------------------------------------------------------------------------
-- 4. EXTENSION DE PUBLIC.CLASSES (Non-destructif)
-- ----------------------------------------------------------------------------
ALTER TABLE public.classes 
    ADD COLUMN IF NOT EXISTS institution_id UUID REFERENCES public.institutions(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS academic_year TEXT DEFAULT '2026-2027',
    ADD COLUMN IF NOT EXISTS is_institution_class BOOLEAN DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_classes_institution ON public.classes(institution_id);

-- ----------------------------------------------------------------------------
-- 5. TABLE CLASS_TEACHERS (Affectation d'un enseignant par matière)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.class_teachers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    discipline TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_class_discipline UNIQUE (class_id, discipline)
);

CREATE INDEX IF NOT EXISTS idx_class_teachers_class ON public.class_teachers(class_id);
CREATE INDEX IF NOT EXISTS idx_class_teachers_teacher ON public.class_teachers(teacher_id);

-- ----------------------------------------------------------------------------
-- 6. TABLE CLASS_ENROLLMENTS (Inscriptions pluriannuelles des élèves)
-- ----------------------------------------------------------------------------
-- Rendre students.class_id nullable pour préparer l'avenir sans casser les requêtes existantes
ALTER TABLE public.students ALTER COLUMN class_id DROP NOT NULL;

CREATE TABLE IF NOT EXISTS public.class_enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    academic_year TEXT NOT NULL DEFAULT '2026-2027',
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'transferred', 'graduated', 'archived')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_student_class_year UNIQUE (student_id, class_id, academic_year)
);

CREATE INDEX IF NOT EXISTS idx_class_enrollments_student ON public.class_enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_class_enrollments_class ON public.class_enrollments(class_id);

-- Backfill non-destructif pour les élèves existants
INSERT INTO public.class_enrollments (student_id, class_id, academic_year, status)
SELECT s.id, s.class_id, COALESCE(c.academic_year, '2026-2027'), 'active'
FROM public.students s
JOIN public.classes c ON c.id = s.class_id
WHERE s.class_id IS NOT NULL
ON CONFLICT (student_id, class_id, academic_year) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 7. CRÉDITS D'ÉTABLISSEMENT : SOLDE & GRAND LIVRE DÉDIÉ
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.institution_credit_balances (
    institution_id UUID PRIMARY KEY REFERENCES public.institutions(id) ON DELETE CASCADE,
    remaining_credits INT NOT NULL DEFAULT 0 CHECK (remaining_credits >= 0),
    total_allocated_credits INT NOT NULL DEFAULT 0 CHECK (total_allocated_credits >= 0),
    total_copies_corrected INT NOT NULL DEFAULT 0 CHECK (total_copies_corrected >= 0),
    last_updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.institution_credit_ledger (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    delta INT NOT NULL, -- -1 pour débit, +N pour allocation/achat/remboursement
    action_type TEXT NOT NULL CHECK (action_type IN ('grant', 'correction_consume', 'correction_refund', 'admin_adjustment')),
    submission_id UUID,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_inst_credit_ledger_inst ON public.institution_credit_ledger(institution_id);
CREATE INDEX IF NOT EXISTS idx_inst_credit_ledger_submission ON public.institution_credit_ledger(submission_id);

-- IDEMPOTENCE STRICTE SUR LE LEDGER INSTITUTIONNEL
CREATE UNIQUE INDEX IF NOT EXISTS uq_inst_ledger_consume_per_submission 
    ON public.institution_credit_ledger(submission_id) 
    WHERE action_type = 'correction_consume';

CREATE UNIQUE INDEX IF NOT EXISTS uq_inst_ledger_refund_per_submission 
    ON public.institution_credit_ledger(submission_id) 
    WHERE action_type = 'correction_refund';

-- ----------------------------------------------------------------------------
-- 8. JOURNAL D'AUDIT D'ACCÈS AUX COPIES (Protection de la vie privée des élèves)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.institution_access_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
    admin_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    submission_id UUID NOT NULL REFERENCES public.submissions(id) ON DELETE CASCADE,
    endpoint TEXT NOT NULL,
    ip_address TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_inst_access_log_inst ON public.institution_access_log(institution_id);

-- ----------------------------------------------------------------------------
-- 9. FONCTIONS SECURITY DEFINER SANS RÉCURSION RLS
-- ----------------------------------------------------------------------------

-- Vérifie si l'utilisateur est membre actif d'une institution active
CREATE OR REPLACE FUNCTION public.is_active_institution_member(p_institution_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.institution_members m
        JOIN public.institutions i ON i.id = m.institution_id
        WHERE m.institution_id = p_institution_id
          AND m.user_id = auth.uid()
          AND m.status = 'active'
          AND i.status = 'active'
          AND i.expires_at > now()
    );
$$;

-- Vérifie si l'utilisateur est directeur actif d'une institution active
CREATE OR REPLACE FUNCTION public.is_active_institution_admin(p_institution_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.institution_members m
        JOIN public.institutions i ON i.id = m.institution_id
        WHERE m.institution_id = p_institution_id
          AND m.user_id = auth.uid()
          AND m.role = 'institution_admin'
          AND m.status = 'active'
          AND i.status = 'active'
          AND i.expires_at > now()
    );
$$;

-- Vérifie si l'utilisateur peut accéder à une classe
CREATE OR REPLACE FUNCTION public.can_access_class(p_class_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_class RECORD;
BEGIN
    SELECT teacher_id, institution_id INTO v_class
    FROM public.classes
    WHERE id = p_class_id;

    IF NOT FOUND THEN
        RETURN false;
    END IF;

    -- Cas 1 : Classe personnelle (seul son propriétaire y accède)
    IF v_class.institution_id IS NULL THEN
        RETURN (v_class.teacher_id = auth.uid());
    END IF;

    -- Cas 2 : Classe établissement - Directeur actif de l'établissement
    IF public.is_active_institution_admin(v_class.institution_id) THEN
        RETURN true;
    END IF;

    -- Cas 3 : Classe établissement - Enseignant actif affecté à cette classe
    RETURN EXISTS (
        SELECT 1
        FROM public.class_teachers ct
        JOIN public.institution_members im ON im.user_id = ct.teacher_id AND im.institution_id = v_class.institution_id
        JOIN public.institutions i ON i.id = v_class.institution_id
        WHERE ct.class_id = p_class_id
          AND ct.teacher_id = auth.uid()
          AND ct.status = 'active'
          AND im.status = 'active'
          AND i.status = 'active'
          AND i.expires_at > now()
    );
END;
$$;

-- Vérifie si l'utilisateur peut visualiser une copie
CREATE OR REPLACE FUNCTION public.can_view_submission(p_submission_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_sub RECORD;
BEGIN
    SELECT s.teacher_id, c.institution_id INTO v_sub
    FROM public.submissions s
    JOIN public.assignments a ON a.id = s.assignment_id
    LEFT JOIN public.classes c ON c.id = a.class_id
    WHERE s.id = p_submission_id;

    IF NOT FOUND THEN
        RETURN false;
    END IF;

    -- Le professeur qui a corrigé la copie y a toujours accès
    IF v_sub.teacher_id = auth.uid() THEN
        RETURN true;
    END IF;

    -- Si la copie fait partie d'une classe d'établissement, le directeur actif peut la lire
    IF v_sub.institution_id IS NOT NULL THEN
        RETURN public.is_active_institution_admin(v_sub.institution_id);
    END IF;

    RETURN false;
END;
$$;

-- ----------------------------------------------------------------------------
-- 10. FONCTIONS ATOMIQUES ET IDEMPOTENTES POUR LES CRÉDITS ÉTABLISSEMENT
-- ----------------------------------------------------------------------------

-- Débit atomique d'un crédit établissement
CREATE OR REPLACE FUNCTION public.consume_institution_credit(
    p_institution_id UUID,
    p_submission_id UUID,
    p_teacher_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_inst RECORD;
    v_balance RECORD;
    v_existing_ledger RECORD;
BEGIN
    -- 1. Idempotence : la copie a-t-elle déjà consommé un crédit ?
    SELECT id, created_at INTO v_existing_ledger
    FROM public.institution_credit_ledger
    WHERE submission_id = p_submission_id AND action_type = 'correction_consume';

    IF FOUND THEN
        RETURN jsonb_build_object(
            'success', true, 
            'already_consumed', true,
            'consumed_at', v_existing_ledger.created_at
        );
    END IF;

    -- 2. Vérification statut institution et expiration
    SELECT status, expires_at INTO v_inst
    FROM public.institutions
    WHERE id = p_institution_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'institution_not_found');
    END IF;

    IF v_inst.status <> 'active' OR v_inst.expires_at <= now() THEN
        RETURN jsonb_build_object('success', false, 'error', 'institution_inactive_or_expired');
    END IF;

    -- 3. Verrouillage atomique du solde de l'établissement (FOR UPDATE)
    SELECT * INTO v_balance
    FROM public.institution_credit_balances
    WHERE institution_id = p_institution_id
    FOR UPDATE;

    IF NOT FOUND OR v_balance.remaining_credits <= 0 THEN
        RETURN jsonb_build_object('success', false, 'error', 'insufficient_institution_credits');
    END IF;

    -- 4. Écriture dans le grand livre
    INSERT INTO public.institution_credit_ledger (
        institution_id, teacher_id, delta, action_type, submission_id, metadata
    ) VALUES (
        p_institution_id, p_teacher_id, -1, 'correction_consume', p_submission_id, jsonb_build_object('timestamp', now())
    );

    -- 5. Débit de la balance
    UPDATE public.institution_credit_balances
    SET remaining_credits = remaining_credits - 1,
        total_copies_corrected = total_copies_corrected + 1,
        last_updated_at = now()
    WHERE institution_id = p_institution_id;

    RETURN jsonb_build_object(
        'success', true, 
        'already_consumed', false, 
        'remaining_credits', v_balance.remaining_credits - 1
    );
END;
$$;

-- Remboursement atomique d'un crédit établissement
CREATE OR REPLACE FUNCTION public.refund_institution_credit(
    p_institution_id UUID,
    p_submission_id UUID,
    p_teacher_id UUID,
    p_reason TEXT DEFAULT 'ai_analysis_failed'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_consumed RECORD;
    v_refunded RECORD;
BEGIN
    -- 1. Idempotence : déjà remboursé ?
    SELECT id INTO v_refunded
    FROM public.institution_credit_ledger
    WHERE submission_id = p_submission_id AND action_type = 'correction_refund';

    IF FOUND THEN
        RETURN jsonb_build_object('success', true, 'already_refunded', true);
    END IF;

    -- 2. Vérification qu'une consommation a bien eu lieu
    SELECT id INTO v_consumed
    FROM public.institution_credit_ledger
    WHERE submission_id = p_submission_id AND action_type = 'correction_consume';

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'no_consumption_to_refund');
    END IF;

    -- 3. Verrouillage et remboursement
    PERFORM 1 FROM public.institution_credit_balances WHERE institution_id = p_institution_id FOR UPDATE;

    INSERT INTO public.institution_credit_ledger (
        institution_id, teacher_id, delta, action_type, submission_id, metadata
    ) VALUES (
        p_institution_id, p_teacher_id, 1, 'correction_refund', p_submission_id, jsonb_build_object('reason', p_reason, 'timestamp', now())
    );

    UPDATE public.institution_credit_balances
    SET remaining_credits = remaining_credits + 1,
        total_copies_corrected = GREATEST(0, total_copies_corrected - 1),
        last_updated_at = now()
    WHERE institution_id = p_institution_id;

    RETURN jsonb_build_object('success', true, 'already_refunded', false);
END;
$$;

-- ----------------------------------------------------------------------------
-- 11. POLITIQUES ROW LEVEL SECURITY (RLS)
-- ----------------------------------------------------------------------------

ALTER TABLE public.institutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.institution_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.institution_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.institution_credit_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.institution_credit_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.institution_access_log ENABLE ROW LEVEL SECURITY;

-- INSTITUTIONS
CREATE POLICY "institutions_select_member" ON public.institutions
FOR SELECT USING (public.is_active_institution_member(id) OR public.is_admin());

CREATE POLICY "institutions_admin_manage" ON public.institutions
FOR ALL USING (public.is_admin());

-- INSTITUTION_MEMBERS
CREATE POLICY "institution_members_select_peer" ON public.institution_members
FOR SELECT USING (public.is_active_institution_member(institution_id) OR public.is_admin());

CREATE POLICY "institution_members_manage_admin" ON public.institution_members
FOR ALL USING (public.is_active_institution_admin(institution_id) OR public.is_admin());

-- INSTITUTION_INVITATIONS
CREATE POLICY "institution_invitations_admin_all" ON public.institution_invitations
FOR ALL USING (public.is_active_institution_admin(institution_id) OR public.is_admin());

-- CLASS_TEACHERS
CREATE POLICY "class_teachers_select_member" ON public.class_teachers
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.classes c
        WHERE c.id = class_id AND (public.can_access_class(c.id) OR public.is_admin())
    )
);

CREATE POLICY "class_teachers_manage_admin" ON public.class_teachers
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.classes c
        WHERE c.id = class_id AND (public.is_active_institution_admin(c.institution_id) OR public.is_admin())
    )
);

-- CLASS_ENROLLMENTS
CREATE POLICY "class_enrollments_select_member" ON public.class_enrollments
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.classes c
        WHERE c.id = class_id AND (public.can_access_class(c.id) OR public.is_admin())
    )
);

CREATE POLICY "class_enrollments_manage_admin" ON public.class_enrollments
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.classes c
        WHERE c.id = class_id AND (public.is_active_institution_admin(c.institution_id) OR public.is_admin())
    )
);

-- INSTITUTION_CREDITS : Lecture seule pour directeur, écriture réservée aux fonctions SECURITY DEFINER
CREATE POLICY "inst_credit_balances_select" ON public.institution_credit_balances
FOR SELECT USING (public.is_active_institution_admin(institution_id) OR public.is_admin());

CREATE POLICY "inst_credit_ledger_select" ON public.institution_credit_ledger
FOR SELECT USING (public.is_active_institution_admin(institution_id) OR public.is_admin());

-- INSTITUTION_ACCESS_LOG
CREATE POLICY "inst_access_log_admin_only" ON public.institution_access_log
FOR SELECT USING (public.is_admin());

-- Fin du script de migration additive
