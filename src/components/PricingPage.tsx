import React, { useState, useEffect } from 'react';
import {
  Check,
  ChevronDown,
  ChevronUp,
  X,
  ShieldCheck,
  Lock,
  ArrowRight,
  Sparkles,
  CreditCard,
  Smartphone,
  Info,
  Building2,
  Star,
  Phone,
  Mail,
  Plus,
  Minus,
  FileText,
  Zap,
  ShoppingCart,
  Sliders,
  FileCheck,
  Users,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { PaywallPlanId, LeadData } from '../types';

interface PricingPageProps {
  currentLead?: LeadData | null;
  initialPlanId?: PaywallPlanId;
  partnerRefCode?: string;
  onPaymentSuccess?: (updatedTeacher: LeadData) => void;
  onStartCorrection: () => void;
  onBackToApp?: () => void;
  onOpenContact?: () => void;
}

type PricingTab = 'enseignants' | 'etablissements' | 'recharges';

interface TeacherPlanDefinition {
  id: 'monthly' | 'quarterly' | 'school_year';
  name: string;
  desc: string;
  priceFcfa: number;
  priceEur: number;
  periodLabel: string;
  corrections: number;
  unitCostFcfa: string;
  unitCostEur: string;
  featured?: boolean;
  badge?: string;
  features: string[];
}

interface RechargePackDefinition {
  id: 'extra_100' | 'extra_200' | 'extra_300' | 'extra_500' | 'extra_1000';
  name: string;
  desc: string;
  priceFcfa: number;
  priceEur: number;
  corrections: number;
  unitCostFcfa: string;
  unitCostEur: string;
  featured?: boolean;
  badge?: string;
  features: string[];
}

interface SchoolPlanDefinition {
  id: string;
  sizeKey: 'petit' | 'moyen' | 'grand' | 'tres-grand';
  name: string;
  desc: string;
  teachersRange: string;
  priceFcfa: number;
  priceEur: number;
  copiesPerYear: number;
  corrections: number;
  unitCostFcfa: string;
  unitCostEur: string;
  perTeacherFcfa: string;
  quarterlyFcfa: string;
  quarterlyEur: string;
  popular?: boolean;
  badge?: string;
  features: string[];
}

// 1. LES PLANS ENSEIGNANTS
const TEACHER_PLANS: TeacherPlanDefinition[] = [
  {
    id: 'monthly',
    name: 'Mensuel',
    desc: 'Flexibilité mois par mois',
    priceEur: 7.60,
    priceFcfa: 5000,
    periodLabel: 'par mois',
    corrections: 300,
    unitCostFcfa: '16,6 F',
    unitCostEur: '0,025 €',
    features: [
      '300 corrections par mois (10 devoirs / jour)',
      '300 corrections par mois incluses',
      'Cumulable jusqu’à 900 corrections max',
      'Report automatique des soldes non utilisés',
      'Accès complet à l’IA (toutes matières)',
      'Annulation flexible sans engagement',
    ],
  },
  {
    id: 'quarterly',
    name: 'Trimestre',
    desc: 'Idéal trimestre scolaire',
    priceEur: 18.30,
    priceFcfa: 12000,
    periodLabel: 'pour 3 mois',
    corrections: 900,
    unitCostFcfa: '13,3 F',
    unitCostEur: '0,020 €',
    featured: true,
    badge: '⭐ Le plus équilibré',
    features: [
      '900 corrections au total (soit seulement 4 000 F / mois)',
      '900 corrections au total (300 / mois)',
      'Économisez 3 000 F par rapport au mensuel',
      'Vos crédits non utilisés restent disponibles',
      'Export Pronote & Bulletins complets',
      'Support enseignant prioritaire',
    ],
  },
  {
    id: 'school_year',
    name: 'Année scolaire',
    desc: 'L’offre complète (9 mois)',
    priceEur: 45.75,
    priceFcfa: 30000,
    periodLabel: 'pour 9 mois',
    corrections: 3000,
    unitCostFcfa: '10 F',
    unitCostEur: '0,015 €',
    badge: '🎓 Meilleure rentabilité',
    features: [
      '3 000 corrections incluses (soit seulement 3 333 F / mois)',
      '3 000 corrections incluses (333 / mois × 9)',
      'Économisez 15 000 F (soit 3 mois complets offerts !)',
      'Vos crédits vous accompagnent toute l’année',
      'Multi-classes et devoirs illimités',
      'Ligne WhatsApp directe 7j/7 avec l’équipe',
    ],
  },
];

// 2. LE PACK ANNUEL ÉTABLISSEMENT & SES RECHARGES DÉDIÉES
export interface SchoolRechargeOption {
  id: string;
  name: string;
  copies: number;
  priceFcfa: number;
  priceEur: number;
  unitCostFcfa: string;
  unitCostEur: string;
  tag?: string;
  badge?: string;
  popular?: boolean;
}

export const SCHOOL_RECHARGES: SchoolRechargeOption[] = [
  {
    id: 'school_recharge_500',
    name: 'Recharge +500 copies',
    copies: 500,
    priceFcfa: 15000,
    priceEur: 23.0,
    unitCostFcfa: '30 F',
    unitCostEur: '0,046 €',
    tag: 'Recharge flash',
  },
  {
    id: 'school_recharge_1000',
    name: 'Recharge +1 000 copies',
    copies: 1000,
    priceFcfa: 28000,
    priceEur: 43.0,
    unitCostFcfa: '28 F',
    unitCostEur: '0,043 €',
    popular: true,
    badge: 'Recommandé',
    tag: 'Idéal trimestriel',
  },
  {
    id: 'school_recharge_2000',
    name: 'Recharge +2 000 copies',
    copies: 2000,
    priceFcfa: 50000,
    priceEur: 76.0,
    unitCostFcfa: '25 F',
    unitCostEur: '0,038 €',
    tag: 'Tarif préférentiel',
  },
  {
    id: 'school_recharge_5000',
    name: 'Recharge +5 000 copies',
    copies: 5000,
    priceFcfa: 110000,
    priceEur: 168.0,
    unitCostFcfa: '22 F',
    unitCostEur: '0,034 €',
    tag: 'Grand volume examens',
  },
];

const SCHOOL_PLANS: Record<string, SchoolPlanDefinition> = {
  petit: {
    id: 'school_small',
    sizeKey: 'petit',
    name: 'Petit établissement',
    desc: '5 à 10 enseignants',
    teachersRange: '5-10 enseignants',
    priceFcfa: 390000,
    priceEur: 595.0,
    copiesPerYear: 10000,
    corrections: 10000,
    unitCostFcfa: '39 F',
    unitCostEur: '0,059 €',
    perTeacherFcfa: '39 000 F',
    quarterlyFcfa: '130 000 F',
    quarterlyEur: '198 €',
    badge: '5 à 10 enseignants',
    features: [
      '10 000 corrections annuelles pour tout l’établissement',
      'Quota mutualisé pour toute l’équipe pédagogique',
      'Portail de supervision Direction & Grand Livre d’audit',
      'Paiement échelonné en 3 trimestres (130 000 F / trimestre)',
      'Recharges de crédits école disponibles à tarif dégressif',
      'Facture et bon de commande proforma certifiés',
    ],
  },
  moyen: {
    id: 'school_medium',
    sizeKey: 'moyen',
    name: 'Moyen établissement',
    desc: '11 à 20 enseignants',
    teachersRange: '11-20 enseignants',
    priceFcfa: 690000,
    priceEur: 1050.0,
    copiesPerYear: 22000,
    corrections: 22000,
    unitCostFcfa: '31 F',
    unitCostEur: '0,047 €',
    perTeacherFcfa: '34 500 F',
    quarterlyFcfa: '230 000 F',
    quarterlyEur: '350 €',
    badge: '11 à 20 enseignants',
    features: [
      '22 000 corrections annuelles pour l’établissement',
      'Quota mutualisé pour toute l’équipe pédagogique',
      'Portail de supervision Direction & Grand Livre d’audit',
      'Paiement échelonné en 3 trimestres (230 000 F / trimestre)',
      'Recharges de crédits école disponibles à tarif dégressif',
      'Support prioritaire et onboarding dédié',
    ],
  },
  grand: {
    id: 'school_large',
    sizeKey: 'grand',
    name: 'Grand établissement',
    desc: '21 à 30 enseignants',
    teachersRange: '21-30 enseignants',
    priceFcfa: 950000,
    priceEur: 1450.0,
    copiesPerYear: 35000,
    corrections: 35000,
    unitCostFcfa: '27 F',
    unitCostEur: '0,041 €',
    perTeacherFcfa: '31 666 F',
    quarterlyFcfa: '316 666 F',
    quarterlyEur: '483 €',
    badge: '21 à 30 enseignants',
    features: [
      '35 000 corrections annuelles pour l’établissement',
      'Quota mutualisé pour toute l’équipe pédagogique',
      'Portail de supervision Direction & Grand Livre d’audit',
      'Paiement échelonné en 3 trimestres (316 666 F / trimestre)',
      'Recharges de crédits école disponibles à tarif dégressif',
      'Accompagnement pédagogique complet',
    ],
  },
  'tres-grand': {
    id: 'school_xl',
    sizeKey: 'tres-grand',
    name: 'Très grand établissement',
    desc: '31 à 45 enseignants',
    teachersRange: '31-45 enseignants',
    priceFcfa: 1250000,
    priceEur: 1900.0,
    copiesPerYear: 55000,
    corrections: 55000,
    unitCostFcfa: '23 F',
    unitCostEur: '0,035 €',
    perTeacherFcfa: '27 777 F',
    quarterlyFcfa: '416 666 F',
    quarterlyEur: '633 €',
    badge: '31 à 45 enseignants',
    features: [
      '55 000 corrections annuelles pour l’établissement',
      'Quota mutualisé pour toute l’équipe pédagogique',
      'Portail de supervision Direction & Grand Livre d’audit',
      'Paiement échelonné en 3 trimestres (416 666 F / trimestre)',
      'Recharges de crédits école disponibles à tarif dégressif',
      'Ligne directe WhatsApp & Directeur de compte dédié',
    ],
  },
};

// 3. LES RECHARGES ENSEIGNANTS INDIVIDUELS
const RECHARGE_PACKS: RechargePackDefinition[] = [
  {
    id: 'extra_100',
    name: 'Petit paquet',
    desc: 'Pour tester ou compléter',
    priceEur: 1.50,
    priceFcfa: 1000,
    corrections: 100,
    unitCostFcfa: '10 F',
    unitCostEur: '0,015 €',
    features: [
      'Valable sans limitation dans le temps',
      'Report automatique sur votre solde',
      'Ajout instantané à votre compte',
      'Utilisable à tout moment',
    ],
  },
  {
    id: 'extra_200',
    name: 'Paquet intermédiaire',
    desc: 'L’option la plus demandée',
    priceEur: 3.05,
    priceFcfa: 2000,
    corrections: 200,
    unitCostFcfa: '10 F',
    unitCostEur: '0,015 €',
    featured: true,
    badge: 'Recommandé',
    features: [
      'Valable sans limitation dans le temps',
      'Report automatique sur votre solde',
      'Ajout instantané à votre compte',
      'Idéal paquets de devoirs réguliers',
    ],
  },
  {
    id: 'extra_300',
    name: 'Grand paquet',
    desc: 'Idéal examens et fin de trimestre',
    priceEur: 4.55,
    priceFcfa: 3000,
    corrections: 300,
    unitCostFcfa: '10 F',
    unitCostEur: '0,015 €',
    badge: 'Pack Économique',
    features: [
      'Valable sans limitation dans le temps',
      'Report automatique sur votre solde',
      'Ajout instantané à votre compte',
      'Idéal épreuves et compositions',
    ],
  },
];

// 4. FAQ
const FAQ_ITEMS = [
  {
    q: 'Comment fonctionne l’essai gratuit ?',
    a: 'Créez simplement votre compte avec votre adresse email. Vous recevez immédiatement 15 corrections gratuites pour tester la plateforme en conditions réelles avec vos copies d’élèves. Aucune carte bancaire requise pour l’essai. Après vos 15 corrections, vous pouvez choisir la formule de votre choix sans aucun engagement.',
  },
  {
    q: 'Que se passe-t-il si je ne consomme pas mes corrections ?',
    a: 'Vos corrections non consommées sont reportées automatiquement d’un mois sur l’autre. Vous pouvez cumuler jusqu’à 900 corrections en réserve pour la formule mensuelle. Vous ne perdez jamais les corrections pour lesquelles vous avez payé tant que votre abonnement reste actif.',
  },
  {
    q: 'Que sont les recharges et comment fonctionnent les crédits sans expiration ?',
    a: 'Une recharge est un achat ponctuel unique (sans abonnement ni prélèvement automatique) de copies supplémentaires (+100, +200 ou +300 copies). Ces crédits n’expirent JAMAIS : ils restent acquis et utilisables à tout moment sur votre compte, sans aucune limite de temps, même au cours du trimestre ou de l’année scolaire suivante. C’est la solution parfaite pour absorber un pic d’examens blancs ou compléter votre solde en toute sérénité.',
  },
  {
    q: 'Acceptez-vous les paiements échelonnés ?',
    a: 'Oui, spécialement pour les établissements scolaires. Nous proposons le paiement échelonné en 3 versements (40 % à la rentrée, 30 % au 2ème trimestre, 30 % au 3ème trimestre). Nous acceptons Wave, cartes bancaires, Mobile Money et les virements bancaires dans toute l’Afrique francophone.',
  },
  {
    q: 'Comment l’IA gère-t-elle les écritures manuscrites ?',
    a: 'PRAXIS intègre une technologie OCR et vision spécialisée dans la lecture des écritures manuscrites d’élèves (cahiers, copies simples et doubles, feuilles de brouillon). Même si l’écriture est penchée, difficile ou au crayon de papier, l’IA extrait le texte fidèlement et applique votre barème.',
  },
  {
    q: 'Mes données d’élèves sont-elles protégées et chiffrées ?',
    a: 'Absolument, à 100 %. Vos échanges sont chiffrés de bout en bout (TLS 1.3 / AES-256 bits). Nous utilisons exclusivement les API professionnelles Google Cloud / GenAI Enterprise : Google s’engage contractuellement à ne JAMAIS utiliser les données, requêtes ou photos de copies d’élèves pour entraîner ou améliorer ses modèles publics d’intelligence artificielle. Les données scolaires restent strictement confidentielles et réservées à l’enseignant et à son établissement.',
  },
  {
    q: 'Puis-je annuler mon abonnement ? Y a-t-il un remboursement ?',
    a: 'Vous pouvez résilier votre abonnement à tout moment sans préavis ni frais cachés. En revanche, aucun remboursement n’est accordé pour la période entamée ou pour les crédits déjà alloués (conformément aux règles sur les services numériques à consommation immédiate). Lors de l’annulation, tout renouvellement automatique futur est stoppé et vous continuez de profiter de l’intégralité de vos crédits restants jusqu’à la fin de votre période déjà payée.',
  },
  {
    q: 'Comment la direction invite-t-elle les enseignants dans l’offre Établissement ?',
    a: 'C’est instantané : le chef d’établissement saisit simplement le nom, l’adresse email professionnelle et la discipline de l’enseignant depuis son tableau de bord de supervision. Dès que l’enseignant se connecte avec cet email, il est automatiquement reconnu et rattaché à l’établissement. Il corrige ses classes sans rien débourser, toutes les corrections étant déduites du quota collectif de l’école.',
  },
  {
    q: 'Couvrez-vous tous les niveaux et matières ?',
    a: 'Oui, de l’école primaire jusqu’au lycée (classes d’examen 3ème, 1ère, Terminale). Toutes les matières sont prises en charge : Français, Mathématiques, Physique-Chimie, SVT, Histoire-Géographie, Philosophie, Anglais, etc. L’IA est alignée sur les programmes officiels francophones.',
  },
  {
    q: 'Y a-t-il un support client ?',
    a: 'Oui, une assistance réactive est disponible par WhatsApp 7j/7 et par email. Nous répondons en moins de 24h ouvrées. Les directions d’établissements disposent d’une ligne téléphonique directe prioritaire et d’un accompagnement à l’onboarding de leurs enseignants.',
  },
];

export const PricingPage: React.FC<PricingPageProps> = ({
  currentLead,
  initialPlanId = 'monthly',
  partnerRefCode,
  onPaymentSuccess,
  onStartCorrection,
  onBackToApp,
  onOpenContact,
}) => {
  // Tabs & Currency
  const [activeTab, setActiveTab] = useState<PricingTab>(
    initialPlanId === 'extra_100' ||
    initialPlanId === 'extra_200' ||
    initialPlanId === 'extra_300' ||
    initialPlanId === 'extra_500' ||
    initialPlanId === 'extra_1000'
      ? 'recharges'
      : 'enseignants'
  );
  const [currency, setCurrency] = useState<'EUR' | 'XOF'>('EUR');

  // School Plan & Recharge Selector
  const [selectedSchoolSize, setSelectedSchoolSize] = useState<string>('petit');
  const [schoolCustomCopies, setSchoolCustomCopies] = useState<number>(2000);

  // Checkout modal
  const [checkoutOpen, setCheckoutOpen] = useState<boolean>(false);
  const [selectedPlanId, setSelectedPlanId] = useState<PaywallPlanId>(initialPlanId);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  // Quote modal for institution
  const [quoteModalOpen, setQuoteModalOpen] = useState<boolean>(false);
  const [schoolContactForm, setSchoolContactForm] = useState({
    schoolName: '',
    contactName: currentLead?.name || '',
    email: currentLead?.email || '',
    phone: currentLead?.whatsapp || '',
    teachersCount: '15',
    notes: '',
  });
  const [quoteSent, setQuoteSent] = useState<boolean>(false);
  const [quoteSubmitting, setQuoteSubmitting] = useState<boolean>(false);
  const [quoteError, setQuoteError] = useState<string>('');

  // Form fields for Paystack
  const [teacherEmail, setTeacherEmail] = useState<string>(currentLead?.email || '');
  const [teacherName, setTeacherName] = useState<string>(currentLead?.name || '');
  const [teacherPhone, setTeacherPhone] = useState<string>(currentLead?.whatsapp || '');

  // Promo code
  const [promoExpanded, setPromoExpanded] = useState<boolean>(false);
  const [promoCodeInput, setPromoCodeInput] = useState<string>('');
  const [isValidatingPromo, setIsValidatingPromo] = useState<boolean>(false);
  const [appliedPromo, setAppliedPromo] = useState<{
    code: string;
    discountPercent: number;
    bonusCredits?: number;
    message?: string;
  } | null>(null);
  const [promoError, setPromoError] = useState<string>('');

  // Processing state
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [paymentSuccessData, setPaymentSuccessData] = useState<{
    message: string;
    remainingCopies: number;
    planName: string;
  } | null>(null);

  // Auto-detect promo code from URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const codeFromUrl = urlParams.get('promo') || urlParams.get('ref') || partnerRefCode;
    if (codeFromUrl && !appliedPromo) {
      setPromoCodeInput(codeFromUrl.toUpperCase());
      setPromoExpanded(true);
      applyPromoCode(codeFromUrl.toUpperCase());
    }
  }, [partnerRefCode]);

  // Handle Paystack return redirect
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const paystackRef = urlParams.get('paystack_ref') || urlParams.get('reference');
    if (paystackRef) {
      verifyPaystackPayment(paystackRef);
    }
  }, []);

  const verifyPaystackPayment = async (reference: string) => {
    setIsProcessing(true);
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const isDemo = urlParams.get('demo_pay') === '1' || urlParams.get('demo') === 'true';
      const res = await fetch(`/api/paystack/verify/${encodeURIComponent(reference)}${isDemo ? '?demo=1' : ''}`);
      const data = await res.json();

      if (res.ok && data.success) {
        try {
          confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
        } catch {
          // ignore
        }

        setPaymentSuccessData({
          message: data.message || 'Paiement confirmé avec succès.',
          remainingCopies: data.remainingCopies || data.teacher?.quota || 0,
          planName: data.transaction?.plan || 'Forfait',
        });

        if (onPaymentSuccess && data.teacher) {
          onPaymentSuccess(data.teacher);
        }

        const newUrl = window.location.pathname;
        window.history.replaceState({}, document.title, newUrl);
      } else {
        setErrorMsg(data.error || 'Impossible de vérifier la transaction Paystack.');
      }
    } catch {
      setErrorMsg('Erreur réseau lors de la confirmation du paiement.');
    } finally {
      setIsProcessing(false);
    }
  };

  const applyPromoCode = async (codeToValidate: string) => {
    const code = codeToValidate.trim().toUpperCase();
    if (!code) {
      setPromoError('Veuillez renseigner un code promo.');
      return;
    }
    setPromoError('');
    setIsValidatingPromo(true);

    try {
      const res = await fetch('/api/promo/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          email: teacherEmail.trim(),
          planId: selectedPlanId,
          currency,
        }),
      });

      const data = await res.json();
      if (res.ok && data.valid) {
        setAppliedPromo({
          code: data.code,
          discountPercent: data.discountPercent,
          bonusCredits: data.bonusCredits,
          message: data.message,
        });
        setPromoError('');
      } else {
        setAppliedPromo(null);
        setPromoError(data.error || 'Code promo invalide ou expiré.');
      }
    } catch {
      setAppliedPromo(null);
      setPromoError('Impossible de valider le code promo.');
    } finally {
      setIsValidatingPromo(false);
    }
  };

  const handleOpenCheckout = (planId: PaywallPlanId) => {
    setSelectedPlanId(planId);
    setErrorMsg('');
    setCheckoutOpen(true);
  };

  const handleCloseCheckout = () => {
    setCheckoutOpen(false);
    setErrorMsg('');
  };

  // Find selected plan metadata
  const currentPlanMeta: any =
    TEACHER_PLANS.find((p) => p.id === selectedPlanId) ||
    RECHARGE_PACKS.find((p) => p.id === selectedPlanId) ||
    SCHOOL_RECHARGES.find((p) => p.id === selectedPlanId) ||
    Object.values(SCHOOL_PLANS).find((p) => p.id === selectedPlanId) ||
    (selectedPlanId === 'school_annual'
      ? {
          id: 'school_annual',
          name: 'Pack Annuel Établissement (Socle)',
          desc: '10 000 corrections annuelles pour l’établissement',
          priceFcfa: 390000,
          priceEur: 595.0,
          corrections: 10000,
        }
      : null) ||
    TEACHER_PLANS[0];

  const basePriceFcfa = currentPlanMeta.priceFcfa;
  const basePriceEur = currentPlanMeta.priceEur;

  const isSubscription = selectedPlanId === 'monthly' || selectedPlanId === 'quarterly' || selectedPlanId === 'school_year';
  const discountPercent = appliedPromo && isSubscription ? appliedPromo.discountPercent : 0;
  const discountFcfa = Math.round(basePriceFcfa * (discountPercent / 100));
  const discountEur = Number((basePriceEur * (discountPercent / 100)).toFixed(2));

  const finalPriceFcfa = Math.max(0, basePriceFcfa - discountFcfa);
  const finalPriceEur = Number(Math.max(0, basePriceEur - discountEur).toFixed(2));

  const handleStartPaystackPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!teacherEmail.trim()) {
      setErrorMsg('Veuillez saisir votre adresse email pour recevoir votre reçu et vos crédits.');
      return;
    }

    setIsProcessing(true);

    try {
      const res = await fetch('/api/paystack/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: selectedPlanId,
          email: teacherEmail.trim().toLowerCase(),
          name: teacherName.trim() || 'Enseignant',
          whatsapp: teacherPhone.trim(),
          currency: 'XOF',
          promoCode: appliedPromo?.code || undefined,
          callbackUrl: window.location.origin + window.location.pathname,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Erreur lors de l’initialisation du paiement Paystack.');
      }

      if (data.authorizationUrl) {
        try {
          if (window.top && window.top !== window) {
            const win = window.open(data.authorizationUrl, '_blank');
            if (!win) {
              window.location.href = data.authorizationUrl;
            }
          } else {
            window.location.href = data.authorizationUrl;
          }
        } catch {
          window.location.href = data.authorizationUrl;
        }
      } else {
        throw new Error('URL de paiement non reçue.');
      }
    } catch (err: any) {
      console.error('[Checkout Paystack] Erreur:', err);
      setErrorMsg(err.message || 'Impossible de contacter le service de paiement. Réessayez.');
      setIsProcessing(false);
    }
  };

  const handleSendQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    setQuoteError('');
    setQuoteSubmitting(true);
    try {
      const res = await fetch('/api/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          schoolName: schoolContactForm.schoolName,
          contactName: schoolContactForm.contactName,
          email: schoolContactForm.email,
          phone: schoolContactForm.phone,
          teachersCount: schoolContactForm.teachersCount,
          planId: currentSchoolPlan.id,
          planName: currentSchoolPlan.name,
          copiesPerYear: currentSchoolPlan.copiesPerYear,
          priceFcfa: currentSchoolPlan.priceFcfa,
          priceEur: currentSchoolPlan.priceEur,
          message: schoolContactForm.notes,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Erreur lors de l’envoi de votre demande de devis.');
      }

      setQuoteSent(true);
      setTimeout(() => {
        setQuoteSent(false);
        setQuoteModalOpen(false);
      }, 3500);
    } catch (err: any) {
      setQuoteError(err.message || 'Impossible d’envoyer la demande. Réessayez.');
    } finally {
      setQuoteSubmitting(false);
    }
  };

  const currentSchoolPlan = SCHOOL_PLANS.petit;

  const getCustomRechargeRate = (copies: number) => {
    if (copies < 1000) return 30;
    if (copies < 2000) return 28;
    if (copies < 5000) return 25;
    return 22;
  };

  const customRechargeUnitCostFcfa = getCustomRechargeRate(schoolCustomCopies);
  const customRechargePriceFcfa = schoolCustomCopies * customRechargeUnitCostFcfa;
  const customRechargePriceEur = Number((customRechargePriceFcfa / 655.957).toFixed(2));

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans transition-colors duration-200">
      {/* TOP NAVIGATION / STATUS BAR */}
      <div className="border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {onBackToApp && (
              <button
                type="button"
                onClick={onBackToApp}
                className="text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-blue-700 dark:hover:text-blue-400 flex items-center gap-1.5 py-1.5 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 transition-colors cursor-pointer"
              >
                <span>←</span>
                <span>Retour à la correction</span>
              </button>
            )}
            <span className="text-xs text-slate-500 dark:text-slate-400 hidden sm:inline">
              Praxis IA · Correction intelligente de copies
            </span>
          </div>

          <div className="flex items-center gap-3">
            {currentLead && (
              <div className="text-xs px-3 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 font-medium hidden md:block">
                Solde actuel : <span className="font-bold">{Math.max(0, (currentLead.quota || 25) - (currentLead.copiesCorrected || 0))}</span> copies
              </div>
            )}

            {/* Currency Switcher */}
            <div className="flex items-center rounded-lg border border-slate-200 dark:border-slate-700 p-0.5 bg-slate-100 dark:bg-slate-800 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setCurrency('EUR')}
                className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                  currency === 'EUR'
                    ? 'bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-400 shadow-xs font-bold'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                € EUR
              </button>
              <button
                type="button"
                onClick={() => setCurrency('XOF')}
                className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                  currency === 'XOF'
                    ? 'bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-400 shadow-xs font-bold'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                FCFA
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* SUCCESS NOTIFICATION */}
      {paymentSuccessData && (
        <div className="max-w-4xl mx-auto px-4 mt-6">
          <div className="p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                <Check className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-emerald-950 dark:text-emerald-100">
                  {paymentSuccessData.planName} activé avec succès !
                </h4>
                <p className="text-xs text-emerald-800 dark:text-emerald-300 mt-0.5">
                  {paymentSuccessData.message} · Nouveau solde : <strong>{paymentSuccessData.remainingCopies} corrections</strong> disponibles.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onStartCorrection}
              className="text-xs font-bold px-4 py-2.5 rounded-xl bg-emerald-700 text-white hover:bg-emerald-800 transition-colors shrink-0 cursor-pointer"
            >
              Corriger une copie maintenant →
            </button>
          </div>
        </div>
      )}

      {/* HERO SECTION */}
      <section className="pt-10 pb-6 sm:pt-14 sm:pb-8 text-center px-4 max-w-4xl mx-auto">
        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Tarification claire et équitable
        </h1>
        <p className="text-sm sm:text-lg text-slate-600 dark:text-slate-300 mt-3 max-w-2xl mx-auto leading-relaxed">
          Que vous soyez enseignant ou établissement, trouvez le plan qui vous convient. Essai gratuit, pas d'engagement, annulation à tout moment.
        </p>

        {/* TRUST SIGNALS */}
        <div className="flex justify-center items-center gap-6 sm:gap-10 flex-wrap mt-8 pt-6 border-t border-slate-200 dark:border-slate-800 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
          <div className="flex items-center gap-2 font-medium">
            <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Check className="w-3.5 h-3.5 stroke-[3]" />
            </div>
            <span>Essai gratuit 15 corrections</span>
          </div>
          <div className="flex items-center gap-2 font-medium">
            <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Check className="w-3.5 h-3.5 stroke-[3]" />
            </div>
            <span>Tous niveaux et matières</span>
          </div>
          <div className="flex items-center gap-2 font-medium">
            <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Check className="w-3.5 h-3.5 stroke-[3]" />
            </div>
            <span>Paiement sécurisé (Wave, CB, Mobile Money)</span>
          </div>
        </div>
      </section>

      {/* 3 PRIMARY TABS */}
      <div className="max-w-5xl mx-auto px-4 mt-4">
        <div className="flex justify-center border-b-2 border-slate-200 dark:border-slate-800 gap-2 sm:gap-6">
          <button
            type="button"
            onClick={() => setActiveTab('enseignants')}
            className={`pb-3 px-4 sm:px-8 text-sm sm:text-base font-semibold border-b-2 -mb-[2px] transition-all cursor-pointer ${
              activeTab === 'enseignants'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Enseignants
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('etablissements')}
            className={`pb-3 px-4 sm:px-8 text-sm sm:text-base font-semibold border-b-2 -mb-[2px] transition-all cursor-pointer ${
              activeTab === 'etablissements'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Établissements
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('recharges')}
            className={`pb-3 px-4 sm:px-8 text-sm sm:text-base font-semibold border-b-2 -mb-[2px] transition-all cursor-pointer ${
              activeTab === 'recharges'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Recharges
          </button>
        </div>
      </div>

      {/* TAB 1: ENSEIGNANTS */}
      {activeTab === 'enseignants' && (
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              Plans pour les enseignants
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
              Flexible, sans engagement, report automatique des corrections
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-stretch">
            {TEACHER_PLANS.map((plan) => {
              const isFeatured = plan.featured;
              return (
                <div
                  key={plan.id}
                  className={`relative flex flex-col justify-between rounded-2xl p-6 sm:p-7 border-2 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg ${
                    isFeatured
                      ? 'border-blue-600 dark:border-blue-500 bg-blue-50/40 dark:bg-blue-950/20 shadow-md'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm'
                  }`}
                >
                  {isFeatured && plan.badge && (
                    <div className="absolute -top-3.5 left-6 bg-blue-600 text-white text-[11px] font-extrabold uppercase px-3 py-1 rounded-full tracking-wider shadow-sm">
                      {plan.badge}
                    </div>
                  )}

                  <div>
                    {/* Header */}
                    <div className="mb-4">
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                        {plan.name}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        {plan.desc}
                      </p>
                    </div>

                    {/* Price Block */}
                    <div className="py-4 border-y border-slate-200 dark:border-slate-800 my-4">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tabular-nums tracking-tight">
                          {currency === 'EUR' ? `${plan.priceEur.toFixed(2)} €` : `${plan.priceFcfa.toLocaleString('fr-FR')} F`}
                        </span>
                        <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                          {plan.periodLabel}
                        </span>
                      </div>
                      <div className="text-xs font-semibold text-blue-700 dark:text-blue-400 mt-1.5">
                        {plan.corrections.toLocaleString('fr-FR')} corrections {plan.periodLabel}
                      </div>
                    </div>

                    {/* Features */}
                    <ul className="space-y-3 py-2 text-xs text-slate-700 dark:text-slate-300">
                      {plan.features.map((feat, idx) => (
                        <li key={idx} className="flex items-start gap-2.5">
                          <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                          <span className="leading-relaxed">{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* CTA */}
                  <div className="mt-8 pt-4">
                    <button
                      type="button"
                      onClick={() => handleOpenCheckout(plan.id)}
                      className={`w-full py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm ${
                        isFeatured
                          ? 'bg-blue-600 hover:bg-blue-700 text-white'
                          : 'bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white'
                      }`}
                    >
                      <span>Essayer maintenant</span>
                      <span>→</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* TAB 2: ÉTABLISSEMENTS */}
      {activeTab === 'etablissements' && (
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-950/70 text-blue-800 dark:text-blue-300 text-xs font-bold mb-3 border border-blue-200 dark:border-blue-800">
              <Building2 className="w-3.5 h-3.5" />
              <span>Solution Officielle Établissements Scolaires</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
              Packs Annuels par Taille d'Établissement & Recharges
            </h2>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 mt-2.5 leading-relaxed">
              Choisissez le forfait calibré selon le nombre d’enseignants de votre collège, lycée ou groupe scolaire. Chaque pack inclut le portail Direction, la gestion centralisée des quotas profs, le grand livre d’audit et l'échelonnement trimestriel en 3 fois.
            </p>
          </div>

          {/* 1. LES 4 PACKS ANNUELS PAR TAILLE D'ÉCOLE */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
            {Object.values(SCHOOL_PLANS).map((plan) => {
              const isSelected = selectedSchoolSize === plan.sizeKey;

              return (
                <div
                  key={plan.id}
                  onClick={() => setSelectedSchoolSize(plan.sizeKey)}
                  className={`relative rounded-3xl p-6 transition-all duration-200 flex flex-col justify-between cursor-pointer border-2 ${
                    isSelected
                      ? 'border-blue-600 bg-gradient-to-b from-blue-50/70 via-white to-white dark:from-blue-950/40 dark:via-slate-900 dark:to-slate-900 shadow-xl ring-2 ring-blue-600/20'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 shadow-sm'
                  }`}
                >
                  {plan.badge && (
                    <div
                      className={`absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] sm:text-[11px] font-black uppercase px-3.5 py-1 rounded-full tracking-wider shadow-sm flex items-center gap-1.5 whitespace-nowrap ${
                        isSelected
                          ? 'bg-blue-600 text-white shadow-blue-500/20'
                          : 'bg-slate-900 text-slate-100 dark:bg-slate-800 border border-slate-700'
                      }`}
                    >
                      <Users className="w-3 h-3 text-blue-400" />
                      <span>{plan.badge}</span>
                    </div>
                  )}

                  <div>
                    {/* Header */}
                    <div className="pt-2 text-center">
                      <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                        {plan.name}
                      </h3>
                    </div>

                    {/* Price Block */}
                    <div className="py-4 border-y border-slate-200 dark:border-slate-800 my-4 text-center">
                      <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tabular-nums tracking-tight">
                        {currency === 'EUR' ? `${plan.priceEur.toLocaleString('fr-FR')} €` : `${plan.priceFcfa.toLocaleString('fr-FR')} F`}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                        par an (année scolaire)
                      </div>
                      <div className="text-xs font-bold text-blue-700 dark:text-blue-400 mt-2">
                        📦 {plan.copiesPerYear.toLocaleString('fr-FR')} copies incluses
                      </div>
                      <div className="mt-2 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 py-1 px-2 rounded-lg">
                        💳 3 × {currency === 'EUR' ? plan.quarterlyEur : plan.quarterlyFcfa} / trim.
                      </div>
                    </div>

                    {/* Features */}
                    <ul className="space-y-2.5 py-2 text-xs text-slate-700 dark:text-slate-300">
                      {plan.features.map((feat, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                          <span className="leading-snug">{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* CTAs */}
                  <div className="mt-6 pt-3 space-y-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenCheckout(plan.id as PaywallPlanId);
                      }}
                      className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm ${
                        isSelected
                          ? 'bg-blue-600 hover:bg-blue-700 text-white'
                          : 'bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white'
                      }`}
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>Souscrire (Paystack / Wave)</span>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedSchoolSize(plan.sizeKey);
                        setSchoolContactForm((prev) => ({
                          ...prev,
                          teachersCount: plan.teachersRange.split('-')[0].replace(/[^0-9]/g, '') || '10',
                        }));
                        setQuoteModalOpen(true);
                      }}
                      className="w-full py-2 px-3 rounded-xl text-xs font-semibold bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5 text-slate-400" />
                      <span>Demander un Devis Proforma</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-4 rounded-2xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 text-center max-w-2xl mx-auto">
            <p className="text-xs text-blue-900 dark:text-blue-200 font-medium">
              📄 <b>Facture certifiée & Bon de commande officiel :</b> émis immédiatement après confirmation, avec numéro d'agrément établissement et possibilité de virement bancaire ou Mobile Money.
            </p>
          </div>

          {/* 2. RECHARGES D'ÉTABLISSEMENT : PALIERS & SUR-MESURE */}
          <div className="rounded-3xl border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-9 shadow-sm space-y-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-6">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold mb-2">
                  <Zap className="w-3 h-3" />
                  <span>Crédits École à la Demande</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                  Recharges de crédits pour établissement
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-xl">
                  Rechargez le pool commun de votre école à tout moment par tranches de 500, 1 000, 2 000 copies ou montant personnalisé.
                </p>
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/60 px-3.5 py-2 rounded-xl">
                💳 Paystack & Mobile Money acceptés sans limite de date
              </div>
            </div>

            {/* Paliers prédéfinis */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {SCHOOL_RECHARGES.map((recharge) => {
                const isSelected = selectedPlanId === recharge.id;
                return (
                  <div
                    key={recharge.id}
                    className={`rounded-2xl p-5 border-2 transition-all flex flex-col justify-between ${
                      recharge.popular
                        ? 'border-blue-600 bg-blue-50/40 dark:bg-blue-950/20 shadow-md'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40'
                    }`}
                  >
                    <div>
                      {recharge.badge && (
                        <span className="inline-block text-[10px] font-extrabold uppercase bg-blue-600 text-white px-2 py-0.5 rounded-md mb-2">
                          {recharge.badge}
                        </span>
                      )}
                      <h4 className="font-bold text-slate-900 dark:text-white text-base">
                        {recharge.name}
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5">{recharge.tag}</p>

                      <div className="my-3.5 pt-3 border-t border-slate-200/80 dark:border-slate-700">
                        <div className="text-2xl font-extrabold text-slate-900 dark:text-white tabular-nums">
                          {currency === 'EUR' ? `${recharge.priceEur} €` : `${recharge.priceFcfa.toLocaleString('fr-FR')} F`}
                        </div>
                        <div className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5">
                          Valable toute l'année scolaire
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleOpenCheckout(recharge.id as PaywallPlanId)}
                      className={`w-full mt-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        recharge.popular
                          ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm'
                          : 'bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white'
                      }`}
                    >
                      <ShoppingCart className="w-3.5 h-3.5" />
                      <span>Recharger ({recharge.copies} copies)</span>
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Calculateur de Recharge Sur-Mesure */}
            <div className="mt-8 p-6 rounded-2xl bg-gradient-to-r from-blue-50/80 via-indigo-50/50 to-slate-50 dark:from-slate-800/70 dark:via-slate-800/50 dark:to-slate-800/70 border border-blue-200 dark:border-slate-700">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex-1 space-y-2">
                  <h4 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-blue-600" />
                    <span>Calculateur de Recharge Établissement Sur-Mesure</span>
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    Ajustez le curseur selon le nombre exact de copies dont vous avez besoin pour vos examens blancs ou trimestres :
                  </p>

                  <div className="pt-3">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5">
                      <span>Volume souhaité :</span>
                      <span className="text-base text-blue-600 dark:text-blue-400 font-black tabular-nums">
                        {schoolCustomCopies.toLocaleString('fr-FR')} corrections
                      </span>
                    </div>
                    <input
                      type="range"
                      min={200}
                      max={10000}
                      step={100}
                      value={schoolCustomCopies}
                      onChange={(e) => setSchoolCustomCopies(Number(e.target.value))}
                      className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                      <span>200 copies (min)</span>
                      <span>2 000 copies</span>
                      <span>5 000 copies</span>
                      <span>10 000 copies (max)</span>
                    </div>
                  </div>
                </div>

                {/* Résultat Calculateur */}
                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-blue-100 dark:border-slate-700 shadow-sm text-center md:text-right shrink-0 min-w-[240px]">
                  <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                    Tarif unitaire : {customRechargeUnitCostFcfa} F / copie
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tabular-nums mt-1">
                    {currency === 'EUR' ? `${customRechargePriceEur} €` : `${customRechargePriceFcfa.toLocaleString('fr-FR')} FCFA`}
                  </div>

                  <div className="mt-3.5 flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        // Prefill contact form notes with custom copies request
                        setSchoolContactForm((prev) => ({
                          ...prev,
                          notes: `Demande de recharge personnalisée pour ${schoolCustomCopies.toLocaleString('fr-FR')} copies (${customRechargePriceFcfa.toLocaleString('fr-FR')} FCFA).`,
                        }));
                        setQuoteModalOpen(true);
                      }}
                      className="w-full py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <FileCheck className="w-3.5 h-3.5" />
                      <span>Commander cette recharge</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* VALUE SECTION (ROI) */}
          <div className="rounded-2xl border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-sm">
            <h3 className="text-lg sm:text-xl font-bold text-center text-slate-900 dark:text-white mb-6">
              Quel est votre retour sur investissement ?
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <div className="text-3xl font-extrabold text-blue-600 dark:text-blue-400">1h</div>
                <div className="text-xs text-slate-600 dark:text-slate-300 mt-1 font-medium">
                  économisée par enseignant chaque jour
                </div>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <div className="text-3xl font-extrabold text-blue-600 dark:text-blue-400">150h</div>
                <div className="text-xs text-slate-600 dark:text-slate-300 mt-1 font-medium">
                  par enseignant par année scolaire
                </div>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <div className="text-3xl font-extrabold text-blue-600 dark:text-blue-400">3 000h</div>
                <div className="text-xs text-slate-600 dark:text-slate-300 mt-1 font-medium">
                  pour 20 professeurs = 1 scolarité complète
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* TAB 3: RECHARGES */}
      {activeTab === 'recharges' && (
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              Recharges et crédits flexibles
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
              Vous avez consommé votre quota ? Rechargez à tout moment. Validité sans date d’expiration.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-stretch">
            {RECHARGE_PACKS.map((pack) => {
              const isFeatured = pack.featured;
              return (
                <div
                  key={pack.id}
                  className={`relative flex flex-col justify-between rounded-2xl p-6 sm:p-7 border-2 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg ${
                    isFeatured
                      ? 'border-blue-600 dark:border-blue-500 bg-blue-50/40 dark:bg-blue-950/20 shadow-md'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm'
                  }`}
                >
                  {isFeatured && pack.badge && (
                    <div className="absolute -top-3.5 left-6 bg-blue-600 text-white text-[11px] font-extrabold uppercase px-3 py-1 rounded-full tracking-wider shadow-sm">
                      {pack.badge}
                    </div>
                  )}

                  <div>
                    {/* Header */}
                    <div className="mb-4">
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                        {pack.name}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        {pack.desc}
                      </p>
                    </div>

                    {/* Price Block */}
                    <div className="py-4 border-y border-slate-200 dark:border-slate-800 my-4">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tabular-nums tracking-tight">
                          {currency === 'EUR' ? `${pack.priceEur.toFixed(2)} €` : `${pack.priceFcfa.toLocaleString('fr-FR')} F`}
                        </span>
                        <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                          paiement unique
                        </span>
                      </div>
                      <div className="text-xs font-semibold text-blue-700 dark:text-blue-400 mt-1.5">
                        {pack.corrections.toLocaleString('fr-FR')} corrections
                      </div>
                      <div className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5">
                        Crédits sans expiration
                      </div>
                    </div>

                    {/* Features */}
                    <ul className="space-y-3 py-2 text-xs text-slate-700 dark:text-slate-300">
                      {pack.features.map((feat, idx) => (
                        <li key={idx} className="flex items-start gap-2.5">
                          <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                          <span className="leading-relaxed">{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* CTA */}
                  <div className="mt-8 pt-4">
                    <button
                      type="button"
                      onClick={() => handleOpenCheckout(pack.id)}
                      className={`w-full py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm ${
                        isFeatured
                          ? 'bg-blue-600 hover:bg-blue-700 text-white'
                          : 'bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white'
                      }`}
                    >
                      <span>Ajouter au panier</span>
                      <span>→</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* FAQ SECTION */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 pb-20 pt-10 border-t-2 border-slate-200 dark:border-slate-800">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-center text-slate-900 dark:text-white mb-8">
          Questions fréquentes
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {FAQ_ITEMS.map((item, idx) => {
            const isOpen = openFaqIndex === idx;
            return (
              <div
                key={idx}
                className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 transition-all duration-150"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                  className="w-full flex items-start justify-between gap-3 text-left font-bold text-xs sm:text-sm text-slate-900 dark:text-white cursor-pointer"
                >
                  <span className="flex-1">{item.q}</span>
                  <span className="text-blue-600 dark:text-blue-400 font-extrabold text-base shrink-0">
                    {isOpen ? '−' : '+'}
                  </span>
                </button>
                {isOpen && (
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 leading-relaxed">
                    {item.a}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* DEVIS MODAL POUR ÉTABLISSEMENT */}
      {quoteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-7 relative">
            <button
              type="button"
              onClick={() => setQuoteModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {quoteSent ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3">
                  <Check className="w-6 h-6 stroke-[3]" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Demande de devis transmise !
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-2">
                  Notre équipe Direction B2B vous contactera sous 24h ouvrées avec votre proposition sur mesure.
                </p>
              </div>
            ) : (
              <>
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                  Devis Établissement Scolaire
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Forfait {currentSchoolPlan.name} ({currentSchoolPlan.copiesPerYear.toLocaleString('fr-FR')} copies / an)
                </p>

                <form onSubmit={handleSendQuote} className="mt-5 space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Nom de l'établissement scolaire *
                    </label>
                    <input
                      type="text"
                      required
                      value={schoolContactForm.schoolName}
                      onChange={(e) => setSchoolContactForm({ ...schoolContactForm, schoolName: e.target.value })}
                      placeholder="Ex: Lycée d'Excellence Sainte-Marie"
                      className="w-full text-xs px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                        Responsable / Direction *
                      </label>
                      <input
                        type="text"
                        required
                        value={schoolContactForm.contactName}
                        onChange={(e) => setSchoolContactForm({ ...schoolContactForm, contactName: e.target.value })}
                        placeholder="M. / Mme le Directeur"
                        className="w-full text-xs px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                        Email professionnel *
                      </label>
                      <input
                        type="email"
                        required
                        value={schoolContactForm.email}
                        onChange={(e) => setSchoolContactForm({ ...schoolContactForm, email: e.target.value })}
                        placeholder="direction@ecole.edu"
                        className="w-full text-xs px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                        Numéro WhatsApp / Téléphone *
                      </label>
                      <input
                        type="tel"
                        required
                        value={schoolContactForm.phone}
                        onChange={(e) => setSchoolContactForm({ ...schoolContactForm, phone: e.target.value })}
                        placeholder="+225 07..."
                        className="w-full text-xs px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                        Nombre d'enseignants
                      </label>
                      <input
                        type="text"
                        value={schoolContactForm.teachersCount}
                        onChange={(e) => setSchoolContactForm({ ...schoolContactForm, teachersCount: e.target.value })}
                        placeholder="Ex: 15 enseignants"
                        className="w-full text-xs px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Besoins particuliers ou message (Optionnel)
                    </label>
                    <textarea
                      rows={2}
                      value={schoolContactForm.notes}
                      onChange={(e) => setSchoolContactForm({ ...schoolContactForm, notes: e.target.value })}
                      placeholder="Ex: Période d'examen, matières prioritaires, formation demandée..."
                      className="w-full text-xs px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>

                  {quoteError && (
                    <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300">
                      {quoteError}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={quoteSubmitting}
                    className="w-full mt-2 py-3 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white transition-all cursor-pointer disabled:opacity-50"
                  >
                    {quoteSubmitting ? 'Transmission en cours...' : 'Envoyer ma demande de devis →'}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}

      {/* CHECKOUT MODAL (PAYSTACK) */}
      {checkoutOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-lg my-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden relative">
            <div className="p-5 sm:p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  Paiement sécurisé · Praxis IA
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Mobile Money (Wave, Orange, MTN, Moov) & Cartes Bancaires
                </p>
              </div>
              <button
                type="button"
                onClick={handleCloseCheckout}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 sm:p-6 space-y-4">
              {/* Selected Plan Summary */}
              <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <span>Formule sélectionnée</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300 uppercase">
                    {isSubscription ? 'Abonnement' : 'Recharge'}
                  </span>
                </div>
                <div className="mt-1 flex items-baseline justify-between">
                  <div>
                    <h4 className="text-base font-bold text-slate-900 dark:text-white">
                      {currentPlanMeta.name}
                    </h4>
                    <span className="text-xs text-blue-700 dark:text-blue-400">
                      {currentPlanMeta.corrections.toLocaleString('fr-FR')} corrections
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-xl font-extrabold text-slate-900 dark:text-white tabular-nums">
                      {currency === 'XOF' ? `${finalPriceFcfa.toLocaleString('fr-FR')} FCFA` : `${finalPriceEur.toFixed(2)} €`}
                    </span>
                  </div>
                </div>
              </div>

              {/* Payment Methods */}
              <div>
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block mb-2">
                  Moyens de paiement acceptés via Paystack :
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                  <div className="p-2 rounded-lg border border-cyan-200 dark:border-cyan-800 bg-cyan-50 dark:bg-cyan-950/30 font-bold text-cyan-900 dark:text-cyan-200">
                    Carte Wave
                  </div>
                  <div className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-slate-900 dark:text-white">
                    Orange Money
                  </div>
                  <div className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-slate-900 dark:text-white">
                    MTN / Moov
                  </div>
                  <div className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-slate-900 dark:text-white">
                    Visa / CB
                  </div>
                </div>

                <div className="mt-2.5 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-[11px] text-amber-900 dark:text-amber-200 space-y-1">
                  <p className="font-bold">💡 Vous utilisez Wave ?</p>
                  <p>
                    Le paiement direct Wave sera bientôt activé. En attendant, vous pouvez utiliser votre <strong>Carte Wave (Visa virtuelle)</strong> directement dans le formulaire Paystack pour régler avec votre solde Wave !
                  </p>
                </div>
              </div>

              {/* Checkout Form */}
              <form id="checkout-form" onSubmit={handleStartPaystackPayment} className="space-y-3 pt-2">
                <div>
                  <label className="text-xs font-semibold text-slate-800 dark:text-slate-200 block mb-1">
                    Adresse email pour recevoir vos crédits *
                  </label>
                  <input
                    type="email"
                    required
                    value={teacherEmail}
                    onChange={(e) => setTeacherEmail(e.target.value)}
                    placeholder="professeur@etablissement.ci"
                    className="w-full text-xs px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-800 dark:text-slate-200 block mb-1">
                      Nom complet (optionnel)
                    </label>
                    <input
                      type="text"
                      value={teacherName}
                      onChange={(e) => setTeacherName(e.target.value)}
                      placeholder="M. / Mme Nom"
                      className="w-full text-xs px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-800 dark:text-slate-200 block mb-1">
                      WhatsApp (optionnel)
                    </label>
                    <input
                      type="tel"
                      value={teacherPhone}
                      onChange={(e) => setTeacherPhone(e.target.value)}
                      placeholder="+225 07..."
                      className="w-full text-xs px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              </form>

              {/* Promo Code Toggle */}
              <div className="border-t border-slate-200 dark:border-slate-800 pt-2">
                {!promoExpanded && !appliedPromo ? (
                  <button
                    type="button"
                    onClick={() => setPromoExpanded(true)}
                    className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                  >
                    Vous avez un code promo ?
                  </button>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                        Code promo
                      </label>
                      {!appliedPromo && (
                        <button
                          type="button"
                          onClick={() => {
                            setPromoExpanded(false);
                            setPromoError('');
                          }}
                          className="text-[11px] text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                          Annuler
                        </button>
                      )}
                    </div>

                    {appliedPromo ? (
                      <div className="flex items-center justify-between p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300">
                        <div className="flex items-center gap-2">
                          <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                          <span>
                            {appliedPromo.discountPercent > 0 ? (
                              <>Code <strong>{appliedPromo.code}</strong> appliqué (-{appliedPromo.discountPercent}%)</>
                            ) : (
                              <>Code affilié <strong>{appliedPromo.code}</strong> activé :</>
                            )}
                            {appliedPromo.bonusCredits ? (
                              <span className="font-bold text-blue-700 dark:text-blue-300"> 🎁 +{appliedPromo.bonusCredits} crédits bonus offerts !</span>
                            ) : null}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setAppliedPromo(null)}
                          className="text-[11px] font-medium text-emerald-900 dark:text-emerald-200 underline cursor-pointer"
                        >
                          Retirer
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={promoCodeInput}
                          onChange={(e) => setPromoCodeInput(e.target.value.toUpperCase())}
                          placeholder="Ex: PRAXIS30"
                          className="flex-1 text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono uppercase"
                        />
                        <button
                          type="button"
                          disabled={isValidatingPromo || !promoCodeInput.trim()}
                          onClick={() => applyPromoCode(promoCodeInput)}
                          className="px-3 py-2 text-xs font-bold rounded-lg bg-slate-900 text-white dark:bg-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 disabled:opacity-50 transition-colors cursor-pointer"
                        >
                          {isValidatingPromo ? '...' : 'Appliquer'}
                        </button>
                      </div>
                    )}

                    {promoError && (
                      <p className="text-[11px] text-red-600 dark:text-red-400">
                        {promoError}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {errorMsg && (
                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs text-red-700 dark:text-red-300">
                  {errorMsg}
                </div>
              )}

              {/* Submit CTA */}
              <div className="pt-2">
                <button
                  type="submit"
                  form="checkout-form"
                  disabled={isProcessing}
                  className="w-full py-3 px-4 rounded-xl text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-60 transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isProcessing ? (
                    <span>Connexion à Paystack...</span>
                  ) : (
                    <>
                      <span>Payer {currency === 'XOF' ? `${finalPriceFcfa.toLocaleString('fr-FR')} FCFA` : `${finalPriceEur.toFixed(2)} €`}</span>
                      <span>→</span>
                    </>
                  )}
                </button>
                <div className="flex items-center justify-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 mt-2">
                  <Lock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Paiement chiffré 256-bit opéré par Paystack · Validation instantanée</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
