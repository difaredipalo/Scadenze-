import React, { useState, useMemo, useEffect } from 'react';
import { Cantiere, AppSettings, Personale, DnlData, CustomContractVariable, Subappalto, ModelloContratto } from '../types';
import { Icons } from '../constants';
import {
  CONTRACT_VARIABLES,
  DEFAULT_CONTRATTO_APPALTO,
  DEFAULT_CONTRATTO_SUBAPPALTO,
  DEFAULT_LETTERA_INCARICO,
  DEFAULT_MODELLI_CONTRATTO,
} from '../data/defaultTemplates';
import { numeroInLettereItaliano } from '../utils/numberToItalianWords';
import { formatDateItalian } from '../utils/dateUtils';
import {
  exportContractToPdf,
  exportContractToWord,
  exportDnlToTxt,
  downloadDnlTxtFile,
  downloadDnlJsonFile,
  exportDnlToExcel,
  exportDnlToPdf,
  printDnlSheet,
} from '../services/contrattiDnlExportService';

interface ContrattiDnlSectionProps {
  cantieri: Cantiere[];
  settings: AppSettings;
  personaleList: Personale[];
  onUpdateCantiere: (updatedCantiere: Cantiere) => void;
  onUpdateSettings: (newSettings: AppSettings) => void;
  onShowToast?: (type: 'success' | 'error' | 'info', message: string) => void;
}

