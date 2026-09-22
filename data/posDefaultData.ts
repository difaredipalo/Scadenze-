import {
  PosAttivitaTemplate,
  PosDocument,
  PosDocumentoAllegato,
  PosOrganizzazioneCantiere,
  PosPianoEmergenza,
  PosOperaProvvisionaleItem,
  PosSostanzaItem,
  PosAttrezzaturaItem,
  PosClasseRischio,
  PosContestoAmbientale,
  PosRischio,
  Cantiere,
  AppSettings,
  Personale,
} from '../types';

// ==================== CALCOLO MATRICE RISCHIO R = P x D (Cap. 8) ====================
export const CALCOLA_RISCHIO = (p: number = 2, d: number = 2): { r: number; classe: PosClasseRischio; livello: number } => {
  const pVal = Math.min(Math.max(p || 2, 1), 4);
  const dVal = Math.min(Math.max(d || 2, 1), 4);
  const r = pVal * dVal;
  let classe: PosClasseRischio = 'Basso';
  if (r <= 2) classe = 'Basso';
  else if (r <= 4) classe = 'Accettabile';
  else if (r <= 8) classe = 'Notevole';
  else classe = 'Elevato';
  return { r, classe, livello: r };
};

// Helper per identificare ed evidenziare dati non completati o mancanti
export const formatMissingData = (val: string | undefined | null, fallbackLabel: string = 'DATO'): string => {
  if (!val || typeof val !== 'string' || val.trim().length === 0) {
    return `[DA COMPLETARE / VERIFICARE: ${fallbackLabel}]`;
  }
  const clean = val.trim();
  const missingKeywords = ['da completare', 'da verificare', 'da indicare', 'da definire', 'da nominare', 'n.d.', 'non indicato'];
  if (missingKeywords.some(kw => clean.toLowerCase().includes(kw))) {
    return `[DA COMPLETARE / VERIFICARE: ${clean}]`;
  }
  return clean;
};

export const checkMissingData = (val: string | undefined | null, fallbackLabel: string = 'DATO'): { text: string; isMissing: boolean } => {
  if (!val || typeof val !== 'string' || val.trim().length === 0) {
    return { text: `[DA COMPLETARE / VERIFICARE: ${fallbackLabel}]`, isMissing: true };
  }
  const clean = val.trim();
  const missingKeywords = ['da completare', 'da verificare', 'da indicare', 'da definire', 'da nominare', 'n.d.', 'non indicato'];
  if (missingKeywords.some(kw => clean.toLowerCase().includes(kw))) {
    return { text: `[DA COMPLETARE / VERIFICARE: ${clean}]`, isMissing: true };
  }
  return { text: clean, isMissing: false };
};

// ==================== DEFINIZIONI RICORRENTI (Cap. 1.3) ====================
export const POS_DEFINIZIONI_RICORRENTI = [
  { termine: 'Datore di Lavoro', definizione: 'Il soggetto titolare del rapporto di lavoro con il lavoratore o, comunque, il soggetto che ha la responsabilità dell’organizzazione stessa o dell’unità produttiva in quanto esercita i poteri decisionali e di spesa (art. 2, c. 1, lett. b, D.Lgs. 81/08).' },
  { termine: 'Dirigente', definizione: 'Persona che, in ragione delle competenze professionali e di poteri gerarchici e funzionali adeguati all’incarico conferitogli, attua le direttive del datore di lavoro organizzando l’attività lavorativa e vigilando su di essa (art. 2, c. 1, lett. d, D.Lgs. 81/08).' },
  { termine: 'Preposto', definizione: 'Persona che, in ragione delle competenze professionali e nei limiti di poteri gerarchici e funzionali adeguati alla natura dell’incarico, sovrintende alla attività lavorativa e garantisce l’attuazione delle direttive ricevute, controllandone la corretta esecuzione (art. 2, c. 1, lett. e, D.Lgs. 81/08).' },
  { termine: 'Lavoratore', definizione: 'Persona che, indipendentemente dalla tipologia contrattuale, svolge un’attività lavorativa nell’ambito dell’organizzazione di un datore di lavoro pubblico o privato, con o senza retribuzione (art. 2, c. 1, lett. a, D.Lgs. 81/08).' },
  { termine: 'RSPP (Resp. Servizio Prevenzione e Protezione)', definizione: 'Persona in possesso delle capacità e dei requisiti professionali designata dal datore di lavoro, a cui risponde, per coordinare il servizio di prevenzione e protezione dai rischi (art. 2, c. 1, lett. f, D.Lgs. 81/08).' },
  { termine: 'RLS / RLST (Rappresentante Lavoratori per la Sicurezza)', definizione: 'Persona eletta o designata per rappresentare i lavoratori per quanto concerne gli aspetti della salute e della sicurezza durante il lavoro a livello aziendale o territoriale (art. 47 D.Lgs. 81/08).' },
  { termine: 'Medico Competente', definizione: 'Medico in possesso dei titoli e requisiti formativi ex art. 38, che collabora con il datore di lavoro ai fini della valutazione dei rischi ed effettua la sorveglianza sanitaria e il rilascio dei giudizi di idoneità (art. 2, c. 1, lett. h, D.Lgs. 81/08).' },
  { termine: 'CSP (Coordinatore Sicurezza Progettazione)', definizione: 'Soggetto incaricato, dal committente o responsabile dei lavori, dell’esecuzione dei compiti di cui all’art. 91 prima dell’inizio delle opere (art. 89, c. 1, lett. e, D.Lgs. 81/08).' },
  { termine: 'CSE (Coordinatore Sicurezza Esecuzione)', definizione: 'Soggetto incaricato, dal committente o responsabile dei lavori, di vigilare e coordinare l’applicazione delle disposizioni del PSC e la compatibilità dei POS (art. 89, c. 1, lett. f, D.Lgs. 81/08).' },
  { termine: 'Cantiere Temporaneo o Mobile', definizione: 'Qualunque luogo in cui si effettuano lavori edili o di ingegneria civile il cui elenco è riportato all’Allegato X del D.Lgs. 81/08 (art. 89, c. 1, lett. a).' },
  { termine: 'PSC (Piano di Sicurezza e Coordinamento)', definizione: 'Il documento mediante il quale si pianificano le misure di sicurezza per l’intera durata dei lavori, con particolare riferimento all’eliminazione o riduzione dei rischi di interferenza (art. 100 D.Lgs. 81/08).' },
  { termine: 'POS (Piano Operativo di Sicurezza)', definizione: 'Il documento che il datore di lavoro dell’impresa esecutrice redige in riferimento al singolo cantiere interessato, i cui contenuti minimi obbligatori sono definiti dall’Allegato XV (art. 89, c. 1, lett. h, D.Lgs. 81/08).' },
  { termine: 'PSS (Piano di Sicurezza Sostitutivo)', definizione: 'Il piano di sicurezza redatto nei lavori pubblici quando non è prevista la redazione del PSC (All. XV p. 3.1 D.Lgs. 81/08).' },
  { termine: 'Pi.M.U.S.', definizione: 'Piano di Montaggio, Uso e Smontaggio dei ponteggi metallici fissi redatto dal datore di lavoro a tutela dei montatori e utilizzatori (art. 134 e All. XXII D.Lgs. 81/08).' },
  { termine: 'Pericolo', definizione: 'Proprietà o qualità intrinseca di un determinato fattore avente il potenziale di causare danni (art. 2, c. 1, lett. r, D.Lgs. 81/08).' },
  { termine: 'Rischio (R = P × D)', definizione: 'Probabilità di raggiungimento del potenziale livello di danno nelle condizioni di impiego o di esposizione ad un fattore o agente (art. 2, c. 1, lett. s, D.Lgs. 81/08).' },
  { termine: 'Valutazione dei Rischi', definizione: 'Valutazione globale e documentata di tutti i rischi per la salute e sicurezza dei lavoratori, finalizzata ad individuare adeguate misure di prevenzione e protezione (art. 2, c. 1, lett. q).' },
  { termine: 'DPI (Dispositivo di Protezione Individuale)', definizione: 'Attrezzatura destinata ad essere indossata e tenuta dal lavoratore allo scopo di proteggerlo contro uno o più rischi (art. 74 D.Lgs. 81/08).' },
];

// ==================== MATRICE DI RISCHIO 4x4 (Cap. 8) ====================
export const POS_RISK_MATRIX_INFO = {
  formula: 'R = P × D',
  probabilitaScale: [
    { livello: 1, nome: 'Non probabile / Improbabile', sigla: 'P1', descrizione: 'L’evento lesivo si verifica eccezionalmente o quasi mai nelle ordinarie condizioni.' },
    { livello: 2, nome: 'Possibile / Poco probabile', sigla: 'P2', descrizione: 'L’evento lesivo può verificarsi solo in presenza di circostanze o manovre inconsuete.' },
    { livello: 3, nome: 'Probabile', sigla: 'P3', descrizione: 'L’evento lesivo è noto e si verifica con frequenza media nello svolgimento della fase.' },
    { livello: 4, nome: 'Altamente probabile', sigla: 'P4', descrizione: 'L’evento lesivo è strettamente correlato all’operazione e certo in assenza di presidi.' },
  ],
  dannoScale: [
    { livello: 1, nome: 'Lieve', sigla: 'D1', descrizione: 'Lesione rapidamente reversibile senza esiti permanenti, inabilità temporanea < 3 giorni.' },
    { livello: 2, nome: 'Modesto', sigla: 'D2', descrizione: 'Inabilità reversibile compresa tra 3 e 30 giorni, assenza di postumi invalidanti permanenti.' },
    { livello: 3, nome: 'Significativo', sigla: 'D3', descrizione: 'Infortunio grave con ricovero, inabilità > 30 giorni o invalidità permanente parziale.' },
    { livello: 4, nome: 'Grave', sigla: 'D4', descrizione: 'Infortunio gravissimo, invalidità permanente totale o pericolo di vita / esito fatale.' },
  ],
  classiRischio: [
    { classe: 'Basso', range: '1 - 2', colore: 'text-emerald-700 bg-emerald-50 border-emerald-300', azione: 'Rischio basso / trascurabile. Misure ordinarie di prudenza e formazione generale.' },
    { classe: 'Accettabile', range: '3 - 4', colore: 'text-blue-700 bg-blue-50 border-blue-300', azione: 'Rischio accettabile. Procedure standardizzate e uso regolare dei DPI di base.' },
    { classe: 'Notevole', range: '6 - 8', colore: 'text-amber-700 bg-amber-50 border-amber-300', azione: 'Rischio notevole. Vigilanza attiva del preposto, prescrizioni rigorose e DPI specifici di III cat.' },
    { classe: 'Elevato', range: '9 - 16', colore: 'text-rose-700 bg-rose-50 border-rose-300', azione: 'Rischio critico / elevato. Misure straordinarie di protezione collettiva, abilitazioni e fermo se assenti.' },
  ],
};

export const CRITERI_PROBABILITA = POS_RISK_MATRIX_INFO.probabilitaScale;
export const CRITERI_DANNO = POS_RISK_MATRIX_INFO.dannoScale;
export const CLASSI_RISCHIO_DEF = [
  { classe: 'Basso', intervallo: '1 - 2', colore: 'text-emerald-700 bg-emerald-50 border-emerald-300', criterioAzione: 'Rischio basso / trascurabile. Misure ordinarie di prudenza e formazione generale.' },
  { classe: 'Accettabile', intervallo: '3 - 4', colore: 'text-blue-700 bg-blue-50 border-blue-300', criterioAzione: 'Rischio accettabile. Procedure standardizzate e uso regolare dei DPI di base.' },
  { classe: 'Notevole', intervallo: '6 - 8', colore: 'text-amber-700 bg-amber-50 border-amber-300', criterioAzione: 'Rischio notevole. Vigilanza attiva del preposto, prescrizioni rigorose e DPI specifici di III cat.' },
  { classe: 'Elevato', intervallo: '9 - 16', colore: 'text-rose-700 bg-rose-50 border-rose-300', criterioAzione: 'Rischio critico / elevato. Misure straordinarie di protezione collettiva, abilitazioni e fermo se assenti.' },
];

export const MATRICE_RISCHIO_4X4 = [
  {
    probabilita: 1,
    nomeProbabilita: 'P1 - Improbabile',
    celle: [
      { danno: 1, livelloRischio: 1, classeRischio: 'Basso' },
      { danno: 2, livelloRischio: 2, classeRischio: 'Basso' },
      { danno: 3, livelloRischio: 3, classeRischio: 'Accettabile' },
      { danno: 4, livelloRischio: 4, classeRischio: 'Accettabile' },
    ],
  },
  {
    probabilita: 2,
    nomeProbabilita: 'P2 - Poco probabile',
    celle: [
      { danno: 1, livelloRischio: 2, classeRischio: 'Basso' },
      { danno: 2, livelloRischio: 4, classeRischio: 'Accettabile' },
      { danno: 3, livelloRischio: 6, classeRischio: 'Notevole' },
      { danno: 4, livelloRischio: 8, classeRischio: 'Notevole' },
    ],
  },
  {
    probabilita: 3,
    nomeProbabilita: 'P3 - Probabile',
    celle: [
      { danno: 1, livelloRischio: 3, classeRischio: 'Accettabile' },
      { danno: 2, livelloRischio: 6, classeRischio: 'Notevole' },
      { danno: 3, livelloRischio: 9, classeRischio: 'Elevato' },
      { danno: 4, livelloRischio: 12, classeRischio: 'Elevato' },
    ],
  },
  {
    probabilita: 4,
    nomeProbabilita: 'P4 - Altamente probabile',
    celle: [
      { danno: 1, livelloRischio: 4, classeRischio: 'Accettabile' },
      { danno: 2, livelloRischio: 8, classeRischio: 'Notevole' },
      { danno: 3, livelloRischio: 12, classeRischio: 'Elevato' },
      { danno: 4, livelloRischio: 16, classeRischio: 'Elevato' },
    ],
  },
];

export interface PosDpiDefinition {
  id: string;
  nome: string;
  norma: string;
  icona: string;
  descrizione: string;
  obbligatorioBase: boolean;
}

export const POS_DPI_LIST: PosDpiDefinition[] = [
  {
    id: 'elmetto',
    nome: 'Casco di protezione / Elmetto',
    norma: 'UNI EN 397',
    icona: '⛑️',
    descrizione: 'Protezione del capo contro urti, caduta oggetti dall’alto e carichi sospesi.',
    obbligatorioBase: true,
  },
  {
    id: 'scarpe',
    nome: 'Calzature di sicurezza S3',
    norma: 'UNI EN ISO 20345 (S3)',
    icona: '🥾',
    descrizione: 'Suola antiperforazione, lamina in acciaio/composito, puntale di sicurezza 200J e resistenza idrorepellente.',
    obbligatorioBase: true,
  },
  {
    id: 'guanti_meccanici',
    nome: 'Guanti rischio meccanico',
    norma: 'UNI EN 388',
    icona: '🧤',
    descrizione: 'Protezione mani da abrasione, taglio da lama, strappo e perforazione.',
    obbligatorioBase: true,
  },
  {
    id: 'guanti_chimici',
    nome: 'Guanti rischio chimico',
    norma: 'UNI EN ISO 374',
    icona: '🧤',
    descrizione: 'Guanti in nitrile/neoprene per contatto con cemento fresco, calce, resine, additivi.',
    obbligatorioBase: false,
  },
  {
    id: 'occhiali',
    nome: 'Occhiali di protezione',
    norma: 'UNI EN 166',
    icona: '🥽',
    descrizione: 'Protezione occhi da schegge, polveri da taglio, schizzi e particelle volanti.',
    obbligatorioBase: false,
  },
  {
    id: 'visiera',
    nome: 'Visiera policarbonato / paraschizzi',
    norma: 'UNI EN 166 classe 1B',
    icona: '🛡️',
    descrizione: 'Protezione integrale del viso durante demolizioni pesanti, tagli, smerigliature.',
    obbligatorioBase: false,
  },
  {
    id: 'cuffie',
    nome: 'Otoprotettori (Cuffie / Inserti)',
    norma: 'UNI EN 352',
    icona: '🎧',
    descrizione: 'Attenuazione del rumore per attività con livelli sonori superiori a 80/85 dB(A).',
    obbligatorioBase: false,
  },
  {
    id: 'mascherina_ffp2',
    nome: 'Respiratore FFP2 antipolvere',
    norma: 'UNI EN 149 (FFP2)',
    icona: '😷',
    descrizione: 'Protezione delle vie respiratorie da polveri edili inerti e polveri di legno dolce.',
    obbligatorioBase: false,
  },
  {
    id: 'mascherina_ffp3',
    nome: 'Respiratore FFP3 ad alta efficienza',
    norma: 'UNI EN 149 (FFP3)',
    icona: '😷',
    descrizione: 'Protezione contro polveri tossiche fini, silice cristallina, fumi da saldatura.',
    obbligatorioBase: false,
  },
  {
    id: 'imbracatura',
    nome: 'Imbracatura completa anticaduta',
    norma: 'UNI EN 361 + EN 355/354',
    icona: '🪢',
    descrizione: 'Dotata di attacchi sternale/dorsale, cordino di posizionamento e assorbitore di energia cinetica.',
    obbligatorioBase: false,
  },
  {
    id: 'gilet_alta_visibilita',
    nome: 'Gilet alta visibilità',
    norma: 'UNI EN ISO 20471 (Classe 2)',
    icona: '🦺',
    descrizione: 'Bande rifrangenti fluorescenti per cantieri stradali e aree con transito automezzi.',
    obbligatorioBase: true,
  },
  {
    id: 'tuta_protettiva',
    nome: 'Tuta protettiva monouso tipo 5/6',
    norma: 'UNI EN 13982 / EN 13034',
    icona: '🥼',
    descrizione: 'Protezione corpo intero da polveri nocive e schizzi leggeri di vernici e chimici.',
    obbligatorioBase: false,
  },
];

