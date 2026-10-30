import React, { useState, useRef, useEffect } from 'react';
import {
  Bell,
  User,
  LogOut,
  Settings,
  CreditCard,
  Gift,
  Menu,
  ChevronDown,
  Phone,
  ArrowLeft,
  Sun,
  Moon,
  ShieldCheck,
  Megaphone,
  Info,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import { MainView, LeadData, BroadcastNotification } from '../types';
import { useTheme } from '../lib/useTheme';

interface TopHeaderProps {
  activeView: MainView;
  currentStep?: number;
  onViewChange: (view: MainView) => void;
  currentLead: LeadData | null;
  onOpenMobileSidebar: () => void;
  onLogout: () => void;
  onOpenLoginModal: () => void;
  onOpenContactModal: () => void;
  onOpenBilling: () => void;
  onBack?: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  activeView,
  currentStep = 1,
  onViewChange,
  currentLead,
  onOpenMobileSidebar,
  onLogout,
  onOpenLoginModal,
  onOpenContactModal,
  onOpenBilling,
  onBack,
}) => {
  const { isDark, toggleTheme } = useTheme();
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [notifications, setNotifications] = useState<BroadcastNotification[]>([]);
  const [readNotifIds, setReadNotifIds] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('praxis_read_notifs') || '[]');
    } catch {
      return [];
    }
  });

  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Fetch live broadcast notifications
  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications');
      const data = await res.json();
      if (data.success && Array.isArray(data.notifications)) {
        setNotifications(data.notifications);
      }
    } catch {}
  };

  useEffect(() => {
    fetchNotifications();

    const handleUpdate = () => {
      fetchNotifications();
    };

    window.addEventListener('praxis:notifications-updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    const interval = setInterval(fetchNotifications, 10000);
    return () => {
      window.removeEventListener('praxis:notifications-updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
      clearInterval(interval);
    };
  }, []);

  const unreadCount = notifications.filter((n) => !readNotifIds.includes(n.id)).length;

  const markAllAsRead = () => {
    const allIds = notifications.map((n) => n.id);
    setReadNotifIds(allIds);
    try {
      localStorage.setItem('praxis_read_notifs', JSON.stringify(allIds));
    } catch {}
  };

  const markOneAsRead = (id: string) => {
    if (!readNotifIds.includes(id)) {
      const updated = [...readNotifIds, id];
      setReadNotifIds(updated);
      try {
        localStorage.setItem('praxis_read_notifs', JSON.stringify(updated));
      } catch {}
    }
  };

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setIsNotifOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const teacherName = currentLead?.name || 'Professeur';

  // Section title mapping
  const getSectionTitle = () => {
    switch (activeView) {
      case 'dashboard':
        return 'Accueil';
      case 'corr':
        if (currentStep === 1) return 'Nouvelle correction · Sujet & Barème';
        if (currentStep === 2) return 'Nouvelle correction · Dépôt des copies';
        if (currentStep === 3) return 'Nouvelle correction · Traitement';
        if (currentStep === 4) return 'Nouvelle correction · Révision des notes';
        return 'Nouvelle correction';
      case 'hist':
        return 'Mes séries de devoirs';
      case 'classes':
        return 'Mes classes & Élèves';
      case 'suivi':
        return 'Résultats & Suivi';
      case 'pricing':
        return 'Abonnement & Crédits';
      case 'referrals':
        return 'Programme de parrainage';
      case 'settings':
        return 'Paramètres du compte';
      case 'faq':
        return 'Aide & Support';
      case 'admin':
        return 'Administration';
      case 'institution':
        return 'Portail Établissement · Direction';
      default:
        return 'Espace Enseignant';
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-[#FAFAF8]/95 dark:bg-[#0F141C]/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between transition-colors">
      {/* Left: Mobile Hamburger, Back button & Page Breadcrumb */}
      <div className="flex items-center gap-2 sm:gap-3">
        <button
          type="button"
          onClick={onOpenMobileSidebar}
          className="lg:hidden p-1.5 rounded-md text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          aria-label="Ouvrir le menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {activeView !== 'dashboard' && (
          <button
            type="button"
            onClick={() => {
              if (onBack) {
                onBack();
              } else if (window.history.length > 1) {
                window.history.back();
              } else {
                onViewChange('dashboard');
              }
            }}
            className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
            title="Revenir en arrière"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Retour</span>
          </button>
        )}

        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400 dark:text-slate-500 hidden sm:inline">Praxis /</span>
          <h1 className="font-semibold text-slate-900 dark:text-white tracking-tight">
            {getSectionTitle()}
          </h1>
        </div>
      </div>

      {/* Right: Support, Notifications & Profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Support contact button */}
        <button
          type="button"
          onClick={onOpenContactModal}
          className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white text-xs font-medium transition-colors cursor-pointer"
        >
          <Phone className="w-3.5 h-3.5 text-slate-500" />
          <span>Support</span>
        </button>

        {/* Theme Toggle (Light / Dark) */}
        <button
          type="button"
          onClick={toggleTheme}
          id="btn-header-theme-toggle"
          className="p-1.5 sm:px-2.5 sm:py-1 rounded-md text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5"
          title={isDark ? 'Passer en mode clair' : 'Passer en mode sombre'}
          aria-label={isDark ? 'Passer en mode clair' : 'Passer en mode sombre'}
        >
          {isDark ? (
            <>
              <Sun className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden md:inline">Clair</span>
            </>
          ) : (
            <>
              <Moon className="w-3.5 h-3.5 text-slate-600" />
              <span className="hidden md:inline">Sombre</span>
            </>
          )}
        </button>

        {/* Notifications Popover */}
        <div className="relative" ref={notifRef}>
          <button
            type="button"
            onClick={() => {
              setIsNotifOpen(!isNotifOpen);
              if (!isNotifOpen && unreadCount > 0) {
                // Keep notifications visible and mark them as read
              }
            }}
            className="relative p-1.5 rounded-md text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Voir les notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 flex items-center justify-center bg-blue-600 text-white text-[10px] font-bold rounded-full shadow-sm animate-pulse">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {isNotifOpen && (
            <>
              {/* Backdrop for mobile */}
              <div
                className="fixed inset-0 z-40 bg-black/30 backdrop-blur-xs sm:hidden"
                onClick={() => setIsNotifOpen(false)}
              />
              <div className="fixed inset-x-3 top-16 sm:absolute sm:inset-auto sm:right-0 sm:top-full sm:mt-2 w-auto sm:w-96 max-w-[calc(100vw-1.5rem)] bg-white dark:bg-slate-900 rounded-2xl sm:rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 p-3.5 space-y-2 z-50 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="font-bold text-slate-900 dark:text-white truncate">Annonces & Notifications</span>
                    {unreadCount > 0 && (
                      <span className="bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded-full text-[10px] font-semibold shrink-0">
                        {unreadCount}
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={markAllAsRead}
                      className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline font-medium cursor-pointer shrink-0 ml-2"
                    >
                      Tout marquer comme lu
                    </button>
                  )}
                </div>

                <div className="max-h-[65vh] sm:max-h-96 overflow-y-auto space-y-2 pt-1 divide-y divide-slate-100 dark:divide-slate-800/60 pr-1">
                {notifications.length === 0 ? (
                  <div className="text-center py-6 text-slate-400 dark:text-slate-500">
                    <Bell className="w-6 h-6 mx-auto mb-1.5 opacity-40" />
                    <p className="text-[11px]">Aucune notification pour le moment.</p>
                  </div>
                ) : (
                  notifications.map((n) => {
                    const isUnread = !readNotifIds.includes(n.id);
                    const typeColor =
                      n.type === 'warning'
                        ? 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/40'
                        : n.type === 'success'
                        ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/40'
                        : n.type === 'info'
                        ? 'text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/40 border-sky-200 dark:border-sky-800/40'
                        : 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800/40';

                    const IconComponent =
                      n.type === 'warning'
                        ? AlertTriangle
                        : n.type === 'success'
                        ? CheckCircle2
                        : n.type === 'info'
                        ? Info
                        : Megaphone;

                    return (
                      <div
                        key={n.id}
                        onClick={() => markOneAsRead(n.id)}
                        className={`pt-2 first:pt-0 p-2.5 rounded-lg transition-colors cursor-pointer ${
                          isUnread
                            ? 'bg-blue-50/70 dark:bg-blue-950/30 border-l-2 border-l-blue-600'
                            : 'bg-slate-50/50 dark:bg-slate-800/40 border-l-2 border-l-transparent'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium border ${typeColor}`}>
                              <IconComponent className="w-3 h-3" />
                              {n.badgeText || (n.type === 'warning' ? 'Alerte' : n.type === 'success' ? 'Nouveau' : n.type === 'info' ? 'Info' : 'Annonce')}
                            </span>
                            <span className="font-semibold text-slate-900 dark:text-slate-100 text-xs">
                              {n.title}
                            </span>
                          </div>
                          {isUnread && (
                            <span className="w-2 h-2 rounded-full bg-blue-600 flex-shrink-0 mt-1" title="Non lu" />
                          )}
                        </div>

                        <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line pl-0.5">
                          {n.message}
                        </p>

                        <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-slate-100/80 dark:border-slate-800/50 text-[10px] text-slate-400 dark:text-slate-500">
                          <span>
                            {new Date(n.createdAt).toLocaleDateString('fr-FR', {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                          {n.linkUrl && (
                            <a
                              href={n.linkUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 font-medium hover:underline"
                            >
                              <span>{n.linkText || 'En savoir plus'}</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </>
        )}
      </div>

        {/* Profile Dropdown */}
        <div className="relative" ref={profileRef}>
          {currentLead ? (
            <button
              type="button"
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center gap-2 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <div className="w-7 h-7 rounded-md bg-slate-800 text-white font-medium text-xs flex items-center justify-center">
                {teacherName.charAt(0).toUpperCase()}
              </div>
              <span className="text-xs font-medium text-slate-800 dark:text-slate-200 hidden sm:inline">
                {teacherName}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
            </button>
          ) : (
            <button
              type="button"
              onClick={onOpenLoginModal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-medium text-xs hover:bg-slate-800 dark:hover:bg-slate-100 cursor-pointer transition-colors"
            >
              <User className="w-3.5 h-3.5" />
              <span>Connexion</span>
            </button>
          )}

          {/* Profile Dropdown Menu */}
          {isProfileOpen && currentLead && (
            <div className="absolute right-0 mt-2 w-60 bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-slate-200 dark:border-slate-800 p-2 space-y-1 z-50 text-xs">
              <div className="px-2.5 py-2 border-b border-slate-100 dark:border-slate-800">
                <p className="font-semibold text-slate-900 dark:text-white truncate">{teacherName}</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">{currentLead.email}</p>
                <div className="mt-1.5 text-[11px] font-medium text-slate-600 dark:text-slate-300">
                  {(currentLead.subscriptionCredits ?? 0) + (currentLead.extraCredits ?? 0)} corrections disponibles
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  onViewChange('settings');
                  setIsProfileOpen(false);
                }}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-left transition-colors cursor-pointer"
              >
                <Settings className="w-3.5 h-3.5 text-slate-400" />
                <span>Paramètres</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onViewChange('pricing');
                  setIsProfileOpen(false);
                }}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-left transition-colors cursor-pointer"
              >
                <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                <span>Abonnement & Crédits</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onViewChange('referrals');
                  setIsProfileOpen(false);
                }}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-left transition-colors cursor-pointer"
              >
                <Gift className="w-3.5 h-3.5 text-slate-400" />
                <span>Parrainage (+50)</span>
              </button>

              {(currentLead?.role === 'affiliate' ||
                currentLead?.role === 'ambassadeur' ||
                currentLead?.role === 'partner' ||
                currentLead?.isAffiliate ||
                Boolean(currentLead?.affiliateCode) ||
                sessionStorage.getItem('praxis_affiliate_authorized') === 'true' ||
                Boolean(localStorage.getItem('praxis_affiliate_code'))) && (
                <button
                  type="button"
                  onClick={() => {
                    onViewChange('affiliate');
                    setIsProfileOpen(false);
                  }}
                  className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-blue-600 dark:text-blue-400 font-semibold hover:bg-blue-50 dark:hover:bg-blue-950/40 text-left transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Espace Ambassadeur</span>
                  </div>
                  <span className="text-[10px] bg-blue-100 dark:bg-blue-900/60 px-1.5 py-0.5 rounded font-bold">20%</span>
                </button>
              )}

              <div className="h-px bg-slate-100 dark:bg-slate-800 my-1" />

              <button
                type="button"
                onClick={() => {
                  setIsProfileOpen(false);
                  onLogout();
                }}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 text-left transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Se déconnecter</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
