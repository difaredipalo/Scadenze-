import React, { useState } from 'react';
import {
  PosAttivitaTemplate,
  PosAttrezzaturaItem,
  PosOperaProvvisionaleItem,
  PosSostanzaItem,
} from '../../types';
import {
  DEFAULT_POS_TEMPLATES,
  DEFAULT_ATTREZZATURE_CATALOGO,
  DEFAULT_OPERE_PROVVISIONALI_LIST,
  DEFAULT_SOSTANZE_CATALOGO,
  POS_DPI_LIST,
} from '../../data/posDefaultData';
import {
  PosSchedaLogo,
  PosSchedaLogoPickerModal,
  DpiPictogram,
  GhsHazardDiamond,
  GHS_PICTOGRAM_CODES,
} from './PosSafetyCardVisuals';

export type PosLibraryCategory = 'lavorazioni' | 'attrezzature' | 'opere' | 'sostanze';

interface PosTemplateLibraryModalProps {
  customTemplates: PosAttivitaTemplate[];
  onSaveTemplates: (templates: PosAttivitaTemplate[]) => void;
  customAttrezzature?: PosAttrezzaturaItem[];
  onSaveAttrezzature?: (items: PosAttrezzaturaItem[]) => void;
  customOpere?: PosOperaProvvisionaleItem[];
  onSaveOpere?: (items: PosOperaProvvisionaleItem[]) => void;
  customSostanze?: PosSostanzaItem[];
  onSaveSostanze?: (items: PosSostanzaItem[]) => void;
  onClose: () => void;
}

