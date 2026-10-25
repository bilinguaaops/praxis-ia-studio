import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Users,
  DollarSign,
  TrendingUp,
  Search,
  Filter,
  Download,
  Plus,
  ArrowUpRight,
  CheckCircle2,
  AlertCircle,
  Clock,
  Send,
  Trash2,
  ChevronRight,
  ExternalLink,
  Mail,
  Phone,
  FileSpreadsheet,
  FileText,
  ShieldCheck,
  RefreshCw,
  Sparkles,
  Award,
  Wallet,
  X,
  Copy,
  Check,
  Percent,
  Calendar,
  Building2,
  PieChart as PieIcon,
  BarChart3,
  Sliders,
  Share2,
  ArrowRight,
  CheckSquare,
  Lock,
  Edit3,
  Link as LinkIcon,
} from 'lucide-react';
import {
  Chart,
  BarController,
  BarElement,
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Title,
  Tooltip,
  Legend,
  DoughnutController,
  ArcElement,
} from 'chart.js';
import jsPDF from 'jspdf';

// Enregistrer les composants requis pour les graphiques
Chart.register(
  BarController,
  BarElement,
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Title,
  Tooltip,
  Legend,
  DoughnutController,
  ArcElement
);

export interface AdminAffiliateClient {
  id: number | string;
  name: string;
  plan: string;
  amountReceived: number;
  commission: number;
  commissionEarned?: number;
  paymentDate: string;
  status: 'Payé' | 'En attente' | 'Non facturé';
  city?: string;
  contactEmail?: string;
}

export interface AdminAffiliatePayment {
  id?: string;
  date: string;
  amount: number;
  status: string;
  method: string;
  recipient?: string;
  notes?: string;
}

export interface AdminAffiliateItem {
  id: number;
  name: string;
  affiliateName?: string;
  email: string;
  phone: string;
  code: string;
  affiliateCode?: string;
  inviteToken?: string;
  notes?: string;
  joinDate: string;
  status: 'Actif' | 'Inactif' | 'Suspendu' | 'Résilié';
  contractStatus: 'Signé' | 'En attente' | 'Expiré';
  contractExpiry: string;
  contractUrl?: string;
  totalClientsGenerated: number;
  totalCommissionEarned: number;
  totalCommissionAccumulated?: number;
  totalCommissionPaid: number;
  commissionDue: number;
  pendingBalance?: number;
  commissionRate: number;
  conversionRate: number;
  clients: AdminAffiliateClient[];
  paymentHistory: AdminAffiliatePayment[];
  calendar?: any[];
  bonus?: any;
}

export interface AdminAffiliateKPIs {
  totalActiveAffiliates: number;
  totalAffiliates: number;
  monthlyCommissionPaid: number;
  monthlyClientsGenerated: number;
  totalCommissionEarned: number;
  totalCommissionDue: number;
  avgConversionRate: number;
}

export interface AdminActionLog {
  id: string;
  date: string;
  action: string;
  affiliateName: string;
  details: string;
}

interface AdminAffiliatesViewProps {
  onNotify?: (text: string, type: 'success' | 'error' | 'info') => void;
}

