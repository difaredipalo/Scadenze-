
import React, { useState, useEffect } from 'react';
import { Documento } from '../types';

interface EditDocumentoModalProps {
  isOpen: boolean;
  documento: Documento | null;
  onClose: () => void;
  onSave: (updated: Documento) => void;
}

const EditDocumentoModal: React.FC<EditDocumentoModalProps> = ({ isOpen, documento, onClose, onSave }) => {
  const [formData, setFormData] = useState<Partial<Documento>>({});

  useEffect(() => {
    if (documento) setFormData(documento);
  }, [documento]);

  if (!isOpen || !documento) return null;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const inputClasses = "w-full p-4 bg-white border-2 border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 outline-none text-slate-900 font-bold placeholder:text-slate-300 transition-all";

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/80 backdrop-blur-md px-4 py-8">
      <div className="bg-white rounded-[2.5rem] w-full max-w-2xl max-h-[90vh] shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in duration-300">
        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div>
            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Documento: <span className="text-blue-600">{formData.titolo}</span></h2>
            <p className="text-sm text-slate-500 font-medium">Gestione archiviazione e scadenze certificazioni</p>
          </div>
          <button onClick={onClose} className="p-3 bg-white rounded-2xl shadow-sm text-slate-400 hover:text-red-500 border border-slate-100 transition-all">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-white">
          <form className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Titolo Documento</label>
              <input name="titolo" value={formData.titolo || ''} onChange={handleInputChange} className={inputClasses} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Categoria</label>
                <input name="categoria" value={formData.categoria || ''} onChange={handleInputChange} className={inputClasses} />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Priorità</label>
                <select name="priorita" value={formData.priorita} onChange={handleInputChange} className={inputClasses}>
                  <option value="bassa">Bassa</option>
                  <option value="media">Media</option>
                  <option value="alta">Alta (Critica)</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Ente Rilascio</label>
                <input name="ente" value={formData.ente || ''} onChange={handleInputChange} className={inputClasses} />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Data di Scadenza</label>
                <input type="date" name="scadenza" value={formData.scadenza || ''} onChange={handleInputChange} className={inputClasses} />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Note Dettagliate</label>
              <textarea name="note" value={formData.note || ''} onChange={handleInputChange} rows={4} className={inputClasses} />
            </div>
          </form>
        </div>

        <div className="p-8 border-t border-slate-100 flex gap-4 bg-slate-50">
          <button onClick={onClose} className="flex-1 py-4 bg-white border-2 border-slate-200 text-slate-600 font-black rounded-2xl hover:bg-slate-100 transition-all">ANNULLA</button>
          <button onClick={() => { onSave(formData as Documento); onClose(); }} className="flex-[2] py-4 bg-blue-600 text-white font-black rounded-2xl shadow-xl hover:bg-blue-700 transition-all">AGGIORNA DOCUMENTO</button>
        </div>
      </div>
    </div>
  );
};

export default EditDocumentoModal;
