import React from 'react';
import { ArrowLeft, MoreVertical, Download, Printer } from 'lucide-react';

type Props = {
  title: string;      // ex. "Copie n°1" ou nom élève
  subtitle?: string;  // ex. "Maths – 6e" (optionnel)
  onBack: () => void;
  onOpenMenu: () => void;
  onDownload?: () => void;
};

export default function CorrectionMobileHeader({ title, subtitle, onBack, onOpenMenu, onDownload }: Props) {
  return (
    <header className="lg:hidden sticky top-0 z-30 flex items-center gap-2 border-b border-slate-200 bg-white/95 px-2.5 py-2.5 backdrop-blur shadow-xs dark:border-slate-800 dark:bg-slate-950/95 pt-[max(0.6rem,env(safe-area-inset-top))]">
      <button
        type="button"
        onClick={onBack}
        aria-label="Retour"
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-slate-700 hover:bg-slate-100 active:bg-slate-200 dark:text-slate-200 dark:active:bg-slate-800 cursor-pointer transition-colors border border-slate-200/80 dark:border-slate-800"
      >
        <ArrowLeft className="h-5 w-5" />
      </button>

      <div className="min-w-0 flex-1 pl-1">
        <h1 className="truncate text-sm sm:text-base font-bold text-slate-900 dark:text-slate-50 leading-tight">
          {title}
        </h1>
        {subtitle && (
          <p className="truncate text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>
        )}
      </div>

      {/* Quick Download / Print header action */}
      <button
        type="button"
        onClick={onDownload || onOpenMenu}
        id="btn-header-quick-download"
        className="flex h-10 items-center gap-1.5 px-3 rounded-xl bg-blue-600 text-white font-bold text-xs shadow-xs hover:bg-blue-700 active:scale-95 transition-all cursor-pointer shrink-0"
        title="Télécharger / Imprimer la copie"
      >
        <Download className="h-3.5 w-3.5" />
        <span className="text-[11px]">Export / Imprimer</span>
      </button>

      <button
        type="button"
        onClick={onOpenMenu}
        aria-label="Plus d'actions"
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-slate-700 hover:bg-slate-100 active:bg-slate-200 dark:text-slate-200 dark:active:bg-slate-800 cursor-pointer transition-colors border border-slate-200/80 dark:border-slate-800"
      >
        <MoreVertical className="h-4 w-4" />
      </button>
    </header>
  );
}
