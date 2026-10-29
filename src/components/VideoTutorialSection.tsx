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
} from 'lucide-react';

interface VideoTutorialSectionProps {
  onStartCorrection?: () => void;
  onOpenContact?: () => void;
  defaultExpanded?: boolean;
}

interface Chapter {
  id: number;
  time: string;
  title: string;
  desc: string;
  icon: React.ElementType;
}

export const VideoTutorialSection: React.FC<VideoTutorialSectionProps> = ({
  onStartCorrection,
  onOpenContact,
  defaultExpanded = true,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeChapter, setActiveChapter] = useState(0);
  const [isEditingUrl, setIsEditingUrl] = useState(false);
  const [customVideoUrl, setCustomVideoUrl] = useState<string>(() => {
    try {
      return (
        localStorage.getItem('praxis_tutorial_video_url') ||
        'https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1'
      );
    } catch {
      return '';
    }
  });
  const [urlInput, setUrlInput] = useState(customVideoUrl);

  const chapters: Chapter[] = [
    {
      id: 0,
      time: '00:00',
      title: 'Présentation & Connexion',
      desc: 'Découvrez l’interface, votre solde de crédits offerts et l’accès à votre espace enseignant.',
      icon: Sparkles,
    },
    {
      id: 1,
      time: '00:45',
      title: 'Étape 1 · Sujet & Barème',
      desc: 'Saisissez l’énoncé, collez votre texte ou laissez l’IA générer un barème critérié sur 20.',
      icon: FileCheck2,
    },
    {
      id: 2,
      time: '01:30',
      title: 'Étape 2 · Numérisation Smartphone',
      desc: 'Photographiez ou scannez les copies manuscrites avec CamScanner ou l’appareil photo.',
      icon: Camera,
    },
    {
      id: 3,
      time: '02:15',
      title: 'Étape 3 · Analyse & Vision IA',
      desc: 'Double moteur IA haute disponibilité : lecture manuscrite et citations exactes de l’élève.',
      icon: Layers,
    },
    {
      id: 4,
      time: '03:00',
      title: 'Étape 4 · Révision & Export Pronote',
      desc: 'Ajustez les notes à votre convenance en 1 clic et téléchargez les fiches ou le CSV notes.',
      icon: CheckCircle2,
    },
  ];

  const handleSaveVideoUrl = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = urlInput.trim();
    // Convert regular youtube watch URL to embed if needed
    let embedUrl = clean;
    if (clean.includes('youtube.com/watch?v=')) {
      const videoId = clean.split('v=')[1]?.split('&')[0];
      if (videoId) embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1`;
    } else if (clean.includes('youtu.be/')) {
      const videoId = clean.split('youtu.be/')[1]?.split('?')[0];
      if (videoId) embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1`;
    } else if (clean.includes('loom.com/share/')) {
      embedUrl = clean.replace('loom.com/share/', 'loom.com/embed/');
    }

    setCustomVideoUrl(embedUrl);
    try {
      localStorage.setItem('praxis_tutorial_video_url', embedUrl);
    } catch {}
    setIsEditingUrl(false);
  };

  return (
    <section className="bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-6 sm:p-8 text-white shadow-2xl relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-10 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 space-y-6">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-500/20 text-blue-300 border border-blue-400/30">
              <Video className="w-3.5 h-3.5" />
              <span>Guide Vidéo & Prise en Main Rapide</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
              Comment corriger vos copies avec Praxis Pro ?
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 max-w-2xl">
              Suivez ce guide vidéo de 3 minutes pour apprendre à numériser vos copies au smartphone, configurer votre sujet et obtenir des corrections détaillées.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setIsEditingUrl(!isEditingUrl)}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-xl border border-slate-700 transition flex items-center gap-1.5 cursor-pointer"
              title="Personnaliser le lien de la vidéo YouTube / Loom"
            >
              <Edit3 className="w-3.5 h-3.5 text-blue-400" />
              <span>Lien vidéo</span>
            </button>
            {onStartCorrection && (
              <button
                type="button"
                onClick={onStartCorrection}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-600/30 transition flex items-center gap-1.5 cursor-pointer"
              >
                <span>Démarrer</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Video URL Edit Form (Optional Admin / User override) */}
        {isEditingUrl && (
          <form
            onSubmit={handleSaveVideoUrl}
            className="p-4 bg-slate-850 border border-blue-500/40 rounded-2xl space-y-3 animate-in fade-in"
          >
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Video className="w-4 h-4 text-blue-400" />
                <span>Collez l'URL de votre vidéo explicative (YouTube, Loom, Vimeo, MP4) :</span>
              </label>
              <button
                type="button"
                onClick={() => setIsEditingUrl(false)}
                className="text-xs text-slate-400 hover:text-white"
              >
                Fermer
              </button>
            </div>
            <div className="flex gap-2">
              <input
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="Ex: https://www.youtube.com/watch?v=... ou https://www.loom.com/share/..."
                className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-blue-500"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Enregistrer
              </button>
            </div>
            <p className="text-[11px] text-slate-400">
              💡 Cette URL sera automatiquement intégrée dans le lecteur ci-dessous pour tous vos enseignants.
            </p>
          </form>
        )}

        {/* Video & Chapters Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Main Video Player Container (7 cols) */}
          <div className="lg:col-span-7 space-y-3">
            <div className="relative aspect-video rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-2xl group">
              {isPlaying && customVideoUrl ? (
                <iframe
                  src={customVideoUrl}
                  title="Tutoriel Praxis Pro"
                  className="w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                /* Interactive High-Fidelity Video Walkthrough Poster */
                <div className="relative w-full h-full bg-gradient-to-br from-slate-900 via-indigo-950/60 to-slate-950 flex flex-col items-center justify-center p-6 text-center select-none overflow-hidden">
                  {/* Visual mockup backdrop */}
                  <div className="absolute inset-0 opacity-20 pointer-events-none bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:16px_16px]" />

                  {/* Play Button Badge */}
                  <button
                    type="button"
                    onClick={() => setIsPlaying(true)}
                    className="relative z-10 w-20 h-20 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 hover:from-blue-500 hover:to-indigo-400 text-white flex items-center justify-center shadow-2xl shadow-blue-500/50 hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer group-hover:ring-8 ring-blue-500/20"
                    aria-label="Lancer la vidéo tutoriel"
                  >
                    <Play className="w-8 h-8 ml-1 fill-white" />
                  </button>

                  <div className="relative z-10 mt-5 space-y-1">
                    <span className="text-xs font-extrabold uppercase tracking-widest text-blue-400">
                      Démonstration Pédagogique
                    </span>
                    <h3 className="text-base sm:text-lg font-bold text-white">
                      De la copie papier à la fiche de note en 3 minutes
                    </h3>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto">
                      Cliquez pour lancer le guide vidéo interactif avec chapitres explicatifs.
                    </p>
                  </div>

                  {/* Duration Badge */}
                  <div className="absolute bottom-3 right-3 bg-black/80 backdrop-blur-xs px-2.5 py-1 rounded-lg text-[11px] font-mono font-semibold text-slate-300 border border-white/10 flex items-center gap-1.5">
                    <Clock className="w-3 h-3 text-blue-400" />
                    <span>03:24 · Vidéo Complète</span>
                  </div>
                </div>
              )}
            </div>

            {/* Quick playback chapter control bar */}
            <div className="flex items-center justify-between text-xs text-slate-400 px-1">
              <span className="flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-blue-400" />
                <span>Chapitre actuel : <strong className="text-white">{chapters[activeChapter]?.title}</strong></span>
              </span>
              <span className="font-mono text-[11px] text-blue-300">{chapters[activeChapter]?.time}</span>
            </div>
          </div>

          {/* Chapters List (5 cols) */}
          <div className="lg:col-span-5 space-y-2.5">
            <div className="flex items-center justify-between pb-1">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-indigo-400" />
                <span>Sommaire du tutoriel (5 étapes)</span>
              </span>
              <span className="text-[11px] text-slate-500 font-medium">Cliquez pour explorer</span>
            </div>

            <div className="space-y-2">
              {chapters.map((chap, idx) => {
                const Icon = chap.icon;
                const isSelected = activeChapter === idx;
                return (
                  <button
                    key={chap.id}
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
                      className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                        isSelected
                          ? 'bg-blue-600 text-white font-bold'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
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
                      <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed line-clamp-2">
                        {chap.desc}
                      </p>
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
            {/* Rule 1 */}
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 font-bold text-xs flex items-center justify-center">
                  1
                </span>
                <span className="text-xs font-bold text-white">Bon éclairage & 4 coins visibles</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Photographiez bien à plat sans ombre portée de la main. Les applications gratuites comme <strong>CamScanner</strong> ou <strong>Adobe Scan</strong> redressent et nettoient le contraste automatiquement.
              </p>
            </div>

            {/* Rule 2 */}
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 font-bold text-xs flex items-center justify-center">
                  2
                </span>
                <span className="text-xs font-bold text-white">Barème clair ou automatique</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Plus votre consigne est précise, plus l'analyse sera rigoureuse. Si vous n'avez pas de corrigé rédigé, cochez l'option <strong>« Barème critérié automatique »</strong> : Praxis structure la grille à votre place.
              </p>
            </div>

            {/* Rule 3 */}
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
                Contactez notre équipe pédagogique par WhatsApp ou e-mail officiel à <span className="text-blue-300 font-medium">praxis.edu0@gmail.com</span>.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <a
              href="https://wa.me/2250103890314?text=Bonjour%2C%20j%27ai%20besoin%20d%27aide%20sur%20le%20fonctionnement%20de%20Praxis%20Pro"
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
