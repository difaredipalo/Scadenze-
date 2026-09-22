import { PosDocument } from '../../types';

export interface PosAuditItem {
  id: string;
  sezione: string;
  titolo: string;
  stato: 'ok' | 'warning' | 'missing';
  dettaglio: string;
  suggerimento?: string;
}

export interface PosAuditResult {
  percentualeCompletamento: number;
  conteggioOk: number;
  conteggioWarning: number;
  conteggioMissing: number;
  items: PosAuditItem[];
  statoGlobale: 'completo' | 'da_completare' | 'critico';
  noteLegali: string;
}

export function auditPosDocument(pos: PosDocument): PosAuditResult {
  const items: PosAuditItem[] = [];

  // 1. DATI IMPRESA
  if (!pos.datiImpresa.ragioneSociale || pos.datiImpresa.ragioneSociale.trim().length === 0) {
    items.push({
      id: 'imp_ragione_sociale',
      sezione: 'Dati Impresa',
      titolo: 'Ragione Sociale Impresa',
      stato: 'missing',
      dettaglio: 'Dato non presente – inserire la denominazione esatta dell’impresa.',
      suggerimento: 'Compilare nella scheda Impresa o nelle Impostazioni del gestionale.',
    });
  } else {
    items.push({
      id: 'imp_ragione_sociale',
      sezione: 'Dati Impresa',
      titolo: 'Ragione Sociale Impresa',
      stato: 'ok',
      dettaglio: `${pos.datiImpresa.ragioneSociale}`,
    });
  }

  if (!pos.datiImpresa.partitaIva && !pos.datiImpresa.codiceFiscale) {
    items.push({
      id: 'imp_fiscale',
      sezione: 'Dati Impresa',
      titolo: 'P.IVA / Codice Fiscale Aziendale',
      stato: 'missing',
      dettaglio: 'Dato fiscale mancante (obbligatorio per identificare l’esecutore).',
      suggerimento: 'Inserire Partita IVA o Codice Fiscale.',
    });
  } else {
    items.push({
      id: 'imp_fiscale',
      sezione: 'Dati Impresa',
      titolo: 'Dati Fiscali Azienda',
      stato: 'ok',
      dettaglio: `P.IVA: ${pos.datiImpresa.partitaIva || 'N.D.'} | CF: ${pos.datiImpresa.codiceFiscale || 'N.D.'}`,
    });
  }

  // 2. SOGGETTI DELLA SICUREZZA AZIENDALE
  if (!pos.datiImpresa.datoreDiLavoro || pos.datiImpresa.datoreDiLavoro.toLowerCase().includes('indicare')) {
    items.push({
      id: 'sogg_datore',
      sezione: 'Figure della Sicurezza',
      titolo: 'Datore di Lavoro',
      stato: 'missing',
      dettaglio: 'Nominativo del Datore di Lavoro non indicato.',
      suggerimento: 'Il Datore di Lavoro è il titolare dell’obbligo di redazione del POS (art. 89 e 96 D.Lgs. 81/08).',
    });
  } else {
    items.push({
      id: 'sogg_datore',
      sezione: 'Figure della Sicurezza',
      titolo: 'Datore di Lavoro',
      stato: 'ok',
      dettaglio: `${pos.datiImpresa.datoreDiLavoro}`,
    });
  }

  if (!pos.datiImpresa.rspp || pos.datiImpresa.rspp.trim().length === 0) {
    items.push({
      id: 'sogg_rspp',
      sezione: 'Figure della Sicurezza',
      titolo: 'RSPP (Resp. Servizio Prevenzione e Protezione)',
      stato: 'warning',
      dettaglio: 'RSPP non specificato espressamente.',
      suggerimento: 'Specificare se coincide con il Datore di Lavoro (art. 34) o con professionista esterno.',
    });
  } else {
    items.push({
      id: 'sogg_rspp',
      sezione: 'Figure della Sicurezza',
      titolo: 'RSPP Aziendale',
      stato: 'ok',
      dettaglio: `${pos.datiImpresa.rspp}`,
    });
  }

  if (!pos.datiImpresa.prepostoCantiere || pos.datiImpresa.prepostoCantiere.toLowerCase().includes('nominare')) {
    items.push({
      id: 'sogg_preposto',
      sezione: 'Figure della Sicurezza',
      titolo: 'Preposto / Capocantiere',
      stato: 'warning',
      dettaglio: 'Nominativo del preposto in cantiere da verificare.',
      suggerimento: 'Ai sensi dell’art. 19 D.Lgs. 81/08, indicare il lavoratore o capocantiere che sovrintende le attività.',
    });
  } else {
    items.push({
      id: 'sogg_preposto',
      sezione: 'Figure della Sicurezza',
      titolo: 'Preposto / Capocantiere',
      stato: 'ok',
      dettaglio: `${pos.datiImpresa.prepostoCantiere}`,
    });
  }

  // 3. DATI DEL CANTIERE
  if (!pos.datiCantiere.nome || pos.datiCantiere.nome.trim().length === 0) {
    items.push({
      id: 'cant_nome',
      sezione: 'Cantiere',
      titolo: 'Denominazione del Cantiere',
      stato: 'missing',
      dettaglio: 'Dato non presente – selezionare un cantiere dal gestionale o indicarne il nome.',
    });
  } else {
    items.push({
      id: 'cant_nome',
      sezione: 'Cantiere',
      titolo: 'Cantiere di Riferimento',
      stato: 'ok',
      dettaglio: `${pos.datiCantiere.nome}`,
    });
  }

  if (!pos.datiCantiere.indirizzo || pos.datiCantiere.indirizzo.toLowerCase().includes('precisare')) {
    items.push({
      id: 'cant_indirizzo',
      sezione: 'Cantiere',
      titolo: 'Ubicazione / Indirizzo del Cantiere',
      stato: 'warning',
      dettaglio: 'Indirizzo del cantiere incompleto o generico.',
      suggerimento: 'Indicare via, numero civico, comune e provincia esatti dell’area di lavoro.',
    });
  } else {
    items.push({
      id: 'cant_indirizzo',
      sezione: 'Cantiere',
      titolo: 'Ubicazione Cantiere',
      stato: 'ok',
      dettaglio: `${pos.datiCantiere.indirizzo}`,
    });
  }

  if (!pos.datiCantiere.committente || pos.datiCantiere.committente.trim().length === 0) {
    items.push({
      id: 'cant_committente',
      sezione: 'Cantiere',
      titolo: 'Committente dell’Opera',
      stato: 'warning',
      dettaglio: 'Committente non chiaramente specificato.',
    });
  } else {
    items.push({
      id: 'cant_committente',
      sezione: 'Cantiere',
      titolo: 'Committente',
      stato: 'ok',
      dettaglio: `${pos.datiCantiere.committente}`,
    });
  }

  if (!pos.datiCantiere.dataInizio || !pos.datiCantiere.dataFine) {
    items.push({
      id: 'cant_date',
      sezione: 'Cantiere',
      titolo: 'Date di Inizio e Fine Lavori',
      stato: 'warning',
      dettaglio: 'Date temporali presunte dei lavori non complete.',
    });
  } else {
    items.push({
      id: 'cant_date',
      sezione: 'Cantiere',
      titolo: 'Cronoprogramma Lavori',
      stato: 'ok',
      dettaglio: `Inizio: ${pos.datiCantiere.dataInizio} • Consegna: ${pos.datiCantiere.dataFine} (Durata: ${pos.datiCantiere.durataGiorniPresunti} gg)`,
    });
  }

  // 4. PERSONALE ASSEGNATO
  if (!pos.lavoratori || pos.lavoratori.length === 0) {
    items.push({
      id: 'pers_lista',
      sezione: 'Personale',
      titolo: 'Personale Operante in Cantiere',
      stato: 'missing',
      dettaglio: 'Nessun lavoratore inserito nel POS (All. XV punto 2.1 lett. d).',
      suggerimento: 'Selezionare i lavoratori impiegati partendo dall’anagrafica del personale.',
    });
  } else {
    const withoutMedical = pos.lavoratori.filter(l => !l.dataVisitaMedica || l.dataVisitaMedica.trim().length === 0);
    if (withoutMedical.length > 0) {
      items.push({
        id: 'pers_visite',
        sezione: 'Personale',
        titolo: 'Idoneità Sanitaria Lavoratori',
        stato: 'warning',
        dettaglio: `${withoutMedical.length} lavoratore/i senza data di visita medica specificata (${withoutMedical.map(l => l.cognome).join(', ')}).`,
        suggerimento: 'Verificare sul gestionale la scadenza della visita medica periodica.',
      });
    } else {
      items.push({
        id: 'pers_lista',
        sezione: 'Personale',
        titolo: 'Lavoratori Assegnati e Idoneità',
        stato: 'ok',
        dettaglio: `${pos.lavoratori.length} dipendenti assegnati con idoneità sanitaria verificata.`,
      });
    }
  }

  // 5. ATTIVITÀ E FASI LAVORATIVE
  if (!pos.attivita || pos.attivita.length === 0) {
    items.push({
      id: 'att_lista',
      sezione: 'Lavorazioni & Rischi',
      titolo: 'Schede di Lavorazione',
      stato: 'missing',
      dettaglio: 'Nessuna attività o fase di lavoro selezionata nel POS.',
      suggerimento: 'Selezionare almeno un’attività dalla libreria o crearne una personalizzata.',
    });
  } else {
    items.push({
      id: 'att_lista',
      sezione: 'Lavorazioni & Rischi',
      titolo: 'Schede di Lavorazione Definite',
      stato: 'ok',
      dettaglio: `${pos.attivita.length} attività operative previste per il cantiere.`,
    });

    // Controllo coerenza rischi per lavori in quota
    const hasQuota = pos.attivita.some(a => /quota|ponteggi|copertur|tett/i.test(a.nome) || /quota|caduta/i.test(a.descrizione));
    const hasImbracatura = pos.dpiRichiesti.some(d => /imbracatura|anticaduta/i.test(d)) ||
      pos.attivita.some(a => a.dpiNecessari.some(d => /imbracatura|anticaduta/i.test(d)));

    if (hasQuota && !hasImbracatura) {
      items.push({
        id: 'coerenza_quota',
        sezione: 'Lavorazioni & Rischi',
        titolo: 'Coerenza Lavori in Quota & DPI',
        stato: 'warning',
        dettaglio: 'Sono previsti lavori in quota o su coperture, ma l’imbracatura anticaduta non risulta tra i DPI selezionati.',
        suggerimento: 'Aggiungere "Imbracatura completa anticaduta UNI EN 361" alla sezione DPI.',
      });
    }
  }

  // 6. DPI
  const hasCasco = pos.dpiRichiesti.some(d => /casco|elmetto/i.test(d));
  const hasScarpe = pos.dpiRichiesti.some(d => /calzatur|scarp/i.test(d));
  if (!hasCasco || !hasScarpe) {
    items.push({
      id: 'dpi_base',
      sezione: 'DPI',
      titolo: 'Dispositivi di Protezione Individuale di Base',
      stato: 'missing',
      dettaglio: 'DPI obbligatori di cantiere mancanti (Casco protettivo EN 397 o Scarpe S3).',
      suggerimento: 'Selezionare elmetto e scarpe antinfortunistiche nella scheda DPI.',
    });
  } else {
    items.push({
      id: 'dpi_base',
      sezione: 'DPI',
      titolo: 'DPI di Protezione Individuale',
      stato: 'ok',
      dettaglio: `${pos.dpiRichiesti.length} tipologie di DPI individuate e prescritte.`,
    });
  }

  // 7. ATTREZZATURE
  if (!pos.attrezzature || pos.attrezzature.length === 0) {
    items.push({
      id: 'attr_lista',
      sezione: 'Attrezzature',
      titolo: 'Attrezzature e Macchinari di Cantiere',
      stato: 'warning',
      dettaglio: 'Nessuna attrezzatura inserita nell’elenco macchine e utensili.',
      suggerimento: 'Indicare ponteggi, utensili elettrici, scale o macchine operatrici usate.',
    });
  } else {
    items.push({
      id: 'attr_lista',
      sezione: 'Attrezzature',
      titolo: 'Elenco Attrezzature di Cantiere',
      stato: 'ok',
      dettaglio: `${pos.attrezzature.length} attrezzature/macchine censite con verifica conformità CE.`,
    });
  }

  // 8. PIANO EMERGENZE E SOCCORSI
  if (!pos.emergenza.ospedaleRiferimento || pos.emergenza.prontoSoccorsoIndirizzo.toLowerCase().includes('completare')) {
    items.push({
      id: 'emg_ospedale',
      sezione: 'Emergenze & Soccorsi',
      titolo: 'Presidio Ospedaliero di Riferimento',
      stato: 'warning',
      dettaglio: 'Indirizzo del Pronto Soccorso più vicino da completare con precisione.',
      suggerimento: 'Specificare ospedale, indirizzo e tempo di percorrenza per i soccorsi.',
    });
  } else {
    items.push({
      id: 'emg_ospedale',
      sezione: 'Emergenze & Soccorsi',
      titolo: 'Pronto Soccorso e Soccorsi',
      stato: 'ok',
      dettaglio: `${pos.emergenza.ospedaleRiferimento} - ${pos.emergenza.prontoSoccorsoIndirizzo}`,
    });
  }

  if (!pos.datiImpresa.addettoPrimoSoccorso || pos.datiImpresa.addettoPrimoSoccorso.toLowerCase().includes('nominare')) {
    items.push({
      id: 'emg_addetto_ps',
      sezione: 'Emergenze & Soccorsi',
      titolo: 'Addetto al Primo Soccorso in Cantiere',
      stato: 'warning',
      dettaglio: 'Addetto al primo soccorso non formalmente indicato.',
      suggerimento: 'Indicare il nominativo del dipendente in possesso di attestato D.M. 388/03.',
    });
  }

  // 9. ALLEGATI DOCUMENTALI
  const durcAllegato = pos.allegati.find(a => a.id === 'all_1');
  if (!durcAllegato || !durcAllegato.allegatoPresente) {
    items.push({
      id: 'all_durc',
      sezione: 'Documentazione',
      titolo: 'DURC Regolare',
      stato: 'warning',
      dettaglio: 'DURC non contrassegnato come presente o da verificare.',
      suggerimento: 'Accertarsi della regolarità contributiva prima dell’avvio del cantiere.',
    });
  } else {
    items.push({
      id: 'all_durc',
      sezione: 'Documentazione',
      titolo: 'DURC e Idoneità Tecnico-Professionale',
      stato: 'ok',
      dettaglio: 'DURC e requisiti All. XVII contrassegnati come acquisiti.',
    });
  }

  // Calcola statistiche
  const conteggioOk = items.filter(i => i.stato === 'ok').length;
  const conteggioWarning = items.filter(i => i.stato === 'warning').length;
  const conteggioMissing = items.filter(i => i.stato === 'missing').length;
  const totale = items.length;

  const punteggio = Math.round(((conteggioOk * 1.0 + conteggioWarning * 0.5) / (totale || 1)) * 100);

  let statoGlobale: 'completo' | 'da_completare' | 'critico' = 'completo';
  if (conteggioMissing > 0) {
    statoGlobale = 'critico';
  } else if (conteggioWarning > 0) {
    statoGlobale = 'da_completare';
  }

  return {
    percentualeCompletamento: Math.min(100, Math.max(0, punteggio)),
    conteggioOk,
    conteggioWarning,
    conteggioMissing,
    items,
    statoGlobale,
    noteLegali:
      'AVVISO NORMATIVO IMPORTANTE: Il controllo automatico verifica la presenza strutturale dei contenuti minimi obbligatori di cui all’Allegato XV del D.Lgs. 81/2008 e s.m.i. La presente verifica formale non sostituisce la valutazione professionale e non dichiara in automatico che il cantiere sia conforme: il documento deve essere verificato e sottoscritto dal Datore di Lavoro, dal Preposto, dal RSPP e condiviso con il RLS e il Coordinatore per la Sicurezza (CSE) prima dell’ingresso in cantiere.',
  };
}