export const DEFAULT_ALLEGATI_POS: PosDocumentoAllegato[] = [
  { id: 'all_1', titolo: 'DURC - Documento Unico Regolarità Contributiva in corso di validità', obbligatorio: true, allegatoPresente: true },
  { id: 'all_2', titolo: 'Certificato di iscrizione alla C.C.I.A.A. con oggetto sociale coerente', obbligatorio: true, allegatoPresente: true },
  { id: 'all_3', titolo: 'Dichiarazione requisiti tecnico-professionali (All. XVII D.Lgs. 81/08)', obbligatorio: true, allegatoPresente: true },
  { id: 'all_4', titolo: 'Dichiarazione organico medio annuo e contratto collettivo applicato', obbligatorio: true, allegatoPresente: true },
  { id: 'all_5', titolo: 'Nomina e attestati Datore di Lavoro / RSPP / RLS aziendale o territoriale', obbligatorio: true, allegatoPresente: true },
  { id: 'all_6', titolo: 'Attestati di formazione per Addetti Primo Soccorso e Lotta Antincendio', obbligatorio: true, allegatoPresente: true },
  { id: 'all_7', titolo: 'Attestati di formazione obbligatoria dei lavoratori (art. 36-37 Accordo Stato-Regioni)', obbligatorio: true, allegatoPresente: true },
  { id: 'all_8', titolo: 'Attestati di abilitazione specifica per attrezzature particolari (PLE, Gru, Escavatori)', obbligatorio: false, allegatoPresente: false },
  { id: 'all_9', titolo: 'Giudizi di idoneità alla mansione rilasciati dal Medico Competente', obbligatorio: true, allegatoPresente: true },
  { id: 'all_10', titolo: 'Schede di sicurezza (SDS) dei prodotti e delle sostanze chimiche impiegate', obbligatorio: true, allegatoPresente: false },
  { id: 'all_11', titolo: 'Libretti d’uso e verbali delle verifiche periodiche delle attrezzature', obbligatorio: true, allegatoPresente: false },
  { id: 'all_12', titolo: 'Pi.M.U.S. (Piano di Montaggio Uso e Smontaggio ponteggio metallico)', obbligatorio: false, allegatoPresente: false },
];

export const DEFAULT_CONTESTO_AMBIENTALE: PosContestoAmbientale = {
  naturaTerreno: 'Terreno solido pianeggiante di natura alluvionale/mista con strato superficiale coerente, privo di fenomeni di dissesto idrogeologico manifesti.',
  rischiFranamento: 'Assenza di rischi di franamento nelle ordinarie condizioni di esercizio; per eventuali scavi di trincea superiori a 1,50 m è prescritto l’impiego di armature/sbadacchiature.',
  faldeFossati: 'Non si rilevano falde freatiche superficiali affioranti né fossati a cielo aperto adiacenti al perimetro recintato di cantiere.',
  sottoserviziLinee: 'Presenza di sottoservizi interrati (rete idrica, gasdotto di distribuzione, cavi elettrici e fibra ottica). Richiesta tracciatura preliminare con cercaservizi.',
  vegetazioneAlberi: 'Vegetazione arbustiva rada; non sono presenti alberature d’alto fusto interferenti con il raggio d’azione dei mezzi di sollevamento.',
  manufattiAdiacenti: 'Fabbricati limitrofi a destinazione civile/commerciale. Prevista costante bagnatura delle polveri e rispetto delle fasce orarie comunali per le emissioni sonore.',
  recinzioneAccessi: 'Recinzione continua opaca di altezza non inferiore a 2,00 m, con cancello carraio e varco pedonale separato, chiudibili a chiave con cartellonistica di sicurezza.',
  segnaletica: 'Cartellonistica di sicurezza ad alta visibilità conforme al D.Lgs. 81/08 (obbligo DPI, divieto di accesso ai non addetti, limite velocità 10 km/h, pericolo carichi sospesi).',
  serviziLogistica: 'Monoblocco coibentato a uso spogliatoio e servizi igienici collegati alle reti idrico-fognarie (o WC chimico certificato periodicamente sanificato).',
  viabilitaParcheggi: 'Viabilità interna delimitata con transenne rigide; separazione netta tra percorso pedonale protetto e via di transito per automezzi e macchine d’opera.',
  allacciamentoImpianti: 'Quadro elettrico di cantiere tipo ASC a norma CEI 64-8/7 art. 704 con interruttore differenziale ad alta sensibilità (Idn ≤ 30 mA) e messa a terra collaudata.',
  caricoScaricoStoccaggio: 'Piazzale di scarico pianeggiante, lontano da cigli o linee aeree, delimitato per movimentazione carichi e deposito ordinato di bancali.',
  gestioneRifiuti: 'Cassoni scarrabili distinti per codice CER (inerti da demolizione, legname, ferro, imballaggi misti); smaltimento tracciato con formulari FIR.',
  fattoriEsterniRischio: 'Interferenza con il traffico veicolare su pubblica via durante l’ingresso/uscita dei mezzi di trasporto (gestito con moviere a terra munito di giubbetto catarifrangente e paletta). Condizioni meteorologiche avverse (sospensione lavori in quota con vento > 30 km/h o pioggia battente).',
  rischiTrasmessiAmbiente: 'Emissione di polveri e macerie durante demolizioni o tagli (mitigate con idro-nebulizzatori e aspiratori); emissioni acustiche contenute mediante impiego di macchinari silenziati a norma CE.',
};

export const DEFAULT_ORGANIZZAZIONE_CANTIERE: PosOrganizzazioneCantiere = {
  recinzioneAccessi: 'Recinzione perimetrale continua di altezza non inferiore a 2,00 m, con cancello carraio e pedonale dotati di chiusura e cartellonistica di sicurezza ("Divieto di accesso ai non addetti ai lavori", "Obbligo DPI").',
  viabilitaSicurezza: 'Percorsi pedonali distinti dalle vie di transito degli automezzi e macchine d’opera, segnalati a terra con transenne o coni. Mantenimento costante delle vie di fuga sgombre da ingombri.',
  impiantoElettricoCantiere: 'Quadro elettrico generale da cantiere (ASC) conforme norma CEI 64-8/7 art. 704, provvisto di interruttore differenziale ad alta sensibilità (Idn ≤ 30 mA), pulsante di emergenza a fungo e messa a terra con relativa dichiarazione di conformità.',
  stoccaggioMateriali: 'Area delimitata e pianeggiante per il deposito ordinato dei materiali da costruzione, provvista di bancali e stoccaggio sacchi al riparo dalle intemperie.',
  gestioneRifiutiTerre: 'Cassoni scarrabili distinti per codice CER (inerti da demolizione, legname, imballaggi misti, ferro). Smaltimento tracciato con Formulari di Identificazione Rifiuti (FIR).',
  fornituraMaterialiAccesso: 'Accesso per fornitori e autobetoniere concordato con il Preposto; manovre assistite da moviere a terra con sosta consentita esclusivamente nell’apposita area di scarico delimitata.',
  stoccaggioMaterialiLavorazioni: 'Nelle aree di lavorazione è ammesso esclusivamente lo stoccaggio del quantitativo di materiale strettamente necessario per la giornata operativa, collocato in posizione stabile senza sovraccaricare solai.',
  accessoMezziMeccanici: 'Accesso consentito esclusivamente a personale abilitato provvisto di patentino; marcia a passo d’uomo (max 10 km/h) con avvisatore acustico e ottico di retromarcia attivo.',
  serviziIgieniciAssistenziali: 'Presenza di monoblocco coibentato a uso spogliatoio e servizi igienici allacciati alla rete idrica e fognaria (o WC chimico certificato periodicamente sanificato) con acqua corrente, sapone e asciugamani a perdere.',
  localiRiposoSpogliatoi: 'Locale spogliatoio provvisto di armadietti a doppio scomparto per la custodia separata degli abiti civili e di lavoro, dotato di riscaldamento stagionale.',
  protezioneInterferenze: 'Coordinamento preventivo con il Coordinatore per la Sicurezza in fase di Esecuzione (CSE) e rispetto rigoroso degli sfasamenti spaziali e temporali definiti nel PSC.',
  serviziIgienici: 'Presenza di monoblocco coibentato a uso spogliatoio e servizi igienici allacciati alla rete idrica e fognaria (o WC chimico certificato periodicamente sanificato) con acqua corrente, sapone e asciugamani a perdere.',
  viabilita: 'Percorsi pedonali distinti dalle vie di transito degli automezzi e macchine d’opera, segnalati a terra con transenne o coni. Mantenimento costante delle vie di fuga sgombre da ingombri.',
  impiantoElettrico: 'Quadro elettrico generale da cantiere (ASC) conforme norma CEI 64-8/7 art. 704, provvisto di interruttore differenziale ad alta sensibilità (Idn ≤ 30 mA), pulsante di emergenza a fungo e messa a terra con relativa dichiarazione di conformità.',
  stoccaggioRifiuti: 'Cassoni scarrabili distinti per codice CER (inerti da demolizione, legname, imballaggi misti, ferro). Smaltimento tracciato con Formulari di Identificazione Rifiuti (FIR).',
};

export const DEFAULT_PIANO_EMERGENZA: PosPianoEmergenza = {
  numeroUnicoEmergenza: '112 (Numero Unico Europeo per Emergenze: Pronto Soccorso Sanitario, Vigili del Fuoco, Carabinieri, Polizia)',
  ospedaleRiferimento: 'Presidio Ospedaliero di Zona con Pronto Soccorso Attivo H24',
  prontoSoccorsoIndirizzo: 'Presidio Ospedaliero di riferimento territoriale competente per zona cantiere',
  telefonoProntoSoccorso: '112 / Centralino Ospedale',
  puntoRaccolta: 'Piazzale antistante l’ingresso principale del cantiere, in zona sicura e lontana da strutture pericolanti e carichi sospesi, debitamente contrassegnato con cartello verde conforme D.Lgs. 81/08.',
  cassettaPrimoSoccorsoUbicazione: 'Cassetta di Pronto Soccorso conforme All. 1 D.M. 388/2003 situata presso il monoblocco ufficio/spogliatoio, facilmente accessibile, segnalata e regolarmente reintegrata nelle scadenze.',
  presidioSanitarioTipo: 'Cassetta di Pronto Soccorso conforme All. 1 D.M. 388/2003 (per aziende del gruppo A e B) integrata con pacchetto di medicazione mobile per squadre operanti.',
  dotazioniPrimoSoccorso: 'Guanti monouso sterili, flacone disinfettante povidone-iodio 10%, soluzione fisiologica sterile 500ml, garze sterili 10x10 e 18x40, teli sterili, pinzette da medicazione monouso, confezione di cotone idrofilo, cerotti assortiti, rotoli di benda orlata, flacone di ghiaccio pronto uso, sacchetti monouso per raccolta rifiuti sanitari, termometro digitale, sfigmomanometro e apparecchio per misurazione pressione.',
  estintoriUbicazione: 'Estintori a polvere polivalente ABC da 6 kg (omologati 34A 233B C) posti in prossimità del quadro elettrico generale, presso l’ufficio/spogliatoio e a portata di mano nelle aree a rischio a caldo (taglio/smerigliatura/saldatura).',
  comportamentoInfortunio: 'In caso di infortunio: 1) Sospendere immediatamente le lavorazioni nella zona interessata; 2) Rimanere calmi ed evitare azioni concitate o pericolose; 3) Allontanare le persone non addette; 4) Allertare tempestivamente l’Addetto al Primo Soccorso aziendale designato in cantiere; 5) Non somministrare liquidi né farmaci all’infortunato; 6) Proteggere l’infortunato dal freddo coprendolo con un telo isotermico.',
  valutazionePericolo: 'Prima di avvicinarsi all’infortunato, l’addetto al soccorso accerta l’assenza di pericoli residui imminenti: tensione elettrica su strutture o cavi tranciati, presenza di gas o fumi tossici, pericolo di crollo imminente, caduta di calcinacci o carichi sospesi instabili. Se il pericolo persiste, disattivare l’alimentazione generale o attendere i Vigili del Fuoco.',
  modalitaIntervento: 'L’addetto al primo soccorso interviene applicando le tecniche apprese nel corso di formazione: valutazione dello stato di coscienza (chiamata verbale e stimolo tattile), pervietà delle vie aeree, respiro e circolo (schema BLS). In caso di sospetto trauma spinale o frattura, NON muovere né spostare l’infortunato salvo pericolo immediato di vita (incendio o crollo imminente).',
  gestioneInfortunato: 'In caso di ferita sanguinante: applicare tampone sterile compressivo; in caso di ustione: raffreddare con acqua corrente per almeno 15 minuti; in caso di lipotimia/svenimento: posizionare in posizione anti-shock (gambe sollevate) se cosciente, o in Posizione Laterale di Sicurezza (PLS) se incosciente ma che respira normalmente.',
  attivazioneSoccorsi: 'Comporre immediatamente il 112 (Numero Unico Europeo) mantenendo la calma e comunicando con precisione: a) Indirizzo esatto del cantiere e percorso di accesso; b) Natura dell’evento (caduta dall’alto, elettrocuzione, schiacciamento, incendio); c) Numero degli infortunati e condizioni visibili (cosciente/incosciente, emorragia, respiro); d) Inviare un addetto al cancello d’ingresso per guidare l’ambulanza direttamente sul punto dell’infortunio.',
  proceduraChiamataSoccorsi: 'Comporre il 112 specificando: denominazione cantiere, via e numero civico, tipologia infortunio, numero infortunati e condizioni di coscienza/respiro. Attendere la conferma dell’operatore 112 prima di riagganciare.',
  addettiSoccorsoNominati: 'Da indicare tra i dipendenti con attestato Primo Soccorso valido',
  addettiAntincendioNominati: 'Da indicare tra i dipendenti con attestato Antincendio valido',
};

// ==================== LIBRERIA ATTIVITÀ EDILI (D.Lgs. 81/08 All. XV) ====================

