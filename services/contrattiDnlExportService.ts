import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { Cantiere, AppSettings, Personale, DnlData } from '../types';

/**
 * Esporta il contratto in formato Word (.doc)
 */
export function exportContractToWord(contractText: string, cantiereName: string, nomeAzienda: string) {
  const htmlContent = `
    <!DOCTYPE html>
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset='utf-8'>
      <title>${cantiereName} - Contratto</title>
      <style>
        body { font-family: 'Times New Roman', Times, serif; font-size: 12pt; line-height: 1.5; color: #111; margin: 2.5cm; }
        h1, h2, h3 { text-align: center; text-transform: uppercase; }
        p { margin-bottom: 0.8em; text-align: justify; }
        .footer { margin-top: 50px; }
      </style>
    </head>
    <body>
      <div style="border-bottom: 2px solid #333; padding-bottom: 8px; margin-bottom: 20px;">
        <strong style="font-size: 14pt;">${nomeAzienda}</strong><br/>
        <span style="font-size: 9pt; color: #666;">Documento Contrattuale di Cantiere</span>
      </div>
      <div style="white-space: pre-wrap; font-family: 'Times New Roman', Times, serif;">${contractText}</div>
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
  a.download = `Contratto_${safeName}_${new Date().toISOString().split('T')[0]}.doc`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Esporta il contratto in PDF professionale con intestazione, logo, numerazione pagine e firme
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

  // Suddivisione testo
  doc.setFont('times', 'normal');
  doc.setFontSize(10.5);
  doc.setTextColor(15, 23, 42);

  const lines = doc.splitTextToSize(contractText, contentWidth);
  let cursorY = marginTop + 4;
  const lineHeight = 5.2;

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
      
      doc.setFont('times', 'normal');
      doc.setFontSize(10.5);
      doc.setTextColor(15, 23, 42);
    }

    // Se la riga sembra un titolo di articolo, rendila in grassetto
    if (/^(ART\.|ARTICOLO|PREMESSO|SI CONVIENE|TRA|E$|PREMESSA|CONTRATTO)/i.test(line.trim())) {
      doc.setFont('times', 'bold');
      doc.text(line, marginX, cursorY);
      doc.setFont('times', 'normal');
    } else {
      doc.text(line, marginX, cursorY);
    }

    cursorY += lineHeight;
  });

  // Numerazione pagine in piè di pagina
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.setDrawColor(226, 232, 240);
    doc.line(marginX, pageHeight - 15, pageWidth - marginX, pageHeight - 15);
    doc.text(`Pagina ${i} di ${totalPages}`, pageWidth - marginX, pageHeight - 10, { align: 'right' });
    doc.text(`Documento contrattuale generato il ${new Date().toLocaleDateString('it-IT')}`, marginX, pageHeight - 10);
  }

  const safeName = cantiere.nome.replace(/[^a-zA-Z0-9_-]/g, '_');
  doc.save(`Contratto_${safeName}_${new Date().toISOString().split('T')[0]}.pdf`);
}

/**
 * Esporta il file DNL in formato testo strutturato (.TXT)
 * Contiene tutti i campi necessari per aprire la DNL su Cassa Edile / INAIL
 */
export function exportDnlToTxt(
  cantiere: Cantiere,
  settings: AppSettings,
  dnlData: DnlData,
  personaleAssegnato: Personale[]
): string {
  const oggi = new Date().toLocaleDateString('it-IT');
  const sep = '='.repeat(70);
  const subSep = '-'.repeat(70);

  let out = '';
  out += `${sep}\n`;
  out += `FASCICOLO TELEMATICO DNL - DENUNCIA DI NUOVO LAVORO (EDILIZIA)\n`;
  out += `Adempimento obbligatorio Cassa Edile / Edilcassa (CNCE) e INAIL\n`;
  out += `Generato il: ${oggi} da ${settings.nomeAzienda}\n`;
  out += `${sep}\n\n`;

  out += `[1] DATI DELL'IMPRESA ESECUTRICE\n${subSep}\n`;
  out += `Ragione Sociale:           ${settings.nomeAzienda}\n`;
  out += `Codice Fiscale / P.IVA:     ${settings.partitaIva || settings.codiceFiscaleAzienda || 'N.D.'}\n`;
  out += `Sede Legale:               ${settings.indirizzoSede || 'N.D.'}\n`;
  out += `PEC Impresa:               ${settings.pec || 'N.D.'}\n`;
  out += `Recapito Telefonico:       ${settings.telefonoAzienda || 'N.D.'}\n`;
  out += `Rappresentante Legale:     ${settings.rappresentanteLegale || 'N.D.'}\n`;
  out += `Codice Cassa Edile:        ${dnlData.codiceCassaEdile || settings.codiceCassaEdile || 'N.D.'}\n`;
  out += `Codice Ditta & PAT INAIL:  ${dnlData.patInail || settings.patInail || 'N.D.'}\n`;
  out += `Matricola Aziendale INPS:  ${dnlData.matricolaInps || settings.matricolaInps || 'N.D.'}\n`;
  out += `CCNL Applicato:            ${dnlData.ccnl || settings.ccnlApplicato || 'Edilizia Industria / Artigianato'}\n\n`;

  out += `[2] DATI DEL CANTIERE E UBICAZIONE OPERE\n${subSep}\n`;
  out += `Denominazione Cantiere:    ${cantiere.nome}\n`;
  out += `Indirizzo e N. Civico:     ${cantiere.indirizzo || 'N.D.'}\n`;
  out += `Tipologia Intervento:      ${dnlData.tipoLavoro || 'Ristrutturazione / Manutenzione Straordinaria'}\n`;
  out += `Natura Giuridica:          ${(dnlData.naturaAppalto || 'privato').toUpperCase()}\n`;
  if (dnlData.cig) out += `Codice CIG:                ${dnlData.cig}\n`;
  if (dnlData.cup) out += `Codice CUP:                ${dnlData.cup}\n`;
  out += `Stato Cantiere:            ${cantiere.stato.toUpperCase()}\n\n`;

  out += `[3] TITOLO ABILITATIVO E PRATICA EDILIZIA\n${subSep}\n`;
  out += `Titolo Abilitativo:        ${dnlData.titoloAbilitativoTipo || 'CILA / SCIA / Permesso Costruire'}\n`;
  out += `Numero Pratica / Prot.:    ${dnlData.titoloAbilitativoNumero || 'N.D.'}\n`;
  out += `Data Rilascio / Deposito:  ${dnlData.titoloAbilitativoData || 'N.D.'}\n`;
  out += `Comune di Riferimento:     ${dnlData.titoloAbilitativoComune || 'N.D.'}\n`;
  out += `Notifica Preliminare ASL:  ${dnlData.protocolloNotificaPreliminare ? `Prot. ${dnlData.protocolloNotificaPreliminare} del ${dnlData.dataNotificaPreliminare || '-'}` : 'Non necessaria / Esente'}\n\n`;

  out += `[4] DATI DEL COMMITTENTE\n${subSep}\n`;
  out += `Nominativo / Rag. Sociale: ${cantiere.cliente}\n`;
  out += `Codice Fiscale / P.IVA:     ${dnlData.committenteCodiceFiscale || 'N.D.'}\n`;
  out += `Indirizzo Residenza / Sede:${dnlData.committenteIndirizzo || 'N.D.'}\n`;
  out += `Contatti (PEC / Tel):      ${dnlData.committentePecTelefono || 'N.D.'}\n\n`;

  out += `[5] FIGURE TECNICHE E RESPONSABILI DELLA SICUREZZA\n${subSep}\n`;
  out += `Direttore dei Lavori (DL): ${cantiere.direttoreLavori || 'N.D.'}\n`;
  out += `Coord. Sicurezza Esecuz.:  ${dnlData.coordinatoreSicurezza || cantiere.tecnici.find(t => /sicurezza|cse/i.test(t.ruolo))?.nome || 'N.D.'}\n`;
  out += `Responsabile dei Lavori:   ${dnlData.responsabileLavori || 'N.D.'}\n`;
  out += `Capocantiere / Preposto:   ${dnlData.capocantiere || cantiere.tecnici.find(t => /capocantiere|preposto/i.test(t.ruolo))?.nome || 'N.D.'}\n\n`;

  out += `[6] VALORI ECONOMICI E CONGRUITÀ MANODOPERA (D.M. 143/2021)\n${subSep}\n`;
  out += `Valore Complessivo Opera:  € ${(cantiere.importoTotale || 0).toLocaleString('it-IT')}\n`;
  out += `Importo Lavori Edili:      € ${(dnlData.importoEdile !== undefined ? dnlData.importoEdile : cantiere.importoTotale).toLocaleString('it-IT')}\n`;
  out += `Oneri Sicurezza (no rib.): € ${(dnlData.oneriSicurezza || 0).toLocaleString('it-IT')}\n`;
  out += `Incidenza Minima Manodop.: ${dnlData.incidenzaManodoperaPerc || 14.28}%\n`;
  out += `Ore Lavorative Stimate:    ${dnlData.oreLavorativeStimate || 0} ore\n\n`;

  out += `[7] DATE, DURATA E SCADENZE CANTIERE\n${subSep}\n`;
  out += `Data Inizio Lavori:        ${cantiere.dataInizio || 'N.D.'}\n`;
  out += `Data Presunta Consegna:    ${cantiere.dataConsegna || cantiere.scadenza || 'N.D.'}\n`;
  out += `Termine Invio DNL:         ${cantiere.scadenzaDNL || 'Prima dell\'avvio lavori'}\n`;
  out += `Numero Operai Previsti:    ${dnlData.numeroOperaiStimati || personaleAssegnato.length || 0}\n\n`;

  out += `[8] OPERAI E MAESTRANZE ASSEGNATE AL CANTIERE (${personaleAssegnato.length})\n${subSep}\n`;
  if (personaleAssegnato.length === 0) {
    out += `Nessun lavoratore specificatamente associato (selezionare dal gestionale).\n`;
  } else {
    personaleAssegnato.forEach((p, idx) => {
      out += `${idx + 1}. ${p.cognome.toUpperCase()} ${p.nome} - Ruolo: ${p.ruolo} (${p.categoria})\n`;
      out += `   C.F.: ${p.codiceFiscale || 'N.D.'} | Assunzione: ${p.dataAssunzione || 'N.D.'} | Visita Medica: ${p.scadenzaVisitaMedica || 'N.D.'}\n`;
    });
  }
  out += `\n`;

  out += `[9] DITTE IN SUBAPPALTO E LAVORATORI AUTONOMI (${cantiere.subappalti.length})\n${subSep}\n`;
  if (cantiere.subappalti.length === 0) {
    out += `Nessuna ditta in subappalto dichiarata.\n`;
  } else {
    cantiere.subappalti.forEach((s, idx) => {
      out += `${idx + 1}. Ditta: ${s.azienda} | Lavorazione: ${s.lavoro} | Importo: € ${s.prezzoOriginale.toLocaleString('it-IT')}\n`;
    });
  }
  out += `\n`;

  if (dnlData.noteDNL) {
    out += `[10] NOTE INTEGRATIVE DNL\n${subSep}\n${dnlData.noteDNL}\n\n`;
  }

  out += `${sep}\nFINE FASCICOLO DATI DNL\n${sep}\n`;
  return out;
}

