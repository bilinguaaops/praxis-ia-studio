import React, { useState, useEffect } from 'react';
import {
  Smartphone,
  Send,
  Zap,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Bell,
  BellRing,
  ExternalLink,
  ShieldCheck,
  Users,
  Sparkles,
  Info,
} from 'lucide-react';
import { useWebPush } from '../hooks/useWebPush';

interface AdminPushManagerProps {
  adminToken?: string;
  onNotify?: (text: string, type: 'success' | 'error' | 'info') => void;
}

interface PushSubscriber {
  email: string;
  name: string;
  userAgent: string;
  subscribedAt: string;
  endpointPreview: string;
}

export const AdminPushManager: React.FC<AdminPushManagerProps> = ({
  adminToken,
  onNotify,
}) => {
  const { isSubscribed, subscribe, sendTestPush } = useWebPush();

  const [subscribers, setSubscribers] = useState<PushSubscriber[]>([]);
  const [subscriberCount, setSubscriberCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [sending, setSending] = useState<boolean>(false);

  // Push Broadcast form
  const [pushTitle, setPushTitle] = useState('🔔 Vos copies sont corrigées !');
  const [pushBody, setPushBody] = useState(
    'L’analyse pédagogique de vos devoirs est terminée. Consultez vos fiches élèves et relevés de notes sur Praxis.'
  );
  const [pushUrl, setPushUrl] = useState('/#historique');

  const getEffectiveToken = () => {
    return (
      adminToken ||
      sessionStorage.getItem('praxis_admin_token') ||
      localStorage.getItem('praxis_admin_token') ||
      localStorage.getItem('cpro_admin_token') ||
      '2345'
    );
  };

  const fetchPushStats = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/push/stats', {
        headers: { 'x-admin-token': getEffectiveToken() },
      });
      const data = await res.json();
      if (data.success) {
        setSubscriberCount(data.count || 0);
        setSubscribers(data.subscribers || []);
      }
    } catch (err: any) {
      console.warn('[AdminPush] Erreur stats :', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPushStats();
  }, []);

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pushTitle.trim() || !pushBody.trim()) {
      if (onNotify) onNotify('Le titre et le message sont requis.', 'error');
      return;
    }

    if (subscriberCount === 0) {
      if (onNotify) {
        onNotify(
          'Aucun appareil n’est encore abonné aux push. Vous pouvez tester sur votre écran en activant les notifications ci-dessous !',
          'info'
        );
      }
    }

    setSending(true);
    try {
      const res = await fetch('/api/admin/push/broadcast', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': getEffectiveToken(),
        },
        body: JSON.stringify({
          title: pushTitle.trim(),
          body: pushBody.trim(),
          url: pushUrl.trim() || '/#historique',
        }),
      });

      const data = await res.json();
      if (data.success) {
        if (onNotify) {
          onNotify(
            `🚀 Push délivré avec succès à ${data.sentCount} smartphone(s) / appareil(s) !`,
            'success'
          );
        }
        fetchPushStats();
      } else {
        if (onNotify) onNotify(data.error || 'Erreur lors de la diffusion push.', 'error');
      }
    } catch (err: any) {
      if (onNotify) onNotify(err.message || 'Impossible d’envoyer la notification.', 'error');
    } finally {
      setSending(false);
    }
  };

  const applyTemplate = (title: string, body: string, url: string) => {
    setPushTitle(title);
    setPushBody(body);
    setPushUrl(url);
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#141C2E] border border-slate-800 p-5 rounded-2xl flex items-center justify-between shadow-lg">
          <div className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Appareils Abonnés Push
            </span>
            <div className="text-2xl font-black text-white flex items-center gap-2">
              <span>{subscriberCount}</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            </div>
            <p className="text-[11px] text-slate-400">Smartphones Android, iPhones PWA &amp; PC</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-500/15 border border-blue-500/30 text-blue-400 flex items-center justify-center">
            <Smartphone className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-[#141C2E] border border-slate-800 p-5 rounded-2xl flex items-center justify-between shadow-lg">
          <div className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Protocole Web Push
            </span>
            <div className="text-base font-bold text-emerald-400 flex items-center gap-1.5 mt-1">
              <ShieldCheck className="w-4 h-4" />
              <span>Chiffré VAPID 256</span>
            </div>
            <p className="text-[11px] text-slate-400">Standard W3C sans intermédiaire tiers</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
            <Zap className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-[#141C2E] border border-slate-800 p-5 rounded-2xl flex items-center justify-between shadow-lg">
          <div className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Test sur votre Écran
            </span>
            <div className="mt-1">
              {isSubscribed ? (
                <button
                  type="button"
                  onClick={async () => {
                    const ok = await sendTestPush();
                    if (ok && onNotify) onNotify('⚡ Notification push test reçue sur votre écran !', 'success');
                  }}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer transition shadow-md"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>Tester sur mon écran</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={async () => {
                    const ok = await subscribe('admin@praxis-pro.pro', 'Administrateur');
                    if (ok) {
                      if (onNotify) onNotify('Appareil administrateur abonné aux push !', 'success');
                      fetchPushStats();
                    }
                  }}
                  className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer transition shadow-md"
                >
                  <BellRing className="w-3.5 h-3.5" />
                  <span>Activer sur mon écran</span>
                </button>
              )}
            </div>
            <p className="text-[11px] text-slate-400">Permet de valider le visuel en direct</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-400 flex items-center justify-center">
            <Bell className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Grid: Form (Left) & Phone Mockup Preview (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Form Card (7 cols) */}
        <div className="lg:col-span-7 bg-[#141C2E] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Send className="w-4 h-4 text-blue-400" />
              <h3 className="text-sm font-bold text-white">Diffuser une Notification Push Mobile</h3>
            </div>
            <button
              type="button"
              onClick={fetchPushStats}
              disabled={loading}
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
            >
              <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
              <span>Actualiser ({subscriberCount})</span>
            </button>
          </div>

          {/* Quick Scenario Templates */}
          <div>
            <span className="text-[11px] font-semibold text-slate-400 block mb-2">
              Modèles rapides d'alertes pédagogiques :
            </span>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() =>
                  applyTemplate(
                    '🔔 Vos copies sont corrigées !',
                    'L’analyse pédagogique de vos devoirs est terminée. Vos fiches élèves sont prêtes.',
                    '/#historique'
                  )
                }
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-medium border border-slate-700/60 transition cursor-pointer"
              >
                📄 Fin de correction
              </button>
              <button
                type="button"
                onClick={() =>
                  applyTemplate(
                    '🎬 Nouveau tutoriel vidéo disponible !',
                    'Découvrez en 1 minute comment bien cadrer et photographier vos devoirs manuscrits.',
                    '/#aide'
                  )
                }
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-medium border border-slate-700/60 transition cursor-pointer"
              >
                🎥 Démo vidéo
              </button>
              <button
                type="button"
                onClick={() =>
                  applyTemplate(
                    '🎁 Vos 15 corrections offertes vous attendent',
                    'Profitez de votre essai gratuit pour évaluer votre prochain paquet de copies en 2 minutes.',
                    '/#corr'
                  )
                }
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-medium border border-slate-700/60 transition cursor-pointer"
              >
                🎁 Relance crédits
              </button>
            </div>
          </div>

          <form onSubmit={handleBroadcast} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Titre de la notification (court et percutant) *
              </label>
              <input
                type="text"
                required
                maxLength={60}
                value={pushTitle}
                onChange={(e) => setPushTitle(e.target.value)}
                placeholder="Ex : 🔔 Vos copies sont corrigées !"
                className="w-full bg-[#0B0F17] border border-slate-700 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                {pushTitle.length}/60 caractères (idéal pour l'écran de verrouillage du smartphone)
              </span>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Corps du message *
              </label>
              <textarea
                rows={3}
                required
                maxLength={140}
                value={pushBody}
                onChange={(e) => setPushBody(e.target.value)}
                placeholder="Expliquez ce qui attend l'enseignant..."
                className="w-full bg-[#0B0F17] border border-slate-700 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                {pushBody.length}/140 caractères
              </span>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Lien de redirection au clic (URL de destination)
              </label>
              <input
                type="text"
                value={pushUrl}
                onChange={(e) => setPushUrl(e.target.value)}
                placeholder="/#historique ou /#aide"
                className="w-full bg-[#0B0F17] border border-slate-700 rounded-xl px-3.5 py-2 text-white font-mono text-[11px] placeholder-slate-600 focus:outline-none focus:border-blue-500"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Au clic sur la notification, l'application s'ouvrira directement sur cette page.
              </p>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={sending}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-blue-600/30 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {sending ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Diffusion push en cours...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>
                      Envoyer le Push à tous les smartphones ({subscriberCount} appareil
                      {subscriberCount > 1 ? 's' : ''})
                    </span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Live Smartphone Notification Preview (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-[#141C2E] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between text-xs font-bold text-slate-300">
              <span className="flex items-center gap-1.5">
                <Smartphone className="w-4 h-4 text-blue-400" />
                Aperçu sur écran de verrouillage
              </span>
              <span className="text-[10px] text-slate-500 font-mono">Mobile Push Preview</span>
            </div>

            {/* Smartphone Mockup Card */}
            <div className="p-4 rounded-2xl bg-slate-950/90 border border-slate-800/80 shadow-2xl relative space-y-3">
              {/* Phone Status Bar */}
              <div className="flex items-center justify-between text-[10px] text-slate-500 pb-1">
                <span>09:41</span>
                <span>5G · 100%</span>
              </div>

              {/* Native Push Notification Toast */}
              <div className="p-3.5 rounded-xl bg-slate-900/95 border border-slate-700/80 shadow-xl backdrop-blur-md space-y-2 transform transition-all hover:scale-[1.02]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <img
                      src="/favicon-32x32.png"
                      alt="Praxis"
                      className="w-4 h-4 rounded-md object-contain"
                    />
                    <span className="text-[11px] font-bold text-white tracking-wide uppercase">
                      PRAXIS PRO
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400">maintenant</span>
                </div>

                <div>
                  <h5 className="text-xs font-bold text-white leading-snug">
                    {pushTitle || 'Titre de la notification'}
                  </h5>
                  <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">
                    {pushBody || 'Corps du message transmis...'}
                  </p>
                </div>

                <div className="pt-1 flex items-center justify-between text-[10px] text-blue-400 font-semibold border-t border-slate-800/60">
                  <span>Appuyer pour ouvrir</span>
                  <span>praxis-pro.pro</span>
                </div>
              </div>

              <p className="text-[10px] text-slate-500 text-center italic">
                Ce message s'affiche même lorsque le navigateur ou l'application est en veille.
              </p>
            </div>

            {/* Subscribed Devices Mini-List */}
            <div className="pt-2 border-t border-slate-800">
              <div className="flex items-center justify-between text-xs font-bold text-slate-300 mb-2">
                <span className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-blue-400" />
                  Derniers appareils enregistrés ({subscribers.length})
                </span>
              </div>

              {subscribers.length === 0 ? (
                <div className="p-3 rounded-xl bg-[#0B0F17] text-[11px] text-slate-500 text-center">
                  Aucun appareil pour l'instant. Activez le push sur votre écran avec le bouton ci-dessus pour faire votre premier test !
                </div>
              ) : (
                <div className="max-h-40 overflow-y-auto space-y-2 pr-1">
                  {subscribers.slice(0, 5).map((sub, idx) => (
                    <div
                      key={idx}
                      className="p-2 rounded-lg bg-[#0B0F17] border border-slate-800/80 text-[11px] flex items-center justify-between"
                    >
                      <div className="truncate mr-2">
                        <span className="font-semibold text-white block truncate">
                          {sub.email}
                        </span>
                        <span className="text-[10px] text-slate-500 truncate block">
                          {sub.userAgent.includes('Mobile') ? '📱 Smartphone' : '💻 Ordinateur'} ·{' '}
                          {new Date(sub.subscribedAt).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                      <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0"></span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
