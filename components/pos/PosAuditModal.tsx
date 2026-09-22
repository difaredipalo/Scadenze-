import React from 'react';
import { PosDocument } from '../../types';
import { auditPosDocument, PosAuditResult } from './posAuditHelper';
import { Icons } from '../../constants';

interface PosAuditModalProps {
  pos: PosDocument;
  onClose: () => void;
  onEditSection?: (tabKey: string) => void;
}

export const PosAuditModal: React.FC<PosAuditModalProps> = ({ pos, onClose, onEditSection }) => {
  const audit: PosAuditResult = auditPosDocument(pos);

  const getBadgeColor = (punteggio: number) => {
    if (punteggio >= 90) return 'bg-emerald-500 text-white';
    if (punteggio >= 70) return 'bg-amber-500 text-white';
    return 'bg-rose-500 text-white';
  };

  const getStatusIcon = (stato: 'ok' | 'warning' | 'missing') => {
    if (stato === 'ok') return '🟢';
    if (stato === 'warning') return '🟡';
    return '🔴';
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg ${getBadgeColor(audit.percentualeCompletamento)}`}>
              {audit.percentualeCompletamento}%
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-wide">
                  Controllo di Conformità POS
                </h3>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                  audit.statoGlobale === 'completo'
                    ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300'
                    : audit.statoGlobale === 'da_completare'
                    ? 'bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300'
                    : 'bg-rose-100 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300'
                }`}>
                  {audit.statoGlobale === 'completo' ? 'Pronto per Convalida' : audit.statoGlobale === 'da_completare' ? 'Da Perfezionare' : 'Dati Critici Mancanti'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                Verifica formale requisiti minimi obbligatori D.Lgs. 81/2008 Allegato XV
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Status Counter Bar */}
        <div className="grid grid-cols-3 divide-x divide-slate-200 dark:divide-slate-800 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 py-3 text-center">
          <div>
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 block">🟢 Completati</span>
            <span className="text-base font-black text-emerald-600 dark:text-emerald-400">{audit.conteggioOk}</span>
          </div>
          <div>
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 block">🟡 Da verificare</span>
            <span className="text-base font-black text-amber-500">{audit.conteggioWarning}</span>
          </div>
          <div>
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 block">🔴 Mancanti</span>
            <span className="text-base font-black text-rose-600 dark:text-rose-400">{audit.conteggioMissing}</span>
          </div>
        </div>

        {/* Audit Items List */}
        <div className="p-6 overflow-y-auto space-y-3 flex-1">
          {audit.items.map((item) => (
            <div
              key={item.id}
              className={`p-3.5 rounded-2xl border transition-all ${
                item.stato === 'ok'
                  ? 'bg-emerald-50/40 dark:bg-emerald-950/10 border-emerald-200 dark:border-emerald-900/40'
                  : item.stato === 'warning'
                  ? 'bg-amber-50/40 dark:bg-amber-950/10 border-amber-200 dark:border-amber-900/40'
                  : 'bg-rose-50/40 dark:bg-rose-950/10 border-rose-200 dark:border-rose-900/40'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <span className="text-base leading-tight select-none mt-0.5">{getStatusIcon(item.stato)}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
                        {item.sezione}
                      </span>
                      <span className="text-xs font-black text-slate-800 dark:text-slate-200">
                        {item.titolo}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                      {item.dettaglio}
                    </p>
                    {item.suggerimento && (
                      <p className="text-[11px] font-bold text-amber-700 dark:text-amber-400 mt-1">
                        💡 {item.suggerimento}
                      </p>
                    )}
                  </div>
                </div>

                {onEditSection && item.stato !== 'ok' && (
                  <button
                    onClick={() => {
                      onClose();
                      onEditSection(item.sezione);
                    }}
                    className="shrink-0 px-2.5 py-1 text-[11px] font-black uppercase tracking-wider rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-900/40 hover:text-blue-600 hover:border-blue-300 transition-all shadow-sm"
                  >
                    Compila
                  </button>
                )}
              </div>
            </div>
          ))}

          {/* Legal Disclaimer Box */}
          <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed mt-4">
            <strong className="text-slate-800 dark:text-slate-200 block mb-1 uppercase tracking-wider text-[10px]">
              ⚠️ Avvertenza Normativa D.Lgs. 81/2008:
            </strong>
            {audit.noteLegali}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3 bg-slate-50/50 dark:bg-slate-900/50">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-black uppercase tracking-wider hover:opacity-90 transition-opacity"
          >
            Ho Compreso / Chiudi
          </button>
        </div>
      </div>
    </div>
  );
};
