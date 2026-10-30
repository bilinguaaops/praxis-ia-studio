import React from 'react';
import { FileText, Image as ImageIcon, Layers, X, Save, ArrowLeftRight } from 'lucide-react';

export type ExportFormat = 'pdf' | 'png' | 'pdf-paginated';

type Props = {
  open: boolean;
  onClose: () => void;
  onExport: (format: ExportFormat) => void;
  onSave?: () => void;
  onSwap?: () => void;
};

const options: { id: ExportFormat; label: string; hint: string; icon: typeof FileText }[] = [
  { id: 'pdf', label: 'PDF corrigé', hint: 'Copie annotée, tous les détails visibles', icon: FileText },
  { id: 'png', label: 'Image (.png)', hint: 'Capture haute définition', icon: ImageIcon },
  { id: 'pdf-paginated', label: 'PDF paginé (A4)', hint: 'Pour impression ou archivage', icon: Layers },
];

export default function ExportSheet({ open, onClose, onExport, onSave, onSwap }: Props) {
  if (!open) return null;

  return (
    <div className="lg:hidden fixed inset-0 z-50">
      <button
        type="button"
        aria-label="Fermer"
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
      />

      <div className="absolute inset-x-0 bottom-0 rounded-t-2xl bg-white p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-2xl dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 animate-in slide-in-from-bottom duration-200">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50">Options & Export</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-500 active:bg-slate-100 dark:text-slate-400 dark:active:bg-slate-800 cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <ul className="space-y-2">
          {options.map(({ id, label, hint, icon: Icon }) => (
            <li key={id}>
              <button
                type="button"
                onClick={() => {
                  onExport(id);
                  onClose();
                }}
                className="flex min-h-14 w-full items-center gap-3 rounded-xl border border-slate-200 px-3 py-3 text-left active:bg-slate-50 dark:border-slate-700 dark:active:bg-slate-800 cursor-pointer transition-colors"
              >
                <Icon className="h-5 w-5 shrink-0 text-slate-600 dark:text-slate-300" />
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-slate-900 dark:text-slate-50">{label}</span>
                  <span className="block truncate text-xs text-slate-500 dark:text-slate-400">{hint}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>

        {onSwap && (
          <button
            type="button"
            onClick={() => {
              onSwap();
              onClose();
            }}
            className="mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-amber-300 bg-amber-50 text-sm font-semibold text-amber-900 active:bg-amber-100 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-200 dark:active:bg-amber-900/60 cursor-pointer"
          >
            <ArrowLeftRight className="h-4 w-4" />
            Intervertir avec une autre copie
          </button>
        )}

        {onSave && (
          <button
            type="button"
            onClick={() => {
              onSave();
              onClose();
            }}
            className="mt-2.5 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 text-sm font-semibold text-white active:bg-blue-700 cursor-pointer shadow-sm"
          >
            <Save className="h-4 w-4" />
            Enregistrer les modifications
          </button>
        )}
      </div>
    </div>
  );
}