export const DEFAULT_POS_TEMPLATES: PosAttivitaTemplate[] = [
  {
    id: 'att_allestimento',
    nome: 'Allestimento e installazione del cantiere',
    categoria: 'Opere Preliminari',
    icona: '🚧',
    descrizione: 'Montaggio della recinzione perimetrale, posa della baracca di cantiere, allacciamento del quadro elettrico generale, predisposizione delle vie di circolazione e della cartellonistica di sicurezza.',
    faseLavoro: 'Fase 1 - Avvio cantiere',
    rischi: [
      {
        id: 'r1',
        descrizione: 'Urto con mezzi e materiali in movimentazione',
        fonteRischio: 'Scarico baraccamenti e materiali pesanti da autocarro con gru',
        conseguenze: 'Contusioni, schiacciamento arti',
        misurePreventive: 'Delimitazione dell’area di manovra con coni e transenne; divieto di stazionamento nel raggio d’azione del braccio gru.',
        misureProtettive: 'Presenza di moviere a terra per la guida del camionista.',
        dpiRichiesti: ['Casco di protezione / Elmetto', 'Calzature di sicurezza S3', 'Guanti rischio meccanico', 'Gilet alta visibilità'],
      },
      {
        id: 'r2',
        descrizione: 'Elettrocuzione e contatto elettrico diretto/indiretto',
        fonteRischio: 'Allaccio quadro elettrico di cantiere e condutture',
        conseguenze: 'Fibrillazione ventricolare, ustioni',
        misurePreventive: 'Installazione a cura di elettricista abilitato con rilascio DICO ex D.M. 37/08; verifica presenza differenziale con Idn ≤ 30 mA e messa a terra.',
        misureProtettive: 'Cavi con guaina antifiamma tipo H07RN-F protetti da passacavi carrabili.',
        dpiRichiesti: ['Calzature di sicurezza S3', 'Guanti isolanti'],
      },
    ],
    misurePrevenzione: [
      'Installare la cartellonistica di cantiere ben visibile all’ingresso prima di iniziare qualsiasi altra operazione.',
      'Collocare la cassetta di pronto soccorso e l’estintore in posizione segnalata e protetta da intemperie.',
      'Mantenere sgombro il cancello d’ingresso per consentire l’accesso agevole ai mezzi dei vigili del fuoco e soccorso.',
    ],
    dpiRaccomandati: ['Casco di protezione / Elmetto', 'Calzature di sicurezza S3', 'Guanti rischio meccanico', 'Gilet alta visibilità'],
    attrezzatureTipiche: ['Autocarro con gru retrocabina', 'Avvitatore a batteria', 'Trapano a percussione', 'Scale portatili EN 131'],
    materialiTipici: ['Pannelli recinzione metallica zincata su basamenti in cls', 'Teli oscuranti frangivento', 'Monoblocco coibentato'],
    interferenze: 'Eventuale viabilità pubblica esterna durante le manovre di accesso degli autocarri.',
    note: 'In caso di occupazione temporanea di suolo pubblico, verificare l’autorizzazione comunale.',
  },
  {
    id: 'att_demolizione',
    nome: 'Demolizione di tramezzature, intonaci e pavimentazioni',
    categoria: 'Demolizioni',
    icona: '🔨',
    descrizione: 'Demolizione controllata di pareti divisorie interne non portanti, scrostamento intonaci ammalorati e rimozione pavimentazioni/massetti con martelli demolitori.',
    faseLavoro: 'Fase 2 - Spogliazione e demolizioni',
    rischi: [
      {
        id: 'r3',
        descrizione: 'Caduta di materiale dall’alto e crollo imprevisto di elementi murari',
        fonteRischio: 'Disgaggio di porzioni murarie e tramezzi adiacenti',
        conseguenze: 'Traumi cranici, lesioni da schiacciamento',
        misurePreventive: 'Demolizione da eseguirsi tassativamente dall’alto verso il basso procedendo per corsi orizzontali; divieto di scalzamento alla base.',
        misureProtettive: 'Puntellamento preventivo delle strutture se sussiste dubbio di cedimento.',
        dpiRichiesti: ['Casco di protezione / Elmetto', 'Calzature di sicurezza S3', 'Guanti rischio meccanico', 'Occhiali di protezione'],
      },
      {
        id: 'r4',
        descrizione: 'Inalazione di polveri minerali e silice libera cristallina',
        fonteRischio: 'Frantumazione laterizi, malte e intonaci secchi',
        conseguenze: 'Irritazione vie aeree, silicosi polmonare',
        misurePreventive: 'Bagnatura costante delle superfici con nebulizzatori d’acqua; ventilazione forzata dei locali confinati.',
        misureProtettive: 'Uso di aspiratori industriali portatili collegati agli elettroutensili.',
        dpiRichiesti: ['Respiratore FFP2 antipolvere', 'Occhiali di protezione'],
      },
      {
        id: 'r5',
        descrizione: 'Esposizione a rumore e vibrazioni meccaniche mano-braccio',
        fonteRischio: 'Impiego prolungato di demolitori elettrici e scalpellatori',
        conseguenze: 'Ipoacusia professionale da rumore, sindrome dito bianco (HAVS)',
        misurePreventive: 'Alternanza degli operatori alle lavorazioni con martello demolitore; uso di utensili con impugnature antivibranti.',
        misureProtettive: 'Interruzioni programmate ogni 60-90 minuti.',
        dpiRichiesti: ['Otoprotettori (Cuffie / Inserti)', 'Guanti rischio meccanico antivibranti'],
      },
    ],
    misurePrevenzione: [
      'Verificare e sezionare preventivamente tutte le linee di adduzione gas, acqua ed energia elettrica presenti nei tramezzi.',
      'Evitare il sovraccarico puntuale dei solai non ammucchiando macerie in cumuli elevati; convogliare i detriti nei cassoni.',
      'Vietato gettare macerie dall’alto delle finestre o aperture; utilizzare tubi convogliatori o calatoie chiuse.',
    ],
    dpiRaccomandati: ['Casco di protezione / Elmetto', 'Calzature di sicurezza S3', 'Guanti rischio meccanico', 'Occhiali di protezione', 'Respiratore FFP2 antipolvere', 'Otoprotettori (Cuffie / Inserti)'],
    attrezzatureTipiche: ['Martello demolitore medio/pesante', 'Smerigliatrice angolare', 'Canaletta di scarico macerie in gomma', 'Carriole da cantiere', 'Aspiratore industriale polveri'],
    materialiTipici: ['Sacchi macerie alta resistenza', 'Teli di polietilene per protezione polvere'],
    interferenze: 'Presenza di polvere e rumore nei confronti di unità abitative limitrofe o piani sottostanti.',
    note: 'In caso di presenza sospetta di manufatti in MCA (cemento-amianto), bloccare i lavori e attivare la bonifica specializzata.',
  },
  {
    id: 'att_opere_murarie',
    nome: 'Opere murarie e tamponamenti in blocchi/laterizio',
    categoria: 'Strutture e Murature',
    icona: '🧱',
    descrizione: 'Costruzione di pareti in mattoni forati, blocchi in laterizio termico o calcestruzzo cellulare, inclusa la preparazione e stesura della malta e posa di falsotelai.',
    faseLavoro: 'Fase 3 - Ricostruzioni murarie',
    rischi: [
      {
        id: 'r6',
        descrizione: 'Movimentazione manuale dei carichi (MMC)',
        fonteRischio: 'Sollevamento e posa di bancali di blocchi, mattoni e sacchi di premiscelato da 25 kg',
        conseguenze: 'Lombalgie acute, ernie discali, discopatie',
        misurePreventive: 'Avvicinare i materiali al punto di posa tramite transpallet o gru; piegare le gambe durante il sollevamento tenendo il carico aderente al tronco.',
        misureProtettive: 'Ripartizione dei pesi tra due operatori per carichi superiori a 25 kg.',
        dpiRichiesti: ['Calzature di sicurezza S3', 'Guanti rischio meccanico'],
      },
      {
        id: 'r7',
        descrizione: 'Contatto cutaneo con sostanze corrosive e alcaline',
        fonteRischio: 'Manipolazione di malte cementizie fresche a base calce e cemento',
        conseguenze: 'Dermatiti da contatto, ustioni chimiche cutanee',
        misurePreventive: 'Evitare il contatto prolungato della pelle con la malta fresca.',
        misureProtettive: 'Lavaggio immediato con acqua corrente in caso di contatto accidentale.',
        dpiRichiesti: ['Guanti rischio meccanico', 'Guanti rischio chimico', 'Occhiali di protezione'],
      },
    ],
    misurePrevenzione: [
      'Per pareti di altezza superiore a 2,00 m utilizzare trabattelli a norma UNI EN 1004 con parapetti completi, vietando l’uso di bidoni, blocchi o tavole provvisorie.',
      'Garantire stabilità della muratura in fase di costruzione contro l’azione del vento o urti accidentali.',
    ],
    dpiRaccomandati: ['Casco di protezione / Elmetto', 'Calzature di sicurezza S3', 'Guanti rischio meccanico', 'Occhiali di protezione'],
    attrezzatureTipiche: ['Betoniera a bicchiere / mescolatore continuo', 'Trabattello su ruote UNI EN 1004', 'Cazzuole, frattazzi, stadie', 'Tagliatrice ad umido per laterizi'],
    materialiTipici: ['Mattoni forati', 'Blocchi alleggeriti', 'Malta bastarda premiscelata', 'Controtelai metallici'],
    interferenze: 'Lavorazioni simultanee nei medesimi ambienti.',
    note: 'Verificare la portata del solaio prima di concentrare bancali pesanti.',
  },
  {
    id: 'att_ponteggi',
    nome: 'Montaggio, uso e smontaggio di ponteggi metallici fissi',
    categoria: 'Lavori in Quota',
    icona: '🏗️',
    descrizione: 'Allestimento e utilizzo di ponteggio metallico a telai prefabbricati per facciate esterne, con ancoraggi alla struttura, montaggio piani di calpestio, botole di risalita e mantovana parasassi.',
    faseLavoro: 'Fase Allestimento / Facciate',
    rischi: [
      {
        id: 'r8',
        descrizione: 'Caduta dall’alto da quota superiore a 2 metri',
        fonteRischio: 'Operazioni di montaggio/smontaggio elementi e traversi del ponteggio',
        conseguenze: 'Politraumi gravissimi, esito fatale',
        misurePreventive: 'Operazioni eseguite rigorosamente secondo il Pi.M.U.S. da personale con attestato di abilitazione triennale 28 ore.',
        misureProtettive: 'Uso continuo di imbracatura anticaduta vincolata a linee vita temporanee o punti sicuri con connettori a grande apertura.',
        dpiRichiesti: ['Imbracatura completa anticaduta', 'Casco di protezione / Elmetto con sottogola', 'Calzature di sicurezza S3'],
      },
      {
        id: 'r9',
        descrizione: 'Caduta di utensili e componenti metallici su passanti',
        fonteRischio: 'Movimentazione di tubi, giunti, telai e tavole metalliche',
        conseguenze: 'Lesioni e traumi al personale a terra o terzi',
        misurePreventive: 'Delimitazione dell’area a terra sottostante il ponteggio; installazione della mantovana parasassi inclinata.',
        misureProtettive: 'Uso di argani di sollevamento con gancio di sicurezza a scatto.',
        dpiRichiesti: ['Casco di protezione / Elmetto', 'Gilet alta visibilità'],
      },
    ],
    misurePrevenzione: [
      'Redigere preventivamente il Pi.M.U.S. a cura del Datore di Lavoro o tecnico abilitato.',
      'Verificare la consistenza del terreno d’appoggio inserendo adeguate tavole di ripartizione in legno sotto le basette.',
      'Eseguire gli ancoraggi alla muratura portante secondo lo schema del costruttore (o progetto di ingegnere se fuori schema).',
      'Chiudere sempre le botole delle scalette interne dopo il passaggio.',
    ],
    dpiRaccomandati: ['Casco di protezione / Elmetto con sottogola', 'Calzature di sicurezza S3', 'Imbracatura completa anticaduta', 'Guanti rischio meccanico', 'Gilet alta visibilità'],
    attrezzatureTipiche: ['Argano a bandiera con portata max 200 kg', 'Livella a bolla', 'Chiavi per ponteggi e martello da carpentiere'],
    materialiTipici: ['Telai metallici prefabbricati zincati', 'Tavole metalliche antiscivolo', 'Tasselli e ganci di ancoraggio', 'Rete antipolvere ombreggiante'],
    interferenze: 'Transito pedonale e veicolare su strade o marciapiedi pubblici antistanti.',
    note: 'Obbligo di verifica iniziale e periodica trimestrale registrata sul verbale di cantiere.',
  },
  {
    id: 'att_lavori_quota_coperture',
    nome: 'Lavori su coperture e tetti (lavori in quota)',
    categoria: 'Lavori in Quota',
    icona: '🧗',
    descrizione: 'Rifacimento manto di copertura, sostituzione tegole/coppi, impermeabilizzazione falde e installazione canali di gronda con rischio di caduta oltre 2 metri.',
    faseLavoro: 'Fase Coperture',
    rischi: [
      {
        id: 'r10',
        descrizione: 'Caduta dall’alto per sfondamento lucernari o superfici fragili',
        fonteRischio: 'Camminamento su lastre in fibrocemento, onduline o lucernari non portanti',
        conseguenze: 'Precipitazione al piano terra, esito letale',
        misurePreventive: 'Copertura e protezione perimetrale di tutti i lucernari con griglie rigide ad alta resistenza; uso di passerelle e tavole sopraelevate.',
        misureProtettive: 'Posa preventiva di reti anticaduta sotto la copertura (UNI EN 1263).',
        dpiRichiesti: ['Imbracatura completa anticaduta', 'Casco di protezione / Elmetto con sottogola'],
      },
      {
        id: 'r11',
        descrizione: 'Caduta dal bordo della copertura per assenza di parapetti',
        fonteRischio: 'Lavori di rifacimento colmo e gronde',
        conseguenze: 'Caduta libera nel vuoto',
        misurePreventive: 'Installazione di parapetti provvisori certificati UNI EN 13374 (Classe A/B/C) lungo tutto il perimetro della gronda.',
        misureProtettive: 'Collegamento tramite cordino con assorbitore e dispositivo guidato su linea vita rigida o flessibile certificata UNI EN 795.',
        dpiRichiesti: ['Imbracatura completa anticaduta', 'Casco di protezione / Elmetto con sottogola', 'Calzature di sicurezza S3'],
      },
    ],
    misurePrevenzione: [
      'Accesso alla copertura esclusivamente da ponteggio con scaletta o mediante piattaforma aerea PLE conformemente manovrata.',
      'Sospensione immediata dei lavori su coperture in caso di forte vento (> 30 km/h), pioggia battente, brina o neve.',
      'Verificare che ogni punto di ancoraggio rispetti il progetto della linea vita e sia collaudato.',
    ],
    dpiRaccomandati: ['Imbracatura completa anticaduta', 'Casco di protezione / Elmetto con sottogola', 'Calzature di sicurezza S3 con battistrada antiscivolo', 'Guanti rischio meccanico'],
    attrezzatureTipiche: ['Linea vita temporanea EN 795', 'Parapetti perimetrali EN 13374', 'Piattaforma aerea (PLE)', 'Avvitatore ad impulsi'],
    materialiTipici: ['Tegole / coppi in laterizio', 'Pannelli isolanti termoacustici', 'Gronde e scossaline in rame/alluminio'],
    interferenze: 'Rischio di caduta materiali su aree scoperte sottostanti: transennare tassativamente il raggio di caduta a terra.',
    note: 'Compilare il registro di controllo DPI di 3° categoria prima dell’inizio delle attività.',
  },
  {
    id: 'att_scavi',
    nome: 'Scavi a cielo aperto e reinterri con macchine movimento terra',
    categoria: 'Scavi e Fondazioni',
    icona: '🚜',
    descrizione: 'Esecuzione di sbancamenti, scavi a sezione ristretta per fondazioni o posa tubazioni con escavatore idraulico, armatura delle pareti e reinterro controllato.',
    faseLavoro: 'Fase Fondazioni e Sottoservizi',
    rischi: [
      {
        id: 'r12',
        descrizione: 'Seppellimento da franamento delle pareti dello scavo',
        fonteRischio: 'Cedimento improvviso del terreno per pendenza inadeguata o vibrazioni',
        conseguenze: 'Asfissia, schiacciamento toracico con esito letale',
        misurePreventive: 'Per scavi di profondità superiore a 1,50 m, predisporre sbadacchiatura/armatura lignea o metallica continua delle pareti; scarpata con pendenza naturale.',
        misureProtettive: 'Deposito del materiale scavato ad almeno 1,00 m dal ciglio dello scavo per evitare sovraccarichi sul fronte.',
        dpiRichiesti: ['Casco di protezione / Elmetto', 'Calzature di sicurezza S3', 'Gilet alta visibilità'],
      },
      {
        id: 'r13',
        descrizione: 'Tranciatura di sottoservizi interrati (gas, energia elettrica, fibra)',
        fonteRischio: 'Interferenza della benna dell’escavatore con cavi in tensione o tubazioni gas',
        conseguenze: 'Esplosioni, incendi, folgorazione',
        misurePreventive: 'Richiesta preventiva mappe dei sottoservizi agli enti gestori; saggi manuali esplorativi a pala prima dell’uso della macchina meccanica.',
        misureProtettive: 'Localizzatore cercaservizi prima di ogni affondo di benna.',
        dpiRichiesti: ['Calzature di sicurezza S3', 'Guanti isolanti'],
      },
      {
        id: 'r14',
        descrizione: 'Investimento di persone e ribaltamento del mezzo meccanico',
        fonteRischio: 'Manovre in retromarcia dell’escavatore in spazi stretti',
        conseguenze: 'Schiacciamento, lesioni gravi',
        misurePreventive: 'Dotazione di segnalatore acustico e ottico di retromarcia e specchi retrovisori/telecamera; divieto di stazionamento nel raggio di rotazione torretta.',
        misureProtettive: 'Operatore provvisto di abilitazione specifica (patentino macchine movimento terra).',
        dpiRichiesti: ['Gilet alta visibilità', 'Casco di protezione / Elmetto', 'Calzature di sicurezza S3'],
      },
    ],
    misurePrevenzione: [
      'Proteggere i cigli dello scavo con parapetti regolamentari o transenne rigide ad alta visibilità.',
      'Garantire accessi sicuri all’interno dello scavo tramite rampe o scale fisse ancorate che oltrepassino di 1 m il piano di campagna.',
    ],
    dpiRaccomandati: ['Casco di protezione / Elmetto', 'Calzature di sicurezza S3', 'Gilet alta visibilità', 'Guanti rischio meccanico', 'Otoprotettori (Cuffie / Inserti)'],
    attrezzatureTipiche: ['Miniescavatore cingolato da 15-50 q.li', 'Dumper gommato / minipala', 'Costipatore verticale a piatto vibrante', 'Armature prefabbricate da scavo'],
    materialiTipici: ['Tubi PVC fognatura', 'Ghiaia e sabbia di allettamento', 'Pozzetti prefabbricati in cls'],
    interferenze: 'Traffico di automezzi per conferimento terre e rocce da scavo.',
    note: 'Verificare la falda acquifera superficiale e predisporre pompe sommerse in caso di infiltrazioni.',
  },
  {
    id: 'att_calcestruzzo_armature',
    nome: 'Opere in c.a., posa ferri d’armatura e getto calcestruzzo',
    categoria: 'Strutture e Murature',
    icona: '🏗️',
    descrizione: 'Carpenteria in legno per casseforme solai e travi, sagomatura e legatura dei ferri di armatura in acciaio B450C e getto di calcestruzzo con autobetonpompa.',
    faseLavoro: 'Fase Strutture Portanti',
    rischi: [
      {
        id: 'r15',
        descrizione: 'Ferite da taglio, puntura e abrasione con ferri d’armatura',
        fonteRischio: 'Estremità taglienti delle barre di ferro e staffe verticali sporgenti',
        conseguenze: 'Ferite lacero-contuse, rischio tetano',
        misurePreventive: 'Applicazione immediata di cappellotti protettivi in plastica a fungo (antifitto) sulle estremità dei ferri di ripresa verticali.',
        misureProtettive: 'Verifica vaccinazione antitetanica in corso di validità di tutto il personale.',
        dpiRichiesti: ['Guanti rischio meccanico alta resistenza al taglio', 'Calzature di sicurezza S3 con lamina antiperforazione'],
      },
      {
        id: 'r16',
        descrizione: 'Colpo di frusta del terminale di gomma dell’autopompa',
        fonteRischio: 'Occlusione temporanea e sblocco improvviso del tubo di mandata calcestruzzo',
        conseguenze: 'Traumi contusivi gravi, ribaltamento operatore',
        misurePreventive: 'Manovra affidata a operatore addestrato; divieto di piegare ad angolo acuto il tubo di gomma terminale.',
        misureProtettive: 'Mantenimento distanza di sicurezza degli altri operatori dal getto.',
        dpiRichiesti: ['Casco di protezione / Elmetto', 'Occhiali di protezione / Visiera', 'Stivali di gomma S5'],
      },
      {
        id: 'r17',
        descrizione: 'Crollo dell’impalcatura di sostegno per cedimento puntelli',
        fonteRischio: 'Sovraccarico improvviso di calcestruzzo fresco non distribuito uniformemente',
        conseguenze: 'Sprofondamento solaio, infortuni multipli gravissimi',
        misurePreventive: 'Calcolo della portata dei puntelli in acciaio e verifica del perfetto piombo e controventatura prima del getto.',
        misureProtettive: 'Distribuzione del getto per strati omogenei evitando accumuli concentrati.',
        dpiRichiesti: ['Casco di protezione / Elmetto', 'Calzature di sicurezza S3'],
      },
    ],
    misurePrevenzione: [
      'Garantire il disarmo solo dopo i tempi di maturazione del calcestruzzo prescritti dal Direttore dei Lavori.',
      'Durante il disarmo procedere con cautela vietando l’accesso all’area sottostante.',
    ],
    dpiRaccomandati: ['Casco di protezione / Elmetto', 'Calzature di sicurezza S3 / Stivali S5', 'Guanti rischio meccanico', 'Occhiali di protezione', 'Gilet alta visibilità'],
    attrezzatureTipiche: ['Autobetonpompa con braccio distributore', 'Vibratore per calcestruzzo a immersione (ago vibrante)', 'Cesoia tagliaferro / piegaferro', 'Puntelli telescopici in acciaio EN 1065'],
    materialiTipici: ['Calcestruzzo preconfezionato RCK 30', 'Acciaio per c.a. B450C', 'Pannelli gialli per casseratura', 'Disarmante ecologico'],
    interferenze: 'Ingombro sede stradale dell’autopompa e delle autobetoniere a rotazione.',
    note: 'In caso di getto vicino a linee elettriche aeree non isolate, rispettare la distanza minima di 5 metri.',
  },
  {
    id: 'att_impermeabilizzazioni',
    nome: 'Impermeabilizzazioni con guaine bituminose a caldo/liquide',
    categoria: 'Finiture e Impermeabilizzazioni',
    icona: '🔥',
    descrizione: 'Stesura di primer bituminoso e posa a caldo mediante fiamma a gas propano di guaine bitume-polimero ardesiate su coperture, terrazze e fondazioni.',
    faseLavoro: 'Fase Impermeabilizzazioni',
    rischi: [
      {
        id: 'r18',
        descrizione: 'Incendio ed esplosione da fughe di GPL o surriscaldamento materiali',
        fonteRischio: 'Utilizzo del cannello a fiamma viva in adiacenza a isolanti plastici o legname',
        conseguenze: 'Ustioni gravissime, sviluppo di incendi di cantiere',
        misurePreventive: 'Bombole di gas GPL posizionate in verticale all’aperto e provviste di valvola di sicurezza antiriflusso e riduttore di pressione.',
        misureProtettive: 'Presenza costante a portata di mano di almeno 2 estintori a polvere da 6 kg pronti all’uso.',
        dpiRichiesti: ['Guanti rischio termico / fiamma', 'Calzature di sicurezza S3 con suola resistente al calore', 'Indumenti in cotone 100% non sintetici'],
      },
      {
        id: 'r19',
        descrizione: 'Inalazione di fumi bituminosi e vapori da solvente (primer)',
        fonteRischio: 'Combustione del bitume e applicazione primer a rullo in aree poco areate',
        conseguenze: 'Cefalea, intossicazione acuta, irritazione mucose',
        misurePreventive: 'Applicazione solo all’aperto o con estrazione forzata; divieto assoluto di fumo durante la stesura.',
        misureProtettive: 'Maschera con filtro combinato per vapori organici (A2P3).',
        dpiRichiesti: ['Maschera respiratoria per vapori organici (A2P3)', 'Occhiali di protezione'],
      },
    ],
    misurePrevenzione: [
      'Al termine del turno di lavoro, verificare con termocamera o ispezione manuale che non vi siano focolai latenti.',
      'Chiudere le valvole delle bombole di gas e riporle nel vano bombole arieggiato.',
    ],
    dpiRaccomandati: ['Casco di protezione / Elmetto', 'Calzature di sicurezza S3 per alte temperature', 'Guanti protettivi per calore e fiamme', 'Maschera respiratoria A2P3', 'Occhiali di protezione'],
    attrezzatureTipiche: ['Cannello a gas propano con tubo raccordato a norma', 'Carrello portabombole di sicurezza', 'Cazzuola scaldagestione giunzioni', 'Estintori polvere 6 kg'],
    materialiTipici: ['Membrana bitume-polimero 4 mm ardesiata', 'Primer bituminoso di adesione', 'Gas propano in bombole'],
    interferenze: 'Presenza di altri operatori sullo stesso impalcato o copertura.',
    note: 'Vietato l’uso della fiamma libera su coperture in legno o in presenza di coibenti infiammabili (EPS/XPS non protetti).',
  },
  {
    id: 'att_intonaci_finiture',
    nome: 'Intonacatura, rasatura pareti e cappotto termico',
    categoria: 'Finiture e Rivestimenti',
    icona: '🎨',
    descrizione: 'Posa dell’intonaco di fondo premiscelato a macchina, rasatura con rete in fibra di vetro e incollaggio/tassellatura dei pannelli isolanti per cappotto termico esterno.',
    faseLavoro: 'Fase Finiture',
    rischi: [
      {
        id: 'r20',
        descrizione: 'Schizzi negli occhi di malte cementizie basiche (pH elevato)',
        fonteRischio: 'Spruzzo ad alta pressione della lancia intonacatrice',
        conseguenze: 'Lesioni corneali gravi, cheratite chimica',
        misurePreventive: 'Manutenzione periodica della lancia e dei raccordi tubazioni pressione; divieto di piegare i tubi sotto carico.',
        misureProtettive: 'Uso costante di occhiali a mascherina aderenti o visiera paraschizzi.',
        dpiRichiesti: ['Occhiali di protezione a tenuta', 'Visiera policarbonato / paraschizzi', 'Guanti rischio chimico'],
      },
      {
        id: 'r21',
        descrizione: 'Caduta da trabattelli o ponti su ruote durante la lavorazione',
        fonteRischio: 'Spostamento del trabattello con persona sopra o assenza parapetti',
        conseguenze: 'Traumi, fratture ossee',
        misurePreventive: 'Blocco permanente delle ruote con i freni di stazionamento prima di salire; divieto tassativo di spostare il trabattello con persone a bordo.',
        misureProtettive: 'Parapetto completo su 4 lati a quota 1 m con tavola fermapiede di 15 cm.',
        dpiRichiesti: ['Calzature di sicurezza S3', 'Casco di protezione / Elmetto'],
      },
    ],
    misurePrevenzione: [
      'Garantire corretta pulizia delle tubazioni dell’intonacatrice al termine del ciclo di getto.',
      'Raccogliere sfridi di pannelli isolanti in sacchi evitando la dispersione nell’ambiente circostante.',
    ],
    dpiRaccomandati: ['Casco di protezione / Elmetto', 'Calzature di sicurezza S3', 'Guanti rischio chimico/meccanico', 'Occhiali di protezione', 'Respiratore FFP2 antipolvere'],
    attrezzatureTipiche: ['Intonacatrice automatica trifase/monofase', 'Taglierina a filo caldo per polistirene (EPS)', 'Trapano miscelatore', 'Trabattello EN 1004'],
    materialiTipici: ['Intonaco premiscelato a base calce-cemento', 'Pannelli isolanti EPS / Lana di roccia', 'Collante-rasante fibrato', 'Tasselli a percussione'],
    interferenze: 'Occasionale polvere durante il carico tramoggia premiscelato.',
    note: 'In caso di contatto accidentale di malta negli occhi, lavare immediatamente per 15 minuti con flacone lavaghi e consultare il medico.',
  },
  {
    id: 'att_impianti_elettrici_idraulici',
    nome: 'Realizzazione impianti elettrici, idraulici e termici',
    categoria: 'Impiantistica',
    icona: '⚡',
    descrizione: 'Esecuzione tracce sottotraccia, posa corrugati, infilaggio cavi, montaggio tubazioni multistrato, saldatura a caldo di raccordi polietilene e collaudo impianti.',
    faseLavoro: 'Fase Impiantistica',
    rischi: [
      {
        id: 'r22',
        descrizione: 'Uso di scanalatrice e smerigliatrice per apertura tracce a muro',
        fonteRischio: 'Rotazione rapida di dischi diamantati e rimbalzo utensile',
        conseguenze: 'Ferite da taglio agli arti, schegge agli occhi, polvere densa',
        misurePreventive: 'Scanalatrice provvista di carter totale collegata ad aspiratore industriale in classe M/H.',
        misureProtettive: 'Controllo serraggio disco con apposita flangia e chiave; divieto di utilizzo a disco usurato.',
        dpiRichiesti: ['Occhiali di protezione', 'Respiratore FFP2 antipolvere', 'Otoprotettori (Cuffie / Inserti)', 'Guanti rischio meccanico'],
      },
      {
        id: 'r23',
        descrizione: 'Rischio elettrico da circuiti esistenti in tensione',
        fonteRischio: 'Intercettazione accidentale di cavi sotto tensione durante le forature a parete',
        conseguenze: 'Elettrocuzione, arco elettrico',
        misurePreventive: 'Rilevatore murale di cavi sotto tensione prima di procedere con la foratura; sezionamento generale quadro elettrico.',
        misureProtettive: 'Attrezzi manuali isolati 1000V conformi EN 60900.',
        dpiRichiesti: ['Calzature di sicurezza S3 dielettriche', 'Guanti isolanti'],
      },
    ],
    misurePrevenzione: [
      'Tutti gli utensili elettrici devono avere doppio isolamento (simbolo del doppio quadrato) ed essere alimentati da prese interbloccate o quadro di cantiere con differenziale.',
      'Saldatrici per tubi e piastre riscaldanti devono essere posizionate su supporti ignifughi non combustibili.',
    ],
    dpiRaccomandati: ['Casco di protezione / Elmetto', 'Calzature di sicurezza S3', 'Guanti rischio meccanico', 'Occhiali di protezione', 'Respiratore FFP2 antipolvere'],
    attrezzatureTipiche: ['Scanalatrice a doppio disco diamantato', 'Polifusore per tubazioni PP-R', 'Pinza crimpatrice per raccordi multistrato', 'Tassellatore a batteria'],
    materialiTipici: ['Tubi corrugati flessibili autoestinguenti', 'Cavi elettrici CPR FS17 / FG16', 'Tubazioni multistrato coibentate'],
    interferenze: 'Polvere e rumore nei locali dove operano muratori o cartongessisti.',
    note: 'Al termine dei lavori rilascio della Dichiarazione di Conformità (Di.Co.) ai sensi del D.M. 37/08.',
  },
  {
    id: 'att_pavimenti_tinteggiatura',
    nome: 'Posa pavimenti, rivestimenti e tinteggiatura interna/esterna',
    categoria: 'Finiture e Rivestimenti',
    icona: '🖌️',
    descrizione: 'Stesura di colla cementizia, taglio piastrelle in gres con tagliapiastrelle ad acqua, stuccatura fughe e tinteggiatura a rullo/pennello con idropitture traspiranti.',
    faseLavoro: 'Fase Finiture di Pregevolezza',
    rischi: [
      {
        id: 'r24',
        descrizione: 'Affaticamento articolare e postura incongrua prolungata (ginocchia/schiena)',
        fonteRischio: 'Posa piastrelle a terra su grandi metrature',
        conseguenze: 'Borsiti prerotulee, lombalgie croniche',
        misurePreventive: 'Utilizzo di ginocchiere ergonomiche imbottite certificate EN 14404 e sgabelli da posatore con ruote.',
        misureProtettive: 'Pause programmate di distensione muscolare.',
        dpiRichiesti: ['Ginocchiere di protezione EN 14404', 'Calzature di sicurezza S3', 'Guanti rischio meccanico'],
      },
      {
        id: 'r25',
        descrizione: 'Taglio e smerigliatura ceramica con formazione di polvere di silice',
        fonteRischio: 'Tagliatrice a disco per piastrelle in gres porcellanato',
        conseguenze: 'Silicosi, tagli da schegge ceramiche taglienti',
        misurePreventive: 'Uso prevalente di taglierina a incisione meccanica o banco a disco raffreddato ad acqua a ciclo chiuso.',
        misureProtettive: 'Aspirazione alla fonte in caso di ritocchi con flex.',
        dpiRichiesti: ['Occhiali di protezione', 'Respiratore FFP2 antipolvere', 'Guanti rischio meccanico'],
      },
    ],
    misurePrevenzione: [
      'Garantire costante ventilazione naturale dei locali durante l’applicazione di vernici e smalti.',
      'Uso esclusivo di trabattelli o scale doppie a pioli con blocco divaricamento conformi EN 131 per la pittura a soffitto.',
    ],
    dpiRaccomandati: ['Calzature di sicurezza S3', 'Guanti rischio meccanico', 'Ginocchiere di protezione', 'Occhiali di protezione', 'Respiratore FFP2 antipolvere'],
    attrezzatureTipiche: ['Tagliapiastrelle ad acqua e manuale', 'Mescolatore a elica', 'Scale doppie EN 131', 'Pistola / rullo per idropitture'],
    materialiTipici: ['Piastrelle in gres porcellanato', 'Adesivo cementizio C2TE S1', 'Stucco per fughe idrofugo', 'Idropittura lavabile'],
    interferenze: 'Superfici appena trattate scivolose; segnalare con cartelli "Verniciatura fresca" o "Pavimento scivoloso".',
    note: 'Lavaggio attrezzi solo nei punti stabiliti evitando scarichi inquinanti.',
  },
  {
    id: 'att_pulizia_smobilitazione',
    nome: 'Pulizia finale, smobilitazione cantiere e ripristino luoghi',
    categoria: 'Chiusura Cantiere',
    icona: '🧹',
    descrizione: 'Raccolta e differenziazione finale di residui, imballaggi e sfridi, rimozione macchinari, smontaggio baraccamenti e recinzione, bonifica e consegna dell’opera.',
    faseLavoro: 'Fase Conclusiva',
    rischi: [
      {
        id: 'r26',
        descrizione: 'Punture e tagli accidentali durante la raccolta di sfridi e chiodi',
        fonteRischio: 'Manipolazione di macerie residue, legname chiodato e imballaggi con regge metalliche',
        conseguenze: 'Ferite da taglio, infezioni',
        misurePreventive: 'Piegatura immediata o rimozione dei chiodi sporgenti dal legname da disarmo; uso di scope e pale anziché mani nude.',
        misureProtettive: 'Calzature con soletta in acciaio antiperforazione.',
        dpiRichiesti: ['Calzature di sicurezza S3', 'Guanti rischio meccanico alta resistenza'],
      },
      {
        id: 'r27',
        descrizione: 'Carico cassoni e movimentazione autocarri di sgombero',
        fonteRischio: 'Manovre di camion e sollevamento cassoni scarrabili',
        conseguenze: 'Urto pedoni, schiacciamento',
        misurePreventive: 'Moviere a terra durante l’uscita del mezzo dal cantiere; verifica assenza persone nel raggio di carico.',
        misureProtettive: 'Uso di gilet catarifrangente ad alta visibilità.',
        dpiRichiesti: ['Casco di protezione / Elmetto', 'Gilet alta visibilità', 'Calzature di sicurezza S3'],
      },
    ],
    misurePrevenzione: [
      'Garantire che tutti i rifiuti siano accompagnati dal regolare Formulario di Identificazione Rifiuti (F.I.R.).',
      'Effettuare un sopralluogo congiunto con il Committente e il CSE per la chiusura formale delle attività.',
    ],
    dpiRaccomandati: ['Casco di protezione / Elmetto', 'Calzature di sicurezza S3', 'Guanti rischio meccanico', 'Gilet alta visibilità', 'Respiratore FFP2 antipolvere'],
    attrezzatureTipiche: ['Autocarro con cassone scarrabile', 'Spazzatrici e bidoni aspirapolvere industriali', 'Carriole e attrezzi manuali'],
    materialiTipici: ['Sacconi big-bag per macerie', 'Sacchi per raccolta differenziata plastica e metallo'],
    interferenze: 'Attività svolte contemporaneamente alla presenza dei collaudatori o committenti.',
    note: 'Accertarsi di ripristinare la viabilità pubblica e i marciapiedi al termine dei lavori.',
  },
];

