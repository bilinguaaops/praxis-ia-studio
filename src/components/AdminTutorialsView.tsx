import React, { useState, useEffect, useRef } from 'react';
import {
  Video,
  Play,
  Film,
  Plus,
  Trash2,
  Edit3,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Sparkles,
  RefreshCw,
  Clock,
  Layers,
  Star,
  Info,
  UploadCloud,
  Check,
  FileVideo,
} from 'lucide-react';
import { TutorialVideoItem } from './VideoTutorialSection';

interface AdminTutorialsViewProps {
  adminToken?: string;
  onNotify?: (text: string, type: 'success' | 'error' | 'info') => void;
}

export const AdminTutorialsView: React.FC<AdminTutorialsViewProps> = ({
  adminToken,
  onNotify,
}) => {
  const [tutorials, setTutorials] = useState<TutorialVideoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // File upload state for local / direct video files
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedFileName, setUploadedFileName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [duration, setDuration] = useState('03:30');
  const [category, setCategory] = useState('Prise en main');
  const [isFeatured, setIsFeatured] = useState(true);
  const [chaptersText, setChaptersText] = useState(
    '00:00 | Introduction & Tableau de bord\n00:45 | Téléverser ou photographier une copie\n01:30 | Choisir la grille de barème & critères\n02:15 | Génération de l’appréciation personnalisée\n03:00 | Téléchargement & impression du bulletin'
  );

  const getEffectiveToken = () => {
    return (
      adminToken ||
      sessionStorage.getItem('praxis_admin_token') ||
      localStorage.getItem('praxis_admin_token') ||
      localStorage.getItem('cpro_admin_token') ||
      '2345'
    );
  };

  const fetchTutorials = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/tutorials', {
        headers: {
          'x-admin-token': getEffectiveToken(),
        },
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.tutorials)) {
        setTutorials(data.tutorials);
      }
    } catch (err: any) {
      if (onNotify) onNotify('Erreur lors du chargement des tutoriels.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTutorials();
  }, []);

  const handleEditClick = (tutorial: TutorialVideoItem) => {
    setEditingId(tutorial.id);
    setTitle(tutorial.title);
    setDescription(tutorial.description || '');
    setVideoUrl(tutorial.videoUrl);
    setDuration(tutorial.duration || '03:30');
    setCategory(tutorial.category || 'Prise en main');
    setIsFeatured(Boolean(tutorial.isFeatured));

    if (tutorial.chapters && tutorial.chapters.length > 0) {
      setChaptersText(
        tutorial.chapters.map((c) => `${c.time} | ${c.title}`).join('\n')
      );
    } else {
      setChaptersText('');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setTitle('');
    setDescription('');
    setVideoUrl('');
    setDuration('03:30');
    setCategory('Prise en main');
    setIsFeatured(false);
    setChaptersText(
      '00:00 | Introduction\n01:00 | Correction d’une copie\n02:00 | Bilan'
    );
  };

  const parseChapters = (raw: string) => {
    const lines = raw.split('\n').map((l) => l.trim()).filter(Boolean);
    return lines.map((line, idx) => {
      const parts = line.split('|');
      if (parts.length >= 2) {
        return {
          id: idx + 1,
          time: parts[0].trim(),
          title: parts.slice(1).join('|').trim(),
        };
      }
      return {
        id: idx + 1,
        time: `0${idx}:00`,
        title: line,
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !videoUrl.trim()) {
      if (onNotify) onNotify('Le titre et l’URL de la vidéo sont obligatoires.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const parsedChapters = parseChapters(chaptersText);

      const payload = {
        id: editingId || undefined,
        title: title.trim(),
        description: description.trim(),
        videoUrl: videoUrl.trim(),
        duration: duration.trim(),
        category: category.trim(),
        isFeatured,
        chapters: parsedChapters,
      };

      const res = await fetch('/api/admin/tutorials', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': getEffectiveToken(),
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Erreur lors de l’enregistrement de la vidéo.');
      }

      if (onNotify) {
        onNotify(
          editingId
            ? 'Vidéo tutoriel mise à jour avec succès !'
            : 'Nouvelle vidéo tutoriel publiée sur l’espace professeurs !',
          'success'
        );
      }

      handleCancelEdit();
      fetchTutorials();
    } catch (err: any) {
      if (onNotify) onNotify(err.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, videoTitle: string) => {
    if (!window.confirm(`Confirmez-vous la suppression du tutoriel « ${videoTitle} » ?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/tutorials/${id}`, {
        method: 'DELETE',
        headers: {
          'x-admin-token': getEffectiveToken(),
        },
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Erreur lors de la suppression.');
      }

      if (onNotify) onNotify('Tutoriel supprimé.', 'info');
      fetchTutorials();
      if (editingId === id) handleCancelEdit();
    } catch (err: any) {
      if (onNotify) onNotify(err.message, 'error');
    }
  };

  // Direct video file upload handler
  const handleFileUpload = async (file: File) => {
    if (!file) return;
    setIsUploading(true);
    setUploadProgress(5);
    setUploadedFileName(file.name);

    try {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', '/api/admin/tutorials/upload-video', true);
      xhr.setRequestHeader('x-admin-token', getEffectiveToken());
      xhr.setRequestHeader('x-filename', encodeURIComponent(file.name));
      xhr.setRequestHeader('Content-Type', file.type || 'video/mp4');

      xhr.upload.onprogress = (evt) => {
        if (evt.lengthComputable) {
          const percent = Math.round((evt.loaded / evt.total) * 100);
          setUploadProgress(percent);
        }
      };

      xhr.onload = () => {
        setIsUploading(false);
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const res = JSON.parse(xhr.responseText);
            if (res.videoUrl) {
              setVideoUrl(res.videoUrl);
              if (!title.trim()) {
                setTitle(`Tutoriel Praxis - ${file.name.replace(/\.[^/.]+$/, '')}`);
              }
            }
            if (onNotify) onNotify('Vidéo téléversée avec succès sur le serveur Praxis !', 'success');
            fetchTutorials();
          } catch {
            if (onNotify) onNotify('Vidéo téléversée avec succès !', 'success');
          }
        } else {
          if (onNotify) onNotify('Erreur lors du téléversement du fichier vidéo.', 'error');
        }
      };

      xhr.onerror = () => {
        setIsUploading(false);
        if (onNotify) onNotify('Échec réseau lors du téléversement.', 'error');
      };

      xhr.send(file);
    } catch (err: any) {
      setIsUploading(false);
      if (onNotify) onNotify(err.message || 'Erreur lors de l’envoi.', 'error');
    }
  };

  // Preview helpers
  const getEmbedPreviewUrl = (url: string) => {
    if (!url) return '';
    if (url.includes('youtube.com/embed/') || url.includes('loom.com/embed/')) return url;
    const ytMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/i);
    if (ytMatch && ytMatch[1]) {
      return `https://www.youtube.com/embed/${ytMatch[1]}`;
    }
    return url;
  };

  const isDirectVideo = (url: string) => {
    return (
      url.startsWith('/videos/') ||
      url.endsWith('.mp4') ||
      url.endsWith('.webm') ||
      url.endsWith('.mov') ||
      url.includes('cloudinary.com') ||
      url.includes('.mp4?')
    );
  };

  return (
    <div className="space-y-8 max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-950/80 via-slate-900 to-indigo-950/80 border border-blue-800/40 rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30 mb-3">
            <Film className="w-3.5 h-3.5" />
            <span>Support & Pédagogie Enseignants</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Vidéos Tutoriels & Démonstrations
          </h2>
          <p className="text-sm text-slate-300 mt-2 leading-relaxed">
            Configurez et publiez les vidéos pas à pas présentées aux enseignants dans la section Aide &amp; FAQ (<code className="text-blue-300">FaqView</code>). Elles guident les nouveaux utilisateurs pour photographier leurs copies et maîtriser Praxis.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={fetchTutorials}
            disabled={loading}
            className="px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700/60 text-xs font-semibold flex items-center gap-2 cursor-pointer transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Actualiser</span>
          </button>
          <a
            href="/#aide"
            target="_blank"
            rel="noreferrer"
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-blue-600/20 cursor-pointer transition-all"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Voir le rendu dans la FAQ</span>
          </a>
        </div>
      </div>

      {/* Guide Hébergement & Upload - Réponse directe aux interrogations */}
      <div className="bg-[#101726] border border-blue-900/40 rounded-2xl p-6">
        <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
          <UploadCloud className="w-4 h-4 text-blue-400" />
          <span>Comment mettre en ligne la vidéo que vous avez filmée ?</span>
        </h3>
        <p className="text-xs text-slate-300 mb-4 leading-relaxed">
          Comme les vidéos lourdes (MP4 HD de plusieurs centaines de Mo) ralentiraient le serveur de l'application, vous pouvez héberger votre vidéo gratuitement sur l'un de ces services et simplement coller son lien ici :
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          {/* Cloudinary */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-blue-500/40 transition-colors">
            <div className="flex items-center gap-2 font-bold text-emerald-300 mb-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              Option 1 : Cloudinary (Recommandé)
            </div>
            <p className="text-slate-400 leading-relaxed">
              Créez un compte gratuit sur <strong>cloudinary.com</strong>, uploadez votre vidéo MP4 dans le Media Explorer, puis copiez l'URL directe (ex: <code className="text-slate-200">https://res.cloudinary.com/.../video.mp4</code>). Elle s'affichera directement dans le lecteur vidéo natif de Praxis sans publicité ni logo tiers.
            </p>
          </div>

          {/* YouTube */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-blue-500/40 transition-colors">
            <div className="flex items-center gap-2 font-bold text-red-400 mb-1.5">
              <span className="w-2 h-2 rounded-full bg-red-400"></span>
              Option 2 : YouTube (Non-répertoriée)
            </div>
            <p className="text-slate-400 leading-relaxed">
              Uploadez votre vidéo sur YouTube Studio et choisissez la visibilité <strong>« Non répertoriée »</strong> (seuls ceux qui ont le lien la voient, invisible dans les recherches publiques). Collez simplement le lien YouTube : Praxis le convertit automatiquement en lecteur intégré.
            </p>
          </div>

          {/* Loom / MP4 direct */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-blue-500/40 transition-colors">
            <div className="flex items-center gap-2 font-bold text-purple-300 mb-1.5">
              <span className="w-2 h-2 rounded-full bg-purple-400"></span>
              Option 3 : Loom ou Fichier Public
            </div>
            <p className="text-slate-400 leading-relaxed">
              Si vous avez enregistré votre démo avec <strong>Loom</strong>, partagez simplement le lien public de votre vidéo Loom. Le lecteur embarqué sera immédiatement reconnu et intégré.
            </p>
          </div>
        </div>
      </div>

      {/* Main Grid: Form (Left) & Preview + List (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Form Card (5 cols) */}
        <div className="lg:col-span-5 bg-[#101726] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5 sticky top-24">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              {editingId ? (
                <>
                  <Edit3 className="w-4 h-4 text-amber-400" />
                  <span>Modifier le tutoriel</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 text-blue-400" />
                  <span>Ajouter une vidéo tutoriel</span>
                </>
              )}
            </h3>
            {editingId && (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="text-xs text-slate-400 hover:text-white transition-colors"
              >
                Annuler
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Titre de la vidéo *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Démonstration complète : De la photo au bulletin"
                className="w-full bg-[#0B0F17] border border-slate-700 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-600 focus:outline-hidden focus:border-blue-500 transition-colors"
              />
            </div>

            {/* Direct File Upload Option */}
            <div className="p-3.5 bg-blue-950/30 border border-blue-500/30 rounded-xl space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white flex items-center gap-1.5 text-xs">
                  <UploadCloud className="w-4 h-4 text-blue-400" />
                  Téléverser votre propre fichier (.mp4, .mov, .webm)
                </span>
                <span className="text-[10px] text-blue-300 font-mono">Direct serveur</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Sélectionnez la vidéo que vous avez filmée sur votre téléphone ou PC. Elle sera hébergée et diffusée directement sur Praxis sans redirection.
              </p>

              <input
                ref={fileInputRef}
                type="file"
                accept="video/mp4,video/webm,video/quicktime,video/x-m4v"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload(file);
                }}
                className="hidden"
              />

              <button
                type="button"
                disabled={isUploading}
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-2.5 px-3 bg-blue-600/80 hover:bg-blue-600 disabled:opacity-50 text-white font-bold rounded-lg flex items-center justify-center gap-2 cursor-pointer transition text-xs shadow-md"
              >
                <FileVideo className="w-4 h-4" />
                <span>{isUploading ? `Téléversement en cours (${uploadProgress}%)...` : 'Choisir mon fichier vidéo filmé'}</span>
              </button>

              {isUploading && (
                <div className="space-y-1">
                  <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-blue-500 h-full transition-all duration-200"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 block text-right font-mono">{uploadProgress}%</span>
                </div>
              )}

              {uploadedFileName && !isUploading && (
                <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">Fichier prêt : {uploadedFileName}</span>
                </div>
              )}
            </div>

            <div className="relative flex py-1 items-center">
              <div className="grow border-t border-slate-800"></div>
              <span className="shrink mx-3 text-slate-500 text-[10px] uppercase font-bold tracking-wider">OU collez une URL</span>
              <div className="grow border-t border-slate-800"></div>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Lien de la vidéo (MP4 local, Cloudinary, YouTube, Loom) *
              </label>
              <input
                type="text"
                required
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="/videos/... ou https://res.cloudinary.com/... ou https://youtu.be/..."
                className="w-full bg-[#0B0F17] border border-slate-700 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-600 font-mono text-[11px] focus:outline-hidden focus:border-blue-500 transition-colors"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Supporte les fichiers MP4 locaux (/videos/...), Cloudinary, YouTube et Loom.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Catégorie
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-[#0B0F17] border border-slate-700 rounded-xl px-3 py-2.5 text-white focus:outline-hidden focus:border-blue-500"
                >
                  <option value="Prise en main">Prise en main</option>
                  <option value="Correction & Barèmes">Correction &amp; Barèmes</option>
                  <option value="Conseils Photo">Conseils Photo &amp; Scan</option>
                  <option value="Gestion de classe">Gestion de classe</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Durée estimée
                </label>
                <input
                  type="text"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  placeholder="03:30"
                  className="w-full bg-[#0B0F17] border border-slate-700 rounded-xl px-3 py-2.5 text-white font-mono placeholder-slate-600 focus:outline-hidden focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Description &amp; Objectifs pédagogiques
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Expliquez brièvement ce que l'enseignant va apprendre dans cette vidéo..."
                className="w-full bg-[#0B0F17] border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-600 focus:outline-hidden focus:border-blue-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Chapitrage minuté (1 par ligne : <code>mm:ss | Titre</code>)
              </label>
              <textarea
                rows={4}
                value={chaptersText}
                onChange={(e) => setChaptersText(e.target.value)}
                placeholder="00:00 | Introduction&#10;00:45 | Photographier la copie&#10;01:30 | Choisir le barème"
                className="w-full bg-[#0B0F17] border border-slate-700 rounded-xl px-3 py-2 text-white font-mono text-[11px] placeholder-slate-600 focus:outline-hidden focus:border-blue-500 transition-colors"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Permet aux enseignants de cliquer sur un chapitre précis pour s'y référer directement.
              </p>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="isFeatured"
                checked={isFeatured}
                onChange={(e) => setIsFeatured(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 bg-slate-900 border-slate-700 cursor-pointer"
              />
              <label htmlFor="isFeatured" className="text-slate-300 font-medium cursor-pointer">
                Définir comme vidéo principale (mise en avant par défaut)
              </label>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-600/25 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Enregistrement en cours...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>
                    {editingId
                      ? 'Mettre à jour la vidéo'
                      : 'Enregistrer & Publier immédiatement'}
                  </span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Video List & Interactive Preview (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Live Player Preview Card */}
          {videoUrl && (
            <div className="bg-[#101726] border border-blue-500/40 rounded-2xl p-5 shadow-xl space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-blue-300">
                <span className="flex items-center gap-2">
                  <Play className="w-3.5 h-3.5" />
                  Aperçu direct du lecteur
                </span>
                <span className="font-mono text-[11px] text-slate-400">
                  {isDirectVideo(videoUrl) ? 'Lecteur HTML5 natif' : 'Lecteur Iframe'}
                </span>
              </div>

              <div className="relative aspect-video rounded-xl overflow-hidden bg-black border border-slate-800 flex items-center justify-center shadow-inner">
                {isDirectVideo(videoUrl) ? (
                  <video
                    controls
                    preload="metadata"
                    className="w-full h-full object-contain"
                    src={videoUrl}
                  />
                ) : (
                  <iframe
                    src={getEmbedPreviewUrl(videoUrl)}
                    title="Aperçu vidéo"
                    className="w-full h-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                )}
              </div>
              <p className="text-[11px] text-slate-400 italic">
                Ce lecteur montre exactement ce que verront les professeurs sur leur écran.
              </p>
            </div>
          )}

          {/* Active Tutorials List */}
          <div className="bg-[#101726] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Video className="w-4 h-4 text-blue-400" />
                  <span>Vidéos actives ({tutorials.length})</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Ces tutoriels sont accessibles par tous les professeurs dans l'onglet « Aide &amp; FAQ ».
                </p>
              </div>
            </div>

            {loading ? (
              <div className="py-12 text-center text-slate-500 text-xs flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-blue-400" />
                <span>Chargement des vidéos...</span>
              </div>
            ) : tutorials.length === 0 ? (
              <div className="py-12 text-center border border-dashed border-slate-800 rounded-xl p-8 space-y-2">
                <Film className="w-8 h-8 text-slate-600 mx-auto" />
                <p className="text-xs font-semibold text-slate-300">
                  Aucun tutoriel configuré pour l'instant.
                </p>
                <p className="text-[11px] text-slate-500">
                  Utilisez le formulaire ci-contre pour publier votre première vidéo !
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {tutorials.map((tut, index) => (
                  <div
                    key={tut.id || index}
                    className={`p-4 rounded-xl border transition-all ${
                      tut.isFeatured
                        ? 'bg-blue-950/20 border-blue-600/40'
                        : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="space-y-1.5 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="text-sm font-bold text-white">{tut.title}</h4>
                          {tut.isFeatured && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                              À la une
                            </span>
                          )}
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                            {tut.category || 'Tutoriel'}
                          </span>
                          {tut.duration && (
                            <span className="inline-flex items-center gap-1 text-[11px] text-slate-400 font-mono">
                              <Clock className="w-3 h-3" />
                              {tut.duration}
                            </span>
                          )}
                        </div>

                        {tut.description && (
                          <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                            {tut.description}
                          </p>
                        )}

                        <div className="flex items-center gap-3 pt-1 text-[11px] text-slate-500">
                          <span className="font-mono truncate max-w-xs text-blue-400/90">
                            {tut.videoUrl}
                          </span>
                          {tut.chapters && tut.chapters.length > 0 && (
                            <span className="text-slate-400">
                              · {tut.chapters.length} chapitres
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0">
                        <button
                          type="button"
                          onClick={() => handleEditClick(tut)}
                          className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                          title="Modifier"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(tut.id, tut.title)}
                          className="p-2 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/40 transition-colors cursor-pointer"
                          title="Supprimer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
