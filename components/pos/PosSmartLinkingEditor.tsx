import React, { useState } from 'react';
import {
  PosAttivitaItem,
  PosAttivitaTemplate,
  PosRischio,
  PosLavoratoreAssegnato,
  PosAttrezzaturaItem,
  PosSostanzaItem,
  PosOperaProvvisionaleItem,
} from '../../types';
import {
  DEFAULT_POS_TEMPLATES,
  DEFAULT_ATTREZZATURE_CATALOGO,
  DEFAULT_SOSTANZE_CATALOGO,
  DEFAULT_OPERE_PROVVISIONALI_LIST,
  POS_DPI_LIST,
  CALCOLA_RISCHIO,
  CALCOLA_RISCHIO_TECNICO,
} from '../../data/posDefaultData';
import {
  PosSchedaLogo,
  PosSchedaLogoPickerModal,
  DpiPictogram,
  PosDpiBadge,
} from './PosSafetyCardVisuals';
import { PosTemplateLibraryModal } from './PosTemplateLibraryModal';

interface PosSmartLinkingEditorProps {
  attivita: PosAttivitaItem[];
  lavoratori: PosLavoratoreAssegnato[];
  attrezzatureGlobali: PosAttrezzaturaItem[];
  sostanzeGlobali: PosSostanzaItem[];
  opereGlobali: PosOperaProvvisionaleItem[];
  customTemplates?: PosAttivitaTemplate[];
  customAttrezzature?: PosAttrezzaturaItem[];
  customOpere?: PosOperaProvvisionaleItem[];
  customSostanze?: PosSostanzaItem[];
  onChangeAttivita: (updated: PosAttivitaItem[]) => void;
  onSyncGlobalCatalog: (items: {
    attrezzature?: string[];
    sostanze?: string[];
    opere?: string[];
  }) => void;
  onUpdateCustomTemplates?: (templates: PosAttivitaTemplate[]) => void;
  onUpdateCustomAttrezzature?: (items: PosAttrezzaturaItem[]) => void;
  onUpdateCustomOpere?: (items: PosOperaProvvisionaleItem[]) => void;
  onUpdateCustomSostanze?: (items: PosSostanzaItem[]) => void;
}