// ==================== CATALOGO ATTREZZATURE CON SCHEDA COMPLETA (Cap. 10) ====================
export const DEFAULT_ATTREZZATURE_CATALOGO: PosAttrezzaturaItem[] = [
  {
    id: 'att_betoniera',
    nome: 'Betoniera a bicchiere elettrica',
    categoria: 'Macchine per impasto',
    icona: '🔄',
    marca: 'Polieri / Imer',
    modelloMatricola: 'Sintesi 190 / CE-2023-4821',
    marcaturaCeConforme: true,
    verifichePeriodicheRegolari: true,
    operatoreAbilitato: 'Personale istruito e addestrato all’uso conforme al libretto',
    descrizione: 'Macchina operatrice per il confezionamento di malte e calcestruzzi in cantiere mediante rotazione del tamburo azionato da motore elettrico a 230V.',
    prescrizioniPreliminari: 'Posizionamento su terreno solido e perfettamente orizzontale; verifica visiva dell’integrità del cavo di alimentazione (tipo H07RN-F) e spina CEE a norma; divieto assoluto di rimuovere il carter copri-ingranaggi; controllo del pulsante di stop di emergenza prima dell’avvio.',
    noteSicurezza: 'È vietato inserire pale, cazzuole o mani nel tamburo mentre è in movimento. Per le operazioni di pulizia interna, staccare preventivamente la spina.',
    rischi: [
      {
        id: 'r_att_bet_1',
        descrizione: 'Contatto elettrico diretto o indiretto per danneggiamento isolamenti',
        probabilita: 2,
        danno: 3,
        livelloRischio: 6,
        classeRischio: 'Notevole',
        misurePreventive: 'Alimentazione esclusiva tramite quadro di cantiere con interruttore differenziale ad alta sensibilità Idn ≤ 30 mA; cavi protetti da schiacciamento.',
        dpiRichiesti: ['Calzature di sicurezza S3 con suola isolante'],
      },
      {
        id: 'r_att_bet_2',
        descrizione: 'Trascinamento e impigliamento negli organi di trasmissione in movimento',
        probabilita: 2,
        danno: 3,
        livelloRischio: 6,
        classeRischio: 'Notevole',
        misurePreventive: 'Carter di protezione a chiusura integrale su corona dentata e pignone; divieto di indossare abiti svolazzanti o sciarpe.',
        dpiRichiesti: ['Guanti rischio meccanico aderenti', 'Tuta da lavoro elasticizzata'],
      },
      {
        id: 'r_att_bet_3',
        descrizione: 'Inalazione polveri di cemento e calce durante il caricamento del bicchiere',
        probabilita: 3,
        danno: 2,
        livelloRischio: 6,
        classeRischio: 'Notevole',
        misurePreventive: 'Caricamento controvento mantenendo i sacchi vicini alla bocca del tamburo senza scuoterli; bagnatura preventiva.',
        dpiRichiesti: ['Respiratore FFP2 antipolvere', 'Occhiali paraschizzi'],
      },
      {
        id: 'r_att_bet_4',
        descrizione: 'Esposizione a rumore generato da motore e ribaltamento tamburo',
        probabilita: 3,
        danno: 2,
        livelloRischio: 6,
        classeRischio: 'Notevole',
        misurePreventive: 'Manutenzione periodica cuscinetti; alloggiamento a distanza dalle vie pedonali.',
        dpiRichiesti: ['Cuffie antirumore / inserti auricolari (SNR 28dB)'],
      },
    ],
    misurePrevenzione: [
      'Verificare la stabilità dei piedini di appoggio prima di ogni ciclo di lavoro.',
      'Non abbandonare la macchina in funzione senza operatore a presidio.',
      'Scollegare tassativamente l’alimentazione prima di effettuare manutenzioni o pulizie.',
    ],
    dpiNecessari: ['Casco di protezione / Elmetto', 'Calzature di sicurezza S3', 'Guanti rischio meccanico', 'Respiratore FFP2 antipolvere', 'Occhiali paraschizzi', 'Cuffie antirumore'],
  },
  {
    id: 'att_flessibile',
    nome: 'Smerigliatrice angolare (flessibile)',
    categoria: 'Utensili portatili elettrici',
    icona: '⚡',
    marca: 'Bosch Professional / Makita',
    modelloMatricola: 'GWS 22-230 / MK-8921-2023',
    marcaturaCeConforme: true,
    verifichePeriodicheRegolari: true,
    operatoreAbilitato: 'Lavoratore formato all’uso degli utensili da taglio a disco',
    descrizione: 'Elettroutensile manuale portatile impiegato per il taglio e la sbavatura di metalli, ferri di armatura, laterizi, calcestruzzo e pietre.',
    prescrizioniPreliminari: 'Verificare che il carter di protezione del disco sia saldamente orientato verso l’operatore; controllare che la velocità nominale massima del disco (RPM) sia pari o superiore a quella della macchina; divieto assoluto di usare dischi danneggiati o con diametro improprio.',
    noteSicurezza: 'Afferrare saldamente l’attrezzo con entrambe le mani; posizionarsi in modo da non trovarsi sulla traiettoria di scagliamento delle scintille; non forzare mai il taglio inclinato.',
    rischi: [
      {
        id: 'r_att_fle_1',
        descrizione: 'Rottura ed esplosione del disco con proiezione violenta di frammenti ad alta velocità',
        probabilita: 2,
        danno: 4,
        livelloRischio: 8,
        classeRischio: 'Notevole',
        misurePreventive: 'Uso esclusivo del carter parafanghi fisso; controllo integrità disco a ogni accensione; rispetto della scadenza indicata sul disco abrasivo.',
        dpiRichiesti: ['Visiera a schermo intero in policarbonato', 'Casco di protezione / Elmetto'],
      },
      {
        id: 'r_att_fle_2',
        descrizione: 'Contatto accidentale della lama con mani o arti (tagli e amputazioni)',
        probabilita: 2,
        danno: 4,
        livelloRischio: 8,
        classeRischio: 'Notevole',
        misurePreventive: 'Impugnatura a due mani con impugnatura supplementare montata; attesa del completo arresto del disco prima di posare l’attrezzo.',
        dpiRichiesti: ['Guanti rischio meccanico alta resistenza antitaglio'],
      },
      {
        id: 'r_att_fle_3',
        descrizione: 'Esposizione a rumore e vibrazioni trasmesse al sistema mano-braccio (HAV)',
        probabilita: 3,
        danno: 2,
        livelloRischio: 6,
        classeRischio: 'Notevole',
        misurePreventive: 'Alternanza delle mansioni per limitare il tempo di esposizione continua; impugnature antivibranti.',
        dpiRichiesti: ['Cuffie antirumore', 'Guanti antivibranti'],
      },
    ],
    misurePrevenzione: [
      'Bloccare rigidamente i pezzi da tagliare su banco da lavoro con morse o morsetti prima di accendere la smerigliatrice.',
      'Non orientare il flusso di scintille verso colleghi, tubazioni gas o materiali combustibili.',
    ],
    dpiNecessari: ['Visiera a schermo intero in policarbonato', 'Guanti rischio meccanico', 'Cuffie antirumore', 'Calzature di sicurezza S3', 'Respiratore FFP2 antipolvere'],
  },
  {
    id: 'att_demolitore',
    nome: 'Martello demolitore / perforatore elettropneumatico',
    categoria: 'Attrezzature di demolizione',
    icona: '🔨',
    marca: 'Hilti / DeWalt',
    modelloMatricola: 'TE 1000-AVR / DW-7890-CE',
    marcaturaCeConforme: true,
    verifichePeriodicheRegolari: true,
    operatoreAbilitato: 'Lavoratore addestrato con verifica idoneità sanitaria per vibrazioni',
    descrizione: 'Martello per demolizioni controllate di intonaci, massetti, pavimentazioni e carotaggi su murature in laterizio o calcestruzzo.',
    prescrizioniPreliminari: 'Verifica dello stato delle punte/scalpelli (blocco corretto nel mandrino SDS-Max); accertamento preventivo con cercametalli/cercaservizi dell’assenza di cavi elettrici in tensione o tubi idraulici sotto traccia.',
    noteSicurezza: 'Impugnare con entrambe le mani assumendo postura eretta ed equilibrata; non fare leva laterale con lo scalpello inserito.',
    rischi: [
      {
        id: 'r_att_dem_1',
        descrizione: 'Vibrazioni trasmesse al sistema mano-braccio con rischio patologie osteoarticolari',
        probabilita: 3,
        danno: 3,
        livelloRischio: 9,
        classeRischio: 'Elevato',
        misurePreventive: 'Uso di apparecchi moderni con sistema antivibrante attivo (AVR); pause programmate ogni 45 minuti di impiego continuativo.',
        dpiRichiesti: ['Guanti antivibranti certificati ISO 10819'],
      },
      {
        id: 'r_att_dem_2',
        descrizione: 'Proiezione di schegge e calcinacci agli occhi e al volto',
        probabilita: 3,
        danno: 3,
        livelloRischio: 9,
        classeRischio: 'Elevato',
        misurePreventive: 'Schermatura della zona con teli paraschegge; allontanamento dei non addetti dal raggio d’azione.',
        dpiRichiesti: ['Occhiali a mascherina a tenuta', 'Casco di protezione / Elmetto'],
      },
      {
        id: 'r_att_dem_3',
        descrizione: 'Rumore elevato con Leq superiore a 85 dB(A)',
        probabilita: 4,
        danno: 2,
        livelloRischio: 8,
        classeRischio: 'Notevole',
        misurePreventive: 'Attrezzatura a marcatura CE con bassi livelli di potenza acustica; protezione acustica per operatore e addetti vicini.',
        dpiRichiesti: ['Cuffie antirumore ad alta attenuazione (SNR > 30dB)'],
      },
    ],
    misurePrevenzione: [
      'Bagnare preventivamente con acqua nebulizzata le superfici da demolire per abbattere le polveri sottili.',
      'Scollegare la spina prima di sostituire lo scalpello o effettuare il controllo del livello olio lubrificante.',
    ],
    dpiNecessari: ['Occhiali a mascherina a tenuta', 'Cuffie antirumore', 'Respiratore FFP2 antipolvere', 'Guanti rischio meccanico', 'Calzature di sicurezza S3'],
  },
  {
    id: 'att_sega_circolare',
    nome: 'Sega circolare da banco per legno',
    categoria: 'Macchine per carpenteria',
    icona: '🪚',
    marca: 'Comedil / Bosch Professional',
    modelloMatricola: 'GTS 10 XC / SC-5510-CE',
    marcaturaCeConforme: true,
    verifichePeriodicheRegolari: true,
    operatoreAbilitato: 'Carpentiere formato e abilitato all’uso delle macchine fisse per legno',
    descrizione: 'Banco sega fisso per il taglio longitudinale e trasversale di tavole, morali e pannelli per armature e casseri edili.',
    prescrizioniPreliminari: 'Presenza e corretta regolazione del coltello divisore a max 5 mm dalla lama; carter basculante di protezione lama perfettamente mobile; interruttore a relè di minima tensione; pulsante di emergenza a fungo a portata di mano/piede.',
    noteSicurezza: 'Uso obbligatorio dell’apposito spingitoio in legno o plastica per l’avanzamento degli ultimi 30 cm di pezzo.',
    rischi: [
      {
        id: 'r_att_seg_1',
        descrizione: 'Contatto della lama rotante con le mani durante l’avanzamento del legno',
        probabilita: 2,
        danno: 4,
        livelloRischio: 8,
        classeRischio: 'Notevole',
        misurePreventive: 'Cuffia di protezione lama regolata all’altezza minima del pezzo; utilizzo obbligatorio dello spingitoio.',
        dpiRichiesti: ['Guanti aderenti da lavoro (vietati guanti larghi)', 'Calzature di sicurezza S3'],
      },
      {
        id: 'r_att_seg_2',
        descrizione: 'Rifiuto o espulsione violenta del pezzo di legno all’indietro contro l’operatore',
        probabilita: 2,
        danno: 3,
        livelloRischio: 6,
        classeRischio: 'Notevole',
        misurePreventive: 'Presenza costante del coltello divisore conforme allo spessore della lama; evitare legname con chiodi o nodi instabili.',
        dpiRichiesti: ['Grembiule protettivo', 'Occhiali di sicurezza'],
      },
    ],
    misurePrevenzione: [
      'Non tagliare pezzi di dimensioni inferiori a 15 cm a mano libera.',
      'Mantenere sgombro da residui di segatura il piano di lavoro e l’area circostante.',
    ],
    dpiNecessari: ['Occhiali di protezione', 'Cuffie antirumore', 'Respiratore FFP2 antipolvere', 'Calzature di sicurezza S3'],
  },
  {
    id: 'att_miniescavatore',
    nome: 'Miniescavatore cingolato 18-35 q.li',
    categoria: 'Macchine movimento terra',
    icona: '🚜',
    marca: 'Kubota / Yanmar',
    modelloMatricola: 'KX027-4 / KY-3091-2022',
    marcaturaCeConforme: true,
    verifichePeriodicheRegolari: true,
    operatoreAbilitato: 'Conduttore abilitato con patentino macchine movimento terra (Accordo Stato-Regioni 22/02/2012)',
    descrizione: 'Macchina semovente a cingoli per scavo di trincee, sbancamenti, carico terra su camion e movimentazione carichi in cantiere.',
    prescrizioniPreliminari: 'Cabina ROPS (protezione antiribaltamento) e FOPS (protezione caduta oggetti); cinture di sicurezza allacciate; specchi retrovisori e telecamera posteriore puliti; avvisatore acustico e ottico di retromarcia funzionante.',
    noteSicurezza: 'Delimitare la zona di rotazione della torretta; vietato il transito o lo stazionamento di persone nel raggio di lavoro del braccio.',
    rischi: [
      {
        id: 'r_att_esc_1',
        descrizione: 'Investimento o schiacciamento di pedoni o altri lavoratori in cantiere',
        probabilita: 2,
        danno: 4,
        livelloRischio: 8,
        classeRischio: 'Notevole',
        misurePreventive: 'Transennamento rigido dell’area di manovra; presenza di moviere a terra; rispetto delle distanze minime di sicurezza.',
        dpiRichiesti: ['Gilet alta visibilità per tutto il personale a terra', 'Casco di protezione / Elmetto'],
      },
      {
        id: 'r_att_esc_2',
        descrizione: 'Ribaltamento della macchina per cedimento del terreno o pendenze eccessive',
        probabilita: 2,
        danno: 4,
        livelloRischio: 8,
        classeRischio: 'Notevole',
        misurePreventive: 'Mantenersi ad almeno 1,50 m dal ciglio degli scavi; posizionamento lama dozer a terra durante lo scavo; rispetto pendenze massime.',
        dpiRichiesti: ['Cintura di sicurezza allacciata in cabina'],
      },
    ],
    misurePrevenzione: [
      'Prima di scavare, verificare l’assenza di sottoservizi (gasdotto, cavi elettrici) mediante planimetrie o indagine manuale.',
      'Non utilizzare la benna come mezzo di sollevamento di persone.',
    ],
    dpiNecessari: ['Casco di protezione / Elmetto', 'Calzature di sicurezza S3', 'Gilet alta visibilità', 'Cuffie antirumore'],
  },
  {
    id: 'att_gru_autocarro',
    nome: 'Autocarro con gru retrocabina',
    categoria: 'Apparecchi di sollevamento',
    icona: '🚛',
    marca: 'Iveco / Fassi',
    modelloMatricola: 'F115A / IV-2891-CE',
    marcaturaCeConforme: true,
    verifichePeriodicheRegolari: true,
    operatoreAbilitato: 'Operatore con abilitazione gru su autocarro (Accordo Stato-Regioni 22/02/2012)',
    descrizione: 'Autocarro per trasporto materiali dotato di gru idraulica per il carico, scarico e sollevamento in quota di bancali e manufatti.',
    prescrizioniPreliminari: 'Stabilizzatori completamente estesi su piastre di ripartizione del carico; verifica livella a bolla; assenza di linee elettriche aeree nel raggio di 5 metri; controllo furgone e gancio con sicura a scatto integra.',
    noteSicurezza: 'Movimentare i carichi lentamente evitando oscillazioni; vietato il passaggio dei carichi sospesi al di sopra dei lavoratori o della pubblica via.',
    rischi: [
      {
        id: 'r_att_gru_1',
        descrizione: 'Caduta del carico per rottura imbracature o errato aggancio',
        probabilita: 2,
        danno: 4,
        livelloRischio: 8,
        classeRischio: 'Notevole',
        misurePreventive: 'Verifica fasce e catene certificate CE con targhetta portata; uso esclusivo della sicura al gancio; carichi imbracati a doppio cappio.',
        dpiRichiesti: ['Casco di protezione / Elmetto', 'Calzature di sicurezza S3'],
      },
      {
        id: 'r_att_gru_2',
        descrizione: 'Contatto o scarica elettrica con linee aeree AT/MT in tensione',
        probabilita: 1,
        danno: 4,
        livelloRischio: 4,
        classeRischio: 'Accettabile',
        misurePreventive: 'Distanza di sicurezza minima di 5 metri da linee aeree non isolate; presenza di moviere con compiti di sorveglianza.',
        dpiRichiesti: ['Casco dielettrico', 'Guanti isolanti'],
      },
    ],
    misurePrevenzione: [
      'Delimitare con nastro bicolore o transenne l’intero raggio di rotazione del braccio durante le manovre.',
      'Sospendere i sollevamenti in caso di raffiche di vento superiori a 30 km/h.',
    ],
    dpiNecessari: ['Casco di protezione / Elmetto', 'Calzature di sicurezza S3', 'Gilet alta visibilità', 'Guanti rischio meccanico'],
  },
  {
    id: 'att_ple',
    nome: 'Piattaforma di lavoro elevabile (PLE)',
    categoria: 'Piattaforme di lavoro in quota',
    icona: '🏗️',
    marca: 'Genie / JLG',
    modelloMatricola: 'Z-45/25J / GE-4421-2023',
    marcaturaCeConforme: true,
    verifichePeriodicheRegolari: true,
    operatoreAbilitato: 'Operatore provvisto di patentino PLE con e senza stabilizzatori',
    descrizione: 'Piattaforma aerea a braccio articolato per interventi in quota su facciate, coperture, grondaie e impianti.',
    prescrizioniPreliminari: 'Posizionamento su superficie pianeggiante e portante; verifica funzionamento dei comandi sia a terra che in cestello; ancoraggio dell’imbracatura con cordino di trattenuta al punto di ancoraggio certificato (EN 795) del cestello.',
    noteSicurezza: 'Vietato sporgersi oltre il parapetto del cestello, salire sui correnti o usare scale all’interno del cestello; vietato scendere dalla piattaforma in quota se non espressamente autorizzato da specifica procedura.',
    rischi: [
      {
        id: 'r_att_ple_1',
        descrizione: 'Caduta dall’alto per sbalzo o ribaltamento del cestello',
        probabilita: 2,
        danno: 4,
        livelloRischio: 8,
        classeRischio: 'Notevole',
        misurePreventive: 'Obbligo assoluto di imbracatura di sicurezza EN 361 con cordino EN 354/358 vincolato al punto UNI EN 795 interno.',
        dpiRichiesti: ['Imbracatura di sicurezza con cordino di trattenuta', 'Casco con sottogola'],
      },
    ],
    misurePrevenzione: [
      'Controllo preventivo della portata utile max del cestello (persone + attrezzi).',
      'Area a terra transennata contro il pericolo di caduta accidentale di oggetti.',
    ],
    dpiNecessari: ['Imbracatura di sicurezza con cordino', 'Casco con sottogola', 'Calzature di sicurezza S3', 'Gilet alta visibilità'],
  },
  {
    id: 'att_vibratore_cls',
    nome: 'Vibratore per calcestruzzo ad ago elettrico',
    categoria: 'Attrezzature per getti',
    icona: '⚡',
    marca: 'Wacker Neuson / Enar',
    modelloMatricola: 'IRFU 45 / WN-2210-CE',
    marcaturaCeConforme: true,
    verifichePeriodicheRegolari: true,
    operatoreAbilitato: 'Lavoratore istruito sull’uso conforme',
    descrizione: 'Ago vibrante elettrico immerso nel conglomerato cementizio fresco per la compattazione ottimale dei getti strutturali.',
    prescrizioniPreliminari: 'Controllo tenuta stagna dell’ago e del cavo isolato in gomma speciale resistente all’abrasione; convertitore elettronico incorporato con protezione differenziale.',
    noteSicurezza: 'Non trascinare l’ago tirandolo dal cavo di alimentazione; risciacquare accuratamente l’ago prima della presa del calcestruzzo.',
    rischi: [
      {
        id: 'r_att_vib_1',
        descrizione: 'Elettrocuzione da contatto con acqua e miscela cementizia bagnata',
        probabilita: 1,
        danno: 4,
        livelloRischio: 4,
        classeRischio: 'Accettabile',
        misurePreventive: 'Alimentazione tramite presa interbloccata protetta da salvavita a 30 mA.',
        dpiRichiesti: ['Stivali di sicurezza isolanti in gomma S5', 'Guanti isolanti impermeabili'],
      },
    ],
    misurePrevenzione: ['Spegnere l’interruttore prima di estrarre l’ago dal getto.', 'Uso di stivali impermeabili con puntale e lamina d’acciaio.'],
    dpiNecessari: ['Stivali di sicurezza impermeabili S5', 'Guanti in nitrile/gomma', 'Casco di protezione / Elmetto'],
  },
];

