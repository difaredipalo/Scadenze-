import React, { useState } from 'react';
import {
  PosContestoAmbientale,
  PosOperaProvvisionaleItem,
  PosSostanzaItem,
  PosAttrezzaturaItem,
  PosDatiCantiere,
} from '../../types';
import {
  DEFAULT_OPERE_PROVVISIONALI_LIST,
  DEFAULT_SOSTANZE_CATALOGO,
  DEFAULT_ATTREZZATURE_CATALOGO,
  POS_DPI_LIST,
  CALCOLA_RISCHIO,
} from '../../data/posDefaultData';
import {
  PosSchedaLogo,
  PosSchedaLogoPickerModal,
  DpiPictogram,
  PosDpiBadge,
  GhsHazardDiamond,
  GHS_PICTOGRAM_CODES,
} from './PosSafetyCardVisuals';

// ==========================================
// CAPITOLO 7: CONTESTO AMBIENTALE
// ==========================================
interface PosCapitolo7Props {
  contesto: PosContestoAmbientale;
  onChange: (updated: PosContestoAmbientale) => void;
}

export const PosCapitolo7View: React.FC<PosCapitolo7Props> = ({ contesto, onChange }) => {
  return (
    <div className="space-y-5 max-w-5xl mx-auto">
      <div className="p-4 rounded-2xl bg-blue-50/50 dark:bg-slate-800 border border-blue-200 dark:border-slate-700">
        <div className="flex items-center gap-2 mb-1">
          <span className="px-2 py-0.5 rounded bg-blue-600 text-white font-black text-[10px] uppercase tracking-wider">
            CAPITOLO 7
          </span>
          <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-tight text-sm">
            CONTESTO AMBIENTALE E CONDIZIONI AL CONTORNO
          </h3>
        </div>
        <p className="text-xs text-slate-600 dark:text-slate-400">
          Analisi delle condizioni ambientali, del sito operativo, della viabilità di adduzione, delle interferenze con sottoservizi e della tutela di terzi ed edifici adiacenti (D.Lgs. 81/08 All. XV).
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 7.1 Accessibilità e viabilità esterna */}
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 space-y-2">
          <label className="block text-xs font-black uppercase text-slate-800 dark:text-slate-200">
            7.1 Condizioni del Sito e Viabilità Esterna di Accesso
          </label>
          <textarea
            rows={4}
            value={contesto.accessibilitaViabilitaEsterna}
            onChange={e => onChange({ ...contesto, accessibilitaViabilitaEsterna: e.target.value })}
            className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            placeholder="Descrivere l'accesso al cantiere, le dimensioni della carreggiata, l'eventuale occupazione di suolo pubblico e la manovra dei mezzi pesanti..."
          />
        </div>

        {/* 7.2 Sottoservizi e linee aeree */}
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 space-y-2">
          <label className="block text-xs font-black uppercase text-slate-800 dark:text-slate-200">
            7.2 Interferenze con Linee Elettriche Aeree o Sottoservizi
          </label>
          <textarea
            rows={4}
            value={contesto.interferenzeSottoserviziLineeAeree}
            onChange={e => onChange({ ...contesto, interferenzeSottoserviziLineeAeree: e.target.value })}
            className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            placeholder="Presenza di linee elettriche MT/BT, tubazioni gas, fognature o cavi interrati e misure di sicurezza preventive..."
          />
        </div>

        {/* 7.3 Edifici adiacenti, rumore e polveri */}
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 space-y-2">
          <label className="block text-xs font-black uppercase text-slate-800 dark:text-slate-200">
            7.3 Edifici Adiacenti, Rumore Verso Terzi e Abbattimento Polveri
          </label>
          <textarea
            rows={4}
            value={contesto.edificiAdiacentiRumorePolveri}
            onChange={e => onChange({ ...contesto, edificiAdiacentiRumorePolveri: e.target.value })}
            className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            placeholder="Misure per la mitigazione del rumore, orari di silenzio, bagnatura periodica delle macerie e teli antipolvere..."
          />
        </div>

        {/* 7.4 Esposizione agenti atmosferici e meteo */}
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 space-y-2">
          <label className="block text-xs font-black uppercase text-slate-800 dark:text-slate-200">
            7.4 Esposizione ad Agenti Atmosferici e Condizioni Meteo Avverse
          </label>
          <textarea
            rows={4}
            value={contesto.condizioniMeteoEventiAtmosferici}
            onChange={e => onChange({ ...contesto, condizioniMeteoEventiAtmosferici: e.target.value })}
            className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            placeholder="Procedure operative in caso di pioggia intensa, vento forte (sospensione lavori su ponteggio >40 km/h), gelo o temperature estreme (stress termico)..."
          />
        </div>
      </div>
    </div>
  );
};

// ==========================================
// CAPITOLO 8: TURNI E GESTIONE PRESENZE
// ==========================================
interface PosCapitolo8Props {
  datiCantiere: PosDatiCantiere;
  onChange: (updated: PosDatiCantiere) => void;
}

