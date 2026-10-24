import React, { useState, useEffect } from 'react';
import {
  Smartphone,
  Download,
  X,
  Share,
  PlusSquare,
  CheckCircle2,
  Sparkles,
  Monitor,
  Apple,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Zap,
  Copy,
  Check,
} from 'lucide-react';
import { usePWAInstall, openPWAInstallPrompt } from '../lib/usePWAInstall';

export const PWAInstallModal: React.FC = () => {
  const {
    isInstallable,
    isInstalled,
    isIOS,
    isMobile,
    dismissed,
    showInstallGuide,
    setShowInstallGuide,
    install,
    dismiss,
  } = usePWAInstall();

  // Tab for guided instructions if prompt is not native
  const [activeTab, setActiveTab] = useState<'ios' | 'android' | 'desktop'>(() => {
    if (typeof window !== 'undefined') {
      const ua = window.navigator.userAgent.toLowerCase();
      if (/iphone|ipad|ipod/.test(ua)) return 'ios';
      if (/android/.test(ua)) return 'android';
    }
    return 'android';
  });

  const [copiedLink, setCopiedLink] = useState(false);

  const handleCopyDirectLink = () => {
    try {
      const url = typeof window !== 'undefined' ? window.location.origin + '/' : 'https://praxis-pro.pro/';
      navigator.clipboard.writeText(url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {}
  };

  // Auto-show mobile bottom-sheet after 2.5 seconds on phones if not installed & not dismissed
  const shouldShowMobileSheet = isMobile && !isInstalled && !dismissed && (isInstallable || isIOS);
  const [mobileSheetVisible, setMobileSheetVisible] = useState<boolean>(false);

  useEffect(() => {
    if (shouldShowMobileSheet) {
      const timer = setTimeout(() => {
        setMobileSheetVisible(true);
      }, 2500);
      return () => clearTimeout(timer);
    } else {
      setMobileSheetVisible(false);
    }
  }, [shouldShowMobileSheet]);

  const handleMobileSheetInstall = async () => {
    if (isInstallable) {
      const success = await install();
      if (!success) {
        dismiss();
      }
    } else {
      setMobileSheetVisible(false);
      setShowInstallGuide(true);
      if (isIOS) setActiveTab('ios');
      else setActiveTab('android');
    }
  };

  // If already running in standalone mode (on the home screen), do not render anything
  if (isInstalled) {
    return null;
  }

  return (
    <>
      {/* 1. NATIVE-FEELING MOBILE BOTTOM SHEET (Android / iOS) */}
      {mobileSheetVisible && !showInstallGuide && (
        <div className="fixed inset-x-0 bottom-0 z-50 p-3 sm:hidden animate-in fade-in slide-in-from-bottom-6 duration-300 pointer-events-auto">
          <div className="bg-[#181C22] text-white rounded-2xl shadow-2xl border border-slate-700/80 p-4 max-w-md mx-auto relative backdrop-blur-md">
            <div className="flex items-start gap-3.5 mb-3.5">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-sky-500 flex items-center justify-center shrink-0 shadow-lg border border-white/20">
                <img
                  src="/icon-192.png"
                  alt="Praxis Logo"
                  className="w-10 h-10 rounded-lg object-cover"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0 pr-6">
                <div className="flex items-center gap-1.5">
                  <h3 className="text-[15px] font-bold text-white leading-tight">
                    Ajouter Praxis à l’écran d’accueil
                  </h3>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                    PWA
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-1 leading-snug">
                  Accédez directement à vos corrections en un clic, plein écran et sans barre d'adresse comme une vraie application.
                </p>
              </div>
              <button
                type="button"
                onClick={dismiss}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors absolute top-3 right-3"
                aria-label="Fermer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2.5 border-t border-slate-800">
              <button
                type="button"
                onClick={dismiss}
                className="px-3 py-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
              >
                Plus tard
              </button>
              <button
                type="button"
                onClick={handleMobileSheetInstall}
                className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 active:scale-95 rounded-xl transition-all shadow-md flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Ajouter à l'écran</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. COMPREHENSIVE INTERACTIVE INSTALLATION MODAL (All platforms & Manual trigger) */}
      {showInstallGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-700 via-indigo-600 to-sky-500 flex items-center justify-center text-white shadow-md">
                  <Smartphone className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
                    <span>Installer Praxis IA</span>
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                      Gratuit & Rapide
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Ajoutez l’application sur votre écran d’accueil pour un accès direct
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowInstallGuide(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Fermer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Direct 1-Click Install Button if supported */}
            {isInstallable && (
              <div className="my-4 p-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h4 className="font-bold text-sm">Installation automatique prête</h4>
                    <p className="text-xs text-blue-100 mt-0.5">
                      Votre navigateur supporte l'installation directe en 1 clic.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      const success = await install();
                      if (success) setShowInstallGuide(false);
                    }}
                    className="px-4 py-2.5 bg-white text-blue-700 hover:bg-blue-50 font-extrabold text-xs rounded-xl shadow-md transition-all active:scale-95 shrink-0 flex items-center gap-1.5"
                  >
                    <Download className="w-4 h-4" />
                    <span>Installer en 1 clic</span>
                  </button>
                </div>
              </div>
            )}

            {/* Platform Selection Tabs */}
            <div className="mt-4 flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-bold gap-1">
              <button
                type="button"
                onClick={() => setActiveTab('android')}
                className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'android'
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Android (Chrome)</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('ios')}
                className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'ios'
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <Apple className="w-3.5 h-3.5" />
                <span>iPhone / iPad (Safari)</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('desktop')}
                className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'desktop'
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <Monitor className="w-3.5 h-3.5" />
                <span>PC / Mac (Chrome/Edge)</span>
              </button>
            </div>

            {/* Tab Instructions Content */}
            <div className="mt-4 space-y-3">
              {/* ANDROID INSTRUCTIONS */}
              {activeTab === 'android' && (
                <div className="space-y-3 animate-in fade-in duration-150">
                  <div className="flex items-start gap-3 p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/70 dark:border-slate-700/60">
                    <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 font-bold text-xs flex items-center justify-center shrink-0">
                      1
                    </div>
                    <div>
                      <h5 className="font-bold text-xs text-slate-900 dark:text-white">
                        Ouvrez le menu de Google Chrome
                      </h5>
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                        Touchez les <strong>trois points verticaux (⋮)</strong> situés tout en haut à droite de votre écran.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/70 dark:border-slate-700/60">
                    <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 font-bold text-xs flex items-center justify-center shrink-0">
                      2
                    </div>
                    <div>
                      <h5 className="font-bold text-xs text-slate-900 dark:text-white">
                        Sélectionnez « Installer l’application » ou « Ajouter à l’écran d’accueil »
                      </h5>
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                        Appuyez sur <strong>Ajouter à l'écran d'accueil</strong> puis confirmez en cliquant sur <strong>Installer</strong>.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3.5 bg-blue-50/60 dark:bg-blue-950/30 rounded-2xl border border-blue-200/60 dark:border-blue-900/40">
                    <CheckCircle2 className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                    <div>
                      <h5 className="font-bold text-xs text-blue-900 dark:text-blue-300">
                        C'est fait !
                      </h5>
                      <p className="text-xs text-blue-800/80 dark:text-blue-300/80 mt-0.5">
                        L'icône Praxis apparaît désormais parmi vos applications comme une application native.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* IOS SAFARI INSTRUCTIONS */}
              {activeTab === 'ios' && (
                <div className="space-y-3 animate-in fade-in duration-150">
                  <div className="flex items-start gap-3 p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/70 dark:border-slate-700/60">
                    <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 font-bold text-xs flex items-center justify-center shrink-0">
                      1
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-1.5">
                        <Share className="w-4 h-4 text-blue-600" />
                        <h5 className="font-bold text-xs text-slate-900 dark:text-white">
                          Touchez l'icône « Partager »
                        </h5>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                        Dans la barre en bas de Safari, touchez le bouton <strong>Partager</strong> (le carré avec une flèche vers le haut).
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/70 dark:border-slate-700/60">
                    <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 font-bold text-xs flex items-center justify-center shrink-0">
                      2
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-1.5">
                        <PlusSquare className="w-4 h-4 text-emerald-600" />
                        <h5 className="font-bold text-xs text-slate-900 dark:text-white">
                          Touchez « Sur l'écran d'accueil »
                        </h5>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                        Faites défiler la liste vers le bas et sélectionnez <strong>Sur l'écran d'accueil</strong>.
                      </p>
                      <p className="text-[11px] text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-lg p-1.5 mt-1 font-medium">
                        ⚠️ <strong>Important :</strong> Ne touchez pas à l'icône « Mail » ou « Message » dans la rangée du haut. Descendez un peu plus bas dans la liste pour trouver <strong>« Sur l'écran d'accueil »</strong>.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/70 dark:border-slate-700/60">
                    <div className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 font-bold text-xs flex items-center justify-center shrink-0">
                      3
                    </div>
                    <div>
                      <h5 className="font-bold text-xs text-slate-900 dark:text-white">
                        Confirmez avec « Ajouter »
                      </h5>
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                        Touchez le bouton <strong>Ajouter</strong> en haut à droite. L'application Praxis est immédiatement installée sur votre iPhone/iPad !
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* DESKTOP INSTRUCTIONS */}
              {activeTab === 'desktop' && (
                <div className="space-y-3 animate-in fade-in duration-150">
                  <div className="flex items-start gap-3 p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/70 dark:border-slate-700/60">
                    <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 font-bold text-xs flex items-center justify-center shrink-0">
                      1
                    </div>
                    <div>
                      <h5 className="font-bold text-xs text-slate-900 dark:text-white">
                        Regardez la barre d'adresse de votre navigateur
                      </h5>
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                        À l'extrémité droite de la barre d'adresse (URL), cliquez sur l'icône <strong>Installer l'application (petite flèche vers le bas ou ordinateur)</strong>.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/70 dark:border-slate-700/60">
                    <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 font-bold text-xs flex items-center justify-center shrink-0">
                      2
                    </div>
                    <div>
                      <h5 className="font-bold text-xs text-slate-900 dark:text-white">
                        Ou utilisez le menu ⋮ du navigateur
                      </h5>
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                        Cliquez sur les 3 points du navigateur en haut à droite &gt; <strong>Enregistrer et partager</strong> &gt; <strong>Installer Praxis IA</strong>.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Direct App Link Share/Copy Box (Useful to open directly on phone without 404) */}
            <div className="mt-4 p-3 bg-blue-50/70 dark:bg-blue-950/30 rounded-2xl border border-blue-200/70 dark:border-blue-800/50 flex items-center justify-between gap-2.5">
              <div className="min-w-0 flex-1">
                <span className="text-[11px] font-bold text-blue-950 dark:text-blue-200 block truncate">
                  Lien direct de l'application
                </span>
                <span className="text-[11px] text-blue-700/80 dark:text-blue-400 font-mono block truncate">
                  {typeof window !== 'undefined' ? window.location.origin + '/' : 'https://praxis-pro.pro/'}
                </span>
              </div>
              <button
                type="button"
                onClick={handleCopyDirectLink}
                className="shrink-0 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLink ? 'Copié !' : 'Copier'}</span>
              </button>
            </div>

            {/* Benefits Banner */}
            <div className="mt-4 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 grid grid-cols-3 gap-2 text-center text-[11px]">
              <div>
                <Zap className="w-4 h-4 text-amber-500 mx-auto mb-1" />
                <span className="font-bold text-slate-800 dark:text-slate-200 block">Lancement 0s</span>
                <span className="text-[10px] text-slate-500">Ouverture instantanée</span>
              </div>
              <div>
                <Smartphone className="w-4 h-4 text-blue-500 mx-auto mb-1" />
                <span className="font-bold text-slate-800 dark:text-slate-200 block">Plein écran</span>
                <span className="text-[10px] text-slate-500">Sans barre navigateur</span>
              </div>
              <div>
                <ShieldCheck className="w-4 h-4 text-emerald-500 mx-auto mb-1" />
                <span className="font-bold text-slate-800 dark:text-slate-200 block">100% Sécurisé</span>
                <span className="text-[10px] text-slate-500">Mises à jour auto</span>
              </div>
            </div>

            {/* Footer action */}
            <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setShowInstallGuide(false)}
                className="w-full sm:w-auto px-6 py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-bold text-xs rounded-xl transition-all cursor-pointer shadow-sm"
              >
                Compris, fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// COMPOSANT BOUTON GÉNÉRIQUE D'INSTALLATION (Pour Header, LandingPage, etc.)
export const PWAInstallButton: React.FC<{
  variant?: 'primary' | 'subtle' | 'pill' | 'header';
  className?: string;
}> = ({ variant = 'header', className = '' }) => {
  const { isInstalled, install, setShowInstallGuide, isInstallable } = usePWAInstall();

  // If already installed as PWA on home screen, hide the install button
  if (isInstalled) {
    return null;
  }

  const handleClick = async () => {
    if (isInstallable) {
      await install();
    } else {
      setShowInstallGuide(true);
    }
  };

  if (variant === 'pill') {
    return (
      <button
        type="button"
        onClick={handleClick}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-all active:scale-95 cursor-pointer ${className}`}
        title="Ajouter Praxis à votre écran d'accueil"
      >
        <Download className="w-3.5 h-3.5" />
        <span>Installer l'app</span>
      </button>
    );
  }

  if (variant === 'primary') {
    return (
      <button
        type="button"
        onClick={handleClick}
        className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-md transition-all active:scale-95 cursor-pointer ${className}`}
        title="Ajouter Praxis à votre écran d'accueil"
      >
        <Smartphone className="w-4 h-4" />
        <span>Ajouter à l'écran d'accueil</span>
      </button>
    );
  }

  // Header default variant
  return (
    <button
      type="button"
      onClick={handleClick}
      id="btn-header-pwa-install"
      className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200/80 transition-all cursor-pointer ${className}`}
      title="Ajouter Praxis à votre écran d'accueil (Mobile ou PC)"
    >
      <Smartphone className="w-3.5 h-3.5 text-blue-600" />
      <span className="hidden sm:inline">Installer l'app</span>
      <span className="sm:hidden">App</span>
    </button>
  );
};

// COMPOSANT BOUTON POUR LE MENU SIDEBAR
export const MobilePWAInstallMenuItem: React.FC<{ onClick?: () => void }> = ({ onClick }) => {
  const { isInstalled, isInstallable, install, setShowInstallGuide } = usePWAInstall();

  if (isInstalled) {
    return null;
  }

  const handleClick = async () => {
    if (onClick) onClick();
    if (isInstallable) {
      await install();
    } else {
      setShowInstallGuide(true);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-xl border border-blue-200/60 dark:border-blue-900/50 transition-colors cursor-pointer"
    >
      <span className="flex items-center gap-2">
        <Smartphone className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
        <span>Installer sur l'écran d'accueil</span>
      </span>
      <span className="text-[10px] font-bold px-1.5 py-0.5 bg-blue-600 text-white rounded-md uppercase">
        App
      </span>
    </button>
  );
};

// Alias for backward compatibility
export const MobilePWAInstallModal = PWAInstallModal;