// ==================== CATALOGO OPERE PROVVISIONALI CON SCHEDA COMPLETA (Cap. 11) ====================
export const DEFAULT_OPERE_PROVVISIONALI_LIST: PosOperaProvvisionaleItem[] = [
  {
    id: 'op_1',
    tipo: 'Ponteggio metallico fisso a telai prefabbricati',
    categoria: 'Ponteggi fissi',
    icona: '🏢',
    descrizione: 'Struttura metallica modulare perimetrale ancorata all’edificio per lavorazioni su facciate fino a 20 m di quota, comprensiva di impalcati metallici, parapetti a 1,00 m, fermapiedi da 20 cm e mantovana parasassi.',
    prescrizioniPreliminari: 'Montaggio eseguito solo da personale con patentino ponteggiatori sotto sorveglianza del Preposto; conformità rigorosa al Pi.M.U.S. e libretto ministeriale; collegamento a terra con dispersore; verifica ancoraggi con prova di estrazione.',
    marca: 'Pilosio / Marcegaglia / Ceta',
    modello: 'Ponteggio a boccole / telai prefabbricati All. XIX D.Lgs. 81/08',
    autorizzazioneMinisteriale: 'Autorizzazione Ministeriale e Libretto Costruttore / Pi.M.U.S. allegato al POS',
    conformitaNormativa: 'UNI EN 12810 / UNI EN 12811 - D.Lgs. 81/08 Allegato XIX e XXII',
    verifichePeriodiche: true,
    responsabileControllo: 'Preposto ai ponteggi / Capo Cantiere',
    noteSicurezza: 'Verifica serraggio ancoraggi e collegamento a terra con dispersore prima dell’inizio delle attività; redazione del verbale di controllo settimanale.',
    rischi: [
      {
        id: 'r_op_pon_1',
        descrizione: 'Caduta dall’alto di lavoratori durante le fasi di montaggio, uso e smontaggio',
        probabilita: 2,
        danno: 4,
        livelloRischio: 8,
        classeRischio: 'Notevole',
        misurePreventive: 'Uso costante di imbracatura di sicurezza con cordino a Y con assorbitore agganciato a linee vita verticali o montanti sovrastanti; montaggio del parapetto di protezione dal basso.',
        dpiRichiesti: ['Imbracatura di sicurezza completa EN 361 con doppio connettore', 'Casco con sottogola EN 397'],
      },
      {
        id: 'r_op_pon_2',
        descrizione: 'Caduta di materiali e utensili dagli impalcati su aree sottostanti',
        probabilita: 2,
        danno: 4,
        livelloRischio: 8,
        classeRischio: 'Notevole',
        misurePreventive: 'Tavole fermapiede perimetrali di altezza non inferiore a 20 cm; teli ombreggianti antipolvere e parasassi; mantovana parasassi inclinata a quota 3 m.',
        dpiRichiesti: ['Casco di protezione per chiunque transiti nell’area sottostante'],
      },
      {
        id: 'r_op_pon_3',
        descrizione: 'Scariche atmosferiche e fulminazione della struttura metallica',
        probabilita: 1,
        danno: 4,
        livelloRischio: 4,
        classeRischio: 'Accettabile',
        misurePreventive: 'Valutazione del rischio scariche atmosferiche; collegamento a terra dei montanti con picchetti dispersori certificati CEI.',
        dpiRichiesti: ['Calzature di sicurezza con suola antistatica'],
      },
    ],
    misurePrevenzione: [
      'Controllare la presenza del cartello di divieto di accesso al ponteggio durante montaggio/smontaggio.',
      'Divieto assoluto di rimuovere ancoraggi, diagonali o tavole fermapiede per esigenze di lavoro senza autorizzazione del Preposto.',
      'Sospendere l’utilizzo in presenza di ghiaccio o vento forte superiore a 40 km/h.',
    ],
    dpiNecessari: ['Imbracatura di sicurezza con cordino e assorbitore', 'Casco con sottogola', 'Calzature di sicurezza S3', 'Guanti rischio meccanico'],
  },
  {
    id: 'op_2',
    tipo: 'Trabattello su ruote a torre mobile',
    categoria: 'Ponti su ruote',
    icona: '🪜',
    descrizione: 'Ponte su ruote prefabbricato in lega di alluminio o acciaio per lavorazioni interne di finitura, intonaci, rasatura e tinteggiatura a soffitto fino a 5,00 m.',
    prescrizioniPreliminari: 'Montaggio conforme alle istruzioni del fabbricante (UNI EN 1004-1); bloccaggio integrale delle 4 ruote tramite freno prima di salire; installazione dei 4 stabilizzatori inclinati quando l’altezza supera i 2 metri; parapetti completi con fermapiede su tutti i lati del piano di calpestio.',
    marca: 'Frigerio / Faraone / Marchetti',
    modello: 'Torre su ruote serie professionale HD UNI EN 1004',
    autorizzazioneMinisteriale: 'Manuale d’uso del fabbricante conforme UNI EN 1004-1 / Certificato CE',
    conformitaNormativa: 'UNI EN 1004:2021 - D.Lgs. 81/08 art. 140',
    verifichePeriodiche: true,
    responsabileControllo: 'Preposto di cantiere',
    noteSicurezza: 'Bloccare tassativamente tutte le ruote prima di salire. Vietato lo spostamento con persone o carichi sul piano di lavoro.',
    rischi: [
      {
        id: 'r_op_trab_1',
        descrizione: 'Ribaltamento del trabattello per terreno sconnesso, urto o spostamento con persone a bordo',
        probabilita: 2,
        danno: 4,
        livelloRischio: 8,
        classeRischio: 'Notevole',
        misurePreventive: 'Staffaggi e stabilizzatori estesi su superficie piana; divieto tassativo di trainare o spingere il trabattello con operatore presente sul piano di lavoro.',
        dpiRichiesti: ['Casco con sottogola', 'Calzature di sicurezza S3'],
      },
      {
        id: 'r_op_trab_2',
        descrizione: 'Caduta dal piano di calpestio per assenza di parapetto o botola lasciata aperta',
        probabilita: 2,
        danno: 4,
        livelloRischio: 8,
        classeRischio: 'Notevole',
        misurePreventive: 'Parapetto completo a 1,00 m con corrente intermedio e fermapiedi; chiusura obbligatoria della botola d’accesso subito dopo la salita.',
        dpiRichiesti: ['Calzature di sicurezza S3 antiscivolo'],
      },
    ],
    misurePrevenzione: [
      'Accesso al piano di lavoro solo dall’interno tramite le scalette integrate e mai arrampicandosi dall’esterno.',
      'Non sovraccaricare il piano con cumuli eccessivi di materiale (rispettare portata massima da libretto, tipicamente 200 kg/m²).',
    ],
    dpiNecessari: ['Casco di protezione / Elmetto', 'Calzature di sicurezza S3', 'Guanti rischio meccanico'],
  },
  {
    id: 'op_3',
    tipo: 'Parapetti provvisori prefabbricati di sicurezza',
    categoria: 'Protezioni bordi solai',
    icona: '🛡️',
    descrizione: 'Montanti metallici con morsa di serraggio, correnti superiore e intermedio in acciaio o legno e tavole fermapiede per protezione contro la caduta da bordi solai, balconi, rampe scale e vuoti verso l’esterno.',
    prescrizioniPreliminari: 'Installazione dei montanti a interasse massimo di 1,50 m; serraggio a vite controllato sulla soletta portante; altezza minima del corrente superiore di 1,00 m dal piano di calpestio; corrente intermedio posizionato a circa 50 cm; tavola fermapiede alta almeno 15 cm a stretto contatto con il piano.',
    marca: 'Comipont / Sicurblind / Alsipercha',
    modello: 'Morsa regolabile per soletta certificata UNI EN 13374 Classe A',
    autorizzazioneMinisteriale: 'Certificazione di conformità del produttore',
    conformitaNormativa: 'UNI EN 13374 (Classe A e Classe B) - D.Lgs. 81/08 art. 126',
    verifichePeriodiche: true,
    responsabileControllo: 'Preposto di cantiere',
    noteSicurezza: 'Altezza minima 1,00 m dal piano di calpestio, corrente intermedio a 0,50 m e tavola fermapiede di almeno 15-20 cm.',
    rischi: [
      {
        id: 'r_op_par_1',
        descrizione: 'Cedimento del parapetto o sfilamento della morsa per errato serraggio o spinta anomala',
        probabilita: 1,
        danno: 4,
        livelloRischio: 4,
        classeRischio: 'Accettabile',
        misurePreventive: 'Verifica quotidiana del serraggio delle morse; rispetto della classe del parapetto in funzione della pendenza del piano di calpestio.',
        dpiRichiesti: ['Casco di protezione / Elmetto', 'Calzature di sicurezza S3'],
      },
    ],
    misurePrevenzione: [
      'Installare i parapetti prima dell’avvio di qualsiasi lavorazione sul solaio o balcone.',
      'Non poggiare o accumulare materiali pesanti contro i correnti del parapetto.',
    ],
    dpiNecessari: ['Casco di protezione / Elmetto', 'Calzature di sicurezza S3', 'Guanti rischio meccanico'],
  },
  {
    id: 'op_4',
    tipo: 'Puntellature metalliche telescopiche per solai',
    categoria: 'Opere di puntellamento',
    icona: '🏛️',
    descrizione: 'Binde e puntelli regolabili in acciaio ad alta portata con forcelle superiori e tripodi di sostegno per banchinaggio travi e solai in c.a. o prefabbricati.',
    prescrizioniPreliminari: 'Verifica della portata del solaio sottostante; controllo del perfetto allineamento verticale; inserimento del perno di sicurezza in acciaio originale (vietato l’uso di chiodi o tondini improvvisati); serraggio della ghiera di regolazione; impiego di basette e tavole ripartitrici su sottofondi non rigidi.',
    marca: 'Doka / Peri / GBM',
    modello: 'Puntello telescopico DIN EN 1065 Classe D/E',
    autorizzazioneMinisteriale: 'Relazione di calcolo strutturale e libretto costruttore',
    conformitaNormativa: 'UNI EN 1065 (Puntelli telescopici regolabili in acciaio)',
    verifichePeriodiche: true,
    responsabileControllo: 'Capo cantiere / Carpentiere abilitato',
    noteSicurezza: 'Controllo della perfetta verticalità, inserimento perni di sicurezza originali e verifica portata massima ammessa.',
    rischi: [
      {
        id: 'r_op_pun_1',
        descrizione: 'Sbandamento o collasso della puntellatura sotto il peso del calcestruzzo fresco gettato',
        probabilita: 1,
        danno: 4,
        livelloRischio: 4,
        classeRischio: 'Accettabile',
        misurePreventive: 'Schema di posa approvato dal Direttore Lavori/Progettista; controventature trasversali con tubi e giunti; divieto di getto concentrato con benna.',
        dpiRichiesti: ['Casco di protezione / Elmetto', 'Calzature di sicurezza S3'],
      },
    ],
    misurePrevenzione: [
      'Disarmo eseguito solo dopo raggiungimento della resistenza prescritta del calcestruzzo (min 28 gg o certificato cubetti).',
      'Smontaggio procedendo dall’alto verso il basso con gradualità.',
    ],
    dpiNecessari: ['Casco di protezione / Elmetto', 'Calzature di sicurezza S3', 'Guanti rischio meccanico'],
  },
  {
    id: 'op_5',
    tipo: 'Scale portatili a pioli e doppie a castello',
    categoria: 'Scale portatili',
    icona: '🧗',
    descrizione: 'Scale in alluminio a gradini larghi con piattaforma superiore, parapetto di trattenuta e piedini antiscivolo, impiegate per il transito fra livelli o per interventi puntuali di brevissima durata.',
    prescrizioniPreliminari: 'Conformità alla norma UNI EN 131; piedini di gomma integri e non usurati; inclinazione di posa a 70°-75° per scale in appoggio; sporgenza minima di 1,00 m oltre il piano di sbarco superiore con fissaggio rigido del montante; dispositivo anti-divaricamento per scale doppie.',
    marca: 'Svelt / Marchetti',
    modello: 'Scala professionale alluminio EN 131-1/2',
    autorizzazioneMinisteriale: 'Certificato di conformità costruttore',
    conformitaNormativa: 'UNI EN 131-1/2/3 - D.Lgs. 81/08 art. 113',
    verifichePeriodiche: true,
    responsabileControllo: 'Lavoratore addetto e Preposto',
    noteSicurezza: 'Piedini in gomma antiscivolo integri; aggancio o vincolo superiore se usate come passaggio; divieto di utilizzo dell’ultimo gradino.',
    rischi: [
      {
        id: 'r_op_sca_1',
        descrizione: 'Scivolamento della base o ribaltamento laterale della scala',
        probabilita: 2,
        danno: 3,
        livelloRischio: 6,
        classeRischio: 'Notevole',
        misurePreventive: 'Posa su base solida non cedevole né viscida; vincolo superiore di trattenuta; salita mantenendo 3 punti di appoggio.',
        dpiRichiesti: ['Calzature di sicurezza S3 con suola antiscivolo SRB'],
      },
    ],
    misurePrevenzione: [
      'Vietato l’uso della scala da parte di due persone contemporaneamente.',
      'Non sporgersi lateralmente con il busto oltre i montanti della scala.',
    ],
    dpiNecessari: ['Calzature di sicurezza S3', 'Casco con sottogola', 'Guanti rischio meccanico'],
  },
  {
    id: 'op_6',
    tipo: 'Passerelle e andatoie pedonali per scavi e solai',
    categoria: 'Vie di passaggio provvisorie',
    icona: '🌉',
    descrizione: 'Impalcati provvisori in tavoloni da ponteggio di spessore minimo 4 cm o passerelle metalliche prefabbricate dotate di parapetti completi per il superamento sicuro di scavi di fondazione o aperture su solai.',
    prescrizioniPreliminari: 'Larghezza minima di 60 cm per senso unico (1,20 m se a doppio senso); parapetti normali con corrente a 1,00 m, corrente intermedio e tavola fermapiede su entrambi i lati; pendenza max 50% con risalti trasversali antisdrucciolo; appoggio solido e staffato alle estremità.',
    marca: 'Carpenteria di cantiere / Prefabbricata',
    modello: 'Passerella modulare D.Lgs. 81/08 art. 130',
    autorizzazioneMinisteriale: 'Conformità schemi tipo D.Lgs. 81/08 art. 130',
    conformitaNormativa: 'D.Lgs. 81/08 art. 130 - UNI EN 12811',
    verifichePeriodiche: true,
    responsabileControllo: 'Preposto di cantiere',
    noteSicurezza: 'Larghezza minima 60 cm (1,20 m se a doppio senso), dotate di parapetti completi su entrambi i lati e pendenza non superiore al 50% con risalti.',
    rischi: [
      {
        id: 'r_op_pas_1',
        descrizione: 'Caduta all’interno dello scavo durante il passaggio pedonale',
        probabilita: 1,
        danno: 4,
        livelloRischio: 4,
        classeRischio: 'Accettabile',
        misurePreventive: 'Parapetti continui su entrambi i lati; divieto di accumulare attrezzi o macerie sulla passerella.',
        dpiRichiesti: ['Calzature di sicurezza S3', 'Casco di protezione'],
      },
    ],
    misurePrevenzione: [
      'Verificare costantemente che le tavole non siano flessibili o imbarcate.',
      'Mantenere pulito il piano di calpestio da fango, oli o detriti scivolosi.',
    ],
    dpiNecessari: ['Casco di protezione / Elmetto', 'Calzature di sicurezza S3'],
  },
];

