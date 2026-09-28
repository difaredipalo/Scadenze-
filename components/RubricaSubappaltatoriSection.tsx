import React, { useState, useMemo } from 'react';
import { SubappaltatoreRubrica, Cantiere, Subappalto } from '../types';
import { Icons } from '../constants';
import { SETTORI_SUBAPPALTO, getDurcStatus, extractSubappaltatoriFromCantieri } from '../data/defaultSubappaltatori';
import { formatDateItalian } from '../utils/dateUtils';

interface RubricaSubappaltatoriSectionProps {
  rubrica: SubappaltatoreRubrica[];
  cantieri: Cantiere[];
  onAddSubappaltatore: (sub: SubappaltatoreRubrica) => void;
  onUpdateSubappaltatore: (sub: SubappaltatoreRubrica) => void;
  onDeleteSubappaltatore: (id: string) => void;
  onBatchUpdateRubrica: (updatedList: SubappaltatoreRubrica[]) => void;
  onAssignToCantiere: (cantiereId: string, subappalto: Subappalto) => void;
  onNavigateToContratti?: (cantiereId?: string, subappaltoId?: string) => void;
}

export const RubricaSubappaltatoriSection: React.FC<RubricaSubappaltatoriSectionProps> = ({
  rubrica,
  cantieri,
  onAddSubappaltatore,
  onUpdateSubappaltatore,
  onDeleteSubappaltatore,
  onBatchUpdateRubrica,
  onAssignToCantiere,
  onNavigateToContratti,
}) => {
  // Filtri e ricerca
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSettore, setSelectedSettore] = useState<string>('tutti');
  const [durcFilter, setDurcFilter] = useState<'tutti' | 'valido' | 'in_scadenza' | 'scaduto' | 'mancante'>('tutti');
  const [sortBy, setSortBy] = useState<'nome' | 'durc' | 'cantieri' | 'recenti'>('nome');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Modali
  const [showAddEditModal, setShowAddEditModal] = useState(false);
  const [editingSub, setEditingSub] = useState<SubappaltatoreRubrica | null>(null);
  const [subForm, setSubForm] = useState<Partial<SubappaltatoreRubrica>>({});

  // Modale Assegnazione Rapida
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [subToAssign, setSubToAssign] = useState<SubappaltatoreRubrica | null>(null);
  const [assignCantiereId, setAssignCantiereId] = useState<string>('');
  const [assignLavoro, setAssignLavoro] = useState<string>('');
  const [assignPrezzo, setAssignPrezzo] = useState<number>(0);
  const [assignMaggiorazione, setAssignMaggiorazione] = useState<number>(10);
  const [assignOneri, setAssignOneri] = useState<number>(0);

  // Modale Conferma Eliminazione
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [subToDelete, setSubToDelete] = useState<SubappaltatoreRubrica | null>(null);

  // Messaggio toast temporaneo
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Mappa dei cantieri per ciascun subappaltatore (matching per ID o nome)
  const assignmentsMap = useMemo(() => {
    const map: Record<string, { cantiere: Cantiere; subappalto: Subappalto }[]> = {};

    rubrica.forEach(sub => {
      map[sub.id] = [];
    });

    cantieri.forEach(cantiere => {
      (cantiere.subappalti || []).forEach(sub => {
        // match per ID collegato o nome azienda normalizzato
        const matched = rubrica.find(
          r => (sub.subappaltatoreId && r.id === sub.subappaltatoreId) ||
               (sub.azienda && r.ragioneSociale.trim().toLowerCase() === sub.azienda.trim().toLowerCase())
        );
        if (matched) {
          if (!map[matched.id]) map[matched.id] = [];
          map[matched.id].push({ cantiere, subappalto: sub });
        }
      });
    });

    return map;
  }, [rubrica, cantieri]);

  // Statistiche KPI generali
  const stats = useMemo(() => {
    const total = rubrica.length;
    let durcValidi = 0;
    let durcInScadenza = 0;
    let durcScaduti = 0;
    let durcMancanti = 0;

    rubrica.forEach(s => {
      const status = getDurcStatus(s.durcScadenza);
      if (status.stato === 'valido') durcValidi++;
      else if (status.stato === 'in_scadenza') durcInScadenza++;
      else if (status.stato === 'scaduto') durcScaduti++;
      else durcMancanti++;
    });

    // Numero cantieri unici coinvolti
    const activeCantieriIds = new Set<string>();
    let totalImportoAffidato = 0;

    (Object.values(assignmentsMap) as { cantiere: Cantiere; subappalto: Subappalto }[][]).forEach(list => {
      list.forEach(item => {
        activeCantieriIds.add(item.cantiere.id);
        const subTot = (item.subappalto.prezzoOriginale || 0) * (1 + (item.subappalto.maggiorazione || 0) / 100);
        totalImportoAffidato += subTot;
      });
    });

    return {
      total,
      durcValidi,
      durcInScadenza,
      durcScaduti,
      durcMancanti,
      cantieriCoinvolti: activeCantieriIds.size,
      totalImportoAffidato,
    };
  }, [rubrica, assignmentsMap]);

  // Sincronizza dai cantieri esistenti
  const handleSyncFromCantieri = () => {
    const { updatedRubrica, addedCount } = extractSubappaltatoriFromCantieri(cantieri, rubrica);
    if (addedCount > 0) {
      onBatchUpdateRubrica(updatedRubrica);
      showToast(`✅ Importati con successo ${addedCount} nuovi subappaltatori dai cantieri!`);
    } else {
      showToast(`ℹ️ Nessun nuovo subappaltatore trovato. Tutte le ditte dei cantieri sono già registrate in Rubrica.`);
    }
  };

  // Filtraggio e Ordinamento lista
  const filteredRubrica = useMemo(() => {
    return rubrica
      .filter(item => {
        // Ricerca testuale
        if (searchTerm.trim()) {
          const q = searchTerm.toLowerCase();
          const matchName = item.ragioneSociale.toLowerCase().includes(q);
          const matchPiva = item.partitaIva?.toLowerCase().includes(q);
          const matchCf = item.codiceFiscale?.toLowerCase().includes(q);
          const matchSettore = item.settore.toLowerCase().includes(q);
          const matchCitta = item.citta?.toLowerCase().includes(q);
          const matchReferente = item.referenteContatto?.toLowerCase().includes(q) || item.rappresentanteLegale?.toLowerCase().includes(q);
          const matchNote = item.note?.toLowerCase().includes(q);
          if (!matchName && !matchPiva && !matchCf && !matchSettore && !matchCitta && !matchReferente && !matchNote) {
            return false;
          }
        }

        // Filtro settore
        if (selectedSettore !== 'tutti' && item.settore !== selectedSettore) {
          return false;
        }

        // Filtro DURC
        if (durcFilter !== 'tutti') {
          const status = getDurcStatus(item.durcScadenza);
          if (status.stato !== durcFilter) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'nome') {
          return a.ragioneSociale.localeCompare(b.ragioneSociale, 'it');
        }
        if (sortBy === 'durc') {
          const dateA = a.durcScadenza ? new Date(a.durcScadenza).getTime() : Infinity;
          const dateB = b.durcScadenza ? new Date(b.durcScadenza).getTime() : Infinity;
          return dateA - dateB;
        }
        if (sortBy === 'cantieri') {
          const countA = assignmentsMap[a.id]?.length || 0;
          const countB = assignmentsMap[b.id]?.length || 0;
          return countB - countA;
        }
        if (sortBy === 'recenti') {
          const dateA = a.dataCreazione ? new Date(a.dataCreazione).getTime() : 0;
          const dateB = b.dataCreazione ? new Date(b.dataCreazione).getTime() : 0;
          return dateB - dateA;
        }
        return 0;
      });
  }, [rubrica, searchTerm, selectedSettore, durcFilter, sortBy, assignmentsMap]);

  // Apri Modale Nuovo
  const handleOpenNewModal = () => {
    setEditingSub(null);
    setSubForm({
      ragioneSociale: '',
      settore: 'Opere Murarie & Strutture',
      partitaIva: '',
      codiceFiscale: '',
      sedeLegale: '',
      citta: '',
      cap: '',
      provincia: '',
      rappresentanteLegale: '',
      referenteContatto: '',
      telefono: '',
      email: '',
      pec: '',
      iban: '',
      banca: '',
      maggiorazioneDefault: 10,
      durcScadenza: '',
      visuraScadenza: '',
      rcTerziScadenza: '',
      note: '',
      rating: 5,
    });
    setShowAddEditModal(true);
  };

  // Apri Modale Modifica
  const handleOpenEditModal = (sub: SubappaltatoreRubrica) => {
    setEditingSub(sub);
    setSubForm({ ...sub });
    setShowAddEditModal(true);
  };

  // Salva Form Subappaltatore
  const handleSaveSubForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subForm.ragioneSociale?.trim()) {
      alert('Inserire la Ragione Sociale del subappaltatore.');
      return;
    }

    if (editingSub) {
      const updated: SubappaltatoreRubrica = {
        ...editingSub,
        ...subForm,
        ragioneSociale: subForm.ragioneSociale.trim(),
        settore: subForm.settore || 'Altro / Speciale',
      };
      onUpdateSubappaltatore(updated);
      showToast(`✅ Ditta "${updated.ragioneSociale}" aggiornata con successo!`);
    } else {
      const newSub: SubappaltatoreRubrica = {
        id: `sub-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        ragioneSociale: subForm.ragioneSociale.trim(),
        settore: subForm.settore || 'Altro / Speciale',
        partitaIva: subForm.partitaIva || '',
        codiceFiscale: subForm.codiceFiscale || '',
        sedeLegale: subForm.sedeLegale || '',
        citta: subForm.citta || '',
        cap: subForm.cap || '',
        provincia: subForm.provincia || '',
        rappresentanteLegale: subForm.rappresentanteLegale || '',
        referenteContatto: subForm.referenteContatto || '',
        telefono: subForm.telefono || '',
        email: subForm.email || '',
        pec: subForm.pec || '',
        iban: subForm.iban || '',
        banca: subForm.banca || '',
        maggiorazioneDefault: subForm.maggiorazioneDefault !== undefined ? Number(subForm.maggiorazioneDefault) : 10,
        durcScadenza: subForm.durcScadenza || '',
        visuraScadenza: subForm.visuraScadenza || '',
        rcTerziScadenza: subForm.rcTerziScadenza || '',
        note: subForm.note || '',
        rating: subForm.rating || 5,
        dataCreazione: new Date().toISOString().split('T')[0],
      };
      onAddSubappaltatore(newSub);
      showToast(`🎉 Ditta "${newSub.ragioneSociale}" aggiunta alla Rubrica!`);
    }

    setShowAddEditModal(false);
  };

  // Conferma Eliminazione
  const handleConfirmDelete = () => {
    if (subToDelete) {
      onDeleteSubappaltatore(subToDelete.id);
      showToast(`🗑️ Subappaltatore "${subToDelete.ragioneSociale}" rimosso dalla rubrica.`);
      setSubToDelete(null);
      setShowDeleteModal(false);
    }
  };

  // Apri Modale Assegna a Cantiere
  const handleOpenAssignModal = (sub: SubappaltatoreRubrica) => {
    setSubToAssign(sub);
    setAssignCantiereId(cantieri[0]?.id || '');
    setAssignLavoro(sub.settore || 'Lavori Specialistici');
    setAssignPrezzo(5000);
    setAssignMaggiorazione(sub.maggiorazioneDefault || 10);
    setAssignOneri(0);
    setShowAssignModal(true);
  };

  // Salva Assegnazione a Cantiere
  const handleConfirmAssign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subToAssign || !assignCantiereId) {
      alert('Seleziona un cantiere.');
      return;
    }

    const targetCantiere = cantieri.find(c => c.id === assignCantiereId);
    if (!targetCantiere) return;

    const newSubappalto: Subappalto = {
      id: `sub-cantiere-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      azienda: subToAssign.ragioneSociale,
      lavoro: assignLavoro || subToAssign.settore,
      prezzoOriginale: Number(assignPrezzo) || 0,
      maggiorazione: Number(assignMaggiorazione) || 0,
      partitaIva: subToAssign.partitaIva || '',
      email: subToAssign.email || '',
      pec: subToAssign.pec || '',
      sedeLegale: subToAssign.sedeLegale || '',
      rappresentanteLegale: subToAssign.rappresentanteLegale || '',
      codiceFiscale: subToAssign.codiceFiscale || '',
      telefono: subToAssign.telefono || '',
      subappaltatoreId: subToAssign.id,
      durcScadenza: subToAssign.durcScadenza || '',
      iban: subToAssign.iban || '',
      oneriSicurezza: Number(assignOneri) || 0,
    };

    onAssignToCantiere(assignCantiereId, newSubappalto);
    setShowAssignModal(false);
    showToast(`⚡ "${subToAssign.ragioneSociale}" assegnato con successo al cantiere "${targetCantiere.nome}"!`);
  };

  // Esportazione CSV
  const handleExportCSV = () => {
    if (rubrica.length === 0) {
      alert('Nessun subappaltatore da esportare.');
      return;
    }

    const headers = [
      'Ragione Sociale',
      'Settore',
      'Partita IVA',
      'Codice Fiscale',
      'Rappresentante Legale',
      'Referente',
      'Telefono',
      'Email',
      'PEC',
      'Sede Legale',
      'Città',
      'CAP',
      'Provincia',
      'Scadenza DURC',
      'Scadenza Visura',
      'Scadenza RCT',
      'Maggiorazione %',
      'IBAN',
      'Banca',
      'Note',
    ];

    const rows = rubrica.map(sub => [
      `"${(sub.ragioneSociale || '').replace(/"/g, '""')}"`,
      `"${(sub.settore || '').replace(/"/g, '""')}"`,
      `"${sub.partitaIva || ''}"`,
      `"${sub.codiceFiscale || ''}"`,
      `"${(sub.rappresentanteLegale || '').replace(/"/g, '""')}"`,
      `"${(sub.referenteContatto || '').replace(/"/g, '""')}"`,
      `"${sub.telefono || ''}"`,
      `"${sub.email || ''}"`,
      `"${sub.pec || ''}"`,
      `"${(sub.sedeLegale || '').replace(/"/g, '""')}"`,
      `"${sub.citta || ''}"`,
      `"${sub.cap || ''}"`,
      `"${sub.provincia || ''}"`,
      `"${sub.durcScadenza || ''}"`,
      `"${sub.visuraScadenza || ''}"`,
      `"${sub.rcTerziScadenza || ''}"`,
      `"${sub.maggiorazioneDefault || 0}"`,
      `"${sub.iban || ''}"`,
      `"${sub.banca || ''}"`,
      `"${(sub.note || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(';'), ...rows.map(e => e.join(';'))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Rubrica_Subappaltatori_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('📥 Rubrica esportata in formato CSV per Excel!');
  };

  // Backup JSON
  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(rubrica, null, 2));
    const link = document.createElement('a');
    link.setAttribute('href', dataStr);
    link.setAttribute('download', `rubrica_subappaltatori_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('💾 Backup JSON salvato con successo!');
  };

  // Copia negli appunti
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    showToast(`📋 ${label} copiato negli appunti: ${text}`);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300 pb-12">
      {/* Toast Notifiche */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl border border-slate-700 text-xs font-bold flex items-center gap-3 animate-in slide-in-from-bottom-5">
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="text-slate-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Header Principale */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 text-white p-6 md:p-8 rounded-[2.5rem] shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-[10px] font-black uppercase tracking-widest border border-blue-400/20">
            <span>📒 Anagrafica Subappalti</span>
            <span>•</span>
            <span>Riutilizzo 1-Click nei Cantieri</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-white flex items-center gap-3">
            Rubrica Subappaltatori
          </h2>
          <p className="text-xs md:text-sm text-slate-300 max-w-2xl font-normal leading-relaxed">
            Gestisci in un unico archivio centrale le ditte subappaltatrici di fiducia, monitora le scadenze DURC e polizze, e importale all'istante in qualunque cantiere e contratto senza riscrivere i dati.
          </p>
        </div>

        <div className="relative z-10 flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleSyncFromCantieri}
            title="Estrae e importa automaticamente eventuali subappaltatori già scritti nei cantieri"
            className="px-4 py-3 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 backdrop-blur-xs hover:scale-105 active:scale-95"
          >
            <span>🔄</span> Sincronizza dai Cantieri
          </button>

          <button
            onClick={handleOpenNewModal}
            className="px-5 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-2xl text-xs font-black uppercase tracking-wider transition-all shadow-lg shadow-blue-500/30 flex items-center gap-2 hover:scale-105 active:scale-95"
          >
            <Icons.Plus /> NUOVO SUBAPPALTATORE
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Totale Subappaltatori */}
        <div className="p-5 bg-white dark:bg-slate-900 rounded-3xl border-2 border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Ditte in Rubrica</p>
            <p className="text-3xl font-black text-slate-900 dark:text-white mt-1">{stats.total}</p>
            <p className="text-[11px] text-blue-600 font-semibold mt-1">Disponibili per tutti i cantieri</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center text-xl">
            🏢
          </div>
        </div>

        {/* Card 2: DURC Status */}
        <div className="p-5 bg-white dark:bg-slate-900 rounded-3xl border-2 border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Conformità DURC</p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-emerald-600">{stats.durcValidi}</span>
              <span className="text-xs text-slate-400 font-bold">validi</span>
              {stats.durcInScadenza > 0 && (
                <span className="px-2 py-0.5 rounded-lg text-[10px] font-black bg-amber-100 text-amber-800">
                  {stats.durcInScadenza} in scadenza
                </span>
              )}
              {stats.durcScaduti > 0 && (
                <span className="px-2 py-0.5 rounded-lg text-[10px] font-black bg-rose-100 text-rose-800 animate-pulse">
                  {stats.durcScaduti} scaduti
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 font-medium mt-1">
              {stats.durcScaduti > 0 ? '⚠️ Richiedere DURC aggiornato' : 'Regolarità contributiva verificata'}
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center text-xl">
            🛡️
          </div>
        </div>

        {/* Card 3: Cantieri con Subappalti */}
        <div className="p-5 bg-white dark:bg-slate-900 rounded-3xl border-2 border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Cantieri Attivi</p>
            <p className="text-3xl font-black text-slate-900 dark:text-white mt-1">{stats.cantieriCoinvolti}</p>
            <p className="text-[11px] text-indigo-600 font-semibold mt-1">Con subappalti operativi</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 flex items-center justify-center text-xl">
            🏗️
          </div>
        </div>

        {/* Card 4: Importo Totale Affidato */}
        <div className="p-5 bg-white dark:bg-slate-900 rounded-3xl border-2 border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Totale Lavori Affidati</p>
            <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
              € {stats.totalImportoAffidato.toLocaleString('it-IT', { maximumFractionDigits: 0 })}
            </p>
            <p className="text-[11px] text-slate-500 font-medium mt-1">Ivato/Maggiorato complessivo</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center text-xl">
            💶
          </div>
        </div>
      </div>

      {/* Toolbar di Ricerca, Filtro e Azioni */}
      <div className="p-5 bg-white dark:bg-slate-900 rounded-3xl border-2 border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Input Ricerca */}
          <div className="relative flex-1">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
              <Icons.Search />
            </span>
            <input
              type="text"
              placeholder="Cerca per Ragione Sociale, P.IVA, Città, Referente, Settore..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800/80 border-2 border-slate-100 dark:border-slate-700 rounded-2xl text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-blue-500 transition-all"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            )}
          </div>

          {/* Filtro DURC */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 shrink-0">
            <span className="text-[10px] font-black uppercase text-slate-400 mr-1">DURC:</span>
            {[
              { id: 'tutti', label: 'Tutti' },
              { id: 'valido', label: '🟢 Regolari' },
              { id: 'in_scadenza', label: '🟡 In Scadenza' },
              { id: 'scaduto', label: '🔴 Scaduti' },
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setDurcFilter(f.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                  durcFilter === f.id
                    ? 'bg-slate-900 text-white dark:bg-blue-600'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Ordinamento & Switch Vista */}
          <div className="flex items-center gap-2 shrink-0">
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 outline-none"
            >
              <option value="nome">Ordina: Nome (A-Z)</option>
              <option value="durc">Ordina: Scadenza DURC</option>
              <option value="cantieri">Ordina: N. Cantieri Assegnati</option>
              <option value="recenti">Ordina: Più recenti</option>
            </select>

            <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-xl flex items-center gap-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-xs' : 'text-slate-400'}`}
                title="Vista Griglia"
              >
                <Icons.Grid />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg transition-all ${viewMode === 'table' ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-xs' : 'text-slate-400'}`}
                title="Vista Tabella"
              >
                <Icons.List />
              </button>
            </div>

            {/* Esporta CSV / Backup */}
            <button
              onClick={handleExportCSV}
              title="Esporta Rubrica in formato Excel / CSV"
              className="p-2.5 bg-slate-50 dark:bg-slate-800 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 dark:text-slate-300 rounded-xl border border-slate-200 dark:border-slate-700 transition-all"
            >
              <Icons.Excel />
            </button>
            <button
              onClick={handleExportJSON}
              title="Backup JSON della rubrica"
              className="p-2.5 bg-slate-50 dark:bg-slate-800 hover:bg-blue-50 text-slate-600 hover:text-blue-700 dark:text-slate-300 rounded-xl border border-slate-200 dark:border-slate-700 transition-all"
            >
              <Icons.Download />
            </button>
          </div>
        </div>

        {/* Filtro per Settore / Categoria pillole */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <button
            onClick={() => setSelectedSettore('tutti')}
            className={`px-3 py-1 rounded-xl font-bold uppercase text-[10px] shrink-0 transition-all ${
              selectedSettore === 'tutti'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
            }`}
          >
            Tutti i Settori ({rubrica.length})
          </button>
          {SETTORI_SUBAPPALTO.map(settore => {
            const count = rubrica.filter(r => r.settore === settore).length;
            if (count === 0 && selectedSettore !== settore) return null;
            return (
              <button
                key={settore}
                onClick={() => setSelectedSettore(settore)}
                className={`px-3 py-1 rounded-xl font-bold text-[10px] shrink-0 transition-all ${
                  selectedSettore === settore
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                }`}
              >
                {settore} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Lista / Griglia Subappaltatori */}
      {filteredRubrica.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-[2.5rem] border-2 border-dashed border-slate-200 dark:border-slate-800 space-y-4">
          <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-3xl mx-auto flex items-center justify-center text-3xl">
            📋
          </div>
          <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">
            Nessun Subappaltatore trovato
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {searchTerm || selectedSettore !== 'tutti' || durcFilter !== 'tutti'
              ? 'Nessun risultato corrisponde ai filtri di ricerca applicati. Prova a reimpostarli.'
              : 'La rubrica è vuota. Aggiungi il tuo primo subappaltatore oppure sincronizzali dai cantieri già compilati.'}
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            {(searchTerm || selectedSettore !== 'tutti' || durcFilter !== 'tutti') && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedSettore('tutti');
                  setDurcFilter('tutti');
                }}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold"
              >
                Reimposta Filtri
              </button>
            )}
            <button
              onClick={handleOpenNewModal}
              className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-black uppercase hover:bg-blue-700 transition-all shadow-md"
            >
              + Aggiungi Subappaltatore
            </button>
          </div>
        </div>
      ) : viewMode === 'grid' ? (
        /* VISTA A CARTE */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredRubrica.map(sub => {
            const durcInfo = getDurcStatus(sub.durcScadenza);
            const assignedList = assignmentsMap[sub.id] || [];

            return (
              <div
                key={sub.id}
                className="bg-white dark:bg-slate-900 rounded-[2rem] border-2 border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between overflow-hidden group hover:border-blue-200 dark:hover:border-slate-700"
              >
                {/* Header Card */}
                <div className="p-6 pb-4 space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center text-lg font-black shrink-0 shadow-md shadow-blue-500/20">
                        {sub.ragioneSociale.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="text-base font-black text-slate-900 dark:text-white leading-tight group-hover:text-blue-600 transition-colors">
                          {sub.ragioneSociale}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="px-2.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-[10px] font-black uppercase tracking-wider">
                            {sub.settore}
                          </span>
                          {sub.citta && (
                            <span className="text-[10px] text-slate-400 font-semibold">
                              📍 {sub.citta} {sub.provincia ? `(${sub.provincia})` : ''}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Rating Stelline */}
                    <div className="flex items-center gap-0.5 text-amber-400 text-xs shrink-0" title={`Valutazione: ${sub.rating || 5}/5`}>
                      {Array.from({ length: 5 }).map((_, i) => (
                        <span key={i} className={i < (sub.rating || 5) ? 'text-amber-400' : 'text-slate-200 dark:text-slate-700'}>
                          ★
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Badge Stato DURC */}
                  <div className={`p-2.5 rounded-xl border flex items-center justify-between text-xs font-bold ${durcInfo.badgeClass}`}>
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${durcInfo.dotClass}`} />
                      <span>{durcInfo.label}</span>
                    </div>
                    {sub.durcScadenza && (
                      <span className="text-[10px] font-normal opacity-80">
                        scad. {formatDateItalian(sub.durcScadenza)}
                      </span>
                    )}
                  </div>

                  {/* Informazioni Anagrafiche e Fiscali */}
                  <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-slate-50 dark:border-slate-800/80">
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase">Partita IVA</p>
                      <div className="flex items-center gap-1 font-bold text-slate-800 dark:text-slate-200">
                        <span>{sub.partitaIva || 'Non inserita'}</span>
                        {sub.partitaIva && (
                          <button
                            onClick={() => copyToClipboard(sub.partitaIva || '', 'P.IVA')}
                            title="Copia P.IVA"
                            className="text-slate-400 hover:text-blue-600 transition-colors"
                          >
                            <Icons.Copy />
                          </button>
                        )}
                      </div>
                    </div>

                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase">Codice Fiscale</p>
                      <p className="font-bold text-slate-800 dark:text-slate-200 truncate">
                        {sub.codiceFiscale || sub.partitaIva || 'Non inserito'}
                      </p>
                    </div>

                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase">Rappresentante Legale</p>
                      <p className="font-semibold text-slate-700 dark:text-slate-300 truncate">
                        {sub.rappresentanteLegale || 'Non indicato'}
                      </p>
                    </div>

                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase">Maggiorazione Standard</p>
                      <p className="font-black text-indigo-600 dark:text-indigo-400">
                        +{sub.maggiorazioneDefault || 0}%
                      </p>
                    </div>
                  </div>

                  {/* Recapiti Rapidi (Telefono, Email, PEC) */}
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-50 dark:border-slate-800/80">
                    {sub.telefono ? (
                      <a
                        href={`tel:${sub.telefono}`}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-slate-700 dark:text-slate-300 hover:text-blue-600 text-[10px] font-bold flex items-center gap-1.5 transition-all"
                        title="Chiama"
                      >
                        <Icons.Phone /> {sub.telefono}
                      </a>
                    ) : (
                      <span className="text-[10px] text-slate-400 italic">Nessun tel.</span>
                    )}

                    {sub.email && (
                      <a
                        href={`mailto:${sub.email}`}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-slate-700 dark:text-slate-300 hover:text-blue-600 text-[10px] font-bold flex items-center gap-1.5 transition-all"
                        title="Invia Email"
                      >
                        <Icons.Mail /> Email
                      </a>
                    )}

                    {sub.pec && (
                      <button
                        onClick={() => copyToClipboard(sub.pec || '', 'PEC')}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-slate-700 dark:text-slate-300 hover:text-emerald-600 text-[10px] font-bold flex items-center gap-1 transition-all"
                        title="Copia PEC certificata"
                      >
                        <span>📨 PEC</span>
                      </button>
                    )}
                  </div>

                  {/* Cantieri Assegnati */}
                  <div className="pt-2 border-t border-slate-50 dark:border-slate-800/80">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                      <span>Cantieri Attivi ({assignedList.length})</span>
                      {assignedList.length > 0 && (
                        <span className="text-blue-600 dark:text-blue-400 font-bold">
                          Tot: € {assignedList.reduce((s, a) => s + (a.subappalto.prezzoOriginale || 0) * (1 + (a.subappalto.maggiorazione || 0) / 100), 0).toLocaleString('it-IT')}
                        </span>
                      )}
                    </p>

                    {assignedList.length === 0 ? (
                      <p className="text-[11px] text-slate-400 italic bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl">
                        Nessun subappalto attivo attualmente assegnato
                      </p>
                    ) : (
                      <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                        {assignedList.map(({ cantiere, subappalto }) => {
                          const totIvato = (subappalto.prezzoOriginale || 0) * (1 + (subappalto.maggiorazione || 0) / 100);
                          return (
                            <div
                              key={subappalto.id}
                              className="p-2 bg-slate-50 dark:bg-slate-800/80 rounded-xl text-[10px] flex items-center justify-between gap-2"
                            >
                              <div className="truncate">
                                <span className="font-bold text-slate-900 dark:text-white truncate block">
                                  {cantiere.nome}
                                </span>
                                <span className="text-slate-500 font-medium truncate block">
                                  {subappalto.lavoro || 'Lavorazioni edili'}
                                </span>
                              </div>
                              <div className="text-right shrink-0">
                                <span className="font-black text-slate-900 dark:text-white block">
                                  € {totIvato.toLocaleString('it-IT')}
                                </span>
                                <span className="text-[8px] text-emerald-600 font-bold">
                                  +{subappalto.maggiorazione || 0}%
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Azioni */}
                <div className="p-4 bg-slate-50/70 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenAssignModal(sub)}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all shadow-xs flex items-center gap-1 hover:scale-105 active:scale-95"
                      title="Assegna questa ditta a un cantiere"
                    >
                      <span>⚡</span> Assegna a Cantiere
                    </button>

                    {onNavigateToContratti && (
                      <button
                        onClick={() => {
                          const firstAssignment = assignedList[0];
                          onNavigateToContratti(firstAssignment?.cantiere.id, firstAssignment?.subappalto.id);
                        }}
                        className="px-2.5 py-1.5 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 hover:bg-amber-100 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border border-amber-200 dark:border-amber-800 flex items-center gap-1"
                        title="Apri nel generatore contratti"
                      >
                        <Icons.Contract /> Contratto
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEditModal(sub)}
                      className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-all"
                      title="Modifica Anagrafica"
                    >
                      <Icons.Edit />
                    </button>
                    <button
                      onClick={() => {
                        setSubToDelete(sub);
                        setShowDeleteModal(true);
                      }}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-all"
                      title="Elimina Subappaltatore"
                    >
                      <Icons.Trash />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* VISTA A TABELLA */
        <div className="bg-white dark:bg-slate-900 rounded-[2rem] border-2 border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800 text-[10px] font-black text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-700">
                <tr>
                  <th className="py-4 px-6">Impresa Subappaltatrice</th>
                  <th className="py-4 px-4">Settore / Specialità</th>
                  <th className="py-4 px-4">P.IVA / CF</th>
                  <th className="py-4 px-4">Recapiti</th>
                  <th className="py-4 px-4">Stato DURC</th>
                  <th className="py-4 px-4">Cantieri</th>
                  <th className="py-4 px-6 text-right">Azioni</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredRubrica.map(sub => {
                  const durcInfo = getDurcStatus(sub.durcScadenza);
                  const assignedList = assignmentsMap[sub.id] || [];

                  return (
                    <tr key={sub.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-blue-500 text-white font-black flex items-center justify-center text-xs shrink-0">
                            {sub.ragioneSociale.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-black text-slate-900 dark:text-white text-sm">
                              {sub.ragioneSociale}
                            </p>
                            <p className="text-[10px] text-slate-400">
                              {sub.sedeLegale ? `${sub.sedeLegale}, ` : ''}{sub.citta || ''}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-[10px] font-black uppercase">
                          {sub.settore}
                        </span>
                      </td>

                      <td className="py-4 px-4 font-mono font-bold text-slate-800 dark:text-slate-200">
                        {sub.partitaIva || sub.codiceFiscale || 'N.D.'}
                      </td>

                      <td className="py-4 px-4">
                        <div className="space-y-0.5 text-[11px]">
                          {sub.telefono && <p className="text-slate-700 dark:text-slate-300">📞 {sub.telefono}</p>}
                          {sub.email && <p className="text-blue-600 truncate max-w-[150px]">✉️ {sub.email}</p>}
                          {sub.pec && <p className="text-emerald-600 font-semibold truncate max-w-[150px]">📨 {sub.pec}</p>}
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl font-bold text-[10px] border ${durcInfo.badgeClass}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${durcInfo.dotClass}`} />
                          {durcInfo.label}
                        </span>
                      </td>

                      <td className="py-4 px-4 font-bold text-slate-800 dark:text-slate-200">
                        {assignedList.length > 0 ? (
                          <span className="px-2 py-1 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 rounded-lg text-[10px]">
                            {assignedList.length} cantieri
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[10px] italic">0 cantieri</span>
                        )}
                      </td>

                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenAssignModal(sub)}
                            className="px-2.5 py-1.5 bg-blue-600 text-white rounded-lg text-[10px] font-black uppercase hover:bg-blue-700 transition-all"
                            title="Assegna a Cantiere"
                          >
                            ⚡ Assegna
                          </button>
                          <button
                            onClick={() => handleOpenEditModal(sub)}
                            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-all"
                            title="Modifica"
                          >
                            <Icons.Edit />
                          </button>
                          <button
                            onClick={() => {
                              setSubToDelete(sub);
                              setShowDeleteModal(true);
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all"
                            title="Elimina"
                          >
                            <Icons.Trash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= MODALE: AGGIUNGI / MODIFICA SUBAPPALTATORE ================= */}
      {showAddEditModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 w-full max-w-3xl rounded-[2.5rem] p-6 md:p-8 border border-slate-100 dark:border-slate-800 shadow-2xl space-y-6 my-8 animate-in zoom-in-95 duration-200">
            {/* Header Modal */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <span className="p-3 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 rounded-2xl text-xl font-black">
                  🏢
                </span>
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">
                    {editingSub ? `Modifica Subappaltatore: ${editingSub.ragioneSociale}` : 'Nuovo Subappaltatore in Rubrica'}
                  </h3>
                  <p className="text-xs text-slate-400 font-medium">
                    I dati salvati qui saranno disponibili per l'autocompilazione rapida in qualsiasi cantiere e contratto.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddEditModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveSubForm} className="space-y-6">
              {/* Sezione 1: Dati Anagrafici e Fiscali */}
              <div className="space-y-3">
                <h4 className="text-[10px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                  <span>1.</span> Dati Societari & Settore Operativo
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1 md:col-span-2">
                    <label className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Ragione Sociale Impresa *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Es. ImpresEdil S.r.l., Termoidraulica Rossi S.n.c."
                      value={subForm.ragioneSociale || ''}
                      onChange={e => setSubForm({ ...subForm, ragioneSociale: e.target.value })}
                      className="w-full p-3 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Settore / Categoria Specializzazione *
                    </label>
                    <select
                      value={subForm.settore || 'Opere Murarie & Strutture'}
                      onChange={e => setSubForm({ ...subForm, settore: e.target.value })}
                      className="w-full p-3 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-blue-500"
                    >
                      {SETTORI_SUBAPPALTO.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Partita IVA
                    </label>
                    <input
                      type="text"
                      placeholder="11 cifre (es. 01234567890)"
                      value={subForm.partitaIva || ''}
                      onChange={e => setSubForm({ ...subForm, partitaIva: e.target.value })}
                      className="w-full p-3 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Codice Fiscale
                    </label>
                    <input
                      type="text"
                      placeholder="Se differente da P.IVA"
                      value={subForm.codiceFiscale || ''}
                      onChange={e => setSubForm({ ...subForm, codiceFiscale: e.target.value })}
                      className="w-full p-3 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Legale Rappresentante
                    </label>
                    <input
                      type="text"
                      placeholder="Nome e Cognome Amministratore / Titolare"
                      value={subForm.rappresentanteLegale || ''}
                      onChange={e => setSubForm({ ...subForm, rappresentanteLegale: e.target.value })}
                      className="w-full p-3 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Sezione 2: Sede Legale e Contatti */}
              <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <h4 className="text-[10px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                  <span>2.</span> Sede Legale, Contatti & PEC
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1 md:col-span-2">
                    <label className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Indirizzo Sede Legale
                    </label>
                    <input
                      type="text"
                      placeholder="Via / Piazza e numero civico"
                      value={subForm.sedeLegale || ''}
                      onChange={e => setSubForm({ ...subForm, sedeLegale: e.target.value })}
                      className="w-full p-3 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Città & Provincia
                    </label>
                    <input
                      type="text"
                      placeholder="Es. Milano (MI)"
                      value={subForm.citta || ''}
                      onChange={e => setSubForm({ ...subForm, citta: e.target.value })}
                      className="w-full p-3 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Telefono / Cellulare
                    </label>
                    <input
                      type="text"
                      placeholder="Es. +39 02 1234567"
                      value={subForm.telefono || ''}
                      onChange={e => setSubForm({ ...subForm, telefono: e.target.value })}
                      className="w-full p-3 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Email Ordinaria
                    </label>
                    <input
                      type="email"
                      placeholder="info@azienda.it"
                      value={subForm.email || ''}
                      onChange={e => setSubForm({ ...subForm, email: e.target.value })}
                      className="w-full p-3 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      PEC Certificata *
                    </label>
                    <input
                      type="email"
                      placeholder="azienda@pec.it"
                      value={subForm.pec || ''}
                      onChange={e => setSubForm({ ...subForm, pec: e.target.value })}
                      className="w-full p-3 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Sezione 3: Conformità e Scadenze Documentali */}
              <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <h4 className="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                  <span>3.</span> Idoneità Tecnico-Professionale & Scadenze (DURC, Polizze)
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center justify-between">
                      <span>Scadenza DURC</span>
                      <span className="text-[9px] text-emerald-600 font-bold">Monitorato</span>
                    </label>
                    <input
                      type="date"
                      value={subForm.durcScadenza || ''}
                      onChange={e => setSubForm({ ...subForm, durcScadenza: e.target.value })}
                      className="w-full p-3 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Scadenza Visura Camerale
                    </label>
                    <input
                      type="date"
                      value={subForm.visuraScadenza || ''}
                      onChange={e => setSubForm({ ...subForm, visuraScadenza: e.target.value })}
                      className="w-full p-3 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Scadenza Polizza RCT/RCO
                    </label>
                    <input
                      type="date"
                      value={subForm.rcTerziScadenza || ''}
                      onChange={e => setSubForm({ ...subForm, rcTerziScadenza: e.target.value })}
                      className="w-full p-3 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Sezione 4: Condizioni Commerciali e Note */}
              <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <h4 className="text-[10px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                  <span>4.</span> Condizioni Economiche, IBAN & Note Operative
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Maggiorazione Default (%)
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      placeholder="Es. 10"
                      value={subForm.maggiorazioneDefault !== undefined ? subForm.maggiorazioneDefault : 10}
                      onChange={e => setSubForm({ ...subForm, maggiorazioneDefault: parseFloat(e.target.value) || 0 })}
                      className="w-full p-3 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-1 md:col-span-2">
                    <label className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Codice IBAN Pagamenti
                    </label>
                    <input
                      type="text"
                      placeholder="IT..."
                      value={subForm.iban || ''}
                      onChange={e => setSubForm({ ...subForm, iban: e.target.value })}
                      className="w-full p-3 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-slate-900 dark:text-white outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-1 md:col-span-3">
                    <label className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Note Operative / Abilitazioni
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Annotazioni su specializzazioni, attrezzature di proprietà, abilitazioni particolari..."
                      value={subForm.note || ''}
                      onChange={e => setSubForm({ ...subForm, note: e.target.value })}
                      className="w-full p-3 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Bottoni Footer */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddEditModal(false)}
                  className="px-5 py-2.5 rounded-xl text-xs font-black uppercase text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-lg shadow-blue-600/30 transition-all"
                >
                  {editingSub ? 'Salva Modifiche' : 'Salva in Rubrica'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODALE: ASSEGNA A CANTIERE RAPIDO ================= */}
      {showAssignModal && subToAssign && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-[2.5rem] p-6 md:p-8 border border-slate-100 dark:border-slate-800 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <span className="p-2.5 bg-blue-50 dark:bg-blue-950/60 text-blue-600 rounded-2xl text-lg font-black">
                  ⚡
                </span>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tight">
                    Assegna a Cantiere
                  </h3>
                  <p className="text-xs text-slate-400">
                    Affida lavorazioni a <span className="font-bold text-slate-900 dark:text-white">{subToAssign.ragioneSociale}</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAssignModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmAssign} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Seleziona Cantiere di Destinazione *
                </label>
                <select
                  required
                  value={assignCantiereId}
                  onChange={e => setAssignCantiereId(e.target.value)}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-blue-500"
                >
                  {cantieri.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.nome} ({c.cliente}) - Stato: {c.stato}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Descrizione Lavorazioni Affidate in Subappalto *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Es. Opere di cartongesso e controsoffittature"
                  value={assignLavoro}
                  onChange={e => setAssignLavoro(e.target.value)}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Importo Contrattuale Netto (€) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={assignPrezzo}
                    onChange={e => setAssignPrezzo(parseFloat(e.target.value) || 0)}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-xl text-xs font-black text-slate-900 dark:text-white outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Maggiorazione (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={assignMaggiorazione}
                    onChange={e => setAssignMaggiorazione(parseFloat(e.target.value) || 0)}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-xl text-xs font-black text-slate-900 dark:text-white outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Box Riepilogo Totale */}
              <div className="p-4 bg-slate-900 text-white rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-blue-400 tracking-wider block">
                    Totale Calcolato con Maggiorazione
                  </span>
                  <span className="text-xl font-black">
                    € {((Number(assignPrezzo) || 0) * (1 + (Number(assignMaggiorazione) || 0) / 100)).toLocaleString('it-IT', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="text-right text-[10px] text-slate-300">
                  <p>P.IVA: {subToAssign.partitaIva || 'N.D.'}</p>
                  <p>PEC: {subToAssign.pec || 'N.D.'}</p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-md shadow-blue-600/30 transition-all"
                >
                  Conferma Assegnazione
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODALE: CONFERMA ELIMINAZIONE ================= */}
      {showDeleteModal && subToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[2.5rem] p-6 border border-slate-100 dark:border-slate-800 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center text-2xl mx-auto">
              🗑️
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tight">
                Eliminare dalla Rubrica?
              </h3>
              <p className="text-xs text-slate-500">
                Vuoi rimuovere definitivamente <span className="font-bold text-slate-900 dark:text-white">"{subToDelete.ragioneSociale}"</span> dalla rubrica centralizzata? I cantieri storici non perderanno i loro dati.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Annulla
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md shadow-rose-600/30"
              >
                Elimina Subappaltatore
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
