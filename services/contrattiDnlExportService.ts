import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { Cantiere, AppSettings, Personale, DnlData } from '../types';
import { formatDateItalian } from '../utils/dateUtils';

/**
 * Esporta il contratto in formato Word (.doc)
 */
export function exportContractToWord(contractText: string, cantiereName: string, nomeAzienda: string) {
  // Converte markdown e tag per formattazione Word
  const formattedHtml = contractText
    .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
    .replace(/\*(.*?)\*/g, '<i>$1</i>')
    .replace(/<center>(.*?)<\/center>/gis, '<div align="center" style="text-align: center; margin: 8px 0;">$1</div>')
    .replace(/\n/g, '<br/>');

  const htmlContent = `
    <!DOCTYPE html>
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset='utf-8'>
      <title>${cantiereName} - Contratto</title>
      <style>
        body { font-family: 'Times New Roman', Times, serif; font-size: 11pt; line-height: 1.5; color: #111; margin: 2.5cm; }
        h1, h2, h3 { text-align: center; text-transform: uppercase; }
        p { margin-bottom: 0.8em; text-align: justify; }
        center { text-align: center; display: block; }
        b, strong { font-weight: bold; }
        i, em { font-style: italic; }
        u { text-decoration: underline; }
      </style>
    </head>
    <body>
      <div style="border-bottom: 2px solid #333; padding-bottom: 8px; margin-bottom: 20px;">
        <strong style="font-size: 14pt;">${nomeAzienda}</strong><br/>
        <span style="font-size: 9pt; color: #666;">Documento Contrattuale di Cantiere: ${cantiereName}</span>
      </div>
      <div style="font-family: 'Times New Roman', Times, serif; text-align: justify;">${formattedHtml}</div>
    </body>
    </html>
  `;

  const blob = new Blob(['\ufeff' + htmlContent], {
    type: 'application/msword'
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const safeName = cantiereName.replace(/[^a-zA-Z0-9_-]/g, '_');
  a.download = `Contratto_${safeName}_${formatDateItalian(new Date()).replace(/\//g, '-')}.doc`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Esporta il contratto in PDF professionale con intestazione, logo, numerazione pagine e formattazione
 */
export function exportContractToPdf(
  contractText: string,
  cantiere: Cantiere,
  settings: AppSettings
) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const marginX = 20;
  const marginTop = 25;
  const marginBottom = 25;
  const contentWidth = pageWidth - (marginX * 2);

  // Intestazione prima pagina
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(15, 23, 42); // slate-900
  doc.text(settings.nomeAzienda.toUpperCase(), marginX, 15);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139); // slate-500
  const subHeader = settings.partitaIva ? `P.IVA: ${settings.partitaIva} • Cantiere: ${cantiere.nome}` : `Cantiere: ${cantiere.nome}`;
  doc.text(subHeader, marginX, 20);

  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.line(marginX, 22, pageWidth - marginX, 22);

  // Logo se presente
  if (settings.logoAzienda) {
    try {
      doc.addImage(settings.logoAzienda, 'JPEG', pageWidth - marginX - 16, 8, 16, 12, undefined, 'FAST');
    } catch {
      // Ignora se formato non supportato da jsPDF
    }
  }

  // Suddivisione testo e gestione formattazione (grassetto, corsivo, sottolineato, centrato)
  let cursorY = marginTop + 4;
  const lineHeight = 5.2;
  const rawParagraphs = contractText.split('\n');

  rawParagraphs.forEach((rawPara: string) => {
    let isCentered = false;
    let isBold = false;
    let isItalic = false;
    let isUnderline = false;

    const textToProcess = rawPara;

    // Controllo se centrato
    if (/<center>/i.test(textToProcess) || /\[center\]/i.test(textToProcess)) {
      isCentered = true;
    }
    // Controllo se articolo/titolo o tag bold
    const strippedCandidate = textToProcess.replace(/<[^>]+>/g, '').replace(/\[[^\]]+\]/g, '').trim();
    if (
      /<b>|<strong>|\*\*/i.test(textToProcess) ||
      /^(ART\.|ARTICOLO|PREMESSO|SI CONVIENE|TRA|E$|PREMESSA|CONTRATTO|LETTERA DI)/i.test(strippedCandidate)
    ) {
      isBold = true;
    }
    if (/<i>|<em>|\*[^*]+\*/i.test(textToProcess)) {
      isItalic = true;
    }
    if (/<u>/i.test(textToProcess)) {
      isUnderline = true;
    }

    // Pulisci i tag HTML/Markdown dal testo da stampare in PDF
    const cleanText = textToProcess
      .replace(/<\/?(center|b|strong|i|em|u|h[1-6]|span|div|p)>/gi, '')
      .replace(/\[\/?(center|b|i|u)\]/gi, '')
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1');

    if (cleanText.trim() === '') {
      cursorY += lineHeight * 0.7;
      return;
    }

    // Suddividi in linee se il testo supera la larghezza utile
    const lines = doc.splitTextToSize(cleanText, contentWidth);

    lines.forEach((line: string) => {
      if (cursorY + lineHeight > pageHeight - marginBottom) {
        doc.addPage();
        cursorY = marginTop;
        
        // Linea guida superiore sulle pagine successive
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(148, 163, 184);
        doc.text(`${settings.nomeAzienda} • ${cantiere.nome}`, marginX, 15);
        doc.setDrawColor(241, 245, 249);
        doc.line(marginX, 17, pageWidth - marginX, 17);
      }

      // Imposta font
      if (isBold && isItalic) {
        doc.setFont('times', 'bolditalic');
      } else if (isBold) {
        doc.setFont('times', 'bold');
      } else if (isItalic) {
        doc.setFont('times', 'italic');
      } else {
        doc.setFont('times', 'normal');
      }
      doc.setFontSize(10.5);
      doc.setTextColor(15, 23, 42);

      if (isCentered) {
        doc.text(line, pageWidth / 2, cursorY, { align: 'center' });
      } else {
        doc.text(line, marginX, cursorY);
      }

      if (isUnderline) {
        const textWidth = doc.getTextWidth(line);
        const startX = isCentered ? (pageWidth / 2) - (textWidth / 2) : marginX;
        doc.setDrawColor(15, 23, 42);
        doc.setLineWidth(0.2);
        doc.line(startX, cursorY + 0.8, startX + textWidth, cursorY + 0.8);
      }

      cursorY += lineHeight;
    });
  });

  // Numerazione pagine in piè di pagina (senza alcuna dicitura generato il)
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.setDrawColor(226, 232, 240);
    doc.line(marginX, pageHeight - 15, pageWidth - marginX, pageHeight - 15);
    doc.text(`Pagina ${i} di ${totalPages}`, pageWidth - marginX, pageHeight - 10, { align: 'right' });
  }

  const safeName = cantiere.nome.replace(/[^a-zA-Z0-9_-]/g, '_');
  doc.save(`Contratto_${safeName}_${formatDateItalian(new Date()).replace(/\//g, '-')}.pdf`);
}