export const AdminAffiliatesView: React.FC<AdminAffiliatesViewProps> = ({ onNotify }) => {
  // Données
  const [loading, setLoading] = useState<boolean>(true);
  const [affiliates, setAffiliates] = useState<AdminAffiliateItem[]>([]);
  const [kpis, setKpis] = useState<AdminAffiliateKPIs | null>(null);
  const [actionLogs, setActionLogs] = useState<AdminActionLog[]>([]);
  const [authorizedEmails, setAuthorizedEmails] = useState<string[]>([]);
  const [inviteLinks, setInviteLinks] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'whitelist' | 'invites' | 'applications'>('overview');

  // Whitelist & Invite Link form states
  const [newEmailInput, setNewEmailInput] = useState<string>('');
  const [emailLoading, setEmailLoading] = useState<boolean>(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState<boolean>(false);
  const [newInviteForm, setNewInviteForm] = useState({
    token: '',
    label: '',
    commissionRate: 20,
    maxUses: 10,
  });
  const [inviteLoading, setInviteLoading] = useState<boolean>(false);

  // Filtres et recherche
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'Tous' | 'Actifs' | 'Inactifs' | 'Non payés'>('Tous');
  const [sortBy, setSortBy] = useState<'commission' | 'clients' | 'name'>('commission');

  // Drawer latéral détail
  const [selectedAffiliate, setSelectedAffiliate] = useState<AdminAffiliateItem | null>(null);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [isPayModalOpen, setIsPayModalOpen] = useState<boolean>(false);
  const [payingAffiliate, setPayingAffiliate] = useState<AdminAffiliateItem | null>(null);

  const [isMessageModalOpen, setIsMessageModalOpen] = useState<boolean>(false);
  const [messagingAffiliate, setMessagingAffiliate] = useState<AdminAffiliateItem | null>(null);

  const [isSuspendModalOpen, setIsSuspendModalOpen] = useState<boolean>(false);
  const [suspendingAffiliate, setSuspendingAffiliate] = useState<AdminAffiliateItem | null>(null);

  const [isTerminateModalOpen, setIsTerminateModalOpen] = useState<boolean>(false);
  const [terminatingAffiliate, setTerminatingAffiliate] = useState<AdminAffiliateItem | null>(null);

  const [isContractModalOpen, setIsContractModalOpen] = useState<boolean>(false);
  const [contractAffiliate, setContractAffiliate] = useState<AdminAffiliateItem | null>(null);

  // Formulaire d'ajout d'affilié
  const [newForm, setNewForm] = useState({
    name: '',
    email: '',
    phone: '',
    commissionRate: 20,
    code: '',
    startDate: new Date().toISOString().slice(0, 10),
  });
  const [addLoading, setAddLoading] = useState(false);
  const [createdAffiliateSuccess, setCreatedAffiliateSuccess] = useState<any | null>(null);
  const [copiedInvite, setCopiedInvite] = useState<boolean>(false);
  const [copiedCodeSuccess, setCopiedCodeSuccess] = useState<boolean>(false);

  // Formulaire de versement commission
  const [payForm, setPayForm] = useState({
    amount: 0,
    method: 'Wave' as 'Wave' | 'Orange Money' | 'Virement' | 'Autre',
    phoneOrAccount: '',
    notes: '',
    sendEmailConfirmation: true,
  });
  const [payLoading, setPayLoading] = useState(false);

  // Formulaire message (Email / SMS)
  const [messageForm, setMessageForm] = useState({
    channel: 'Email' as 'Email' | 'SMS' | 'Notification',
    subject: 'Point d’étape sur vos commissions PRAXIS',
    message: '',
  });
  const [messageLoading, setMessageLoading] = useState(false);

  // Modal d'édition d'ambassadeur à tout moment
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [editForm, setEditForm] = useState({
    id: 0,
    name: '',
    email: '',
    phone: '',
    code: '',
    commissionRate: 20,
    status: 'Actif' as 'Actif' | 'Inactif' | 'Suspendu' | 'Résilié',
    notes: '',
  });
  const [editLoading, setEditLoading] = useState(false);

  // Toast local fallback
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    if (onNotify) onNotify(text, type);
    setToast({ text, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Références Canvas pour Chart.js
  const topAffiliatesChartRef = useRef<HTMLCanvasElement | null>(null);
  const topAffiliatesInstanceRef = useRef<Chart | null>(null);

  const plansChartRef = useRef<HTMLCanvasElement | null>(null);
  const plansInstanceRef = useRef<Chart | null>(null);

  // Récupération sécurisée du token de session d'administration
  const getAdminToken = () => {
    return sessionStorage.getItem('praxis_admin_token') || localStorage.getItem('praxis_admin_token') || '';
  };

  const getAuthHeaders = () => {
    const token = getAdminToken();
    return {
      'Content-Type': 'application/json',
      ...(token ? { 'x-admin-token': token } : {}),
    };
  };

  // Chargement des données
  const fetchAffiliates = async () => {
    try {
      setLoading(true);
      const token = getAdminToken();
      const res = await fetch('/api/admin/affiliates', {
        headers: token ? { 'x-admin-token': token } : {},
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Erreur lors du chargement des affiliés');
      }
      setAffiliates(data.data.affiliates || []);
      setKpis(data.data.kpis || null);
      setActionLogs(data.data.actionLogs || []);
      setAuthorizedEmails(data.data.authorizedEmails || []);
      setInviteLinks(data.data.inviteLinks || []);
      setApplications(data.data.applications || []);
    } catch (err: any) {
      showToast(err.message || 'Erreur de connexion', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAffiliates();
  }, []);

  // Synchronisation du drawer si l'affilié sélectionné est mis à jour
  useEffect(() => {
    if (selectedAffiliate) {
      const refreshed = affiliates.find((a) => a.id === selectedAffiliate.id);
      if (refreshed) setSelectedAffiliate(refreshed);
    }
  }, [affiliates]);

  // Filtrage et Tri
  const filteredAffiliates = useMemo(() => {
    return affiliates
      .filter((aff) => {
        // Filtre Statut
        if (statusFilter === 'Actifs' && aff.status !== 'Actif') return false;
        if (statusFilter === 'Inactifs' && aff.status === 'Actif') return false;
        if (statusFilter === 'Non payés' && (aff.commissionDue ?? aff.pendingBalance ?? 0) <= 0) return false;

        // Recherche par nom, code ou email
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchName = aff.name.toLowerCase().includes(q);
          const matchCode = (aff.code || aff.affiliateCode || '').toLowerCase().includes(q);
          const matchEmail = (aff.email || '').toLowerCase().includes(q);
          return matchName || matchCode || matchEmail;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'commission') {
          const commA = a.totalCommissionEarned ?? a.totalCommissionAccumulated ?? 0;
          const commB = b.totalCommissionEarned ?? b.totalCommissionAccumulated ?? 0;
          return commB - commA; // Tri descendant par défaut
        }
        if (sortBy === 'clients') {
          return (b.totalClientsGenerated || 0) - (a.totalClientsGenerated || 0);
        }
        if (sortBy === 'name') {
          return a.name.localeCompare(b.name);
        }
        return 0;
      });
  }, [affiliates, searchQuery, statusFilter, sortBy]);

  // Graphique 1: Top 5 Affiliés & Graphique 2: Répartition des Plans
  useEffect(() => {
    if (loading || !affiliates.length) return;

    // 1. Top 5 Affiliés
    if (topAffiliatesChartRef.current) {
      if (topAffiliatesInstanceRef.current) {
        topAffiliatesInstanceRef.current.destroy();
      }
      const top5 = [...affiliates]
        .sort((a, b) => (b.totalCommissionEarned || 0) - (a.totalCommissionEarned || 0))
        .slice(0, 5);

      const ctx1 = topAffiliatesChartRef.current.getContext('2d');
      if (ctx1) {
        topAffiliatesInstanceRef.current = new Chart(ctx1, {
          type: 'bar',
          data: {
            labels: top5.map((a) => a.name.split(' ')[0]),
            datasets: [
              {
                label: 'Commissions gagnées (FCFA)',
                data: top5.map((a) => a.totalCommissionEarned || a.totalCommissionAccumulated || 0),
                backgroundColor: 'rgba(59, 130, 246, 0.85)',
                borderColor: '#3b82f6',
                borderWidth: 1.5,
                borderRadius: 6,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false },
              tooltip: {
                callbacks: {
                  label: (ctx) => `${(ctx.parsed.y || 0).toLocaleString('fr-FR')} FCFA`,
                },
              },
            },
            scales: {
              y: {
                ticks: {
                  color: '#94a3b8',
                  callback: (val) => `${(Number(val) / 1000).toFixed(0)}k`,
                },
                grid: { color: 'rgba(51, 65, 85, 0.25)' },
              },
              x: {
                ticks: { color: '#94a3b8' },
                grid: { display: false },
              },
            },
          },
        });
      }
    }

    // 2. Répartition par type de plans
    if (plansChartRef.current) {
      if (plansInstanceRef.current) {
        plansInstanceRef.current.destroy();
      }

      // Calculer les catégories parmi tous les clients
      let etabCount = 0;
      let trimCount = 0;
      let annCount = 0;
      let mensCount = 0;

      affiliates.forEach((aff) => {
        (aff.clients || []).forEach((c) => {
          const p = (c.plan || '').toLowerCase();
          if (p.includes('établissement') || p.includes('grand') || p.includes('standard') || p.includes('petit')) {
            etabCount++;
          } else if (p.includes('trimestre') || p.includes('12k')) {
            trimCount++;
          } else if (p.includes('annuel') || p.includes('30k')) {
            annCount++;
          } else {
            mensCount++;
          }
        });
      });

      const ctx2 = plansChartRef.current.getContext('2d');
      if (ctx2) {
        plansInstanceRef.current = new Chart(ctx2, {
          type: 'doughnut',
          data: {
            labels: ['Établissements (390k-950k)', 'Trimestriels (12k)', 'Annuels (30k)', 'Mensuels (5k)'],
            datasets: [
              {
                data: [etabCount, trimCount, annCount, mensCount],
                backgroundColor: ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b'],
                borderColor: '#111827',
                borderWidth: 2,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: 'bottom',
                labels: { color: '#94a3b8', boxWidth: 10, font: { size: 10 } },
              },
            },
          },
        });
      }
    }

    return () => {
      if (topAffiliatesInstanceRef.current) topAffiliatesInstanceRef.current.destroy();
      if (plansInstanceRef.current) plansInstanceRef.current.destroy();
    };
  }, [affiliates, loading]);

  // Actions
  const handleOpenPayModal = (affiliate: AdminAffiliateItem) => {
    setPayingAffiliate(affiliate);
    const due = affiliate.commissionDue ?? affiliate.pendingBalance ?? 0;
    setPayForm({
      amount: due > 0 ? due : 50000,
      method: 'Wave',
      phoneOrAccount: affiliate.phone || '',
      notes: `Versement de commission validé (${due.toLocaleString('fr-FR')} FCFA dus)`,
      sendEmailConfirmation: true,
    });
    setIsPayModalOpen(true);
  };

  const handleConfirmPay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingAffiliate) return;

    try {
      setPayLoading(true);
      const res = await fetch(`/api/admin/affiliates/${payingAffiliate.id}/pay`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payForm),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Erreur lors du versement');

      showToast(`✓ Versement de ${payForm.amount.toLocaleString('fr-FR')} FCFA validé pour ${payingAffiliate.name}`, 'success');
      setIsPayModalOpen(false);
      fetchAffiliates();
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setPayLoading(false);
    }
  };

  const handleCreateAffiliate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newForm.name.trim() || !newForm.email.trim()) {
      showToast('Nom et email obligatoires.', 'error');
      return;
    }

    try {
      setAddLoading(true);
      const res = await fetch('/api/admin/affiliates', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(newForm),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Erreur création affilié');

      setCreatedAffiliateSuccess(data);
      setCopiedInvite(false);
      setCopiedCodeSuccess(false);
      setIsAddModalOpen(false);
      showToast(`✓ Partenaire ${data.affiliate?.name || newForm.name} activé avec succès !`, 'success');
      setNewForm({
        name: '',
        email: '',
        phone: '',
        commissionRate: 20,
        code: '',
        startDate: new Date().toISOString().slice(0, 10),
      });
      fetchAffiliates();
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setAddLoading(false);
    }
  };

  const handleUpdateStatus = async (affiliate: AdminAffiliateItem, newStatus: 'Actif' | 'Inactif' | 'Suspendu' | 'Résilié') => {
    try {
      const res = await fetch(`/api/admin/affiliates/${affiliate.id}`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          status: newStatus,
          contractStatus: newStatus === 'Résilié' ? 'Expiré' : affiliate.contractStatus,
          notes: `Changement de statut en ${newStatus} par l'administrateur.`,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Erreur mise à jour');

      showToast(`✓ Partenaire ${affiliate.name} : Statut passé à « ${newStatus} »`, 'success');
      setIsSuspendModalOpen(false);
      setIsTerminateModalOpen(false);
      fetchAffiliates();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleOpenEditModal = (aff: AdminAffiliateItem) => {
    setEditForm({
      id: aff.id,
      name: aff.name,
      email: aff.email,
      phone: aff.phone || '',
      code: aff.code || aff.affiliateCode || '',
      commissionRate: aff.commissionRate || 20,
      status: aff.status || 'Actif',
      notes: aff.notes || '',
    });
    setIsEditModalOpen(true);
  };

  const handleSaveEditAffiliate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editForm.name.trim() || !editForm.email.trim() || !editForm.code.trim()) {
      showToast('Nom, email et code sont obligatoires.', 'error');
      return;
    }
    try {
      setEditLoading(true);
      const res = await fetch(`/api/admin/affiliates/${editForm.id}`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify(editForm),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Erreur mise à jour');
      showToast(`✓ Ambassadeur ${editForm.name} mis à jour avec succès !`, 'success');
      setIsEditModalOpen(false);
      fetchAffiliates();
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeleteAffiliate = async (affiliate: AdminAffiliateItem) => {
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer l'ambassadeur « ${affiliate.name} » ?\nSon code promo (${affiliate.code || affiliate.affiliateCode}) et son accès privé à l'Espace Ambassadeur seront immédiatement révoqués.`)) {
      return;
    }
    try {
      const res = await fetch(`/api/admin/affiliates/${affiliate.id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Erreur lors de la suppression');
      showToast(`✓ Ambassadeur ${affiliate.name} supprimé et accès révoqué.`, 'success');
      fetchAffiliates();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleCopyInviteLink = (affiliate: AdminAffiliateItem) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://praxis-pro.pro';
    const token = affiliate.inviteToken || affiliate.code || affiliate.affiliateCode;
    const link = `${origin}/#affiliate?invite=${encodeURIComponent(token)}`;
    try {
      navigator.clipboard.writeText(link);
      showToast(`✓ Lien d'invitation privé copié pour ${affiliate.name} !`, 'success');
    } catch {
      showToast(link, 'info');
    }
  };

  const handleDuplicatePromoCode = async (affiliate: AdminAffiliateItem) => {
    const newCode = `${affiliate.name.split(' ')[0].toUpperCase()}-${new Date().getFullYear()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    try {
      const res = await fetch(`/api/admin/affiliates/${affiliate.id}`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          newDuplicateCode: newCode,
          notes: `Génération d'un nouveau code promo dupliqué : ${newCode}`,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Erreur duplication');

      showToast(`✓ Nouveau code généré pour ${affiliate.name} : ${newCode}`, 'success');
      fetchAffiliates();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messagingAffiliate) return;

    try {
      setMessageLoading(true);
      const res = await fetch(`/api/admin/affiliates/${messagingAffiliate.id}/message`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(messageForm),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Erreur envoi');

      showToast(`✓ Message transmis à ${messagingAffiliate.name} (${messageForm.channel})`, 'success');
      setIsMessageModalOpen(false);
      setMessageForm({
        channel: 'Email',
        subject: 'Point d’étape sur vos commissions PRAXIS',
        message: '',
      });
      fetchAffiliates();
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setMessageLoading(false);
    }
  };

  // Gestion Whitelist (Emails autorisés)
  const handleAddAuthorizedEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmailInput.trim()) return;
    try {
      setEmailLoading(true);
      const res = await fetch('/api/admin/affiliates/authorized-emails', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ email: newEmailInput.trim() }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Erreur ajout email');
      showToast(`✓ Adresse ${newEmailInput.trim()} autorisée avec succès !`, 'success');
      setNewEmailInput('');
      fetchAffiliates();
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setEmailLoading(false);
    }
  };

  const handleRemoveAuthorizedEmail = async (email: string) => {
    if (!window.confirm(`Voulez-vous retirer l'adresse ${email} de la liste des ambassadeurs autorisés ?`)) return;
    try {
      const res = await fetch(`/api/admin/affiliates/authorized-emails/${encodeURIComponent(email)}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Erreur suppression');
      showToast(`✓ Adresse ${email} retirée de la liste blanche.`, 'success');
      fetchAffiliates();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  // Gestion Liens d'invitation privés
  const handleCreateInviteLink = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setInviteLoading(true);
      const res = await fetch('/api/admin/affiliates/invite-links', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(newInviteForm),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Erreur création lien');
      showToast(`✓ Lien d'invitation créé avec succès !`, 'success');
      setIsInviteModalOpen(false);
      setNewInviteForm({ token: '', label: '', commissionRate: 20, maxUses: 10 });
      fetchAffiliates();
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setInviteLoading(false);
    }
  };

  const handleToggleInviteLink = async (token: string, currentActive: boolean) => {
    try {
      const res = await fetch(`/api/admin/affiliates/invite-links/${encodeURIComponent(token)}`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ active: !currentActive }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Erreur modification');
      showToast(`✓ Lien ${token} ${!currentActive ? 'activé' : 'désactivé'}.`, 'success');
      fetchAffiliates();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleDeleteInviteLink = async (token: string) => {
    if (!window.confirm(`Supprimer définitivement le lien d'invitation « ${token} » ?`)) return;
    try {
      const res = await fetch(`/api/admin/affiliates/invite-links/${encodeURIComponent(token)}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Erreur suppression');
      showToast(`✓ Lien ${token} supprimé.`, 'success');
      fetchAffiliates();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleCopySpecificInviteLink = (token: string) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://praxis-pro.pro';
    const link = `${origin}/#ambassadeur?invite=${encodeURIComponent(token)}`;
    try {
      navigator.clipboard.writeText(link);
      showToast(`✓ Lien d'invitation copié : ${link}`, 'success');
    } catch {
      showToast(link, 'info');
    }
  };

  // Validation des candidatures
  const handleApproveApplication = async (appId: string) => {
    try {
      const res = await fetch(`/api/admin/affiliates/applications/${appId}/approve`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ commissionRate: 20 }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Erreur validation');
      showToast(`✓ Candidature validée ! Compte affilié créé avec le code promo « ${data.affiliate?.code} ».`, 'success');
      fetchAffiliates();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleRejectApplication = async (appId: string) => {
    if (!window.confirm('Voulez-vous rejeter cette candidature ?')) return;
    try {
      const res = await fetch(`/api/admin/affiliates/applications/${appId}/reject`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Erreur');
      showToast('Candidature rejetée.', 'info');
      fetchAffiliates();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  // Exports
  const handleExportCSV = () => {
    if (!affiliates.length) {
      showToast('Aucun affilié à exporter.', 'info');
      return;
    }

    const headers = [
      'ID',
      'Nom Affilié',
      'Email',
      'Téléphone',
      'Code Promo',
      'Statut',
      'Taux Commission (%)',
      'Clients Générés',
      'Commission Gagnée (FCFA)',
      'Commission Versée (FCFA)',
      'Solde Dû (FCFA)',
      'Date Inscription',
      'Statut Contrat',
    ];

    const rows = affiliates.map((a) => [
      a.id,
      `"${a.name.replace(/"/g, '""')}"`,
      `"${a.email}"`,
      `"${a.phone}"`,
      `"${a.code || a.affiliateCode}"`,
      a.status,
      `${a.commissionRate}%`,
      a.totalClientsGenerated || 0,
      a.totalCommissionEarned ?? a.totalCommissionAccumulated ?? 0,
      a.totalCommissionPaid || 0,
      a.commissionDue ?? a.pendingBalance ?? 0,
      a.joinDate || '',
      a.contractStatus || 'Signé',
    ]);

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `praxis_affiliates_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`✓ Export CSV généré (${affiliates.length} affiliés).`, 'success');
  };

  const handleExportPDF = () => {
    try {
      const doc = new jsPDF();
      doc.setFontSize(18);
      doc.setTextColor(30, 58, 138);
      doc.text('PRAXIS IA — Rapport Général des Affiliés & Commissions', 14, 20);

      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139);
      doc.text(`Édité le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}`, 14, 27);
      doc.text(`Total partenaires : ${affiliates.length} | Actifs : ${kpis?.totalActiveAffiliates || 0}`, 14, 33);

      doc.setDrawColor(203, 213, 225);
      doc.line(14, 38, 196, 38);

      let y = 46;
      doc.setFontSize(9);
      doc.setTextColor(15, 23, 42);

      affiliates.forEach((aff, i) => {
        if (y > 270) {
          doc.addPage();
          y = 20;
        }

        doc.setFont('helvetica', 'bold');
        doc.text(`${i + 1}. ${aff.name} [Code: ${aff.code || aff.affiliateCode}] — Statut: ${aff.status}`, 14, y);
        doc.setFont('helvetica', 'normal');
        y += 5;
        doc.text(
          `Clients : ${aff.totalClientsGenerated} | Gagné : ${(aff.totalCommissionEarned || 0).toLocaleString('fr-FR')} FCFA | Payé : ${(aff.totalCommissionPaid || 0).toLocaleString('fr-FR')} FCFA | Dû : ${(aff.commissionDue || 0).toLocaleString('fr-FR')} FCFA`,
          18,
          y
        );
        y += 8;
      });

      doc.save(`rapport_affilies_praxis_${new Date().toISOString().slice(0, 10)}.pdf`);
      showToast('✓ Rapport PDF des affiliés téléchargé.', 'success');
    } catch (err: any) {
      showToast('Erreur génération PDF', 'error');
    }
  };

  const handleExportTaxReport = () => {
    try {
      const doc = new jsPDF();
      doc.setFontSize(16);
      doc.setTextColor(15, 23, 42);
      doc.text('PRAXIS IA — Relevé Fiscal & Rémunérations Partenaires', 14, 20);

      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139);
      doc.text(`Période Année en cours : 2026 | Date d'arrêté : ${new Date().toLocaleDateString('fr-FR')}`, 14, 27);

      const totalPaid = affiliates.reduce((acc, a) => acc + (a.totalCommissionPaid || 0), 0);
      const totalDue = affiliates.reduce((acc, a) => acc + (a.commissionDue ?? a.pendingBalance ?? 0), 0);

      doc.text(`Cumul rémunérations versées : ${totalPaid.toLocaleString('fr-FR')} FCFA`, 14, 34);
      doc.text(`Provisions charges à payer (solde dû) : ${totalDue.toLocaleString('fr-FR')} FCFA`, 14, 40);

      let y = 52;
      affiliates.forEach((aff, i) => {
        if ((aff.totalCommissionPaid || 0) > 0 || (aff.commissionDue || 0) > 0) {
          if (y > 270) {
            doc.addPage();
            y = 20;
          }
          doc.text(
            `${aff.name} (${aff.phone}) — Payé : ${(aff.totalCommissionPaid || 0).toLocaleString('fr-FR')} FCFA | En attente : ${(aff.commissionDue || 0).toLocaleString('fr-FR')} FCFA`,
            14,
            y
          );
          y += 6;
        }
      });

      doc.save(`releve_fiscal_commissions_${new Date().toISOString().slice(0, 10)}.pdf`);
      showToast('✓ Relevé fiscal comptable généré avec succès.', 'success');
    } catch (err) {
      showToast('Erreur génération rapport fiscal', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast local de confirmation */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 text-xs font-semibold border ${
            toast.type === 'success'
              ? 'bg-emerald-950/90 text-emerald-200 border-emerald-700/60'
              : toast.type === 'error'
              ? 'bg-rose-950/90 text-rose-200 border-rose-700/60'
              : 'bg-blue-950/90 text-blue-200 border-blue-700/60'
          } animate-in fade-in slide-in-from-top-2`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : toast.type === 'error' ? (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          ) : (
            <Sparkles className="w-4 h-4 text-blue-400 shrink-0" />
          )}
          <span>{toast.text}</span>
        </div>
      )}

      {/* 1. EN-TÊTE PRINCIPAL & ACTIONS RAPIDES */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 bg-[#141C2E] border border-slate-800/90 rounded-2xl p-5 shadow-lg">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <Award className="w-5 h-5 text-blue-400" />
              Gestion des Affiliés & Réseau Partenaires
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-950 text-blue-300 border border-blue-800">
              {affiliates.length} affiliés
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Supervisez les performances des apporteurs d'affaires, suivez les commissions en temps réel et validez les versements.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          {/* Recherche temps réel */}
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher par nom, code..."
              className="w-full pl-9 pr-3 py-2 bg-[#0B0F17] border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2 text-slate-500 hover:text-white text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* Bouton Ajouter un nouvel affilié */}
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-md transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Ajouter un nouvel affilié</span>
          </button>

          <button
            type="button"
            onClick={fetchAffiliates}
            title="Rafraîchir les données"
            className="p-2 bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* 2. NAVIGATION SOUS-ONGLETS GESTION ACCÈS AMBASSADEURS */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-3">
        <button
          type="button"
          onClick={() => setActiveSubTab('overview')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'overview'
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-[#141C2E] text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
          }`}
        >
          <Award className="w-4 h-4 text-blue-300" />
          <span>Affiliés Actifs & Commissions ({affiliates.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('whitelist')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'whitelist'
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-[#141C2E] text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
          }`}
        >
          <Mail className="w-4 h-4 text-emerald-400" />
          <span>Emails Autorisés ({authorizedEmails.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('invites')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'invites'
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-[#141C2E] text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
          }`}
        >
          <LinkIcon className="w-4 h-4 text-amber-400" />
          <span>Liens d'Invitation Privés ({inviteLinks.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('applications')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'applications'
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-[#141C2E] text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
          }`}
        >
          <Send className="w-4 h-4 text-purple-400" />
          <span>Candidatures Reçues ({applications.length})</span>
          {applications.filter((a: any) => a.status === 'pending').length > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-rose-500 text-white font-mono font-bold">
              {applications.filter((a: any) => a.status === 'pending').length} en attente
            </span>
          )}
        </button>
      </div>

      {activeSubTab === 'overview' && (
        <>
          {/* FILTRES RAPIDES */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <span className="text-slate-400 font-semibold flex items-center gap-1 shrink-0">
          <Filter className="w-3.5 h-3.5 text-blue-400" />
          Filtres :
        </span>
        {(['Tous', 'Actifs', 'Inactifs', 'Non payés'] as const).map((st) => (
          <button
            key={st}
            type="button"
            onClick={() => setStatusFilter(st)}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer whitespace-nowrap ${
              statusFilter === st
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-900/60 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
            }`}
          >
            {st}
            {st === 'Tous' && ` (${affiliates.length})`}
            {st === 'Actifs' && ` (${affiliates.filter((a) => a.status === 'Actif').length})`}
            {st === 'Inactifs' && ` (${affiliates.filter((a) => a.status !== 'Actif').length})`}
            {st === 'Non payés' && ` (${affiliates.filter((a) => (a.commissionDue ?? a.pendingBalance ?? 0) > 0).length})`}
          </button>
        ))}

        <div className="ml-auto flex items-center gap-2 shrink-0">
          <span className="text-slate-400">Trier par :</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-[#0B0F17] border border-slate-700 rounded-lg px-2.5 py-1 text-slate-200 text-xs focus:outline-hidden"
          >
            <option value="commission">Top Commissions (Décroissant)</option>
            <option value="clients">Nombre de clients</option>
            <option value="name">Nom de l'affilié (A-Z)</option>
          </select>
        </div>
      </div>

      {/* 2. SECTION OVERVIEW (KPIS) - 4 CARTES CÔTE À CÔTE */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Total Affiliés Actifs */}
        <div className="bg-[#141C2E] border border-slate-800/90 rounded-2xl p-5 shadow-lg relative overflow-hidden group hover:border-blue-500/40 transition-colors">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Affiliés Actifs</span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/15 text-blue-400 flex items-center justify-center border border-blue-500/20">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {kpis?.totalActiveAffiliates ?? affiliates.filter((a) => a.status === 'Actif').length}
            </span>
            <span className="text-xs text-slate-400">/ {affiliates.length} enregistrés</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs pt-3 border-t border-slate-800">
            <span className="text-blue-300 font-semibold">Taux d'activité :</span>
            <span className="text-slate-400 font-mono">
              {affiliates.length ? Math.round(((kpis?.totalActiveAffiliates || 0) / affiliates.length) * 100) : 0}%
            </span>
          </div>
        </div>

        {/* KPI 2: Commission Versée ce mois */}
        <div className="bg-[#141C2E] border border-slate-800/90 rounded-2xl p-5 shadow-lg relative overflow-hidden group hover:border-emerald-500/40 transition-colors">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Commission Versée Cumulée</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-emerald-400 tracking-tight font-mono">
              {(kpis?.monthlyCommissionPaid ?? 0).toLocaleString('fr-FR')}
            </span>
            <span className="text-xs text-slate-400 font-medium">FCFA</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs pt-3 border-t border-slate-800">
            <span className="text-amber-400 font-semibold">Solde dû en attente :</span>
            <span className="text-amber-300 font-mono">
              {(kpis?.totalCommissionDue ?? 0).toLocaleString('fr-FR')} FCFA
            </span>
          </div>
        </div>

        {/* KPI 3: Clients Générés ce mois */}
        <div className="bg-[#141C2E] border border-slate-800/90 rounded-2xl p-5 shadow-lg relative overflow-hidden group hover:border-purple-500/40 transition-colors">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Clients Générés (Total)</span>
            <div className="w-8 h-8 rounded-lg bg-purple-500/15 text-purple-400 flex items-center justify-center border border-purple-500/20">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {kpis?.monthlyClientsGenerated ?? affiliates.reduce((acc, a) => acc + (a.totalClientsGenerated || 0), 0)}
            </span>
            <span className="text-xs text-purple-300 font-semibold">établissements & profs</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs pt-3 border-t border-slate-800">
            <span className="text-purple-300 font-semibold">Croissance réseau :</span>
            <span className="text-slate-400 font-mono">+18% ce mois</span>
          </div>
        </div>

        {/* KPI 4: Taux de conversion moyen */}
        <div className="bg-[#141C2E] border border-slate-800/90 rounded-2xl p-5 shadow-lg relative overflow-hidden group hover:border-amber-500/40 transition-colors">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Taux de Conversion Moyen</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/15 text-amber-400 flex items-center justify-center border border-amber-500/20">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-amber-400 tracking-tight font-mono">
              {Math.round((kpis?.avgConversionRate ?? 0.35) * 100)}%
            </span>
            <span className="text-xs text-slate-400">contacts / signatures</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs pt-3 border-t border-slate-800">
            <span className="text-slate-400">Palier VIP atteint :</span>
            <span className="text-white font-mono">
              {affiliates.filter((a) => (a.commissionRate || 20) >= 25).length} affiliés (25%)
            </span>
          </div>
        </div>
      </div>

      {/* 3. TABLE MAÎTRE : LISTE DES AFFILIÉS */}
      <div className="bg-[#141C2E] border border-slate-800/90 rounded-2xl shadow-xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-400" />
              Répertoire Maître des Partenaires & Affiliés
            </h3>
            <p className="text-[11px] text-slate-400">
              Cliquez sur un affilié pour ouvrir son drawer latéral avec détail complet et actions.
            </p>
          </div>

          <div className="text-xs text-slate-400 font-mono">
            Affichage de <span className="text-white font-bold">{filteredAffiliates.length}</span> sur {affiliates.length}
          </div>
        </div>

        {/* Table scroll horizontal sur mobile */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#0B0F17] text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800 font-semibold">
                <th className="py-3 px-4">Affilié</th>
                <th className="py-3 px-3">Code Promo</th>
                <th className="py-3 px-3 text-center">Clients Apportés</th>
                <th className="py-3 px-3 text-right">Commission Accumulée</th>
                <th className="py-3 px-3 text-right">Versé Cumulé</th>
                <th className="py-3 px-3 text-right">Solde Dû</th>
                <th className="py-3 px-3 text-center">Statut</th>
                <th className="py-3 px-3">Inscription</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filteredAffiliates.map((aff) => {
                const due = aff.commissionDue ?? aff.pendingBalance ?? 0;
                const earned = aff.totalCommissionEarned ?? aff.totalCommissionAccumulated ?? 0;
                const code = aff.code || aff.affiliateCode;

                return (
                  <tr
                    key={aff.id}
                    onClick={() => setSelectedAffiliate(aff)}
                    className="hover:bg-slate-800/40 transition-colors cursor-pointer group"
                  >
                    {/* Nom + avatar + email */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-blue-900/40 border border-blue-700/50 text-blue-300 font-bold flex items-center justify-center shrink-0 text-xs">
                          {aff.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <span className="font-bold text-white group-hover:text-blue-300 transition-colors block">
                            {aff.name}
                          </span>
                          <span className="text-[11px] text-slate-400 block font-mono">{aff.email}</span>
                        </div>
                      </div>
                    </td>

                    {/* Code Promo */}
                    <td className="py-3 px-3">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-950/70 text-blue-300 border border-blue-800/60 font-mono text-[11px] font-bold">
                        {code}
                      </span>
                    </td>

                    {/* Clients Apportés */}
                    <td className="py-3 px-3 text-center">
                      <span className="font-extrabold text-white text-sm">
                        {aff.totalClientsGenerated || 0}
                      </span>
                      <span className="text-[10px] text-slate-400 block">
                        {aff.commissionRate}% {aff.commissionRate >= 25 ? 'VIP' : 'Standard'}
                      </span>
                    </td>

                    {/* Commission Accumulée */}
                    <td className="py-3 px-3 text-right font-mono font-bold text-white">
                      {earned.toLocaleString('fr-FR')} FCFA
                    </td>

                    {/* Commission Versée */}
                    <td className="py-3 px-3 text-right font-mono text-emerald-400 font-medium">
                      {(aff.totalCommissionPaid || 0).toLocaleString('fr-FR')} FCFA
                    </td>

                    {/* Solde Dû */}
                    <td className="py-3 px-3 text-right font-mono">
                      {due > 0 ? (
                        <span className="inline-flex items-center gap-1 font-bold text-amber-400">
                          <Clock className="w-3 h-3" />
                          {due.toLocaleString('fr-FR')} FCFA
                        </span>
                      ) : (
                        <span className="text-slate-500 font-medium">0 FCFA</span>
                      )}
                    </td>

                    {/* Statut */}
                    <td className="py-3 px-3 text-center">
                      {aff.status === 'Actif' && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-700/50">
                          Actif
                        </span>
                      )}
                      {aff.status === 'Inactif' && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
                          Inactif
                        </span>
                      )}
                      {aff.status === 'Suspendu' && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-700">
                          Suspendu
                        </span>
                      )}
                      {aff.status === 'Résilié' && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-950 text-rose-300 border border-rose-700">
                          Résilié
                        </span>
                      )}
                    </td>

                    {/* Date d'inscription */}
                    <td className="py-3 px-3 text-slate-400 text-[11px] font-mono">
                      {aff.joinDate ? new Date(aff.joinDate).toLocaleDateString('fr-FR') : '—'}
                    </td>

                    {/* Actions directes */}
                    <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Copier le lien d'invitation privé */}
                        <button
                          type="button"
                          onClick={() => handleCopyInviteLink(aff)}
                          title="Copier le lien d'invitation privé de cet ambassadeur"
                          className="p-1.5 text-blue-400 hover:text-blue-300 rounded-lg hover:bg-blue-950/50 border border-blue-800/40 transition-colors cursor-pointer"
                        >
                          <LinkIcon className="w-3.5 h-3.5" />
                        </button>

                        {/* Modifier les informations à tout moment */}
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(aff)}
                          title="Modifier cet ambassadeur (email, nom, code, commission)"
                          className="p-1.5 text-slate-300 hover:text-white rounded-lg hover:bg-slate-800 border border-slate-700/60 transition-colors cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => setSelectedAffiliate(aff)}
                          className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold rounded-lg transition-colors cursor-pointer"
                        >
                          Détails
                        </button>

                        {due > 0 && (
                          <button
                            type="button"
                            onClick={() => handleOpenPayModal(aff)}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1 shadow-xs"
                          >
                            <Wallet className="w-3 h-3" />
                            Payer
                          </button>
                        )}

                        {/* Supprimer / Révoquer */}
                        <button
                          type="button"
                          onClick={() => handleDeleteAffiliate(aff)}
                          title="Supprimer et révoquer cet ambassadeur"
                          className="p-1.5 text-rose-400 hover:text-rose-300 rounded-lg hover:bg-rose-950/40 border border-rose-900/40 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredAffiliates.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <Users className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                    <p className="font-semibold text-white">Aucun affilié trouvé</p>
                    <p className="text-xs mt-0.5">Modifiez vos critères de recherche ou ajoutez un nouveau partenaire.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. SECTION RAPPORTS / EXPORT & LOGS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Colonne 1 & 2 : Graphiques analytiques */}
        <div className="lg:col-span-2 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Graphique 1 : Top Affiliés */}
            <div className="bg-[#141C2E] border border-slate-800/90 rounded-2xl p-4 shadow-lg">
              <h4 className="text-xs font-bold text-white mb-1 flex items-center gap-1.5">
                <BarChart3 className="w-3.5 h-3.5 text-blue-400" />
                Top 5 Affiliés par Commission Gagnée
              </h4>
              <p className="text-[10px] text-slate-400 mb-3">Rémunération totale accumulée en FCFA</p>
              <div className="h-44 w-full">
                <canvas ref={topAffiliatesChartRef} />
              </div>
            </div>

            {/* Graphique 2 : Répartition par type de souscription */}
            <div className="bg-[#141C2E] border border-slate-800/90 rounded-2xl p-4 shadow-lg">
              <h4 className="text-xs font-bold text-white mb-1 flex items-center gap-1.5">
                <PieIcon className="w-3.5 h-3.5 text-emerald-400" />
                Répartition des Souscriptions Clientes
              </h4>
              <p className="text-[10px] text-slate-400 mb-3">Établissements vs Trimestriels vs Annuels vs Mensuels</p>
              <div className="h-44 w-full">
                <canvas ref={plansChartRef} />
              </div>
            </div>
          </div>

          {/* Journal des actions (Audit Trail) */}
          <div className="bg-[#141C2E] border border-slate-800/90 rounded-2xl p-4 shadow-lg">
            <h4 className="text-xs font-bold text-white mb-2 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-purple-400" />
              Journal des Actions & Audit Trail Partenaires
            </h4>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {actionLogs.slice(0, 8).map((log) => (
                <div key={log.id} className="p-2.5 rounded-xl bg-[#0B0F17] border border-slate-800 text-xs flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-blue-300">{log.affiliateName}</span>
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-slate-800 text-slate-300">
                        {log.action}
                      </span>
                    </div>
                    <p className="text-slate-400 mt-0.5 text-[11px] leading-snug">{log.details}</p>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono shrink-0">
                    {new Date(log.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
              {actionLogs.length === 0 && (
                <p className="text-xs text-slate-500 text-center py-4">Aucune action consignée pour le moment.</p>
              )}
            </div>
          </div>
        </div>

        {/* Colonne 3 : Boîte à Outils Exports & Règlements */}
        <div className="bg-[#141C2E] border border-slate-800/90 rounded-2xl p-5 shadow-lg space-y-4">
          <div>
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Download className="w-4 h-4 text-blue-400" />
              Rapports & Exports Comptables
            </h4>
            <p className="text-xs text-slate-400 mt-1">
              Générez les documents officiels et synthèses financières pour la comptabilité et le suivi.
            </p>
          </div>

          <div className="space-y-2.5">
            <button
              type="button"
              onClick={handleExportPDF}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-[#0B0F17] hover:bg-slate-800/60 border border-slate-700/80 text-white text-xs font-semibold transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-2.5">
                <FileText className="w-4 h-4 text-rose-400 group-hover:scale-110 transition-transform" />
                <div className="text-left">
                  <span className="block font-bold">Rapport des Affiliés (PDF)</span>
                  <span className="text-[11px] text-slate-400">Synthèse générale et performance</span>
                </div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-white" />
            </button>

            <button
              type="button"
              onClick={handleExportCSV}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-[#0B0F17] hover:bg-slate-800/60 border border-slate-700/80 text-white text-xs font-semibold transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-2.5">
                <FileSpreadsheet className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
                <div className="text-left">
                  <span className="block font-bold">Export Tableau CSV Excel</span>
                  <span className="text-[11px] text-slate-400">Tous les affiliés et commissions</span>
                </div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-white" />
            </button>

            <button
              type="button"
              onClick={handleExportTaxReport}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-[#0B0F17] hover:bg-slate-800/60 border border-slate-700/80 text-white text-xs font-semibold transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-2.5">
                <DollarSign className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
                <div className="text-left">
                  <span className="block font-bold">Relevé Fiscal & Paiements</span>
                  <span className="text-[11px] text-slate-400">Arrêté des charges et provisions</span>
                </div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-white" />
            </button>
          </div>

          <div className="p-3.5 rounded-xl bg-blue-950/40 border border-blue-800/50 text-xs text-blue-200 space-y-1">
            <span className="font-bold flex items-center gap-1 text-blue-300">
              <ShieldCheck className="w-4 h-4" />
              Politique de versement des commissions :
            </span>
            <p className="text-[11px] text-blue-300/80 leading-relaxed">
              Le seuil minimum de versement recommandé est de 100 000 FCFA. Les commissions sont payées par Wave, Orange Money ou virement avec traçabilité intégrale.
            </p>
          </div>
        </div>
      </div>
      </>
    )}

      {/* ===================================================================== */}
      {/* SOUS-ONGLET 2: ADRESSES EMAILS AUTORISÉES (WHITELIST AMBASSADEURS) */}
      {/* ===================================================================== */}
      {activeSubTab === 'whitelist' && (
        <div className="space-y-6">
          <div className="bg-[#141C2E] border border-slate-800 rounded-2xl p-6 shadow-xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800/80">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Mail className="w-5 h-5 text-emerald-400" />
                  Liste Blanche des Emails Ambassadeurs Autorisés
                </h3>
                <p className="text-xs text-slate-400 mt-1 max-w-2xl">
                  Seules les personnes dont l'adresse email figure sur cette liste (ou détentrices d'un lien d'invitation privé) peuvent finaliser leur inscription et accéder à leur espace partenaire. Vous pouvez ajouter ou supprimer des adresses à tout moment.
                </p>
              </div>
              <span className="px-3 py-1 bg-emerald-950 text-emerald-300 border border-emerald-800/60 rounded-xl text-xs font-mono font-bold self-start md:self-center">
                {authorizedEmails.length} email(s) pré-approuvé(s)
              </span>
            </div>

            {/* Formulaire d'ajout rapide d'email autorisé */}
            <form onSubmit={handleAddAuthorizedEmail} className="mt-5 flex flex-col sm:flex-row items-center gap-3">
              <div className="relative flex-1 w-full">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="email"
                  value={newEmailInput}
                  onChange={(e) => setNewEmailInput(e.target.value)}
                  placeholder="Ex : julie.professeur@gmail.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-[#0B0F17] border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={emailLoading}
                className="w-full sm:w-auto px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
              >
                {emailLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                <span>Autoriser cet email</span>
              </button>
            </form>
          </div>

          {/* Tableau des emails autorisés */}
          <div className="bg-[#141C2E] border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider text-slate-300">
                Adresses en cours d'autorisation ({authorizedEmails.length})
              </h4>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#0B0F17] text-slate-400 font-bold border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Adresse Email</th>
                    <th className="py-3 px-4">Statut</th>
                    <th className="py-3 px-4">Compte Actif associé</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono text-slate-200">
                  {authorizedEmails.map((email, idx) => {
                    const matchedAff = affiliates.find((a) => (a.email || '').toLowerCase() === email.toLowerCase());
                    return (
                      <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                        <td className="py-3 px-4 flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-emerald-400" />
                          <span className="font-semibold text-white">{email}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-800/60">
                            Autorisé
                          </span>
                        </td>
                        <td className="py-3 px-4 font-sans text-xs">
                          {matchedAff ? (
                            <span className="text-blue-300 font-bold">
                              {matchedAff.name} ({matchedAff.code || matchedAff.affiliateCode})
                            </span>
                          ) : (
                            <span className="text-amber-400 italic">En attente d'inscription par le partenaire</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => handleRemoveAuthorizedEmail(email)}
                            className="px-3 py-1 bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-800/60 rounded-lg text-xs font-bold transition cursor-pointer"
                          >
                            Révoquer
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {authorizedEmails.length === 0 && (
                    <tr>
                      <td colSpan={4} className="text-center py-8 text-slate-500 font-sans">
                        Aucune adresse email spécifiée pour le moment. Ajoutez une adresse ci-dessus pour ouvrir l'accès à un ambassadeur sélectionné.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* SOUS-ONGLET 3: LIENS D'INVITATION PRIVÉS */}
      {/* ===================================================================== */}
      {activeSubTab === 'invites' && (
        <div className="space-y-6">
          <div className="bg-[#141C2E] border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <LinkIcon className="w-5 h-5 text-amber-400" />
                Liens d'Invitation Privés & Codes d'Accès Sécurisés
              </h3>
              <p className="text-xs text-slate-400 mt-1 max-w-2xl">
                Générez des liens d'invitation uniques à envoyer directement aux influenceurs et personnalités que vous avez sélectionnées. Chaque lien active l'inscription avec un taux de commission dédié et une limite d'usage.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsInviteModalOpen(true)}
              className="px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-md shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Générer un lien d'invitation</span>
            </button>
          </div>

          <div className="bg-[#141C2E] border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#0B0F17] text-slate-400 font-bold border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Code / Jeton</th>
                    <th className="py-3 px-4">Libellé & Réf</th>
                    <th className="py-3 px-4">Taux Commission</th>
                    <th className="py-3 px-4">Usages</th>
                    <th className="py-3 px-4">Statut</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-200">
                  {inviteLinks.map((link: any, idx: number) => {
                    const isLimitReached = link.maxUses && link.usedCount >= link.maxUses;
                    return (
                      <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                        <td className="py-3 px-4">
                          <span className="font-mono font-bold text-amber-300 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/60">
                            {link.token}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-semibold text-white">
                          {link.label || 'Invitation Ambassadeur'}
                        </td>
                        <td className="py-3 px-4 font-mono text-emerald-400 font-bold">
                          {link.commissionRate || 20}%
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-300">
                          {link.usedCount || 0} / {link.maxUses || '∞'}
                          {isLimitReached && (
                            <span className="ml-2 text-[10px] text-rose-400 font-bold">(Quota atteint)</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <button
                            type="button"
                            onClick={() => handleToggleInviteLink(link.token, link.active)}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition ${
                              link.active
                                ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                : 'bg-slate-800 text-slate-400 border border-slate-700'
                            }`}
                          >
                            {link.active ? 'Actif' : 'Désactivé'}
                          </button>
                        </td>
                        <td className="py-3 px-4 text-right space-x-2">
                          <button
                            type="button"
                            onClick={() => handleCopySpecificInviteLink(link.token)}
                            className="px-2.5 py-1 bg-blue-900/60 hover:bg-blue-800 text-blue-200 border border-blue-700/60 rounded-lg text-xs font-bold transition cursor-pointer"
                          >
                            Copier le lien
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteInviteLink(link.token)}
                            className="px-2.5 py-1 bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-800/60 rounded-lg text-xs font-bold transition cursor-pointer"
                          >
                            Supprimer
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {inviteLinks.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-slate-500 font-sans">
                        Aucun lien d'invitation créé. Cliquez sur « Générer un lien d'invitation » ci-dessus.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* SOUS-ONGLET 4: CANDIDATURES REÇUES */}
      {/* ===================================================================== */}
      {activeSubTab === 'applications' && (
        <div className="space-y-6">
          <div className="bg-[#141C2E] border border-slate-800 rounded-2xl p-6 shadow-xl">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Send className="w-5 h-5 text-purple-400" />
              Candidatures Ambassadeurs & Demandes d'Autorisation
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Ces candidatures proviennent d'enseignants et créateurs de contenu qui souhaitent devenir ambassadeurs. Cliquez sur « Valider & Créer le compte » pour activer leur espace avec leur code promo exclusif.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {applications.map((app: any, idx: number) => {
              const isPending = app.status === 'pending';
              const cleanWaPhone = (app.phone || '').replace(/[^0-9]/g, '');
              return (
                <div key={idx} className="bg-[#141C2E] border border-slate-800 rounded-2xl p-5 space-y-3 shadow-lg">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4 className="text-sm font-bold text-white">{app.fullName}</h4>
                      <p className="text-xs text-slate-400 font-mono mt-0.5">{app.email}</p>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        app.status === 'approved'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          : app.status === 'rejected'
                          ? 'bg-rose-950 text-rose-300 border border-rose-800'
                          : 'bg-amber-950 text-amber-300 border border-amber-800'
                      }`}
                    >
                      {app.status === 'approved' ? 'Validé' : app.status === 'rejected' ? 'Refusé' : 'En attente'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-800/80">
                    <div>
                      <span className="text-slate-500 block text-[11px]">WhatsApp</span>
                      <a
                        href={`https://wa.me/${cleanWaPhone}`}
                        target="_blank"
                        rel="noreferrer"
                        className="font-mono text-emerald-400 hover:underline flex items-center gap-1"
                      >
                        <Phone className="w-3 h-3" />
                        {app.phone}
                      </a>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px]">Audience / Communauté</span>
                      <span className="text-white font-medium">{app.audience || 'Non précisé'}</span>
                    </div>
                  </div>

                  {app.channel && (
                    <div className="text-xs">
                      <span className="text-slate-500 block text-[11px]">Canal / École / Réseau</span>
                      <span className="text-slate-300">{app.channel}</span>
                    </div>
                  )}

                  {app.message && (
                    <div className="p-3 bg-[#0B0F17] rounded-xl border border-slate-800 text-xs text-slate-300 italic">
                      « {app.message} »
                    </div>
                  )}

                  {isPending && (
                    <div className="pt-2 flex items-center gap-2 justify-end">
                      <button
                        type="button"
                        onClick={() => handleRejectApplication(app.id)}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition cursor-pointer"
                      >
                        Refuser
                      </button>
                      <button
                        type="button"
                        onClick={() => handleApproveApplication(app.id)}
                        className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Valider & Créer le compte Ambassadeur</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
            {applications.length === 0 && (
              <div className="col-span-2 text-center py-12 bg-[#141C2E] border border-slate-800 rounded-2xl text-slate-500 text-xs">
                Aucune candidature reçue pour le moment.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 5. DRAWER LATÉRAL SLIDE-IN DEPUIS LA DROITE : DÉTAILS D'UN AFFILIÉ */}
      {/* ===================================================================== */}
      {selectedAffiliate && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-xs flex justify-end animate-in fade-in">
          <div
            className="w-full max-w-2xl bg-[#0F172A] border-l border-slate-800 h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Entête du drawer */}
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-[#111827]">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-blue-600/20 border border-blue-500/40 text-blue-400 font-extrabold flex items-center justify-center text-base">
                  {selectedAffiliate.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-white">{selectedAffiliate.name}</h3>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        selectedAffiliate.status === 'Actif'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-700/60'
                          : 'bg-rose-950 text-rose-300 border border-rose-700/60'
                      }`}
                    >
                      {selectedAffiliate.status}
                    </span>
                  </div>
                  <span className="text-xs text-slate-400 font-mono">{selectedAffiliate.email} • {selectedAffiliate.phone}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedAffiliate(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Corps du drawer qui scroll */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6 text-xs text-slate-300">
              {/* SECTION A: INFOS DE BASE */}
              <div className="bg-[#141C2E] border border-slate-800 rounded-xl p-4 space-y-3">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-blue-400" />
                  Informations Générales & Contrat Partenaire
                </h4>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-500 block text-[11px]">Code Promotionnel</span>
                    <span className="font-mono font-bold text-blue-300 text-sm">
                      {selectedAffiliate.code || selectedAffiliate.affiliateCode}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Date d'inscription</span>
                    <span className="font-mono text-white">
                      {selectedAffiliate.joinDate ? new Date(selectedAffiliate.joinDate).toLocaleDateString('fr-FR') : '—'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Statut du Contrat</span>
                    <span className="font-semibold text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {selectedAffiliate.contractStatus || 'Signé'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Échéance Contrat</span>
                    <span className="font-mono text-slate-300">
                      {selectedAffiliate.contractExpiry || '2027-06-14'}
                    </span>
                  </div>
                </div>
              </div>

              {/* SECTION B: PERFORMANCE */}
              <div className="bg-[#141C2E] border border-slate-800 rounded-xl p-4 space-y-3">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-purple-400" />
                  Performance & Solde de Commission
                </h4>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                  <div className="bg-[#0B0F17] p-2.5 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-500 block">Clients Générés</span>
                    <span className="text-base font-extrabold text-white">{selectedAffiliate.totalClientsGenerated || 0}</span>
                  </div>
                  <div className="bg-[#0B0F17] p-2.5 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-500 block">Total Gagné</span>
                    <span className="text-xs font-mono font-bold text-white">
                      {(selectedAffiliate.totalCommissionEarned || selectedAffiliate.totalCommissionAccumulated || 0).toLocaleString('fr-FR')} F
                    </span>
                  </div>
                  <div className="bg-[#0B0F17] p-2.5 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-500 block">Total Versé</span>
                    <span className="text-xs font-mono font-bold text-emerald-400">
                      {(selectedAffiliate.totalCommissionPaid || 0).toLocaleString('fr-FR')} F
                    </span>
                  </div>
                  <div className="bg-[#0B0F17] p-2.5 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-500 block">Solde en Attente</span>
                    <span className="text-xs font-mono font-bold text-amber-400">
                      {(selectedAffiliate.commissionDue ?? selectedAffiliate.pendingBalance ?? 0).toLocaleString('fr-FR')} F
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-1 px-1">
                  <span className="text-slate-400">Taux de commission appliqué :</span>
                  <span className="font-bold text-blue-300">
                    {selectedAffiliate.commissionRate || 20}% ({selectedAffiliate.commissionRate >= 25 ? 'Palier VIP atteint' : 'Palier standard'})
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs px-1">
                  <span className="text-slate-400">Taux de conversion estimé :</span>
                  <span className="font-mono text-white">
                    {Math.round((selectedAffiliate.conversionRate || 0.42) * 100)}% ({selectedAffiliate.totalClientsGenerated} conversions / ~{Math.round((selectedAffiliate.totalClientsGenerated || 1) / (selectedAffiliate.conversionRate || 0.4))} contacts)
                  </span>
                </div>
              </div>

              {/* SECTION C: CALENDRIER & HISTORIQUE DES PAIEMENTS */}
              <div className="bg-[#141C2E] border border-slate-800 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                    Historique des Paiements
                  </h4>
                  <span className="text-[11px] text-slate-400">
                    Prochain paiement prévu : <strong className="text-white">01 Nov 2026</strong>
                  </span>
                </div>

                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                  {(selectedAffiliate.paymentHistory || []).map((pay, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-lg bg-[#0B0F17] border border-slate-800 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-emerald-400 font-mono">
                            {pay.amount.toLocaleString('fr-FR')} FCFA
                          </span>
                          <span className="px-1.5 py-0.2 rounded text-[10px] bg-slate-800 text-slate-300 font-mono">
                            {pay.method || 'Wave'}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 block mt-0.5 font-mono">
                          Bénéficiaire : {pay.recipient || selectedAffiliate.phone}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                          {pay.status || 'Complété'}
                        </span>
                        <span className="text-[10px] text-slate-500 block mt-0.5 font-mono">
                          {pay.date}
                        </span>
                      </div>
                    </div>
                  ))}

                  {(!selectedAffiliate.paymentHistory || selectedAffiliate.paymentHistory.length === 0) && (
                    <p className="text-xs text-slate-500 py-3 text-center">Aucun paiement antérieur enregistré.</p>
                  )}
                </div>
              </div>

              {/* SECTION D: CLIENTS APPORTÉS (MINI TABLEAU) */}
              <div className="bg-[#141C2E] border border-slate-800 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-blue-400" />
                    Clients Apportés ({selectedAffiliate.clients?.length || 0})
                  </h4>
                  <span className="text-[10px] text-slate-400 font-mono">Portefeuille actif</span>
                </div>

                <div className="overflow-x-auto max-h-48 overflow-y-auto">
                  <table className="w-full text-left border-collapse text-[11px]">
                    <thead>
                      <tr className="bg-[#0B0F17] text-slate-500 border-b border-slate-800">
                        <th className="py-2 px-2.5">Nom Client</th>
                        <th className="py-2 px-2">Plan</th>
                        <th className="py-2 px-2 text-right">Montant</th>
                        <th className="py-2 px-2 text-right">Commission</th>
                        <th className="py-2 px-2 text-center">Statut</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {(selectedAffiliate.clients || []).map((client) => (
                        <tr key={client.id} className="hover:bg-slate-800/30">
                          <td className="py-2 px-2.5 font-semibold text-slate-200">
                            {client.name}
                            {client.city && <span className="text-[10px] text-slate-500 block">{client.city}</span>}
                          </td>
                          <td className="py-2 px-2 text-slate-400">{client.plan}</td>
                          <td className="py-2 px-2 text-right font-mono text-white">
                            {(client.amountReceived || 0).toLocaleString('fr-FR')} F
                          </td>
                          <td className="py-2 px-2 text-right font-mono text-blue-300 font-bold">
                            {(client.commission || client.commissionEarned || 0).toLocaleString('fr-FR')} F
                          </td>
                          <td className="py-2 px-2 text-center">
                            <span
                              className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                                client.status === 'Payé'
                                  ? 'bg-emerald-950 text-emerald-300'
                                  : client.status === 'En attente'
                                  ? 'bg-amber-950 text-amber-300'
                                  : 'bg-slate-800 text-slate-400'
                              }`}
                            >
                              {client.status}
                            </span>
                          </td>
                        </tr>
                      ))}

                      {(!selectedAffiliate.clients || selectedAffiliate.clients.length === 0) && (
                        <tr>
                          <td colSpan={5} className="text-center py-4 text-slate-500">
                            Aucun client apporté pour le moment.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* SECTION E: ACTIONS RAPIDES DU DRAWER */}
            <div className="p-4 border-t border-slate-800 bg-[#111827] flex flex-wrap items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setContractAffiliate(selectedAffiliate);
                  setIsContractModalOpen(true);
                }}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5 text-blue-400" />
                Voir contrat
              </button>

              <button
                type="button"
                onClick={() => {
                  setMessagingAffiliate(selectedAffiliate);
                  setIsMessageModalOpen(true);
                }}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Send className="w-3.5 h-3.5 text-purple-400" />
                Envoyer message
              </button>

              <button
                type="button"
                onClick={() => handleDuplicatePromoCode(selectedAffiliate)}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5 text-amber-400" />
                Dupliquer code
              </button>

              <button
                type="button"
                onClick={() => handleOpenPayModal(selectedAffiliate)}
                className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md transition-colors cursor-pointer"
              >
                <Wallet className="w-3.5 h-3.5" />
                Verser commission immédiate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 5. MODAL : VERSER UNE COMMISSION */}
      {/* ===================================================================== */}
      {isPayModalOpen && payingAffiliate && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#141C2E] border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Wallet className="w-5 h-5 text-emerald-400" />
                  Règlement de Commission
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Bénéficiaire : <strong className="text-white">{payingAffiliate.name}</strong> ({payingAffiliate.code || payingAffiliate.affiliateCode})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsPayModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="bg-[#0B0F17] p-3 rounded-xl border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[11px] text-slate-400 block">Solde total actuellement dû :</span>
                <span className="text-lg font-extrabold text-amber-400 font-mono">
                  {(payingAffiliate.commissionDue ?? payingAffiliate.pendingBalance ?? 0).toLocaleString('fr-FR')} FCFA
                </span>
              </div>
              <span className="text-[10px] text-slate-500 font-mono">Paiement Wave / Virement</span>
            </div>

            <form onSubmit={handleConfirmPay} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Montant à verser (FCFA) :
                </label>
                <input
                  type="number"
                  required
                  min={1000}
                  value={payForm.amount}
                  onChange={(e) => setPayForm({ ...payForm, amount: parseInt(e.target.value, 10) || 0 })}
                  className="w-full bg-[#0B0F17] border border-slate-700 rounded-xl p-2.5 text-white font-mono text-sm focus:border-emerald-500 focus:outline-hidden"
                />
                <span className="text-[10px] text-slate-500 mt-0.5 block">
                  Pré-rempli avec le solde dû. Vous pouvez effectuer un versement partiel.
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Méthode de règlement :</label>
                  <select
                    value={payForm.method}
                    onChange={(e) => setPayForm({ ...payForm, method: e.target.value as any })}
                    className="w-full bg-[#0B0F17] border border-slate-700 rounded-xl p-2.5 text-white focus:outline-hidden"
                  >
                    <option value="Wave">Wave (Direct)</option>
                    <option value="Orange Money">Orange Money</option>
                    <option value="Virement">Virement Bancaire (RIB)</option>
                    <option value="Autre">Espèces / Autre</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">N° Bénéficiaire / IBAN :</label>
                  <input
                    type="text"
                    required
                    value={payForm.phoneOrAccount}
                    onChange={(e) => setPayForm({ ...payForm, phoneOrAccount: e.target.value })}
                    placeholder="+225 07 XX XX XX"
                    className="w-full bg-[#0B0F17] border border-slate-700 rounded-xl p-2.5 text-white font-mono focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Notes comptables / Référence :</label>
                <textarea
                  rows={2}
                  value={payForm.notes}
                  onChange={(e) => setPayForm({ ...payForm, notes: e.target.value })}
                  placeholder="Ex: Virement hebdomadaire de commissions validé"
                  className="w-full bg-[#0B0F17] border border-slate-700 rounded-xl p-2.5 text-white focus:outline-hidden"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="sendEmail"
                  checked={payForm.sendEmailConfirmation}
                  onChange={(e) => setPayForm({ ...payForm, sendEmailConfirmation: e.target.checked })}
                  className="w-4 h-4 rounded text-blue-600 border-slate-700 bg-slate-900"
                />
                <label htmlFor="sendEmail" className="text-slate-300 cursor-pointer text-xs">
                  Envoyer un email + notification de confirmation du versement à l'affilié ({payingAffiliate.email})
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsPayModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={payLoading}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {payLoading ? 'Validation en cours...' : 'Confirmer le versement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 6. MODAL : AJOUTER UN NOUVEL AFFILIÉ */}
      {/* ===================================================================== */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#141C2E] border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Plus className="w-5 h-5 text-blue-400" />
                  Créer un Nouveau Partenaire Affilié
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Enregistrez un nouvel apporteur d'affaires. Un code promotionnel unique et son contrat seront générés.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateAffiliate} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Nom complet du partenaire :</label>
                <input
                  type="text"
                  required
                  value={newForm.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    const autoCode = name.trim() ? `${name.split(' ')[0].toUpperCase()}-${new Date().getFullYear()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}` : '';
                    setNewForm({ ...newForm, name, code: newForm.code || autoCode });
                  }}
                  placeholder="Ex: Antoine Koffi, Mme Diabaté..."
                  className="w-full bg-[#0B0F17] border border-slate-700 rounded-xl p-2.5 text-white focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Adresse Email :</label>
                  <input
                    type="email"
                    required
                    value={newForm.email}
                    onChange={(e) => setNewForm({ ...newForm, email: e.target.value })}
                    placeholder="partenaire@email.com"
                    className="w-full bg-[#0B0F17] border border-slate-700 rounded-xl p-2.5 text-white focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Téléphone (Wave / WhatsApp) :</label>
                  <input
                    type="text"
                    value={newForm.phone}
                    onChange={(e) => setNewForm({ ...newForm, phone: e.target.value })}
                    placeholder="+225 07 XX XX XX"
                    className="w-full bg-[#0B0F17] border border-slate-700 rounded-xl p-2.5 text-white focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Plan de commission :</label>
                  <select
                    value={newForm.commissionRate}
                    onChange={(e) => setNewForm({ ...newForm, commissionRate: parseInt(e.target.value, 10) || 20 })}
                    className="w-full bg-[#0B0F17] border border-slate-700 rounded-xl p-2.5 text-white focus:outline-hidden"
                  >
                    <option value={20}>20% Standard (1-19 clients)</option>
                    <option value={25}>25% VIP (20+ clients ou accord spécial)</option>
                    <option value={30}>30% Master Partner</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Code Promo personnalisé :</label>
                  <input
                    type="text"
                    value={newForm.code}
                    onChange={(e) => setNewForm({ ...newForm, code: e.target.value.toUpperCase() })}
                    placeholder="CODE-2024-XYZ"
                    className="w-full bg-[#0B0F17] border border-slate-700 rounded-xl p-2.5 text-white font-mono uppercase focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Date d'effet du contrat :</label>
                <input
                  type="date"
                  value={newForm.startDate}
                  onChange={(e) => setNewForm({ ...newForm, startDate: e.target.value })}
                  className="w-full bg-[#0B0F17] border border-slate-700 rounded-xl p-2.5 text-white focus:outline-hidden"
                />
              </div>

              <div className="p-3 rounded-xl bg-blue-950/30 border border-blue-800/40 text-[11px] text-blue-300">
                ℹ️ À la validation, le partenaire reçoit automatiquement son code promo officiel et le lien vers ses conditions contractuelles.
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={addLoading}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  <Plus className="w-4 h-4" />
                  {addLoading ? 'Création en cours...' : 'Créer l’affilié'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 6-BIS. MODAL DE CONFIRMATION ET ACTIVATION DE L'AFFILIÉ (BUG 1 FIX) */}
      {/* ===================================================================== */}
      {createdAffiliateSuccess && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#141C2E] border border-blue-500/40 rounded-2xl w-full max-w-xl p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            {/* Header */}
            <div className="flex items-start justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    Partenaire Affilié Activé avec Succès !
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Son compte et son code promo officiel sont immédiatement opérationnels.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCreatedAffiliateSuccess(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            {/* Fiche récapitulative */}
            <div className="grid grid-cols-2 gap-3 bg-[#0B0F17] p-3.5 rounded-xl border border-slate-800/80 text-xs">
              <div>
                <span className="text-[11px] text-slate-400 block font-medium">Partenaire</span>
                <span className="text-sm font-bold text-white block mt-0.5">
                  {createdAffiliateSuccess.affiliate?.name || 'Partenaire'}
                </span>
                <span className="text-[11px] text-slate-400 block mt-0.5">
                  {createdAffiliateSuccess.affiliate?.email}
                </span>
                {createdAffiliateSuccess.affiliate?.phone && (
                  <span className="text-[11px] text-slate-400 block">
                    📞 {createdAffiliateSuccess.affiliate.phone}
                  </span>
                )}
              </div>

              <div>
                <span className="text-[11px] text-slate-400 block font-medium">Rémunération & Avantage</span>
                <span className="text-sm font-bold text-emerald-400 block mt-0.5">
                  {createdAffiliateSuccess.rate || createdAffiliateSuccess.affiliate?.commissionRate || 20}% de commission
                </span>
                <span className="text-[11px] text-blue-300 block mt-0.5">
                  🎁 -10% de réduction pour ses filleuls
                </span>
                <span className="text-[11px] text-slate-400 block">
                  +100 à 1 000 crédits bonus offerts
                </span>
              </div>
            </div>

            {/* Code Promo officiel */}
            <div className="p-3 bg-gradient-to-r from-blue-950/40 via-indigo-950/30 to-purple-950/40 rounded-xl border border-blue-800/40 flex items-center justify-between">
              <div>
                <span className="text-[11px] text-blue-300 font-medium block">Code Promo Officiel (Testé et Reconnu) :</span>
                <span className="text-xl font-extrabold text-white font-mono tracking-wider">
                  {createdAffiliateSuccess.code || createdAffiliateSuccess.affiliate?.code}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  const code = createdAffiliateSuccess.code || createdAffiliateSuccess.affiliate?.code;
                  navigator.clipboard.writeText(code);
                  setCopiedCodeSuccess(true);
                  setTimeout(() => setCopiedCodeSuccess(false), 2500);
                }}
                className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {copiedCodeSuccess ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedCodeSuccess ? 'Copié !' : 'Copier code'}
              </button>
            </div>

            {/* Badge d'autorisation automatique */}
            <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-800/40 text-[11px] text-emerald-300 flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white block font-semibold mb-0.5">
                  Déblocage automatique de l'Espace Ambassadeur :
                </strong>
                L'email <code className="text-emerald-200 font-mono">{createdAffiliateSuccess.affiliate?.email}</code> est immédiatement enregistré et autorisé. Dès que cette personne se connecte sur l'application avec cette adresse email, elle accède directement à son tableau de bord Ambassadeur (suivi des commissions, retraits Wave/OM, audit des filleuls).
              </div>
            </div>

            {/* Message d'invitation prêt à partager */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-slate-300 font-semibold flex items-center gap-1.5">
                  <Share2 className="w-3.5 h-3.5 text-blue-400" />
                  Message d'invitation prêt à l'emploi (WhatsApp / Email) :
                </span>
              </div>
              <div className="p-3 bg-[#0B0F17] rounded-xl border border-slate-800 text-[11px] text-slate-300 font-mono leading-relaxed select-all">
                Bonjour {createdAffiliateSuccess.affiliate?.name || ''}, votre compte Partenaire Ambassadeur PRAXIS a été activé avec succès ! Votre code promo exclusif est {createdAffiliateSuccess.code || createdAffiliateSuccess.affiliate?.code} (offre -10% et crédits bonus à vos enseignants, avec {createdAffiliateSuccess.rate || 20}% de commission pour vous). Connectez-vous sur PRAXIS avec votre adresse {createdAffiliateSuccess.affiliate?.email} pour suivre vos commissions en direct : {createdAffiliateSuccess.inviteUrl || `https://praxis-pro.pro/#affiliate?code=${createdAffiliateSuccess.code}`}
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-slate-800">
              {createdAffiliateSuccess.affiliate?.phone && (
                <a
                  href={`https://wa.me/${createdAffiliateSuccess.affiliate.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                    `Bonjour ${createdAffiliateSuccess.affiliate?.name || ''}, votre compte Partenaire Ambassadeur PRAXIS est actif ! Votre code promo exclusif est ${createdAffiliateSuccess.code || createdAffiliateSuccess.affiliate?.code} (-10% pour vos filleuls, ${createdAffiliateSuccess.rate || 20}% de commission pour vous). Accédez à votre Espace Ambassadeur : ${createdAffiliateSuccess.inviteUrl || `https://praxis-pro.pro/#affiliate?code=${createdAffiliateSuccess.code}`}`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                  Envoyer sur WhatsApp
                </a>
              )}

              <button
                type="button"
                onClick={() => {
                  const text = `Bonjour ${createdAffiliateSuccess.affiliate?.name || ''}, votre compte Partenaire Ambassadeur PRAXIS a été activé avec succès ! Votre code promo exclusif est ${createdAffiliateSuccess.code || createdAffiliateSuccess.affiliate?.code} (offre -10% et crédits bonus à vos enseignants, avec ${createdAffiliateSuccess.rate || 20}% de commission pour vous). Connectez-vous sur PRAXIS avec votre adresse ${createdAffiliateSuccess.affiliate?.email} pour suivre vos commissions en direct : ${createdAffiliateSuccess.inviteUrl || `https://praxis-pro.pro/#affiliate?code=${createdAffiliateSuccess.code}`}`;
                  navigator.clipboard.writeText(text);
                  setCopiedInvite(true);
                  setTimeout(() => setCopiedInvite(false), 2500);
                }}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {copiedInvite ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-blue-400" />}
                {copiedInvite ? 'Message Copié !' : 'Copier l’invitation'}
              </button>

              <button
                type="button"
                onClick={() => setCreatedAffiliateSuccess(null)}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-colors cursor-pointer"
              >
                Terminé
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL ENVOYER MESSAGE */}
      {isMessageModalOpen && messagingAffiliate && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#141C2E] border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Send className="w-5 h-5 text-purple-400" />
                  Envoyer un Message au Partenaire
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Destinataire : {messagingAffiliate.name}</p>
              </div>
              <button
                type="button"
                onClick={() => setIsMessageModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSendMessage} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Canal de transmission :</label>
                  <select
                    value={messageForm.channel}
                    onChange={(e) => setMessageForm({ ...messageForm, channel: e.target.value as any })}
                    className="w-full bg-[#0B0F17] border border-slate-700 rounded-xl p-2.5 text-white"
                  >
                    <option value="Email">Email officiel</option>
                    <option value="SMS">SMS / WhatsApp</option>
                    <option value="Notification">Notification Dashboard</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Objet :</label>
                  <input
                    type="text"
                    required
                    value={messageForm.subject}
                    onChange={(e) => setMessageForm({ ...messageForm, subject: e.target.value })}
                    className="w-full bg-[#0B0F17] border border-slate-700 rounded-xl p-2.5 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Corps du message :</label>
                <textarea
                  rows={4}
                  required
                  value={messageForm.message}
                  onChange={(e) => setMessageForm({ ...messageForm, message: e.target.value })}
                  placeholder={`Bonjour ${messagingAffiliate.name.split(' ')[0]},\nNous vous informons que vos commissions du mois sont prêtes...`}
                  className="w-full bg-[#0B0F17] border border-slate-700 rounded-xl p-2.5 text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsMessageModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={messageLoading}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  {messageLoading ? 'Envoi...' : 'Transmettre le message'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL SUSPENDRE AFFILIÉ */}
      {isSuspendModalOpen && suspendingAffiliate && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#141C2E] border border-amber-800/80 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-amber-300 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-400" />
              Suspendre le partenaire {suspendingAffiliate.name} ?
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              La suspension désactivera temporairement la validation de nouvelles commissions liées à son code promo{' '}
              <strong className="text-white font-mono">{suspendingAffiliate.code || suspendingAffiliate.affiliateCode}</strong>.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsSuspendModalOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={() => handleUpdateStatus(suspendingAffiliate, 'Suspendu')}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold"
              >
                Confirmer la suspension
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CONTRAT AFFILIÉ */}
      {isContractModalOpen && contractAffiliate && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#141C2E] border border-slate-800 rounded-2xl w-full max-w-xl p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-400" />
                  Contrat d'Apporteur d'Affaires — PRAXIS IA
                </h3>
                <p className="text-xs text-slate-400">Partenaire : {contractAffiliate.name}</p>
              </div>
              <button
                type="button"
                onClick={() => setIsContractModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="bg-[#0B0F17] p-4 rounded-xl border border-slate-800 text-xs text-slate-300 space-y-2.5 max-h-80 overflow-y-auto leading-relaxed">
              <p className="font-bold text-white">CONVENTION DE PARTENARIAT ET APPORT D'AFFAIRES</p>
              <p>
                <strong>Entre les soussignés :</strong>
                <br />
                1. <strong>PRAXIS IA Education</strong>, plateforme de correction pédagogique assistée par Intelligence Artificielle.
                <br />
                2. <strong>{contractAffiliate.name}</strong>, domicilié(e) à {contractAffiliate.phone || 'Côte d’Ivoire'}, joignable à {contractAffiliate.email}.
              </p>
              <p>
                <strong>Article 1 — Objet :</strong> L'apporteur d'affaires assure la promotion de la solution PRAXIS auprès des établissements scolaires, collèges, lycées et corps professoral en Côte d'Ivoire et Afrique de l'Ouest.
              </p>
              <p>
                <strong>Article 2 — Rémunération :</strong> Le taux de commission standard est fixé à <strong>{contractAffiliate.commissionRate || 20}%</strong> sur chaque encaissement net hors taxes généré via le code promo <code>{contractAffiliate.code || contractAffiliate.affiliateCode}</code>. À compter du 20ème client actif, le taux passe à 25% VIP.
              </p>
              <p>
                <strong>Article 3 — Modalités de Paiement :</strong> Les versements sont effectués de façon hebdomadaire ou mensuelle sur demande, dès que le solde accumulé atteint le seuil minimum de 100 000 FCFA, via Wave, Orange Money ou Virement Bancaire.
              </p>
              <p className="text-emerald-400 font-semibold">
                ✓ Statut contractuel : {contractAffiliate.contractStatus || 'Signé numériquement'} • Validité jusqu'au {contractAffiliate.contractExpiry || '2027-06-14'}.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsContractModalOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
              >
                Fermer
              </button>
              <button
                type="button"
                onClick={() => {
                  showToast('✓ Contrat téléchargé en PDF', 'success');
                  setIsContractModalOpen(false);
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                Télécharger le contrat (PDF)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CRÉATION LIEN D'INVITATION PRIVÉ */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#141C2E] border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-start justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <LinkIcon className="w-5 h-5 text-amber-400" />
                  Nouveau Lien d'Invitation Privé
                </h3>
                <p className="text-xs text-slate-400">Générez un accès sur-mesure pour un partenaire sélectionné</p>
              </div>
              <button
                type="button"
                onClick={() => setIsInviteModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateInviteLink} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">
                  Code / Jeton d'Invitation *
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newInviteForm.token}
                    onChange={(e) => setNewInviteForm({ ...newInviteForm, token: e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, '') })}
                    placeholder="Ex : VIP-AMBASSADEUR-2026"
                    className="flex-1 px-3 py-2 bg-[#0B0F17] border border-slate-700 rounded-xl text-white font-mono uppercase focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const rand = `VIP-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
                      setNewInviteForm({ ...newInviteForm, token: rand });
                    }}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold cursor-pointer"
                  >
                    Aléatoire
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">
                  Libellé / Destinataire *
                </label>
                <input
                  type="text"
                  value={newInviteForm.label}
                  onChange={(e) => setNewInviteForm({ ...newInviteForm, label: e.target.value })}
                  placeholder="Ex : Invitation Créateur YouTube / WhatsApp"
                  className="w-full px-3 py-2 bg-[#0B0F17] border border-slate-700 rounded-xl text-white focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">
                    Taux Commission (%)
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="50"
                    value={newInviteForm.commissionRate}
                    onChange={(e) => setNewInviteForm({ ...newInviteForm, commissionRate: parseInt(e.target.value, 10) || 20 })}
                    className="w-full px-3 py-2 bg-[#0B0F17] border border-slate-700 rounded-xl text-white font-mono focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">
                    Max Utilisations
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="1000"
                    value={newInviteForm.maxUses}
                    onChange={(e) => setNewInviteForm({ ...newInviteForm, maxUses: parseInt(e.target.value, 10) || 5 })}
                    className="w-full px-3 py-2 bg-[#0B0F17] border border-slate-700 rounded-xl text-white font-mono focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                    required
                  />
                </div>
              </div>

              <div className="p-3 bg-amber-950/40 border border-amber-800/50 rounded-xl text-[11px] text-amber-200">
                💡 <strong>Lien généré :</strong> https://praxis-pro.pro/#ambassadeur?invite={newInviteForm.token || 'VOTRE-CODE'}
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsInviteModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={inviteLoading}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-bold flex items-center gap-1.5 cursor-pointer shadow-md disabled:opacity-50"
                >
                  {inviteLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  <span>Créer le lien</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