export const PosCapitolo8View: React.FC<PosCapitolo8Props> = ({ datiCantiere, onChange }) => {
  return (
    <div className="space-y-5 max-w-5xl mx-auto">
      <div className="p-4 rounded-2xl bg-blue-50/50 dark:bg-slate-800 border border-blue-200 dark:border-slate-700">
        <div className="flex items-center gap-2 mb-1">
          <span className="px-2 py-0.5 rounded bg-blue-600 text-white font-black text-[10px] uppercase tracking-wider">
            CAPITOLO 8
          </span>
          <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-tight text-sm">
            PROGRAMMAZIONE, TURNI DI LAVORO E GESTIONE DELLE PRESENZE
          </h3>
        </div>
        <p className="text-xs text-slate-600 dark:text-slate-400">
          Definizione dell'orario di lavoro ordinario, delle turnazioni, della disciplina del lavoro straordinario/notturno e delle modalità di registrazione e controllo degli accessi in cantiere.
        </p>
      </div>

      <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-black uppercase text-slate-700 dark:text-slate-300 mb-1">
              8.1 Orario di Lavoro Giornaliero e Settimanale
            </label>
            <input
              type="text"
              value={datiCantiere.orariLavoro}
              onChange={e => onChange({ ...datiCantiere, orariLavoro: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              placeholder="es. 08:00 - 12:00 / 13:00 - 17:00 (lunedì - venerdì)"
            />
          </div>

          <div>
            <label className="block text-xs font-black uppercase text-slate-700 dark:text-slate-300 mb-1">
              Numero Massimo Lavoratori Contemporanei
            </label>
            <input
              type="number"
              min={1}
              value={datiCantiere.numeroMassimoLavoratori}
              onChange={e => onChange({ ...datiCantiere, numeroMassimoLavoratori: Number(e.target.value) || 1 })}
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            />
          </div>
        </div>

        <div className="pt-2 border-t border-slate-200 dark:border-slate-700 space-y-3">
          <h4 className="text-xs font-black uppercase text-slate-900 dark:text-white">
            8.2 Lavori Straordinari, Notturni e Festivi
          </h4>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-700/40 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
            L'effettuazione di lavorazioni oltre l'orario ordinario, in orario notturno o nei giorni festivi è subordinata alla preventiva autorizzazione del Coordinatore per la Sicurezza in Esecuzione (CSE) e all'attivazione di idonee misure supplementari di illuminazione artificiale (minimo 100 lux per percorsi pedonali, 300 lux per aree di lavoro operativo) e alla presenza continuativa del Preposto incaricato.
          </p>
        </div>

        <div className="pt-2 border-t border-slate-200 dark:border-slate-700 space-y-3">
          <h4 className="text-xs font-black uppercase text-slate-900 dark:text-white">
            8.3 Controllo Accessi, Cartellino di Riconoscimento e Registro Presenze
          </h4>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-700/40 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
            Ai sensi dell'art. 26 comma 8 e dell'art. 18 comma 1 lett. u) del D.Lgs. 81/2008, ciascun lavoratore presente in cantiere è munito di apposita tessera di riconoscimento corredata di fotografia, generalità del lavoratore e indicazione del datore di lavoro. È istituito presso la baracca di cantiere il Registro Giornaliero delle Presenze per il controllo puntuale del personale operante.
          </p>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// CAPITOLO 10: SCHEDE ATTREZZATURE, MEZZI E MACCHINE
// ==========================================
interface PosCapitolo10Props {
  attrezzature: PosAttrezzaturaItem[];
  onChange: (updated: PosAttrezzaturaItem[]) => void;
}

export const PosCapitolo10View: React.FC<PosCapitolo10Props> = ({ attrezzature, onChange }) => {
  const [activeLogoModalIdx, setActiveLogoModalIdx] = useState<number | null>(null);
  const [customDpiText, setCustomDpiText] = useState<{ [key: number]: string }>({});

  const handleAddDefaultFromCatalog = (templateItem: PosAttrezzaturaItem) => {
    const exists = attrezzature.some(a => a.nome.toLowerCase() === templateItem.nome.toLowerCase());
    if (exists) {
      alert(`L'attrezzatura/macchina "${templateItem.nome}" è già presente.`);
      return;
    }
    onChange([...attrezzature, { ...templateItem, id: Math.random().toString() }]);
  };

  const handleAddNewCustom = () => {
    const nuova: PosAttrezzaturaItem = {
      id: Math.random().toString(),
      nome: 'Nuova Attrezzatura / Mezzo d’Opera',
      modelloMatricola: 'Marcatura CE conforme - Matricola in verifica',
      marcaturaCeConforme: true,
      verifichePeriodicheRegolari: true,
      operatoreAbilitato: 'Personale con formazione specifica e addestramento ex Art. 73 D.Lgs. 81/08',
      dpiObbligatori: ['Casco di protezione / Elmetto', 'Calzature di sicurezza S3', 'Guanti da lavoro protettivi'],
      prescrizioniSicurezza: 'Verifica giornaliera dei dispositivi di blocco, funi, freni e ripari prima dell’avviamento.',
      rischi: [
        {
          id: Math.random().toString(),
          descrizione: 'Ribaltamento, investimento e rumorosità durante la movimentazione',
          probabilita: 2,
          danno: 3,
          livelloRischio: 6,
          classeRischio: 'Notevole',
          misurePreventive: 'Delimitazione raggio di rotazione, segnalatore acustico retromarcia, divieto di sosta nel raggio d’azione.',
          dpiRichiesti: ['Casco di protezione / Elmetto', 'Gilet alta visibilità', 'Calzature di sicurezza S3'],
        },
      ],
    };
    onChange([...attrezzature, nuova]);
  };

  const handleRemove = (idx: number) => {
    onChange(attrezzature.filter((_, i) => i !== idx));
  };

  const handleUpdate = (idx: number, patch: Partial<PosAttrezzaturaItem>) => {
    onChange(attrezzature.map((a, i) => (i === idx ? { ...a, ...patch } : a)));
  };

  const currentModalItem = activeLogoModalIdx !== null ? attrezzature[activeLogoModalIdx] : null;

  return (
    <div className="space-y-5 max-w-5xl mx-auto">
      {/* Header Capitolo 10 */}
      <div className="p-4 rounded-2xl bg-blue-50/50 dark:bg-slate-800 border border-blue-200 dark:border-slate-700">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded bg-blue-600 text-white font-black text-[10px] uppercase tracking-wider">
                CAPITOLO 10
              </span>
              <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-tight text-sm">
                SCHEDE ATTREZZATURE, MEZZI E MACCHINE D'OPERA
              </h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Schede di sicurezza per macchine, mezzi di movimentazione, apparecchi di sollevamento e utensili elettrici con conformità CE, requisiti operatore (art. 73) e DPI prescritti (All. V e VI D.Lgs. 81/08).
            </p>
          </div>
          <button
            type="button"
            onClick={handleAddNewCustom}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-xs shrink-0"
          >
            + Nuova Macchina / Mezzo
          </button>
        </div>

        {/* Selezione rapida da catalogo di settore */}
        <div className="mt-3 pt-3 border-t border-blue-200 dark:border-slate-700 flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">Aggiungi rapidamente da catalogo:</span>
          {DEFAULT_ATTREZZATURE_CATALOGO.slice(0, 8).map(cat => (
            <button
              key={cat.id}
              type="button"
              onClick={() => handleAddDefaultFromCatalog(cat)}
              className="px-2.5 py-1 bg-white dark:bg-slate-700 hover:bg-blue-50 dark:hover:bg-slate-600 border border-slate-200 dark:border-slate-600 text-slate-800 dark:text-slate-200 rounded-lg text-xs font-bold transition-all"
            >
              + {cat.nome}
            </button>
          ))}
        </div>
      </div>

      {/* Lista Schede Attrezzature */}
      <div className="space-y-4">
        {attrezzature.map((att, idx) => (
          <div
            key={att.id || idx}
            className="p-5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 space-y-4 shadow-xs"
          >
            {/* Header Scheda con Logo e Titolo */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-700/60">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <button
                  type="button"
                  onClick={() => setActiveLogoModalIdx(idx)}
                  title="Clicca per personalizzare logo o caricare immagine"
                  className="shrink-0 group relative focus:outline-none"
                >
                  <PosSchedaLogo
                    tipo="attrezzatura"
                    title={att.nome}
                    logoUrl={att.logoUrl || att.immagineUrl}
                    size="md"
                  />
                  <span className="absolute -bottom-1 -right-1 bg-blue-600 text-white text-[8px] rounded-full px-1 font-black shadow-xs group-hover:scale-110 transition-transform">
                    ✎
                  </span>
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-[10px] font-black uppercase text-blue-600 dark:text-blue-400">
                      Scheda Tecnica Macchina #{idx + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => setActiveLogoModalIdx(idx)}
                      className="text-[10px] font-bold text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-1"
                    >
                      <span>🖼️</span> <span>Cambia Logo/Immagine</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    value={att.nome}
                    onChange={e => handleUpdate(idx, { nome: e.target.value })}
                    className="w-full font-black text-sm p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleRemove(idx)}
                className="text-slate-400 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 p-1.5 text-xs font-bold self-start sm:self-center"
              >
                ✕ Rimuovi Scheda
              </button>
            </div>

            {/* Dati tecnici e marcatura */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-0.5">
                  Modello / Matricola
                </label>
                <input
                  type="text"
                  value={att.modelloMatricola}
                  onChange={e => handleUpdate(idx, { modelloMatricola: e.target.value })}
                  className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-0.5">
                  Operatore Abilitato (Art. 73)
                </label>
                <input
                  type="text"
                  value={att.operatoreAbilitato}
                  onChange={e => handleUpdate(idx, { operatoreAbilitato: e.target.value })}
                  className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                />
              </div>

              <div className="flex flex-col justify-center space-y-1.5 pt-1 sm:pt-0">
                <label className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={att.marcaturaCeConforme}
                    onChange={e => handleUpdate(idx, { marcaturaCeConforme: e.target.checked })}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-0"
                  />
                  <span>Marcatura CE / Libretto d'Uso</span>
                </label>
                <label className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={att.verifichePeriodicheRegolari ?? true}
                    onChange={e => handleUpdate(idx, { verifichePeriodicheRegolari: e.target.checked })}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-0"
                  />
                  <span>Verifiche periodiche regolari</span>
                </label>
              </div>
            </div>

            {/* Prescrizioni di sicurezza */}
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-0.5">
                Prescrizioni di Sicurezza & Istruzioni d'Uso (All. VI D.Lgs. 81/08)
              </label>
              <textarea
                rows={2}
                value={att.prescrizioniSicurezza}
                onChange={e => handleUpdate(idx, { prescrizioniSicurezza: e.target.value })}
                className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              />
            </div>

            {/* SEZIONE DPI OPERATORE CON IMMAGINETTE ISO 7010 */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-700/30 border border-slate-200 dark:border-slate-700 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#005ea6]" />
                  <span>DPI Obbligatori per l'Operatore (Simboli ISO 7010)</span>
                </span>
                <span className="text-[9px] font-bold uppercase text-slate-400">All. VIII D.Lgs. 81/08</span>
              </div>

              {/* Badge DPI attivi */}
              {att.dpiObbligatori && att.dpiObbligatori.length > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                  {att.dpiObbligatori.map((dpiName, dIdx) => (
                    <div key={dIdx} className="relative group">
                      <PosDpiBadge name={dpiName} size="md" showNorma={true} />
                      <button
                        type="button"
                        onClick={() => {
                          handleUpdate(idx, {
                            dpiObbligatori: att.dpiObbligatori.filter((_, i) => i !== dIdx),
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
              )}

              {/* Selezione rapida DPI tramite pittogrammi blu */}
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-1.5 pt-1">
                {POS_DPI_LIST.slice(0, 8).map(dpi => {
                  const isChecked = (att.dpiObbligatori || []).some(
                    d => d.toLowerCase().includes(dpi.nome.toLowerCase()) || dpi.nome.toLowerCase().includes(d.toLowerCase())
                  );
                  return (
                    <button
                      key={dpi.id}
                      type="button"
                      onClick={() => {
                        const updated = isChecked
                          ? att.dpiObbligatori.filter(
                              d => !d.toLowerCase().includes(dpi.nome.toLowerCase()) && !dpi.nome.toLowerCase().includes(d.toLowerCase())
                            )
                          : [...(att.dpiObbligatori || []), dpi.nome];
                        handleUpdate(idx, { dpiObbligatori: updated });
                      }}
                      className={`flex items-center gap-1.5 p-1.5 rounded-lg border text-left transition-all ${
                        isChecked
                          ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-500 font-bold text-blue-900 dark:text-blue-200'
                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                      }`}
                    >
                      <DpiPictogram name={dpi.nome} size="sm" />
                      <span className="text-[10px] font-bold truncate leading-tight">{dpi.nome}</span>
                    </button>
                  );
                })}
              </div>

              {/* Aggiunta DPI personalizzato per l'attrezzatura */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="text"
                  value={customDpiText[idx] || ''}
                  onChange={e => setCustomDpiText({ ...customDpiText, [idx]: e.target.value })}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && customDpiText[idx]?.trim()) {
                      e.preventDefault();
                      handleUpdate(idx, {
                        dpiObbligatori: [...(att.dpiObbligatori || []), customDpiText[idx].trim()],
                      });
                      setCustomDpiText({ ...customDpiText, [idx]: '' });
                    }
                  }}
                  placeholder="Aggiungi DPI specifico (es. Cuffie antirumore SNR 32dB)..."
                  className="flex-1 p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (customDpiText[idx]?.trim()) {
                      handleUpdate(idx, {
                        dpiObbligatori: [...(att.dpiObbligatori || []), customDpiText[idx].trim()],
                      });
                      setCustomDpiText({ ...customDpiText, [idx]: '' });
                    }
                  }}
                  className="px-2.5 py-1.5 bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 text-white rounded-lg text-xs font-bold shrink-0"
                >
                  + Aggiungi
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Personalizzazione Logo Attrezzatura */}
      {activeLogoModalIdx !== null && currentModalItem && (
        <PosSchedaLogoPickerModal
          tipo="attrezzatura"
          currentTitle={currentModalItem.nome}
          currentLogoUrl={currentModalItem.logoUrl || currentModalItem.immagineUrl}
          onSave={({ logoUrl, immagineUrl }) => {
            handleUpdate(activeLogoModalIdx, { logoUrl, immagineUrl });
            setActiveLogoModalIdx(null);
          }}
          onClose={() => setActiveLogoModalIdx(null)}
        />
      )}
    </div>
  );
};

// ==========================================
// CAPITOLO 11: OPERE PROVVISIONALI E QUOTA
// ==========================================
interface PosCapitolo11Props {
  opere: PosOperaProvvisionaleItem[];
  onChange: (updated: PosOperaProvvisionaleItem[]) => void;
}

export const PosCapitolo11View: React.FC<PosCapitolo11Props> = ({ opere, onChange }) => {
  const [activeLogoModalIdx, setActiveLogoModalIdx] = useState<number | null>(null);
  const [customDpiText, setCustomDpiText] = useState<{ [key: number]: string }>({});

  const handleAddDefaultFromCatalog = (templateItem: PosOperaProvvisionaleItem) => {
    const exists = opere.some(o => o.tipo.toLowerCase() === templateItem.tipo.toLowerCase());
    if (exists) {
      alert(`L'opera provvisionale "${templateItem.tipo}" è già presente.`);
      return;
    }
    onChange([...opere, { ...templateItem, id: Math.random().toString() }]);
  };

  const handleAddNewCustom = () => {
    const nuova: PosOperaProvvisionaleItem = {
      id: Math.random().toString(),
      tipo: 'Ponteggio / Opera Provvisionale Nuova',
      descrizione: 'Descrizione dell’opera provvisionale e condizioni d’impiego.',
      conformitaNormativa: 'D.Lgs. 81/08 Titolo IV Capo II',
      verifichePeriodiche: true,
      pimusRichiesto: true,
      prescrizioniSicurezza: 'Verificare sempre l’ancoraggio alla struttura e la presenza dei fermapiedi.',
      dpiNecessari: ['Casco di protezione con sottogola', 'Calzature di sicurezza S3', 'Imbracatura di sicurezza con cordino'],
      rischi: [
        {
          id: Math.random().toString(),
          descrizione: 'Caduta dall’alto di persone o materiali',
          probabilita: 2,
          danno: 4,
          livelloRischio: 8,
          classeRischio: 'Notevole',
          misurePreventive: 'Impiego di parapetti regolamentari completi e DPI anticaduta.',
          dpiRichiesti: ['Imbracatura anticaduta EN 361', 'Casco di protezione con sottogola'],
        },
      ],
      misurePrevenzione: [
        'Non sovraccaricare gli impalcati oltre la portata indicata.',
        'Verificare integrità degli elementi prima del montaggio.',
      ],
    };
    onChange([...opere, nuova]);
  };

  const handleRemove = (idx: number) => {
    onChange(opere.filter((_, i) => i !== idx));
  };

  const handleUpdate = (idx: number, patch: Partial<PosOperaProvvisionaleItem>) => {
    onChange(opere.map((o, i) => (i === idx ? { ...o, ...patch } : o)));
  };

  const currentModalItem = activeLogoModalIdx !== null ? opere[activeLogoModalIdx] : null;

  return (
    <div className="space-y-5 max-w-5xl mx-auto">
      {/* Header Capitolo 11 */}
      <div className="p-4 rounded-2xl bg-blue-50/50 dark:bg-slate-800 border border-blue-200 dark:border-slate-700">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded bg-blue-600 text-white font-black text-[10px] uppercase tracking-wider">
                CAPITOLO 11
              </span>
              <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-tight text-sm">
                OPERE PROVVISIONALI E LAVORI IN QUOTA
              </h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Ponteggi fissi, trabattelli, parapetti provvisori, ponti su cavalletti, puntellature, scale e passerelle in conformità al Titolo IV Capo II (artt. 122-156 D.Lgs. 81/08).
            </p>
          </div>
          <button
            type="button"
            onClick={handleAddNewCustom}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-xs shrink-0"
          >
            + Nuova Opera Provvisionale
          </button>
        </div>

        {/* Selezione rapida da catalogo di settore */}
        <div className="mt-3 pt-3 border-t border-blue-200 dark:border-slate-700 flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">Aggiungi da catalogo:</span>
          {DEFAULT_OPERE_PROVVISIONALI_LIST.map(cat => (
            <button
              key={cat.id}
              type="button"
              onClick={() => handleAddDefaultFromCatalog(cat)}
              className="px-2.5 py-1 bg-white dark:bg-slate-700 hover:bg-blue-50 dark:hover:bg-slate-600 border border-slate-200 dark:border-slate-600 text-slate-800 dark:text-slate-200 rounded-lg text-xs font-bold transition-all"
            >
              + {cat.tipo}
            </button>
          ))}
        </div>
      </div>

      {/* Lista Schede Opere Provvisionali */}
      <div className="space-y-4">
        {opere.map((op, idx) => (
          <div
            key={op.id || idx}
            className="p-5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 space-y-4 shadow-xs"
          >
            {/* Header Scheda con Logo e Titolo */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-700/60">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <button
                  type="button"
                  onClick={() => setActiveLogoModalIdx(idx)}
                  title="Clicca per personalizzare logo o caricare immagine"
                  className="shrink-0 group relative focus:outline-none"
                >
                  <PosSchedaLogo
                    tipo="opera"
                    title={op.tipo}
                    logoUrl={op.logoUrl || op.immagineUrl}
                    size="md"
                  />
                  <span className="absolute -bottom-1 -right-1 bg-blue-600 text-white text-[8px] rounded-full px-1 font-black shadow-xs group-hover:scale-110 transition-transform">
                    ✎
                  </span>
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-[10px] font-black uppercase text-blue-600 dark:text-blue-400">
                      Scheda Opera Provvisionale #{idx + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => setActiveLogoModalIdx(idx)}
                      className="text-[10px] font-bold text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-1"
                    >
                      <span>🖼️</span> <span>Cambia Logo/Immagine</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    value={op.tipo}
                    onChange={e => handleUpdate(idx, { tipo: e.target.value })}
                    className="w-full font-black text-sm p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleRemove(idx)}
                className="text-slate-400 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 p-1.5 text-xs font-bold self-start sm:self-center"
              >
                ✕ Rimuovi Scheda
              </button>
            </div>

            {/* Descrizione e Prescrizioni */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-0.5">
                  Descrizione Operativa & Destinazione d'Uso
                </label>
                <textarea
                  rows={2}
                  value={op.descrizione}
                  onChange={e => handleUpdate(idx, { descrizione: e.target.value })}
                  className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-0.5">
                  Prescrizioni di Sicurezza & Verifiche Periodiche
                </label>
                <textarea
                  rows={2}
                  value={op.prescrizioniSicurezza}
                  onChange={e => handleUpdate(idx, { prescrizioniSicurezza: e.target.value })}
                  className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                />
              </div>
            </div>

            {/* Conformità e PiMUS */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center bg-slate-50 dark:bg-slate-700/40 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-0.5">
                  Conformità Normativa
                </label>
                <input
                  type="text"
                  value={op.conformitaNormativa}
                  onChange={e => handleUpdate(idx, { conformitaNormativa: e.target.value })}
                  className="w-full p-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-0.5">
                  Verifiche Periodiche & Responsabile
                </label>
                <input
                  type="text"
                  value={op.verifichePeriodiche ? 'Verifiche periodiche obbligatorie prima dell’uso' : ''}
                  onChange={e => handleUpdate(idx, { verifichePeriodiche: true })}
                  className="w-full p-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                />
              </div>

              <div className="flex items-center gap-2 pt-2 sm:pt-4">
                <input
                  type="checkbox"
                  id={`pimus_${idx}`}
                  checked={op.pimusRichiesto}
                  onChange={e => handleUpdate(idx, { pimusRichiesto: e.target.checked })}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-0"
                />
                <label htmlFor={`pimus_${idx}`} className="text-xs font-black text-blue-800 dark:text-blue-300 cursor-pointer">
                  Pi.M.U.S. Obbligatorio in Cantiere
                </label>
              </div>
            </div>

            {/* SEZIONE DPI ANTICADUTA E OPERATORE CON IMMAGINETTE ISO 7010 */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-700/30 border border-slate-200 dark:border-slate-700 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#005ea6]" />
                  <span>DPI Anticaduta e Prescritti per Quota (Simboli ISO 7010)</span>
                </span>
                <span className="text-[9px] font-bold uppercase text-slate-400">All. VIII D.Lgs. 81/08</span>
              </div>

              {/* Badge DPI attivi */}
              {op.dpiNecessari && op.dpiNecessari.length > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                  {op.dpiNecessari.map((dpiName, dIdx) => (
                    <div key={dIdx} className="relative group">
                      <PosDpiBadge name={dpiName} size="md" showNorma={true} />
                      <button
                        type="button"
                        onClick={() => {
                          handleUpdate(idx, {
                            dpiNecessari: op.dpiNecessari?.filter((_, i) => i !== dIdx),
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
              )}

              {/* Selezione rapida DPI tramite pittogrammi blu */}
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-1.5 pt-1">
                {POS_DPI_LIST.slice(0, 8).map(dpi => {
                  const isChecked = (op.dpiNecessari || []).some(
                    d => d.toLowerCase().includes(dpi.nome.toLowerCase()) || dpi.nome.toLowerCase().includes(d.toLowerCase())
                  );
                  return (
                    <button
                      key={dpi.id}
                      type="button"
                      onClick={() => {
                        const currentDpis = op.dpiNecessari || [];
                        const updated = isChecked
                          ? currentDpis.filter(
                              d => !d.toLowerCase().includes(dpi.nome.toLowerCase()) && !dpi.nome.toLowerCase().includes(d.toLowerCase())
                            )
                          : [...currentDpis, dpi.nome];
                        handleUpdate(idx, { dpiNecessari: updated });
                      }}
                      className={`flex items-center gap-1.5 p-1.5 rounded-lg border text-left transition-all ${
                        isChecked
                          ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-500 font-bold text-blue-900 dark:text-blue-200'
                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                      }`}
                    >
                      <DpiPictogram name={dpi.nome} size="sm" />
                      <span className="text-[10px] font-bold truncate leading-tight">{dpi.nome}</span>
                    </button>
                  );
                })}
              </div>

              {/* Aggiunta DPI personalizzato per l'opera provvisionale */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="text"
                  value={customDpiText[idx] || ''}
                  onChange={e => setCustomDpiText({ ...customDpiText, [idx]: e.target.value })}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && customDpiText[idx]?.trim()) {
                      e.preventDefault();
                      handleUpdate(idx, {
                        dpiNecessari: [...(op.dpiNecessari || []), customDpiText[idx].trim()],
                      });
                      setCustomDpiText({ ...customDpiText, [idx]: '' });
                    }
                  }}
                  placeholder="Aggiungi DPI (es. Linea vita temporanea EN 795 tipo B)..."
                  className="flex-1 p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (customDpiText[idx]?.trim()) {
                      handleUpdate(idx, {
                        dpiNecessari: [...(op.dpiNecessari || []), customDpiText[idx].trim()],
                      });
                      setCustomDpiText({ ...customDpiText, [idx]: '' });
                    }
                  }}
                  className="px-2.5 py-1.5 bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 text-white rounded-lg text-xs font-bold shrink-0"
                >
                  + Aggiungi
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Personalizzazione Logo Opera Provvisionale */}
      {activeLogoModalIdx !== null && currentModalItem && (
        <PosSchedaLogoPickerModal
          tipo="opera"
          currentTitle={currentModalItem.tipo}
          currentLogoUrl={currentModalItem.logoUrl || currentModalItem.immagineUrl}
          onSave={({ logoUrl, immagineUrl }) => {
            handleUpdate(activeLogoModalIdx, { logoUrl, immagineUrl });
            setActiveLogoModalIdx(null);
          }}
          onClose={() => setActiveLogoModalIdx(null)}
        />
      )}
    </div>
  );
};

// ==========================================
// CAPITOLO 12: SOSTANZE CHIMICHE E SDS
// ==========================================
interface PosCapitolo12Props {
  sostanze: PosSostanzaItem[];
  onChange: (updated: PosSostanzaItem[]) => void;
}

export const PosCapitolo12View: React.FC<PosCapitolo12Props> = ({ sostanze, onChange }) => {
  const [activeLogoModalIdx, setActiveLogoModalIdx] = useState<number | null>(null);
  const [customDpiText, setCustomDpiText] = useState<{ [key: number]: string }>({});

  const handleAddDefaultFromCatalog = (templateItem: PosSostanzaItem) => {
    const exists = sostanze.some(s => s.nomeCommerciale.toLowerCase() === templateItem.nomeCommerciale.toLowerCase());
    if (exists) {
      alert(`La sostanza chimica "${templateItem.nomeCommerciale}" è già presente.`);
      return;
    }
    onChange([...sostanze, { ...templateItem, id: Math.random().toString() }]);
  };

  const handleAddNewCustom = () => {
    const nuova: PosSostanzaItem = {
      id: Math.random().toString(),
      nomeCommerciale: 'Nuovo Preparato Chimico',
      utilizzoFase: 'Fasi operative correlate di posa o finitura',
      produttoreFornitore: 'Fornitore qualificato con SDS allegata',
      schedaSicurezzaPresente: true,
      pittogrammiPericolo: ['GHS07'],
      frasiRischio: 'H315 Provoca irritazione cutanea. H318 Provoca gravi lesioni oculari.',
      dpiSpecifici: ['Guanti per rischio chimico', 'Occhiali di protezione a mascherina', 'Mascherina antipolvere / FFP2'],
      dpiObbligatori: ['Guanti per rischio chimico', 'Occhiali di protezione a mascherina'],
      prescrizioniManipolazione: 'Stoccare in luogo asciutto e ventilato. Non inalare le polveri. Lavare accuratamente dopo l’uso.',
    };
    onChange([...sostanze, nuova]);
  };

  const handleRemove = (idx: number) => {
    onChange(sostanze.filter((_, i) => i !== idx));
  };

  const handleUpdate = (idx: number, patch: Partial<PosSostanzaItem>) => {
    onChange(sostanze.map((s, i) => (i === idx ? { ...s, ...patch } : s)));
  };

  const currentModalItem = activeLogoModalIdx !== null ? sostanze[activeLogoModalIdx] : null;

  return (
    <div className="space-y-5 max-w-5xl mx-auto">
      {/* Header Capitolo 12 */}
      <div className="p-4 rounded-2xl bg-blue-50/50 dark:bg-slate-800 border border-blue-200 dark:border-slate-700">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded bg-blue-600 text-white font-black text-[10px] uppercase tracking-wider">
                CAPITOLO 12
              </span>
              <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-tight text-sm">
                SOSTANZE E PREPARATI PERICOLOSI (SCHEDE SDS & CLP)
              </h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Schede dei prodotti chimici, indicazioni di pericolo (Frasi H), pittogrammi GHS/CLP e DPI specifici di protezione individuale (All. XV Punto 2.1 Lett. g).
            </p>
          </div>
          <button
            type="button"
            onClick={handleAddNewCustom}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-xs shrink-0"
          >
            + Nuova Sostanza Chimica
          </button>
        </div>

        {/* Selezione rapida da catalogo chimico */}
        <div className="mt-3 pt-3 border-t border-blue-200 dark:border-slate-700 flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">Aggiungi rapidamente da catalogo SDS:</span>
          {DEFAULT_SOSTANZE_CATALOGO.map(cat => (
            <button
              key={cat.id}
              type="button"
              onClick={() => handleAddDefaultFromCatalog(cat)}
              className="px-2.5 py-1 bg-white dark:bg-slate-700 hover:bg-blue-50 dark:hover:bg-slate-600 border border-slate-200 dark:border-slate-600 text-slate-800 dark:text-slate-200 rounded-lg text-xs font-bold transition-all"
            >
              + {cat.nomeCommerciale}
            </button>
          ))}
        </div>
      </div>

      {/* Lista Schede Sostanze */}
      <div className="space-y-4">
        {sostanze.map((sost, idx) => {
          const effectiveDpis = sost.dpiSpecifici || sost.dpiObbligatori || [];
          return (
            <div
              key={sost.id || idx}
              className="p-5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 space-y-4 shadow-xs"
            >
              {/* Header Scheda con Logo e Titolo */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-700/60">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <button
                    type="button"
                    onClick={() => setActiveLogoModalIdx(idx)}
                    title="Clicca per personalizzare logo o caricare immagine"
                    className="shrink-0 group relative focus:outline-none"
                  >
                    <PosSchedaLogo
                      tipo="sostanza"
                      title={sost.nomeCommerciale}
                      logoUrl={sost.logoUrl || sost.immagineUrl}
                      size="md"
                    />
                    <span className="absolute -bottom-1 -right-1 bg-blue-600 text-white text-[8px] rounded-full px-1 font-black shadow-xs group-hover:scale-110 transition-transform">
                      ✎
                    </span>
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-[10px] font-black uppercase text-blue-600 dark:text-blue-400">
                        Scheda Sostanza Chimica (SDS) #{idx + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => setActiveLogoModalIdx(idx)}
                        className="text-[10px] font-bold text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-1"
                      >
                        <span>🖼️</span> <span>Cambia Logo/Immagine</span>
                      </button>
                    </div>
                    <input
                      type="text"
                      value={sost.nomeCommerciale}
                      onChange={e => handleUpdate(idx, { nomeCommerciale: e.target.value })}
                      className="w-full font-black text-sm p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemove(idx)}
                  className="text-slate-400 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 p-1.5 text-xs font-bold self-start sm:self-center"
                >
                  ✕ Rimuovi Scheda
                </button>
              </div>

              {/* Dati impiego, fornitore e SDS */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-0.5">
                    Fase d'Impiego Lavorativa
                  </label>
                  <input
                    type="text"
                    value={sost.utilizzoFase}
                    onChange={e => handleUpdate(idx, { utilizzoFase: e.target.value })}
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-0.5">
                    Produttore / Fornitore
                  </label>
                  <input
                    type="text"
                    value={sost.produttoreFornitore || ''}
                    onChange={e => handleUpdate(idx, { produttoreFornitore: e.target.value })}
                    placeholder="Nome produttore o distributore..."
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  />
                </div>

                <div className="flex items-center gap-2 pt-3 sm:pt-4">
                  <input
                    type="checkbox"
                    id={`sds_${idx}`}
                    checked={sost.schedaSicurezzaPresente}
                    onChange={e => handleUpdate(idx, { schedaSicurezzaPresente: e.target.checked })}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-0"
                  />
                  <label htmlFor={`sds_${idx}`} className="text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                    Scheda SDS a 16 Punti Presente in Cantiere
                  </label>
                </div>
              </div>

              {/* PITTOGRAMMI DI PERICOLO GHS / CLP INTERATTIVI */}
              <div className="p-3.5 rounded-xl bg-amber-50/40 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black uppercase text-amber-950 dark:text-amber-300 flex items-center gap-1.5">
                    <span>⚠️</span> <span>Pittogrammi di Pericolo GHS / CLP (Clicca per selezionare)</span>
                  </span>
                  <span className="text-[9px] font-mono font-bold text-amber-800 dark:text-amber-400">
                    Regolamento CE 1272/2008
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  {GHS_PICTOGRAM_CODES.map(code => {
                    const isSelected = (sost.pittogrammiPericolo || []).includes(code);
                    return (
                      <button
                        key={code}
                        type="button"
                        onClick={() => {
                          const currentCodes = sost.pittogrammiPericolo || [];
                          const updated = isSelected
                            ? currentCodes.filter(c => c !== code)
                            : [...currentCodes, code];
                          handleUpdate(idx, { pittogrammiPericolo: updated });
                        }}
                        className={`p-1.5 rounded-xl border transition-all flex items-center gap-1.5 ${
                          isSelected
                            ? 'bg-white dark:bg-slate-800 border-red-500 shadow-xs ring-2 ring-red-400/40'
                            : 'bg-white/60 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 opacity-40 hover:opacity-100'
                        }`}
                      >
                        <GhsHazardDiamond code={code} size="sm" />
                        <span className="text-[10px] font-black text-slate-800 dark:text-slate-200">{code}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Frasi H e prescrizioni */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-0.5">
                    Indicazioni di Pericolo (Frasi H)
                  </label>
                  <textarea
                    rows={2}
                    value={sost.frasiRischio}
                    onChange={e => handleUpdate(idx, { frasiRischio: e.target.value })}
                    placeholder="es. H315 Provoca irritazione cutanea..."
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-0.5">
                    Istruzioni di Manipolazione & Stoccaggio
                  </label>
                  <textarea
                    rows={2}
                    value={sost.prescrizioniManipolazione || ''}
                    onChange={e => handleUpdate(idx, { prescrizioniManipolazione: e.target.value })}
                    placeholder="Conservare nel contenitore originale in luogo asciutto e ventilato..."
                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  />
                </div>
              </div>

              {/* SEZIONE DPI RISCHIO CHIMICO CON IMMAGINETTE ISO 7010 */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-700/30 border border-slate-200 dark:border-slate-700 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black uppercase text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#005ea6]" />
                    <span>DPI Specifici di Protezione Chimica (Simboli ISO 7010)</span>
                  </span>
                  <span className="text-[9px] font-bold uppercase text-slate-400">All. VIII D.Lgs. 81/08</span>
                </div>

                {/* Badge DPI attivi */}
                {effectiveDpis.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2">
                    {effectiveDpis.map((dpiName, dIdx) => (
                      <div key={dIdx} className="relative group">
                        <PosDpiBadge name={dpiName} size="md" showNorma={true} />
                        <button
                          type="button"
                          onClick={() => {
                            const updated = effectiveDpis.filter((_, i) => i !== dIdx);
                            handleUpdate(idx, {
                              dpiSpecifici: updated,
                              dpiObbligatori: updated,
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
                )}

                {/* Selezione rapida DPI tramite pittogrammi blu */}
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-1.5 pt-1">
                  {POS_DPI_LIST.slice(0, 8).map(dpi => {
                    const isChecked = effectiveDpis.some(
                      d => d.toLowerCase().includes(dpi.nome.toLowerCase()) || dpi.nome.toLowerCase().includes(d.toLowerCase())
                    );
                    return (
                      <button
                        key={dpi.id}
                        type="button"
                        onClick={() => {
                          const updated = isChecked
                            ? effectiveDpis.filter(
                                d => !d.toLowerCase().includes(dpi.nome.toLowerCase()) && !dpi.nome.toLowerCase().includes(d.toLowerCase())
                              )
                            : [...effectiveDpis, dpi.nome];
                          handleUpdate(idx, { dpiSpecifici: updated, dpiObbligatori: updated });
                        }}
                        className={`flex items-center gap-1.5 p-1.5 rounded-lg border text-left transition-all ${
                          isChecked
                            ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-500 font-bold text-blue-900 dark:text-blue-200'
                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                        }`}
                      >
                        <DpiPictogram name={dpi.nome} size="sm" />
                        <span className="text-[10px] font-bold truncate leading-tight">{dpi.nome}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Aggiunta DPI personalizzato per la sostanza chimica */}
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="text"
                    value={customDpiText[idx] || ''}
                    onChange={e => setCustomDpiText({ ...customDpiText, [idx]: e.target.value })}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && customDpiText[idx]?.trim()) {
                        e.preventDefault();
                        const updated = [...effectiveDpis, customDpiText[idx].trim()];
                        handleUpdate(idx, { dpiSpecifici: updated, dpiObbligatori: updated });
                        setCustomDpiText({ ...customDpiText, [idx]: '' });
                      }
                    }}
                    placeholder="Aggiungi DPI chimico (es. Respiratore semi-facciale filtri A1P2)..."
                    className="flex-1 p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (customDpiText[idx]?.trim()) {
                        const updated = [...effectiveDpis, customDpiText[idx].trim()];
                        handleUpdate(idx, { dpiSpecifici: updated, dpiObbligatori: updated });
                        setCustomDpiText({ ...customDpiText, [idx]: '' });
                      }
                    }}
                    className="px-2.5 py-1.5 bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 text-white rounded-lg text-xs font-bold shrink-0"
                  >
                    + Aggiungi
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Personalizzazione Logo Sostanza Chimica */}
      {activeLogoModalIdx !== null && currentModalItem && (
        <PosSchedaLogoPickerModal
          tipo="sostanza"
          currentTitle={currentModalItem.nomeCommerciale}
          currentLogoUrl={currentModalItem.logoUrl || currentModalItem.immagineUrl}
          onSave={({ logoUrl, immagineUrl }) => {
            handleUpdate(activeLogoModalIdx, { logoUrl, immagineUrl });
            setActiveLogoModalIdx(null);
          }}
          onClose={() => setActiveLogoModalIdx(null)}
        />
      )}
    </div>
  );
};