/**
 * Helper: verifica se un valore è presente e significativo (non vuoto, non trattino, non N.D.)
 */
function isFieldFilled(val: any): boolean {
  if (val === undefined || val === null) return false;
  const s = String(val).trim();
  return (
    s !== '' &&
    s !== '-' &&
    s !== 'N.D.' &&
    s !== 'Da compilare' &&
    s !== 'Non presente' &&
    s !== 'Non specificato' &&
    s !== 'Non necessaria / Non presente' &&
    s !== 'Esente / Non presente'
  );
}

/**
 * Esporta il file DNL in formato testo strutturato (.TXT)
 * Semplificato: omette i campi lasciati vuoti, esclude lavoratori, manodopera e direttore lavori,
 * e nel riquadro economico inserisce solo Importo Complessivo, Opere Edili e Subappalti Totale.
 */
export function exportDnlToTxt(
  cantiere: Cantiere,
  settings: AppSettings,
  dnlData: DnlData,
  _personaleAssegnato?: Personale[]
): string {
  const oggi = formatDateItalian(new Date());
  const sep = '='.repeat(70);
  const subSep = '-'.repeat(70);

  let out = '';
  out += `${sep}\n`;
  out += `FASCICOLO TELEMATICO DNL - DENUNCIA DI NUOVO LAVORO (EDILIZIA)\n`;
  out += `Adempimento Cassa Edile / Edilcassa (CNCE) e INAIL\n`;
  out += `Data: ${oggi} • Impresa: ${settings.nomeAzienda}\n`;
  out += `${sep}\n\n`;

  // [1] DATI IMPRESA (solo se compilati)
  const impresaLines: string[] = [];
  if (isFieldFilled(settings.nomeAzienda)) impresaLines.push(`Ragione Sociale:           ${settings.nomeAzienda}`);
  if (isFieldFilled(settings.partitaIva || settings.codiceFiscaleAzienda)) impresaLines.push(`Codice Fiscale / P.IVA:    ${settings.partitaIva || settings.codiceFiscaleAzienda}`);
  if (isFieldFilled(settings.indirizzoSede)) impresaLines.push(`Sede Legale:               ${settings.indirizzoSede}`);
  if (isFieldFilled(settings.pec)) impresaLines.push(`PEC Impresa:               ${settings.pec}`);
  if (isFieldFilled(settings.telefonoAzienda)) impresaLines.push(`Recapito Telefonico:       ${settings.telefonoAzienda}`);
  if (isFieldFilled(settings.rappresentanteLegale)) impresaLines.push(`Rappresentante Legale:     ${settings.rappresentanteLegale}`);
  if (isFieldFilled(dnlData.codiceCassaEdile || settings.codiceCassaEdile)) impresaLines.push(`Codice Cassa Edile:        ${dnlData.codiceCassaEdile || settings.codiceCassaEdile}`);
  if (isFieldFilled(dnlData.patInail || settings.patInail)) impresaLines.push(`Codice Ditta & PAT INAIL:  ${dnlData.patInail || settings.patInail}`);
  if (isFieldFilled(dnlData.matricolaInps || settings.matricolaInps)) impresaLines.push(`Matricola Aziendale INPS:  ${dnlData.matricolaInps || settings.matricolaInps}`);
  if (isFieldFilled(dnlData.ccnl || settings.ccnlApplicato)) impresaLines.push(`CCNL Applicato:            ${dnlData.ccnl || settings.ccnlApplicato}`);

  if (impresaLines.length > 0) {
    out += `[1] DATI DELL'IMPRESA ESECUTRICE\n${subSep}\n${impresaLines.join('\n')}\n\n`;
  }

  // [2] DATI CANTIERE & PRATICA EDILIZIA (solo campi compilati)
  const cantiereLines: string[] = [];
  if (isFieldFilled(cantiere.nome)) cantiereLines.push(`Denominazione Cantiere:    ${cantiere.nome}`);
  if (isFieldFilled(cantiere.indirizzo)) cantiereLines.push(`Ubicazione / Indirizzo:    ${cantiere.indirizzo}`);
  if (isFieldFilled(cantiere.cliente)) {
    const cfText = isFieldFilled(dnlData.committenteCodiceFiscale) ? ` (C.F.: ${dnlData.committenteCodiceFiscale})` : '';
    cantiereLines.push(`Committente:               ${cantiere.cliente}${cfText}`);
  }
  if (isFieldFilled(dnlData.committenteIndirizzo)) cantiereLines.push(`Indirizzo Committente:     ${dnlData.committenteIndirizzo}`);
  if (isFieldFilled(dnlData.committentePecTelefono)) cantiereLines.push(`Contatti Committente:      ${dnlData.committentePecTelefono}`);
  const tipoLavoriVal = dnlData.tipoLavoro || 'Ristrutturazione Edilizia';
  cantiereLines.push(`Tipologia dei Lavori:      ${tipoLavoriVal}`);
  if (isFieldFilled(dnlData.naturaAppalto)) cantiereLines.push(`Natura Giuridica Appalto:  ${dnlData.naturaAppalto.toUpperCase()}`);
  if (isFieldFilled(dnlData.titoloAbilitativoTipo)) cantiereLines.push(`Titolo Abilitativo:        ${dnlData.titoloAbilitativoTipo}`);
  if (isFieldFilled(dnlData.titoloAbilitativoNumero)) cantiereLines.push(`Numero Pratica / Prot.:    ${dnlData.titoloAbilitativoNumero}`);
  if (isFieldFilled(dnlData.titoloAbilitativoData)) cantiereLines.push(`Data Deposito Pratica:     ${formatDateItalian(dnlData.titoloAbilitativoData)}`);
  if (isFieldFilled(dnlData.titoloAbilitativoComune)) cantiereLines.push(`Comune di Riferimento:     ${dnlData.titoloAbilitativoComune}`);
  if (isFieldFilled(dnlData.protocolloNotificaPreliminare)) {
    const dataNotifica = isFieldFilled(dnlData.dataNotificaPreliminare) ? ` del ${formatDateItalian(dnlData.dataNotificaPreliminare)}` : '';
    cantiereLines.push(`Notifica Preliminare ASL:  Prot. ${dnlData.protocolloNotificaPreliminare}${dataNotifica}`);
  }
  if (isFieldFilled(dnlData.cig)) cantiereLines.push(`Codice CIG:                ${dnlData.cig}`);
  if (isFieldFilled(dnlData.cup)) cantiereLines.push(`Codice CUP:                ${dnlData.cup}`);
  if (isFieldFilled(cantiere.dataInizio)) cantiereLines.push(`Data Inizio Lavori:        ${formatDateItalian(cantiere.dataInizio)}`);
  if (isFieldFilled(cantiere.dataConsegna || cantiere.scadenza)) cantiereLines.push(`Data Consegna Lavori:      ${formatDateItalian(cantiere.dataConsegna || cantiere.scadenza)}`);
  if (isFieldFilled(cantiere.scadenzaDNL)) cantiereLines.push(`Termine Scadenza Invio:    ${formatDateItalian(cantiere.scadenzaDNL)}`);

  if (cantiereLines.length > 0) {
    out += `[2] CANTIERE E TITOLO ABILITATIVO\n${subSep}\n${cantiereLines.join('\n')}\n\n`;
  }

  // [3] FIGURE TECNICHE & SICUREZZA (NO DIRETTORE LAVORI!)
  const sicurezzaLines: string[] = [];
  if (isFieldFilled(dnlData.progettistaNome)) sicurezzaLines.push(`Progettista:              ${dnlData.progettistaNome}`);
  if (isFieldFilled(dnlData.progettistaTelefono)) sicurezzaLines.push(`Telefono Progettista:     ${dnlData.progettistaTelefono}`);
  if (isFieldFilled(dnlData.progettistaEmail)) sicurezzaLines.push(`Email Progettista:        ${dnlData.progettistaEmail}`);
  if (isFieldFilled(dnlData.progettistaPec)) sicurezzaLines.push(`PEC Progettista:          ${dnlData.progettistaPec}`);
  const coordSicurezza = dnlData.coordinatoreSicurezza || cantiere.tecnici?.find(t => /sicurezza|cse/i.test(t.ruolo))?.nome;
  if (isFieldFilled(coordSicurezza)) sicurezzaLines.push(`Coord. Sicurezza (CSE):    ${coordSicurezza}`);
  const capocantiere = dnlData.capocantiere || cantiere.tecnici?.find(t => /capocantiere|preposto/i.test(t.ruolo))?.nome;
  if (isFieldFilled(capocantiere)) sicurezzaLines.push(`Capocantiere / Preposto:   ${capocantiere}`);
  if (isFieldFilled(dnlData.responsabileLavori)) sicurezzaLines.push(`Responsabile dei Lavori:   ${dnlData.responsabileLavori}`);

  if (sicurezzaLines.length > 0) {
    out += `[3] FIGURE TECNICHE & RESPONSABILI DELLA SICUREZZA\n${subSep}\n${sicurezzaLines.join('\n')}\n\n`;
  }

  // [4] RIQUADRO ECONOMICO: solo Importo Complessivo, Opere Edili, Subappalti Totale
  const subappaltiTotale = (cantiere.subappalti || []).reduce((acc, s) => acc + (s.prezzoOriginale || 0), 0);
  const impEdile = dnlData.importoEdile !== undefined ? dnlData.importoEdile : (cantiere.importoTotale || 0);

  out += `[4] RIQUADRO ECONOMICO\n${subSep}\n`;
  out += `Importo Complessivo Opera: € ${(cantiere.importoTotale || 0).toLocaleString('it-IT', { minimumFractionDigits: 2 })}\n`;
  out += `Opere Edili (Cassa Edile): € ${impEdile.toLocaleString('it-IT', { minimumFractionDigits: 2 })}\n`;
  out += `Subappalti Totale:         € ${subappaltiTotale.toLocaleString('it-IT', { minimumFractionDigits: 2 })}\n\n`;

  // [5] DETTAGLIO SUBAPPALTI (se presenti)
  if (cantiere.subappalti && cantiere.subappalti.length > 0) {
    out += `[5] DITTE IN SUBAPPALTO (${cantiere.subappalti.length})\n${subSep}\n`;
    cantiere.subappalti.forEach((s, idx) => {
      const extraFields = [
        isFieldFilled(s.partitaIva) ? `P.IVA: ${s.partitaIva}` : '',
        isFieldFilled(s.email) ? `Email: ${s.email}` : '',
        isFieldFilled(s.pec) ? `PEC: ${s.pec}` : '',
      ].filter(Boolean).join(' | ');

      out += `${idx + 1}. ${s.azienda}${extraFields ? ` (${extraFields})` : ''} | Lavorazione: ${s.lavoro} | Importo: € ${s.prezzoOriginale.toLocaleString('it-IT', { minimumFractionDigits: 2 })}\n`;
    });
    out += `\n`;
  }

  // NOTE (se presenti)
  if (isFieldFilled(dnlData.noteDNL)) {
    out += `NOTE INTEGRATIVE\n${subSep}\n${dnlData.noteDNL}\n\n`;
  }

  out += `${sep}\nFINE SCHEDA DNL\n${sep}\n`;
  return out;
}

