import React, { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { PosDocument } from '../../types';
import {
  POS_DPI_LIST,
  formatMissingData,
  MATRICE_RISCHIO_4X4,
  CRITERI_PROBABILITA,
  CRITERI_DANNO,
  CLASSI_RISCHIO_DEF,
  DEFAULT_ORGANIZZAZIONE_CANTIERE,
  CALCOLA_RISCHIO_TECNICO,
} from '../../data/posDefaultData';
import { Icons } from '../../constants';
import { PosSchedaLogo, PosDpiBadge, GhsHazardDiamond } from './PosSafetyCardVisuals';

interface PosDocumentPrintViewProps {
  pos: PosDocument;
  onClose: () => void;
}

export const PosDocumentPrintView: React.FC<PosDocumentPrintViewProps> = ({ pos, onClose }) => {
  const safeVersione = pos.versione || (pos as any).revisione || '00';
  const safePos: PosDocument = {
    ...pos,
    versione: safeVersione,
    revisione: safeVersione,
  };
  const [isPrinting, setIsPrinting] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const handleScroll = (direction: 'up' | 'down' | 'left' | 'right' | 'top') => {
    if (!scrollContainerRef.current) return;
    if (direction === 'up') scrollContainerRef.current.scrollBy({ top: -450, behavior: 'smooth' });
    else if (direction === 'down') scrollContainerRef.current.scrollBy({ top: 450, behavior: 'smooth' });
    else if (direction === 'left') scrollContainerRef.current.scrollBy({ left: -350, behavior: 'smooth' });
    else if (direction === 'right') scrollContainerRef.current.scrollBy({ left: 350, behavior: 'smooth' });
    else if (direction === 'top') scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handlePrint = () => {
    setIsPrinting(true);
    // Assicura che la vista sia posizionata in cima per una corretta impaginazione browser
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
    setTimeout(() => {
      try {
        window.print();
      } catch (err) {
        console.error('Errore durante la stampa:', err);
      } finally {
        setIsPrinting(false);
      }
    }, 150);
  };

  const getDpiNorma = (dpiNome: string) => {
    const found = POS_DPI_LIST.find(d => dpiNome.toLowerCase().includes(d.nome.toLowerCase()) || d.nome.toLowerCase().includes(dpiNome.toLowerCase()));
    return found ? found.norma : 'Norma armonizzata EN';
  };

  return createPortal(
    <div id="pos-modal-portal">
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page {
            size: A4 portrait !important;
            margin: 8mm 10mm !important;
          }
          /* Nasconde l'intera applicazione sottostante */
          body > *:not(#pos-modal-portal) {
            display: none !important;
          }
          html, body {
            overflow: visible !important;
            height: auto !important;
            background: #ffffff !important;
            color: #0f172a !important;
            margin: 0 !important;
            padding: 0 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          #pos-modal-portal {
            display: block !important;
            position: static !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            overflow: visible !important;
          }
          #pos-modal-portal * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .print\\:hidden, #pos-floating-nav, #pos-top-actionbar {
            display: none !important;
          }
          #pos-scroll-container {
            position: static !important;
            display: block !important;
            overflow: visible !important;
            background: #ffffff !important;
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
          }
          #pos-document-root {
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 auto !important;
            padding: 0 !important;
            box-shadow: none !important;
            border: none !important;
          }
          .page-break-before {
            page-break-before: always !important;
            break-before: page !important;
          }
          .page-break-after {
            page-break-after: always !important;
            break-after: page !important;
          }
          .pos-chapter-page {
            page-break-before: always !important;
            break-before: page !important;
            min-height: 275mm !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: space-between !important;
            box-sizing: border-box !important;
          }
          .page-break-avoid {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          tr {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          table {
            page-break-inside: auto !important;
            width: 100% !important;
            border-collapse: collapse !important;
          }
        }
      `}} />

      {/* Floating Directional Navigation Pad - Rigorosamente fisso sul Viewport (non scrolla con il documento) */}
      <div id="pos-floating-nav" className="fixed bottom-6 right-6 z-[60] print:hidden flex flex-col items-center bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl space-y-2 select-none">
        <div className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 text-center w-full">
          Navigatore
        </div>
        <div className="grid grid-cols-3 gap-1.5 items-center justify-items-center">
          <div />
          <button
            type="button"
            onClick={() => handleScroll('up')}
            title="Scorri in alto"
            className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-blue-600 hover:text-white text-slate-700 dark:text-slate-300 flex items-center justify-center transition-all shadow-sm active:scale-95 cursor-pointer"
          >
            <Icons.ChevronUp className="w-5 h-5" />
          </button>
          <div />

          <button
            type="button"
            onClick={() => handleScroll('left')}
            title="Scorri a sinistra"
            className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-blue-600 hover:text-white text-slate-700 dark:text-slate-300 flex items-center justify-center transition-all shadow-sm active:scale-95 cursor-pointer"
          >
            <Icons.ChevronLeft className="w-5 h-5" />
          </button>

          <button
            type="button"
            onClick={() => handleScroll('top')}
            title="Torna all'inizio"
            className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 hover:bg-blue-600 hover:text-white flex items-center justify-center font-black text-[10px] transition-all shadow-sm active:scale-95 cursor-pointer"
          >
            TOP
          </button>

          <button
            type="button"
            onClick={() => handleScroll('right')}
            title="Scorri a destra"
            className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-blue-600 hover:text-white text-slate-700 dark:text-slate-300 flex items-center justify-center transition-all shadow-sm active:scale-95 cursor-pointer"
          >
            <Icons.ChevronRight className="w-5 h-5" />
          </button>

          <div />
          <button
            type="button"
            onClick={() => handleScroll('down')}
            title="Scorri in basso"
            className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-blue-600 hover:text-white text-slate-700 dark:text-slate-300 flex items-center justify-center transition-all shadow-sm active:scale-95 cursor-pointer"
          >
            <Icons.ChevronDown className="w-5 h-5" />
          </button>
          <div />
        </div>

        {/* Indice Rapido Salti di Capitolo */}
        <div className="pt-2 border-t border-slate-200 dark:border-slate-800 w-full flex flex-col gap-1 max-h-[320px] overflow-y-auto custom-scrollbar">
          <button
            type="button"
            onClick={() => scrollToSection('pos-cap-copertina')}
            className="w-full text-left px-2 py-1 rounded-lg text-[10px] font-bold text-slate-600 dark:text-slate-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 cursor-pointer"
          >
            📋 Copertina
          </button>
          <button
            type="button"
            onClick={() => scrollToSection('pos-cap-indice')}
            className="w-full text-left px-2 py-1 rounded-lg text-[10px] font-bold text-slate-600 dark:text-slate-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 cursor-pointer"
          >
            📑 Indice Generale
          </button>
          <button
            type="button"
            onClick={() => scrollToSection('pos-cap-1')}
            className="w-full text-left px-2 py-1 rounded-lg text-[10px] font-bold text-slate-600 dark:text-slate-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 cursor-pointer"
          >
            🏢 Cap. 1: Dati Identificativi
          </button>
          <button
            type="button"
            onClick={() => scrollToSection('pos-cap-2')}
            className="w-full text-left px-2 py-1 rounded-lg text-[10px] font-bold text-slate-600 dark:text-slate-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 cursor-pointer"
          >
            🏗️ Cap. 2: Descrizione Opera
          </button>
          <button
            type="button"
            onClick={() => scrollToSection('pos-cap-3')}
            className="w-full text-left px-2 py-1 rounded-lg text-[10px] font-bold text-slate-600 dark:text-slate-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 cursor-pointer"
          >
            👷 Cap. 3: Personale & Mansioni
          </button>
          <button
            type="button"
            onClick={() => scrollToSection('pos-cap-6')}
            className="w-full text-left px-2 py-1 rounded-lg text-[10px] font-bold text-slate-600 dark:text-slate-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 cursor-pointer"
          >
            📊 Cap. 6: Metodologia Rischi
          </button>
          <button
            type="button"
            onClick={() => scrollToSection('pos-cap-9')}
            className="w-full text-left px-2 py-1 rounded-lg text-[10px] font-bold text-slate-600 dark:text-slate-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 cursor-pointer"
          >
            🔨 Cap. 9: Schede Lavorazioni
          </button>
          <button
            type="button"
            onClick={() => scrollToSection('pos-cap-10')}
            className="w-full text-left px-2 py-1 rounded-lg text-[10px] font-bold text-slate-600 dark:text-slate-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 cursor-pointer"
          >
            🚜 Cap. 10: Attrezzature
          </button>
          <button
            type="button"
            onClick={() => scrollToSection('pos-cap-11')}
            className="w-full text-left px-2 py-1 rounded-lg text-[10px] font-bold text-slate-600 dark:text-slate-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 cursor-pointer"
          >
            🪜 Cap. 11: Opere Provvisionali
          </button>
          <button
            type="button"
            onClick={() => scrollToSection('pos-cap-12')}
            className="w-full text-left px-2 py-1 rounded-lg text-[10px] font-bold text-slate-600 dark:text-slate-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 cursor-pointer"
          >
            🧪 Cap. 12: Sostanze Chimiche
          </button>
          <button
            type="button"
            onClick={() => scrollToSection('pos-cap-13')}
            className="w-full text-left px-2 py-1 rounded-lg text-[10px] font-bold text-slate-600 dark:text-slate-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 cursor-pointer"
          >
            🚨 Cap. 13: Emergenze
          </button>
          <button
            type="button"
            onClick={() => scrollToSection('pos-cap-14')}
            className="w-full text-left px-2 py-1 rounded-lg text-[10px] font-bold text-slate-600 dark:text-slate-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 cursor-pointer"
          >
            ✍️ Cap. 14: Firme e Chiusura
          </button>
        </div>
      </div>

      {/* Main Print Overlay Container con Scroll Interno */}
      <div
        ref={scrollContainerRef}
        id="pos-scroll-container"
        className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-start overflow-y-auto overflow-x-auto p-2 sm:p-6 print:p-0 print:static print:bg-white print:overflow-visible custom-scrollbar"
      >
        {/* Action Bar Header */}
        <div id="pos-top-actionbar" className="w-full max-w-5xl bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-4 mb-6 flex flex-col gap-3 sticky top-4 z-20 print:hidden">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center font-black">
                <Icons.Printer />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                  Documento POS Ufficiale (14 Capitoli - All. XV D.Lgs. 81/08)
                </h3>
                <p className="text-[11px] font-bold text-slate-400">
                  {safePos.codice} • Rev. {safeVersione} • Formato UNI A4 Verticale • Layout e Grafica Ufficiale
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              {/* Tasto Primario Unico: Stampa Diretta / Salva in PDF */}
              <button
                type="button"
                onClick={handlePrint}
                disabled={isPrinting}
                className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-md shadow-blue-600/30 active:scale-95 cursor-pointer ring-2 ring-blue-500/20"
                title="Apre la finestra di stampa del browser (Ctrl+P) per stampare su carta o Salvare in PDF con grafica aggiornata e immagini"
              >
                {isPrinting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Apertura Stampa...</span>
                  </>
                ) : (
                  <>
                    <Icons.Printer />
                    <span>Stampa / Salva in PDF</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-black uppercase tracking-widest transition-all cursor-pointer"
              >
                Chiudi
              </button>
            </div>
          </div>

          {/* Istruzione chiara e immediata per salvare in PDF */}
          <div className="flex items-center gap-2 px-3.5 py-2.5 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 rounded-xl text-[11px] text-blue-900 dark:text-blue-200">
            <span className="text-base select-none">💡</span>
            <span>
              <strong>Come salvare in PDF con la grafica aggiornata:</strong> Clicca sul pulsante blu <strong>"Stampa / Salva in PDF"</strong> e nella finestra di stampa del browser scegli come <em>Destinazione</em> la voce <strong>"Salva come PDF"</strong>. Il file conterrà l'impaginazione completa, i loghi, le tabelle e tutte le immagini ad alta risoluzione.
            </span>
          </div>
        </div>

        {/* ========================================================= */}
        {/* FOGLIO A4 DOCUMENTO POS TECNICO UFFICIALE (14 CAPITOLI) */}
        {/* ========================================================= */}
        <div
          id="pos-document-root"
        className="w-full max-w-[210mm] bg-white text-slate-900 shadow-2xl p-6 sm:p-10 mb-16 rounded-sm border border-slate-200 font-sans print:p-0 print:shadow-none print:border-none print:m-0 print:w-full print:max-w-none leading-relaxed text-[11px]"
      >
        {/* ================= COPERTINA (PAGINA 1 DEDICATA) ================= */}
        <div id="pos-cap-copertina" className="border-4 border-slate-900 p-8 mb-10 print:mb-0 text-center relative min-h-[265mm] print:min-h-[285mm] flex flex-col justify-between page-break-after print:break-after-page">
          <div className="border border-slate-400 p-6 flex-1 flex flex-col justify-between">
            {/* Testata Istituzionale */}
            <div>
              <div className="text-center mb-6">
                <span className="inline-block px-3 py-1 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest mb-3">
                  REPUBBLICA ITALIANA - D.LGS. 9 APRILE 2008 N. 81 E S.M.I.
                </span>
                <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-slate-900 leading-tight">
                  PIANO OPERATIVO DI SICUREZZA
                </h1>
                <p className="text-xs font-bold text-slate-700 uppercase tracking-wider mt-1">
                  (P.O.S. - TITOLO IV, CAPO I - ART. 89 COMMA 1 LETT. H E ALLEGATO XV)
                </p>
                <div className="text-[10px] text-slate-500 mt-2 font-mono">
                  CODICE DOCUMENTO: {pos.codice} | REVISIONE: {pos.versione} | DATA: {pos.dataRedazione}
                </div>
              </div>

              {/* Riquadri Copertina */}
              <div className="my-8 py-6 border-y-2 border-slate-900 grid grid-cols-1 sm:grid-cols-2 gap-6 text-left">
                <div className="bg-slate-50 p-4 border border-slate-300 rounded">
                  <span className="text-[10px] font-black text-blue-900 uppercase tracking-widest block mb-2 border-b pb-1">
                    IMPRESA ESECUTRICE
                  </span>
                  <p className="text-base font-black text-slate-900 uppercase">
                    {formatMissingData(pos.datiImpresa.ragioneSociale, 'Denominazione Impresa')}
                  </p>
                  <p className="text-xs text-slate-700 mt-1">
                    Sede Legale: {formatMissingData(pos.datiImpresa.sedeLegale, 'Indirizzo Sede')}
                  </p>
                  <p className="text-xs text-slate-700">
                    P.IVA: {formatMissingData(pos.datiImpresa.partitaIva, 'P.IVA')} | C.F.: {formatMissingData(pos.datiImpresa.codiceFiscale, 'C.F.')}
                  </p>
                  <p className="text-xs text-slate-700">
                    Tel: {formatMissingData(pos.datiImpresa.telefono, 'Telefono')} | PEC: {formatMissingData(pos.datiImpresa.pec, 'PEC')}
                  </p>
                  <p className="text-xs text-slate-900 font-bold mt-2">
                    Datore di Lavoro e RSPP: {formatMissingData(pos.datiImpresa.datoreDiLavoro || pos.datiImpresa.rspp, 'Datore di Lavoro e RSPP')}
                  </p>
                </div>

                <div className="bg-slate-50 p-4 border border-slate-300 rounded">
                  <span className="text-[10px] font-black text-blue-900 uppercase tracking-widest block mb-2 border-b pb-1">
                    CANTIERE & COMMITTENZA
                  </span>
                  <p className="text-base font-black text-slate-900 uppercase">
                    {formatMissingData(pos.datiCantiere.nome, 'Denominazione Cantiere')}
                  </p>
                  <p className="text-xs text-slate-700 mt-1">
                    Indirizzo: {formatMissingData(pos.datiCantiere.indirizzo, 'Ubicazione Cantiere')}
                  </p>
                  <p className="text-xs text-slate-700">
                    Committente: {formatMissingData(pos.datiCantiere.committente, 'Nome Committente')}
                  </p>
                  <p className="text-xs text-slate-700">
                    Direttore Lavori: {formatMissingData(pos.datiCantiere.direttoreLavori, 'Non nominato / Privato')}
                  </p>
                  <p className="text-xs text-slate-700">
                    Coordinatore Sicurezza (CSE): {formatMissingData(pos.datiCantiere.cse, 'Da nominare a cura Committente')}
                  </p>
                  <p className="text-xs text-slate-900 font-bold mt-2">
                    Preposto di Cantiere: {formatMissingData(pos.datiImpresa.prepostoCantiere, 'Nome Preposto Incaricato')}
                  </p>
                </div>
              </div>
            </div>

            {/* Note di Copertina */}
            <div className="text-center text-[10px] text-slate-500 uppercase tracking-widest border-t pt-4">
              Documento Tecnico di Sicurezza redatto ai sensi del D.Lgs. 9 aprile 2008 n. 81 integrato con le disposizioni del D.Lgs. 106/2009.
            </div>
          </div>
        </div>

        {/* ================= INDICE GENERALE DEI 14 CAPITOLI (PAGINA 2 DEDICATA) ================= */}
        <div
          id="pos-cap-indice"
          className="border-2 border-slate-900 p-6 sm:p-8 mb-10 print:mb-0 bg-white min-h-[265mm] print:min-h-[285mm] flex flex-col justify-between page-break-before page-break-after print:break-before-page print:break-after-page"
        >
          <div>
            {/* Testata Istituzionale Indice */}
            <div className="border-b-2 border-slate-900 pb-3 mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-[9px] font-black tracking-widest text-slate-500 uppercase block">
                  REPUBBLICA ITALIANA - D.LGS. 9 APRILE 2008 N. 81 - ALLEGATO XV
                </span>
                <h2 className="text-sm sm:text-base font-black uppercase text-slate-900 tracking-tight">
                  SOMMARIO GENERALE DEI CONTENUTI & INDICE ANALITICO DEI CAPITOLI
                </h2>
                <p className="text-[10px] text-slate-600 mt-0.5">
                  Articolazione in 14 Capitoli di Conformità ai sensi dell'Allegato XV e dell'Art. 89 del D.Lgs. 81/2008 e s.m.i.
                </p>
              </div>
              <div className="text-right border-l-0 sm:border-l-2 border-slate-900 sm:pl-3 shrink-0">
                <span className="text-[9px] font-bold text-slate-500 uppercase block">Documento Tecnico</span>
                <span className="text-xs font-black text-slate-900 font-mono block">{pos.codice}</span>
                <span className="text-[9px] font-bold text-blue-700 block">Rev. {pos.versione} | Pagina 2</span>
              </div>
            </div>

            {/* Riquadro Dati Identificativi Documento */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-50 border border-slate-300 rounded text-[10px] mb-4">
              <div>
                <strong className="text-slate-900 uppercase block font-black">Impresa Esecutrice:</strong>
                <span className="text-slate-800">{formatMissingData(pos.datiImpresa.ragioneSociale)}</span>
              </div>
              <div>
                <strong className="text-slate-900 uppercase block font-black">Cantiere di Esecuzione:</strong>
                <span className="text-slate-800">{formatMissingData(pos.datiCantiere.nome)} ({formatMissingData(pos.datiCantiere.indirizzo)})</span>
              </div>
            </div>

            {/* Tabella Analitica dei 14 Capitoli */}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-slate-300 text-[10px]">
                <thead>
                  <tr className="bg-slate-900 text-white font-black text-left">
                    <th className="p-1.5 border border-slate-400 w-16 text-center">N. Cap.</th>
                    <th className="p-1.5 border border-slate-400 w-44">Denominazione Sezione</th>
                    <th className="p-1.5 border border-slate-400">Contenuti Analitici e Prescrizioni Trattate</th>
                    <th className="p-1.5 border border-slate-400 w-36 text-center">Rif. Normativo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  <tr className="hover:bg-slate-50">
                    <td className="p-1.5 border border-slate-300 text-center font-black bg-slate-100">CAP. 1</td>
                    <td className="p-1.5 border border-slate-300 font-bold text-slate-900">Dati Identificativi</td>
                    <td className="p-1.5 border border-slate-300 text-slate-700">Anagrafica impresa, sedi, recapiti, INPS, INAIL, Cassa Edile, figure della sicurezza (DL, RSPP, RLS, Medico), subappalti.</td>
                    <td className="p-1.5 border border-slate-300 text-slate-600 text-center font-mono text-[9px]">All. XV p. 2.1 lett. a-b</td>
                  </tr>
                  <tr className="hover:bg-slate-50 bg-slate-50/50">
                    <td className="p-1.5 border border-slate-300 text-center font-black bg-slate-100">CAP. 2</td>
                    <td className="p-1.5 border border-slate-300 font-bold text-slate-900">Descrizione dell'Opera</td>
                    <td className="p-1.5 border border-slate-300 text-slate-700">Descrizione sommaria dei lavori, tipologia strutturale, entità presunta (uomini-giorno), specifiche mansioni e fasi assegnate.</td>
                    <td className="p-1.5 border border-slate-300 text-slate-600 text-center font-mono text-[9px]">All. XV p. 2.1 lett. c-d</td>
                  </tr>
                  <tr className="hover:bg-slate-50">
                    <td className="p-1.5 border border-slate-300 text-center font-black bg-slate-100">CAP. 3</td>
                    <td className="p-1.5 border border-slate-300 font-bold text-slate-900">Personale & Mansioni</td>
                    <td className="p-1.5 border border-slate-300 text-slate-700">Elenco nominativo lavoratori in cantiere, mansioni, giudizi idoneità sanitaria periodica e formazioni/abilitazioni obbligatorie.</td>
                    <td className="p-1.5 border border-slate-300 text-slate-600 text-center font-mono text-[9px]">All. XV p. 2.1 lett. e-f</td>
                  </tr>
                  <tr className="hover:bg-slate-50 bg-slate-50/50">
                    <td className="p-1.5 border border-slate-300 text-center font-black bg-slate-100">CAP. 4</td>
                    <td className="p-1.5 border border-slate-300 font-bold text-slate-900">Quadro Normativo</td>
                    <td className="p-1.5 border border-slate-300 text-slate-700">Riferimenti legislativi applicabili al cantiere (D.Lgs. 81/08 Titolo IV, D.Lgs. 106/09), definizioni giuridiche dei ruoli.</td>
                    <td className="p-1.5 border border-slate-300 text-slate-600 text-center font-mono text-[9px]">Titolo IV Capo I</td>
                  </tr>
                  <tr className="hover:bg-slate-50">
                    <td className="p-1.5 border border-slate-300 text-center font-black bg-slate-100">CAP. 5</td>
                    <td className="p-1.5 border border-slate-300 font-bold text-slate-900">Logistica & Impianti</td>
                    <td className="p-1.5 border border-slate-300 text-slate-700">Servizi igienico-assistenziali, recinzioni, accessi, viabilità interna, quadri elettrici ASC EN 61439-4, messa a terra di cantiere.</td>
                    <td className="p-1.5 border border-slate-300 text-slate-600 text-center font-mono text-[9px]">All. XV p. 2.1 lett. g</td>
                  </tr>
                  <tr className="hover:bg-slate-50 bg-slate-50/50">
                    <td className="p-1.5 border border-slate-300 text-center font-black bg-slate-100">CAP. 6</td>
                    <td className="p-1.5 border border-slate-300 font-bold text-slate-900">Metodologia Rischi (4×4)</td>
                    <td className="p-1.5 border border-slate-300 text-slate-700">Criteri analitici di quantificazione R = P × D, scale di probabilità e danno, matrice 4x4, gerarchia misure e rischio residuo.</td>
                    <td className="p-1.5 border border-slate-300 text-slate-600 text-center font-mono text-[9px]">Art. 15, 28, All. XV</td>
                  </tr>
                  <tr className="hover:bg-slate-50">
                    <td className="p-1.5 border border-slate-300 text-center font-black bg-slate-100">CAP. 7</td>
                    <td className="p-1.5 border border-slate-300 font-bold text-slate-900">Contesto Ambientale</td>
                    <td className="p-1.5 border border-slate-300 text-slate-700">Viabilità pubblica di accesso, linee aeree scoperte, sottoservizi in tensione, polveri, rumore verso terzi e meteo avverso.</td>
                    <td className="p-1.5 border border-slate-300 text-slate-600 text-center font-mono text-[9px]">All. XV p. 2.1 lett. h</td>
                  </tr>
                  <tr className="hover:bg-slate-50 bg-slate-50/50">
                    <td className="p-1.5 border border-slate-300 text-center font-black bg-slate-100">CAP. 8</td>
                    <td className="p-1.5 border border-slate-300 font-bold text-slate-900">Turni & Presenze</td>
                    <td className="p-1.5 border border-slate-300 text-slate-700">Orari ordinari di lavoro, turnazioni, disciplina straordinari e notturni, tesserini di riconoscimento e registro presenze.</td>
                    <td className="p-1.5 border border-slate-300 text-slate-600 text-center font-mono text-[9px]">Art. 26 c. 8, All. XV</td>
                  </tr>
                  <tr className="hover:bg-slate-50">
                    <td className="p-1.5 border border-slate-300 text-center font-black bg-slate-100">CAP. 9</td>
                    <td className="p-1.5 border border-slate-300 font-bold text-slate-900">Schede Lavorazioni</td>
                    <td className="p-1.5 border border-slate-300 text-slate-700">Fasi operative, modalità esecutive, attrezzature e sostanze connesse, valutazione rischi R=PxD, misure DPC e DPI EN prescritti.</td>
                    <td className="p-1.5 border border-slate-300 text-slate-600 text-center font-mono text-[9px]">All. XV p. 2.1 lett. i</td>
                  </tr>
                  <tr className="hover:bg-slate-50 bg-slate-50/50">
                    <td className="p-1.5 border border-slate-300 text-center font-black bg-slate-100">CAP. 10</td>
                    <td className="p-1.5 border border-slate-300 font-bold text-slate-900">Schede Attrezzature</td>
                    <td className="p-1.5 border border-slate-300 text-slate-700">Parco macchine e utensili, marcatura CE, verifiche periodiche All. VII, istruzioni d'uso conforme e DPI per operatore.</td>
                    <td className="p-1.5 border border-slate-300 text-slate-600 text-center font-mono text-[9px]">Titolo III, All. V-VI</td>
                  </tr>
                  <tr className="hover:bg-slate-50">
                    <td className="p-1.5 border border-slate-300 text-center font-black bg-slate-100">CAP. 11</td>
                    <td className="p-1.5 border border-slate-300 font-bold text-slate-900">Opere Provvisionali</td>
                    <td className="p-1.5 border border-slate-300 text-slate-700">Ponteggi fissi con PiMUS, trabattelli EN 1004, scale portatili EN 131, parapetti e sistemi di arresto caduta EN 795.</td>
                    <td className="p-1.5 border border-slate-300 text-slate-600 text-center font-mono text-[9px]">Titolo IV Capo II</td>
                  </tr>
                  <tr className="hover:bg-slate-50 bg-slate-50/50">
                    <td className="p-1.5 border border-slate-300 text-center font-black bg-slate-100">CAP. 12</td>
                    <td className="p-1.5 border border-slate-300 font-bold text-slate-900">Sostanze Chimiche (SDS)</td>
                    <td className="p-1.5 border border-slate-300 text-slate-700">Preparati pericolosi impiegati, indicazioni di pericolo (Frasi H), pittogrammi GHS/CLP, schede SDS e DPI chimici ISO 7010.</td>
                    <td className="p-1.5 border border-slate-300 text-slate-600 text-center font-mono text-[9px]">Titolo IX, Reg. CLP</td>
                  </tr>
                  <tr className="hover:bg-slate-50">
                    <td className="p-1.5 border border-slate-300 text-center font-black bg-slate-100">CAP. 13</td>
                    <td className="p-1.5 border border-slate-300 font-bold text-slate-900">Gestione Emergenze</td>
                    <td className="p-1.5 border border-slate-300 text-slate-700">Procedure di primo soccorso, presidi D.M. 388/03, piano antincendio, vie di fuga e numeri di emergenza territoriale (112, VVF).</td>
                    <td className="p-1.5 border border-slate-300 text-slate-600 text-center font-mono text-[9px]">All. XV p. 2.1 lett. k</td>
                  </tr>
                  <tr className="hover:bg-slate-50 bg-slate-50/50">
                    <td className="p-1.5 border border-slate-300 text-center font-black bg-slate-100">CAP. 14</td>
                    <td className="p-1.5 border border-slate-300 font-bold text-slate-900">Allegati & Firme</td>
                    <td className="p-1.5 border border-slate-300 text-slate-700">Verbale consultazione RLS (art. 50), documentazione tecnico-professionale All. XVII, dichiarazioni di conformità e sottoscrizioni.</td>
                    <td className="p-1.5 border border-slate-300 text-slate-600 text-center font-mono text-[9px]">Art. 50, 96, All. XVII</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Riquadro di Chiusura Indice: Validazione e RLS */}
          <div className="border-t-2 border-slate-900 pt-3 mt-4 text-[9px] text-slate-600 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-2.5 border border-slate-300 rounded bg-slate-50">
              <strong className="block uppercase text-slate-900 font-black mb-1">
                CONSULTAZIONE R.L.S. (ART. 50 C. 1 LETT. B D.LGS. 81/08)
              </strong>
              <p className="text-[9px] leading-tight text-slate-600">
                Il presente Piano Operativo di Sicurezza è stato preliminarmente esaminato e condiviso con il Rappresentante dei Lavoratori per la Sicurezza prima dell'inizio dei lavori.
              </p>
              <div className="mt-3 pt-1 border-t border-slate-300 flex justify-between items-center text-[8px] text-slate-500 font-mono">
                <span>Firma R.L.S. / R.L.S.T.: _______________________</span>
                <span>Data: {pos.dataRedazione}</span>
              </div>
            </div>

            <div className="p-2.5 border border-slate-300 rounded bg-slate-50">
              <strong className="block uppercase text-slate-900 font-black mb-1">
                VALIDAZIONE E CONFORMITÀ DATORE DI LAVORO (ART. 89 E 96)
              </strong>
              <p className="text-[9px] leading-tight text-slate-600">
                Si attesta la conformità del presente documento alle lavorazioni di cantiere e ai contenuti minimi obbligatori prescritti dall'Allegato XV del D.Lgs. 81/08.
              </p>
              <div className="mt-3 pt-1 border-t border-slate-300 flex justify-between items-center text-[8px] text-slate-500 font-mono">
                <span>Timbro e Firma Datore di Lavoro: _______________________</span>
                <span>Luogo: {pos.datiImpresa.sedeLegale?.split(',')?.[0] || 'In Sede'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ================= CAPITOLO 1: DATI IDENTIFICATIVI (PAGINA DEDICATA) ================= */}
        <div id="pos-cap-1" className="pos-chapter-page border-2 border-slate-900 p-6 sm:p-8 mb-10 print:mb-0 bg-white min-h-[265mm] print:min-h-[285mm] flex flex-col justify-between page-break-before print:break-before-page">
          <div>
            {/* Header Capitolo 1 */}
            <div className="border-b-2 border-slate-900 pb-3 mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <span className="px-2.5 py-1 bg-slate-900 text-white text-[11px] font-black uppercase tracking-wider rounded">
                  CAP. 1
                </span>
                <div>
                  <h2 className="text-sm sm:text-base font-black text-slate-900 uppercase tracking-tight">
                    DATI IDENTIFICATIVI GENERALI
                  </h2>
                  <span className="text-[9px] font-semibold text-slate-500 uppercase">
                    Allegato XV punto 2.1 lettere a) e b) D.Lgs. 81/2008 e s.m.i.
                  </span>
                </div>
              </div>
              <div className="text-right border-l-0 sm:border-l-2 border-slate-900 sm:pl-3 shrink-0">
                <span className="text-[9px] font-mono text-slate-600 block">{pos.codice}</span>
                <span className="text-[9px] font-bold text-blue-700 block">Capitolo 1 • Pagina Dedicata</span>
              </div>
            </div>

            {/* 1.1 Impresa Esecutrice */}
            <div className="mb-4">
              <h3 className="font-bold text-[11px] uppercase text-slate-900 mb-1.5 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-blue-600 rounded-full" />
                1.1 Dati Identificativi dell'Impresa Esecutrice (All. XV p. 2.1 lett. a)
              </h3>
              <table className="w-full border-collapse border border-slate-300 text-[10px]">
                <tbody>
                  <tr className="border-b border-slate-300">
                    <td className="w-1/3 bg-slate-100 p-1.5 font-bold">Ragione Sociale:</td>
                    <td className="p-1.5 font-black text-slate-900">{formatMissingData(pos.datiImpresa.ragioneSociale, 'Ragione Sociale')}</td>
                  </tr>
                  <tr className="border-b border-slate-300">
                    <td className="bg-slate-100 p-1.5 font-bold">Sede Legale ed Operativa:</td>
                    <td className="p-1.5">{formatMissingData(pos.datiImpresa.sedeLegale, 'Indirizzo Sede')}</td>
                  </tr>
                  <tr className="border-b border-slate-300">
                    <td className="bg-slate-100 p-1.5 font-bold">Codice Fiscale / Partita IVA:</td>
                    <td className="p-1.5 font-mono">{formatMissingData(pos.datiImpresa.codiceFiscale)} / {formatMissingData(pos.datiImpresa.partitaIva)}</td>
                  </tr>
                  <tr className="border-b border-slate-300">
                    <td className="bg-slate-100 p-1.5 font-bold">Recapiti Ufficiali (Telefono / PEC):</td>
                    <td className="p-1.5">{formatMissingData(pos.datiImpresa.telefono)} | PEC: {formatMissingData(pos.datiImpresa.pec)}</td>
                  </tr>
                  <tr className="border-b border-slate-300">
                    <td className="bg-slate-100 p-1.5 font-bold">Iscrizione CCIAA / Settore Attività:</td>
                    <td className="p-1.5">{pos.datiImpresa.iscrizioneCciaa || 'Iscritta al Registro Imprese CCIAA per attività di Costruzioni e Opere Edili'}</td>
                  </tr>
                  <tr className="border-b border-slate-300">
                    <td className="bg-slate-100 p-1.5 font-bold">Posizioni Previdenziali & Assicurative:</td>
                    <td className="p-1.5 font-mono text-[9px]">{pos.datiImpresa.posizioniAssicurative || 'INPS Matricola reg. • INAIL Codice Ditta reg.'}</td>
                  </tr>
                  <tr>
                    <td className="bg-slate-100 p-1.5 font-bold">Cassa Edile & Regolarità Contributiva:</td>
                    <td className="p-1.5">{formatMissingData(pos.datiImpresa.cassaEdileIscrizione, 'Regolare posizione Cassa Edile / DURC in corso di validità')}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* 1.2 Cantiere e Committenza */}
            <div className="mb-4">
              <h3 className="font-bold text-[11px] uppercase text-slate-900 mb-1.5 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-blue-600 rounded-full" />
                1.2 Dati Identificativi del Cantiere e Soggetti Istituzionali (All. XV p. 2.1 lett. b)
              </h3>
              <table className="w-full border-collapse border border-slate-300 text-[10px]">
                <tbody>
                  <tr className="border-b border-slate-300">
                    <td className="w-1/3 bg-slate-100 p-1.5 font-bold">Denominazione Cantiere:</td>
                    <td className="p-1.5 font-bold text-slate-900">{formatMissingData(pos.datiCantiere.nome)}</td>
                  </tr>
                  <tr className="border-b border-slate-300">
                    <td className="bg-slate-100 p-1.5 font-bold">Ubicazione e Indirizzo Lavori:</td>
                    <td className="p-1.5">{formatMissingData(pos.datiCantiere.indirizzo)} ({formatMissingData(pos.datiCantiere.comune)})</td>
                  </tr>
                  <tr className="border-b border-slate-300">
                    <td className="bg-slate-100 p-1.5 font-bold">Committente / Responsabile Lavori:</td>
                    <td className="p-1.5">{formatMissingData(pos.datiCantiere.committente)} (C.F./P.IVA: {formatMissingData(pos.datiCantiere.committenteCfPiva, 'N.D.')})</td>
                  </tr>
                  <tr className="border-b border-slate-300">
                    <td className="bg-slate-100 p-1.5 font-bold">Coordinatore Sicurezza Esecuzione (CSE):</td>
                    <td className="p-1.5 font-bold text-slate-900">{formatMissingData(pos.datiCantiere.cse, 'Non nominato a cura del Committente')}</td>
                  </tr>
                  <tr className="border-b border-slate-300">
                    <td className="bg-slate-100 p-1.5 font-bold">Direttore dei Lavori (D.L.):</td>
                    <td className="p-1.5">{formatMissingData(pos.datiCantiere.direttoreLavori, 'Non nominato / Privato')}</td>
                  </tr>
                  <tr>
                    <td className="bg-slate-100 p-1.5 font-bold">Notifica Preliminare ASL / ITL:</td>
                    <td className="p-1.5 font-mono text-[9px]">{pos.datiCantiere.notificaPreliminare || 'Inviata ex Art. 99 D.Lgs. 81/08 a cura del Committente/Responsabile Lavori'}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* 1.3 Figure della Sicurezza */}
            <div className="mb-4">
              <h3 className="font-bold text-[11px] uppercase text-slate-900 mb-1.5 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-blue-600 rounded-full" />
                1.3 Figure Aziendali con Compiti di Sicurezza (Art. 89 e All. XV p. 2.1)
              </h3>
              <table className="w-full border-collapse border border-slate-300 text-[10px]">
                <tbody>
                  <tr className="border-b border-slate-300">
                    <td className="w-1/3 bg-slate-100 p-1.5 font-bold">Datore di Lavoro e RSPP:</td>
                    <td className="p-1.5 font-bold text-slate-900">
                      {formatMissingData(pos.datiImpresa.datoreDiLavoro || pos.datiImpresa.rspp)}
                      <span className="ml-2 text-slate-500 font-normal text-[9px]">(Svolge direttamente i compiti di RSPP ex art. 34 D.Lgs. 81/08)</span>
                    </td>
                  </tr>
                  <tr className="border-b border-slate-300">
                    <td className="bg-slate-100 p-1.5 font-bold">Medico Competente Incaricato:</td>
                    <td className="p-1.5">{formatMissingData(pos.datiImpresa.medicoCompetente, 'Non nominato (assenza esposizione rischi specifici)')}</td>
                  </tr>
                  <tr className="border-b border-slate-300">
                    <td className="bg-slate-100 p-1.5 font-bold">R.L.S. / R.L.S.T.:</td>
                    <td className="p-1.5">{formatMissingData(pos.datiImpresa.rls, 'RLST Territoriale Cassa Edile')}</td>
                  </tr>
                  <tr className="border-b border-slate-300">
                    <td className="bg-slate-100 p-1.5 font-bold">Preposto per la Sicurezza in Cantiere:</td>
                    <td className="p-1.5 font-bold text-slate-900">{formatMissingData(pos.datiImpresa.prepostoCantiere)} <span className="text-[9px] text-slate-500 font-normal">(Funzioni di sovrintendenza e vigilanza ex art. 19)</span></td>
                  </tr>
                  <tr>
                    <td className="bg-slate-100 p-1.5 font-bold">Addetti Primo Soccorso e Antincendio:</td>
                    <td className="p-1.5">{formatMissingData(pos.datiImpresa.addettoPrimoSoccorso, 'Personale formato D.M. 388/03 e D.M. 02/09/2021')}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* 1.4 Disciplina Subappalti */}
            <div>
              <h3 className="font-bold text-[11px] uppercase text-slate-800 mb-1">1.4 Subappalti e Lavoratori Autonomi (All. XV p. 2.1 lett. b)</h3>
              <p className="p-2 border border-slate-300 rounded bg-slate-50 text-[10px] text-slate-700 leading-relaxed">
                {pos.datiCantiere.subappalti || pos.datiCantiere.subappaltatoriDichiarati || 'Nessuna lavorazione affidata in subappalto o a lavoratori autonomi alla data di redazione del presente POS. In caso di subaffidamento, l’impresa esecutrice provvederà a verificare la conformità dell’idoneità tecnico-professionale ex Allegato XVII e ad acquisire il relativo POS prima dell’accesso in cantiere.'}
              </p>
            </div>
          </div>

          {/* Footer Istituzionale Capitolo 1 */}
          <div className="border-t-2 border-slate-900 pt-2.5 mt-4 flex flex-col sm:flex-row items-center justify-between text-[8.5px] text-slate-500 font-mono gap-1">
            <span>{pos.datiImpresa.ragioneSociale || 'Impresa Esecutrice'} • {pos.datiCantiere.nome || 'Cantiere'}</span>
            <span>Doc. Tecnico POS {pos.codice} - Capitolo 1 - Allegato XV D.Lgs. 81/08</span>
            <span>Rev. {safeVersione}</span>
          </div>
        </div>

        {/* ================= CAPITOLO 2: DESCRIZIONE DELL'OPERA (PAGINA DEDICATA) ================= */}
        <div id="pos-cap-2" className="pos-chapter-page border-2 border-slate-900 p-6 sm:p-8 mb-10 print:mb-0 bg-white min-h-[265mm] print:min-h-[285mm] flex flex-col justify-between page-break-before print:break-before-page">
          <div>
            {/* Header Capitolo 2 */}
            <div className="border-b-2 border-slate-900 pb-3 mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <span className="px-2.5 py-1 bg-slate-900 text-white text-[11px] font-black uppercase tracking-wider rounded">
                  CAP. 2
                </span>
                <div>
                  <h2 className="text-sm sm:text-base font-black text-slate-900 uppercase tracking-tight">
                    DESCRIZIONE DELL'OPERA E DEI LAVORI SVOLTI DALL'IMPRESA
                  </h2>
                  <span className="text-[9px] font-semibold text-slate-500 uppercase">
                    Allegato XV punto 2.1 lettere c) e d) D.Lgs. 81/2008 e s.m.i.
                  </span>
                </div>
              </div>
              <div className="text-right border-l-0 sm:border-l-2 border-slate-900 sm:pl-3 shrink-0">
                <span className="text-[9px] font-mono text-slate-600 block">{pos.codice}</span>
                <span className="text-[9px] font-bold text-blue-700 block">Capitolo 2 • Pagina Dedicata</span>
              </div>
            </div>

            <div className="space-y-3.5 text-[10.5px]">
              {/* 2.1 Inquadramento Generale */}
              <div>
                <h3 className="font-bold text-[11px] uppercase text-slate-900 mb-1 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-blue-600 rounded-full" />
                  2.1 Inquadramento Generale dell'Opera e Tipologia Costruttiva (All. XV p. 2.1 lett. c)
                </h3>
                <div className="p-3 border border-slate-300 rounded bg-slate-50 text-slate-800 leading-relaxed">
                  <p className="mb-2">
                    {formatMissingData(pos.datiCantiere.descrizioneLavori, 'Descrizione generale dell\'opera da completare')}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-200 text-[10px]">
                    <div>
                      <strong className="text-slate-900 uppercase block font-bold">Tipologia dell'Intervento:</strong>
                      <span>{pos.datiCantiere.tipologiaIntervento || 'Ristrutturazione, manutenzione straordinaria e adeguamento strutturale/impiantistico'}</span>
                    </div>
                    <div>
                      <strong className="text-slate-900 uppercase block font-bold">Importo Complessivo Opere Edili:</strong>
                      <span className="font-mono font-bold text-slate-900">EUR {Number(pos.datiCantiere.importoLavoriEdili || 0).toLocaleString('it-IT')}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 2.2 Attività Specifiche Impresa */}
              <div>
                <h3 className="font-bold text-[11px] uppercase text-slate-900 mb-1 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-blue-600 rounded-full" />
                  2.2 Descrizione Specifica delle Attività Svolte dall'Impresa Esecutrice (All. XV p. 2.1 lett. d)
                </h3>
                <div className="p-3 border border-slate-300 rounded bg-slate-50 text-slate-800 leading-relaxed">
                  <p>
                    {formatMissingData(pos.datiCantiere.attivitaSvolteImpresa || pos.datiCantiere.descrizioneLavori, 'Dettaglio delle specifiche lavorazioni')}
                  </p>
                  <p className="mt-2 text-slate-600 italic text-[10px]">
                    L’impresa opera con maestranze e mezzi propri per l’esecuzione delle lavorazioni edili strutturali, finiture e coordinamento logistico, nel rispetto delle prescrizioni di sicurezza impartite nel PSC e dal CSE.
                  </p>
                </div>
              </div>

              {/* 2.3 Cronoprogramma Temporale */}
              <div>
                <h3 className="font-bold text-[11px] uppercase text-slate-900 mb-1 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-blue-600 rounded-full" />
                  2.3 Cronoprogramma Temporale e Durata Presunta dei Lavori
                </h3>
                <table className="w-full border-collapse border border-slate-300 text-[10px]">
                  <tbody>
                    <tr className="border-b border-slate-300">
                      <td className="w-1/3 bg-slate-100 p-1.5 font-bold">Data Presunta Inizio Lavori:</td>
                      <td className="p-1.5 font-bold">{formatMissingData(pos.datiCantiere.dataInizio)}</td>
                    </tr>
                    <tr className="border-b border-slate-300">
                      <td className="bg-slate-100 p-1.5 font-bold">Data Presunta Ultimazione Opere:</td>
                      <td className="p-1.5 font-bold">{formatMissingData(pos.datiCantiere.dataFine)}</td>
                    </tr>
                    <tr className="border-b border-slate-300">
                      <td className="bg-slate-100 p-1.5 font-bold">Durata Lavorativa Complessiva Stimata:</td>
                      <td className="p-1.5 font-bold text-blue-900">{pos.datiCantiere.durataGiorniPresunti || 120} giorni lavorativi presunti</td>
                    </tr>
                    <tr>
                      <td className="bg-slate-100 p-1.5 font-bold">Entità Presunta del Cantiere:</td>
                      <td className="p-1.5 font-mono text-[9px]">{pos.datiCantiere.uominiGiornoStimati ? `${pos.datiCantiere.uominiGiornoStimati} uomini-giorno presunti` : 'Stima indicativa: ~ 240 - 450 uomini-giorno'}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* 2.4 Condizioni di Sfasamento e Interferenze */}
              <div>
                <h3 className="font-bold text-[11px] uppercase text-slate-900 mb-1 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-blue-600 rounded-full" />
                  2.4 Coordinamento con il PSC e Sfasamento Spazio-Temporale (Art. 100 D.Lgs. 81/08)
                </h3>
                <p className="p-2.5 border border-slate-300 rounded bg-slate-50 text-[10px] text-slate-700 leading-relaxed">
                  L’esecuzione delle singole fasi operative è rigidamente coordinata in modo da evitare la contemporaneità di lavorazioni incompatibili nello stesso spazio fisico (es. getti di calcestruzzo con demolizioni adiacenti o lavori in quota sopra percorsi pedonali). L’accesso alle aree a rischio è regolamentato e autorizzato dal Preposto.
                </p>
              </div>
            </div>
          </div>

          {/* Footer Istituzionale Capitolo 2 */}
          <div className="border-t-2 border-slate-900 pt-2.5 mt-4 flex flex-col sm:flex-row items-center justify-between text-[8.5px] text-slate-500 font-mono gap-1">
            <span>{pos.datiImpresa.ragioneSociale || 'Impresa Esecutrice'} • {pos.datiCantiere.nome || 'Cantiere'}</span>
            <span>Doc. Tecnico POS {pos.codice} - Capitolo 2 - Allegato XV D.Lgs. 81/08</span>
            <span>Rev. {safeVersione}</span>
          </div>
        </div>

        {/* ================= CAPITOLO 3: PERSONALE E FORMAZIONE (PAGINA DEDICATA) ================= */}
        <div id="pos-cap-3" className="pos-chapter-page border-2 border-slate-900 p-6 sm:p-8 mb-10 print:mb-0 bg-white min-h-[265mm] print:min-h-[285mm] flex flex-col justify-between page-break-before print:break-before-page">
          <div>
            {/* Header Capitolo 3 */}
            <div className="border-b-2 border-slate-900 pb-3 mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <span className="px-2.5 py-1 bg-slate-900 text-white text-[11px] font-black uppercase tracking-wider rounded">
                  CAP. 3
                </span>
                <div>
                  <h2 className="text-sm sm:text-base font-black text-slate-900 uppercase tracking-tight">
                    PERSONALE, MANSIONI E ORGANIZZAZIONE DELLA SICUREZZA
                  </h2>
                  <span className="text-[9px] font-semibold text-slate-500 uppercase">
                    Allegato XV punto 2.1 lettere e) e f) D.Lgs. 81/2008 e s.m.i.
                  </span>
                </div>
              </div>
              <div className="text-right border-l-0 sm:border-l-2 border-slate-900 sm:pl-3 shrink-0">
                <span className="text-[9px] font-mono text-slate-600 block">{pos.codice}</span>
                <span className="text-[9px] font-bold text-blue-700 block">Capitolo 3 • Pagina Dedicata</span>
              </div>
            </div>

            <div className="space-y-4">
              {/* 3.1 Tabella Lavoratori */}
              <div>
                <h3 className="font-bold text-[11px] uppercase text-slate-900 mb-1.5 flex items-center justify-between">
                  <span>3.1 Organigramma di Cantiere ed Elenco Lavoratori Assegnati</span>
                  <span className="text-[10px] font-bold text-slate-500">{pos.lavoratori.length} dipendenti registrati</span>
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-slate-300 text-[10px]">
                    <thead>
                      <tr className="bg-slate-900 text-white font-bold text-left">
                        <th className="p-1.5 border border-slate-400">Nominativo</th>
                        <th className="p-1.5 border border-slate-400">Codice Fiscale</th>
                        <th className="p-1.5 border border-slate-400">Mansione Contrattuale</th>
                        <th className="p-1.5 border border-slate-400">Ruolo di Sicurezza</th>
                        <th className="p-1.5 border border-slate-400 text-center">Idoneità Sanitaria</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {pos.lavoratori.map((w, idx) => (
                        <tr key={w.id || idx} className="hover:bg-slate-50">
                          <td className="p-1.5 border border-slate-300 font-bold">{w.cognome} {w.nome}</td>
                          <td className="p-1.5 border border-slate-300 font-mono text-[9px]">{w.codiceFiscale || 'N.D.'}</td>
                          <td className="p-1.5 border border-slate-300">{w.mansione}</td>
                          <td className="p-1.5 border border-slate-300 font-semibold">{w.ruoloCantiere}</td>
                          <td className="p-1.5 border border-slate-300 text-center text-[9px]">
                            <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-900 font-bold">
                              {w.dataVisitaMedica ? `Idoneo (${w.dataVisitaMedica})` : 'Idoneo (Visita Regolare)'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 3.2 Registro Formazione e Abilitazioni */}
              <div>
                <h3 className="font-bold text-[11px] uppercase text-slate-900 mb-1.5 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-blue-600 rounded-full" />
                  3.2 Formazione, Informazione e Addestramento (Art. 36 e 37 D.Lgs. 81/08 - Accordo Stato-Regioni)
                </h3>
                <div className="p-3 border border-slate-300 rounded bg-slate-50 text-[10px] space-y-2">
                  <p className="leading-relaxed text-slate-700">
                    Tutti i lavoratori presenti in cantiere hanno completato il percorso formativo generale e specifico per il settore delle costruzioni (Rischio Alto, durata minima 16 ore) ai sensi dell'Accordo Stato-Regioni del 21/12/2011, con periodico aggiornamento quinquennale.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-200">
                    <div>
                      <strong className="block text-slate-900 uppercase font-black text-[9px]">Abilitazioni Specifiche Attrezzature (Art. 73 c. 5):</strong>
                      <span className="text-slate-600 text-[9px]">Operatori addetti a PLE, gru su autocarro, carrelli e macchine movimento terra provvisti di patentino in corso di validità.</span>
                    </div>
                    <div>
                      <strong className="block text-slate-900 uppercase font-black text-[9px]">Addestramento Lavori in Quota e DPI III Cat. (Art. 77):</strong>
                      <span className="text-slate-600 text-[9px]">Addetti ai lavori in quota e montaggio ponteggi provvisti di attestato teorico-pratico (Pi.M.U.S. ex art. 136).</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 3.3 Obblighi e Compiti di Vigilanza */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[10px]">
                <div className="p-2.5 border border-slate-300 rounded bg-slate-50">
                  <strong className="block text-slate-900 uppercase font-black mb-1">
                    Compiti Specifici del Preposto (Art. 19 D.Lgs. 81/08):
                  </strong>
                  <ul className="list-disc list-inside text-slate-600 space-y-0.5 text-[9px]">
                    <li>Sovrintendere e vigilare sulla corretta applicazione delle norme di sicurezza.</li>
                    <li>Verificare l'uso rigoroso e conforme dei DPI prescritti da parte dei lavoratori.</li>
                    <li>Interrompere immediatamente l'attività in presenza di pericolo grave e imminente.</li>
                  </ul>
                </div>

                <div className="p-2.5 border border-slate-300 rounded bg-slate-50">
                  <strong className="block text-slate-900 uppercase font-black mb-1">
                    Obblighi dei Lavoratori (Art. 20 D.Lgs. 81/08):
                  </strong>
                  <ul className="list-disc list-inside text-slate-600 space-y-0.5 text-[9px]">
                    <li>Prendersi cura della propria sicurezza e di quella delle altre persone presenti.</li>
                    <li>Utilizzare correttamente macchinari, utensili, sostanze pericolose e DPI.</li>
                    <li>Segnalare immediatamente qualsiasi difetto o condizione di pericolo al Preposto.</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Istituzionale Capitolo 3 */}
          <div className="border-t-2 border-slate-900 pt-2.5 mt-4 flex flex-col sm:flex-row items-center justify-between text-[8.5px] text-slate-500 font-mono gap-1">
            <span>{pos.datiImpresa.ragioneSociale || 'Impresa Esecutrice'} • {pos.datiCantiere.nome || 'Cantiere'}</span>
            <span>Doc. Tecnico POS {pos.codice} - Capitolo 3 - Allegato XV D.Lgs. 81/08</span>
            <span>Rev. {safeVersione}</span>
          </div>
        </div>

        {/* ================= CAPITOLO 4: QUADRO NORMATIVO (PAGINA DEDICATA) ================= */}
        <div id="pos-cap-4" className="pos-chapter-page border-2 border-slate-900 p-6 sm:p-8 mb-10 print:mb-0 bg-white min-h-[265mm] print:min-h-[285mm] flex flex-col justify-between page-break-before print:break-before-page">
          <div>
            {/* Header Capitolo 4 */}
            <div className="border-b-2 border-slate-900 pb-3 mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <span className="px-2.5 py-1 bg-slate-900 text-white text-[11px] font-black uppercase tracking-wider rounded">
                  CAP. 4
                </span>
                <div>
                  <h2 className="text-sm sm:text-base font-black text-slate-900 uppercase tracking-tight">
                    RIFERIMENTI NORMATIVI E DEFINIZIONI GIURIDICHE
                  </h2>
                  <span className="text-[9px] font-semibold text-slate-500 uppercase">
                    D.Lgs. 9 aprile 2008 n. 81, D.Lgs. 106/2009 e Norme Tecniche Armonizzate
                  </span>
                </div>
              </div>
              <div className="text-right border-l-0 sm:border-l-2 border-slate-900 sm:pl-3 shrink-0">
                <span className="text-[9px] font-mono text-slate-600 block">{pos.codice}</span>
                <span className="text-[9px] font-bold text-blue-700 block">Capitolo 4 • Pagina Dedicata</span>
              </div>
            </div>

            <div className="space-y-3.5 text-[10px]">
              {/* 4.1 Inquadramento Legislativo */}
              <div className="p-3 border border-slate-300 rounded bg-slate-50 text-slate-800 leading-relaxed">
                <strong className="text-slate-900 uppercase font-black block mb-1 text-[11px]">
                  4.1 Inquadramento Legislativo Primario di Cantiere
                </strong>
                <p className="mb-2">
                  Il presente Piano Operativo di Sicurezza (POS) costituisce adempimento formale e sostanziale agli obblighi sanciti dagli articoli 17 comma 1 lett. a), 28, 89 comma 1 lett. h), 96 e Allegato XV del Decreto Legislativo 9 aprile 2008 n. 81 (Testo Unico sulla Salute e Sicurezza sul Lavoro), come integrato dal D.Lgs. 106/2009.
                </p>
                <p>
                  Ai sensi dell'art. 89 comma 1 lett. h), il POS rappresenta il piano generale di sicurezza dell'impresa esecutrice redatto in riferimento al singolo cantiere temporaneo o mobile in cui opera, contenente la valutazione dei rischi specifici propri delle attività svolte e le correlate misure di prevenzione e protezione conformi al PSC redatto dal Coordinatore per la Progettazione/Esecuzione.
                </p>
              </div>

              {/* 4.2 Definizioni Giuridiche */}
              <div>
                <strong className="text-slate-900 uppercase font-black block mb-1.5 text-[11px]">
                  4.2 Definizioni Giuridiche dei Ruoli di Cantiere (Art. 2 e Art. 89 D.Lgs. 81/08)
                </strong>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-slate-300 text-[9.5px]">
                    <tbody>
                      <tr className="border-b border-slate-300">
                        <td className="w-1/4 bg-slate-100 p-1.5 font-bold">Datore di Lavoro (DL):</td>
                        <td className="p-1.5 text-slate-700">Titolare del rapporto di lavoro e delle responsabilità decisionali e di spesa (art. 2 c. 1 lett. b).</td>
                      </tr>
                      <tr className="border-b border-slate-300">
                        <td className="bg-slate-100 p-1.5 font-bold">R.S.P.P.:</td>
                        <td className="p-1.5 text-slate-700">Responsabile del Servizio di Prevenzione e Protezione designato per coordinare il servizio (art. 2 c. 1 lett. f); funzioni svolte direttamente dal DL ex art. 34.</td>
                      </tr>
                      <tr className="border-b border-slate-300">
                        <td className="bg-slate-100 p-1.5 font-bold">Preposto:</td>
                        <td className="p-1.5 text-slate-700">Persona che sovrintende all'attività lavorativa e garantisce l'attuazione delle direttive ricevute, controllandone la corretta esecuzione (art. 2 c. 1 lett. e).</td>
                      </tr>
                      <tr className="border-b border-slate-300">
                        <td className="bg-slate-100 p-1.5 font-bold">Coordinatore Esecuzione (CSE):</td>
                        <td className="p-1.5 text-slate-700">Soggetto incaricato dal Committente di vigilare e coordinare l'applicazione delle disposizioni del PSC (art. 89 c. 1 lett. f).</td>
                      </tr>
                      <tr className="border-b border-slate-300">
                        <td className="bg-slate-100 p-1.5 font-bold">Pericolo vs Rischio:</td>
                        <td className="p-1.5 text-slate-700"><strong>Pericolo:</strong> proprietà intrinseca potenziale di causare danni. <strong>Rischio:</strong> probabilità di raggiungimento del potenziale livello di danno nelle condizioni d'uso (R = P × D).</td>
                      </tr>
                      <tr>
                        <td className="bg-slate-100 p-1.5 font-bold">Pi.M.U.S.:</td>
                        <td className="p-1.5 text-slate-700">Piano di Montaggio, Uso e Smontaggio dei ponteggi metallici fissi redatto dal datore di lavoro ex art. 134 e All. XXII.</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 4.3 Principi Generali di Prevenzione ex Art. 15 */}
              <div className="p-2.5 border border-slate-300 rounded bg-slate-50 text-[9.5px]">
                <strong className="text-slate-900 uppercase font-black block mb-1">
                  4.3 Misure Generali di Tutela (Art. 15 D.Lgs. 81/08):
                </strong>
                <p className="text-slate-700 leading-tight">
                  1) Valutazione di tutti i rischi per la salute e sicurezza; 2) Eliminazione o riduzione dei rischi alla fonte; 3) Priorità costante delle misure di protezione collettiva rispetto alle misure di protezione individuale; 4) Limitazione al minimo del numero dei lavoratori esposti; 5) Programmazione regolare della manutenzione e del controllo delle misure di sicurezza.
                </p>
              </div>
            </div>
          </div>

          {/* Footer Istituzionale Capitolo 4 */}
          <div className="border-t-2 border-slate-900 pt-2.5 mt-4 flex flex-col sm:flex-row items-center justify-between text-[8.5px] text-slate-500 font-mono gap-1">
            <span>{pos.datiImpresa.ragioneSociale || 'Impresa Esecutrice'} • {pos.datiCantiere.nome || 'Cantiere'}</span>
            <span>Doc. Tecnico POS {pos.codice} - Capitolo 4 - Allegato XV D.Lgs. 81/08</span>
            <span>Rev. {safeVersione}</span>
          </div>
        </div>

        {/* ================= CAPITOLO 5: LOGISTICA E IMPIANTI (PAGINA DEDICATA) ================= */}
        <div id="pos-cap-5" className="pos-chapter-page border-2 border-slate-900 p-6 sm:p-8 mb-10 print:mb-0 bg-white min-h-[265mm] print:min-h-[285mm] flex flex-col justify-between page-break-before print:break-before-page">
          <div>
            {/* Header Capitolo 5 */}
            <div className="border-b-2 border-slate-900 pb-3 mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <span className="px-2.5 py-1 bg-slate-900 text-white text-[11px] font-black uppercase tracking-wider rounded">
                  CAP. 5
                </span>
                <div>
                  <h2 className="text-sm sm:text-base font-black text-slate-900 uppercase tracking-tight">
                    ORGANIZZAZIONE, LOGISTICA E IMPIANTI DI CANTIERE
                  </h2>
                  <span className="text-[9px] font-semibold text-slate-500 uppercase">
                    Allegato XV punto 2.1 lettera g) D.Lgs. 81/2008 e Titolo IV
                  </span>
                </div>
              </div>
              <div className="text-right border-l-0 sm:border-l-2 border-slate-900 sm:pl-3 shrink-0">
                <span className="text-[9px] font-mono text-slate-600 block">{pos.codice}</span>
                <span className="text-[9px] font-bold text-blue-700 block">Capitolo 5 • Pagina Dedicata</span>
              </div>
            </div>

            {(() => {
              const org = pos.organizzazioneCantiere || pos.organizzazione || DEFAULT_ORGANIZZAZIONE_CANTIERE;
              return (
                <div className="space-y-3.5 text-[10px]">
                  <table className="w-full border-collapse border border-slate-300 text-[10px]">
                    <tbody>
                      <tr className="border-b border-slate-300">
                        <td className="w-1/3 bg-slate-100 p-2 font-bold text-slate-900">5.1 Servizi Igienico-Assistenziali:</td>
                        <td className="p-2 text-slate-800 leading-relaxed">
                          {org.serviziIgienici || (org as any).serviziIgieniciAssistenziali || 'Presenza di monoblocco coibentato a uso spogliatoio e servizi igienici allacciati a rete idrica/fognaria o WC chimico certificato periodicamente sanificato con acqua corrente, sapone e asciugamani a perdere.'}
                        </td>
                      </tr>
                      <tr className="border-b border-slate-300">
                        <td className="bg-slate-100 p-2 font-bold text-slate-900">5.2 Viabilità di Cantiere e Segregazione:</td>
                        <td className="p-2 text-slate-800 leading-relaxed">
                          {org.viabilita || (org as any).viabilitaSicurezza || 'Percorsi pedonali protetti e nettamente distinti dalle vie di transito degli automezzi e macchine d’opera. Velocità massima a passo d’uomo (10 km/h) e divieto assoluto di intralcio alle vie di fuga.'}
                        </td>
                      </tr>
                      <tr className="border-b border-slate-300">
                        <td className="bg-slate-100 p-2 font-bold text-slate-900">5.3 Recinzione, Accessi e Segnaletica:</td>
                        <td className="p-2 text-slate-800 leading-relaxed">
                          {org.recinzioneAccessi || 'Recinzione perimetrale continua di altezza non inferiore a 2,00 m, con varchi carrai e pedonali separati provvisti di chiusura a chiave e cartellonistica di sicurezza conforme all\'All. XXIV (divieto ingresso non autorizzati, obbligo DPI).'}
                        </td>
                      </tr>
                      <tr className="border-b border-slate-300">
                        <td className="bg-slate-100 p-2 font-bold text-slate-900">5.4 Impianto Elettrico e Messa a Terra:</td>
                        <td className="p-2 text-slate-800 leading-relaxed">
                          {org.impiantoElettrico || (org as any).impiantoElettricoCantiere || 'Quadro elettrico generale da cantiere (ASC) conforme a norma CEI 64-8/7 e CEI EN 61439-4 con interruttore differenziale ad alta sensibilità (Idn ≤ 30 mA), fungo di arresto d’emergenza e impianto di terra con valore Rt ≤ 20 Ohm provvisto di dichiarazione di conformità ex D.M. 37/08 e denuncia INAIL/ARPA ex DPR 462/01.'}
                        </td>
                      </tr>
                      <tr>
                        <td className="bg-slate-100 p-2 font-bold text-slate-900">5.5 Stoccaggio Materiali e Rifiuti:</td>
                        <td className="p-2 text-slate-800 leading-relaxed">
                          {org.stoccaggioRifiuti || (org as any).gestioneRifiutiTerre || (org as any).stoccaggioMateriali || 'Aree di deposito ordinate e delimitate senza sovraccaricare impalcati e solai. Cassoni scarrabili distinti per codice CER (inerti, legname, imballaggi, ferro). Smaltimento tracciato con Formulari di Identificazione Rifiuti (FIR).'}
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  {/* Riquadro Prescrizioni di Cantiere */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div className="p-2.5 border border-slate-300 rounded bg-slate-50">
                      <strong className="block text-slate-900 uppercase font-black mb-1 text-[9.5px]">
                        Verifiche Periodiche Impianti di Cantiere:
                      </strong>
                      <p className="text-[9px] text-slate-600 leading-tight">
                        Controllo visivo giornaliero del quadro elettrico e dei cavi conduttori. Prova periodica mensile dell'interruttore differenziale tramite apposito pulsante di test a cura del Preposto.
                      </p>
                    </div>

                    <div className="p-2.5 border border-slate-300 rounded bg-slate-50">
                      <strong className="block text-slate-900 uppercase font-black mb-1 text-[9.5px]">
                        Protezione da Caduta Oggetti e Segregazione:
                      </strong>
                      <p className="text-[9px] text-slate-600 leading-tight">
                        In caso di lavori in quota, le aree a terra sottostanti sono recintate con nastro bicolore e cartelli di pericolo; sui ponteggi sono posizionate mantovane parasassi o teli microforati a tenuta.
                      </p>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Footer Istituzionale Capitolo 5 */}
          <div className="border-t-2 border-slate-900 pt-2.5 mt-4 flex flex-col sm:flex-row items-center justify-between text-[8.5px] text-slate-500 font-mono gap-1">
            <span>{pos.datiImpresa.ragioneSociale || 'Impresa Esecutrice'} • {pos.datiCantiere.nome || 'Cantiere'}</span>
            <span>Doc. Tecnico POS {pos.codice} - Capitolo 5 - Allegato XV D.Lgs. 81/08</span>
            <span>Rev. {safeVersione}</span>
          </div>
        </div>

        {/* ================= CAPITOLO 6: METODOLOGIA VALUTAZIONE RISCHI 4x4 (PAGINA DEDICATA) ================= */}
        <div id="pos-cap-6" className="pos-chapter-page border-2 border-slate-900 p-6 sm:p-8 mb-10 print:mb-0 bg-white min-h-[265mm] print:min-h-[285mm] flex flex-col justify-between page-break-before print:break-before-page">
          <div>
            {/* Header Capitolo 6 */}
            <div className="border-b-2 border-slate-900 pb-3 mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <span className="px-2.5 py-1 bg-slate-900 text-white text-[11px] font-black uppercase tracking-wider rounded">
                  CAP. 6
                </span>
                <div>
                  <h2 className="text-sm sm:text-base font-black text-slate-900 uppercase tracking-tight">
                    CRITERI E METODOLOGIA DI VALUTAZIONE DEI RISCHI (MATRICE 4×4)
                  </h2>
                  <span className="text-[9px] font-semibold text-slate-500 uppercase">
                    Articoli 15, 28 e Allegato XV punto 2.1 lettera i) D.Lgs. 81/2008 e s.m.i.
                  </span>
                </div>
              </div>
              <div className="text-right border-l-0 sm:border-l-2 border-slate-900 sm:pl-3 shrink-0">
                <span className="text-[9px] font-mono text-slate-600 block">{pos.codice}</span>
                <span className="text-[9px] font-bold text-blue-700 block">Capitolo 6 • Pagina Dedicata</span>
              </div>
            </div>

            <div className="space-y-3 text-[10px]">
              {/* 6.1 Algoritmo R = P x D e Modello del Tecnico della Sicurezza */}
              <div className="p-2.5 border border-slate-300 rounded bg-slate-50 text-slate-800 leading-relaxed">
                <p>
                  La quantificazione analitica dell'entità del rischio è definita mediante l'algoritmo matematico semi-quantitativo <strong>R = P × D</strong> (prodotto tra la <strong>Probabilità</strong> di accadimento su scala 1-4 e la <strong>Gravità del Danno</strong> potenziale su scala 1-4).
                </p>
                <p className="mt-1 font-semibold text-slate-900">
                  Principio del Doppio Indice (Tecnico della Sicurezza): Per ciascuna fase lavorativa viene calcolato il <strong>Rischio Iniziale (R_in)</strong>, rappresentante il pericolo a vuoto prima delle cautele, e il conseguente <strong>Rischio Residuo (R_res)</strong>, risultante dall'applicazione rigorosa della gerarchia delle misure di prevenzione e protezione ex art. 15 D.Lgs. 81/08.
                </p>
              </div>

              {/* Scale di Probabilità e Danno */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-2.5 border border-slate-300 rounded bg-white">
                  <strong className="block text-slate-900 uppercase font-black mb-1 text-[9.5px]">
                    Scala della Probabilità di Accadimento (P 1 - 4):
                  </strong>
                  <ul className="space-y-1 text-[9px] text-slate-700">
                    <li><strong className="text-blue-900 font-mono">P1 - Improbabile:</strong> Evento eccezionale o quasi mai verificatosi nelle ordinarie condizioni operative.</li>
                    <li><strong className="text-blue-900 font-mono">P2 - Poco probabile:</strong> L'evento può verificarsi solo in presenza di circostanze inconsuete.</li>
                    <li><strong className="text-blue-900 font-mono">P3 - Probabile:</strong> Evento noto con frequenza media nel comparto edile in assenza di cautele.</li>
                    <li><strong className="text-blue-900 font-mono">P4 - Altamente probabile:</strong> Evento certo o quasi certo durante l'operazione in assenza di presidi.</li>
                  </ul>
                </div>

                <div className="p-2.5 border border-slate-300 rounded bg-white">
                  <strong className="block text-slate-900 uppercase font-black mb-1 text-[9.5px]">
                    Scala della Gravità del Danno (D 1 - 4):
                  </strong>
                  <ul className="space-y-1 text-[9px] text-slate-700">
                    <li><strong className="text-rose-900 font-mono">D1 - Lieve:</strong> Lesione reversibile senza esiti permanenti, inabilità temporanea &lt; 3 giorni.</li>
                    <li><strong className="text-rose-900 font-mono">D2 - Medio:</strong> Inabilità reversibile da 3 a 30 giorni senza postumi permanenti (ferite, contusioni).</li>
                    <li><strong className="text-rose-900 font-mono">D3 - Grave:</strong> Infortunio grave con ricovero, inabilità prolungata &gt; 30 gg o danno permanente parziale.</li>
                    <li><strong className="text-rose-900 font-mono">D4 - Gravissimo:</strong> Invalidità permanente totale o pericolo di vita / infortunio mortale.</li>
                  </ul>
                </div>
              </div>

              {/* Matrice 4x4 */}
              <div>
                <strong className="block text-slate-900 uppercase font-black mb-1 text-[10px]">
                  Matrice di Rischio 4×4 Ufficiale e Incrocio P × D:
                </strong>
                <table className="w-full border-collapse border border-slate-400 text-xs text-center">
                  <thead>
                    <tr className="bg-slate-200 text-slate-900 font-bold text-[10px]">
                      <th className="p-1 border border-slate-400 text-left w-36">Probabilità (P) \ Danno (D)</th>
                      <th className="p-1 border border-slate-400">D1: Lieve</th>
                      <th className="p-1 border border-slate-400">D2: Medio</th>
                      <th className="p-1 border border-slate-400">D3: Grave</th>
                      <th className="p-1 border border-slate-400">D4: Gravissimo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {MATRICE_RISCHIO_4X4.map(row => (
                      <tr key={row.probabilita}>
                        <td className="p-1 border border-slate-400 font-bold bg-slate-100 text-left text-[9.5px]">
                          P{row.probabilita} - {row.nomeProbabilita}
                        </td>
                        {row.celle.map(cell => {
                          const r = cell.livelloRischio;
                          const cellBg =
                            r <= 2
                              ? 'bg-emerald-100 text-emerald-900'
                              : r <= 4
                              ? 'bg-blue-100 text-blue-900'
                              : r <= 8
                              ? 'bg-amber-100 text-amber-900'
                              : 'bg-rose-100 text-rose-900';
                          return (
                            <td key={cell.danno} className={`p-1 border border-slate-400 font-bold ${cellBg}`}>
                              <div className="text-[11px]">R = {r}</div>
                              <div className="text-[8.5px] uppercase font-bold opacity-90">{cell.classeRischio}</div>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Classi di Rischio e Criteri di Azione */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[9px]">
                {CLASSI_RISCHIO_DEF.map(c => (
                  <div key={c.classe} className="p-2 border border-slate-300 rounded bg-slate-50">
                    <strong className="block uppercase text-slate-900 font-black">{c.classe} (R: {c.intervallo})</strong>
                    <span className="text-slate-600 leading-tight block mt-0.5">{c.criterioAzione}</span>
                  </div>
                ))}
              </div>

              {/* Gerarchia delle Misure ex Art. 15 D.Lgs. 81/08 */}
              <div className="p-2.5 border border-slate-300 rounded bg-slate-50 text-[9px]">
                <strong className="text-slate-900 uppercase font-black block mb-1">
                  Gerarchia Obbligatoria delle Misure di Prevenzione (Art. 15 D.Lgs. 81/08):
                </strong>
                <p className="text-slate-700 leading-tight">
                  <strong>1° Misure Tecniche Progettuali:</strong> eliminazione o sostituzione del pericolo alla fonte (es. taglio a umido, sezionamento linee elettriche). • <strong>2° Protezione Collettiva (DPC):</strong> barriere fisiche prioritarie rispetto ai DPI (es. parapetti UNI EN 13374, reti anticaduta UNI EN 1263, quadri con differenziali 30 mA, blindature scavi). • <strong>3° Misure Organizzative:</strong> turnazione, moviere a terra, procedure operative e vigilanza continua del Preposto. • <strong>4° Dispositivi di Protezione Individuale (DPI):</strong> DPI di III categoria (imbracature anticaduta, maschere FFP3, otoprotettori).
                </p>
              </div>
            </div>
          </div>

          {/* Footer Istituzionale Capitolo 6 */}
          <div className="border-t-2 border-slate-900 pt-2.5 mt-4 flex flex-col sm:flex-row items-center justify-between text-[8.5px] text-slate-500 font-mono gap-1">
            <span>{pos.datiImpresa.ragioneSociale || 'Impresa Esecutrice'} • {pos.datiCantiere.nome || 'Cantiere'}</span>
            <span>Doc. Tecnico POS {pos.codice} - Capitolo 6 - Allegato XV D.Lgs. 81/08</span>
            <span>Rev. {safeVersione}</span>
          </div>
        </div>

        {/* ================= CAPITOLO 7: CONTESTO AMBIENTALE (PAGINA DEDICATA) ================= */}
        <div id="pos-cap-7" className="pos-chapter-page border-2 border-slate-900 p-6 sm:p-8 mb-10 print:mb-0 bg-white min-h-[265mm] print:min-h-[285mm] flex flex-col justify-between page-break-before print:break-before-page">
          <div>
            {/* Header Capitolo 7 */}
            <div className="border-b-2 border-slate-900 pb-3 mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <span className="px-2.5 py-1 bg-slate-900 text-white text-[11px] font-black uppercase tracking-wider rounded">
                  CAP. 7
                </span>
                <div>
                  <h2 className="text-sm sm:text-base font-black text-slate-900 uppercase tracking-tight">
                    CONTESTO AMBIENTALE E CONDIZIONI AL CONTORNO
                  </h2>
                  <span className="text-[9px] font-semibold text-slate-500 uppercase">
                    Allegato XV punto 2.1 lettera h) D.Lgs. 81/2008 e s.m.i.
                  </span>
                </div>
              </div>
              <div className="text-right border-l-0 sm:border-l-2 border-slate-900 sm:pl-3 shrink-0">
                <span className="text-[9px] font-mono text-slate-600 block">{pos.codice}</span>
                <span className="text-[9px] font-bold text-blue-700 block">Capitolo 7 • Pagina Dedicata</span>
              </div>
            </div>

            <div className="space-y-3.5 text-[10px]">
              <table className="w-full border-collapse border border-slate-300 text-[10px]">
                <tbody>
                  <tr className="border-b border-slate-300">
                    <td className="w-1/3 bg-slate-100 p-2 font-bold text-slate-900">7.1 Accessibilità e Viabilità Esterna:</td>
                    <td className="p-2 text-slate-800 leading-relaxed">
                      {pos.contestoAmbientale?.accessibilitaViabilitaEsterna || 'Accesso ordinario da pubblica via con regolamentazione di manovra automezzi pesanti; presenza di moviere a terra munito di paletta e gilet ad alta visibilità per l’immissione e l’uscita dei mezzi sulla carreggiata stradale.'}
                    </td>
                  </tr>
                  <tr className="border-b border-slate-300">
                    <td className="bg-slate-100 p-2 font-bold text-slate-900">7.2 Interferenze con Linee Aeree e Sottoservizi:</td>
                    <td className="p-2 text-slate-800 leading-relaxed">
                      {pos.contestoAmbientale?.interferenzeSottoserviziLineeAeree || 'Verifica visiva e strumentale preventiva dell\'assenza di linee elettriche aeree scoperte a distanza inferiore a 5,00 metri (norma CEI 11-27). Per scavi o perforazioni, preventiva acquisizione delle mappe dei sottoservizi (reti gas, idriche, fognarie ed elettriche).'}
                    </td>
                  </tr>
                  <tr className="border-b border-slate-300">
                    <td className="bg-slate-100 p-2 font-bold text-slate-900">7.3 Rapporti con il Vicinato (Rumore e Polveri):</td>
                    <td className="p-2 text-slate-800 leading-relaxed">
                      {pos.contestoAmbientale?.edificiAdiacentiRumorePolveri || 'Bagnatura periodica delle piste di cantiere e dei cumuli di macerie per l’abbattimento delle polveri. Rispetto rigoroso delle fasce orarie comunali antirumore (08:00-12:00 / 13:30-18:00) con impiego di schermature fonoisolanti per lavorazioni particolarmente impattanti.'}
                    </td>
                  </tr>
                  <tr>
                    <td className="bg-slate-100 p-2 font-bold text-slate-900">7.4 Condizioni Meteo e Agenti Atmosferici Avversi:</td>
                    <td className="p-2 text-slate-800 leading-relaxed">
                      {pos.contestoAmbientale?.condizioniMeteoEventiAtmosferici || 'Sospensione immediata di tutte le lavorazioni in quota su ponteggi, scale e tetti in presenza di raffiche di vento superiori a 40 km/h, temporali imminenti con pericolo di fulminazione o formazione di ghiaccio sui piani di calpestio. In caso di ondate di calore estive (T > 35°C), applicazione delle linee guida INAIL con pause orarie ed idratazione.'}
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Box di Istruzioni Operative per Condizioni Meteo */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="p-2.5 border border-slate-300 rounded bg-slate-50">
                  <strong className="block text-slate-900 uppercase font-black mb-1 text-[9.5px]">
                    Prescrizioni in Caso di Vento Forte (&gt; 40 km/h):
                  </strong>
                  <p className="text-[9px] text-slate-600 leading-tight">
                    Blocco immediato dell'uso di gru a torre (messa in bandiera), ponti su ruote (trabattelli) e ponteggi fissi. Messa in sicurezza e ancoraggio di tutti i teli, pannelli di recinzione e materiali leggeri stoccati.
                  </p>
                </div>

                <div className="p-2.5 border border-slate-300 rounded bg-slate-50">
                  <strong className="block text-slate-900 uppercase font-black mb-1 text-[9.5px]">
                    Prescrizioni in Caso di Precipitazioni Intense o Temporali:
                  </strong>
                  <p className="text-[9px] text-slate-600 leading-tight">
                    Interruzione delle attività all'aperto, distacco dell'alimentazione elettrica generale dal quadro ASC di cantiere e allontanamento delle maestranze da scavi aperti soggetti a rischio franoso.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Istituzionale Capitolo 7 */}
          <div className="border-t-2 border-slate-900 pt-2.5 mt-4 flex flex-col sm:flex-row items-center justify-between text-[8.5px] text-slate-500 font-mono gap-1">
            <span>{pos.datiImpresa.ragioneSociale || 'Impresa Esecutrice'} • {pos.datiCantiere.nome || 'Cantiere'}</span>
            <span>Doc. Tecnico POS {pos.codice} - Capitolo 7 - Allegato XV D.Lgs. 81/08</span>
            <span>Rev. {safeVersione}</span>
          </div>
        </div>

        {/* ================= CAPITOLO 8: TURNI E PRESENZE (PAGINA DEDICATA) ================= */}
        <div id="pos-cap-8" className="pos-chapter-page border-2 border-slate-900 p-6 sm:p-8 mb-10 print:mb-0 bg-white min-h-[265mm] print:min-h-[285mm] flex flex-col justify-between page-break-before print:break-before-page">
          <div>
            {/* Header Capitolo 8 */}
            <div className="border-b-2 border-slate-900 pb-3 mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <span className="px-2.5 py-1 bg-slate-900 text-white text-[11px] font-black uppercase tracking-wider rounded">
                  CAP. 8
                </span>
                <div>
                  <h2 className="text-sm sm:text-base font-black text-slate-900 uppercase tracking-tight">
                    PROGRAMMAZIONE, TURNI DI LAVORO E GESTIONE DELLE PRESENZE
                  </h2>
                  <span className="text-[9px] font-semibold text-slate-500 uppercase">
                    Articolo 26 comma 8 e Allegato XV D.Lgs. 81/2008 e s.m.i.
                  </span>
                </div>
              </div>
              <div className="text-right border-l-0 sm:border-l-2 border-slate-900 sm:pl-3 shrink-0">
                <span className="text-[9px] font-mono text-slate-600 block">{pos.codice}</span>
                <span className="text-[9px] font-bold text-blue-700 block">Capitolo 8 • Pagina Dedicata</span>
              </div>
            </div>

            <div className="space-y-3.5 text-[10px]">
              <table className="w-full border-collapse border border-slate-300 text-[10px]">
                <tbody>
                  <tr className="border-b border-slate-300">
                    <td className="w-1/3 bg-slate-100 p-2 font-bold text-slate-900">8.1 Orario Ordinario di Lavoro:</td>
                    <td className="p-2 text-slate-800 leading-relaxed font-bold">
                      {pos.datiCantiere.orariLavoro || '08:00 - 12:00 / 13:00 - 17:00 (Lunedì - Venerdì)'}
                    </td>
                  </tr>
                  <tr className="border-b border-slate-300">
                    <td className="bg-slate-100 p-2 font-bold text-slate-900">8.2 Presenze Massime Contemporanee:</td>
                    <td className="p-2 text-slate-800 leading-relaxed">
                      Presenza massima stimata di <strong>{pos.datiCantiere.numeroMassimoLavoratori || pos.lavoratori.length || 5} lavoratori contemporanei</strong> appartenenti all’impresa esecutrice.
                    </td>
                  </tr>
                  <tr className="border-b border-slate-300">
                    <td className="bg-slate-100 p-2 font-bold text-slate-900">8.3 Disciplina Lavori Straordinari e Notturni:</td>
                    <td className="p-2 text-slate-800 leading-relaxed">
                      L’esecuzione di lavorazioni straordinarie o notturne è subordinata alla preventiva comunicazione e autorizzazione del Coordinatore per l’Esecuzione (CSE). È tassativamente richiesta la presenza in cantiere di idonea illuminazione artificiale (livello minimo garantito ≥ 300 lux sui piani di lavoro) e la presenza continuativa del Preposto.
                    </td>
                  </tr>
                  <tr className="border-b border-slate-300">
                    <td className="bg-slate-100 p-2 font-bold text-slate-900">8.4 Controllo Accessi e Tesserini (Art. 26 c. 8):</td>
                    <td className="p-2 text-slate-800 leading-relaxed">
                      Tutto il personale operante in cantiere deve essere munito di apposita tessera di riconoscimento corredata di fotografia, generalità del lavoratore e indicazione del datore di lavoro, esposta visibilmente per tutta la durata dell'attività ai sensi dell'art. 26 comma 8 D.Lgs. 81/08.
                    </td>
                  </tr>
                  <tr>
                    <td className="bg-slate-100 p-2 font-bold text-slate-900">8.5 Registro Presenze Giornaliere:</td>
                    <td className="p-2 text-slate-800 leading-relaxed">
                      Obbligo di firma giornaliera all’ingresso e all’uscita sul Registro Presenze di Cantiere custodito presso la baracca ufficio, a disposizione per i controlli del CSE e degli organi di vigilanza (ASL, ITL).
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Disciplina Accesso Visitatori e Fornitori */}
              <div className="p-3 border border-slate-300 rounded bg-slate-50 text-[10px]">
                <strong className="text-slate-900 uppercase font-black block mb-1 text-[10.5px]">
                  8.6 Disciplina per l'Accesso di Visitatori, Tecnici e Fornitori Esterni:
                </strong>
                <p className="text-slate-700 leading-relaxed">
                  L'accesso di soggetti terzi non appartenenti alle imprese esecutrici autorizzate è consentito esclusivamente previa registrazione e consegna di copia del vademecum di sicurezza di cantiere. I visitatori devono essere tassativamente accompagnati dal Preposto e dotati dei DPI di base (casco di protezione UNI EN 397 e calzature di sicurezza con suola antiscivolo). Le manovre di scarico delle autobetoniere e dei fornitori di materiali edili sono assistite da personale a terra con divieto di sosta per terzi nel raggio d'azione.
                </p>
              </div>
            </div>
          </div>

          {/* Footer Istituzionale Capitolo 8 */}
          <div className="border-t-2 border-slate-900 pt-2.5 mt-4 flex flex-col sm:flex-row items-center justify-between text-[8.5px] text-slate-500 font-mono gap-1">
            <span>{pos.datiImpresa.ragioneSociale || 'Impresa Esecutrice'} • {pos.datiCantiere.nome || 'Cantiere'}</span>
            <span>Doc. Tecnico POS {pos.codice} - Capitolo 8 - Allegato XV D.Lgs. 81/08</span>
            <span>Rev. {safeVersione}</span>
          </div>
        </div>

        {/* ================= CAPITOLO 9: SCHEDE LAVORAZIONI E VALUTAZIONE RISCHI (PAGINA DEDICATA) ================= */}
        <div id="pos-cap-9" className="pos-chapter-page border-2 border-slate-900 p-6 sm:p-8 mb-10 print:mb-0 bg-white min-h-[265mm] print:min-h-[285mm] flex flex-col justify-between page-break-before print:break-before-page">
          <div>
            {/* Header Capitolo 9 */}
            <div className="border-b-2 border-slate-900 pb-3 mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <span className="px-2.5 py-1 bg-slate-900 text-white text-[11px] font-black uppercase tracking-wider rounded">
                  CAP. 9
                </span>
                <div>
                  <h2 className="text-sm sm:text-base font-black text-slate-900 uppercase tracking-tight">
                    SCHEDE DELLE LAVORAZIONI E VALUTAZIONE ANALITICA DEI RISCHI
                  </h2>
                  <span className="text-[9px] font-semibold text-slate-500 uppercase">
                    Fasi Operative, Misure DPC, Sorveglianza Preposto e DPI ex All. XV p. 2.1 lett. i) D.Lgs. 81/08
                  </span>
                </div>
              </div>
              <div className="text-right border-l-0 sm:border-l-2 border-slate-900 sm:pl-3 shrink-0">
                <span className="text-[9px] font-mono text-slate-600 block">{pos.codice}</span>
                <span className="text-[9px] font-bold text-blue-700 block">{pos.attivita.length} Schede Operative</span>
              </div>
            </div>

            <div className="space-y-6">
              {pos.attivita.map((att, idx) => (
                <div key={att.id || idx} className="border-2 border-slate-800 rounded-lg p-4 mb-4 page-break-avoid bg-white shadow-xs">
                  {/* Intestazione Lavorazione con Logo/Immagine della Scheda */}
                  <div className="flex items-start justify-between gap-3 border-b-2 border-slate-800 pb-3 mb-3">
                    <div className="flex items-center gap-3">
                      <PosSchedaLogo
                        tipo="lavorazione"
                        title={att.nome}
                        iconaEmoji={att.icona}
                        logoUrl={att.logoUrl || att.immagineUrl}
                        size="md"
                      />
                      <div>
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="px-1.5 py-0.5 bg-slate-900 text-white font-black text-[9px] uppercase tracking-wider rounded">
                            Fase {idx + 1}
                          </span>
                          <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-900 text-[10px] font-bold uppercase border border-blue-200">
                            {att.faseLavoro || att.categoria || 'Opere Generali'}
                          </span>
                        </div>
                        <strong className="text-sm font-black uppercase text-slate-900 block leading-tight">
                          {att.nome}
                        </strong>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-[9px] font-bold text-slate-500 uppercase block">Conformità</span>
                      <span className="text-[10px] font-black text-slate-800 font-mono">D.Lgs. 81/08 All. XV</span>
                    </div>
                  </div>

                  <div className="text-xs text-slate-700 mb-3 leading-relaxed bg-slate-50 p-2.5 rounded border border-slate-200">
                    <strong className="text-slate-900 uppercase text-[10px] block mb-0.5">Modalità Operative ed Esecutive di Fase:</strong>
                    <span>{att.descrizione}</span>
                  </div>

                  {/* Collegamenti di Sicurezza: Attrezzature, Sostanze e Opere */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[10px] mb-3 bg-slate-50 p-2.5 border border-slate-300 rounded">
                    <div>
                      <strong className="block text-slate-900 uppercase mb-0.5 font-black">🚜 Attrezzature Connesse:</strong>
                      <span className="text-slate-700">{att.attrezzatureUtilizzate?.join(', ') || 'Attrezzature manuali standard'}</span>
                    </div>
                    <div>
                      <strong className="block text-slate-900 uppercase mb-0.5 font-black">🧪 Sostanze Chimiche SDS:</strong>
                      <span className="text-slate-700">{att.sostanzeUtilizzate?.join(', ') || 'Nessuna sostanza pericolosa'}</span>
                    </div>
                    <div>
                      <strong className="block text-slate-900 uppercase mb-0.5 font-black">🪜 Opere Provvisionali:</strong>
                      <span className="text-slate-700">{att.opereProvvisionaliUtilizzate?.join(', ') || 'Nessuna opera specifica'}</span>
                    </div>
                  </div>

                  {/* Tabella Valutazione dei Rischi da Tecnico della Sicurezza (R_in vs R_res con DPC e Preposto) */}
                  <div className="mb-3">
                    <div className="flex items-center justify-between mb-1">
                      <strong className="text-[10.5px] font-black uppercase text-slate-900 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-rose-600" />
                        Valutazione Tecnica Analitica dei Rischi (Rischio Iniziale R_in vs Rischio Residuo R_res):
                      </strong>
                      <span className="text-[9px] font-bold text-slate-500 font-mono">D.Lgs. 81/08 Art. 15 e 28</span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse border border-slate-300 text-[9.5px]">
                        <thead>
                          <tr className="bg-slate-900 text-white font-bold text-left">
                            <th className="p-1.5 border border-slate-400 w-1/4">Pericolo / Fonte & Conseguenze</th>
                            <th className="p-1.5 border border-slate-400 text-center w-20" title="Rischio Iniziale a vuoto prima delle cautele">R_in (P×D)</th>
                            <th className="p-1.5 border border-slate-400">Protezione Collettiva (DPC) & Tecniche</th>
                            <th className="p-1.5 border border-slate-400">Misure Organizzative & Preposto</th>
                            <th className="p-1.5 border border-slate-400 text-center w-20" title="Rischio Residuo controllato dopo le cautele">R_res (P×D)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {att.rischi.map((r, rIdx) => {
                            const tec = CALCOLA_RISCHIO_TECNICO(r);
                            const clInColor =
                              tec.classeIniziale === 'Elevato'
                                ? 'bg-rose-100 text-rose-900 border-rose-300'
                                : tec.classeIniziale === 'Notevole'
                                ? 'bg-amber-100 text-amber-900 border-amber-300'
                                : 'bg-blue-100 text-blue-900 border-blue-300';

                            const clResColor =
                              tec.classeResidua === 'Basso'
                                ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                                : 'bg-blue-100 text-blue-900 border-blue-300';

                            return (
                              <tr key={r.id || rIdx} className="hover:bg-slate-50">
                                <td className="p-1.5 border border-slate-300">
                                  <strong className="block text-slate-900 font-black">{r.descrizione}</strong>
                                  {r.fonteRischio && <span className="text-[8.5px] text-slate-600 block">Fonte: {r.fonteRischio}</span>}
                                  {r.conseguenze && <span className="text-[8.5px] text-rose-800 font-medium block">Danno: {r.conseguenze}</span>}
                                </td>
                                <td className="p-1.5 border border-slate-300 text-center">
                                  <div className="font-mono font-black text-rose-700 text-[10px]">
                                    P{tec.pIniziale}×D{tec.dIniziale} = {tec.rIniziale}
                                  </div>
                                  <span className={`inline-block px-1 py-0.2 rounded text-[7.5px] font-black uppercase border mt-0.5 ${clInColor}`}>
                                    {tec.classeIniziale}
                                  </span>
                                </td>
                                <td className="p-1.5 border border-slate-300 text-slate-700 leading-tight">
                                  <strong className="text-slate-900 text-[8.5px] block font-bold">DPC & Misure Tecniche:</strong>
                                  <span>{r.misureProtezioneCollettiva || tec.protezioneCollettivaDPC || tec.misuraTecnicaPrimaria}</span>
                                </td>
                                <td className="p-1.5 border border-slate-300 text-slate-700 leading-tight">
                                  <strong className="text-slate-900 text-[8.5px] block font-bold">Procedura & Vigilanza:</strong>
                                  <span>{r.misurePreventive || tec.misuraOrganizzativa}</span>
                                </td>
                                <td className="p-1.5 border border-slate-300 text-center">
                                  <div className="font-mono font-black text-emerald-700 text-[10px]">
                                    P{tec.pResiduo}×D{tec.dResiduo} = {tec.rResiduo}
                                  </div>
                                  <span className={`inline-block px-1 py-0.2 rounded text-[7.5px] font-black uppercase border mt-0.5 ${clResColor}`}>
                                    {tec.classeResidua}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Misure di Coordinamento */}
                  <div className="mb-3 text-[10px]">
                    <strong className="block text-[10px] font-black uppercase text-slate-900 mb-1">
                      Prescrizioni Operative, Regole Comportamentali e Coordinamento di Fase:
                    </strong>
                    <ul className="list-disc list-inside text-[9.5px] text-slate-700 space-y-0.5">
                      {att.misurePrevenzione.map((m, mIdx) => (
                        <li key={mIdx}>{m}</li>
                      ))}
                    </ul>
                  </div>

                  {/* DPI di Fase con Simboli Grafici ISO 7010 */}
                  <div className="border-t-2 border-slate-800 pt-2.5 bg-blue-50/40 p-2.5 rounded-b">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="w-2 h-2 rounded-full bg-[#005ea6]" />
                      <span className="text-[10px] font-black uppercase text-slate-900 tracking-wider">
                        DPI Obbligatori per la Fase Lavorativa (D.Lgs. 81/08 Titolo III Capo II):
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {att.dpiNecessari.map((dpiNome, dIdx) => (
                        <PosDpiBadge
                          key={dIdx}
                          name={dpiNome}
                          size="md"
                          showNorma={true}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer Istituzionale Capitolo 9 */}
          <div className="border-t-2 border-slate-900 pt-2.5 mt-6 flex flex-col sm:flex-row items-center justify-between text-[8.5px] text-slate-500 font-mono gap-1">
            <span>{pos.datiImpresa.ragioneSociale || 'Impresa Esecutrice'} • {pos.datiCantiere.nome || 'Cantiere'}</span>
            <span>Doc. Tecnico POS {pos.codice} - Capitolo 9 - Allegato XV D.Lgs. 81/08</span>
            <span>Rev. {safeVersione}</span>
          </div>
        </div>

        {/* ================= CAPITOLO 10: ATTREZZATURE, MEZZI E MACCHINE (PAGINA DEDICATA) ================= */}
        <div id="pos-cap-10" className="pos-chapter-page border-2 border-slate-900 p-6 sm:p-8 mb-10 print:mb-0 bg-white min-h-[265mm] print:min-h-[285mm] flex flex-col justify-between page-break-before print:break-before-page">
          <div>
            {/* Header Capitolo 10 */}
            <div className="border-b-2 border-slate-900 pb-3 mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <span className="px-2.5 py-1 bg-slate-900 text-white text-[11px] font-black uppercase tracking-wider rounded">
                  CAP. 10
                </span>
                <div>
                  <h2 className="text-sm sm:text-base font-black text-slate-900 uppercase tracking-tight">
                    SCHEDE TECNICHE DI SICUREZZA DI ATTREZZATURE, MACCHINE E MEZZI D'OPERA
                  </h2>
                  <span className="text-[9px] font-semibold text-slate-500 uppercase">
                    Titolo III, Allegati V e VI D.Lgs. 81/08 - Regime Verifiche e Abilitazione Operatori
                  </span>
                </div>
              </div>
              <div className="text-right border-l-0 sm:border-l-2 border-slate-900 sm:pl-3 shrink-0">
                <span className="text-[9px] font-mono text-slate-600 block">{pos.codice}</span>
                <span className="text-[9px] font-bold text-blue-700 block">{pos.attrezzature?.length || 0} Mezzi Registrati</span>
              </div>
            </div>

            {/* Quadro Disciplinare Manutenzioni e Abilitazioni (Art. 71 e 73) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4 text-[10px]">
              <div className="p-3 bg-slate-50 border border-slate-300 rounded">
                <strong className="block text-slate-900 uppercase font-black mb-1">
                  Obblighi Manutentivi e Registro di Controllo (Art. 71 c. 8):
                </strong>
                <p className="text-slate-700 leading-relaxed text-[9.5px]">
                  Tutte le attrezzature e macchine introdotte in cantiere sono corredate da manuale di istruzioni d'uso CE, registro di controllo e manutenzione programmata. Gli organi di comando, gli arresti d'emergenza e i dispositivi di protezione devono essere sottoposti a verifica visiva giornaliera a cura dell'operatore prima della messa in funzione.
                </p>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-300 rounded">
                <strong className="block text-slate-900 uppercase font-black mb-1">
                  Qualificazione e Abilitazione Operatori (Art. 73 c. 5):
                </strong>
                <p className="text-slate-700 leading-relaxed text-[9.5px]">
                  L'impiego delle attrezzature che richiedono specifica abilitazione (PLE, gru, escavatori, pale, carrelli elevatori ex Accordo Stato-Regioni 22/02/2012) è rigorosamente riservato a personale in possesso di attestato di idoneità in corso di validità (quinquennale) e formalmente incaricato per iscritto dal Datore di Lavoro.
                </p>
              </div>
            </div>

            {/* Indice riassuntivo delle attrezzature */}
            <div className="mb-4">
              <strong className="block text-[10.5px] font-black uppercase text-slate-900 mb-1.5 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-slate-800" />
                Registro Riepilogativo Macchine e Attrezzature Presenti in Cantiere:
              </strong>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-slate-300 text-[9.5px]">
                  <thead>
                    <tr className="bg-slate-900 text-white font-bold text-left">
                      <th className="p-1.5 border border-slate-400">Attrezzatura / Mezzo</th>
                      <th className="p-1.5 border border-slate-400">Costruttore / Modello</th>
                      <th className="p-1.5 border border-slate-400 text-center w-28">Marcatura CE / All. V</th>
                      <th className="p-1.5 border border-slate-400">Requisito Operatore</th>
                      <th className="p-1.5 border border-slate-400 text-center w-24">Stato Verifiche</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {(pos.attrezzature && pos.attrezzature.length > 0 ? pos.attrezzature : [
                      {
                        id: 'att-def-1',
                        nome: 'Attrezzature e Utensili Manuali ed Elettrici di Cantiere',
                        modelloMatricola: 'Marcatura CE conforme - Vari',
                        marcaturaCeConforme: true,
                        operatoreAbilitato: 'Personale addestrato all\'uso sicuro',
                        verifichePeriodiche: true,
                      }
                    ]).map((att, idx) => (
                      <tr key={att.id || idx} className="hover:bg-slate-50">
                        <td className="p-1.5 border border-slate-300 font-bold text-slate-900">{att.nome}</td>
                        <td className="p-1.5 border border-slate-300 font-mono text-[9px]">{att.modelloMatricola || 'Documentazione c/o cantiere'}</td>
                        <td className="p-1.5 border border-slate-300 text-center">
                          <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-900 border border-emerald-300 rounded text-[8.5px] font-bold">
                            {att.marcaturaCeConforme ? 'CE CONFORME' : 'ALL. V D.LGS. 81/08'}
                          </span>
                        </td>
                        <td className="p-1.5 border border-slate-300 text-slate-700">{att.operatoreAbilitato || 'Lavoratore addestrato (art. 73)'}</td>
                        <td className="p-1.5 border border-slate-300 text-center text-emerald-700 font-bold font-mono text-[9px]">
                          {att.verifichePeriodiche ? 'REGOLARE' : 'VERIFICATO'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Schede Dettagliate di Sicurezza per ciascuna Attrezzatura / Mezzo */}
            <div className="space-y-4">
              {(pos.attrezzature && pos.attrezzature.length > 0 ? pos.attrezzature : [
                {
                  id: 'att-card-def',
                  nome: 'Attrezzature e Utensili Manuali ed Elettrici di Cantiere',
                  categoria: 'Attrezzature Manuali ed Elettro-utensili',
                  modelloMatricola: 'Varie dotazioni con marcatura CE',
                  operatoreAbilitato: 'Personale con idoneità sanitaria e formazione generale/specifica',
                  marcaturaCeConforme: true,
                  verifichePeriodiche: true,
                  prescrizioniSicurezza: 'Controllo visivo dell\'integrità dei cavi di alimentazione con doppio isolamento; impiego esclusivo da quadri ASC dotati di differenziale salvavita 30mA; arresto motore durante cambio utensile; divieto assoluto di manomissione dei carter.',
                  dpiNecessari: ['Casco di protezione / Elmetto', 'Calzature di sicurezza S3', 'Guanti rischio meccanico', 'Occhiali di protezione / Visiera'],
                }
              ]).map((att, idx) => (
                <div
                  key={att.id || idx}
                  className="border-2 border-slate-800 rounded-lg p-3.5 bg-white page-break-avoid shadow-xs"
                >
                  <div className="flex items-start justify-between gap-3 border-b-2 border-slate-800 pb-2.5 mb-2.5">
                    <div className="flex items-center gap-3">
                      <PosSchedaLogo
                        tipo="attrezzatura"
                        title={att.nome}
                        iconaEmoji={att.icona}
                        logoUrl={att.logoUrl || att.immagineUrl}
                        size="md"
                      />
                      <div>
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="px-1.5 py-0.5 bg-amber-600 text-white font-black text-[9px] uppercase tracking-wider rounded">
                            SCHEDA MEZZO #{idx + 1}
                          </span>
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 text-[10px] font-bold uppercase border">
                            {att.categoria || 'Attrezzatura di Cantiere'}
                          </span>
                        </div>
                        <strong className="text-sm font-black uppercase text-slate-900 block leading-tight">
                          {att.nome}
                        </strong>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-[9px] font-bold text-slate-500 uppercase block">Conformità</span>
                      <span className="text-[10px] font-black text-slate-800 font-mono">
                        {att.marcaturaCeConforme ? 'CE - DIRETTIVA MACCHINE' : 'ALL. V-VI D.LGS. 81/08'}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[10px] mb-2.5 bg-slate-50 p-2 rounded border border-slate-300">
                    <div>
                      <strong className="block text-slate-900 uppercase mb-0.5 font-bold">Modello / Matricola:</strong>
                      <span className="font-mono text-slate-800">{att.modelloMatricola || 'Documentazione c/o cantiere'}</span>
                    </div>
                    <div>
                      <strong className="block text-slate-900 uppercase mb-0.5 font-bold">Operatore Abilitato:</strong>
                      <span className="text-slate-800">{att.operatoreAbilitato || 'Personale addestrato (art. 73)'}</span>
                    </div>
                    <div>
                      <strong className="block text-slate-900 uppercase mb-0.5 font-bold">Verifiche e Controlli:</strong>
                      <span className="text-emerald-700 font-bold">
                        {att.verifichePeriodiche ? 'Registrate a norma art. 71' : 'Controllo visivo giornaliero pre-uso'}
                      </span>
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-700 mb-2.5 leading-relaxed bg-slate-50/50 p-2 rounded border border-slate-200">
                    <strong className="text-slate-900 uppercase text-[10px] block mb-0.5 font-black">
                      Istruzioni di Sicurezza, Misure di Prevenzione e Controlli Preliminari:
                    </strong>
                    <span>{att.prescrizioniSicurezza || 'Verifica visiva dell’integrità delle protezioni prima dell’avviamento; divieto di manomissione dei ripari; arresto motore durante manutenzione o pulizia; esclusione alimentazione a fine turno.'}</span>
                  </div>

                  <div className="border-t border-slate-300 pt-2 flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-black uppercase text-slate-900">
                      DPI Obbligatori per l'Operatore:
                    </span>
                    {(att.dpiNecessari && att.dpiNecessari.length > 0
                      ? att.dpiNecessari
                      : ['Casco di protezione / Elmetto', 'Calzature di sicurezza S3', 'Guanti rischio meccanico', 'Otoprotettori (Cuffie / Inserti)']
                    ).map((dpiNome, dIdx) => (
                      <PosDpiBadge
                        key={dIdx}
                        name={dpiNome}
                        size="sm"
                        showNorma={true}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer Istituzionale Capitolo 10 */}
          <div className="border-t-2 border-slate-900 pt-2.5 mt-6 flex flex-col sm:flex-row items-center justify-between text-[8.5px] text-slate-500 font-mono gap-1">
            <span>{pos.datiImpresa.ragioneSociale || 'Impresa Esecutrice'} • {pos.datiCantiere.nome || 'Cantiere'}</span>
            <span>Doc. Tecnico POS {pos.codice} - Capitolo 10 - Allegato V e VI D.Lgs. 81/08</span>
            <span>Rev. {safeVersione}</span>
          </div>
        </div>

        {/* ================= CAPITOLO 11: OPERE PROVVISIONALI E LAVORI IN QUOTA (PAGINA DEDICATA) ================= */}
        <div id="pos-cap-11" className="pos-chapter-page border-2 border-slate-900 p-6 sm:p-8 mb-10 print:mb-0 bg-white min-h-[265mm] print:min-h-[285mm] flex flex-col justify-between page-break-before print:break-before-page">
          <div>
            {/* Header Capitolo 11 */}
            <div className="border-b-2 border-slate-900 pb-3 mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <span className="px-2.5 py-1 bg-slate-900 text-white text-[11px] font-black uppercase tracking-wider rounded">
                  CAP. 11
                </span>
                <div>
                  <h2 className="text-sm sm:text-base font-black text-slate-900 uppercase tracking-tight">
                    SCHEDE DI SICUREZZA DELLE OPERE PROVVISIONALI E DEI LAVORI IN QUOTA
                  </h2>
                  <span className="text-[9px] font-semibold text-slate-500 uppercase">
                    Titolo IV Capo II D.Lgs. 81/08 - Ponteggi, Trabattelli, Scale, Linee Vita e DPC Anticaduta
                  </span>
                </div>
              </div>
              <div className="text-right border-l-0 sm:border-l-2 border-slate-900 sm:pl-3 shrink-0">
                <span className="text-[9px] font-mono text-slate-600 block">{pos.codice}</span>
                <span className="text-[9px] font-bold text-cyan-800 block">Titolo IV Capo II</span>
              </div>
            </div>

            {/* Prescrizioni Tecniche Lavori in Quota (Art. 107-115) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4 text-[10px]">
              <div className="p-3 bg-cyan-50/50 border border-cyan-200 rounded">
                <strong className="block text-slate-900 uppercase font-black mb-1">
                  Definizione Lavoro in Quota (Art. 107):
                </strong>
                <p className="text-slate-700 leading-relaxed text-[9.5px]">
                  Attività lavorativa che espone il lavoratore al rischio di caduta da una quota posta ad altezza superiore a 2,00 m rispetto a un piano stabile. Obbligo prioritario di protezione collettiva.
                </p>
              </div>
              <div className="p-3 bg-cyan-50/50 border border-cyan-200 rounded">
                <strong className="block text-slate-900 uppercase font-black mb-1">
                  Priorità DPC su DPI (Art. 111):
                </strong>
                <p className="text-slate-700 leading-relaxed text-[9.5px]">
                  I dispositivi di protezione collettiva (parapetti con corrente principale a 100 cm, intermedio e tavola fermapiede da 20 cm) hanno priorità assoluta rispetto ai DPI anticaduta individuali (EN 361).
                </p>
              </div>
              <div className="p-3 bg-cyan-50/50 border border-cyan-200 rounded">
                <strong className="block text-slate-900 uppercase font-black mb-1">
                  Regime Pi.M.U.S. (Art. 136):
                </strong>
                <p className="text-slate-700 leading-relaxed text-[9.5px]">
                  Per ogni ponteggio metallico fisso è obbligatorio redigere il Piano di Montaggio, Uso e Smontaggio (PiMUS), affidando le operazioni solo a ponteggiatori abilitati con corso di 28 ore.
                </p>
              </div>
            </div>

            {/* Schede Dettagliate delle Opere Provvisionali */}
            <div className="space-y-4">
              {(pos.opereProvvisionali && pos.opereProvvisionali.length > 0 ? pos.opereProvvisionali : [
                {
                  id: 'op-def-1',
                  tipo: 'Trabattello Mobile su Ruote (Torre Mobile da Lavoro)',
                  categoria: 'Opere Provvisionali Mobili (UNI EN 1004)',
                  pimusRichiesto: false,
                  conformitaNormativa: 'UNI EN 1004-1:2021 / D.Lgs. 81/08 Allegato XXIII',
                  descrizione: 'Torre mobile su ruote utilizzata per interventi di finitura e montaggio impianti ad altezza ridotta all\'interno o all\'esterno del fabbricato.',
                  prescrizioniSicurezza: 'Bloccaggio obbligatorio delle ruote prima di salire sull\'impalcato; divieto assoluto di spostamento del trabattello con persone o carichi a bordo; montaggio stabilizzatori per altezze superiori a 2,5 m; accesso interno tramite scalette integrate.',
                  dpiNecessari: ['Casco di protezione / Elmetto', 'Calzature di sicurezza S3', 'Imbracatura anticaduta con cordino e assorbitore EN 355'],
                },
                {
                  id: 'op-def-2',
                  tipo: 'Scale Portatili e Parapetti Provvisori di Bordo',
                  categoria: 'Dispositivi di Accesso e Protezione Bordi',
                  pimusRichiesto: false,
                  conformitaNormativa: 'UNI EN 131 (Scale) / UNI EN 13374 Classe A (Parapetti)',
                  descrizione: 'Scale portatili per il solo transito o accesso temporaneo a quote differenti e parapetti prefabbricati a morsa per protezione solai e aperture.',
                  prescrizioniSicurezza: 'Scale vincolate in sommità con sporgenza di almeno 1 metro oltre il piano di sbarco; inclinazione corretta a 75°; divieto d\'impiego della scala come postazione stabile di lavoro prolungato.',
                  dpiNecessari: ['Casco di protezione / Elmetto', 'Calzature di sicurezza S3', 'Guanti rischio meccanico'],
                }
              ]).map((op, idx) => (
                <div
                  key={op.id || idx}
                  className="border-2 border-slate-800 rounded-lg p-3.5 bg-white page-break-avoid shadow-xs"
                >
                  <div className="flex items-start justify-between gap-3 border-b-2 border-slate-800 pb-2.5 mb-2.5">
                    <div className="flex items-center gap-3">
                      <PosSchedaLogo
                        tipo="opera"
                        title={op.tipo}
                        iconaEmoji={op.icona}
                        logoUrl={op.logoUrl || op.immagineUrl}
                        size="md"
                      />
                      <div>
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="px-1.5 py-0.5 bg-cyan-700 text-white font-black text-[9px] uppercase tracking-wider rounded">
                            OPERA PROVVISIONALE #{idx + 1}
                          </span>
                          <span className="px-2 py-0.5 rounded bg-cyan-50 text-cyan-900 text-[10px] font-bold uppercase border border-cyan-200">
                            {op.categoria || 'Lavori in Quota'}
                          </span>
                          {op.pimusRichiesto && (
                            <span className="px-2 py-0.5 rounded bg-rose-600 text-white text-[9px] font-black uppercase">
                              Pi.M.U.S. Obbligatorio
                            </span>
                          )}
                        </div>
                        <strong className="text-sm font-black uppercase text-slate-900 block leading-tight">
                          {op.tipo}
                        </strong>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-[9px] font-bold text-slate-500 uppercase block">Norma Tecnica</span>
                      <span className="text-[10px] font-black text-slate-800 font-mono">
                        {op.conformitaNormativa || 'UNI EN 12810 / D.Lgs. 81/08'}
                      </span>
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-700 mb-2.5 leading-relaxed bg-slate-50 p-2 rounded border border-slate-200">
                    <strong className="text-slate-900 uppercase text-[10px] block mb-0.5 font-black">
                      Descrizione Operativa e Modalità d'Uso:
                    </strong>
                    <span>{op.descrizione}</span>
                  </div>

                  <div className="text-[11px] text-slate-700 mb-2.5 leading-relaxed bg-cyan-50/30 p-2 rounded border border-cyan-200">
                    <strong className="text-slate-900 uppercase text-[10px] block mb-0.5 font-black">
                      Prescrizioni di Sicurezza, Ancoraggi e Controlli Periodici:
                    </strong>
                    <span>{op.prescrizioniSicurezza || 'Verifica visiva giornaliera prima dell’accesso; ancoraggi strutturali secondo schema tecnico; divieto di sovraccarico degli impalcati oltre la portata indicata; presenza di fermapiedi e parapetti completi.'}</span>
                  </div>

                  <div className="border-t border-slate-300 pt-2 flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-black uppercase text-slate-900">
                      DPI Obbligatori & Anticaduta:
                    </span>
                    {(op.dpiNecessari && op.dpiNecessari.length > 0
                      ? op.dpiNecessari
                      : ['Casco di protezione con sottogola', 'Calzature di sicurezza S3', 'Imbracatura completa anticaduta EN 361']
                    ).map((dpiNome, dIdx) => (
                      <PosDpiBadge
                        key={dIdx}
                        name={dpiNome}
                        size="sm"
                        showNorma={true}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer Istituzionale Capitolo 11 */}
          <div className="border-t-2 border-slate-900 pt-2.5 mt-6 flex flex-col sm:flex-row items-center justify-between text-[8.5px] text-slate-500 font-mono gap-1">
            <span>{pos.datiImpresa.ragioneSociale || 'Impresa Esecutrice'} • {pos.datiCantiere.nome || 'Cantiere'}</span>
            <span>Doc. Tecnico POS {pos.codice} - Capitolo 11 - Titolo IV Capo II D.Lgs. 81/08</span>
            <span>Rev. {safeVersione}</span>
          </div>
        </div>

        {/* ================= CAPITOLO 12: SOSTANZE CHIMICHE E SCHEDE SDS (PAGINA DEDICATA) ================= */}
        <div id="pos-cap-12" className="pos-chapter-page border-2 border-slate-900 p-6 sm:p-8 mb-10 print:mb-0 bg-white min-h-[265mm] print:min-h-[285mm] flex flex-col justify-between page-break-before print:break-before-page">
          <div>
            {/* Header Capitolo 12 */}
            <div className="border-b-2 border-slate-900 pb-3 mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <span className="px-2.5 py-1 bg-slate-900 text-white text-[11px] font-black uppercase tracking-wider rounded">
                  CAP. 12
                </span>
                <div>
                  <h2 className="text-sm sm:text-base font-black text-slate-900 uppercase tracking-tight">
                    SCHEDE DI SICUREZZA SOSTANZE CHIMICHE E PREPARATI PERICOLOSI (SCHEDE SDS)
                  </h2>
                  <span className="text-[9px] font-semibold text-slate-500 uppercase">
                    Titolo IX Capo I D.Lgs. 81/08 - Regolamento CLP (CE) 1272/2008 e Regolamento REACH
                  </span>
                </div>
              </div>
              <div className="text-right border-l-0 sm:border-l-2 border-slate-900 sm:pl-3 shrink-0">
                <span className="text-[9px] font-mono text-slate-600 block">{pos.codice}</span>
                <span className="text-[9px] font-bold text-purple-800 block">Titolo IX - REACH/CLP</span>
              </div>
            </div>

            {/* Principi di Sicurezza Chimica di Cantiere (Art. 223 - 225) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4 text-[10px]">
              <div className="p-3 bg-purple-50/50 border border-purple-200 rounded">
                <strong className="block text-slate-900 uppercase font-black mb-1">
                  Valutazione Rischio Chimico (Art. 223):
                </strong>
                <p className="text-slate-700 leading-relaxed text-[9.5px]">
                  Rischio chimico per la salute classificato come 'Irrilevante per la salute e basso per la sicurezza' subordinatamente al rigoroso rispetto delle istruzioni di manipolazione delle SDS e all'adozione dei DPI prescritti.
                </p>
              </div>
              <div className="p-3 bg-purple-50/50 border border-purple-200 rounded">
                <strong className="block text-slate-900 uppercase font-black mb-1">
                  Stoccaggio e Bacini di Contenimento:
                </strong>
                <p className="text-slate-700 leading-relaxed text-[9.5px]">
                  I fusti e contenitori di prodotti chimici, vernici e disarmanti sono stoccati in area ventilata protetta da intemperie e su apposito bacino di contenimento stagno per prevenire sversamenti accidentali nel terreno.
                </p>
              </div>
              <div className="p-3 bg-purple-50/50 border border-purple-200 rounded">
                <strong className="block text-slate-900 uppercase font-black mb-1">
                  Disponibilità Schede SDS (Art. 224):
                </strong>
                <p className="text-slate-700 leading-relaxed text-[9.5px]">
                  Le Schede di Dati di Sicurezza (SDS a 16 punti) fornite dai produttori sono tenute a disposizione di lavoratori, preposto e organi di vigilanza presso il box di cantiere in copia cartacea integrale.
                </p>
              </div>
            </div>

            {/* Indice riassuntivo delle sostanze */}
            <div className="mb-4">
              <strong className="block text-[10.5px] font-black uppercase text-slate-900 mb-1.5 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-purple-900" />
                Registro Sostanze e Preparati Chimici Utilizzati in Cantiere:
              </strong>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-slate-300 text-[9.5px]">
                  <thead>
                    <tr className="bg-slate-900 text-white font-bold text-left">
                      <th className="p-1.5 border border-slate-400">Prodotto Commerciale</th>
                      <th className="p-1.5 border border-slate-400">Fase d'Impiego</th>
                      <th className="p-1.5 border border-slate-400 text-center w-24">Scheda SDS</th>
                      <th className="p-1.5 border border-slate-400">Indicazioni di Rischio (Frasi H)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {(pos.sostanze && pos.sostanze.length > 0 ? pos.sostanze : [
                      {
                        id: 'sost-def-1',
                        nomeCommerciale: 'Malta cementizia e leganti idraulici',
                        utilizzoFase: 'Opere murarie e intonaci',
                        schedaSicurezzaPresente: true,
                        frasiH: 'H315 Provoca irritazione cutanea; H318 Provoca gravi lesioni oculari; H335 Può irritare le vie respiratorie.',
                      }
                    ]).map((sost, idx) => (
                      <tr key={sost.id || idx} className="hover:bg-slate-50">
                        <td className="p-1.5 border border-slate-300 font-bold text-slate-900">{sost.nomeCommerciale}</td>
                        <td className="p-1.5 border border-slate-300 text-slate-700">{sost.utilizzoFase}</td>
                        <td className="p-1.5 border border-slate-300 text-center font-bold">
                          <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-900 border border-emerald-300 rounded text-[8.5px]">
                            {sost.schedaSicurezzaPresente ? 'ALLEGATA IN ATTI' : 'PRESENTE'}
                          </span>
                        </td>
                        <td className="p-1.5 border border-slate-300 text-[9px] text-slate-700">{sost.frasiRischio || sost.frasiH || 'Consultare scheda SDS del produttore'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Schede Dettagliate di Sicurezza Chimica (SDS) */}
            <div className="space-y-4">
              {(pos.sostanze && pos.sostanze.length > 0 ? pos.sostanze : [
                {
                  id: 'sost-card-def',
                  nomeCommerciale: 'Malta cementizia, premiscelati e leganti per muratura',
                  produttore: 'Prodotti Certificati CE',
                  schedaSicurezzaPresente: true,
                  utilizzoFase: 'Fasi di muratura, ripristini e intonacatura',
                  pittogrammiPericolo: ['GHS07', 'GHS05'],
                  frasiH: 'H315 Provoca irritazione cutanea; H317 Può provocare una reazione allergica cutanea; H318 Provoca gravi lesioni oculari; H335 Può irritare le vie respiratorie.',
                  prescrizioniSicurezza: 'Impastare in ambiente ventilato; evitare la dispersione aerea delle polveri; non manipolare a mani nude; lavare abbondantemente gli occhi in caso di contatto accidentale e consultare il medico.',
                  dpiSpecifici: ['Guanti rischio chimico/meccanico EN 374', 'Occhiali a mascherina sigillati EN 166', 'Facciale filtrante antipolvere FFP2 EN 149', 'Calzature di sicurezza S3'],
                }
              ]).map((sost, idx) => (
                <div
                  key={sost.id || idx}
                  className="border-2 border-slate-800 rounded-lg p-3.5 bg-white page-break-avoid shadow-xs"
                >
                  <div className="flex items-start justify-between gap-3 border-b-2 border-slate-800 pb-2.5 mb-2.5">
                    <div className="flex items-center gap-3">
                      <PosSchedaLogo
                        tipo="sostanza"
                        title={sost.nomeCommerciale}
                        iconaEmoji={sost.icona}
                        logoUrl={sost.logoUrl || sost.immagineUrl}
                        size="md"
                      />
                      <div>
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="px-1.5 py-0.5 bg-purple-700 text-white font-black text-[9px] uppercase tracking-wider rounded">
                            SCHEDA SDS #{idx + 1}
                          </span>
                          <span className="px-2 py-0.5 rounded bg-purple-50 text-purple-900 text-[10px] font-bold uppercase border border-purple-200">
                            {sost.produttore || 'Prodotto Certificato CE'}
                          </span>
                        </div>
                        <strong className="text-sm font-black uppercase text-slate-900 block leading-tight">
                          {sost.nomeCommerciale}
                        </strong>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-[9px] font-bold text-slate-500 uppercase block">Scheda SDS c/o Cantiere</span>
                      <span className="text-[10px] font-black text-emerald-800 font-mono">
                        {sost.schedaSicurezzaPresente ? 'ALLEGATA (PRESENTE)' : 'DISPONIBILE'}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-[10px] mb-2.5 bg-slate-50 p-2.5 rounded border border-slate-300 items-center">
                    <div className="sm:col-span-2">
                      <strong className="block text-slate-900 uppercase mb-0.5 font-black">Fase Lavorativa d'Impiego:</strong>
                      <span className="text-slate-800">{sost.utilizzoFase}</span>
                    </div>

                    <div className="border-t sm:border-t-0 sm:border-l border-slate-300 pt-2 sm:pt-0 sm:pl-3">
                      <strong className="block text-slate-900 uppercase mb-1 font-black text-[9px]">
                        Pittogrammi di Pericolo GHS:
                      </strong>
                      <div className="flex items-center gap-2">
                        {(sost.pittogrammiPericolo && sost.pittogrammiPericolo.length > 0
                          ? sost.pittogrammiPericolo
                          : ['GHS07', 'GHS05']
                        ).map((pitt, pIdx) => (
                          <GhsHazardDiamond key={pIdx} codeOrText={pitt} size="md" />
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-700 mb-2.5 leading-relaxed bg-amber-50/40 p-2 rounded border border-amber-200">
                    <strong className="text-slate-900 uppercase text-[10px] block mb-0.5 font-black">
                      Indicazioni di Pericolo (Frasi H) e Prescrizioni di Manipolazione:
                    </strong>
                    <span>{sost.frasiH || sost.frasiRischio || sost.prescrizioniSicurezza || 'Manipolare in ambiente ventilato; evitare il contatto con pelle e occhi; non inalare vapori o polveri; lavare accuratamente le mani a fine turno.'}</span>
                  </div>

                  <div className="border-t border-slate-300 pt-2 flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-black uppercase text-slate-900">
                      DPI Specifici di Protezione Chimica:
                    </span>
                    {(sost.dpiSpecifici && sost.dpiSpecifici.length > 0
                      ? sost.dpiSpecifici
                      : ['Guanti rischio chimico EN 374', 'Occhiali a mascherina EN 166', 'Respiratore FFP2 antipolvere EN 149', 'Calzature di sicurezza S3']
                    ).map((dpiNome, dIdx) => (
                      <PosDpiBadge
                        key={dIdx}
                        name={dpiNome}
                        size="sm"
                        showNorma={true}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer Istituzionale Capitolo 12 */}
          <div className="border-t-2 border-slate-900 pt-2.5 mt-6 flex flex-col sm:flex-row items-center justify-between text-[8.5px] text-slate-500 font-mono gap-1">
            <span>{pos.datiImpresa.ragioneSociale || 'Impresa Esecutrice'} • {pos.datiCantiere.nome || 'Cantiere'}</span>
            <span>Doc. Tecnico POS {pos.codice} - Capitolo 12 - Titolo IX D.Lgs. 81/08</span>
            <span>Rev. {safeVersione}</span>
          </div>
        </div>

        {/* ================= CAPITOLO 13: GESTIONE EMERGENZE, PRIMO SOCCORSO E ANTINCENDIO (PAGINA DEDICATA) ================= */}
        <div id="pos-cap-13" className="pos-chapter-page border-2 border-slate-900 p-6 sm:p-8 mb-10 print:mb-0 bg-white min-h-[265mm] print:min-h-[285mm] flex flex-col justify-between page-break-before print:break-before-page">
          <div>
            {/* Header Capitolo 13 */}
            <div className="border-b-2 border-slate-900 pb-3 mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <span className="px-2.5 py-1 bg-slate-900 text-white text-[11px] font-black uppercase tracking-wider rounded">
                  CAP. 13
                </span>
                <div>
                  <h2 className="text-sm sm:text-base font-black text-slate-900 uppercase tracking-tight">
                    PIANO DI GESTIONE DELLE EMERGENZE, PRIMO SOCCORSO E LOTTA ANTINCENDIO
                  </h2>
                  <span className="text-[9px] font-semibold text-slate-500 uppercase">
                    All. XV p. 2.1 lett. k) D.Lgs. 81/08 - D.M. 388/2003 e D.M. 02/09/2021
                  </span>
                </div>
              </div>
              <div className="text-right border-l-0 sm:border-l-2 border-slate-900 sm:pl-3 shrink-0">
                <span className="text-[9px] font-mono text-slate-600 block">{pos.codice}</span>
                <span className="text-[9px] font-bold text-rose-700 block">NUE 112 • Emergenze</span>
              </div>
            </div>

            {/* Tabella Dati di Emergenza e Presidi */}
            <div className="mb-4">
              <strong className="block text-[10.5px] font-black uppercase text-slate-900 mb-1.5 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-600" />
                Presidi e Recapiti Istituzionali per il Soccorso:
              </strong>
              <table className="w-full border-collapse border border-slate-300 text-xs">
                <tbody>
                  <tr className="border-b border-slate-300">
                    <td className="w-1/3 bg-slate-100 p-2 font-bold text-slate-900 text-[10px]">Numero Unico Europeo Emergenza (NUE):</td>
                    <td className="p-2 font-black text-rose-700 text-sm font-mono">{pos.emergenza.numeroUnicoEmergenza || '112'}</td>
                  </tr>
                  <tr className="border-b border-slate-300">
                    <td className="bg-slate-100 p-2 font-bold text-slate-900 text-[10px]">Pronto Soccorso Ospedaliero di Riferimento:</td>
                    <td className="p-2 font-bold text-slate-800 text-[11px]">
                      {formatMissingData(pos.emergenza.ospedaleRiferimento, 'Presidio Ospedaliero Territoriale')} ({formatMissingData(pos.emergenza.prontoSoccorsoIndirizzo, 'Indirizzo e percorso indicati in cantiere')})
                    </td>
                  </tr>
                  <tr className="border-b border-slate-300">
                    <td className="bg-slate-100 p-2 font-bold text-slate-900 text-[10px]">Telefono Presidio Ospedaliero Diretto:</td>
                    <td className="p-2 font-mono text-slate-800 text-[11px]">{formatMissingData(pos.emergenza.telefonoProntoSoccorso, '112')}</td>
                  </tr>
                  <tr className="border-b border-slate-300">
                    <td className="bg-slate-100 p-2 font-bold text-slate-900 text-[10px]">Punto di Raccolta e Attesa Soccorsi:</td>
                    <td className="p-2 text-slate-800 text-[11px] font-bold">{pos.emergenza.puntoRaccolta || 'Cancello carraio d\'ingresso al cantiere (segnalato con cartello ISO 7010 E007)'}</td>
                  </tr>
                  <tr>
                    <td className="bg-slate-100 p-2 font-bold text-slate-900 text-[10px]">Dotazione Presidi Sanitari ed Antincendio:</td>
                    <td className="p-2 text-slate-800 text-[11px]">
                      {pos.emergenza.cassettaPrimoSoccorsoUbicazione || 'Cassetta di Primo Soccorso conforme All. 1 D.M. 388/03 c/o ufficio di cantiere; estintori a polvere 34A 233BC e CO2 collaudati.'}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Incaricati della Gestione Emergenze */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4 text-[10px]">
              <div className="p-3 bg-slate-50 border border-slate-300 rounded">
                <strong className="block text-slate-900 uppercase font-black mb-1">
                  Addetti al Primo Soccorso Aziendale (Art. 18 c. 1 lett. b):
                </strong>
                <p className="text-slate-700 leading-relaxed text-[9.5px]">
                  <strong>Nominativi designati:</strong> {pos.datiImpresa.addettoPrimoSoccorso || pos.datiImpresa.prepostoCantiere || pos.datiImpresa.datoreDiLavoro || 'Lavoratore designato e formato'}<br />
                  Formazione attestata conforme al D.M. 388/2003 (Gruppo B/C - 12 ore con aggiornamento triennale di 4 ore).
                </p>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-300 rounded">
                <strong className="block text-slate-900 uppercase font-black mb-1">
                  Addetti alla Prevenzione Incendi ed Evacuazione (D.M. 02/09/2021):
                </strong>
                <p className="text-slate-700 leading-relaxed text-[9.5px]">
                  <strong>Nominativi designati:</strong> {pos.datiImpresa.addettoAntincendio || pos.datiImpresa.prepostoCantiere || pos.datiImpresa.datoreDiLavoro || 'Lavoratore designato e formato'}<br />
                  Formazione attestata Livello 1-FOR / Livello 2-FOR (ex rischio medio/basso) con aggiornamento quinquennale.
                </p>
              </div>
            </div>

            {/* Protocollo Operativo di Chiamata di Emergenza e Scenari Critici */}
            <div className="p-3 border-2 border-rose-300 rounded bg-rose-50/40 text-[10px] leading-relaxed mb-4">
              <strong className="block text-rose-900 uppercase font-black text-[11px] mb-1">
                Protocollo Operativo di Chiamata al NUE 112 (Checklist Telefonica):
              </strong>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-800">
                <div>
                  <span className="font-bold block">1. Identificazione e Localizzazione:</span>
                  Comunicare ragione sociale impresa, via esatta cantiere, numero civico e comune, coordinate GPS se disponibili.
                </div>
                <div>
                  <span className="font-bold block">2. Natura dell'Evento e Infortunati:</span>
                  Dinamica (caduta dall'alto, schiacciamento, malore, elettrocuzione), numero di persone coinvolte e stato di coscienza.
                </div>
                <div>
                  <span className="font-bold block">3. Presidio del Cancello di Ingresso:</span>
                  Un lavoratore incaricato si posiziona all'ingresso carraio per guidare l'ambulanza o i Vigili del Fuoco sul posto esatto.
                </div>
                <div>
                  <span className="font-bold block">4. Divieto di Spostamento Infortunato:</span>
                  In caso di sospetto trauma spinale da caduta, non muovere l'infortunato salvo pericolo immediato di crollo o incendio.
                </div>
              </div>
            </div>

            {/* Procedure per Scenari Specifici */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-[9.5px]">
              <div className="p-2.5 bg-slate-50 border border-slate-300 rounded">
                <strong className="block text-slate-900 uppercase font-bold mb-0.5">Scenario Incendio:</strong>
                <span className="text-slate-700">Interrompere l'alimentazione elettrica generale; attaccare le fiamme alla base con estintore a polvere; evacuare l'area verso il punto di raccolta se l'incendio supera la fase di principio.</span>
              </div>
              <div className="p-2.5 bg-slate-50 border border-slate-300 rounded">
                <strong className="block text-slate-900 uppercase font-bold mb-0.5">Scenario Fuga Gas / Elettrico:</strong>
                <span className="text-slate-700">Allontanare immediatamente tutto il personale; vietare l'uso di telefoni, motori o interruttori che possano generare scintille; avvisare gli enti distributori di rete.</span>
              </div>
              <div className="p-2.5 bg-slate-50 border border-slate-300 rounded">
                <strong className="block text-slate-900 uppercase font-bold mb-0.5">Emergenza Stress Termico:</strong>
                <span className="text-slate-700">In caso di colpo di calore: spostare il lavoratore all'ombra in area aerata, slacciare indumenti pesanti, applicare impacchi freschi e idratare a piccoli sorsi.</span>
              </div>
            </div>
          </div>

          {/* Footer Istituzionale Capitolo 13 */}
          <div className="border-t-2 border-slate-900 pt-2.5 mt-6 flex flex-col sm:flex-row items-center justify-between text-[8.5px] text-slate-500 font-mono gap-1">
            <span>{pos.datiImpresa.ragioneSociale || 'Impresa Esecutrice'} • {pos.datiCantiere.nome || 'Cantiere'}</span>
            <span>Doc. Tecnico POS {pos.codice} - Capitolo 13 - All. XV p. 2.1 lett. k) D.Lgs. 81/08</span>
            <span>Rev. {safeVersione}</span>
          </div>
        </div>

        {/* ================= CAPITOLO 14: DISPOSIZIONI FINALI, REVISIONE, ALLEGATI E FIRME (PAGINA DEDICATA) ================= */}
        <div id="pos-cap-14" className="pos-chapter-page border-2 border-slate-900 p-6 sm:p-8 mb-10 print:mb-0 bg-white min-h-[265mm] print:min-h-[285mm] flex flex-col justify-between page-break-before print:break-before-page">
          <div>
            {/* Header Capitolo 14 */}
            <div className="border-b-2 border-slate-900 pb-3 mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <span className="px-2.5 py-1 bg-slate-900 text-white text-[11px] font-black uppercase tracking-wider rounded">
                  CAP. 14
                </span>
                <div>
                  <h2 className="text-sm sm:text-base font-black text-slate-900 uppercase tracking-tight">
                    DISPOSIZIONI FINALI, REVISIONE, ALLEGATI OBBLIGATORI E SOTTOSCRIZIONI
                  </h2>
                  <span className="text-[9px] font-semibold text-slate-500 uppercase">
                    Art. 50, Art. 89, Art. 96 e Allegato XVII D.Lgs. 81/08 - Validazione Giuridica e Firme
                  </span>
                </div>
              </div>
              <div className="text-right border-l-0 sm:border-l-2 border-slate-900 sm:pl-3 shrink-0">
                <span className="text-[9px] font-mono text-slate-600 block">{pos.codice}</span>
                <span className="text-[9px] font-bold text-blue-700 block">Sottoscrizioni Ufficiali</span>
              </div>
            </div>

            {/* Consultazione RLS e Clausole di Revisione */}
            <div className="space-y-3 text-xs mb-4">
              <div className="p-3 bg-slate-50 border border-slate-300 rounded">
                <h3 className="font-bold text-[10.5px] uppercase text-slate-900 mb-1">
                  14.1 Consultazione R.L.S. e Criteri Tassativi di Revisione del Documento (Art. 50 e 96)
                </h3>
                <p className="text-slate-700 leading-relaxed text-[10px]">
                  Il presente Piano Operativo di Sicurezza è stato preliminarmente esaminato e condiviso con il Rappresentante dei Lavoratori per la Sicurezza (R.L.S. o R.L.S.T.) ai sensi dell'art. 50 comma 1 lett. b) del D.Lgs. 81/08. Costituiscono motivo di revisione e aggiornamento formale obbligatorio del POS:
                  1) L'introduzione di nuove lavorazioni o modifiche sostanziali alle fasi esecutive;
                  2) L'impiego di nuove macchine, attrezzature o sostanze chimiche non contemplate;
                  3) L'insorgere di nuove interferenze viabili o prescrizioni vincolanti impartite dal Coordinatore per la Sicurezza in fase di Esecuzione (CSE).
                </p>
              </div>

              {/* Elenco Documentazione Obbligatoria Allegata (All. XVII) */}
              <div>
                <h3 className="font-bold text-[10.5px] uppercase text-slate-900 mb-1.5 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-slate-800" />
                  14.2 Elenco della Documentazione Obbligatoria Allegata in Atti (Allegato XVII):
                </h3>
                {(() => {
                  const allegatiEffettivi = (pos.allegati || []).filter(a => a.allegatoPresente);
                  if (allegatiEffettivi.length === 0) {
                    return (
                      <div className="p-2.5 border border-slate-300 rounded bg-slate-50 text-[10px] text-slate-600 italic">
                        Nessun documento integrativo allegato al piano (documentazione custodita in atti presso la sede legale dell'impresa).
                      </div>
                    );
                  }
                  return (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[10px]">
                      {allegatiEffettivi.map((all, idx) => (
                        <div key={all.id || idx} className="flex items-center justify-between p-2 border border-slate-300 rounded bg-white shadow-2xs">
                          <span className="font-medium text-slate-800 truncate mr-2">{all.titolo}</span>
                          <span className="font-bold text-emerald-700 text-[9px] shrink-0 font-mono">
                            ✓ ALLEGATO
                          </span>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>

              {pos.notePrescrizioni && (
                <div>
                  <h3 className="font-bold text-[10.5px] uppercase text-slate-900 mb-1">
                    14.3 Note Conclusive e Prescrizioni Integrative del CSE
                  </h3>
                  <p className="p-2.5 border border-slate-300 rounded bg-amber-50/50 text-slate-800 text-[10px] italic">
                    {pos.notePrescrizioni}
                  </p>
                </div>
              )}
            </div>

            {/* Riquadro Firme Ufficiali (Datore di Lavoro/RSPP, Preposto di Cantiere e RLS) */}
            <div className="pt-3 border-t-2 border-slate-900 mt-4 page-break-avoid">
              <h3 className="font-black text-xs uppercase text-slate-900 mb-3 text-center tracking-wider">
                SOTTOSCRIZIONI UFFICIALI, ASSEVERAZIONE E CONVALIDA DEL PIANO OPERATIVO
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center text-xs">
                <div className="border-2 border-slate-300 p-3 rounded bg-slate-50 shadow-xs">
                  <span className="block text-[10px] font-black text-slate-900 uppercase">
                    Datore di Lavoro e RSPP
                  </span>
                  <span className="block text-[8.5px] text-slate-500 mb-2">
                    (Funzioni svolte direttamente ex Art. 34)
                  </span>
                  <strong className="block text-slate-900 text-xs my-1 font-mono">
                    {formatMissingData(pos.datiImpresa.datoreDiLavoro || pos.datiImpresa.rspp, 'Datore di Lavoro')}
                  </strong>
                  <div className="border-b-2 border-slate-400 mt-8 mb-1" />
                  <span className="text-[8px] text-slate-500 block">
                    (Timbro e Firma per Asseverazione)
                  </span>
                </div>

                <div className="border-2 border-slate-300 p-3 rounded bg-slate-50 shadow-xs">
                  <span className="block text-[10px] font-black text-slate-900 uppercase">
                    Preposto di Cantiere
                  </span>
                  <span className="block text-[8.5px] text-slate-500 mb-2">
                    (Vigilanza Operativa ex Art. 19 D.Lgs. 81/08)
                  </span>
                  <strong className="block text-slate-900 text-xs my-1 font-mono">
                    {formatMissingData(pos.datiImpresa.prepostoCantiere, 'Preposto di Cantiere')}
                  </strong>
                  <div className="border-b-2 border-slate-400 mt-8 mb-1" />
                  <span className="text-[8px] text-slate-500 block">
                    (Firma per Ricevuta e Presa in Carico)
                  </span>
                </div>

                <div className="border-2 border-slate-300 p-3 rounded bg-slate-50 shadow-xs">
                  <span className="block text-[10px] font-black text-slate-900 uppercase">
                    R.L.S. / R.L.S.T.
                  </span>
                  <span className="block text-[8.5px] text-slate-500 mb-2">
                    (Rappr. Lavoratori ex Art. 50 D.Lgs. 81/08)
                  </span>
                  <strong className="block text-slate-900 text-xs my-1 font-mono">
                    {formatMissingData(pos.datiImpresa.rls, 'RLST Territoriale')}
                  </strong>
                  <div className="border-b-2 border-slate-400 mt-8 mb-1" />
                  <span className="text-[8px] text-slate-500 block">
                    (Firma per Avvenuta Consultazione)
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Istituzionale Capitolo 14 */}
          <div className="border-t-2 border-slate-900 pt-2.5 mt-6 flex flex-col sm:flex-row items-center justify-between text-[8.5px] text-slate-500 font-mono gap-1">
            <span>{pos.datiImpresa.ragioneSociale || 'Impresa Esecutrice'} • {pos.datiCantiere.nome || 'Cantiere'}</span>
            <span>Doc. Tecnico POS {pos.codice} - Capitolo 14 - Allegato XVII D.Lgs. 81/08</span>
            <span>Rev. {safeVersione}</span>
          </div>
        </div>
      </div>
      </div>
    </div>,
    document.body
  );
};
