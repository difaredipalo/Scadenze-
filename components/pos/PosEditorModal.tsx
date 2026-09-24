import React, { useState } from 'react';
import {
  PosDocument,
  PosAttivitaItem,
  PosLavoratoreAssegnato,
  PosAttrezzaturaItem,
  PosSostanzaItem,
  PosOperaProvvisionaleItem,
  Personale,
  PosAttivitaTemplate,
  PosStato,
  Cantiere,
  AppSettings,
  PosDatiImpresa,
  PosOrganizzazioneCantiere,
} from '../../types';
import {
  POS_DPI_LIST,
  DEFAULT_POS_TEMPLATES,
  DEFAULT_ATTREZZATURE_CATALOGO,
  DEFAULT_SOSTANZE_CATALOGO,
  DEFAULT_OPERE_PROVVISIONALI_LIST,
  DEFAULT_CONTESTO_AMBIENTALE,
  DEFAULT_ORGANIZZAZIONE_CANTIERE,
  CALCOLA_RISCHIO,
} from '../../data/posDefaultData';
import { auditPosDocument } from './posAuditHelper';
import { PosSmartLinkingEditor } from './PosSmartLinkingEditor';
import { PosRiskMatrixView } from './PosRiskMatrixView';
import {
  PosCapitolo7View,
  PosCapitolo8View,
  PosCapitolo10View,
  PosCapitolo11View,
  PosCapitolo12View,
} from './PosChapterExtraViews';

interface PosEditorModalProps {
  pos: PosDocument;
  cantieri?: Cantiere[];
  personaleList: Personale[];
  settings?: AppSettings;
  customTemplates?: PosAttivitaTemplate[];
  onSave: (updatedPos: PosDocument) => void;
  onClose: () => void;
  onOpenPrint: (pos: PosDocument) => void;
  onSaveAziendaDefaults?: (dati: PosDatiImpresa) => void;
  onUpdatePosLive?: (updatedPos: PosDocument) => void;
}

