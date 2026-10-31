import React, { useState, useEffect } from 'react';
import {
  Megaphone,
  Bell,
  Send,
  CheckCircle2,
  AlertTriangle,
  Info,
  Trash2,
  Eye,
  EyeOff,
  RefreshCw,
  Sparkles,
  ExternalLink,
  Plus,
  Radio,
  Clock,
  Smartphone,
} from 'lucide-react';
import { BroadcastNotification } from '../types';
import { AdminPushManager } from './AdminPushManager';

interface AdminNotificationsViewProps {
  onNotify?: (text: string, type: 'success' | 'error' | 'info') => void;
  adminToken?: string;
}

export const AdminNotificationsView: React.FC<AdminNotificationsViewProps> = ({
  onNotify,
  adminToken,
}) => {
  const [notifications, setNotifications] = useState<BroadcastNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [channelMode, setChannelMode] = useState<'push' | 'in_app'>('push');

  // Form state
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState<'announcement' | 'info' | 'success' | 'warning'>('announcement');
  const [badgeText, setBadgeText] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');

  const getEffectiveToken = () => {
    return adminToken || localStorage.getItem('praxis_admin_token') || localStorage.getItem('cpro_admin_token') || '2345';
  };

  const fetchAdminNotifications = async () => {
    setIsLoading(true);
    try {
      const token = getEffectiveToken();
      const res = await fetch('/api/admin/notifications', {
        headers: { 'x-admin-token': token },
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.notifications)) {
        setNotifications(data.notifications);
      }
    } catch (err: any) {
      if (onNotify) onNotify("Erreur lors de la récupération des annonces.", 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminNotifications();
  }, []);

  const handleCreateNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      if (onNotify) onNotify('Le titre et le message sont requis.', 'error');
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
          title: title.trim(),
          message: message.trim(),
          type,
          badgeText: badgeText.trim() || undefined,
          linkUrl: linkUrl.trim() || undefined,
          linkText: linkText.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (data.success) {
        if (onNotify) onNotify('🎉 Annonce diffusée avec succès à tous les professeurs !', 'success');
        setTitle('');
        setMessage('');
        setBadgeText('');
        setLinkUrl('');
        setLinkText('');
        fetchAdminNotifications();
        try {
          window.dispatchEvent(new CustomEvent('praxis:notifications-updated', { detail: data.notification }));
          localStorage.setItem('praxis_notif_last_update', Date.now().toString());
        } catch {}
      } else {
        if (onNotify) onNotify(data.error || 'Erreur lors de la diffusion.', 'error');
      }
    } catch (err: any) {
      if (onNotify) onNotify("Impossible de diffuser l'annonce.", 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (id: string) => {
    try {
      const token = getEffectiveToken();
      const res = await fetch(`/api/admin/notifications/${id}/toggle`, {
        method: 'PATCH',
        headers: { 'x-admin-token': token },
      });
      const data = await res.json();
      if (data.success) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, isActive: !n.isActive } : n))
        );
        if (onNotify) {
          onNotify(
            data.notification.isActive ? 'Annonce réactivée et visible dans la cloche.' : 'Annonce masquée.',
            'info'
          );
        }
      }
    } catch {
      if (onNotify) onNotify('Erreur modification statut.', 'error');
    }
  };

  const handleDeleteNotification = async (id: string, notifTitle: string) => {
    if (!window.confirm(`Supprimer définitivement l'annonce « ${notifTitle} » ?`)) return;

    try {
      const token = getEffectiveToken();
      const res = await fetch(`/api/admin/notifications/${id}`, {
        method: 'DELETE',
        headers: { 'x-admin-token': token },
      });
      const data = await res.json();
      if (data.success) {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
        if (onNotify) onNotify('Annonce supprimée.', 'info');
      }
    } catch {
      if (onNotify) onNotify('Erreur suppression annonce.', 'error');
    }
  };

  const activeCount = notifications.filter((n) => n.isActive !== false).length;

  return (
    <div className="space-y-6">
      {/* Top Header & Overview */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#141C2E] border border-slate-800 p-6 rounded-2xl shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Megaphone className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Diffusions & Annonces Utilisateurs
            </h2>
          </div>
          <p className="text-xs text-slate-400 max-w-2xl">
            Rédigez et diffusez des annonces en temps réel. Elles apparaîtront instantanément dans la cloche de notification de l'ensemble des enseignants et visiteurs.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchAdminNotifications}
          disabled={isLoading}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Actualiser</span>
        </button>
      </div>

      {/* Channel Switcher: Push Mobile vs Cloche In-App */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 bg-[#141C2E] border border-slate-800 rounded-2xl w-fit">
        <button
          type="button"
          onClick={() => setChannelMode('push')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            channelMode === 'push'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Smartphone className="w-4 h-4" />
          <span>Notifications Push Smartphones &amp; Écrans</span>
          <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-blue-950 text-blue-300 border border-blue-700/50">
            Nouveau
          </span>
        </button>

        <button
          type="button"
          onClick={() => setChannelMode('in_app')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            channelMode === 'in_app'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Bell className="w-4 h-4" />
          <span>Annonces Cloche In-App</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300">
            {activeCount} active{activeCount > 1 ? 's' : ''}
          </span>
        </button>
      </div>

      {/* VIEW A: PUSH NOTIFICATIONS MANAGER */}
      {channelMode === 'push' && (
        <div className="animate-fade-in">
          <AdminPushManager adminToken={getEffectiveToken()} onNotify={onNotify} />
        </div>
      )}

      {/* VIEW B: IN-APP BROADCAST ANNOUNCEMENTS (CLOCHE) */}
      {channelMode === 'in_app' && (
        <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#141C2E] border border-slate-800 p-4 rounded-xl flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-600/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-white">{activeCount}</div>
            <div className="text-[11px] text-slate-400">Annonces actives dans la cloche</div>
          </div>
        </div>

        <div className="bg-[#141C2E] border border-slate-800 p-4 rounded-xl flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-600/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <Radio className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-white">{notifications.length}</div>
            <div className="text-[11px] text-slate-400">Total des annonces créées</div>
          </div>
        </div>

        <div className="bg-[#141C2E] border border-slate-800 p-4 rounded-xl flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-purple-600/10 border border-purple-500/20 text-purple-400 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-200 truncate max-w-[160px]">
              {notifications[0] ? notifications[0].title : 'Aucune annonce'}
            </div>
            <div className="text-[11px] text-slate-400">Dernière publication</div>
          </div>
        </div>
      </div>

      {/* Main Grid: Form + Live Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Editor Form */}
        <div className="lg:col-span-7 bg-[#141C2E] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
            <Plus className="w-4 h-4 text-blue-400" />
            <h3 className="text-sm font-bold text-white">Rédiger une nouvelle annonce</h3>
          </div>

          <form onSubmit={handleCreateNotification} className="space-y-4">
            {/* Title */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Titre de l'annonce <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex : Moteur IA ultra-rapide activé ⚡"
                maxLength={80}
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#0B0F17] border border-slate-800 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Category / Type Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Catégorie & Style
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'announcement', label: 'Annonce', color: 'border-blue-500 text-blue-400 bg-blue-950/30' },
                  { id: 'success', label: 'Bonne nouvelle', color: 'border-emerald-500 text-emerald-400 bg-emerald-950/30' },
                  { id: 'info', label: 'Information', color: 'border-sky-500 text-sky-400 bg-sky-950/30' },
                  { id: 'warning', label: 'Important / Alerte', color: 'border-amber-500 text-amber-400 bg-amber-950/30' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setType(item.id as any)}
                    className={`px-2.5 py-2 rounded-xl text-xs font-medium border text-center transition-all cursor-pointer ${
                      type === item.id
                        ? `${item.color} font-bold shadow-xs`
                        : 'border-slate-800 bg-[#0B0F17] text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Badge Tag */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Badge personnalisé <span className="text-slate-500 font-normal">(optionnel)</span>
              </label>
              <input
                type="text"
                value={badgeText}
                onChange={(e) => setBadgeText(e.target.value)}
                placeholder="Ex: NOUVEAU, OFFRE, IMPORTANT, MISE À JOUR"
                maxLength={20}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#0B0F17] border border-slate-800 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Message Body */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Message détaillé <span className="text-red-400">*</span>
                </label>
                <span className="text-[10px] text-slate-500">{message.length}/500</span>
              </div>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                maxLength={500}
                placeholder="Décrivez votre annonce aux professeurs. Les sauts de ligne sont préservés."
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#0B0F17] border border-slate-800 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-blue-500 resize-none leading-relaxed"
              />
            </div>

            {/* Action Link (Optional) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Lien d'action <span className="text-slate-500 font-normal">(optionnel)</span>
                </label>
                <input
                  type="text"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://... ou #billing"
                  className="w-full px-3 py-2 rounded-xl bg-[#0B0F17] border border-slate-800 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Texte du bouton <span className="text-slate-500 font-normal">(optionnel)</span>
                </label>
                <input
                  type="text"
                  value={linkText}
                  onChange={(e) => setLinkText(e.target.value)}
                  placeholder="Ex : Découvrir la formule"
                  className="w-full px-3 py-2 rounded-xl bg-[#0B0F17] border border-slate-800 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting || !title.trim() || !message.trim()}
                className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>{isSubmitting ? 'Diffusion en cours...' : 'Diffuser immédiatement à tous les utilisateurs'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Live Preview Card */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-[#141C2E] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold text-white">Aperçu en direct dans la cloche</h3>
              </div>
              <span className="text-[10px] text-slate-400">Vue enseignant</span>
            </div>

            {/* Notification Card Mockup */}
            <div className="p-3.5 rounded-xl bg-[#0B0F17] border border-slate-800/80 shadow-md space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span
                    className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold border ${
                      type === 'warning'
                        ? 'text-amber-400 bg-amber-950/50 border-amber-800/60'
                        : type === 'success'
                        ? 'text-emerald-400 bg-emerald-950/50 border-emerald-800/60'
                        : type === 'info'
                        ? 'text-sky-400 bg-sky-950/50 border-sky-800/60'
                        : 'text-blue-400 bg-blue-950/50 border-blue-800/60'
                    }`}
                  >
                    {type === 'warning' && <AlertTriangle className="w-3 h-3" />}
                    {type === 'success' && <CheckCircle2 className="w-3 h-3" />}
                    {type === 'info' && <Info className="w-3 h-3" />}
                    {type === 'announcement' && <Megaphone className="w-3 h-3" />}
                    {badgeText || (type === 'warning' ? 'Alerte' : type === 'success' ? 'Nouveau' : type === 'info' ? 'Info' : 'Annonce')}
                  </span>
                  <span className="font-semibold text-white text-xs">
                    {title.trim() || 'Titre de votre annonce ici'}
                  </span>
                </div>
                <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0 mt-1" />
              </div>

              <p className="text-[11px] text-slate-300 leading-relaxed whitespace-pre-line pl-0.5">
                {message.trim() || "Le contenu de votre message apparaîtra ici tel que les enseignants le liront lorsqu'ils ouvriront leur cloche de notification."}
              </p>

              <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[10px] text-slate-500">
                <span>À l'instant</span>
                {(linkUrl || linkText) && (
                  <span className="inline-flex items-center gap-1 text-blue-400 font-medium">
                    <span>{linkText || 'En savoir plus'}</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </span>
                )}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-blue-950/20 border border-blue-800/30 text-[11px] text-blue-300 space-y-1">
              <div className="font-semibold flex items-center gap-1.5">
                <Bell className="w-3.5 h-3.5" />
                <span>Synchronisation automatique</span>
              </div>
              <p className="text-slate-400 leading-relaxed">
                Toutes les annonces publiées sont automatiquement sauvegardées de façon persistante et relayées sur le canal Telegram d'administration.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* History / List of Broadcasts */}
      <div className="bg-[#141C2E] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-white">Historique des annonces diffusées</h3>
          </div>
          <span className="text-xs text-slate-400">{notifications.length} message(s)</span>
        </div>

        {notifications.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-xs">
            Aucune annonce n'a encore été diffusée. Remplissez le formulaire ci-dessus pour envoyer votre premier message.
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((n) => (
              <div
                key={n.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-[#0B0F17] border border-slate-800/80 hover:border-slate-700 transition-colors"
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold border ${
                        n.type === 'warning'
                          ? 'text-amber-400 bg-amber-950/40 border-amber-800/50'
                          : n.type === 'success'
                          ? 'text-emerald-400 bg-emerald-950/40 border-emerald-800/50'
                          : n.type === 'info'
                          ? 'text-sky-400 bg-sky-950/40 border-sky-800/50'
                          : 'text-blue-400 bg-blue-950/40 border-blue-800/50'
                      }`}
                    >
                      {n.badgeText || n.type}
                    </span>
                    <span className="font-bold text-white text-xs">{n.title}</span>
                    {n.isActive !== false ? (
                      <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded font-mono">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        Visible
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded font-mono">
                        Masquée
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line line-clamp-2">
                    {n.message}
                  </p>

                  <div className="flex items-center gap-3 text-[10px] text-slate-500 pt-1">
                    <span>
                      Diffusé le {new Date(n.createdAt).toLocaleString('fr-FR', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    {n.linkUrl && (
                      <a
                        href={n.linkUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:underline flex items-center gap-1"
                      >
                        <span>{n.linkText || 'Lien'}</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  <button
                    type="button"
                    onClick={() => handleToggleStatus(n.id)}
                    title={n.isActive !== false ? 'Masquer cette annonce' : 'Réactiver cette annonce'}
                    className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer text-xs flex items-center gap-1"
                  >
                    {n.isActive !== false ? (
                      <>
                        <EyeOff className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline text-[11px]">Masquer</span>
                      </>
                    ) : (
                      <>
                        <Eye className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline text-[11px]">Réactiver</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeleteNotification(n.id, n.title)}
                    title="Supprimer définitivement"
                    className="p-2 rounded-lg bg-red-950/40 hover:bg-red-900/60 text-red-400 hover:text-red-200 border border-red-800/40 transition-colors cursor-pointer text-xs"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
        </div>
      )}
    </div>
  );
};
