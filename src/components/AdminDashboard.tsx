import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Shield,
  Lock,
  Unlock,
  KeyRound,
  Eye,
  EyeOff,
  BarChart3,
  Users,
  CreditCard,
  Zap,
  TrendingUp,
  TrendingDown,
  Search,
  Filter,
  Download,
  Upload,
  Plus,
  ArrowUpRight,
  CheckCircle2,
  AlertCircle,
  Clock,
  Send,
  RotateCcw,
  Trash2,
  MoreVertical,
  ChevronRight,
  ExternalLink,
  Mail,
  Phone,
  FileSpreadsheet,
  FileText,
  DollarSign,
  PieChart as PieIcon,
  ShieldCheck,
  RefreshCw,
  LogOut,
  Sliders,
  Sparkles,
  HelpCircle,
  Building2,
  Calendar,
  Layers,
  ArrowLeft,
  Award,
  Database,
} from 'lucide-react';
import {
  Chart,
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  Title,
  CategoryScale,
  Tooltip,
  Legend,
  Filler,
  DoughnutController,
  ArcElement,
} from 'chart.js';
import { TeacherAccount, TransactionRecord, AdminKPISummary, SaaSPlan, AccountStatus, SchoolQuoteRequest } from '../types';
import { AdminAffiliatesView } from './AdminAffiliatesView';

// Register Chart.js components
Chart.register(
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  Title,
  CategoryScale,
  Tooltip,
  Legend,
  Filler,
  DoughnutController,
  ArcElement
);

interface AdminDashboardProps {
  onBackToApp: () => void;
}

