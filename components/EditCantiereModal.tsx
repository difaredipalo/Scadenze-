
import React, { useState, useEffect, useMemo } from 'react';
import { Cantiere, CantiereStato, Tecnico, ChecklistItem, SAL, Subappalto } from '../types';

interface EditCantiereModalProps {
  isOpen: boolean;
  cantiere: Cantiere | null;
  onClose: () => void;
  onSave: (updated: Cantiere) => void;
}

type TabType = 'generale' | 'tecnici' | 'documenti' | 'sal' | 'subappalti';

const EditCantiereModal: React.FC<EditCantiereModalProps> = ({ isOpen, cantiere, onClose, onSave }) => {
  const [formData, setFormData] = useState<Partial<Cantiere>>({});
  const [activeTab, setActiveTab] = useState<TabType>('generale');

  useEffect(() => {
    if (cantiere) {
      setFormData({
        ...cantiere,
        tecnici: cantiere.tecnici || [],
        checklistDocumenti: cantiere.checklistDocumenti || [],
        salList: cantiere.salList || [],
        subappalti: cantiere.subappalti || [],
        importoTotale: cantiere.importoTotale || 0,
      });
    }
  }, [cantiere]);

  // Automatic Progress Calculation
  const calculatedProgresso = useMemo(() => {
    const totalSAL = (formData.salList || []).reduce((acc, curr) => acc + (Number(curr.importo) || 0), 0);
    const totalCantiere = Number(formData.importoTotale) || 0;
    if (totalCantiere <= 0) return 0;
    const progress = Math.min(100, Math.round((totalSAL / totalCantiere) * 100));
    return progress;
  }, [formData.salList, formData.importoTotale]);

  if (!isOpen || !cantiere) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ 
      ...cantiere, 
      ...formData, 
      progresso: calculatedProgresso 
    } as Cantiere);
    onClose();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const value = e.target.type === 'number' ? parseFloat(e.target.value) : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  const addArrayItem = (key: keyof Cantiere, item: any) => {
    setFormData(prev => ({ ...prev, [key]: [...(prev[key] as any[]), item] }));
  };

  const removeArrayItem = (key: keyof Cantiere, id: string | number, idField: string = 'id') => {
    setFormData(prev => ({
      ...prev,
      [key]: (prev[key] as any[]).filter((item, index) => (idField === 'index' ? index !== id : item[idField] !== id))
    }));
  };

  const updateArrayItem = (key: keyof Cantiere, index: number, updates: any) => {
    setFormData(prev => {
      const list = [...(prev[key] as any[])];
      list[index] = { ...list[index], ...updates };
      return { ...prev, [key]: list };
    });
  };

  const stati: CantiereStato[] = ['aperto', 'chiuso', 'in pausa', 'in apertura'];

  const tabClasses = (tab: TabType) => `px-4 py-3 text-sm font-black rounded-2xl transition-all border-2 ${
    activeTab === tab 
      ? 'bg-blue-600 text-white border-blue-600 shadow-lg' 
      : 'bg-white text-slate-500 border-slate-100 hover:border-blue-200'
  }`;

  // Common styling for input fields to ensure high contrast
  const inputBaseClasses = "w-full p-3 bg-white border-2 border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none text-slate-900 font-bold placeholder:text-slate-300";

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/80 backdrop-blur-md px-4 py-4 md:py-8">
      <div className="bg-white rounded-[2.5rem] w-full max-w-5xl h-full max-h-[92vh] shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in duration-300 border border-white/20">
        
        {/* Header */}
        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div>
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 bg-blue-600 text-white text-[10px] font-black rounded-lg uppercase tracking-widest">Editor Avanzato</span>
              <h2 className="text-3xl font-black text-slate-900 tracking-tight">{formData.nome || 'Nuovo Cantiere'}</h2>
            </div>
            <p className="text-sm text-slate-500 font-medium mt-1">Configurazione finanziaria e tecnica del progetto</p>
          </div>
          <button onClick={onClose} className="p-3 bg-white rounded-2xl shadow-sm text-slate-400 hover:text-red-500 border border-slate-100 transition-all hover:scale-110 active:scale-95">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
        </div>

        {/* Tabs Bar */}
        <div className="px-8 py-4 flex gap-3 overflow-x-auto custom-scrollbar bg-white border-b border-slate-50">
          <button onClick={() => setActiveTab('generale')} className={tabClasses('generale')}>Generale</button>
          <button onClick={() => setActiveTab('tecnici')} className={tabClasses('tecnici')}>Tecnici</button>
          <button onClick={() => setActiveTab('documenti')} className={tabClasses('documenti')}>Documentazione</button>
          <button onClick={() => setActiveTab('sal')} className={tabClasses('sal')}>SAL (Avanzamento)</button>
          <button onClick={() => setActiveTab('subappalti')} className={tabClasses('subappalti')}>Subappalti</button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-slate-50/30">
          <form id="edit-cantiere-form" onSubmit={handleSubmit} className="space-y-10">
            
            {activeTab === 'generale' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="space-y-3">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Nome Progetto</label>
                  <input required name="nome" value={formData.nome || ''} onChange={handleInputChange} className={inputBaseClasses} />
                </div>
                <div className="space-y-3">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Cliente Principale</label>
                  <input required name="cliente" value={formData.cliente || ''} onChange={handleInputChange} className={inputBaseClasses} />
                </div>
                <div className="space-y-3">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Importo Totale (€)</label>
                  <input type="number" step="0.01" name="importoTotale" value={formData.importoTotale || 0} onChange={handleInputChange} className={inputBaseClasses} />
                </div>
                <div className="space-y-3">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Stato Attuale</label>
                  <select name="stato" value={formData.stato} onChange={handleInputChange} className={inputBaseClasses + " capitalize"}>
                    {stati.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="space-y-3">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Indirizzo Cantiere</label>
                  <input name="indirizzo" value={formData.indirizzo || ''} onChange={handleInputChange} className={inputBaseClasses} placeholder="Es: Via Roma 1, Milano" />
                </div>
                <div className="space-y-3">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Data Inizio Lavori</label>
                  <input type="date" name="dataInizio" value={formData.dataInizio || ''} onChange={handleInputChange} className={inputBaseClasses} />
                </div>
                <div className="col-span-full bg-white p-6 rounded-3xl border-2 border-slate-100 shadow-sm flex flex-col md:flex-row items-center gap-6">
                   <div className="flex-1 space-y-2 w-full">
                      <div className="flex justify-between items-center">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Avanzamento Automatico (Basato su SAL)</label>
                        <span className="text-xl font-black text-blue-600">{calculatedProgresso}%</span>
                      </div>
                      <div className="w-full bg-slate-100 h-4 rounded-full overflow-hidden border border-slate-200">
                        <div className="bg-blue-600 h-full transition-all duration-700 shadow-[0_0_15px_rgba(37,99,235,0.4)]" style={{ width: `${calculatedProgresso}%` }}></div>
                      </div>
                   </div>
                   <div className="w-full md:w-auto">
                     <p className="text-[10px] text-slate-400 font-bold uppercase text-center">Progresso calcolato su Importo Totale</p>
                   </div>
                </div>
                <div className="col-span-full space-y-3">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Note di Progetto</label>
                  <textarea name="note" value={formData.note || ''} onChange={handleInputChange} rows={3} className={inputBaseClasses} placeholder="Annotazioni interne..." />
                </div>
              </div>
            )}

            {activeTab === 'tecnici' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-black text-slate-900 tracking-tight">Staff Tecnico</h3>
                  <button type="button" onClick={() => addArrayItem('tecnici', { nome: '', ruolo: '', contatto: '' })} className="bg-slate-900 text-white px-5 py-2.5 rounded-2xl font-black text-xs hover:bg-blue-600 transition-all flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5v14"/></svg> AGGIUNGI TECNICO
                  </button>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  {formData.tecnici?.map((t, idx) => (
                    <div key={idx} className="flex flex-col md:flex-row gap-4 p-6 bg-white rounded-3xl border-2 border-slate-100 shadow-sm relative group">
                      <div className="flex-1 space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase">Nominativo</label>
                        <input placeholder="Nome e Cognome" value={t.nome} onChange={e => updateArrayItem('tecnici', idx, { nome: e.target.value })} className={inputBaseClasses} />
                      </div>
                      <div className="flex-1 space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase">Ruolo / Incarico</label>
                        <input placeholder="Es: Architetto, Sicurezza" value={t.ruolo} onChange={e => updateArrayItem('tecnici', idx, { ruolo: e.target.value })} className={inputBaseClasses} />
                      </div>
                      <div className="flex-1 space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase">Telefono / Email</label>
                        <input placeholder="Recapito" value={t.contatto} onChange={e => updateArrayItem('tecnici', idx, { contatto: e.target.value })} className={inputBaseClasses} />
                      </div>
                      <button type="button" onClick={() => removeArrayItem('tecnici', idx, 'index')} className="p-3 text-slate-300 hover:text-red-500 transition-colors self-end mb-1">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2M10 11v6M14 11v6"/></svg>
                      </button>
                    </div>
                  ))}
                  {(!formData.tecnici || formData.tecnici.length === 0) && (
                    <div className="p-12 text-center bg-slate-100/50 rounded-[2rem] border-2 border-dashed border-slate-200">
                      <p className="text-slate-400 font-bold">Nessun tecnico inserito per questo cantiere</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'documenti' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-black text-slate-900 tracking-tight">Compliance & Check</h3>
                  <button type="button" onClick={() => addArrayItem('checklistDocumenti', { id: Math.random().toString(), titolo: '', completato: false })} className="bg-slate-900 text-white px-5 py-2.5 rounded-2xl font-black text-xs hover:bg-blue-600 transition-all flex items-center gap-2">
                     <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5v14"/></svg> NUOVO CHECK
                  </button>
                </div>
                <div className="grid grid-cols-1 gap-3">
                  {formData.checklistDocumenti?.map((doc, idx) => (
                    <div key={doc.id} className={`flex items-center gap-5 p-5 bg-white rounded-2xl border-2 transition-all ${doc.completato ? 'border-emerald-100 bg-emerald-50/20' : 'border-slate-100'}`}>
                      <input type="checkbox" checked={doc.completato} onChange={e => updateArrayItem('checklistDocumenti', idx, { completato: e.target.checked })} className="w-6 h-6 rounded-lg accent-emerald-600 cursor-pointer" />
                      <input placeholder="Descrizione documento o attività" value={doc.titolo} onChange={e => updateArrayItem('checklistDocumenti', idx, { titolo: e.target.value })} className="flex-1 p-2 bg-transparent border-none outline-none text-slate-900 font-bold" />
                      <button type="button" onClick={() => removeArrayItem('checklistDocumenti', doc.id)} className="p-2 text-slate-300 hover:text-red-500">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'sal' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="text-xl font-black text-slate-900 tracking-tight">Registro Avanzamento (SAL)</h3>
                    <p className="text-xs text-slate-400 font-bold mt-1">Gli importi inseriti qui determinano il progresso percentuale</p>
                  </div>
                  <button type="button" onClick={() => addArrayItem('salList', { id: Math.random().toString(), titolo: '', data: '', importo: 0 })} className="bg-slate-900 text-white px-5 py-2.5 rounded-2xl font-black text-xs hover:bg-emerald-600 transition-all flex items-center gap-2">
                     <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5v14"/></svg> REGISTRA SAL
                  </button>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  {formData.salList?.map((s, idx) => (
                    <div key={s.id} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-6 bg-white rounded-3xl border-2 border-slate-100 shadow-sm">
                      <div className="md:col-span-2 space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase">Oggetto della fatturazione</label>
                        <input placeholder="Es: Opere strutturali, Impianti" value={s.titolo} onChange={e => updateArrayItem('salList', idx, { titolo: e.target.value })} className={inputBaseClasses} />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase">Data Emissione</label>
                        <input type="date" value={s.data} onChange={e => updateArrayItem('salList', idx, { data: e.target.value })} className={inputBaseClasses} />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase">Importo (€)</label>
                        <div className="flex items-center gap-3">
                          <input type="number" step="0.01" value={s.importo} onChange={e => updateArrayItem('salList', idx, { importo: parseFloat(e.target.value) })} className={inputBaseClasses} />
                          <button type="button" onClick={() => removeArrayItem('salList', s.id)} className="p-3 text-red-500 hover:bg-red-50 rounded-xl transition-all">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'subappalti' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-black text-slate-900 tracking-tight">Gestione Subappalti</h3>
                  <button type="button" onClick={() => addArrayItem('subappalti', { id: Math.random().toString(), azienda: '', lavoro: '', prezzoOriginale: 0, maggiorazione: 0 })} className="bg-slate-900 text-white px-5 py-2.5 rounded-2xl font-black text-xs hover:bg-blue-600 transition-all flex items-center gap-2">
                     <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5v14"/></svg> NUOVO SUBAPPALTO
                  </button>
                </div>
                <div className="grid grid-cols-1 gap-6">
                  {formData.subappalti?.map((sub, idx) => {
                    const prezzoFinale = (Number(sub.prezzoOriginale) || 0) * (1 + (Number(sub.maggiorazione) || 0) / 100);
                    return (
                      <div key={sub.id} className="p-8 bg-white rounded-[2rem] border-2 border-slate-100 shadow-sm space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase">Ragione Sociale Impresa</label>
                            <input placeholder="Nome Azienda" value={sub.azienda} onChange={e => updateArrayItem('subappalti', idx, { azienda: e.target.value })} className={inputBaseClasses} />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase">Tipologia di Lavoro</label>
                            <input placeholder="Es: Scavi, Cartongesso" value={sub.lavoro} onChange={e => updateArrayItem('subappalti', idx, { lavoro: e.target.value })} className={inputBaseClasses} />
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-slate-50 items-end">
                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase">Prezzo Originale (€)</label>
                            <input type="number" step="0.01" value={sub.prezzoOriginale} onChange={e => updateArrayItem('subappalti', idx, { prezzoOriginale: parseFloat(e.target.value) })} className={inputBaseClasses} />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase">Maggiorazione (%)</label>
                            <input type="number" step="0.1" value={sub.maggiorazione} onChange={e => updateArrayItem('subappalti', idx, { maggiorazione: parseFloat(e.target.value) })} className={inputBaseClasses} />
                          </div>
                          <div className="bg-slate-900 text-white p-4 rounded-2xl flex flex-col justify-center">
                            <span className="text-[10px] font-black uppercase text-blue-400 tracking-widest">Totale Ivato/Maggiorato</span>
                            <span className="text-lg font-black tracking-tight">{prezzoFinale.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' })}</span>
                          </div>
                        </div>
                        <div className="flex justify-end">
                          <button type="button" onClick={() => removeArrayItem('subappalti', sub.id)} className="text-xs font-black text-red-500 hover:bg-red-50 px-4 py-2 rounded-xl transition-all">ELIMINA SUBAPPALTO</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Footer */}
        <div className="p-8 bg-white border-t border-slate-100 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="hidden md:block">
             <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Ultima modifica: Oggi</p>
          </div>
          <div className="flex gap-4 w-full md:w-auto">
            <button type="button" onClick={onClose} className="flex-1 md:px-10 py-5 bg-white border-2 border-slate-200 text-slate-600 font-black rounded-[1.5rem] hover:bg-slate-50 transition-all active:scale-95">ANNULLA</button>
            <button form="edit-cantiere-form" type="submit" className="flex-[2] md:px-12 py-5 bg-blue-600 text-white font-black rounded-[1.5rem] shadow-2xl shadow-blue-600/30 hover:bg-blue-700 transition-all hover:scale-[1.02] active:scale-95">AGGIORNA PROGETTO</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditCantiereModal;
