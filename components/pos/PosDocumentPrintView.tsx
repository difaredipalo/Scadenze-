import React, { useState, useRef } from 'react';
import { PosDocument } from '../../types';
import {
  POS_DPI_LIST,
  formatMissingData,
  MATRICE_RISCHIO_4X4,
  CRITERI_PROBABILITA,
  CRITERI_DANNO,
  CLASSI_RISCHIO_DEF,
  DEFAULT_ORGANIZZAZIONE_CANTIERE,
} from '../../data/posDefaultData';
import { Icons } from '../../constants';
import { generatePosPdf } from './posPdfGenerator';
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
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [downloadNotice, setDownloadNotice] = useState<string | null>(null);
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

  const handleDownloadPdf = () => {
    try {
      setIsExportingPdf(true);
      generatePosPdf(safePos);
      setDownloadNotice(`File PDF scaricato nella versione aggiornata a 14 Capitoli (Rev. ${safeVersione})!`);
      setTimeout(() => setDownloadNotice(null), 4500);
    } catch (err) {
      console.error('Errore durante la generazione del PDF:', err);
      alert('Si è verificato un errore durante la generazione del file PDF.');
    } finally {
      setTimeout(() => setIsExportingPdf(false), 800);
    }
  };

  const handlePrint = () => {
    const el = document.getElementById('pos-document-root');
    if (!el) {
      window.print();
      return;
    }

    try {
      let printFrame = document.getElementById('pos-print-hidden-iframe') as HTMLIFrameElement;
      if (printFrame && printFrame.parentNode) {
        printFrame.parentNode.removeChild(printFrame);
      }

      printFrame = document.createElement('iframe');
      printFrame.id = 'pos-print-hidden-iframe';
      printFrame.style.position = 'fixed';
      printFrame.style.right = '0';
      printFrame.style.bottom = '0';
      printFrame.style.width = '0';
      printFrame.style.height = '0';
      printFrame.style.border = '0';
      printFrame.style.visibility = 'hidden';
      document.body.appendChild(printFrame);

      const frameDoc = printFrame.contentWindow?.document;
      if (frameDoc) {
        // Raccoglie tutti i fogli di stile e tag style attivi nella finestra principale
        const existingStyles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
          .map(styleEl => styleEl.outerHTML)
          .join('\n');

        frameDoc.open();
        frameDoc.write(`
          <!DOCTYPE html>
          <html lang="it">
          <head>
            <meta charset="UTF-8">
            <title>POS - ${pos.codice} - ${pos.datiCantiere.nome || 'Cantiere'}</title>
            ${existingStyles}
            <style>
              @page {
                size: A4 portrait !important;
                margin: 10mm 12mm !important;
              }
              @media print {
                body {
                  -webkit-print-color-adjust: exact !important;
                  print-color-adjust: exact !important;
                }
              }
              html, body {
                font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif !important;
                background: #ffffff !important;
                color: #0f172a !important;
                margin: 0 !important;
                padding: 0 !important;
                width: 100% !important;
                font-size: 11px !important;
                line-height: 1.4 !important;
              }
              .page-break-before {
                page-break-before: always !important;
                break-before: page !important;
              }
              .page-break-avoid {
                page-break-inside: avoid !important;
                break-inside: avoid !important;
              }
              table {
                page-break-inside: auto !important;
                width: 100% !important;
                border-collapse: collapse !important;
              }
              tr {
                page-break-inside: avoid !important;
                break-inside: avoid !important;
              }
              td, th {
                border-color: #cbd5e1 !important;
              }
            </style>
          </head>
          <body>
            <div style="width: 100%; max-width: 210mm; margin: 0 auto; padding: 2mm;">
              ${el.innerHTML}
            </div>
          </body>
          </html>
        `);
        frameDoc.close();

        setTimeout(() => {
          try {
            printFrame.contentWindow?.focus();
            printFrame.contentWindow?.print();
          } catch (e) {
            window.print();
          }
        }, 300);
        return;
      }
    } catch (err) {
      console.warn('Iframe print error, fallback:', err);
    }
    window.print();
  };

  const getDpiNorma = (dpiNome: string) => {
    const found = POS_DPI_LIST.find(d => dpiNome.toLowerCase().includes(d.nome.toLowerCase()) || d.nome.toLowerCase().includes(dpiNome.toLowerCase()));
    return found ? found.norma : 'Norma armonizzata EN';
  };

  return (
    <div
      ref={scrollContainerRef}
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-start overflow-y-auto overflow-x-auto p-2 sm:p-6 print:p-0 print:static print:bg-white print:overflow-visible custom-scrollbar"
    >
      {/* Floating Directional Navigation Pad */}
      <div className="fixed bottom-6 right-6 z-50 print:hidden flex flex-col items-center bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl space-y-2 select-none">
        <div className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 text-center w-full">
          Navigatore
        </div>
        <div className="grid grid-cols-3 gap-1.5 items-center justify-items-center">
          <div />
          <button
            type="button"
            onClick={() => handleScroll('up')}
            title="Scorri in alto"
            className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-blue-600 hover:text-white text-slate-700 dark:text-slate-300 flex items-center justify-center transition-all shadow-sm active:scale-95"
          >
            <Icons.ChevronUp className="w-5 h-5" />
          </button>
          <div />

          <button
            type="button"
            onClick={() => handleScroll('left')}
            title="Scorri a sinistra"
            className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-blue-600 hover:text-white text-slate-700 dark:text-slate-300 flex items-center justify-center transition-all shadow-sm active:scale-95"
          >
            <Icons.ChevronLeft className="w-5 h-5" />
          </button>

          <button
            type="button"
            onClick={() => handleScroll('top')}
            title="Torna all'inizio"
            className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 hover:bg-blue-600 hover:text-white flex items-center justify-center font-black text-[10px] transition-all shadow-sm active:scale-95"
          >
            TOP
          </button>

          <button
            type="button"
            onClick={() => handleScroll('right')}
            title="Scorri a destra"
            className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-blue-600 hover:text-white text-slate-700 dark:text-slate-300 flex items-center justify-center transition-all shadow-sm active:scale-95"
          >
            <Icons.ChevronRight className="w-5 h-5" />
          </button>

          <div />
          <button
            type="button"
            onClick={() => handleScroll('down')}
            title="Scorri in basso"
            className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-blue-600 hover:text-white text-slate-700 dark:text-slate-300 flex items-center justify-center transition-all shadow-sm active:scale-95"
          >
            <Icons.ChevronDown className="w-5 h-5" />
          </button>
          <div />
        </div>

        {/* Indice Rapido Salti di Capitolo */}
        <div className="pt-2 border-t border-slate-200 dark:border-slate-800 w-full flex flex-col gap-1">
          <button
            type="button"
            onClick={() => scrollToSection('pos-cap-copertina')}
            className="w-full text-left px-2 py-1 rounded-lg text-[10px] font-bold text-slate-600 dark:text-slate-400 hover:bg-blue-50 dark:hover:bg-blue-950/40"
          >
            📋 Copertina & Indice
          </button>
          <button
            type="button"
            onClick={() => scrollToSection('pos-cap-1')}
            className="w-full text-left px-2 py-1 rounded-lg text-[10px] font-bold text-slate-600 dark:text-slate-400 hover:bg-blue-50 dark:hover:bg-blue-950/40"
          >
            🏢 Cap. 1: Dati Identificativi
          </button>
          <button
            type="button"
            onClick={() => scrollToSection('pos-cap-6')}
            className="w-full text-left px-2 py-1 rounded-lg text-[10px] font-bold text-slate-600 dark:text-slate-400 hover:bg-blue-50 dark:hover:bg-blue-950/40"
          >
            📊 Cap. 6: Metodologia Rischi
          </button>
          <button
            type="button"
            onClick={() => scrollToSection('pos-cap-9')}
            className="w-full text-left px-2 py-1 rounded-lg text-[10px] font-bold text-slate-600 dark:text-slate-400 hover:bg-blue-50 dark:hover:bg-blue-950/40"
          >
            🔨 Cap. 9: Schede Lavorazioni
          </button>
          <button
            type="button"
            onClick={() => scrollToSection('pos-cap-14')}
            className="w-full text-left px-2 py-1 rounded-lg text-[10px] font-bold text-slate-600 dark:text-slate-400 hover:bg-blue-50 dark:hover:bg-blue-950/40"
          >
            ✍️ Cap. 14: Firme e Chiusura
          </button>
        </div>
      </div>

      {/* Action Bar Header */}
      <div className="w-full max-w-5xl bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-4 mb-6 flex flex-col gap-3 sticky top-4 z-20 print:hidden">
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
                {safePos.codice} • Rev. {safeVersione} • Formato UNI A4 Verticale • Aspetto Tecnico Rigoroso
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isExportingPdf}
              className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-md shadow-emerald-600/20 active:scale-95 disabled:opacity-50"
              title="Scarica direttamente il file PDF ufficiale in formato A4"
            >
              <span>📥</span>
              <span>{isExportingPdf ? 'Generazione PDF...' : 'Scarica File PDF (A4)'}</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-md shadow-blue-600/20 active:scale-95"
            >
              <Icons.Printer />
              <span>Stampa A4</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-black uppercase tracking-widest transition-all"
            >
              Chiudi
            </button>
          </div>
        </div>

        {downloadNotice && (
          <div className="p-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold shadow flex items-center justify-between animate-fadeIn">
            <div className="flex items-center gap-2">
              <span>✅</span>
              <span>{downloadNotice}</span>
            </div>
            <button
              type="button"
              onClick={() => setDownloadNotice(null)}
              className="text-white/80 hover:text-white px-2 font-black"
            >
              ✕
            </button>
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* FOGLIO A4 DOCUMENTO POS TECNICO UFFICIALE (14 CAPITOLI) */}
      {/* ========================================================= */}
      <div
        id="pos-document-root"
        className="w-full max-w-[210mm] bg-white text-slate-900 shadow-2xl p-6 sm:p-10 mb-16 rounded-sm border border-slate-200 font-sans print:p-0 print:shadow-none print:border-none print:m-0 print:w-full print:max-w-none leading-relaxed text-[11px]"
      >
        {/* ================= COPERTINA ================= */}
        <div id="pos-cap-copertina" className="border-4 border-slate-900 p-8 mb-10 text-center relative print:mb-6 min-h-[260mm] flex flex-col justify-between">
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

        {/* ================= INDICE GENERALE DEI 14 CAPITOLI ================= */}
        <div className="bg-slate-50 p-6 border-2 border-slate-400 rounded mb-10 print:mb-6 page-break-avoid">
          <h2 className="text-xs font-black uppercase tracking-widest text-slate-900 border-b-2 border-slate-900 pb-2 mb-3">
            INDICE GENERALE DEL PIANO OPERATIVO DI SICUREZZA (ALL. XV D.LGS. 81/08)
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1 text-xs text-slate-800">
            <div><strong>CAPITOLO 1:</strong> DATI IDENTIFICATIVI</div>
            <div><strong>CAPITOLO 8:</strong> PROGRAMMAZIONE, TURNI E PRESENZE</div>
            <div><strong>CAPITOLO 2:</strong> DESCRIZIONE DELL'OPERA E DEI LAVORI</div>
            <div><strong>CAPITOLO 9:</strong> SCHEDE DELLE LAVORAZIONI (SMART LINKING)</div>
            <div><strong>CAPITOLO 3:</strong> PERSONALE, MANSIONI E ORGANIZZAZIONE</div>
            <div><strong>CAPITOLO 10:</strong> SCHEDE ATTREZZATURE, MACCHINE E UTENSILI</div>
            <div><strong>CAPITOLO 4:</strong> RIFERIMENTI NORMATIVI E DEFINIZIONI</div>
            <div><strong>CAPITOLO 11:</strong> OPERE PROVVISIONALI E LAVORI IN QUOTA</div>
            <div><strong>CAPITOLO 5:</strong> ORGANIZZAZIONE E LOGISTICA DEL CANTIERE</div>
            <div><strong>CAPITOLO 12:</strong> SOSTANZE CHIMICHE E SCHEDE SDS</div>
            <div><strong>CAPITOLO 6:</strong> CRITERI E METODOLOGIA VALUTAZIONE RISCHI (4x4)</div>
            <div><strong>CAPITOLO 13:</strong> GESTIONE EMERGENZE, SOCCORSO E ANTINCENDIO</div>
            <div><strong>CAPITOLO 7:</strong> CONTESTO AMBIENTALE E CONDIZIONI AL CONTORNO</div>
            <div><strong>CAPITOLO 14:</strong> DISPOSIZIONI FINALI, REVISIONE E FIRME</div>
          </div>
        </div>

        {/* ================= CAPITOLO 1 ================= */}
        <div id="pos-cap-1" className="mb-8 print:mb-6 page-break-avoid">
          <div className="flex items-center gap-2 border-b-2 border-slate-900 pb-1 mb-3">
            <span className="px-2 py-0.5 bg-slate-900 text-white text-[10px] font-black">CAP. 1</span>
            <h2 className="text-xs font-black text-slate-900 uppercase">DATI IDENTIFICATIVI</h2>
          </div>

          {/* 1.1 Impresa */}
          <div className="mb-3">
            <h3 className="font-bold text-[11px] uppercase text-slate-800 mb-1">1.1 Dati Identificativi dell'Impresa Esecutrice</h3>
            <table className="w-full border-collapse border border-slate-300 text-xs">
              <tbody>
                <tr className="border-b border-slate-300">
                  <td className="w-1/3 bg-slate-100 p-1.5 font-bold">Ragione Sociale:</td>
                  <td className="p-1.5">{formatMissingData(pos.datiImpresa.ragioneSociale)}</td>
                </tr>
                <tr className="border-b border-slate-300">
                  <td className="bg-slate-100 p-1.5 font-bold">Sede Legale:</td>
                  <td className="p-1.5">{formatMissingData(pos.datiImpresa.sedeLegale)}</td>
                </tr>
                <tr className="border-b border-slate-300">
                  <td className="bg-slate-100 p-1.5 font-bold">Codice Fiscale / Partita IVA:</td>
                  <td className="p-1.5">{formatMissingData(pos.datiImpresa.codiceFiscale)} / {formatMissingData(pos.datiImpresa.partitaIva)}</td>
                </tr>
                <tr className="border-b border-slate-300">
                  <td className="bg-slate-100 p-1.5 font-bold">Recapiti (Telefono / PEC):</td>
                  <td className="p-1.5">{formatMissingData(pos.datiImpresa.telefono)} | {formatMissingData(pos.datiImpresa.pec)}</td>
                </tr>
                <tr>
                  <td className="bg-slate-100 p-1.5 font-bold">Cassa Edile Iscrizione:</td>
                  <td className="p-1.5">{formatMissingData(pos.datiImpresa.cassaEdileIscrizione, 'Regolare posizione Cassa Edile')}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* 1.2 Cantiere */}
          <div className="mb-3">
            <h3 className="font-bold text-[11px] uppercase text-slate-800 mb-1">1.2 Dati Identificativi del Cantiere</h3>
            <table className="w-full border-collapse border border-slate-300 text-xs">
              <tbody>
                <tr className="border-b border-slate-300">
                  <td className="w-1/3 bg-slate-100 p-1.5 font-bold">Denominazione Cantiere:</td>
                  <td className="p-1.5">{formatMissingData(pos.datiCantiere.nome)}</td>
                </tr>
                <tr className="border-b border-slate-300">
                  <td className="bg-slate-100 p-1.5 font-bold">Ubicazione e Indirizzo:</td>
                  <td className="p-1.5">{formatMissingData(pos.datiCantiere.indirizzo)} ({formatMissingData(pos.datiCantiere.comune)})</td>
                </tr>
                <tr className="border-b border-slate-300">
                  <td className="bg-slate-100 p-1.5 font-bold">Committente dei Lavori:</td>
                  <td className="p-1.5">{formatMissingData(pos.datiCantiere.committente)} (C.F./P.IVA: {formatMissingData(pos.datiCantiere.committenteCfPiva, 'N.D.')})</td>
                </tr>
                <tr className="border-b border-slate-300">
                  <td className="bg-slate-100 p-1.5 font-bold">Direttore dei Lavori (D.L.):</td>
                  <td className="p-1.5">{formatMissingData(pos.datiCantiere.direttoreLavori, 'Non nominato')}</td>
                </tr>
                <tr>
                  <td className="bg-slate-100 p-1.5 font-bold">Coordinatore Sicurezza (CSE):</td>
                  <td className="p-1.5">{formatMissingData(pos.datiCantiere.cse, 'Non nominato')}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* 1.3 Figure Sicurezza */}
          <div className="mb-3">
            <h3 className="font-bold text-[11px] uppercase text-slate-800 mb-1">1.3 Figure Aziendali con Compiti di Sicurezza (All. XV Punto 2.1)</h3>
            <table className="w-full border-collapse border border-slate-300 text-xs">
              <tbody>
                <tr className="border-b border-slate-300">
                  <td className="w-1/3 bg-slate-100 p-1.5 font-bold">Datore di Lavoro e RSPP:</td>
                  <td className="p-1.5 font-semibold">
                    {formatMissingData(pos.datiImpresa.datoreDiLavoro || pos.datiImpresa.rspp)}
                    <span className="ml-2 text-slate-500 font-normal text-[10px]">(Svolge direttamente compiti di RSPP ex art. 34 D.Lgs. 81/08)</span>
                  </td>
                </tr>
                <tr className="border-b border-slate-300">
                  <td className="bg-slate-100 p-1.5 font-bold">Medico Competente:</td>
                  <td className="p-1.5">{formatMissingData(pos.datiImpresa.medicoCompetente, 'Non nominato (assenza rischi specifici ex D.Lgs. 81/08)')}</td>
                </tr>
                <tr className="border-b border-slate-300">
                  <td className="bg-slate-100 p-1.5 font-bold">Rappresentante Lavoratori Sicurezza (RLS):</td>
                  <td className="p-1.5">{formatMissingData(pos.datiImpresa.rls, 'RLST Territoriale')}</td>
                </tr>
                <tr className="border-b border-slate-300">
                  <td className="bg-slate-100 p-1.5 font-bold">Preposto per la Sicurezza in Cantiere:</td>
                  <td className="p-1.5 font-bold">{formatMissingData(pos.datiImpresa.prepostoCantiere)}</td>
                </tr>
                <tr>
                  <td className="bg-slate-100 p-1.5 font-bold">Incaricati Primo Soccorso e Antincendio:</td>
                  <td className="p-1.5">{formatMissingData(pos.datiImpresa.addettoPrimoSoccorso, 'Personale formato')}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* 1.4 Subappalti */}
          <div>
            <h3 className="font-bold text-[11px] uppercase text-slate-800 mb-1">1.4 Imprese Subappaltatrici o Lavoratori Autonomi</h3>
            <p className="p-2 border border-slate-300 rounded bg-slate-50 text-xs">
              {pos.datiCantiere.subappalti || 'Nessuna impresa subappaltatrice o lavoratore autonomo dichiarato alla data di emissione.'}
            </p>
          </div>
        </div>

        {/* ================= CAPITOLO 2 ================= */}
        <div id="pos-cap-2" className="mb-8 print:mb-6 page-break-avoid">
          <div className="flex items-center gap-2 border-b-2 border-slate-900 pb-1 mb-3">
            <span className="px-2 py-0.5 bg-slate-900 text-white text-[10px] font-black">CAP. 2</span>
            <h2 className="text-xs font-black text-slate-900 uppercase">DESCRIZIONE DELL'OPERA E DEI LAVORI SVOLTI DALL'IMPRESA</h2>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <h3 className="font-bold text-[11px] uppercase text-slate-800 mb-1">2.1 Inquadramento Generale dell'Opera</h3>
              <p className="p-2.5 border border-slate-300 rounded bg-slate-50 text-slate-800 leading-relaxed">
                {formatMissingData(pos.datiCantiere.descrizioneLavori, 'Descrizione generale dell\'opera da completare')}
              </p>
            </div>

            <div>
              <h3 className="font-bold text-[11px] uppercase text-slate-800 mb-1">2.2 Descrizione Specifica delle Attività Svolte dall'Impresa Esecutrice</h3>
              <p className="p-2.5 border border-slate-300 rounded bg-slate-50 text-slate-800 leading-relaxed">
                {formatMissingData(pos.datiCantiere.attivitaSvolteImpresa || pos.datiCantiere.descrizioneLavori, 'Dettaglio delle specifiche lavorazioni')}
              </p>
            </div>

            <div>
              <h3 className="font-bold text-[11px] uppercase text-slate-800 mb-1">2.3 Fasi Operative e Cronoprogramma Temporale</h3>
              <table className="w-full border-collapse border border-slate-300 text-xs">
                <tbody>
                  <tr className="border-b border-slate-300">
                    <td className="w-1/3 bg-slate-100 p-1.5 font-bold">Data Presunta Inizio Lavori:</td>
                    <td className="p-1.5">{formatMissingData(pos.datiCantiere.dataInizio)}</td>
                  </tr>
                  <tr className="border-b border-slate-300">
                    <td className="bg-slate-100 p-1.5 font-bold">Data Presunta Fine Lavori:</td>
                    <td className="p-1.5">{formatMissingData(pos.datiCantiere.dataFine)}</td>
                  </tr>
                  <tr>
                    <td className="bg-slate-100 p-1.5 font-bold">Durata Stimata Complessiva:</td>
                    <td className="p-1.5 font-bold">{pos.datiCantiere.durataGiorniPresunti || 120} giorni lavorativi presunti</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ================= CAPITOLO 3 ================= */}
        <div id="pos-cap-3" className="mb-8 print:mb-6 page-break-avoid">
          <div className="flex items-center gap-2 border-b-2 border-slate-900 pb-1 mb-3">
            <span className="px-2 py-0.5 bg-slate-900 text-white text-[10px] font-black">CAP. 3</span>
            <h2 className="text-xs font-black text-slate-900 uppercase">PERSONALE, MANSIONI E ORGANIZZAZIONE DELLA SICUREZZA</h2>
          </div>

          <div className="space-y-3 text-xs">
            <h3 className="font-bold text-[11px] uppercase text-slate-800">
              3.1 Organigramma e Lavoratori Assegnati ({pos.lavoratori.length} dipendenti)
            </h3>
            <table className="w-full border-collapse border border-slate-300 text-xs">
              <thead>
                <tr className="bg-slate-100 text-slate-900 font-bold border-b border-slate-300">
                  <th className="p-1.5 border border-slate-300 text-left">Nominativo</th>
                  <th className="p-1.5 border border-slate-300 text-left">Codice Fiscale</th>
                  <th className="p-1.5 border border-slate-300 text-left">Mansione</th>
                  <th className="p-1.5 border border-slate-300 text-left">Ruolo Cantiere</th>
                  <th className="p-1.5 border border-slate-300 text-center">Idoneità Sanitaria</th>
                </tr>
              </thead>
              <tbody>
                {pos.lavoratori.map((w, idx) => (
                  <tr key={w.id || idx} className="border-b border-slate-200">
                    <td className="p-1.5 border border-slate-300 font-bold">{w.cognome} {w.nome}</td>
                    <td className="p-1.5 border border-slate-300 font-mono text-[10px]">{w.codiceFiscale || 'N.D.'}</td>
                    <td className="p-1.5 border border-slate-300">{w.mansione}</td>
                    <td className="p-1.5 border border-slate-300 font-semibold">{w.ruoloCantiere}</td>
                    <td className="p-1.5 border border-slate-300 text-center text-[10px]">
                      {w.dataVisitaMedica ? `Idoneo (${w.dataVisitaMedica})` : 'Idoneo con visita regolare'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ================= CAPITOLO 4 ================= */}
        <div id="pos-cap-4" className="mb-8 print:mb-6 page-break-avoid">
          <div className="flex items-center gap-2 border-b-2 border-slate-900 pb-1 mb-3">
            <span className="px-2 py-0.5 bg-slate-900 text-white text-[10px] font-black">CAP. 4</span>
            <h2 className="text-xs font-black text-slate-900 uppercase">RIFERIMENTI NORMATIVI E DEFINIZIONI</h2>
          </div>

          <div className="space-y-2 text-xs text-slate-700 leading-relaxed">
            <p>
              Il presente Piano Operativo di Sicurezza è redatto in ottemperanza agli artt. 17, 28, 89 comma 1 lett. h), 96 e Allegato XV del Decreto Legislativo 9 aprile 2008 n. 81 (Testo Unico sulla Salute e Sicurezza sul Lavoro), come modificato e integrato dal D.Lgs. 106/2009.
            </p>
            <p>
              Ai sensi dell'art. 89 comma 1 lett. h), il POS rappresenta il piano generale di sicurezza dell'impresa esecutrice relativo al cantiere in cui essa opera, contenente la valutazione dei rischi specifici propri delle attività svolte e le correlate misure di prevenzione e protezione.
            </p>
          </div>
        </div>

        {/* ================= CAPITOLO 5 ================= */}
        <div id="pos-cap-5" className="mb-8 print:mb-6 page-break-avoid">
          <div className="flex items-center gap-2 border-b-2 border-slate-900 pb-1 mb-3">
            <span className="px-2 py-0.5 bg-slate-900 text-white text-[10px] font-black">CAP. 5</span>
            <h2 className="text-xs font-black text-slate-900 uppercase">ORGANIZZAZIONE E LOGISTICA DEL CANTIERE</h2>
          </div>

          {(() => {
            const org = pos.organizzazioneCantiere || pos.organizzazione || DEFAULT_ORGANIZZAZIONE_CANTIERE;
            return (
              <table className="w-full border-collapse border border-slate-300 text-xs">
                <tbody>
                  <tr className="border-b border-slate-300">
                    <td className="w-1/3 bg-slate-100 p-1.5 font-bold">5.1 Servizi Igienico-Assistenziali:</td>
                    <td className="p-1.5">{org.serviziIgienici || (org as any).serviziIgieniciAssistenziali || 'Presenza di monoblocco coibentato a uso spogliatoio e servizi igienici.'}</td>
                  </tr>
                  <tr className="border-b border-slate-300">
                    <td className="bg-slate-100 p-1.5 font-bold">5.2 Viabilità Interna Pedonale/Veicolare:</td>
                    <td className="p-1.5">{org.viabilita || (org as any).viabilitaSicurezza || 'Percorsi pedonali protetti e distinti dai transiti automezzi.'}</td>
                  </tr>
                  <tr className="border-b border-slate-300">
                    <td className="bg-slate-100 p-1.5 font-bold">5.3 Recinzione, Accessi e Segnaletica:</td>
                    <td className="p-1.5">{org.recinzioneAccessi || 'Recinzione perimetrale continua di altezza non inferiore a 2,00 m.'}</td>
                  </tr>
                  <tr className="border-b border-slate-300">
                    <td className="bg-slate-100 p-1.5 font-bold">5.4 Impianto Elettrico e Messa a Terra:</td>
                    <td className="p-1.5">{org.impiantoElettrico || (org as any).impiantoElettricoCantiere || 'Quadro elettrico generale da cantiere conforme CEI 64-8/7.'}</td>
                  </tr>
                  <tr>
                    <td className="bg-slate-100 p-1.5 font-bold">5.5 Stoccaggio Materiali e Rifiuti:</td>
                    <td className="p-1.5">{org.stoccaggioRifiuti || (org as any).gestioneRifiutiTerre || (org as any).stoccaggioMateriali || 'Aree di deposito ordinate e cassoni scarrabili per codice CER.'}</td>
                  </tr>
                </tbody>
              </table>
            );
          })()}
        </div>

        {/* ================= CAPITOLO 6 ================= */}
        <div id="pos-cap-6" className="mb-8 print:mb-6 page-break-avoid">
          <div className="flex items-center gap-2 border-b-2 border-slate-900 pb-1 mb-3">
            <span className="px-2 py-0.5 bg-slate-900 text-white text-[10px] font-black">CAP. 6</span>
            <h2 className="text-xs font-black text-slate-900 uppercase">CRITERI E METODOLOGIA DI VALUTAZIONE DEI RISCHI (4×4)</h2>
          </div>

          <div className="space-y-3 text-xs">
            <p className="leading-relaxed">
              La quantificazione dell'entità del rischio <strong>R</strong> è definita mediante l'algoritmo matematico <strong>R = P × D</strong> (prodotto tra la Probabilità di accadimento <strong>P</strong> su scala 1-4 e la Gravità del Danno <strong>D</strong> su scala 1-4).
            </p>

            {/* Tabella Matrice 4x4 */}
            <table className="w-full border-collapse border border-slate-400 text-xs text-center my-2">
              <thead>
                <tr className="bg-slate-200 text-slate-900 font-bold">
                  <th className="p-1 border border-slate-400 text-left">Probabilità \ Danno</th>
                  <th className="p-1 border border-slate-400">D1: Lieve</th>
                  <th className="p-1 border border-slate-400">D2: Medio</th>
                  <th className="p-1 border border-slate-400">D3: Grave</th>
                  <th className="p-1 border border-slate-400">D4: Gravissimo</th>
                </tr>
              </thead>
              <tbody>
                {MATRICE_RISCHIO_4X4.map(row => (
                  <tr key={row.probabilita}>
                    <td className="p-1 border border-slate-400 font-bold bg-slate-100 text-left">
                      P{row.probabilita} - {row.nomeProbabilita}
                    </td>
                    {row.celle.map(cell => (
                      <td key={cell.danno} className="p-1 border border-slate-400 font-bold">
                        <div>R = {cell.livelloRischio}</div>
                        <div className="text-[9px] uppercase font-normal opacity-80">{cell.classeRischio}</div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Classi di Priorità d'Intervento */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px]">
              {CLASSI_RISCHIO_DEF.map(c => (
                <div key={c.classe} className="p-1.5 border border-slate-300 rounded bg-slate-50">
                  <strong className="block uppercase">{c.classe} (R: {c.intervallo})</strong>
                  <span>{c.criterioAzione}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ================= CAPITOLO 7 ================= */}
        <div id="pos-cap-7" className="mb-8 print:mb-6 page-break-avoid">
          <div className="flex items-center gap-2 border-b-2 border-slate-900 pb-1 mb-3">
            <span className="px-2 py-0.5 bg-slate-900 text-white text-[10px] font-black">CAP. 7</span>
            <h2 className="text-xs font-black text-slate-900 uppercase">CONTESTO AMBIENTALE E CONDIZIONI AL CONTORNO</h2>
          </div>

          <table className="w-full border-collapse border border-slate-300 text-xs">
            <tbody>
              <tr className="border-b border-slate-300">
                <td className="w-1/3 bg-slate-100 p-1.5 font-bold">7.1 Accessibilità e Viabilità Esterna:</td>
                <td className="p-1.5">{pos.contestoAmbientale?.accessibilitaViabilitaEsterna || 'Accesso ordinario da pubblica via con regolamentazione di manovra automezzi.'}</td>
              </tr>
              <tr className="border-b border-slate-300">
                <td className="bg-slate-100 p-1.5 font-bold">7.2 Interferenze Sottoservizi e Linee Aeree:</td>
                <td className="p-1.5">{pos.contestoAmbientale?.interferenzeSottoserviziLineeAeree || 'Verifica visiva preventiva dell\'assenza di linee elettriche aeree scoperte a distanza < 5 metri.'}</td>
              </tr>
              <tr className="border-b border-slate-300">
                <td className="bg-slate-100 p-1.5 font-bold">7.3 Edifici Adiacenti, Rumore e Polveri:</td>
                <td className="p-1.5">{pos.contestoAmbientale?.edificiAdiacentiRumorePolveri || 'Bagnatura periodica delle superfici polverose e rispetto delle fasce orarie di riposo per le emissioni acustiche.'}</td>
              </tr>
              <tr>
                <td className="bg-slate-100 p-1.5 font-bold">7.4 Esposizione ad Agenti Atmosferici e Meteo:</td>
                <td className="p-1.5">{pos.contestoAmbientale?.condizioniMeteoEventiAtmosferici || 'Sospensione immediata dei lavori in quota su ponteggi/tetti in caso di raffiche di vento superiori a 40 km/h o temporali.'}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* ================= CAPITOLO 8 ================= */}
        <div id="pos-cap-8" className="mb-8 print:mb-6 page-break-avoid">
          <div className="flex items-center gap-2 border-b-2 border-slate-900 pb-1 mb-3">
            <span className="px-2 py-0.5 bg-slate-900 text-white text-[10px] font-black">CAP. 8</span>
            <h2 className="text-xs font-black text-slate-900 uppercase">PROGRAMMAZIONE, TURNI DI LAVORO E GESTIONE DELLE PRESENZE</h2>
          </div>

          <table className="w-full border-collapse border border-slate-300 text-xs">
            <tbody>
              <tr className="border-b border-slate-300">
                <td className="w-1/3 bg-slate-100 p-1.5 font-bold">8.1 Orari di Lavoro Ordinari:</td>
                <td className="p-1.5">{pos.datiCantiere.orariLavoro || '08:00 - 12:00 / 13:00 - 17:00 (Lunedì - Venerdì)'}</td>
              </tr>
              <tr className="border-b border-slate-300">
                <td className="bg-slate-100 p-1.5 font-bold">Numero Massimo Lavoratori Contemporanei:</td>
                <td className="p-1.5 font-bold">{pos.datiCantiere.numeroMassimoLavoratori || pos.lavoratori.length || 5} addetti</td>
              </tr>
              <tr className="border-b border-slate-300">
                <td className="bg-slate-100 p-1.5 font-bold">8.2 Disciplina Lavori Straordinari e Notturni:</td>
                <td className="p-1.5">Subordinati a formale autorizzazione del CSE con illuminazione artificiale idonea (≥ 300 lux) e presenza continuativa del Preposto.</td>
              </tr>
              <tr>
                <td className="bg-slate-100 p-1.5 font-bold">8.3 Controllo Accessi e Registro Presenze:</td>
                <td className="p-1.5">Obbligo di esibizione del tesserino di riconoscimento (art. 26 comma 8) e firma giornaliera del Registro Presenze di Cantiere.</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* ================= CAPITOLO 9 ================= */}
        <div id="pos-cap-9" className="mb-8 print:mb-6 page-break-before">
          <div className="flex items-center gap-2 border-b-2 border-slate-900 pb-1 mb-3">
            <span className="px-2 py-0.5 bg-slate-900 text-white text-[10px] font-black">CAP. 9</span>
            <h2 className="text-xs font-black text-slate-900 uppercase">
              SCHEDE DELLE LAVORAZIONI E SMART LINKING (LAVORAZIONE - ATTREZZATURE - SOSTANZE - OPERE PROVVISIONALI - RISCHI P x D - MISURE - DPI)
            </h2>
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
                  <strong className="text-slate-900 uppercase text-[10px] block mb-0.5">Modalità Operative ed Esecutive:</strong>
                  <span>{att.descrizione}</span>
                </div>

                {/* Catena Smart Linking: Attrezzature, Sostanze e Opere */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[10px] mb-3 bg-slate-50 p-2.5 border border-slate-300 rounded">
                  <div>
                    <strong className="block text-slate-900 uppercase mb-0.5 font-black">🚜 Attrezzature Utilizzate:</strong>
                    <span className="text-slate-700">{att.attrezzatureUtilizzate?.join(', ') || 'Nessuna specifica'}</span>
                  </div>
                  <div>
                    <strong className="block text-slate-900 uppercase mb-0.5 font-black">🧪 Sostanze Chimiche:</strong>
                    <span className="text-slate-700">{att.sostanzeUtilizzate?.join(', ') || 'Nessuna specifica'}</span>
                  </div>
                  <div>
                    <strong className="block text-slate-900 uppercase mb-0.5 font-black">🪜 Opere Provvisionali:</strong>
                    <span className="text-slate-700">{att.opereProvvisionaliUtilizzate?.join(', ') || 'Nessuna specifica'}</span>
                  </div>
                </div>

                {/* Tabella Rischi P x D */}
                <div className="mb-3">
                  <strong className="block text-[11px] font-black uppercase text-slate-900 mb-1">
                    Valutazione Analitica dei Rischi di Fase (Matrice R = P x D):
                  </strong>
                  <table className="w-full border-collapse border border-slate-300 text-[10px]">
                    <thead>
                      <tr className="bg-slate-100 font-bold border-b border-slate-300 text-slate-800">
                        <th className="p-1.5 border border-slate-300 text-left">Pericolo / Rischio Identificato</th>
                        <th className="p-1.5 border border-slate-300 text-center w-8" title="Probabilità (1-4)">P</th>
                        <th className="p-1.5 border border-slate-300 text-center w-8" title="Danno (1-4)">D</th>
                        <th className="p-1.5 border border-slate-300 text-center w-14" title="Livello Rischio (P x D)">R = PxD</th>
                        <th className="p-1.5 border border-slate-300 text-center w-20">Classe</th>
                        <th className="p-1.5 border border-slate-300 text-left">Misure Preventive e Protettive Adottate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {att.rischi.map((r, rIdx) => {
                        const p = r.probabilita || 2;
                        const d = r.danno || 2;
                        const rLev = r.livelloRischio || p * d;
                        const cl = r.classeRischio || (rLev <= 4 ? 'Accettabile' : rLev <= 8 ? 'Notevole' : 'Elevato');
                        const clColor =
                          cl === 'Accettabile'
                            ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                            : cl === 'Notevole'
                            ? 'bg-amber-100 text-amber-900 border-amber-300'
                            : 'bg-rose-100 text-rose-900 border-rose-300';
                        return (
                          <tr key={r.id || rIdx} className="border-b border-slate-200">
                            <td className="p-1.5 border border-slate-300 font-semibold">{r.descrizione}</td>
                            <td className="p-1.5 border border-slate-300 text-center font-bold">{p}</td>
                            <td className="p-1.5 border border-slate-300 text-center font-bold">{d}</td>
                            <td className="p-1.5 border border-slate-300 text-center font-black">{rLev}</td>
                            <td className="p-1.5 border border-slate-300 text-center">
                              <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase border ${clColor}`}>
                                {cl}
                              </span>
                            </td>
                            <td className="p-1.5 border border-slate-300 text-slate-700">{r.misurePreventive || 'Misure tecniche e vigilanza continua.'}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Misure di Coordinamento */}
                <div className="mb-3 text-xs">
                  <strong className="block text-[10px] font-black uppercase text-slate-900 mb-1">
                    Misure di Prevenzione, Protezione e Istruzioni di Coordinamento:
                  </strong>
                  <ul className="list-disc list-inside text-[11px] text-slate-700 space-y-0.5">
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

        {/* ================= CAPITOLO 10 ================= */}
        <div id="pos-cap-10" className="mb-8 print:mb-6 page-break-before">
          <div className="flex items-center gap-2 border-b-2 border-slate-900 pb-1 mb-3">
            <span className="px-2 py-0.5 bg-slate-900 text-white text-[10px] font-black">CAP. 10</span>
            <h2 className="text-xs font-black text-slate-900 uppercase">
              SCHEDE TECNICHE DI SICUREZZA DELLE ATTREZZATURE, MACCHINE E MEZZI (ALL. V E VI D.LGS. 81/08)
            </h2>
          </div>

          {/* Indice riassuntivo delle attrezzature */}
          <div className="mb-4">
            <strong className="block text-[10px] font-black uppercase text-slate-700 mb-1.5">
              Registro Riepilogativo Macchine e Attrezzature Presenti in Cantiere:
            </strong>
            <table className="w-full border-collapse border border-slate-300 text-xs">
              <thead>
                <tr className="bg-slate-100 font-bold border-b border-slate-300 text-slate-900 text-[10px]">
                  <th className="p-1.5 border border-slate-300 text-left">Attrezzatura / Mezzo</th>
                  <th className="p-1.5 border border-slate-300 text-left">Costruttore / Modello</th>
                  <th className="p-1.5 border border-slate-300 text-center w-24">Marcatura CE</th>
                  <th className="p-1.5 border border-slate-300 text-left">Requisito Operatore</th>
                </tr>
              </thead>
              <tbody>
                {pos.attrezzature.map((att, idx) => (
                  <tr key={att.id || idx} className="border-b border-slate-200 text-[10px]">
                    <td className="p-1.5 border border-slate-300 font-bold">{att.nome}</td>
                    <td className="p-1.5 border border-slate-300">{att.modelloMatricola || 'Conforme a libretto'}</td>
                    <td className="p-1.5 border border-slate-300 text-center font-bold">
                      <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-900 border border-emerald-300 rounded text-[9px]">
                        {att.marcaturaCeConforme ? 'CE Conforme' : 'All. V D.Lgs. 81/08'}
                      </span>
                    </td>
                    <td className="p-1.5 border border-slate-300">{att.operatoreAbilitato || 'Lavoratore addestrato'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Schede Dettagliate di Sicurezza per ciascuna Attrezzatura / Mezzo */}
          <div className="space-y-4">
            {pos.attrezzature.map((att, idx) => (
              <div
                key={att.id || idx}
                className="border-2 border-slate-800 rounded-lg p-3.5 bg-white page-break-avoid shadow-xs"
              >
                {/* Header Scheda Mezzo con Logo/Immagine */}
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
                      {att.marcaturaCeConforme ? 'CE - ALL. V-VI' : 'D.LGS. 81/08'}
                    </span>
                  </div>
                </div>

                {/* Parametri Tecnici e Requisiti Operatore */}
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
                    <strong className="block text-slate-900 uppercase mb-0.5 font-bold">Verifiche Periodiche:</strong>
                    <span className="text-emerald-700 font-bold">
                      {att.verifichePeriodiche ? 'Registrate a norma art. 71' : 'Controllo visivo giornaliero'}
                    </span>
                  </div>
                </div>

                {/* Istruzioni e Prescrizioni di Sicurezza */}
                <div className="text-[11px] text-slate-700 mb-2.5 leading-relaxed bg-slate-50/50 p-2 rounded border border-slate-200">
                  <strong className="text-slate-900 uppercase text-[10px] block mb-0.5 font-black">
                    Istruzioni di Sicurezza e Controlli Preliminari all'Avvio:
                  </strong>
                  <span>{att.prescrizioniSicurezza || 'Verifica visiva dell’integrità delle protezioni prima dell’avviamento; divieto di manomissione dei ripari; arresto motore durante manutenzione o pulizia.'}</span>
                </div>

                {/* DPI Obbligatori per l'Operatore del Mezzo / Macchina */}
                <div className="border-t border-slate-300 pt-2 flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-black uppercase text-slate-900">
                    DPI Obbligatori per l'Uso:
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

        {/* ================= CAPITOLO 11 ================= */}
        <div id="pos-cap-11" className="mb-8 print:mb-6 page-break-before">
          <div className="flex items-center gap-2 border-b-2 border-slate-900 pb-1 mb-3">
            <span className="px-2 py-0.5 bg-slate-900 text-white text-[10px] font-black">CAP. 11</span>
            <h2 className="text-xs font-black text-slate-900 uppercase">
              SCHEDE DI SICUREZZA OPERE PROVVISIONALI E LAVORI IN QUOTA (TITOLO IV CAPO II D.LGS. 81/08)
            </h2>
          </div>

          <div className="space-y-4">
            {(pos.opereProvvisionali && pos.opereProvvisionali.length > 0 ? pos.opereProvvisionali : []).map((op, idx) => (
              <div
                key={op.id || idx}
                className="border-2 border-slate-800 rounded-lg p-3.5 bg-white page-break-avoid shadow-xs"
              >
                {/* Header Scheda Opera Provvisionale con Logo/Immagine */}
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

                {/* Descrizione e Destinazione d'Uso */}
                <div className="text-[11px] text-slate-700 mb-2.5 leading-relaxed bg-slate-50 p-2 rounded border border-slate-200">
                  <strong className="text-slate-900 uppercase text-[10px] block mb-0.5 font-black">
                    Descrizione Operativa e Modalità d'Uso:
                  </strong>
                  <span>{op.descrizione}</span>
                </div>

                {/* Prescrizioni di Sicurezza, Verifiche e Ancoraggi */}
                <div className="text-[11px] text-slate-700 mb-2.5 leading-relaxed bg-cyan-50/30 p-2 rounded border border-cyan-200">
                  <strong className="text-slate-900 uppercase text-[10px] block mb-0.5 font-black">
                    Prescrizioni di Sicurezza, Ancoraggi e Controlli Periodici:
                  </strong>
                  <span>{op.prescrizioniSicurezza || 'Verifica visiva giornaliera prima dell’accesso; ancoraggi strutturali secondo schema Pi.M.U.S.; divieto di sovraccarico degli impalcati oltre la portata indicata; presenza di fermapiedi e parapetti completi.'}</span>
                </div>

                {/* DPI Obbligatori e Anticaduta */}
                <div className="border-t border-slate-300 pt-2 flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-black uppercase text-slate-900">
                    DPI Obbligatori & Anticaduta:
                  </span>
                  {(op.dpiNecessari && op.dpiNecessari.length > 0
                    ? op.dpiNecessari
                    : ['Casco di protezione / Elmetto', 'Calzature di sicurezza S3', 'Imbracatura completa anticaduta']
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

        {/* ================= CAPITOLO 12 ================= */}
        <div id="pos-cap-12" className="mb-8 print:mb-6 page-break-before">
          <div className="flex items-center gap-2 border-b-2 border-slate-900 pb-1 mb-3">
            <span className="px-2 py-0.5 bg-slate-900 text-white text-[10px] font-black">CAP. 12</span>
            <h2 className="text-xs font-black text-slate-900 uppercase">
              SCHEDE DI SICUREZZA SOSTANZE CHIMICHE E PREPARATI PERICOLOSI (SCHEDE SDS - ALL. XV)
            </h2>
          </div>

          {/* Indice riassuntivo delle sostanze */}
          <div className="mb-4">
            <strong className="block text-[10px] font-black uppercase text-slate-700 mb-1.5">
              Registro Sostanze e Preparati Chimici Utilizzati in Cantiere:
            </strong>
            <table className="w-full border-collapse border border-slate-300 text-xs">
              <thead>
                <tr className="bg-slate-100 font-bold border-b border-slate-300 text-slate-900 text-[10px]">
                  <th className="p-1.5 border border-slate-300 text-left">Prodotto / Sostanza</th>
                  <th className="p-1.5 border border-slate-300 text-left">Fase d'Impiego</th>
                  <th className="p-1.5 border border-slate-300 text-center w-24">Scheda SDS</th>
                  <th className="p-1.5 border border-slate-300 text-left">Indicazioni di Rischio</th>
                </tr>
              </thead>
              <tbody>
                {pos.sostanze.map((sost, idx) => (
                  <tr key={sost.id || idx} className="border-b border-slate-200 text-[10px]">
                    <td className="p-1.5 border border-slate-300 font-bold">{sost.nomeCommerciale}</td>
                    <td className="p-1.5 border border-slate-300">{sost.utilizzoFase}</td>
                    <td className="p-1.5 border border-slate-300 text-center font-bold">
                      <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-900 border border-emerald-300 rounded text-[9px]">
                        {sost.schedaSicurezzaPresente ? 'Allegata in atti' : 'Presente'}
                      </span>
                    </td>
                    <td className="p-1.5 border border-slate-300 text-[9px]">{sost.frasiRischio || sost.frasiH || 'Consultare SDS'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Schede Dettagliate di Sicurezza Chimica (SDS) con Logo, Pittogrammi GHS e DPI */}
          <div className="space-y-4">
            {pos.sostanze.map((sost, idx) => (
              <div
                key={sost.id || idx}
                className="border-2 border-slate-800 rounded-lg p-3.5 bg-white page-break-avoid shadow-xs"
              >
                {/* Header Scheda Sostanza con Logo/Immagine */}
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

                {/* Fase d'Impiego & Pittogrammi di Pericolo GHS */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-[10px] mb-2.5 bg-slate-50 p-2.5 rounded border border-slate-300 items-center">
                  <div className="sm:col-span-2">
                    <strong className="block text-slate-900 uppercase mb-0.5 font-black">Fase Lavorativa d'Impiego:</strong>
                    <span className="text-slate-800">{sost.utilizzoFase}</span>
                  </div>

                  {/* Pittogrammi CLP / GHS Ufficiali (Rombi Rossi) */}
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

                {/* Indicazioni di Pericolo (Frasi H) e Prescrizioni */}
                <div className="text-[11px] text-slate-700 mb-2.5 leading-relaxed bg-amber-50/40 p-2 rounded border border-amber-200">
                  <strong className="text-slate-900 uppercase text-[10px] block mb-0.5 font-black">
                    Indicazioni di Pericolo (Frasi H) e Prescrizioni di Manipolazione:
                  </strong>
                  <span>{sost.frasiH || sost.frasiRischio || sost.prescrizioniSicurezza || 'Manipolare in ambiente ventilato; evitare il contatto con pelle e occhi; non inalare vapori o polveri; lavare accuratamente le mani a fine turno.'}</span>
                </div>

                {/* DPI Specifici di Protezione Chimica con Simboli ISO 7010 */}
                <div className="border-t border-slate-300 pt-2 flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-black uppercase text-slate-900">
                    DPI Specifici di Protezione Chimica:
                  </span>
                  {(sost.dpiSpecifici && sost.dpiSpecifici.length > 0
                    ? sost.dpiSpecifici
                    : ['Guanti rischio chimico', 'Occhiali di protezione', 'Respiratore FFP2 antipolvere', 'Calzature di sicurezza S3']
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

        {/* ================= CAPITOLO 13 ================= */}
        <div id="pos-cap-13" className="mb-8 print:mb-6 page-break-avoid">
          <div className="flex items-center gap-2 border-b-2 border-slate-900 pb-1 mb-3">
            <span className="px-2 py-0.5 bg-slate-900 text-white text-[10px] font-black">CAP. 13</span>
            <h2 className="text-xs font-black text-slate-900 uppercase">
              GESTIONE DELLE EMERGENZE, PRIMO SOCCORSO E ANTINCENDIO
            </h2>
          </div>

          <table className="w-full border-collapse border border-slate-300 text-xs mb-3">
            <tbody>
              <tr className="border-b border-slate-300">
                <td className="w-1/3 bg-slate-100 p-1.5 font-bold">Numero Unico Emergenza (NUE):</td>
                <td className="p-1.5 font-black text-rose-700">{pos.emergenza.numeroUnicoEmergenza || '112'}</td>
              </tr>
              <tr className="border-b border-slate-300">
                <td className="bg-slate-100 p-1.5 font-bold">Pronto Soccorso di Riferimento:</td>
                <td className="p-1.5 font-bold">{formatMissingData(pos.emergenza.ospedaleRiferimento)} ({formatMissingData(pos.emergenza.prontoSoccorsoIndirizzo)})</td>
              </tr>
              <tr className="border-b border-slate-300">
                <td className="bg-slate-100 p-1.5 font-bold">Telefono Presidio Ospedaliero:</td>
                <td className="p-1.5">{formatMissingData(pos.emergenza.telefonoProntoSoccorso)}</td>
              </tr>
              <tr className="border-b border-slate-300">
                <td className="bg-slate-100 p-1.5 font-bold">Punto di Raccolta in Cantiere:</td>
                <td className="p-1.5">{pos.emergenza.puntoRaccolta || 'Ingresso carraio principale del cantiere'}</td>
              </tr>
              <tr>
                <td className="bg-slate-100 p-1.5 font-bold">Presidi Sanitari & Antincendio:</td>
                <td className="p-1.5">{pos.emergenza.cassettaPrimoSoccorsoUbicazione || 'Cassetta primo soccorso All. 1 e estintori a polvere 6kg presso baracca'}</td>
              </tr>
            </tbody>
          </table>

          <div className="p-2.5 border border-slate-300 rounded bg-slate-50 text-[11px] leading-relaxed">
            <strong>Procedura di Chiamata di Emergenza:</strong> {pos.emergenza.proceduraChiamataSoccorsi}
          </div>
        </div>

        {/* ================= CAPITOLO 14 ================= */}
        <div id="pos-cap-14" className="mb-8 print:mb-6 page-break-avoid">
          <div className="flex items-center gap-2 border-b-2 border-slate-900 pb-1 mb-3">
            <span className="px-2 py-0.5 bg-slate-900 text-white text-[10px] font-black">CAP. 14</span>
            <h2 className="text-xs font-black text-slate-900 uppercase">
              DISPOSIZIONI FINALI, REVISIONE, ALLEGATI OBBLIGATORI E FIRME
            </h2>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <h3 className="font-bold text-[11px] uppercase text-slate-800 mb-1">14.1 Consultazione RLS e Criteri di Revisione</h3>
              <p className="text-slate-700 leading-relaxed">
                Il presente Piano Operativo di Sicurezza è stato preliminarmente esaminato e condiviso con il Rappresentante dei Lavoratori per la Sicurezza (RLS) ai sensi dell'art. 50 comma 1 lett. b) D.Lgs. 81/08. Il Datore di Lavoro svolge direttamente anche le funzioni di R.S.P.P. ai sensi dell'art. 34 D.Lgs. 81/08. Eventuali modifiche strutturali alle lavorazioni comporteranno l'immediata revisione formale del documento.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-[11px] uppercase text-slate-800 mb-1">14.2 Elenco Documentazione Obbligatoria Allegata (All. XVII)</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px]">
                {pos.allegati.map((all, idx) => (
                  <div key={all.id || idx} className="flex items-center justify-between p-1.5 border border-slate-300 rounded bg-slate-50">
                    <span className="truncate">{all.titolo}</span>
                    <span className="font-bold text-emerald-700">{all.allegatoPresente ? 'Allegato (Presente)' : 'Da allegare'}</span>
                  </div>
                ))}
              </div>
            </div>

            {pos.notePrescrizioni && (
              <div>
                <h3 className="font-bold text-[11px] uppercase text-slate-800 mb-1">14.3 Note Conclusive e Prescrizioni del CSE</h3>
                <p className="p-2 border border-slate-300 rounded bg-slate-50 text-slate-700 italic">
                  {pos.notePrescrizioni}
                </p>
              </div>
            )}

            {/* Riquadro Firme Ufficiali (Solo Datore di Lavoro e RSPP - stessa persona - e RLS) */}
            <div className="pt-4 border-t-2 border-slate-900 mt-6 page-break-avoid">
              <h3 className="font-black text-xs uppercase text-slate-900 mb-4 text-center">
                SOTTOSCRIZIONI UFFICIALI E CONVALIDA DEL PIANO OPERATIVO
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-center text-xs max-w-2xl mx-auto">
                <div className="border-2 border-slate-300 p-4 rounded bg-slate-50 shadow-sm">
                  <span className="block text-[11px] font-black text-slate-900 uppercase">
                    Datore di Lavoro e RSPP
                  </span>
                  <span className="block text-[9px] text-slate-500 mb-2">
                    (Funzioni svolte direttamente ex Art. 34 D.Lgs. 81/08)
                  </span>
                  <strong className="block text-slate-900 text-sm my-2">
                    {formatMissingData(pos.datiImpresa.datoreDiLavoro || pos.datiImpresa.rspp, 'Datore di Lavoro e RSPP')}
                  </strong>
                  <div className="border-b-2 border-slate-400 mt-10 mb-1" />
                  <span className="text-[9px] text-slate-500 block">
                    (Timbro dell'Impresa e Firma per Asseverazione)
                  </span>
                </div>

                <div className="border-2 border-slate-300 p-4 rounded bg-slate-50 shadow-sm">
                  <span className="block text-[11px] font-black text-slate-900 uppercase">
                    RLS
                  </span>
                  <span className="block text-[9px] text-slate-500 mb-2">
                    (Rappresentante dei Lavoratori per la Sicurezza ex Art. 50 D.Lgs. 81/08)
                  </span>
                  <strong className="block text-slate-900 text-sm my-2">
                    {formatMissingData(pos.datiImpresa.rls, 'RLST Territoriale')}
                  </strong>
                  <div className="border-b-2 border-slate-400 mt-10 mb-1" />
                  <span className="text-[9px] text-slate-500 block">
                    (Firma per Avvenuta Consultazione)
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
