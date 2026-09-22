import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { PosDocument } from '../../types';
import {
  formatMissingData,
  MATRICE_RISCHIO_4X4,
  CLASSI_RISCHIO_DEF,
  DEFAULT_ORGANIZZAZIONE_CANTIERE,
} from '../../data/posDefaultData';

const GHS_LABELS: Record<string, string> = {
  GHS01: 'Esplosivo',
  GHS02: 'Infiammabile',
  GHS03: 'Comburente',
  GHS04: 'Gas compresso',
  GHS05: 'Corrosivo',
  GHS06: 'Tossicità acuta',
  GHS07: 'Nocivo / Irritante',
  GHS08: 'Pericolo salute',
  GHS09: 'Pericoloso ambiente',
};

const getDpiNormLabel = (name: string): string => {
  const lower = name.toLowerCase();
  if (lower.includes('casco') || lower.includes('elmetto')) return 'UNI EN 397';
  if (lower.includes('scarpe') || lower.includes('calzatur')) return 'UNI EN ISO 20345 (S3)';
  if (lower.includes('guant')) return 'UNI EN 388 / EN 374';
  if (lower.includes('imbracatur') || lower.includes('anticaduta') || lower.includes('quota')) return 'UNI EN 361';
  if (lower.includes('occhial') || lower.includes('visiera')) return 'UNI EN 166';
  if (lower.includes('cuffi') || lower.includes('tappi') || lower.includes('rumor')) return 'UNI EN 352';
  if (lower.includes('mascher') || lower.includes('respirat') || lower.includes('ffp')) return 'UNI EN 149';
  if (lower.includes('alta visibilit') || lower.includes('gilet')) return 'UNI EN ISO 20471';
  return 'D.Lgs. 81/08 All. VIII';
};

const embedImageSafely = (
  doc: jsPDF,
  imageUrl: string | undefined,
  x: number,
  y: number,
  w: number,
  h: number
): boolean => {
  if (!imageUrl || typeof imageUrl !== 'string') return false;
  if (
    imageUrl.startsWith('data:image/png') ||
    imageUrl.startsWith('data:image/jpeg') ||
    imageUrl.startsWith('data:image/jpg') ||
    imageUrl.startsWith('data:image/webp')
  ) {
    try {
      const format = imageUrl.includes('png') ? 'PNG' : 'JPEG';
      doc.addImage(imageUrl, format, x, y, w, h);
      return true;
    } catch {
      return false;
    }
  }
  return false;
};

