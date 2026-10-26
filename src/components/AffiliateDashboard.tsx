import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  DollarSign,
  TrendingUp,
  Calendar,
  Copy,
  Check,
  Download,
  FileText,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
  Send,
  Building2,
  GraduationCap,
  Percent,
  Award,
  Wallet,
  Phone,
  Mail,
  ShieldCheck,
  RefreshCw,
  Search,
  Filter,
  ExternalLink,
  Info,
  X,
  CreditCard,
} from 'lucide-react';
import jsPDF from 'jspdf';
import { useTheme } from '../lib/useTheme';
import { AffiliateData, AffiliateClient, MainView } from '../types';

const DEMO_MOCK_CODES = [
  'KOFFI-2024-XYZ123',
  'DIALLO-2024-EDU456',
  'YAO-2024-VIP789',
  'GBAGBO-2024-NEW001',
  'DEMO',
];

interface AffiliateDashboardProps {
  onNavigate?: (view: MainView) => void;
  affiliateCodeProp?: string;
  currentUserEmail?: string;
  currentUserRole?: string;
}

export const AffiliateDashboard: React.FC<AffiliateDashboardProps> = ({
  onNavigate,
  affiliateCodeProp,
  currentUserEmail,
  currentUserRole,
}) => {
  const { isDark } = useTheme();

  // État des données affilié
  const [loading, setLoading] = useState<boolean>(true);
  const [data, setData] = useState<AffiliateData | null>(null);
  const [error, setError] = useState<string>('');

  // États d'interactions
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  // Filtre et recherche du tableau
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'Tous' | 'Payé' | 'En attente' | 'Non facturé'>('Tous');
  const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'amount-desc' | 'commission-desc'>('date-desc');

  // Modals
  const [isPayoutModalOpen, setIsPayoutModalOpen] = useState<boolean>(false);
  const [isContractModalOpen, setIsContractModalOpen] = useState<boolean>(false);
  const [isSupportModalOpen, setIsSupportModalOpen] = useState<boolean>(false);

  // Formulaire de retrait (Payout - aucun seuil minimum requis)
  const [payoutAmount, setPayoutAmount] = useState<number>(0);
  const [payoutMethod, setPayoutMethod] = useState<'Wave' | 'Orange Money' | 'Moov Money' | 'Virement Bancaire'>('Wave');
  const [payoutPhoneOrIban, setPayoutPhoneOrIban] = useState<string>('+225 07 48 92 11 30');
  const [payoutNotes, setPayoutNotes] = useState<string>('');
  const [payoutLoading, setPayoutLoading] = useState<boolean>(false);
  const [payoutSuccessMsg, setPayoutSuccessMsg] = useState<string>('');
  const [payoutErrorMsg, setPayoutErrorMsg] = useState<string>('');

  // Formulaire support
  const [supportMessage, setSupportMessage] = useState<string>('');
  const [supportLoading, setSupportLoading] = useState<boolean>(false);
  const [supportSuccessMsg, setSupportSuccessMsg] = useState<string>('');

  // FAQ Collapsible
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  // Code affilié sélectionné et contrôle d'autorisation (Strictement verrouillé par défaut)
  const [activeCode, setActiveCode] = useState<string>(() => {
    try {
      const stored = localStorage.getItem('praxis_affiliate_code');
      if (stored && DEMO_MOCK_CODES.includes(stored.toUpperCase())) {
        localStorage.removeItem('praxis_affiliate_code');
      }
      const search = new URLSearchParams(window.location.search);
      const qCode = search.get('code') || search.get('affiliate');
      if (qCode && qCode.trim() && !DEMO_MOCK_CODES.includes(qCode.trim().toUpperCase())) {
        return qCode.trim().toUpperCase();
      }
      if (window.location.hash && window.location.hash.includes('?')) {
        const hp = new URLSearchParams(window.location.hash.split('?')[1]);
        const hCode = hp.get('code') || hp.get('affiliate');
        if (hCode && hCode.trim() && !DEMO_MOCK_CODES.includes(hCode.trim().toUpperCase())) {
          return hCode.trim().toUpperCase();
        }
      }
      const validStored = localStorage.getItem('praxis_affiliate_code');
      if (validStored && !DEMO_MOCK_CODES.includes(validStored.toUpperCase())) {
        return validStored;
      }
    } catch {}
    return '';
  });

  const [isAuthorized, setIsAuthorized] = useState<boolean>(false);
  const [customInputCode, setCustomInputCode] = useState<string>('');
  const [showSwitchCode, setShowSwitchCode] = useState<boolean>(false);

  // Détection du lien d'invitation (?invite=XYZ ou ?token=XYZ)
  const [inviteTokenParam] = useState<string>(() => {
    try {
      const search = new URLSearchParams(window.location.search);
      let t = search.get('invite') || search.get('token');
      if (!t && window.location.hash) {
        const hashQuery = window.location.hash.includes('?') ? window.location.hash.split('?')[1] : '';
        if (hashQuery) {
          const hp = new URLSearchParams(hashQuery);
          t = hp.get('invite') || hp.get('token');
        }
      }
      return t || '';
    } catch {
      return '';
    }
  });

  // États d'inscription pour ambassadeur autorisé ou invité
  const [isRegisterMode, setIsRegisterMode] = useState<boolean>(false);
  const [verifiedInvite, setVerifiedInvite] = useState<any>(null);
  const [verifyNotice, setVerifyNotice] = useState<string>('');
  const [registerForm, setRegisterForm] = useState({
    name: '',
    email: '',
    phone: '',
    code: '',
    paymentMethod: 'Wave' as 'Wave' | 'Orange Money' | 'Moov Money' | 'Virement Bancaire',
    phoneOrIban: '',
  });
  const [registerLoading, setRegisterLoading] = useState<boolean>(false);
  const [registerError, setRegisterError] = useState<string>('');

  // Formulaire de candidature pour devenir ambassadeur
  const [applyForm, setApplyForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    channel: '',
    audience: '',
    message: '',
  });
  const [applyLoading, setApplyLoading] = useState(false);
  const [applySuccessMsg, setApplySuccessMsg] = useState('');
  const [applyErrorMsg, setApplyErrorMsg] = useState('');

  // Vérifier un code ou une adresse email ou un lien d'invitation
  const handleVerifyAccess = async (inputStr: string, specificInviteToken?: string) => {
    const clean = inputStr.trim();
    const tokenToVerify = specificInviteToken || inviteTokenParam;
    if (!clean && !tokenToVerify) return;

    setError('');
    setVerifyNotice('');
    setLoading(true);

    try {
      const res = await fetch('/api/affiliate/verify-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input: clean,
          inviteToken: tokenToVerify || undefined,
        }),
      });
      const result = await res.json();

      if (!res.ok || !result.authorized) {
        throw new Error(result.error || 'Accès restreint. Seuls les ambassadeurs sélectionnés ont accès.');
      }

      if (result.type === 'existing_affiliate') {
        fetchAffiliateData(result.code);
      } else if (result.type === 'authorized_email_ready_to_register') {
        setRegisterForm((prev) => ({ ...prev, email: result.email }));
        setVerifyNotice('✓ Votre adresse email est bien autorisée par la direction ! Complétez vos informations pour activer votre espace.');
        setIsRegisterMode(true);
      } else if (result.type === 'invite') {
        setVerifiedInvite(result.invite);
        setVerifyNotice(`✓ Lien d'invitation officiel validé (« ${result.invite.label} » — Taux commission : ${result.invite.commissionRate}%).`);
        setIsRegisterMode(true);
      }
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la vérification.');
    } finally {
      setLoading(false);
    }
  };

  // Inscription finalisée d'un ambassadeur autorisé
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterError('');
    setRegisterLoading(true);

    try {
      const res = await fetch('/api/affiliate/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: registerForm.name,
          email: registerForm.email,
          phone: registerForm.phone,
          code: registerForm.code || undefined,
          inviteToken: verifiedInvite?.token || inviteTokenParam || undefined,
          paymentMethod: registerForm.paymentMethod,
          phoneOrIban: registerForm.phoneOrIban,
        }),
      });
      const resData = await res.json();
      if (!res.ok || !resData.success) {
        throw new Error(resData.error || 'Erreur lors de l’inscription.');
      }

      setData(resData.affiliate);
      setActiveCode(resData.code);
      setIsAuthorized(true);
      localStorage.setItem('praxis_affiliate_code', resData.code);
      sessionStorage.setItem('praxis_affiliate_authorized', 'true');
      setIsRegisterMode(false);
    } catch (err: any) {
      setRegisterError(err.message || 'Erreur lors de l’inscription.');
    } finally {
      setRegisterLoading(false);
    }
  };

  // Charger les données réelles de l'affilié
  const fetchAffiliateData = async (codeToFetch?: string) => {
    const code = (codeToFetch || activeCode).trim().toUpperCase().replace(/[’‘`´]/g, "'");
    if (!code) {
      setLoading(false);
      setIsAuthorized(false);
      return;
    }
    try {
      setLoading(true);
      setError('');
      const res = await fetch(`/api/affiliate/${encodeURIComponent(code)}`);
      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.error || 'Code partenaire non reconnu.');
      }
      setData(result.data);
      setActiveCode(code);
      setIsAuthorized(true);
      localStorage.setItem('praxis_affiliate_code', code);
      sessionStorage.setItem('praxis_affiliate_authorized', 'true');
      if (result.data?.pendingBalance) {
        setPayoutAmount(result.data.pendingBalance);
      }
    } catch (err: any) {
      console.error('[AffiliateDashboard] Erreur chargement :', err);
      setError(err.message || 'Erreur lors du chargement des statistiques.');
      setIsAuthorized(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Nettoyage proactif de tout ancien code de démonstration
    try {
      const stored = localStorage.getItem('praxis_affiliate_code');
      if (stored && DEMO_MOCK_CODES.includes(stored.toUpperCase())) {
        localStorage.removeItem('praxis_affiliate_code');
      }
    } catch {}

    // 1. Si un lien d'invitation avec token (?invite=VIP-XXX) est dans l'URL
    if (inviteTokenParam) {
      handleVerifyAccess('', inviteTokenParam);
      return;
    }

    // 2. Si un code actif spécifique et légitime est fourni (hors démo)
    const validStored = typeof window !== 'undefined' ? localStorage.getItem('praxis_affiliate_code') : null;
    const cleanActiveCode = (activeCode || affiliateCodeProp || validStored || '').trim().toUpperCase();

    if (cleanActiveCode && !DEMO_MOCK_CODES.includes(cleanActiveCode)) {
      handleVerifyAccess(cleanActiveCode);
      return;
    }

    // 3. Si l'utilisateur connecté est un partenaire, affilié ou administrateur
    if (currentUserEmail && (currentUserRole === 'partner' || currentUserRole === 'affiliate' || currentUserRole === 'ambassadeur' || currentUserRole === 'admin' || Boolean(affiliateCodeProp))) {
      handleVerifyAccess(affiliateCodeProp || currentUserEmail);
      return;
    }

    // Si l'utilisateur connecté tente d'accéder à l'espace ambassadeur avec son adresse email
    if (currentUserEmail && currentUserEmail !== 'professeur@praxis.edu') {
      handleVerifyAccess(currentUserEmail);
      return;
    }

    // 4. Par défaut pour un utilisateur normal non affilié : accès verrouillé, afficher écran de sélection/candidature
    setLoading(false);
    setIsAuthorized(false);
  }, [activeCode, affiliateCodeProp, inviteTokenParam, currentUserEmail, currentUserRole]);

  // Quitter / Verrouiller l'espace partenaire
  const handleLogoutPartner = () => {
    localStorage.removeItem('praxis_affiliate_code');
    sessionStorage.removeItem('praxis_affiliate_authorized');
    setData(null);
    setIsAuthorized(false);
    setActiveCode('');
    setError('');
  };

  // Soumission candidature ambassadeur
  const handleApplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApplyErrorMsg('');
    setApplySuccessMsg('');

    if (!applyForm.fullName.trim() || !applyForm.email.trim() || !applyForm.phone.trim()) {
      setApplyErrorMsg('Le nom, l’email et le numéro WhatsApp sont requis.');
      return;
    }

    setApplyLoading(true);
    try {
      const res = await fetch('/api/affiliate/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(applyForm),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Erreur lors de l’envoi de votre demande.');
      }
      setApplySuccessMsg(data.message || 'Votre demande d’autorisation a été transmise à la direction.');
      setApplyForm({ fullName: '', email: '', phone: '', channel: '', audience: '', message: '' });
    } catch (err: any) {
      setApplyErrorMsg(err.message || 'Erreur réseau.');
    } finally {
      setApplyLoading(false);
    }
  };

  // Copier le code promo
  const handleCopyCode = () => {
    if (!data?.affiliateCode) return;
    try {
      navigator.clipboard.writeText(data.affiliateCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2500);
    } catch {}
  };

  // Copier le lien de parrainage complet
  const handleCopyLink = () => {
    if (!data?.affiliateCode) return;
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://praxis-pro.pro';
    const link = `${origin}/?ref=${encodeURIComponent(data.affiliateCode)}`;
    try {
      navigator.clipboard.writeText(link);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {}
  };

  // Filtrage et tri des clients
  const filteredClients = useMemo(() => {
    if (!data?.clients) return [];
    let list = [...data.clients];

    // Recherche
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.plan.toLowerCase().includes(q) ||
          (c.city && c.city.toLowerCase().includes(q))
      );
    }

    // Statut
    if (statusFilter !== 'Tous') {
      list = list.filter((c) => c.status === statusFilter);
    }

    // Tri
    list.sort((a, b) => {
      if (sortBy === 'date-desc') return new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime();
      if (sortBy === 'date-asc') return new Date(a.paymentDate).getTime() - new Date(b.paymentDate).getTime();
      if (sortBy === 'amount-desc') return b.amountReceived - a.amountReceived;
      if (sortBy === 'commission-desc') return b.commissionEarned - a.commissionEarned;
      return 0;
    });

    return list;
  }, [data?.clients, searchQuery, statusFilter, sortBy]);

  // Demander un versement
  const handleRequestPayout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data) return;
    setPayoutLoading(true);
    setPayoutErrorMsg('');
    setPayoutSuccessMsg('');

    try {
      const res = await fetch('/api/affiliate/payout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          affiliateCode: data.affiliateCode,
          amount: payoutAmount,
          paymentMethod: payoutMethod,
          phoneOrIban: payoutPhoneOrIban,
          notes: payoutNotes,
        }),
      });

      const resData = await res.json();
      if (!res.ok || !resData.success) {
        throw new Error(resData.error || 'Erreur lors de la demande de versement.');
      }

      setPayoutSuccessMsg(resData.message || 'Demande de versement validée avec succès !');
      // Rafraîchir les données
      fetchAffiliateData();
      setTimeout(() => {
        setIsPayoutModalOpen(false);
        setPayoutSuccessMsg('');
      }, 3000);
    } catch (err: any) {
      setPayoutErrorMsg(err.message || 'Échec de la demande.');
    } finally {
      setPayoutLoading(false);
    }
  };

  // Contacter le support
  const handleSendSupport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data || !supportMessage.trim()) return;
    setSupportLoading(true);

    try {
      const res = await fetch('/api/affiliate/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          affiliateCode: data.affiliateCode,
          affiliateName: data.affiliateName,
          email: data.email,
          message: supportMessage.trim(),
        }),
      });

      const resData = await res.json();
      if (!res.ok || !resData.success) {
        throw new Error(resData.error || 'Erreur lors de l’envoi.');
      }

      setSupportSuccessMsg('Votre message a bien été envoyé ! Nous vous répondrons dans les plus brefs délais.');
      setSupportMessage('');
      setTimeout(() => {
        setIsSupportModalOpen(false);
        setSupportSuccessMsg('');
      }, 2500);
    } catch (err: any) {
      alert(err.message || 'Erreur envoi message support');
    } finally {
      setSupportLoading(false);
    }
  };

  // Téléchargement du relevé des commissions en PDF
  const handleExportPDF = () => {
    if (!data) return;

    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();

      // En-tête
      doc.setFillColor(2, 132, 199); // Blue Praxis
      doc.rect(0, 0, pageWidth, 28, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('PRAXIS PRO · RELEVÉ DES COMMISSIONS AFFILIÉ', 14, 18);

      // Informations affilié
      doc.setTextColor(51, 65, 85);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Affilié : ${data.affiliateName}`, 14, 38);
      doc.text(`Code Promotionnel : ${data.affiliateCode}`, 14, 44);
      doc.text(`Taux de commission : ${data.commissionRate}%`, 14, 50);
      doc.text(`Date d'export : ${new Date().toLocaleDateString('fr-FR')}`, 14, 56);

      // Résumé financier
      doc.text(`Total clients générés : ${data.totalClientsGenerated}`, pageWidth - 14, 38, { align: 'right' });
      doc.text(`Commission totale accumulée : ${data.totalCommissionAccumulated.toLocaleString('fr-FR')} FCFA`, pageWidth - 14, 44, { align: 'right' });
      doc.text(`Solde disponible : ${data.pendingBalance.toLocaleString('fr-FR')} FCFA`, pageWidth - 14, 50, { align: 'right' });

      // Ligne séparatrice
      doc.setDrawColor(203, 213, 225);
      doc.line(14, 62, pageWidth - 14, 62);

      // En-tête tableau
      let y = 72;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.text('Client / Établissement', 14, y);
      doc.text('Forfait', 80, y);
      doc.text('Montant Payé', 125, y);
      doc.text('Commission', 158, y);
      doc.text('Statut', 185, y);

      doc.line(14, y + 3, pageWidth - 14, y + 3);
      y += 9;

      doc.setFont('helvetica', 'normal');
      (data.clients || []).forEach((c, idx) => {
        if (y > 270) {
          doc.addPage();
          y = 20;
        }

        const nameTruncated = c.name.length > 32 ? c.name.slice(0, 30) + '...' : c.name;
        doc.text(nameTruncated, 14, y);
        doc.text(c.plan, 80, y);
        doc.text(`${c.amountReceived.toLocaleString('fr-FR')} F`, 125, y);
        doc.text(`${c.commissionEarned.toLocaleString('fr-FR')} F`, 158, y);
        doc.text(c.status, 185, y);

        y += 7;
      });

      // Pied de page
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text('Ce relevé est confidentiel et certifié par PRAXIS PRO (praxis-pro.pro). Tous droits réservés.', 14, 288);

      doc.save(`Releve_Commissions_${data.affiliateCode}_${Date.now()}.pdf`);
    } catch (err) {
      console.error('Erreur export PDF :', err);
      alert('Erreur lors de la génération du PDF.');
    }
  };

  // Liste FAQ
  const faqItems = [
    {
      q: 'Comment gagne-t-on des commissions sur Praxis ?',
      a: 'Dès qu’un enseignant ou un établissement scolaire s’abonne ou achète un pack de crédits en renseignant votre code promotionnel, vous percevez automatiquement 20% (ou 25% dès le 20ème client) du montant total hors taxe de chaque paiement réalisé.',
    },
    {
      q: 'Quand et comment serai-je payé ?',
      a: 'Les versements s’effectuent sous 24h à 48h ouvrées dès votre demande. Vous recevez vos fonds directement sur votre compte Wave, Orange Money, Moov Money ou par virement bancaire.',
    },
    {
      q: 'Puis-je demander un versement immédiat ?',
      a: 'Oui ! Vous pouvez demander le retrait de vos commissions à tout moment, quel que soit le montant (aucun seuil minimum imposé). Cliquez simplement sur « Demander un versement » dès que vous avez un solde.',
    },
    {
      q: 'Comment partager mon code et maximiser mes conversions ?',
      a: 'Partagez votre lien de parrainage direct ou votre code promo lors de vos échanges avec les collègues enseignants, proviseurs ou directeurs d’études. Votre code offre un bonus immédiat de +100 corrections d’essai gratuites au client, ce qui incite fortement à l’utiliser !',
    },
    {
      q: 'Comment passer au palier VIP de 25% ?',
      a: 'Dès que vous cumulez 20 clients actifs (écoles ou professeurs abonnés), votre taux de commission passe automatiquement et définitivement de 20% à 25% sur l’ensemble de vos futures ventes.',
    },
  ];

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4">
        <RefreshCw className="w-10 h-10 text-blue-600 animate-spin" />
        <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
          Chargement de votre espace affilié en temps réel...
        </p>
      </div>
    );
  }

  if (!isAuthorized || !data) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 space-y-10 animate-in fade-in duration-300">
        {/* Header Hero */}
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-xs font-bold">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
            <span>Accès Privé Partenaires & Influenceurs</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Programme Ambassadeurs & Influenceurs Praxis
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            Un programme sélectif à forte valeur ajoutée. Recommandez l’IA de correction Praxis à votre communauté d’enseignants et percevez <strong>20% à 25% de commissions récurrentes</strong> sur chaque abonnement.
          </p>
        </div>

        {/* 2-Columns Grid: Login vs Application */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          {/* Card 1: Accès Privé ou Inscription Ambassadeur Sélectionné */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 shadow-sm border border-slate-200 dark:border-slate-800 space-y-5">
            {isRegisterMode ? (
              <div className="space-y-4 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                        Sélection Validée
                      </span>
                      <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                        Activer votre Espace Ambassadeur
                      </h3>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsRegisterMode(false)}
                    className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
                  >
                    ✕ Annuler
                  </button>
                </div>

                {verifyNotice && (
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-800 dark:text-emerald-200">
                    {verifyNotice}
                  </div>
                )}

                {registerError && (
                  <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl text-xs text-rose-700 dark:text-rose-300">
                    {registerError}
                  </div>
                )}

                <form onSubmit={handleRegisterSubmit} className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Nom complet & Titre *
                    </label>
                    <input
                      type="text"
                      value={registerForm.name}
                      onChange={(e) => setRegisterForm({ ...registerForm, name: e.target.value })}
                      placeholder="Ex : Prof. Julie Touré"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Adresse Email *
                      </label>
                      <input
                        type="email"
                        value={registerForm.email}
                        onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                        placeholder="julie.prof@gmail.com"
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Numéro WhatsApp *
                      </label>
                      <input
                        type="tel"
                        value={registerForm.phone}
                        onChange={(e) => setRegisterForm({ ...registerForm, phone: e.target.value })}
                        placeholder="+225 07 00 00 00"
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Code Promo Souhaité (Optionnel)
                    </label>
                    <input
                      type="text"
                      value={registerForm.code}
                      onChange={(e) => setRegisterForm({ ...registerForm, code: e.target.value.toUpperCase().replace(/[^A-Z0-9']/g, '') })}
                      placeholder="Ex : JULIE10 (généré automatiquement sinon)"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white uppercase font-mono"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Moyen de Versement Préféré
                      </label>
                      <select
                        value={registerForm.paymentMethod}
                        onChange={(e) => setRegisterForm({ ...registerForm, paymentMethod: e.target.value as any })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                      >
                        <option value="Wave">Wave</option>
                        <option value="Orange Money">Orange Money</option>
                        <option value="Moov Money">Moov Money</option>
                        <option value="Virement Bancaire">Virement Bancaire</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Numéro ou RIB de paiement
                      </label>
                      <input
                        type="text"
                        value={registerForm.phoneOrIban}
                        onChange={(e) => setRegisterForm({ ...registerForm, phoneOrIban: e.target.value })}
                        placeholder="+225 07 00 00 00"
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={registerLoading}
                    className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-50 mt-2"
                  >
                    {registerLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                    <span>Activer mon profil & Accéder à mes gains</span>
                  </button>
                </form>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                      Accès Ambassadeur Sélectionné
                    </h3>
                    <p className="text-xs text-slate-500">
                      Entrez avec votre email autorisé, code promo ou jeton d'invitation
                    </p>
                  </div>
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (customInputCode.trim()) {
                      handleVerifyAccess(customInputCode.trim());
                    }
                  }}
                  className="space-y-3 pt-2"
                >
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Votre Email autorisé, Code Partenaire ou Invitation :
                    </label>
                    <input
                      type="text"
                      value={customInputCode}
                      onChange={(e) => setCustomInputCode(e.target.value)}
                      placeholder="Ex : julie.prof@gmail.com, PRAXIS10, VIP-AMBASSADEUR-2026"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-xs focus:ring-2 focus:ring-blue-500 outline-hidden"
                      required
                    />
                  </div>

                  {error && (
                    <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl text-xs text-rose-700 dark:text-rose-300 leading-relaxed">
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
                  >
                    {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    <span>Vérifier mon accès & Entrer</span>
                  </button>
                </form>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block">
                    🔒 Accès restreint sur sélection :
                  </span>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    Seule une poignée d'ambassadeurs sélectionnés par la direction disposent d'un accès. Si vous ne possédez pas encore d'invitation ou d'email enregistré, vous pouvez candidater ci-contre.
                  </p>
                  <div className="p-3 bg-indigo-50/70 dark:bg-indigo-950/40 rounded-xl border border-indigo-200/70 dark:border-indigo-800/60 mt-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300 block mb-1">
                      Contact VIP Influenceurs & Créateurs
                    </span>
                    <p className="text-xs text-indigo-900 dark:text-indigo-200">
                      Écrivez directement à : <a href="mailto:influenceurs@praxis-pro.pro" className="font-bold text-blue-600 dark:text-blue-400 underline">influenceurs@praxis-pro.pro</a>
                    </p>
                    <span className="text-[10px] text-indigo-600 dark:text-indigo-400 block mt-0.5">
                      Mise en place de votre partenariat et code promo sous 2 heures.
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Card 2: Demander l'autorisation d'Ambassadeur */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 shadow-sm border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                <Send className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                  Demander l'autorisation
                </h3>
                <p className="text-xs text-slate-500">
                  Réservé aux créateurs de contenu & influenceurs
                </p>
              </div>
            </div>

            {applySuccessMsg ? (
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 rounded-2xl text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                <h4 className="font-bold text-sm text-emerald-900 dark:text-emerald-200">
                  Candidature transmise avec succès !
                </h4>
                <p className="text-xs text-emerald-700 dark:text-emerald-300">
                  {applySuccessMsg}
                </p>
                <p className="text-[11px] text-slate-500 pt-2">
                  Contact direct : <a href="mailto:influenceurs@praxis-pro.pro" className="font-bold text-blue-600 hover:underline">influenceurs@praxis-pro.pro</a>
                </p>
              </div>
            ) : (
              <form onSubmit={handleApplySubmit} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-0.5">
                      Nom & Prénom *
                    </label>
                    <input
                      type="text"
                      value={applyForm.fullName}
                      onChange={(e) => setApplyForm({ ...applyForm, fullName: e.target.value })}
                      placeholder="Jean Kouassi"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-0.5">
                      Email *
                    </label>
                    <input
                      type="email"
                      value={applyForm.email}
                      onChange={(e) => setApplyForm({ ...applyForm, email: e.target.value })}
                      placeholder="contact@influenceur.ci"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-0.5">
                      WhatsApp *
                    </label>
                    <input
                      type="text"
                      value={applyForm.phone}
                      onChange={(e) => setApplyForm({ ...applyForm, phone: e.target.value })}
                      placeholder="+225 07 00 00 00 00"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-0.5">
                      Réseau / Canal
                    </label>
                    <input
                      type="text"
                      value={applyForm.channel}
                      onChange={(e) => setApplyForm({ ...applyForm, channel: e.target.value })}
                      placeholder="TikTok, YouTube, Facebook..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-0.5">
                    Audience / Communauté estimée
                  </label>
                  <input
                    type="text"
                    value={applyForm.audience}
                    onChange={(e) => setApplyForm({ ...applyForm, audience: e.target.value })}
                    placeholder="Ex : 15 000 abonnés enseignants, 10 écoles partenaires..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-0.5">
                    Message / Présentation de votre projet
                  </label>
                  <textarea
                    rows={2}
                    value={applyForm.message}
                    onChange={(e) => setApplyForm({ ...applyForm, message: e.target.value })}
                    placeholder="Présentez brièvement vos activités et vos canaux de diffusion..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white resize-none"
                  />
                </div>

                {applyErrorMsg && (
                  <p className="text-xs text-rose-600 font-semibold">{applyErrorMsg}</p>
                )}

                <button
                  type="submit"
                  disabled={applyLoading}
                  className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
                >
                  {applyLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  <span>Soumettre ma demande d'autorisation</span>
                </button>
              </form>
            )}

            <div className="pt-2 text-center text-[11px] text-slate-400">
              Email direct : <a href="mailto:influenceurs@praxis-pro.pro" className="font-semibold text-blue-600 dark:text-blue-400 hover:underline">influenceurs@praxis-pro.pro</a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const isEligibleForPayout = (data.pendingBalance ?? 0) > 0;
  const missingForPayout = 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-300">
      {/* 1. EN-TÊTE PRINCIPAL */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 dark:border-slate-800 relative overflow-hidden">
        {/* Glow ambient background */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-blue-500/10 via-indigo-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800">
                Partenaire Certifié Praxis
              </span>
              <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Suivi Temps Réel
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Bonjour, {data.affiliateName} 👋
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-xl">
              Bienvenue sur votre espace affilié personnel. Suivez chaque conversion, encaissez vos commissions et gérez vos versements en temps réel.
            </p>

            {/* Quick Switcher for Testing / Partner Selection */}
            <div className="flex items-center gap-2 pt-2 flex-wrap">
              <span className="text-[11px] font-bold text-slate-400">Compte affilié affiché :</span>
              <button
                type="button"
                onClick={() => fetchAffiliateData('PRAXIS10')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                  activeCode === 'PRAXIS10'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                Praxis10
              </button>
              <button
                type="button"
                onClick={() => fetchAffiliateData("L'ENSEIGNANT10")}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                  activeCode === "L'ENSEIGNANT10"
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                L'enseignant10
              </button>
              <button
                type="button"
                onClick={() => setShowSwitchCode(!showSwitchCode)}
                className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 border border-slate-200 dark:border-slate-700 cursor-pointer"
              >
                {showSwitchCode ? '✕ Annuler' : '🔍 Autre code...'}
              </button>
            </div>
            {showSwitchCode && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (customInputCode.trim()) {
                    fetchAffiliateData(customInputCode.trim());
                    setShowSwitchCode(false);
                    setCustomInputCode('');
                  }
                }}
                className="flex items-center gap-2 pt-1 animate-in fade-in"
              >
                <input
                  type="text"
                  value={customInputCode}
                  onChange={(e) => setCustomInputCode(e.target.value)}
                  placeholder="Code affilié (ex: PROFJEAN)"
                  className="px-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white uppercase font-mono font-bold"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  Charger
                </button>
              </form>
            )}
          </div>

          {/* Action Hub: Code promo cliquable & boutons d'action */}
          <div className="w-full lg:w-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Box Code Promo */}
            <div className="flex items-center justify-between gap-3 p-2.5 sm:px-4 sm:py-2.5 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Votre Code Promo
                </span>
                <span className="text-sm sm:text-base font-black font-mono text-blue-600 dark:text-blue-400">
                  {data.affiliateCode}
                </span>
              </div>
              <div className="flex items-center gap-1.5 pl-2 border-l border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:text-blue-600 hover:bg-white dark:hover:bg-slate-700 transition shadow-xs cursor-pointer"
                  title="Copier le code"
                >
                  {copiedCode ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                </button>
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:text-blue-600 hover:bg-white dark:hover:bg-slate-700 transition shadow-xs cursor-pointer"
                  title="Copier le lien complet"
                >
                  {copiedLink ? <Check className="w-4 h-4 text-emerald-600" /> : <ExternalLink className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Bouton Conditions & Contrat */}
            <button
              type="button"
              onClick={() => setIsContractModalOpen(true)}
              className="px-4 py-2.5 rounded-2xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold border border-slate-200 dark:border-slate-700 shadow-xs transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <FileText className="w-4 h-4 text-slate-500" />
              <span>Conditions</span>
            </button>

            {/* Bouton Export PDF */}
            <button
              type="button"
              onClick={handleExportPDF}
              className="px-4 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 text-xs font-bold shadow-xs transition flex items-center justify-center gap-2 cursor-pointer"
              title="Télécharger le relevé en PDF"
            >
              <Download className="w-4 h-4" />
              <span>PDF</span>
            </button>

            {/* Bouton Verrouiller / Quitter */}
            <button
              type="button"
              onClick={handleLogoutPartner}
              className="px-3.5 py-2.5 rounded-2xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 text-xs font-bold border border-rose-200 dark:border-rose-900 shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
              title="Verrouiller l'espace partenaire"
            >
              <X className="w-4 h-4" />
              <span>Verrouiller</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. SECTION STATS PRINCIPALES (4 CARTES CÔTE À CÔTE) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Carte 1 : Total Clients Générés */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:border-blue-500/50 transition">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Clients Générés
            </span>
            <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-xs">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-3xl font-black text-slate-900 dark:text-white tabular-nums">
              {data.totalClientsGenerated}
            </div>
            <p className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1">
              <span>{data.clientsUntilPalier > 0 ? `Plus que ${data.clientsUntilPalier} clients pour 25%` : 'Palier VIP atteint (25%)'}</span>
            </p>
          </div>
        </div>

        {/* Carte 2 : Commission Totale Accumulée */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:border-emerald-500/50 transition">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Commission Totale
            </span>
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-xs">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
              {(data.totalCommissionAccumulated ?? 0).toLocaleString('fr-FR')}{' '}
              <span className="text-sm font-bold text-slate-500">FCFA</span>
            </div>
            <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              Solde disponible : <strong className="text-slate-800 dark:text-slate-200">{(data.pendingBalance ?? 0).toLocaleString('fr-FR')} FCFA</strong>
            </p>
          </div>
        </div>

        {/* Carte 3 : Dernier Paiement Reçu */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:border-indigo-500/50 transition">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Dernier Paiement
            </span>
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shadow-xs">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-3xl font-black text-slate-900 dark:text-white tabular-nums">
              {(data.lastPaymentAmount ?? 0).toLocaleString('fr-FR')}{' '}
              <span className="text-sm font-bold text-slate-500">FCFA</span>
            </div>
            <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>{data.lastPaymentDate ? `Versé le ${new Date(data.lastPaymentDate).toLocaleDateString('fr-FR')}` : 'Aucun versement antérieur'}</span>
            </p>
          </div>
        </div>

        {/* Carte 4 : Prochaine Date de Versement & Bouton Déclencher */}
        <div className="bg-gradient-to-br from-blue-600 via-indigo-600 to-sky-700 text-white rounded-3xl p-6 shadow-md relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-extrabold uppercase tracking-wider text-blue-200">
                Prochain Versement
              </span>
              <Calendar className="w-5 h-5 text-blue-200" />
            </div>
            <div className="text-2xl font-black tabular-nums">
              {data.nextPaymentDate && !isNaN(new Date(data.nextPaymentDate).getTime())
                ? new Date(data.nextPaymentDate).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })
                : 'Sur demande'}
            </div>
            <p className="text-[11px] text-blue-100 mt-1">
              {isEligibleForPayout ? '✓ Solde disponible pour versement immédiat' : 'Aucun versement en attente'}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsPayoutModalOpen(true)}
            className="mt-4 w-full py-2.5 px-3 rounded-2xl bg-white text-blue-700 hover:bg-blue-50 font-bold text-xs shadow-md transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Wallet className="w-4 h-4" />
            <span>Demander un versement</span>
          </button>
        </div>
      </div>

      {/* 4. SECTION PALIERS DE COMMISSION */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-500" />
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Paliers de Rémunération des Affiliés
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Augmentez vos revenus automatiquement au fil de vos parrainages.
            </p>
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold">
            <span className="text-slate-500">Votre taux actuel :</span>
            <span className="px-2 py-0.5 rounded-md bg-blue-600 text-white font-extrabold text-xs">
              {data.commissionRate}%
            </span>
          </div>
        </div>

        {/* Visualisation Paliers */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Palier 1 */}
          <div
            className={`p-5 rounded-2xl border transition-all ${
              data.commissionRate === 20
                ? 'bg-blue-50/50 dark:bg-blue-950/20 border-blue-500/60 shadow-xs ring-1 ring-blue-500/20'
                : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 opacity-75'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-extrabold text-blue-700 dark:text-blue-300 uppercase tracking-wider">
                Palier Standard · 1 à 19 clients
              </span>
              <span className="text-xl font-black text-blue-600 dark:text-blue-400">20%</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              Applicable dès votre premier client apporté sur n'importe quel abonnement ou forfait d'établissement.
            </p>
          </div>

          {/* Palier 2 */}
          <div
            className={`p-5 rounded-2xl border transition-all ${
              data.commissionRate === 25
                ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-500/60 shadow-xs ring-1 ring-emerald-500/20'
                : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-extrabold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Palier VIP · 20+ clients</span>
              </span>
              <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">25%</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              Débloqué dès 20 clients. Vous touchez 25% à vie sur toutes les souscriptions et renouvellements futurs.
            </p>
          </div>
        </div>

        {/* Barre de progression */}
        <div className="space-y-2 pt-2">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="text-slate-700 dark:text-slate-300">
              Progression vers le Palier VIP (25%) :
            </span>
            <span className="text-blue-600 dark:text-blue-400 font-extrabold">
              {data.totalClientsGenerated}/20 clients ({Math.min(100, Math.round((data.totalClientsGenerated / 20) * 100))}%)
            </span>
          </div>

          <div className="w-full h-3.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-200 dark:border-slate-700">
            <div
              className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full transition-all duration-1000 ease-out"
              style={{ width: `${Math.min(100, (data.totalClientsGenerated / 20) * 100)}%` }}
            />
          </div>

          <p className="text-[11px] text-slate-500 dark:text-slate-400 text-right">
            {data.clientsUntilPalier > 0
              ? `Plus que ${data.clientsUntilPalier} client(s) pour débloquer les 25% de commission !`
              : 'Félicitations ! Vous bénéficiez du palier maximum de 25%.'}
          </p>
        </div>
      </div>

      {/* 5. SECTION MON BONUS */}
      <div className="bg-gradient-to-r from-indigo-900 via-blue-900 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-sm relative overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center relative">
          <div className="space-y-2 md:col-span-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-blue-200 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Avantage Exclusif de Parrainage</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black">
              Bonus Offert à Vos Filleuls : {data.bonus?.bonusPerClient || '+100 corrections'}
            </h3>
            <p className="text-xs sm:text-sm text-blue-100/90 leading-relaxed">
              Pour chaque enseignant ou école qui utilise votre code <code className="bg-white/20 px-2 py-0.5 rounded font-mono font-bold text-white">{data.bonus?.code || data.affiliateCode || activeCode || 'CODE'}</code>, Praxis leur offre gracieusement 100 corrections supplémentaires. Un argument puissant pour conclure vos recommandations !
            </p>
          </div>

          {/* Stats conversion bonus */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/20 text-center space-y-2">
            <span className="text-xs font-bold text-blue-200 block uppercase tracking-wider">
              Bonus Activés
            </span>
            <div className="text-3xl font-black text-amber-300">
              {data.bonus?.conversion ?? 0} <span className="text-sm font-semibold text-white">écoles / profs</span>
            </div>
            <p className="text-[11px] text-blue-200">
              Valeur équivalente offerte : {((data.bonus?.totalBonusValue ?? ((data.bonus?.conversion ?? 0) * 1000))).toLocaleString('fr-FR')} FCFA
            </p>
          </div>
        </div>
      </div>

      {/* 3. SECTION COMMISSION DÉTAILLÉE (TABLEAU INTERACTIF) */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Percent className="w-5 h-5 text-blue-600" />
              <span>Détail des Commissions et Clients ({filteredClients.length})</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Historique exhaustif de chaque abonnement souscrit avec votre code partenaire.
            </p>
          </div>

          {/* Filtres & Recherche */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Champ de recherche */}
            <div className="relative min-w-[200px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher un client..."
                className="w-full pl-8 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Sélecteur de statut */}
            <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-bold">
              {(['Tous', 'Payé', 'En attente', 'Non facturé'] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                    statusFilter === st
                      ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>

            {/* Tri */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 outline-hidden"
            >
              <option value="date-desc">Plus récents d'abord</option>
              <option value="date-asc">Plus anciens d'abord</option>
              <option value="commission-desc">Commission décroissante</option>
              <option value="amount-desc">Montant décroissant</option>
            </select>
          </div>
        </div>

        {/* Tableau */}
        <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3.5 px-4">Client / Référence</th>
                <th className="py-3.5 px-4">Formule Souscrite</th>
                <th className="py-3.5 px-4">Montant de la Vente</th>
                <th className="py-3.5 px-4">Commission Nette</th>
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4 text-right">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {filteredClients.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    Aucune vente enregistrée pour le moment avec votre code partenaire.
                  </td>
                </tr>
              ) : (
                filteredClients.map((client) => {
                  return (
                    <tr key={client.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition">
                      {/* Nom / Référence client anonymisé */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                          {client.plan.includes('Établissement') ? (
                            <Building2 className="w-4 h-4 text-indigo-600 shrink-0" />
                          ) : (
                            <GraduationCap className="w-4 h-4 text-blue-600 shrink-0" />
                          )}
                          <span>{client.name || 'Enseignant Abonné'}</span>
                        </div>
                        {client.city && (
                          <span className="text-[10px] text-slate-400 block ml-6">
                            {client.city}
                          </span>
                        )}
                      </td>

                      {/* Plan */}
                      <td className="py-3.5 px-4 font-semibold text-slate-700 dark:text-slate-300">
                        {client.plan}
                      </td>

                      {/* Montant encaissé */}
                      <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white tabular-nums">
                        {client.amountReceived.toLocaleString('fr-FR')} FCFA
                      </td>

                      {/* Commission gagnée */}
                      <td className="py-3.5 px-4 font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
                        +{client.commissionEarned.toLocaleString('fr-FR')} FCFA
                      </td>

                      {/* Date */}
                      <td className="py-3.5 px-4 text-slate-500 tabular-nums">
                        {new Date(client.paymentDate).toLocaleDateString('fr-FR')}
                      </td>

                      {/* Statut */}
                      <td className="py-3.5 px-4 text-right">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                            client.status === 'Payé'
                              ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                              : client.status === 'En attente'
                              ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              client.status === 'Payé'
                                ? 'bg-emerald-500'
                                : client.status === 'En attente'
                                ? 'bg-amber-500'
                                : 'bg-slate-400'
                            }`}
                          />
                          <span>{client.status}</span>
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 6. SECTION CALENDRIER DE VERSEMENTS */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-indigo-600" />
              <span>Calendrier des Versements Hebdomadaires</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Cycle de versement flexible : effectuez une demande de versement à tout moment, sans aucun seuil minimum requis.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsPayoutModalOpen(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center gap-2 cursor-pointer self-start sm:self-auto"
          >
            <Wallet className="w-3.5 h-3.5" />
            <span>Demander un versement</span>
          </button>
        </div>

        {/* Grille du calendrier */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {(data.calendar || []).map((week) => (
            <div
              key={week.id}
              className={`p-5 rounded-2xl border transition-all ${
                week.status === 'Confirmé'
                  ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-300/60 dark:border-emerald-800'
                  : week.thresholdReached
                  ? 'bg-blue-50/40 dark:bg-blue-950/20 border-blue-300/60 dark:border-blue-800'
                  : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800'
              }`}
            >
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-2">
                <span>{week.weekLabel}</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase ${
                    week.status === 'Confirmé'
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200'
                      : week.thresholdReached
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                      : 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200'
                  }`}
                >
                  {week.status}
                </span>
              </div>

              <div className="text-xl font-black text-slate-900 dark:text-white tabular-nums my-1">
                {week.estimatedAmount.toLocaleString('fr-FR')} FCFA
              </div>

              <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-2">
                <Clock className="w-3.5 h-3.5" />
                <span>Date prévue : {new Date(week.date).toLocaleDateString('fr-FR')}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 8. SECTION FAQ COLLAPSIBLE */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Questions Fréquentes sur l'Affiliation
            </h2>
          </div>
          <button
            type="button"
            onClick={() => setIsSupportModalOpen(true)}
            className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Contacter le support affilié</span>
          </button>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {faqItems.map((item, idx) => {
            const isOpen = openFaqIndex === idx;
            return (
              <div key={idx} className="py-3.5">
                <button
                  type="button"
                  onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                  className="w-full flex items-center justify-between text-left text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 hover:text-blue-600 transition cursor-pointer"
                >
                  <span>{item.q}</span>
                  {isOpen ? <ChevronUp className="w-4 h-4 text-blue-600 shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />}
                </button>
                {isOpen && (
                  <p className="mt-2.5 text-xs text-slate-600 dark:text-slate-400 leading-relaxed pr-6 animate-in fade-in duration-200">
                    {item.a}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 7. MODAL "DEMANDER UN VERSEMENT HEBDOMADAIRE" */}
      {isPayoutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <Wallet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                    Demander un Versement
                  </h3>
                  <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">Aucun seuil minimum requis</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPayoutModalOpen(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Vérification du seuil */}
            {isEligibleForPayout ? (
              <form onSubmit={handleRequestPayout} className="space-y-4">
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-xs text-emerald-800 dark:text-emerald-300 flex items-center justify-between">
                  <span>Solde disponible :</span>
                  <span className="font-extrabold text-sm">{data.pendingBalance.toLocaleString('fr-FR')} FCFA</span>
                </div>

                {payoutErrorMsg && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{payoutErrorMsg}</span>
                  </div>
                )}

                {payoutSuccessMsg && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{payoutSuccessMsg}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Montant à verser (FCFA)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min={1}
                      max={data.pendingBalance || 0}
                      step={500}
                      value={payoutAmount}
                      onChange={(e) => setPayoutAmount(parseInt(e.target.value, 10) || 0)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white outline-hidden"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setPayoutAmount(data.pendingBalance)}
                      className="absolute right-2.5 top-2 px-2 py-1 bg-slate-200 dark:bg-slate-700 hover:bg-blue-600 hover:text-white rounded-lg text-[10px] font-bold text-slate-700 dark:text-slate-200 transition cursor-pointer"
                    >
                      Tout retirer
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Moyen de versement
                  </label>
                  <div className="grid grid-cols-2 gap-2 text-xs font-bold">
                    {(['Wave', 'Orange Money', 'Moov Money', 'Virement Bancaire'] as const).map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setPayoutMethod(m)}
                        className={`p-2.5 rounded-xl border text-center transition cursor-pointer ${
                          payoutMethod === m
                            ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-600 text-blue-700 dark:text-blue-300 shadow-xs'
                            : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                        }`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Numéro mobile ou IBAN
                  </label>
                  <input
                    type="text"
                    value={payoutPhoneOrIban}
                    onChange={(e) => setPayoutPhoneOrIban(e.target.value)}
                    placeholder="+225... ou CI..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white outline-hidden"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Notes particulières (opt.)
                  </label>
                  <input
                    type="text"
                    value={payoutNotes}
                    onChange={(e) => setPayoutNotes(e.target.value)}
                    placeholder="Ex: Titulaire du numéro, etc."
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white outline-hidden"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsPayoutModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={payoutLoading}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md transition disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                  >
                    {payoutLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                    <span>Confirmer le versement ({payoutAmount.toLocaleString('fr-FR')} F)</span>
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4 text-center py-2">
                <div className="w-14 h-14 rounded-full bg-amber-50 dark:bg-amber-950/50 text-amber-600 flex items-center justify-center mx-auto">
                  <AlertCircle className="w-7 h-7" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                    Aucun solde disponible pour le moment
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 max-w-xs mx-auto leading-relaxed">
                    Votre solde actuel est de <strong>{(data.pendingBalance ?? 0).toLocaleString('fr-FR')} FCFA</strong>. Dès que vous générez une vente avec votre code promo, vous pouvez demander le retrait immédiat de n'importe quel montant (aucun seuil minimum requis).
                  </p>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl text-xs text-slate-600 dark:text-slate-400 text-left space-y-1">
                  <span className="font-bold block text-slate-800 dark:text-slate-200">💡 Conseil d'accélération :</span>
                  <span>Partagez votre code auprès d'un collège ou lycée : un abonnement établissement génère entre 78 000 F et 190 000 F de commission d'un coup !</span>
                </div>

                <button
                  type="button"
                  onClick={() => setIsPayoutModalOpen(false)}
                  className="w-full py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs rounded-xl hover:opacity-90 transition"
                >
                  Compris
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL DU CONTRAT ET CONDITIONS */}
      {isContractModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Conditions Générales du Partenariat Affilié PRAXIS
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsContractModalOpen(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl space-y-1">
                <span className="font-bold text-slate-900 dark:text-white block">1. Rémunération et Paliers</span>
                <p>Le partenaire perçoit 20% sur tout achat d'abonnement ou de pack réalisé avec son code unique. Dès 20 clients comptabilisés, le taux passe à 25% de commission.</p>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl space-y-1">
                <span className="font-bold text-slate-900 dark:text-white block">2. Versements et Délais</span>
                <p>Aucun seuil minimum de versement n'est imposé : vous pouvez demander le versement de vos commissions à tout moment, quel que soit le montant de votre solde disponible. Les versements sont traités sous 24 à 48 heures ouvrées via Wave, Orange Money ou virement bancaire.</p>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl space-y-1">
                <span className="font-bold text-slate-900 dark:text-white block">3. Validité et Traçabilité</span>
                <p>Chaque client reste attribué au partenaire à vie. Toute reconduction ou réabonnement du client ouvre droit aux commissions correspondantes.</p>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl space-y-1">
                <span className="font-bold text-slate-900 dark:text-white block">4. Éthique et Transparence</span>
                <p>L'utilisation de pratiques trompeuses ou de spams est strictement prohibée et entraîne la suspension immédiate du compte partenaire.</p>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setIsContractModalOpen(false)}
                className="px-5 py-2.5 bg-blue-600 text-white font-bold text-xs rounded-xl hover:bg-blue-700 transition"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CONTACT SUPPORT AFFILIÉ */}
      {isSupportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Send className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Contacter le Responsable Affiliation PRAXIS
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsSupportModalOpen(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSendSupport} className="space-y-3">
              {supportSuccessMsg ? (
                <div className="p-4 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{supportSuccessMsg}</span>
                </div>
              ) : (
                <>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Une question sur un versement, un contrat d'établissement ou un devis spécial ? Écrivez-nous directement :
                  </p>
                  <div>
                    <textarea
                      rows={4}
                      value={supportMessage}
                      onChange={(e) => setSupportMessage(e.target.value)}
                      placeholder="Votre message ici..."
                      className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white outline-hidden focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsSupportModalOpen(false)}
                      className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      disabled={supportLoading}
                      className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md transition disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                    >
                      {supportLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                      <span>Envoyer</span>
                    </button>
                  </div>
                </>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
