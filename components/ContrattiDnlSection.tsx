import React, { useState, useMemo, useEffect } from 'react';
import { Cantiere, AppSettings, Personale, DnlData } from '../types';
import { Icons } from '../constants';
import {
  CONTRACT_VARIABLES,
  DEFAULT_CONTRATTO_APPALTO,
  DEFAULT_CONTRATTO_SUBAPPALTO,
  DEFAULT_LETTERA_INCARICO,
} from '../data/defaultTemplates';
import { numeroInLettereItaliano } from '../utils/numberToItalianWords';
import {
  exportContractToPdf,
  exportContractToWord,
  exportDnlToTxt,
  downloadDnlTxtFile,
  downloadDnlJsonFile,
  exportDnlToExcel,
  exportDnlToPdf,
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

  // ================= STATO MODULO CONTRATTI =================
  const [selectedTemplateType, setSelectedTemplateType] = useState<'appalto' | 'subappalto' | 'incarico' | 'custom'>('appalto');
  const [contractTemplateText, setContractTemplateText] = useState<string>(() => {
    return DEFAULT_CONTRATTO_APPALTO;
  });
  const [contractViewMode, setContractViewMode] = useState<'edit' | 'preview'>('preview');

  // Variabili contrattuali personalizzate/sovrascrivibili al volo
  const [customVariableOverrides, setCustomVariableOverrides] = useState<Record<string, string>>({});
  const [showVariablesPanel, setShowVariablesPanel] = useState(false);

  // Cambia il template base quando l'utente seleziona un altro modello
  useEffect(() => {
    if (selectedTemplateType === 'appalto') {
      setContractTemplateText(DEFAULT_CONTRATTO_APPALTO);
    } else if (selectedTemplateType === 'subappalto') {
      setContractTemplateText(DEFAULT_CONTRATTO_SUBAPPALTO);
    } else if (selectedTemplateType === 'incarico') {
      setContractTemplateText(DEFAULT_LETTERA_INCARICO);
    } else if (selectedTemplateType === 'custom') {
      setContractTemplateText(settings.contrattoBaseCustom || DEFAULT_CONTRATTO_APPALTO);
    }
  }, [selectedTemplateType, settings.contrattoBaseCustom]);

  // ================= STATO MODULO DNL =================
  const [dnlFormData, setDnlFormData] = useState<DnlData>(() => {
    return selectedCantiere?.dnlData || {};
  });

  // Aggiorna lo stato DNL quando cambia il cantiere
  useEffect(() => {
    if (selectedCantiere) {
      setDnlFormData(selectedCantiere.dnlData || {});
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
      ? selectedCantiere.salList.map((s, i) => `SAL ${i + 1}: ${s.titolo} - € ${s.importo.toLocaleString('it-IT')} (del ${s.data})`).join('\n   ')
      : 'Liquidazione in acconti a SAL e saldo finale previa emissione fattura e verifica DURC.';

    // Subappalti
    const subStr = selectedCantiere.subappalti && selectedCantiere.subappalti.length > 0
      ? selectedCantiere.subappalti.map(s => `${s.azienda} (${s.lavoro})`).join(', ')
      : 'Nessuna ditta in subappalto al momento stipulata';

    const cse = selectedCantiere.tecnici?.find(t => /sicurezza|cse/i.test(t.ruolo))?.nome || dnlFormData.coordinatoreSicurezza || 'Da nominare a cura del Committente';

    return {
      NOME_CANTIERE: selectedCantiere.nome || '',
      CLIENTE: selectedCantiere.cliente || '',
      INDIRIZZO_CANTIERE: selectedCantiere.indirizzo || 'Ubicazione cantiere da specificare',
      IMPORTO_TOTALE: importoFormatted,
      IMPORTO_LETTERE: importoLettere,
      ONERI_SICUREZZA: (dnlFormData.oneriSicurezza || Math.round(importoNum * 0.03)).toLocaleString('it-IT', { minimumFractionDigits: 2 }),
      DATA_INIZIO: selectedCantiere.dataInizio || 'Da stabilire',
      DATA_CONSEGNA: selectedCantiere.dataConsegna || selectedCantiere.scadenza || 'Da stabilire',
      DURATA_GIORNI: durataGiorni,
      DIRETTORE_LAVORI: selectedCantiere.direttoreLavori || 'Da designare a cura del Committente',
      COORDINATORE_SICUREZZA: cse,
      NOME_IMPRESA: settings.nomeAzienda || '',
      PIVA_IMPRESA: settings.partitaIva || settings.codiceFiscaleAzienda || 'P.IVA da definire',
      SEDE_IMPRESA: settings.indirizzoSede || 'Sede da definire',
      PEC_IMPRESA: settings.pec || 'PEC da definire',
      LEGALE_RAPPRESENTANTE: settings.rappresentanteLegale || 'Legale rappresentante',
      MODALITA_PAGAMENTO: 'Bonifico bancario entro 30 giorni da presentazione fattura/SAL autorizzato.',
      ELENCO_SAL: salStr,
      ELENCO_SUBAPPALTI: subStr,
      FORO_COMPETENTE: settings.indirizzoSede ? settings.indirizzoSede.split(',').pop()?.trim() || 'Foro competente' : 'Foro competente',
      CIG_CUP: dnlFormData.cig ? `CIG: ${dnlFormData.cig}${dnlFormData.cup ? ` - CUP: ${dnlFormData.cup}` : ''}` : 'Non applicabile (Opera privata)',
      DATA_OGGI: new Date().toLocaleDateString('it-IT'),
      NOTE_CANTIERE: selectedCantiere.note || 'Nessuna condizione particolare registrata.',
    };
  }, [selectedCantiere, settings, dnlFormData]);

  // Valori finali variabili = calcolati uniti alle sovrascritture manuali
  const activeVariables = useMemo(() => {
    return {
      ...computedVariables,
      ...customVariableOverrides,
    };
  }, [computedVariables, customVariableOverrides]);

  // Testo compilato del contratto sostituendo tutti i {{TAG}} con i valori
  const compiledContractText = useMemo(() => {
    let result = contractTemplateText;
    CONTRACT_VARIABLES.forEach(v => {
      const val = activeVariables[v.key] ?? '';
      // Sostituisce sia {{TAG}} sia {TAG}
      const regex1 = new RegExp(`\\{\\{${v.key}\\}\\}`, 'g');
      const regex2 = new RegExp(`\\{${v.key}\\}`, 'g');
      result = result.replace(regex1, val).replace(regex2, val);
    });
    return result;
  }, [contractTemplateText, activeVariables]);

  // Personale assegnato al cantiere per la DNL
  const personaleAssegnato = useMemo(() => {
    const assignedIds = dnlFormData.lavoratoriAssegnatiIds || [];
    return personaleList.filter(p => assignedIds.includes(p.id));
  }, [personaleList, dnlFormData.lavoratoriAssegnatiIds]);

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

  // Salva template personalizzato nelle impostazioni
  const handleSaveCustomTemplate = () => {
    onUpdateSettings({
      ...settings,
      contrattoBaseCustom: contractTemplateText,
    });
    setSelectedTemplateType('custom');
    if (onShowToast) onShowToast('success', 'Modello di contratto salvato come modello base predefinito!');
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
    const txt = exportDnlToTxt(selectedCantiere, settings, dnlFormData, personaleAssegnato);
    const consultantMessage = `Spett.le Studio di Consulenza del Lavoro,\n\nVi trasmettiamo i dati completi per l'apertura e l'inoltro della Denuncia di Nuovo Lavoro (D.N.L.) per la Cassa Edile e l'INAIL relativi al nostro cantiere:\n\n${txt}\n\nRestiamo a disposizione per qualsiasi chiarimento.\nCordiali saluti,\n${settings.nomeAzienda}`;
    handleCopyText(consultantMessage, 'Scheda DNL per Consulente del Lavoro');
  };

  // Toggle selezione operaio assegnato alla DNL
  const toggleWorkerAssignment = (workerId: string) => {
    const current = dnlFormData.lavoratoriAssegnatiIds || [];
    const exists = current.includes(workerId);
    const updatedIds = exists
      ? current.filter(id => id !== workerId)
      : [...current, workerId];

    setDnlFormData(prev => ({
      ...prev,
      lavoratoriAssegnatiIds: updatedIds,
      numeroOperaiStimati: updatedIds.length > 0 ? updatedIds.length : prev.numeroOperaiStimati,
    }));
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
          {/* Barra comandi contratti */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              {/* Selezione Modello Base */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-black text-slate-400 uppercase tracking-wider mr-1">Modello:</span>
                {[
                  { id: 'appalto', label: 'Appalto Lavori Edili (Standard)' },
                  { id: 'subappalto', label: 'Subappalto Specialistico' },
                  { id: 'incarico', label: 'Lettera Incarico' },
                  { id: 'custom', label: 'Mio Modello Salvato' },
                ].map(t => (
                  <button
                    key={t.id}
                    onClick={() => setSelectedTemplateType(t.id as any)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                      selectedTemplateType === t.id
                        ? 'bg-slate-900 dark:bg-blue-600 text-white shadow-sm'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Azioni Principali: Export & Copia */}
              <div className="flex flex-wrap items-center gap-2">
                <button
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
                  onClick={() => setContractViewMode(contractViewMode === 'preview' ? 'edit' : 'preview')}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-slate-200 dark:hover:bg-slate-700 transition-all flex items-center gap-1.5"
                >
                  {contractViewMode === 'preview' ? '✏️ Modifica Testo Base' : '👁️ Anteprima Compilata'}
                </button>

                <button
                  onClick={() => handleCopyText(compiledContractText, 'Contratto')}
                  className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5"
                  title="Copia testo negli appunti"
                >
                  <Icons.Copy /> Copia
                </button>

                <button
                  onClick={() => exportContractToWord(compiledContractText, selectedCantiere.nome, settings.nomeAzienda)}
                  className="px-3.5 py-2 bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5"
                  title="Scarica file Word (.doc)"
                >
                  <Icons.FileText /> Word (.doc)
                </button>

                <button
                  onClick={() => exportContractToPdf(compiledContractText, selectedCantiere, settings)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md shadow-blue-600/30 flex items-center gap-1.5"
                  title="Scarica PDF Ufficiale"
                >
                  <Icons.Pdf /> Scarica PDF Ufficiale
                </button>
              </div>
            </div>

            {/* Inseritore rapido Variabili nel testo */}
            {contractViewMode === 'edit' && (
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                  <span>💡</span> Clicca su una variabile per inserirla nel punto del testo desiderato:
                </p>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto custom-scrollbar p-1">
                  {CONTRACT_VARIABLES.map(v => (
                    <button
                      key={v.key}
                      onClick={() => handleInsertVariable(v.tag)}
                      title={`${v.label}: ${v.description}`}
                      className="px-2.5 py-1 bg-slate-50 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-900/40 hover:text-blue-600 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-lg text-[10px] font-mono font-bold transition-all"
                    >
                      {v.tag}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Pannello Delle Variabili Modificabili (Collapsible) */}
          {showVariablesPanel && (
            <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-blue-200 dark:border-blue-900/50 shadow-md space-y-4 animate-in slide-in-from-top-2 duration-200">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="text-blue-600 font-black text-base">⚙️</span>
                  <div>
                    <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">
                      Variabili Dinamiche di Cantiere (Modificabili al Volo)
                    </h4>
                    <p className="text-[10px] text-slate-400">
                      I valori sono prelevati automaticamente dal cantiere e dall'azienda. Puoi modificarli qui per personalizzare il contratto finale.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setCustomVariableOverrides({})}
                  className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg text-[10px] font-black uppercase hover:bg-slate-200 transition-all"
                >
                  Ripristina Valori Cantiere
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {CONTRACT_VARIABLES.slice(0, 15).map(v => (
                  <div key={v.key} className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider flex justify-between">
                      <span>{v.label}</span>
                      <span className="text-slate-400 font-mono text-[9px]">{v.tag}</span>
                    </label>
                    <input
                      type="text"
                      value={activeVariables[v.key] ?? ''}
                      onChange={(e) => setCustomVariableOverrides({
                        ...customVariableOverrides,
                        [v.key]: e.target.value
                      })}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-blue-500 transition-all"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Area Contratto: Editor vs Anteprima */}
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="px-6 py-4 bg-slate-50/70 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
                <span className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                  {contractViewMode === 'preview' ? 'Anteprima Contratto Compilato con i Dati di Cantiere' : 'Editor Modello Contrattuale Base (con segnaposto {{VARIABILE}})'}
                </span>
              </div>
              {contractViewMode === 'edit' && (
                <button
                  onClick={handleSaveCustomTemplate}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-xs flex items-center gap-1"
                >
                  <Icons.Check /> Salva come Mio Modello Base
                </button>
              )}
            </div>

            <div className="p-6 md:p-8">
              {contractViewMode === 'preview' ? (
                <div className="bg-[#fcfdfd] dark:bg-slate-950 p-6 md:p-10 rounded-2xl border border-slate-200/80 dark:border-slate-800 font-serif text-sm leading-relaxed text-slate-800 dark:text-slate-200 whitespace-pre-wrap shadow-inner max-h-[700px] overflow-y-auto custom-scrollbar">
                  {compiledContractText}
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
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <p>Usa il formato <code>{`{{NOME_VARIABILE}}`}</code> per creare nuovi campi dinamici.</p>
                    <button
                      onClick={() => setContractTemplateText(DEFAULT_CONTRATTO_APPALTO)}
                      className="text-rose-500 hover:underline font-bold"
                    >
                      Ripristina Testo Iniziale
                    </button>
                  </div>
                </div>
              )}
            </div>
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
                onClick={() => downloadDnlTxtFile(selectedCantiere, settings, dnlFormData, personaleAssegnato)}
                className="px-3.5 py-2.5 bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5"
                title="Scarica file testo .txt con tutti i dati per l'apertura telematica"
              >
                <Icons.Download /> File DNL (.txt)
              </button>

              <button
                onClick={() => downloadDnlJsonFile(selectedCantiere, settings, dnlFormData, personaleAssegnato)}
                className="px-3.5 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5"
                title="Scarica dati strutturati in JSON"
              >
                Dati (.json)
              </button>

              <button
                onClick={() => exportDnlToExcel(selectedCantiere, settings, dnlFormData, personaleAssegnato)}
                className="px-3.5 py-2.5 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5"
                title="Scarica foglio Excel completo"
              >
                <Icons.Excel /> Excel (.xlsx)
              </button>

              <button
                onClick={() => exportDnlToPdf(selectedCantiere, settings, dnlFormData, personaleAssegnato)}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md shadow-blue-600/30 flex items-center gap-1.5"
                title="Scarica scheda ufficiale DNL in PDF"
              >
                <Icons.Pdf /> Scheda PDF DNL
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

            {/* RIQUADRO 3: Committente & Figure Tecniche */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                <span className="text-base">👤</span>
                <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                  Riquadro 3: Committente & Responsabili
                </h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Direttore dei Lavori (D.L.)</label>
                  <input
                    type="text"
                    value={selectedCantiere.direttoreLavori || ''}
                    onChange={(e) => onUpdateCantiere({ ...selectedCantiere, direttoreLavori: e.target.value })}
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
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Scadenza Invio DNL</label>
                  <input
                    type="date"
                    value={selectedCantiere.scadenzaDNL || ''}
                    onChange={(e) => onUpdateCantiere({ ...selectedCantiere, scadenzaDNL: e.target.value })}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* RIQUADRO 4: Valori Economici & Congruità Manodopera */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                <span className="text-base">💶</span>
                <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                  Riquadro 4: Valori Economici & Manodopera
                </h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Valore Totale Opera (€)</label>
                  <input
                    type="number"
                    value={selectedCantiere.importoTotale || 0}
                    onChange={(e) => onUpdateCantiere({ ...selectedCantiere, importoTotale: parseFloat(e.target.value) || 0 })}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Importo Opere Edili (Cassa Edile) (€)</label>
                  <input
                    type="number"
                    value={dnlFormData.importoEdile !== undefined ? dnlFormData.importoEdile : selectedCantiere.importoTotale}
                    onChange={(e) => setDnlFormData({ ...dnlFormData, importoEdile: parseFloat(e.target.value) || 0 })}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Oneri della Sicurezza (€)</label>
                  <input
                    type="number"
                    placeholder="Es. 3500"
                    value={dnlFormData.oneriSicurezza || 0}
                    onChange={(e) => setDnlFormData({ ...dnlFormData, oneriSicurezza: parseFloat(e.target.value) || 0 })}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Incidenza Min. Manodopera (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={dnlFormData.incidenzaManodoperaPerc || 14.28}
                    onChange={(e) => setDnlFormData({ ...dnlFormData, incidenzaManodoperaPerc: parseFloat(e.target.value) || 14.28 })}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ore Lavorative Stimate</label>
                  <input
                    type="number"
                    placeholder="Es. 600"
                    value={dnlFormData.oreLavorativeStimate || 0}
                    onChange={(e) => setDnlFormData({ ...dnlFormData, oreLavorativeStimate: parseInt(e.target.value, 10) || 0 })}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">N. Presunto Operai Impiegati</label>
                  <input
                    type="number"
                    value={dnlFormData.numeroOperaiStimati || personaleAssegnato.length || 0}
                    onChange={(e) => setDnlFormData({ ...dnlFormData, numeroOperaiStimati: parseInt(e.target.value, 10) || 0 })}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* RIQUADRO 5: Assegnazione Personale & Maestranze alla DNL */}
          <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl">
                  <Icons.Personale />
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">
                    Maestranze & Lavoratori Assegnati al Cantiere ({personaleAssegnato.length} selezionati)
                  </h4>
                  <p className="text-[10px] text-slate-400 font-medium">
                    Seleziona gli operai della tua azienda impiegati in questo cantiere per includerli automaticamente nel file e nella scheda DNL.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const allIds = personaleList.filter(p => p.inForza).map(p => p.id);
                    setDnlFormData(prev => ({ ...prev, lavoratoriAssegnatiIds: allIds, numeroOperaiStimati: allIds.length }));
                  }}
                  className="px-3 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-[10px] font-bold uppercase transition-all"
                >
                  Seleziona Tutti in Forza
                </button>
                <button
                  type="button"
                  onClick={() => setDnlFormData(prev => ({ ...prev, lavoratoriAssegnatiIds: [], numeroOperaiStimati: 0 }))}
                  className="px-3 py-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-[10px] font-bold uppercase transition-all"
                >
                  Deseleziona
                </button>
              </div>
            </div>

            {personaleList.length === 0 ? (
              <p className="text-xs text-slate-400 italic">Nessun dipendente registrato nell'anagrafica personale.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {personaleList.map(p => {
                  const isSelected = (dnlFormData.lavoratoriAssegnatiIds || []).includes(p.id);
                  return (
                    <div
                      key={p.id}
                      onClick={() => toggleWorkerAssignment(p.id)}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        isSelected
                          ? 'bg-blue-50/80 dark:bg-blue-950/40 border-blue-500 text-blue-950 dark:text-blue-200 shadow-xs'
                          : 'bg-slate-50/60 dark:bg-slate-800/40 border-slate-200/70 dark:border-slate-700/70 hover:border-slate-400 opacity-75 hover:opacity-100'
                      }`}
                    >
                      <div className="min-w-0 flex items-center gap-2.5">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}} // gestito da onClick contenitore
                          className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 pointer-events-none"
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-black truncate">{p.cognome} {p.nome}</p>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                            {p.ruolo} • <span className="capitalize">{p.categoria}</span>
                          </p>
                          <p className="text-[9px] text-slate-400 font-mono truncate">
                            CF: {p.codiceFiscale || 'N.D.'}
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0 text-[9px]">
                        <span className={`px-2 py-0.5 rounded-md font-bold ${p.inForza ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300' : 'bg-red-100 text-red-700'}`}>
                          {p.inForza ? 'In Forza' : 'Cessato'}
                        </span>
                        {p.dataAssunzione && (
                          <p className="text-slate-400 mt-1">Assunto: {p.dataAssunzione}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* RIQUADRO 6: Subappalti & Note Aggiuntive */}
          <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
              <span className="text-base">🤝</span>
              <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                Riquadro 6: Subappalti & Note Speciali
              </h4>
            </div>

            <div className="space-y-4">
              {selectedCantiere.subappalti.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ditte in subappalto dichiarate per il cantiere:</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {selectedCantiere.subappalti.map(s => (
                      <div key={s.id} className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
                        <p className="font-black text-slate-800 dark:text-slate-200">{s.azienda}</p>
                        <p className="text-[10px] text-slate-400">{s.lavoro}</p>
                        <p className="text-blue-600 font-bold mt-1">€ {s.prezzoOriginale.toLocaleString('it-IT')}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">Nessun subappalto inserito per questo cantiere. Eventuali subappalti aggiunti nella scheda cantiere appariranno qui automaticamente.</p>
              )}

              <div className="space-y-1">
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
    </div>
  );
};

export default ContrattiDnlSection;
