
import React, { useState, useEffect } from 'react';
import { Mezzo, Manutenzione, MezzoStato } from '../types';

interface EditMezzoModalProps {
  isOpen: boolean;
  mezzo: Mezzo | null;
  onClose: () => void;
  onSave: (updated: Mezzo) => void;
}

const EditMezzoModal: React.FC<EditMezzoModalProps> = ({ isOpen, mezzo, onClose, onSave }) => {
  const [formData, setFormData] = useState<Partial<Mezzo>>({});
  const [activeTab, setActiveTab] = useState<'generale' | 'scadenze' | 'manutenzione'>('generale');

  useEffect(() => {
    if (mezzo) setFormData({ ...mezzo, storicoManutenzioni: mezzo.storicoManutenzioni || [] });
  }, [mezzo]);

  if (!isOpen || !mezzo) return null;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const updateManutenzione = (index: number, updates: Partial<Manutenzione>) => {
    const list = [...(formData.storicoManutenzioni || [])];
    list[index] = { ...list[index], ...updates };
    setFormData({ ...formData, storicoManutenzioni: list });
  };

  const addManutenzione = () => {
    setFormData({ ...formData, storicoManutenzioni: [...(formData.storicoManutenzioni || []), { descrizione: '', data: '', costo: 0 }] });
  };

  const inputClasses = "w-full p-3 bg-white border-2 border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 outline-none text-slate-900 font-bold placeholder:text-slate-300 transition-all";

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/80 backdrop-blur-md px-4 py-8">
      <div className="bg-white rounded-[2.5rem] w-full max-w-4xl max-h-[90vh] shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in duration-300">
        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div>
            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Veicolo: <span className="text-blue-600">{formData.targa}</span></h2>
            <p className="text-sm text-slate-500 font-medium">Monitoraggio meccanico, assicurativo e disponibilità</p>
          </div>
          <button onClick={onClose} className="p-3 bg-white rounded-2xl shadow-sm text-slate-400 hover:text-red-500 border border-slate-100 transition-all">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
        </div>

        <div className="px-8 py-4 flex gap-3 bg-white border-b border-slate-50 overflow-x-auto custom-scrollbar">
          {(['generale', 'scadenze', 'manutenzione'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`px-5 py-2.5 text-xs font-black rounded-xl border-2 uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-blue-600 text-white border-blue-600 shadow-lg' : 'bg-white text-slate-500 border-slate-100 hover:border-blue-200'}`}>
              {tab}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-slate-50/20">
          <form className="space-y-6">
            {activeTab === 'generale' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Modello / Tipo</label>
                  <input name="modello" value={formData.modello || ''} onChange={handleInputChange} className={inputClasses} />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Targa</label>
                  <input name="targa" value={formData.targa || ''} onChange={handleInputChange} className={inputClasses} />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest">N. Telaio</label>
                  <input name="telaio" value={formData.telaio || ''} onChange={handleInputChange} className={inputClasses} />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Stato Veicolo</label>
                  <select name="stato" value={formData.stato} onChange={handleInputChange} className={inputClasses}>
                    <option value="disponibile">Disponibile</option>
                    <option value="in_uso">In Uso</option>
                    <option value="manutenzione">In Manutenzione</option>
                  </select>
                </div>
              </div>
            )}

            {activeTab === 'scadenze' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Scadenza Assicurazione</label>
                  <input type="date" name="scadenzaAssicurazione" value={formData.scadenzaAssicurazione || ''} onChange={handleInputChange} className={inputClasses} />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Prossima Revisione</label>
                  <input type="date" name="prossimaRevisione" value={formData.prossimaRevisione || ''} onChange={handleInputChange} className={inputClasses} />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Scadenza Bollo</label>
                  <input type="date" name="scadenzaBollo" value={formData.scadenzaBollo || ''} onChange={handleInputChange} className={inputClasses} />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Verifica Periodica Annuale</label>
                  <input type="date" name="scadenzaVerificaPeriodica" value={formData.scadenzaVerificaPeriodica || ''} onChange={handleInputChange} className={inputClasses} />
                </div>
              </div>
            )}

            {activeTab === 'manutenzione' && (
              <div className="space-y-6 animate-in fade-in">
                <div className="flex justify-between items-center">
                  <h3 className="font-black text-slate-900 uppercase text-xs tracking-widest">Interventi Meccanici</h3>
                  <button type="button" onClick={addManutenzione} className="bg-slate-900 text-white px-4 py-2 rounded-xl text-[10px] font-black hover:bg-blue-600 transition-all">+ NUOVA VOCE</button>
                </div>
                {formData.storicoManutenzioni?.map((m, idx) => (
                  <div key={idx} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-5 bg-white rounded-[2rem] border-2 border-slate-100">
                    <input placeholder="Descrizione (es. Tagliando)" value={m.descrizione} onChange={e => updateManutenzione(idx, { descrizione: e.target.value })} className="md:col-span-2 w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold" />
                    <input type="date" value={m.data} onChange={e => updateManutenzione(idx, { data: e.target.value })} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold" />
                    <input type="number" placeholder="Costo €" value={m.costo} onChange={e => updateManutenzione(idx, { costo: parseFloat(e.target.value) })} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold" />
                  </div>
                ))}
              </div>
            )}
          </form>
        </div>

        <div className="p-8 border-t border-slate-100 flex gap-4 bg-white">
          <button onClick={onClose} className="flex-1 py-4 bg-white border-2 border-slate-200 text-slate-600 font-black rounded-2xl hover:bg-slate-50">ANNULLA</button>
          <button onClick={() => { onSave(formData as Mezzo); onClose(); }} className="flex-[2] py-4 bg-blue-600 text-white font-black rounded-2xl shadow-xl hover:bg-blue-700">SALVA DATI MEZZO</button>
        </div>
      </div>
    </div>
  );
};

export default EditMezzoModal;
