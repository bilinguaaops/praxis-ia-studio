import React from 'react';
import { ArrowLeft, MoreVertical } from 'lucide-react';

type Props = {
  title: string;      // ex. "Copie n°1" ou nom élève
  subtitle?: string;  // ex. "Maths – 6e" (optionnel)
  onBack: () => void;
  onOpenMenu: () => void;
};

export default function CorrectionMobileHeader({ title, subtitle, onBack, onOpenMenu }: Props) {
  return (
    <header className="lg:hidden sticky top-0 z-30 flex items-center gap-2 border-b border-slate-200 bg-white/95 px-2 py-2 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95 pt-[max(0.5rem,env(safe-area-inset-top))]">
      <button
        type="button"
        onClick={onBack}
        aria-label="Retour"
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-slate-700 active:bg-slate-100 dark:text-slate-200 dark:active:bg-slate-800 cursor-pointer transition-colors"
      >
        <ArrowLeft className="h-5 w-5" />
      </button>

      <div className="min-w-0 flex-1">
        <h1 className="truncate text-base font-semibold text-slate-900 dark:text-slate-50">
          {title}
        </h1>
        {subtitle && (
          <p className="truncate text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>
        )}
      </div>

      <button
        type="button"
        onClick={onOpenMenu}
        aria-label="Plus d'actions"
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-slate-700 active:bg-slate-100 dark:text-slate-200 dark:active:bg-slate-800 cursor-pointer transition-colors"
      >
        <MoreVertical className="h-5 w-5" />
      </button>
    </header>
  );
}
