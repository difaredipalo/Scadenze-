import React, { useState } from 'react';
import { PosAttivitaTemplate } from '../../types';
import { DEFAULT_POS_TEMPLATES, POS_DPI_LIST } from '../../data/posDefaultData';

interface PosTemplateLibraryModalProps {
  customTemplates: PosAttivitaTemplate[];
  onSaveTemplates: (templates: PosAttivitaTemplate[]) => void;
  onClose: () => void;
}

export const PosTemplateLibraryModal: React.FC<PosTemplateLibraryModalProps> = ({
  customTemplates,
  onSaveTemplates,
  onClose,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Tutte');
  const [activeTemplate, setActiveTemplate] = useState<PosAttivitaTemplate | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Combine default and custom templates
  const allTemplates = [...DEFAULT_POS_TEMPLATES, ...customTemplates];

  const categories = ['Tutte', ...Array.from(new Set(allTemplates.map(t => t.categoria)))];

  const filtered = allTemplates.filter(t => {
    const matchesCat = selectedCategory === 'Tutte' || t.categoria === selectedCategory;
    const matchesSearch = t.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.descrizione.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const handleAddNewTemplate = () => {
    const newTpl: PosAttivitaTemplate = {
      id: `custom_${Date.now()}`,
      nome: 'Nuova Attività Edile',
      categoria: 'Opere Generali',
      icona: '🏗️',
      descrizione: 'Descrizione delle fasi operative, lavorazioni e modalità esecutive.',
      faseLavoro: 'Fase Esecutiva',
      rischi: [
        {
          id: Math.random().toString(),
          descrizione: 'Rischio generico di cantiere',
          fonteRischio: 'Attività operativa',
          conseguenze: 'Contusioni, traumi',
          misurePreventive: 'Informazione preventiva ed esecuzione a regola d’arte.',
          misureProtettive: 'DPI individuali.',
          dpiRichiesti: ['Casco di protezione / Elmetto', 'Calzature di sicurezza S3'],
        },
      ],
      misurePrevenzione: [
        'Mantenere sgombre e pulite le aree di transito.',
        'Verificare l’integrità degli attrezzi prima dell’uso.',
      ],
      dpiRaccomandati: ['Casco di protezione / Elmetto', 'Calzature di sicurezza S3', 'Guanti rischio meccanico'],
      attrezzatureTipiche: ['Utensili manuali ed elettrici'],
      materialiTipici: ['Materiali edili da costruzione'],
      interferenze: 'Nessuna interferenza rilevata con altre lavorazioni.',
      note: 'Rispettare le indicazioni del CSE.',
      isCustom: true,
    };
    setActiveTemplate(newTpl);
    setIsEditing(true);
  };

  const handleSaveActive = (tplToSave: PosAttivitaTemplate) => {
    const existingIndex = customTemplates.findIndex(t => t.id === tplToSave.id);
    let updated: PosAttivitaTemplate[];
    if (existingIndex >= 0) {
      updated = customTemplates.map((t, i) => i === existingIndex ? tplToSave : t);
    } else {
      updated = [...customTemplates, tplToSave];
    }
    onSaveTemplates(updated);
    setActiveTemplate(tplToSave);
    setIsEditing(false);
  };

  const handleDeleteCustom = (tplId: string) => {
    const updated = customTemplates.filter(t => t.id !== tplId);
    onSaveTemplates(updated);
    if (activeTemplate?.id === tplId) {
      setActiveTemplate(null);
      setIsEditing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-5xl w-full h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">📚</span>
              <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-wide">
                Libreria Attività & Schede di Sicurezza Edile
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Database conforme All. XV D.Lgs. 81/2008 con rischi, misure e DPI pronti all'uso per i POS
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleAddNewTemplate}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-colors shadow-sm"
            >
              + Nuova Attività
            </button>
            <button
              onClick={onClose}
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 shrink-0">
          <input
            type="text"
            placeholder="Cerca lavorazione, rischio o attrezzatura..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="p-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-xs w-72"
          />

          <div className="flex items-center gap-1.5 overflow-x-auto text-[11px] font-bold">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
                  selectedCategory === cat
                    ? 'bg-blue-600 text-white font-black'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Body Content */}
        <div className="flex-1 flex overflow-hidden text-xs">
          {/* Templates Grid / List */}
          <div className="w-full md:w-1/2 p-4 overflow-y-auto border-r border-slate-200 dark:border-slate-800 space-y-2.5">
            {filtered.map(tpl => {
              const isSelected = activeTemplate?.id === tpl.id;
              return (
                <div
                  key={tpl.id}
                  onClick={() => {
                    setActiveTemplate(tpl);
                    setIsEditing(false);
                  }}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-900/20 text-slate-900 dark:text-white shadow-sm ring-1 ring-blue-500/20'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-800/40'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{tpl.icona}</span>
                      <h4 className="font-black text-xs uppercase">{tpl.nome}</h4>
                    </div>
                    {tpl.isCustom && (
                      <span className="px-1.5 py-0.5 bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 text-[9px] font-black rounded uppercase">
                        Personalizzata
                      </span>
                    )}
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-1 line-clamp-2">
                    {tpl.descrizione}
                  </p>
                  <div className="mt-2 flex items-center gap-2 text-[10px] text-slate-400 font-bold">
                    <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 rounded text-slate-700 dark:text-slate-300">
                      {tpl.categoria}
                    </span>
                    <span>⚠️ {tpl.rischi.length} rischi</span>
                    <span>🛡️ {tpl.dpiRaccomandati.length} DPI</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Template Detail / Edit View */}
          <div className="hidden md:block md:w-1/2 p-6 overflow-y-auto bg-slate-50/40 dark:bg-slate-900/40">
            {activeTemplate ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl">{activeTemplate.icona}</span>
                    <div>
                      <h3 className="font-black text-sm uppercase text-slate-900 dark:text-white">
                        {activeTemplate.nome}
                      </h3>
                      <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase">
                        {activeTemplate.categoria} • {activeTemplate.faseLavoro}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {activeTemplate.isCustom && (
                      <button
                        onClick={() => handleDeleteCustom(activeTemplate.id)}
                        className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl"
                        title="Elimina attività"
                      >
                        🗑️
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="font-black uppercase text-[10px] text-slate-400 mb-1">Descrizione Operativa</h4>
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                    {activeTemplate.descrizione}
                  </p>
                </div>

                <div>
                  <h4 className="font-black uppercase text-[10px] text-slate-400 mb-1">Rischi Analizzati ({activeTemplate.rischi.length})</h4>
                  <div className="space-y-2">
                    {activeTemplate.rischi.map(r => (
                      <div key={r.id} className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                        <strong className="text-rose-700 dark:text-rose-400 text-xs block">⚠️ {r.descrizione}</strong>
                        <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1">
                          <strong>Misure:</strong> {r.misurePreventive}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-black uppercase text-[10px] text-slate-400 mb-1">DPI Raccomandati</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {activeTemplate.dpiRaccomandati.map((dpi, i) => (
                      <span key={i} className="px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200 border border-amber-200 dark:border-amber-900/40 text-[11px] font-bold">
                        {dpi}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-black uppercase text-[10px] text-slate-400 mb-1">Attrezzature Tipiche</h4>
                  <p className="text-slate-600 dark:text-slate-400">
                    {activeTemplate.attrezzatureTipiche.join(', ')}
                  </p>
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-center p-8 text-slate-400">
                Seleziona un'attività a sinistra per visualizzarne i dettagli normativi e le misure di prevenzione.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
