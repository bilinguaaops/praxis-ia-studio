import React, { useState, useEffect } from 'react';
import {
  Play,
  Video,
  Clock,
  Sparkles,
  CheckCircle2,
  HelpCircle,
  ExternalLink,
  Edit3,
  Camera,
  FileCheck2,
  Share2,
  MessageCircle,
  Mail,
  Smartphone,
  Info,
  ChevronRight,
  Shield,
  Layers,
  ArrowRight,
  RefreshCw,
  Film,
  Check,
} from 'lucide-react';

export interface TutorialVideoItem {
  id: string;
  title: string;
  description: string;
  videoUrl: string;
  videoType?: 'youtube' | 'cloudinary' | 'loom' | 'direct';
  duration?: string;
  isFeatured?: boolean;
  category?: string;
  chapters?: Array<{ id: number; time: string; title: string; desc?: string }>;
}

interface VideoTutorialSectionProps {
  onStartCorrection?: () => void;
  onOpenContact?: () => void;
  defaultExpanded?: boolean;
}

export const VideoTutorialSection: React.FC<VideoTutorialSectionProps> = ({
  onStartCorrection,
  onOpenContact,
  defaultExpanded = true,
}) => {
  const [tutorials, setTutorials] = useState<TutorialVideoItem[]>([]);
  const [selectedTutorialIndex, setSelectedTutorialIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeChapter, setActiveChapter] = useState(0);
  const [loading, setLoading] = useState(true);

  // Quick edit mode (for admin convenience directly in UI)
  const [isEditingUrl, setIsEditingUrl] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [titleInput, setTitleInput] = useState('');
  const [savingNotice, setSavingNotice] = useState(false);

  // Fetch tutorials from API
  const fetchTutorials = async () => {
    try {
      const res = await fetch('/api/tutorials');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.tutorials) && data.tutorials.length > 0) {
          setTutorials(data.tutorials);
          const featuredIdx = data.tutorials.findIndex((t: any) => t.isFeatured);
          setSelectedTutorialIndex(featuredIdx >= 0 ? featuredIdx : 0);
          return;
        }
      }
    } catch (e) {
      console.warn('[VideoTutorialSection] Fallback local:', e);
    } finally {
      setLoading(false);
    }

    // Default Fallback
    const defaultList: TutorialVideoItem[] = [
      {
        id: 'tut_main_guide',
        title: 'Démonstration : Fonctionnement de Praxis Pas à Pas',
        description: 'Vidéo officielle montrant comment utiliser Praxis pour corriger et évaluer rapidement vos copies d\'élèves.',
        videoUrl: 'https://www.youtube.com/embed/ZXaaJzhgJCw?autoplay=1',
        videoType: 'youtube',
        duration: '01:00',
        isFeatured: true,
        category: 'Prise en main',
        chapters: [
          { id: 0, time: '00:00', title: 'Présentation & Connexion', desc: 'Interface, solde de crédits et accès enseignant.' },
          { id: 1, time: '00:45', title: 'Étape 1 · Sujet & Barème', desc: 'Saisie de l\'énoncé ou grille critériée générée par IA.' },
          { id: 2, time: '01:30', title: 'Étape 2 · Numérisation Smartphone', desc: 'Photographie et scan propre avec CamScanner.' },
          { id: 3, time: '02:15', title: 'Étape 3 · Analyse & Double Moteur IA', desc: 'Lecture de l\'écriture manuscrite et citations exactes.' },
          { id: 4, time: '03:00', title: 'Étape 4 · Révision & Export Pronote', desc: 'Ajustement des notes en 1 clic et fiches élèves A4.' },
        ],
      },
      {
        id: 'tut_scan_mobile',
        title: 'Guide Numérisation : Scanner les devoirs avec votre smartphone',
        description: 'Conseils pratiques pour utiliser CamScanner ou Adobe Scan afin d\'obtenir un contraste net et un cadrage optimal des copies.',
        videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1',
        videoType: 'youtube',
        duration: '02:10',
        isFeatured: false,
        category: 'Numérisation',
        chapters: [
          { id: 0, time: '00:00', title: 'Choisir son application', desc: 'CamScanner ou Adobe Scan gratuit.' },
          { id: 1, time: '00:50', title: 'Cadrage et contraste', desc: 'Éviter les ombres portées et bien caler la copie.' },
          { id: 2, time: '01:30', title: 'Export PDF de classe', desc: 'Regrouper en un seul fichier PDF pour gagner du temps.' },
        ],
      },
    ];

    setTutorials(defaultList);
  };

  useEffect(() => {
    fetchTutorials();
  }, []);

  const currentTutorial = tutorials[selectedTutorialIndex] || tutorials[0];
  const chapters = currentTutorial?.chapters || [];

  // When changing tutorial
  const handleSelectTutorial = (index: number) => {
    setSelectedTutorialIndex(index);
    setActiveChapter(0);
    setIsPlaying(false);
  };

  // Convert raw URL into embed or direct URL
  const normalizeVideoUrl = (raw: string) => {
    const clean = raw.trim();
    if (clean.includes('youtube.com/watch?v=')) {
      const videoId = clean.split('v=')[1]?.split('&')[0];
      return { url: `https://www.youtube.com/embed/${videoId}?autoplay=1`, type: 'youtube' };
    }
    if (clean.includes('youtu.be/')) {
      const videoId = clean.split('youtu.be/')[1]?.split('?')[0];
      return { url: `https://www.youtube.com/embed/${videoId}?autoplay=1`, type: 'youtube' };
    }
    if (clean.includes('youtube.com/shorts/')) {
      const videoId = clean.split('shorts/')[1]?.split('?')[0];
      return { url: `https://www.youtube.com/embed/${videoId}?autoplay=1`, type: 'youtube' };
    }
    if (clean.includes('loom.com/share/')) {
      return { url: clean.replace('loom.com/share/', 'loom.com/embed/'), type: 'loom' };
    }
    if (clean.includes('cloudinary.com')) {
      return { url: clean, type: 'cloudinary' };
    }
    return { url: clean, type: 'direct' };
  };

  const handleSaveVideoUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) return;

    const { url: embedUrl, type: detectedType } = normalizeVideoUrl(urlInput);
    const token = sessionStorage.getItem('praxis_admin_token') || localStorage.getItem('praxis_admin_token') || '2345';

    try {
      setSavingNotice(true);
      const res = await fetch('/api/admin/tutorials', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': token,
        },
        body: JSON.stringify({
          id: currentTutorial?.id,
          title: titleInput.trim() || currentTutorial?.title || 'Tutoriel Praxis Pro',
          description: currentTutorial?.description || '',
          videoUrl: embedUrl,
          videoType: detectedType,
          duration: currentTutorial?.duration || '03:00',
          category: currentTutorial?.category || 'Prise en main',
          isFeatured: true,
          chapters: currentTutorial?.chapters || [],
        }),
      });

      if (res.ok) {
        await fetchTutorials();
        setIsEditingUrl(false);
      } else {
        // Local state update
        setTutorials((prev) =>
          prev.map((t, idx) =>
            idx === selectedTutorialIndex
              ? { ...t, videoUrl: embedUrl, videoType: detectedType as any }
              : t
          )
        );
        setIsEditingUrl(false);
      }
    } catch {
      setTutorials((prev) =>
        prev.map((t, idx) =>
          idx === selectedTutorialIndex
            ? { ...t, videoUrl: embedUrl, videoType: detectedType as any }
            : t
        )
      );
      setIsEditingUrl(false);
    } finally {
      setSavingNotice(false);
    }
  };

  const isDirectVideo =
    currentTutorial?.videoType === 'direct' ||
    currentTutorial?.videoUrl?.endsWith('.mp4') ||
    currentTutorial?.videoUrl?.endsWith('.webm') ||
    (currentTutorial?.videoUrl?.includes('cloudinary.com') && !currentTutorial.videoUrl.includes('/embed'));

  return (
    <section id="tutoriels-video" className="bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-5 sm:p-8 text-white shadow-2xl relative overflow-hidden space-y-6">
      {/* Background ambient lighting */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-10 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 space-y-6">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-500/20 text-blue-300 border border-blue-400/30">
              <Film className="w-3.5 h-3.5" />
              <span>Tutoriels Vidéo & Prise en Main Pas à Pas</span>
            </div>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-white tracking-tight flex items-center gap-2">
              Comment utiliser Praxis Pro en pratique ?
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Visionnez ces démonstrations vidéo courtes (2 à 3 minutes) pour maîtriser la numérisation des devoirs manuscrits, le réglage des barèmes critériés et l'export direct vers vos bulletins ou Pronote.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            {/* Bouton pour que l'admin puisse changer la vidéo en 1 clic */}
            <button
              type="button"
              onClick={() => {
                setUrlInput(currentTutorial?.videoUrl || '');
                setTitleInput(currentTutorial?.title || '');
                setIsEditingUrl(!isEditingUrl);
              }}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 active:bg-slate-750 text-slate-300 text-xs font-bold rounded-xl border border-slate-700 transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              title="Modifier l'URL YouTube / Cloudinary / MP4 de la vidéo"
            >
              <Edit3 className="w-3.5 h-3.5 text-blue-400" />
              <span>Changer la vidéo</span>
            </button>

            {onStartCorrection && (
              <button
                type="button"
                onClick={onStartCorrection}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-extrabold rounded-xl shadow-md shadow-blue-600/30 transition flex items-center gap-1.5 cursor-pointer"
              >
                <span>Démarrer une correction</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Video selector tabs if multiple tutorials */}
        {tutorials.length > 1 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {tutorials.map((tut, idx) => (
              <button
                key={tut.id}
                type="button"
                onClick={() => handleSelectTutorial(idx)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-2 ${
                  selectedTutorialIndex === idx
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                    : 'bg-slate-850 hover:bg-slate-800 text-slate-300 border border-slate-700/80'
                }`}
              >
                <Video className="w-3.5 h-3.5 opacity-80" />
                <span>{tut.category || `Vidéo ${idx + 1}`} : {tut.title.slice(0, 32)}...</span>
                <span className="text-[10px] font-mono opacity-60">({tut.duration || '3 min'})</span>
              </button>
            ))}
          </div>
        )}

        {/* Quick URL Edit Form (Admin or local testing) */}
        {isEditingUrl && (
          <form
            onSubmit={handleSaveVideoUrl}
            className="p-4.5 bg-slate-850/95 border-2 border-blue-500/50 rounded-2xl space-y-3.5 animate-in fade-in shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-slate-700/80 pb-2">
              <label className="text-xs font-black text-white flex items-center gap-2">
                <Video className="w-4 h-4 text-blue-400" />
                <span>Intégrer votre vidéo personnalisée (YouTube, Cloudinary, Loom, MP4) :</span>
              </label>
              <button
                type="button"
                onClick={() => setIsEditingUrl(false)}
                className="text-xs text-slate-400 hover:text-white cursor-pointer px-2 py-0.5"
              >
                Fermer ✕
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <span className="text-[11px] font-bold text-slate-300 block mb-1">Titre de la vidéo :</span>
                <input
                  type="text"
                  value={titleInput}
                  onChange={(e) => setTitleInput(e.target.value)}
                  placeholder="Ex: Démonstration complète Praxis Pro..."
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-blue-500"
                />
              </div>

              <div>
                <span className="text-[11px] font-bold text-slate-300 block mb-1">Lien de la vidéo (URL) :</span>
                <input
                  type="text"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="Ex: https://www.youtube.com/watch?v=... ou https://res.cloudinary.com/.../video.mp4"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-blue-500"
                  required
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px] text-slate-400">
              <span className="leading-snug">
                ✅ Compatible : <strong>YouTube</strong> (standard, shorts, embed), <strong>Cloudinary</strong>, <strong>Loom</strong>, ou lien direct <strong>.mp4 / .webm</strong>.
              </span>
              <button
                type="submit"
                disabled={savingNotice}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
              >
                {savingNotice ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                <span>Enregistrer & Publier</span>
              </button>
            </div>
          </form>
        )}

        {/* Video Player & Chapters Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Main Video Player Container (7 cols) */}
          <div className="lg:col-span-7 space-y-3">
            <div className="relative aspect-video rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-2xl group">
              {isPlaying && currentTutorial?.videoUrl ? (
                isDirectVideo ? (
                  <video
                    src={currentTutorial.videoUrl}
                    controls
                    autoPlay
                    playsInline
                    className="w-full h-full object-contain bg-black"
                  >
                    Votre navigateur ne prend pas en charge la lecture de vidéos HTML5.
                  </video>
                ) : (
                  <iframe
                    src={currentTutorial.videoUrl}
                    title={currentTutorial.title || "Tutoriel Praxis Pro"}
                    className="w-full h-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                )
              ) : (
                /* Interactive Poster with Big Play Button */
                <div className="relative w-full h-full bg-gradient-to-br from-slate-900 via-indigo-950/70 to-slate-950 flex flex-col items-center justify-center p-6 text-center select-none overflow-hidden">
                  <div className="absolute inset-0 opacity-20 pointer-events-none bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:16px_16px]" />

                  {/* Play Button */}
                  <button
                    type="button"
                    onClick={() => setIsPlaying(true)}
                    className="relative z-10 w-20 h-20 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 hover:from-blue-500 hover:to-indigo-400 text-white flex items-center justify-center shadow-2xl shadow-blue-500/50 hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer group-hover:ring-8 ring-blue-500/20"
                    aria-label="Lancer la vidéo tutoriel"
                  >
                    <Play className="w-8 h-8 ml-1 fill-white" />
                  </button>

                  <div className="relative z-10 mt-5 space-y-1">
                    <span className="text-[11px] font-extrabold uppercase tracking-widest text-blue-400">
                      {currentTutorial?.category || 'Démonstration Pratique'}
                    </span>
                    <h3 className="text-base sm:text-lg font-bold text-white max-w-md mx-auto">
                      {currentTutorial?.title}
                    </h3>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto line-clamp-2">
                      {currentTutorial?.description}
                    </p>
                  </div>

                  {/* Duration Badge */}
                  <div className="absolute bottom-3 right-3 bg-black/80 backdrop-blur-xs px-2.5 py-1 rounded-lg text-[11px] font-mono font-semibold text-slate-300 border border-white/10 flex items-center gap-1.5">
                    <Clock className="w-3 h-3 text-blue-400" />
                    <span>{currentTutorial?.duration || '03:24'} · Vidéo Complète</span>
                  </div>
                </div>
              )}
            </div>

            {/* Quick playback chapter control bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400 px-1">
              <span className="flex items-center gap-1.5 truncate mr-2">
                <Info className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                <span className="truncate">Chapitre : <strong className="text-white">{chapters[activeChapter]?.title || currentTutorial?.title}</strong></span>
              </span>
              <div className="flex items-center gap-3 shrink-0">
                <span className="font-mono text-[11px] text-blue-300">{chapters[activeChapter]?.time || '00:00'}</span>
                <a
                  href="https://youtube.com/shorts/ZXaaJzhgJCw"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-400 hover:text-blue-300 hover:underline"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>Ouvrir sur YouTube</span>
                </a>
              </div>
            </div>
          </div>

          {/* Chapters List (5 cols) */}
          <div className="lg:col-span-5 space-y-2.5">
            <div className="flex items-center justify-between pb-1">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-indigo-400" />
                <span>Sommaire du guide ({chapters.length} étapes)</span>
              </span>
              <span className="text-[11px] text-slate-500 font-medium">Cliquez pour explorer</span>
            </div>

            <div className="space-y-2">
              {chapters.map((chap, idx) => {
                const isSelected = activeChapter === idx;
                return (
                  <button
                    key={chap.id ?? idx}
                    type="button"
                    onClick={() => {
                      setActiveChapter(idx);
                      setIsPlaying(true);
                    }}
                    className={`w-full text-left p-3 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                      isSelected
                        ? 'bg-blue-950/60 border-blue-500/60 shadow-md ring-1 ring-blue-500/30'
                        : 'bg-slate-900/60 hover:bg-slate-850 border-slate-800 text-slate-300'
                    }`}
                  >
                    <div
                      className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold ${
                        isSelected
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {idx + 1}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className={`text-xs font-bold truncate ${isSelected ? 'text-white' : 'text-slate-200'}`}>
                          {chap.title}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400 shrink-0 bg-slate-800/80 px-1.5 py-0.5 rounded">
                          {chap.time}
                        </span>
                      </div>
                      {chap.desc && (
                        <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed line-clamp-2">
                          {chap.desc}
                        </p>
                      )}
                    </div>

                    <ChevronRight className={`w-4 h-4 shrink-0 mt-1 transition-transform ${isSelected ? 'text-blue-400 translate-x-0.5' : 'text-slate-600'}`} />
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* 3 Golden Rules For Flawless Correction */}
        <div className="pt-2 border-t border-slate-800/80">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Les 3 réflexes indispensables pour une correction parfaite</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 font-bold text-xs flex items-center justify-center">
                  1
                </span>
                <span className="text-xs font-bold text-white">Bon éclairage & 4 coins visibles</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Photographiez bien à plat sans ombre portée. Les applications gratuites comme <strong>CamScanner</strong> ou <strong>Adobe Scan</strong> redressent et nettoient le contraste automatiquement.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 font-bold text-xs flex items-center justify-center">
                  2
                </span>
                <span className="text-xs font-bold text-white">Barème clair ou automatique</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Plus votre consigne est précise, plus l'analyse sera rigoureuse. Si vous n'avez pas de corrigé rédigé, cochez <strong>« Barème critérié automatique »</strong> : Praxis structure la grille à votre place.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-xs flex items-center justify-center">
                  3
                </span>
                <span className="text-xs font-bold text-white">Vous gardez le dernier mot</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Praxis est un copilote pédagogique. À l'étape 4, vous pouvez ajuster n'importe quelle note au demi-point près, retoucher les commentaires et approuver avant de télécharger les fiches ou l'export Pronote.
              </p>
            </div>
          </div>
        </div>

        {/* Immediate Support Hotline Banner */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-950/60 via-slate-900 to-indigo-950/60 border border-blue-900/40 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-center sm:text-left">
            <div className="w-9 h-9 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center shrink-0">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-white">
                Un doute sur une copie difficile ou besoin d'assistance en direct ?
              </h4>
              <p className="text-xs text-slate-400">
                Contactez notre équipe pédagogique par WhatsApp au <strong>07 67 26 58 02</strong> ou par e-mail à <span className="text-blue-300 font-medium">praxis.edu0@gmail.com</span>.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <a
              href="https://wa.me/33767265802?text=Bonjour%2C%20j%27ai%20besoin%20d%27aide%20sur%20le%20fonctionnement%20de%20Praxis%20Pro"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>Aide WhatsApp</span>
            </a>
            <a
              href="mailto:praxis.edu0@gmail.com?subject=Demande%20d%27aide%20sur%20le%20fonctionnement%20Praxis%20Pro"
              className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Écrire au support</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};