/**
 * Esporta il file DNL in TXT scaricabile
 */
export function downloadDnlTxtFile(
  cantiere: Cantiere,
  settings: AppSettings,
  dnlData: DnlData,
  personaleAssegnato: Personale[]
) {
  const content = exportDnlToTxt(cantiere, settings, dnlData, personaleAssegnato);
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const safeName = cantiere.nome.replace(/[^a-zA-Z0-9_-]/g, '_');
  a.download = `FILE_DATI_DNL_${safeName}_${new Date().toISOString().split('T')[0]}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Esporta il file DNL in JSON scaricabile
 */
export function downloadDnlJsonFile(
  cantiere: Cantiere,
  settings: AppSettings,
  dnlData: DnlData,
  personaleAssegnato: Personale[]
) {
  const fullDnlObject = {
    tipoDocumento: "DNL - Denuncia di Nuovo Lavoro",
    dataGenerazione: new Date().toISOString(),
    impresa: {
      ragioneSociale: settings.nomeAzienda,
      partitaIva: settings.partitaIva || settings.codiceFiscaleAzienda,
      sedeLegale: settings.indirizzoSede,
      pec: settings.pec,
      telefono: settings.telefonoAzienda,
      legaleRappresentante: settings.rappresentanteLegale,
      codiceCassaEdile: dnlData.codiceCassaEdile || settings.codiceCassaEdile,
      matricolaInps: dnlData.matricolaInps || settings.matricolaInps,
      patInail: dnlData.patInail || settings.patInail,
      ccnl: dnlData.ccnl || settings.ccnlApplicato,
    },
    cantiere: {
      id: cantiere.id,
      nome: cantiere.nome,
      indirizzo: cantiere.indirizzo,
      cliente: cantiere.cliente,
      stato: cantiere.stato,
      dataInizio: cantiere.dataInizio,
      dataConsegna: cantiere.dataConsegna || cantiere.scadenza,
      scadenzaDNL: cantiere.scadenzaDNL,
      importoTotale: cantiere.importoTotale,
    },
    praticaEdilizia: {
      tipoLavoro: dnlData.tipoLavoro,
      naturaAppalto: dnlData.naturaAppalto,
      cig: dnlData.cig,
      cup: dnlData.cup,
      titoloAbilitativoTipo: dnlData.titoloAbilitativoTipo,
      titoloAbilitativoNumero: dnlData.titoloAbilitativoNumero,
      titoloAbilitativoData: dnlData.titoloAbilitativoData,
      titoloAbilitativoComune: dnlData.titoloAbilitativoComune,
      notificaPreliminareProtocollo: dnlData.protocolloNotificaPreliminare,
      notificaPreliminareData: dnlData.dataNotificaPreliminare,
    },
    committente: {
      nominativo: cantiere.cliente,
      codiceFiscale: dnlData.committenteCodiceFiscale,
      indirizzo: dnlData.committenteIndirizzo,
      contatti: dnlData.committentePecTelefono,
    },
    sicurezzaETecnici: {
      direttoreLavori: cantiere.direttoreLavori,
      coordinatoreSicurezza: dnlData.coordinatoreSicurezza,
      responsabileLavori: dnlData.responsabileLavori,
      capocantiere: dnlData.capocantiere,
    },
    valoriEconomici: {
      importoTotale: cantiere.importoTotale,
      importoEdile: dnlData.importoEdile !== undefined ? dnlData.importoEdile : cantiere.importoTotale,
      oneriSicurezza: dnlData.oneriSicurezza || 0,
      incidenzaManodoperaPerc: dnlData.incidenzaManodoperaPerc || 14.28,
      oreLavorativeStimate: dnlData.oreLavorativeStimate || 0,
    },
    operaiAssegnati: personaleAssegnato.map(p => ({
      id: p.id,
      nominativo: `${p.cognome} ${p.nome}`,
      ruolo: p.ruolo,
      categoria: p.categoria,
      codiceFiscale: p.codiceFiscale,
      dataAssunzione: p.dataAssunzione,
      scadenzaVisitaMedica: p.scadenzaVisitaMedica
    })),
    subappalti: cantiere.subappalti.map(s => ({
      azienda: s.azienda,
      lavoro: s.lavoro,
      importo: s.prezzoOriginale
    })),
    note: dnlData.noteDNL
  };

  const blob = new Blob([JSON.stringify(fullDnlObject, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const safeName = cantiere.nome.replace(/[^a-zA-Z0-9_-]/g, '_');
  a.download = `DNL_DATI_${safeName}_${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Esporta il fascicolo DNL in foglio Excel (.xlsx) con schede dettagliate
 */
export function exportDnlToExcel(
  cantiere: Cantiere,
  settings: AppSettings,
  dnlData: DnlData,
  personaleAssegnato: Personale[]
) {
  const wb = XLSX.utils.book_new();

  // Foglio 1: Dati Generali DNL
  const generalData = [
    { Campo: "Denominazione Cantiere", Valore: cantiere.nome },
    { Campo: "Indirizzo Cantiere", Valore: cantiere.indirizzo || '' },
    { Campo: "Tipologia Lavori", Valore: dnlData.tipoLavoro || 'Ristrutturazione' },
    { Campo: "Natura Appalto", Valore: dnlData.naturaAppalto || 'privato' },
    { Campo: "Committente", Valore: cantiere.cliente },
    { Campo: "Codice Fiscale Committente", Valore: dnlData.committenteCodiceFiscale || '' },
    { Campo: "Impresa Esecutrice", Valore: settings.nomeAzienda },
    { Campo: "P.IVA / CF Impresa", Valore: settings.partitaIva || settings.codiceFiscaleAzienda || '' },
    { Campo: "Codice Cassa Edile", Valore: dnlData.codiceCassaEdile || settings.codiceCassaEdile || '' },
    { Campo: "PAT INAIL", Valore: dnlData.patInail || settings.patInail || '' },
    { Campo: "Matricola INPS", Valore: dnlData.matricolaInps || settings.matricolaInps || '' },
    { Campo: "CCNL", Valore: dnlData.ccnl || settings.ccnlApplicato || 'Edilizia' },
    { Campo: "Titolo Abilitativo", Valore: `${dnlData.titoloAbilitativoTipo || 'CILA'} N. ${dnlData.titoloAbilitativoNumero || '-'} del ${dnlData.titoloAbilitativoData || '-'}` },
    { Campo: "Notifica Preliminare", Valore: dnlData.protocolloNotificaPreliminare || 'Esente / Non presente' },
    { Campo: "Direttore Lavori", Valore: cantiere.direttoreLavori || '' },
    { Campo: "Coordinatore Sicurezza (CSE)", Valore: dnlData.coordinatoreSicurezza || '' },
    { Campo: "Importo Complessivo Opera (€)", Valore: cantiere.importoTotale || 0 },
    { Campo: "Importo Lavori Edili Cassa Edile (€)", Valore: dnlData.importoEdile !== undefined ? dnlData.importoEdile : cantiere.importoTotale },
    { Campo: "Oneri Sicurezza (€)", Valore: dnlData.oneriSicurezza || 0 },
    { Campo: "Incidenza Manodopera (%)", Valore: dnlData.incidenzaManodoperaPerc || 14.28 },
    { Campo: "Data Inizio Lavori", Valore: cantiere.dataInizio || '' },
    { Campo: "Data Fine / Consegna Lavori", Valore: cantiere.dataConsegna || cantiere.scadenza || '' },
    { Campo: "Scadenza Denuncia DNL", Valore: cantiere.scadenzaDNL || '' },
    { Campo: "Codice CIG (se pubblico)", Valore: dnlData.cig || '' },
    { Campo: "Codice CUP (se pubblico)", Valore: dnlData.cup || '' },
  ];
  const wsGeneral = XLSX.utils.json_to_sheet(generalData);
  XLSX.utils.book_append_sheet(wb, wsGeneral, "SCHEDA_DNL");

  // Foglio 2: Personale Assegnato
  const workersData = personaleAssegnato.map(p => ({
    Cognome: p.cognome,
    Nome: p.nome,
    Ruolo: p.ruolo,
    Categoria: p.categoria,
    Codice_Fiscale: p.codiceFiscale || '',
    Data_Assunzione: p.dataAssunzione || '',
    Visita_Medica: p.scadenzaVisitaMedica || '',
    Stato: p.inForza ? 'In Forza' : 'Cessato'
  }));
  const wsWorkers = XLSX.utils.json_to_sheet(workersData);
  XLSX.utils.book_append_sheet(wb, wsWorkers, "PERSONALE_DNL");

  // Foglio 3: Subappalti
  const subData = cantiere.subappalti.map(s => ({
    Azienda: s.azienda,
    Lavoro: s.lavoro,
    Importo_Lavori: s.prezzoOriginale,
    Maggiorazione_Perc: s.maggiorazione
  }));
  const wsSub = XLSX.utils.json_to_sheet(subData);
  XLSX.utils.book_append_sheet(wb, wsSub, "SUBAPPALTI");

  const safeName = cantiere.nome.replace(/[^a-zA-Z0-9_-]/g, '_');
  XLSX.writeFile(wb, `Fascicolo_DNL_${safeName}_${new Date().toISOString().split('T')[0]}.xlsx`);
}

/**
 * Esporta il fascicolo ufficiale DNL in PDF ad alta risoluzione
 */
export function exportDnlToPdf(
  cantiere: Cantiere,
  settings: AppSettings,
  dnlData: DnlData,
  personaleAssegnato: Personale[]
) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = 210;
  const marginX = 15;

  // Header
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
  doc.text(`Data: ${new Date().toLocaleDateString('it-IT')}`, pageWidth - marginX, 17, { align: 'right' });

  let y = 30;

  // Riquadro 1: Impresa
  (doc as any).autoTable({
    startY: y,
    margin: { left: marginX, right: marginX },
    head: [["RIQUADRO 1: DATI DELL'IMPRESA ESECUTRICE", "VALORE"]],
    body: [
      ["Ragione Sociale Impresa", settings.nomeAzienda],
      ["Partita IVA / Codice Fiscale", settings.partitaIva || settings.codiceFiscaleAzienda || "Da compilare"],
      ["Sede Legale / Indirizzo", settings.indirizzoSede || "Da compilare"],
      ["PEC & Telefono", `${settings.pec || '-'} • ${settings.telefonoAzienda || '-'}`],
      ["Codice Cassa Edile Impresa", dnlData.codiceCassaEdile || settings.codiceCassaEdile || "N.D."],
      ["Codice Ditta & PAT INAIL", dnlData.patInail || settings.patInail || "N.D."],
      ["Matricola Aziendale INPS", dnlData.matricolaInps || settings.matricolaInps || "N.D."],
      ["CCNL Applicato", dnlData.ccnl || settings.ccnlApplicato || "Edilizia Industria / PMI Artigianato"],
    ],
    theme: 'grid',
    headStyles: { fillColor: [30, 41, 59], textColor: 255, fontStyle: 'bold', fontSize: 8 },
    styles: { fontSize: 7.5, cellPadding: 1.6 },
    columnStyles: { 0: { cellWidth: 60, fontStyle: 'bold' } }
  });

  y = (doc as any).lastAutoTable.finalY + 4;

  // Riquadro 2: Cantiere & Titolo Abilitativo
  (doc as any).autoTable({
    startY: y,
    margin: { left: marginX, right: marginX },
    head: [["RIQUADRO 2: CANTIERE, COMMITTENTE E PRATICA EDILIZIA", "DETTAGLI"]],
    body: [
      ["Denominazione Cantiere", cantiere.nome],
      ["Ubicazione / Indirizzo", cantiere.indirizzo || "-"],
      ["Committente (Nome/Società)", `${cantiere.cliente} (CF/PIVA: ${dnlData.committenteCodiceFiscale || '-'})`],
      ["Tipologia Intervento & Appalto", `${dnlData.tipoLavoro || 'Ristrutturazione'} • Appalto: ${(dnlData.naturaAppalto || 'privato').toUpperCase()}`],
      ["Titolo Abilitativo (Pratica)", `${dnlData.titoloAbilitativoTipo || 'CILA/SCIA'} N. ${dnlData.titoloAbilitativoNumero || '-'} del ${dnlData.titoloAbilitativoData || '-'} (${dnlData.titoloAbilitativoComune || '-'})`],
      ["Notifica Preliminare ASL/ITL", dnlData.protocolloNotificaPreliminare ? `Prot. ${dnlData.protocolloNotificaPreliminare} del ${dnlData.dataNotificaPreliminare || '-'}` : "Non necessaria / Non presente"],
      ["Codici Gara (CIG / CUP)", `CIG: ${dnlData.cig || '-'} • CUP: ${dnlData.cup || '-'}`]
    ],
    theme: 'grid',
    headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: 'bold', fontSize: 8 },
    styles: { fontSize: 7.5, cellPadding: 1.6 },
    columnStyles: { 0: { cellWidth: 60, fontStyle: 'bold' } }
  });

  y = (doc as any).lastAutoTable.finalY + 4;

  // Riquadro 3: Valori Economici, Figure Tecniche & Date
  const impEdile = dnlData.importoEdile !== undefined ? dnlData.importoEdile : cantiere.importoTotale;
  (doc as any).autoTable({
    startY: y,
    margin: { left: marginX, right: marginX },
    head: [["RIQUADRO 3: VALORI ECONOMICI, FIGURE TECNICHE & TEMPI", "VALORI"]],
    body: [
      ["Importo Complessivo Lavori", `€ ${(cantiere.importoTotale || 0).toLocaleString('it-IT')}`],
      ["Importo Opere Edili (Cassa Edile)", `€ ${impEdile.toLocaleString('it-IT')}`],
      ["Oneri Sicurezza (D.Lgs. 81/08)", `€ ${(dnlData.oneriSicurezza || 0).toLocaleString('it-IT')}`],
      ["Incidenza Manodopera Stimata", `${dnlData.incidenzaManodoperaPerc || 14.28}% (stimati ${dnlData.oreLavorativeStimate || 0} ore/lavoro)`],
      ["Data Inizio - Consegna", `Dal ${cantiere.dataInizio || '-'} al ${cantiere.dataConsegna || cantiere.scadenza || '-'}`],
      ["Scadenza Denuncia DNL", cantiere.scadenzaDNL || "Prima dell'ingresso in cantiere"],
      ["Direttore Lavori & Coordinatore Sicurezza", `D.L.: ${cantiere.direttoreLavori || '-'} • CSE: ${dnlData.coordinatoreSicurezza || '-'}`],
    ],
    theme: 'grid',
    headStyles: { fillColor: [5, 150, 105], textColor: 255, fontStyle: 'bold', fontSize: 8 },
    styles: { fontSize: 7.5, cellPadding: 1.6 },
    columnStyles: { 0: { cellWidth: 60, fontStyle: 'bold' } }
  });

  y = (doc as any).lastAutoTable.finalY + 4;

  // Riquadro 4: Maestranze / Personale Assegnato
  const bodyWorkers = personaleAssegnato.length > 0
    ? personaleAssegnato.map((p, i) => [
        (i + 1).toString(),
        `${p.cognome} ${p.nome}`,
        p.codiceFiscale || "-",
        p.ruolo,
        p.categoria,
        p.dataAssunzione || "-",
        p.scadenzaVisitaMedica || "-"
      ])
    : [["-", "Nessun operaio assegnato specificatamente", "-", "-", "-", "-", "-"]];

  (doc as any).autoTable({
    startY: y,
    margin: { left: marginX, right: marginX },
    head: [["#", "Nominativo Lavoratore", "Codice Fiscale", "Ruolo / Mansione", "Cat.", "Assunzione", "Visita Med."]],
    body: bodyWorkers,
    theme: 'striped',
    headStyles: { fillColor: [30, 41, 59], textColor: 255, fontStyle: 'bold', fontSize: 7.5 },
    styles: { fontSize: 7, cellPadding: 1.5 },
    columnStyles: {
      0: { cellWidth: 8 },
      1: { cellWidth: 42, fontStyle: 'bold' },
      2: { cellWidth: 38 },
      3: { cellWidth: 34 },
      4: { cellWidth: 18 },
      5: { cellWidth: 20 },
      6: { cellWidth: 20 },
    }
  });

  y = (doc as any).lastAutoTable.finalY + 4;

  // Riquadro 5: Subappalti se presenti
  if (cantiere.subappalti.length > 0) {
    (doc as any).autoTable({
      startY: y,
      margin: { left: marginX, right: marginX },
      head: [["#", "Impresa Subappaltatrice", "Lavorazione Specializzata", "Importo Subappalto"]],
      body: cantiere.subappalti.map((s, i) => [
        (i + 1).toString(),
        s.azienda,
        s.lavoro,
        `€ ${s.prezzoOriginale.toLocaleString('it-IT')}`
      ]),
      theme: 'grid',
      headStyles: { fillColor: [217, 119, 6], textColor: 255, fontStyle: 'bold', fontSize: 7.5 },
      styles: { fontSize: 7, cellPadding: 1.5 },
      columnStyles: { 0: { cellWidth: 8 }, 1: { cellWidth: 60, fontStyle: 'bold' } }
    });
    y = (doc as any).lastAutoTable.finalY + 6;
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
  doc.save(`FASCICOLO_DNL_${safeName}_${new Date().toISOString().split('T')[0]}.pdf`);
}
