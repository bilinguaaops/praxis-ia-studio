import React from 'react';
import { FileText, Image as ImageIcon, Layers, X, Save, ArrowLeftRight, Printer, Download, Sparkles } from 'lucide-react';

export type ExportFormat = 'pdf' | 'png' | 'pdf-paginated' | 'print';

type Props = {
  open: boolean;
  onClose: () => void;
  onExport: (format: ExportFormat) => void;
  onSave?: () => void;
  onSwap?: () => void;
};

const options: {
  id: ExportFormat;
  label: string;
  hint: string;
  icon: typeof FileText;
  badge?: string;
  badgeColor?: string;
  iconBg: string;
  iconColor: string;
}[] = [
  {
    id: 'pdf',
    label: 'Télécharger la copie en PDF',
    hint: 'Copie annotée intégrale avec notes et remarques officielles',
    icon: Download,
    badge: 'Recommandé',
    badgeColor: 'bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300 border-blue-200 dark:border-blue-700',
    iconBg: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300',
    iconColor: 'text-blue-600 dark:text-blue-400',
  },
  {
    id: 'print',
    label: 'Imprimer directement la fiche élève',
    hint: 'Mise en page optimisée pour imprimante ou archivage papier (A4)',
    icon: Printer,
    badge: 'Imprimante',
    badgeColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700',
    iconBg: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
  },
  {
    id: 'png',
    label: 'Télécharger l\'image HD (.png)',
    hint: 'Capture visuelle nette de la copie pour WhatsApp ou partage',
    icon: ImageIcon,
    iconBg: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300',
    iconColor: 'text-indigo-600 dark:text-indigo-400',
  },
  {
    id: 'pdf-paginated',
    label: 'PDF paginé multi-pages (A4)',
    hint: 'Découpage propre page par page avec barème séparé',
    icon: Layers,
    iconBg: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300',
    iconColor: 'text-amber-600 dark:text-amber-400',
  },
];

export default function ExportSheet({ open, onClose, onExport, onSave, onSwap }: Props) {
  if (!open) return null;

  return (
    <div className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end">
      <button
        type="button"
        aria-label="Fermer"
        onClick={onClose}
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity"
      />

      <div className="relative z-10 rounded-t-3xl bg-white p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-2xl dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 animate-in slide-in-from-bottom duration-250 max-h-[90vh] overflow-y-auto">
        {/* Pull handle indicator */}
        <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mb-4" />

        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-50 flex items-center gap-2">
              <span>Télécharger & Imprimer</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Choisissez le format d'export adapté à votre besoin
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 active:bg-slate-200 dark:text-slate-400 dark:hover:bg-slate-800 cursor-pointer transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-2.5">
          {options.map(({ id, label, hint, icon: Icon, badge, badgeColor, iconBg, iconColor }) => (
            <button
              key={id}
              type="button"
              onClick={() => {
                onExport(id);
                onClose();
              }}
              className="group flex min-h-16 w-full items-center gap-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 hover:bg-white active:bg-blue-50/50 dark:bg-slate-850 dark:hover:bg-slate-800 p-3.5 text-left cursor-pointer transition-all shadow-xs"
            >
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${iconBg} shadow-xs`}>
                <Icon className={`h-5 w-5 ${iconColor}`} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="block text-sm font-bold text-slate-900 dark:text-slate-50 leading-tight">
                    {label}
                  </span>
                  {badge && (
                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md border ${badgeColor}`}>
                      {badge}
                    </span>
                  )}
                </div>
                <span className="block text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1 leading-normal">
                  {hint}
                </span>
              </div>
            </button>
          ))}
        </div>

        {/* Secondary options */}
        {(onSwap || onSave) && (
          <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
            {onSwap && (
              <button
                type="button"
                onClick={() => {
                  onSwap();
                  onClose();
                }}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-amber-300 bg-amber-50 text-xs sm:text-sm font-bold text-amber-900 active:bg-amber-100 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-200 cursor-pointer"
              >
                <ArrowLeftRight className="h-4 w-4" />
                <span>Intervertir cette copie avec un autre élève</span>
              </button>
            )}

            {onSave && (
              <button
                type="button"
                onClick={() => {
                  onSave();
                  onClose();
                }}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs sm:text-sm font-bold text-white active:bg-blue-700 cursor-pointer shadow-sm"
              >
                <Save className="h-4 w-4" />
                <span>Enregistrer les modifications</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
