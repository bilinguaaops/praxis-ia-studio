import React, { useState, useEffect } from 'react';
import {
  Megaphone,
  Send,
  Sparkles,
  ChevronDown,
  ChevronUp,
  X,
  Bell,
  CheckCircle2,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { BroadcastNotification } from '../types';

interface AdminNotificationBarProps {
  onNotify?: (text: string, type: 'success' | 'error' | 'info') => void;
  onOpenNotificationsTab?: () => void;
  adminToken?: string;
}

export const AdminNotificationBar: React.FC<AdminNotificationBarProps> = ({
  onNotify,
  onOpenNotificationsTab,
  adminToken,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeNotificationsCount, setActiveNotificationsCount] = useState(0);
  const [latestTitle, setLatestTitle] = useState<string>('');

  // Quick form state
  const [quickTitle, setQuickTitle] = useState('');
  const [quickMessage, setQuickMessage] = useState('');
  const [quickType, setQuickType] = useState<'announcement' | 'info' | 'success' | 'warning'>('announcement');
  const [quickBadge, setQuickBadge] = useState('');

  const getEffectiveToken = () => {
    return adminToken || localStorage.getItem('praxis_admin_token') || localStorage.getItem('cpro_admin_token') || '2345';
  };

  const loadActiveBroadcasts = async () => {
    try {
      const res = await fetch('/api/notifications');
      const data = await res.json();
      if (data.success && Array.isArray(data.notifications)) {
        setActiveNotificationsCount(data.notifications.length);
        if (data.notifications[0]) {
          setLatestTitle(data.notifications[0].title);
        }
      }
    } catch {}
  };

  useEffect(() => {
    loadActiveBroadcasts();
  }, []);

  const handleQuickPublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTitle.trim() || !quickMessage.trim()) {
      if (onNotify) onNotify('Veuillez saisir un titre et un message.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const token = getEffectiveToken();
      const res = await fetch('/api/admin/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': token,
        },
        body: JSON.stringify({
          title: quickTitle.trim(),
          message: quickMessage.trim(),
          type: quickType,
          badgeText: quickBadge.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (data.success) {
        if (onNotify) onNotify('📢 Annonce diffusée instantanément dans la cloche des enseignants !', 'success');
        setQuickTitle('');
        setQuickMessage('');
        setQuickBadge('');
        setIsExpanded(false);
        loadActiveBroadcasts();
        try {
          window.dispatchEvent(new CustomEvent('praxis:notifications-updated', { detail: data.notification }));
          localStorage.setItem('praxis_notif_last_update', Date.now().toString());
        } catch {}
      } else {
        if (onNotify) onNotify(data.error || 'Erreur lors de la diffusion.', 'error');
      }
    } catch {
      if (onNotify) onNotify('Échec de la publication de l’annonce.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-gradient-to-r from-blue-950/80 via-slate-900 to-indigo-950/80 border-b border-blue-900/40 text-xs">
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex flex-col md:flex-row md:items-center justify-between gap-2.5">
        {/* Left: Broadcast Status */}
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-lg bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-400 shrink-0">
            <Megaphone className="w-3.5 h-3.5" />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-white text-[11px] uppercase tracking-wider bg-blue-600/30 px-2 py-0.5 rounded border border-blue-500/30">
              Admin Broadcast Bar
            </span>
            <span className="text-slate-300">
              {activeNotificationsCount > 0 ? (
                <>
                  <strong className="text-white">{activeNotificationsCount}</strong> annonce(s) active(s) dans la cloche des utilisateurs
                  {latestTitle && <span className="text-slate-400 hidden lg:inline"> : « {latestTitle} »</span>}
                </>
              ) : (
                'Aucune annonce en cours de diffusion.'
              )}
            </span>
          </div>
        </div>

        {/* Right: Quick Actions */}
        <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
          {onOpenNotificationsTab && (
            <button
              type="button"
              onClick={onOpenNotificationsTab}
              className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition cursor-pointer text-[11px]"
            >
              Gérer l'historique
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1 px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold transition cursor-pointer text-[11px] shadow-xs"
          >
            <span>Diffuser un message global</span>
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Expandable Quick Publisher Drawer */}
      {isExpanded && (
        <div className="bg-[#0B0F17]/95 border-t border-slate-800/80 p-4 transition-all animate-fade-in">
          <form onSubmit={handleQuickPublish} className="max-w-7xl mx-auto space-y-3">
            <div className="flex items-center justify-between text-slate-300 pb-1 border-b border-slate-800/60">
              <span className="font-semibold text-white flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Publication éclair pour tous les utilisateurs (Cloche)
              </span>
              <button
                type="button"
                onClick={() => setIsExpanded(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
              {/* Title */}
              <div className="md:col-span-5">
                <input
                  type="text"
                  value={quickTitle}
                  onChange={(e) => setQuickTitle(e.target.value)}
                  placeholder="Titre de l'annonce (ex: Maintenance terminée, Nouveau barème...)"
                  maxLength={75}
                  required
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Type / Style */}
              <div className="md:col-span-4 flex items-center gap-1.5">
                {[
                  { id: 'announcement', label: 'Annonce', color: 'bg-blue-950/40 text-blue-300 border-blue-800/50' },
                  { id: 'success', label: 'Succès', color: 'bg-emerald-950/40 text-emerald-300 border-emerald-800/50' },
                  { id: 'warning', label: 'Alerte', color: 'bg-amber-950/40 text-amber-300 border-amber-800/50' },
                  { id: 'info', label: 'Info', color: 'bg-sky-950/40 text-sky-300 border-sky-800/50' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setQuickType(item.id as any)}
                    className={`flex-1 py-1.5 px-2 rounded-lg text-[10px] font-medium border text-center transition cursor-pointer ${
                      quickType === item.id ? `${item.color} font-bold ring-1 ring-blue-500` : 'border-slate-800 bg-slate-900 text-slate-400'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {/* Badge */}
              <div className="md:col-span-3">
                <input
                  type="text"
                  value={quickBadge}
                  onChange={(e) => setQuickBadge(e.target.value)}
                  placeholder="Badge (ex: URGENT, INFO)"
                  maxLength={15}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* Message Body + Submit */}
            <div className="flex flex-col sm:flex-row gap-2.5">
              <textarea
                value={quickMessage}
                onChange={(e) => setQuickMessage(e.target.value)}
                placeholder="Rédigez le message qui apparaîtra dans la cloche de notification de chaque professeur..."
                rows={2}
                maxLength={400}
                required
                className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-blue-500 resize-none leading-relaxed"
              />

              <button
                type="submit"
                disabled={isSubmitting || !quickTitle.trim() || !quickMessage.trim()}
                className="py-2 px-5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition disabled:opacity-50 cursor-pointer shadow-lg shadow-blue-600/30 shrink-0 self-stretch sm:self-auto"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSubmitting ? 'Envoi...' : 'Envoyer maintenant'}</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
