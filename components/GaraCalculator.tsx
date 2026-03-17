
import React, { useState } from 'react';

const GaraCalculator: React.FC = () => {
  const [ribassabile, setRibassabile] = useState<number>(0);
  const [sicurezza, setSicurezza] = useState<number>(0);
  const [manodopera, setManodopera] = useState<number>(0);
  const [sconto, setSconto] = useState<number>(0);

  const calcolaRisultati = () => {
    const importoRibassato = ribassabile * (1 - sconto / 100);
    const importoContrattuale = importoRibassato + sicurezza + manodopera;
    const risparmio = ribassabile - importoRibassato;
    const totaleBase = ribassabile + sicurezza + manodopera;

    // Calcolo Sconto Consigliato (Heuristic)
    // Più alta è l'incidenza di manodopera e sicurezza, più basso dovrebbe essere lo sconto
    // per mantenere un margine operativo.
    const incidenzaCostiFissi = totaleBase > 0 ? ((manodopera + sicurezza) / totaleBase) * 100 : 0;
    let scontoConsigliato = 0;
    
    if (totaleBase > 0) {
      // Esempio di logica: partiamo da un 25% teorico e scendiamo in base ai costi fissi
      // Se i costi fissi sono il 40%, lo sconto consigliato scende.
      scontoConsigliato = Math.max(5, 30 - (incidenzaCostiFissi * 0.4));
    }

    return {
      importoRibassato,
      importoContrattuale,
      risparmio,
      totaleBase,
      scontoConsigliato
    };
  };

  const risultati = calcolaRisultati();

  const inputClasses = "w-full p-4 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none text-slate-900 dark:text-white font-bold placeholder:text-slate-300 transition-all";

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight uppercase">Calcolatore Ribassi Gara</h2>
        <p className="text-slate-500 dark:text-slate-400 font-bold">Strumento per il calcolo rapido dell'offerta economica</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input Section */}
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm space-y-6">
          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Importo Soggetto a Ribasso (€)</label>
            <input 
              type="number" 
              step="0.01" 
              value={ribassabile || ''} 
              onChange={(e) => setRibassabile(Number(e.target.value))} 
              className={inputClasses}
              placeholder="Es: 100000"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Oneri Sicurezza (€)</label>
              <input 
                type="number" 
                step="0.01" 
                value={sicurezza || ''} 
                onChange={(e) => setSicurezza(Number(e.target.value))} 
                className={inputClasses}
                placeholder="Es: 5000"
              />
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Manodopera (€)</label>
              <input 
                type="number" 
                step="0.01" 
                value={manodopera || ''} 
                onChange={(e) => setManodopera(Number(e.target.value))} 
                className={inputClasses}
                placeholder="Es: 30000"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-end ml-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Percentuale di Ribasso (%)</label>
              <div className="flex items-center gap-2">
                <input 
                  type="number" 
                  step="0.001" 
                  value={sconto || ''} 
                  onChange={(e) => setSconto(Number(e.target.value))} 
                  className="w-24 p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-right font-black text-blue-600 dark:text-blue-400 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                />
                <span className="font-black text-slate-300">%</span>
              </div>
            </div>
            
            <div className="px-1">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Regola il ribasso</span>
                {risultati.scontoConsigliato > 0 && (
                  <button 
                    onClick={() => setSconto(Number(risultati.scontoConsigliato.toFixed(3)))}
                    className="text-[9px] font-black text-emerald-500 hover:text-emerald-600 uppercase tracking-widest bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded-lg transition-all"
                  >
                    Consigliato: {risultati.scontoConsigliato.toFixed(2)}%
                  </button>
                )}
              </div>
              <input 
                type="range" 
                min="0" 
                max="50" 
                step="0.001" 
                value={sconto} 
                onChange={(e) => setSconto(Number(e.target.value))} 
                className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full appearance-none cursor-pointer accent-blue-600 hover:accent-blue-500 transition-all"
              />
              <div className="flex justify-between text-[9px] font-black text-slate-300 uppercase mt-2">
                <span>0%</span>
                <span>12.5%</span>
                <span>25%</span>
                <span>37.5%</span>
                <span>50%</span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-50 dark:border-slate-800">
             <div className="flex justify-between items-center text-slate-500 dark:text-slate-400">
                <span className="text-xs font-bold uppercase tracking-widest">Totale Base d'Asta</span>
                <span className="text-lg font-black">€ {risultati.totaleBase.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
             </div>
          </div>
        </div>

        {/* Results Section */}
        <div className="space-y-6">
          <div className="bg-slate-900 dark:bg-blue-600 p-8 rounded-[2.5rem] text-white shadow-xl shadow-blue-500/10 flex flex-col justify-between h-full min-h-[300px]">
            <div className="space-y-1">
              <span className="text-[10px] font-black text-slate-400 dark:text-blue-200 uppercase tracking-widest">Importo Contrattuale Totale</span>
              <h3 className="text-5xl font-black tracking-tighter">€ {risultati.importoContrattuale.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h3>
              <p className="text-xs text-slate-500 dark:text-blue-100 font-medium italic mt-2">Valore totale del contratto (Lavori + Sicurezza + Manodopera)</p>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-8 pt-8 border-t border-white/10">
              <div className="space-y-1">
                <span className="text-[9px] font-black text-slate-400 dark:text-blue-200 uppercase tracking-widest">Netto Lavori Ribassato</span>
                <p className="text-xl font-black">€ {risultati.importoRibassato.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
              </div>
              <div className="space-y-1">
                <span className="text-[9px] font-black text-slate-400 dark:text-blue-200 uppercase tracking-widest">Risparmio Ente</span>
                <p className="text-xl font-black text-emerald-400">€ {risultati.risparmio.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-slate-900/50 p-6 rounded-3xl border border-blue-100 dark:border-slate-800">
            <div className="flex gap-4 items-start">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-2xl text-blue-600">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">Nota sul calcolo</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                  Il ribasso si applica solo alla quota lavori. Gli oneri di sicurezza e il costo della manodopera sono sottratti dal ribasso (non ribassabili) e vengono aggiunti per intero all'importo netto per determinare il valore contrattuale.
                  <br /><br />
                  <strong className="text-emerald-600 dark:text-emerald-400">Sconto Consigliato:</strong> Viene calcolato in base all'incidenza dei costi fissi (Manodopera + Sicurezza). Più questi costi sono alti rispetto al totale, più lo sconto suggerito diminuisce per preservare il margine operativo dell'impresa.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GaraCalculator;
