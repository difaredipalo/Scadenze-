import React, { useState, useEffect } from 'react';
import {
  PosAttivitaTemplate,
  PosAttrezzaturaItem,
  PosOperaProvvisionaleItem,
  PosSostanzaItem,
  PosRischio,
} from '../../types';
import {
  DEFAULT_POS_TEMPLATES,
  DEFAULT_ATTREZZATURE_CATALOGO,
  DEFAULT_OPERE_PROVVISIONALI_LIST,
  DEFAULT_SOSTANZE_CATALOGO,
  POS_DPI_LIST,
  CALCOLA_RISCHIO_TECNICO,
} from '../../data/posDefaultData';
import {
  PosSchedaLogo,
  PosSchedaLogoPickerModal,
  PosDpiBadge,
  GhsHazardDiamond,
} from './PosSafetyCardVisuals';

export type PosLibraryCategory = 'lavorazioni' | 'attrezzature' | 'opere' | 'sostanze';

export interface PosTemplateLibraryModalProps {
  customTemplates: PosAttivitaTemplate[];
  onSaveTemplates: (templates: PosAttivitaTemplate[]) => void;
  deletedTemplateIds?: string[];
  onUpdateDeletedTemplateIds?: (ids: string[]) => void;
  customAttrezzature?: PosAttrezzaturaItem[];
  onSaveAttrezzature?: (items: PosAttrezzaturaItem[]) => void;
  deletedAttrezzatureIds?: string[];
  onUpdateDeletedAttrezzatureIds?: (ids: string[]) => void;
  customOpere?: PosOperaProvvisionaleItem[];
  onSaveOpere?: (items: PosOperaProvvisionaleItem[]) => void;
  deletedOpereIds?: string[];
  onUpdateDeletedOpereIds?: (ids: string[]) => void;
  customSostanze?: PosSostanzaItem[];
  onSaveSostanze?: (items: PosSostanzaItem[]) => void;
  deletedSostanzeIds?: string[];
  onUpdateDeletedSostanzeIds?: (ids: string[]) => void;
  onClose: () => void;
  onSelectTemplateForPos?: (tpl: PosAttivitaTemplate) => void;
}

const COMMON_DPI_CHIPS = [
  'Casco di protezione / Elmetto',
  'Calzature di sicurezza S3',
  'Guanti rischio meccanico',
  'Otoprotettori (Cuffie / Inserti)',
  'Respiratore FFP2 antipolvere',
  'Facciale FFP3 polveri di silice',
  'Imbracatura completa anticaduta',
  'Occhiali di protezione / Visiera',
  'Gilet alta visibilità',
  'Guanti rischio chimico',
];