export const generatePosPdf = (pos: PosDocument): void => {
  const safeVersione = pos.versione || (pos as any).revisione || '00';
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 14;
  const contentWidth = pageWidth - margin * 2; // 182mm

  // Palette colori istituzionale tecnica (non brochure)
  const primaryColor: [number, number, number] = [15, 23, 42]; // Slate 900
  const accentColor: [number, number, number] = [30, 58, 138]; // Blue 900
  const lightBg: [number, number, number] = [248, 250, 252]; // Slate 50

  // ==========================================
  // PAGINA 1: COPERTINA / FRONTESPIZIO TECNICO
  // ==========================================
  doc.setDrawColor(...primaryColor);
  doc.setLineWidth(0.8);
  doc.rect(margin, margin, contentWidth, pageHeight - margin * 2);

  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.3);
  doc.rect(margin + 2, margin + 2, contentWidth - 4, pageHeight - margin * 2 - 4);

  let y = margin + 14;

  // Intestazione Istituzionale
  doc.setFillColor(...primaryColor);
  doc.rect(margin + 10, y, contentWidth - 20, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('REPUBBLICA ITALIANA - D.LGS. 9 APRILE 2008 N. 81 E S.M.I.', pageWidth / 2, y + 5.5, { align: 'center' });

  y += 16;

  // Titolo Principale
  doc.setTextColor(...primaryColor);
  doc.setFontSize(17);
  doc.setFont('helvetica', 'bold');
  doc.text('PIANO OPERATIVO DI SICUREZZA (P.O.S.)', pageWidth / 2, y, { align: 'center' });

  if (pos.titolo && pos.titolo.trim() && pos.titolo.toLowerCase() !== 'piano operativo di sicurezza') {
    y += 5.5;
    doc.setFontSize(10.5);
    doc.setTextColor(...accentColor);
    doc.setFont('helvetica', 'bold');
    doc.text(pos.titolo.toUpperCase(), pageWidth / 2, y, { align: 'center' });
  }

  y += 6;
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.setFont('helvetica', 'normal');
  doc.text('(TITOLO IV, CAPO I - ART. 89 COMMA 1 LETT. H E ALLEGATO XV D.LGS. 81/08)', pageWidth / 2, y, { align: 'center' });

  y += 8;
  doc.setDrawColor(...accentColor);
  doc.setLineWidth(0.8);
  doc.line(margin + 20, y, pageWidth - margin - 20, y);

  y += 9;

  // Box Impresa Esecutrice
  doc.setFillColor(...lightBg);
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin + 8, y, contentWidth - 16, 46, 2, 2, 'FD');

  doc.setTextColor(...accentColor);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('IMPRESA ESECUTRICE', margin + 12, y + 6);

  doc.setTextColor(...primaryColor);
  doc.setFontSize(11);
  doc.text(formatMissingData(pos.datiImpresa.ragioneSociale, 'IMPRESA EDILE'), margin + 12, y + 13);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  doc.text(`Sede Legale: ${formatMissingData(pos.datiImpresa.sedeLegale, 'Sede non indicata')}`, margin + 12, y + 19);
  doc.text(`Cod. Fiscale / P.IVA: ${formatMissingData(pos.datiImpresa.codiceFiscale)} / ${formatMissingData(pos.datiImpresa.partitaIva)}`, margin + 12, y + 24);
  doc.text(`Recapiti: Tel. ${formatMissingData(pos.datiImpresa.telefono)} | PEC: ${formatMissingData(pos.datiImpresa.pec)}`, margin + 12, y + 29);
  doc.text(`Datore di Lavoro e RSPP: ${formatMissingData(pos.datiImpresa.datoreDiLavoro || pos.datiImpresa.rspp)}`, margin + 12, y + 34);
  doc.text(`Posizioni Assicurative: ${pos.datiImpresa.posizioniAssicurative || 'INPS, INAIL e Cassa Edile regolarmente aperte'}`, margin + 12, y + 39);

  y += 51;

  // Box Cantiere e Committenza
  doc.setFillColor(...lightBg);
  doc.roundedRect(margin + 8, y, contentWidth - 16, 48, 2, 2, 'FD');

  doc.setTextColor(...accentColor);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('CANTIERE & COMMITTENZA', margin + 12, y + 6);

  doc.setTextColor(...primaryColor);
  doc.setFontSize(11);
  doc.text(formatMissingData(pos.datiCantiere.nome, 'CANTIERE EDILE'), margin + 12, y + 13);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  doc.text(`Ubicazione Cantiere: ${formatMissingData(pos.datiCantiere.indirizzo)} (${formatMissingData(pos.datiCantiere.comune)})`, margin + 12, y + 19);
  doc.text(`Committente: ${formatMissingData(pos.datiCantiere.committente)}`, margin + 12, y + 24);
  doc.text(`Direttore dei Lavori: ${formatMissingData(pos.datiCantiere.direttoreLavori, 'Non nominato')}`, margin + 12, y + 29);
  doc.text(`C.S.E. (Coordinatore Sicurezza): ${formatMissingData(pos.datiCantiere.cse, 'Da nominare / N.D.')}`, margin + 12, y + 34);
  doc.text(`Importo Opere Edili: EUR ${Number(pos.datiCantiere.importoLavoriEdili || 0).toLocaleString('it-IT')}`, margin + 12, y + 39);

  y += 53;

  // Box Riferimenti del Documento
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(margin + 8, y, contentWidth - 16, 26, 2, 2, 'FD');

  const colW = (contentWidth - 16) / 4;
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('CODICE POS:', margin + 12, y + 6.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...primaryColor);
  doc.text(pos.codice, margin + 12, y + 13);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('REVISIONE:', margin + 12 + colW, y + 6.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...primaryColor);
  doc.text(`Rev. ${safeVersione}`, margin + 12 + colW, y + 13);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('DATA REDAZIONE:', margin + 12 + colW * 2, y + 6.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...primaryColor);
  doc.text(pos.dataRedazione, margin + 12 + colW * 2, y + 13);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('REDATTORE:', margin + 12 + colW * 3, y + 6.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...primaryColor);
  doc.text(pos.redattore || 'Datore di Lavoro', margin + 12 + colW * 3, y + 13);

  // Sub-badge di aggiornamento
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(5, 150, 105);
  const now = new Date();
  const printTimestamp = `STATO: AGGIORNATO E VIGENTE  •  EMESSO IL: ${now.toLocaleDateString('it-IT')} ORE ${now.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`;
  doc.text(printTimestamp, margin + 12, y + 21);

  y += 32;

  // Box Avvertenza
  doc.setDrawColor(226, 232, 240);
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(margin + 8, y, contentWidth - 16, 18, 2, 2, 'FD');
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  const disclaimer = 'Piano Operativo di Sicurezza redatto ai sensi dell\'art. 89 e Allegato XV del D.Lgs. 81/2008 e s.m.i. Da conservare in cantiere a disposizione degli Organi di Vigilanza (ASL, Ispettorato del Lavoro) e del Coordinatore per la Sicurezza in fase di Esecuzione (CSE).';
  doc.text(doc.splitTextToSize(disclaimer, contentWidth - 24), margin + 12, y + 6);

  // Helper Intestazione di Capitolo
  const addChapterHeader = (capNum: number, capTitle: string) => {
    doc.addPage();
    doc.setFillColor(...primaryColor);
    doc.rect(margin, margin, contentWidth, 7, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text(`CAPITOLO ${capNum} - ${capTitle.toUpperCase()}`, margin + 3, margin + 4.8);

    doc.setFont('helvetica', 'normal');
    doc.text(`${pos.codice} - Rev. ${safeVersione}`, pageWidth - margin - 3, margin + 4.8, { align: 'right' });
  };

  // ==========================================
  // PAGINA 2: INDICE GENERALE DEI 14 CAPITOLI
  // ==========================================
  doc.addPage();
  doc.setFillColor(...primaryColor);
  doc.rect(margin, margin, contentWidth, 7, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('INDICE GENERALE DEL DOCUMENTO (ALL. XV D.LGS. 81/08)', margin + 3, margin + 4.8);

  (doc as any).autoTable({
    startY: margin + 12,
    head: [['Capitolo', 'Titolo Sezione', 'Riferimento Normativo']],
    body: [
      ['CAPITOLO 1', 'DATI IDENTIFICATIVI (Impresa, Cantiere, Figure Sicurezza, Subappalti)', 'All. XV punto 2.1 lett. a-b'],
      ['CAPITOLO 2', 'DESCRIZIONE DELL\'OPERA E DEI LAVORI SVOLTI DALL\'IMPRESA', 'All. XV punto 2.1 lett. c-d'],
      ['CAPITOLO 3', 'PERSONALE, MANSIONI E ORGANIZZAZIONE DELLA SICUREZZA', 'All. XV punto 2.1 lett. e-f'],
      ['CAPITOLO 4', 'RIFERIMENTI NORMATIVI E DEFINIZIONI', 'D.Lgs. 81/08 e s.m.i.'],
      ['CAPITOLO 5', 'ORGANIZZAZIONE E LOGISTICA DEL CANTIERE', 'All. XV punto 2.1 lett. g'],
      ['CAPITOLO 6', 'CRITERI E METODOLOGIA DI VALUTAZIONE DEI RISCHI (4x4)', 'Art. 28 e All. XV'],
      ['CAPITOLO 7', 'CONTESTO AMBIENTALE E CONDIZIONI AL CONTORNO', 'All. XV punto 2.1 lett. h'],
      ['CAPITOLO 8', 'PROGRAMMAZIONE, TURNI DI LAVORO E GESTIONE PRESENZE', 'Art. 26 c. 8 e All. XV'],
      ['CAPITOLO 9', 'SCHEDE DELLE LAVORAZIONI E SMART LINKING', 'All. XV punto 2.1 lett. i'],
      ['CAPITOLO 10', 'SCHEDE ATTREZZATURE, MACCHINE E UTENSILI', 'Titolo III, All. V e VI'],
      ['CAPITOLO 11', 'OPERE PROVVISIONALI E LAVORI IN QUOTA (Ponteggi, Trabattelli)', 'Titolo IV Capo II'],
      ['CAPITOLO 12', 'SOSTANZE CHIMICHE E PREPARATI PERICOLOSI (Schede SDS)', 'Titolo IX Capo I'],
      ['CAPITOLO 13', 'GESTIONE DELLE EMERGENZE, PRIMO SOCCORSO E ANTINCENDIO', 'All. XV punto 2.1 lett. k'],
      ['CAPITOLO 14', 'DISPOSIZIONI FINALI, REVISIONE, ALLEGATI E FIRME', 'All. XVII e Firme'],
    ],
    theme: 'grid',
    headStyles: { fillColor: primaryColor, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7.5 },
    bodyStyles: { fontSize: 7, textColor: [15, 23, 42] },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 28, fillColor: [248, 250, 252] }, 1: { cellWidth: 104 }, 2: { cellWidth: 50, fontStyle: 'italic' } },
    margin: { left: margin, right: margin },
  });

  // ==========================================
  // CAPITOLO 1: DATI IDENTIFICATIVI
  // ==========================================
  addChapterHeader(1, 'Dati Identificativi (All. XV p. 2.1 lett. a-b)');

  (doc as any).autoTable({
    startY: margin + 11,
    head: [['1.1 Parametro Impresa Esecutrice', 'Dati e Riferimenti']],
    body: [
      ['Ragione Sociale', formatMissingData(pos.datiImpresa.ragioneSociale)],
      ['Sede Legale ed Operativa', formatMissingData(pos.datiImpresa.sedeLegale)],
      ['Codice Fiscale / Partita IVA', `${formatMissingData(pos.datiImpresa.codiceFiscale)} / ${formatMissingData(pos.datiImpresa.partitaIva)}`],
      ['Recapiti (Tel / PEC)', `Tel: ${formatMissingData(pos.datiImpresa.telefono)} | PEC: ${formatMissingData(pos.datiImpresa.pec)}`],
      ['Iscrizione CCIAA / Posizioni Assicurative', `${pos.datiImpresa.iscrizioneCciaa || 'Iscritta CCIAA'} - ${pos.datiImpresa.posizioniAssicurative || 'INPS/INAIL Regolari'}`],
    ],
    theme: 'grid',
    headStyles: { fillColor: primaryColor, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7.5 },
    bodyStyles: { fontSize: 7, textColor: [15, 23, 42] },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 60, fillColor: [248, 250, 252] } },
    margin: { left: margin, right: margin },
  });

  let cap1Y = (doc as any).lastAutoTable.finalY + 4;

  (doc as any).autoTable({
    startY: cap1Y,
    head: [['1.2 Cantiere e Committenza', 'Dati e Riferimenti']],
    body: [
      ['Denominazione Cantiere', formatMissingData(pos.datiCantiere.nome)],
      ['Indirizzo ed Ubicazione', `${formatMissingData(pos.datiCantiere.indirizzo)} (${formatMissingData(pos.datiCantiere.comune)})`],
      ['Committente / Riferimenti', `${formatMissingData(pos.datiCantiere.committente)} (C.F./P.IVA: ${formatMissingData(pos.datiCantiere.committenteCfPiva, 'N.D.')})`],
      ['Coordinatore Sicurezza (CSE)', formatMissingData(pos.datiCantiere.cse, 'Non nominato / In attesa')],
      ['Direttore Lavori', formatMissingData(pos.datiCantiere.direttoreLavori, 'Non nominato')],
      ['Importo Opere Edili', `EUR ${Number(pos.datiCantiere.importoLavoriEdili || 0).toLocaleString('it-IT')}`],
    ],
    theme: 'grid',
    headStyles: { fillColor: primaryColor, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7.5 },
    bodyStyles: { fontSize: 7, textColor: [15, 23, 42] },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 60, fillColor: [248, 250, 252] } },
    margin: { left: margin, right: margin },
  });

  cap1Y = (doc as any).lastAutoTable.finalY + 4;

  (doc as any).autoTable({
    startY: cap1Y,
    head: [['1.3 Figure con Compiti di Sicurezza', 'Nominativo Designato', 'Ruolo & Compiti']],
    body: [
      ['Datore di Lavoro e RSPP', formatMissingData(pos.datiImpresa.datoreDiLavoro || pos.datiImpresa.rspp), 'Titolare obblighi e funzione RSPP ex art. 34 D.Lgs. 81/08'],
      ['Medico Competente', formatMissingData(pos.datiImpresa.medicoCompetente, 'Non nominato (assenza rischi specifici)'), 'Sorveglianza sanitaria ex art. 25 e 38'],
      ['R.L.S. / R.L.S.T.', formatMissingData(pos.datiImpresa.rls, 'RLST Territoriale'), 'Rappresentante dei Lavoratori per la Sicurezza'],
      ['Preposto di Cantiere', formatMissingData(pos.datiImpresa.prepostoCantiere), 'Sovrintendenza e vigilanza attività ex art. 19'],
      ['Incaricati Primo Soccorso', formatMissingData(pos.datiImpresa.addettoPrimoSoccorso, 'Personale formato D.M. 388/03'), 'Gestione emergenze e primo soccorso'],
      ['Incaricati Antincendio / Evacuazione', formatMissingData(pos.datiImpresa.addettoAntincendio, 'Personale formato D.M. 02/09/2021'), 'Prevenzione incendi ed evacuazione'],
    ],
    theme: 'grid',
    headStyles: { fillColor: accentColor, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7.5 },
    bodyStyles: { fontSize: 7, textColor: [15, 23, 42] },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 50, fillColor: [248, 250, 252] } },
    margin: { left: margin, right: margin },
  });

  // ==========================================
  // CAPITOLO 2: DESCRIZIONE DELL'OPERA E ATTIVITA' DELL'IMPRESA
  // ==========================================
  addChapterHeader(2, 'Descrizione dell\'Opera e Attività Svolte');

  (doc as any).autoTable({
    startY: margin + 11,
    head: [['Parametro Opera', 'Descrizione']],
    body: [
      ['2.1 Inquadramento Generale dell\'Opera', formatMissingData(pos.datiCantiere.descrizioneLavori, 'Descrizione generale dell\'opera da completare')],
      ['2.2 Attività Specifiche Svolte dall\'Impresa', formatMissingData(pos.datiCantiere.attivitaSvolteImpresa || pos.datiCantiere.descrizioneLavori, 'Dettaglio lavorazioni')],
      ['2.3 Cronoprogramma e Tempistiche', `Inizio Lavori: ${formatMissingData(pos.datiCantiere.dataInizio)} | Fine Lavori: ${formatMissingData(pos.datiCantiere.dataFine)} | Durata Stimata: ${pos.datiCantiere.durataGiorniPresunti || 120} giorni lavorativi presunti`],
      ['2.4 Lavorazioni in Subappalto', formatMissingData(pos.datiCantiere.subappaltatoriDichiarati || pos.datiCantiere.subappalti, 'Nessuna lavorazione subappaltata dichiarata')],
    ],
    theme: 'grid',
    headStyles: { fillColor: primaryColor, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7.5 },
    bodyStyles: { fontSize: 7, textColor: [15, 23, 42] },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 55, fillColor: [248, 250, 252] } },
    margin: { left: margin, right: margin },
  });

  // ==========================================
  // CAPITOLO 3: PERSONALE, MANSIONI E ORGANIZZAZIONE DELLA SICUREZZA
  // ==========================================
  addChapterHeader(3, 'Personale, Mansioni e Organizzazione Sicurezza');

  const workersRows = (pos.lavoratori || []).map(w => [
    `${w.cognome} ${w.nome}`,
    w.codiceFiscale || 'N.D.',
    w.mansione,
    w.ruoloCantiere,
    w.dataVisitaMedica ? `Idoneo (${w.dataVisitaMedica})` : 'Idoneo con visita regolare',
  ]);

  (doc as any).autoTable({
    startY: margin + 11,
    head: [['Nominativo Lavoratore', 'Codice Fiscale', 'Mansione Contrattuale', 'Ruolo di Sicurezza', 'Idoneità Sanitaria']],
    body: workersRows.length > 0 ? workersRows : [['Nessun lavoratore registrato', '-', '-', '-', '-']],
    theme: 'grid',
    headStyles: { fillColor: primaryColor, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7.5 },
    bodyStyles: { fontSize: 6.8, textColor: [15, 23, 42] },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 42 } },
    margin: { left: margin, right: margin },
  });

  // ==========================================
  // CAPITOLO 4: RIFERIMENTI NORMATIVI E DEFINIZIONI
  // ==========================================
  addChapterHeader(4, 'Riferimenti Normativi e Definizioni');

  (doc as any).autoTable({
    startY: margin + 11,
    head: [['Fonte Normativa / Norma Tecnica', 'Oggetto e Campo di Applicazione']],
    body: [
      ['D.Lgs. 9 aprile 2008 n. 81 e s.m.i.', 'Attuazione dell\'articolo 1 della legge 3 agosto 2007, n. 123, in materia di tutela della salute e della sicurezza nei luoghi di lavoro.'],
      ['Titolo IV, Capo I e II D.Lgs. 81/08', 'Misure per la salute e sicurezza nei cantieri temporanei o mobili e disposizioni per le opere provvisionali.'],
      ['Allegato XV D.Lgs. 81/08', 'Contenuti minimi dei piani di sicurezza nei cantieri temporanei o mobili (Piani Operativi di Sicurezza).'],
      ['Art. 89, c. 1 lett. h) D.Lgs. 81/08', 'Definizione del Piano Operativo di Sicurezza quale piano complementare di dettaglio dell\'impresa esecutrice.'],
      ['Art. 26 comma 8 D.Lgs. 81/08', 'Obbligo di esposizione del tesserino di riconoscimento per tutto il personale presente in cantiere.'],
      ['Regolamento CLP (CE) n. 1272/2008', 'Classificazione, etichettatura e imballaggio delle sostanze e delle miscele chimiche.'],
      ['Norme Tecniche UNI EN ISO', 'Specifiche armonizzate per i Dispositivi di Protezione Individuale (DPI) e la cartellonistica di sicurezza.'],
    ],
    theme: 'grid',
    headStyles: { fillColor: primaryColor, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7.5 },
    bodyStyles: { fontSize: 6.8, textColor: [15, 23, 42] },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 60, fillColor: [248, 250, 252] } },
    margin: { left: margin, right: margin },
  });

  // ==========================================
  // CAPITOLO 5: ORGANIZZAZIONE E LOGISTICA DEL CANTIERE
  // ==========================================
  addChapterHeader(5, 'Organizzazione e Logistica del Cantiere');

  const safeOrg = pos.organizzazioneCantiere || pos.organizzazione || DEFAULT_ORGANIZZAZIONE_CANTIERE;

  (doc as any).autoTable({
    startY: margin + 11,
    head: [['Parametro Logistico (All. XV p. 2.1 lett. g)', 'Misure e Presidi Organizzativi Adottati']],
    body: [
      ['5.1 Servizi Igienici ed Assistenziali', safeOrg?.serviziIgienici || (safeOrg as any)?.serviziIgieniciAssistenziali || 'Monoblocco coibentato a uso spogliatoio e servizi igienici.'],
      ['5.2 Viabilità Interna Pedonale e Veicolare', safeOrg?.viabilita || (safeOrg as any)?.viabilitaSicurezza || 'Percorsi pedonali protetti e separati dal transito dei mezzi.'],
      ['5.3 Recinzione, Accessi e Segnaletica', safeOrg?.recinzioneAccessi || 'Recinzione perimetrale continua di altezza non inferiore a 2,00 m con cartellonistica di cantiere.'],
      ['5.4 Impianto Elettrico e Messa a Terra', safeOrg?.impiantoElettrico || (safeOrg as any)?.impiantoElettricoCantiere || 'Quadro elettrico conforme CEI 64-8/7 con differenziale e impianto di terra collaudato.'],
      ['5.5 Stoccaggio Materiali e Gestione Rifiuti', safeOrg?.stoccaggioRifiuti || (safeOrg as any)?.gestioneRifiutiTerre || (safeOrg as any)?.stoccaggioMateriali || 'Aree di deposito ordinate e cassoni distinti per codice CER.'],
    ],
    theme: 'grid',
    headStyles: { fillColor: primaryColor, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7.5 },
    bodyStyles: { fontSize: 6.8, textColor: [15, 23, 42] },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 60, fillColor: [248, 250, 252] } },
    margin: { left: margin, right: margin },
  });

  // ==========================================
  // CAPITOLO 6: METODOLOGIA DI VALUTAZIONE DEI RISCHI (4x4)
  // ==========================================
  addChapterHeader(6, 'Metodologia di Valutazione dei Rischi (4x4)');

  (doc as any).autoTable({
    startY: margin + 11,
    head: [['Elemento Metodologico', 'Dettaglio Algoritmo Matrice 4x4 (R = P x D)']],
    body: [
      ['Formula di Valutazione', 'Rischio R = Probabilità (P 1-4) x Danno (D 1-4). Indici compresi tra 1 e 16.'],
      ['Scala Probabilità di Accadimento (P)', 'P1: Improbabile (evento eccezionale) | P2: Poco probabile | P3: Probabile | P4: Altamente probabile (frequente)'],
      ['Scala Gravità del Danno (D)', 'D1: Lieve (infortunio reversibile <3 gg) | D2: Medio (inabilità >3 gg) | D3: Grave (danno permanente) | D4: Gravissimo (mortale)'],
      ['Classi di Rischio e Priorità', 'Basso/Accettabile (R 1-4): monitoraggio ordinario | Notevole (R 6-9): misure correttive programmate | Elevato (R 12-16): blocco e bonifica immediata'],
    ],
    theme: 'grid',
    headStyles: { fillColor: accentColor, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7.5 },
    bodyStyles: { fontSize: 6.8, textColor: [15, 23, 42] },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 60, fillColor: [248, 250, 252] } },
    margin: { left: margin, right: margin },
  });

  // ==========================================
  // CAPITOLO 7: CONTESTO AMBIENTALE E CONDIZIONI AL CONTORNO
  // ==========================================
  addChapterHeader(7, 'Contesto Ambientale e Condizioni al Contorno');

  (doc as any).autoTable({
    startY: margin + 11,
    head: [['Parametro Ambientale e di Contesto', 'Misure di Prevenzione e Prescrizioni']],
    body: [
      ['7.1 Accessibilità e Viabilità Esterna', pos.contestoAmbientale?.accessibilitaViabilitaEsterna || 'Accesso da pubblica via con regolamentazione e ausilio di moviere per manovre automezzi.'],
      ['7.2 Sottoservizi e Linee Elettriche Aeree', pos.contestoAmbientale?.interferenzeSottoserviziLineeAeree || 'Verifica visiva preventiva dell\'assenza di linee elettriche aeree scoperte a distanza < 5 metri.'],
      ['7.3 Edifici Adiacenti, Rumore e Polveri', pos.contestoAmbientale?.edificiAdiacentiRumorePolveri || 'Bagnatura periodica superfici polverose e rispetto delle fasce orarie antirumore.'],
      ['7.4 Agenti Atmosferici ed Eventi Meteo', pos.contestoAmbientale?.condizioniMeteoEventiAtmosferici || 'Sospensione lavori in quota in caso di vento superiore a 40 km/h, neve o temporali.'],
    ],
    theme: 'grid',
    headStyles: { fillColor: primaryColor, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7.5 },
    bodyStyles: { fontSize: 6.8, textColor: [15, 23, 42] },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 60, fillColor: [248, 250, 252] } },
    margin: { left: margin, right: margin },
  });

  // ==========================================
  // CAPITOLO 8: PROGRAMMAZIONE, TURNI DI LAVORO E GESTIONE PRESENZE
  // ==========================================
  addChapterHeader(8, 'Programmazione, Turni di Lavoro e Gestione Presenze');

  (doc as any).autoTable({
    startY: margin + 11,
    head: [['Parametro Organizzativo Presenze', 'Specifiche Operative e Disciplina']],
    body: [
      ['8.1 Orario Ordinario di Cantiere', pos.datiCantiere?.orariLavoro || '08:00 - 12:00 / 13:00 - 17:00 (Lunedì - Venerdì)'],
      ['8.2 Numero Massimo Lavoratori', `Presenza stimata: max ${pos.datiCantiere?.numeroMassimoLavoratori || pos.lavoratori?.length || 5} lavoratori contemporanei`],
      ['8.3 Disciplina Straordinari e Notturni', 'Subordinati ad autorizzazione del CSE con illuminazione artificiale idonea (≥ 300 lux)'],
      ['8.4 Controllo Accessi e Registro Presenze', 'Obbligo tesserino di riconoscimento ex art. 26 c. 8 e registrazione presenze giornaliere'],
    ],
    theme: 'grid',
    headStyles: { fillColor: accentColor, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7.5 },
    bodyStyles: { fontSize: 6.8, textColor: [15, 23, 42] },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 60, fillColor: [248, 250, 252] } },
    margin: { left: margin, right: margin },
  });

  // ==========================================
  // CAPITOLO 9: SCHEDE LAVORAZIONI E SMART LINKING
  // ==========================================
  addChapterHeader(9, 'Schede delle Lavorazioni (Smart Linking)');

  let currentY = margin + 11;
  let activitiesCount = 0;
  const attivitaList = (pos.attivita && pos.attivita.length > 0) ? pos.attivita : [
    {
      id: 'default-att-fase-1',
      nome: 'Allestimento Cantiere ed Opere Generali',
      faseLavoro: 'Opere Generali ed Allestimento',
      descrizione: 'Delimitazione dell\'area di cantiere, posa della recinzione, allestimento dei servizi igienici e predisposizione della segnaletica di sicurezza.',
      rischi: [
        {
          id: 'r-default-1',
          descrizione: 'Investimento da mezzi in manovra o interferenze viabili',
          probabilita: 2,
          danno: 2,
          livelloRischio: 4,
          classeRischio: 'Accettabile',
          misurePreventive: 'Delimitazione percorsi pedonali protetti, uso indumenti alta visibilità EN ISO 20471.',
        }
      ],
      misurePrevenzione: ['Delimitazione area con recinzione a norma', 'Segnaletica di sicurezza ex All. XXIV'],
      dpiNecessari: ['Casco di protezione / Elmetto', 'Calzature di sicurezza S3', 'Guanti rischio meccanico', 'Gilet alta visibilità'],
      attrezzatureUtilizzate: ['Utensili manuali di cantiere'],
      sostanzeUtilizzate: [],
      opereProvvisionaliUtilizzate: [],
    }
  ];

  attivitaList.forEach((att, idx) => {
    if (activitiesCount >= 2 || currentY > pageHeight - 95) {
      addChapterHeader(9, 'Schede delle Lavorazioni (Smart Linking)');
      currentY = margin + 11;
      activitiesCount = 0;
    }

    const smartLinkingSummary = `Attrezzature: ${att.attrezzatureUtilizzate?.join(', ') || 'Standard'} | Sostanze: ${att.sostanzeUtilizzate?.join(', ') || 'Nessuna'} | Opere: ${att.opereProvvisionaliUtilizzate?.join(', ') || 'Nessuna'}`;
    const rawDpi = (att.dpiNecessari && att.dpiNecessari.length > 0 ? att.dpiNecessari : (att as any).dpiObbligatori) || [];
    const dpiFormatted = rawDpi.length > 0
      ? rawDpi.map(d => `[DPI ISO 7010] ${d} (${getDpiNormLabel(d)})`).join('   •   ')
      : '[DPI ISO 7010] Casco (UNI EN 397)   •   [DPI ISO 7010] Calzature S3 (UNI EN ISO 20345)   •   [DPI ISO 7010] Guanti (UNI EN 388)';

    // Embed logo if present
    embedImageSafely(doc, (att as any).logoUrl || (att as any).immagineUrl, pageWidth - margin - 22, currentY + 1, 20, 14);

    (doc as any).autoTable({
      startY: currentY,
      head: [[`SCHEDA FASE ${idx + 1}: ${att.nome.toUpperCase()}`, `Categoria: ${att.faseLavoro || (att as any).categoria || 'Generale'}`]],
      body: [
        [{ content: `Modalità Operative & Sequenza: ${att.descrizione}`, colSpan: 2 }],
        [{ content: `Collegamenti di Sicurezza (Smart Linking): ${smartLinkingSummary}`, colSpan: 2, styles: { fontStyle: 'bold', textColor: [30, 58, 138] } }],
        [{ content: `Prescrizione DPI Obbligatori: ${dpiFormatted}`, colSpan: 2, styles: { fontStyle: 'bold', textColor: [15, 23, 42], fillColor: [241, 245, 249] } }],
      ],
      theme: 'grid',
      headStyles: { fillColor: primaryColor, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7.5 },
      bodyStyles: { fontSize: 6.8, fillColor: [248, 250, 252], textColor: [15, 23, 42] },
      columnStyles: { 0: { cellWidth: contentWidth - 55 }, 1: { cellWidth: 55, halign: 'right' } },
      margin: { left: margin, right: margin },
    });

    currentY = (doc as any).lastAutoTable.finalY + 1.5;

    const risksRows = (att.rischi || []).map(r => {
      const p = r.probabilita || 2;
      const d = r.danno || 2;
      const rLev = r.livelloRischio || p * d;
      const cl = r.classeRischio || (rLev <= 4 ? 'Accettabile' : rLev <= 8 ? 'Notevole' : 'Elevato');
      return [
        r.descrizione,
        `P:${p} x D:${d} = ${rLev}`,
        cl,
        r.misurePreventive || 'Vigilanza continua e rispetto delle istruzioni di sicurezza',
      ];
    });

    (doc as any).autoTable({
      startY: currentY,
      head: [['Rischio Rilevato', 'Indice R=PxD', 'Classe', 'Misure di Prevenzione & Protezione']],
      body: risksRows.length > 0 ? risksRows : [['Nessun rischio specifico indicato', 'R=4', 'Accettabile', 'Misure ordinarie']],
      theme: 'grid',
      headStyles: { fillColor: [51, 65, 85], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7 },
      bodyStyles: { fontSize: 6.5, textColor: [15, 23, 42] },
      columnStyles: {
        0: { cellWidth: 48, fontStyle: 'bold' },
        1: { cellWidth: 24, fontStyle: 'bold', textColor: [185, 28, 28], halign: 'center' },
        2: { cellWidth: 22, fontStyle: 'bold', halign: 'center' },
        3: { cellWidth: 88 },
      },
      margin: { left: margin, right: margin },
    });

    currentY = (doc as any).lastAutoTable.finalY + 6;
    activitiesCount++;
  });

  // ==========================================
  // CAPITOLO 10: SCHEDE ATTREZZATURE, MEZZI E MACCHINE
  // ==========================================
  addChapterHeader(10, 'Schede Attrezzature, Mezzi e Macchine d\'Opera');

  let cap10Y = margin + 11;
  const attrezzatureList = pos.attrezzature && pos.attrezzature.length > 0 ? pos.attrezzature : [
    {
      id: 'default-att-1',
      nome: 'Attrezzature e Utensili Manuali di Cantiere',
      modelloMatricola: 'Marcatura CE Conforme',
      marcaturaCeConforme: true,
      verifichePeriodicheRegolari: true,
      operatoreAbilitato: 'Tutti i lavoratori formati',
      dpiObbligatori: ['Casco di protezione / Elmetto', 'Calzature di sicurezza S3', 'Guanti protettivi contro rischi meccanici'],
      prescrizioniSicurezza: 'Controllo visivo preventivo, isolamento elettrico, impiego secondo libretto d\'uso.',
    },
  ];

  attrezzatureList.forEach((att, aIdx) => {
    if (cap10Y > pageHeight - 65) {
      addChapterHeader(10, 'Schede Attrezzature, Mezzi e Macchine d\'Opera');
      cap10Y = margin + 11;
    }

    const dpiAttFormatted = att.dpiObbligatori && att.dpiObbligatori.length > 0
      ? att.dpiObbligatori.map(d => `[DPI ISO 7010] ${d} (${getDpiNormLabel(d)})`).join('   •   ')
      : '[DPI ISO 7010] Casco (UNI EN 397)   •   [DPI ISO 7010] Calzature S3 (UNI EN ISO 20345)   •   [DPI ISO 7010] Guanti (UNI EN 388)';

    // Embed logo if present
    embedImageSafely(doc, att.logoUrl || att.immagineUrl, pageWidth - margin - 22, cap10Y + 1, 20, 14);

    (doc as any).autoTable({
      startY: cap10Y,
      head: [[`SCHEDA MACCHINA / MEZZO ${aIdx + 1}: ${att.nome.toUpperCase()}`, `All. V e VI D.Lgs. 81/08`]],
      body: [
        [
          {
            content: `Modello / Matricola: ${att.modelloMatricola || 'Conforme a libretto'}   |   Conformità: ${att.marcaturaCeConforme ? 'Marcatura CE Presente' : 'D.Lgs. 81/08 All. V'}   |   Verifiche: ${att.verifichePeriodicheRegolari ? 'Regolari in atti' : 'Da registro'}`,
            colSpan: 2,
            styles: { fontStyle: 'bold', textColor: [30, 58, 138] },
          },
        ],
        [
          {
            content: `Operatore Abilitato (Art. 73): ${att.operatoreAbilitato || 'Personale addestrato e nominato'}`,
            colSpan: 2,
          },
        ],
        [
          {
            content: `Prescrizioni di Sicurezza & Istruzioni: ${att.prescrizioniSicurezza || 'Controllo quotidiano dei dispositivi di arresto, ripari protettivi e pulizia dell\'organo di lavoro.'}`,
            colSpan: 2,
          },
        ],
        [
          {
            content: `DPI Obbligatori per l'Operatore: ${dpiAttFormatted}`,
            colSpan: 2,
            styles: { fontStyle: 'bold', textColor: [15, 23, 42], fillColor: [241, 245, 249] },
          },
        ],
      ],
      theme: 'grid',
      headStyles: { fillColor: primaryColor, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7.5 },
      bodyStyles: { fontSize: 6.8, fillColor: [248, 250, 252], textColor: [15, 23, 42] },
      columnStyles: { 0: { cellWidth: contentWidth - 55 }, 1: { cellWidth: 55, halign: 'right' } },
      margin: { left: margin, right: margin },
    });

    cap10Y = (doc as any).lastAutoTable.finalY + 4.5;
  });

  // ==========================================
  // CAPITOLO 11: OPERE PROVVISIONALI E LAVORI IN QUOTA
  // ==========================================
  addChapterHeader(11, 'Opere Provvisionali e Lavori in Quota');

  let cap11Y = margin + 11;
  const opereList = pos.opereProvvisionali && pos.opereProvvisionali.length > 0 ? pos.opereProvvisionali : [
    {
      id: 'default-op-1',
      tipo: 'Parapetti provvisori e scale portatili conformi UNI EN 131',
      descrizione: 'Opere provvisionali a protezione dei piani di lavoro e passaggi in quota.',
      pimusRichiesto: false,
      dpiNecessari: ['Casco di protezione / Elmetto', 'Calzature di sicurezza S3', 'Imbracatura anticaduta e cordino di posizionamento'],
      prescrizioniSicurezza: 'Verifica degli ancoraggi, fissaggi rigidi, altezza parapetto >= 1.00m con tavola fermapiede.',
    },
  ];

  opereList.forEach((op, oIdx) => {
    if (cap11Y > pageHeight - 65) {
      addChapterHeader(11, 'Opere Provvisionali e Lavori in Quota');
      cap11Y = margin + 11;
    }

    const dpiOpFormatted = op.dpiNecessari && op.dpiNecessari.length > 0
      ? op.dpiNecessari.map(d => `[DPI ISO 7010] ${d} (${getDpiNormLabel(d)})`).join('   •   ')
      : '[DPI ISO 7010] Casco con sottogola (UNI EN 397)   •   [DPI ISO 7010] Imbracatura anticaduta (UNI EN 361)   •   [DPI ISO 7010] Calzature S3 (UNI EN ISO 20345)';

    // Embed logo if present
    embedImageSafely(doc, op.logoUrl || op.immagineUrl, pageWidth - margin - 22, cap11Y + 1, 20, 14);

    (doc as any).autoTable({
      startY: cap11Y,
      head: [[`SCHEDA OPERA PROVVISIONALE ${oIdx + 1}: ${op.tipo.toUpperCase()}`, `Titolo IV Capo II D.Lgs. 81/08`]],
      body: [
        [
          {
            content: `Descrizione & Destinazione d'Uso: ${op.descrizione}   |   Pi.M.U.S.: ${op.pimusRichiesto ? 'OBBLIGATORIO (All. XXII)' : 'Non richiesto / Norma UNI'}`,
            colSpan: 2,
            styles: { fontStyle: 'bold', textColor: [30, 58, 138] },
          },
        ],
        [
          {
            content: `Prescrizioni di Montaggio, Uso e Smontaggio: ${op.prescrizioniSicurezza || 'Verifica visiva preventiva quotidiana, ancoraggi strutturali, assenza sovraccarichi sui piani di calpestio.'}`,
            colSpan: 2,
          },
        ],
        [
          {
            content: `DPI Anticaduta e Lavori in Quota Prescritti: ${dpiOpFormatted}`,
            colSpan: 2,
            styles: { fontStyle: 'bold', textColor: [15, 23, 42], fillColor: [241, 245, 249] },
          },
        ],
      ],
      theme: 'grid',
      headStyles: { fillColor: accentColor, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7.5 },
      bodyStyles: { fontSize: 6.8, fillColor: [248, 250, 252], textColor: [15, 23, 42] },
      columnStyles: { 0: { cellWidth: contentWidth - 55 }, 1: { cellWidth: 55, halign: 'right' } },
      margin: { left: margin, right: margin },
    });

    cap11Y = (doc as any).lastAutoTable.finalY + 4.5;
  });

  // ==========================================
  // CAPITOLO 12: SOSTANZE CHIMICHE E PREPARATI PERICOLOSI (SDS)
  // ==========================================
  addChapterHeader(12, 'Sostanze Chimiche e Preparati Pericolosi (SDS)');

  let cap12Y = margin + 11;
  const sostanzeList = pos.sostanze && pos.sostanze.length > 0 ? pos.sostanze : [
    {
      id: 'default-sost-1',
      nomeCommerciale: 'Prodotti Chimici Ordinari di Cantiere (Malte, Adesivi, Disarmanti)',
      utilizzoFase: 'Fasi di posa e getto calcestruzzi',
      schedaSicurezzaPresente: true,
      pittogrammiPericolo: ['GHS07'],
      frasiRischio: 'Consultare schede dati di sicurezza SDS fornite dai produttori.',
      dpiSpecifici: ['Guanti per rischio chimico / impermeabili', 'Occhiali di protezione a mascherina / Visiera', 'Mascherina antipolvere FFP2'],
      dpiObbligatori: ['Guanti per rischio chimico / impermeabili', 'Occhiali di protezione a mascherina / Visiera', 'Mascherina antipolvere FFP2'],
    },
  ];

  sostanzeList.forEach((sost, sIdx) => {
    if (cap12Y > pageHeight - 70) {
      addChapterHeader(12, 'Sostanze Chimiche e Preparati Pericolosi (SDS)');
      cap12Y = margin + 11;
    }

    const dpiRaw = sost.dpiSpecifici && sost.dpiSpecifici.length > 0
      ? sost.dpiSpecifici
      : sost.dpiObbligatori && sost.dpiObbligatori.length > 0
      ? sost.dpiObbligatori
      : ['Guanti per rischio chimico / impermeabili', 'Occhiali di protezione a mascherina / Visiera', 'Mascherina antipolvere FFP2'];

    const dpiSostFormatted = dpiRaw
      .map(d => `[DPI ISO 7010] ${d} (${getDpiNormLabel(d)})`)
      .join('   •   ');

    const ghsSummary = sost.pittogrammiPericolo && sost.pittogrammiPericolo.length > 0
      ? sost.pittogrammiPericolo.map(p => `[GHS: ${p} - ${GHS_LABELS[p] || 'Pericolo'}]`).join('   ')
      : 'Nessun pittogramma di pericolo specifico dichiarato (Prodotto non classificato pericoloso CLP)';

    // Embed logo if present
    embedImageSafely(doc, sost.logoUrl || sost.immagineUrl, pageWidth - margin - 22, cap12Y + 1, 20, 14);

    (doc as any).autoTable({
      startY: cap12Y,
      head: [[`SCHEDA SOSTANZA CHIMICA ${sIdx + 1}: ${sost.nomeCommerciale.toUpperCase()}`, `Titolo IX Capo I D.Lgs. 81/08`]],
      body: [
        [
          {
            content: `Fase d'Impiego: ${sost.utilizzoFase}   |   Scheda di Sicurezza SDS: ${sost.schedaSicurezzaPresente ? 'Presente in atti di cantiere a 16 punti' : 'Da richiedere preventivamente'}`,
            colSpan: 2,
            styles: { fontStyle: 'bold', textColor: [30, 58, 138] },
          },
        ],
        [
          {
            content: `Pittogrammi di Pericolo CLP/GHS: ${ghsSummary}`,
            colSpan: 2,
            styles: { fontStyle: 'bold', textColor: [185, 28, 28] },
          },
        ],
        [
          {
            content: `Indicazioni di Pericolo (Frasi H) e Istruzioni d'Uso: ${sost.frasiRischio || 'Consultare SDS. Stoccare in luogo asciutto e ventilato.'}`,
            colSpan: 2,
          },
        ],
        [
          {
            content: `DPI Specifici di Protezione Chimica e Respiratoria: ${dpiSostFormatted}`,
            colSpan: 2,
            styles: { fontStyle: 'bold', textColor: [15, 23, 42], fillColor: [241, 245, 249] },
          },
        ],
      ],
      theme: 'grid',
      headStyles: { fillColor: [88, 28, 135], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7.5 },
      bodyStyles: { fontSize: 6.8, fillColor: [248, 250, 252], textColor: [15, 23, 42] },
      columnStyles: { 0: { cellWidth: contentWidth - 55 }, 1: { cellWidth: 55, halign: 'right' } },
      margin: { left: margin, right: margin },
    });

    cap12Y = (doc as any).lastAutoTable.finalY + 4.5;
  });

  // ==========================================
  // CAPITOLO 13: GESTIONE EMERGENZE, PRIMO SOCCORSO E ANTINCENDIO
  // ==========================================
  addChapterHeader(13, 'Gestione Emergenze, Primo Soccorso e Antincendio');

  let cap13Y = margin + 11;

  (doc as any).autoTable({
    startY: cap13Y,
    head: [['Presidio / Parametro di Emergenza', 'Dati Operativi e Numeri di Soccorso']],
    body: [
      ['Numero Unico Europeo Emergenze (NUE)', pos.emergenza.numeroUnicoEmergenza || '112 (Attivo 24/7 per Ambulanza, Vigili del Fuoco, Forze dell\'Ordine)'],
      ['Pronto Soccorso di Riferimento', `${formatMissingData(pos.emergenza.ospedaleRiferimento)} - Tel: ${formatMissingData(pos.emergenza.telefonoProntoSoccorso, '112')}`],
      ['Indirizzo Struttura Ospedaliera', formatMissingData(pos.emergenza.prontoSoccorsoIndirizzo)],
      ['Punto di Raccolta in Cantiere', pos.emergenza.puntoRaccolta || 'Ingresso carraio principale del cantiere'],
      ['Cassetta Pronto Soccorso & Estintori', `${pos.emergenza.cassettaPrimoSoccorsoUbicazione || 'Presso baracca'} | ${pos.emergenza.estintoriUbicazione || 'Estintori polvere 6kg'}`],
      ['Procedura Chiamata di Soccorso', pos.emergenza.proceduraChiamataSoccorsi || 'Chiamare 112 indicando indirizzo, numero feriti e dinamica.'],
    ],
    theme: 'grid',
    headStyles: { fillColor: [185, 28, 28], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7.5 },
    bodyStyles: { fontSize: 6.8, textColor: [15, 23, 42] },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 60, fillColor: [254, 242, 242] } },
    margin: { left: margin, right: margin },
  });

  // ==========================================
  // CAPITOLO 14: DISPOSIZIONI FINALI, ALLEGATI E FIRME
  // ==========================================
  addChapterHeader(14, 'Disposizioni Finali, Allegati e Firme');

  const allRows = (pos.allegati || []).map((a, i) => [
    `${i + 1}. ${a.titolo}`,
    a.allegatoPresente ? 'ALLEGATO (PRESENTE)' : 'IN ATTI C/O SEDE',
  ]);

  (doc as any).autoTable({
    startY: margin + 11,
    head: [['Documentazione Allegata e Tenuta in Cantiere (All. XVII D.Lgs. 81/08)', 'Stato']],
    body: allRows.length > 0 ? allRows : [['Documenti di conformità standard', 'Presso sede legale']],
    theme: 'grid',
    headStyles: { fillColor: primaryColor, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7.5 },
    bodyStyles: { fontSize: 6.8, textColor: [15, 23, 42] },
    columnStyles: { 0: { cellWidth: 130 }, 1: { cellWidth: 52, fontStyle: 'bold', halign: 'center' } },
    margin: { left: margin, right: margin },
  });

  let signY = (doc as any).lastAutoTable.finalY + 8;
  if (signY > pageHeight - 55) {
    doc.addPage();
    signY = margin + 14;
  }

  // Box Sottoscrizioni e Firme Ufficiali (Solo Datore di Lavoro e RSPP - stessa persona - e RLS)
  doc.setFillColor(...primaryColor);
  doc.rect(margin, signY, contentWidth, 6, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('SOTTOSCRIZIONI UFFICIALI E CONVALIDA DEL PIANO OPERATIVO DI SICUREZZA', margin + 3, signY + 4.2);

  signY += 9;
  doc.setTextColor(71, 85, 105);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  const dvrText = 'Il presente POS e\' redatto dal Datore di Lavoro (che svolge direttamente i compiti di RSPP ex Art. 34 D.Lgs. 81/08) previa consultazione del Rappresentante dei Lavoratori per la Sicurezza (RLS). I lavoratori operanti e il preposto hanno ricevuto copia e istruzioni esecutive prima dell\'inizio delle attivita\' di cantiere.';
  doc.text(doc.splitTextToSize(dvrText, contentWidth), margin, signY);

  signY += 12;

  const signColW = contentWidth / 2;
  const dlvRsppName = formatMissingData(pos.datiImpresa.datoreDiLavoro || pos.datiImpresa.rspp, 'Datore di Lavoro e RSPP');
  const rlsName = formatMissingData(pos.datiImpresa.rls, 'RLST Territoriale');

  const roles = [
    {
      title: 'IL DATORE DI LAVORO E R.S.P.P.',
      subtitle: '(Funzioni svolte direttamente ex Art. 34 D.Lgs. 81/08)',
      name: dlvRsppName,
      desc: '(Timbro dell\'Impresa e Firma per Asseverazione)',
    },
    {
      title: 'IL R.L.S. / R.L.S.T.',
      subtitle: '(Rappresentante dei Lavoratori per la Sicurezza)',
      name: rlsName,
      desc: '(Firma per Avvenuta Consultazione ex Art. 50)',
    },
  ];

  roles.forEach((r, i) => {
    const boxX = margin + signColW * i + (i === 0 ? 0 : 4);
    const boxW = signColW - 4;
    const xCenter = boxX + boxW / 2;

    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(boxX, signY - 3, boxW, 30, 1.5, 1.5, 'FD');

    doc.setTextColor(...primaryColor);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.text(r.title, xCenter, signY + 3, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    doc.setTextColor(100, 116, 139);
    doc.text(r.subtitle, xCenter, signY + 7, { align: 'center' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(15, 23, 42);
    doc.text(r.name, xCenter, signY + 13, { align: 'center' });

    doc.setDrawColor(148, 163, 184);
    doc.line(boxX + 12, signY + 20, boxX + boxW - 12, signY + 20);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(5.8);
    doc.setTextColor(100, 116, 139);
    doc.text(r.desc, xCenter, signY + 24.5, { align: 'center' });
  });

  // ==========================================
  // NUMERAZIONE DI PAGINA GLOBALE
  // ==========================================
  const totalPages = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.8);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `P.O.S. D.Lgs. 81/2008 - Cantiere: ${pos.datiCantiere.nome || 'Edile'} - Cod. ${pos.codice}`,
      margin,
      pageHeight - 5
    );
    doc.text(
      `Pagina ${i} di ${totalPages}`,
      pageWidth - margin,
      pageHeight - 5,
      { align: 'right' }
    );
  }

  const safeCantiere = (pos.datiCantiere?.nome || 'Cantiere').replace(/[^a-zA-Z0-9_-]/g, '_');
  const downloadDate = new Date();
  const dateStr = downloadDate.toISOString().slice(0, 10);
  const timeStr = `${String(downloadDate.getHours()).padStart(2, '0')}${String(downloadDate.getMinutes()).padStart(2, '0')}${String(downloadDate.getSeconds()).padStart(2, '0')}`;
  const filename = `${pos.codice}_Rev${safeVersione}_${safeCantiere}_${dateStr}_${timeStr}.pdf`;
  doc.save(filename);
};