export const PosTemplateLibraryModal: React.FC<PosTemplateLibraryModalProps> = ({
  customTemplates = [],
  onSaveTemplates,
  customAttrezzature = [],
  onSaveAttrezzature,
  customOpere = [],
  onSaveOpere,
  customSostanze = [],
  onSaveSostanze,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<PosLibraryCategory>('lavorazioni');
  const [searchTerm, setSearchTerm] = useState('');

  // Sottocategorie filtro
  const [selectedSubCat, setSelectedSubCat] = useState<string>('Tutte');

  // Selezione per visualizzazione / editing
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);

  // Logo Picker Modal
  const [isLogoPickerOpen, setIsLogoPickerOpen] = useState<boolean>(false);

  // Edit Buffer
  const [editLavorazione, setEditLavorazione] = useState<PosAttivitaTemplate | null>(null);
  const [editAttrezzatura, setEditAttrezzatura] = useState<PosAttrezzaturaItem | null>(null);
  const [editOpera, setEditOpera] = useState<PosOperaProvvisionaleItem | null>(null);
  const [editSostanza, setEditSostanza] = useState<PosSostanzaItem | null>(null);

  // Cataloghi completi unendo default e custom
  const allLavorazioni: PosAttivitaTemplate[] = [
    ...DEFAULT_POS_TEMPLATES,
    ...customTemplates,
  ];

  const allAttrezzature: PosAttrezzaturaItem[] = [
    ...DEFAULT_ATTREZZATURE_CATALOGO,
    ...customAttrezzature,
  ];

  const allOpere: PosOperaProvvisionaleItem[] = [
    ...DEFAULT_OPERE_PROVVISIONALI_LIST,
    ...customOpere,
  ];

  const allSostanze: PosSostanzaItem[] = [
    ...DEFAULT_SOSTANZE_CATALOGO,
    ...customSostanze,
  ];

  // Helper categorie correnti
  const getCategoriesForCurrentTab = () => {
    if (activeTab === 'lavorazioni') {
      return ['Tutte', ...Array.from(new Set(allLavorazioni.map(t => t.categoria || 'Generale')))];
    }
    if (activeTab === 'attrezzature') {
      return ['Tutte', ...Array.from(new Set(allAttrezzature.map(t => t.categoria || 'Varie')))];
    }
    if (activeTab === 'opere') {
      return ['Tutte', ...Array.from(new Set(allOpere.map(t => t.categoria || 'Opere Quota')))];
    }
    return ['Tutte', ...Array.from(new Set(allSostanze.map(t => t.utilizzoFase || 'Cantiere')))];
  };

  const currentCategories = getCategoriesForCurrentTab();

  // Reset selezione al cambio tab
  const handleTabChange = (tab: PosLibraryCategory) => {
    setActiveTab(tab);
    setSelectedSubCat('Tutte');
    setActiveId(null);
    setIsEditing(false);
  };

  // ==========================================
  // CREAZIONE NUOVA SCHEDA
  // ==========================================
  const handleAddNew = () => {
    const newId = `custom_${Date.now()}`;
    if (activeTab === 'lavorazioni') {
      const newTpl: PosAttivitaTemplate = {
        id: newId,
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
      setEditLavorazione(newTpl);
      setActiveId(newId);
      setIsEditing(true);
    } else if (activeTab === 'attrezzature') {
      const newAtt: PosAttrezzaturaItem = {
        id: newId,
        nome: 'Nuova Macchina / Mezzo',
        categoria: 'Macchine di cantiere',
        icona: '🚜',
        descrizione: 'Descrizione tecnica, impiego e caratteristiche del mezzo.',
        marca: 'Costruttore CE',
        modelloMatricola: 'Modello / Matricola da registro',
        marcaturaCeConforme: true,
        verifichePeriodicheRegolari: true,
        operatoreAbilitato: 'Personale con patentino / formazione specifica Art. 73',
        prescrizioniSicurezza: 'Verifica preliminare dei dispositivi di sicurezza prima dell’avviamento.',
        prescrizioniPreliminari: 'Controllo visivo di efficienza e assenza trafilamenti olio.',
        dpiObbligatori: ['Casco di protezione / Elmetto', 'Calzature di sicurezza S3', 'Guanti da lavoro'],
        rischi: [
          {
            id: Math.random().toString(),
            descrizione: 'Investimento, urto o ribaltamento',
            misurePreventive: 'Delimitazione raggio di azione e segnalatore acustico retromarcia.',
            dpiRichiesti: ['Casco di protezione / Elmetto', 'Gilet alta visibilità'],
          },
        ],
      };
      setEditAttrezzatura(newAtt);
      setActiveId(newId);
      setIsEditing(true);
    } else if (activeTab === 'opere') {
      const newOp: PosOperaProvvisionaleItem = {
        id: newId,
        tipo: 'Nuova Opera Provvisionale',
        categoria: 'Ponteggi e Lavori in Quota',
        icona: '🪜',
        descrizione: 'Descrizione dell’opera provvisionale, posizionamento e funzioni.',
        marca: 'Produttore certificato',
        modello: 'Modello certificato',
        conformitaNormativa: 'D.Lgs. 81/08 Titolo IV Capo II',
        verifichePeriodiche: true,
        pimusRichiesto: false,
        prescrizioniSicurezza: 'Verificare sempre l’ancoraggio e la presenza di parapetti e tavole fermapiede.',
        dpiNecessari: ['Casco con sottogola', 'Calzature di sicurezza S3', 'Imbracatura anticaduta'],
        rischi: [
          {
            id: Math.random().toString(),
            descrizione: 'Caduta dall’alto di persone o cose',
            misurePreventive: 'Parapetti completi e ancoraggi certificati.',
            dpiRichiesti: ['Imbracatura anticaduta EN 361', 'Casco con sottogola'],
          },
        ],
      };
      setEditOpera(newOp);
      setActiveId(newId);
      setIsEditing(true);
    } else {
      const newSost: PosSostanzaItem = {
        id: newId,
        nomeCommerciale: 'Nuovo Preparato Chimico',
        descrizione: 'Descrizione chimico-fisica del preparato.',
        icona: '🧪',
        utilizzoFase: 'Opere murarie e finiture',
        produttore: 'Produttore con SDS',
        schedaSicurezzaPresente: true,
        pittogrammiPericolo: ['GHS07'],
        frasiH: 'H315: Provoca irritazione cutanea; H318: Provoca gravi lesioni oculari.',
        prescrizioniSicurezza: 'Stoccare in locale areato e manipolare con guanti e occhiali di protezione.',
        dpiSpecifici: ['Guanti rischio chimico', 'Occhiali di protezione a mascherina', 'Mascherina FFP2'],
        rischi: [
          {
            id: Math.random().toString(),
            descrizione: 'Contatto accidentale con pelle e occhi',
            misurePreventive: 'Uso dei DPI protettivi e disponibilità di flacone lavaggi oculari.',
            dpiRichiesti: ['Guanti rischio chimico', 'Occhiali ermetici'],
          },
        ],
      };
      setEditSostanza(newSost);
      setActiveId(newId);
      setIsEditing(true);
    }
  };

  // ==========================================
  // SALVATAGGIO SCHEDA MODIFICATA
  // ==========================================
  const handleSaveLavorazione = () => {
    if (!editLavorazione) return;
    const exists = customTemplates.findIndex(t => t.id === editLavorazione.id);
    let updated: PosAttivitaTemplate[];
    if (exists >= 0) {
      updated = customTemplates.map((t, i) => (i === exists ? editLavorazione : t));
    } else {
      updated = [...customTemplates, { ...editLavorazione, isCustom: true }];
    }
    onSaveTemplates(updated);
    setIsEditing(false);
  };

  const handleSaveAttrezzatura = () => {
    if (!editAttrezzatura || !onSaveAttrezzature) return;
    const exists = customAttrezzature.findIndex(t => t.id === editAttrezzatura.id);
    let updated: PosAttrezzaturaItem[];
    if (exists >= 0) {
      updated = customAttrezzature.map((t, i) => (i === exists ? editAttrezzatura : t));
    } else {
      updated = [...customAttrezzature, editAttrezzatura];
    }
    onSaveAttrezzature(updated);
    setIsEditing(false);
  };

  const handleSaveOpera = () => {
    if (!editOpera || !onSaveOpere) return;
    const exists = customOpere.findIndex(t => t.id === editOpera.id);
    let updated: PosOperaProvvisionaleItem[];
    if (exists >= 0) {
      updated = customOpere.map((t, i) => (i === exists ? editOpera : t));
    } else {
      updated = [...customOpere, editOpera];
    }
    onSaveOpere(updated);
    setIsEditing(false);
  };

  const handleSaveSostanza = () => {
    if (!editSostanza || !onSaveSostanze) return;
    const exists = customSostanze.findIndex(t => t.id === editSostanza.id);
    let updated: PosSostanzaItem[];
    if (exists >= 0) {
      updated = customSostanze.map((t, i) => (i === exists ? editSostanza : t));
    } else {
      updated = [...customSostanze, editSostanza];
    }
    onSaveSostanze(updated);
    setIsEditing(false);
  };

  // ==========================================
  // ELIMINAZIONE SCHEDA CUSTOM
  // ==========================================
  const handleDeleteItem = (id: string) => {
    if (!window.confirm('Sei sicuro di voler eliminare questa scheda dalla libreria?')) return;
    if (activeTab === 'lavorazioni') {
      const updated = customTemplates.filter(t => t.id !== id);
      onSaveTemplates(updated);
    } else if (activeTab === 'attrezzature' && onSaveAttrezzature) {
      const updated = customAttrezzature.filter(t => t.id !== id);
      onSaveAttrezzature(updated);
    } else if (activeTab === 'opere' && onSaveOpere) {
      const updated = customOpere.filter(t => t.id !== id);
      onSaveOpere(updated);
    } else if (activeTab === 'sostanze' && onSaveSostanze) {
      const updated = customSostanze.filter(t => t.id !== id);
      onSaveSostanze(updated);
    }
    if (activeId === id) {
      setActiveId(null);
      setIsEditing(false);
    }
  };

  // Selezione per modifica
  const handleStartEditCurrent = () => {
    if (activeTab === 'lavorazioni') {
      const found = allLavorazioni.find(t => t.id === activeId);
      if (found) {
        setEditLavorazione({ ...found });
        setIsEditing(true);
      }
    } else if (activeTab === 'attrezzature') {
      const found = allAttrezzature.find(t => t.id === activeId);
      if (found) {
        setEditAttrezzatura({ ...found });
        setIsEditing(true);
      }
    } else if (activeTab === 'opere') {
      const found = allOpere.find(t => t.id === activeId);
      if (found) {
        setEditOpera({ ...found });
        setIsEditing(true);
      }
    } else {
      const found = allSostanze.find(t => t.id === activeId);
      if (found) {
        setEditSostanza({ ...found });
        setIsEditing(true);
      }
    }
  };

  // ==========================================
  // FILTRAGGIO ELEMENTI
  // ==========================================
  const filteredLavorazioni = allLavorazioni.filter(t => {
    const matchCat = selectedSubCat === 'Tutte' || t.categoria === selectedSubCat;
    const matchSearch =
      t.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.descrizione.toLowerCase().includes(searchTerm.toLowerCase());
    return matchCat && matchSearch;
  });

  const filteredAttrezzature = allAttrezzature.filter(t => {
    const matchCat = selectedSubCat === 'Tutte' || t.categoria === selectedSubCat;
    const matchSearch =
      t.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.descrizione || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.marca || '').toLowerCase().includes(searchTerm.toLowerCase());
    return matchCat && matchSearch;
  });

  const filteredOpere = allOpere.filter(t => {
    const matchCat = selectedSubCat === 'Tutte' || t.categoria === selectedSubCat;
    const matchSearch =
      t.tipo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.descrizione.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.marca || '').toLowerCase().includes(searchTerm.toLowerCase());
    return matchCat && matchSearch;
  });

  const filteredSostanze = allSostanze.filter(t => {
    const matchCat = selectedSubCat === 'Tutte' || t.utilizzoFase === selectedSubCat;
    const matchSearch =
      t.nomeCommerciale.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.descrizione || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.produttore || '').toLowerCase().includes(searchTerm.toLowerCase());
    return matchCat && matchSearch;
  });

  // Elemento attivo selezionato
  const selectedLavorazione = allLavorazioni.find(t => t.id === activeId) || null;
  const selectedAttrezzatura = allAttrezzature.find(t => t.id === activeId) || null;
  const selectedOpera = allOpere.find(t => t.id === activeId) || null;
  const selectedSostanza = allSostanze.find(t => t.id === activeId) || null;

  // Verificare se un item è custom
  const isSelectedCustom = () => {
    if (activeTab === 'lavorazioni') return customTemplates.some(t => t.id === activeId);
    if (activeTab === 'attrezzature') return customAttrezzature.some(t => t.id === activeId);
    if (activeTab === 'opere') return customOpere.some(t => t.id === activeId);
    return customSostanze.some(t => t.id === activeId);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-2 sm:p-5">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-6xl w-full h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* HEADER MODALE */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">📚</span>
              <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-wide">
                Libreria Schede POS di Sicurezza Edile
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-[10px] font-black uppercase">
                All. XV D.Lgs. 81/08
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Gestione completa, consultazione e personalizzazione schede per Lavorazioni, Attrezzature e Mezzi, Opere Provvisionali e Sostanze Chimiche
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleAddNew}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-sm flex items-center gap-1.5"
            >
              <span>+</span>
              <span>
                {activeTab === 'lavorazioni' && 'Nuova Lavorazione'}
                {activeTab === 'attrezzature' && 'Nuova Attrezzatura'}
                {activeTab === 'opere' && 'Nuova Opera'}
                {activeTab === 'sostanze' && 'Nuova Sostanza'}
              </span>
            </button>
            <button
              onClick={onClose}
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors font-bold"
            >
              ✕
            </button>
          </div>
        </div>

        {/* 4 MACRO-CATEGORIE SCHEDE RICHIESTE */}
        <div className="flex items-center border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 pt-2 gap-2 overflow-x-auto shrink-0">
          <button
            onClick={() => handleTabChange('lavorazioni')}
            className={`flex items-center gap-2 py-2.5 px-4 rounded-t-xl font-black text-xs uppercase tracking-wide border-b-2 transition-all ${
              activeTab === 'lavorazioni'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-blue-50/40 dark:bg-blue-950/20'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span>🔨</span>
            <span>Lavorazioni ({allLavorazioni.length})</span>
          </button>

          <button
            onClick={() => handleTabChange('attrezzature')}
            className={`flex items-center gap-2 py-2.5 px-4 rounded-t-xl font-black text-xs uppercase tracking-wide border-b-2 transition-all ${
              activeTab === 'attrezzature'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-blue-50/40 dark:bg-blue-950/20'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span>🚜</span>
            <span>Attrezzature & Mezzi ({allAttrezzature.length})</span>
          </button>

          <button
            onClick={() => handleTabChange('opere')}
            className={`flex items-center gap-2 py-2.5 px-4 rounded-t-xl font-black text-xs uppercase tracking-wide border-b-2 transition-all ${
              activeTab === 'opere'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-blue-50/40 dark:bg-blue-950/20'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span>🪜</span>
            <span>Opere Provvisionali ({allOpere.length})</span>
          </button>

          <button
            onClick={() => handleTabChange('sostanze')}
            className={`flex items-center gap-2 py-2.5 px-4 rounded-t-xl font-black text-xs uppercase tracking-wide border-b-2 transition-all ${
              activeTab === 'sostanze'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-blue-50/40 dark:bg-blue-950/20'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span>🧪</span>
            <span>Sostanze Chimiche ({allSostanze.length})</span>
          </button>
        </div>

        {/* FILTRI DI RICERCA E SOTTOCATEGORIE */}
        <div className="p-3 sm:p-4 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-50/40 dark:bg-slate-900/40 shrink-0">
          <input
            type="text"
            placeholder={`Cerca tra ${activeTab}...`}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="p-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 text-xs w-64 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
          />

          <div className="flex items-center gap-1.5 overflow-x-auto text-[11px] font-bold custom-scrollbar">
            {currentCategories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedSubCat(cat)}
                className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
                  selectedSubCat === cat
                    ? 'bg-blue-600 text-white font-black shadow-sm'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 border border-slate-200 dark:border-slate-700'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* CORPO MODALE A DUE COLONNE */}
        <div className="flex-1 flex overflow-hidden text-xs">
          {/* LISTA SCHEDE A SINISTRA */}
          <div className="w-full md:w-5/12 p-3 sm:p-4 overflow-y-auto border-r border-slate-200 dark:border-slate-800 space-y-2.5">
            {activeTab === 'lavorazioni' &&
              filteredLavorazioni.map(tpl => {
                const isSelected = activeId === tpl.id;
                const isCustom = customTemplates.some(t => t.id === tpl.id);
                return (
                  <div
                    key={tpl.id}
                    onClick={() => {
                      setActiveId(tpl.id);
                      setIsEditing(false);
                    }}
                    className={`p-3 rounded-2xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/20 shadow-sm ring-1 ring-blue-500/30'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 bg-white dark:bg-slate-800/40'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <PosSchedaLogo tipo="lavorazione" title={tpl.nome} iconaEmoji={tpl.icona} logoUrl={(tpl as any).logoUrl} size="sm" />
                        <div>
                          <h4 className="font-black text-xs uppercase text-slate-900 dark:text-white leading-tight">
                            {tpl.nome}
                          </h4>
                          <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold">
                            {tpl.categoria}
                          </span>
                        </div>
                      </div>
                      {isCustom && (
                        <span className="px-1.5 py-0.5 bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 text-[9px] font-black rounded uppercase">
                          Modificabile
                        </span>
                      )}
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-2 line-clamp-2">
                      {tpl.descrizione}
                    </p>
                    <div className="mt-2 flex items-center gap-2 text-[10px] text-slate-400 font-bold">
                      <span>⚠️ {tpl.rischi.length} rischi</span>
                      <span>🛡️ {tpl.dpiRaccomandati?.length || 0} DPI</span>
                    </div>
                  </div>
                );
              })}

            {activeTab === 'attrezzature' &&
              filteredAttrezzature.map(att => {
                const isSelected = activeId === att.id;
                const isCustom = customAttrezzature.some(t => t.id === att.id);
                return (
                  <div
                    key={att.id}
                    onClick={() => {
                      setActiveId(att.id);
                      setIsEditing(false);
                    }}
                    className={`p-3 rounded-2xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/20 shadow-sm ring-1 ring-blue-500/30'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 bg-white dark:bg-slate-800/40'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <PosSchedaLogo tipo="attrezzatura" title={att.nome} iconaEmoji={att.icona} logoUrl={att.logoUrl || att.immagineUrl} size="sm" />
                        <div>
                          <h4 className="font-black text-xs uppercase text-slate-900 dark:text-white leading-tight">
                            {att.nome}
                          </h4>
                          <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold">
                            {att.categoria || 'Mezzo'} • {att.marca || 'CE'}
                          </span>
                        </div>
                      </div>
                      {isCustom && (
                        <span className="px-1.5 py-0.5 bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 text-[9px] font-black rounded uppercase">
                          Modificabile
                        </span>
                      )}
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-2 line-clamp-2">
                      {att.descrizione || att.prescrizioniSicurezza}
                    </p>
                  </div>
                );
              })}

            {activeTab === 'opere' &&
              filteredOpere.map(op => {
                const isSelected = activeId === op.id;
                const isCustom = customOpere.some(t => t.id === op.id);
                return (
                  <div
                    key={op.id}
                    onClick={() => {
                      setActiveId(op.id);
                      setIsEditing(false);
                    }}
                    className={`p-3 rounded-2xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/20 shadow-sm ring-1 ring-blue-500/30'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 bg-white dark:bg-slate-800/40'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <PosSchedaLogo tipo="opera" title={op.tipo} iconaEmoji={op.icona} logoUrl={op.logoUrl || op.immagineUrl} size="sm" />
                        <div>
                          <h4 className="font-black text-xs uppercase text-slate-900 dark:text-white leading-tight">
                            {op.tipo}
                          </h4>
                          <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold">
                            {op.categoria || 'Opera Quota'}
                          </span>
                        </div>
                      </div>
                      {isCustom && (
                        <span className="px-1.5 py-0.5 bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 text-[9px] font-black rounded uppercase">
                          Modificabile
                        </span>
                      )}
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-2 line-clamp-2">
                      {op.descrizione}
                    </p>
                  </div>
                );
              })}

            {activeTab === 'sostanze' &&
              filteredSostanze.map(sost => {
                const isSelected = activeId === sost.id;
                const isCustom = customSostanze.some(t => t.id === sost.id);
                return (
                  <div
                    key={sost.id}
                    onClick={() => {
                      setActiveId(sost.id);
                      setIsEditing(false);
                    }}
                    className={`p-3 rounded-2xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/20 shadow-sm ring-1 ring-blue-500/30'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 bg-white dark:bg-slate-800/40'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <PosSchedaLogo tipo="sostanza" title={sost.nomeCommerciale} iconaEmoji={sost.icona} logoUrl={sost.logoUrl || sost.immagineUrl} size="sm" />
                        <div>
                          <h4 className="font-black text-xs uppercase text-slate-900 dark:text-white leading-tight">
                            {sost.nomeCommerciale}
                          </h4>
                          <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold">
                            {sost.produttore || 'SDS Cantiere'}
                          </span>
                        </div>
                      </div>
                      {isCustom && (
                        <span className="px-1.5 py-0.5 bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 text-[9px] font-black rounded uppercase">
                          Modificabile
                        </span>
                      )}
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-2 line-clamp-2">
                      {sost.descrizione || sost.frasiH}
                    </p>
                  </div>
                );
              })}
          </div>

          {/* DETTAGLIO ED EDITING A DESTRA */}
          <div className="hidden md:block md:w-7/12 p-5 overflow-y-auto bg-slate-50/30 dark:bg-slate-900/30">
            {isEditing ? (
              /* MODALITA EDITING ATTIVA */
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                  <h3 className="text-sm font-black uppercase text-slate-900 dark:text-white">
                    ✏️ Modifica Scheda di Sicurezza
                  </h3>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIsEditing(false)}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold text-xs"
                    >
                      Annulla
                    </button>
                    <button
                      onClick={() => {
                        if (activeTab === 'lavorazioni') handleSaveLavorazione();
                        else if (activeTab === 'attrezzature') handleSaveAttrezzatura();
                        else if (activeTab === 'opere') handleSaveOpera();
                        else handleSaveSostanza();
                      }}
                      className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase shadow-sm"
                    >
                      Salva Modifiche
                    </button>
                  </div>
                </div>

                {/* FORM EDIT LAVORAZIONE */}
                {activeTab === 'lavorazioni' && editLavorazione && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <PosSchedaLogo
                        tipo="lavorazione"
                        title={editLavorazione.nome}
                        iconaEmoji={editLavorazione.icona}
                        logoUrl={(editLavorazione as any).logoUrl}
                        size="md"
                        onEditLogo={() => setIsLogoPickerOpen(true)}
                      />
                      <div className="flex-1">
                        <label className="block text-[10px] font-black uppercase text-slate-400">Nome Lavorazione</label>
                        <input
                          type="text"
                          value={editLavorazione.nome}
                          onChange={e => setEditLavorazione({ ...editLavorazione, nome: e.target.value })}
                          className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-black uppercase text-slate-400">Categoria</label>
                        <input
                          type="text"
                          value={editLavorazione.categoria}
                          onChange={e => setEditLavorazione({ ...editLavorazione, categoria: e.target.value })}
                          className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black uppercase text-slate-400">Fase di Lavoro</label>
                        <input
                          type="text"
                          value={editLavorazione.faseLavoro || ''}
                          onChange={e => setEditLavorazione({ ...editLavorazione, faseLavoro: e.target.value })}
                          className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-black uppercase text-slate-400">Descrizione Operativa & Sequenza</label>
                      <textarea
                        rows={3}
                        value={editLavorazione.descrizione}
                        onChange={e => setEditLavorazione({ ...editLavorazione, descrizione: e.target.value })}
                        className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs leading-relaxed"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-black uppercase text-slate-400">DPI Raccomandati (separati da virgola)</label>
                      <input
                        type="text"
                        value={editLavorazione.dpiRaccomandati.join(', ')}
                        onChange={e =>
                          setEditLavorazione({
                            ...editLavorazione,
                            dpiRaccomandati: e.target.value.split(',').map(s => s.trim()).filter(Boolean),
                          })
                        }
                        className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
                      />
                    </div>
                  </div>
                )}

                {/* FORM EDIT ATTREZZATURA */}
                {activeTab === 'attrezzature' && editAttrezzatura && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <PosSchedaLogo
                        tipo="attrezzatura"
                        title={editAttrezzatura.nome}
                        iconaEmoji={editAttrezzatura.icona}
                        logoUrl={editAttrezzatura.logoUrl || editAttrezzatura.immagineUrl}
                        size="md"
                        onEditLogo={() => setIsLogoPickerOpen(true)}
                      />
                      <div className="flex-1">
                        <label className="block text-[10px] font-black uppercase text-slate-400">Nome Attrezzatura / Mezzo</label>
                        <input
                          type="text"
                          value={editAttrezzatura.nome}
                          onChange={e => setEditAttrezzatura({ ...editAttrezzatura, nome: e.target.value })}
                          className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-black uppercase text-slate-400">Marca / Costruttore</label>
                        <input
                          type="text"
                          value={editAttrezzatura.marca || ''}
                          onChange={e => setEditAttrezzatura({ ...editAttrezzatura, marca: e.target.value })}
                          className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black uppercase text-slate-400">Modello / Matricola</label>
                        <input
                          type="text"
                          value={editAttrezzatura.modelloMatricola || ''}
                          onChange={e => setEditAttrezzatura({ ...editAttrezzatura, modelloMatricola: e.target.value })}
                          className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-black uppercase text-slate-400">Descrizione & Istruzioni d'Uso</label>
                      <textarea
                        rows={2}
                        value={editAttrezzatura.descrizione || ''}
                        onChange={e => setEditAttrezzatura({ ...editAttrezzatura, descrizione: e.target.value })}
                        className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-black uppercase text-slate-400">Prescrizioni di Sicurezza & Verifiche</label>
                      <textarea
                        rows={2}
                        value={editAttrezzatura.prescrizioniSicurezza || ''}
                        onChange={e => setEditAttrezzatura({ ...editAttrezzatura, prescrizioniSicurezza: e.target.value })}
                        className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
                      />
                    </div>
                  </div>
                )}

                {/* FORM EDIT OPERA PROVVISIONALE */}
                {activeTab === 'opere' && editOpera && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <PosSchedaLogo
                        tipo="opera"
                        title={editOpera.tipo}
                        iconaEmoji={editOpera.icona}
                        logoUrl={editOpera.logoUrl || editOpera.immagineUrl}
                        size="md"
                        onEditLogo={() => setIsLogoPickerOpen(true)}
                      />
                      <div className="flex-1">
                        <label className="block text-[10px] font-black uppercase text-slate-400">Tipologia Opera Provvisionale</label>
                        <input
                          type="text"
                          value={editOpera.tipo}
                          onChange={e => setEditOpera({ ...editOpera, tipo: e.target.value })}
                          className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-black uppercase text-slate-400">Descrizione & Destinazione d'Uso</label>
                      <textarea
                        rows={2}
                        value={editOpera.descrizione}
                        onChange={e => setEditOpera({ ...editOpera, descrizione: e.target.value })}
                        className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-black uppercase text-slate-400">Prescrizioni di Montaggio, Uso e Smontaggio</label>
                      <textarea
                        rows={2}
                        value={editOpera.prescrizioniSicurezza || ''}
                        onChange={e => setEditOpera({ ...editOpera, prescrizioniSicurezza: e.target.value })}
                        className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
                      />
                    </div>
                  </div>
                )}

                {/* FORM EDIT SOSTANZA CHIMICA */}
                {activeTab === 'sostanze' && editSostanza && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <PosSchedaLogo
                        tipo="sostanza"
                        title={editSostanza.nomeCommerciale}
                        iconaEmoji={editSostanza.icona}
                        logoUrl={editSostanza.logoUrl || editSostanza.immagineUrl}
                        size="md"
                        onEditLogo={() => setIsLogoPickerOpen(true)}
                      />
                      <div className="flex-1">
                        <label className="block text-[10px] font-black uppercase text-slate-400">Nome Commerciale Sostanza</label>
                        <input
                          type="text"
                          value={editSostanza.nomeCommerciale}
                          onChange={e => setEditSostanza({ ...editSostanza, nomeCommerciale: e.target.value })}
                          className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-black uppercase text-slate-400">Produttore / Fornitore</label>
                        <input
                          type="text"
                          value={editSostanza.produttore || ''}
                          onChange={e => setEditSostanza({ ...editSostanza, produttore: e.target.value })}
                          className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black uppercase text-slate-400">Fase di Utilizzo</label>
                        <input
                          type="text"
                          value={editSostanza.utilizzoFase}
                          onChange={e => setEditSostanza({ ...editSostanza, utilizzoFase: e.target.value })}
                          className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-black uppercase text-slate-400">Frasi di Pericolo H ed Avvertenze CLP</label>
                      <textarea
                        rows={2}
                        value={editSostanza.frasiH || editSostanza.frasiRischio || ''}
                        onChange={e => setEditSostanza({ ...editSostanza, frasiH: e.target.value })}
                        className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
                      />
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* MODALITA VISUALIZZAZIONE SCHEDA SELEZIONATA */
              <div>
                {activeTab === 'lavorazioni' && selectedLavorazione && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                      <div className="flex items-center gap-3">
                        <PosSchedaLogo
                          tipo="lavorazione"
                          title={selectedLavorazione.nome}
                          iconaEmoji={selectedLavorazione.icona}
                          logoUrl={(selectedLavorazione as any).logoUrl}
                          size="md"
                        />
                        <div>
                          <h3 className="font-black text-sm uppercase text-slate-900 dark:text-white">
                            {selectedLavorazione.nome}
                          </h3>
                          <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 uppercase">
                            {selectedLavorazione.categoria} • {selectedLavorazione.faseLavoro || 'Cantiere'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleStartEditCurrent}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm"
                        >
                          ✏️ Modifica
                        </button>
                        {isSelectedCustom() && (
                          <button
                            onClick={() => handleDeleteItem(selectedLavorazione.id)}
                            className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-xl"
                            title="Elimina dalla libreria"
                          >
                            🗑️
                          </button>
                        )}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-black uppercase text-[10px] text-slate-400 mb-1">Descrizione Operativa</h4>
                      <p className="text-slate-700 dark:text-slate-300 leading-relaxed bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                        {selectedLavorazione.descrizione}
                      </p>
                    </div>

                    <div>
                      <h4 className="font-black uppercase text-[10px] text-slate-400 mb-1">Rischi Analizzati ({selectedLavorazione.rischi.length})</h4>
                      <div className="space-y-2">
                        {selectedLavorazione.rischi.map((r, i) => (
                          <div key={i} className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                            <strong className="text-rose-700 dark:text-rose-400 text-xs block">⚠️ {r.descrizione}</strong>
                            <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1">
                              <strong>Misure:</strong> {r.misurePreventive}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-black uppercase text-[10px] text-slate-400 mb-1">DPI Prescritti</h4>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedLavorazione.dpiRaccomandati.map((dpi, i) => (
                          <span key={i} className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200 border border-blue-200 dark:border-blue-900 text-[11px] font-bold">
                            {dpi}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'attrezzature' && selectedAttrezzatura && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                      <div className="flex items-center gap-3">
                        <PosSchedaLogo
                          tipo="attrezzatura"
                          title={selectedAttrezzatura.nome}
                          iconaEmoji={selectedAttrezzatura.icona}
                          logoUrl={selectedAttrezzatura.logoUrl || selectedAttrezzatura.immagineUrl}
                          size="md"
                        />
                        <div>
                          <h3 className="font-black text-sm uppercase text-slate-900 dark:text-white">
                            {selectedAttrezzatura.nome}
                          </h3>
                          <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 uppercase">
                            {selectedAttrezzatura.categoria || 'Mezzo'} • {selectedAttrezzatura.marca || 'CE'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleStartEditCurrent}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm"
                        >
                          ✏️ Modifica
                        </button>
                        {isSelectedCustom() && (
                          <button
                            onClick={() => handleDeleteItem(selectedAttrezzatura.id)}
                            className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-xl"
                            title="Elimina dalla libreria"
                          >
                            🗑️
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                      <div>
                        <span className="text-[10px] font-black uppercase text-slate-400 block">Modello / Matricola:</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">{selectedAttrezzatura.modelloMatricola || 'Conforme a libretto'}</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-black uppercase text-slate-400 block">Operatore Abilitato:</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">{selectedAttrezzatura.operatoreAbilitato || 'Personale addestrato'}</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-black uppercase text-slate-400 block">Prescrizioni di Sicurezza:</span>
                        <p className="text-slate-700 dark:text-slate-300 leading-relaxed mt-1">
                          {selectedAttrezzatura.prescrizioniSicurezza}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'opere' && selectedOpera && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                      <div className="flex items-center gap-3">
                        <PosSchedaLogo
                          tipo="opera"
                          title={selectedOpera.tipo}
                          iconaEmoji={selectedOpera.icona}
                          logoUrl={selectedOpera.logoUrl || selectedOpera.immagineUrl}
                          size="md"
                        />
                        <div>
                          <h3 className="font-black text-sm uppercase text-slate-900 dark:text-white">
                            {selectedOpera.tipo}
                          </h3>
                          <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 uppercase">
                            {selectedOpera.categoria || 'Opera Quota'} • {selectedOpera.conformitaNormativa || 'D.Lgs. 81/08'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleStartEditCurrent}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm"
                        >
                          ✏️ Modifica
                        </button>
                        {isSelectedCustom() && (
                          <button
                            onClick={() => handleDeleteItem(selectedOpera.id)}
                            className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-xl"
                            title="Elimina dalla libreria"
                          >
                            🗑️
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                      <div>
                        <span className="text-[10px] font-black uppercase text-slate-400 block">Descrizione d'Uso:</span>
                        <p className="text-slate-700 dark:text-slate-300 leading-relaxed mt-1">{selectedOpera.descrizione}</p>
                      </div>
                      <div>
                        <span className="text-[10px] font-black uppercase text-slate-400 block">Prescrizioni Montaggio / Uso:</span>
                        <p className="text-slate-700 dark:text-slate-300 leading-relaxed mt-1">{selectedOpera.prescrizioniSicurezza}</p>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'sostanze' && selectedSostanza && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                      <div className="flex items-center gap-3">
                        <PosSchedaLogo
                          tipo="sostanza"
                          title={selectedSostanza.nomeCommerciale}
                          iconaEmoji={selectedSostanza.icona}
                          logoUrl={selectedSostanza.logoUrl || selectedSostanza.immagineUrl}
                          size="md"
                        />
                        <div>
                          <h3 className="font-black text-sm uppercase text-slate-900 dark:text-white">
                            {selectedSostanza.nomeCommerciale}
                          </h3>
                          <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 uppercase">
                            {selectedSostanza.produttore || 'SDS Cantiere'} • {selectedSostanza.utilizzoFase}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleStartEditCurrent}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm"
                        >
                          ✏️ Modifica
                        </button>
                        {isSelectedCustom() && (
                          <button
                            onClick={() => handleDeleteItem(selectedSostanza.id)}
                            className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-xl"
                            title="Elimina dalla libreria"
                          >
                            🗑️
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                      <div>
                        <span className="text-[10px] font-black uppercase text-slate-400 block">Frasi H / Pericoli CLP:</span>
                        <p className="text-rose-700 dark:text-rose-400 font-bold mt-1">
                          {selectedSostanza.frasiH || selectedSostanza.frasiRischio || 'Consultare SDS'}
                        </p>
                      </div>
                      <div>
                        <span className="text-[10px] font-black uppercase text-slate-400 block">Prescrizioni di Manipolazione & Stoccaggio:</span>
                        <p className="text-slate-700 dark:text-slate-300 leading-relaxed mt-1">
                          {selectedSostanza.prescrizioniSicurezza || selectedSostanza.prescrizioniManipolazione || 'Stoccare in locale asciutto e ventilato.'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {!activeId && (
                  <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-400">
                    <span className="text-4xl mb-2">👈</span>
                    <p className="font-bold text-xs">
                      Seleziona una scheda dalla colonna di sinistra per visualizzare le prescrizioni, i rischi e i DPI normativi, oppure clicca su "+ Nuova" per crearne una personalizzata.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* MODALE LOGO PICKER INTERNO */}
        {isLogoPickerOpen && (
          <PosSchedaLogoPickerModal
            tipo={activeTab === 'lavorazioni' ? 'lavorazione' : activeTab === 'attrezzature' ? 'attrezzatura' : activeTab === 'opere' ? 'opera' : 'sostanza'}
            title="Scegli Immagine o Icona Scheda"
            currentLogoUrl={
              activeTab === 'lavorazioni'
                ? (editLavorazione as any)?.logoUrl
                : activeTab === 'attrezzature'
                ? editAttrezzatura?.logoUrl
                : activeTab === 'opere'
                ? editOpera?.logoUrl
                : editSostanza?.logoUrl
            }
            currentIcona={
              activeTab === 'lavorazioni'
                ? editLavorazione?.icona
                : activeTab === 'attrezzature'
                ? editAttrezzatura?.icona
                : activeTab === 'opere'
                ? editOpera?.icona
                : editSostanza?.icona
            }
            onSave={({ logoUrl, icona }) => {
              if (activeTab === 'lavorazioni' && editLavorazione) {
                setEditLavorazione({ ...editLavorazione, icona: icona || editLavorazione.icona, logoUrl } as any);
              } else if (activeTab === 'attrezzature' && editAttrezzatura) {
                setEditAttrezzatura({ ...editAttrezzatura, icona: icona || editAttrezzatura.icona, logoUrl });
              } else if (activeTab === 'opere' && editOpera) {
                setEditOpera({ ...editOpera, icona: icona || editOpera.icona, logoUrl });
              } else if (activeTab === 'sostanze' && editSostanza) {
                setEditSostanza({ ...editSostanza, icona: icona || editSostanza.icona, logoUrl });
              }
              setIsLogoPickerOpen(false);
            }}
            onClose={() => setIsLogoPickerOpen(false)}
          />
        )}
      </div>
    </div>
  );
};
