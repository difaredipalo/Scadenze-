import React, { useState } from 'react';
import {
  PosDocument,
  Cantiere,
  Personale,
  AppSettings,
  PosAttivitaTemplate,
  PosStato,
} from '../../types';
import { createNewPosFromCantiere } from '../../data/posDefaultData';
import { auditPosDocument } from './posAuditHelper';
import { PosDocumentPrintView } from './PosDocumentPrintView';
import { PosEditorModal } from './PosEditorModal';
import { PosWizardModal } from './PosWizardModal';
import { PosAuditModal } from './PosAuditModal';
import { PosTemplateLibraryModal } from './PosTemplateLibraryModal';
import { Icons } from '../../constants';
import { PosDatiImpresa, PosAttrezzaturaItem, PosOperaProvvisionaleItem, PosSostanzaItem } from '../../types';

interface PosSectionProps {
  posList: PosDocument[];
  cantieri: Cantiere[];
  personale: Personale[];
  settings: AppSettings;
  customTemplates?: PosAttivitaTemplate[];
  customAttrezzature?: PosAttrezzaturaItem[];
  customOpere?: PosOperaProvvisionaleItem[];
  customSostanze?: PosSostanzaItem[];
  onUpdatePosList: (newList: PosDocument[]) => void;
  onUpdateCustomTemplates?: (templates: PosAttivitaTemplate[]) => void;
  onUpdateCustomAttrezzature?: (items: PosAttrezzaturaItem[]) => void;
  onUpdateCustomOpere?: (items: PosOperaProvvisionaleItem[]) => void;
  onUpdateCustomSostanze?: (items: PosSostanzaItem[]) => void;
  onUpdateSettings?: (updatedSettings: AppSettings) => void;
}

