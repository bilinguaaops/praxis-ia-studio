import React, { useState, useEffect, useMemo } from 'react';
import {
  Building2,
  Users,
  GraduationCap,
  BookOpen,
  FileText,
  CreditCard,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  ArrowRight,
  TrendingUp,
  Award,
  ChevronRight,
  ExternalLink,
  Shield,
  Filter,
  Trash2,
  Edit2,
  RefreshCw,
  X,
  Eye,
  AlertCircle,
  FileCheck,
  Calendar,
  Sparkles,
  Info,
  Phone,
  Mail,
  Zap,
} from 'lucide-react';
import {
  Institution,
  InstitutionMember,
  InstitutionClass,
  InstitutionStudentProfile,
  InstitutionCreditPool,
  InstitutionCreditLedgerEntry,
  ReadOnlySubmissionInspection,
} from '../types';

interface InstitutionViewProps {
  onBackToApp?: () => void;
  onOpenTeacherWorkspace?: () => void;
}

type InstitutionTab = 'overview' | 'classes' | 'teachers' | 'students' | 'submissions' | 'credits';

export const InstitutionView: React.FC<InstitutionViewProps> = ({
  onBackToApp,
  onOpenTeacherWorkspace,
}) => {
  const [activeTab, setActiveTab] = useState<InstitutionTab>('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Institution State
  const [institution, setInstitution] = useState<Institution | null>(null);
  const [credits, setCredits] = useState<InstitutionCreditPool | null>(null);
  const [currentMember, setCurrentMember] = useState<InstitutionMember | null>(null);
  const [isAdmin, setIsAdmin] = useState(true);

  // Data Collections
  const [stats, setStats] = useState<any>(null);
  const [teachers, setTeachers] = useState<InstitutionMember[]>([]);
  const [classes, setClasses] = useState<InstitutionClass[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [ledger, setLedger] = useState<InstitutionCreditLedgerEntry[]>([]);

  // Modals
  const [isCreateClassModalOpen, setIsCreateClassModalOpen] = useState(false);
  const [isInviteTeacherModalOpen, setIsInviteTeacherModalOpen] = useState(false);
  const [selectedTeacherForQuota, setSelectedTeacherForQuota] = useState<InstitutionMember | null>(null);
  const [selectedSubmissionForInspection, setSelectedSubmissionForInspection] = useState<ReadOnlySubmissionInspection | null>(null);
  const [selectedStudentForProfile, setSelectedStudentForProfile] = useState<InstitutionStudentProfile | null>(null);
  const [inspectionLoading, setInspectionLoading] = useState(false);
  const [studentProfileLoading, setStudentProfileLoading] = useState(false);
  const [isRechargeModalOpen, setIsRechargeModalOpen] = useState(false);

  // Filters & Search
  const [studentSearch, setStudentSearch] = useState('');
  const [classFilter, setClassFilter] = useState<string>('all');
  const [teacherSearch, setTeacherSearch] = useState('');

  // Notification / Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Fetch all initial data
  const loadAllData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [currRes, statsRes, teachersRes, classesRes, studentsRes, subsRes, ledgerRes] = await Promise.all([
        fetch('/api/institution/current?demo=1'),
        fetch('/api/institution/stats?demo=1'),
        fetch('/api/institution/teachers?demo=1'),
        fetch('/api/institution/classes?demo=1'),
        fetch('/api/institution/students?demo=1'),
        fetch('/api/institution/submissions?demo=1'),
        fetch('/api/institution/ledger?demo=1'),
      ]);

      if (currRes.ok) {
        const currData = await currRes.json();
        setInstitution(currData.institution);
        setCredits(currData.credits);
        setCurrentMember(currData.currentMember);
        setIsAdmin(currData.isAdmin);
      }

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData.stats);
      }

      if (teachersRes.ok) {
        const tData = await teachersRes.json();
        setTeachers(tData.teachers || []);
      }

      if (classesRes.ok) {
        const cData = await classesRes.json();
        setClasses(cData.classes || []);
      }

      if (studentsRes.ok) {
        const sData = await studentsRes.json();
        setStudents(sData.students || []);
      }

      if (subsRes.ok) {
        const subData = await subsRes.json();
        setSubmissions(subData.submissions || []);
      }

      if (ledgerRes.ok) {
        const lData = await ledgerRes.json();
        setLedger(lData.ledger || []);
      }
    } catch (err: any) {
      console.error('[InstitutionView] Fetch error:', err);
      setError('Impossible de charger les données de l’établissement.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // Handle Inspect Submission
  const handleInspectSubmission = async (submissionId: string) => {
    setInspectionLoading(true);
    try {
      const res = await fetch(`/api/institution/submissions/${encodeURIComponent(submissionId)}/inspect?demo=1`);
      const data = await res.json();
      if (res.ok && data.inspection) {
        setSelectedSubmissionForInspection(data.inspection);
      } else {
        showToast(data.error || 'Erreur lors de la récupération de la copie.');
      }
    } catch {
      showToast('Erreur de connexion au serveur.');
    } finally {
      setInspectionLoading(false);
    }
  };

  // Handle View Student Profile
  const handleViewStudentProfile = async (studentId: string) => {
    setStudentProfileLoading(true);
    try {
      const res = await fetch(`/api/institution/students/${encodeURIComponent(studentId)}?demo=1`);
      const data = await res.json();
      if (res.ok && data.student) {
        setSelectedStudentForProfile(data.student);
      } else {
        showToast(data.error || 'Fiche élève introuvable.');
      }
    } catch {
      showToast('Erreur de connexion.');
    } finally {
      setStudentProfileLoading(false);
    }
  };

  // Allocate Test Credits
  const handleAllocateTestCredits = async (delta = 500) => {
    try {
      const res = await fetch('/api/institution/credits/allocate?demo=1', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deltaCredits: delta,
          reason: `Recharge de test (${delta} crédits)`,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setCredits(data.credits);
        showToast(`+${delta} crédits ajoutés au solde de l'établissement avec succès !`);
        loadAllData();
      }
    } catch {
      showToast('Erreur lors de la recharge de crédits.');
    }
  };

  // Filtered Students
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const matchSearch = (s.fullName || '').toLowerCase().includes(studentSearch.toLowerCase());
      const matchClass = classFilter === 'all' || s.classId === classFilter || s.className === classFilter;
      return matchSearch && matchClass;
    });
  }, [students, studentSearch, classFilter]);

  // Filtered Teachers
  const filteredTeachers = useMemo(() => {
    return teachers.filter((t) => {
      const matchSearch =
        (t.fullName || '').toLowerCase().includes(teacherSearch.toLowerCase()) ||
        (t.email || '').toLowerCase().includes(teacherSearch.toLowerCase()) ||
        (t.assignedDisciplines || []).some((d: string) => d.toLowerCase().includes(teacherSearch.toLowerCase()));
      return matchSearch;
    });
  }, [teachers, teacherSearch]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 border border-slate-700 animate-in fade-in slide-in-from-bottom-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Secret Test Mode Top Banner */}
      <div className="bg-gradient-to-r from-emerald-950/80 via-teal-900/60 to-slate-900 border border-emerald-500/30 rounded-2xl p-4 sm:p-5 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-lg backdrop-blur-sm">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center shrink-0">
            <Shield className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-emerald-300 text-sm">Mode Direction Établissement Actif</span>
              <span className="text-slate-400 text-xs">· Accès Test Sécurisé</span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Vous supervisez le compte du directeur. Toutes les fonctionnalités B2B sont opérationnelles en direct (création de classes, inspection des copies corrigées, audit du grand livre).
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto justify-end">
          <button
            onClick={() => handleAllocateTestCredits(500)}
            className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-medium text-xs rounded-lg transition-all shadow-sm flex items-center gap-1.5"
          >
            <Zap className="w-3.5 h-3.5" />
            +500 Crédits Test
          </button>
          <button
            onClick={loadAllData}
            title="Rafraîchir les données"
            className="p-1.5 bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          {onOpenTeacherWorkspace && (
            <button
              onClick={onOpenTeacherWorkspace}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 text-xs font-medium rounded-lg transition-colors flex items-center gap-1"
            >
              <span>Espace Enseignant</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Institution Main Brand Card & Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center shrink-0">
              <Building2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                  {institution?.name || "Lycée d'Excellence Sainte-Marie"}
                </h1>
                <span className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60 px-2.5 py-0.5 rounded-full">
                  Établissement Agréé
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-1.5">
                <span>{institution?.city || 'Abidjan'}, {institution?.country || 'Côte d’Ivoire'}</span>
                <span aria-hidden="true">·</span>
                <span>Année {institution?.academicYear || '2026-2027'}</span>
                <span aria-hidden="true">·</span>
                <span>{institution?.plan || 'Forfait Établissement Annuel'}</span>
              </div>
            </div>
          </div>

          {/* Quick Credit Status widget */}
          <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl p-4 min-w-[240px]">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
              <span>Solde de corrections</span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                {credits?.remainingCredits?.toLocaleString('fr-FR') || '14 380'} restantes
              </span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(100, Math.round(((credits?.remainingCredits || 14380) / (credits?.totalAllocatedCredits || 15000)) * 100))}%`,
                }}
              />
            </div>
            <div className="flex justify-between items-center text-[11px] text-slate-400 mt-1.5">
              <span>{credits?.totalCopiesCorrected || 620} copies corrigées</span>
              <span>Total : {credits?.totalAllocatedCredits?.toLocaleString('fr-FR') || '15 000'}</span>
            </div>
          </div>
        </div>

        {/* Tab Navigation (Segmented Interactive Controls) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-6 mt-6 border-t border-slate-100 dark:border-slate-800 scrollbar-none">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 text-xs font-medium rounded-lg transition-colors whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'overview'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            Vue d'ensemble
          </button>

          <button
            onClick={() => setActiveTab('classes')}
            className={`px-4 py-2 text-xs font-medium rounded-lg transition-colors whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'classes'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            Gestion des Classes
            <span className="text-[10px] opacity-75">({classes.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('teachers')}
            className={`px-4 py-2 text-xs font-medium rounded-lg transition-colors whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'teachers'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            Équipe Enseignante
            <span className="text-[10px] opacity-75">({teachers.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('students')}
            className={`px-4 py-2 text-xs font-medium rounded-lg transition-colors whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'students'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            Fiches Élèves
            <span className="text-[10px] opacity-75">({students.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('submissions')}
            className={`px-4 py-2 text-xs font-medium rounded-lg transition-colors whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'submissions'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <FileCheck className="w-3.5 h-3.5" />
            Inspection des Copies
            <span className="text-[10px] opacity-75">({submissions.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('credits')}
            className={`px-4 py-2 text-xs font-medium rounded-lg transition-colors whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'credits'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            Crédits & Grand Livre
          </button>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* TAB 1: OVERVIEW & KPIS */}
      {/* ==================================================================== */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* 4 Primary Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs mb-3">
                <span>Crédits Disponibles</span>
                <Zap className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">
                {credits?.remainingCredits?.toLocaleString('fr-FR') || '14 380'}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                sur {credits?.totalAllocatedCredits?.toLocaleString('fr-FR') || '15 000'} alloués
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs mb-3">
                <span>Copies Corrigées</span>
                <FileCheck className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">
                {credits?.totalCopiesCorrected || 620}
              </div>
              <div className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
                Année scolaire 2026-2027
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs mb-3">
                <span>Corps Professoral</span>
                <Users className="w-4 h-4 text-blue-500" />
              </div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">
                {teachers.length} <span className="text-sm font-normal text-slate-400">/ {institution?.maxTeachers || 20}</span>
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                enseignants actifs rattachés
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs mb-3">
                <span>Moyenne Établissement</span>
                <Award className="w-4 h-4 text-purple-500" />
              </div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">
                {stats?.globalAverage ? `${stats.globalAverage} / 20` : '13.8 / 20'}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                calculée sur toutes les évaluations
              </div>
            </div>
          </div>

          {/* Breakdown by Discipline & Recent Submissions */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Disciplines Performance */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                  Répartition par Discipline
                </h2>
                <span className="text-xs text-slate-400">{classes.length} classes suivies</span>
              </div>

              <div className="space-y-4">
                {(stats?.subjects || [
                  { discipline: 'Mathématiques', teachersCount: 1, classesCount: 3, evaluationsCount: 245 },
                  { discipline: 'Français', teachersCount: 1, classesCount: 2, evaluationsCount: 180 },
                  { discipline: 'Physique-Chimie', teachersCount: 1, classesCount: 2, evaluationsCount: 120 },
                  { discipline: 'SVT', teachersCount: 1, classesCount: 1, evaluationsCount: 75 },
                ]).map((subj: any) => (
                  <div key={subj.discipline} className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-medium text-slate-800 dark:text-slate-200">{subj.discipline}</span>
                      <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">{subj.evaluationsCount} copies</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <span>{subj.classesCount} classes</span>
                      <span aria-hidden="true">·</span>
                      <span>{subj.teachersCount} enseignant(s)</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Submissions Feed */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                  Dernières Copies Corrigées
                </h2>
                <button
                  onClick={() => setActiveTab('submissions')}
                  className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 font-medium"
                >
                  Tout consulter
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>

              <div className="space-y-3">
                {submissions.slice(0, 4).map((sub: any) => (
                  <div
                    key={sub.submissionId}
                    className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-700/60 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-800/20"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-slate-900 dark:text-white">{sub.studentName}</span>
                        <span className="text-xs text-slate-500">· {sub.className}</span>
                        <span className="text-xs text-slate-400">· {sub.discipline}</span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">
                        {sub.assignmentTitle}
                      </p>
                      <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-1">
                        <span>Par {sub.teacherName}</span>
                        <span aria-hidden="true">·</span>
                        <span>{sub.date}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 justify-between sm:justify-end">
                      <div className="text-right">
                        <span className="text-base font-bold text-slate-900 dark:text-white">
                          {sub.noteFinale}
                        </span>
                        <span className="text-xs text-slate-400">/{sub.noteSur || 20}</span>
                      </div>

                      <button
                        onClick={() => handleInspectSubmission(sub.submissionId)}
                        className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-emerald-500 text-xs font-medium text-slate-800 dark:text-slate-200 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
                      >
                        <Eye className="w-3.5 h-3.5 text-emerald-600" />
                        Examiner
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 2: CLASSES MANAGEMENT */}
      {/* ==================================================================== */}
      {activeTab === 'classes' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Classes de l'Établissement</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Organisez vos divisions scolaires et assignez les professeurs par matière pour l'année {institution?.academicYear || '2026-2027'}.
              </p>
            </div>

            <button
              onClick={() => setIsCreateClassModalOpen(true)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs rounded-xl transition-all shadow-sm flex items-center gap-1.5 self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              Créer une Nouvelle Classe
            </button>
          </div>

          {/* Classes Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {classes.map((cls) => (
              <div
                key={cls.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-base text-slate-900 dark:text-white">{cls.name}</h3>
                      <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                        <span>Niveau : {cls.level}</span>
                        <span aria-hidden="true">·</span>
                        <span>{cls.academicYear}</span>
                      </div>
                    </div>
                    <span className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-md font-medium">
                      {(cls.students || []).length} élèves
                    </span>
                  </div>

                  {/* Assigned Teachers by Discipline */}
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      Professeurs Assignés
                    </span>
                    {(cls.teachers || []).length > 0 ? (
                      (cls.teachers || []).map((t) => (
                        <div key={t.id} className="flex items-center justify-between text-xs">
                          <span className="text-slate-700 dark:text-slate-300 font-medium">{t.teacherName}</span>
                          <span className="text-slate-500 dark:text-slate-400 text-[11px] bg-slate-50 dark:bg-slate-800/80 px-2 py-0.5 rounded">
                            {t.discipline}
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-400 italic">Aucun professeur assigné</p>
                    )}
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <button
                    onClick={() => {
                      setClassFilter(cls.id);
                      setActiveTab('students');
                    }}
                    className="text-xs text-emerald-600 dark:text-emerald-400 font-medium hover:underline flex items-center gap-1"
                  >
                    Voir les élèves
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={async () => {
                        if (confirm(`Confirmez-vous la suppression de la classe ${cls.name} ?`)) {
                          const res = await fetch(`/api/institution/classes/${cls.id}?demo=1`, { method: 'DELETE' });
                          if (res.ok) {
                            showToast(`Classe ${cls.name} supprimée.`);
                            loadAllData();
                          }
                        }
                      }}
                      className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                      title="Supprimer la classe"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 3: TEACHERS ROSTER */}
      {/* ==================================================================== */}
      {activeTab === 'teachers' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Équipe Enseignante</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {teachers.length} professeurs rattachés au forfait collectif ({institution?.maxTeachers || 20} places incluses).
              </p>
            </div>

            <button
              onClick={() => setIsInviteTeacherModalOpen(true)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs rounded-xl transition-all shadow-sm flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Inviter un Enseignant
            </button>
          </div>

          {/* Option C Explanation Banner */}
          <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 flex items-start gap-3.5 text-xs shadow-xs">
            <div className="w-9 h-9 rounded-xl bg-blue-500/15 border border-blue-500/30 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <Zap className="w-4.5 h-4.5" />
            </div>
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-bold text-slate-900 dark:text-white">
                  Régime de Crédits : Option C (Pool Commun + Traçabilité Nominative + Plafond Optionnel)
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold border border-emerald-300 dark:border-emerald-700">
                  Actif
                </span>
              </div>
              <p className="text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                Tous les enseignants de l'établissement puisent dans le pot commun de <strong>{credits?.remainingCredits?.toLocaleString('fr-FR') || '14 380'} copies</strong> sans avance de frais. Chaque évaluation est nominativement consignée dans le Grand Livre d'audit. Vous pouvez encadrer la consommation d'un enseignant spécifique en lui fixant un plafond individuel via le bouton <strong>« Quota »</strong>.
              </p>
            </div>
          </div>

          {/* Search bar */}
          <div className="relative max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher par nom, email ou matière..."
              value={teacherSearch}
              onChange={(e) => setTeacherSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Teachers Table */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="py-3 px-4">Enseignant</th>
                    <th className="py-3 px-4">Matières</th>
                    <th className="py-3 px-4">Classes</th>
                    <th className="py-3 px-4">Copies Corrigées</th>
                    <th className="py-3 px-4">Régime Crédits</th>
                    <th className="py-3 px-4">Statut & Invitation</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredTeachers.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900 dark:text-white">{t.fullName}</div>
                        <div className="text-slate-500 text-[11px] flex items-center gap-1.5 mt-0.5">
                          <span>{t.email}</span>
                          {t.invitationEmailSent && (
                            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-1.5 py-0.2 rounded font-medium inline-flex items-center gap-0.5">
                              <Mail className="w-2.5 h-2.5" />
                              Email délivré
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap gap-1">
                          {(t.assignedDisciplines || ['Général']).map((d: string) => (
                            <span key={d} className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded text-[11px]">
                              {d}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300 font-medium">
                        {t.classesCount || 0} classes
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">
                          {t.copiesCorrectedCount || 0}
                        </span>
                        <span className="text-slate-400 text-[11px]"> copies</span>
                      </td>
                      <td className="py-3.5 px-4">
                        {t.maxCreditsLimit ? (
                          <div className="space-y-0.5">
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 rounded-md">
                              Quota : {t.copiesCorrectedCount || 0} / {t.maxCreditsLimit}
                            </span>
                            <div className="w-24 bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                              <div
                                className="bg-amber-500 h-1.5 rounded-full"
                                style={{
                                  width: `${Math.min(100, Math.round(((t.copiesCorrectedCount || 0) / t.maxCreditsLimit) * 100))}%`,
                                }}
                              />
                            </div>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md">
                            <Zap className="w-3 h-3 text-emerald-500" />
                            Pool commun (Illimité)
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            t.status === 'active'
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                              : 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                          }`}
                        >
                          {t.status === 'active' ? 'Actif' : 'Suspendu'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2 text-xs">
                          <button
                            onClick={async () => {
                              try {
                                const res = await fetch(`/api/institution/teachers/${t.id}/resend-invite?demo=1`, {
                                  method: 'POST',
                                });
                                const data = await res.json();
                                if (res.ok) {
                                  showToast(data.message || 'Email d’invitation renvoyé avec succès.');
                                  loadAllData();
                                }
                              } catch {
                                showToast('Erreur lors de l’envoi.');
                              }
                            }}
                            title="Renvoyer l'email d'invitation officiel"
                            className="px-2 py-1 text-slate-600 dark:text-slate-300 hover:text-emerald-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1"
                          >
                            <Mail className="w-3 h-3" />
                            <span className="text-[11px]">Renvoyer email</span>
                          </button>

                          <button
                            onClick={() => setSelectedTeacherForQuota(t)}
                            className="px-2 py-1 text-slate-600 dark:text-slate-300 hover:text-amber-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                            title="Ajuster le plafond de copies de l'enseignant"
                          >
                            <Edit2 className="w-3 h-3" />
                            <span className="text-[11px]">Quota</span>
                          </button>

                          <button
                            onClick={async () => {
                              const newStatus = t.status === 'active' ? 'suspended' : 'active';
                              const res = await fetch(`/api/institution/teachers/${t.id}/status?demo=1`, {
                                method: 'PATCH',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ status: newStatus }),
                              });
                              if (res.ok) {
                                showToast(`Statut mis à jour : ${newStatus === 'active' ? 'Actif' : 'Suspendu'}`);
                                loadAllData();
                              }
                            }}
                            className="text-[11px] text-slate-400 hover:text-slate-900 dark:hover:text-white underline ml-1"
                          >
                            {t.status === 'active' ? 'Suspendre' : 'Activer'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 4: STUDENTS DOSSIERS */}
      {/* ==================================================================== */}
      {activeTab === 'students' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Fiches Élèves & Suivi Pédagogique</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Consultez l'historique complet des évaluations et la progression inter-matières de chaque élève.
              </p>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Rechercher un élève..."
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="w-full sm:w-auto flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <select
                value={classFilter}
                onChange={(e) => setClassFilter(e.target.value)}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none"
              >
                <option value="all">Toutes les classes</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.level})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Students Table */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="py-3 px-4">Élève</th>
                    <th className="py-3 px-4">Classe & Niveau</th>
                    <th className="py-3 px-4">Année Scolaire</th>
                    <th className="py-3 px-4">Moyenne Générale</th>
                    <th className="py-3 px-4">Évaluations</th>
                    <th className="py-3 px-4 text-right">Dossier</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredStudents.map((st) => (
                    <tr key={st.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-white">
                        {st.fullName}
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">
                        {st.className} <span className="text-slate-400">({st.classLevel})</span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-500">
                        {st.academicYear}
                      </td>
                      <td className="py-3.5 px-4">
                        {typeof st.averageGrade === 'number' ? (
                          <span
                            className={`font-bold ${
                              st.averageGrade >= 14
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : st.averageGrade >= 10
                                ? 'text-amber-600 dark:text-amber-400'
                                : 'text-rose-600 dark:text-rose-400'
                            }`}
                          >
                            {st.averageGrade} / 20
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">En cours</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500">
                        {st.evaluationsCount} devoirs
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => handleViewStudentProfile(st.id)}
                          className="px-3 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 text-slate-800 dark:text-slate-200 hover:text-emerald-600 text-xs font-medium rounded-lg transition-colors inline-flex items-center gap-1"
                        >
                          <span>Consulter</span>
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 5: SUBMISSIONS INSPECTION (DIRECTOR READ-ONLY AUDIT) */}
      {/* ==================================================================== */}
      {activeTab === 'submissions' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Inspection Sécurisée des Copies</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Accès réservé à la direction. Consultez les copies manuscrites originales, les annotations de l'enseignant et les appréciations détaillées.
              </p>
            </div>
          </div>

          {/* Submissions Table */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="py-3 px-4">Élève</th>
                    <th className="py-3 px-4">Devoir & Matière</th>
                    <th className="py-3 px-4">Classe</th>
                    <th className="py-3 px-4">Enseignant</th>
                    <th className="py-3 px-4">Note Finale</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {submissions.map((sub) => (
                    <tr key={sub.submissionId} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-white">
                        {sub.studentName}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-800 dark:text-slate-200">{sub.assignmentTitle}</div>
                        <div className="text-[11px] text-slate-400">{sub.discipline}</div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">
                        {sub.className}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400">
                        {sub.teacherName}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-slate-900 dark:text-white text-sm">
                          {sub.noteFinale}
                        </span>
                        <span className="text-slate-400">/{sub.noteSur || 20}</span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-500">
                        {sub.date}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => handleInspectSubmission(sub.submissionId)}
                          className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 text-xs font-semibold rounded-lg transition-colors inline-flex items-center gap-1.5"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Examiner la copie
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 6: CREDITS & LEDGER AUDIT */}
      {/* ==================================================================== */}
      {activeTab === 'credits' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Grand Livre des Crédits</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Traçabilité rigoureuse de chaque crédit consommé par les professeurs de l'établissement.
              </p>
            </div>

            <button
              onClick={() => setIsRechargeModalOpen(true)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs rounded-xl transition-all shadow-sm flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
            >
              <Zap className="w-4 h-4" />
              Recharger des Crédits Établissement
            </button>
          </div>

          {/* Ledger Table */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Enseignant</th>
                    <th className="py-3 px-4">Opération / Devoir</th>
                    <th className="py-3 px-4">Élève</th>
                    <th className="py-3 px-4 text-right">Variation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {ledger.map((entry) => (
                    <tr key={entry.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="py-3.5 px-4 text-slate-500">
                        {new Date(entry.date).toLocaleString('fr-FR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-white">
                        {entry.teacherName}
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">
                        {entry.submissionTitle}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500">
                        {entry.studentName}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <span
                          className={`font-bold font-mono ${
                            entry.delta > 0
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-rose-600 dark:text-rose-400'
                          }`}
                        >
                          {entry.delta > 0 ? `+${entry.delta}` : entry.delta}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL 1: CREATE CLASS MODAL */}
      {/* ==================================================================== */}
      {isCreateClassModalOpen && (
        <CreateClassModal
          teachers={teachers}
          academicYear={institution?.academicYear || '2026-2027'}
          onClose={() => setIsCreateClassModalOpen(false)}
          onCreated={() => {
            setIsCreateClassModalOpen(false);
            showToast('Nouvelle classe créée avec succès !');
            loadAllData();
          }}
        />
      )}

      {/* ==================================================================== */}
      {/* MODAL 2: INVITE TEACHER MODAL */}
      {/* ==================================================================== */}
      {isInviteTeacherModalOpen && (
        <InviteTeacherModal
          onClose={() => setIsInviteTeacherModalOpen(false)}
          onInvited={() => {
            setIsInviteTeacherModalOpen(false);
            showToast('Enseignant invité et ajouté à l’établissement !');
            loadAllData();
          }}
        />
      )}

      {/* ==================================================================== */}
      {/* MODAL 2B: EDIT TEACHER QUOTA MODAL (OPTION C) */}
      {/* ==================================================================== */}
      {selectedTeacherForQuota && (
        <EditTeacherQuotaModal
          teacher={selectedTeacherForQuota}
          remainingPoolCredits={credits?.remainingCredits || 14380}
          onClose={() => setSelectedTeacherForQuota(null)}
          onSaved={() => {
            setSelectedTeacherForQuota(null);
            showToast('Quota enseignant mis à jour avec succès.');
            loadAllData();
          }}
        />
      )}

      {/* ==================================================================== */}
      {/* MODAL 3: SECURE SUBMISSION INSPECTION MODAL (DIRECTOR READ-ONLY) */}
      {/* ==================================================================== */}
      {selectedSubmissionForInspection && (
        <InspectionModal
          submission={selectedSubmissionForInspection}
          onClose={() => setSelectedSubmissionForInspection(null)}
        />
      )}

      {/* ==================================================================== */}
      {/* MODAL 4: STUDENT MULTI-YEAR PROFILE MODAL */}
      {/* ==================================================================== */}
      {selectedStudentForProfile && (
        <StudentProfileModal
          student={selectedStudentForProfile}
          onClose={() => setSelectedStudentForProfile(null)}
          onInspectSubmission={(subId) => {
            setSelectedStudentForProfile(null);
            handleInspectSubmission(subId);
          }}
        />
      )}

      {/* ==================================================================== */}
      {/* MODAL 5: RECHARGE CREDITS ÉTABLISSEMENT */}
      {/* ==================================================================== */}
      {isRechargeModalOpen && (
        <InstitutionRechargeModal
          currentCredits={credits?.remainingCredits || 0}
          onClose={() => setIsRechargeModalOpen(false)}
          onConfirmRecharge={async (delta, reason) => {
            await handleAllocateTestCredits(delta);
            setIsRechargeModalOpen(false);
          }}
        />
      )}
    </div>
  );
};

// ----------------------------------------------------------------------------
// MODAL: RECHARGE CREDITS ÉTABLISSEMENT
// ----------------------------------------------------------------------------
interface InstitutionRechargeModalProps {
  currentCredits: number;
  onClose: () => void;
  onConfirmRecharge: (delta: number, reason: string) => Promise<void>;
}

const InstitutionRechargeModal: React.FC<InstitutionRechargeModalProps> = ({
  currentCredits,
  onClose,
  onConfirmRecharge,
}) => {
  const [selectedPack, setSelectedPack] = useState<number>(1000);
  const [customVolume, setCustomVolume] = useState<number>(2000);
  const [isCustom, setIsCustom] = useState(false);
  const [loading, setLoading] = useState(false);

  const packs = [
    { delta: 500, priceFcfa: 15000, rate: 30, tag: 'Recharge Rapide' },
    { delta: 1000, priceFcfa: 28000, rate: 28, tag: 'Pack Trimestriel' },
    { delta: 2000, priceFcfa: 50000, rate: 25, tag: 'Examens Blancs' },
    { delta: 5000, priceFcfa: 110000, rate: 22, tag: 'Maxi Volume École' },
  ];

  const getCustomRate = (c: number) => {
    if (c < 1000) return 30;
    if (c < 2000) return 28;
    if (c < 5000) return 25;
    return 22;
  };

  const activeDelta = isCustom ? customVolume : selectedPack;
  const activeRate = isCustom ? getCustomRate(customVolume) : (packs.find((p) => p.delta === selectedPack)?.rate || 28);
  const activePriceFcfa = isCustom ? customVolume * activeRate : (packs.find((p) => p.delta === selectedPack)?.priceFcfa || 28000);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onConfirmRecharge(activeDelta, `Recharge collective de +${activeDelta} copies (${activePriceFcfa.toLocaleString('fr-FR')} FCFA)`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg p-6 sm:p-7 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Recharger les Crédits Établissement
            </h3>
            <p className="text-xs text-slate-500">
              Solde actuel : <span className="font-bold text-slate-800 dark:text-slate-200">{currentCredits.toLocaleString('fr-FR')}</span> corrections
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Paliers prédéfinis */}
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-2">
              Choisissez un pack de recharge école :
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              {packs.map((p) => (
                <button
                  type="button"
                  key={p.delta}
                  onClick={() => {
                    setSelectedPack(p.delta);
                    setIsCustom(false);
                  }}
                  className={`p-3 rounded-xl border-2 text-left transition-all cursor-pointer ${
                    !isCustom && selectedPack === p.delta
                      ? 'border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/30 font-bold'
                      : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:border-slate-300'
                  }`}
                >
                  <div className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold">{p.tag}</div>
                  <div className="text-sm font-extrabold text-slate-900 dark:text-white mt-0.5">
                    +{p.delta.toLocaleString('fr-FR')} copies
                  </div>
                  <div className="text-xs text-slate-600 dark:text-slate-300 font-bold mt-0.5">
                    {p.priceFcfa.toLocaleString('fr-FR')} FCFA
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">({p.rate} F / copie)</div>
                </button>
              ))}
            </div>
          </div>

          {/* Option montant personnalisé */}
          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40">
            <div className="flex items-center justify-between mb-2">
              <label className="font-bold text-slate-800 dark:text-slate-200 cursor-pointer flex items-center gap-2">
                <input
                  type="radio"
                  name="rechargeType"
                  checked={isCustom}
                  onChange={() => setIsCustom(true)}
                  className="accent-emerald-600"
                />
                <span>Volume sur-mesure (ex: 500 à 10 000 copies)</span>
              </label>
              {isCustom && (
                <span className="font-extrabold text-emerald-600 text-sm tabular-nums">
                  {customVolume.toLocaleString('fr-FR')} copies
                </span>
              )}
            </div>

            {isCustom && (
              <div className="space-y-2 pt-1">
                <input
                  type="range"
                  min={200}
                  max={10000}
                  step={100}
                  value={customVolume}
                  onChange={(e) => setCustomVolume(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                />
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span>Tarif dégressif : {activeRate} F / copie</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    Total : {activePriceFcfa.toLocaleString('fr-FR')} FCFA
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Récapitulatif sélection */}
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between">
            <div>
              <span className="text-[11px] text-emerald-800 dark:text-emerald-300 font-medium block">
                Total à créditer sur l'établissement :
              </span>
              <span className="text-base font-black text-emerald-900 dark:text-emerald-100">
                +{activeDelta.toLocaleString('fr-FR')} corrections
              </span>
            </div>
            <div className="text-right">
              <span className="text-[11px] text-slate-500 block">Montant</span>
              <span className="text-base font-black text-slate-900 dark:text-white tabular-nums">
                {activePriceFcfa.toLocaleString('fr-FR')} FCFA
              </span>
            </div>
          </div>

          <p className="text-[11px] text-slate-500 leading-relaxed">
            💳 Compatible Paystack (Wave, Orange Money, MTN, Moov & CB) ou inscription directe au Grand Livre de l'établissement.
          </p>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Zap className="w-4 h-4" />
              <span>{loading ? 'Rechargement...' : `Valider et Recharger (+${activeDelta})`}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ----------------------------------------------------------------------------
// MODAL: CREATE CLASS
// ----------------------------------------------------------------------------
interface CreateClassModalProps {
  teachers: InstitutionMember[];
  academicYear: string;
  onClose: () => void;
  onCreated: () => void;
}

const CreateClassModal: React.FC<CreateClassModalProps> = ({
  teachers,
  academicYear,
  onClose,
  onCreated,
}) => {
  const [name, setName] = useState('');
  const [level, setLevel] = useState('4e');
  const [studentsRaw, setStudentsRaw] = useState('');
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [selectedDiscipline, setSelectedDiscipline] = useState('Mathématiques');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    try {
      const studentList = studentsRaw
        .split(/[\n,;]+/)
        .map((s) => s.trim())
        .filter(Boolean);

      const assignedTeacher = teachers.find((t) => t.id === selectedTeacherId);
      const teachersPayload = assignedTeacher
        ? [
            {
              teacherId: assignedTeacher.id,
              teacherName: assignedTeacher.fullName,
              teacherEmail: assignedTeacher.email,
              discipline: selectedDiscipline,
            },
          ]
        : [];

      const res = await fetch('/api/institution/classes?demo=1', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          level,
          academicYear,
          teachers: teachersPayload,
          studentsList: studentList,
        }),
      });

      if (res.ok) {
        onCreated();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-600 rounded-lg"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
          Créer une Nouvelle Classe
        </h3>
        <p className="text-xs text-slate-500 mb-5">
          Définissez la classe et assignez un premier professeur pour l'année {academicYear}.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
              Nom de la classe (ex: 4e C, Seconde 2)
            </label>
            <input
              type="text"
              required
              placeholder="Ex: 4e C"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                Niveau
              </label>
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none"
              >
                <option value="6e">6e</option>
                <option value="5e">5e</option>
                <option value="4e">4e</option>
                <option value="3e (Brevet)">3e (Brevet)</option>
                <option value="Seconde">Seconde</option>
                <option value="Première">Première</option>
                <option value="Terminale">Terminale</option>
              </select>
            </div>

            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                Année Scolaire
              </label>
              <input
                type="text"
                disabled
                value={academicYear}
                className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-500"
              />
            </div>
          </div>

          <div>
            <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
              Professeur Assigné (Optionnel)
            </label>
            <select
              value={selectedTeacherId}
              onChange={(e) => setSelectedTeacherId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none"
            >
              <option value="">Sélectionner un enseignant...</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.fullName} ({t.assignedDisciplines?.join(', ') || 'Général'})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
              Liste des Élèves (un nom par ligne ou séparés par virgules)
            </label>
            <textarea
              rows={4}
              placeholder="Ex :&#10;Koffi Yao&#10;Aya Kouamé&#10;Jean-Marc Konan"
              value={studentsRaw}
              onChange={(e) => setStudentsRaw(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none font-sans"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl transition-colors disabled:opacity-50"
            >
              {loading ? 'Création en cours...' : 'Créer la classe'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ----------------------------------------------------------------------------
// MODAL: INVITE TEACHER
// ----------------------------------------------------------------------------
interface InviteTeacherModalProps {
  onClose: () => void;
  onInvited: () => void;
}

const InviteTeacherModal: React.FC<InviteTeacherModalProps> = ({ onClose, onInvited }) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneWhatsapp, setPhoneWhatsapp] = useState('');
  const [discipline, setDiscipline] = useState('Mathématiques');
  const [sendInvitationEmail, setSendInvitationEmail] = useState(true);
  const [allocationMode, setAllocationMode] = useState<'shared_pool' | 'custom_quota'>('shared_pool');
  const [maxCreditsLimit, setMaxCreditsLimit] = useState<number | string>('500');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !discipline.trim()) return;

    setLoading(true);
    try {
      const res = await fetch('/api/institution/teachers/invite?demo=1', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: fullName.trim(),
          email: email.trim(),
          phoneWhatsapp: phoneWhatsapp.trim(),
          discipline: discipline.trim(),
          sendInvitationEmail,
          maxCreditsLimit: allocationMode === 'custom_quota' ? Number(maxCreditsLimit) : null,
        }),
      });

      if (res.ok) {
        onInvited();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-600 rounded-lg"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5 mb-1">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
            <Mail className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Inviter un Enseignant
            </h3>
            <p className="text-xs text-slate-500">
              Notification automatique par email & rattachement immédiat à l'établissement.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs mt-4">
          <div>
            <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
              Nom complet de l'enseignant
            </label>
            <input
              type="text"
              required
              placeholder="Ex : M. Paul Koffi"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
              Adresse Email professionnelle (pour l'invitation)
            </label>
            <input
              type="email"
              required
              placeholder="Ex : p.koffi@ecole.ci"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                Matière Enseignée
              </label>
              <select
                value={discipline}
                onChange={(e) => setDiscipline(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none"
              >
                <option value="Mathématiques">Mathématiques</option>
                <option value="Français">Français</option>
                <option value="Physique-Chimie">Physique-Chimie</option>
                <option value="Sciences de la Vie et de la Terre (SVT)">Sciences de la Vie et de la Terre (SVT)</option>
                <option value="Histoire-Géographie">Histoire-Géographie</option>
                <option value="Anglais">Anglais</option>
                <option value="Philosophie">Philosophie</option>
              </select>
            </div>

            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                Numéro WhatsApp (Optionnel)
              </label>
              <input
                type="tel"
                placeholder="+225 07 00 00 00"
                value={phoneWhatsapp}
                onChange={(e) => setPhoneWhatsapp(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none"
              />
            </div>
          </div>

          {/* Envoi d'email automatique */}
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={sendInvitationEmail}
                onChange={(e) => setSendInvitationEmail(e.target.checked)}
                className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
              />
              <div className="flex-1">
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  Envoyer un email d'invitation officiel Praxis
                </span>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                  L'enseignant recevra un lien d'activation sécurisé avec les identifiants d'accès rattachés à votre forfait.
                </p>
              </div>
            </label>
          </div>

          {/* Politique d'attribution des crédits */}
          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                Attribution des crédits de correction
              </span>
              <span className="text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-full font-medium">
                Choix recommandé : Pool partagé
              </span>
            </div>

            <div className="space-y-2">
              <label className="flex items-start gap-2 cursor-pointer p-2 rounded-lg hover:bg-white dark:hover:bg-slate-800 transition-colors border border-transparent hover:border-slate-200">
                <input
                  type="radio"
                  name="allocationMode"
                  checked={allocationMode === 'shared_pool'}
                  onChange={() => setAllocationMode('shared_pool')}
                  className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
                />
                <div className="text-[11px]">
                  <strong className="text-slate-800 dark:text-slate-200 block">
                    Pool partagé de l'établissement (Recommandé)
                  </strong>
                  <span className="text-slate-500">
                    L'enseignant puise dans les crédits de l'école selon ses besoins réels. La direction suit chaque copie dans le Grand Livre.
                  </span>
                </div>
              </label>

              <label className="flex items-start gap-2 cursor-pointer p-2 rounded-lg hover:bg-white dark:hover:bg-slate-800 transition-colors border border-transparent hover:border-slate-200">
                <input
                  type="radio"
                  name="allocationMode"
                  checked={allocationMode === 'custom_quota'}
                  onChange={() => setAllocationMode('custom_quota')}
                  className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
                />
                <div className="text-[11px]">
                  <strong className="text-slate-800 dark:text-slate-200 block">
                    Plafond individuel strict (Optionnel)
                  </strong>
                  <span className="text-slate-500">
                    Fixer une limite maximale de copies pour cet enseignant (ex: 200 ou 500 copies).
                  </span>
                </div>
              </label>
            </div>

            {allocationMode === 'custom_quota' && (
              <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                <label className="block text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Nombre maximum de copies attribuées à cet enseignant :
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="10"
                    max="10000"
                    step="10"
                    value={maxCreditsLimit}
                    onChange={(e) => setMaxCreditsLimit(e.target.value)}
                    className="w-32 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                  />
                  <span className="text-[11px] text-slate-500">copies max</span>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl transition-colors disabled:opacity-50 flex items-center gap-1.5"
            >
              <Mail className="w-3.5 h-3.5" />
              {loading ? 'Envoi en cours...' : 'Envoyer l’invitation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ----------------------------------------------------------------------------
// MODAL: EDIT TEACHER QUOTA / REGULATION (OPTION C)
// ----------------------------------------------------------------------------
interface EditTeacherQuotaModalProps {
  teacher: InstitutionMember;
  remainingPoolCredits?: number;
  onClose: () => void;
  onSaved: () => void;
}

const EditTeacherQuotaModal: React.FC<EditTeacherQuotaModalProps> = ({
  teacher,
  remainingPoolCredits = 14380,
  onClose,
  onSaved,
}) => {
  const [allocationMode, setAllocationMode] = useState<'shared_pool' | 'custom_quota'>(
    teacher.maxCreditsLimit ? 'custom_quota' : 'shared_pool'
  );
  const [maxCreditsLimit, setMaxCreditsLimit] = useState<string>(
    teacher.maxCreditsLimit ? String(teacher.maxCreditsLimit) : '300'
  );
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const parsedLimit = allocationMode === 'custom_quota' ? Math.max(1, Number(maxCreditsLimit)) : null;
      const res = await fetch(`/api/institution/teachers/${teacher.id}/quota?demo=1`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ maxCreditsLimit: parsedLimit }),
      });
      if (res.ok) {
        onSaved();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5 mb-2">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Gestion du Quota · {teacher.fullName}
            </h3>
            <p className="text-xs text-slate-500">{teacher.email}</p>
          </div>
        </div>

        <div className="my-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300">
          <div className="flex justify-between items-center">
            <span>Copies déjà corrigées par cet enseignant :</span>
            <strong className="text-slate-900 dark:text-white font-mono">{teacher.copiesCorrectedCount || 0} copies</strong>
          </div>
          <div className="flex justify-between items-center mt-1">
            <span>Solde global de l'établissement :</span>
            <strong className="text-emerald-600 dark:text-emerald-400 font-mono">{remainingPoolCredits.toLocaleString('fr-FR')} crédits</strong>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs mt-3">
          <div className="space-y-2">
            <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
              <input
                type="radio"
                name="quotaMode"
                checked={allocationMode === 'shared_pool'}
                onChange={() => setAllocationMode('shared_pool')}
                className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
              />
              <div>
                <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                  Accès libre au Pool Commun (Recommandé)
                </span>
                <span className="text-slate-500 text-[11px]">
                  L'enseignant puise librement dans le pot commun de l'établissement. Toutes ses corrections sont nominativement consignées dans le Grand Livre.
                </span>
              </div>
            </label>

            <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
              <input
                type="radio"
                name="quotaMode"
                checked={allocationMode === 'custom_quota'}
                onChange={() => setAllocationMode('custom_quota')}
                className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
              />
              <div className="flex-1">
                <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                  Plafond individuel strict (Garde-fou)
                </span>
                <span className="text-slate-500 text-[11px]">
                  Bloque le débit sur le pool commun dès que cet enseignant atteint ce nombre de copies.
                </span>
                {allocationMode === 'custom_quota' && (
                  <div className="mt-2.5 flex items-center gap-2">
                    <input
                      type="number"
                      min="1"
                      max="10000"
                      value={maxCreditsLimit}
                      onChange={(e) => setMaxCreditsLimit(e.target.value)}
                      className="w-32 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-xs text-slate-900 dark:text-white font-mono"
                    />
                    <span className="text-slate-500 text-[11px]">copies maximum</span>
                  </div>
                )}
              </div>
            </label>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl transition-colors cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Enregistrement...' : 'Enregistrer le quota'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ----------------------------------------------------------------------------
// MODAL: SECURE READ-ONLY SUBMISSION INSPECTION (DIRECTOR VIEW)
// ----------------------------------------------------------------------------
interface InspectionModalProps {
  submission: ReadOnlySubmissionInspection;
  onClose: () => void;
}

const InspectionModal: React.FC<InspectionModalProps> = ({ submission, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl relative p-6">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Security & Audit Stamp */}
        <div className="inline-flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-3 py-1 rounded-full text-xs text-emerald-800 dark:text-emerald-300 mb-4">
          <Shield className="w-3.5 h-3.5" />
          <span>Consultation Sécurisée Direction · Accès consigné dans le journal d'audit</span>
        </div>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              {submission.studentName} · {submission.assignmentTitle}
            </h2>
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-1">
              <span>Classe : {submission.className}</span>
              <span aria-hidden="true">·</span>
              <span>Discipline : {submission.discipline}</span>
              <span aria-hidden="true">·</span>
              <span>Enseignant : {submission.teacherName}</span>
              <span aria-hidden="true">·</span>
              <span>Date : {submission.date}</span>
            </div>
          </div>

          <div className="text-left sm:text-right shrink-0 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              {submission.noteFinale} <span className="text-sm font-normal text-slate-400">/{submission.noteSur || 20}</span>
            </div>
            <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
              Validée par l'enseignant
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          {/* Left: Scan Preview */}
          <div className="space-y-4">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Scan de la Copie Originale ({submission.pageUrls?.length || 1} page)
            </h3>
            <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950 flex flex-col gap-3 p-2">
              {(submission.pageUrls || []).map((url, i) => (
                <div key={i} className="relative group">
                  <img
                    src={url}
                    alt={`Page ${i + 1}`}
                    className="w-full object-contain rounded-lg max-h-[420px] bg-white shadow-sm"
                  />
                  <div className="absolute bottom-2 right-2 bg-slate-900/80 text-white text-[11px] px-2 py-0.5 rounded">
                    Page {i + 1}
                  </div>
                </div>
              ))}
            </div>

            {/* Overall Appreciation */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800">
              <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-emerald-600" />
                Appréciation Pédagogique Finale
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed italic">
                « {submission.appreciation} »
              </p>
            </div>
          </div>

          {/* Right: Detailed Questions & Competences */}
          <div className="space-y-5">
            {/* Competences */}
            {submission.competences && submission.competences.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Compétences Évaluées
                </h3>
                <div className="space-y-1.5">
                  {submission.competences.map((comp: any, i: number) => (
                    <div
                      key={i}
                      className="flex items-center justify-between text-xs p-2 bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-slate-100 dark:border-slate-800"
                    >
                      <span className="text-slate-800 dark:text-slate-200 font-medium">{comp.nom}</span>
                      <span
                        className={`text-[11px] font-semibold ${
                          comp.statut === 'Acquis'
                            ? 'text-emerald-600'
                            : comp.statut === 'En cours'
                            ? 'text-amber-600'
                            : 'text-rose-600'
                        }`}
                      >
                        {comp.statut}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Questions breakdown */}
            <div>
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Détail des Exercices & Barème
              </h3>
              <div className="space-y-3">
                {(submission.questions || []).map((q: any, i: number) => (
                  <div
                    key={i}
                    className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/20 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-xs text-slate-900 dark:text-white">
                        {q.numero_ou_titre || `Exercice ${i + 1}`}
                      </span>
                      <span className="font-bold text-xs text-slate-900 dark:text-white">
                        {q.note} / {q.note_max} pt
                      </span>
                    </div>

                    {q.reponse_eleve && (
                      <div className="text-[11px] text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/60 p-2 rounded">
                        <span className="font-medium text-slate-400 block mb-0.5">Réponse élève :</span>
                        {q.reponse_eleve}
                      </div>
                    )}

                    {q.justification && (
                      <div className="text-[11px] text-slate-500 italic">
                        {q.justification}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Strengths & Improvements */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="p-3 bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 rounded-xl">
                <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 block mb-1">
                  Points Forts
                </span>
                <ul className="text-xs text-emerald-900 dark:text-emerald-200 list-disc list-inside space-y-1">
                  {(submission.pointsForts || []).map((pf, idx) => (
                    <li key={idx} className="line-clamp-2">{pf}</li>
                  ))}
                </ul>
              </div>

              <div className="p-3 bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 rounded-xl">
                <span className="text-[11px] font-bold text-amber-800 dark:text-amber-300 block mb-1">
                  Axes de Progrès
                </span>
                <ul className="text-xs text-amber-900 dark:text-amber-200 list-disc list-inside space-y-1">
                  {(submission.pointsAmeliorer || []).map((pa, idx) => (
                    <li key={idx} className="line-clamp-2">{pa}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ----------------------------------------------------------------------------
// MODAL: STUDENT PROFILE (MULTI-YEAR & MULTI-DISCIPLINE)
// ----------------------------------------------------------------------------
interface StudentProfileModalProps {
  student: InstitutionStudentProfile;
  onClose: () => void;
  onInspectSubmission: (submissionId: string) => void;
}

const StudentProfileModal: React.FC<StudentProfileModalProps> = ({
  student,
  onClose,
  onInspectSubmission,
}) => {
  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-600 rounded-lg"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-start gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-950/50 border border-purple-200 dark:border-purple-800 flex items-center justify-center shrink-0">
            <GraduationCap className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              {student.fullName}
            </h3>
            <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
              <span>Classe : {student.currentClass?.name} ({student.currentClass?.level})</span>
              <span aria-hidden="true">·</span>
              <span>Année {student.currentClass?.academicYear}</span>
            </div>
          </div>
        </div>

        <div className="mt-5 space-y-5 text-xs">
          {/* Average Overview */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span className="font-medium text-slate-700 dark:text-slate-300">Moyenne Générale Actuelle</span>
            <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">
              {student.overallAverage ? `${student.overallAverage} / 20` : '—'}
            </span>
          </div>

          {/* Grades by Subject */}
          <div>
            <h4 className="font-semibold text-slate-400 uppercase tracking-wider mb-2.5">
              Résultats par Matière
            </h4>
            <div className="space-y-2">
              {(student.gradesBySubject || []).map((g) => (
                <div
                  key={g.discipline}
                  className="flex items-center justify-between p-2.5 bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl"
                >
                  <div>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{g.discipline}</span>
                    <span className="text-[11px] text-slate-400 ml-2">({g.evaluationsCount} devoirs)</span>
                  </div>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {g.average} / 20
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Evaluations History */}
          <div>
            <h4 className="font-semibold text-slate-400 uppercase tracking-wider mb-2.5">
              Historique des Évaluations Récentes
            </h4>
            <div className="space-y-2">
              {(student.recentEvaluations || []).map((ev: any) => (
                <div
                  key={ev.submissionId}
                  className="p-3 bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3"
                >
                  <div>
                    <span className="font-medium text-slate-900 dark:text-white block">{ev.assignmentTitle}</span>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                      <span>{ev.discipline}</span>
                      <span aria-hidden="true">·</span>
                      <span>{ev.date}</span>
                      <span aria-hidden="true">·</span>
                      <span>{ev.teacherName}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="font-bold text-slate-900 dark:text-white">
                      {ev.noteFinale || ev.grade} / {ev.noteSur || ev.maxGrade || 20}
                    </span>
                    <button
                      onClick={() => onInspectSubmission(ev.submissionId)}
                      className="px-2.5 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-emerald-600 rounded-lg hover:bg-emerald-50 transition-colors"
                    >
                      Copie
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