export const ContrattiDnlSection: React.FC<ContrattiDnlSectionProps> = ({
  cantieri,
  settings,
  personaleList,
  onUpdateCantiere,
  onUpdateSettings,
  onShowToast,
}) => {
  // Sotto-sezione attiva: 'contratti' oppure 'dnl'
  const [activeModule, setActiveModule] = useState<'contratti' | 'dnl'>('contratti');

  // Cantiere selezionato
  const [selectedCantiereId, setSelectedCantiereId] = useState<string>(() => {
    return cantieri.length > 0 ? cantieri[0].id : '';
  });

  const selectedCantiere = useMemo(() => {
    return cantieri.find(c => c.id === selectedCantiereId) || cantieri[0] || null;
  }, [cantieri, selectedCantiereId]);

  // ================= MODELLI DI CONTRATTO (DINAMICI, SALVABILI, AGGIUNGIBILI, ELIMINABILI) =================
  const contractModels = useMemo<ModelloContratto[]>(() => {
    if (settings.modelliContratti && settings.modelliContratti.length > 0) {
      return settings.modelliContratti;
    }
    if (settings.contrattoBaseCustom) {
      return [
        ...DEFAULT_MODELLI_CONTRATTO,
        {
          id: 'mod-custom-salvato',
          titolo: 'Mio Modello Personalizzato',
          descrizione: 'Modello personalizzato importato dalle impostazioni',
          categoria: 'personalizzato',
          contenuto: settings.contrattoBaseCustom,
          dataCreazione: '2025-01-01',
          dataModifica: '2025-01-01',
        },
      ];
    }
    return DEFAULT_MODELLI_CONTRATTO;
  }, [settings.modelliContratti, settings.contrattoBaseCustom]);

  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(() => {
    return contractModels[0]?.id || 'mod-appalto-standard';
  });

  // Filtro categoria modelli visualizzati
  const [modelCategoryFilter, setModelCategoryFilter] = useState<'tutti' | 'appalto' | 'subappalto' | 'incarico' | 'personalizzato'>('tutti');

  const activeTemplate = useMemo(() => {
    return contractModels.find(m => m.id === selectedTemplateId) || contractModels[0] || DEFAULT_MODELLI_CONTRATTO[0];
  }, [contractModels, selectedTemplateId]);

  const [contractTemplateText, setContractTemplateText] = useState<string>(() => {
    return activeTemplate?.contenuto || DEFAULT_CONTRATTO_APPALTO;
  });

  // Se cambia activeTemplate, aggiorna il testo
  useEffect(() => {
    if (activeTemplate) {
      setContractTemplateText(activeTemplate.contenuto);
    }
  }, [activeTemplate?.id]);

  // Se la lista dei modelli cambia e il modello selezionato non esiste più
  useEffect(() => {
    if (!contractModels.some(m => m.id === selectedTemplateId)) {
      if (contractModels.length > 0) {
        setSelectedTemplateId(contractModels[0].id);
      }
    }
  }, [contractModels, selectedTemplateId]);

  const isTemplateDirty = useMemo(() => {
    return activeTemplate ? contractTemplateText !== activeTemplate.contenuto : false;
  }, [activeTemplate, contractTemplateText]);

  const [contractViewMode, setContractViewMode] = useState<'edit' | 'preview'>('preview');

  // ================= SUBAPPALTO SELEZIONATO PER AUTOCOMPILAZIONE =================
  const [selectedSubappaltoId, setSelectedSubappaltoId] = useState<string | null>(null);

  // Reset al cambio cantiere
  useEffect(() => {
    setSelectedSubappaltoId(null);
  }, [selectedCantiereId]);

  const selectedSubappalto = useMemo(() => {
    if (!selectedSubappaltoId || !selectedCantiere?.subappalti) return null;
    return selectedCantiere.subappalti.find(s => s.id === selectedSubappaltoId) || null;
  }, [selectedCantiere, selectedSubappaltoId]);

  // Variabili contrattuali personalizzate/sovrascrivibili al volo
  const [customVariableOverrides, setCustomVariableOverrides] = useState<Record<string, string>>({});
  const [showVariablesPanel, setShowVariablesPanel] = useState(false);

  // Modali Gestione Modelli
  const [showNewModelModal, setShowNewModelModal] = useState(false);
  const [newModelTitle, setNewModelTitle] = useState('');
  const [newModelCategory, setNewModelCategory] = useState<'appalto' | 'subappalto' | 'incarico' | 'personalizzato'>('subappalto');
  const [newModelDesc, setNewModelDesc] = useState('');
  const [newModelBaseSource, setNewModelBaseSource] = useState<string>('mod-subappalto-specialistico');

  const [showSaveAsModal, setShowSaveAsModal] = useState(false);
  const [saveAsTitle, setSaveAsTitle] = useState('');
  const [saveAsCategory, setSaveAsCategory] = useState<'appalto' | 'subappalto' | 'incarico' | 'personalizzato'>('subappalto');

  const [showEditModelModal, setShowEditModelModal] = useState(false);
  const [editModelTitle, setEditModelTitle] = useState('');
  const [editModelCategory, setEditModelCategory] = useState<'appalto' | 'subappalto' | 'incarico' | 'personalizzato'>('appalto');
  const [editModelDesc, setEditModelDesc] = useState('');

  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [modelToDelete, setModelToDelete] = useState<ModelloContratto | null>(null);

  // Modali Gestione Subappalto nel Cantiere
  const [showAddSubappaltoModal, setShowAddSubappaltoModal] = useState(false);
  const [newSubForm, setNewSubForm] = useState<Partial<Subappalto>>({
    azienda: '',
    lavoro: '',
    prezzoOriginale: 0,
    maggiorazione: 0,
    partitaIva: '',
    email: '',
    pec: '',
    sedeLegale: '',
    rappresentanteLegale: '',
    telefono: '',
    oneriSicurezza: 0,
  });

  const [showEditSubappaltoModal, setShowEditSubappaltoModal] = useState(false);
  const [editSubForm, setEditSubForm] = useState<Partial<Subappalto>>({});

  // Modal / Form creazione nuova variabile personalizzata
  const [showAddVariableModal, setShowAddVariableModal] = useState(false);
  const [newVarKey, setNewVarKey] = useState('');
  const [newVarLabel, setNewVarLabel] = useState('');
  const [newVarDefault, setNewVarDefault] = useState('');

  // ================= STATO MODULO DNL =================
  const [dnlFormData, setDnlFormData] = useState<DnlData>(() => {
    return {
      tipoLavoro: 'Ristrutturazione Edilizia',
      naturaAppalto: 'privato',
      ...(selectedCantiere?.dnlData || {}),
    };
  });

  // Aggiorna lo stato DNL quando cambia il cantiere
  useEffect(() => {
    if (selectedCantiere) {
      setDnlFormData({
        tipoLavoro: 'Ristrutturazione Edilizia',
        naturaAppalto: 'privato',
        ...(selectedCantiere.dnlData || {}),
      });
      setCustomVariableOverrides({});
    }
  }, [selectedCantiere?.id]);

  // Calcolo valori variabili dinamiche per il cantiere selezionato
  const computedVariables = useMemo(() => {
    if (!selectedCantiere) return {};

    const importoNum = selectedCantiere.importoTotale || 0;
    const importoFormatted = importoNum.toLocaleString('it-IT', { minimumFractionDigits: 2 });
    const importoLettere = numeroInLettereItaliano(importoNum);

    // Durata in giorni
    let durataGiorni = 'Da concordare';
    if (selectedCantiere.dataInizio && (selectedCantiere.dataConsegna || selectedCantiere.scadenza)) {
      const d1 = new Date(selectedCantiere.dataInizio);
      const d2 = new Date(selectedCantiere.dataConsegna || selectedCantiere.scadenza);
      if (!isNaN(d1.getTime()) && !isNaN(d2.getTime())) {
        const diffDays = Math.ceil((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays > 0) durataGiorni = diffDays.toString();
      }
    }

    // SAL
    const salStr = selectedCantiere.salList && selectedCantiere.salList.length > 0
      ? selectedCantiere.salList.map((s, i) => `SAL ${i + 1}: ${s.titolo} - € ${s.importo.toLocaleString('it-IT')} (del ${s.data ? formatDateItalian(s.data) : 'N.D.'})`).join('\n   ')
      : 'Liquidazione in acconti a SAL e saldo finale previa emissione fattura e verifica DURC.';

    // Subappalti
    const subStr = selectedCantiere.subappalti && selectedCantiere.subappalti.length > 0
      ? selectedCantiere.subappalti.map(s => {
          const details = [
            s.partitaIva ? `P.IVA: ${s.partitaIva}` : '',
            s.email ? `Email: ${s.email}` : '',
            s.pec ? `PEC: ${s.pec}` : ''
          ].filter(Boolean).join(', ');
          return `${s.azienda} (${s.lavoro})${details ? ` [${details}]` : ''}`;
        }).join('; ')
      : 'Nessuna ditta in subappalto al momento stipulata';

    const cse = selectedCantiere.tecnici?.find(t => /sicurezza|cse/i.test(t.ruolo))?.nome || dnlFormData.coordinatoreSicurezza || 'Da nominare a cura del Committente';

    // Progettista
    const progNome = dnlFormData.progettistaNome || selectedCantiere.tecnici?.find(t => /progettista/i.test(t.ruolo))?.nome || '';
    const progTel = dnlFormData.progettistaTelefono || selectedCantiere.tecnici?.find(t => /progettista/i.test(t.ruolo))?.telefono || '';
    const progEmail = dnlFormData.progettistaEmail || selectedCantiere.tecnici?.find(t => /progettista/i.test(t.ruolo))?.email || '';
    const progPec = dnlFormData.progettistaPec || '';

    // Codice Fiscale Committente
    const cfCommittente = dnlFormData.committenteCodiceFiscale ||
      (selectedCantiere.note?.match(/C\.?F\.?[:\s]+([A-Z0-9]{11,16})/i)?.[1]) ||
      'C.F. / P.IVA Committente';

    // Allegati di default o specificati
    const allegatiDefault = dnlFormData.noteDNL && dnlFormData.noteDNL.toLowerCase().includes('allegat')
      ? dnlFormData.noteDNL
      : `1. Computo Metrico Estimativo delle lavorazioni contrattualizzate;\n2. Piano Operativo di Sicurezza (POS) ex art. 89 D.Lgs. 81/2008;\n3. Cronoprogramma esecutivo dei lavori edili;\n4. Copia polizza assicurativa C.A.R. e R.C.T. dell'Impresa;\n5. Documento Unico di Regolarità Contributiva (DURC) in corso di validità.`;

    // Calcolo importi e testi per subappalto selezionato
    const targetSub = selectedSubappalto || (selectedCantiere.subappalti && selectedCantiere.subappalti.length > 0 ? selectedCantiere.subappalti[0] : null);
    const subPrezzoNum = targetSub ? (targetSub.prezzoOriginale || 0) : 0;
    const subMaggiorazionePerc = targetSub?.maggiorazione || 0;
    const subPrezzoMaggioratoNum = subPrezzoNum + (subPrezzoNum * subMaggiorazionePerc / 100);
    const subPrezzoLettere = subPrezzoNum > 0 ? numeroInLettereItaliano(subPrezzoNum) : 'zero/00';
    const subOneriSicurezza = targetSub?.oneriSicurezza || Math.round(subPrezzoNum * 0.03);

    return {
      NOME_CANTIERE: selectedCantiere.nome || '',
      CLIENTE: selectedCantiere.cliente || '',
      CODICEFISCALE: cfCommittente,
      CODICE_FISCALE: cfCommittente,
      INDIRIZZO_CANTIERE: selectedCantiere.indirizzo || 'Ubicazione cantiere da specificare',
      IMPORTO_TOTALE: importoFormatted,
      IMPORTO_LETTERE: importoLettere,
      ONERI_SICUREZZA: (dnlFormData.oneriSicurezza || Math.round(importoNum * 0.03)).toLocaleString('it-IT', { minimumFractionDigits: 2 }),
      DATA_INIZIO: selectedCantiere.dataInizio ? formatDateItalian(selectedCantiere.dataInizio) : 'Da stabilire',
      DATA_CONSEGNA: (selectedCantiere.dataConsegna || selectedCantiere.scadenza) ? formatDateItalian(selectedCantiere.dataConsegna || selectedCantiere.scadenza) : 'Da stabilire',
      DURATA_GIORNI: durataGiorni,
      DIRETTORE_LAVORI: selectedCantiere.direttoreLavori || 'Da designare a cura del Committente',
      COORDINATORE_SICUREZZA: cse,
      PROGETTISTA: progNome || 'Da nominare a cura del Committente',
      PROGETTISTA_TEL: progTel || 'N.D.',
      PROGETTISTA_EMAIL: progEmail || 'N.D.',
      PROGETTISTA_PEC: progPec || 'N.D.',
      NOME_IMPRESA: settings.nomeAzienda || '',
      PIVA_IMPRESA: settings.partitaIva || settings.codiceFiscaleAzienda || 'P.IVA da definire',
      SEDE_IMPRESA: settings.indirizzoSede || 'Sede da definire',
      PEC_IMPRESA: settings.pec || 'PEC da definire',
      LEGALE_RAPPRESENTANTE: settings.rappresentanteLegale || 'Legale rappresentante',
      MODALITA_PAGAMENTO: 'Bonifico bancario entro 30 giorni da presentazione fattura/SAL autorizzato.',
      ELENCO_SAL: salStr,
      ELENCO_SUBAPPALTI: subStr,
      ALLEGATI: allegatiDefault,
      FORO_COMPETENTE: settings.indirizzoSede ? settings.indirizzoSede.split(',').pop()?.trim() || 'Foro competente' : 'Foro competente',
      CIG_CUP: dnlFormData.cig ? `CIG: ${dnlFormData.cig}${dnlFormData.cup ? ` - CUP: ${dnlFormData.cup}` : ''}` : 'Non applicabile (Opera privata)',
      DATA_OGGI: formatDateItalian(new Date()),
      NOTE_CANTIERE: selectedCantiere.note || 'Nessuna condizione particolare registrata.',

      // Campi specifici del Subappalto Selezionato (Autocompilazione Cantiere -> Subappalto)
      SUBAPPALTO_AZIENDA: targetSub ? targetSub.azienda : 'Ditta Subappaltatrice da concordare',
      SUBAPPALTO_LAVORO: targetSub ? targetSub.lavoro : 'Lavorazioni specialistiche di cantiere',
      SUBAPPALTO_PIVA: targetSub?.partitaIva || targetSub?.codiceFiscale || 'P.IVA / CF Subappaltatore',
      SUBAPPALTO_PEC: targetSub?.pec || 'PEC Subappaltatore',
      SUBAPPALTO_EMAIL: targetSub?.email || 'Email Subappaltatore',
      SUBAPPALTO_SEDE: targetSub?.sedeLegale || (selectedCantiere.indirizzo ? 'Sede operativa di cantiere' : 'Sede legale da concordare'),
      SUBAPPALTO_RAPPRESENTANTE: targetSub?.rappresentanteLegale || 'Legale Rappresentante Subappaltatore',
      SUBAPPALTO_TELEFONO: targetSub?.telefono || 'N.D.',
      SUBAPPALTO_PREZZO: subPrezzoNum > 0 ? subPrezzoNum.toLocaleString('it-IT', { minimumFractionDigits: 2 }) : '0,00',
      SUBAPPALTO_PREZZO_LETTERE: subPrezzoLettere,
      SUBAPPALTO_PREZZO_MAGGIORATO: subPrezzoMaggioratoNum.toLocaleString('it-IT', { minimumFractionDigits: 2 }),
      SUBAPPALTO_MAGGIORAZIONE: `${subMaggiorazionePerc}%`,
      SUBAPPALTO_ONERI_SICUREZZA: subOneriSicurezza.toLocaleString('it-IT', { minimumFractionDigits: 2 }),
    };
  }, [selectedCantiere, settings, dnlFormData, selectedSubappalto]);

  // Lista di tutte le variabili disponibili (predefinite + personalizzate dell'utente)
  const allAvailableVariables = useMemo(() => {
    const customList = (settings.customContractVariables || []).map(cv => ({
      key: cv.key,
      tag: `{{${cv.key}}}`,
      label: cv.label,
      description: cv.description || `Variabile personalizzata {{${cv.key}}}`,
      isCustom: true,
    }));
    return [
      ...CONTRACT_VARIABLES.map(v => ({ ...v, isCustom: false })),
      ...customList,
    ];
  }, [settings.customContractVariables]);

  // Valori finali variabili = calcolati + default custom + valori cantiere + modifiche al volo
  const activeVariables = useMemo(() => {
    const customDefaults: Record<string, string> = {};
    (settings.customContractVariables || []).forEach(cv => {
      customDefaults[cv.key] = cv.defaultValue || '';
    });
    const cantiereCustom = selectedCantiere?.customContractValues || {};

    return {
      ...computedVariables,
      ...customDefaults,
      ...cantiereCustom,
      ...customVariableOverrides,
    };
  }, [computedVariables, settings.customContractVariables, selectedCantiere?.customContractValues, customVariableOverrides]);

  // Testo compilato del contratto sostituendo tutti i {{TAG}} con i valori
  const compiledContractText = useMemo(() => {
    let result = contractTemplateText;
    allAvailableVariables.forEach(v => {
      const val = activeVariables[v.key] ?? '';
      const regex1 = new RegExp(`\\{\\{${v.key}\\}\\}`, 'gi');
      const regex2 = new RegExp(`\\{${v.key}\\}`, 'gi');
      result = result.replace(regex1, val).replace(regex2, val);
    });
    // Supporto per alias CODICE_FISCALE se presente
    if (activeVariables['CODICEFISCALE']) {
      result = result.replace(/\{\{CODICE_FISCALE\}\}/gi, activeVariables['CODICEFISCALE']);
    }
    // Sostituzioni bracketed per piena compatibilità con template salvati
    result = result
      .replace(/\[Denominazione Subappaltatore\]/gi, activeVariables['SUBAPPALTO_AZIENDA'] || 'Ditta Subappaltatrice')
      .replace(/\[P\.IVA\]/gi, activeVariables['SUBAPPALTO_PIVA'] || 'P.IVA')
      .replace(/\[C\.F\.\]/gi, activeVariables['SUBAPPALTO_PIVA'] || 'C.F.')
      .replace(/\[Sede\]/gi, activeVariables['SUBAPPALTO_SEDE'] || 'Sede Legale')
      .replace(/\[Rappresentante\]/gi, activeVariables['SUBAPPALTO_RAPPRESENTANTE'] || 'Legale Rappresentante')
      .replace(/\[Importo Subappalto\]/gi, activeVariables['SUBAPPALTO_PREZZO'] || '0,00')
      .replace(/\[Oneri Sicurezza Subappalto\]/gi, activeVariables['SUBAPPALTO_ONERI_SICUREZZA'] || '0,00');

    return result;
  }, [contractTemplateText, allAvailableVariables, activeVariables]);

  // Inserisci variabile al cursore nell'editor del contratto
  const handleInsertVariable = (tag: string) => {
    const textarea = document.getElementById('contract-editor-textarea') as HTMLTextAreaElement | null;
    if (!textarea) {
      setContractTemplateText(prev => prev + ' ' + tag);
      return;
    }
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const newText = text.substring(0, start) + tag + text.substring(end);
    setContractTemplateText(newText);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + tag.length, start + tag.length);
    }, 50);
  };

  // Applicazione formattazione rapida (grassetto, corsivo, sottolineato, centrato, ecc.)
  const handleApplyFormatting = (prefix: string, suffix: string, defaultPlaceholder: string = 'testo') => {
    const textarea = document.getElementById('contract-editor-textarea') as HTMLTextAreaElement | null;
    if (!textarea) {
      setContractTemplateText(prev => prev + `${prefix}${defaultPlaceholder}${suffix}`);
      return;
    }
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selectedText = text.substring(start, end) || defaultPlaceholder;
    const replacement = `${prefix}${selectedText}${suffix}`;
    const newText = text.substring(0, start) + replacement + text.substring(end);
    setContractTemplateText(newText);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length + selectedText.length);
    }, 50);
  };

  // Creazione nuova variabile personalizzata
  const handleCreateCustomVariable = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const sanitizedKey = newVarKey
      .toUpperCase()
      .replace(/[^A-Z0-9_]/g, '_')
      .replace(/^_+|_+$/g, '');

    if (!sanitizedKey) {
      if (onShowToast) onShowToast('error', 'Inserisci una sigla valida per la variabile (es. IBAN, PENALE_RITARDO, GARANZIA)');
      return;
    }

    const alreadyExists = allAvailableVariables.some(v => v.key === sanitizedKey);
    if (alreadyExists) {
      if (onShowToast) onShowToast('error', `La variabile {{${sanitizedKey}}} esiste già!`);
      return;
    }

    const newVar: CustomContractVariable = {
      key: sanitizedKey,
      label: newVarLabel.trim() || sanitizedKey,
      defaultValue: newVarDefault,
      description: `Variabile personalizzata {{${sanitizedKey}}}`,
    };

    const updatedCustomList = [...(settings.customContractVariables || []), newVar];
    onUpdateSettings({
      ...settings,
      customContractVariables: updatedCustomList,
    });

    // Se c'è un valore di default e un cantiere selezionato, memorizzalo
    if (newVarDefault && selectedCantiere) {
      onUpdateCantiere({
        ...selectedCantiere,
        customContractValues: {
          ...(selectedCantiere.customContractValues || {}),
          [sanitizedKey]: newVarDefault,
        }
      });
    }

    setNewVarKey('');
    setNewVarLabel('');
    setNewVarDefault('');
    setShowAddVariableModal(false);
    if (onShowToast) onShowToast('success', `Nuova variabile {{${sanitizedKey}}} creata con successo!`);
  };

  // Eliminazione variabile personalizzata
  const handleDeleteCustomVariable = (keyToDelete: string) => {
    const updatedCustomList = (settings.customContractVariables || []).filter(v => v.key !== keyToDelete);
    onUpdateSettings({
      ...settings,
      customContractVariables: updatedCustomList,
    });
    if (onShowToast) onShowToast('info', `Variabile {{${keyToDelete}}} rimossa.`);
  };

  // Aggiornamento del valore di una variabile per il cantiere
  const handleUpdateVariableValue = (key: string, value: string) => {
    setCustomVariableOverrides(prev => ({ ...prev, [key]: value }));
    if (selectedCantiere) {
      onUpdateCantiere({
        ...selectedCantiere,
        customContractValues: {
          ...(selectedCantiere.customContractValues || {}),
          [key]: value,
        }
      });
    }
  };

  // Rendering HTML sicuro ed elegante per l'anteprima
  const sanitizeAndFormatContractHtml = (str: string): string => {
    let s = str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Riattiva i tag di formattazione
    s = s
      .replace(/&lt;b&gt;(.*?)&lt;\/b&gt;/gi, '<strong class="font-bold text-slate-900 dark:text-white">$1</strong>')
      .replace(/&lt;strong&gt;(.*?)&lt;\/strong&gt;/gi, '<strong class="font-bold text-slate-900 dark:text-white">$1</strong>')
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-slate-900 dark:text-white">$1</strong>')
      .replace(/&lt;i&gt;(.*?)&lt;\/i&gt;/gi, '<em class="italic text-slate-700 dark:text-slate-300">$1</em>')
      .replace(/&lt;em&gt;(.*?)&lt;\/em&gt;/gi, '<em class="italic text-slate-700 dark:text-slate-300">$1</em>')
      .replace(/\*(.*?)\*/g, '<em class="italic text-slate-700 dark:text-slate-300">$1</em>')
      .replace(/&lt;u&gt;(.*?)&lt;\/u&gt;/gi, '<span class="underline decoration-slate-400 underline-offset-2">$1</span>');

    return s;
  };

  // ================= GESTIONE MODELLI DI CONTRATTO (AGGIUNTA, SALVATAGGIO, MODIFICA, ELIMINAZIONE) =================

  // 1. Salva modifiche al modello attualmente selezionato
  const handleSaveCurrentTemplate = () => {
    const updatedModels = contractModels.map(m => {
      if (m.id === selectedTemplateId) {
        return {
          ...m,
          contenuto: contractTemplateText,
          dataModifica: new Date().toISOString(),
        };
      }
      return m;
    });

    onUpdateSettings({
      ...settings,
      modelliContratti: updatedModels,
      // Manteniamo anche contrattoBaseCustom per retrocompatibilità
      contrattoBaseCustom: selectedTemplateId === 'mod-appalto-standard' || selectedTemplateId === 'mod-custom-salvato' ? contractTemplateText : settings.contrattoBaseCustom,
    });

    if (onShowToast) {
      onShowToast('success', `Modello "${activeTemplate.titolo}" salvato con successo!`);
    }
  };

  // 2. Crea un nuovo modello di contratto
  const handleCreateNewModel = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newModelTitle.trim()) {
      if (onShowToast) onShowToast('error', 'Inserisci un titolo per il nuovo modello');
      return;
    }

    let initialContent = '';
    if (newModelBaseSource === 'blank') {
      initialContent = `<center><b>${newModelTitle.trim().toUpperCase()}</b></center>\n<center><u>(Cantiere: {{NOME_CANTIERE}})</u></center>\n\nL'anno <b>{{DATA_OGGI}}</b>, in {{SEDE_IMPRESA}}, con la presente scrittura privata:\n\nTRA\n\n{{NOME_IMPRESA}} (P.IVA: {{PIVA_IMPRESA}})\n\nE\n\n{{CLIENTE}} (C.F.: {{CODICEFISCALE}})\n\nSI CONVIENE E SI STIPULA:\n\n1. OGGETTO DEI LAVORI: {{NOME_CANTIERE}} presso {{INDIRIZZO_CANTIERE}}.\n2. CORRISPETTIVO: € {{IMPORTO_TOTALE}} (Euro {{IMPORTO_LETTERE}}).\n3. INIZIO E TERMINE: Dal {{DATA_INIZIO}} al {{DATA_CONSEGNA}}.\n\nLetto e sottoscritto.\n\nIL COMMITTENTE: ___________________\n\nL'APPALTATORE: ___________________`;
    } else {
      const source = contractModels.find(m => m.id === newModelBaseSource);
      initialContent = source ? source.contenuto : DEFAULT_CONTRATTO_APPALTO;
    }

    const newId = `mod-${Date.now()}`;
    const newModel: ModelloContratto = {
      id: newId,
      titolo: newModelTitle.trim(),
      categoria: newModelCategory,
      descrizione: newModelDesc.trim() || undefined,
      contenuto: initialContent,
      isPredefinito: false,
      dataCreazione: new Date().toISOString(),
      dataModifica: new Date().toISOString(),
    };

    const updatedList = [...contractModels, newModel];
    onUpdateSettings({
      ...settings,
      modelliContratti: updatedList,
    });

    setSelectedTemplateId(newId);
    setContractTemplateText(initialContent);
    setContractViewMode('edit');
    setShowNewModelModal(false);
    setNewModelTitle('');
    setNewModelDesc('');

    if (onShowToast) {
      onShowToast('success', `Nuovo modello "${newModel.titolo}" aggiunto con successo!`);
    }
  };

  // 3. Salva con Nome (Duplica il testo corrente in un nuovo modello)
  const handleSaveAsNewModel = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!saveAsTitle.trim()) {
      if (onShowToast) onShowToast('error', 'Inserisci un titolo per la copia del modello');
      return;
    }

    const newId = `mod-${Date.now()}`;
    const newModel: ModelloContratto = {
      id: newId,
      titolo: saveAsTitle.trim(),
      categoria: saveAsCategory,
      descrizione: `Duplicato da ${activeTemplate.titolo}`,
      contenuto: contractTemplateText,
      isPredefinito: false,
      dataCreazione: new Date().toISOString(),
      dataModifica: new Date().toISOString(),
    };

    const updatedList = [...contractModels, newModel];
    onUpdateSettings({
      ...settings,
      modelliContratti: updatedList,
    });

    setSelectedTemplateId(newId);
    setShowSaveAsModal(false);
    setSaveAsTitle('');

    if (onShowToast) {
      onShowToast('success', `Modello duplicato e salvato come "${newModel.titolo}"!`);
    }
  };

  // 4. Modifica Dettagli del Modello (Rinomina, Categoria, Descrizione)
  const handleUpdateModelDetails = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!editModelTitle.trim()) {
      if (onShowToast) onShowToast('error', 'Il titolo del modello non può essere vuoto');
      return;
    }

    const updatedList = contractModels.map(m => {
      if (m.id === selectedTemplateId) {
        return {
          ...m,
          titolo: editModelTitle.trim(),
          categoria: editModelCategory,
          descrizione: editModelDesc.trim() || undefined,
          dataModifica: new Date().toISOString(),
        };
      }
      return m;
    });

    onUpdateSettings({
      ...settings,
      modelliContratti: updatedList,
    });

    setShowEditModelModal(false);
    if (onShowToast) {
      onShowToast('success', 'Dettagli del modello aggiornati con successo!');
    }
  };

  // 5. Elimina Modello di Contratto
  const handleDeleteModel = (idToDelete: string) => {
    const target = contractModels.find(m => m.id === idToDelete);
    const updatedList = contractModels.filter(m => m.id !== idToDelete);

    onUpdateSettings({
      ...settings,
      modelliContratti: updatedList,
    });

    if (selectedTemplateId === idToDelete) {
      const fallback = updatedList[0] || DEFAULT_MODELLI_CONTRATTO[0];
      setSelectedTemplateId(fallback.id);
      setContractTemplateText(fallback.contenuto);
    }

    setShowDeleteConfirmModal(false);
    setModelToDelete(null);

    if (onShowToast) {
      onShowToast('info', `Modello "${target?.titolo || ''}" eliminato.`);
    }
  };

  // 6. Ripristina Modelli Predefiniti
  const handleRestoreDefaultModels = () => {
    const existingIds = new Set(contractModels.map(m => m.id));
    const merged = [...contractModels];
    DEFAULT_MODELLI_CONTRATTO.forEach(dm => {
      if (!existingIds.has(dm.id)) {
        merged.push(dm);
      }
    });

    onUpdateSettings({
      ...settings,
      modelliContratti: merged,
    });

    if (onShowToast) {
      onShowToast('success', 'Modelli di contratto predefiniti di sistema ripristinati!');
    }
  };

  // ================= GESTIONE SUBAPPALTI CANTIERE & AUTOCOMPILAZIONE CONTRATTO =================

  // Selezione subappalto per autocompilare istantaneamente il contratto
  const handleSelectSubappalto = (sub: Subappalto) => {
    setSelectedSubappaltoId(sub.id);

    // Se il modello corrente non è di tipo subappalto, passa al modello subappalto
    if (activeTemplate.categoria !== 'subappalto') {
      const subModel = contractModels.find(m => m.categoria === 'subappalto') || contractModels.find(m => m.id === 'mod-subappalto-specialistico');
      if (subModel) {
        setSelectedTemplateId(subModel.id);
        setContractTemplateText(subModel.contenuto);
      }
    }

    if (onShowToast) {
      onShowToast('success', `Contratto autocompilato per ${sub.azienda} (${sub.lavoro})`);
    }
  };

  // Deseleziona subappalto
  const handleDeselectSubappalto = () => {
    setSelectedSubappaltoId(null);
    if (onShowToast) {
      onShowToast('info', 'Subappalto deselezionato. Ripristinati i dati generali del cantiere.');
    }
  };

  // Aggiungi un nuovo subappalto direttamente dal cantiere
  const handleSaveNewSubappalto = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedCantiere) return;

    if (!newSubForm.azienda?.trim()) {
      if (onShowToast) onShowToast('error', 'Inserisci la ragione sociale dell\'impresa subappaltatrice');
      return;
    }

    const newSub: Subappalto = {
      id: `sub-${Date.now()}`,
      azienda: newSubForm.azienda.trim(),
      lavoro: newSubForm.lavoro?.trim() || 'Opere specialistiche',
      prezzoOriginale: Number(newSubForm.prezzoOriginale) || 0,
      maggiorazione: Number(newSubForm.maggiorazione) || 0,
      partitaIva: newSubForm.partitaIva?.trim() || '',
      email: newSubForm.email?.trim() || '',
      pec: newSubForm.pec?.trim() || '',
      sedeLegale: newSubForm.sedeLegale?.trim() || '',
      rappresentanteLegale: newSubForm.rappresentanteLegale?.trim() || '',
      telefono: newSubForm.telefono?.trim() || '',
      oneriSicurezza: Number(newSubForm.oneriSicurezza) || Math.round((Number(newSubForm.prezzoOriginale) || 0) * 0.03),
    };

    const updatedSubList = [...(selectedCantiere.subappalti || []), newSub];
    onUpdateCantiere({
      ...selectedCantiere,
      subappalti: updatedSubList,
    });

    // Seleziona subito il subappalto appena creato e applica template subappalto
    setSelectedSubappaltoId(newSub.id);
    const subModel = contractModels.find(m => m.categoria === 'subappalto') || contractModels[1] || contractModels[0];
    if (subModel) {
      setSelectedTemplateId(subModel.id);
      setContractTemplateText(subModel.contenuto);
    }

    setShowAddSubappaltoModal(false);
    setNewSubForm({
      azienda: '',
      lavoro: '',
      prezzoOriginale: 0,
      maggiorazione: 0,
      partitaIva: '',
      email: '',
      pec: '',
      sedeLegale: '',
      rappresentanteLegale: '',
      telefono: '',
      oneriSicurezza: 0,
    });

    if (onShowToast) {
      onShowToast('success', `Subappalto "${newSub.azienda}" aggiunto e contratto autocompilato!`);
    }
  };

  // Modifica dati subappalto salvato
  const handleSaveEditedSubappalto = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedCantiere || !editSubForm.id) return;

    const updatedSubList = (selectedCantiere.subappalti || []).map(s => {
      if (s.id === editSubForm.id) {
        return {
          ...s,
          ...editSubForm,
          azienda: editSubForm.azienda?.trim() || s.azienda,
          lavoro: editSubForm.lavoro?.trim() || s.lavoro,
          prezzoOriginale: Number(editSubForm.prezzoOriginale) ?? s.prezzoOriginale,
          maggiorazione: Number(editSubForm.maggiorazione) ?? s.maggiorazione,
          partitaIva: editSubForm.partitaIva?.trim(),
          email: editSubForm.email?.trim(),
          pec: editSubForm.pec?.trim(),
          sedeLegale: editSubForm.sedeLegale?.trim(),
          rappresentanteLegale: editSubForm.rappresentanteLegale?.trim(),
          telefono: editSubForm.telefono?.trim(),
          oneriSicurezza: Number(editSubForm.oneriSicurezza) ?? s.oneriSicurezza,
        };
      }
      return s;
    });

    onUpdateCantiere({
      ...selectedCantiere,
      subappalti: updatedSubList,
    });

    setShowEditSubappaltoModal(false);
    if (onShowToast) {
      onShowToast('success', `Dati del subappalto "${editSubForm.azienda}" aggiornati!`);
    }
  };

  // Salva i dati DNL nel cantiere
  const handleSaveDnl = () => {
    if (!selectedCantiere) return;
    const updated: Cantiere = {
      ...selectedCantiere,
      dnlData: dnlFormData,
    };
    onUpdateCantiere(updated);
    if (onShowToast) onShowToast('success', `Dati DNL per il cantiere "${selectedCantiere.nome}" salvati con successo!`);
  };

  // Salva dati aziendali modificati (es. Codice Cassa Edile, PAT Inail) anche nel profilo generale
  const handleSaveCompanyDnlDefaults = () => {
    onUpdateSettings({
      ...settings,
      codiceCassaEdile: dnlFormData.codiceCassaEdile || settings.codiceCassaEdile,
      patInail: dnlFormData.patInail || settings.patInail,
      matricolaInps: dnlFormData.matricolaInps || settings.matricolaInps,
      ccnlApplicato: dnlFormData.ccnl || settings.ccnlApplicato,
    });
    if (onShowToast) onShowToast('success', 'Dati previdenziali aziendali salvati nelle impostazioni generali!');
  };

  // Copia negli appunti
  const handleCopyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    if (onShowToast) onShowToast('info', `${label} copiato negli appunti!`);
  };

  // Copia riepilogo DNL per il commercialista / consulente del lavoro
  const handleCopyDnlForConsultant = () => {
    if (!selectedCantiere) return;
    const txt = exportDnlToTxt(selectedCantiere, settings, dnlFormData);
    const consultantMessage = `Spett.le Studio di Consulenza del Lavoro,\n\nVi trasmettiamo i dati completi per l'apertura e l'inoltro della Denuncia di Nuovo Lavoro (D.N.L.) per la Cassa Edile e l'INAIL relativi al nostro cantiere:\n\n${txt}\n\nRestiamo a disposizione per qualsiasi chiarimento.\nCordiali saluti,\n${settings.nomeAzienda}`;
    handleCopyText(consultantMessage, 'Scheda DNL per Consulente del Lavoro');
  };

  // Gestione Subappalti direttamente dalla sezione DNL
  const handleUpdateSubappalto = (subId: string, updates: Partial<Subappalto>) => {
    if (!selectedCantiere) return;
    const updatedSubappalti = (selectedCantiere.subappalti || []).map(s =>
      s.id === subId ? { ...s, ...updates } : s
    );
    onUpdateCantiere({
      ...selectedCantiere,
      subappalti: updatedSubappalti,
    });
  };

  const handleAddSubappalto = () => {
    if (!selectedCantiere) return;
    const newSub: Subappalto = {
      id: Math.random().toString(),
      azienda: '',
      lavoro: '',
      prezzoOriginale: 0,
      maggiorazione: 0,
      partitaIva: '',
      email: '',
      pec: '',
    };
    onUpdateCantiere({
      ...selectedCantiere,
      subappalti: [...(selectedCantiere.subappalti || []), newSub],
    });
    if (onShowToast) onShowToast('info', 'Nuovo subappalto inserito nella DNL.');
  };

  const handleDeleteSubappalto = (subId: string) => {
    if (!selectedCantiere) return;
    onUpdateCantiere({
      ...selectedCantiere,
      subappalti: (selectedCantiere.subappalti || []).filter(s => s.id !== subId),
    });
  };

  if (cantieri.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 p-12 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 text-center space-y-4 shadow-sm">
        <div className="w-16 h-16 rounded-3xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto text-2xl">
          <Icons.Contract />
        </div>
        <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight">Nessun Cantiere Registrato</h3>
        <p className="text-sm text-slate-400 max-w-md mx-auto">
          Per generare contratti o aprire file DNL è necessario prima creare almeno un cantiere nel database del gestionale.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-12">
      {/* ================= HEADER SEZIONE CONTRATTI & DNL ================= */}
      <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col xl:flex-row xl:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-2xl">
              <Icons.Contract />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
                  Contratti & Fascicoli DNL
                </h2>
                <span className="px-2.5 py-0.5 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-[10px] font-black rounded-full uppercase tracking-wider">
                  Edilizia 4.0
                </span>
              </div>
              <p className="text-xs font-bold text-slate-400 dark:text-slate-500">
                Generazione automatica contratti di cantiere con variabili dinamiche e file telematico DNL (Cassa Edile & INAIL)
              </p>
            </div>
          </div>
        </div>

        {/* Switcher Moduli Principali */}
        <div className="flex flex-wrap items-center gap-2 bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-2xl border border-slate-200/60 dark:border-slate-700">
          <button
            onClick={() => setActiveModule('contratti')}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
              activeModule === 'contratti'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 scale-[1.02]'
                : 'text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-white'
            }`}
          >
            <Icons.Contract />
            <span>1. Contratti di Cantiere</span>
          </button>
          <button
            onClick={() => setActiveModule('dnl')}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
              activeModule === 'dnl'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 scale-[1.02]'
                : 'text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-white'
            }`}
          >
            <Icons.FileText />
            <span>2. File & Scheda DNL</span>
          </button>
        </div>
      </div>

      {/* ================= BARRA SELEZIONE CANTIERE ATTIVO ================= */}
      <div className="bg-white dark:bg-slate-900 p-5 md:p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex-1 flex flex-col sm:flex-row sm:items-center gap-3">
          <label className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider shrink-0 flex items-center gap-1.5">
            <span className="text-blue-600">🏗️</span> Seleziona Cantiere:
          </label>
          <select
            value={selectedCantiere?.id || ''}
            onChange={(e) => setSelectedCantiereId(e.target.value)}
            className="w-full sm:max-w-md p-3 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-xl text-sm font-black text-slate-900 dark:text-white outline-none focus:border-blue-500 transition-all cursor-pointer"
          >
            {cantieri.map(c => (
              <option key={c.id} value={c.id}>
                {c.nome} — {c.cliente} (€ {(c.importoTotale || 0).toLocaleString('it-IT')}) [{c.stato.toUpperCase()}]
              </option>
            ))}
          </select>
        </div>

        {selectedCantiere && (
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <div className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 flex items-center gap-2">
              <span className="text-slate-400 font-bold">Committente:</span>
              <span className="font-black text-slate-800 dark:text-slate-200">{selectedCantiere.cliente}</span>
            </div>
            <div className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 flex items-center gap-2">
              <span className="text-slate-400 font-bold">Importo:</span>
              <span className="font-black text-blue-600 dark:text-blue-400">€ {(selectedCantiere.importoTotale || 0).toLocaleString('it-IT')}</span>
            </div>
            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
              selectedCantiere.stato === 'aperto' ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300' :
              selectedCantiere.stato === 'in apertura' ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300' :
              'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}>
              {selectedCantiere.stato}
            </span>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* ======================= MODULO 1: CONTRATTI DI CANTIERE ================= */}
      {/* ========================================================================= */}
      {activeModule === 'contratti' && selectedCantiere && (
        <div className="space-y-6">

          {/* ================= SEZIONE SUBAPPALTI DEFINITI NEL CANTIERE ================= */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <span className="p-2.5 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-2xl text-xl">
                  🏗️🤝
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">
                      Subappalti Definiti per il Cantiere "{selectedCantiere.nome}"
                    </h3>
                    <span className="px-2 py-0.5 rounded-lg bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 text-[10px] font-black uppercase">
                      {selectedCantiere.subappalti?.length || 0} Registrati
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Seleziona una ditta subappaltatrice per compilare automaticamente il contratto con i suoi dati aziendali, lavorazioni, importi e P.IVA.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setNewSubForm({
                    azienda: '',
                    lavoro: '',
                    prezzoOriginale: 0,
                    maggiorazione: 0,
                    partitaIva: '',
                    email: '',
                    pec: '',
                    sedeLegale: '',
                    rappresentanteLegale: '',
                    telefono: '',
                    oneriSicurezza: 0,
                  });
                  setShowAddSubappaltoModal(true);
                }}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md shadow-amber-600/20 flex items-center gap-1.5 shrink-0"
              >
                <span>➕</span> Nuovo Subappalto
              </button>
            </div>

            {/* Banner Stato Subappalto Attivo nel Contratto */}
            {selectedSubappalto && (
              <div className="p-3.5 bg-emerald-50/80 dark:bg-emerald-950/40 border-2 border-emerald-300 dark:border-emerald-800 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                  <div>
                    <p className="text-xs font-black text-emerald-900 dark:text-emerald-200">
                      Contratto autocompilato per: <span className="underline decoration-emerald-500 underline-offset-2">{selectedSubappalto.azienda}</span> ({selectedSubappalto.lavoro})
                    </p>
                    <p className="text-[10px] text-emerald-700 dark:text-emerald-400">
                      Importo: € {(selectedSubappalto.prezzoOriginale || 0).toLocaleString('it-IT')} | P.IVA: {selectedSubappalto.partitaIva || 'N.D.'} | PEC: {selectedSubappalto.pec || 'N.D.'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setEditSubForm({ ...selectedSubappalto });
                      setShowEditSubappaltoModal(true);
                    }}
                    className="px-3 py-1.5 bg-white dark:bg-slate-900 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-slate-800 border border-emerald-200 dark:border-emerald-800 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1"
                  >
                    <span>✏️</span> Modifica Dati Ditta
                  </button>
                  <button
                    type="button"
                    onClick={handleDeselectSubappalto}
                    className="px-3 py-1.5 bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all"
                    title="Torna alla compilazione del contratto generale dell'appalto"
                  >
                    Deseleziona
                  </button>
                </div>
              </div>
            )}

            {/* Elenco Carte Subappalti Registrati */}
            {selectedCantiere.subappalti && selectedCantiere.subappalti.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {selectedCantiere.subappalti.map((sub) => {
                  const isSelected = selectedSubappaltoId === sub.id;
                  return (
                    <div
                      key={sub.id}
                      onClick={() => handleSelectSubappalto(sub)}
                      className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between gap-3 text-left relative ${
                        isSelected
                          ? 'bg-blue-50/70 dark:bg-blue-950/40 border-blue-500 dark:border-blue-600 shadow-md ring-2 ring-blue-500/20'
                          : 'bg-slate-50/70 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/80 hover:border-blue-300 dark:hover:border-slate-600'
                      }`}
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-sm font-black text-slate-900 dark:text-white truncate">
                            {sub.azienda || 'Azienda non nominata'}
                          </h4>
                          <span className="px-2 py-0.5 rounded-lg bg-amber-100/80 dark:bg-amber-900/50 text-amber-800 dark:text-amber-200 text-[10px] font-extrabold shrink-0 truncate max-w-[130px]">
                            {sub.lavoro || 'Opere generali'}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 space-y-0.5">
                          <p>
                            <span className="font-bold text-slate-700 dark:text-slate-300">P.IVA:</span> {sub.partitaIva || 'Non indicata'}
                          </p>
                          {sub.pec && (
                            <p className="truncate">
                              <span className="font-bold text-slate-700 dark:text-slate-300">PEC:</span> {sub.pec}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between gap-2">
                        <div>
                          <p className="text-[9px] font-black text-slate-400 uppercase">Prezzo Subappalto</p>
                          <p className="text-xs font-black text-blue-600 dark:text-blue-400">
                            € {(sub.prezzoOriginale || 0).toLocaleString('it-IT', { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => {
                              setEditSubForm({ ...sub });
                              setShowEditSubappaltoModal(true);
                            }}
                            className="p-1.5 bg-white dark:bg-slate-900 text-slate-500 hover:text-blue-600 rounded-lg border border-slate-200 dark:border-slate-700 text-xs"
                            title="Modifica dati subappalto"
                          >
                            ✏️
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSelectSubappalto(sub)}
                            className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${
                              isSelected
                                ? 'bg-blue-600 text-white shadow-xs'
                                : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-blue-500 hover:text-white'
                            }`}
                          >
                            {isSelected ? '✓ Selezionato' : '⚡ Compila'}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 text-center space-y-2">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Nessun subappalto registrato per questo cantiere. Puoi definirne uno adesso per generare automaticamente il contratto di subappalto.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setNewSubForm({
                      azienda: '',
                      lavoro: '',
                      prezzoOriginale: 0,
                      maggiorazione: 0,
                      partitaIva: '',
                      email: '',
                      pec: '',
                      sedeLegale: '',
                      rappresentanteLegale: '',
                      telefono: '',
                      oneriSicurezza: 0,
                    });
                    setShowAddSubappaltoModal(true);
                  }}
                  className="px-3.5 py-1.5 bg-blue-600 text-white rounded-xl text-xs font-black uppercase hover:bg-blue-700 transition-all inline-flex items-center gap-1 shadow-xs"
                >
                  <span>+</span> Aggiungi Subappaltatore adesso
                </button>
              </div>
            )}
          </div>

          {/* ================= BARRA MODELLI DI CONTRATTO (AGGIUNGI, SALVA, ELIMINA) ================= */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex flex-col gap-4">
              
              {/* Riga Categorie e Azioni Modello */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-1">Filtro:</span>
                  {(['tutti', 'appalto', 'subappalto', 'incarico', 'personalizzato'] as const).map(cat => {
                    const count = cat === 'tutti' 
                      ? contractModels.length 
                      : contractModels.filter(m => m.categoria === cat).length;
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setModelCategoryFilter(cat)}
                        className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${
                          modelCategoryFilter === cat
                            ? 'bg-slate-900 dark:bg-blue-600 text-white shadow-xs'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                        }`}
                      >
                        {cat === 'tutti' ? 'Tutti i Modelli' : cat} ({count})
                      </button>
                    );
                  })}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setNewModelTitle('');
                      setNewModelDesc('');
                      setNewModelCategory('subappalto');
                      setNewModelBaseSource(activeTemplate.id);
                      setShowNewModelModal(true);
                    }}
                    className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-xs flex items-center gap-1"
                  >
                    <span>➕</span> Nuovo Modello
                  </button>

                  <button
                    type="button"
                    onClick={handleSaveCurrentTemplate}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1 ${
                      isTemplateDirty
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/30 animate-pulse'
                        : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                    }`}
                    title="Salva le modifiche apportate a questo modello di contratto"
                  >
                    <Icons.Check />
                    <span>Salva Modello</span>
                    {isTemplateDirty && <span className="w-2 h-2 rounded-full bg-white ml-0.5" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSaveAsTitle(`${activeTemplate.titolo} (Copia)`);
                      setSaveAsCategory(activeTemplate.categoria);
                      setShowSaveAsModal(true);
                    }}
                    className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1"
                    title="Duplica il testo corrente come un nuovo modello salvato"
                  >
                    <span>📑</span> Duplica / Salva con Nome
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setEditModelTitle(activeTemplate.titolo);
                      setEditModelCategory(activeTemplate.categoria);
                      setEditModelDesc(activeTemplate.descrizione || '');
                      setShowEditModelModal(true);
                    }}
                    className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-bold transition-all"
                    title="Rinomina o modifica dettagli del modello"
                  >
                    ✏️
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setModelToDelete(activeTemplate);
                      setShowDeleteConfirmModal(true);
                    }}
                    disabled={contractModels.length <= 1}
                    className="px-2.5 py-1.5 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-600 dark:text-rose-400 rounded-xl text-xs font-bold border border-rose-200 dark:border-rose-900/60 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                    title="Elimina questo modello di contratto"
                  >
                    🗑️
                  </button>

                  <button
                    type="button"
                    onClick={handleRestoreDefaultModels}
                    className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 text-slate-500 hover:text-slate-800 rounded-xl text-xs transition-all border border-slate-200 dark:border-slate-700"
                    title="Ripristina i modelli predefiniti di base se mancanti"
                  >
                    🔄
                  </button>
                </div>
              </div>

              {/* Selettore Modelli Orizzontale */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-black text-slate-400 uppercase tracking-wider mr-1">Modello Attivo:</span>
                {contractModels
                  .filter(m => modelCategoryFilter === 'tutti' || m.categoria === modelCategoryFilter)
                  .map(m => {
                    const isSelected = selectedTemplateId === m.id;
                    const catBadge = m.categoria === 'subappalto'
                      ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300'
                      : m.categoria === 'appalto'
                      ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300'
                      : m.categoria === 'incarico'
                      ? 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300'
                      : 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300';

                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setSelectedTemplateId(m.id)}
                        className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 border ${
                          isSelected
                            ? 'bg-slate-900 dark:bg-blue-600 text-white shadow-md border-transparent scale-[1.02]'
                            : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-black ${catBadge}`}>
                          {m.categoria}
                        </span>
                        <span>{m.titolo}</span>
                        {isSelected && isTemplateDirty && (
                          <span className="w-2 h-2 rounded-full bg-amber-400" title="Modifiche non salvate" />
                        )}
                      </button>
                    );
                  })}
              </div>

              {/* Azioni Principali: Export, Word, PDF, Stampa, Variabili */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowVariablesPanel(!showVariablesPanel)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 border ${
                      showVariablesPanel
                        ? 'bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 border-blue-300'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span>⚙️</span> Modifica Variabili ({Object.keys(activeVariables).length})
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowAddVariableModal(true)}
                    className="px-3.5 py-2 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5"
                    title="Aggiungi una nuova variabile personalizzata (es. IBAN, PENALE)"
                  >
                    <span>➕</span> Nuova Variabile
                  </button>

                  <button
                    type="button"
                    onClick={() => setContractViewMode(contractViewMode === 'preview' ? 'edit' : 'preview')}
                    className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-slate-200 dark:hover:bg-slate-700 transition-all flex items-center gap-1.5"
                  >
                    {contractViewMode === 'preview' ? '✏️ Modifica Testo Base' : '👁️ Anteprima Compilata'}
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleCopyText(compiledContractText, 'Contratto')}
                    className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5"
                    title="Copia testo negli appunti"
                  >
                    <Icons.Copy /> Copia
                  </button>

                  <button
                    type="button"
                    onClick={() => exportContractToWord(compiledContractText, selectedCantiere.nome, settings.nomeAzienda)}
                    className="px-3.5 py-2 bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5"
                    title="Scarica file Word (.doc)"
                  >
                    <Icons.FileText /> Word (.doc)
                  </button>

                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5"
                    title="Stampa diretta con il browser o Salva in PDF"
                  >
                    <span>🖨️</span> Stampa
                  </button>

                  <button
                    type="button"
                    onClick={() => exportContractToPdf(compiledContractText, selectedCantiere, settings)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md shadow-blue-600/30 flex items-center gap-1.5"
                    title="Scarica PDF Ufficiale"
                  >
                    <Icons.Pdf /> Scarica PDF Ufficiale
                  </button>
                </div>
              </div>
            </div>

            {/* Inseritore rapido Variabili nel testo */}
            {contractViewMode === 'edit' && (
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                    <span>💡</span> Clicca su una variabile per inserirla nel punto del cursore:
                  </p>
                  <button
                    onClick={() => setShowAddVariableModal(true)}
                    className="text-[10px] font-black text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                  >
                    <span>+</span> Crea Nuova Variabile
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto custom-scrollbar p-1">
                  {allAvailableVariables.map(v => (
                    <div key={v.key} className="inline-flex items-center group">
                      <button
                        onClick={() => handleInsertVariable(v.tag)}
                        title={`${v.label}: ${v.description}`}
                        className={`px-2.5 py-1 ${
                          v.isCustom
                            ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200 border border-amber-200 dark:border-amber-800/60 hover:bg-amber-100'
                            : 'bg-slate-50 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-900/40 hover:text-blue-600 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                        } rounded-lg text-[10px] font-mono font-bold transition-all flex items-center gap-1`}
                      >
                        {v.tag}
                        {v.isCustom && <span className="text-[8px] bg-amber-200/80 dark:bg-amber-800/80 px-1 rounded text-amber-900 dark:text-amber-100">Personalizzata</span>}
                      </button>
                      {v.isCustom && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteCustomVariable(v.key);
                          }}
                          className="ml-0.5 p-1 text-slate-400 hover:text-rose-500 rounded text-[10px]"
                          title="Elimina variabile personalizzata"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Pannello Delle Variabili Modificabili (Collapsible) */}
          {showVariablesPanel && (
            <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-blue-200 dark:border-blue-900/50 shadow-md space-y-4 animate-in slide-in-from-top-2 duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="text-blue-600 font-black text-base">⚙️</span>
                  <div>
                    <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">
                      Valori Variabili del Cantiere (Predefinite & Personalizzate)
                    </h4>
                    <p className="text-[10px] text-slate-400">
                      Modifica i valori al volo per questo cantiere. Puoi anche aggiungere ulteriori variabili personalizzate tramite il pulsante apposito.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowAddVariableModal(true)}
                    className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-[10px] font-black uppercase tracking-wider transition-all shadow-xs flex items-center gap-1"
                  >
                    <span>+</span> Aggiungi Variabile
                  </button>
                  <button
                    onClick={() => setCustomVariableOverrides({})}
                    className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg text-[10px] font-black uppercase hover:bg-slate-200 transition-all"
                  >
                    Ripristina
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[500px] overflow-y-auto custom-scrollbar p-1">
                {allAvailableVariables.map(v => (
                  <div
                    key={v.key}
                    className={`p-3 rounded-xl border ${
                      v.isCustom
                        ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/40'
                        : 'bg-slate-50/50 dark:bg-slate-800/50 border-slate-200/80 dark:border-slate-700/80'
                    } space-y-1`}
                  >
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1 truncate">
                        <span>{v.label}</span>
                        {v.isCustom && (
                          <span className="text-[8px] bg-amber-200 dark:bg-amber-800/60 text-amber-800 dark:text-amber-200 px-1 py-0.5 rounded font-bold">
                            Personalizzata
                          </span>
                        )}
                      </label>
                      <div className="flex items-center gap-1">
                        <span className="text-slate-400 font-mono text-[9px]">{v.tag}</span>
                        {v.isCustom && (
                          <button
                            onClick={() => handleDeleteCustomVariable(v.key)}
                            className="text-slate-400 hover:text-rose-500 p-0.5 rounded"
                            title="Elimina variabile"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    </div>
                    {v.key === 'ALLEGATI' || v.key === 'NOTE_CANTIERE' || (activeVariables[v.key] && activeVariables[v.key].length > 60) ? (
                      <textarea
                        rows={3}
                        value={activeVariables[v.key] ?? ''}
                        onChange={(e) => handleUpdateVariableValue(v.key, e.target.value)}
                        className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-900 dark:text-white outline-none focus:border-blue-500 transition-all custom-scrollbar"
                      />
                    ) : (
                      <input
                        type="text"
                        value={activeVariables[v.key] ?? ''}
                        onChange={(e) => handleUpdateVariableValue(v.key, e.target.value)}
                        className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-blue-500 transition-all"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Area Contratto: Editor vs Anteprima */}
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="px-6 py-4 bg-slate-50/70 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
                <span className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                  {contractViewMode === 'preview'
                    ? 'Anteprima Contratto Compilato con i Dati di Cantiere'
                    : 'Editor Modello Contrattuale (Supporta Formattazione e Variabili)'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {contractViewMode === 'edit' && (
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={handleSaveCurrentTemplate}
                      className={`px-4 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-xs flex items-center gap-1 ${
                        isTemplateDirty
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white animate-pulse'
                          : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                      }`}
                      title="Salva modifiche a questo modello"
                    >
                      <Icons.Check /> Salva Modello
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSaveAsTitle(`${activeTemplate.titolo} (Copia)`);
                        setSaveAsCategory(activeTemplate.categoria);
                        setShowSaveAsModal(true);
                      }}
                      className="px-3.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1"
                    >
                      <span>📑</span> Salva come Nuovo...
                    </button>
                  </div>
                )}
                <button
                  onClick={() => setContractViewMode(contractViewMode === 'preview' ? 'edit' : 'preview')}
                  className="px-3.5 py-1.5 bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 hover:bg-blue-100 rounded-xl text-xs font-black uppercase tracking-wider transition-all"
                >
                  {contractViewMode === 'preview' ? '✏️ Apri Editor' : '👁️ Mostra Anteprima'}
                </button>
              </div>
            </div>

            <div className="p-6 md:p-8 space-y-4">
              {contractViewMode === 'edit' && (
                /* Barra Strumenti di Formattazione Minima (Grassetto, Corsivo, Sottolineato, Centrato, ecc.) */
                <div className="p-3 bg-slate-100/80 dark:bg-slate-800/80 rounded-2xl border border-slate-200/80 dark:border-slate-700 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider mr-1">
                      Formattazione:
                    </span>

                    {/* Grassetto */}
                    <button
                      type="button"
                      onClick={() => handleApplyFormatting('<b>', '</b>', 'testo in grassetto')}
                      className="w-8 h-8 flex items-center justify-center bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-800 dark:text-slate-100 shadow-xs transition-all"
                      title="Grassetto: <b>testo</b>"
                    >
                      <strong className="font-extrabold text-sm">B</strong>
                    </button>

                    {/* Corsivo */}
                    <button
                      type="button"
                      onClick={() => handleApplyFormatting('<i>', '</i>', 'testo in corsivo')}
                      className="w-8 h-8 flex items-center justify-center bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-800 dark:text-slate-100 shadow-xs transition-all"
                      title="Corsivo: <i>testo</i>"
                    >
                      <span className="italic text-sm font-serif font-bold">I</span>
                    </button>

                    {/* Sottolineato */}
                    <button
                      type="button"
                      onClick={() => handleApplyFormatting('<u>', '</u>', 'testo sottolineato')}
                      className="w-8 h-8 flex items-center justify-center bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-800 dark:text-slate-100 shadow-xs transition-all"
                      title="Sottolineato: <u>testo</u>"
                    >
                      <span className="underline underline-offset-2 text-sm font-bold">U</span>
                    </button>

                    {/* Centrato */}
                    <button
                      type="button"
                      onClick={() => handleApplyFormatting('<center>', '</center>', 'testo centrato')}
                      className="px-2.5 h-8 flex items-center justify-center bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-800 dark:text-slate-100 shadow-xs transition-all gap-1"
                      title="Centrato: <center>testo</center>"
                    >
                      <span className="text-xs">≡</span>
                      <span className="text-[10px] font-black uppercase">Centrato</span>
                    </button>

                    <div className="w-[1px] h-5 bg-slate-200 dark:bg-slate-700 mx-1" />

                    {/* Titolo Articolo */}
                    <button
                      type="button"
                      onClick={() => handleApplyFormatting('\n\n<b>ART. ', ' - OGGETTO</b>\n', '1')}
                      className="px-2.5 h-8 flex items-center justify-center bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-[10px] font-black uppercase text-slate-700 dark:text-slate-200 shadow-xs transition-all gap-1"
                      title="Inserisci intestazione articolo"
                    >
                      <span>📑</span> Articolo
                    </button>

                    {/* Punto Elenco */}
                    <button
                      type="button"
                      onClick={() => handleApplyFormatting('\n- ', '', 'Nuovo punto elenco')}
                      className="px-2.5 h-8 flex items-center justify-center bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-[10px] font-black uppercase text-slate-700 dark:text-slate-200 shadow-xs transition-all gap-1"
                      title="Punto elenco"
                    >
                      <span>•</span> Elenco
                    </button>

                    {/* Firme Contratto */}
                    <button
                      type="button"
                      onClick={() => handleApplyFormatting('\n\nIL COMMITTENTE: ___________________________\n\nL\'APPALTATORE: ___________________________\n', '', '')}
                      className="px-2.5 h-8 flex items-center justify-center bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-[10px] font-black uppercase text-slate-700 dark:text-slate-200 shadow-xs transition-all gap-1"
                      title="Inserisci spazio per firme"
                    >
                      <span>✍️</span> Blocco Firme
                    </button>
                  </div>

                  <div className="flex items-center gap-2 text-[10px] text-slate-400">
                    <span>Supporta <code>&lt;b&gt;</code>, <code>&lt;i&gt;</code>, <code>&lt;u&gt;</code>, <code>&lt;center&gt;</code></span>
                  </div>
                </div>
              )}

              {contractViewMode === 'preview' ? (
                <div className="bg-[#fcfdfd] dark:bg-slate-950 p-6 md:p-10 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-inner max-h-[700px] overflow-y-auto custom-scrollbar">
                  <div className="max-w-3xl mx-auto space-y-2.5 font-serif text-[13px] leading-relaxed text-slate-800 dark:text-slate-200">
                    {compiledContractText.split('\n').map((paragraph, pIdx) => {
                      const trimmed = paragraph.trim();
                      if (!trimmed) {
                        return <div key={pIdx} className="h-2" />;
                      }

                      const isCentered = /<center>|\[center\]/i.test(paragraph);
                      const cleanPara = paragraph.replace(/<\/?center>/gi, '').replace(/\[\/?center\]/gi, '');

                      return (
                        <div
                          key={pIdx}
                          className={`${isCentered ? 'text-center my-1.5' : 'text-justify'} transition-colors`}
                          dangerouslySetInnerHTML={{
                            __html: sanitizeAndFormatContractHtml(cleanPara),
                          }}
                        />
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <textarea
                    id="contract-editor-textarea"
                    rows={22}
                    value={contractTemplateText}
                    onChange={(e) => setContractTemplateText(e.target.value)}
                    className="w-full p-5 bg-[#fcfdfd] dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-700 rounded-2xl font-mono text-xs leading-relaxed text-slate-900 dark:text-slate-100 outline-none focus:border-blue-500 transition-all custom-scrollbar"
                    placeholder="Inserisci il testo contrattuale con le variabili..."
                  />
                  <div className="flex flex-wrap items-center justify-between text-xs text-slate-400 gap-2">
                    <p>
                      Usa <code>{`{{NOME_VARIABILE}}`}</code> per i campi dinamici e i tag <code>&lt;b&gt;</code>, <code>&lt;i&gt;</code>, <code>&lt;u&gt;</code>, <code>&lt;center&gt;</code> per la formattazione.
                    </p>
                    <button
                      onClick={() => setContractTemplateText(DEFAULT_CONTRATTO_APPALTO)}
                      className="text-rose-500 hover:underline font-bold"
                    >
                      Ripristina Modello Iniziale
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Aggiungi Nuova Variabile Personalizzata */}
      {showAddVariableModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[2.5rem] p-6 md:p-8 border border-slate-100 dark:border-slate-800 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <span className="p-2.5 bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 rounded-2xl text-lg">
                  ➕
                </span>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tight">
                    Nuova Variabile Contratto
                  </h3>
                  <p className="text-xs text-slate-400">
                    Definisci un nuovo campo riutilizzabile nei contratti
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAddVariableModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCustomVariable} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Nome / Sigla Variabile *
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-xs font-mono font-black text-slate-400">{`{{`}</span>
                  <input
                    type="text"
                    required
                    placeholder="ES: IBAN_PAGAMENTI, PENALE_RITARDO"
                    value={newVarKey}
                    onChange={(e) => setNewVarKey(e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, '_'))}
                    className="w-full pl-9 pr-8 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-slate-900 dark:text-white outline-none focus:border-blue-500"
                  />
                  <span className="absolute right-3 text-xs font-mono font-black text-slate-400">{`}}`}</span>
                </div>
                <p className="text-[10px] text-slate-400">
                  Usa solo lettere maiuscole e trattini bassi (es. <code>IBAN</code>, <code>PENALE_RITARDO</code>).
                </p>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Etichetta / Descrizione *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Es: Codice IBAN per Bonifici SAL"
                  value={newVarLabel}
                  onChange={(e) => setNewVarLabel(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Valore Predefinito (Opzionale)
                </label>
                <input
                  type="text"
                  placeholder="Es: IT00X0000000000000000000000"
                  value={newVarDefault}
                  onChange={(e) => setNewVarDefault(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-blue-500"
                />
                <p className="text-[10px] text-slate-400">
                  Questo valore potrà essere modificato per ciascun cantiere in "Modifica Variabili".
                </p>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddVariableModal(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-black uppercase hover:bg-slate-200"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black uppercase shadow-md shadow-blue-600/30"
                >
                  Crea Variabile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ======================= MODULO 2: FILE & SCHEDA DNL ===================== */}
      {/* ========================================================================= */}
      {activeModule === 'dnl' && selectedCantiere && (
        <div className="space-y-6">
          {/* Barra Azioni & Download DNL */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col xl:flex-row xl:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="p-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl">
                  <Icons.FileText />
                </span>
                <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tight">
                  Fascicolo DNL: {selectedCantiere.nome}
                </h3>
              </div>
              <p className="text-xs text-slate-400 font-medium">
                Tutti i dati necessari per la Denuncia di Nuovo Lavoro presso Cassa Edile / Edilcassa (CNCE) e INAIL.
              </p>
            </div>

            {/* Pulsantiera di Esportazione & Download DNL */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleSaveDnl}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md shadow-emerald-600/20 flex items-center gap-1.5"
              >
                <Icons.Check /> Salva Dati DNL
              </button>

              <button
                onClick={handleCopyDnlForConsultant}
                className="px-3.5 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5"
                title="Copia messaggio pronto per WhatsApp o Email da inviare al consulente del lavoro"
              >
                <Icons.Copy /> Copia per Consulente
              </button>

              <button
                onClick={() => downloadDnlTxtFile(selectedCantiere, settings, dnlFormData)}
                className="px-3.5 py-2.5 bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5"
                title="Scarica file testo .txt con tutti i dati per l'apertura telematica"
              >
                <Icons.Download /> File DNL (.txt)
              </button>

              <button
                onClick={() => downloadDnlJsonFile(selectedCantiere, settings, dnlFormData)}
                className="px-3.5 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5"
                title="Scarica dati strutturati in JSON"
              >
                Dati (.json)
              </button>

              <button
                onClick={() => exportDnlToExcel(selectedCantiere, settings, dnlFormData)}
                className="px-3.5 py-2.5 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5"
                title="Scarica foglio Excel completo"
              >
                <Icons.Excel /> Excel (.xlsx)
              </button>

              <button
                onClick={() => exportDnlToPdf(selectedCantiere, settings, dnlFormData)}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md shadow-blue-600/30 flex items-center gap-1.5"
                title="Scarica scheda ufficiale DNL in PDF"
              >
                <Icons.Pdf /> Scheda PDF DNL
              </button>

              <button
                onClick={() => printDnlSheet(selectedCantiere, settings, dnlFormData)}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md flex items-center gap-1.5"
                title="Stampa immediata scheda DNL su carta o PDF di sistema"
              >
                <Icons.Printer /> Stampa Scheda DNL
              </button>
            </div>
          </div>

          {/* Form Compilazione DNL suddiviso in Riquadri Normativi */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* RIQUADRO 1: Dati Impresa Esecutrice */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="text-base">🏢</span>
                  <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                    Riquadro 1: Dati Impresa Esecutrice
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={handleSaveCompanyDnlDefaults}
                  className="text-[10px] font-black text-blue-600 hover:underline uppercase tracking-wider"
                >
                  Salva come Default Azienda
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ragione Sociale</label>
                  <input
                    type="text"
                    value={settings.nomeAzienda}
                    disabled
                    className="w-full p-3 bg-slate-100 dark:bg-slate-800/80 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Codice Cassa Edile</label>
                  <input
                    type="text"
                    placeholder="Es. CE-12345"
                    value={dnlFormData.codiceCassaEdile ?? settings.codiceCassaEdile ?? ''}
                    onChange={(e) => setDnlFormData({ ...dnlFormData, codiceCassaEdile: e.target.value })}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">PAT INAIL (Posizione Assicurativa)</label>
                  <input
                    type="text"
                    placeholder="Es. 98765432/01"
                    value={dnlFormData.patInail ?? settings.patInail ?? ''}
                    onChange={(e) => setDnlFormData({ ...dnlFormData, patInail: e.target.value })}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Matricola INPS</label>
                  <input
                    type="text"
                    placeholder="Es. 1234567890"
                    value={dnlFormData.matricolaInps ?? settings.matricolaInps ?? ''}
                    onChange={(e) => setDnlFormData({ ...dnlFormData, matricolaInps: e.target.value })}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">CCNL Applicato</label>
                  <input
                    type="text"
                    placeholder="Edilizia Industria / Artigianato"
                    value={dnlFormData.ccnl ?? settings.ccnlApplicato ?? 'Edilizia Industria / Artigianato'}
                    onChange={(e) => setDnlFormData({ ...dnlFormData, ccnl: e.target.value })}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">P.IVA / Codice Fiscale Impresa</label>
                  <input
                    type="text"
                    placeholder="Partita IVA o CF"
                    value={settings.partitaIva || settings.codiceFiscaleAzienda || ''}
                    onChange={(e) => onUpdateSettings({ ...settings, partitaIva: e.target.value })}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* RIQUADRO 2: Cantiere & Pratica Edilizia */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                <span className="text-base">🏗️</span>
                <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                  Riquadro 2: Dati Cantiere & Titolo Abilitativo
                </h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ubicazione Cantiere (Indirizzo Completo)</label>
                  <input
                    type="text"
                    value={selectedCantiere.indirizzo || ''}
                    onChange={(e) => onUpdateCantiere({ ...selectedCantiere, indirizzo: e.target.value })}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Natura Giuridica Appalto</label>
                  <select
                    value={dnlFormData.naturaAppalto || 'privato'}
                    onChange={(e) => setDnlFormData({ ...dnlFormData, naturaAppalto: e.target.value as any })}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-blue-500 cursor-pointer"
                  >
                    <option value="privato">Privato</option>
                    <option value="pubblico">Pubblico</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tipologia Lavori</label>
                  <input
                    type="text"
                    placeholder="Es. Ristrutturazione / Manutenzione Straordinaria"
                    value={dnlFormData.tipoLavoro || 'Ristrutturazione Edilizia'}
                    onChange={(e) => setDnlFormData({ ...dnlFormData, tipoLavoro: e.target.value })}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Titolo Abilitativo (Tipo)</label>
                  <input
                    type="text"
                    placeholder="Es. CILA / SCIA / Permesso Costruire"
                    value={dnlFormData.titoloAbilitativoTipo || 'CILA'}
                    onChange={(e) => setDnlFormData({ ...dnlFormData, titoloAbilitativoTipo: e.target.value })}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Numero Pratica & Comune</label>
                  <input
                    type="text"
                    placeholder="Es. Prot. 4582 / Comune di..."
                    value={dnlFormData.titoloAbilitativoNumero || ''}
                    onChange={(e) => setDnlFormData({ ...dnlFormData, titoloAbilitativoNumero: e.target.value })}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Notifica Preliminare ASL (Prot./Data)</label>
                  <input
                    type="text"
                    placeholder="Es. Prot. ASL-2025/123 del 10/01/2025"
                    value={dnlFormData.protocolloNotificaPreliminare || ''}
                    onChange={(e) => setDnlFormData({ ...dnlFormData, protocolloNotificaPreliminare: e.target.value })}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Codici Gara (CIG / CUP se pubblico)</label>
                  <input
                    type="text"
                    placeholder="Es. CIG: Z123456789"
                    value={dnlFormData.cig || ''}
                    onChange={(e) => setDnlFormData({ ...dnlFormData, cig: e.target.value })}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* RIQUADRO 3: Committente, Progettista & Figure Tecniche */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="text-base">👤</span>
                  <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                    Riquadro 3: Committente, Progettista & Sicurezza
                  </h4>
                </div>
                <span className="text-[10px] bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 font-bold px-2 py-0.5 rounded-full">
                  Dati Obbligatori DNL
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Committente</label>
                  <input
                    type="text"
                    value={selectedCantiere.cliente}
                    onChange={(e) => onUpdateCantiere({ ...selectedCantiere, cliente: e.target.value })}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Codice Fiscale / P.IVA Committente</label>
                  <input
                    type="text"
                    placeholder="Codice fiscale o P.IVA"
                    value={dnlFormData.committenteCodiceFiscale || ''}
                    onChange={(e) => setDnlFormData({ ...dnlFormData, committenteCodiceFiscale: e.target.value })}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Scadenza Invio DNL</label>
                  <input
                    type="date"
                    value={selectedCantiere.scadenzaDNL || ''}
                    onChange={(e) => onUpdateCantiere({ ...selectedCantiere, scadenzaDNL: e.target.value })}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Coordinatore Sicurezza (CSE)</label>
                  <input
                    type="text"
                    placeholder="Nome Coordinatore Sicurezza"
                    value={dnlFormData.coordinatoreSicurezza || selectedCantiere.tecnici.find(t => /sicurezza|cse/i.test(t.ruolo))?.nome || ''}
                    onChange={(e) => setDnlFormData({ ...dnlFormData, coordinatoreSicurezza: e.target.value })}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Capocantiere / Preposto</label>
                  <input
                    type="text"
                    placeholder="Es. Mario Rossi (Capocantiere)"
                    value={dnlFormData.capocantiere || selectedCantiere.tecnici.find(t => /capocantiere|preposto/i.test(t.ruolo))?.nome || ''}
                    onChange={(e) => setDnlFormData({ ...dnlFormData, capocantiere: e.target.value })}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Responsabile dei Lavori</label>
                  <input
                    type="text"
                    placeholder="Nome Responsabile Lavori"
                    value={dnlFormData.responsabileLavori || ''}
                    onChange={(e) => setDnlFormData({ ...dnlFormData, responsabileLavori: e.target.value })}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* SEZIONE PROGETTISTA DELL'OPERA (TELEFONO, MAIL, PEC) */}
              <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3 bg-blue-50/40 dark:bg-blue-950/20 p-4 rounded-2xl border border-blue-100 dark:border-blue-900/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-base">📐</span>
                    <div>
                      <h5 className="text-xs font-black text-blue-950 dark:text-blue-200 uppercase tracking-wider">
                        Dati del Progettista (Importante DNL)
                      </h5>
                      <p className="text-[10px] text-blue-600/80 dark:text-blue-400">
                        Inserisci i recapiti ufficiali: Mail, Telefono e PEC per la trasmissione Cassa Edile.
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] bg-blue-600 text-white font-bold px-2 py-0.5 rounded-full">
                    DNL Cassa Edile
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                      Nome Progettista / Studio
                    </label>
                    <input
                      type="text"
                      placeholder="Arch. / Ing. Nome Cognome"
                      value={dnlFormData.progettistaNome || ''}
                      onChange={(e) => setDnlFormData({ ...dnlFormData, progettistaNome: e.target.value })}
                      className="w-full p-2.5 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-blue-500 transition-all"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                      Numero di Telefono
                    </label>
                    <input
                      type="tel"
                      placeholder="Es. +39 333 1234567"
                      value={dnlFormData.progettistaTelefono || ''}
                      onChange={(e) => setDnlFormData({ ...dnlFormData, progettistaTelefono: e.target.value })}
                      className="w-full p-2.5 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-blue-500 transition-all"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                      Email Progettista
                    </label>
                    <input
                      type="email"
                      placeholder="progettista@studio.it"
                      value={dnlFormData.progettistaEmail || ''}
                      onChange={(e) => setDnlFormData({ ...dnlFormData, progettistaEmail: e.target.value })}
                      className="w-full p-2.5 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-blue-500 transition-all"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                      PEC Progettista
                    </label>
                    <input
                      type="email"
                      placeholder="progettista@pec.it"
                      value={dnlFormData.progettistaPec || ''}
                      onChange={(e) => setDnlFormData({ ...dnlFormData, progettistaPec: e.target.value })}
                      className="w-full p-2.5 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-blue-500 transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* RIQUADRO 4: Valori Economici */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                <span className="text-base">💶</span>
                <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                  Riquadro 4: Valori Economici
                </h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Importo Complessivo Opera (€)</label>
                  <input
                    type="number"
                    value={selectedCantiere.importoTotale || 0}
                    onChange={(e) => onUpdateCantiere({ ...selectedCantiere, importoTotale: parseFloat(e.target.value) || 0 })}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Opere Edili (Cassa Edile) (€)</label>
                  <input
                    type="number"
                    value={dnlFormData.importoEdile !== undefined ? dnlFormData.importoEdile : selectedCantiere.importoTotale}
                    onChange={(e) => setDnlFormData({ ...dnlFormData, importoEdile: parseFloat(e.target.value) || 0 })}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Subappalti Totale (€)</label>
                  <div className="w-full p-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                    <span>€ {((selectedCantiere.subappalti || []).reduce((acc, s) => acc + (s.prezzoOriginale || 0), 0)).toLocaleString('it-IT', { minimumFractionDigits: 2 })}</span>
                    <span className="text-[10px] text-slate-400 font-normal">{(selectedCantiere.subappalti || []).length} ditte</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RIQUADRO 5: Subappalti (Partita IVA, Email, PEC) & Note */}
          <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="text-base">🤝</span>
                <div>
                  <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                    Riquadro 5: Subappalti (P.IVA, Email, PEC) & Note Speciali
                  </h4>
                  <p className="text-[10px] text-slate-400">
                    Dati fiscali e telematici obbligatori per le ditte subappaltatrici dichiarate alla Cassa Edile.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleAddSubappalto}
                className="px-4 py-2 bg-slate-900 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 self-start sm:self-auto shadow-sm"
              >
                <span>+</span> Aggiungi Subappalto
              </button>
            </div>

            <div className="space-y-4">
              {selectedCantiere.subappalti && selectedCantiere.subappalti.length > 0 ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {selectedCantiere.subappalti.map((s, idx) => (
                      <div
                        key={s.id || idx}
                        className="p-4 bg-slate-50/80 dark:bg-slate-800/80 rounded-2xl border-2 border-slate-100 dark:border-slate-700 space-y-3 hover:border-blue-200 dark:hover:border-blue-800 transition-all"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center text-[10px] font-black">
                              {idx + 1}
                            </span>
                            <span className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-tight">
                              Ditta Subappaltatrice
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDeleteSubappalto(s.id)}
                            className="text-[10px] font-bold text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 px-2 py-1 rounded-lg transition-all"
                            title="Rimuovi subappalto"
                          >
                            Elimina
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider">
                              Ragione Sociale Impresa
                            </label>
                            <input
                              type="text"
                              placeholder="Es. Impresa Edile Rossi Srl"
                              value={s.azienda}
                              onChange={(e) => handleUpdateSubappalto(s.id, { azienda: e.target.value })}
                              className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-blue-500"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider">
                              Tipologia Lavorazione
                            </label>
                            <input
                              type="text"
                              placeholder="Es. Impianti Elettrici / Cartongessi"
                              value={s.lavoro}
                              onChange={(e) => handleUpdateSubappalto(s.id, { lavoro: e.target.value })}
                              className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-900 dark:text-white outline-none focus:border-blue-500"
                            />
                          </div>
                        </div>

                        {/* PARTITA IVA, EMAIL E PEC SUBAPPALTI (RICHIESTI DAL COMMITTENTE) */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                          <div className="space-y-1">
                            <label className="text-[9px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1">
                              <span>🆔</span> Partita IVA / CF
                            </label>
                            <input
                              type="text"
                              placeholder="P.IVA o Codice Fiscale"
                              value={s.partitaIva || ''}
                              onChange={(e) => handleUpdateSubappalto(s.id, { partitaIva: e.target.value })}
                              className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono font-bold text-slate-900 dark:text-white outline-none focus:border-amber-500"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[9px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-wider flex items-center gap-1">
                              <span>✉️</span> Email Impresa
                            </label>
                            <input
                              type="email"
                              placeholder="subappalto@email.it"
                              value={s.email || ''}
                              onChange={(e) => handleUpdateSubappalto(s.id, { email: e.target.value })}
                              className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-900 dark:text-white outline-none focus:border-blue-500"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                              <span>🛡️</span> PEC Impresa
                            </label>
                            <input
                              type="email"
                              placeholder="subappalto@pec.it"
                              value={s.pec || ''}
                              onChange={(e) => handleUpdateSubappalto(s.id, { pec: e.target.value })}
                              className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-900 dark:text-white outline-none focus:border-emerald-500"
                            />
                          </div>
                        </div>

                        <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black text-slate-400 uppercase">Importo (€):</span>
                            <input
                              type="number"
                              step="0.01"
                              value={s.prezzoOriginale || 0}
                              onChange={(e) => handleUpdateSubappalto(s.id, { prezzoOriginale: parseFloat(e.target.value) || 0 })}
                              className="w-28 p-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-blue-500"
                            />
                          </div>
                          <span className="text-xs font-black text-blue-600 dark:text-blue-400">
                            € {(s.prezzoOriginale || 0).toLocaleString('it-IT', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-6 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 text-center space-y-2">
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Nessuna ditta in subappalto registrata per questo cantiere.
                  </p>
                  <button
                    type="button"
                    onClick={handleAddSubappalto}
                    className="px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 rounded-xl text-xs font-black uppercase hover:bg-blue-100 transition-all inline-flex items-center gap-1"
                  >
                    <span>+</span> Aggiungi Subappaltatore adesso
                  </button>
                </div>
              )}

              <div className="space-y-1 pt-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Note e Istruzioni DNL</label>
                <textarea
                  rows={3}
                  placeholder="Eventuali note integrative o chiarimenti da allegare alla DNL..."
                  value={dnlFormData.noteDNL || ''}
                  onChange={(e) => setDnlFormData({ ...dnlFormData, noteDNL: e.target.value })}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODALI GESTIONE MODELLI E SUBAPPALTI ================= */}

      {/* MODAL 1: Nuovo Modello di Contratto */}
      {showNewModelModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[2.5rem] p-6 md:p-8 border border-slate-100 dark:border-slate-800 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <span className="p-2.5 bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 rounded-2xl text-lg">
                  ➕
                </span>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tight">
                    Crea Nuovo Modello di Contratto
                  </h3>
                  <p className="text-xs text-slate-400">
                    Aggiungi un nuovo modello personalizzato salvato nel tuo gestionale
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowNewModelModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateNewModel} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Titolo Modello *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Es. Contratto Subappalto Finiture Interne"
                  value={newModelTitle}
                  onChange={(e) => setNewModelTitle(e.target.value)}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Categoria *
                  </label>
                  <select
                    value={newModelCategory}
                    onChange={(e) => setNewModelCategory(e.target.value as any)}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-blue-500"
                  >
                    <option value="subappalto">Subappalto</option>
                    <option value="appalto">Appalto Principale</option>
                    <option value="incarico">Lettera Incarico</option>
                    <option value="personalizzato">Personalizzato</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Copia base da:
                  </label>
                  <select
                    value={newModelBaseSource}
                    onChange={(e) => setNewModelBaseSource(e.target.value)}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-blue-500"
                  >
                    <option value="blank">Documento vuoto</option>
                    {contractModels.map(m => (
                      <option key={m.id} value={m.id}>
                        Clona da: {m.titolo} ({m.categoria})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Descrizione (Opzionale)
                </label>
                <textarea
                  rows={2}
                  placeholder="Es. Modello con clausole specifiche per cartongessisti e pittori..."
                  value={newModelDesc}
                  onChange={(e) => setNewModelDesc(e.target.value)}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white outline-none focus:border-blue-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewModelModal(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md shadow-blue-600/30"
                >
                  Crea e Inizia a Modificare
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Salva con Nome / Duplica Modello */}
      {showSaveAsModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[2.5rem] p-6 md:p-8 border border-slate-100 dark:border-slate-800 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <span className="p-2.5 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 rounded-2xl text-lg">
                  📑
                </span>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tight">
                    Duplica / Salva con Nome
                  </h3>
                  <p className="text-xs text-slate-400">
                    Salva il testo contrattuale corrente come un nuovo modello
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSaveAsModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveAsNewModel} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Titolo per il Nuovo Modello *
                </label>
                <input
                  type="text"
                  required
                  value={saveAsTitle}
                  onChange={(e) => setSaveAsTitle(e.target.value)}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Categoria
                </label>
                <select
                  value={saveAsCategory}
                  onChange={(e) => setSaveAsCategory(e.target.value as any)}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-blue-500"
                >
                  <option value="subappalto">Subappalto</option>
                  <option value="appalto">Appalto Principale</option>
                  <option value="incarico">Lettera Incarico</option>
                  <option value="personalizzato">Personalizzato</option>
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowSaveAsModal(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md shadow-emerald-600/30"
                >
                  Salva Modello Duplicato
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Modifica Dettagli Modello (Rinomina/Categoria) */}
      {showEditModelModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[2.5rem] p-6 md:p-8 border border-slate-100 dark:border-slate-800 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <span className="p-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-2xl text-lg">
                  ✏️
                </span>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tight">
                    Modifica Dettagli Modello
                  </h3>
                  <p className="text-xs text-slate-400">
                    Aggiorna denominazione, categoria o descrizione del modello
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowEditModelModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateModelDetails} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Titolo Modello *
                </label>
                <input
                  type="text"
                  required
                  value={editModelTitle}
                  onChange={(e) => setEditModelTitle(e.target.value)}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Categoria
                </label>
                <select
                  value={editModelCategory}
                  onChange={(e) => setEditModelCategory(e.target.value as any)}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-blue-500"
                >
                  <option value="subappalto">Subappalto</option>
                  <option value="appalto">Appalto Principale</option>
                  <option value="incarico">Lettera Incarico</option>
                  <option value="personalizzato">Personalizzato</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Descrizione
                </label>
                <textarea
                  rows={2}
                  value={editModelDesc}
                  onChange={(e) => setEditModelDesc(e.target.value)}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white outline-none focus:border-blue-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowEditModelModal(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md shadow-blue-600/30"
                >
                  Salva Modifiche
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: Conferma Eliminazione Modello */}
      {showDeleteConfirmModal && modelToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[2.5rem] p-6 md:p-8 border border-slate-100 dark:border-slate-800 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150 text-center">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto text-2xl">
              🗑️
            </div>
            <div className="space-y-1.5">
              <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tight">
                Eliminare questo Modello?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Sei sicuro di voler eliminare il modello <strong className="text-slate-800 dark:text-white">"{modelToDelete.titolo}"</strong>?
              </p>
              <p className="text-[11px] text-slate-400">
                L'operazione rimuoverà il modello dalla tua lista contratti. Potrai comunque ripristinare i modelli di fabbrica tramite l'apposito tasto 🔄.
              </p>
            </div>

            <div className="pt-2 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteConfirmModal(false);
                  setModelToDelete(null);
                }}
                className="px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Annulla
              </button>
              <button
                type="button"
                onClick={() => handleDeleteModel(modelToDelete.id)}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md shadow-rose-600/30"
              >
                Elimina Definitivamente
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: Aggiungi Subappalto al Cantiere */}
      {showAddSubappaltoModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-[2.5rem] p-6 md:p-8 border border-slate-100 dark:border-slate-800 shadow-2xl space-y-5 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <span className="p-2.5 bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 rounded-2xl text-lg">
                  🏗️
                </span>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tight">
                    Nuovo Subappalto per il Cantiere
                  </h3>
                  <p className="text-xs text-slate-400">
                    Definisci la ditta subappaltatrice e autocompila il contratto
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddSubappaltoModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveNewSubappalto} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Ragione Sociale Impresa *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Es. EdilTermica S.r.l."
                    value={newSubForm.azienda || ''}
                    onChange={(e) => setNewSubForm(prev => ({ ...prev, azienda: e.target.value }))}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Tipologia Lavori / Opere *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Es. Realizzazione Impianti Termoidraulici"
                    value={newSubForm.lavoro || ''}
                    onChange={(e) => setNewSubForm(prev => ({ ...prev, lavoro: e.target.value }))}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-black text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                    Importo Netto (€) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="Es. 15000"
                    value={newSubForm.prezzoOriginale ?? ''}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 0;
                      setNewSubForm(prev => ({
                        ...prev,
                        prezzoOriginale: val,
                        oneriSicurezza: prev.oneriSicurezza || Math.round(val * 0.03),
                      }));
                    }}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-xl text-xs font-black text-blue-600 dark:text-blue-400 outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Maggiorazione (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="Es. 10"
                    value={newSubForm.maggiorazione ?? ''}
                    onChange={(e) => setNewSubForm(prev => ({ ...prev, maggiorazione: parseFloat(e.target.value) || 0 }))}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-black text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                    Oneri Sicurezza (€)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Es. 450"
                    value={newSubForm.oneriSicurezza ?? ''}
                    onChange={(e) => setNewSubForm(prev => ({ ...prev, oneriSicurezza: parseFloat(e.target.value) || 0 }))}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Partita IVA / Codice Fiscale
                  </label>
                  <input
                    type="text"
                    placeholder="01234567890"
                    value={newSubForm.partitaIva || ''}
                    onChange={(e) => setNewSubForm(prev => ({ ...prev, partitaIva: e.target.value }))}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-slate-900 dark:text-white outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                    PEC Impresa
                  </label>
                  <input
                    type="email"
                    placeholder="subappalto@pec.it"
                    value={newSubForm.pec || ''}
                    onChange={(e) => setNewSubForm(prev => ({ ...prev, pec: e.target.value }))}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-black text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                    Email Impresa
                  </label>
                  <input
                    type="email"
                    placeholder="info@subappalto.it"
                    value={newSubForm.email || ''}
                    onChange={(e) => setNewSubForm(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Sede Legale (Opzionale)
                  </label>
                  <input
                    type="text"
                    placeholder="Es. Via Roma 10, Milano"
                    value={newSubForm.sedeLegale || ''}
                    onChange={(e) => setNewSubForm(prev => ({ ...prev, sedeLegale: e.target.value }))}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Legale Rappresentante
                  </label>
                  <input
                    type="text"
                    placeholder="Es. Mario Rossi"
                    value={newSubForm.rappresentanteLegale || ''}
                    onChange={(e) => setNewSubForm(prev => ({ ...prev, rappresentanteLegale: e.target.value }))}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Telefono
                  </label>
                  <input
                    type="text"
                    placeholder="Es. 333 1234567"
                    value={newSubForm.telefono || ''}
                    onChange={(e) => setNewSubForm(prev => ({ ...prev, telefono: e.target.value }))}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddSubappaltoModal(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md shadow-amber-600/30"
                >
                  Salva e Autocompila Contratto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 6: Modifica Dati Subappalto */}
      {showEditSubappaltoModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-[2.5rem] p-6 md:p-8 border border-slate-100 dark:border-slate-800 shadow-2xl space-y-5 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <span className="p-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-2xl text-lg">
                  ✏️
                </span>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tight">
                    Modifica Subappalto: {editSubForm.azienda}
                  </h3>
                  <p className="text-xs text-slate-400">
                    I dati aggiornati si rifletteranno subito sul contratto compilato
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowEditSubappaltoModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEditedSubappalto} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Ragione Sociale Impresa *
                  </label>
                  <input
                    type="text"
                    required
                    value={editSubForm.azienda || ''}
                    onChange={(e) => setEditSubForm(prev => ({ ...prev, azienda: e.target.value }))}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Tipologia Lavori / Opere *
                  </label>
                  <input
                    type="text"
                    required
                    value={editSubForm.lavoro || ''}
                    onChange={(e) => setEditSubForm(prev => ({ ...prev, lavoro: e.target.value }))}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-black text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                    Importo Netto (€) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={editSubForm.prezzoOriginale ?? ''}
                    onChange={(e) => setEditSubForm(prev => ({ ...prev, prezzoOriginale: parseFloat(e.target.value) || 0 }))}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-xl text-xs font-black text-blue-600 dark:text-blue-400 outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Maggiorazione (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={editSubForm.maggiorazione ?? ''}
                    onChange={(e) => setEditSubForm(prev => ({ ...prev, maggiorazione: parseFloat(e.target.value) || 0 }))}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-black text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                    Oneri Sicurezza (€)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={editSubForm.oneriSicurezza ?? ''}
                    onChange={(e) => setEditSubForm(prev => ({ ...prev, oneriSicurezza: parseFloat(e.target.value) || 0 }))}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Partita IVA / Codice Fiscale
                  </label>
                  <input
                    type="text"
                    value={editSubForm.partitaIva || ''}
                    onChange={(e) => setEditSubForm(prev => ({ ...prev, partitaIva: e.target.value }))}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-slate-900 dark:text-white outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                    PEC Impresa
                  </label>
                  <input
                    type="email"
                    value={editSubForm.pec || ''}
                    onChange={(e) => setEditSubForm(prev => ({ ...prev, pec: e.target.value }))}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-black text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                    Email Impresa
                  </label>
                  <input
                    type="email"
                    value={editSubForm.email || ''}
                    onChange={(e) => setEditSubForm(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Sede Legale
                  </label>
                  <input
                    type="text"
                    value={editSubForm.sedeLegale || ''}
                    onChange={(e) => setEditSubForm(prev => ({ ...prev, sedeLegale: e.target.value }))}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Legale Rappresentante
                  </label>
                  <input
                    type="text"
                    value={editSubForm.rappresentanteLegale || ''}
                    onChange={(e) => setEditSubForm(prev => ({ ...prev, rappresentanteLegale: e.target.value }))}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Telefono
                  </label>
                  <input
                    type="text"
                    value={editSubForm.telefono || ''}
                    onChange={(e) => setEditSubForm(prev => ({ ...prev, telefono: e.target.value }))}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowEditSubappaltoModal(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md shadow-blue-600/30"
                >
                  Salva Modifiche
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContrattiDnlSection;