export const PosSection: React.FC<PosSectionProps> = ({
  posList = [],
  cantieri = [],
  personale = [],
  settings,
  customTemplates = [],
  customAttrezzature = [],
  customOpere = [],
  customSostanze = [],
  onUpdatePosList,
  onUpdateCustomTemplates,
  onUpdateCustomAttrezzature,
  onUpdateCustomOpere,
  onUpdateCustomSostanze,
  onUpdateSettings,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStato, setFilterStato] = useState<string>('tutti');

  const handleSaveAziendaDefaults = (dati: PosDatiImpresa) => {
    if (onUpdateSettings) {
      const updatedSettings: AppSettings = {
        ...settings,
        nomeAzienda: dati.ragioneSociale || settings.nomeAzienda,
        indirizzoSede: dati.sedeLegale || settings.indirizzoSede,
        partitaIva: dati.partitaIva || settings.partitaIva,
        codiceFiscaleAzienda: dati.codiceFiscale || settings.codiceFiscaleAzienda,
        telefonoAzienda: dati.telefono || settings.telefonoAzienda,
        pec: dati.pec || settings.pec,
        datoreDiLavoro: dati.datoreDiLavoro || settings.datoreDiLavoro,
        rspp: dati.rspp || settings.rspp,
        rls: dati.rls || settings.rls,
        medicoCompetente: dati.medicoCompetente || settings.medicoCompetente,
        prepostoDefault: dati.prepostoCantiere || settings.prepostoDefault,
        addettoPrimoSoccorsoDefault: dati.addettoPrimoSoccorso || settings.addettoPrimoSoccorsoDefault,
        addettoAntincendioDefault: dati.addettoAntincendio || settings.addettoAntincendioDefault,
        posDefaultDatiImpresa: {
          ...settings.posDefaultDatiImpresa,
          ...dati,
        },
      };
      onUpdateSettings(updatedSettings);
    }
  };

  // Modals state
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [editingPos, setEditingPos] = useState<PosDocument | null>(null);
  const [printingPos, setPrintingPos] = useState<PosDocument | null>(null);
  const [auditingPos, setAuditingPos] = useState<PosDocument | null>(null);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [posToDelete, setPosToDelete] = useState<PosDocument | null>(null);

  // Filtered POS list
  const filteredList = posList.filter(p => {
    const itemStato = p.stato === 'emesso' ? 'emesso' : 'bozza';
    const matchesFilter = filterStato === 'tutti' || itemStato === filterStato;
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      p.codice.toLowerCase().includes(term) ||
      p.titolo.toLowerCase().includes(term) ||
      p.datiCantiere.nome.toLowerCase().includes(term) ||
      p.datiCantiere.committente.toLowerCase().includes(term) ||
      p.redattore.toLowerCase().includes(term);
    return matchesFilter && matchesSearch;
  });

  // KPI Stats
  const countTotali = posList.length;
  const countBozza = posList.filter(p => p.stato !== 'emesso').length;

  // Actions
  const handleSavePos = (savedPos: PosDocument) => {
    const exists = posList.some(p => p.id === savedPos.id);
    let updated: PosDocument[];
    if (exists) {
      updated = posList.map(p => p.id === savedPos.id ? savedPos : p);
    } else {
      updated = [savedPos, ...posList];
    }
    onUpdatePosList(updated);
    setEditingPos(null);
    setIsWizardOpen(false);
  };

  const handleUpdatePosLive = (savedPos: PosDocument) => {
    const exists = posList.some(p => p.id === savedPos.id);
    let updated: PosDocument[];
    if (exists) {
      updated = posList.map(p => p.id === savedPos.id ? savedPos : p);
    } else {
      updated = [savedPos, ...posList];
    }
    onUpdatePosList(updated);
    setEditingPos(savedPos);
  };

  const handleDeleteClick = (pos: PosDocument, e: React.MouseEvent) => {
    e.stopPropagation();
    setPosToDelete(pos);
  };

  const handleConfirmDelete = () => {
    if (posToDelete) {
      const updated = posList.filter(p => p.id !== posToDelete.id);
      onUpdatePosList(updated);
      setPosToDelete(null);
    }
  };

  const handleDuplicatePos = (original: PosDocument, e: React.MouseEvent) => {
    e.stopPropagation();
    const progressivo = Math.floor(100 + Math.random() * 900);
    const anno = new Date().getFullYear();
    const duplicated: PosDocument = {
      ...original,
      id: Math.random().toString(),
      codice: `POS-${anno}-${progressivo}`,
      titolo: `${original.titolo} (Copia)`,
      versione: '00',
      stato: 'bozza',
      dataRedazione: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    onUpdatePosList([duplicated, ...posList]);
  };

  const handleCreateStandard = () => {
    const cantiereBase = cantieri[0] || {
      id: 'c_base',
      nome: 'Nuovo Cantiere',
      indirizzo: 'Indirizzo da completare',
      cliente: 'Committente da indicare',
      dataInizio: new Date().toISOString().split('T')[0],
      scadenza: new Date(Date.now() + 180 * 86400000).toISOString().split('T')[0],
      importoTotale: 0,
      pagato: 0,
      stato: 'aperto',
      subappalti: [],
      note: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const newPos = createNewPosFromCantiere(cantiereBase, settings, personale);
    setEditingPos(newPos);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-[10px] font-black uppercase tracking-widest">
              D.Lgs. 81/2008 Titolo IV & Allegato XV
            </span>
            <span className="text-slate-400 font-bold text-xs">• Cantieri Temporanei o Mobili</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
            Piani Operativi di Sicurezza (POS)
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-2xl mt-0.5">
            Crea, compila e stampa i POS ufficiali attingendo direttamente ai dati di cantieri, personale e mezzi già presenti nel gestionale.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setIsLibraryOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-black uppercase tracking-wider transition-all"
          >
            <span>📚</span> <span>Libreria Attività</span>
          </button>

          <button
            onClick={handleCreateStandard}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-black uppercase tracking-wider transition-all"
          >
            <span>+</span> <span>Nuovo POS</span>
          </button>

          <button
            onClick={() => setIsWizardOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black uppercase tracking-wider shadow-md shadow-blue-600/20 transition-all"
          >
            <span>⚡</span> <span>Nuovo POS Rapido</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div
          onClick={() => setFilterStato('tutti')}
          className={`p-4 rounded-2xl border transition-all shadow-sm cursor-pointer ${
            filterStato === 'tutti'
              ? 'bg-blue-50/60 dark:bg-blue-950/30 border-blue-500 dark:border-blue-500'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
          }`}
        >
          <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Totale POS</span>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">{countTotali}</div>
          <span className="text-[11px] text-slate-500 font-medium">Documenti registrati</span>
        </div>

        <div
          onClick={() => setFilterStato('bozza')}
          className={`p-4 rounded-2xl border transition-all shadow-sm cursor-pointer ${
            filterStato === 'bozza'
              ? 'bg-amber-50/60 dark:bg-amber-950/30 border-amber-500 dark:border-amber-500'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
          }`}
        >
          <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Bozze</span>
          <div className="text-2xl font-black text-amber-500 mt-1">{countBozza}</div>
          <span className="text-[11px] text-slate-500 font-medium">In corso di redazione</span>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div className="relative flex-1 max-w-md">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs">🔍</span>
          <input
            type="text"
            placeholder="Cerca per cantiere, codice POS, committente o redattore..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto text-[11px] font-bold scrollbar-none">
          {[
            { key: 'tutti', label: 'Totale POS' },
            { key: 'bozza', label: 'Bozze' },
            { key: 'emesso', label: 'Emessi' },
          ].map(f => (
            <button
              key={f.key}
              onClick={() => setFilterStato(f.key)}
              className={`px-4 py-2 rounded-xl whitespace-nowrap transition-colors uppercase tracking-wider text-[10px] ${
                filterStato === f.key
                  ? 'bg-blue-600 text-white font-black shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* POS List Grid */}
      {filteredList.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
          <div className="w-16 h-16 rounded-3xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center text-2xl mx-auto mb-4">
            🛡️
          </div>
          <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-wide">
            Nessun Piano Operativo di Sicurezza Trovato
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1 mb-6">
            Inizia generando un nuovo POS con la procedura rapida: i dati dell'impresa, del cantiere e del personale verranno compilati all'istante.
          </p>
          <button
            onClick={() => setIsWizardOpen(true)}
            className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black uppercase tracking-wider shadow-md shadow-blue-600/20 transition-all inline-flex items-center gap-2"
          >
            <span>⚡</span> <span>Avvia Nuovo POS Rapido</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredList.map(posItem => {
            const auditResult = auditPosDocument(posItem);
            return (
              <div
                key={posItem.id}
                onClick={() => setEditingPos(posItem)}
                className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 hover:border-blue-500/50 dark:hover:border-blue-500/50 transition-all shadow-sm hover:shadow-md cursor-pointer group flex flex-col justify-between"
              >
                <div>
                  {/* Top Bar inside Card */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-black px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {posItem.codice}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">
                        Rev. {posItem.versione}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                        posItem.stato === 'emesso'
                          ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300'
                          : 'bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300'
                      }`}>
                        {posItem.stato === 'emesso' ? 'Emesso' : 'Bozza'}
                      </span>
                    </div>

                    {/* Audit Indicator */}
                    <div
                      onClick={e => {
                        e.stopPropagation();
                        setAuditingPos(posItem);
                      }}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-50 dark:bg-slate-800/80 hover:bg-blue-50 dark:hover:bg-blue-950/40 border border-slate-200 dark:border-slate-700 text-[11px] font-black transition-colors"
                      title="Apri Controllo Conformità POS"
                    >
                      <span>{auditResult.statoGlobale === 'completo' ? '🟢' : auditResult.statoGlobale === 'da_completare' ? '🟡' : '🔴'}</span>
                      <span className="text-slate-800 dark:text-slate-200">{auditResult.percentualeCompletamento}%</span>
                    </div>
                  </div>

                  {/* Cantiere & Titolo */}
                  <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tight group-hover:text-blue-600 transition-colors line-clamp-1">
                    {posItem.datiCantiere.nome || posItem.titolo}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                    📍 {posItem.datiCantiere.indirizzo} • Committente: {posItem.datiCantiere.committente}
                  </p>

                  {/* Key Stats Row */}
                  <div className="grid grid-cols-3 gap-2 my-4 py-2.5 px-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-[11px]">
                    <div>
                      <span className="text-slate-400 block text-[9px] font-black uppercase">Lavoratori</span>
                      <span className="font-black text-slate-800 dark:text-slate-200">👷 {posItem.lavoratori.length} Addetti</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[9px] font-black uppercase">Lavorazioni</span>
                      <span className="font-black text-slate-800 dark:text-slate-200">🔨 {posItem.attivita.length} Fasi</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[9px] font-black uppercase">DPI Specifici</span>
                      <span className="font-black text-slate-800 dark:text-slate-200">🦺 {posItem.dpiRichiesti.length} Prescritti</span>
                    </div>
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 text-xs">
                  <div className="text-[11px] text-slate-400">
                    <span>Redazione: {posItem.dataRedazione}</span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        setAuditingPos(posItem);
                      }}
                      className="p-2 rounded-xl text-slate-600 dark:text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors"
                      title="Controllo Normativo POS (Semafori)"
                    >
                      ⚖️
                    </button>

                    <button
                      onClick={e => {
                        e.stopPropagation();
                        setPrintingPos(posItem);
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 hover:bg-blue-600 hover:text-white transition-all text-xs font-black uppercase tracking-wider"
                      title="Stampa Ufficiale POS (A4 Verticale con Tutte le Immagini)"
                    >
                      <span>🖨️</span>
                      <span>Stampa A4</span>
                    </button>

                    <button
                      onClick={e => handleDuplicatePos(posItem, e)}
                      className="p-2 rounded-xl text-slate-600 dark:text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors"
                      title="Duplica POS per altro cantiere"
                    >
                      📋
                    </button>

                    <button
                      onClick={e => handleDeleteClick(posItem, e)}
                      className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                      title="Elimina POS"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODALS */}
      {isWizardOpen && (
        <PosWizardModal
          cantieri={cantieri}
          personale={personale}
          settings={settings}
          customTemplates={customTemplates}
          onSave={handleSavePos}
          onClose={() => setIsWizardOpen(false)}
          onSaveAziendaDefaults={handleSaveAziendaDefaults}
        />
      )}

      {editingPos && (
        <PosEditorModal
          pos={editingPos}
          cantieri={cantieri}
          personaleList={personale}
          settings={settings}
          customTemplates={customTemplates}
          onSave={handleSavePos}
          onClose={() => setEditingPos(null)}
          onOpenPrint={p => setPrintingPos(p)}
          onSaveAziendaDefaults={handleSaveAziendaDefaults}
          onUpdatePosLive={handleUpdatePosLive}
        />
      )}

      {printingPos && (
        <PosDocumentPrintView
          pos={printingPos}
          onClose={() => setPrintingPos(null)}
        />
      )}

      {auditingPos && (
        <PosAuditModal
          pos={auditingPos}
          onClose={() => setAuditingPos(null)}
          onEditSection={() => {
            setEditingPos(auditingPos);
            setAuditingPos(null);
          }}
        />
      )}

      {isLibraryOpen && (
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
          onClose={() => setIsLibraryOpen(false)}
        />
      )}

      {/* MODALE CONFERMA ELIMINAZIONE POS */}
      {posToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 max-w-md w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 flex items-center justify-center text-2xl font-black">
                🗑️
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tight">
                  Elimina Piano Operativo
                </h3>
                <p className="text-xs text-slate-500 font-bold">
                  {posToDelete.codice} • Rev. {posToDelete.versione}
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Sei sicuro di voler eliminare definitivamente il POS del cantiere <strong className="text-slate-900 dark:text-white">"{posToDelete.datiCantiere.nome || posToDelete.titolo}"</strong>? L'operazione rimuoverà il documento dall'elenco e dal database.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setPosToDelete(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all"
              >
                Annulla
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-rose-600/20 transition-all active:scale-95"
              >
                Elimina Definitivamente
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
