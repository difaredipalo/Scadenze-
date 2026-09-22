import React, { useState } from 'react';
import {
  Cantiere,
  Personale,
  AppSettings,
  PosDocument,
  PosAttivitaTemplate,
  PosLavoratoreAssegnato,
  PosAttivitaItem,
} from '../../types';
import {
  createNewPosFromCantiere,
  DEFAULT_POS_TEMPLATES,
  POS_DPI_LIST,
  DEFAULT_ORGANIZZAZIONE_CANTIERE,
  DEFAULT_PIANO_EMERGENZA,
} from '../../data/posDefaultData';
import { auditPosDocument } from './posAuditHelper';
import { Icons } from '../../constants';

interface PosWizardModalProps {
  cantieri: Cantiere[];
  personale: Personale[];
  settings: AppSettings;
  customTemplates?: PosAttivitaTemplate[];
  onSave: (newPos: PosDocument) => void;
  onClose: () => void;
}

export const PosWizardModal: React.FC<PosWizardModalProps> = ({
  cantieri,
  personale,
  settings,
  customTemplates = [],
  onSave,
  onClose,
}) => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const totalSteps = 6;

  // Selected cantiere
  const [selectedCantiereId, setSelectedCantiereId] = useState<string>(cantieri[0]?.id || '');
  const selectedCantiere = cantieri.find(c => c.id === selectedCantiereId) || cantieri[0];

  // Base POS initialized from selected cantiere
  const [draftPos, setDraftPos] = useState<PosDocument>(() => {
    if (selectedCantiere) {
      return createNewPosFromCantiere(selectedCantiere, settings, personale);
    }
    // Fallback if no cantiere exists
    const dummyCantiere: Cantiere = {
      id: 'c_temp',
      nome: 'Nuovo Cantiere',
      indirizzo: 'Indirizzo del cantiere',
      cliente: 'Committente dell’opera',
      dataInizio: new Date().toISOString().split('T')[0],
      scadenza: new Date(Date.now() + 180 * 86400000).toISOString().split('T')[0],
      importoTotale: 0,
      progresso: 0,
      stato: 'aperto',
      tecnici: [],
      checklistDocumenti: [],
      salList: [],
      subappalti: [],
      note: '',
    };
    return createNewPosFromCantiere(dummyCantiere, settings, personale);
  });

  // Available activity templates
  const allTemplates = [...DEFAULT_POS_TEMPLATES, ...customTemplates];
  const [selectedTemplateIds, setSelectedTemplateIds] = useState<string[]>(
    draftPos.attivita.map(a => a.templateId || a.id).filter(Boolean)
  );

  // When changing cantiere in step 1, re-prefill the POS
  const handleCantiereSelect = (cId: string) => {
    setSelectedCantiereId(cId);
    const targetC = cantieri.find(c => c.id === cId);
    if (targetC) {
      const freshPos = createNewPosFromCantiere(targetC, settings, personale);
      setDraftPos(freshPos);
      setSelectedTemplateIds(freshPos.attivita.map(a => a.templateId || a.id).filter(Boolean));
    }
  };

  // Toggle worker assignment
  const handleToggleWorker = (p: Personale) => {
    const exists = draftPos.lavoratori.some(l => l.personaleId === p.id);
    let updatedWorkers: PosLavoratoreAssegnato[];

    if (exists) {
      updatedWorkers = draftPos.lavoratori.filter(l => l.personaleId !== p.id);
    } else {
      const isCapo = /capo|preposto|responsabile/i.test(p.ruolo);
      const newWorker: PosLavoratoreAssegnato = {
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
      updatedWorkers = [...draftPos.lavoratori, newWorker];
    }

    setDraftPos(prev => ({
      ...prev,
      lavoratori: updatedWorkers,
      datiCantiere: {
        ...prev.datiCantiere,
        numeroMassimoLavoratori: Math.max(updatedWorkers.length, 1),
      },
    }));
  };

  // Toggle template activity
  const handleToggleTemplate = (tpl: PosAttivitaTemplate) => {
    const isSelected = selectedTemplateIds.includes(tpl.id);
    let newTemplateIds: string[];
    let updatedAttivita: PosAttivitaItem[];

    if (isSelected) {
      newTemplateIds = selectedTemplateIds.filter(id => id !== tpl.id);
      updatedAttivita = draftPos.attivita.filter(a => (a.templateId || a.id) !== tpl.id);
    } else {
      newTemplateIds = [...selectedTemplateIds, tpl.id];
      const newAttivitaItem: PosAttivitaItem = {
        id: Math.random().toString(),
        templateId: tpl.id,
        nome: tpl.nome,
        categoria: tpl.categoria,
        icona: tpl.icona,
        descrizione: tpl.descrizione,
        faseLavoro: tpl.faseLavoro,
        personaleCoinvolto: draftPos.lavoratori.map(l => `${l.nome} ${l.cognome}`),
        attrezzatureUtilizzate: tpl.attrezzatureTipiche,
        materialiUtilizzati: tpl.materialiTipici,
        sostanzeUtilizzate: [],
        rischi: tpl.rischi,
        misurePrevenzione: tpl.misurePrevenzione,
        dpiNecessari: tpl.dpiRaccomandati,
        interferenze: tpl.interferenze,
        note: tpl.note,
      };
      updatedAttivita = [...draftPos.attivita, newAttivitaItem];
    }

    // Accumulate all recommended DPIs from selected activities
    const accumulatedDpi = Array.from(
      new Set([
        'Casco di protezione / Elmetto',
        'Calzature di sicurezza S3',
        'Guanti rischio meccanico',
        'Gilet alta visibilità',
        ...updatedAttivita.flatMap(a => a.dpiNecessari),
      ])
    );

    setSelectedTemplateIds(newTemplateIds);
    setDraftPos(prev => ({
      ...prev,
      attivita: updatedAttivita,
      dpiRichiesti: accumulatedDpi,
    }));
  };

  // Toggle DPI
  const handleToggleDpi = (dpiNome: string) => {
    const exists = draftPos.dpiRichiesti.includes(dpiNome);
    const updated = exists
      ? draftPos.dpiRichiesti.filter(d => d !== dpiNome)
      : [...draftPos.dpiRichiesti, dpiNome];
    setDraftPos(prev => ({ ...prev, dpiRichiesti: updated }));
  };

  const audit = auditPosDocument(draftPos);

  const handleFinish = () => {
    onSave(draftPos);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Wizard Header */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-[10px] font-black uppercase tracking-widest">
                Creazione Rapida POS
              </span>
              <span className="text-xs font-bold text-slate-400">
                Passo {currentStep} di {totalSteps}
              </span>
            </div>
            <h2 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight mt-1">
              {currentStep === 1 && '1. Selezione Cantiere & Opera'}
              {currentStep === 2 && '2. Impresa & Soggetti di Sicurezza'}
              {currentStep === 3 && '3. Personale & Idoneità Sanitaria'}
              {currentStep === 4 && '4. Fasi di Lavoro & Attività Edili'}
              {currentStep === 5 && '5. Dispositivi di Protezione (DPI)'}
              {currentStep === 6 && '6. Presidi Emergenza & Convalida'}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Wizard Step Progress Bar */}
        <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800">
          <div
            className="h-full bg-blue-600 transition-all duration-300 rounded-r-full"
            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
          />
        </div>

        {/* Wizard Body Content */}
        <div className="p-6 overflow-y-auto flex-1 text-xs">
          {/* STEP 1: CANTIERE */}
          {currentStep === 1 && (
            <div className="space-y-5">
              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                  Seleziona il Cantiere dal Gestionale
                </label>
                {cantieri.length === 0 ? (
                  <div className="p-4 rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-300">
                    Nessun cantiere registrato nel gestionale. È possibile procedere inserendo manualmente i dati del cantiere nei campi sottostanti.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {cantieri.map(c => {
                      const isSelected = c.id === selectedCantiereId;
                      return (
                        <div
                          key={c.id}
                          onClick={() => handleCantiereSelect(c.id)}
                          className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                            isSelected
                              ? 'border-blue-600 bg-blue-50/60 dark:bg-blue-900/30 text-blue-950 dark:text-blue-100 shadow-sm ring-2 ring-blue-500/20'
                              : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-800/50'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <h4 className="font-black text-sm uppercase">{c.nome}</h4>
                            {isSelected && <span className="text-blue-600 dark:text-blue-400 font-black">✓</span>}
                          </div>
                          <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-1 line-clamp-1">
                            📍 {c.indirizzo || 'Indirizzo non indicato'}
                          </p>
                          <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                            👤 {c.cliente || 'Committente non indicato'}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Dati specifici del cantiere selezionato */}
              <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                <h4 className="font-black uppercase tracking-wider text-[11px] text-slate-800 dark:text-slate-200">
                  Dati di Cantiere Prelevati Automaticamente
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Codice Identificativo POS</label>
                    <input
                      type="text"
                      value={draftPos.codice}
                      onChange={e => setDraftPos(prev => ({ ...prev, codice: e.target.value }))}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Nome Cantiere / Opera</label>
                    <input
                      type="text"
                      value={draftPos.datiCantiere.nome}
                      onChange={e => setDraftPos(prev => ({ ...prev, datiCantiere: { ...prev.datiCantiere, nome: e.target.value } }))}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Indirizzo Completo Cantiere</label>
                    <input
                      type="text"
                      value={draftPos.datiCantiere.indirizzo}
                      onChange={e => setDraftPos(prev => ({ ...prev, datiCantiere: { ...prev.datiCantiere, indirizzo: e.target.value } }))}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Committente</label>
                    <input
                      type="text"
                      value={draftPos.datiCantiere.committente}
                      onChange={e => setDraftPos(prev => ({ ...prev, datiCantiere: { ...prev.datiCantiere, committente: e.target.value } }))}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Coordinatore Sicurezza (CSE)</label>
                    <input
                      type="text"
                      value={draftPos.datiCantiere.cse}
                      onChange={e => setDraftPos(prev => ({ ...prev, datiCantiere: { ...prev.datiCantiere, cse: e.target.value } }))}
                      placeholder="Nome e cognome CSE"
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Direttore dei Lavori (DL)</label>
                    <input
                      type="text"
                      value={draftPos.datiCantiere.direttoreLavori}
                      onChange={e => setDraftPos(prev => ({ ...prev, datiCantiere: { ...prev.datiCantiere, direttoreLavori: e.target.value } }))}
                      placeholder="Nome e cognome DL"
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: IMPRESA & FIGURE DI SICUREZZA */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/40 text-blue-900 dark:text-blue-300">
                I dati dell’impresa sono stati ereditati dalle impostazioni generali. Verifica e completa i soggetti incaricati per questo specifico cantiere.
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Ragione Sociale Impresa</label>
                  <input
                    type="text"
                    value={draftPos.datiImpresa.ragioneSociale}
                    onChange={e => setDraftPos(prev => ({ ...prev, datiImpresa: { ...prev.datiImpresa, ragioneSociale: e.target.value } }))}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Partita IVA / Codice Fiscale</label>
                  <input
                    type="text"
                    value={draftPos.datiImpresa.partitaIva}
                    onChange={e => setDraftPos(prev => ({ ...prev, datiImpresa: { ...prev.datiImpresa, partitaIva: e.target.value } }))}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Datore di Lavoro (Titolare Obbligo)</label>
                  <input
                    type="text"
                    value={draftPos.datiImpresa.datoreDiLavoro}
                    onChange={e => setDraftPos(prev => ({ ...prev, datiImpresa: { ...prev.datiImpresa, datoreDiLavoro: e.target.value } }))}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-blue-700 dark:text-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">RSPP (Resp. Servizio Prev. e Protezione)</label>
                  <input
                    type="text"
                    value={draftPos.datiImpresa.rspp}
                    onChange={e => setDraftPos(prev => ({ ...prev, datiImpresa: { ...prev.datiImpresa, rspp: e.target.value } }))}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Preposto / Capocantiere</label>
                  <input
                    type="text"
                    value={draftPos.datiImpresa.prepostoCantiere}
                    onChange={e => setDraftPos(prev => ({ ...prev, datiImpresa: { ...prev.datiImpresa, prepostoCantiere: e.target.value } }))}
                    placeholder="Nome del preposto o capocantiere"
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium text-emerald-700 dark:text-emerald-400 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Medico Competente</label>
                  <input
                    type="text"
                    value={draftPos.datiImpresa.medicoCompetente}
                    onChange={e => setDraftPos(prev => ({ ...prev, datiImpresa: { ...prev.datiImpresa, medicoCompetente: e.target.value } }))}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Addetto Primo Soccorso</label>
                  <input
                    type="text"
                    value={draftPos.datiImpresa.addettoPrimoSoccorso}
                    onChange={e => setDraftPos(prev => ({ ...prev, datiImpresa: { ...prev.datiImpresa, addettoPrimoSoccorso: e.target.value } }))}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Addetto Antincendio</label>
                  <input
                    type="text"
                    value={draftPos.datiImpresa.addettoAntincendio}
                    onChange={e => setDraftPos(prev => ({ ...prev, datiImpresa: { ...prev.datiImpresa, addettoAntincendio: e.target.value } }))}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: PERSONALE */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-black uppercase tracking-wider text-[11px] text-slate-800 dark:text-slate-200">
                    Seleziona i lavoratori assegnati a questo cantiere
                  </h4>
                  <p className="text-slate-500 text-[11px]">
                    Spunta i lavoratori che opereranno in cantiere. I dati di idoneità sanitaria e corsi vengono prelevati dal gestionale.
                  </p>
                </div>
                <span className="px-3 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full font-black text-xs">
                  {draftPos.lavoratori.length} Selezionati
                </span>
              </div>

              {personale.length === 0 ? (
                <div className="p-4 rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-300">
                  Nessun lavoratore presente nel gestionale. È possibile aggiungere lavoratori in seguito o completare l'anagrafica del personale.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {personale.map(p => {
                    const isAssigned = draftPos.lavoratori.some(l => l.personaleId === p.id);
                    return (
                      <div
                        key={p.id}
                        onClick={() => handleToggleWorker(p)}
                        className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-start justify-between gap-3 ${
                          isAssigned
                            ? 'border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/20 text-slate-900 dark:text-white shadow-sm ring-1 ring-emerald-500/20'
                            : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-800/40 opacity-70'
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-black text-xs">{p.nome} {p.cognome}</span>
                            {isAssigned && <span className="text-emerald-600 text-xs font-black">✓ Assegnato</span>}
                          </div>
                          <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">
                            Mansione: {p.ruolo || 'Operaio'}
                          </p>
                          <div className="mt-1 flex flex-wrap gap-1 text-[10px]">
                            {p.scadenzaVisitaMedica ? (
                              <span className="px-1.5 py-0.5 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 rounded font-bold">
                                Visita: {p.scadenzaVisitaMedica}
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.5 bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 rounded font-bold">
                                Visita da aggiornare
                              </span>
                            )}
                            {p.corsiFormazione && p.corsiFormazione.length > 0 && (
                              <span className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 rounded">
                                {p.corsiFormazione.length} corsi
                              </span>
                            )}
                          </div>
                        </div>

                        <input
                          type="checkbox"
                          checked={isAssigned}
                          readOnly
                          className="w-4 h-4 rounded text-emerald-600 focus:ring-0 mt-1"
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* STEP 4: ATTIVITÀ & LAVORAZIONI */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-black uppercase tracking-wider text-[11px] text-slate-800 dark:text-slate-200">
                    Libreria Fasi Lavorative & Attività Edili
                  </h4>
                  <p className="text-slate-500 text-[11px]">
                    Seleziona le lavorazioni previste nel cantiere. Rischi, misure e DPI verranno integrati automaticamente nel POS.
                  </p>
                </div>
                <span className="px-3 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full font-black text-xs">
                  {selectedTemplateIds.length} Selezionate
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {allTemplates.map(tpl => {
                  const isSelected = selectedTemplateIds.includes(tpl.id);
                  return (
                    <div
                      key={tpl.id}
                      onClick={() => handleToggleTemplate(tpl)}
                      className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50/60 dark:bg-blue-900/30 text-slate-900 dark:text-white shadow-sm ring-1 ring-blue-500/20'
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-800/40'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{tpl.icona}</span>
                          <h4 className="font-black text-xs uppercase leading-tight">{tpl.nome}</h4>
                        </div>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          readOnly
                          className="w-4 h-4 rounded text-blue-600 focus:ring-0 mt-0.5"
                        />
                      </div>
                      <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-1 line-clamp-2 leading-relaxed">
                        {tpl.descrizione}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[10px]">
                        <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded font-bold uppercase">
                          {tpl.categoria}
                        </span>
                        <span className="text-slate-400 font-bold">
                          ⚠️ {tpl.rischi.length} rischi analizzati
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 5: DPI */}
          {currentStep === 5 && (
            <div className="space-y-4">
              <div>
                <h4 className="font-black uppercase tracking-wider text-[11px] text-slate-800 dark:text-slate-200">
                  Dispositivi di Protezione Individuale (DPI)
                </h4>
                <p className="text-slate-500 text-[11px]">
                  I DPI raccomandati sono stati pre-selezionati in base alle lavorazioni attivate. Spunta o deseleziona secondo le esigenze specifiche del cantiere.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {POS_DPI_LIST.map(dpi => {
                  const isSelected = draftPos.dpiRichiesti.some(
                    d => d.toLowerCase().includes(dpi.nome.toLowerCase()) || dpi.nome.toLowerCase().includes(d.toLowerCase())
                  );
                  return (
                    <div
                      key={dpi.id}
                      onClick={() => handleToggleDpi(dpi.nome)}
                      className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-start justify-between gap-3 ${
                        isSelected
                          ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/20 text-slate-900 dark:text-white shadow-sm ring-1 ring-amber-500/20'
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-800/40 opacity-70'
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        <span className="text-2xl shrink-0">{dpi.icona}</span>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-black text-xs">{dpi.nome}</span>
                            {dpi.obbligatorioBase && (
                              <span className="px-1.5 py-0.5 bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 text-[9px] font-black rounded uppercase">
                                Base
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] font-bold text-blue-700 dark:text-blue-400 block mt-0.5">
                            {dpi.norma}
                          </span>
                          <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5 leading-snug">
                            {dpi.descrizione}
                          </p>
                        </div>
                      </div>

                      <input
                        type="checkbox"
                        checked={isSelected}
                        readOnly
                        className="w-4 h-4 rounded text-amber-600 focus:ring-0 mt-1"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 6: RIEPILOGO & CONTROLLO */}
          {currentStep === 6 && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Esito Verifica Preliminare</span>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wide">
                    Indice di Completezza Documento POS
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-black text-blue-600 dark:text-blue-400">
                    {audit.percentualeCompletamento}%
                  </span>
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                    audit.statoGlobale === 'completo' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {audit.statoGlobale === 'completo' ? '🟢 Conforme' : '🟡 Verifiche residue'}
                  </span>
                </div>
              </div>

              {/* Emergenze Rapide */}
              <div className="bg-white dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                <h4 className="font-black uppercase tracking-wider text-[11px] text-slate-800 dark:text-slate-200">
                  Presidio Ospedaliero & Numeri di Emergenza
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Ospedale / Pronto Soccorso di Zona</label>
                    <input
                      type="text"
                      value={draftPos.emergenza.ospedaleRiferimento}
                      onChange={e => setDraftPos(prev => ({ ...prev, emergenza: { ...prev.emergenza, ospedaleRiferimento: e.target.value } }))}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Indirizzo Pronto Soccorso</label>
                    <input
                      type="text"
                      value={draftPos.emergenza.prontoSoccorsoIndirizzo}
                      onChange={e => setDraftPos(prev => ({ ...prev, emergenza: { ...prev.emergenza, prontoSoccorsoIndirizzo: e.target.value } }))}
                      placeholder="Via, civico e comune ospedale"
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                    />
                  </div>
                </div>
              </div>

              {/* Audit Summary Pills */}
              <div className="space-y-2">
                <h4 className="font-black uppercase tracking-wider text-[11px] text-slate-800 dark:text-slate-200">
                  Controllo Voci Normative Allegato XV
                </h4>
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {audit.items.map(item => (
                    <div key={item.id} className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800">
                      <div className="flex items-center gap-2">
                        <span>{item.stato === 'ok' ? '🟢' : item.stato === 'warning' ? '🟡' : '🔴'}</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">{item.titolo}</span>
                      </div>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 max-w-[250px]">{item.dettaglio}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Wizard Footer Navigation */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <div>
            {currentStep > 1 && (
              <button
                onClick={() => setCurrentStep(prev => prev - 1)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors uppercase tracking-wider text-xs"
              >
                ← Indietro
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white font-bold transition-colors uppercase tracking-wider text-xs"
            >
              Annulla
            </button>

            {currentStep < totalSteps ? (
              <button
                onClick={() => setCurrentStep(prev => prev + 1)}
                className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-wider text-xs shadow-md shadow-blue-600/20 transition-all"
              >
                Avanti →
              </button>
            ) : (
              <button
                onClick={handleFinish}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-wider text-xs shadow-md shadow-emerald-600/20 transition-all flex items-center gap-2"
              >
                <span>✓</span> Genera & Salva POS
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
