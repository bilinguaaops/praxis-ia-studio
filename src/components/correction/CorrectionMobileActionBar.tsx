import React from 'react';
import { CheckCircle2, Download } from 'lucide-react';

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
    <div className="md:hidden fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 px-3 pt-3 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onDownload}
          className="flex h-12 items-center justify-center gap-2 rounded-xl border border-slate-300 px-4 text-sm font-medium text-slate-700 active:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:active:bg-slate-800 cursor-pointer transition-colors"
        >
          <Download className="h-4 w-4" />
          Export
        </button>

        <button
          type="button"
          onClick={onValidate}
          disabled={validated || busy}
          className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white active:bg-emerald-700 disabled:bg-slate-300 disabled:text-slate-600 dark:disabled:bg-slate-700 dark:disabled:text-slate-400 cursor-pointer disabled:cursor-not-allowed transition-all"
        >
          <CheckCircle2 className="h-5 w-5" />
          {validated ? 'Copie validée' : busy ? 'Enregistrement…' : 'Valider la copie'}
        </button>
      </div>
    </div>
  );
}