// ==================== CATALOGO SOSTANZE CHIMICHE CON SCHEDA COMPLETA (Cap. 12) ====================
export const DEFAULT_SOSTANZE_CATALOGO: PosSostanzaItem[] = [
  {
    id: 'sost_cemento',
    nomeCommerciale: 'Cemento Portland e conglomerati cementizi',
    utilizzoFase: 'Opere murarie, getti strutturali in c.a., malte di allettamento',
    schedaSicurezzaPresente: true,
    pittogrammiPericolo: ['Corrosivo (GHS05)', 'Irritante (GHS07)', 'Pericolo salute (GHS08)'],
    dpiSpecifici: ['Guanti rischio chimico/meccanico in nitrile/neoprene', 'Occhiali a mascherina a tenuta', 'Respiratore FFP2 antipolvere', 'Calzature di sicurezza S3'],
    produttore: 'Italcementi / Buzzi Unicem / CE EN 197-1',
    frasiH: 'H315: Provoca irritazione cutanea; H318: Provoca gravi lesioni oculari; H335: Può irritare le vie respiratorie; H317: Reazione allergica cutanea (Cromo VI ridotto < 2 ppm a norma CE 1907/2006).',
    descrizione: 'Polvere minerale inorganica macinata finemente, composta da clinker Portland, gesso e additivi idraulici che, a contatto con l’acqua, sviluppa reazione fortemente alcalina (pH > 12.5).',
    prescrizioniSicurezza: 'Stoccaggio in ambiente asciutto e ventilato su bancali al coperto; apertura sacchi senza strappo violento per ridurre la polvere; divieto di contatto diretto con pelle bagnata o occhi; lavare immediatamente con abbondante acqua corrente fresca in caso di contatto accidentale.',
    rischi: [
      {
        id: 'r_sost_cem_1',
        descrizione: 'Gravi ustioni chimiche e lesioni corneali oculari per contatto accidentale con malta o polvere',
        probabilita: 2,
        danno: 4,
        livelloRischio: 8,
        classeRischio: 'Notevole',
        misurePreventive: 'Uso costante di occhiali a tenuta ermetica durante miscelazione e getto; disponibilità di flacone lavaggi oculari sterile in cantiere.',
        dpiRichiesti: ['Occhiali a mascherina ermetica EN 166', 'Guanti chimici EN 374'],
      },
      {
        id: 'r_sost_cem_2',
        descrizione: 'Dermatiti da contatto e sensibilizzazione allergica cutanea',
        probabilita: 3,
        danno: 2,
        livelloRischio: 6,
        classeRischio: 'Notevole',
        misurePreventive: 'Guanti da lavoro impermeabili con manichetta protettiva; creme barriera protettive per la pelle; igiene accurata mani a fine turno.',
        dpiRichiesti: ['Guanti in nitrile/gomma pesante EN 388/374'],
      },
      {
        id: 'r_sost_cem_3',
        descrizione: 'Inalazione polveri sottili con irritazione dell’albero respiratorio e tosse',
        probabilita: 3,
        danno: 2,
        livelloRischio: 6,
        classeRischio: 'Notevole',
        misurePreventive: 'Impiego di premiscelati umidificati; bagnatura delle polveri; miscelazione con captatori o all’aperto.',
        dpiRichiesti: ['Respiratore FFP2 antipolvere EN 149'],
      },
    ],
    misurePrevenzione: [
      'Non consumare cibi o bevande prima di essersi lavati le mani dopo la manipolazione di malte e cementi.',
      'Sostituire immediatamente indumenti o calzature impregnati di impasto fresco di calcestruzzo.',
    ],
  },
  {
    id: 'sost_intonaco',
    nomeCommerciale: 'Intonaco premiscelato a base calce idraulica e cemento',
    utilizzoFase: 'Intonacatura pareti interne ed esterne, rinzaffo e finitura',
    schedaSicurezzaPresente: true,
    pittogrammiPericolo: ['Corrosivo (GHS05)', 'Irritante (GHS07)'],
    dpiSpecifici: ['Guanti impermeabili in nitrile/lattice pesante', 'Occhiali paraschizzi', 'Mascherina FFP2'],
    produttore: 'Fassa Bortolo / Gras Calce / Weber Saint-Gobain',
    frasiH: 'H315: Provoca irritazione cutanea; H318: Provoca lesioni oculari gravi; H335: Può irritare le vie respiratorie.',
    descrizione: 'Premiscelato secco a base di calce idrata, cemento Portland, sabbie selezionate e additivi specifici, applicabile sia a mano che a macchina.',
    prescrizioniSicurezza: 'Conservare i sacchi integri al riparo dall’umidità; non superare le pressioni consigliate nell’intonacatrice meccanica per evitare spruzzi violenti.',
    rischi: [
      {
        id: 'r_sost_int_1',
        descrizione: 'Lesioni oculari per schizzi di intonaco ad alta pressione da intonacatrice',
        probabilita: 2,
        danno: 3,
        livelloRischio: 6,
        classeRischio: 'Notevole',
        misurePreventive: 'Controllo tenuta manicotti intonacatrice; uso di occhiali paraschizzi.',
        dpiRichiesti: ['Occhiali paraschizzi EN 166', 'Casco protettivo'],
      },
    ],
    misurePrevenzione: [
      'Garantire il lavaggio accurato della lancia intonacatrice a fine turno.',
      'Dotare il personale di guanti impermeabili con polsino protettivo.',
    ],
  },
  {
    id: 'sost_rasante',
    nomeCommerciale: 'Rasante cementizio fibrato per cappotti e intonaci',
    utilizzoFase: 'Rasatura armata con rete porta-intonaco su sistemi a cappotto',
    schedaSicurezzaPresente: true,
    pittogrammiPericolo: ['Irritante (GHS07)'],
    dpiSpecifici: ['Guanti da lavoro impermeabili', 'Occhiali di protezione', 'Mascherina FFP2'],
    produttore: 'Caparol / Baumit / RÖFIX',
    frasiH: 'H315: Provoca irritazione cutanea; H319: Provoca grave irritazione oculare.',
    descrizione: 'Malta cementizia polimero-modificata, fibrorinforzata, idonea per l’annegamento di rete d’armatura e rasatura finale di isolamenti termici.',
    prescrizioniSicurezza: 'Miscelare a basso numero di giri per evitare schizzi; applicare a temperature comprese tra +5°C e +35°C.',
    rischi: [
      {
        id: 'r_sost_ras_1',
        descrizione: 'Irritazione cutanea da contatto prolungato con pasta umida',
        probabilita: 2,
        danno: 2,
        livelloRischio: 4,
        classeRischio: 'Accettabile',
        misurePreventive: 'Uso di spatole con impugnatura ergonomica e guanti stagni.',
        dpiRichiesti: ['Guanti in nitrile EN 374'],
      },
    ],
    misurePrevenzione: ['Lavare immediatamente la pelle con acqua in caso di contatto accidentale.'],
  },
  {
    id: 'sost_colla',
    nomeCommerciale: 'Adesivo/Colla cementizia per piastrelle e rivestimenti (C2TE)',
    utilizzoFase: 'Posa pavimenti e rivestimenti ceramici interni ed esterni',
    schedaSicurezzaPresente: true,
    pittogrammiPericolo: ['Irritante (GHS07)', 'Corrosivo (GHS05)'],
    dpiSpecifici: ['Guanti protettivi', 'Ginocchiere', 'Mascherina antipolvere in fase di miscelazione'],
    produttore: 'Mapei / Kerakoll',
    frasiH: 'H315: Provoca irritazione cutanea; H318: Provoca gravi lesioni oculari.',
    descrizione: 'Adesivo cementizio migliorato, a scivolamento verticale nullo e con tempo aperto prolungato.',
    prescrizioniSicurezza: 'Miscelare in recipienti puliti; evitare l’inalazione della polvere all’apertura del sacco.',
    rischi: [
      {
        id: 'r_sost_col_1',
        descrizione: 'Pressione sulle ginocchia e contatto cutaneo durante la stesura a terra',
        probabilita: 3,
        danno: 2,
        livelloRischio: 6,
        classeRischio: 'Notevole',
        misurePreventive: 'Uso obbligatorio di ginocchiere imbottite ergonomiche e pantaloni lunghi.',
        dpiRichiesti: ['Ginocchiere di protezione EN 14404', 'Guanti da lavoro'],
      },
    ],
    misurePrevenzione: ['Alternare posizioni per evitare sovraccarico posturale degli arti inferiori.'],
  },
  {
    id: 'sost_pittura',
    nomeCommerciale: 'Pittura murale all’acqua traspirante/lavabile per interni',
    utilizzoFase: 'Tinteggiatura e decorazione superfici murarie',
    schedaSicurezzaPresente: true,
    pittogrammiPericolo: ['Basso rischio (VOC limitati conforme Dir. 2004/42/CE)'],
    dpiSpecifici: ['Occhiali paraschizzi', 'Guanti protettivi in gomma'],
    produttore: 'Sikkens / San Marco / Boero',
    frasiH: 'EUH208: Contiene conservanti isotiazolinoni; può provocare una reazione allergica cutanea nei soggetti sensibili.',
    descrizione: 'Idropittura acrilica/vinilica ad emulsione acquosa per ambienti interni.',
    prescrizioniSicurezza: 'Garantire aerazione naturale continua dei locali durante e dopo l’applicazione; non disperdere i residui nelle fognature.',
    rischi: [
      {
        id: 'r_sost_pit_1',
        descrizione: 'Schizzi negli occhi durante l’applicazione a rullo o a spruzzo su soffitti',
        probabilita: 2,
        danno: 2,
        livelloRischio: 4,
        classeRischio: 'Accettabile',
        misurePreventive: 'Uso di occhiali protettivi paraschizzi e tute leggere.',
        dpiRichiesti: ['Occhiali paraschizzi EN 166'],
      },
    ],
    misurePrevenzione: ['Ventilare i locali aprendo le finestre per accelerare l’asciugatura e il ricambio d’aria.'],
  },
  {
    id: 'sost_primer',
    nomeCommerciale: 'Primer bituminoso a rapida asciugatura a solvente',
    utilizzoFase: 'Preparazione piani di posa per guaine bituminose su coperture e terrazzi',
    schedaSicurezzaPresente: true,
    pittogrammiPericolo: ['Infiammabile (GHS02)', 'Pericolo salute (GHS08)', 'Tossico per l’ambiente (GHS09)'],
    dpiSpecifici: ['Maschera respiratoria con filtro vapori organici A2P3', 'Guanti resistenti ai solventi', 'Occhiali ermetici'],
    produttore: 'Polyglass / Index / Copernit',
    frasiH: 'H226: Liquido e vapori infiammabili; H304: Può essere letale in caso di ingestione; H336: Può provocare sonnolenza o vertigini; H411: Tossico per gli organismi acquatici.',
    descrizione: 'Soluzione a base di bitume ossidato e solventi organici volatili ad alto potere penetrante per l’ancoraggio delle membrane bitume-polimero.',
    prescrizioniSicurezza: 'Vietato fumare, usare fiamme libere o scintille nelle vicinanze; stoccare in fusti sigillati in locale areato; applicare solo all’aperto o in ambienti ventilati forzatamente; tenere un estintore a portata di mano.',
    rischi: [
      {
        id: 'r_sost_pri_1',
        descrizione: 'Incendio ed esplosione dei vapori di solvente a contatto con fiamme di cannelli',
        probabilita: 2,
        danno: 4,
        livelloRischio: 8,
        classeRischio: 'Notevole',
        misurePreventive: 'Attesa della completa evaporazione del solvente prima dell’accensione del cannello a gas per saldare la guaina; estintore pronto uso.',
        dpiRichiesti: ['Abbigliamento ignifugo / antistatico', 'Calzature di sicurezza'],
      },
      {
        id: 'r_sost_pri_2',
        descrizione: 'Inalazione di vapori organici con sonnolenza, cefalea o intossicazione acuta',
        probabilita: 2,
        danno: 3,
        livelloRischio: 6,
        classeRischio: 'Notevole',
        misurePreventive: 'Uso di semimaschera con filtri per vapori organici tipo A2; evitare l’uso nei locali interrati privi di aerazione.',
        dpiRichiesti: ['Maschera respiratoria con filtro A2P3'],
      },
    ],
    misurePrevenzione: [
      'Non sversare i residui a terra; smaltire fusti vuoti come rifiuti speciali pericolosi con codice CER 08 04 09*.',
    ],
  },
  {
    id: 'sost_schiuma_poliuretano',
    nomeCommerciale: 'Schiuma poliuretanica monocomponente autoespandente B2/B3',
    utilizzoFase: 'Sigillatura fessure, isolamento perimetrale falsotelai e tubazioni',
    schedaSicurezzaPresente: true,
    pittogrammiPericolo: ['Aerosol infiammabile (GHS02)', 'Irritante (GHS07)', 'Sensibilizzante (GHS08)'],
    dpiSpecifici: ['Guanti protettivi monouso', 'Occhiali di sicurezza'],
    produttore: 'Fischer / Würth / Soudal',
    frasiH: 'H222: Aerosol altamente infiammabile; H317: Può provocare una reazione allergica cutanea; H334: Può provocare sintomi allergici se inalato; H351: Sospettato di provocare il cancro.',
    descrizione: 'Schiuma poliuretanica monocomponente a base di diisocianati che indurisce per reazione con l’umidità atmosferica.',
    prescrizioniSicurezza: 'Bombola sotto pressione: proteggere dai raggi solari e non esporre a temperature superiori a 50°C; formazione obbligatoria per uso sicuro di diisocianati ex Reg. UE 2020/1149.',
    rischi: [
      {
        id: 'r_sost_sch_1',
        descrizione: 'Sensibilizzazione delle vie respiratorie da diisocianati volatili',
        probabilita: 2,
        danno: 3,
        livelloRischio: 6,
        classeRischio: 'Notevole',
        misurePreventive: 'Applicazione in locali aerati; utilizzo del respiratore per vapori organici in caso di impiego continuativo.',
        dpiRichiesti: ['Guanti protettivi in nitrile', 'Occhiali di sicurezza', 'Mascherina con filtro A1P2'],
      },
    ],
    misurePrevenzione: ['Conservare le bombole in posizione verticale al riparo dal calore.'],
  },
  {
    id: 'sost_disarmante',
    nomeCommerciale: 'Disarmante ecologico sintetico/vegetale per casserature',
    utilizzoFase: 'Applicazione a spruzzo sui casseri metallici e lignei prima del getto',
    schedaSicurezzaPresente: true,
    pittogrammiPericolo: ['Irritante (GHS07)', 'Pericolo salute (GHS08)'],
    dpiSpecifici: ['Occhiali paraschizzi', 'Guanti resistenti a oli', 'Mascherina per aerosol'],
    produttore: 'Mapei (Mapeform Eco) / Chimica Edile',
    frasiH: 'H304: Può essere letale in caso di ingestione e penetrazione nelle vie respiratorie; EUH066: L’esposizione ripetuta può provocare secchezza o screpolature della pelle.',
    descrizione: 'Liquido oleoso pronto all’uso per il distacco facilitato dei casseri dal calcestruzzo armato con finitura a facciavista.',
    prescrizioniSicurezza: 'Applicare con nebulizzatore a bassa pressione evitando derive di nebbie nell’aria; non spruzzare su ferri di armatura o sulle superfici di ripresa del getto.',
    rischi: [
      {
        id: 'r_sost_dis_1',
        descrizione: 'Scivolamento su impalcati bagnati accidentalmente da residui oleosi di disarmante',
        probabilita: 3,
        danno: 3,
        livelloRischio: 9,
        classeRischio: 'Elevato',
        misurePreventive: 'Applicazione mirata senza sgocciolamenti; asciugatura immediata di fuoriuscite con sabbia assorbente.',
        dpiRichiesti: ['Calzature di sicurezza S3 con suola antiscivolo ad alta aderenza'],
      },
    ],
    misurePrevenzione: ['Non fumare né dirigere lo spruzzo verso fonti di calore.'],
  },
];

