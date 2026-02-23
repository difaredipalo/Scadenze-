
import React, { useState, useEffect } from 'react';
import { EntityType } from '../types';
import { Icons } from '../constants';

interface AddModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (type: EntityType, data: any) => void;
  defaultType?: EntityType;
}

const AddModal: React.FC<AddModalProps> = ({ isOpen, onClose, onAdd, defaultType }) => {
  const [selectedType, setSelectedType] = useState<EntityType>(defaultType || 'cantiere');
  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    if (isOpen && defaultType) {
      setSelectedType(defaultType);
    }
  }, [isOpen, defaultType]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalData = { ...formData };
    if (selectedType === 'personale') {
      finalData.inForza = true;
      if (!finalData.categoria) finalData.categoria = 'operaio';
      delete finalData.indeterminato;
    }
    onAdd(selectedType, { ...finalData, id: Math.random().toString(36).substr(2, 9) });
    onClose();
    setFormData({});
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const inputClasses = "w-full p-4 bg-white border-2 border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 outline-none text-slate-900 font-black placeholder:text-slate-300 transition-all";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/90 backdrop-blur-md p-4">
      <div className="bg-white rounded-[2.5rem] w-full max-w-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 border border-white/20">
        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Nuovo Record</h2>
            <p className="text-sm text-slate-500 font-bold">Inserimento rapido nel database</p>
          </div>
          <button onClick={onClose} className="p-3 bg-white rounded-2xl shadow-sm text-slate-400 hover:text-red-500 border border-slate-100 transition-all">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Seleziona Categoria</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {(['cantiere', 'personale', 'mezzo', 'documento'] as EntityType[]).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setSelectedType(type)}
                  className={`py-3 px-2 text-[10px] font-black rounded-xl border-2 transition-all uppercase tracking-tight ${
                    selectedType === type
                      ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-600/20'
                      : 'bg-white text-slate-500 border-slate-100 hover:border-blue-200'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
            {selectedType === 'cantiere' && (
              <>
                <input required name="nome" placeholder="Nome Cantiere" onChange={handleInputChange} className={inputClasses} />
                <input required name="cliente" placeholder="Cliente Committente" onChange={handleInputChange} className={inputClasses} />
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Data Consegna Prevista</label>
                   <input required type="date" name="scadenza" onChange={handleInputChange} className={inputClasses} />
                </div>
              </>
            )}
            {selectedType === 'personale' && (
              <>
                <div className="flex gap-3">
                  <input required name="nome" placeholder="Nome" onChange={handleInputChange} className={inputClasses} />
                  <input required name="cognome" placeholder="Cognome" onChange={handleInputChange} className={inputClasses} />
                </div>
                <input required name="ruolo" placeholder="Inquadramento / Mansione" onChange={handleInputChange} className={inputClasses} />
                <select name="categoria" onChange={handleInputChange} className={inputClasses} defaultValue="operaio">
                  <option value="operaio">Operaio</option>
                  <option value="impiegato">Impiegato</option>
                  <option value="amministratore">Amministratore</option>
                </select>
                <div className="space-y-2">
                  <div className="flex justify-between items-center px-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Scadenza Contratto</label>
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={formData.indeterminato} 
                        onChange={(e) => setFormData({...formData, indeterminato: e.target.checked, scadenzaContratto: e.target.checked ? undefined : formData.scadenzaContratto})}
                        className="w-3 h-3 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Indeterminato</span>
                    </label>
                  </div>
                  <input 
                    required={!formData.indeterminato} 
                    type="date" 
                    name="scadenzaContratto" 
                    onChange={handleInputChange} 
                    className={`${inputClasses} ${formData.indeterminato ? 'opacity-50 pointer-events-none' : ''}`} 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Scadenza Visita Medica</label>
                  <input required type="date" name="scadenzaVisitaMedica" onChange={handleInputChange} className={inputClasses} />
                </div>
              </>
            )}
            {selectedType === 'mezzo' && (
              <>
                <input required name="modello" placeholder="Modello Veicolo / Macchinario" onChange={handleInputChange} className={inputClasses} />
                <input required name="targa" placeholder="Targa o Matricola" onChange={handleInputChange} className={inputClasses} />
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Scadenza Assicurazione</label>
                  <input required type="date" name="scadenzaAssicurazione" onChange={handleInputChange} className={inputClasses} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Verifica Periodica Annuale</label>
                  <input type="date" name="scadenzaVerificaPeriodica" onChange={handleInputChange} className={inputClasses} />
                </div>
              </>
            )}
            {selectedType === 'documento' && (
              <>
                <input required name="titolo" placeholder="Titolo Documentazione" onChange={handleInputChange} className={inputClasses} />
                <input required name="ente" placeholder="Ente Certificatore" onChange={handleInputChange} className={inputClasses} />
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Data di Scadenza</label>
                  <input required type="date" name="scadenza" onChange={handleInputChange} className={inputClasses} />
                </div>
              </>
            )}
          </div>

          <button type="submit" className="w-full bg-slate-900 text-white font-black py-5 rounded-3xl shadow-2xl hover:bg-blue-600 transition-all tracking-widest uppercase text-sm mt-4 active:scale-95">
            CONFERMA INSERIMENTO
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddModal;
