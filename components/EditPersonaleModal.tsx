
import React, { useState, useEffect } from 'react';
import { Personale, Formazione } from '../types';
import { FORMAZIONI_PREDEFINITE, Icons } from '../constants';

interface EditPersonaleModalProps {
  isOpen: boolean;
  personale: Personale | null;
  onClose: () => void;
  onSave: (updated: Personale) => void;
}

const EditPersonaleModal: React.FC<EditPersonaleModalProps> = ({ isOpen, personale, onClose, onSave }) => {
  const [formData, setFormData] = useState<Partial<Personale>>({});
  const [activeTab, setActiveTab] = useState<'generale' | 'scadenze' | 'formazione'>('generale');

  useEffect(() => {
    if (personale) setFormData({ ...personale, corsiFormazione: personale.corsiFormazione || [] });
  }, [personale]);

  if (!isOpen || !personale) return null;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const updateFormazione = (index: number, updates: Partial<Formazione>) => {
    const list = [...(formData.corsiFormazione || [])];
    list[index] = { ...list[index], ...updates };
    setFormData({ ...formData, corsiFormazione: list });
  };

  const addFormazione = () => {
    setFormData({ ...formData, corsiFormazione: [...(formData.corsiFormazione || []), { corso: '', data: '', scadenza: '' }] });
  };

  const inputClasses = "w-full p-3 bg-white border-2 border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none text-slate-900 font-bold placeholder:text-slate-300 transition-all";

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/80 backdrop-blur-md px-4 py-8">
      <div className="bg-white rounded-[2.5rem] w-full max-w-4xl max-h-[90vh] shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in duration-300">
        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div>
            <h2 className="text-2xl font-black text-slate-900">Anagrafica: <span className="text-blue-600">{formData.nome} {formData.cognome}</span></h2>
            <p className="text-sm text-slate-500 font-medium">Gestione contratti, formazione e scadenze mediche</p>
          </div>
          <button onClick={onClose} className="p-3 bg-white rounded-2xl shadow-sm text-slate-400 hover:text-red-500 border border-slate-100 transition-all">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
        </div>

        <div className="px-8 py-4 flex gap-3 bg-white border-b border-slate-50">
          {(['generale', 'scadenze', 'formazione'] as const).map(tab => (
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
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Nome</label>
                  <input name="nome" value={formData.nome || ''} onChange={handleInputChange} className={inputClasses} />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Cognome</label>
                  <input name="cognome" value={formData.cognome || ''} onChange={handleInputChange} className={inputClasses} />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Codice Fiscale</label>
                  <input name="codiceFiscale" value={formData.codiceFiscale || ''} onChange={handleInputChange} className={inputClasses} placeholder="RSSMRA80A01H501Z" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Ruolo / Mansione</label>
                  <input name="ruolo" value={formData.ruolo || ''} onChange={handleInputChange} className={inputClasses} />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Categoria</label>
                  <select name="categoria" value={formData.categoria} onChange={handleInputChange} className={inputClasses}>
                    <option value="operaio">Operaio</option>
                    <option value="impiegato">Impiegato</option>
                    <option value="amministratore">Amministratore</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Stato Occupazionale</label>
                  <select name="inForza" value={formData.inForza ? 'true' : 'false'} onChange={(e) => setFormData({...formData, inForza: e.target.value === 'true'})} className={inputClasses}>
                    <option value="true">In Forza</option>
                    <option value="false">Non più in forza (Cessato)</option>
                  </select>
                </div>
              </div>
            )}

            {activeTab === 'scadenze' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Scadenza Contratto</label>
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={!formData.scadenzaContratto} 
                        onChange={(e) => setFormData({...formData, scadenzaContratto: e.target.checked ? undefined : ''})}
                        className="w-3 h-3 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Indeterminato</span>
                    </label>
                  </div>
                  <input 
                    type="date" 
                    name="scadenzaContratto" 
                    value={formData.scadenzaContratto || ''} 
                    onChange={handleInputChange} 
                    className={`${inputClasses} ${!formData.scadenzaContratto ? 'opacity-50 pointer-events-none' : ''}`} 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Scadenza Visita Medica</label>
                  <input type="date" name="scadenzaVisitaMedica" value={formData.scadenzaVisitaMedica || ''} onChange={handleInputChange} className={inputClasses} />
                </div>
              </div>
            )}

            {activeTab === 'formazione' && (
              <div className="space-y-6 animate-in fade-in">
                <div className="flex justify-between items-center">
                  <h3 className="font-black text-slate-900 uppercase text-xs tracking-widest">Registro Corsi Sicurezza</h3>
                  <button type="button" onClick={addFormazione} className="bg-slate-900 text-white px-4 py-2 rounded-xl text-[10px] font-black hover:bg-blue-600 transition-all">+ NUOVO CORSO</button>
                </div>
                {formData.corsiFormazione?.map((c, idx) => {
                  const isPredefined = FORMAZIONI_PREDEFINITE.includes(c.corso) || c.corso === '';
                  return (
                    <div key={idx} className="grid grid-cols-1 md:grid-cols-12 gap-4 p-5 bg-white rounded-[2rem] border-2 border-slate-100">
                      <div className="md:col-span-5 space-y-2">
                        <select 
                          value={isPredefined ? c.corso : 'altro'} 
                          onChange={e => {
                            const val = e.target.value;
                            updateFormazione(idx, { corso: val === 'altro' ? '' : val });
                          }} 
                          className={inputClasses}
                        >
                          <option value="">Seleziona Corso...</option>
                          {FORMAZIONI_PREDEFINITE.map(f => <option key={f} value={f}>{f}</option>)}
                          <option value="altro">Altro (Inserimento manuale)...</option>
                        </select>
                        {!isPredefined && (
                          <input 
                            placeholder="Specifica corso..." 
                            value={c.corso} 
                            onChange={e => updateFormazione(idx, { corso: e.target.value })} 
                            className={`${inputClasses} mt-2 border-blue-200 bg-blue-50/30`} 
                          />
                        )}
                        {isPredefined && c.corso === '' && (
                          <div className="text-[10px] font-bold text-slate-400 italic px-1">Scegli dalla lista o seleziona "Altro"</div>
                        )}
                      </div>
                      <div className="md:col-span-3">
                        <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Data Corso</label>
                        <input type="date" value={c.data} onChange={e => updateFormazione(idx, { data: e.target.value })} className={inputClasses} />
                      </div>
                      <div className="md:col-span-3">
                        <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Scadenza</label>
                        <input type="date" value={c.scadenza} onChange={e => updateFormazione(idx, { scadenza: e.target.value })} className={inputClasses} />
                      </div>
                      <div className="md:col-span-1 flex items-end justify-center">
                        <button 
                          type="button" 
                          onClick={() => {
                            const list = [...(formData.corsiFormazione || [])];
                            list.splice(idx, 1);
                            setFormData({ ...formData, corsiFormazione: list });
                          }}
                          className="p-3 text-slate-300 hover:text-red-500 transition-colors"
                        >
                          <Icons.Trash />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </form>
        </div>

        <div className="p-8 border-t border-slate-100 flex gap-4 bg-white">
          <button onClick={onClose} className="flex-1 py-4 bg-white border-2 border-slate-200 text-slate-600 font-black rounded-2xl hover:bg-slate-50">ANNULLA</button>
          <button onClick={() => { onSave(formData as Personale); onClose(); }} className="flex-[2] py-4 bg-blue-600 text-white font-black rounded-2xl shadow-xl hover:bg-blue-700">SALVA ANAGRAFICA</button>
        </div>
      </div>
    </div>
  );
};

export default EditPersonaleModal;
