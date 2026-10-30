import React from 'react';
import { CheckCircle2, Download, Printer } from 'lucide-react';

type Props = {
  validated: boolean;
  busy?: boolean;
  onValidate: () => void;
  onDownload: () => void;
};

export default function CorrectionMobileActionBar({
  validated,
  busy = false,
  onValidate,
  onDownload,
}: Props) {
  return (
    <div className="lg:hidden fixed inset-x-0 bottom-0 z-40 border-t border-slate-200/90 bg-white/95 px-3.5 pt-3 pb-[max(0.85rem,env(safe-area-inset-bottom))] backdrop-blur-md shadow-[0_-8px_24px_rgba(0,0,0,0.08)] dark:border-slate-800 dark:bg-slate-950/95">
      <div className="flex items-center gap-2.5 max-w-lg mx-auto">
        {/* Télécharger / Imprimer - Bouton Principal Très Visible */}
        <button
          type="button"
          onClick={onDownload}
          id="btn-mobile-download-print"
          className="flex-1 flex h-13 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 px-4 text-white text-xs sm:text-sm font-extrabold shadow-lg shadow-blue-500/25 active:scale-[0.98] transition-all cursor-pointer border border-blue-400/30"
          title="Télécharger ou imprimer la copie corrigée"
        >
          <div className="flex items-center gap-1.5 shrink-0">
            <Download className="h-4 w-4" />
            <span className="opacity-60 text-xs">/</span>
            <Printer className="h-4 w-4" />
          </div>
          <span className="tracking-tight">Télécharger / Imprimer</span>
        </button>

        {/* Valider la copie */}
        <button
          type="button"
          onClick={onValidate}
          disabled={validated || busy}
          id="btn-mobile-validate-copy"
          className={`flex h-13 shrink-0 items-center justify-center gap-1.5 rounded-2xl px-3.5 sm:px-4 text-xs font-bold transition-all cursor-pointer ${
            validated
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-300 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800 cursor-default'
              : busy
              ? 'bg-slate-200 text-slate-500 cursor-wait'
              : 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20 active:scale-[0.98] active:bg-emerald-700 hover:bg-emerald-500'
          }`}
          title={validated ? 'Cette copie a été validée' : 'Valider définitivement la note'}
        >
          <CheckCircle2 className="h-4 w-4 shrink-0 text-current" />
          <span className="whitespace-nowrap">
            {validated ? 'Validée ✓' : busy ? 'En cours…' : 'Valider'}
          </span>
        </button>
      </div>
    </div>
  );
}