/**
 * Esporta il file DNL in TXT scaricabile
 */
export function downloadDnlTxtFile(
  cantiere: Cantiere,
  settings: AppSettings,
  dnlData: DnlData,
  personaleAssegnato?: Personale[]
) {
  const content = exportDnlToTxt(cantiere, settings, dnlData, personaleAssegnato);
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const safeName = cantiere.nome.replace(/[^a-zA-Z0-9_-]/g, '_');
  a.download = `FILE_DATI_DNL_${safeName}_${formatDateItalian(new Date()).replace(/\//g, '-')}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Esporta il file DNL in JSON scaricabile (semplificato)
 */
export function downloadDnlJsonFile(
  cantiere: Cantiere,
  settings: AppSettings,
  dnlData: DnlData,
  _personaleAssegnato?: Personale[]
) {
  const subappaltiTotale = (cantiere.subappalti || []).reduce((acc, s) => acc + (s.prezzoOriginale || 0), 0);
  const impEdile = dnlData.importoEdile !== undefined ? dnlData.importoEdile : (cantiere.importoTotale || 0);

  const fullDnlObject = {
    tipoDocumento: "DNL - Denuncia di Nuovo Lavoro (Semplificato)",
    dataGenerazione: formatDateItalian(new Date()),
    impresa: {
      ragioneSociale: settings.nomeAzienda,
      partitaIva: settings.partitaIva || settings.codiceFiscaleAzienda || null,
      sedeLegale: settings.indirizzoSede || null,
      pec: settings.pec || null,
      telefono: settings.telefonoAzienda || null,
      legaleRappresentante: settings.rappresentanteLegale || null,
      codiceCassaEdile: dnlData.codiceCassaEdile || settings.codiceCassaEdile || null,
      matricolaInps: dnlData.matricolaInps || settings.matricolaInps || null,
      patInail: dnlData.patInail || settings.patInail || null,
      ccnl: dnlData.ccnl || settings.ccnlApplicato || null,
    },
    cantiere: {
      id: cantiere.id,
      nome: cantiere.nome,
      indirizzo: cantiere.indirizzo || null,
      cliente: cantiere.cliente,
      committenteCodiceFiscale: dnlData.committenteCodiceFiscale || null,
      dataInizio: formatDateItalian(cantiere.dataInizio),
      dataConsegna: formatDateItalian(cantiere.dataConsegna || cantiere.scadenza),
      scadenzaDNL: formatDateItalian(cantiere.scadenzaDNL),
    },
    praticaEdilizia: {
      tipoLavoro: dnlData.tipoLavoro || null,
      naturaAppalto: dnlData.naturaAppalto || null,
      titoloAbilitativoTipo: dnlData.titoloAbilitativoTipo || null,
      titoloAbilitativoNumero: dnlData.titoloAbilitativoNumero || null,
      titoloAbilitativoData: formatDateItalian(dnlData.titoloAbilitativoData),
      titoloAbilitativoComune: dnlData.titoloAbilitativoComune || null,
      notificaPreliminareProtocollo: dnlData.protocolloNotificaPreliminare || null,
      notificaPreliminareData: formatDateItalian(dnlData.dataNotificaPreliminare),
      cig: dnlData.cig || null,
      cup: dnlData.cup || null,
    },
    progettista: {
      nome: dnlData.progettistaNome || null,
      telefono: dnlData.progettistaTelefono || null,
      email: dnlData.progettistaEmail || null,
      pec: dnlData.progettistaPec || null,
    },
    sicurezza: {
      coordinatoreSicurezza: dnlData.coordinatoreSicurezza || cantiere.tecnici?.find(t => /sicurezza|cse/i.test(t.ruolo))?.nome || null,
      capocantiere: dnlData.capocantiere || cantiere.tecnici?.find(t => /capocantiere|preposto/i.test(t.ruolo))?.nome || null,
      responsabileLavori: dnlData.responsabileLavori || null,
    },
    riquadroEconomico: {
      importoComplessivo: cantiere.importoTotale || 0,
      opereEdili: impEdile,
      subappaltiTotale: subappaltiTotale,
    },
    subappalti: (cantiere.subappalti || []).map(s => ({
      azienda: s.azienda,
      partitaIva: s.partitaIva || null,
      email: s.email || null,
      pec: s.pec || null,
      lavoro: s.lavoro,
      importo: s.prezzoOriginale
    })),
    note: dnlData.noteDNL || null
  };

  const blob = new Blob([JSON.stringify(fullDnlObject, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const safeName = cantiere.nome.replace(/[^a-zA-Z0-9_-]/g, '_');
  a.download = `DNL_DATI_${safeName}_${formatDateItalian(new Date()).replace(/\//g, '-')}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Esporta il fascicolo DNL in foglio Excel (.xlsx) semplificato
 * Non include voci vuote, non include lavoratori, non include manodopera o direttore lavori
 */
export function exportDnlToExcel(
  cantiere: Cantiere,
  settings: AppSettings,
  dnlData: DnlData,
  _personaleAssegnato?: Personale[]
) {
  const wb = XLSX.utils.book_new();

  const subappaltiTotale = (cantiere.subappalti || []).reduce((acc, s) => acc + (s.prezzoOriginale || 0), 0);
  const impEdile = dnlData.importoEdile !== undefined ? dnlData.importoEdile : (cantiere.importoTotale || 0);

  // Foglio 1: Dati DNL Semplificati (solo non vuoti)
  const rawData: { Campo: string; Valore: any }[] = [
    { Campo: "Denominazione Cantiere", Valore: cantiere.nome },
    { Campo: "Indirizzo Cantiere", Valore: cantiere.indirizzo || '' },
    { Campo: "Committente", Valore: cantiere.cliente },
    { Campo: "Codice Fiscale Committente", Valore: dnlData.committenteCodiceFiscale || '' },
    { Campo: "Impresa Esecutrice", Valore: settings.nomeAzienda },
    { Campo: "P.IVA / CF Impresa", Valore: settings.partitaIva || settings.codiceFiscaleAzienda || '' },
    { Campo: "Codice Cassa Edile", Valore: dnlData.codiceCassaEdile || settings.codiceCassaEdile || '' },
    { Campo: "PAT INAIL", Valore: dnlData.patInail || settings.patInail || '' },
    { Campo: "Matricola INPS", Valore: dnlData.matricolaInps || settings.matricolaInps || '' },
    { Campo: "CCNL Applicato", Valore: dnlData.ccnl || settings.ccnlApplicato || '' },
    { Campo: "Tipologia dei Lavori", Valore: dnlData.tipoLavoro || 'Ristrutturazione Edilizia' },
    { Campo: "Natura Giuridica Appalto", Valore: dnlData.naturaAppalto ? dnlData.naturaAppalto.toUpperCase() : 'PRIVATO' },
    { Campo: "Titolo Abilitativo", Valore: [dnlData.titoloAbilitativoTipo, dnlData.titoloAbilitativoNumero ? `N. ${dnlData.titoloAbilitativoNumero}` : '', dnlData.titoloAbilitativoData ? `del ${formatDateItalian(dnlData.titoloAbilitativoData)}` : ''].filter(Boolean).join(' ') },
    { Campo: "Notifica Preliminare", Valore: dnlData.protocolloNotificaPreliminare ? `Prot. ${dnlData.protocolloNotificaPreliminare} del ${formatDateItalian(dnlData.dataNotificaPreliminare)}` : '' },
    { Campo: "Progettista", Valore: dnlData.progettistaNome || '' },
    { Campo: "Telefono Progettista", Valore: dnlData.progettistaTelefono || '' },
    { Campo: "Email Progettista", Valore: dnlData.progettistaEmail || '' },
    { Campo: "PEC Progettista", Valore: dnlData.progettistaPec || '' },
    { Campo: "Coordinatore Sicurezza (CSE)", Valore: dnlData.coordinatoreSicurezza || cantiere.tecnici?.find(t => /sicurezza|cse/i.test(t.ruolo))?.nome || '' },
    { Campo: "Capocantiere / Preposto", Valore: dnlData.capocantiere || cantiere.tecnici?.find(t => /capocantiere|preposto/i.test(t.ruolo))?.nome || '' },
    { Campo: "Data Inizio Lavori", Valore: formatDateItalian(cantiere.dataInizio) },
    { Campo: "Data Consegna Lavori", Valore: formatDateItalian(cantiere.dataConsegna || cantiere.scadenza) },
    { Campo: "Scadenza Denuncia DNL", Valore: formatDateItalian(cantiere.scadenzaDNL) },
    { Campo: "Codice CIG", Valore: dnlData.cig || '' },
    { Campo: "Codice CUP", Valore: dnlData.cup || '' },
    // Riquadro Economico
    { Campo: "Importo Complessivo Opera (€)", Valore: cantiere.importoTotale || 0 },
    { Campo: "Opere Edili (Cassa Edile) (€)", Valore: impEdile },
    { Campo: "Subappalti Totale (€)", Valore: subappaltiTotale },
  ];

  const generalData = rawData.filter(item => isFieldFilled(item.Valore));
  const wsGeneral = XLSX.utils.json_to_sheet(generalData);
  XLSX.utils.book_append_sheet(wb, wsGeneral, "SCHEDA_DNL");

  // Foglio 2: Subappalti (solo se presenti)
  if (cantiere.subappalti && cantiere.subappalti.length > 0) {
    const subData = cantiere.subappalti.map(s => ({
      Azienda: s.azienda,
      Partita_IVA: s.partitaIva || '',
      Email: s.email || '',
      PEC: s.pec || '',
      Lavorazione: s.lavoro,
      Importo_Subappalto: s.prezzoOriginale
    }));
    const wsSub = XLSX.utils.json_to_sheet(subData);
    XLSX.utils.book_append_sheet(wb, wsSub, "SUBAPPALTI");
  }

  const safeName = cantiere.nome.replace(/[^a-zA-Z0-9_-]/g, '_');
  XLSX.writeFile(wb, `Fascicolo_DNL_${safeName}_${formatDateItalian(new Date()).replace(/\//g, '-')}.xlsx`);
}

/**
 * Esporta il fascicolo ufficiale DNL in PDF semplificato ad alta leggibilità:
 * - Omette tutte le voci lasciate vuote
 * - Esclude completamente i lavoratori
 * - Esclude la manodopera (ore stimate, percentuale, n. operai)
 * - Esclude il direttore dei lavori
 * - Nel riquadro economico inserisce solo: Importo Complessivo, Opere Edili, Subappalti Totale
 * - Tutte le date sono formattate rigorosamente in gg/mm/yyyy
 */
export function exportDnlToPdf(
  cantiere: Cantiere,
  settings: AppSettings,
  dnlData: DnlData,
  _personaleAssegnato?: Personale[]
) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = 210;
  const marginX = 15;
  const subappaltiTotale = (cantiere.subappalti || []).reduce((acc, s) => acc + (s.prezzoOriginale || 0), 0);
  const impEdile = dnlData.importoEdile !== undefined ? dnlData.importoEdile : (cantiere.importoTotale || 0);

  // Header Banner
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 24, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(255, 255, 255);
  doc.text("SCHEDA DI DENUNCIA DI NUOVO LAVORO (D.N.L.)", marginX, 11);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(147, 197, 253); // blue-300
  doc.text(`CASSA EDILE / EDILCASSA (CNCE) & INAIL • Cantiere: ${cantiere.nome.toUpperCase()}`, marginX, 17);

  doc.setTextColor(255, 255, 255);
  doc.text(`Data: ${formatDateItalian(new Date())}`, pageWidth - marginX, 17, { align: 'right' });

  let y = 30;

  // RIQUADRO 1: Dati Impresa (filtra le voci vuote)
  const bodyImpresa = [
    ["Ragione Sociale Impresa", settings.nomeAzienda],
    ["Partita IVA / Codice Fiscale", settings.partitaIva || settings.codiceFiscaleAzienda || ""],
    ["Sede Legale / Indirizzo", settings.indirizzoSede || ""],
    ["PEC", settings.pec || ""],
    ["Telefono", settings.telefonoAzienda || ""],
    ["Rappresentante Legale", settings.rappresentanteLegale || ""],
    ["Codice Cassa Edile Impresa", dnlData.codiceCassaEdile || settings.codiceCassaEdile || ""],
    ["Codice Ditta & PAT INAIL", dnlData.patInail || settings.patInail || ""],
    ["Matricola Aziendale INPS", dnlData.matricolaInps || settings.matricolaInps || ""],
    ["CCNL Applicato", dnlData.ccnl || settings.ccnlApplicato || ""],
  ].filter(([_, val]) => isFieldFilled(val));

  if (bodyImpresa.length > 0) {
    (doc as any).autoTable({
      startY: y,
      margin: { left: marginX, right: marginX },
      head: [["RIQUADRO 1: DATI DELL'IMPRESA ESECUTRICE", "VALORE"]],
      body: bodyImpresa,
      theme: 'grid',
      headStyles: { fillColor: [30, 41, 59], textColor: 255, fontStyle: 'bold', fontSize: 8 },
      styles: { fontSize: 7.5, cellPadding: 1.6 },
      columnStyles: { 0: { cellWidth: 62, fontStyle: 'bold' } }
    });
    y = (doc as any).lastAutoTable.finalY + 5;
  }

  // RIQUADRO 2: Cantiere & Titolo Abilitativo (filtra le voci vuote)
  const praticaParts = [
    dnlData.titoloAbilitativoTipo,
    dnlData.titoloAbilitativoNumero ? `N. ${dnlData.titoloAbilitativoNumero}` : '',
    dnlData.titoloAbilitativoData ? `del ${formatDateItalian(dnlData.titoloAbilitativoData)}` : '',
    dnlData.titoloAbilitativoComune ? `(${dnlData.titoloAbilitativoComune})` : ''
  ].filter(Boolean).join(' ');

  const notificaParts = dnlData.protocolloNotificaPreliminare
    ? `Prot. ${dnlData.protocolloNotificaPreliminare}${dnlData.dataNotificaPreliminare ? ` del ${formatDateItalian(dnlData.dataNotificaPreliminare)}` : ''}`
    : '';

  const tipoLavoriVal = dnlData.tipoLavoro || 'Ristrutturazione Edilizia';
  const naturaAppaltoVal = dnlData.naturaAppalto ? dnlData.naturaAppalto.toUpperCase() : 'PRIVATO';

  const bodyCantiere = [
    ["Denominazione Cantiere", cantiere.nome],
    ["Ubicazione / Indirizzo", cantiere.indirizzo || ""],
    ["Committente", `${cantiere.cliente}${isFieldFilled(dnlData.committenteCodiceFiscale) ? ` (C.F.: ${dnlData.committenteCodiceFiscale})` : ''}`],
    ["Tipologia dei Lavori", tipoLavoriVal],
    ["Natura Giuridica Appalto", naturaAppaltoVal],
    ["Titolo Abilitativo (Pratica)", praticaParts],
    ["Notifica Preliminare ASL/ITL", notificaParts],
    ["Codice CIG", dnlData.cig || ''],
    ["Codice CUP", dnlData.cup || ''],
    ["Data Inizio Lavori", formatDateItalian(cantiere.dataInizio)],
    ["Data Consegna Lavori", formatDateItalian(cantiere.dataConsegna || cantiere.scadenza)],
    ["Scadenza Denuncia DNL", formatDateItalian(cantiere.scadenzaDNL)],
  ].filter(([_, val]) => isFieldFilled(val));

  if (bodyCantiere.length > 0) {
    (doc as any).autoTable({
      startY: y,
      margin: { left: marginX, right: marginX },
      head: [["RIQUADRO 2: CANTIERE & TITOLO ABILITATIVO", "DETTAGLI"]],
      body: bodyCantiere,
      theme: 'grid',
      headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: 'bold', fontSize: 8 },
      styles: { fontSize: 7.5, cellPadding: 1.6 },
      columnStyles: { 0: { cellWidth: 62, fontStyle: 'bold' } }
    });
    y = (doc as any).lastAutoTable.finalY + 5;
  }

  // RIQUADRO 3: Figure Tecniche & Sicurezza (NO DIRETTORE LAVORI!)
  const coordSicurezza = dnlData.coordinatoreSicurezza || cantiere.tecnici?.find(t => /sicurezza|cse/i.test(t.ruolo))?.nome || '';
  const capocantiere = dnlData.capocantiere || cantiere.tecnici?.find(t => /capocantiere|preposto/i.test(t.ruolo))?.nome || '';
  const respLavori = dnlData.responsabileLavori || '';

  const bodySicurezza = [
    ["Progettista", dnlData.progettistaNome || ''],
    ["Telefono Progettista", dnlData.progettistaTelefono || ''],
    ["Email Progettista", dnlData.progettistaEmail || ''],
    ["PEC Progettista", dnlData.progettistaPec || ''],
    ["Coordinatore Sicurezza (CSE)", coordSicurezza],
    ["Capocantiere / Preposto", capocantiere],
    ["Responsabile dei Lavori", respLavori],
  ].filter(([_, val]) => isFieldFilled(val));

  if (bodySicurezza.length > 0) {
    (doc as any).autoTable({
      startY: y,
      margin: { left: marginX, right: marginX },
      head: [["RIQUADRO 3: FIGURE TECNICHE & RESPONSABILI DELLA SICUREZZA", "NOMINATIVI & RECAPITI"]],
      body: bodySicurezza,
      theme: 'grid',
      headStyles: { fillColor: [100, 116, 139], textColor: 255, fontStyle: 'bold', fontSize: 8 },
      styles: { fontSize: 7.5, cellPadding: 1.6 },
      columnStyles: { 0: { cellWidth: 62, fontStyle: 'bold' } }
    });
    y = (doc as any).lastAutoTable.finalY + 5;
  }

  // RIQUADRO 4: Valori Economici (SOLO: Importo Complessivo, Opere Edili, Subappalti Totale)
  const bodyEconomico = [
    ["Importo Complessivo Opera", `€ ${(cantiere.importoTotale || 0).toLocaleString('it-IT', { minimumFractionDigits: 2 })}`],
    ["Opere Edili (Cassa Edile)", `€ ${impEdile.toLocaleString('it-IT', { minimumFractionDigits: 2 })}`],
    ["Subappalti Totale", `€ ${subappaltiTotale.toLocaleString('it-IT', { minimumFractionDigits: 2 })}`],
  ];

  (doc as any).autoTable({
    startY: y,
    margin: { left: marginX, right: marginX },
    head: [["RIQUADRO 4: VALORI ECONOMICI", "IMPORTO"]],
    body: bodyEconomico,
    theme: 'grid',
    headStyles: { fillColor: [5, 150, 105], textColor: 255, fontStyle: 'bold', fontSize: 8 },
    styles: { fontSize: 7.5, cellPadding: 1.8 },
    columnStyles: { 0: { cellWidth: 62, fontStyle: 'bold' } }
  });
  y = (doc as any).lastAutoTable.finalY + 5;

  // RIQUADRO 5: Subappalti se presenti
  if (cantiere.subappalti && cantiere.subappalti.length > 0) {
    (doc as any).autoTable({
      startY: y,
      margin: { left: marginX, right: marginX },
      head: [["#", "Impresa Subappaltatrice", "P.IVA", "Contatti (Email / PEC)", "Lavorazione", "Importo Subappalto"]],
      body: cantiere.subappalti.map((s, i) => {
        const contatti = [s.email, s.pec ? `PEC: ${s.pec}` : ''].filter(Boolean).join('\n');
        return [
          (i + 1).toString(),
          s.azienda,
          s.partitaIva || '-',
          contatti || '-',
          s.lavoro,
          `€ ${s.prezzoOriginale.toLocaleString('it-IT', { minimumFractionDigits: 2 })}`
        ];
      }),
      theme: 'grid',
      headStyles: { fillColor: [217, 119, 6], textColor: 255, fontStyle: 'bold', fontSize: 7.5 },
      styles: { fontSize: 6.8, cellPadding: 1.5 },
      columnStyles: {
        0: { cellWidth: 7 },
        1: { cellWidth: 42, fontStyle: 'bold' },
        2: { cellWidth: 26 },
        3: { cellWidth: 44 },
        4: { cellWidth: 35 },
        5: { cellWidth: 26, halign: 'right' }
      }
    });
    y = (doc as any).lastAutoTable.finalY + 5;
  }

  // Note integrative DNL (se presenti)
  if (isFieldFilled(dnlData.noteDNL)) {
    (doc as any).autoTable({
      startY: y,
      margin: { left: marginX, right: marginX },
      head: [["NOTE INTEGRATIVE DNL"]],
      body: [[dnlData.noteDNL]],
      theme: 'grid',
      headStyles: { fillColor: [71, 85, 105], textColor: 255, fontStyle: 'bold', fontSize: 7.5 },
      styles: { fontSize: 7, cellPadding: 2 }
    });
    y = (doc as any).lastAutoTable.finalY + 5;
  }

  // Sezione Firme
  if (y + 25 > 280) {
    doc.addPage();
    y = 25;
  }

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text("Dichiarazione di veridicità resa ai sensi del D.P.R. 445/2000 per l'inoltro agli enti previdenziali e Cassa Edile.", marginX, y + 4);

  doc.setFont('helvetica', 'bold');
  doc.text("TIMBRO E FIRMA DEL LEGALE RAPPRESENTANTE DELL'IMPRESA:", marginX, y + 14);
  doc.setDrawColor(148, 163, 184);
  doc.line(marginX, y + 25, marginX + 80, y + 25);

  const safeName = cantiere.nome.replace(/[^a-zA-Z0-9_-]/g, '_');
  doc.save(`FASCICOLO_DNL_${safeName}_${formatDateItalian(new Date()).replace(/\//g, '-')}.pdf`);
}

/**
 * Stampa diretta della Scheda DNL (dialogo di stampa del browser)
 * Semplificata: omette le voci vuote, esclude lavoratori, esclude manodopera,
 * esclude direttore dei lavori, nel riquadro economico inserisce solo Importo Complessivo, Opere Edili e Subappalti Totale.
 */
export function printDnlSheet(
  cantiere: Cantiere,
  settings: AppSettings,
  dnlData: DnlData
) {
  const oggi = formatDateItalian(new Date());
  const subappaltiTotale = (cantiere.subappalti || []).reduce((acc, s) => acc + (s.prezzoOriginale || 0), 0);
  const impEdile = dnlData.importoEdile !== undefined ? dnlData.importoEdile : (cantiere.importoTotale || 0);

  // Riquadro 1: Dati Impresa
  const impresaRows = [
    { label: "Ragione Sociale", value: settings.nomeAzienda },
    { label: "Partita IVA / C.F.", value: settings.partitaIva || settings.codiceFiscaleAzienda },
    { label: "Sede Legale", value: settings.indirizzoSede },
    { label: "PEC", value: settings.pec },
    { label: "Telefono", value: settings.telefonoAzienda },
    { label: "Rappresentante Legale", value: settings.rappresentanteLegale },
    { label: "Codice Cassa Edile", value: dnlData.codiceCassaEdile || settings.codiceCassaEdile },
    { label: "Codice Ditta & PAT INAIL", value: dnlData.patInail || settings.patInail },
    { label: "Matricola Aziendale INPS", value: dnlData.matricolaInps || settings.matricolaInps },
    { label: "CCNL Applicato", value: dnlData.ccnl || settings.ccnlApplicato },
  ].filter(r => isFieldFilled(r.value));

  // Riquadro 2: Dati Cantiere
  const praticaParts = [
    dnlData.titoloAbilitativoTipo,
    dnlData.titoloAbilitativoNumero ? `N. ${dnlData.titoloAbilitativoNumero}` : '',
    dnlData.titoloAbilitativoData ? `del ${formatDateItalian(dnlData.titoloAbilitativoData)}` : '',
    dnlData.titoloAbilitativoComune ? `(${dnlData.titoloAbilitativoComune})` : ''
  ].filter(Boolean).join(' ');

  const notificaParts = dnlData.protocolloNotificaPreliminare
    ? `Prot. ${dnlData.protocolloNotificaPreliminare}${dnlData.dataNotificaPreliminare ? ` del ${formatDateItalian(dnlData.dataNotificaPreliminare)}` : ''}`
    : '';

  const tipoLavoriVal = dnlData.tipoLavoro || 'Ristrutturazione Edilizia';
  const naturaAppaltoVal = dnlData.naturaAppalto ? dnlData.naturaAppalto.toUpperCase() : 'PRIVATO';

  const cantiereRows = [
    { label: "Denominazione Cantiere", value: cantiere.nome },
    { label: "Ubicazione / Indirizzo", value: cantiere.indirizzo },
    { label: "Committente", value: `${cantiere.cliente}${isFieldFilled(dnlData.committenteCodiceFiscale) ? ` (C.F.: ${dnlData.committenteCodiceFiscale})` : ''}` },
    { label: "Tipologia dei Lavori", value: tipoLavoriVal },
    { label: "Natura Giuridica Appalto", value: naturaAppaltoVal },
    { label: "Titolo Abilitativo (Pratica)", value: praticaParts },
    { label: "Notifica Preliminare ASL/ITL", value: notificaParts },
    { label: "Codice CIG", value: dnlData.cig },
    { label: "Codice CUP", value: dnlData.cup },
    { label: "Data Inizio Lavori", value: formatDateItalian(cantiere.dataInizio) },
    { label: "Data Consegna Lavori", value: formatDateItalian(cantiere.dataConsegna || cantiere.scadenza) },
    { label: "Scadenza Denuncia DNL", value: formatDateItalian(cantiere.scadenzaDNL) },
  ].filter(r => isFieldFilled(r.value));

  // Riquadro 3: Figure Tecniche & Sicurezza (NO DIRETTORE LAVORI!)
  const coordSicurezza = dnlData.coordinatoreSicurezza || cantiere.tecnici?.find(t => /sicurezza|cse/i.test(t.ruolo))?.nome || '';
  const capocantiere = dnlData.capocantiere || cantiere.tecnici?.find(t => /capocantiere|preposto/i.test(t.ruolo))?.nome || '';
  const respLavori = dnlData.responsabileLavori || '';

  const sicurezzaRows = [
    { label: "Progettista", value: dnlData.progettistaNome },
    { label: "Telefono Progettista", value: dnlData.progettistaTelefono },
    { label: "Email Progettista", value: dnlData.progettistaEmail },
    { label: "PEC Progettista", value: dnlData.progettistaPec },
    { label: "Coordinatore Sicurezza (CSE)", value: coordSicurezza },
    { label: "Capocantiere / Preposto", value: capocantiere },
    { label: "Responsabile dei Lavori", value: respLavori },
  ].filter(r => isFieldFilled(r.value));

  // Render HTML per la finestra di stampa
  const renderTableRows = (rows: { label: string; value: any }[]) => {
    return rows.map(r => `
      <tr>
        <td style="padding: 5px 8px; border: 1px solid #cbd5e1; font-weight: bold; width: 35%; background: #f8fafc;">${r.label}</td>
        <td style="padding: 5px 8px; border: 1px solid #cbd5e1;">${r.value}</td>
      </tr>
    `).join('');
  };

  const printHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>DNL - ${cantiere.nome}</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; font-size: 9pt; color: #0f172a; margin: 20px; line-height: 1.35; }
        .header { background: #0f172a; color: white; padding: 14px 18px; border-radius: 6px; margin-bottom: 14px; }
        .header h1 { margin: 0 0 4px 0; font-size: 14pt; text-transform: uppercase; letter-spacing: 0.5px; }
        .header p { margin: 0; font-size: 8pt; color: #93c5fd; }
        .section-title { background: #334155; color: white; padding: 5px 8px; font-weight: bold; font-size: 8.5pt; text-transform: uppercase; margin-top: 14px; border-radius: 4px 4px 0 0; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 10px; font-size: 8.5pt; }
        .economic-header { background: #059669 !important; }
        .sub-header { background: #d97706 !important; }
        .signatures { margin-top: 25px; page-break-inside: avoid; }
        @media print {
          body { margin: 0; }
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Scheda di Denuncia di Nuovo Lavoro (D.N.L.)</h1>
        <p>CASSA EDILE / EDILCASSA (CNCE) & INAIL • Cantiere: <strong>${cantiere.nome.toUpperCase()}</strong> • Tipologia Lavori: <strong>${tipoLavoriVal.toUpperCase()}</strong> • Data: <strong>${oggi}</strong></p>
      </div>

      ${impresaRows.length > 0 ? `
        <div class="section-title">Riquadro 1: Dati Impresa Esecutrice</div>
        <table>${renderTableRows(impresaRows)}</table>
      ` : ''}

      ${cantiereRows.length > 0 ? `
        <div class="section-title" style="background: #2563eb;">Riquadro 2: Cantiere & Titolo Abilitativo</div>
        <table>${renderTableRows(cantiereRows)}</table>
      ` : ''}

      ${sicurezzaRows.length > 0 ? `
        <div class="section-title" style="background: #475569;">Riquadro 3: Responsabili della Sicurezza</div>
        <table>${renderTableRows(sicurezzaRows)}</table>
      ` : ''}

      <div class="section-title economic-header">Riquadro 4: Valori Economici</div>
      <table>
        <tr>
          <td style="padding: 6px 8px; border: 1px solid #cbd5e1; font-weight: bold; width: 35%; background: #f8fafc;">Importo Complessivo Opera</td>
          <td style="padding: 6px 8px; border: 1px solid #cbd5e1; font-weight: bold;">€ ${(cantiere.importoTotale || 0).toLocaleString('it-IT', { minimumFractionDigits: 2 })}</td>
        </tr>
        <tr>
          <td style="padding: 6px 8px; border: 1px solid #cbd5e1; font-weight: bold; background: #f8fafc;">Opere Edili (Cassa Edile)</td>
          <td style="padding: 6px 8px; border: 1px solid #cbd5e1; font-weight: bold;">€ ${impEdile.toLocaleString('it-IT', { minimumFractionDigits: 2 })}</td>
        </tr>
        <tr>
          <td style="padding: 6px 8px; border: 1px solid #cbd5e1; font-weight: bold; background: #f8fafc;">Subappalti Totale</td>
          <td style="padding: 6px 8px; border: 1px solid #cbd5e1; font-weight: bold;">€ ${subappaltiTotale.toLocaleString('it-IT', { minimumFractionDigits: 2 })}</td>
        </tr>
      </table>

      ${cantiere.subappalti && cantiere.subappalti.length > 0 ? `
        <div class="section-title sub-header">Ditte in Subappalto (${cantiere.subappalti.length})</div>
        <table>
          <thead>
            <tr style="background: #f1f5f9;">
              <th style="padding: 5px 8px; border: 1px solid #cbd5e1; width: 4%;">#</th>
              <th style="padding: 5px 8px; border: 1px solid #cbd5e1; text-align: left;">Impresa Subappaltatrice</th>
              <th style="padding: 5px 8px; border: 1px solid #cbd5e1; text-align: left; width: 17%;">P.IVA / C.F.</th>
              <th style="padding: 5px 8px; border: 1px solid #cbd5e1; text-align: left; width: 24%;">Contatti (Email / PEC)</th>
              <th style="padding: 5px 8px; border: 1px solid #cbd5e1; text-align: left;">Lavorazione</th>
              <th style="padding: 5px 8px; border: 1px solid #cbd5e1; text-align: right; width: 16%;">Importo (€)</th>
            </tr>
          </thead>
          <tbody>
            ${cantiere.subappalti.map((s, i) => {
              const contattiHtml = [
                s.email ? `<div><a href="mailto:${s.email}" style="color:#0f172a;text-decoration:none;">${s.email}</a></div>` : '',
                s.pec ? `<div style="font-size:7pt;color:#2563eb;"><strong>PEC:</strong> ${s.pec}</div>` : ''
              ].filter(Boolean).join('');
              return `
              <tr>
                <td style="padding: 5px 8px; border: 1px solid #cbd5e1; text-align: center;">${i + 1}</td>
                <td style="padding: 5px 8px; border: 1px solid #cbd5e1; font-weight: bold;">${s.azienda}</td>
                <td style="padding: 5px 8px; border: 1px solid #cbd5e1; font-family: monospace; font-size: 8pt;">${s.partitaIva || '-'}</td>
                <td style="padding: 5px 8px; border: 1px solid #cbd5e1; font-size: 7.5pt;">${contattiHtml || '-'}</td>
                <td style="padding: 5px 8px; border: 1px solid #cbd5e1;">${s.lavoro}</td>
                <td style="padding: 5px 8px; border: 1px solid #cbd5e1; text-align: right; font-weight: bold;">€ ${s.prezzoOriginale.toLocaleString('it-IT', { minimumFractionDigits: 2 })}</td>
              </tr>
            `;
            }).join('')}
          </tbody>
        </table>
      ` : ''}

      ${isFieldFilled(dnlData.noteDNL) ? `
        <div class="section-title" style="background: #475569;">Note Integrative</div>
        <div style="padding: 8px; border: 1px solid #cbd5e1; background: #f8fafc; font-size: 8pt; margin-bottom: 14px;">
          ${dnlData.noteDNL}
        </div>
      ` : ''}

      <div class="signatures">
        <p style="font-size: 7.5pt; color: #64748b; margin-bottom: 12px;">
          Dichiarazione resa ai sensi del D.P.R. 445/2000 per l'inoltro agli enti previdenziali e Cassa Edile.
        </p>
        <div style="margin-top: 18px;">
          <strong style="font-size: 8.5pt;">TIMBRO E FIRMA DEL LEGALE RAPPRESENTANTE DELL'IMPRESA:</strong>
          <div style="border-bottom: 1.5px solid #94a3b8; width: 240px; margin-top: 30px;"></div>
        </div>
      </div>

      <script>
        window.onload = function() {
          window.print();
        };
      </script>
    </body>
    </html>
  `;

  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.open();
    printWindow.document.write(printHtml);
    printWindow.document.close();
  }
}

