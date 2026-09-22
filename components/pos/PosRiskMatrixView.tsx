import React, { useState } from 'react';
import {
  MATRICE_RISCHIO_4X4,
  CRITERI_PROBABILITA,
  CRITERI_DANNO,
  CLASSI_RISCHIO_DEF,
  CALCOLA_RISCHIO,
} from '../../data/posDefaultData';

export const PosRiskMatrixView: React.FC = () => {
  const [testP, setTestP] = useState<number>(2);
  const [testD, setTestD] = useState<number>(3);

  const testResult = CALCOLA_RISCHIO(testP, testD);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Intestazione Capitolo */}
      <div className="p-4 rounded-2xl bg-blue-50/50 dark:bg-slate-800 border border-blue-200 dark:border-slate-700">
        <div className="flex items-center gap-2 mb-1">
          <span className="px-2 py-0.5 rounded bg-blue-600 text-white font-black text-[10px] uppercase tracking-wider">
            CAPITOLO 6
          </span>
          <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-tight text-sm">
            CRITERI E METODOLOGIA DI VALUTAZIONE DEI RISCHI
          </h3>
        </div>
        <p className="text-xs text-slate-600 dark:text-slate-400">
          Definizione degli standard metodologici adottati per la quantificazione e la classificazione dell'entità dei rischi di cantiere in conformità all'art. 28 e Titolo IV del D.Lgs. 81/2008.
        </p>
      </div>

      {/* 6.1 e 6.2 Metodologia di calcolo */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 space-y-2">
          <h4 className="font-black text-xs uppercase text-slate-900 dark:text-white">
            6.1 Criteri di Identificazione dei Pericoli
          </h4>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            I pericoli associati a ciascuna lavorazione vengono censiti tenendo conto della natura delle attività, delle interferenze logistiche, dell'utilizzo di attrezzature, dell'impiego di sostanze chimiche e della presenza di opere provvisionali.
          </p>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 space-y-2">
          <h4 className="font-black text-xs uppercase text-slate-900 dark:text-white">
            6.2 Algoritmo di Stima: R = P × D
          </h4>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            L'indice di rischio <strong>R</strong> è determinato come prodotto tra la <strong>Probabilità (P)</strong> di accadimento dell'evento lesivo e l'entità del <strong>Danno (D)</strong> atteso: <span className="font-mono font-bold text-blue-600 dark:text-blue-400">R = P × D</span>.
          </p>
        </div>
      </div>

      {/* 6.3 e 6.4 Scale di Probabilità e Gravità Danno */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Scala Probabilità */}
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 space-y-3">
          <h4 className="font-black text-xs uppercase text-slate-900 dark:text-white flex items-center justify-between">
            <span>6.3 Definizione Livelli di Probabilità (P)</span>
            <span className="text-[10px] font-bold text-slate-400">Scala 1 - 4</span>
          </h4>
          <div className="space-y-2">
            {CRITERI_PROBABILITA.map(p => (
              <div key={p.livello} className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 text-xs flex items-start gap-2">
                <span className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-300 font-black text-xs flex items-center justify-center shrink-0">
                  {p.livello}
                </span>
                <div>
                  <strong className="text-slate-900 dark:text-white block">{p.nome}</strong>
                  <span className="text-slate-500 dark:text-slate-400 text-[11px]">{p.descrizione}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Scala Danno */}
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 space-y-3">
          <h4 className="font-black text-xs uppercase text-slate-900 dark:text-white flex items-center justify-between">
            <span>6.4 Definizione Livelli Gravità Danno (D)</span>
            <span className="text-[10px] font-bold text-slate-400">Scala 1 - 4</span>
          </h4>
          <div className="space-y-2">
            {CRITERI_DANNO.map(d => (
              <div key={d.livello} className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 text-xs flex items-start gap-2">
                <span className="w-6 h-6 rounded-full bg-rose-100 dark:bg-rose-900/60 text-rose-800 dark:text-rose-300 font-black text-xs flex items-center justify-center shrink-0">
                  {d.livello}
                </span>
                <div>
                  <strong className="text-slate-900 dark:text-white block">{d.nome}</strong>
                  <span className="text-slate-500 dark:text-slate-400 text-[11px]">{d.descrizione}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 6.5 Matrice del Rischio 4x4 */}
      <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-black text-xs uppercase text-slate-900 dark:text-white">
              6.5 Matrice del Rischio (Tabella 4 × 4)
            </h4>
            <p className="text-[11px] text-slate-500">
              Incrocio dei valori di Probabilità (righe) e Danno (colonne).
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-slate-300 dark:border-slate-700 text-xs">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-700/80 text-slate-900 dark:text-white">
                <th className="p-2.5 border border-slate-300 dark:border-slate-700 text-left font-black">
                  Probabilità (P) \ Danno (D)
                </th>
                <th className="p-2.5 border border-slate-300 dark:border-slate-700 text-center font-bold">D1: Lieve</th>
                <th className="p-2.5 border border-slate-300 dark:border-slate-700 text-center font-bold">D2: Medio</th>
                <th className="p-2.5 border border-slate-300 dark:border-slate-700 text-center font-bold">D3: Grave</th>
                <th className="p-2.5 border border-slate-300 dark:border-slate-700 text-center font-bold">D4: Gravissimo</th>
              </tr>
            </thead>
            <tbody>
              {MATRICE_RISCHIO_4X4.map(row => (
                <tr key={row.probabilita} className="border-b border-slate-200 dark:border-slate-700">
                  <td className="p-2.5 border border-slate-300 dark:border-slate-700 font-bold bg-slate-50 dark:bg-slate-800">
                    P{row.probabilita} - {row.nomeProbabilita}
                  </td>
                  {row.celle.map(cell => (
                    <td
                      key={cell.danno}
                      className={`p-2.5 border border-slate-300 dark:border-slate-700 text-center font-black ${
                        cell.classeRischio === 'Basso' ? 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300' :
                        cell.classeRischio === 'Accettabile' ? 'bg-blue-100 text-blue-900 dark:bg-blue-950/40 dark:text-blue-300' :
                        cell.classeRischio === 'Notevole' ? 'bg-amber-100 text-amber-900 dark:bg-amber-950/40 dark:text-amber-300' :
                        'bg-rose-100 text-rose-900 dark:bg-rose-950/40 dark:text-rose-300'
                      }`}
                    >
                      <div className="text-sm">{cell.livelloRischio}</div>
                      <div className="text-[10px] font-normal uppercase opacity-80">{cell.classeRischio}</div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Criteri di Priorità d'Intervento */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
          {CLASSI_RISCHIO_DEF.map(c => (
            <div
              key={c.classe}
              className={`p-3 rounded-xl border text-xs space-y-1 ${
                c.classe === 'Accettabile' ? 'border-emerald-300 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-950 dark:text-emerald-200' :
                c.classe === 'Notevole' ? 'border-amber-300 bg-amber-50/50 dark:bg-amber-950/20 text-amber-950 dark:text-amber-200' :
                c.classe === 'Elevato' ? 'border-orange-300 bg-orange-50/50 dark:bg-orange-950/20 text-orange-950 dark:text-orange-200' :
                'border-rose-300 bg-rose-50/50 dark:bg-rose-950/20 text-rose-950 dark:text-rose-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <strong className="font-black uppercase">{c.classe}</strong>
                <span className="font-bold text-[10px]">R: {c.intervallo}</span>
              </div>
              <p className="text-[11px] leading-snug">{c.criterioAzione}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Simulatore / Calcolatore Interattivo */}
      <div className="p-4 rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/40 dark:bg-slate-800/70 space-y-3">
        <h4 className="font-black text-xs uppercase text-blue-900 dark:text-blue-300">
          Simulatore Interattivo di Rischio (Test Rapido)
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">Probabilità (P)</label>
            <select
              value={testP}
              onChange={e => setTestP(Number(e.target.value))}
              className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            >
              <option value={1} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">1 - Improbabile</option>
              <option value={2} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">2 - Poco probabile</option>
              <option value={3} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">3 - Probabile</option>
              <option value={4} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">4 - Altamente probabile</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">Danno (D)</label>
            <select
              value={testD}
              onChange={e => setTestD(Number(e.target.value))}
              className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            >
              <option value={1} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">1 - Lieve</option>
              <option value={2} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">2 - Medio</option>
              <option value={3} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">3 - Grave</option>
              <option value={4} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">4 - Gravissimo</option>
            </select>
          </div>

          <div className="flex items-center gap-3 p-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
            <div>
              <span className="text-[10px] text-slate-400 dark:text-slate-400 block font-bold">Risultato Calcolato:</span>
              <strong className="text-sm font-black text-slate-900 dark:text-white">
                R = {testP} × {testD} = {testResult.livello}
              </strong>
            </div>
            <span className={`px-2.5 py-1 rounded text-xs font-black uppercase ${
              testResult.classe === 'Accettabile' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800' :
              testResult.classe === 'Notevole' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-800' :
              testResult.classe === 'Elevato' ? 'bg-orange-100 text-orange-800 dark:bg-orange-950/60 dark:text-orange-300 border border-orange-300 dark:border-orange-800' :
              'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
            }`}>
              {testResult.classe}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