export const PosEditorModal: React.FC<PosEditorModalProps> = ({
  pos,
  cantieri = [],
  personaleList,
  settings,
  customTemplates = [],
  onSave,
  onClose,
  onOpenPrint,
  onSaveAziendaDefaults,
  onUpdatePosLive,
}) => {
  // Inizializza formData garantendo i nuovi campi del POS a 14 capitoli
  const [formData, setFormData] = useState<PosDocument>(() => {
    const initialVersione = pos.versione || (pos as any).revisione || '00';
    const orgSource = pos.organizzazioneCantiere || pos.organizzazione || {};
    const safeOrg: PosOrganizzazioneCantiere = {
      ...DEFAULT_ORGANIZZAZIONE_CANTIERE,
      ...orgSource,
      serviziIgienici: pos.organizzazioneCantiere?.serviziIgienici || pos.organizzazione?.serviziIgienici || pos.organizzazione?.serviziIgieniciAssistenziali || DEFAULT_ORGANIZZAZIONE_CANTIERE.serviziIgienici,
      viabilita: pos.organizzazioneCantiere?.viabilita || pos.organizzazione?.viabilita || pos.organizzazione?.viabilitaSicurezza || DEFAULT_ORGANIZZAZIONE_CANTIERE.viabilita,
      recinzioneAccessi: pos.organizzazioneCantiere?.recinzioneAccessi || pos.organizzazione?.recinzioneAccessi || DEFAULT_ORGANIZZAZIONE_CANTIERE.recinzioneAccessi,
      impiantoElettrico: pos.organizzazioneCantiere?.impiantoElettrico || pos.organizzazione?.impiantoElettrico || pos.organizzazione?.impiantoElettricoCantiere || DEFAULT_ORGANIZZAZIONE_CANTIERE.impiantoElettrico,
      stoccaggioRifiuti: pos.organizzazioneCantiere?.stoccaggioRifiuti || pos.organizzazione?.stoccaggioRifiuti || pos.organizzazione?.gestioneRifiutiTerre || DEFAULT_ORGANIZZAZIONE_CANTIERE.stoccaggioRifiuti,
    };

    return {
      ...pos,
      versione: initialVersione,
      revisione: initialVersione,
      contestoAmbientale: pos.contestoAmbientale || { ...DEFAULT_CONTESTO_AMBIENTALE },
      organizzazioneCantiere: safeOrg,
      organizzazione: safeOrg,
      opereProvvisionali: pos.opereProvvisionali?.length ? pos.opereProvvisionali : [...DEFAULT_OPERE_PROVVISIONALI_LIST],
      datiCantiere: {
        ...pos.datiCantiere,
        orariLavoro: pos.datiCantiere?.orariLavoro || '08:00 - 12:00 / 13:00 - 17:00 (Lunedì - Venerdì)',
        attivitaSvolteImpresa: pos.datiCantiere?.attivitaSvolteImpresa || pos.datiCantiere?.descrizioneLavori || '',
      },
    };
  });

  const [activeTab, setActiveTab] = useState<string>('copertina');
  const [companyDefaultsSavedNotice, setCompanyDefaultsSavedNotice] = useState<string | null>(null);

  const audit = auditPosDocument(formData);

  // Navigazione a 14 capitoli conformi
  const tabs = [
    { key: 'copertina', label: 'Copertina & Dati', icon: '📋' },
    { key: 'cap1', label: 'Cap. 1: Dati Identificativi', icon: '🏢' },
    { key: 'cap2', label: 'Cap. 2: Descrizione Opera', icon: '🏗️' },
    { key: 'cap3', label: 'Cap. 3: Personale & Mansioni', icon: '👷' },
    { key: 'cap4', label: 'Cap. 4: Quadro Normativo', icon: '⚖️' },
    { key: 'cap5', label: 'Cap. 5: Logistica & Impianti', icon: '📐' },
    { key: 'cap6', label: 'Cap. 6: Metodologia Rischi (4×4)', icon: '📊' },
    { key: 'cap7', label: 'Cap. 7: Contesto Ambientale', icon: '🌍' },
    { key: 'cap8', label: 'Cap. 8: Turni & Presenze', icon: '⏱️' },
    { key: 'cap9', label: 'Cap. 9: Lavorazioni (Smart Linking)', icon: '🔨' },
    { key: 'cap10', label: 'Cap. 10: Schede Attrezzature', icon: '🚜' },
    { key: 'cap11', label: 'Cap. 11: Opere Provvisionali', icon: '🪜' },
    { key: 'cap12', label: 'Cap. 12: Sostanze Chimiche (SDS)', icon: '🧪' },
    { key: 'cap13', label: 'Cap. 13: Gestione Emergenze', icon: '🚨' },
    { key: 'cap14', label: 'Cap. 14: Allegati & Firme', icon: '📎' },
    { key: 'controllo', label: 'Audit di Conformità', icon: '✅' },
  ];

  const renderBadgeMissing = (val?: string | number) => {
    if (!val || (typeof val === 'string' && !val.trim())) {
      return (
        <span className="ml-1.5 px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
          DA COMPLETARE
        </span>
      );
    }
    return null;
  };

  const handleSave = () => {
    const safeVersione = formData.versione || (formData as any).revisione || '00';
    const updated: PosDocument = {
      ...formData,
      versione: safeVersione,
      revisione: safeVersione,
      updatedAt: new Date().toISOString(),
    };
    if (onSaveAziendaDefaults) {
      onSaveAziendaDefaults(formData.datiImpresa);
    }
    onSave(updated);
    return updated;
  };

  const handleSaveCompanyAsDefault = () => {
    if (onSaveAziendaDefaults) {
      onSaveAziendaDefaults(formData.datiImpresa);
    }
    setCompanyDefaultsSavedNotice('✓ Dati aziendali e figure di sicurezza salvati come predefiniti per tutti i futuri POS!');
    setTimeout(() => setCompanyDefaultsSavedNotice(null), 4000);
  };

  // Caricamento automatico dal cantiere selezionato
  const handleApplyCantiere = (cId: string) => {
    if (!cId) {
      setFormData(prev => ({ ...prev, cantiereId: '' }));
      return;
    }
    const c = cantieri.find(item => item.id === cId);
    if (!c) return;

    const cseTecnico = c.tecnici?.find(t => /cse|coordinatore|sicurezza/i.test(t.ruolo))?.nome || '';
    const cspTecnico = c.tecnici?.find(t => /csp/i.test(t.ruolo))?.nome || '';
    const dlTecnico = c.direttoreLavori || c.tecnici?.find(t => /direttore/i.test(t.ruolo))?.nome || '';

    let durata = formData.datiCantiere.durataGiorniPresunti || 120;
    if (c.dataInizio && c.scadenza) {
      const d1 = new Date(c.dataInizio).getTime();
      const d2 = new Date(c.scadenza).getTime();
      if (!isNaN(d1) && !isNaN(d2) && d2 > d1) {
        durata = Math.round((d2 - d1) / (1000 * 3600 * 24));
      }
    }
    const subNames = (c.subappalti || []).map(s => `${s.azienda} (${s.lavoro})`).join(', ');

    setFormData(prev => ({
      ...prev,
      cantiereId: c.id,
      titolo: prev.titolo.startsWith('Piano Operativo di Sicurezza -')
        ? `Piano Operativo di Sicurezza - ${c.nome}`
        : prev.titolo,
      datiCantiere: {
        ...prev.datiCantiere,
        cantiereId: c.id,
        nome: c.nome,
        indirizzo: c.indirizzo || prev.datiCantiere.indirizzo,
        comune: c.indirizzo?.split(',')?.[1]?.trim() || prev.datiCantiere.comune,
        committente: c.cliente || prev.datiCantiere.committente,
        committenteCfPiva: c.dnlData?.committenteCodiceFiscale || prev.datiCantiere.committenteCfPiva,
        responsabileLavori: c.dnlData?.responsabileLavori || c.cliente || prev.datiCantiere.responsabileLavori,
        direttoreLavori: dlTecnico || prev.datiCantiere.direttoreLavori,
        csp: cspTecnico || prev.datiCantiere.csp || 'Non nominato (opera con unica impresa)',
        cse: cseTecnico || c.dnlData?.coordinatoreSicurezza || prev.datiCantiere.cse || 'Da nominare a cura del Committente',
        dataInizio: c.dataInizio || prev.datiCantiere.dataInizio,
        dataFine: c.scadenza || prev.datiCantiere.dataFine,
        durataGiorniPresunti: durata,
        subappalti: subNames || prev.datiCantiere.subappalti,
        descrizioneLavori: c.descrizione || prev.datiCantiere.descrizioneLavori,
        attivitaSvolteImpresa: prev.datiCantiere.attivitaSvolteImpresa || c.descrizione || '',
      },
    }));
  };

  // Helper per assegnare tutti i dipendenti attivi dal gestionale
  const handleAssignAllActiveWorkers = () => {
    const activeWorkers = (personaleList || []).filter(p => p.inForza !== false);
    const targetWorkers = activeWorkers.length > 0 ? activeWorkers : (personaleList || []);
    const workersToAdd = targetWorkers.filter(p => !formData.lavoratori.some(l => l.personaleId === p.id));

    if (workersToAdd.length === 0) {
      alert('Tutto il personale in forza è già presente tra i lavoratori di questo POS!');
      return;
    }

    const newAssigned: PosLavoratoreAssegnato[] = workersToAdd.map(p => {
      const isCapo = /capo|preposto|responsabile/i.test(p.ruolo || '');
      return {
        id: Math.random().toString(),
        personaleId: p.id,
        nome: p.nome,
        cognome: p.cognome,
        codiceFiscale: p.codiceFiscale || '',
        mansione: p.ruolo || 'Operaio Edile',
        ruoloCantiere: isCapo ? 'Capocantiere / Preposto' : 'Lavoratore addetto alle lavorazioni',
        dataVisitaMedica: p.scadenzaVisitaMedica || '',
        idoneitaSanitaria: 'Idoneo alla mansione (visita medica regolare)',
        formazioni: (p.corsiFormazione || []).map(c => c.corso),
      };
    });

    setFormData(prev => ({
      ...prev,
      lavoratori: [...prev.lavoratori, ...newAssigned],
      datiCantiere: {
        ...prev.datiCantiere,
        numeroMassimoLavoratori: Math.max(prev.lavoratori.length + newAssigned.length, 1),
      },
    }));
  };

  // Sincronizzazione automatica degli elementi usati nelle lavorazioni verso i cataloghi globali del documento
  const handleSyncGlobalCatalog = (items: {
    attrezzature?: string[];
    sostanze?: string[];
    opere?: string[];
  }) => {
    setFormData(prev => {
      let updatedAtt = [...prev.attrezzature];
      let updatedSost = [...prev.sostanze];
      let updatedOpere = [...(prev.opereProvvisionali || [])];

      // Attrezzature
      (items.attrezzature || []).forEach(name => {
        if (!updatedAtt.some(a => a.nome.toLowerCase() === name.toLowerCase())) {
          const matchCatalog = DEFAULT_ATTREZZATURE_CATALOGO.find(c => c.nome.toLowerCase() === name.toLowerCase());
          updatedAtt.push(
            matchCatalog
              ? { ...matchCatalog, id: Math.random().toString() }
              : {
                  id: Math.random().toString(),
                  nome: name,
                  modelloMatricola: 'Marcatura CE conforme',
                  marcaturaCeConforme: true,
                  verifichePeriodicheRegolari: true,
                  operatoreAbilitato: 'Personale addestrato',
                  dpiObbligatori: ['Casco di protezione / Elmetto', 'Calzature di sicurezza S3'],
                  prescrizioniSicurezza: 'Verifica preliminare dei dispositivi di sicurezza prima dell’avviamento.',
                }
          );
        }
      });

      // Sostanze
      (items.sostanze || []).forEach(name => {
        if (!updatedSost.some(s => s.nomeCommerciale.toLowerCase() === name.toLowerCase())) {
          const matchSost = DEFAULT_SOSTANZE_CATALOGO.find(c => c.nomeCommerciale.toLowerCase() === name.toLowerCase());
          updatedSost.push(
            matchSost
              ? { ...matchSost, id: Math.random().toString() }
              : {
                  id: Math.random().toString(),
                  nomeCommerciale: name,
                  utilizzoFase: 'Fasi operative correlate',
                  schedaSicurezzaPresente: true,
                  frasiRischio: 'Consultare SDS di sicurezza allegata',
                  dpiObbligatori: ['Guanti per rischio chimico', 'Occhiali di protezione a mascherina'],
                }
          );
        }
      });

      // Opere provvisionali
      (items.opere || []).forEach(name => {
        if (!updatedOpere.some(o => o.tipo.toLowerCase() === name.toLowerCase())) {
          const matchOpera = DEFAULT_OPERE_PROVVISIONALI_LIST.find(c => c.tipo.toLowerCase() === name.toLowerCase());
          updatedOpere.push(
            matchOpera
              ? { ...matchOpera, id: Math.random().toString() }
              : {
                  id: Math.random().toString(),
                  tipo: name,
                  descrizione: 'Opera provvisionale a servizio del cantiere.',
                  conformitaNormativa: 'D.Lgs. 81/08 Titolo IV Capo II',
                  verifichePeriodiche: 'Verifica visiva giornaliera del Preposto.',
                  pimusRichiesto: name.toLowerCase().includes('ponteggio'),
                  prescrizioniSicurezza: 'Verifica degli ancoraggi e rispetto del carico massimo.',
                  rischi: [],
                  misurePrevenzione: [],
                  dpiNecessari: ['Casco di protezione / Elmetto', 'Calzature di sicurezza S3'],
                }
          );
        }
      });

      return {
        ...prev,
        attrezzature: updatedAtt,
        sostanze: updatedSost,
        opereProvvisionali: updatedOpere,
      };
    });
  };

  const handleOpenAnteprima = () => {
    const safeVersione = formData.versione || (formData as any).revisione || '00';
    const updated: PosDocument = {
      ...formData,
      versione: safeVersione,
      revisione: safeVersione,
      updatedAt: new Date().toISOString(),
    };
    if (onUpdatePosLive) {
      onUpdatePosLive(updated);
    }
    onOpenPrint(updated);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 w-full max-w-7xl h-[95vh] rounded-2xl shadow-2xl flex flex-col border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Header Bar */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-600 text-white font-black text-xs shadow-md shadow-blue-600/20">
              POS 81/08
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tight">
                  {formData.titolo}
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-300">
                  Rev. {formData.versione || (formData as any).revisione || '00'} ({formData.dataRedazione})
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Struttura Ufficiale a 14 Capitoli conforme all'Allegato XV del D.Lgs. 81/2008
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleOpenAnteprima}
              className="px-4 py-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-600 dark:text-blue-400 font-black text-xs uppercase tracking-wider transition-colors flex items-center gap-1.5 border border-blue-200 dark:border-blue-800"
              title="Apri e Stampa POS A4 con tutte le immagini e modifiche"
            >
              <span>🖨️</span> <span>Stampa / Anteprima A4</span>
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-wider shadow-md shadow-blue-600/20 transition-all flex items-center gap-1.5"
            >
              <span>💾</span> <span>Salva POS</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              title="Chiudi"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Tab Navigation (14 Capitoli + Copertina + Audit) */}
        <div className="flex items-center gap-1 px-4 py-2 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/70 overflow-x-auto shrink-0 scrollbar-none">
          {tabs.map(tab => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Contenuto Tab Principale */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50/30 dark:bg-slate-950/20">
          {/* TAB COPERTINA */}
          {activeTab === 'copertina' && (
            <div className="max-w-4xl mx-auto space-y-5">
              <div className="p-4 rounded-2xl bg-blue-50/50 dark:bg-slate-800 border border-blue-200 dark:border-slate-700 flex items-center justify-between">
                <div>
                  <h3 className="font-black text-sm uppercase text-slate-900 dark:text-white">
                    Frontespizio e Dati Generali del Documento
                  </h3>
                  <p className="text-xs text-slate-500">
                    Definizione del titolo ufficiale, numero di revisione, date e collegamento al cantiere del gestionale.
                  </p>
                </div>
                {cantieri.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-500">Collega Cantiere:</span>
                    <select
                      value={formData.cantiereId || ''}
                      onChange={e => handleApplyCantiere(e.target.value)}
                      className="p-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs font-bold"
                    >
                      <option value="">-- Seleziona Cantiere --</option>
                      {cantieri.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.nome} ({c.cliente || 'Privato'})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">
                    Titolo Ufficiale Documento {renderBadgeMissing(formData.titolo)}
                  </label>
                  <input
                    type="text"
                    value={formData.titolo}
                    onChange={e => setFormData(prev => ({ ...prev, titolo: e.target.value }))}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-black text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">
                    Numero di Revisione
                  </label>
                  <input
                    type="text"
                    value={formData.versione || formData.revisione || ''}
                    onChange={e => setFormData(prev => ({ ...prev, revisione: e.target.value, versione: e.target.value }))}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">
                    Data di Redazione / Emissione
                  </label>
                  <input
                    type="date"
                    value={formData.dataRedazione}
                    onChange={e => setFormData(prev => ({ ...prev, dataRedazione: e.target.value }))}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">
                    Stato del Documento
                  </label>
                  <select
                    value={formData.stato === 'emesso' ? 'emesso' : 'bozza'}
                    onChange={e => setFormData(prev => ({ ...prev, stato: e.target.value as PosStato }))}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-xs"
                  >
                    <option value="bozza">Bozza</option>
                    <option value="emesso">Emesso</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">
                    Data Trasmissione al CSE
                  </label>
                  <input
                    type="date"
                    value={formData.dataTrasmissioneCse || ''}
                    onChange={e => setFormData(prev => ({ ...prev, dataTrasmissioneCse: e.target.value }))}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                  />
                </div>
              </div>
            </div>
          )}

          {/* CAPITOLO 1: DATI IDENTIFICATIVI */}
          {activeTab === 'cap1' && (
            <div className="max-w-5xl mx-auto space-y-6">
              {/* 1.1 Dati Impresa Esecutrice */}
              <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 space-y-4">
                <div className="flex items-center justify-between border-b pb-2">
                  <h3 className="font-black text-xs uppercase text-slate-900 dark:text-white">
                    1.1 Dati Identificativi dell'Impresa Esecutrice
                  </h3>
                  <button
                    type="button"
                    onClick={handleSaveCompanyAsDefault}
                    className="px-3 py-1 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 rounded-lg text-[10px] font-black uppercase text-slate-700 dark:text-slate-300"
                  >
                    Salva come Predefinito Azienda
                  </button>
                </div>

                {companyDefaultsSavedNotice && (
                  <div className="p-2 bg-emerald-50 text-emerald-800 rounded-lg text-xs font-bold">
                    {companyDefaultsSavedNotice}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-[9px] font-black uppercase text-slate-400 mb-0.5">
                      Ragione Sociale {renderBadgeMissing(formData.datiImpresa.ragioneSociale)}
                    </label>
                    <input
                      type="text"
                      value={formData.datiImpresa.ragioneSociale}
                      onChange={e => setFormData(prev => ({ ...prev, datiImpresa: { ...prev.datiImpresa, ragioneSociale: e.target.value } }))}
                      className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] font-black uppercase text-slate-400 mb-0.5">
                      Partita IVA {renderBadgeMissing(formData.datiImpresa.partitaIva)}
                    </label>
                    <input
                      type="text"
                      value={formData.datiImpresa.partitaIva}
                      onChange={e => setFormData(prev => ({ ...prev, datiImpresa: { ...prev.datiImpresa, partitaIva: e.target.value } }))}
                      className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-xs"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[9px] font-black uppercase text-slate-400 mb-0.5">
                      Sede Legale {renderBadgeMissing(formData.datiImpresa.sedeLegale)}
                    </label>
                    <input
                      type="text"
                      value={formData.datiImpresa.sedeLegale}
                      onChange={e => setFormData(prev => ({ ...prev, datiImpresa: { ...prev.datiImpresa, sedeLegale: e.target.value } }))}
                      className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] font-black uppercase text-slate-400 mb-0.5">Codice Fiscale</label>
                    <input
                      type="text"
                      value={formData.datiImpresa.codiceFiscale}
                      onChange={e => setFormData(prev => ({ ...prev, datiImpresa: { ...prev.datiImpresa, codiceFiscale: e.target.value } }))}
                      className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] font-black uppercase text-slate-400 mb-0.5">Telefono / Cellulare</label>
                    <input
                      type="text"
                      value={formData.datiImpresa.telefono}
                      onChange={e => setFormData(prev => ({ ...prev, datiImpresa: { ...prev.datiImpresa, telefono: e.target.value } }))}
                      className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] font-black uppercase text-slate-400 mb-0.5">PEC Aziendale</label>
                    <input
                      type="text"
                      value={formData.datiImpresa.pec}
                      onChange={e => setFormData(prev => ({ ...prev, datiImpresa: { ...prev.datiImpresa, pec: e.target.value } }))}
                      className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] font-black uppercase text-slate-400 mb-0.5">Codice Iscrizione Cassa Edile</label>
                    <input
                      type="text"
                      value={formData.datiImpresa.cassaEdileIscrizione}
                      onChange={e => setFormData(prev => ({ ...prev, datiImpresa: { ...prev.datiImpresa, cassaEdileIscrizione: e.target.value } }))}
                      className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* 1.2 Dati Cantiere */}
              <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 space-y-4">
                <h3 className="font-black text-xs uppercase text-slate-900 dark:text-white border-b pb-2">
                  1.2 Dati Identificativi del Cantiere & Committenza
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-[9px] font-black uppercase text-slate-400 mb-0.5">
                      Denominazione Cantiere {renderBadgeMissing(formData.datiCantiere.nome)}
                    </label>
                    <input
                      type="text"
                      value={formData.datiCantiere.nome}
                      onChange={e => setFormData(prev => ({ ...prev, datiCantiere: { ...prev.datiCantiere, nome: e.target.value } }))}
                      className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] font-black uppercase text-slate-400 mb-0.5">
                      Comune Cantiere
                    </label>
                    <input
                      type="text"
                      value={formData.datiCantiere.comune}
                      onChange={e => setFormData(prev => ({ ...prev, datiCantiere: { ...prev.datiCantiere, comune: e.target.value } }))}
                      className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[9px] font-black uppercase text-slate-400 mb-0.5">
                      Indirizzo Completo Cantiere {renderBadgeMissing(formData.datiCantiere.indirizzo)}
                    </label>
                    <input
                      type="text"
                      value={formData.datiCantiere.indirizzo}
                      onChange={e => setFormData(prev => ({ ...prev, datiCantiere: { ...prev.datiCantiere, indirizzo: e.target.value } }))}
                      className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] font-black uppercase text-slate-400 mb-0.5">
                      Committente dei Lavori {renderBadgeMissing(formData.datiCantiere.committente)}
                    </label>
                    <input
                      type="text"
                      value={formData.datiCantiere.committente}
                      onChange={e => setFormData(prev => ({ ...prev, datiCantiere: { ...prev.datiCantiere, committente: e.target.value } }))}
                      className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] font-black uppercase text-slate-400 mb-0.5">Codice Fiscale / P.IVA Committente</label>
                    <input
                      type="text"
                      value={formData.datiCantiere.committenteCfPiva}
                      onChange={e => setFormData(prev => ({ ...prev, datiCantiere: { ...prev.datiCantiere, committenteCfPiva: e.target.value } }))}
                      className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] font-black uppercase text-slate-400 mb-0.5">Direttore dei Lavori (D.L.)</label>
                    <input
                      type="text"
                      value={formData.datiCantiere.direttoreLavori}
                      onChange={e => setFormData(prev => ({ ...prev, datiCantiere: { ...prev.datiCantiere, direttoreLavori: e.target.value } }))}
                      className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] font-black uppercase text-slate-400 mb-0.5">Coordinatore Sicurezza Esecuzione (CSE)</label>
                    <input
                      type="text"
                      value={formData.datiCantiere.cse}
                      onChange={e => setFormData(prev => ({ ...prev, datiCantiere: { ...prev.datiCantiere, cse: e.target.value } }))}
                      className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* 1.3 Figure con Compiti di Sicurezza */}
              <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 space-y-4">
                <h3 className="font-black text-xs uppercase text-slate-900 dark:text-white border-b pb-2">
                  1.3 Figure Aziendali con Compiti di Sicurezza (All. XV Punto 2.1)
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[9px] font-black uppercase text-slate-400 mb-0.5">
                      Datore di Lavoro {renderBadgeMissing(formData.datiImpresa.datoreDiLavoro)}
                    </label>
                    <input
                      type="text"
                      value={formData.datiImpresa.datoreDiLavoro}
                      onChange={e => setFormData(prev => ({ ...prev, datiImpresa: { ...prev.datiImpresa, datoreDiLavoro: e.target.value } }))}
                      className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] font-black uppercase text-slate-400 mb-0.5">
                      R.S.P.P. (Resp. Servizio Prevenzione e Protezione) {renderBadgeMissing(formData.datiImpresa.rspp)}
                    </label>
                    <input
                      type="text"
                      value={formData.datiImpresa.rspp}
                      onChange={e => setFormData(prev => ({ ...prev, datiImpresa: { ...prev.datiImpresa, rspp: e.target.value } }))}
                      className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] font-black uppercase text-slate-400 mb-0.5">
                      Medico Competente Nominato
                    </label>
                    <input
                      type="text"
                      value={formData.datiImpresa.medicoCompetente}
                      onChange={e => setFormData(prev => ({ ...prev, datiImpresa: { ...prev.datiImpresa, medicoCompetente: e.target.value } }))}
                      className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] font-black uppercase text-slate-400 mb-0.5">
                      R.L.S. (Rappresentante Lavoratori Sicurezza)
                    </label>
                    <input
                      type="text"
                      value={formData.datiImpresa.rls}
                      onChange={e => setFormData(prev => ({ ...prev, datiImpresa: { ...prev.datiImpresa, rls: e.target.value } }))}
                      className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] font-black uppercase text-slate-400 mb-0.5">
                      Preposto di Cantiere {renderBadgeMissing(formData.datiImpresa.prepostoCantiere)}
                    </label>
                    <input
                      type="text"
                      value={formData.datiImpresa.prepostoCantiere}
                      onChange={e => setFormData(prev => ({ ...prev, datiImpresa: { ...prev.datiImpresa, prepostoCantiere: e.target.value } }))}
                      className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] font-black uppercase text-slate-400 mb-0.5">Addetto Primo Soccorso</label>
                    <input
                      type="text"
                      value={formData.datiImpresa.addettoPrimoSoccorso}
                      onChange={e => setFormData(prev => ({ ...prev, datiImpresa: { ...prev.datiImpresa, addettoPrimoSoccorso: e.target.value } }))}
                      className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* 1.4 Subappalti */}
              <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 space-y-2">
                <h3 className="font-black text-xs uppercase text-slate-900 dark:text-white">
                  1.4 Eventuali Imprese Subappaltatrici o Lavoratori Autonomi
                </h3>
                <textarea
                  rows={2}
                  value={formData.datiCantiere.subappalti}
                  onChange={e => setFormData(prev => ({ ...prev, datiCantiere: { ...prev.datiCantiere, subappalti: e.target.value } }))}
                  className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                  placeholder="Elencare eventuali ditte o lavoratori autonomi subappaltatori..."
                />
              </div>
            </div>
          )}

          {/* CAPITOLO 2: DESCRIZIONE DELL'OPERA */}
          {activeTab === 'cap2' && (
            <div className="max-w-5xl mx-auto space-y-5">
              <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 space-y-4">
                <h3 className="font-black text-xs uppercase text-slate-900 dark:text-white border-b pb-2">
                  2.1 Inquadramento Generale dell'Opera
                </h3>
                <textarea
                  rows={4}
                  value={formData.datiCantiere.descrizioneLavori}
                  onChange={e => setFormData(prev => ({ ...prev, datiCantiere: { ...prev.datiCantiere, descrizioneLavori: e.target.value } }))}
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs leading-relaxed"
                  placeholder="Descrizione generale dell'opera nel suo complesso..."
                />
              </div>

              <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 space-y-4">
                <h3 className="font-black text-xs uppercase text-slate-900 dark:text-white border-b pb-2">
                  2.2 Descrizione Specifica delle Attività Svolte dall'Impresa
                </h3>
                <textarea
                  rows={4}
                  value={formData.datiCantiere.attivitaSvolteImpresa}
                  onChange={e => setFormData(prev => ({ ...prev, datiCantiere: { ...prev.datiCantiere, attivitaSvolteImpresa: e.target.value } }))}
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs leading-relaxed"
                  placeholder="Dettaglio delle specifiche lavorazioni affidate alla presente impresa..."
                />
              </div>

              <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 space-y-4">
                <h3 className="font-black text-xs uppercase text-slate-900 dark:text-white border-b pb-2">
                  2.3 Fasi Operative e Cronoprogramma Temporale
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[9px] font-black uppercase text-slate-400 mb-0.5">Data Presunta Inizio</label>
                    <input
                      type="date"
                      value={formData.datiCantiere.dataInizio}
                      onChange={e => setFormData(prev => ({ ...prev, datiCantiere: { ...prev.datiCantiere, dataInizio: e.target.value } }))}
                      className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-black uppercase text-slate-400 mb-0.5">Data Presunta Fine</label>
                    <input
                      type="date"
                      value={formData.datiCantiere.dataFine}
                      onChange={e => setFormData(prev => ({ ...prev, datiCantiere: { ...prev.datiCantiere, dataFine: e.target.value } }))}
                      className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-black uppercase text-slate-400 mb-0.5">Durata Presunta (Giorni)</label>
                    <input
                      type="number"
                      value={formData.datiCantiere.durataGiorniPresunti}
                      onChange={e => setFormData(prev => ({ ...prev, datiCantiere: { ...prev.datiCantiere, durataGiorniPresunti: Number(e.target.value) || 0 } }))}
                      className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* CAPITOLO 3: PERSONALE, MANSIONI E ORGANIZZAZIONE */}
          {activeTab === 'cap3' && (
            <div className="max-w-5xl mx-auto space-y-6">
              <div className="p-4 rounded-2xl bg-blue-50/50 dark:bg-slate-800 border border-blue-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="font-black text-sm uppercase text-slate-900 dark:text-white">
                    Lavoratori Assegnati al Cantiere ({formData.lavoratori.length})
                  </h3>
                  <p className="text-xs text-slate-500">
                    Mansioni, idoneità sanitaria periodica e attestati formativi (All. XV Punto 2.1 Lett. c).
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAssignAllActiveWorkers}
                  className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all"
                >
                  ⚡ Assegna Tutto il Personale in Forza
                </button>
              </div>

              <div className="space-y-3">
                {formData.lavoratori.map((w, idx) => (
                  <div key={w.id || idx} className="p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-800 font-black text-xs flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <strong className="text-sm font-black text-slate-900 dark:text-white">
                          {w.cognome} {w.nome}
                        </strong>
                        <span className="text-xs text-slate-400 font-mono">({w.codiceFiscale || 'CF non inserito'})</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, lavoratori: prev.lavoratori.filter((_, i) => i !== idx) }))}
                        className="text-slate-400 hover:text-rose-600 text-xs font-bold"
                      >
                        ✕ Rimuovi
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[9px] font-bold uppercase text-slate-400 mb-0.5">Mansione Contrattuale</label>
                        <input
                          type="text"
                          value={w.mansione}
                          onChange={e => {
                            const val = e.target.value;
                            setFormData(prev => ({
                              ...prev,
                              lavoratori: prev.lavoratori.map((item, i) => i === idx ? { ...item, mansione: val } : item),
                            }));
                          }}
                          className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold uppercase text-slate-400 mb-0.5">Ruolo Specifico in Cantiere</label>
                        <input
                          type="text"
                          value={w.ruoloCantiere}
                          onChange={e => {
                            const val = e.target.value;
                            setFormData(prev => ({
                              ...prev,
                              lavoratori: prev.lavoratori.map((item, i) => i === idx ? { ...item, ruoloCantiere: val } : item),
                            }));
                          }}
                          className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold uppercase text-slate-400 mb-0.5">Scadenza Idoneità Sanitaria</label>
                        <input
                          type="text"
                          value={w.dataVisitaMedica}
                          onChange={e => {
                            const val = e.target.value;
                            setFormData(prev => ({
                              ...prev,
                              lavoratori: prev.lavoratori.map((item, i) => i === idx ? { ...item, dataVisitaMedica: val } : item),
                            }));
                          }}
                          className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold"
                          placeholder="es. 15/10/2026 (Idoneo)"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CAPITOLO 4: QUADRO NORMATIVO E DEFINIZIONI */}
          {activeTab === 'cap4' && (
            <div className="max-w-5xl mx-auto space-y-4">
              <div className="p-4 rounded-2xl bg-blue-50/50 dark:bg-slate-800 border border-blue-200 dark:border-slate-700">
                <span className="px-2 py-0.5 rounded bg-blue-600 text-white font-black text-[10px] uppercase tracking-wider">
                  CAPITOLO 4
                </span>
                <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-tight text-sm mt-1">
                  RIFERIMENTI NORMATIVI E DEFINIZIONI ESSENZIALI
                </h3>
              </div>

              <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 space-y-3">
                <h4 className="font-black text-xs uppercase text-slate-900 dark:text-white">
                  4.1 Quadro Legislativo di Riferimento
                </h4>
                <ul className="list-disc list-inside text-xs text-slate-600 dark:text-slate-300 space-y-1.5 leading-relaxed">
                  <li><strong>D.Lgs. 9 aprile 2008 n. 81</strong> e s.m.i. (Testo Unico sulla Salute e Sicurezza sul Lavoro).</li>
                  <li><strong>Titolo IV del D.Lgs. 81/08</strong>: Cantieri temporanei o mobili e norme per la prevenzione degli infortuni sul lavoro nelle costruzioni.</li>
                  <li><strong>Allegato XV del D.Lgs. 81/08</strong>: Contenuti minimi dei Piani di Sicurezza nei cantieri temporanei o mobili.</li>
                  <li><strong>Allegato XVII del D.Lgs. 81/08</strong>: Idoneità tecnico-professionale delle imprese affidatarie ed esecutrici.</li>
                  <li><strong>Allegati V e VI</strong> per l'uso delle attrezzature di lavoro, <strong>Allegato VIII</strong> per la scelta e l'uso dei DPI.</li>
                </ul>
              </div>

              <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 space-y-3">
                <h4 className="font-black text-xs uppercase text-slate-900 dark:text-white">
                  4.2 Definizioni Ricorrenti (Art. 89 D.Lgs. 81/08)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600">
                    <strong className="text-slate-900 dark:text-white block mb-1">Piano Operativo di Sicurezza (POS):</strong>
                    <span className="text-slate-600 dark:text-slate-300 leading-relaxed">
                      Documento che il datore di lavoro dell'impresa esecutrice redige, in riferimento al singolo cantiere interessato, per la pianificazione operativa delle misure di sicurezza.
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600">
                    <strong className="text-slate-900 dark:text-white block mb-1">Impresa Esecutrice:</strong>
                    <span className="text-slate-600 dark:text-slate-300 leading-relaxed">
                      Impresa che esegue un'opera o parte di essa impiegando proprie risorse umane e materiali.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* CAPITOLO 5: LOGISTICA E IMPIANTI */}
          {activeTab === 'cap5' && (
            <div className="max-w-5xl mx-auto space-y-4">
              <div className="p-4 rounded-2xl bg-blue-50/50 dark:bg-slate-800 border border-blue-200 dark:border-slate-700">
                <span className="px-2 py-0.5 rounded bg-blue-600 text-white font-black text-[10px] uppercase tracking-wider">
                  CAPITOLO 5
                </span>
                <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-tight text-sm mt-1">
                  ORGANIZZAZIONE E LOGISTICA DEL CANTIERE
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 space-y-1.5">
                  <label className="block text-xs font-black uppercase text-slate-800 dark:text-slate-200">
                    5.1 Servizi Igienico-Assistenziali & Refettorio
                  </label>
                  <textarea
                    rows={3}
                    value={formData.organizzazioneCantiere?.serviziIgienici || ''}
                    onChange={e => {
                      const val = e.target.value;
                      setFormData(prev => {
                        const updatedOrg: PosOrganizzazioneCantiere = {
                          ...DEFAULT_ORGANIZZAZIONE_CANTIERE,
                          ...(prev.organizzazioneCantiere || prev.organizzazione || {}),
                          serviziIgienici: val,
                          serviziIgieniciAssistenziali: val,
                        };
                        return { ...prev, organizzazioneCantiere: updatedOrg, organizzazione: updatedOrg };
                      });
                    }}
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                  />
                </div>

                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 space-y-1.5">
                  <label className="block text-xs font-black uppercase text-slate-800 dark:text-slate-200">
                    5.2 Viabilità Interna Pedonale e Veicolare
                  </label>
                  <textarea
                    rows={3}
                    value={formData.organizzazioneCantiere?.viabilita || ''}
                    onChange={e => {
                      const val = e.target.value;
                      setFormData(prev => {
                        const updatedOrg: PosOrganizzazioneCantiere = {
                          ...DEFAULT_ORGANIZZAZIONE_CANTIERE,
                          ...(prev.organizzazioneCantiere || prev.organizzazione || {}),
                          viabilita: val,
                          viabilitaSicurezza: val,
                        };
                        return { ...prev, organizzazioneCantiere: updatedOrg, organizzazione: updatedOrg };
                      });
                    }}
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                  />
                </div>

                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 space-y-1.5">
                  <label className="block text-xs font-black uppercase text-slate-800 dark:text-slate-200">
                    5.3 Recinzione di Cantiere, Accessi e Segnaletica
                  </label>
                  <textarea
                    rows={3}
                    value={formData.organizzazioneCantiere?.recinzioneAccessi || ''}
                    onChange={e => {
                      const val = e.target.value;
                      setFormData(prev => {
                        const updatedOrg: PosOrganizzazioneCantiere = {
                          ...DEFAULT_ORGANIZZAZIONE_CANTIERE,
                          ...(prev.organizzazioneCantiere || prev.organizzazione || {}),
                          recinzioneAccessi: val,
                        };
                        return { ...prev, organizzazioneCantiere: updatedOrg, organizzazione: updatedOrg };
                      });
                    }}
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                  />
                </div>

                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 space-y-1.5">
                  <label className="block text-xs font-black uppercase text-slate-800 dark:text-slate-200">
                    5.4 Impianto Elettrico di Cantiere e Messa a Terra
                  </label>
                  <textarea
                    rows={3}
                    value={formData.organizzazioneCantiere?.impiantoElettrico || ''}
                    onChange={e => {
                      const val = e.target.value;
                      setFormData(prev => {
                        const updatedOrg: PosOrganizzazioneCantiere = {
                          ...DEFAULT_ORGANIZZAZIONE_CANTIERE,
                          ...(prev.organizzazioneCantiere || prev.organizzazione || {}),
                          impiantoElettrico: val,
                          impiantoElettricoCantiere: val,
                        };
                        return { ...prev, organizzazioneCantiere: updatedOrg, organizzazione: updatedOrg };
                      });
                    }}
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                  />
                </div>

                <div className="sm:col-span-2 p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 space-y-1.5">
                  <label className="block text-xs font-black uppercase text-slate-800 dark:text-slate-200">
                    5.5 Zone di Stoccaggio Materiali e Gestione Rifiuti
                  </label>
                  <textarea
                    rows={3}
                    value={formData.organizzazioneCantiere?.stoccaggioRifiuti || ''}
                    onChange={e => {
                      const val = e.target.value;
                      setFormData(prev => {
                        const updatedOrg: PosOrganizzazioneCantiere = {
                          ...DEFAULT_ORGANIZZAZIONE_CANTIERE,
                          ...(prev.organizzazioneCantiere || prev.organizzazione || {}),
                          stoccaggioRifiuti: val,
                          gestioneRifiutiTerre: val,
                        };
                        return { ...prev, organizzazioneCantiere: updatedOrg, organizzazione: updatedOrg };
                      });
                    }}
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                  />
                </div>
              </div>
            </div>
          )}

          {/* CAPITOLO 6: METODOLOGIA RISCHI 4X4 */}
          {activeTab === 'cap6' && <PosRiskMatrixView />}

          {/* CAPITOLO 7: CONTESTO AMBIENTALE */}
          {activeTab === 'cap7' && (
            <PosCapitolo7View
              contesto={formData.contestoAmbientale || { ...DEFAULT_CONTESTO_AMBIENTALE }}
              onChange={updated => setFormData(prev => ({ ...prev, contestoAmbientale: updated }))}
            />
          )}

          {/* CAPITOLO 8: TURNI E PRESENZE */}
          {activeTab === 'cap8' && (
            <PosCapitolo8View
              datiCantiere={formData.datiCantiere}
              onChange={updated => setFormData(prev => ({ ...prev, datiCantiere: updated }))}
            />
          )}

          {/* CAPITOLO 9: SCHEDE LAVORAZIONI CON SMART LINKING */}
          {activeTab === 'cap9' && (
            <PosSmartLinkingEditor
              attivita={formData.attivita}
              lavoratori={formData.lavoratori}
              attrezzatureGlobali={formData.attrezzature}
              sostanzeGlobali={formData.sostanze}
              opereGlobali={formData.opereProvvisionali || []}
              customTemplates={customTemplates}
              onChangeAttivita={updated => setFormData(prev => ({ ...prev, attivita: updated }))}
              onSyncGlobalCatalog={handleSyncGlobalCatalog}
            />
          )}

          {/* CAPITOLO 10: SCHEDE ATTREZZATURE, MEZZI E MACCHINE */}
          {activeTab === 'cap10' && (
            <PosCapitolo10View
              attrezzature={formData.attrezzature || []}
              onChange={updated => setFormData(prev => ({ ...prev, attrezzature: updated }))}
            />
          )}

          {/* CAPITOLO 11: OPERE PROVVISIONALI E QUOTA */}
          {activeTab === 'cap11' && (
            <PosCapitolo11View
              opere={formData.opereProvvisionali || []}
              onChange={updated => setFormData(prev => ({ ...prev, opereProvvisionali: updated }))}
            />
          )}

          {/* CAPITOLO 12: SOSTANZE CHIMICHE E SDS */}
          {activeTab === 'cap12' && (
            <PosCapitolo12View
              sostanze={formData.sostanze || []}
              onChange={updated => setFormData(prev => ({ ...prev, sostanze: updated }))}
            />
          )}

          {/* CAPITOLO 13: GESTIONE EMERGENZE */}
          {activeTab === 'cap13' && (
            <div className="max-w-5xl mx-auto space-y-4">
              <div className="p-4 rounded-2xl bg-blue-50/50 dark:bg-slate-800 border border-blue-200 dark:border-slate-700">
                <span className="px-2 py-0.5 rounded bg-blue-600 text-white font-black text-[10px] uppercase tracking-wider">
                  CAPITOLO 13
                </span>
                <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-tight text-sm mt-1">
                  GESTIONE DELLE EMERGENZE, PRIMO SOCCORSO E ANTINCENDIO
                </h3>
              </div>

              <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[9px] font-black uppercase text-slate-400 dark:text-slate-400 mb-0.5">Numero Unico Emergenze</label>
                    <input
                      type="text"
                      value={formData.emergenza.numeroUnicoEmergenza}
                      onChange={e => setFormData(prev => ({ ...prev, emergenza: { ...prev.emergenza, numeroUnicoEmergenza: e.target.value } }))}
                      className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] font-black uppercase text-slate-400 dark:text-slate-400 mb-0.5">Pronto Soccorso di Riferimento</label>
                    <input
                      type="text"
                      value={formData.emergenza.ospedaleRiferimento}
                      onChange={e => setFormData(prev => ({ ...prev, emergenza: { ...prev.emergenza, ospedaleRiferimento: e.target.value } }))}
                      className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] font-black uppercase text-slate-400 dark:text-slate-400 mb-0.5">Telefono Ospedale</label>
                    <input
                      type="text"
                      value={formData.emergenza.telefonoProntoSoccorso}
                      onChange={e => setFormData(prev => ({ ...prev, emergenza: { ...prev.emergenza, telefonoProntoSoccorso: e.target.value } }))}
                      className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[9px] font-black uppercase text-slate-400 dark:text-slate-400 mb-0.5">Indirizzo Pronto Soccorso</label>
                    <input
                      type="text"
                      value={formData.emergenza.prontoSoccorsoIndirizzo}
                      onChange={e => setFormData(prev => ({ ...prev, emergenza: { ...prev.emergenza, prontoSoccorsoIndirizzo: e.target.value } }))}
                      className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] font-black uppercase text-slate-400 dark:text-slate-400 mb-0.5">Punto di Raccolta Cantiere</label>
                    <input
                      type="text"
                      value={formData.emergenza.puntoRaccolta}
                      onChange={e => setFormData(prev => ({ ...prev, emergenza: { ...prev.emergenza, puntoRaccolta: e.target.value } }))}
                      className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block text-[9px] font-black uppercase text-slate-400 dark:text-slate-400 mb-0.5">Ubicazione Cassetta Primo Soccorso & Estintori</label>
                    <input
                      type="text"
                      value={formData.emergenza.cassettaPrimoSoccorsoUbicazione}
                      onChange={e => setFormData(prev => ({ ...prev, emergenza: { ...prev.emergenza, cassettaPrimoSoccorsoUbicazione: e.target.value } }))}
                      className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block text-[9px] font-black uppercase text-slate-400 dark:text-slate-400 mb-0.5">Procedura di Chiamata di Soccorso e Gestione Evacuazione</label>
                    <textarea
                      rows={3}
                      value={formData.emergenza.proceduraChiamataSoccorsi}
                      onChange={e => setFormData(prev => ({ ...prev, emergenza: { ...prev.emergenza, proceduraChiamataSoccorsi: e.target.value } }))}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* CAPITOLO 14: ALLEGATI OBBLIGATORI, REVISIONE E FIRME */}
          {activeTab === 'cap14' && (
            <div className="max-w-5xl mx-auto space-y-5">
              <div className="p-4 rounded-2xl bg-blue-50/50 dark:bg-slate-800 border border-blue-200 dark:border-slate-700">
                <span className="px-2 py-0.5 rounded bg-blue-600 text-white font-black text-[10px] uppercase tracking-wider">
                  CAPITOLO 14
                </span>
                <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-tight text-sm mt-1">
                  DISPOSIZIONI FINALI, REVISIONE DEL POS E ALLEGATI OBBLIGATORI
                </h3>
              </div>

              <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 space-y-3">
                <h4 className="font-black text-xs uppercase text-slate-900 dark:text-white">
                  14.1 Consultazione del RLS e Criteri di Revisione
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-700/40 p-3 rounded-xl">
                  Il presente Piano Operativo di Sicurezza è stato sottoposto a preventiva consultazione del Rappresentante dei Lavoratori per la Sicurezza (RLS) ai sensi dell'art. 50 comma 1 lett. b) del D.Lgs. 81/2008. Il POS verrà tempestivamente aggiornato e integrato in caso di mutamenti significativi nelle lavorazioni, introduzione di nuove macchine/tecnologie o variazioni organizzative di rilievo.
                </p>
              </div>

              <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 space-y-3">
                <h4 className="font-black text-xs uppercase text-slate-900 dark:text-white">
                  14.2 Elenco della Documentazione Obbligatoria Allegata (All. XVII D.Lgs. 81/08)
                </h4>
                <div className="space-y-2">
                  {formData.allegati.map((all, idx) => (
                    <div key={all.id || idx} className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                      <div>
                        <strong className="text-xs text-slate-900 dark:text-white block">{all.titolo}</strong>
                        <span className="text-[10px] text-slate-400 font-bold uppercase">
                          {all.obbligatorio ? 'Obbligatorio per Legge (All. XVII)' : 'Opzionale / Se applicabile'}
                        </span>
                      </div>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={all.allegatoPresente}
                          onChange={e => {
                            const checked = e.target.checked;
                            setFormData(prev => ({
                              ...prev,
                              allegati: prev.allegati.map((item, i) => i === idx ? { ...item, allegatoPresente: checked } : item),
                            }));
                          }}
                          className="w-4 h-4 rounded text-blue-600"
                        />
                        <span className={`text-xs font-black uppercase ${all.allegatoPresente ? 'text-emerald-600' : 'text-slate-400'}`}>
                          {all.allegatoPresente ? 'Allegato ✓' : 'Non Allegato'}
                        </span>
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 space-y-3">
                <h4 className="font-black text-xs uppercase text-slate-900 dark:text-white">
                  14.3 Note Conclusive e Prescrizioni Speciali del CSE
                </h4>
                <textarea
                  rows={4}
                  value={formData.notePrescrizioni}
                  onChange={e => setFormData(prev => ({ ...prev, notePrescrizioni: e.target.value }))}
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  placeholder="Eventuali prescrizioni del coordinatore per la sicurezza o note di coordinamento..."
                />
              </div>
            </div>
          )}

          {/* TAB AUDIT DI CONFORMITÀ */}
          {activeTab === 'controllo' && (
            <div className="max-w-4xl mx-auto space-y-5">
              <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Punteggio di Completezza</span>
                  <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-wide">
                    Verifica di Conformità Formale POS (All. XV D.Lgs. 81/08)
                  </h3>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-3xl font-black text-blue-600 dark:text-blue-400">
                    {audit.percentualeCompletamento}%
                  </span>
                  <span className={`px-3 py-1 rounded-full text-xs font-black uppercase ${
                    audit.statoGlobale === 'completo' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {audit.statoGlobale === 'completo' ? '🟢 Conforme' : '🟡 Verifiche Aperte'}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                {audit.items.map(item => (
                  <div
                    key={item.id}
                    className={`p-3.5 rounded-2xl border flex items-start justify-between gap-3 ${
                      item.stato === 'ok'
                        ? 'bg-emerald-50/30 dark:bg-emerald-950/10 border-emerald-200 dark:border-emerald-900/40'
                        : item.stato === 'warning'
                        ? 'bg-amber-50/30 dark:bg-amber-950/10 border-amber-200 dark:border-amber-900/40'
                        : 'bg-rose-50/30 dark:bg-rose-950/10 border-rose-200 dark:border-rose-900/40'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <span>{item.stato === 'ok' ? '🟢' : item.stato === 'warning' ? '🟡' : '🔴'}</span>
                      <div>
                        <strong className="text-xs font-black text-slate-800 dark:text-slate-200">{item.titolo}</strong>
                        <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">{item.dettaglio}</p>
                        {item.suggerimento && (
                          <p className="text-[10px] font-bold text-amber-700 dark:text-amber-400 mt-0.5">
                            💡 {item.suggerimento}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800/60 text-[11px] text-slate-500 leading-relaxed">
                {audit.noteLegali}
              </div>
            </div>
          )}
        </div>

        {/* Footer Bar */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
          <div className="text-xs text-slate-500">
            Ultima modifica: {new Date(formData.updatedAt).toLocaleDateString('it-IT')}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white font-bold text-xs uppercase tracking-wider"
            >
              Chiudi
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-wider shadow-md shadow-blue-600/20 transition-all"
            >
              💾 Salva Piano Operativo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