export const PosTemplateLibraryModal: React.FC<PosTemplateLibraryModalProps> = ({
  customTemplates = [],
  onSaveTemplates,
  deletedTemplateIds = [],
  onUpdateDeletedTemplateIds,
  customAttrezzature = [],
  onSaveAttrezzature,
  deletedAttrezzatureIds = [],
  onUpdateDeletedAttrezzatureIds,
  customOpere = [],
  onSaveOpere,
  deletedOpereIds = [],
  onUpdateDeletedOpereIds,
  customSostanze = [],
  onSaveSostanze,
  deletedSostanzeIds = [],
  onUpdateDeletedSostanzeIds,
  onClose,
  onSelectTemplateForPos,
}) => {
  const [activeTab, setActiveTab] = useState<PosLibraryCategory>('lavorazioni');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubCat, setSelectedSubCat] = useState<string>('Tutte');

  // Selezione per visualizzazione / editing
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [toastNotice, setToastNotice] = useState<string | null>(null);

  // Logo Picker Modal
  const [isLogoPickerOpen, setIsLogoPickerOpen] = useState<boolean>(false);

  // Edit Buffer
  const [editLavorazione, setEditLavorazione] = useState<PosAttivitaTemplate | null>(null);
  const [editAttrezzatura, setEditAttrezzatura] = useState<PosAttrezzaturaItem | null>(null);
  const [editOpera, setEditOpera] = useState<PosOperaProvvisionaleItem | null>(null);
  const [editSostanza, setEditSostanza] = useState<PosSostanzaItem | null>(null);

  // Temporary inputs per aggiungere elementi
  const [newAttrezzaturaInput, setNewAttrezzaturaInput] = useState('');
  const [newSostanzaInput, setNewSostanzaInput] = useState('');
  const [newOperaInput, setNewOperaInput] = useState('');
  const [newMisuraInput, setNewMisuraInput] = useState('');
  const [newCustomDpiInput, setNewCustomDpiInput] = useState('');
  const [newMaterialeInput, setNewMaterialeInput] = useState('');

  // Mobile navigation: se su mobile mostrare la vista dettaglio/edit
  const [showMobileDetail, setShowMobileDetail] = useState<boolean>(false);

  // Stato ottimistico sincronizzato per reattività istantanea nei cataloghi
  const [localCustomTemplates, setLocalCustomTemplates] = useState<PosAttivitaTemplate[]>(customTemplates || []);
  const [localDeletedTemplateIds, setLocalDeletedTemplateIds] = useState<string[]>(deletedTemplateIds || []);
  const [localCustomAttrezzature, setLocalCustomAttrezzature] = useState<PosAttrezzaturaItem[]>(customAttrezzature || []);
  const [localDeletedAttrezzatureIds, setLocalDeletedAttrezzatureIds] = useState<string[]>(deletedAttrezzatureIds || []);
  const [localCustomOpere, setLocalCustomOpere] = useState<PosOperaProvvisionaleItem[]>(customOpere || []);
  const [localDeletedOpereIds, setLocalDeletedOpereIds] = useState<string[]>(deletedOpereIds || []);
  const [localCustomSostanze, setLocalCustomSostanze] = useState<PosSostanzaItem[]>(customSostanze || []);
  const [localDeletedSostanzeIds, setLocalDeletedSostanzeIds] = useState<string[]>(deletedSostanzeIds || []);

  useEffect(() => { setLocalCustomTemplates(customTemplates || []); }, [customTemplates]);
  useEffect(() => { setLocalDeletedTemplateIds(deletedTemplateIds || []); }, [deletedTemplateIds]);
  useEffect(() => { setLocalCustomAttrezzature(customAttrezzature || []); }, [customAttrezzature]);
  useEffect(() => { setLocalDeletedAttrezzatureIds(deletedAttrezzatureIds || []); }, [deletedAttrezzatureIds]);
  useEffect(() => { setLocalCustomOpere(customOpere || []); }, [customOpere]);
  useEffect(() => { setLocalDeletedOpereIds(deletedOpereIds || []); }, [deletedOpereIds]);
  useEffect(() => { setLocalCustomSostanze(customSostanze || []); }, [customSostanze]);
  useEffect(() => { setLocalDeletedSostanzeIds(deletedSostanzeIds || []); }, [deletedSostanzeIds]);

  // Cataloghi completi unendo default e custom con override corretto per ID, escludendo quelli eliminati dall'utente
  const deletedTplSet = new Set(localDeletedTemplateIds);
  const customLavorazioniMap = new Map(localCustomTemplates.map(t => [t.id, t]));
  const allLavorazioni: PosAttivitaTemplate[] = [
    ...DEFAULT_POS_TEMPLATES.filter(t => !customLavorazioniMap.has(t.id) && !deletedTplSet.has(t.id)),
    ...localCustomTemplates.filter(t => !deletedTplSet.has(t.id)),
  ];

  const deletedAttSet = new Set(localDeletedAttrezzatureIds);
  const customAttrezzatureMap = new Map(localCustomAttrezzature.map(t => [t.id, t]));
  const allAttrezzature: PosAttrezzaturaItem[] = [
    ...DEFAULT_ATTREZZATURE_CATALOGO.filter(t => !customAttrezzatureMap.has(t.id) && !deletedAttSet.has(t.id)),
    ...localCustomAttrezzature.filter(t => !deletedAttSet.has(t.id)),
  ];

  const deletedOpSet = new Set(localDeletedOpereIds);
  const customOpereMap = new Map(localCustomOpere.map(t => [t.id, t]));
  const allOpere: PosOperaProvvisionaleItem[] = [
    ...DEFAULT_OPERE_PROVVISIONALI_LIST.filter(t => !customOpereMap.has(t.id) && !deletedOpSet.has(t.id)),
    ...localCustomOpere.filter(t => !deletedOpSet.has(t.id)),
  ];

  const deletedSostSet = new Set(localDeletedSostanzeIds);
  const customSostanzeMap = new Map(localCustomSostanze.map(t => [t.id, t]));
  const allSostanze: PosSostanzaItem[] = [
    ...DEFAULT_SOSTANZE_CATALOGO.filter(t => !customSostanzeMap.has(t.id) && !deletedSostSet.has(t.id)),
    ...localCustomSostanze.filter(t => !deletedSostSet.has(t.id)),
  ];

  // Helper per verificare se sono presenti schede predisposte eliminate nella categoria attiva
  const hasDeletedDefaultsInCurrentTab = 
    activeTab === 'lavorazioni' ? localDeletedTemplateIds.length > 0 :
    activeTab === 'attrezzature' ? localDeletedAttrezzatureIds.length > 0 :
    activeTab === 'opere' ? localDeletedOpereIds.length > 0 :
    localDeletedSostanzeIds.length > 0;

  const currentTabTotalCount = 
    activeTab === 'lavorazioni' ? allLavorazioni.length :
    activeTab === 'attrezzature' ? allAttrezzature.length :
    activeTab === 'opere' ? allOpere.length :
    allSostanze.length;

  const totalCardsAcrossAllCatalogs = allLavorazioni.length + allAttrezzature.length + allOpere.length + allSostanze.length;
  const hasAnyDeletedDefaults = 
    localDeletedTemplateIds.length > 0 ||
    localDeletedAttrezzatureIds.length > 0 ||
    localDeletedOpereIds.length > 0 ||
    localDeletedSostanzeIds.length > 0;

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
    setShowMobileDetail(false);
  };

  const showToast = (msg: string) => {
    setToastNotice(msg);
    setTimeout(() => setToastNotice(null), 3500);
  };

  // ==========================================
  // CREAZIONE NUOVA SCHEDA NELLA LIBRERIA
  // ==========================================
  const handleAddNew = () => {
    setSearchTerm('');
    const newId = `custom_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    if (activeTab === 'lavorazioni') {
      const newTpl: PosAttivitaTemplate = {
        id: newId,
        nome: 'Nuova Attività Edile',
        categoria: 'Opere Generali',
        icona: '🏗️',
        descrizione: 'Descrizione analitica delle fasi operative e delle modalità esecutive conformi al D.Lgs. 81/08.',
        faseLavoro: 'Fase Esecutiva',
        rischi: [
          {
            id: `r-${Date.now()}-1`,
            descrizione: 'Caduta dall’alto o perdita di equilibrio',
            fonteRischio: 'Lavorazioni in quota, aperture o bordi non protetti',
            conseguenze: 'Politraumi, fratture, lesioni gravi',
            probabilita: 2,
            danno: 3,
            livelloRischio: 6,
            classeRischio: 'Notevole',
            misurePreventive: 'Impiego di parapetti regolamentari completi di tavola fermapiede; vigilanza continua del preposto.',
            misureProtezioneCollettiva: 'Parapetti provvisori UNI EN 13374 e reti di sicurezza.',
            dpiRichiesti: ['Casco di protezione / Elmetto', 'Calzature di sicurezza S3', 'Imbracatura completa anticaduta'],
          },
          {
            id: `r-${Date.now()}-2`,
            descrizione: 'Urti, colpi, tagli e abrasioni durante le manovre',
            fonteRischio: 'Attrezzi manuali ed elettrici, movimentazione carichi',
            conseguenze: 'Ferite lacero-contuse, contusioni',
            probabilita: 2,
            danno: 2,
            livelloRischio: 4,
            classeRischio: 'Accettabile',
            misurePreventive: 'Utilizzo di attrezzi a norma CE con protezioni integre e buone prassi.',
            dpiRichiesti: ['Guanti rischio meccanico', 'Calzature di sicurezza S3'],
          },
        ],
        misurePrevenzione: [
          'Delimitare l’area operativa e verificare l’assenza di interferenze prima dell’inizio.',
          'Mantenere sgombre e pulite le vie di transito pedonale.',
          'Verificare l’efficienza dei dispositivi di sicurezza prima dell’impiego.',
        ],
        dpiRaccomandati: ['Casco di protezione / Elmetto', 'Calzature di sicurezza S3', 'Guanti rischio meccanico'],
        attrezzatureTipiche: ['Utensili manuali ed elettro-utensili'],
        materialiTipici: ['Materiali edili da costruzione'],
        sostanzeTipiche: [],
        opereProvvisionaliTipiche: [],
        interferenze: 'Coordinamento preventivo con le altre imprese e maestranze operanti nel settore.',
        note: 'Rispettare scrupolosamente le prescrizioni del CSE.',
        isCustom: true,
      };
      setEditLavorazione(newTpl);
      setActiveId(newId);
      setIsEditing(true);
      setShowMobileDetail(true);
      setSelectedSubCat('Tutte');
    } else if (activeTab === 'attrezzature') {
      const newAtt: PosAttrezzaturaItem = {
        id: newId,
        nome: 'Nuova Attrezzatura / Mezzo',
        categoria: 'Macchine di Cantiere',
        icona: '🚜',
        descrizione: 'Descrizione tecnica, caratteristiche operative e destinazione d’uso del mezzo.',
        marca: 'Costruttore con marcatura CE',
        modelloMatricola: 'Modello / Matricola da libretto',
        marcaturaCeConforme: true,
        verifichePeriodicheRegolari: true,
        operatoreAbilitato: 'Personale addestrato ed abilitato ex Art. 73',
        prescrizioniSicurezza: 'Verifica visiva preliminare dei dispositivi di sicurezza e arresti di emergenza prima dell’avviamento.',
        prescrizioniPreliminari: 'Controllo livelli e assenza trafilamenti d’olio.',
        dpiObbligatori: ['Casco di protezione / Elmetto', 'Calzature di sicurezza S3', 'Guanti da lavoro', 'Otoprotettori (Cuffie / Inserti)'],
      };
      setEditAttrezzatura(newAtt);
      setActiveId(newId);
      setIsEditing(true);
      setShowMobileDetail(true);
      setSelectedSubCat('Tutte');
    } else if (activeTab === 'opere') {
      const newOp: PosOperaProvvisionaleItem = {
        id: newId,
        tipo: 'Nuova Opera Provvisionale',
        categoria: 'Ponteggi e Lavori in Quota',
        icona: '🪜',
        descrizione: 'Descrizione dell’opera provvisionale, ubicazione e funzione a servizio del cantiere.',
        conformitaNormativa: 'D.Lgs. 81/08 Titolo IV Capo II / UNI EN',
        verifichePeriodiche: true,
        pimusRichiesto: false,
        prescrizioniSicurezza: 'Verifica giornaliera di stabilità e integrità degli ancoraggi; presenza di parapetti regolamentari e fermapiedi.',
        dpiNecessari: ['Casco con sottogola', 'Calzature di sicurezza S3', 'Imbracatura anticaduta'],
      };
      setEditOpera(newOp);
      setActiveId(newId);
      setIsEditing(true);
      setShowMobileDetail(true);
      setSelectedSubCat('Tutte');
    } else {
      const newSost: PosSostanzaItem = {
        id: newId,
        nomeCommerciale: 'Nuovo Preparato Chimico',
        descrizione: 'Descrizione chimico-fisica del preparato impiegato nelle lavorazioni.',
        icona: '🧪',
        utilizzoFase: 'Opere murarie e finiture',
        produttore: 'Produttore certificato con scheda SDS',
        schedaSicurezzaPresente: true,
        pittogrammiPericolo: ['GHS07'],
        frasiH: 'H315 Provoca irritazione cutanea; H318 Provoca gravi lesioni oculari.',
        prescrizioniSicurezza: 'Manipolare in ambiente ventilato; evitare il contatto con pelle e occhi; non inalare vapori o polveri.',
        dpiSpecifici: ['Guanti rischio chimico EN 374', 'Occhiali a mascherina EN 166', 'Respiratore FFP2 antipolvere'],
      };
      setEditSostanza(newSost);
      setActiveId(newId);
      setIsEditing(true);
      setShowMobileDetail(true);
      setSelectedSubCat('Tutte');
    }
  };

  // ==========================================
  // SALVATAGGIO SCHEDA NELLA LIBRERIA
  // ==========================================
  const handleSaveLavorazione = () => {
    if (!editLavorazione) return;
    if (!editLavorazione.nome || !editLavorazione.nome.trim()) {
      alert('Inserire il nome della lavorazione per salvarla nella libreria.');
      return;
    }

    const cleanTpl: PosAttivitaTemplate = {
      ...editLavorazione,
      nome: editLavorazione.nome.trim(),
      categoria: editLavorazione.categoria?.trim() || 'Opere Generali',
      faseLavoro: editLavorazione.faseLavoro?.trim() || 'Fase Esecutiva',
      descrizione: editLavorazione.descrizione?.trim() || 'Descrizione delle lavorazioni conformi alle buone prassi.',
      attrezzatureTipiche: editLavorazione.attrezzatureTipiche || [],
      materialiTipici: editLavorazione.materialiTipici || [],
      sostanzeTipiche: editLavorazione.sostanzeTipiche || [],
      opereProvvisionaliTipiche: editLavorazione.opereProvvisionaliTipiche || [],
      misurePrevenzione: editLavorazione.misurePrevenzione || [],
      dpiRaccomandati: editLavorazione.dpiRaccomandati || [],
      rischi: (editLavorazione.rischi || []).map(r => {
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
      isCustom: true,
    };

    const exists = localCustomTemplates.findIndex(t => t.id === cleanTpl.id);
    let updated: PosAttivitaTemplate[];
    if (exists >= 0) {
      updated = localCustomTemplates.map((t, i) => (i === exists ? cleanTpl : t));
    } else {
      updated = [...localCustomTemplates, cleanTpl];
    }

    setLocalCustomTemplates(updated);
    onSaveTemplates(updated);

    // Rimuovi sempre dagli ID eliminati se era presente
    if (localDeletedTemplateIds.includes(cleanTpl.id)) {
      const filtered = localDeletedTemplateIds.filter(id => id !== cleanTpl.id);
      setLocalDeletedTemplateIds(filtered);
      if (onUpdateDeletedTemplateIds) onUpdateDeletedTemplateIds(filtered);
    }

    setActiveId(cleanTpl.id);
    setIsEditing(false);
    setSearchTerm('');
    setSelectedSubCat('Tutte');
    showToast(`✓ Lavorazione "${cleanTpl.nome}" salvata con successo nella libreria!`);
  };

  // Salvataggio e inserimento immediato nel POS
  const handleSaveLavorazioneAndInsertIntoPos = () => {
    if (!editLavorazione) return;
    if (!editLavorazione.nome || !editLavorazione.nome.trim()) {
      alert('Inserire il nome della lavorazione per procedere.');
      return;
    }

    const cleanTpl: PosAttivitaTemplate = {
      ...editLavorazione,
      nome: editLavorazione.nome.trim(),
      categoria: editLavorazione.categoria?.trim() || 'Opere Generali',
      faseLavoro: editLavorazione.faseLavoro?.trim() || 'Fase Esecutiva',
      descrizione: editLavorazione.descrizione?.trim() || 'Descrizione delle lavorazioni conformi alle buone prassi.',
      attrezzatureTipiche: editLavorazione.attrezzatureTipiche || [],
      materialiTipici: editLavorazione.materialiTipici || [],
      sostanzeTipiche: editLavorazione.sostanzeTipiche || [],
      opereProvvisionaliTipiche: editLavorazione.opereProvvisionaliTipiche || [],
      misurePrevenzione: editLavorazione.misurePrevenzione || [],
      dpiRaccomandati: editLavorazione.dpiRaccomandati || [],
      rischi: (editLavorazione.rischi || []).map(r => {
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
      isCustom: true,
    };

    const exists = localCustomTemplates.findIndex(t => t.id === cleanTpl.id);
    let updated: PosAttivitaTemplate[];
    if (exists >= 0) {
      updated = localCustomTemplates.map((t, i) => (i === exists ? cleanTpl : t));
    } else {
      updated = [...localCustomTemplates, cleanTpl];
    }

    setLocalCustomTemplates(updated);
    onSaveTemplates(updated);

    if (localDeletedTemplateIds.includes(cleanTpl.id)) {
      const filtered = localDeletedTemplateIds.filter(id => id !== cleanTpl.id);
      setLocalDeletedTemplateIds(filtered);
      if (onUpdateDeletedTemplateIds) onUpdateDeletedTemplateIds(filtered);
    }

    if (onSelectTemplateForPos) {
      onSelectTemplateForPos(cleanTpl);
    }

    setActiveId(cleanTpl.id);
    setIsEditing(false);
    setSearchTerm('');
    setSelectedSubCat('Tutte');
    showToast(`✓ Scheda "${cleanTpl.nome}" salvata in libreria e inserita nel POS!`);
  };

  const handleSaveAttrezzatura = () => {
    if (!editAttrezzatura || !onSaveAttrezzature) return;
    if (!editAttrezzatura.nome || !editAttrezzatura.nome.trim()) {
      alert('Inserire il nome dell’attrezzatura per salvarla nella libreria.');
      return;
    }
    const cleanItem: PosAttrezzaturaItem = {
      ...editAttrezzatura,
      nome: editAttrezzatura.nome.trim(),
      categoria: editAttrezzatura.categoria?.trim() || 'Macchine di Cantiere',
      dpiObbligatori: editAttrezzatura.dpiObbligatori || [],
    };
    const exists = localCustomAttrezzature.findIndex(t => t.id === cleanItem.id);
    let updated: PosAttrezzaturaItem[];
    if (exists >= 0) {
      updated = localCustomAttrezzature.map((t, i) => (i === exists ? cleanItem : t));
    } else {
      updated = [...localCustomAttrezzature, cleanItem];
    }
    setLocalCustomAttrezzature(updated);
    onSaveAttrezzature(updated);
    if (localDeletedAttrezzatureIds.includes(cleanItem.id)) {
      const filtered = localDeletedAttrezzatureIds.filter(id => id !== cleanItem.id);
      setLocalDeletedAttrezzatureIds(filtered);
      if (onUpdateDeletedAttrezzatureIds) onUpdateDeletedAttrezzatureIds(filtered);
    }
    setActiveId(cleanItem.id);
    setIsEditing(false);
    setSelectedSubCat('Tutte');
    showToast(`✓ Attrezzatura "${cleanItem.nome}" salvata con successo nella libreria!`);
  };

  const handleSaveOpera = () => {
    if (!editOpera || !onSaveOpere) return;
    if (!editOpera.tipo || !editOpera.tipo.trim()) {
      alert('Inserire la tipologia dell’opera provvisionale per salvarla.');
      return;
    }
    const cleanItem: PosOperaProvvisionaleItem = {
      ...editOpera,
      tipo: editOpera.tipo.trim(),
      categoria: editOpera.categoria?.trim() || 'Opere Quota',
      dpiNecessari: editOpera.dpiNecessari || [],
    };
    const exists = localCustomOpere.findIndex(t => t.id === cleanItem.id);
    let updated: PosOperaProvvisionaleItem[];
    if (exists >= 0) {
      updated = localCustomOpere.map((t, i) => (i === exists ? cleanItem : t));
    } else {
      updated = [...localCustomOpere, cleanItem];
    }
    setLocalCustomOpere(updated);
    onSaveOpere(updated);
    if (localDeletedOpereIds.includes(cleanItem.id)) {
      const filtered = localDeletedOpereIds.filter(id => id !== cleanItem.id);
      setLocalDeletedOpereIds(filtered);
      if (onUpdateDeletedOpereIds) onUpdateDeletedOpereIds(filtered);
    }
    setActiveId(cleanItem.id);
    setIsEditing(false);
    setSelectedSubCat('Tutte');
    showToast(`✓ Opera provvisionale "${cleanItem.tipo}" salvata con successo!`);
  };

  const handleSaveSostanza = () => {
    if (!editSostanza || !onSaveSostanze) return;
    if (!editSostanza.nomeCommerciale || !editSostanza.nomeCommerciale.trim()) {
      alert('Inserire il nome del prodotto chimico per salvarlo.');
      return;
    }
    const cleanItem: PosSostanzaItem = {
      ...editSostanza,
      nomeCommerciale: editSostanza.nomeCommerciale.trim(),
      pittogrammiPericolo: editSostanza.pittogrammiPericolo || ['GHS07'],
      dpiSpecifici: editSostanza.dpiSpecifici || [],
    };
    const exists = localCustomSostanze.findIndex(t => t.id === cleanItem.id);
    let updated: PosSostanzaItem[];
    if (exists >= 0) {
      updated = localCustomSostanze.map((t, i) => (i === exists ? cleanItem : t));
    } else {
      updated = [...localCustomSostanze, cleanItem];
    }
    setLocalCustomSostanze(updated);
    onSaveSostanze(updated);
    if (localDeletedSostanzeIds.includes(cleanItem.id)) {
      const filtered = localDeletedSostanzeIds.filter(id => id !== cleanItem.id);
      setLocalDeletedSostanzeIds(filtered);
      if (onUpdateDeletedSostanzeIds) onUpdateDeletedSostanzeIds(filtered);
    }
    setActiveId(cleanItem.id);
    setIsEditing(false);
    setSelectedSubCat('Tutte');
    showToast(`✓ Sostanza chimica "${cleanItem.nomeCommerciale}" salvata con successo!`);
  };

  // ==========================================
  // ELIMINAZIONE SCHEDE (PREDISPOSTE E CUSTOM)
  // ==========================================
  const handleDeleteItem = (id: string) => {
    const itemTitle = activeTab === 'lavorazioni' 
      ? allLavorazioni.find(x => x.id === id)?.nome 
      : activeTab === 'attrezzature'
      ? allAttrezzature.find(x => x.id === id)?.nome
      : activeTab === 'opere'
      ? allOpere.find(x => x.id === id)?.tipo
      : allSostanze.find(x => x.id === id)?.nomeCommerciale;

    const isDefault = 
      activeTab === 'lavorazioni' ? DEFAULT_POS_TEMPLATES.some(t => t.id === id) :
      activeTab === 'attrezzature' ? DEFAULT_ATTREZZATURE_CATALOGO.some(t => t.id === id) :
      activeTab === 'opere' ? DEFAULT_OPERE_PROVVISIONALI_LIST.some(t => t.id === id) :
      DEFAULT_SOSTANZE_CATALOGO.some(t => t.id === id);

    const msg = isDefault
      ? `Sei sicuro di voler eliminare la scheda predisposta "${itemTitle || 'selezionata'}" dalla libreria?\nPotrai ripristinarla in qualunque momento con il pulsante "Ripristina predisposte".`
      : `Sei sicuro di voler eliminare definitivamente la scheda "${itemTitle || 'selezionata'}" dalla libreria?`;

    if (!window.confirm(msg)) return;

    if (activeTab === 'lavorazioni') {
      const updatedCustom = localCustomTemplates.filter(t => t.id !== id);
      setLocalCustomTemplates(updatedCustom);
      onSaveTemplates(updatedCustom);
      if (isDefault) {
        const nextDeleted = Array.from(new Set([...localDeletedTemplateIds, id]));
        setLocalDeletedTemplateIds(nextDeleted);
        if (onUpdateDeletedTemplateIds) onUpdateDeletedTemplateIds(nextDeleted);
      }
      showToast('✓ Scheda lavorazione eliminata dalla libreria.');
    } else if (activeTab === 'attrezzature') {
      const updatedCustom = localCustomAttrezzature.filter(t => t.id !== id);
      setLocalCustomAttrezzature(updatedCustom);
      if (onSaveAttrezzature) onSaveAttrezzature(updatedCustom);
      if (isDefault) {
        const nextDeleted = Array.from(new Set([...localDeletedAttrezzatureIds, id]));
        setLocalDeletedAttrezzatureIds(nextDeleted);
        if (onUpdateDeletedAttrezzatureIds) onUpdateDeletedAttrezzatureIds(nextDeleted);
      }
      showToast('✓ Scheda attrezzatura eliminata dalla libreria.');
    } else if (activeTab === 'opere') {
      const updatedCustom = localCustomOpere.filter(t => t.id !== id);
      setLocalCustomOpere(updatedCustom);
      if (onSaveOpere) onSaveOpere(updatedCustom);
      if (isDefault) {
        const nextDeleted = Array.from(new Set([...localDeletedOpereIds, id]));
        setLocalDeletedOpereIds(nextDeleted);
        if (onUpdateDeletedOpereIds) onUpdateDeletedOpereIds(nextDeleted);
      }
      showToast('✓ Scheda opera provvisionale eliminata dalla libreria.');
    } else if (activeTab === 'sostanze') {
      const updatedCustom = localCustomSostanze.filter(t => t.id !== id);
      setLocalCustomSostanze(updatedCustom);
      if (onSaveSostanze) onSaveSostanze(updatedCustom);
      if (isDefault) {
        const nextDeleted = Array.from(new Set([...localDeletedSostanzeIds, id]));
        setLocalDeletedSostanzeIds(nextDeleted);
        if (onUpdateDeletedSostanzeIds) onUpdateDeletedSostanzeIds(nextDeleted);
      }
      showToast('✓ Scheda sostanza eliminata dalla libreria.');
    }

    if (activeId === id) {
      setActiveId(null);
      setIsEditing(false);
      setShowMobileDetail(false);
    }
  };

  // Eliminazione massiva: elimina tutte le schede del catalogo attivo (comprese quelle predisposte)
  const handleDeleteAllInCurrentTab = () => {
    if (currentTabTotalCount === 0) {
      alert('Il catalogo è già vuoto.');
      return;
    }

    const tabName = 
      activeTab === 'lavorazioni' ? 'le schede lavorazioni' :
      activeTab === 'attrezzature' ? 'le schede attrezzature e mezzi' :
      activeTab === 'opere' ? 'le schede opere provvisionali' :
      'le schede sostanze chimiche';

    if (!window.confirm(`⚠️ ATTENZIONE: Sei sicuro di voler eliminare TUTTE ${tabName} (${currentTabTotalCount} schede in totale, comprese tutte quelle predisposte dal sistema)?\n\nIl catalogo verrà completamente svuotato. Potrai ripristinare le predisposte in qualsiasi momento.`)) {
      return;
    }

    if (activeTab === 'lavorazioni') {
      setLocalCustomTemplates([]);
      onSaveTemplates([]);
      const allDefaultIds = Array.from(new Set([...localDeletedTemplateIds, ...DEFAULT_POS_TEMPLATES.map(t => t.id)]));
      setLocalDeletedTemplateIds(allDefaultIds);
      if (onUpdateDeletedTemplateIds) onUpdateDeletedTemplateIds(allDefaultIds);
      showToast('✓ Tutte le schede lavorazioni eliminate (comprese predisposte). Catalogo svuotato.');
    } else if (activeTab === 'attrezzature') {
      setLocalCustomAttrezzature([]);
      if (onSaveAttrezzature) onSaveAttrezzature([]);
      const allDefaultIds = Array.from(new Set([...localDeletedAttrezzatureIds, ...DEFAULT_ATTREZZATURE_CATALOGO.map(t => t.id)]));
      setLocalDeletedAttrezzatureIds(allDefaultIds);
      if (onUpdateDeletedAttrezzatureIds) onUpdateDeletedAttrezzatureIds(allDefaultIds);
      showToast('✓ Tutte le schede attrezzature eliminate (comprese predisposte).');
    } else if (activeTab === 'opere') {
      setLocalCustomOpere([]);
      if (onSaveOpere) onSaveOpere([]);
      const allDefaultIds = Array.from(new Set([...localDeletedOpereIds, ...DEFAULT_OPERE_PROVVISIONALI_LIST.map(t => t.id)]));
      setLocalDeletedOpereIds(allDefaultIds);
      if (onUpdateDeletedOpereIds) onUpdateDeletedOpereIds(allDefaultIds);
      showToast('✓ Tutte le schede opere provvisionali eliminate (comprese predisposte).');
    } else if (activeTab === 'sostanze') {
      setLocalCustomSostanze([]);
      if (onSaveSostanze) onSaveSostanze([]);
      const allDefaultIds = Array.from(new Set([...localDeletedSostanzeIds, ...DEFAULT_SOSTANZE_CATALOGO.map(t => t.id)]));
      setLocalDeletedSostanzeIds(allDefaultIds);
      if (onUpdateDeletedSostanzeIds) onUpdateDeletedSostanzeIds(allDefaultIds);
      showToast('✓ Tutte le schede sostanze eliminate (comprese predisposte).');
    }

    setActiveId(null);
    setIsEditing(false);
    setShowMobileDetail(false);
  };

  // Ripristino delle schede predisposte per il catalogo attivo
  const handleRestoreDefaultsInCurrentTab = () => {
    const tabName = 
      activeTab === 'lavorazioni' ? 'delle lavorazioni' :
      activeTab === 'attrezzature' ? 'delle attrezzature' :
      activeTab === 'opere' ? 'delle opere provvisionali' :
      'delle sostanze chimiche';

    if (!window.confirm(`Vuoi ripristinare le schede predisposte predefinite ${tabName}? Le schede di sistema originali torneranno disponibili nel catalogo.`)) {
      return;
    }

    if (activeTab === 'lavorazioni') {
      setLocalDeletedTemplateIds([]);
      if (onUpdateDeletedTemplateIds) onUpdateDeletedTemplateIds([]);
      showToast('✓ Schede lavorazioni predisposte ripristinate con successo!');
    } else if (activeTab === 'attrezzature') {
      setLocalDeletedAttrezzatureIds([]);
      if (onUpdateDeletedAttrezzatureIds) onUpdateDeletedAttrezzatureIds([]);
      showToast('✓ Schede attrezzature predisposte ripristinate con successo!');
    } else if (activeTab === 'opere') {
      setLocalDeletedOpereIds([]);
      if (onUpdateDeletedOpereIds) onUpdateDeletedOpereIds([]);
      showToast('✓ Schede opere provvisionali predisposte ripristinate con successo!');
    } else if (activeTab === 'sostanze') {
      setLocalDeletedSostanzeIds([]);
      if (onUpdateDeletedSostanzeIds) onUpdateDeletedSostanzeIds([]);
      showToast('✓ Schede sostanze predisposte ripristinate con successo!');
    }
  };

  // Eliminazione massiva globale di TUTTI i 4 cataloghi
  const handleDeleteAllAcrossAllCatalogs = () => {
    if (totalCardsAcrossAllCatalogs === 0) {
      alert('Tutti i cataloghi sono già vuoti.');
      return;
    }

    if (!window.confirm(`⚠️ ATTENZIONE ESTREMA: Vuoi eliminare TUTTE le schede di TUTTI i 4 cataloghi (${totalCardsAcrossAllCatalogs} schede complessive)?\n\nVerranno eliminate tutte le schede (sia personalizzate che predisposte di fabbrica) di:\n- Lavorazioni\n- Attrezzature e Mezzi\n- Opere Provvisionali\n- Sostanze Chimiche\n\nTutti i cataloghi risulteranno completamente vuoti. Potrai ripristinare le predisposte originali in qualsiasi momento.`)) {
      return;
    }

    setLocalCustomTemplates([]);
    onSaveTemplates([]);
    const allDefLavorazioni = Array.from(new Set([...localDeletedTemplateIds, ...DEFAULT_POS_TEMPLATES.map(t => t.id)]));
    setLocalDeletedTemplateIds(allDefLavorazioni);
    if (onUpdateDeletedTemplateIds) onUpdateDeletedTemplateIds(allDefLavorazioni);

    setLocalCustomAttrezzature([]);
    if (onSaveAttrezzature) onSaveAttrezzature([]);
    const allDefAtt = Array.from(new Set([...localDeletedAttrezzatureIds, ...DEFAULT_ATTREZZATURE_CATALOGO.map(t => t.id)]));
    setLocalDeletedAttrezzatureIds(allDefAtt);
    if (onUpdateDeletedAttrezzatureIds) onUpdateDeletedAttrezzatureIds(allDefAtt);

    setLocalCustomOpere([]);
    if (onSaveOpere) onSaveOpere([]);
    const allDefOp = Array.from(new Set([...localDeletedOpereIds, ...DEFAULT_OPERE_PROVVISIONALI_LIST.map(t => t.id)]));
    setLocalDeletedOpereIds(allDefOp);
    if (onUpdateDeletedOpereIds) onUpdateDeletedOpereIds(allDefOp);

    setLocalCustomSostanze([]);
    if (onSaveSostanze) onSaveSostanze([]);
    const allDefSost = Array.from(new Set([...localDeletedSostanzeIds, ...DEFAULT_SOSTANZE_CATALOGO.map(t => t.id)]));
    setLocalDeletedSostanzeIds(allDefSost);
    if (onUpdateDeletedSostanzeIds) onUpdateDeletedSostanzeIds(allDefSost);

    setActiveId(null);
    setIsEditing(false);
    setShowMobileDetail(false);
    showToast('✓ Tutti i 4 cataloghi della libreria sono stati completamente svuotati.');
  };

  // Ripristino globale di tutte le schede predisposte per tutti i cataloghi
  const handleRestoreAllDefaults = () => {
    if (!window.confirm('Vuoi ripristinare tutte le schede predisposte originali in tutti i 4 cataloghi?')) return;
    setLocalDeletedTemplateIds([]);
    if (onUpdateDeletedTemplateIds) onUpdateDeletedTemplateIds([]);
    setLocalDeletedAttrezzatureIds([]);
    if (onUpdateDeletedAttrezzatureIds) onUpdateDeletedAttrezzatureIds([]);
    setLocalDeletedOpereIds([]);
    if (onUpdateDeletedOpereIds) onUpdateDeletedOpereIds([]);
    setLocalDeletedSostanzeIds([]);
    if (onUpdateDeletedSostanzeIds) onUpdateDeletedSostanzeIds([]);
    showToast('✓ Tutte le schede predisposte ripristinate con successo in tutti i cataloghi!');
  };

  // Selezione per modifica
  const handleStartEditCurrent = () => {
    if (activeTab === 'lavorazioni') {
      const found = allLavorazioni.find(t => t.id === activeId);
      if (found) {
        setEditLavorazione({
          ...found,
          attrezzatureTipiche: [...(found.attrezzatureTipiche || [])],
          materialiTipici: [...(found.materialiTipici || [])],
          sostanzeTipiche: [...(found.sostanzeTipiche || [])],
          opereProvvisionaliTipiche: [...(found.opereProvvisionaliTipiche || [])],
          misurePrevenzione: [...(found.misurePrevenzione || [])],
          dpiRaccomandati: [...(found.dpiRaccomandati || [])],
          rischi: (found.rischi || []).map(r => ({ ...r })),
        });
        setIsEditing(true);
        setShowMobileDetail(true);
      }
    } else if (activeTab === 'attrezzature') {
      const found = allAttrezzature.find(t => t.id === activeId);
      if (found) {
        setEditAttrezzatura({
          ...found,
          dpiObbligatori: [...(found.dpiObbligatori || [])],
        });
        setIsEditing(true);
        setShowMobileDetail(true);
      }
    } else if (activeTab === 'opere') {
      const found = allOpere.find(t => t.id === activeId);
      if (found) {
        setEditOpera({
          ...found,
          dpiNecessari: [...(found.dpiNecessari || [])],
        });
        setIsEditing(true);
        setShowMobileDetail(true);
      }
    } else {
      const found = allSostanze.find(t => t.id === activeId);
      if (found) {
        setEditSostanza({
          ...found,
          pittogrammiPericolo: [...(found.pittogrammiPericolo || [])],
          dpiSpecifici: [...(found.dpiSpecifici || [])],
        });
        setIsEditing(true);
        setShowMobileDetail(true);
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
      t.descrizione.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.faseLavoro || '').toLowerCase().includes(searchTerm.toLowerCase());
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
      (t.categoria || '').toLowerCase().includes(searchTerm.toLowerCase());
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

  // Helper gestione rischi in editing lavorazione
  const handleAddRiskToEdit = () => {
    if (!editLavorazione) return;
    const newRisk: PosRischio = {
      id: `r-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      descrizione: 'Nuovo rischio specifico della fase',
      fonteRischio: 'Attività operativa in cantiere',
      conseguenze: 'Lesioni o danni alla salute',
      probabilita: 2,
      danno: 2,
      livelloRischio: 4,
      classeRischio: 'Accettabile',
      misurePreventive: 'Adozione delle istruzioni di sicurezza e vigilanza del preposto.',
      misureProtezioneCollettiva: 'Misure tecniche e barriere di protezione.',
      dpiRichiesti: ['Casco di protezione / Elmetto', 'Calzature di sicurezza S3'],
    };
    setEditLavorazione({
      ...editLavorazione,
      rischi: [...(editLavorazione.rischi || []), newRisk],
    });
  };

  const handleUpdateRiskInEdit = (rIdx: number, patch: Partial<PosRischio>) => {
    if (!editLavorazione) return;
    const updatedRisks = (editLavorazione.rischi || []).map((r, i) => {
      if (i !== rIdx) return r;
      const p = patch.probabilita !== undefined ? patch.probabilita : r.probabilita || 2;
      const d = patch.danno !== undefined ? patch.danno : r.danno || 2;
      const tec = CALCOLA_RISCHIO_TECNICO({ ...r, ...patch, probabilita: p, danno: d });
      return {
        ...r,
        ...patch,
        probabilita: p,
        danno: d,
        livelloRischio: tec.rResiduo,
        classeRischio: tec.classeResidua,
        probabilitaIniziale: tec.pIniziale,
        dannoIniziale: tec.dIniziale,
        rischioIniziale: tec.rIniziale,
        classeRischioIniziale: tec.classeIniziale,
        probabilitaResidua: tec.pResiduo,
        dannoResiduo: tec.dResiduo,
        rischioResiduo: tec.rResiduo,
        classeRischioResiduo: tec.classeResidua,
      };
    });
    setEditLavorazione({ ...editLavorazione, rischi: updatedRisks });
  };

  const handleRemoveRiskInEdit = (rIdx: number) => {
    if (!editLavorazione) return;
    setEditLavorazione({
      ...editLavorazione,
      rischi: (editLavorazione.rischi || []).filter((_, i) => i !== rIdx),
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-2 sm:p-5">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-6xl w-full h-[94vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* HEADER MODALE */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-900/70 shrink-0">
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
              Catalogo ufficiale e personalizzato: Lavorazioni, Macchine, Opere provvisionali e Schede SDS
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleAddNew}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-sm flex items-center gap-1.5 active:scale-95"
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
              type="button"
              onClick={onClose}
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors font-bold"
            >
              ✕
            </button>
          </div>
        </div>

        {/* TOAST NOTIFICA SALVATAGGIO */}
        {toastNotice && (
          <div className="bg-emerald-600 text-white text-xs font-bold px-4 py-2 flex items-center justify-between animate-fadeIn shrink-0">
            <span>{toastNotice}</span>
            <button type="button" onClick={() => setToastNotice(null)} className="text-white/80 hover:text-white text-sm ml-2">✕</button>
          </div>
        )}

        {/* 4 MACRO-CATEGORIE */}
        <div className="flex items-center border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 pt-2 gap-2 overflow-x-auto shrink-0">
          <button
            type="button"
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
            type="button"
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
            type="button"
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
            type="button"
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

        {/* FILTRI DI RICERCA, SOTTOCATEGORIE E PULSANTI MASSIVI */}
        <div className="p-3 sm:p-4 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-50/40 dark:bg-slate-900/40 shrink-0">
          <div className="flex items-center gap-2.5 flex-wrap flex-1">
            <input
              type="text"
              placeholder={`Cerca tra ${activeTab}...`}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="p-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 text-xs w-56 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            />

            <div className="flex items-center gap-1.5 overflow-x-auto text-[11px] font-bold custom-scrollbar">
              {currentCategories.map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedSubCat(cat)}
                  className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
                    selectedSubCat === cat
                      ? 'bg-blue-600 text-white font-black shadow-xs'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* PULSANTI GESTIONE MASSIVA CATALOGO ATTIVO E GLOBALE */}
          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            {hasDeletedDefaultsInCurrentTab && (
              <button
                type="button"
                onClick={handleRestoreDefaultsInCurrentTab}
                className="px-2.5 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 dark:hover:bg-amber-900/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 text-[11px] font-bold flex items-center gap-1.5 transition-colors shadow-2xs"
                title="Ripristina tutte le schede predisposte di sistema per questo catalogo"
              >
                <span>🔄</span>
                <span>Ripristina predisposte</span>
              </button>
            )}
            {currentTabTotalCount > 0 && (
              <button
                type="button"
                onClick={handleDeleteAllInCurrentTab}
                className="px-2.5 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800 text-[11px] font-bold flex items-center gap-1.5 transition-colors shadow-2xs"
                title="Elimina tutte le schede (anche quelle predisposte dal sistema) da questo catalogo"
              >
                <span>🗑️</span>
                <span>Svuota catalogo ({currentTabTotalCount})</span>
              </button>
            )}
            {totalCardsAcrossAllCatalogs > 0 && (
              <button
                type="button"
                onClick={handleDeleteAllAcrossAllCatalogs}
                className="px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-rose-100 dark:hover:bg-rose-950/60 text-slate-700 dark:text-slate-300 hover:text-rose-700 dark:hover:text-rose-300 border border-slate-300 dark:border-slate-700 hover:border-rose-300 text-[11px] font-bold flex items-center gap-1.5 transition-colors shadow-2xs"
                title="Elimina tutte le schede da TUTTI i 4 cataloghi (anche predisposte)"
              >
                <span>⚠️🗑️</span>
                <span>Svuota TUTTI i cataloghi ({totalCardsAcrossAllCatalogs})</span>
              </button>
            )}
            {hasAnyDeletedDefaults && (
              <button
                type="button"
                onClick={handleRestoreAllDefaults}
                className="px-2.5 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 text-[11px] font-bold flex items-center gap-1.5 transition-colors shadow-2xs"
                title="Ripristina tutte le schede predisposte di fabbrica in tutti i 4 cataloghi"
              >
                <span>🔄</span>
                <span>Ripristina tutto</span>
              </button>
            )}
          </div>
        </div>

        {/* CORPO MODALE A DUE COLONNE (CON COMPATIBILITÀ RESPONSIVE) */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden text-xs">
          
          {/* LISTA SCHEDE (A SINISTRA SU DESKTOP, OPPURE MOSTRATA SU MOBILE SE NON IN DETTAGLIO) */}
          <div className={`w-full md:w-5/12 p-3 sm:p-4 overflow-y-auto border-r border-slate-200 dark:border-slate-800 space-y-2.5 ${showMobileDetail ? 'hidden md:block' : 'block'}`}>
            
            {/* STATO VUOTO QUANDO NON CI SONO SCHEDE */}
            {((activeTab === 'lavorazioni' && filteredLavorazioni.length === 0) ||
              (activeTab === 'attrezzature' && filteredAttrezzature.length === 0) ||
              (activeTab === 'opere' && filteredOpere.length === 0) ||
              (activeTab === 'sostanze' && filteredSostanze.length === 0)) && (
              <div className="p-8 text-center bg-white dark:bg-slate-800/60 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 space-y-3">
                <div className="text-3xl">📭</div>
                <p className="font-bold text-xs text-slate-700 dark:text-slate-200">
                  {currentTabTotalCount === 0 
                    ? "Tutte le schede di questa categoria sono state eliminate."
                    : `Nessuna scheda trovata per "${searchTerm}".`}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {currentTabTotalCount === 0
                    ? "Il catalogo è attualmente vuoto. Puoi creare nuove schede personalizzate oppure ripristinare quelle predisposte di sistema."
                    : "Prova a modificare il testo di ricerca o selezionare un'altra sottocategoria."}
                </p>
                {currentTabTotalCount === 0 && (
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-2">
                    <button
                      type="button"
                      onClick={handleAddNew}
                      className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm"
                    >
                      + Crea Nuova Scheda
                    </button>
                    {hasDeletedDefaultsInCurrentTab && (
                      <button
                        type="button"
                        onClick={handleRestoreDefaultsInCurrentTab}
                        className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold shadow-sm"
                      >
                        🔄 Ripristina predisposte
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* TAB LAVORAZIONI */}
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
                      setShowMobileDetail(true);
                    }}
                    className={`p-3 rounded-2xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/20 shadow-xs ring-1 ring-blue-500/30'
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
                            {tpl.categoria} • {tpl.faseLavoro || 'Esecutiva'}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {isCustom ? (
                          <span className="px-1.5 py-0.5 bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 text-[9px] font-black rounded uppercase">
                            Personalizzata
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 text-[9px] font-bold rounded uppercase">
                            Predisposta
                          </span>
                        )}
                        {onSelectTemplateForPos && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectTemplateForPos(tpl);
                              showToast(`✓ "${tpl.nome}" aggiunta al POS!`);
                            }}
                            className="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[9px] font-black uppercase tracking-wider shadow-2xs"
                            title="Inserisci subito questa scheda nel POS in compilazione"
                          >
                            + Nel POS
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteItem(tpl.id);
                          }}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/60 rounded-lg transition-colors"
                          title="Elimina questa scheda dalla libreria (anche predisposta)"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-2 line-clamp-2">
                      {tpl.descrizione}
                    </p>
                    <div className="flex flex-wrap gap-1 mt-2 text-[9px] text-slate-500">
                      <span className="px-1 py-0.5 bg-slate-100 dark:bg-slate-700 rounded font-semibold">
                        🚜 {(tpl.attrezzatureTipiche || []).length} Mezzi
                      </span>
                      <span className="px-1 py-0.5 bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 rounded font-bold">
                        ⚠️ {(tpl.rischi || []).length} Rischi PxD
                      </span>
                      <span className="px-1 py-0.5 bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 rounded font-bold">
                        🛡️ {(tpl.dpiRaccomandati || []).length} DPI
                      </span>
                    </div>
                  </div>
                );
              })}

            {/* TAB ATTREZZATURE */}
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
                      setShowMobileDetail(true);
                    }}
                    className={`p-3 rounded-2xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/20 shadow-xs ring-1 ring-blue-500/30'
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
                            {att.categoria} • {att.marca || 'CE'}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {isCustom ? (
                          <span className="px-1.5 py-0.5 bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 text-[9px] font-black rounded uppercase">
                            Personalizzata
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 text-[9px] font-bold rounded uppercase">
                            Predisposta
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteItem(att.id);
                          }}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/60 rounded-lg transition-colors"
                          title="Elimina questa scheda dalla libreria (anche predisposta)"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-2 line-clamp-2">
                      {att.descrizione || att.prescrizioniSicurezza}
                    </p>
                  </div>
                );
              })}

            {/* TAB OPERE PROVVISIONALI */}
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
                      setShowMobileDetail(true);
                    }}
                    className={`p-3 rounded-2xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/20 shadow-xs ring-1 ring-blue-500/30'
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
                      <div className="flex items-center gap-1 shrink-0">
                        {isCustom ? (
                          <span className="px-1.5 py-0.5 bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 text-[9px] font-black rounded uppercase">
                            Personalizzata
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 text-[9px] font-bold rounded uppercase">
                            Predisposta
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteItem(op.id);
                          }}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/60 rounded-lg transition-colors"
                          title="Elimina questa scheda dalla libreria (anche predisposta)"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-2 line-clamp-2">
                      {op.descrizione}
                    </p>
                  </div>
                );
              })}

            {/* TAB SOSTANZE CHIMICHE */}
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
                      setShowMobileDetail(true);
                    }}
                    className={`p-3 rounded-2xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/20 shadow-xs ring-1 ring-blue-500/30'
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
                      <div className="flex items-center gap-1 shrink-0">
                        {isCustom ? (
                          <span className="px-1.5 py-0.5 bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 text-[9px] font-black rounded uppercase">
                            Personalizzata
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 text-[9px] font-bold rounded uppercase">
                            Predisposta
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteItem(sost.id);
                          }}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/60 rounded-lg transition-colors"
                          title="Elimina questa scheda dalla libreria (anche predisposta)"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-2 line-clamp-2">
                      {sost.descrizione || sost.frasiH}
                    </p>
                  </div>
                );
              })}
          </div>

          {/* DETTAGLIO ED EDITING A DESTRA */}
          <div className={`w-full md:w-7/12 p-4 sm:p-5 overflow-y-auto bg-slate-50/40 dark:bg-slate-900/40 ${showMobileDetail ? 'block' : 'hidden md:block'}`}>
            {showMobileDetail && (
              <button
                type="button"
                onClick={() => setShowMobileDetail(false)}
                className="md:hidden mb-3 text-xs font-bold text-blue-600 flex items-center gap-1"
              >
                ← Torna all'elenco schede
              </button>
            )}

            {isEditing ? (
              /* MODALITA EDITING ATTIVA */
              <div className="space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 gap-3">
                  <div>
                    <h3 className="text-sm font-black uppercase text-slate-900 dark:text-white flex items-center gap-1.5">
                      <span>{editLavorazione?.id.startsWith('custom_') && !(customTemplates || []).some(t => t.id === editLavorazione.id) ? '➕' : '✏️'}</span>
                      <span>
                        {activeTab === 'lavorazioni'
                          ? (editLavorazione?.id.startsWith('custom_') && !(customTemplates || []).some(t => t.id === editLavorazione.id)
                              ? 'Nuova Lavorazione - Inserimento in Libreria'
                              : 'Modifica Scheda Lavorazione')
                          : activeTab === 'attrezzature'
                          ? 'Modifica / Configura Attrezzatura'
                          : activeTab === 'opere'
                          ? 'Modifica / Configura Opera Provvisionale'
                          : 'Modifica / Configura Sostanza Chimica'}
                      </span>
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Configura tutti gli elementi normativi della scheda: macchine, opere provvisionali, sostanze, rischi analitici PxD, misure e DPI.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold text-xs hover:bg-slate-100"
                    >
                      Annulla
                    </button>
                    {activeTab === 'lavorazioni' && onSelectTemplateForPos && (
                      <button
                        type="button"
                        onClick={handleSaveLavorazioneAndInsertIntoPos}
                        className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase shadow-sm active:scale-95 transition-transform flex items-center gap-1"
                        title="Salva la lavorazione in libreria e inseriscila subito nel POS"
                      >
                        <span>💾➕</span> <span>Salva e Inserisci nel POS</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        if (activeTab === 'lavorazioni') handleSaveLavorazione();
                        else if (activeTab === 'attrezzature') handleSaveAttrezzatura();
                        else if (activeTab === 'opere') handleSaveOpera();
                        else handleSaveSostanza();
                      }}
                      className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase shadow-sm active:scale-95 transition-transform flex items-center gap-1"
                    >
                      <span>💾</span> <span>Salva in Libreria</span>
                    </button>
                  </div>
                </div>

                {/* FORM EDIT LAVORAZIONE CON TUTTE LE SEZIONI */}
                {activeTab === 'lavorazioni' && editLavorazione && (
                  <div className="space-y-4">
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
                        <label className="block text-[10px] font-black uppercase text-slate-500 mb-0.5">Nome Lavorazione *</label>
                        <input
                          type="text"
                          value={editLavorazione.nome}
                          onChange={e => setEditLavorazione({ ...editLavorazione, nome: e.target.value })}
                          className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-black"
                          placeholder="es. Scavi di sbancamento e trincee"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-black uppercase text-slate-500 mb-0.5">Categoria Opera</label>
                        <input
                          type="text"
                          value={editLavorazione.categoria}
                          onChange={e => setEditLavorazione({ ...editLavorazione, categoria: e.target.value })}
                          className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
                          placeholder="es. Movimento Terra, Opere Murarie, Finiture"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black uppercase text-slate-500 mb-0.5">Fase di Lavoro</label>
                        <input
                          type="text"
                          value={editLavorazione.faseLavoro || ''}
                          onChange={e => setEditLavorazione({ ...editLavorazione, faseLavoro: e.target.value })}
                          className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
                          placeholder="es. Fase preliminare, Fase strutturale"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-black uppercase text-slate-500 mb-0.5">Descrizione Operativa & Modalità Esecutive</label>
                      <textarea
                        rows={3}
                        value={editLavorazione.descrizione}
                        onChange={e => setEditLavorazione({ ...editLavorazione, descrizione: e.target.value })}
                        className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs leading-relaxed"
                        placeholder="Descrivere le sequenze operative, modalità di accesso, posa e delimitazione..."
                      />
                    </div>

                    {/* COLLEGAMENTO ATTREZZATURE TIPICHE */}
                    <div className="p-3 bg-white dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-[10.5px] font-black uppercase text-slate-900 dark:text-white flex items-center gap-1.5">
                          <span>🚜</span> <span>Attrezzature e Mezzi Tipici</span>
                        </label>
                        <span className="text-[9px] text-slate-400">({(editLavorazione.attrezzatureTipiche || []).length} associati)</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {(editLavorazione.attrezzatureTipiche || []).map((att, aIdx) => (
                          <span key={aIdx} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-900 border border-amber-200 text-[10px] font-bold">
                            <span>{att}</span>
                            <button
                              type="button"
                              onClick={() => {
                                setEditLavorazione({
                                  ...editLavorazione,
                                  attrezzatureTipiche: editLavorazione.attrezzatureTipiche.filter((_, i) => i !== aIdx),
                                });
                              }}
                              className="text-amber-700 hover:text-amber-950 text-xs ml-0.5"
                            >
                              ✕
                            </button>
                          </span>
                        ))}
                      </div>
                      <div className="flex items-center gap-2 pt-1">
                        <input
                          type="text"
                          value={newAttrezzaturaInput}
                          onChange={e => setNewAttrezzaturaInput(e.target.value)}
                          placeholder="Aggiungi attrezzatura..."
                          className="flex-1 p-1.5 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs"
                          onKeyDown={e => {
                            if (e.key === 'Enter' && newAttrezzaturaInput.trim()) {
                              e.preventDefault();
                              setEditLavorazione({
                                ...editLavorazione,
                                attrezzatureTipiche: [...(editLavorazione.attrezzatureTipiche || []), newAttrezzaturaInput.trim()],
                              });
                              setNewAttrezzaturaInput('');
                            }
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (!newAttrezzaturaInput.trim()) return;
                            setEditLavorazione({
                              ...editLavorazione,
                              attrezzatureTipiche: [...(editLavorazione.attrezzatureTipiche || []), newAttrezzaturaInput.trim()],
                            });
                            setNewAttrezzaturaInput('');
                          }}
                          className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold"
                        >
                          + Aggiungi
                        </button>
                        <select
                          onChange={e => {
                            if (e.target.value) {
                              setEditLavorazione({
                                ...editLavorazione,
                                attrezzatureTipiche: Array.from(new Set([...(editLavorazione.attrezzatureTipiche || []), e.target.value])),
                              });
                              e.target.value = '';
                            }
                          }}
                          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-[10px] font-bold"
                        >
                          <option value="">Seleziona da catalogo...</option>
                          {allAttrezzature.map(a => (
                            <option key={a.id} value={a.nome}>{a.nome}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* COLLEGAMENTO OPERE PROVVISIONALI TIPICHE */}
                    <div className="p-3 bg-white dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-[10.5px] font-black uppercase text-slate-900 dark:text-white flex items-center gap-1.5">
                          <span>🪜</span> <span>Opere Provvisionali e Lavori in Quota</span>
                        </label>
                        <span className="text-[9px] text-slate-400">({(editLavorazione.opereProvvisionaliTipiche || []).length} associate)</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {(editLavorazione.opereProvvisionaliTipiche || []).map((op, opIdx) => (
                          <span key={opIdx} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-cyan-50 dark:bg-cyan-950/40 text-cyan-900 dark:text-cyan-200 border border-cyan-200 dark:border-cyan-800 text-[10px] font-bold">
                            <span>{op}</span>
                            <button
                              type="button"
                              onClick={() => {
                                setEditLavorazione({
                                  ...editLavorazione,
                                  opereProvvisionaliTipiche: editLavorazione.opereProvvisionaliTipiche.filter((_, i) => i !== opIdx),
                                });
                              }}
                              className="text-cyan-700 hover:text-cyan-950 text-xs ml-0.5"
                            >
                              ✕
                            </button>
                          </span>
                        ))}
                      </div>
                      <div className="flex items-center gap-2 pt-1">
                        <input
                          type="text"
                          value={newOperaInput}
                          onChange={e => setNewOperaInput(e.target.value)}
                          placeholder="Aggiungi opera provvisionale (es. Ponteggio a telai prefabbricati)..."
                          className="flex-1 p-1.5 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs"
                          onKeyDown={e => {
                            if (e.key === 'Enter' && newOperaInput.trim()) {
                              e.preventDefault();
                              setEditLavorazione({
                                ...editLavorazione,
                                opereProvvisionaliTipiche: [...(editLavorazione.opereProvvisionaliTipiche || []), newOperaInput.trim()],
                              });
                              setNewOperaInput('');
                            }
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (!newOperaInput.trim()) return;
                            setEditLavorazione({
                              ...editLavorazione,
                              opereProvvisionaliTipiche: [...(editLavorazione.opereProvvisionaliTipiche || []), newOperaInput.trim()],
                            });
                            setNewOperaInput('');
                          }}
                          className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg text-xs font-bold"
                        >
                          + Aggiungi
                        </button>
                        <select
                          onChange={e => {
                            if (e.target.value) {
                              setEditLavorazione({
                                ...editLavorazione,
                                opereProvvisionaliTipiche: Array.from(new Set([...(editLavorazione.opereProvvisionaliTipiche || []), e.target.value])),
                              });
                              e.target.value = '';
                            }
                          }}
                          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-[10px] font-bold"
                        >
                          <option value="">Seleziona da catalogo opere...</option>
                          {allOpere.map(o => (
                            <option key={o.id} value={o.tipo}>{o.tipo}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* COLLEGAMENTO SOSTANZE E PREPARATI CHIMICI */}
                    <div className="p-3 bg-white dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-[10.5px] font-black uppercase text-slate-900 dark:text-white flex items-center gap-1.5">
                          <span>🧪</span> <span>Sostanze Chimiche e Preparati Pericolosi</span>
                        </label>
                        <span className="text-[9px] text-slate-400">({(editLavorazione.sostanzeTipiche || []).length} associate)</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {(editLavorazione.sostanzeTipiche || []).map((sost, sIdx) => (
                          <span key={sIdx} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-900 dark:text-purple-200 border border-purple-200 dark:border-purple-800 text-[10px] font-bold">
                            <span>{sost}</span>
                            <button
                              type="button"
                              onClick={() => {
                                setEditLavorazione({
                                  ...editLavorazione,
                                  sostanzeTipiche: editLavorazione.sostanzeTipiche.filter((_, i) => i !== sIdx),
                                });
                              }}
                              className="text-purple-700 hover:text-purple-950 text-xs ml-0.5"
                            >
                              ✕
                            </button>
                          </span>
                        ))}
                      </div>
                      <div className="flex items-center gap-2 pt-1">
                        <input
                          type="text"
                          value={newSostanzaInput}
                          onChange={e => setNewSostanzaInput(e.target.value)}
                          placeholder="Aggiungi prodotto chimico (es. Vernice bituminosa, Schiuma poliuretanica)..."
                          className="flex-1 p-1.5 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs"
                          onKeyDown={e => {
                            if (e.key === 'Enter' && newSostanzaInput.trim()) {
                              e.preventDefault();
                              setEditLavorazione({
                                ...editLavorazione,
                                sostanzeTipiche: [...(editLavorazione.sostanzeTipiche || []), newSostanzaInput.trim()],
                              });
                              setNewSostanzaInput('');
                            }
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (!newSostanzaInput.trim()) return;
                            setEditLavorazione({
                              ...editLavorazione,
                              sostanzeTipiche: [...(editLavorazione.sostanzeTipiche || []), newSostanzaInput.trim()],
                            });
                            setNewSostanzaInput('');
                          }}
                          className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold"
                        >
                          + Aggiungi
                        </button>
                        <select
                          onChange={e => {
                            if (e.target.value) {
                              setEditLavorazione({
                                ...editLavorazione,
                                sostanzeTipiche: Array.from(new Set([...(editLavorazione.sostanzeTipiche || []), e.target.value])),
                              });
                              e.target.value = '';
                            }
                          }}
                          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-[10px] font-bold"
                        >
                          <option value="">Seleziona da catalogo sostanze...</option>
                          {allSostanze.map(s => (
                            <option key={s.id} value={s.nomeCommerciale}>{s.nomeCommerciale}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* COLLEGAMENTO MATERIALI TIPICI */}
                    <div className="p-3 bg-white dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-[10.5px] font-black uppercase text-slate-900 dark:text-white flex items-center gap-1.5">
                          <span>🧱</span> <span>Materiali Tipici da Costruzione</span>
                        </label>
                        <span className="text-[9px] text-slate-400">({(editLavorazione.materialiTipici || []).length} associati)</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {(editLavorazione.materialiTipici || []).map((mat, mIdx) => (
                          <span key={mIdx} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-600 text-[10px] font-bold">
                            <span>{mat}</span>
                            <button
                              type="button"
                              onClick={() => {
                                setEditLavorazione({
                                  ...editLavorazione,
                                  materialiTipici: editLavorazione.materialiTipici.filter((_, i) => i !== mIdx),
                                });
                              }}
                              className="text-slate-500 hover:text-slate-800 text-xs ml-0.5"
                            >
                              ✕
                            </button>
                          </span>
                        ))}
                      </div>
                      <div className="flex items-center gap-2 pt-1">
                        <input
                          type="text"
                          value={newMaterialeInput}
                          onChange={e => setNewMaterialeInput(e.target.value)}
                          placeholder="Aggiungi materiale (es. Calcestruzzo, Laterizi, Blocchi CLS, Ferro d'armatura)..."
                          className="flex-1 p-1.5 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs"
                          onKeyDown={e => {
                            if (e.key === 'Enter' && newMaterialeInput.trim()) {
                              e.preventDefault();
                              setEditLavorazione({
                                ...editLavorazione,
                                materialiTipici: [...(editLavorazione.materialiTipici || []), newMaterialeInput.trim()],
                              });
                              setNewMaterialeInput('');
                            }
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (!newMaterialeInput.trim()) return;
                            setEditLavorazione({
                              ...editLavorazione,
                              materialiTipici: [...(editLavorazione.materialiTipici || []), newMaterialeInput.trim()],
                            });
                            setNewMaterialeInput('');
                          }}
                          className="px-3 py-1.5 bg-slate-700 hover:bg-slate-800 text-white rounded-lg text-xs font-bold"
                        >
                          + Aggiungi
                        </button>
                      </div>
                    </div>

                    {/* INTERFERENZE E MISURE DI COORDINAMENTO */}
                    <div className="p-3 bg-white dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1.5">
                      <label className="text-[10.5px] font-black uppercase text-slate-900 dark:text-white flex items-center gap-1.5">
                        <span>🔄</span> <span>Interferenze di Cantiere & Coordinamento Operativo (Art. 26 D.Lgs. 81/08)</span>
                      </label>
                      <textarea
                        rows={2}
                        value={editLavorazione.interferenze || ''}
                        onChange={e => setEditLavorazione({ ...editLavorazione, interferenze: e.target.value })}
                        className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-200"
                        placeholder="Descrivere le possibili interferenze con altre ditte/lavorazioni (es. sosta mezzi pesanti, transito pedonale, sovrapposizione in quota) e misure di coordinamento."
                      />
                    </div>

                    {/* VALUTAZIONE RISCHI PxD E MISURE TECNICHE */}
                    <div className="p-3 bg-white dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-[10.5px] font-black uppercase text-slate-900 dark:text-white flex items-center gap-1.5">
                          <span className="text-rose-600">⚠️</span> <span>Valutazione Analitica Rischi PxD ({editLavorazione.rischi?.length || 0})</span>
                        </label>
                        <button
                          type="button"
                          onClick={handleAddRiskToEdit}
                          className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[10px] font-black uppercase tracking-wider"
                        >
                          + Aggiungi Rischio
                        </button>
                      </div>

                      <div className="space-y-2.5">
                        {(editLavorazione.rischi || []).map((r, rIdx) => {
                          const tec = CALCOLA_RISCHIO_TECNICO(r);
                          return (
                            <div key={r.id || rIdx} className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-900/40 space-y-2">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 space-y-1">
                                  <input
                                    type="text"
                                    value={r.descrizione}
                                    onChange={e => handleUpdateRiskInEdit(rIdx, { descrizione: e.target.value })}
                                    className="w-full p-1.5 font-bold rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                                    placeholder="Descrizione pericolo (es. Caduta dall'alto)"
                                  />
                                  <div className="grid grid-cols-2 gap-2 text-[10px]">
                                    <input
                                      type="text"
                                      value={r.fonteRischio || ''}
                                      onChange={e => handleUpdateRiskInEdit(rIdx, { fonteRischio: e.target.value })}
                                      className="p-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                                      placeholder="Fonte (es. Lavori in quota su ponteggio)"
                                    />
                                    <input
                                      type="text"
                                      value={r.conseguenze || ''}
                                      onChange={e => handleUpdateRiskInEdit(rIdx, { conseguenze: e.target.value })}
                                      className="p-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                                      placeholder="Danno (es. Politrauma grave)"
                                    />
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveRiskInEdit(rIdx)}
                                  className="text-rose-500 hover:text-rose-700 p-1 text-xs"
                                  title="Elimina rischio"
                                >
                                  ✕
                                </button>
                              </div>

                              {/* P e D con calcolo automatico */}
                              <div className="flex items-center gap-4 text-[10px] bg-white dark:bg-slate-800 p-2 rounded border border-slate-200 dark:border-slate-700">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-bold">Probabilità (P):</span>
                                  <select
                                    value={r.probabilita || 2}
                                    onChange={e => handleUpdateRiskInEdit(rIdx, { probabilita: Number(e.target.value) })}
                                    className="p-1 font-bold rounded border bg-slate-50 dark:bg-slate-900"
                                  >
                                    <option value={1}>1 - Improbabile</option>
                                    <option value={2}>2 - Poco probabile</option>
                                    <option value={3}>3 - Probabile</option>
                                    <option value={4}>4 - Molto probabile</option>
                                  </select>
                                </div>

                                <div className="flex items-center gap-1.5">
                                  <span className="font-bold">Danno (D):</span>
                                  <select
                                    value={r.danno || 2}
                                    onChange={e => handleUpdateRiskInEdit(rIdx, { danno: Number(e.target.value) })}
                                    className="p-1 font-bold rounded border bg-slate-50 dark:bg-slate-900"
                                  >
                                    <option value={1}>1 - Lieve (&lt;3 gg)</option>
                                    <option value={2}>2 - Modesto (&gt;3 gg)</option>
                                    <option value={3}>3 - Grave (Inval.)</option>
                                    <option value={4}>4 - Gravissimo (Mortale)</option>
                                  </select>
                                </div>

                                <div className="flex items-center gap-2 ml-auto">
                                  <span className="text-slate-500 font-mono">
                                    Iniziale: <strong className="text-rose-700 font-bold">{tec.rIniziale} ({tec.classeIniziale})</strong>
                                  </span>
                                  <span className="text-slate-500 font-mono">
                                    → Residuo: <strong className="text-emerald-700 font-bold">{tec.rResiduo} ({tec.classeResidua})</strong>
                                  </span>
                                </div>
                              </div>

                              {/* Misure di Prevenzione Rischio */}
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px]">
                                <div>
                                  <label className="block text-[9px] font-bold text-slate-500 uppercase">Protezione Collettiva (DPC) & Tecniche</label>
                                  <textarea
                                    rows={1}
                                    value={r.misureProtezioneCollettiva || tec.protezioneCollettivaDPC || ''}
                                    onChange={e => handleUpdateRiskInEdit(rIdx, { misureProtezioneCollettiva: e.target.value })}
                                    className="w-full p-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[10px]"
                                    placeholder="DPC (parapetti, reti, quadri ASC...)"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[9px] font-bold text-slate-500 uppercase">Misure Organizzative & Preposto</label>
                                  <textarea
                                    rows={1}
                                    value={r.misurePreventive || tec.misuraOrganizzativa || ''}
                                    onChange={e => handleUpdateRiskInEdit(rIdx, { misurePreventive: e.target.value })}
                                    className="w-full p-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[10px]"
                                    placeholder="Procedure operative, vigilanza preposto..."
                                  />
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* MISURE DI PREVENZIONE GENERALI */}
                    <div className="p-3 bg-white dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                      <label className="text-[10.5px] font-black uppercase text-slate-900 dark:text-white block">
                        🛡️ Misure Comportamentali e Regole di Sicurezza Generale
                      </label>
                      <ul className="space-y-1">
                        {(editLavorazione.misurePrevenzione || []).map((m, mIdx) => (
                          <li key={mIdx} className="flex items-center justify-between gap-2 p-1.5 bg-slate-50 dark:bg-slate-900 rounded text-xs">
                            <span className="flex-1">{m}</span>
                            <button
                              type="button"
                              onClick={() => {
                                setEditLavorazione({
                                  ...editLavorazione,
                                  misurePrevenzione: editLavorazione.misurePrevenzione.filter((_, i) => i !== mIdx),
                                });
                              }}
                              className="text-rose-500 hover:text-rose-700 text-xs px-1"
                            >
                              ✕
                            </button>
                          </li>
                        ))}
                      </ul>
                      <div className="flex items-center gap-2 pt-1">
                        <input
                          type="text"
                          value={newMisuraInput}
                          onChange={e => setNewMisuraInput(e.target.value)}
                          placeholder="Nuova misura comportamentale..."
                          className="flex-1 p-1.5 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs"
                          onKeyDown={e => {
                            if (e.key === 'Enter' && newMisuraInput.trim()) {
                              e.preventDefault();
                              setEditLavorazione({
                                ...editLavorazione,
                                misurePrevenzione: [...(editLavorazione.misurePrevenzione || []), newMisuraInput.trim()],
                              });
                              setNewMisuraInput('');
                            }
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (!newMisuraInput.trim()) return;
                            setEditLavorazione({
                              ...editLavorazione,
                              misurePrevenzione: [...(editLavorazione.misurePrevenzione || []), newMisuraInput.trim()],
                            });
                            setNewMisuraInput('');
                          }}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold"
                        >
                          + Aggiungi
                        </button>
                      </div>
                    </div>

                    {/* DPI RACCOMANDATI */}
                    <div className="p-3 bg-white dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                      <label className="text-[10.5px] font-black uppercase text-slate-900 dark:text-white block">
                        👷 DPI Obbligatori e Normativi per la Scheda
                      </label>
                      <div className="flex flex-wrap gap-1.5">
                        {(editLavorazione.dpiRaccomandati || []).map((dpi, dIdx) => (
                          <span key={dIdx} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-900 dark:text-blue-200 border border-blue-200 dark:border-blue-800 text-[10px] font-bold">
                            <span>{dpi}</span>
                            <button
                              type="button"
                              onClick={() => {
                                setEditLavorazione({
                                  ...editLavorazione,
                                  dpiRaccomandati: editLavorazione.dpiRaccomandati.filter((_, i) => i !== dIdx),
                                });
                              }}
                              className="text-blue-700 hover:text-blue-950 text-xs ml-0.5"
                            >
                              ✕
                            </button>
                          </span>
                        ))}
                      </div>

                      {/* Chips per aggiungere DPI comuni con 1 click */}
                      <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                        <span className="text-[9.5px] font-bold text-slate-400 block mb-1">Aggiunta Rapida DPI:</span>
                        <div className="flex flex-wrap gap-1">
                          {COMMON_DPI_CHIPS.map((dpiChip, cIdx) => {
                            const isIncluded = (editLavorazione.dpiRaccomandati || []).includes(dpiChip);
                            return (
                              <button
                                key={cIdx}
                                type="button"
                                onClick={() => {
                                  if (isIncluded) {
                                    setEditLavorazione({
                                      ...editLavorazione,
                                      dpiRaccomandati: editLavorazione.dpiRaccomandati.filter(d => d !== dpiChip),
                                    });
                                  } else {
                                    setEditLavorazione({
                                      ...editLavorazione,
                                      dpiRaccomandati: [...(editLavorazione.dpiRaccomandati || []), dpiChip],
                                    });
                                  }
                                }}
                                className={`px-2 py-0.5 rounded text-[9.5px] font-bold border transition-colors ${
                                  isIncluded
                                    ? 'bg-blue-600 text-white border-blue-600'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200'
                                }`}
                              >
                                {isIncluded ? '✓ ' : '+ '} {dpiChip}
                              </button>
                            );
                          })}
                        </div>
                      </div>
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
                        <label className="block text-[10px] font-black uppercase text-slate-400">Nome Attrezzatura / Mezzo *</label>
                        <input
                          type="text"
                          value={editAttrezzatura.nome}
                          onChange={e => setEditAttrezzatura({ ...editAttrezzatura, nome: e.target.value })}
                          className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold"
                          placeholder="es. Escavatore cingolato con benna"
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
                          placeholder="Costruttore CE"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black uppercase text-slate-400">Modello / Matricola</label>
                        <input
                          type="text"
                          value={editAttrezzatura.modelloMatricola || ''}
                          onChange={e => setEditAttrezzatura({ ...editAttrezzatura, modelloMatricola: e.target.value })}
                          className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
                          placeholder="Conforme a libretto"
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
                        placeholder="Impiego del mezzo in cantiere..."
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-black uppercase text-slate-400">Prescrizioni di Sicurezza & Verifiche Pre-Uso</label>
                      <textarea
                        rows={2}
                        value={editAttrezzatura.prescrizioniSicurezza || ''}
                        onChange={e => setEditAttrezzatura({ ...editAttrezzatura, prescrizioniSicurezza: e.target.value })}
                        className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
                        placeholder="Controlli giornalieri, isolamento alimentazione, divieto manomissione ripari..."
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
                        <label className="block text-[10px] font-black uppercase text-slate-400">Tipologia Opera Provvisionale *</label>
                        <input
                          type="text"
                          value={editOpera.tipo}
                          onChange={e => setEditOpera({ ...editOpera, tipo: e.target.value })}
                          className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold"
                          placeholder="es. Trabattello mobile su ruote (UNI EN 1004)"
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
                      <label className="block text-[10px] font-black uppercase text-slate-400">Prescrizioni di Sicurezza e Ancoraggi</label>
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
                        <label className="block text-[10px] font-black uppercase text-slate-400">Nome Commerciale Preparato *</label>
                        <input
                          type="text"
                          value={editSostanza.nomeCommerciale}
                          onChange={e => setEditSostanza({ ...editSostanza, nomeCommerciale: e.target.value })}
                          className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold"
                          placeholder="es. Malta osmotica bicomponente"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-black uppercase text-slate-400">Produttore</label>
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
                      <label className="block text-[10px] font-black uppercase text-slate-400">Indicazioni di Pericolo (Frasi H) e Avvertenze CLP</label>
                      <textarea
                        rows={2}
                        value={editSostanza.frasiH || editSostanza.frasiRischio || ''}
                        onChange={e => setEditSostanza({ ...editSostanza, frasiH: e.target.value })}
                        className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
                        placeholder="H315 Provoca irritazione cutanea; H318 Provoca lesioni oculari..."
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
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 gap-3">
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
                            {selectedLavorazione.categoria} • {selectedLavorazione.faseLavoro || 'Esecutiva'}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {onSelectTemplateForPos && (
                          <button
                            type="button"
                            onClick={() => {
                              onSelectTemplateForPos(selectedLavorazione);
                              showToast(`✓ Scheda "${selectedLavorazione.nome}" inserita nel POS!`);
                            }}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-sm flex items-center gap-1 active:scale-95"
                          >
                            <span>➕</span> <span>Inserisci nel POS</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={handleStartEditCurrent}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm"
                        >
                          ✏️ Modifica
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteItem(selectedLavorazione.id)}
                          className="px-2.5 py-1.5 text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-800 rounded-xl text-xs font-bold flex items-center gap-1 shadow-2xs transition-colors"
                          title="Elimina questa scheda dalla libreria (anche se predisposta)"
                        >
                          <span>🗑️</span>
                          <span>Elimina Scheda</span>
                        </button>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-black uppercase text-[10px] text-slate-400 mb-1">Descrizione Operativa</h4>
                      <p className="text-slate-700 dark:text-slate-300 leading-relaxed bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                        {selectedLavorazione.descrizione}
                      </p>
                    </div>

                    {/* Attrezzature connesse */}
                    <div>
                      <h4 className="font-black uppercase text-[10px] text-slate-400 mb-1">Attrezzature e Mezzi Associati</h4>
                      <div className="flex flex-wrap gap-1.5">
                        {(selectedLavorazione.attrezzatureTipiche || []).length > 0 ? (
                          selectedLavorazione.attrezzatureTipiche.map((att, i) => (
                            <span key={i} className="px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 border border-amber-200 dark:border-amber-900 text-[10px] font-bold">
                              🚜 {att}
                            </span>
                          ))
                        ) : (
                          <span className="text-slate-400 text-xs italic">Nessuna attrezzatura specifica</span>
                        )}
                      </div>
                    </div>

                    {/* Rischi e Valutazione Analitica */}
                    <div>
                      <h4 className="font-black uppercase text-[10px] text-slate-400 mb-1">
                        Rischi Specifici e Misure di Sicurezza ({(selectedLavorazione.rischi || []).length})
                      </h4>
                      <div className="space-y-2">
                        {(selectedLavorazione.rischi || []).map((r, i) => {
                          const tec = CALCOLA_RISCHIO_TECNICO(r);
                          return (
                            <div key={i} className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <strong className="text-rose-700 dark:text-rose-400 text-xs block">⚠️ {r.descrizione}</strong>
                                  {r.fonteRischio && <span className="text-[10px] text-slate-500 block">Fonte: {r.fonteRischio}</span>}
                                  {r.conseguenze && <span className="text-[10px] text-slate-500 block">Danno: {r.conseguenze}</span>}
                                </div>
                                <div className="text-right shrink-0">
                                  <div className="text-[10px] font-mono font-bold text-rose-700">
                                    Iniziale: P{tec.pIniziale}×D{tec.dIniziale}={tec.rIniziale}
                                  </div>
                                  <div className="text-[10px] font-mono font-bold text-emerald-700">
                                    Residuo: P{tec.pResiduo}×D{tec.dResiduo}={tec.rResiduo}
                                  </div>
                                </div>
                              </div>
                              <div className="text-[11px] text-slate-600 dark:text-slate-400 mt-1.5 pt-1.5 border-t border-slate-100 dark:border-slate-700">
                                <strong>Misure:</strong> {r.misureProtezioneCollettiva || r.misurePreventive || tec.misuraOrganizzativa}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Misure Generali e DPI */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <h4 className="font-black uppercase text-[10px] text-slate-400 mb-1">Regole Comportamentali</h4>
                        <ul className="list-disc list-inside text-[11px] text-slate-700 dark:text-slate-300 space-y-1 bg-white dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700">
                          {(selectedLavorazione.misurePrevenzione || []).map((m, i) => (
                            <li key={i}>{m}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-black uppercase text-[10px] text-slate-400 mb-1">DPI Prescritti</h4>
                        <div className="flex flex-wrap gap-1.5">
                          {(selectedLavorazione.dpiRaccomandati || []).map((dpi, i) => (
                            <PosDpiBadge key={i} name={dpi} size="sm" showNorma={false} />
                          ))}
                        </div>
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
                          type="button"
                          onClick={handleStartEditCurrent}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm"
                        >
                          ✏️ Modifica
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteItem(selectedAttrezzatura.id)}
                          className="px-2.5 py-1.5 text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-800 rounded-xl text-xs font-bold flex items-center gap-1 shadow-2xs transition-colors"
                          title="Elimina questa scheda dalla libreria (anche se predisposta)"
                        >
                          <span>🗑️</span>
                          <span>Elimina Scheda</span>
                        </button>
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
                          type="button"
                          onClick={handleStartEditCurrent}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm"
                        >
                          ✏️ Modifica
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteItem(selectedOpera.id)}
                          className="px-2.5 py-1.5 text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-800 rounded-xl text-xs font-bold flex items-center gap-1 shadow-2xs transition-colors"
                          title="Elimina questa scheda dalla libreria (anche se predisposta)"
                        >
                          <span>🗑️</span>
                          <span>Elimina Scheda</span>
                        </button>
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
                          type="button"
                          onClick={handleStartEditCurrent}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm"
                        >
                          ✏️ Modifica
                        </button>
                        {isSelectedCustom() && (
                          <button
                            type="button"
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