export const PosSmartLinkingEditor: React.FC<PosSmartLinkingEditorProps> = ({
  attivita,
  lavoratori,
  customTemplates = [],
  customAttrezzature = [],
  customOpere = [],
  customSostanze = [],
  onChangeAttivita,
  onSyncGlobalCatalog,
  onUpdateCustomTemplates,
  onUpdateCustomAttrezzature,
  onUpdateCustomOpere,
  onUpdateCustomSostanze,
}) => {
  const [selectedIdx, setSelectedIdx] = useState<number>(0);
  const [isLibraryOpen, setIsLibraryOpen] = useState<boolean>(false);
  const [isFullLibraryModalOpen, setIsFullLibraryModalOpen] = useState<boolean>(false);
  const [librarySearch, setLibrarySearch] = useState<string>('');
  const [libraryCategory, setLibraryCategory] = useState<string>('Tutte');
  const [syncNotice, setSyncNotice] = useState<string | null>(null);
  const [isLogoPickerOpen, setIsLogoPickerOpen] = useState<boolean>(false);
  const [customDpiText, setCustomDpiText] = useState<string>('');

  const currentAttivita = attivita[selectedIdx] || null;

  // Aggiunta diretta di una nuova scheda dalla libreria al documento POS
  const handleAddActivityFromTemplate = (tpl: PosAttivitaTemplate) => {
    const nuova: PosAttivitaItem = {
      id: `att-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      templateId: tpl.id,
      nome: tpl.nome || 'Nuova Lavorazione da Libreria',
      categoria: tpl.categoria || 'Opere Generali',
      icona: tpl.icona || '🔨',
      logoUrl: (tpl as any).logoUrl || tpl.immagineUrl,
      immagineUrl: tpl.immagineUrl || (tpl as any).logoUrl,
      descrizione: tpl.descrizione || 'Fasi operative eseguite secondo buone prassi e conformità D.Lgs. 81/08.',
      faseLavoro: tpl.faseLavoro || 'Fase Esecutiva',
      personaleCoinvolto: (lavoratori || []).map(l => `${l.nome} ${l.cognome}`),
      attrezzatureUtilizzate: [...(tpl.attrezzatureTipiche || [])],
      materialiUtilizzati: [...(tpl.materialiTipici || [])],
      sostanzeUtilizzate: [...(tpl.sostanzeTipiche || [])],
      opereProvvisionaliUtilizzate: [...(tpl.opereProvvisionaliTipiche || [])],
      rischi: (tpl.rischi || []).map(r => {
        const tec = CALCOLA_RISCHIO_TECNICO(r);
        return {
          ...r,
          id: `r-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
          probabilitaIniziale: tec.pIniziale,
          dannoIniziale: tec.dIniziale,
          rischioIniziale: tec.rIniziale,
          classeRischioIniziale: tec.classeIniziale,
          probabilitaResidua: tec.pResiduo,
          dannoResiduo: tec.dResiduo,
          rischioResiduo: tec.rResiduo,
          classeRischioResiduo: tec.classeResidua,
          probabilita: tec.pResiduo,
          danno: tec.dResiduo,
          livelloRischio: tec.rResiduo,
          classeRischio: tec.classeResidua,
          misureProtezioneCollettiva: r.misureProtezioneCollettiva || tec.protezioneCollettivaDPC,
          misurePreventive: r.misurePreventive || tec.misuraOrganizzativa,
        };
      }),
      misurePrevenzione: [...(tpl.misurePrevenzione || [])],
      dpiNecessari: [...(tpl.dpiRaccomandati || [])],
      interferenze: tpl.interferenze || 'Verificare l’assenza di interferenze operative prima dell’avvio dei lavori.',
      note: tpl.note,
    };

    const updatedList = [...attivita, nuova];
    onChangeAttivita(updatedList);
    setSelectedIdx(updatedList.length - 1);

    // Registra gli elementi utilizzati nei capitoli globali (Attrezzature, Sostanze, Opere)
    onSyncGlobalCatalog({
      attrezzature: nuova.attrezzatureUtilizzate,
      sostanze: nuova.sostanzeUtilizzate,
      opere: nuova.opereProvvisionaliUtilizzate,
    });

    setSyncNotice(`✓ Scheda "${tpl.nome}" aggiunta con successo alle lavorazioni del POS!`);
    setTimeout(() => setSyncNotice(null), 4000);
  };

  // Applicazione della proposta da catalogo alla scheda selezionata
  const handleApplySmartProposal = (tpl: PosAttivitaTemplate) => {
    if (!currentAttivita) return;

    const sostanzeTipiche = tpl.sostanzeTipiche || [];
    const opereTipiche = tpl.opereProvvisionaliTipiche || [];

    const updated: PosAttivitaItem = {
      ...currentAttivita,
      nome: currentAttivita.nome || tpl.nome,
      categoria: tpl.categoria || currentAttivita.categoria,
      icona: tpl.icona || currentAttivita.icona,
      logoUrl: (tpl as any).logoUrl || tpl.immagineUrl || currentAttivita.logoUrl,
      immagineUrl: tpl.immagineUrl || (tpl as any).logoUrl || currentAttivita.immagineUrl,
      descrizione: currentAttivita.descrizione || tpl.descrizione,
      faseLavoro: currentAttivita.faseLavoro || tpl.faseLavoro,
      attrezzatureUtilizzate: Array.from(new Set([...(currentAttivita.attrezzatureUtilizzate || []), ...(tpl.attrezzatureTipiche || [])])),
      materialiUtilizzati: Array.from(new Set([...(currentAttivita.materialiUtilizzati || []), ...(tpl.materialiTipici || [])])),
      sostanzeUtilizzate: Array.from(new Set([...(currentAttivita.sostanzeUtilizzate || []), ...sostanzeTipiche])),
      opereProvvisionaliUtilizzate: Array.from(new Set([...(currentAttivita.opereProvvisionaliUtilizzate || []), ...opereTipiche])),
      rischi: (tpl.rischi || []).map(r => {
        const tec = CALCOLA_RISCHIO_TECNICO(r);
        return {
          ...r,
          id: `r-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
          probabilitaIniziale: tec.pIniziale,
          dannoIniziale: tec.dIniziale,
          rischioIniziale: tec.rIniziale,
          classeRischioIniziale: tec.classeIniziale,
          probabilitaResidua: tec.pResiduo,
          dannoResiduo: tec.dResiduo,
          rischioResiduo: tec.rResiduo,
          classeRischioResiduo: tec.classeResidua,
          probabilita: tec.pResiduo,
          danno: tec.dResiduo,
          livelloRischio: tec.rResiduo,
          classeRischio: tec.classeResidua,
          misureProtezioneCollettiva: r.misureProtezioneCollettiva || tec.protezioneCollettivaDPC,
          misurePreventive: r.misurePreventive || tec.misuraOrganizzativa,
        };
      }),
      misurePrevenzione: Array.from(new Set([...(currentAttivita.misurePrevenzione || []), ...(tpl.misurePrevenzione || [])])),
      dpiNecessari: Array.from(new Set([...(currentAttivita.dpiNecessari || []), ...(tpl.dpiRaccomandati || [])])),
      interferenze: tpl.interferenze || currentAttivita.interferenze,
    };

    const newAttivitaList = attivita.map((a, i) => (i === selectedIdx ? updated : a));
    onChangeAttivita(newAttivitaList);

    onSyncGlobalCatalog({
      attrezzature: updated.attrezzatureUtilizzate,
      sostanze: updated.sostanzeUtilizzate,
      opere: updated.opereProvvisionaliUtilizzate,
    });

    setSyncNotice(`✓ Dati del modello applicati alla scheda "${tpl.nome}" (Attrezzature, Sostanze, Opere, Rischi PxD, Misure e DPI collegati)`);
    setTimeout(() => setSyncNotice(null), 4000);
  };

  // Salvataggio della lavorazione corrente del POS direttamente nella Libreria Schede
  const handleSaveCurrentActivityToLibrary = () => {
    if (!currentAttivita) return;
    const templateId = currentAttivita.templateId && currentAttivita.templateId.startsWith('custom_')
      ? currentAttivita.templateId
      : `custom_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;

    const newTpl: PosAttivitaTemplate = {
      id: templateId,
      nome: currentAttivita.nome?.trim() || 'Lavorazione Personalizzata',
      categoria: currentAttivita.categoria?.trim() || 'Opere Generali',
      icona: currentAttivita.icona || '🔨',
      logoUrl: currentAttivita.logoUrl,
      immagineUrl: currentAttivita.immagineUrl,
      descrizione: currentAttivita.descrizione?.trim() || 'Fasi operative eseguite secondo buone prassi D.Lgs. 81/08.',
      faseLavoro: currentAttivita.faseLavoro?.trim() || 'Fase Esecutiva',
      attrezzatureTipiche: [...(currentAttivita.attrezzatureUtilizzate || [])],
      materialiTipici: [...(currentAttivita.materialiUtilizzati || [])],
      sostanzeTipiche: [...(currentAttivita.sostanzeUtilizzate || [])],
      opereProvvisionaliTipiche: [...(currentAttivita.opereProvvisionaliUtilizzate || [])],
      rischi: (currentAttivita.rischi || []).map(r => {
        const tec = CALCOLA_RISCHIO_TECNICO(r);
        return {
          ...r,
          id: r.id || `r-${Math.random().toString(36).substr(2, 6)}`,
          probabilitaIniziale: tec.pIniziale,
          dannoIniziale: tec.dIniziale,
          rischioIniziale: tec.rIniziale,
          classeRischioIniziale: tec.classeIniziale,
          probabilitaResidua: tec.pResiduo,
          dannoResiduo: tec.dResiduo,
          rischioResiduo: tec.rResiduo,
          classeRischioResiduo: tec.classeResidua,
          probabilita: tec.pResiduo,
          danno: tec.dResiduo,
          livelloRischio: tec.rResiduo,
          classeRischio: tec.classeResidua,
          misureProtezioneCollettiva: r.misureProtezioneCollettiva || tec.protezioneCollettivaDPC,
          misurePreventive: r.misurePreventive || tec.misuraOrganizzativa,
        };
      }),
      misurePrevenzione: [...(currentAttivita.misurePrevenzione || [])],
      dpiRaccomandati: [...(currentAttivita.dpiNecessari || [])],
      interferenze: currentAttivita.interferenze,
      note: currentAttivita.note,
      isCustom: true,
    };

    if (onUpdateCustomTemplates) {
      const exists = (customTemplates || []).findIndex(t => t.id === templateId);
      let updatedList: PosAttivitaTemplate[];
      if (exists >= 0) {
        updatedList = customTemplates.map((t, i) => (i === exists ? newTpl : t));
      } else {
        updatedList = [...(customTemplates || []), newTpl];
      }
      onUpdateCustomTemplates(updatedList);
    }

    if (!currentAttivita.templateId) {
      updateCurrentActivity({ templateId });
    }

    setSyncNotice(`✓ Lavorazione "${newTpl.nome}" salvata con successo nella Libreria Schede del software!`);
    setTimeout(() => setSyncNotice(null), 4000);
  };

  const handleAddNewActivity = () => {
    const nuova: PosAttivitaItem = {
      id: Math.random().toString(),
      nome: 'Nuova Fase Lavorativa',
      categoria: 'Opere Edili Generali',
      icona: '🔨',
      descrizione: 'Descrizione delle lavorazioni e fasi operative da eseguirsi.',
      faseLavoro: 'Fase operativa ordinaria',
      personaleCoinvolto: lavoratori.map(l => `${l.nome} ${l.cognome}`),
      attrezzatureUtilizzate: ['Utensili manuali ordinari'],
      materialiUtilizzati: ['Materiali inerti da costruzione'],
      sostanzeUtilizzate: [],
      opereProvvisionaliUtilizzate: [],
      rischi: [
        {
          id: Math.random().toString(),
          descrizione: 'Urti, colpi, tagli e abrasioni durante le lavorazioni manuali',
          fonteRischio: 'Attrezzi a mano e movimentazione materiali',
          probabilita: 2,
          danno: 2,
          livelloRischio: 4,
          classeRischio: 'Accettabile',
          misurePreventive: 'Impiego di attrezzi a norma e conformi alle buone prassi.',
          misureProtettive: 'Delimitazione zona operativa e vigilanza del preposto.',
          dpiRichiesti: ['Guanti rischio meccanico', 'Calzature di sicurezza S3'],
        },
      ],
      misurePrevenzione: [
        'Mantenere sgombro e pulito il piano di calpestio.',
        'Utilizzare attrezzi conformi con protezioni integre.',
      ],
      dpiNecessari: ['Casco di protezione / Elmetto', 'Calzature di sicurezza S3', 'Guanti rischio meccanico'],
      interferenze: 'Coordinamento preventivo con eventuali altre maestranze operanti nel settore.',
    };

    const updatedList = [...attivita, nuova];
    onChangeAttivita(updatedList);
    setSelectedIdx(updatedList.length - 1);
  };

  const handleRemoveActivity = (idx: number) => {
    if (attivita.length <= 1) {
      alert('Il POS deve contenere almeno una lavorazione.');
      return;
    }
    const updated = attivita.filter((_, i) => i !== idx);
    onChangeAttivita(updated);
    if (selectedIdx >= updated.length) {
      setSelectedIdx(updated.length - 1);
    }
  };

  const updateCurrentActivity = (patch: Partial<PosAttivitaItem>) => {
    if (!currentAttivita) return;
    const updated = { ...currentAttivita, ...patch };
    onChangeAttivita(attivita.map((a, i) => (i === selectedIdx ? updated : a)));
  };

  // Helper per Rischi PxD
  const handleUpdateRisk = (rIdx: number, patch: Partial<PosRischio>) => {
    if (!currentAttivita) return;
    const updatedRisks = currentAttivita.rischi.map((r, i) => {
      if (i !== rIdx) return r;
      const p = patch.probabilita !== undefined ? patch.probabilita : r.probabilita;
      const d = patch.danno !== undefined ? patch.danno : r.danno;
      const calc = CALCOLA_RISCHIO(p, d);
      return {
        ...r,
        ...patch,
        probabilita: p,
        danno: d,
        livelloRischio: calc.livello,
        classeRischio: calc.classe,
      };
    });
    updateCurrentActivity({ rischi: updatedRisks });
  };

  const handleAddRisk = () => {
    if (!currentAttivita) return;
    const newRisk: PosRischio = {
      id: Math.random().toString(),
      descrizione: 'Nuovo Rischio Specifico di Fase',
      probabilita: 2,
      danno: 2,
      livelloRischio: 4,
      classeRischio: 'Accettabile',
      misurePreventive: 'Adozione di misure tecniche e organizzative secondo norma.',
      dpiRichiesti: ['Calzature di sicurezza S3'],
    };
    updateCurrentActivity({ rischi: [...currentAttivita.rischi, newRisk] });
  };

  const handleRemoveRisk = (rIdx: number) => {
    if (!currentAttivita) return;
    updateCurrentActivity({ rischi: currentAttivita.rischi.filter((_, i) => i !== rIdx) });
  };

  // Sincronizzazione automatica con i capitoli 10, 11 e 12
  const handleSyncToGlobal = () => {
    if (!currentAttivita) return;
    onSyncGlobalCatalog({
      attrezzature: currentAttivita.attrezzatureUtilizzate,
      sostanze: currentAttivita.sostanzeUtilizzate,
      opere: currentAttivita.opereProvvisionaliUtilizzate,
    });
    setSyncNotice('✓ Elementi della lavorazione sincronizzati nei Capitoli 10 (Attrezzature), 11 (Opere Provvisionali) e 12 (Sostanze)!');
    setTimeout(() => setSyncNotice(null), 4000);
  };

  const getDpiIcon = (dpiNome: string) => {
    const found = POS_DPI_LIST.find(d => dpiNome.toLowerCase().includes(d.nome.toLowerCase()) || d.nome.toLowerCase().includes(dpiNome.toLowerCase()));
    return found ? found.icona : '🛡️';
  };

  // Filtro template libreria
  const allTemplates = [...DEFAULT_POS_TEMPLATES, ...customTemplates];
  const allCategories = ['Tutte', ...Array.from(new Set(allTemplates.map(t => t.categoria || 'Generale')))];

  const filteredTemplates = allTemplates.filter(t => {
    const matchesCat = libraryCategory === 'Tutte' || t.categoria === libraryCategory;
    const q = librarySearch.toLowerCase().trim();
    if (!q) return matchesCat;
    const matchesQuery =
      t.nome.toLowerCase().includes(q) ||
      t.descrizione.toLowerCase().includes(q) ||
      (t.categoria && t.categoria.toLowerCase().includes(q)) ||
      t.faseLavoro.toLowerCase().includes(q);
    return matchesCat && matchesQuery;
  });

  return (
    <div className="space-y-6">
      {/* Banner Informativo Lavorazioni */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-800/60 border border-blue-200 dark:border-blue-900/50 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-blue-600 text-white font-black text-[10px] uppercase tracking-wider">
                CAPITOLO 9
              </span>
              <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-tight text-sm">
                SCHEDE DELLE LAVORAZIONI E FASI OPERATIVE
              </h3>
            </div>
            {/* Diagramma del flusso operativo */}
            <div className="flex flex-wrap items-center gap-1 text-[11px] font-bold text-slate-600 dark:text-slate-300 mt-2">
              <span className="px-2 py-0.5 bg-white dark:bg-slate-700 rounded-md border border-slate-200 dark:border-slate-600 text-blue-700 dark:text-blue-300">LAVORAZIONE</span>
              <span>↓</span>
              <span className="px-2 py-0.5 bg-white dark:bg-slate-700 rounded-md border border-slate-200 dark:border-slate-600 text-amber-700 dark:text-amber-300">ATTREZZATURE</span>
              <span>↓</span>
              <span className="px-2 py-0.5 bg-white dark:bg-slate-700 rounded-md border border-slate-200 dark:border-slate-600 text-purple-700 dark:text-purple-300">SOSTANZE</span>
              <span>↓</span>
              <span className="px-2 py-0.5 bg-white dark:bg-slate-700 rounded-md border border-slate-200 dark:border-slate-600 text-cyan-700 dark:text-cyan-300">OPERE PROVVISIONALI</span>
              <span>↓</span>
              <span className="px-2 py-0.5 bg-white dark:bg-slate-700 rounded-md border border-slate-200 dark:border-slate-600 text-rose-700 dark:text-rose-300">RISCHI (P×D)</span>
              <span>↓</span>
              <span className="px-2 py-0.5 bg-white dark:bg-slate-700 rounded-md border border-slate-200 dark:border-slate-600 text-emerald-700 dark:text-emerald-300">MISURE</span>
              <span>↓</span>
              <span className="px-2 py-0.5 bg-white dark:bg-slate-700 rounded-md border border-slate-200 dark:border-slate-600 text-indigo-700 dark:text-indigo-300">DPI (EN)</span>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleAddNewActivity}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-sm transition-all flex items-center gap-1.5"
            >
              <span>+</span> <span>Nuova Scheda Vuota</span>
            </button>
            <button
              type="button"
              onClick={() => setIsLibraryOpen(true)}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-sm transition-all flex items-center gap-1.5"
            >
              <span>📚</span> <span>Aggiungi da Libreria</span>
            </button>
            <button
              type="button"
              onClick={() => setIsFullLibraryModalOpen(true)}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-sm transition-all flex items-center gap-1.5"
              title="Gestione completa di tutti i cataloghi e modelli personalizzati"
            >
              <span>🗂️</span> <span>Gestione Cataloghi</span>
            </button>
          </div>
        </div>

        {syncNotice && (
          <div className="mt-3 p-2.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 rounded-xl text-xs font-bold animate-fadeIn">
            {syncNotice}
          </div>
        )}
      </div>

      {/* Modal Libreria Attività con inserimento diretto e filtri */}
      {isLibraryOpen && (
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-800 border-2 border-emerald-500 shadow-2xl space-y-4 animate-in fade-in-50">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-3 gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 rounded font-black text-[10px] uppercase">
                  Catalogo Completo
                </span>
                <h4 className="font-black text-sm uppercase text-slate-900 dark:text-white">
                  Libreria Schede Lavorazioni
                </h4>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Aggiungi direttamente le schede al tuo POS con tutte le attrezzature, sostanze, opere, rischi PxD, misure e DPI già compilati.
              </p>
            </div>
            <div className="flex items-center gap-2 self-start sm:self-center">
              <button
                type="button"
                onClick={() => {
                  setIsLibraryOpen(false);
                  setIsFullLibraryModalOpen(true);
                }}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-xs"
                title="Apri l'editor avanzato di schede e cataloghi"
              >
                <span>🗂️</span> <span>Gestione Completa & Nuove Schede</span>
              </button>
              <button
                type="button"
                onClick={() => setIsLibraryOpen(false)}
                className="px-3 py-1.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-bold"
              >
                ✕ Chiudi
              </button>
            </div>
          </div>

          {/* Barra di ricerca e filtri per categoria */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative flex-1">
              <input
                type="text"
                value={librarySearch}
                onChange={e => setLibrarySearch(e.target.value)}
                placeholder="Cerca lavorazione (es. cartongesso, scavi, intonaco, demolizione, ponteggi)..."
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              />
              <span className="absolute left-3 top-2.5 text-slate-400 text-xs">🔍</span>
              {librarySearch && (
                <button
                  type="button"
                  onClick={() => setLibrarySearch('')}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs font-bold"
                >
                  ✕
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-1 overflow-x-auto max-h-12 py-1">
              {allCategories.map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setLibraryCategory(cat)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all shrink-0 ${
                    libraryCategory === cat
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Griglia Modelli */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-96 overflow-y-auto pr-1">
            {filteredTemplates.length === 0 ? (
              <div className="col-span-full py-8 text-center text-slate-400 text-xs font-bold">
                Nessun modello trovato per "{librarySearch}". Prova con un altro termine o categoria.
              </div>
            ) : (
              filteredTemplates.map(tpl => (
                <div
                  key={tpl.id}
                  className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/40 hover:border-emerald-500 hover:bg-emerald-50/20 dark:hover:bg-slate-800 transition-all flex flex-col justify-between space-y-2.5"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{tpl.icona}</span>
                        <div>
                          <span className="font-black text-xs text-slate-900 dark:text-white leading-tight block">
                            {tpl.nome}
                          </span>
                          <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold">
                            {tpl.categoria}
                          </span>
                        </div>
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-600 dark:text-slate-400 line-clamp-2 mt-1.5">
                      {tpl.descrizione}
                    </p>

                    <div className="flex flex-wrap gap-1 text-[9px] mt-2">
                      <span className="px-1.5 py-0.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-slate-600 dark:text-slate-300 font-bold">
                        🚜 {tpl.attrezzatureTipiche.length} Mezzi/Attrezzi
                      </span>
                      <span className="px-1.5 py-0.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded text-rose-700 dark:text-rose-300 font-bold">
                        ⚠️ {tpl.rischi.length} Rischi PxD
                      </span>
                      <span className="px-1.5 py-0.5 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 rounded text-blue-700 dark:text-blue-300 font-bold">
                        🛡️ {tpl.dpiRaccomandati.length} DPI
                      </span>
                    </div>
                  </div>

                  {/* Pulsanti Azione: Aggiunta Diretta o Applicazione */}
                  <div className="pt-2 border-t border-slate-200/80 dark:border-slate-700/80 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleAddActivityFromTemplate(tpl)}
                      className="flex-1 py-1.5 px-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1 shadow-xs active:scale-95"
                      title="Aggiunge una nuova scheda lavorazione completa direttamente a questo POS"
                    >
                      <span>➕</span> <span>Aggiungi al POS</span>
                    </button>
                    {currentAttivita && (
                      <button
                        type="button"
                        onClick={() => {
                          handleApplySmartProposal(tpl);
                          setIsLibraryOpen(false);
                        }}
                        className="py-1.5 px-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 rounded-lg text-[10px] font-bold transition-all"
                        title="Sovrascrive la scheda lavorazione attualmente aperta"
                      >
                        Applica a questa
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Layout Editor: Colonna sinistra (Elenco Fasi) + Colonna destra (Dettaglio Fase) */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Colonna Sinistra: Elenco Lavorazioni */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="font-black text-slate-700 dark:text-slate-300 text-xs uppercase tracking-wider">
              Lavorazioni ({attivita.length})
            </h4>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setIsLibraryOpen(true)}
                className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-0.5"
                title="Sfoglia libreria lavorazioni"
              >
                <span>+ Libreria</span>
              </button>
            </div>
          </div>
          <div className="space-y-1.5 max-h-[70vh] overflow-y-auto pr-1">
            {attivita.map((att, idx) => {
              const isSelected = selectedIdx === idx;
              return (
                <div
                  key={att.id || idx}
                  onClick={() => setSelectedIdx(idx)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                    isSelected
                      ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-800 dark:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2 overflow-hidden">
                    <span className="text-lg shrink-0">{att.icona || '🔨'}</span>
                    <div className="overflow-hidden">
                      <div className="font-black text-xs truncate">{idx + 1}. {att.nome}</div>
                      <div className={`text-[10px] truncate ${isSelected ? 'text-blue-100' : 'text-slate-400 dark:text-slate-400'}`}>
                        {att.faseLavoro || att.categoria}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={e => {
                      e.stopPropagation();
                      handleRemoveActivity(idx);
                    }}
                    className={`p-1 rounded text-xs transition-colors ${isSelected ? 'text-blue-200 hover:text-white' : 'text-slate-400 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400'}`}
                    title="Elimina fase"
                  >
                    ✕
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Colonna Destra: Dettaglio Lavorazione & Misure di Sicurezza */}
        {currentAttivita && (
          <div className="lg:col-span-3 space-y-5 bg-white dark:bg-slate-800/40 p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
            {/* Riga 1: Nome, Categoria, Fase e Logo della Scheda */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[10px] font-black uppercase text-slate-500 dark:text-slate-400">
                    1. Nome Lavorazione & Logo Scheda
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleSaveCurrentActivityToLibrary}
                      className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-800 rounded-lg text-[10.5px] font-bold flex items-center gap-1 transition-colors shadow-xs"
                      title="Salva questa lavorazione configurata (rischi, misure, DPI, attrezzature) nella libreria per riutilizzarla in tutti i POS"
                    >
                      <span>💾</span> <span>Salva come Modello in Libreria</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsLogoPickerOpen(true)}
                      className="text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                    >
                      <span>🖼️</span> <span>Personalizza Logo</span>
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIsLogoPickerOpen(true)}
                    title="Clicca per cambiare logo o caricare immagine"
                    className="shrink-0 group relative focus:outline-none"
                  >
                    <PosSchedaLogo
                      tipo="lavorazione"
                      title={currentAttivita.nome}
                      iconaEmoji={currentAttivita.icona}
                      logoUrl={currentAttivita.logoUrl || currentAttivita.immagineUrl}
                      size="md"
                    />
                    <span className="absolute -bottom-1 -right-1 bg-blue-600 text-white text-[8px] rounded-full px-1 py-0.2 font-black shadow-xs group-hover:scale-110 transition-transform">
                      ✎
                    </span>
                  </button>
                  <input
                    type="text"
                    value={currentAttivita.nome}
                    onChange={e => updateCurrentActivity({ nome: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-black text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 mb-1">
                  Fase di Lavoro / Categoria
                </label>
                <input
                  type="text"
                  value={currentAttivita.faseLavoro}
                  onChange={e => updateCurrentActivity({ faseLavoro: e.target.value })}
                  placeholder="es. Fase preliminare, Finiture..."
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                />
              </div>
            </div>

            {/* Descrizione operativa */}
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 mb-1">
                Descrizione delle Modalità Operative
              </label>
              <textarea
                rows={2}
                value={currentAttivita.descrizione}
                onChange={e => updateCurrentActivity({ descrizione: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              />
            </div>

            {/* Modelli e Strumenti di Sicurezza per questa lavorazione */}
            <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                💡 Modelli e Strumenti per la Fase Operativa:
              </span>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsLibraryOpen(true)}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-black uppercase tracking-wider transition-all flex items-center gap-1 shadow-xs"
                >
                  <span>📚</span> <span>Sfoglia Libreria</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const match = DEFAULT_POS_TEMPLATES.find(t =>
                      currentAttivita.nome.toLowerCase().includes(t.nome.toLowerCase()) ||
                      t.nome.toLowerCase().includes(currentAttivita.nome.toLowerCase())
                    ) || DEFAULT_POS_TEMPLATES[0];
                    handleApplySmartProposal(match);
                  }}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[11px] font-black uppercase tracking-wider transition-all"
                  title="Applica i rischi e le misure del modello suggerito a questa scheda"
                >
                  📋 Applica Dati Modello Suggerito
                </button>
                <button
                  type="button"
                  onClick={handleSyncToGlobal}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[11px] font-black uppercase tracking-wider transition-all"
                  title="Sincronizza gli elementi usati nei capitoli 10, 11 e 12"
                >
                  🔄 Sincronizza Cap. 10, 11 e 12
                </button>
              </div>
            </div>

            {/* SEZIONE 2: ATTREZZATURE COLLEGATE */}
            <div className="p-4 rounded-xl border border-amber-200 dark:border-amber-900/40 bg-amber-50/20 dark:bg-amber-950/10 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-black uppercase text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                  <span>🚜</span> <span>2. Attrezzature & Macchine Collegate</span>
                </label>
                {/* Selettore rapido da catalogo */}
                <select
                  onChange={e => {
                    if (!e.target.value) return;
                    const exists = (currentAttivita.attrezzatureUtilizzate || []).includes(e.target.value);
                    if (!exists) {
                      updateCurrentActivity({
                        attrezzatureUtilizzate: [...(currentAttivita.attrezzatureUtilizzate || []), e.target.value],
                      });
                    }
                    e.target.value = '';
                  }}
                  defaultValue=""
                  className="p-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-[11px] font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                >
                  <option value="" disabled>+ Aggiungi da catalogo...</option>
                  {DEFAULT_ATTREZZATURE_CATALOGO.map(att => (
                    <option key={att.id} value={att.nome}>{att.nome}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {(currentAttivita.attrezzatureUtilizzate || []).map((attNome, aIdx) => (
                  <span
                    key={aIdx}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-100 dark:bg-amber-900/40 text-amber-900 dark:text-amber-200 text-xs font-bold border border-amber-200 dark:border-amber-800"
                  >
                    <span>{attNome}</span>
                    <button
                      type="button"
                      onClick={() => {
                        updateCurrentActivity({
                          attrezzatureUtilizzate: currentAttivita.attrezzatureUtilizzate.filter((_, i) => i !== aIdx),
                        });
                      }}
                      className="text-amber-700 dark:text-amber-400 hover:text-rose-600 dark:hover:text-rose-400 font-black"
                    >
                      ✕
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* SEZIONE 3: SOSTANZE CHIMICHE COLLEGATE */}
            <div className="p-4 rounded-xl border border-purple-200 dark:border-purple-900/40 bg-purple-50/20 dark:bg-purple-950/10 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-black uppercase text-purple-900 dark:text-purple-300 flex items-center gap-1.5">
                  <span>🧪</span> <span>3. Sostanze Chimiche & Preparati Pericolosi</span>
                </label>
                <select
                  onChange={e => {
                    if (!e.target.value) return;
                    const exists = (currentAttivita.sostanzeUtilizzate || []).includes(e.target.value);
                    if (!exists) {
                      updateCurrentActivity({
                        sostanzeUtilizzate: [...(currentAttivita.sostanzeUtilizzate || []), e.target.value],
                      });
                    }
                    e.target.value = '';
                  }}
                  defaultValue=""
                  className="p-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-[11px] font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                >
                  <option value="" disabled>+ Aggiungi sostanza da catalogo...</option>
                  {DEFAULT_SOSTANZE_CATALOGO.map(s => (
                    <option key={s.id} value={s.nomeCommerciale}>{s.nomeCommerciale}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {(currentAttivita.sostanzeUtilizzate || []).length === 0 ? (
                  <span className="text-[11px] text-slate-400 dark:text-slate-500 italic">Nessuna sostanza chimica pericolosa specifica</span>
                ) : (
                  currentAttivita.sostanzeUtilizzate.map((sNome, sIdx) => (
                    <span
                      key={sIdx}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-100 dark:bg-purple-900/40 text-purple-900 dark:text-purple-200 text-xs font-bold border border-purple-200 dark:border-purple-800"
                    >
                      <span>{sNome}</span>
                      <button
                        type="button"
                        onClick={() => {
                          updateCurrentActivity({
                            sostanzeUtilizzate: currentAttivita.sostanzeUtilizzate.filter((_, i) => i !== sIdx),
                          });
                        }}
                        className="text-purple-700 dark:text-purple-400 hover:text-rose-600 dark:hover:text-rose-400 font-black"
                      >
                        ✕
                      </button>
                    </span>
                  ))
                )}
              </div>
            </div>

            {/* SEZIONE 4: OPERE PROVVISIONALI & PROTEZIONI COLLETTIVE */}
            <div className="p-4 rounded-xl border border-cyan-200 dark:border-cyan-900/40 bg-cyan-50/20 dark:bg-cyan-950/10 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-black uppercase text-cyan-900 dark:text-cyan-300 flex items-center gap-1.5">
                  <span>🪜</span> <span>4. Opere Provvisionali & Lavori in Quota</span>
                </label>
                <select
                  onChange={e => {
                    if (!e.target.value) return;
                    const exists = (currentAttivita.opereProvvisionaliUtilizzate || []).includes(e.target.value);
                    if (!exists) {
                      updateCurrentActivity({
                        opereProvvisionaliUtilizzate: [...(currentAttivita.opereProvvisionaliUtilizzate || []), e.target.value],
                      });
                    }
                    e.target.value = '';
                  }}
                  defaultValue=""
                  className="p-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-[11px] font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                >
                  <option value="" disabled>+ Aggiungi opera provvisionale...</option>
                  {DEFAULT_OPERE_PROVVISIONALI_LIST.map(o => (
                    <option key={o.id} value={o.tipo}>{o.tipo}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {(currentAttivita.opereProvvisionaliUtilizzate || []).length === 0 ? (
                  <span className="text-[11px] text-slate-400 dark:text-slate-500 italic">Nessuna opera provvisionale o ponteggio specifico richiesto</span>
                ) : (
                  currentAttivita.opereProvvisionaliUtilizzate.map((oNome, oIdx) => (
                    <span
                      key={oIdx}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-100 dark:bg-cyan-900/40 text-cyan-900 dark:text-cyan-200 text-xs font-bold border border-cyan-200 dark:border-cyan-800"
                    >
                      <span>{oNome}</span>
                      <button
                        type="button"
                        onClick={() => {
                          updateCurrentActivity({
                            opereProvvisionaliUtilizzate: currentAttivita.opereProvvisionaliUtilizzate?.filter((_, i) => i !== oIdx),
                          });
                        }}
                        className="text-cyan-700 dark:text-cyan-400 hover:text-rose-600 dark:hover:text-rose-400 font-black"
                      >
                        ✕
                      </button>
                    </span>
                  ))
                )}
              </div>
            </div>

            {/* SEZIONE 5: RISCHI CON MATRICE P × D = R */}
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-1">
                <label className="text-xs font-black uppercase text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <span>⚠️</span> <span>5. Rischi Specifici con Matrice 4×4 (P × D = R)</span>
                </label>
                <button
                  type="button"
                  onClick={handleAddRisk}
                  className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[10px] font-black uppercase tracking-wider transition-colors"
                >
                  + Aggiungi Rischio
                </button>
              </div>

              <div className="space-y-3">
                {currentAttivita.rischi.map((r, rIdx) => {
                  const p = r.probabilita || 2;
                  const d = r.danno || 2;
                  const calc = CALCOLA_RISCHIO(p, d);
                  return (
                    <div
                      key={r.id || rIdx}
                      className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 space-y-2.5"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <input
                          type="text"
                          value={r.descrizione}
                          onChange={e => handleUpdateRisk(rIdx, { descrizione: e.target.value })}
                          className="w-full font-black text-xs p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                          placeholder="Descrizione del pericolo o rischio..."
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveRisk(rIdx)}
                          className="text-slate-400 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 p-1 text-xs"
                          title="Rimuovi rischio"
                        >
                          ✕
                        </button>
                      </div>

                      {/* Calcolo Matrice R = P x D */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center bg-white dark:bg-slate-800 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700">
                        <div>
                          <label className="block text-[9px] font-black uppercase text-slate-400 dark:text-slate-400 mb-0.5">
                            Probabilità (P 1-4)
                          </label>
                          <select
                            value={p}
                            onChange={e => handleUpdateRisk(rIdx, { probabilita: Number(e.target.value) })}
                            className="w-full p-1 rounded text-xs font-bold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                          >
                            <option value={1}>1 - Improbabile</option>
                            <option value={2}>2 - Poco probabile</option>
                            <option value={3}>3 - Probabile</option>
                            <option value={4}>4 - Altamente probabile</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[9px] font-black uppercase text-slate-400 dark:text-slate-400 mb-0.5">
                            Gravità Danno (D 1-4)
                          </label>
                          <select
                            value={d}
                            onChange={e => handleUpdateRisk(rIdx, { danno: Number(e.target.value) })}
                            className="w-full p-1 rounded text-xs font-bold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                          >
                            <option value={1}>1 - Danno Lieve</option>
                            <option value={2}>2 - Danno Medio</option>
                            <option value={3}>3 - Danno Grave</option>
                            <option value={4}>4 - Danno Gravissimo</option>
                          </select>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-2 pt-2 sm:pt-0">
                          <div className="text-right">
                            <span className="text-[10px] text-slate-400 dark:text-slate-400 block font-bold">R = {p} × {d} = {calc.livello}</span>
                            <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                              calc.classe === 'Accettabile' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                              calc.classe === 'Notevole' ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                              calc.classe === 'Elevato' ? 'bg-orange-100 text-orange-800 border border-orange-300' :
                              'bg-rose-100 text-rose-800 border border-rose-300'
                            }`}>
                              {calc.classe}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Misure preventive del rischio */}
                      <div>
                        <label className="block text-[9px] font-black uppercase text-slate-400 dark:text-slate-400 mb-0.5">
                          Misure Preventive Adottate
                        </label>
                        <input
                          type="text"
                          value={r.misurePreventive}
                          onChange={e => handleUpdateRisk(rIdx, { misurePreventive: e.target.value })}
                          className="w-full p-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                          placeholder="es. Presenza del preposto, montaggio parapetti prima dell'avvio..."
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* SEZIONE 6: MISURE DI PREVENZIONE E PROTEZIONE */}
            <div className="space-y-2">
              <label className="text-xs font-black uppercase text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <span>🛡️</span> <span>6. Misure di Prevenzione & Coordinamento</span>
              </label>
              <textarea
                rows={3}
                value={currentAttivita.misurePrevenzione.join('\n')}
                onChange={e => updateCurrentActivity({ misurePrevenzione: e.target.value.split('\n').filter(Boolean) })}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                placeholder="Una misura per riga..."
              />
            </div>

            {/* SEZIONE 7: DPI OBBLIGATORI DI FASE CON PITTOGRAMMI ISO 7010 */}
            <div className="space-y-3 pt-3 border-t border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black uppercase text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#005ea6]" />
                  <span>7. DPI Obbligatori Prescritti per questa Fase (Simboli ISO 7010)</span>
                </label>
                <span className="text-[10px] text-slate-400 dark:text-slate-400 font-bold uppercase">All. VIII D.Lgs. 81/08</span>
              </div>

              {/* Badge DPI già selezionati */}
              {currentAttivita.dpiNecessari && currentAttivita.dpiNecessari.length > 0 && (
                <div className="p-3 bg-blue-50/50 dark:bg-slate-800/60 rounded-xl border border-blue-200 dark:border-slate-700 space-y-1.5">
                  <span className="text-[10px] font-black uppercase text-blue-900 dark:text-blue-300 block">
                    DPI Attualmente Prescritti in Scheda ({currentAttivita.dpiNecessari.length}):
                  </span>
                  <div className="flex flex-wrap items-center gap-2">
                    {currentAttivita.dpiNecessari.map((dpiName, dIdx) => (
                      <div key={dIdx} className="relative group">
                        <PosDpiBadge name={dpiName} size="md" showNorma={true} />
                        <button
                          type="button"
                          onClick={() => {
                            updateCurrentActivity({
                              dpiNecessari: currentAttivita.dpiNecessari.filter((_, i) => i !== dIdx),
                            });
                          }}
                          className="ml-1 text-slate-400 hover:text-rose-600 font-bold text-xs p-0.5"
                          title="Rimuovi DPI"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Griglia Selezione Rapida DPI con Pittogrammi Blu ISO 7010 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {POS_DPI_LIST.map(dpi => {
                  const isChecked = (currentAttivita.dpiNecessari || []).some(
                    d => d.toLowerCase().includes(dpi.nome.toLowerCase()) || dpi.nome.toLowerCase().includes(d.toLowerCase())
                  );
                  return (
                    <label
                      key={dpi.id}
                      className={`flex items-center gap-2.5 p-2 rounded-xl border text-xs cursor-pointer transition-all ${
                        isChecked
                          ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-500 font-bold text-blue-950 dark:text-blue-200 shadow-xs'
                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {
                          const updatedDpis = isChecked
                            ? currentAttivita.dpiNecessari.filter(
                                d => !d.toLowerCase().includes(dpi.nome.toLowerCase()) && !dpi.nome.toLowerCase().includes(d.toLowerCase())
                              )
                            : [...currentAttivita.dpiNecessari, dpi.nome];
                          updateCurrentActivity({ dpiNecessari: updatedDpis });
                        }}
                        className="rounded text-blue-600 focus:ring-0 shrink-0"
                      />
                      <DpiPictogram name={dpi.nome} size="sm" />
                      <div className="overflow-hidden min-w-0 flex-1">
                        <div className="truncate font-bold text-[11px] leading-tight">{dpi.nome}</div>
                        <div className="text-[9px] text-slate-400 dark:text-slate-400 font-mono truncate">{dpi.norma}</div>
                      </div>
                    </label>
                  );
                })}
              </div>

              {/* Aggiunta DPI Personalizzato */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="text"
                  value={customDpiText}
                  onChange={e => setCustomDpiText(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && customDpiText.trim()) {
                      e.preventDefault();
                      updateCurrentActivity({
                        dpiNecessari: [...(currentAttivita.dpiNecessari || []), customDpiText.trim()],
                      });
                      setCustomDpiText('');
                    }
                  }}
                  placeholder="Aggiungi altro DPI personalizzato (es. Maschera con filtri ABEK1 P3)..."
                  className="flex-1 p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (customDpiText.trim()) {
                      updateCurrentActivity({
                        dpiNecessari: [...(currentAttivita.dpiNecessari || []), customDpiText.trim()],
                      });
                      setCustomDpiText('');
                    }
                  }}
                  className="px-3 py-2 bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 text-white rounded-xl text-xs font-bold shrink-0"
                >
                  + Aggiungi DPI
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal Personalizzazione Logo / Immagine Scheda */}
      {isLogoPickerOpen && currentAttivita && (
        <PosSchedaLogoPickerModal
          tipo="lavorazione"
          currentTitle={currentAttivita.nome}
          currentEmoji={currentAttivita.icona}
          currentLogoUrl={currentAttivita.logoUrl || currentAttivita.immagineUrl}
          onSave={({ logoUrl, immagineUrl, emoji }) => {
            updateCurrentActivity({
              logoUrl,
              immagineUrl,
              icona: emoji || currentAttivita.icona,
            });
            setIsLogoPickerOpen(false);
          }}
          onClose={() => setIsLogoPickerOpen(false)}
        />
      )}

      {/* Modal Gestione Completa Libreria Schede e Tutti i Cataloghi */}
      {isFullLibraryModalOpen && (
        <PosTemplateLibraryModal
          customTemplates={customTemplates}
          onSaveTemplates={updated => {
            if (onUpdateCustomTemplates) onUpdateCustomTemplates(updated);
          }}
          customAttrezzature={customAttrezzature}
          onSaveAttrezzature={updated => {
            if (onUpdateCustomAttrezzature) onUpdateCustomAttrezzature(updated);
          }}
          customOpere={customOpere}
          onSaveOpere={updated => {
            if (onUpdateCustomOpere) onUpdateCustomOpere(updated);
          }}
          customSostanze={customSostanze}
          onSaveSostanze={updated => {
            if (onUpdateCustomSostanze) onUpdateCustomSostanze(updated);
          }}
          onSelectTemplateForPos={tpl => {
            handleAddActivityFromTemplate(tpl);
            setIsFullLibraryModalOpen(false);
          }}
          onClose={() => setIsFullLibraryModalOpen(false)}
        />
      )}
    </div>
  );
};
