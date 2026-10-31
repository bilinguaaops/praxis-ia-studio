import React, { useState } from 'react';
import { Bell, BellRing, CheckCircle2, Smartphone, X, Zap, RefreshCw, AlertCircle } from 'lucide-react';
import { useWebPush } from '../hooks/useWebPush';

interface PushNotificationBannerProps {
  userEmail?: string;
  userName?: string;
  className?: string;
}

export const PushNotificationBanner: React.FC<PushNotificationBannerProps> = ({
  userEmail,
  userName,
  className = '',
}) => {
  const { isSupported, permission, isSubscribed, loading, error, subscribe, sendTestPush } = useWebPush();
  const [dismissed, setDismissed] = useState(false);
  const [testSent, setTestSent] = useState(false);

  if (!isSupported || dismissed) return null;

  // Si l'utilisateur est déjà abonné : affichage compact discret ou bouton de test
  if (isSubscribed) {
    return (
      <div className={`flex items-center justify-between gap-3 px-3.5 py-2 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-300 shadow-sm ${className}`}>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <BellRing className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-[11px] font-medium">
            Alertes Push actives sur cet appareil
          </span>
        </div>

        <button
          type="button"
          disabled={loading}
          onClick={async () => {
            const ok = await sendTestPush();
            if (ok) {
              setTestSent(true);
              setTimeout(() => setTestSent(false), 3000);
            }
          }}
          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition-colors"
          title="Envoyer une notification test sur cet écran"
        >
          {loading ? (
            <RefreshCw className="w-3 h-3 animate-spin" />
          ) : testSent ? (
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
          ) : (
            <Zap className="w-3 h-3 text-amber-400" />
          )}
          <span>{testSent ? 'Envoyé !' : 'Tester le push'}</span>
        </button>
      </div>
    );
  }

  // Si non abonné : invitation élégante à activer les notifications
  return (
    <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-950/70 via-slate-900/90 to-indigo-950/70 border border-blue-700/40 p-4 shadow-xl backdrop-blur-md ${className}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-500/40 text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
            <Smartphone className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-bold text-white">
                Activer les notifications sur votre smartphone / ordinateur
              </h4>
              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-blue-900 text-blue-300 uppercase tracking-wider">
                Nouveau
              </span>
            </div>
            <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">
              Soyez prévenu instantanément dès que l'IA a terminé d'analyser vos copies, même si votre navigateur est fermé.
            </p>
            {error && (
              <p className="text-[10px] text-rose-400 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3 shrink-0" />
                <span>{error}</span>
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
            title="Masquer"
          >
            <X className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            disabled={loading}
            onClick={() => subscribe(userEmail, userName)}
            className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/25 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <>
                <RefreshCw className="w-3 h-3 animate-spin" />
                <span>Activation...</span>
              </>
            ) : (
              <>
                <Bell className="w-3 h-3" />
                <span>Activer les alertes</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