// Helper per generare un nuovo POS precompilato da un Cantiere e dalle Impostazioni
export function createNewPosFromCantiere(
  cantiere: Cantiere,
  settings: AppSettings,
  personaleList: Personale[] = []
): PosDocument {
  const today = new Date().toISOString().split('T')[0];
  const nextYear = new Date(Date.now() + 180 * 86400000).toISOString().split('T')[0];
  const progressivo = Math.floor(100 + Math.random() * 900);
  const annoCorrente = new Date().getFullYear();
  const codice = `POS-${annoCorrente}-${progressivo}`;

  // Seleziona di default TUTTO il personale in forza dell'azienda
  const activeWorkers = (personaleList || []).filter(p => p.inForza !== false);
  const targetWorkers = activeWorkers.length > 0 ? activeWorkers : (personaleList || []);

  const defaultLavoratori = targetWorkers.map(p => {
    const isCapo = /capo|preposto|responsabile/i.test(p.ruolo || '');
    return {
      id: p.id || Math.random().toString(),
      personaleId: p.id,
      nome: p.nome,
      cognome: p.cognome,
      codiceFiscale: p.codiceFiscale || '',
      mansione: p.ruolo || 'Operaio Edile',
      ruoloCantiere: isCapo ? 'Capocantiere / Preposto' : 'Lavoratore addetto alle lavorazioni',
      dataVisitaMedica: p.scadenzaVisitaMedica || '',
      idoneitaSanitaria: 'Idoneo alla mansione specifica (visita medica valida)',
      formazioni: (p.corsiFormazione || []).map(c => c.corso),
    };
  });

  // Seleziona 4 attività essenziali di default
  const defaultAttivitaTemplates = DEFAULT_POS_TEMPLATES.slice(0, 4);
  const attivitaList = defaultAttivitaTemplates.map(tpl => ({
    id: Math.random().toString(),
    templateId: tpl.id,
    nome: tpl.nome,
    categoria: tpl.categoria,
    icona: tpl.icona,
    descrizione: tpl.descrizione,
    faseLavoro: tpl.faseLavoro,
    personaleCoinvolto: defaultLavoratori.map(l => `${l.nome} ${l.cognome}`),
    attrezzatureUtilizzate: tpl.attrezzatureTipiche,
    materialiUtilizzati: tpl.materialiTipici,
    sostanzeUtilizzate: [],
    rischi: tpl.rischi,
    misurePrevenzione: tpl.misurePrevenzione,
    dpiNecessari: tpl.dpiRaccomandati,
    interferenze: tpl.interferenze,
    note: tpl.note,
  }));

  // Calcola attrezzature derivate con schede complete da catalogo
  const uniqueAttrezzature: PosAttrezzaturaItem[] = Array.from(
    new Set(defaultAttivitaTemplates.flatMap(a => a.attrezzatureTipiche))
  ).map((attNome, idx) => {
    const fromCat = DEFAULT_ATTREZZATURE_CATALOGO.find(c =>
      c.nome.toLowerCase().includes(attNome.toLowerCase()) ||
      attNome.toLowerCase().includes(c.nome.toLowerCase())
    );
    if (fromCat) {
      return { ...fromCat, id: `att_${idx + 1}` };
    }
    return {
      id: `att_${idx + 1}`,
      nome: attNome,
      categoria: 'Attrezzature e utensili di cantiere',
      icona: '⚙️',
      modelloMatricola: 'Matricola di fabbrica verificata CE',
      marcaturaCeConforme: true,
      verifichePeriodicheRegolari: true,
      operatoreAbilitato: 'Personale con idoneo addestramento e formazione',
      descrizione: `Attrezzatura e utensile da cantiere: ${attNome}, impiegato nelle fasi operative ordinarie con marcatura CE conforme.`,
      prescrizioniPreliminari: 'Verifica visiva dell’integrità dell’attrezzo e conformità alle disposizioni del costruttore prima dell’avvio.',
      noteSicurezza: 'Uso conforme al libretto di istruzioni del costruttore.',
      rischi: [
        {
          id: `r_att_gen_${idx}_1`,
          descrizione: 'Urti, contusioni, tagli e abrasioni durante l’uso ordinario',
          probabilita: 2,
          danno: 2,
          livelloRischio: 4,
          classeRischio: 'Accettabile',
          misurePreventive: 'Impiego conforme alle istruzioni di sicurezza del costruttore e sorveglianza del Preposto.',
          dpiRichiesti: ['Guanti rischio meccanico', 'Calzature di sicurezza S3'],
        },
      ],
      misurePrevenzione: [
        'Utilizzare esclusivamente con protezioni e carter originali montati.',
        'Scollegare o spegnere prima di qualsiasi manutenzione.',
      ],
      dpiNecessari: ['Calzature di sicurezza S3', 'Guanti rischio meccanico', 'Casco di protezione / Elmetto'],
    };
  });

  // Sostanze di default per il nuovo POS
  const defaultSostanze: PosSostanzaItem[] = [
    DEFAULT_SOSTANZE_CATALOGO[0], // Cemento Portland
    DEFAULT_SOSTANZE_CATALOGO[1], // Intonaco premiscelato
    DEFAULT_SOSTANZE_CATALOGO[2], // Rasante cementizio
    DEFAULT_SOSTANZE_CATALOGO[3], // Colla piastrelle
    DEFAULT_SOSTANZE_CATALOGO[4], // Pittura murale
  ];

  // Recupera i tecnici dal cantiere se presenti
  const cseTecnico = cantiere.tecnici?.find(t => /cse|coordinatore|sicurezza/i.test(t.ruolo))?.nome || '';
  const cspTecnico = cantiere.tecnici?.find(t => /csp/i.test(t.ruolo))?.nome || '';
  const dlTecnico = cantiere.direttoreLavori || cantiere.tecnici?.find(t => /direttore/i.test(t.ruolo))?.nome || '';

  // Calcola durata giorni
  let durata = 120;
  if (cantiere.dataInizio && cantiere.scadenza) {
    const d1 = new Date(cantiere.dataInizio).getTime();
    const d2 = new Date(cantiere.scadenza).getTime();
    if (!isNaN(d1) && !isNaN(d2) && d2 > d1) {
      durata = Math.round((d2 - d1) / (1000 * 3600 * 24));
    }
  }

  // Costruisci subappaltatori se presenti
  const subNames = (cantiere.subappalti || []).map(s => `${s.azienda} (${s.lavoro})`).join(', ');

  // Recupera i dati aziendali salvati da preferenze precedenti
  const savedDati = settings.posDefaultDatiImpresa || {};

  const prepostoNominato =
    settings.prepostoDefault ||
    savedDati.prepostoCantiere ||
    (defaultLavoratori.find(l => l.ruoloCantiere.includes('Capo') || l.ruoloCantiere.includes('Preposto'))
      ? `${defaultLavoratori.find(l => l.ruoloCantiere.includes('Capo') || l.ruoloCantiere.includes('Preposto'))?.nome} ${defaultLavoratori.find(l => l.ruoloCantiere.includes('Capo') || l.ruoloCantiere.includes('Preposto'))?.cognome}`
      : 'Da nominare formalmente con lettera d’incarico');

  const primoSoccorsoWorker = defaultLavoratori.find(l => (l.formazioni || []).some(f => /primo soccorso|soccorso/i.test(f)));
  const primoSoccorsoNominato =
    settings.addettoPrimoSoccorsoDefault ||
    savedDati.addettoPrimoSoccorso ||
    (primoSoccorsoWorker
      ? `${primoSoccorsoWorker.nome} ${primoSoccorsoWorker.cognome}`
      : (defaultLavoratori[0] ? `${defaultLavoratori[0].nome} ${defaultLavoratori[0].cognome}` : 'Da nominare con corso valido'));

  const antincendioWorker = defaultLavoratori.find(l => (l.formazioni || []).some(f => /antincendio|fuoco/i.test(f)));
  const antincendioNominato =
    settings.addettoAntincendioDefault ||
    savedDati.addettoAntincendio ||
    (antincendioWorker
      ? `${antincendioWorker.nome} ${antincendioWorker.cognome}`
      : (defaultLavoratori[1]
          ? `${defaultLavoratori[1].nome} ${defaultLavoratori[1].cognome}`
          : (defaultLavoratori[0] ? `${defaultLavoratori[0].nome} ${defaultLavoratori[0].cognome}` : 'Da nominare con corso valido')));

  return {
    id: Math.random().toString(),
    codice,
    titolo: `Piano Operativo di Sicurezza - ${cantiere.nome}`,
    versione: '00',
    dataRedazione: today,
    stato: 'bozza',
    redattore: savedDati.datoreDiLavoro || settings.rappresentanteLegale || settings.datoreDiLavoro || 'Datore di Lavoro',
    cantiereId: cantiere.id,

    datiImpresa: {
      ragioneSociale: savedDati.ragioneSociale || settings.nomeAzienda || 'Impresa Edile',
      sedeLegale: savedDati.sedeLegale || settings.indirizzoSede || 'Sede da completare',
      partitaIva: savedDati.partitaIva || settings.partitaIva || 'P.IVA da definire',
      codiceFiscale: savedDati.codiceFiscale || settings.codiceFiscaleAzienda || settings.partitaIva || 'CF da definire',
      telefono: savedDati.telefono || settings.telefonoAzienda || '',
      email: savedDati.email || (settings.username ? `${settings.username}@azienda.it` : ''),
      pec: savedDati.pec || settings.pec || '',
      datoreDiLavoro: savedDati.datoreDiLavoro || settings.datoreDiLavoro || settings.rappresentanteLegale || 'Da indicare',
      rspp: savedDati.rspp || settings.rspp || 'Datore di Lavoro (art. 34 D.Lgs. 81/08)',
      rls: savedDati.rls || settings.rls || 'RLS Aziendale / RLST Territoriale',
      medicoCompetente: savedDati.medicoCompetente || settings.medicoCompetente || 'Dr. Medico Competente Nominato',
      prepostoCantiere: prepostoNominato,
      addettoPrimoSoccorso: primoSoccorsoNominato,
      addettoAntincendio: antincendioNominato,
      iscrizioneCciaa: savedDati.iscrizioneCciaa || 'Iscritta con REA c/o CCIAA',
      posizioniAssicurative: savedDati.posizioniAssicurative || `INPS: ${settings.matricolaInps || 'N.D.'} | INAIL PAT: ${settings.patInail || 'N.D.'} | Cassa Edile: ${settings.codiceCassaEdile || 'N.D.'}`,
      contrattoCollettivo: savedDati.contrattoCollettivo || settings.ccnlApplicato || 'CCNL Edilizia e Affini (Industria / Artigianato)',
    },

    datiCantiere: {
      cantiereId: cantiere.id,
      nome: cantiere.nome,
      indirizzo: cantiere.indirizzo || 'Indirizzo cantiere da precisare',
      comune: cantiere.indirizzo?.split(',')?.[1]?.trim() || '',
      provincia: '',
      committente: cantiere.cliente || 'Committente Privato / Ente',
      committenteCfPiva: cantiere.dnlData?.committenteCodiceFiscale || '',
      responsabileLavori: cantiere.dnlData?.responsabileLavori || cantiere.cliente || '',
      direttoreLavori: dlTecnico,
      csp: cspTecnico || 'Non nominato (opera con unica impresa)',
      cse: cseTecnico || cantiere.dnlData?.coordinatoreSicurezza || 'Da nominare a cura del Committente',
      impresaAffidataria: settings.nomeAzienda || '',
      descrizioneOpera: `Lavori edili relativi a ${cantiere.nome}. Inclusi opere di finitura, adeguamenti murari e impiantistici.`,
      dataInizio: cantiere.dataInizio || today,
      dataFine: cantiere.scadenza || nextYear,
      durataGiorniPresunti: durata,
      numeroMassimoLavoratori: Math.max(defaultLavoratori.length, 1),
      importoLavoriEdili: cantiere.importoTotale || 0,
      orariLavoro: '08:00 - 12:00 / 13:00 - 17:00 (dal lunedì al venerdì)',
      subappaltatoriDichiarati: subNames || 'Nessuna ditta in subappalto al momento dell’apertura',
    },

    contestoAmbientale: { ...DEFAULT_CONTESTO_AMBIENTALE },

    lavoratori: defaultLavoratori,
    organizzazione: { ...DEFAULT_ORGANIZZAZIONE_CANTIERE },
    organizzazioneCantiere: { ...DEFAULT_ORGANIZZAZIONE_CANTIERE },
    attivita: attivitaList,
    attrezzature: uniqueAttrezzature,
    opereProvvisionali: DEFAULT_OPERE_PROVVISIONALI_LIST.map(o => ({ ...o })),
    sostanze: defaultSostanze,
    dpiRichiesti: [
      'Casco di protezione / Elmetto',
      'Calzature di sicurezza S3',
      'Guanti rischio meccanico',
      'Gilet alta visibilità',
      'Occhiali di protezione',
      'Respiratore FFP2 antipolvere',
    ],
    emergenza: { ...DEFAULT_PIANO_EMERGENZA },
    allegati: DEFAULT_ALLEGATI_POS.map(a => ({ ...a })),
    notePrescrizioni: 'Il presente POS deve essere custodito in cantiere a disposizione degli organi di vigilanza (ASL, ITL) e del Coordinatore per la Sicurezza (CSE). Tutti i lavoratori operanti sono stati debitamente informati e formati circa i rischi specifici indicati.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}