type TabKey = 'overview' | 'crm' | 'transactions' | 'automations' | 'quotes' | 'affiliates';

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onBackToApp }) => {
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    const token = sessionStorage.getItem('praxis_admin_token') || localStorage.getItem('praxis_admin_token');
    const expiresAt = sessionStorage.getItem('praxis_admin_expires') || localStorage.getItem('praxis_admin_expires');
    if (token && expiresAt && Number(expiresAt) > Date.now()) {
      return true;
    }
    return false;
  });

  const [masterPassword, setMasterPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [shakeAuth, setShakeAuth] = useState(false);

  // Active Tab
  const [activeTab, setActiveTab] = useState<TabKey>('overview');

  // Core Data
  const [stats, setStats] = useState<AdminKPISummary | null>(null);
  const [teachers, setTeachers] = useState<TeacherAccount[]>([]);
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [quotes, setQuotes] = useState<SchoolQuoteRequest[]>([]);
  const [quoteSearch, setQuoteSearch] = useState('');
  const [quoteStatusFilter, setQuoteStatusFilter] = useState<string>('all');
  const [convertingQuoteId, setConvertingQuoteId] = useState<string | null>(null);
  const [settings, setSettings] = useState<any>(null);
  const [loadingData, setLoadingData] = useState(false);
  const [isLiveSyncing, setIsLiveSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date>(new Date());
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Filters & Search for CRM
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlanFilter, setSelectedPlanFilter] = useState<string>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'copies' | 'spent'>('date');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  // Modals
  const [selectedTeacherForDetail, setSelectedTeacherForDetail] = useState<TeacherAccount | null>(null);
  const [selectedTeacherForEdit, setSelectedTeacherForEdit] = useState<TeacherAccount | null>(null);
  const [selectedTeacherForRefund, setSelectedTeacherForRefund] = useState<TeacherAccount | null>(null);
  const [selectedTeacherForEmail, setSelectedTeacherForEmail] = useState<TeacherAccount | null>(null);
  const [selectedTeacherForDelete, setSelectedTeacherForDelete] = useState<TeacherAccount | null>(null);
  const [isAddTeacherOpen, setIsAddTeacherOpen] = useState(false);
  const [restoringDirectory, setRestoringDirectory] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [csvImportText, setCsvImportText] = useState('');
  const [importingTeachers, setImportingTeachers] = useState(false);

  // Supabase Live Sync State
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState(false);
  const [supabaseUrlInput, setSupabaseUrlInput] = useState('');
  const [supabaseKeyInput, setSupabaseKeyInput] = useState('');
  const [supabaseTab, setSupabaseTab] = useState<'api' | 'json'>('api');
  const [supabaseJsonInput, setSupabaseJsonInput] = useState('');
  const [supabaseConnecting, setSupabaseConnecting] = useState(false);
  const [supabaseStatusInfo, setSupabaseStatusInfo] = useState<{
    configured: boolean;
    connected: boolean;
    remoteUsersCount: number | null;
    localUsersCount: number;
    message: string;
    url?: string;
  } | null>(null);

  // New Teacher Form state
  const [newTeacherForm, setNewTeacherForm] = useState({
    name: '',
    email: '',
    whatsapp: '',
    school: '',
    city: '',
    plan: 'trial' as SaaSPlan,
    status: 'trial' as AccountStatus,
    notes: '',
  });

  // Refund Form State
  const [refundReason, setRefundReason] = useState('Demande de rétractation dans les délais');
  const [refundAmount, setRefundAmount] = useState<number>(9.99);

  // Email Form State
  const [emailTemplate, setEmailTemplate] = useState<'onboarding' | 'trial_end' | 'update'>('onboarding');
  const [customSubject, setCustomSubject] = useState('');

  // Telegram, Paystack & Gemini test states
  const [telegramTesting, setTelegramTesting] = useState(false);
  const [paystackTesting, setPaystackTesting] = useState(false);
  const [geminiTesting, setGeminiTesting] = useState(false);
  const [savingKeys, setSavingKeys] = useState(false);
  const [keysForm, setKeysForm] = useState({
    telegramBotToken: '',
    telegramChatId: '7847633142',
    paystackSecretKey: '',
    geminiApiKey: '',
  });

  // Chart References
  const lineChartCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const lineChartInstanceRef = useRef<Chart | null>(null);
  const doughnutChartCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const doughnutChartInstanceRef = useRef<Chart | null>(null);

  // Metric Toggle for Line Chart (default to users / registrations in demo mode)
  const [chartMetric, setChartMetric] = useState<'mrr' | 'users'>('users');

  // Toast Helper
  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Sync document title to praxis-pro.pro/admin while on the admin portal
  useEffect(() => {
    const originalTitle = document.title;
    document.title = 'Praxis Pro · Console Administrateur (praxis-pro.pro/admin)';
    return () => {
      document.title = originalTitle || 'PRAXIS PRO · Correction Pédagogique Intelligente';
    };
  }, []);

  // Get Active Admin Token
  const getAdminToken = () => {
    return sessionStorage.getItem('praxis_admin_token') || localStorage.getItem('praxis_admin_token') || '';
  };

  // Check auth and session validity
  useEffect(() => {
    if (!isAuthenticated) return;

    const token = getAdminToken();
    if (!token) {
      setIsAuthenticated(false);
      return;
    }

    // Verify token with backend
    fetch('/api/admin/verify', {
      headers: { 'x-admin-token': token },
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error('Session expirée');
        }
        return res.json();
      })
      .then(() => {
        fetchDashboardData(false);
      })
      .catch(() => {
        handleLogout('Votre session a expiré. Veuillez saisir à nouveau le mot de passe maître.');
      });
  }, [isAuthenticated]);

  // Real-Time Live Polling: Auto-refresh data every 5 seconds silently without UI locking
  useEffect(() => {
    if (!isAuthenticated) return;

    const timer = setInterval(() => {
      fetchDashboardData(true);
    }, 5000);

    return () => clearInterval(timer);
  }, [isAuthenticated]);

  // Load Dashboard Data (silent = true refreshes background without freezing UI)
  const fetchDashboardData = async (silent = false) => {
    const token = getAdminToken();
    if (!token) return;

    if (!silent) {
      setLoadingData(true);
    } else {
      setIsLiveSyncing(true);
    }

    try {
      const [statsRes, teachersRes, settingsRes, quotesRes] = await Promise.all([
        fetch('/api/admin/stats', { headers: { 'x-admin-token': token } }),
        fetch('/api/admin/teachers', { headers: { 'x-admin-token': token } }),
        fetch('/api/admin/settings', { headers: { 'x-admin-token': token } }),
        fetch('/api/admin/quotes', { headers: { 'x-admin-token': token } }),
      ]);

      if (statsRes.status === 401 || teachersRes.status === 401) {
        handleLogout('Session expirée. Veuillez vous reconnecter.');
        return;
      }

      const statsData = await statsRes.json();
      const teachersData = await teachersRes.json();
      const settingsData = await settingsRes.json();
      const quotesData = quotesRes.ok ? await quotesRes.json() : null;

      if (statsData?.metrics) {
        setStats(statsData.metrics);
        setTransactions(statsData.transactions || []);
      }
      if (teachersData?.teachers) {
        setTeachers(teachersData.teachers);
      }
      if (settingsData) {
        setSettings(settingsData);
      }
      if (Array.isArray(quotesData?.quotes)) {
        setQuotes(quotesData.quotes);
      }
      setLastSyncTime(new Date());
    } catch (err: any) {
      console.error('[Admin] Erreur chargement données:', err);
      if (!silent) {
        showToast('Erreur lors du chargement des données d’administration.', 'error');
      }
    } finally {
      if (!silent) setLoadingData(false);
      setIsLiveSyncing(false);
    }
  };

  // Handle Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!masterPassword.trim()) {
      setAuthError('Veuillez renseigner le mot de passe maître.');
      return;
    }

    setAuthLoading(true);
    setAuthError('');

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: masterPassword }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setShakeAuth(true);
        setTimeout(() => setShakeAuth(false), 600);
        setAuthError(data.error || 'Mot de passe maître invalide.');
        return;
      }

      // Save token and expiry
      sessionStorage.setItem('praxis_admin_token', data.token);
      sessionStorage.setItem('praxis_admin_expires', String(data.expiresAt));
      localStorage.setItem('praxis_admin_token', data.token);
      localStorage.setItem('praxis_admin_expires', String(data.expiresAt));
      setIsAuthenticated(true);
      setMasterPassword('');
      showToast('Accès sécurisé accordé au SaaS Admin Praxis.', 'success');
    } catch (err: any) {
      setAuthError('Erreur de communication avec le serveur.');
    } finally {
      setAuthLoading(false);
    }
  };

  // Handle Logout
  const handleLogout = (message?: string) => {
    const token = getAdminToken();
    if (token) {
      fetch('/api/admin/logout', {
        method: 'POST',
        headers: { 'x-admin-token': token },
      }).catch(() => {});
    }

    sessionStorage.removeItem('praxis_admin_token');
    sessionStorage.removeItem('praxis_admin_expires');
    localStorage.removeItem('praxis_admin_token');
    localStorage.removeItem('praxis_admin_expires');
    setIsAuthenticated(false);
    if (message) {
      setAuthError(message);
    }
  };

  // Render Line Chart
  useEffect(() => {
    if (activeTab !== 'overview' || !stats?.mrrMonthlyHistory?.length || !lineChartCanvasRef.current) {
      return;
    }

    if (lineChartInstanceRef.current) {
      lineChartInstanceRef.current.destroy();
    }

    const labels = stats.mrrMonthlyHistory.map((h) => h.month);
    const dataPoints =
      chartMetric === 'mrr'
        ? stats.mrrMonthlyHistory.map((h) => h.mrr)
        : stats.mrrMonthlyHistory.map((h) => h.users);

    const ctx = lineChartCanvasRef.current.getContext('2d');
    if (!ctx) return;

    // Gradient background for dark navy theme
    const gradient = ctx.createLinearGradient(0, 0, 0, 260);
    if (chartMetric === 'mrr') {
      gradient.addColorStop(0, 'rgba(59, 130, 246, 0.35)');
      gradient.addColorStop(1, 'rgba(59, 130, 246, 0.0)');
    } else {
      gradient.addColorStop(0, 'rgba(16, 185, 129, 0.35)');
      gradient.addColorStop(1, 'rgba(16, 185, 129, 0.0)');
    }

    lineChartInstanceRef.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: chartMetric === 'mrr' ? 'MRR (€/mois)' : 'Total Enseignants Inscrits',
            data: dataPoints,
            borderColor: chartMetric === 'mrr' ? '#3B82F6' : '#10B981',
            borderWidth: 2.5,
            backgroundColor: gradient,
            fill: true,
            tension: 0.38,
            pointBackgroundColor: '#0B0F17',
            pointBorderColor: chartMetric === 'mrr' ? '#60A5FA' : '#34D399',
            pointBorderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 6,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#1E293B',
            titleColor: '#F8FAFC',
            bodyColor: '#94A3B8',
            borderColor: '#334155',
            borderWidth: 1,
            padding: 10,
            displayColors: false,
            callbacks: {
              label: (context) => {
                return chartMetric === 'mrr'
                  ? `Revenu Mensuel : ${context.parsed.y.toLocaleString('fr-FR')} €`
                  : `Enseignants : ${context.parsed.y}`;
              },
            },
          },
        },
        scales: {
          x: {
            grid: { color: 'rgba(51, 65, 85, 0.25)' },
            ticks: { color: '#64748B', font: { size: 11 } },
          },
          y: {
            min: 0,
            suggestedMax: chartMetric === 'mrr' ? 50 : 10,
            grid: { color: 'rgba(51, 65, 85, 0.25)' },
            ticks: {
              color: '#64748B',
              font: { size: 11 },
              callback: (val) => (chartMetric === 'mrr' ? `${val} €` : val),
            },
          },
        },
      },
    });

    return () => {
      if (lineChartInstanceRef.current) {
        lineChartInstanceRef.current.destroy();
      }
    };
  }, [activeTab, stats, chartMetric]);

  // Render Donut Chart for Plan Distribution
  useEffect(() => {
    if (activeTab !== 'overview' || !stats?.planDistribution || !doughnutChartCanvasRef.current) {
      return;
    }

    if (doughnutChartInstanceRef.current) {
      doughnutChartInstanceRef.current.destroy();
    }

    const { free, trial, monthly, annual, institution } = stats.planDistribution;
    const ctx = doughnutChartCanvasRef.current.getContext('2d');
    if (!ctx) return;

    const totalAccounts = (free || 0) + (trial || 0) + (monthly || 0) + (annual || 0) + (institution || 0);

    const labels =
      totalAccounts === 0
        ? ['En attente d’inscriptions réelles']
        : ['Essai 7j', 'Pro Mensuel (9.99€)', 'Pro Annuel (99.99€)', 'Établissement (299€)', 'Gratuit (15 crédits offerts)'];

    const chartData =
      totalAccounts === 0
        ? [1]
        : [trial, monthly, annual, institution, free];

    const chartColors =
      totalAccounts === 0
        ? ['#1E293B']
        : [
            '#F59E0B', // Trial (amber)
            '#3B82F6', // Monthly (blue)
            '#8B5CF6', // Annual (purple)
            '#10B981', // Institution (emerald)
            '#475569', // Free (slate)
          ];

    doughnutChartInstanceRef.current = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [
          {
            data: chartData,
            backgroundColor: chartColors,
            borderColor: '#0B0F17',
            borderWidth: 3,
            hoverOffset: totalAccounts === 0 ? 0 : 4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '72%',
        plugins: {
          legend: { display: false },
          tooltip: {
            enabled: totalAccounts > 0,
            backgroundColor: '#1E293B',
            titleColor: '#F8FAFC',
            bodyColor: '#94A3B8',
            borderColor: '#334155',
            borderWidth: 1,
            padding: 10,
          },
        },
      },
    });

    return () => {
      if (doughnutChartInstanceRef.current) {
        doughnutChartInstanceRef.current.destroy();
      }
    };
  }, [activeTab, stats]);

  // CRM Summary Counts across all registered teachers
  const crmCounts = useMemo(() => {
    const total = teachers.length;
    const active = teachers.filter(
      (t) => t.status === 'active' || (t.plan === 'trial' && (t.trialDaysLeft || 0) > 0)
    ).length;
    const inactive = teachers.filter(
      (t) => t.status === 'inactive' || t.status === 'canceled' || t.status === 'paused'
    ).length;
    const paid = teachers.filter(
      (t) => ['monthly', 'quarterly', 'school_year', 'annual', 'institution'].includes(t.plan) && t.status === 'active'
    ).length;
    const noCopies = teachers.filter((t) => !t.copiesCorrected || t.copiesCorrected === 0).length;
    return { total, active, inactive, paid, noCopies };
  }, [teachers]);

  // Filtered and Sorted Teachers for CRM Tab
  const filteredTeachers = useMemo(() => {
    let result = [...teachers];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.email.toLowerCase().includes(q) ||
          t.whatsapp.toLowerCase().includes(q) ||
          (t.school && t.school.toLowerCase().includes(q)) ||
          (t.city && t.city.toLowerCase().includes(q))
      );
    }

    if (selectedPlanFilter !== 'all') {
      result = result.filter((t) => t.plan === selectedPlanFilter);
    }

    if (selectedStatusFilter !== 'all') {
      if (selectedStatusFilter === 'active') {
        result = result.filter((t) => t.status === 'active' || (t.plan === 'trial' && (t.trialDaysLeft || 0) > 0));
      } else if (selectedStatusFilter === 'inactive') {
        result = result.filter((t) => t.status === 'inactive' || t.status === 'canceled' || t.status === 'paused');
      } else if (selectedStatusFilter === 'paid') {
        result = result.filter((t) => ['monthly', 'quarterly', 'school_year', 'annual', 'institution'].includes(t.plan) && t.status === 'active');
      } else if (selectedStatusFilter === 'trial') {
        result = result.filter((t) => t.status === 'trial');
      } else if (selectedStatusFilter === 'no_copies') {
        result = result.filter((t) => !t.copiesCorrected || t.copiesCorrected === 0);
      } else if (selectedStatusFilter === 'has_copies') {
        result = result.filter((t) => (t.copiesCorrected || 0) > 0);
      } else {
        result = result.filter((t) => t.status === selectedStatusFilter);
      }
    }

    // Sort
    result.sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'name') comparison = a.name.localeCompare(b.name);
      else if (sortBy === 'copies') comparison = (a.copiesCorrected || 0) - (b.copiesCorrected || 0);
      else if (sortBy === 'spent') comparison = (a.totalSpent || 0) - (b.totalSpent || 0);
      else comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();

      return sortOrder === 'desc' ? -comparison : comparison;
    });

    return result;
  }, [teachers, searchQuery, selectedPlanFilter, selectedStatusFilter, sortBy, sortOrder]);

  // Restore complete 200 teachers directory
  const handleRestoreDirectory = async () => {
    if (
      !window.confirm(
        'Voulez-vous restaurer l\'annuaire complet des 200 enseignants inscrits (actifs, inactifs, simples inscrits) ? Vos comptes réels et partenaires seront conservés.'
      )
    ) {
      return;
    }

    setRestoringDirectory(true);
    try {
      const res = await fetch('/api/admin/restore-directory', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': getAdminToken(),
        },
        body: JSON.stringify({ count: 200 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      showToast(data.message || 'Annuaire complet de 200 enseignants restauré avec succès.', 'success');
      setSelectedStatusFilter('all');
      setSelectedPlanFilter('all');
      setSearchQuery('');
      fetchDashboardData(false);
    } catch (err: any) {
      showToast(err.message || 'Erreur lors de la restauration.', 'error');
    } finally {
      setRestoringDirectory(false);
    }
  };

  // Bulk import teachers from CSV text
  const handleImportCSVSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!csvImportText.trim()) {
      showToast('Veuillez coller le contenu CSV des enseignants.', 'error');
      return;
    }

    setImportingTeachers(true);
    try {
      const res = await fetch('/api/admin/import-teachers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': getAdminToken(),
        },
        body: JSON.stringify({ csvText: csvImportText }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      showToast(data.message || 'Importation réussie.', 'success');
      setIsImportModalOpen(false);
      setCsvImportText('');
      fetchDashboardData(false);
    } catch (err: any) {
      showToast(err.message || 'Erreur lors de l’importation.', 'error');
    } finally {
      setImportingTeachers(false);
    }
  };

  // Fetch Supabase Status
  const fetchSupabaseStatus = async () => {
    try {
      const res = await fetch('/api/admin/supabase-status', {
        headers: { 'x-admin-token': getAdminToken() },
      });
      if (res.ok) {
        const data = await res.json();
        setSupabaseStatusInfo(data);
        if (data.url && !supabaseUrlInput) {
          setSupabaseUrlInput(data.url);
        }
      }
    } catch {}
  };

  // Open Supabase Modal
  const handleOpenSupabaseModal = () => {
    fetchSupabaseStatus();
    setIsSupabaseModalOpen(true);
  };

  // Connect & Sync Supabase Live
  const handleConnectSupabase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabaseUrlInput.trim() || !supabaseKeyInput.trim()) {
      showToast('Veuillez renseigner l’URL Supabase et la clé d’API.', 'error');
      return;
    }

    setSupabaseConnecting(true);
    try {
      const res = await fetch('/api/admin/supabase-connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': getAdminToken(),
        },
        body: JSON.stringify({
          supabaseUrl: supabaseUrlInput.trim(),
          supabaseKey: supabaseKeyInput.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      showToast(data.message || `Synchronisation réussie ! ${data.remoteCount} utilisateurs connectés.`, 'success');
      setIsSupabaseModalOpen(false);
      fetchDashboardData(false);
      fetchSupabaseStatus();
    } catch (err: any) {
      showToast(err.message || 'Erreur lors de la connexion Supabase.', 'error');
    } finally {
      setSupabaseConnecting(false);
    }
  };

  // Direct import of Supabase profiles JSON export
  const handleImportSupabaseJson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabaseJsonInput.trim()) {
      showToast('Veuillez coller le JSON exporté depuis Supabase.', 'error');
      return;
    }

    setSupabaseConnecting(true);
    try {
      const res = await fetch('/api/admin/supabase-import-json', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': getAdminToken(),
        },
        body: JSON.stringify({ rawJson: supabaseJsonInput }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      showToast(data.message || 'Importation JSON réussie !', 'success');
      setIsSupabaseModalOpen(false);
      setSupabaseJsonInput('');
      fetchDashboardData(false);
    } catch (err: any) {
      showToast(err.message || 'Erreur lors de l’importation du JSON.', 'error');
    } finally {
      setSupabaseConnecting(false);
    }
  };

  // Export CSV Helper
  const handleExportCSV = () => {
    if (!filteredTeachers.length) {
      showToast('Aucun enseignant à exporter.', 'info');
      return;
    }

    const headers = [
      'ID',
      'Nom',
      'Email',
      'WhatsApp',
      'Établissement',
      'Ville',
      'Forfait',
      'Statut',
      'Copies Corrigées',
      'Total Dépensé (€)',
      'Date Inscription',
      'Dernière Activité',
      'Notes Pédagogiques',
    ];

    const rows = filteredTeachers.map((t) => [
      t.id,
      `"${t.name.replace(/"/g, '""')}"`,
      `"${t.email}"`,
      `"${t.whatsapp}"`,
      `"${(t.school || '').replace(/"/g, '""')}"`,
      `"${(t.city || '').replace(/"/g, '""')}"`,
      t.plan,
      t.status,
      t.copiesCorrected || 0,
      t.totalSpent || 0,
      t.createdAt ? new Date(t.createdAt).toLocaleDateString('fr-FR') : '',
      t.lastActiveAt ? new Date(t.lastActiveAt).toLocaleDateString('fr-FR') : '',
      `"${(t.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `praxis_enseignants_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Export de ${filteredTeachers.length} enseignants téléchargé au format CSV Excel.`, 'success');
  };

  // Add New Teacher
  const handleCreateTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeacherForm.name.trim() || !newTeacherForm.email.trim()) {
      showToast('Nom et email obligatoires.', 'error');
      return;
    }

    try {
      const res = await fetch('/api/admin/teachers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': getAdminToken(),
        },
        body: JSON.stringify(newTeacherForm),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur lors de la création');

      showToast(`Compte enseignant de ${newTeacherForm.name} créé avec succès.`, 'success');
      setIsAddTeacherOpen(false);
      setNewTeacherForm({
        name: '',
        email: '',
        whatsapp: '',
        school: '',
        city: '',
        plan: 'trial',
        status: 'trial',
        notes: '',
      });
      fetchDashboardData();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  // Update Teacher Plan / Status
  const handleUpdateTeacher = async (id: string, updates: Partial<TeacherAccount>) => {
    try {
      const res = await fetch(`/api/admin/teachers/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': getAdminToken(),
        },
        body: JSON.stringify(updates),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur de mise à jour');

      showToast('Compte enseignant mis à jour avec succès.', 'success');
      setSelectedTeacherForEdit(null);
      fetchDashboardData();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  // Process Refund
  const handleProcessRefund = async () => {
    if (!selectedTeacherForRefund) return;

    try {
      const res = await fetch(`/api/admin/teachers/${selectedTeacherForRefund.id}/refund`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': getAdminToken(),
        },
        body: JSON.stringify({ reason: refundReason, amount: refundAmount }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur lors du remboursement');

      showToast(data.message || 'Remboursement validé.', 'success');
      setSelectedTeacherForRefund(null);
      fetchDashboardData();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  // Send Transactional Email
  const handleSendEmail = async () => {
    if (!selectedTeacherForEmail) return;

    try {
      const res = await fetch(`/api/admin/teachers/${selectedTeacherForEmail.id}/send-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': getAdminToken(),
        },
        body: JSON.stringify({ templateId: emailTemplate, customSubject }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur lors de l’envoi');

      showToast(data.message || 'Email transactionnel délivré avec succès.', 'success');
      setSelectedTeacherForEmail(null);
      setCustomSubject('');
      fetchDashboardData();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  // Delete Teacher
  const handleDeleteTeacher = async () => {
    if (!selectedTeacherForDelete) return;

    try {
      const res = await fetch(`/api/admin/teachers/${selectedTeacherForDelete.id}`, {
        method: 'DELETE',
        headers: {
          'x-admin-token': getAdminToken(),
        },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur lors de la suppression');

      showToast('Enseignant supprimé de la base.', 'success');
      setSelectedTeacherForDelete(null);
      fetchDashboardData();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  // Test Telegram Bot
  const handleTestTelegram = async () => {
    setTelegramTesting(true);
    try {
      const res = await fetch('/api/admin/telegram-test', {
        method: 'POST',
        headers: { 'x-admin-token': getAdminToken() },
      });

      const data = await res.json();
      if (data.success) {
        showToast('Notification test envoyée avec succès sur Telegram !', 'success');
      } else {
        showToast(data.error || 'Échec du test Telegram.', 'error');
      }
    } catch (err: any) {
      showToast('Erreur réseau lors de l’appel Telegram.', 'error');
    } finally {
      setTelegramTesting(false);
    }
  };

  // Test Paystack Gateway
  const handleTestPaystack = async () => {
    setPaystackTesting(true);
    try {
      const res = await fetch('/api/admin/paystack-test', {
        method: 'POST',
        headers: { 'x-admin-token': getAdminToken() },
      });

      const data = await res.json();
      if (data.success) {
        showToast(data.message || 'Passerelle Paystack validée avec succès !', 'success');
      } else {
        showToast(data.error || 'Échec du test Paystack.', 'error');
      }
    } catch (err: any) {
      showToast('Erreur réseau lors du test Paystack.', 'error');
    } finally {
      setPaystackTesting(false);
    }
  };

  // Test Gemini AI
  const handleTestGemini = async () => {
    setGeminiTesting(true);
    try {
      const res = await fetch('/api/admin/gemini-test', {
        method: 'POST',
        headers: { 'x-admin-token': getAdminToken() },
      });

      const data = await res.json();
      if (data.success) {
        showToast(data.message + (data.sampleReply ? ` (Réponse: ${data.sampleReply})` : ''), 'success');
      } else {
        showToast(data.error || 'Échec du test Gemini.', 'error');
      }
    } catch (err: any) {
      showToast('Erreur réseau lors du test Gemini.', 'error');
    } finally {
      setGeminiTesting(false);
    }
  };

  // Save API Keys
  const handleSaveKeys = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingKeys(true);
    try {
      const res = await fetch('/api/admin/settings/keys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': getAdminToken(),
        },
        body: JSON.stringify(keysForm),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast('Clés API sauvegardées avec succès dans l’environnement !', 'success');
        fetchDashboardData(true);
      } else {
        showToast(data.error || 'Erreur lors de la sauvegarde des clés.', 'error');
      }
    } catch (err: any) {
      showToast('Erreur réseau lors de la sauvegarde des clés.', 'error');
    } finally {
      setSavingKeys(false);
    }
  };

  // Clear Database to start with 0 real-time records
  const handleClearLeads = async () => {
    if (
      !window.confirm(
        'Voulez-vous remettre la base de données à zéro ? Toutes les données de démonstration seront effacées et le tableau de bord affichera uniquement les vraies inscriptions en temps réel.'
      )
    ) {
      return;
    }

    try {
      const res = await fetch('/api/admin/clear-leads', {
        method: 'POST',
        headers: { 'x-admin-token': getAdminToken() },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      showToast(data.message || 'Base remise à zéro. Données 100% réelles.', 'success');
      fetchDashboardData(false);
    } catch (err: any) {
      showToast('Erreur lors de la remise à zéro.', 'error');
    }
  };

  // Quotes Management Handlers
  const handleUpdateQuoteStatus = async (id: string, status: string, notes?: string) => {
    try {
      const res = await fetch(`/api/admin/quotes/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': getAdminToken(),
        },
        body: JSON.stringify({ status, notes }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur mise à jour devis');
      showToast('Statut du devis mis à jour avec succès.', 'success');
      fetchDashboardData(true);
    } catch (err: any) {
      showToast(err.message || 'Erreur mise à jour.', 'error');
    }
  };

  const handleConvertQuoteToInstitution = async (id: string) => {
    setConvertingQuoteId(id);
    try {
      const res = await fetch(`/api/admin/quotes/${id}/convert`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': getAdminToken(),
        },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur conversion établissement');
      showToast(data.message || 'Établissement activé avec succès !', 'success');
      fetchDashboardData(true);
    } catch (err: any) {
      showToast(err.message || 'Erreur conversion.', 'error');
    } finally {
      setConvertingQuoteId(null);
    }
  };

  // Helper Badge Renderers
  const renderPlanBadge = (plan: SaaSPlan) => {
    switch (plan) {
      case 'annual':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-purple-950/80 text-purple-300 border border-purple-700/50">
            Pro Annuel (99.99€)
          </span>
        );
      case 'monthly':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-blue-950/80 text-blue-300 border border-blue-700/50">
            Pro Mensuel (9.99€)
          </span>
        );
      case 'trial':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-950/80 text-amber-300 border border-amber-700/50">
            Essai Pro 7j
          </span>
        );
      case 'institution':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-700/50">
            Établissement (299€)
          </span>
        );
      case 'free':
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-800 text-slate-300 border border-slate-700">
            Gratuit (15 crédits offerts)
          </span>
        );
    }
  };

  const renderStatusBadge = (status: AccountStatus, teacher?: TeacherAccount) => {
    // If teacher is free/inactive with 0 copies, highlight as simple signup
    if (teacher && teacher.plan === 'free' && (!teacher.copiesCorrected || teacher.copiesCorrected === 0)) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
          Simple inscription
        </span>
      );
    }

    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-950/60 text-emerald-400 border border-emerald-800/60">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            Actif
          </span>
        );
      case 'trial':
        if (teacher && typeof teacher.trialDaysLeft === 'number' && teacher.trialDaysLeft <= 0) {
          return (
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-950/40 text-amber-300/80 border border-amber-800/40">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500/60"></span>
              Essai terminé
            </span>
          );
        }
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-950/60 text-amber-400 border border-amber-800/60">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
            En essai {teacher?.trialDaysLeft ? `(${teacher.trialDaysLeft}j)` : ''}
          </span>
        );
      case 'paused':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-950/60 text-blue-400 border border-blue-800/60">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
            En pause
          </span>
        );
      case 'canceled':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-950/60 text-rose-400 border border-rose-800/60">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
            Résilié
          </span>
        );
      case 'inactive':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-800/80 text-slate-400 border border-slate-700/80">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
            Inactif (historique)
          </span>
        );
    }
  };

  // ==========================================
  // VIEW 1: MASTER PASSWORD UNLOCK SCREEN
  // ==========================================
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0A0E17] text-slate-100 flex flex-col justify-between relative selection:bg-blue-600 selection:text-white">
        {/* Subtle grid background */}
        <div
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, #334155 1px, transparent 0)`,
            backgroundSize: '28px 28px',
          }}
        />

        {/* Header bar */}
        <div className="relative z-10 max-w-7xl mx-auto w-full px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold tracking-tight text-lg text-white">PRAXIS PRO</span>
                <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-blue-900/40 text-blue-300 border border-blue-700/40">
                  praxis-pro.pro/admin
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Portail de Gestion & Direction Générale
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onBackToApp}
              className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium text-slate-400 hover:text-white bg-slate-900/80 hover:bg-slate-800 border border-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Retour au site</span>
            </button>
          </div>
        </div>

        {/* Center Card */}
        <div className="relative z-10 w-full max-w-md mx-auto px-6 py-12">
          <div
            className={`bg-[#111827] border border-slate-800/90 rounded-2xl p-8 shadow-2xl transition-transform duration-200 ${
              shakeAuth ? 'translate-x-[-8px] animate-pulse border-rose-500/60' : ''
            }`}
          >
            <div className="flex flex-col items-center text-center mb-8">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-b from-blue-500/20 to-indigo-600/10 border border-blue-500/40 flex items-center justify-center text-blue-400 mb-4 shadow-inner">
                <Lock className="w-7 h-7" />
              </div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-950/80 border border-blue-800/60 text-[11px] font-mono text-blue-300 mb-2">
                <span>praxis-pro.pro/admin</span>
              </div>
              <h1 className="text-xl font-bold text-white tracking-tight">Console Administrateur Praxis Pro</h1>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed max-w-[290px]">
                Espace sécurisé de supervision. Saisissez le mot de passe maître pour déverrouiller la gestion des abonnements, CRM et métriques financières.
              </p>
            </div>

            {authError && (
              <div className="mb-6 p-3 rounded-xl bg-rose-950/40 border border-rose-800/60 flex items-start gap-2.5 text-xs text-rose-300">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{authError}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Mot de passe maître
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={masterPassword}
                    onChange={(e) => setMasterPassword(e.target.value)}
                    placeholder="••••••••••••••••"
                    required
                    autoFocus
                    className="w-full pl-3.5 pr-10 py-2.5 bg-[#0B0F17] border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-600 focus:outline-hidden focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <p className="text-[11px] text-slate-500">
                    Accès strictement réservé à la direction générale Praxis Pro.
                  </p>
                </div>
              </div>

              <button
                type="submit"
                disabled={authLoading}
                className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {authLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Vérification sécurisée...</span>
                  </>
                ) : (
                  <>
                    <Unlock className="w-4 h-4" />
                    <span>Déverrouiller le Dashboard</span>
                  </>
                )}
              </button>
            </form>
          </div>

          <p className="text-center text-xs text-slate-600 mt-6 flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Session chiffrée & protégée par jeton d'authentification Bearer</span>
          </p>
        </div>

        {/* Footer */}
        <div className="relative z-10 max-w-7xl mx-auto w-full px-6 py-6 text-center text-xs text-slate-600 border-t border-slate-900">
          Praxis EdTech Pro · Système d'Aide à la Correction Pédagogique par IA · Dashboard Propriétaire
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW 2: AUTHENTICATED SaaS ADMIN DASHBOARD (DARK NAVY PRO)
  // ==========================================
  return (
    <div className="min-h-screen bg-[#0B0F17] text-slate-100 selection:bg-blue-600 selection:text-white flex flex-col font-sans">
      {/* Toast Notification Popup */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-bounce-short">
          <div
            className={`flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-2xl text-xs font-semibold border backdrop-blur-md ${
              toastMessage.type === 'error'
                ? 'bg-rose-950/90 text-rose-200 border-rose-700/80'
                : toastMessage.type === 'info'
                ? 'bg-blue-950/90 text-blue-200 border-blue-700/80'
                : 'bg-emerald-950/90 text-emerald-200 border-emerald-700/80'
            }`}
          >
            {toastMessage.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-rose-400" />
            ) : toastMessage.type === 'info' ? (
              <HelpCircle className="w-4 h-4 text-blue-400" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            )}
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}

      {/* Top Navbar */}
      <header className="bg-[#101726] border-b border-slate-800/80 sticky top-0 z-40">
        <div className="w-full max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-3">
            {/* Left: Brand & Title */}
            <div className="flex items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={onBackToApp}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800/80 rounded-lg transition-colors cursor-pointer mr-1"
                title="Quitter la console et revenir à l'application de correction"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>

              <div className="w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400 shadow-xs">
                <Shield className="w-5 h-5" />
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-base tracking-tight text-white">PRAXIS PRO</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-900/60 text-blue-300 border border-blue-700/50">
                    Console Admin
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 hidden xl:block">
                  Administration & Gestion SaaS Temps Réel
                </p>
              </div>
            </div>

            {/* Center: Dynamic Navigation Tabs */}
            <nav className="flex items-center gap-1 bg-[#0B0F17] p-1 rounded-xl border border-slate-800 overflow-x-auto max-w-full">
              <button
                type="button"
                onClick={() => setActiveTab('overview')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  activeTab === 'overview'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>Vue d'ensemble</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('crm')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  activeTab === 'crm'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Enseignants</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-blue-950 text-blue-300 font-mono">
                  {teachers.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('transactions')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  activeTab === 'transactions'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Revenus</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('automations')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  activeTab === 'automations'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Automatisations</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('quotes')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  activeTab === 'quotes'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>Devis</span>
                {quotes.filter((q) => q.status === 'new').length > 0 ? (
                  <span className="inline-flex px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500 text-slate-950 font-bold font-mono animate-pulse">
                    {quotes.filter((q) => q.status === 'new').length}
                  </span>
                ) : (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-800 text-slate-400 font-mono">
                    {quotes.length}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('affiliates')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  activeTab === 'affiliates'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <Award className="w-3.5 h-3.5" />
                <span>Affiliés</span>
              </button>
            </nav>

            {/* Right: Actions, Sync, Logout */}
            <div className="flex items-center gap-2 shrink-0">
              {/* Live Real-Time Pulse Indicator */}
              <div
                className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-950/70 border border-emerald-800/60 text-xs font-medium text-emerald-300 shadow-xs"
                title="Synchronisation temps réel active (rafraîchissement automatique toutes les 5s)"
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span>En direct</span>
                <span className="font-mono text-[11px] text-emerald-400">
                  {lastSyncTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
              </div>

              <button
                type="button"
                onClick={() => fetchDashboardData(false)}
                disabled={loadingData}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                title="Forcer l'actualisation immédiate"
              >
                <RefreshCw className={`w-4 h-4 ${loadingData || isLiveSyncing ? 'animate-spin text-blue-400' : ''}`} />
              </button>

              <button
                type="button"
                onClick={() => handleLogout()}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-rose-400 hover:text-white hover:bg-rose-950/60 border border-rose-900/60 rounded-lg transition-colors cursor-pointer"
                title="Verrouiller la session administrateur"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Déconnexion</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Body */}
      <main className="flex-1 max-w-[1536px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* ========================================================= */}
        {/* TAB 1: 📊 VUE D'ENSEMBLE & MÉTRIQUES FINANCIÈRES (100% RÉELLES) */}
        {/* ========================================================= */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Real-time zero-teachers banner */}
            {teachers.length === 0 && (
              <div className="p-4 rounded-2xl bg-blue-950/40 border border-blue-800/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center shrink-0">
                    <Zap className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                      </span>
                      <p className="text-sm font-bold text-white">Dashboard connecté en temps réel (0 prof inscrit)</p>
                    </div>
                    <p className="text-xs text-slate-300 mt-0.5">
                      Le tableau de bord est branché sur votre base réelle. Dès qu'un professeur testera votre SaaS ou s'inscrira, ses métriques s'afficheront instantanément ici sans recharger la page.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddTeacherOpen(true)}
                  className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl shrink-0 transition-all cursor-pointer shadow-sm flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Créer un premier enseignant</span>
                </button>
              </div>
            )}

            {/* 4 HERO METRICS CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {/* Card 1: MRR */}
              <div className="bg-[#141C2E] border border-slate-800/90 rounded-2xl p-5 shadow-lg relative overflow-hidden group hover:border-blue-500/40 transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    MRR (Revenu Mensuel Réel)
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-blue-500/15 text-blue-400 flex items-center justify-center border border-blue-500/20">
                    <DollarSign className="w-4 h-4" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                    {(stats?.mrr || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €
                  </span>
                  <span className="text-xs text-slate-400 font-medium">/ mois</span>
                </div>
                <div className="mt-3 flex items-center justify-between text-xs pt-3 border-t border-slate-800">
                  <span className={`${(stats?.mrr || 0) > 0 ? 'text-emerald-400' : 'text-slate-400'} font-semibold flex items-center gap-1`}>
                    {(stats?.mrr || 0) > 0 ? (
                      <>
                        <TrendingUp className="w-3.5 h-3.5" /> Croissance active
                      </>
                    ) : (
                      '0 € récurrent'
                    )}
                  </span>
                  <span className="text-slate-400">Temps réel</span>
                </div>
              </div>

              {/* Card 2: ARR */}
              <div className="bg-[#141C2E] border border-slate-800/90 rounded-2xl p-5 shadow-lg relative overflow-hidden group hover:border-purple-500/40 transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    ARR (Revenu Annuel Projeté)
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-purple-500/15 text-purple-400 flex items-center justify-center border border-purple-500/20">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                    {(stats?.arr || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €
                  </span>
                  <span className="text-xs text-slate-400 font-medium">/ an</span>
                </div>
                <div className="mt-3 flex items-center justify-between text-xs pt-3 border-t border-slate-800">
                  <span className="text-purple-300 font-semibold">Calculé sur MRR × 12</span>
                  <span className="text-slate-400">Run-rate dynamique</span>
                </div>
              </div>

              {/* Card 3: Total Professeurs Inscrits */}
              <div className="bg-[#141C2E] border border-slate-800/90 rounded-2xl p-5 shadow-lg relative overflow-hidden group hover:border-emerald-500/40 transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Total Professeurs Inscrits
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                    <Users className="w-4 h-4" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                    {stats?.totalTeachers || 0}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">enseignants</span>
                </div>
                <div className="mt-3 flex items-center gap-2 text-[11px] pt-3 border-t border-slate-800 text-slate-400">
                  <span className="text-blue-400 font-semibold">{stats?.paidCount || 0} payants</span>
                  <span>•</span>
                  <span className="text-amber-400 font-semibold">{stats?.trialCount || 0} essais</span>
                  <span>•</span>
                  <span className="text-slate-400 font-semibold">{stats?.freeCount || 0} free</span>
                </div>
              </div>

              {/* Card 4: Abonnés Premium & Taux de Conversion */}
              <div className="bg-[#141C2E] border border-slate-800/90 rounded-2xl p-5 shadow-lg relative overflow-hidden group hover:border-amber-500/40 transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Conversion & Abonnés Pro
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-amber-500/15 text-amber-400 flex items-center justify-center border border-amber-500/20">
                    <Sparkles className="w-4 h-4" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-extrabold text-emerald-400 tracking-tight">
                    {stats?.conversionRate || 0} %
                  </span>
                  <span className="text-xs text-slate-400 font-medium">de conversion</span>
                </div>
                <div className="mt-3 flex items-center justify-between text-xs pt-3 border-t border-slate-800">
                  <span className="text-slate-300 font-semibold">{stats?.activeSubscribers || 0} abonnés actifs</span>
                  <span className="text-slate-400">Objectif: 30%</span>
                </div>
              </div>
            </div>

            {/* CHARTS SECTION (Chart.js Line & Doughnut) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Line Chart (12 Rolling Months) */}
              <div className="lg:col-span-2 bg-[#141C2E] border border-slate-800/90 rounded-2xl p-6 shadow-xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <div>
                    <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-blue-400" />
                      <span>Trajectoire Financière & Croissance (12 Mois Glissants)</span>
                    </h2>
                    <p className="text-xs text-slate-400 mt-1">
                      Évolution réelle du chiffre d'affaires récurrent et des inscriptions d'enseignants.
                    </p>
                  </div>

                  {/* Toggle Metric */}
                  <div className="flex items-center gap-1 bg-[#0B0F17] p-1 rounded-xl border border-slate-800 self-start sm:self-auto">
                    <button
                      type="button"
                      onClick={() => setChartMetric('mrr')}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        chartMetric === 'mrr'
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      MRR (€)
                    </button>
                    <button
                      type="button"
                      onClick={() => setChartMetric('users')}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        chartMetric === 'users'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Inscriptions
                    </button>
                  </div>
                </div>

                <div className="h-64 w-full">
                  <canvas ref={lineChartCanvasRef} />
                </div>
              </div>

              {/* Donut Chart (Plan Distribution) */}
              <div className="bg-[#141C2E] border border-slate-800/90 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
                <div>
                  <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2 mb-1">
                    <PieIcon className="w-4 h-4 text-purple-400" />
                    <span>Répartition des Formules</span>
                  </h2>
                  <p className="text-xs text-slate-400 mb-4">
                    Part des abonnements payants, essais 7j et comptes gratuits.
                  </p>
                </div>

                <div className="h-44 relative my-2">
                  <canvas ref={doughnutChartCanvasRef} />
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-xl font-extrabold text-white">{stats?.totalTeachers || 0}</span>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider">Comptes</span>
                  </div>
                </div>

                {/* Legend list */}
                <div className="space-y-1.5 pt-4 border-t border-slate-800 text-xs">
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#8B5CF6]"></span>
                      Pro Annuel (99.99€)
                    </span>
                    <span className="font-mono font-semibold">{stats?.planDistribution?.annual || 0}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#3B82F6]"></span>
                      Pro Mensuel (9.99€)
                    </span>
                    <span className="font-mono font-semibold">{stats?.planDistribution?.monthly || 0}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]"></span>
                      Essai Pro 7j
                    </span>
                    <span className="font-mono font-semibold">{stats?.planDistribution?.trial || 0}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]"></span>
                      Établissement (299€)
                    </span>
                    <span className="font-mono font-semibold">{stats?.planDistribution?.institution || 0}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#475569]"></span>
                      Gratuit Découverte
                    </span>
                    <span className="font-mono font-semibold">{stats?.planDistribution?.free || 0}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 3 MINI GROWTH METRICS CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Mini Card 1: 30-Day New Users */}
              <div className="bg-[#141C2E] border border-slate-800/90 rounded-2xl p-5 shadow-md flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Nouvelles Inscriptions (30j)
                  </span>
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <span className="text-xl font-bold text-white">{stats?.newTeachers30d || 0}</span>
                    <span className="text-xs text-emerald-400 font-semibold flex items-center gap-0.5">
                      <TrendingUp className="w-3 h-3" /> +{stats?.growthRate30d || 0}%
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">Croissance organique des collèges et lycées</p>
                </div>
              </div>

              {/* Mini Card 2: Active Trials */}
              <div className="bg-[#141C2E] border border-slate-800/90 rounded-2xl p-5 shadow-md flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                  <Clock className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Essais Gratuits en Cours
                  </span>
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <span className="text-xl font-bold text-white">{stats?.activeTrials || 0}</span>
                    <span className="text-xs text-amber-300 font-medium">professeurs actifs</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">Relance automatique par email à J-2</p>
                </div>
              </div>

              {/* Mini Card 3: ARPU */}
              <div className="bg-[#141C2E] border border-slate-800/90 rounded-2xl p-5 shadow-md flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                  <DollarSign className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    ARPU (Revenu Moyen / Client)
                  </span>
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <span className="text-xl font-bold text-white">
                      {(stats?.arpu || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €
                    </span>
                    <span className="text-xs text-slate-400">/ mois</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">Pondéré par les abonnements annuels</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: 👥 GESTION DES ENSEIGNANTS & COMPTES (CRM) */}
        {/* ========================================================= */}
        {activeTab === 'crm' && (
          <div className="space-y-6">
            {/* Action Toolbar */}
            <div className="bg-[#141C2E] border border-slate-800/90 rounded-2xl p-4 sm:p-5 shadow-lg flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
              {/* Search Bar */}
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher par nom, email, WhatsApp, lycée ou ville..."
                  className="w-full pl-9 pr-4 py-2 bg-[#0B0F17] border border-slate-700 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500/50"
                />
              </div>

              {/* Filters & Actions */}
              <div className="flex flex-wrap items-center gap-2.5">
                {/* Plan Filter */}
                <div className="flex items-center gap-1.5 bg-[#0B0F17] border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-300">
                  <Filter className="w-3.5 h-3.5 text-slate-400" />
                  <select
                    value={selectedPlanFilter}
                    onChange={(e) => setSelectedPlanFilter(e.target.value)}
                    className="bg-transparent border-none text-slate-200 text-xs focus:outline-hidden cursor-pointer"
                  >
                    <option value="all">Tous les forfaits</option>
                    <option value="trial">Essai Pro 7j</option>
                    <option value="monthly">Pro Mensuel (9.99€)</option>
                    <option value="annual">Pro Annuel (99.99€)</option>
                    <option value="institution">Établissement (299€)</option>
                    <option value="free">Gratuit</option>
                  </select>
                </div>

                {/* Status Filter */}
                <div className="flex items-center gap-1.5 bg-[#0B0F17] border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-300">
                  <select
                    value={selectedStatusFilter}
                    onChange={(e) => setSelectedStatusFilter(e.target.value)}
                    className="bg-transparent border-none text-slate-200 text-xs focus:outline-hidden cursor-pointer"
                  >
                    <option value="all">Tous les inscrits ({crmCounts.total})</option>
                    <option value="active">Actifs en cours ({crmCounts.active})</option>
                    <option value="inactive">Inactifs / Anciens ({crmCounts.inactive})</option>
                    <option value="paid">Abonnés payants ({crmCounts.paid})</option>
                    <option value="no_copies">Simples inscriptions ({crmCounts.noCopies})</option>
                    <option value="trial">En période d'essai</option>
                    <option value="paused">En pause</option>
                    <option value="canceled">Résilié</option>
                  </select>
                </div>

                {/* Export CSV Button */}
                <button
                  type="button"
                  onClick={handleExportCSV}
                  className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-xl border border-slate-700 transition-colors cursor-pointer"
                  title="Exporter la sélection au format CSV UTF-8 pour Excel"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Export CSV</span>
                </button>

                {/* Restore 200 Directory Button */}
                <button
                  type="button"
                  onClick={handleRestoreDirectory}
                  disabled={restoringDirectory}
                  className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold rounded-xl shadow-md border border-blue-400/30 transition-all cursor-pointer"
                  title="Restaurer l'annuaire complet des 200 enseignants (actifs, inactifs et historiques)"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${restoringDirectory ? 'animate-spin' : ''}`} />
                  <span>{restoringDirectory ? 'Restauration...' : 'Restaurer l’annuaire (200)'}</span>
                </button>

                {/* Connect & Sync Supabase Button */}
                <button
                  type="button"
                  onClick={handleOpenSupabaseModal}
                  className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-semibold rounded-xl shadow-md border border-emerald-400/30 transition-all cursor-pointer"
                  title="Connecter et synchroniser les utilisateurs depuis la base Supabase Cloud (367 utilisateurs)"
                >
                  <Database className="w-3.5 h-3.5" />
                  <span>Connecter Supabase (367)</span>
                </button>

                {/* Bulk Import CSV Button */}
                <button
                  type="button"
                  onClick={() => setIsImportModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-all cursor-pointer"
                  title="Importer une liste d'enseignants au format CSV"
                >
                  <Upload className="w-3.5 h-3.5 text-blue-400" />
                  <span>Importer CSV</span>
                </button>

                {/* Add Teacher Button */}
                <button
                  type="button"
                  onClick={() => setIsAddTeacherOpen(true)}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Nouveau Prof</span>
                </button>
              </div>
            </div>

            {/* Quick Status Chips Bar */}
            <div className="flex flex-wrap items-center gap-2 px-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mr-1">Vue rapide :</span>
              <button
                type="button"
                onClick={() => setSelectedStatusFilter('all')}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border ${
                  selectedStatusFilter === 'all'
                    ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-600/30'
                    : 'bg-[#141C2E] text-slate-300 border-slate-800 hover:border-slate-700'
                }`}
              >
                <span>Tous les inscrits</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/40 font-extrabold">{crmCounts.total}</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedStatusFilter('active')}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border ${
                  selectedStatusFilter === 'active'
                    ? 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-600/30'
                    : 'bg-[#141C2E] text-slate-300 border-slate-800 hover:border-slate-700'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Actifs en cours</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/40 font-extrabold">{crmCounts.active}</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedStatusFilter('inactive')}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border ${
                  selectedStatusFilter === 'inactive'
                    ? 'bg-slate-700 text-white border-slate-500 shadow-md'
                    : 'bg-[#141C2E] text-slate-300 border-slate-800 hover:border-slate-700'
                }`}
              >
                <span>Inactifs / Ne reviennent plus</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/40 font-extrabold">{crmCounts.inactive}</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedStatusFilter('paid')}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border ${
                  selectedStatusFilter === 'paid'
                    ? 'bg-purple-600 text-white border-purple-500 shadow-md'
                    : 'bg-[#141C2E] text-slate-300 border-slate-800 hover:border-slate-700'
                }`}
              >
                <span>Abonnés payants</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/40 font-extrabold">{crmCounts.paid}</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedStatusFilter('no_copies')}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border ${
                  selectedStatusFilter === 'no_copies'
                    ? 'bg-amber-600 text-white border-amber-500 shadow-md'
                    : 'bg-[#141C2E] text-slate-300 border-slate-800 hover:border-slate-700'
                }`}
              >
                <span>Simples inscriptions (0 copie)</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/40 font-extrabold">{crmCounts.noCopies}</span>
              </button>
            </div>

            {/* Teachers Table Card */}
            <div className="bg-[#141C2E] border border-slate-800/90 rounded-2xl shadow-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#101726] border-b border-slate-800 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                      <th className="py-3.5 px-4 cursor-pointer" onClick={() => { setSortBy('name'); setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'); }}>
                        Enseignant
                      </th>
                      <th className="py-3.5 px-4">Contact</th>
                      <th className="py-3.5 px-4">Établissement</th>
                      <th className="py-3.5 px-4">Forfait</th>
                      <th className="py-3.5 px-4">Statut</th>
                      <th className="py-3.5 px-4 cursor-pointer" onClick={() => { setSortBy('copies'); setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'); }}>
                        Copies Corrigées
                      </th>
                      <th className="py-3.5 px-4 cursor-pointer" onClick={() => { setSortBy('date'); setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'); }}>
                        Inscription
                      </th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-xs">
                    {filteredTeachers.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-14 text-center">
                          {teachers.length === 0 ? (
                            <div className="max-w-md mx-auto space-y-3">
                              <div className="w-12 h-12 rounded-2xl bg-emerald-950/70 border border-emerald-800/60 text-emerald-400 flex items-center justify-center mx-auto">
                                <span className="relative flex h-3 w-3">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                                </span>
                              </div>
                              <p className="text-sm font-bold text-white">Écoute en temps réel active (0 professeur)</p>
                              <p className="text-xs text-slate-400">
                                Aucun enseignant inscrit pour le moment. Dès qu'un professeur créera un compte ou testera la correction de copies sur votre site, il apparaîtra ici instantanément en direct.
                              </p>
                              <button
                                type="button"
                                onClick={() => setIsAddTeacherOpen(true)}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl text-xs transition-colors cursor-pointer inline-flex items-center gap-1.5"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                <span>Ajouter manuellement un enseignant</span>
                              </button>
                            </div>
                          ) : (
                            <span className="text-slate-500">Aucun enseignant ne correspond aux critères de recherche.</span>
                          )}
                        </td>
                      </tr>
                    ) : (
                      filteredTeachers.map((teacher) => (
                        <tr key={teacher.id} className="hover:bg-slate-800/40 transition-colors">
                          {/* Teacher Name & Initial */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-blue-900/60 border border-blue-700/50 text-blue-300 font-bold flex items-center justify-center text-xs shrink-0">
                                {teacher.name.slice(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <span className="font-bold text-white block">{teacher.name}</span>
                                <span className="text-[11px] text-slate-400 block truncate max-w-[160px]">
                                  {teacher.email}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Contact WhatsApp & Mail */}
                          <td className="py-3.5 px-4">
                            <div className="space-y-0.5">
                              {teacher.whatsapp ? (
                                <a
                                  href={`https://wa.me/${teacher.whatsapp.replace(/\D/g, '')}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-emerald-400 hover:underline flex items-center gap-1 text-[11px]"
                                  title="Ouvrir conversation WhatsApp"
                                >
                                  <Phone className="w-3 h-3" />
                                  <span>{teacher.whatsapp}</span>
                                </a>
                              ) : (
                                <span className="text-slate-500 text-[11px]">—</span>
                              )}
                              <a
                                href={`mailto:${teacher.email}`}
                                className="text-slate-400 hover:text-white flex items-center gap-1 text-[11px]"
                              >
                                <Mail className="w-3 h-3" />
                                <span>Écrire</span>
                              </a>
                            </div>
                          </td>

                          {/* School & City */}
                          <td className="py-3.5 px-4">
                            <span className="font-medium text-slate-200 block">{teacher.school || 'Non spécifié'}</span>
                            {teacher.city && <span className="text-[11px] text-slate-400 block">{teacher.city}</span>}
                          </td>

                          {/* Plan Badge */}
                          <td className="py-3.5 px-4">{renderPlanBadge(teacher.plan)}</td>

                          {/* Status Badge */}
                          <td className="py-3.5 px-4">{renderStatusBadge(teacher.status, teacher)}</td>

                          {/* Copies Progress */}
                          <td className="py-3.5 px-4">
                            <div className="w-32">
                              <div className="flex justify-between text-[11px] mb-1">
                                <span className="text-white font-semibold">{teacher.copiesCorrected || 0}</span>
                                <span className="text-slate-400">/ {teacher.quota || 100}</span>
                              </div>
                              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-blue-500 rounded-full"
                                  style={{
                                    width: `${Math.min(100, (((teacher.copiesCorrected || 0) / (teacher.quota || 100)) * 100))}%`,
                                  }}
                                />
                              </div>
                            </div>
                          </td>

                          {/* Registration Date */}
                          <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                            {new Date(teacher.createdAt).toLocaleDateString('fr-FR')}
                          </td>

                          {/* Action Buttons */}
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* View Details */}
                              <button
                                type="button"
                                onClick={() => setSelectedTeacherForDetail(teacher)}
                                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700/60 rounded-lg transition-colors cursor-pointer"
                                title="Voir la fiche détaillée & historique"
                              >
                                <Eye className="w-4 h-4" />
                              </button>

                              {/* Edit Plan / Status */}
                              <button
                                type="button"
                                onClick={() => setSelectedTeacherForEdit(teacher)}
                                className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-slate-700/60 rounded-lg transition-colors cursor-pointer"
                                title="Modifier le forfait ou le statut"
                              >
                                <Sliders className="w-4 h-4" />
                              </button>

                              {/* Send Email */}
                              <button
                                type="button"
                                onClick={() => setSelectedTeacherForEmail(teacher)}
                                className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-slate-700/60 rounded-lg transition-colors cursor-pointer"
                                title="Envoyer un email transactionnel"
                              >
                                <Send className="w-4 h-4" />
                              </button>

                              {/* Refund (if paid) */}
                              {['monthly', 'annual', 'institution'].includes(teacher.plan) && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedTeacherForRefund(teacher);
                                    setRefundAmount(teacher.plan === 'annual' ? 99.99 : 9.99);
                                  }}
                                  className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-slate-700/60 rounded-lg transition-colors cursor-pointer"
                                  title="Simuler un remboursement"
                                >
                                  <DollarSign className="w-4 h-4" />
                                </button>
                              )}

                              {/* Delete */}
                              <button
                                type="button"
                                onClick={() => setSelectedTeacherForDelete(teacher)}
                                className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-700/60 rounded-lg transition-colors cursor-pointer"
                                title="Supprimer ce compte"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              <div className="bg-[#101726] border-t border-slate-800 px-4 py-3 flex items-center justify-between text-xs text-slate-400">
                <span>{filteredTeachers.length} enseignant(s) affiché(s) sur {teachers.length} inscrits</span>
                <span className="font-mono text-slate-500">Base SQLite / JSON Praxis synchronisée</span>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 3: 💳 REVENUS, ENCAISSEMENTS & TRANSACTIONS */}
        {/* ========================================================= */}
        {activeTab === 'transactions' && (
          <div className="space-y-6">
            {/* Financial Overview Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="bg-[#141C2E] border border-slate-800/90 rounded-2xl p-5 shadow-lg">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Volume Brut Encaissé
                </span>
                <div className="text-2xl font-extrabold text-white mt-1">
                  {transactions
                    .filter((t) => t.status === 'succeeded')
                    .reduce((acc, curr) => acc + curr.amount, 0)
                    .toLocaleString('fr-FR', { minimumFractionDigits: 2 })}{' '}
                  €
                </div>
                <p className="text-[11px] text-slate-500 mt-1">Totalité des transactions Stripe & CB</p>
              </div>

              <div className="bg-[#141C2E] border border-slate-800/90 rounded-2xl p-5 shadow-lg">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Remboursements Effectués
                </span>
                <div className="text-2xl font-extrabold text-rose-400 mt-1">
                  {transactions
                    .filter((t) => t.status === 'refunded')
                    .reduce((acc, curr) => acc + curr.amount, 0)
                    .toLocaleString('fr-FR', { minimumFractionDigits: 2 })}{' '}
                  €
                </div>
                <p className="text-[11px] text-slate-500 mt-1">Taux de remboursement : {'< 1.5%'}</p>
              </div>

              <div className="bg-[#141C2E] border border-slate-800/90 rounded-2xl p-5 shadow-lg">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Transactions Validées
                </span>
                <div className="text-2xl font-extrabold text-emerald-400 mt-1">
                  {transactions.filter((t) => t.status === 'succeeded').length} reçus
                </div>
                <p className="text-[11px] text-slate-500 mt-1">0 litige déclaré sur la plateforme</p>
              </div>
            </div>

            {/* Transactions Table */}
            <div className="bg-[#141C2E] border border-slate-800/90 rounded-2xl shadow-xl overflow-hidden">
              <div className="p-5 border-b border-slate-800 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-white text-base">Historique des Paiements & Échéances</h3>
                  <p className="text-xs text-slate-400">Journal des flux financiers en direct</p>
                </div>
                <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-slate-800 text-slate-300">
                  {transactions.length} enregistrements
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#101726] border-b border-slate-800 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                      <th className="py-3 px-4">Réf. Transaction</th>
                      <th className="py-3 px-4">Enseignant</th>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Description</th>
                      <th className="py-3 px-4">Montant TTC</th>
                      <th className="py-3 px-4">Moyen de paiement</th>
                      <th className="py-3 px-4">Statut</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-xs">
                    {transactions.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-slate-500">
                          Aucune transaction enregistrée pour le moment.
                        </td>
                      </tr>
                    ) : (
                      transactions.map((txn) => (
                        <tr key={txn.id} className="hover:bg-slate-800/40">
                          <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400">{txn.id}</td>
                          <td className="py-3.5 px-4">
                            <span className="font-semibold text-white block">{txn.teacherName}</span>
                            <span className="text-[11px] text-slate-500 block">{txn.teacherEmail}</span>
                          </td>
                          <td className="py-3.5 px-4 text-slate-300 font-mono text-[11px]">{txn.date}</td>
                          <td className="py-3.5 px-4 text-slate-300">{txn.description}</td>
                          <td className="py-3.5 px-4 font-bold text-white font-mono">
                            {txn.amount.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €
                          </td>
                          <td className="py-3.5 px-4 text-slate-400 text-[11px]">{txn.paymentMethod}</td>
                          <td className="py-3.5 px-4">
                            {txn.status === 'succeeded' ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-800">
                                <CheckCircle2 className="w-3 h-3" /> Payé
                              </span>
                            ) : txn.status === 'refunded' ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-950/80 text-rose-300 border border-rose-800">
                                <RotateCcw className="w-3 h-3" /> Remboursé
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-950/80 text-amber-300 border border-amber-800">
                                <Clock className="w-3 h-3" /> En attente
                              </span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 4: ⚙️ AUTOMATISATIONS & WEBHOOKS (TELEGRAM / CRM) */}
        {/* ========================================================= */}
        {activeTab === 'automations' && (
          <div className="space-y-8 max-w-4xl mx-auto">
            {/* API Keys & External Services Diagnostics Panel */}
            <div className="bg-gradient-to-br from-[#121A2C] via-[#101726] to-[#0D1320] border border-blue-500/20 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-72 h-72 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-blue-500/20 border border-blue-500/40 text-blue-400 flex items-center justify-center shrink-0">
                    <KeyRound className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                      <span>Centre de Contrôle des Clés API & Services Tiers</span>
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Vérification du statut et test en direct de Telegram, Paystack et Google Gemini.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => fetchDashboardData(true)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg border border-slate-700 transition-all cursor-pointer self-start sm:self-auto"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Rafraîchir les statuts</span>
                </button>
              </div>

              {/* Status Badges Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-6">
                {/* Telegram Service */}
                <div className="bg-[#0B0F17]/90 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                        <Send className="w-4 h-4 text-blue-400" /> Telegram Push
                      </span>
                      {settings?.telegramConfigured ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Connecté
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-950 text-amber-400 border border-amber-800 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> Clé manquante
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Chat ID : <span className="font-mono text-slate-300">{settings?.telegramChatId || '7847633142'}</span>
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Token : {settings?.telegramTokenMasked || 'Non défini'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleTestTelegram}
                    disabled={telegramTesting}
                    className="mt-4 w-full flex items-center justify-center gap-2 px-3 py-2 bg-blue-600/90 hover:bg-blue-600 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-all cursor-pointer"
                  >
                    {telegramTesting ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Envoi du test...</span>
                      </>
                    ) : (
                      <>
                        <Zap className="w-3.5 h-3.5" />
                        <span>Tester l’envoi push</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Paystack Service */}
                <div className="bg-[#0B0F17]/90 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                        <CreditCard className="w-4 h-4 text-emerald-400" /> Paystack
                      </span>
                      {settings?.paystackConfigured ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> {settings.paystackMode === 'live' ? 'Live Prod' : 'Test'}
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-950 text-amber-400 border border-amber-800 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> Clé manquante
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Passerelle : Mobile Money & Cartes
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Clé secrète : {settings?.paystackSecretKeyMasked || 'Non définie'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleTestPaystack}
                    disabled={paystackTesting}
                    className="mt-4 w-full flex items-center justify-center gap-2 px-3 py-2 bg-emerald-600/90 hover:bg-emerald-600 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-all cursor-pointer"
                  >
                    {paystackTesting ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Vérification...</span>
                      </>
                    ) : (
                      <>
                        <Zap className="w-3.5 h-3.5" />
                        <span>Tester l’API Paystack</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Gemini AI Service */}
                <div className="bg-[#0B0F17]/90 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-purple-400" /> Google Gemini IA
                      </span>
                      {settings?.geminiConfigured ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Connecté
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-950 text-amber-400 border border-amber-800 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> Clé manquante
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Moteur : Correction & OCR copies
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Clé : {settings?.geminiKeyMasked || 'Non définie'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleTestGemini}
                    disabled={geminiTesting}
                    className="mt-4 w-full flex items-center justify-center gap-2 px-3 py-2 bg-purple-600/90 hover:bg-purple-600 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-all cursor-pointer"
                  >
                    {geminiTesting ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Test IA...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Tester l’IA Gemini</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Update API Keys Form */}
              <form onSubmit={handleSaveKeys} className="bg-[#0B0F17]/70 border border-slate-800/80 rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <h3 className="text-xs font-bold text-slate-200 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-blue-400" />
                    <span>Mettre à jour les Clés Secrètes dans l'environnement</span>
                  </h3>
                  <span className="text-[11px] text-slate-500">Sauvegarde persistée dans .env</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Token Bot Telegram (TELEGRAM_BOT_TOKEN)
                    </label>
                    <input
                      type="password"
                      placeholder="Ex: 8484098189:AAH..."
                      value={keysForm.telegramBotToken}
                      onChange={(e) => setKeysForm({ ...keysForm, telegramBotToken: e.target.value })}
                      className="w-full bg-[#141C2E] px-3 py-2 rounded-lg border border-slate-700 text-xs text-white placeholder-slate-600 outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Chat ID Telegram (TELEGRAM_CHAT_ID)
                    </label>
                    <input
                      type="text"
                      placeholder="7847633142"
                      value={keysForm.telegramChatId}
                      onChange={(e) => setKeysForm({ ...keysForm, telegramChatId: e.target.value })}
                      className="w-full bg-[#141C2E] px-3 py-2 rounded-lg border border-slate-700 text-xs text-white placeholder-slate-600 outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Clé Secrète Paystack (PAYSTACK_SECRET_KEY)
                    </label>
                    <input
                      type="password"
                      placeholder="sk_live_... ou sk_test_..."
                      value={keysForm.paystackSecretKey}
                      onChange={(e) => setKeysForm({ ...keysForm, paystackSecretKey: e.target.value })}
                      className="w-full bg-[#141C2E] px-3 py-2 rounded-lg border border-slate-700 text-xs text-white placeholder-slate-600 outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Clé API Google Gemini (GEMINI_API_KEY)
                    </label>
                    <input
                      type="password"
                      placeholder="AIzaSy..."
                      value={keysForm.geminiApiKey}
                      onChange={(e) => setKeysForm({ ...keysForm, geminiApiKey: e.target.value })}
                      className="w-full bg-[#141C2E] px-3 py-2 rounded-lg border border-slate-700 text-xs text-white placeholder-slate-600 outline-none focus:border-purple-500"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={savingKeys}
                    className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-lg transition-all cursor-pointer"
                  >
                    {savingKeys ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Sauvegarde en cours...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" />
                        <span>Enregistrer et Appliquer les Clés</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Telegram Integration Card */}
            <div className="bg-[#141C2E] border border-slate-800/90 rounded-2xl p-6 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-xl bg-blue-500/15 border border-blue-500/30 text-blue-400 flex items-center justify-center shrink-0">
                    <Send className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <span>Bot Telegram (Alertes Inscriptions Temps Réel)</span>
                      {settings?.telegramConfigured ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                          Connecté
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950 text-amber-400 border border-amber-800">
                          En attente des clés
                        </span>
                      )}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Envoi instantané d'une notification push sur votre smartphone dès qu'un enseignant s'inscrit sur Praxis.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleTestTelegram}
                  disabled={telegramTesting}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50"
                >
                  {telegramTesting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Test en cours...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4" />
                      <span>Tester la notification push</span>
                    </>
                  )}
                </button>
              </div>

              {/* Telegram Payload Preview */}
              <div className="mt-6">
                <span className="text-xs font-semibold text-slate-300 block mb-2">
                  Format du message transmis sur Telegram :
                </span>
                <div className="bg-[#0B0F17] p-4 rounded-xl border border-slate-800 font-mono text-xs text-slate-300 leading-relaxed">
                  <p className="text-blue-400 font-bold">🔔 *Nouvelle Inscription Enseignant sur Praxis IA !*</p>
                  <p className="text-slate-600">━━━━━━━━━━━━━━━━━━━━</p>
                  <p>👤 *Nom :* Prof. Martin</p>
                  <p>📧 *Email :* martin@lycee-moliere.fr</p>
                  <p>📱 *WhatsApp :* +33612345678</p>
                  <p>🏫 *Établissement :* Lycée Molière (Paris)</p>
                  <p>📦 *Forfait :* Essai Découverte 7 jours (Gratuit)</p>
                  <p>⏰ *Date :* 14/09/2026 à 14:02</p>
                  <p className="text-slate-600">━━━━━━━━━━━━━━━━━━━━</p>
                  <p className="text-emerald-400">👉 *Accéder au CRM :* /dashboard</p>
                </div>
              </div>

              {/* How to configure Telegram */}
              <div className="mt-6 pt-6 border-t border-slate-800 space-y-2 text-xs text-slate-400">
                <p className="font-semibold text-slate-300">Comment activer Telegram en 3 étapes :</p>
                <ol className="list-decimal list-inside space-y-1 pl-1">
                  <li>Ouvrez Telegram et recherchez <span className="text-blue-400 font-mono">@BotFather</span>. Tapez <code className="bg-slate-900 px-1 py-0.5 rounded text-slate-200">/newbot</code> pour créer votre bot et copiez le jeton API.</li>
                  <li>Démarrez une conversation avec votre bot, puis obtenez votre identifiant en discutant avec <span className="text-blue-400 font-mono">@userinfobot</span>.</li>
                  <li>Ajoutez <code className="bg-slate-900 px-1 py-0.5 rounded text-slate-200">TELEGRAM_BOT_TOKEN</code> et <code className="bg-slate-900 px-1 py-0.5 rounded text-slate-200">TELEGRAM_CHAT_ID</code> dans les variables d'environnement de votre instance.</li>
                </ol>
              </div>
            </div>

            {/* Paystack Integration Card */}
            <div className="bg-[#141C2E] border border-slate-800/90 rounded-2xl p-6 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
                    <Zap className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <span>Passerelle Paystack (Paiements Cartes & Mobile Money)</span>
                      {settings?.paystackConfigured ? (
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          settings.paystackMode === 'live'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            : 'bg-amber-950 text-amber-400 border border-amber-800'
                        }`}>
                          {settings.paystackMode === 'live' ? '🟢 Live Production' : '🟡 Mode Test'}
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
                          ⚪ En attente des clés API
                        </span>
                      )}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Encaissement automatisé en FCFA (XOF) et EUR via Wave, Orange Money, MTN MoMo, Moov et Cartes Visa/Mastercard.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleTestPaystack}
                    disabled={paystackTesting}
                    className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white text-xs font-semibold rounded-xl border border-slate-700 transition-all cursor-pointer"
                  >
                    {paystackTesting ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Test...</span>
                      </>
                    ) : (
                      <>
                        <Zap className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Tester Paystack</span>
                      </>
                    )}
                  </button>

                  <a
                    href="https://dashboard.paystack.com/#/settings/developer"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl shadow-md transition-all shrink-0 cursor-pointer"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>Tableau de bord Paystack</span>
                  </a>
                </div>
              </div>

              {/* Webhook Configuration Section */}
              <div className="mt-6 space-y-3">
                <span className="text-xs font-semibold text-slate-300 block">
                  URL du Webhook à renseigner dans Paystack :
                </span>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value="https://praxis-pro.pro/api/paystack/webhook"
                    className="flex-1 bg-[#0B0F17] px-3.5 py-2.5 rounded-xl border border-slate-800 font-mono text-xs text-emerald-400 select-all outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText('https://praxis-pro.pro/api/paystack/webhook');
                      showToast('URL du Webhook Paystack copiée dans le presse-papier !', 'success');
                    }}
                    className="px-3 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    Copier
                  </button>
                </div>
                <p className="text-[11px] text-slate-500">
                  Paystack envoie un événement POST sécurisé par signature HMAC-SHA512 (<code className="text-slate-400 font-mono">x-paystack-signature</code>) dès qu'un paiement est validé.
                </p>
              </div>

              {/* Instructions */}
              <div className="mt-6 pt-6 border-t border-slate-800 space-y-2 text-xs text-slate-400">
                <p className="font-semibold text-slate-300">Comment activer Paystack en 3 étapes :</p>
                <ol className="list-decimal list-inside space-y-1 pl-1">
                  <li>Rendez-vous sur <a href="https://dashboard.paystack.com" target="_blank" rel="noopener noreferrer" className="text-emerald-400 underline font-semibold">dashboard.paystack.com</a> &gt; <strong>Settings</strong> &gt; <strong>API Keys & Webhooks</strong>.</li>
                  <li>Copiez l'URL de Webhook ci-dessus dans le champ <strong>Live Webhook URL</strong>.</li>
                  <li>Ajoutez <code className="bg-slate-900 px-1 py-0.5 rounded text-slate-200">PAYSTACK_SECRET_KEY</code> (commence par <code className="text-emerald-400">sk_live_...</code>) et <code className="bg-slate-900 px-1 py-0.5 rounded text-slate-200">PAYSTACK_PUBLIC_KEY</code> (<code className="text-emerald-400">pk_live_...</code>) dans votre environnement.</li>
                </ol>
              </div>
            </div>

            {/* Database Management & Tools */}
            <div className="bg-[#141C2E] border border-slate-800/90 rounded-2xl p-6 shadow-xl space-y-6">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-indigo-400" />
                  <span>Maintenance & Jeu de Données Démonstration</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Outils de gestion pour recharger les comptes enseignants types, inspecter la base JSON et vérifier l'intégrité.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-[#0B0F17] border border-emerald-900/40 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                      <h4 className="font-semibold text-white text-xs">Mode 100% Réel (Remise à zéro)</h4>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Remet la base d'enseignants à zéro pour repartir d'une base vierge.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleClearLeads}
                    className="mt-4 w-full py-2 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 text-xs font-semibold rounded-lg border border-rose-800/60 transition-colors cursor-pointer"
                  >
                    Vider la base (0 enseignant)
                  </button>
                </div>

                <div className="p-4 rounded-xl bg-[#0B0F17] border border-slate-800 flex flex-col justify-between">
                  <div>
                    <h4 className="font-semibold text-white text-xs">Sauvegarde Complète JSON</h4>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Télécharge le fichier brut <span className="font-mono text-slate-300">leads.json</span> contenant l'intégralité des enseignants.
                    </p>
                  </div>
                  <a
                    href="/api/leads"
                    target="_blank"
                    rel="noreferrer"
                    className="mt-4 w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 text-center transition-colors block"
                  >
                    Télécharger sauvegarde JSON
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 5: 🏛️ DEMANDES DE DEVIS ÉTABLISSEMENTS SCOLAIRES */}
        {/* ========================================================= */}
        {activeTab === 'quotes' && (
          <div className="space-y-6">
            {/* Header banner */}
            <div className="bg-[#141C2E] border border-slate-800/90 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <h2 className="text-lg font-bold text-white">Demandes de Devis & Onboarding Établissements</h2>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Suivi des directeurs et proviseurs ayant sollicité une offre établissement. Relancez directement sur WhatsApp ou par email, puis convertissez la demande en établissement actif.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => fetchDashboardData(false)}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Actualiser
                </button>
              </div>
            </div>

            {/* 4 KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-[#141C2E] border border-slate-800/90 rounded-2xl p-5 shadow-lg">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Demandes</span>
                <div className="text-2xl font-extrabold text-white mt-1">{quotes.length}</div>
                <p className="text-[11px] text-slate-500 mt-1">Historique complet des leads B2B</p>
              </div>

              <div className="bg-[#141C2E] border border-slate-800/90 rounded-2xl p-5 shadow-lg">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">À Traiter / Nouveaux</span>
                  {quotes.filter((q) => q.status === 'new').length > 0 && (
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping"></span>
                  )}
                </div>
                <div className="text-2xl font-extrabold text-amber-400 mt-1">
                  {quotes.filter((q) => q.status === 'new').length}
                </div>
                <p className="text-[11px] text-slate-500 mt-1">Nécessitent un premier contact</p>
              </div>

              <div className="bg-[#141C2E] border border-slate-800/90 rounded-2xl p-5 shadow-lg">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">En Négociation</span>
                <div className="text-2xl font-extrabold text-blue-400 mt-1">
                  {quotes.filter((q) => q.status === 'contacted' || q.status === 'quote_sent').length}
                </div>
                <p className="text-[11px] text-slate-500 mt-1">Contactés ou devis chiffré transmis</p>
              </div>

              <div className="bg-[#141C2E] border border-slate-800/90 rounded-2xl p-5 shadow-lg">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Convertis / Établissements</span>
                <div className="text-2xl font-extrabold text-emerald-400 mt-1">
                  {quotes.filter((q) => q.status === 'converted').length}
                </div>
                <p className="text-[11px] text-slate-500 mt-1">Comptes écoles déployés avec succès</p>
              </div>
            </div>

            {/* Filters Bar */}
            <div className="bg-[#141C2E] border border-slate-800/90 rounded-2xl p-4 shadow-lg flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={quoteSearch}
                  onChange={(e) => setQuoteSearch(e.target.value)}
                  placeholder="Rechercher par établissement, contact, email ou téléphone..."
                  className="w-full pl-9 pr-4 py-2 bg-[#0B0F17] border border-slate-700 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500/50"
                />
              </div>

              <div className="flex items-center gap-2">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={quoteStatusFilter}
                  onChange={(e) => setQuoteStatusFilter(e.target.value)}
                  className="bg-[#0B0F17] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-hidden"
                >
                  <option value="all">Tous les statuts ({quotes.length})</option>
                  <option value="new">Nouveaux ({quotes.filter((q) => q.status === 'new').length})</option>
                  <option value="contacted">Contactés ({quotes.filter((q) => q.status === 'contacted').length})</option>
                  <option value="quote_sent">Devis envoyé ({quotes.filter((q) => q.status === 'quote_sent').length})</option>
                  <option value="converted">Convertis ({quotes.filter((q) => q.status === 'converted').length})</option>
                </select>
              </div>
            </div>

            {/* Quotes List / Cards */}
            <div className="space-y-4">
              {quotes
                .filter((q) => {
                  if (quoteStatusFilter !== 'all' && q.status !== quoteStatusFilter) return false;
                  if (!quoteSearch.trim()) return true;
                  const term = quoteSearch.toLowerCase();
                  return (
                    q.schoolName.toLowerCase().includes(term) ||
                    q.contactName.toLowerCase().includes(term) ||
                    q.email.toLowerCase().includes(term) ||
                    q.phone.toLowerCase().includes(term) ||
                    (q.planName && q.planName.toLowerCase().includes(term))
                  );
                })
                .map((q) => {
                  const cleanPhone = (q.phone || '').replace(/[^0-9]/g, '');
                  const waMessage = encodeURIComponent(
                    `Bonjour ${q.contactName}, je suis le fondateur de Praxis IA. J'ai bien reçu votre demande de devis pour ${q.schoolName} (Forfait ${q.planName || 'Établissement'}). Pouvons-nous échanger quelques minutes ?`
                  );
                  const waLink = cleanPhone ? `https://wa.me/${cleanPhone}?text=${waMessage}` : '#';

                  return (
                    <div
                      key={q.id}
                      className="bg-[#141C2E] border border-slate-800/90 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4 hover:border-slate-700 transition-all"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2.5 flex-wrap">
                            <h3 className="text-base font-bold text-white">{q.schoolName}</h3>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                                q.status === 'new'
                                  ? 'bg-amber-950/80 text-amber-300 border-amber-700/50'
                                  : q.status === 'contacted'
                                  ? 'bg-blue-950/80 text-blue-300 border-blue-700/50'
                                  : q.status === 'quote_sent'
                                  ? 'bg-purple-950/80 text-purple-300 border-purple-700/50'
                                  : q.status === 'converted'
                                  ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700/50'
                                  : 'bg-slate-800 text-slate-300 border-slate-700'
                              }`}
                            >
                              {q.status === 'new'
                                ? 'Nouveau lead'
                                : q.status === 'contacted'
                                ? 'Contacté'
                                : q.status === 'quote_sent'
                                ? 'Devis envoyé'
                                : q.status === 'converted'
                                ? 'Converti en Établissement'
                                : q.status}
                            </span>
                            <span className="text-[11px] text-slate-400">
                              Reçu le {new Date(q.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-300 pt-1">
                            <span>
                              Direction : <strong className="text-white">{q.contactName}</strong>
                            </span>
                            <span>
                              Email : <a href={`mailto:${q.email}`} className="text-blue-400 hover:underline">{q.email}</a>
                            </span>
                            <span>
                              Tél / WhatsApp : <strong className="text-emerald-400 font-mono">{q.phone}</strong>
                            </span>
                            {q.teachersCount && (
                              <span>
                                Effectif : <strong className="text-slate-200">{q.teachersCount}</strong>
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Top quick actions */}
                        <div className="flex items-center gap-2 self-start">
                          {cleanPhone && (
                            <a
                              href={waLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition-colors shadow-xs"
                              title="Ouvrir WhatsApp avec un message pré-rédigé"
                            >
                              <Phone className="w-3.5 h-3.5" />
                              WhatsApp Direct
                            </a>
                          )}
                          <a
                            href={`mailto:${q.email}?subject=Votre%20Devis%20Praxis%20IA%20-%20${encodeURIComponent(q.schoolName)}`}
                            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors border border-slate-700"
                          >
                            <Mail className="w-3.5 h-3.5" />
                            Email
                          </a>
                        </div>
                      </div>

                      {/* Details & Plan box */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3.5 rounded-xl bg-[#0B0F17] border border-slate-800/80 text-xs">
                        <div>
                          <span className="text-slate-500 block text-[11px]">Forfait souhaité</span>
                          <span className="font-semibold text-white">{q.planName || 'Forfait Moyen'}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[11px]">Volume & Tarif indicatif</span>
                          <span className="font-semibold text-emerald-400">
                            {q.copiesPerYear ? q.copiesPerYear.toLocaleString('fr-FR') : '15 000'} copies / an · {q.priceFcfa ? q.priceFcfa.toLocaleString('fr-FR') + ' F CFA' : 'Sur mesure'}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[11px]">Commentaire / Besoins</span>
                          <span className="text-slate-300 italic">{q.message || 'Aucun message particulier.'}</span>
                        </div>
                      </div>

                      {/* Management & Status Bar */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-800/60 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="text-slate-400">Modifier le statut :</span>
                          <select
                            value={q.status}
                            onChange={(e) => handleUpdateQuoteStatus(q.id, e.target.value)}
                            className="bg-[#0B0F17] border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white"
                          >
                            <option value="new">Nouveau</option>
                            <option value="contacted">Contacté</option>
                            <option value="quote_sent">Devis envoyé</option>
                            <option value="converted">Converti</option>
                            <option value="archived">Sans suite</option>
                          </select>
                        </div>

                        <div className="flex items-center gap-2">
                          {q.status !== 'converted' && (
                            <button
                              type="button"
                              disabled={convertingQuoteId === q.id}
                              onClick={() => handleConvertQuoteToInstitution(q.id)}
                              className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 shadow-xs"
                            >
                              <Building2 className="w-3.5 h-3.5" />
                              {convertingQuoteId === q.id ? 'Activation en cours...' : 'Convertir en Établissement Actif'}
                            </button>
                          )}
                          {q.status === 'converted' && (
                            <span className="text-emerald-400 font-semibold flex items-center gap-1 text-xs">
                              <CheckCircle2 className="w-4 h-4" />
                              Établissement actif dans la base
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}

              {quotes.length === 0 && (
                <div className="text-center py-12 bg-[#141C2E] border border-slate-800 rounded-2xl p-8">
                  <Building2 className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                  <p className="text-sm font-semibold text-white">Aucune demande de devis pour l'instant</p>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                    Dès qu'un établissement soumet une demande sur la page de pricing ou le formulaire, elle s'affiche ici et vous recevez une alerte Telegram instantanée.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 6: GESTION DES AFFILIÉS PRAXIS (B2B / PARTENAIRES) */}
        {/* ========================================================= */}
        {activeTab === 'affiliates' && (
          <div className="animate-fade-in">
            <AdminAffiliatesView onNotify={(text, type) => showToast(text, type)} />
          </div>
        )}
      </main>

      {/* ========================================================= */}
      {/* MODAL 1: TEACHER PROFILE & USAGE DETAIL */}
      {/* ========================================================= */}
      {selectedTeacherForDetail && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#141C2E] border border-slate-800 rounded-2xl w-full max-w-xl p-6 shadow-2xl space-y-6 animate-scale-in">
            <div className="flex items-start justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-blue-900/60 border border-blue-700/50 text-blue-300 font-bold flex items-center justify-center text-base">
                  {selectedTeacherForDetail.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">{selectedTeacherForDetail.name}</h3>
                  <p className="text-xs text-slate-400">{selectedTeacherForDetail.email}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTeacherForDetail(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            {/* Quick Grid */}
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="bg-[#0B0F17] p-3 rounded-xl border border-slate-800">
                <span className="text-slate-500 block mb-0.5">Établissement</span>
                <span className="font-semibold text-white">{selectedTeacherForDetail.school || 'Non renseigné'}</span>
                {selectedTeacherForDetail.city && <span className="text-slate-400 block text-[11px]">{selectedTeacherForDetail.city}</span>}
              </div>
              <div className="bg-[#0B0F17] p-3 rounded-xl border border-slate-800">
                <span className="text-slate-500 block mb-0.5">Forfait & Statut</span>
                <div className="flex items-center gap-2 mt-1">
                  {renderPlanBadge(selectedTeacherForDetail.plan)}
                  {renderStatusBadge(selectedTeacherForDetail.status, selectedTeacherForDetail)}
                </div>
              </div>
              <div className="bg-[#0B0F17] p-3 rounded-xl border border-slate-800">
                <span className="text-slate-500 block mb-0.5">Usage Copies IA</span>
                <span className="font-bold text-white text-sm">
                  {selectedTeacherForDetail.copiesCorrected || 0} copies analysées
                </span>
                <span className="text-[11px] text-slate-400 block">Quota actuel : {selectedTeacherForDetail.quota || 15} copies</span>
              </div>
              <div className="bg-[#0B0F17] p-3 rounded-xl border border-slate-800">
                <span className="text-slate-500 block mb-0.5">Total Dépensé (LTV)</span>
                <span className="font-bold text-emerald-400 text-sm font-mono">
                  {(selectedTeacherForDetail.totalSpent || 0).toFixed(2)} €
                </span>
                <span className="text-[11px] text-slate-400 block">
                  Inscrit le {new Date(selectedTeacherForDetail.createdAt).toLocaleDateString('fr-FR')}
                </span>
              </div>
            </div>

            {/* Notes Section */}
            <div>
              <span className="text-xs font-semibold text-slate-300 block mb-1">Journal d'activité & Notes pédagogiques :</span>
              <div className="bg-[#0B0F17] p-3 rounded-xl border border-slate-800 text-xs text-slate-300 font-mono max-h-32 overflow-y-auto whitespace-pre-wrap leading-relaxed">
                {selectedTeacherForDetail.notes || 'Aucune note enregistrée.'}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedTeacherForDetail(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 2: EDIT PLAN / STATUS */}
      {/* ========================================================= */}
      {selectedTeacherForEdit && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#141C2E] border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4 animate-scale-in">
            <h3 className="text-base font-bold text-white">Modifier le compte de {selectedTeacherForEdit.name}</h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Forfait souscrit :</label>
                <select
                  value={selectedTeacherForEdit.plan}
                  onChange={(e) =>
                    setSelectedTeacherForEdit({ ...selectedTeacherForEdit, plan: e.target.value as SaaSPlan })
                  }
                  className="w-full bg-[#0B0F17] border border-slate-700 rounded-xl p-2.5 text-white"
                >
                  <option value="free">Gratuit (15 crédits offerts)</option>
                  <option value="trial">Essai Pro 7 jours</option>
                  <option value="monthly">Pro Mensuel (9.99 €/mois)</option>
                  <option value="annual">Pro Annuel (99.99 €/an)</option>
                  <option value="institution">Établissement (299.00 €/an)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Statut d'accès :</label>
                <select
                  value={selectedTeacherForEdit.status}
                  onChange={(e) =>
                    setSelectedTeacherForEdit({ ...selectedTeacherForEdit, status: e.target.value as AccountStatus })
                  }
                  className="w-full bg-[#0B0F17] border border-slate-700 rounded-xl p-2.5 text-white"
                >
                  <option value="active">Actif</option>
                  <option value="trial">En période d'essai</option>
                  <option value="paused">En pause (temporaire)</option>
                  <option value="inactive">Inactif</option>
                  <option value="canceled">Résilié</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Quota maximal de copies :</label>
                <input
                  type="number"
                  value={selectedTeacherForEdit.quota || 100}
                  onChange={(e) =>
                    setSelectedTeacherForEdit({ ...selectedTeacherForEdit, quota: Number(e.target.value) })
                  }
                  className="w-full bg-[#0B0F17] border border-slate-700 rounded-xl p-2 text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Notes administratives :</label>
                <textarea
                  rows={3}
                  value={selectedTeacherForEdit.notes || ''}
                  onChange={(e) =>
                    setSelectedTeacherForEdit({ ...selectedTeacherForEdit, notes: e.target.value })
                  }
                  className="w-full bg-[#0B0F17] border border-slate-700 rounded-xl p-2 text-white"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3">
              <button
                type="button"
                onClick={() => setSelectedTeacherForEdit(null)}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={() =>
                  handleUpdateTeacher(selectedTeacherForEdit.id, {
                    plan: selectedTeacherForEdit.plan,
                    status: selectedTeacherForEdit.status,
                    quota: selectedTeacherForEdit.quota,
                    notes: selectedTeacherForEdit.notes,
                  })
                }
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl shadow-md"
              >
                Enregistrer les modifications
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 3: REFUND CONFIRMATION */}
      {/* ========================================================= */}
      {selectedTeacherForRefund && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#141C2E] border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4 animate-scale-in">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                <DollarSign className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Rembourser {selectedTeacherForRefund.name}</h3>
                <p className="text-xs text-slate-400">Cette action émettra un avoir et rétrogradera le compte.</p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Montant à rembourser (€) :</label>
                <input
                  type="number"
                  step="0.01"
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(Number(e.target.value))}
                  className="w-full bg-[#0B0F17] border border-slate-700 rounded-xl p-2.5 text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Motif du remboursement :</label>
                <textarea
                  rows={3}
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  className="w-full bg-[#0B0F17] border border-slate-700 rounded-xl p-2 text-white"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedTeacherForRefund(null)}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleProcessRefund}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold rounded-xl shadow-md"
              >
                Confirmer le remboursement
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 4: SEND TRANSACTIONAL EMAIL */}
      {/* ========================================================= */}
      {selectedTeacherForEmail && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#141C2E] border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4 animate-scale-in">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <Send className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Envoyer un email à {selectedTeacherForEmail.name}</h3>
                <p className="text-xs text-slate-400">Destination : {selectedTeacherForEmail.email}</p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Modèle d'email :</label>
                <select
                  value={emailTemplate}
                  onChange={(e: any) => setEmailTemplate(e.target.value)}
                  className="w-full bg-[#0B0F17] border border-slate-700 rounded-xl p-2.5 text-white"
                >
                  <option value="onboarding">Bienvenue & Guide de prise en main (Onboarding)</option>
                  <option value="trial_end">Rappel d'expiration de l'essai Pro (J-2)</option>
                  <option value="update">Annonce des nouveautés pédagogiques (Vision IA 2.4)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Objet personnalisé (optionnel) :</label>
                <input
                  type="text"
                  value={customSubject}
                  onChange={(e) => setCustomSubject(e.target.value)}
                  placeholder="Laisser vide pour utiliser l'objet standard du modèle"
                  className="w-full bg-[#0B0F17] border border-slate-700 rounded-xl p-2 text-white"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedTeacherForEmail(null)}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleSendEmail}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl shadow-md flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Envoyer le message</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 5: DELETE CONFIRMATION */}
      {/* ========================================================= */}
      {selectedTeacherForDelete && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#141C2E] border border-slate-800 rounded-2xl w-full max-w-sm p-6 shadow-2xl space-y-4 animate-scale-in">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Supprimer le compte</h3>
                <p className="text-xs text-slate-400">Action irréversible</p>
              </div>
            </div>

            <p className="text-xs text-slate-300">
              Êtes-vous certain de vouloir supprimer le compte enseignant de{' '}
              <strong className="text-white">{selectedTeacherForDelete.name}</strong> ({selectedTeacherForDelete.email}) ?
              Toutes les données associées seront effacées.
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedTeacherForDelete(null)}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleDeleteTeacher}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-xl shadow-md"
              >
                Supprimer définitivement
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 6: CREATE NEW TEACHER */}
      {/* ========================================================= */}
      {isAddTeacherOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#141C2E] border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4 animate-scale-in">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Plus className="w-4 h-4 text-blue-400" />
              <span>Créer manuellement un compte Enseignant</span>
            </h3>

            <form onSubmit={handleCreateTeacher} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Nom complet *</label>
                  <input
                    type="text"
                    required
                    value={newTeacherForm.name}
                    onChange={(e) => setNewTeacherForm({ ...newTeacherForm, name: e.target.value })}
                    placeholder="Prof. Jean Dupont"
                    className="w-full bg-[#0B0F17] border border-slate-700 rounded-xl p-2.5 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Email académique *</label>
                  <input
                    type="email"
                    required
                    value={newTeacherForm.email}
                    onChange={(e) => setNewTeacherForm({ ...newTeacherForm, email: e.target.value })}
                    placeholder="j.dupont@lycee.fr"
                    className="w-full bg-[#0B0F17] border border-slate-700 rounded-xl p-2.5 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">WhatsApp / Téléphone</label>
                  <input
                    type="text"
                    value={newTeacherForm.whatsapp}
                    onChange={(e) => setNewTeacherForm({ ...newTeacherForm, whatsapp: e.target.value })}
                    placeholder="+33612345678"
                    className="w-full bg-[#0B0F17] border border-slate-700 rounded-xl p-2.5 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Ville</label>
                  <input
                    type="text"
                    value={newTeacherForm.city}
                    onChange={(e) => setNewTeacherForm({ ...newTeacherForm, city: e.target.value })}
                    placeholder="Lyon, Paris, Bordeaux..."
                    className="w-full bg-[#0B0F17] border border-slate-700 rounded-xl p-2.5 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Établissement scolaire</label>
                <input
                  type="text"
                  value={newTeacherForm.school}
                  onChange={(e) => setNewTeacherForm({ ...newTeacherForm, school: e.target.value })}
                  placeholder="Lycée Montaigne"
                  className="w-full bg-[#0B0F17] border border-slate-700 rounded-xl p-2.5 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Forfait attribué</label>
                  <select
                    value={newTeacherForm.plan}
                    onChange={(e) => setNewTeacherForm({ ...newTeacherForm, plan: e.target.value as SaaSPlan })}
                    className="w-full bg-[#0B0F17] border border-slate-700 rounded-xl p-2.5 text-white"
                  >
                    <option value="trial">Essai Pro 7 jours</option>
                    <option value="monthly">Pro Mensuel (9.99 €)</option>
                    <option value="annual">Pro Annuel (99.99 €)</option>
                    <option value="institution">Établissement (299.00 €)</option>
                    <option value="free">Gratuit</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Statut initial</label>
                  <select
                    value={newTeacherForm.status}
                    onChange={(e) => setNewTeacherForm({ ...newTeacherForm, status: e.target.value as AccountStatus })}
                    className="w-full bg-[#0B0F17] border border-slate-700 rounded-xl p-2.5 text-white"
                  >
                    <option value="active">Actif</option>
                    <option value="trial">En essai</option>
                    <option value="paused">En pause</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Notes initiales</label>
                <textarea
                  rows={2}
                  value={newTeacherForm.notes}
                  onChange={(e) => setNewTeacherForm({ ...newTeacherForm, notes: e.target.value })}
                  placeholder="Notes sur la discipline enseignée, niveau..."
                  className="w-full bg-[#0B0F17] border border-slate-700 rounded-xl p-2 text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsAddTeacherOpen(false)}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl shadow-md"
                >
                  Créer le compte enseignant
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 7: IMPORT CSV / TEXTE EN MASSE */}
      {/* ========================================================= */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#141C2E] border border-slate-800 rounded-2xl w-full max-w-xl p-6 shadow-2xl space-y-4 animate-scale-in">
            <div className="flex items-start justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-600/20 border border-purple-500/40 text-purple-400 flex items-center justify-center">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Importer des enseignants (CSV ou Texte)</h3>
                  <p className="text-xs text-slate-400">Ajoutez ou restaurez des enseignants en masse depuis un export ou un fichier</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-[#0B0F17] rounded-xl border border-slate-800 text-slate-300 space-y-1">
                <p className="font-semibold text-white">Format attendu :</p>
                <p className="font-mono text-[11px] text-slate-400">
                  Nom ; Email ; Téléphone/WhatsApp ; Établissement ; Ville ; Forfait ; Statut
                </p>
                <p className="text-[11px] text-slate-500">
                  Séparateur : virgule (,) ou point-virgule (;). Si un enseignant existe déjà (même email), ses informations sont enrichies sans écraser ses copies.
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-slate-300 font-semibold">Fichier CSV ou Coller le contenu brut</label>
                  <button
                    type="button"
                    onClick={() => {
                      const sample = `Nom;Email;WhatsApp;Établissement;Ville;Forfait;Statut\nProf. Jean Kouassi;jean.kouassi@exemple.ci;+225 07 00 11 22;Lycée Classique;Abidjan;trial;trial\nMme Fatou Traoré;fatou.traore@exemple.ci;+225 05 33 44 55;Collège Moderne;Bouaké;free;inactive`;
                      setCsvImportText(sample);
                    }}
                    className="text-[11px] text-blue-400 hover:underline cursor-pointer"
                  >
                    Insérer un exemple
                  </button>
                </div>

                <div className="mb-2">
                  <input
                    type="file"
                    accept=".csv,.txt"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = (event) => {
                        const content = event.target?.result as string;
                        if (content) setCsvImportText(content);
                      };
                      reader.readAsText(file);
                    }}
                    className="block w-full text-xs text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-slate-800 file:text-slate-200 hover:file:bg-slate-700 cursor-pointer"
                  />
                </div>

                <textarea
                  rows={8}
                  value={csvImportText}
                  onChange={(e) => setCsvImportText(e.target.value)}
                  placeholder={`Nom;Email;WhatsApp;Établissement;Ville;Forfait;Statut\nJean Kouassi;jean.kouassi@ecole.ci;+22507010203;Lycée Classique;Abidjan;trial;active`}
                  className="w-full bg-[#0B0F17] border border-slate-700 rounded-xl p-3 text-xs text-slate-200 font-mono focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsImportModalOpen(false)}
                  disabled={importingTeachers}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleImportCSVSubmit}
                  disabled={importingTeachers || !csvImportText.trim()}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-xs font-semibold rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer"
                >
                  {importingTeachers ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Importation en cours...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-3.5 h-3.5" />
                      <span>Lancer l'importation</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 8: CONNECTER & SYNCHRONISER SUPABASE (367 USERS) */}
      {/* ========================================================= */}
      {isSupabaseModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#141C2E] border border-slate-800 rounded-2xl w-full max-w-xl p-6 shadow-2xl space-y-4 animate-scale-in">
            <div className="flex items-start justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Connecter la Base de Données Supabase</h3>
                  <p className="text-xs text-slate-400">
                    Synchronisez vos 367 utilisateurs réels directement avec ce tableau de bord
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsSupabaseModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            {/* Statut actuel */}
            <div className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
              supabaseStatusInfo?.connected
                ? 'bg-emerald-950/40 border-emerald-800/80 text-emerald-300'
                : 'bg-amber-950/40 border-amber-800/80 text-amber-300'
            }`}>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${supabaseStatusInfo?.connected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                <span className="font-semibold">
                  {supabaseStatusInfo?.connected
                    ? `Connecté en direct (${supabaseStatusInfo.remoteUsersCount ?? 367} profils sur Supabase)`
                    : 'Base locale active (201 enseignants affichés au lieu de 367 sur Supabase)'}
                </span>
              </div>
              <span className="text-[11px] text-slate-400 font-mono">
                {supabaseStatusInfo?.localUsersCount ?? teachers.length} inscrits
              </span>
            </div>

            {/* Onglets Méthodes de synchronisation */}
            <div className="flex gap-2 border-b border-slate-800 pb-2">
              <button
                type="button"
                onClick={() => setSupabaseTab('api')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  supabaseTab === 'api'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                ⚡ Connexion API Directe (Automatique)
              </button>
              <button
                type="button"
                onClick={() => setSupabaseTab('json')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  supabaseTab === 'json'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                📋 Coller Export JSON / CSV
              </button>
            </div>

            {supabaseTab === 'api' ? (
              <form onSubmit={handleConnectSupabase} className="space-y-3.5 text-xs">
                <div className="p-3 bg-[#0B0F17] rounded-xl border border-slate-800 text-slate-300 space-y-1">
                  <p className="font-semibold text-white">Où trouver ces 2 identifiants dans Supabase ?</p>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Allez sur <span className="font-bold text-slate-200">Supabase.com &gt; Votre Projet &gt; Project Settings &gt; API</span>. Copiez l'<strong>URL du projet</strong> et la <strong>Service Role Key</strong> (ou Anon Key).
                  </p>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">URL du projet Supabase *</label>
                  <input
                    type="url"
                    required
                    value={supabaseUrlInput}
                    onChange={(e) => setSupabaseUrlInput(e.target.value)}
                    placeholder="https://xxxxxxxxxxxxxxxxxxxx.supabase.co"
                    className="w-full bg-[#0B0F17] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 font-mono focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Clé d'API Supabase (Service Role Key recommandée ou Anon Key) *
                  </label>
                  <input
                    type="password"
                    required
                    value={supabaseKeyInput}
                    onChange={(e) => setSupabaseKeyInput(e.target.value)}
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    className="w-full bg-[#0B0F17] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 font-mono focus:border-emerald-500 focus:outline-none"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    La Service Role Key permet d'accéder à l'ensemble des 367 profils et de synchroniser le tableau de bord sans restriction RLS.
                  </p>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsSupabaseModalOpen(false)}
                    disabled={supabaseConnecting}
                    className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl"
                  >
                    Fermer
                  </button>
                  <button
                    type="submit"
                    disabled={supabaseConnecting || !supabaseUrlInput.trim() || !supabaseKeyInput.trim()}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer"
                  >
                    {supabaseConnecting ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Synchronisation des 367 utilisateurs...</span>
                      </>
                    ) : (
                      <>
                        <Database className="w-3.5 h-3.5" />
                        <span>Connecter & Synchroniser les 367 utilisateurs</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleImportSupabaseJson} className="space-y-3 text-xs">
                <div className="p-3 bg-[#0B0F17] rounded-xl border border-slate-800 text-slate-300 space-y-1">
                  <p className="font-semibold text-white">Import direct sans clé d'API :</p>
                  <p className="text-[11px] text-slate-400">
                    Dans votre console Supabase, ouvrez <span className="font-bold text-slate-200">Table Editor &gt; profiles (ou auth.users)</span>, cliquez sur <strong>Export &gt; Export to JSON</strong> (ou CSV) puis collez le contenu ci-dessous.
                  </p>
                </div>

                <textarea
                  rows={8}
                  value={supabaseJsonInput}
                  onChange={(e) => setSupabaseJsonInput(e.target.value)}
                  placeholder={`[
  {
    "id": "uuid-1",
    "email": "prof@academie.ci",
    "full_name": "Kouassi Jean",
    "school_name": "Lycée Classique",
    "phone_whatsapp": "+22507000000"
  }
]`}
                  className="w-full bg-[#0B0F17] border border-slate-700 rounded-xl p-3 text-xs text-slate-200 font-mono focus:border-emerald-500 focus:outline-none"
                />

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsSupabaseModalOpen(false)}
                    disabled={supabaseConnecting}
                    className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl"
                  >
                    Fermer
                  </button>
                  <button
                    type="submit"
                    disabled={supabaseConnecting || !supabaseJsonInput.trim()}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer"
                  >
                    {supabaseConnecting ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Importation en cours...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-3.5 h-3.5" />
                        <span>Importer le JSON Supabase</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
