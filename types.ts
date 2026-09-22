
export type EntityType = 'cantiere' | 'personale' | 'mezzo' | 'documento';
export type CantiereStato = 'aperto' | 'chiuso' | 'in pausa' | 'in apertura';
export type MezzoStato = 'disponibile' | 'non in uso' | 'manutenzione';

export interface Tecnico {
  nome: string;
  ruolo: string;
  contatto: string;
}

export interface ChecklistItem {
  id: string;
  titolo: string;
  completato: boolean;
}

export interface SAL {
  id: string;
  titolo: string;
  data: string;
  importo: number;
}

export interface ExtraCantiere {
  id: string;
  titolo: string;
  descrizione: string;
  importo: number;
  data?: string;
  stato?: 'approvato' | 'in attesa' | 'fatturato';
}

export interface Subappalto {
  id: string;
  azienda: string;
  lavoro: string;
  prezzoOriginale: number;
  maggiorazione: number;
  partitaIva?: string;
  email?: string;
  pec?: string;
}

export interface DnlData {
  codiceCassaEdile?: string;
  matricolaInps?: string;
  patInail?: string;
  ccnl?: string;
  tipoLavoro?: string;
  naturaAppalto?: 'privato' | 'pubblico';
  cig?: string;
  cup?: string;
  titoloAbilitativoTipo?: string;
  titoloAbilitativoNumero?: string;
  titoloAbilitativoData?: string;
  titoloAbilitativoComune?: string;
  protocolloNotificaPreliminare?: string;
  dataNotificaPreliminare?: string;
  committenteCodiceFiscale?: string;
  committenteIndirizzo?: string;
  committentePecTelefono?: string;
  progettistaNome?: string;
  progettistaTelefono?: string;
  progettistaEmail?: string;
  progettistaPec?: string;
  coordinatoreSicurezza?: string;
  responsabileLavori?: string;
  capocantiere?: string;
  importoEdile?: number;
  oneriSicurezza?: number;
  numeroOperaiStimati?: number;
  oreLavorativeStimate?: number;
  incidenzaManodoperaPerc?: number;
  lavoratoriAssegnatiIds?: string[];
  noteDNL?: string;
}

export interface CustomContractVariable {
  key: string;
  label: string;
  defaultValue?: string;
  description?: string;
}

export interface Cantiere {
  id: string;
  nome: string;
  cliente: string;
  indirizzo?: string;
  direttoreLavori?: string;
  dataInizio?: string;
  dataConsegna?: string;
  scadenza: string;
  scadenzaDNL?: string;
  scadenzaSuoloPubblico?: string;
  stato: CantiereStato;
  progresso: number;
  importoTotale: number;
  note?: string;
  tecnici: Tecnico[];
  checklistDocumenti: ChecklistItem[];
  salList: SAL[];
  extraList?: ExtraCantiere[];
  subappalti: Subappalto[];
  dnlData?: DnlData;
  customContractValues?: Record<string, string>;
}

export interface Formazione {
  corso: string;
  data: string;
  scadenza: string;
}

export type CategoriaPersonale = 'operaio' | 'impiegato' | 'amministratore';

export interface Personale {
  id: string;
  nome: string;
  cognome: string;
  ruolo: string;
  categoria: CategoriaPersonale;
  codiceFiscale?: string;
  dataAssunzione?: string; // Data di assunzione (obbligatoria per tesserini ex D.Lgs 81/08)
  foto?: string; // Fototessera base64 o URL per badge
  luogoNascita?: string;
  dataNascita?: string;
  scadenzaContratto?: string; // Se undefined o vuoto = Indeterminato
  scadenzaVisitaMedica: string;
  inForza: boolean;
  corsiFormazione: Formazione[];
  note?: string;
}

export interface Manutenzione {
  descrizione: string;
  data: string;
  costo: number;
}

export interface Mezzo {
  id: string;
  modello: string;
  targa: string;
  telaio?: string;
  scadenzaAssicurazione: string;
  prossimaRevisione: string;
  scadenzaBollo?: string;
  scadenzaVerificaPeriodica?: string;
  stato: MezzoStato;
  note?: string;
  storicoManutenzioni: Manutenzione[];
}

export interface Documento {
  id: string;
  titolo: string;
  categoria: string;
  scadenza: string;
  ente: string;
  dataRilascio?: string;
  note?: string;
  priorita: 'bassa' | 'media' | 'alta';
}

export interface AppSettings {
  nomeAzienda: string;
  theme: 'light' | 'dark';
  username?: string;
  password?: string;
  logoAzienda?: string;
  partitaIva?: string;
  codiceFiscaleAzienda?: string;
  indirizzoSede?: string;
  pec?: string;
  telefonoAzienda?: string;
  rappresentanteLegale?: string;
  codiceCassaEdile?: string;
  matricolaInps?: string;
  patInail?: string;
  ccnlApplicato?: string;
  contrattoBaseCustom?: string;
  customContractVariables?: CustomContractVariable[];
  datoreDiLavoro?: string;
  rspp?: string;
  rls?: string;
  medicoCompetente?: string;
  prepostoDefault?: string;
  addettoPrimoSoccorsoDefault?: string;
  addettoAntincendioDefault?: string;
  posDefaultDatiImpresa?: Partial<PosDatiImpresa>;
}

// ==================== MODULO POS (D.Lgs. 81/2008 & All. XV) ====================

export type PosStato = 'bozza' | 'emesso';

export type PosClasseRischio = 'Basso' | 'Accettabile' | 'Notevole' | 'Elevato';

export interface PosRischio {
  id: string;
  descrizione: string;
  fonteRischio?: string;
  conseguenze?: string;
  misurePreventive?: string;
  misureProtettive?: string;
  dpiRichiesti?: string[];
  // Matrice R = P x D
  probabilita?: number; // 1: Non probabile, 2: Possibile, 3: Probabile, 4: Altamente probabile
  danno?: number; // 1: Lieve, 2: Modesto, 3: Significativo, 4: Grave
  livelloRischio?: number; // P * D (1 - 16)
  classeRischio?: PosClasseRischio;
}

export interface PosAttivitaItem {
  id: string;
  templateId?: string;
  nome: string;
  categoria: string;
  icona: string;
  logoUrl?: string;
  immagineUrl?: string;
  descrizione: string;
  faseLavoro: string;
  personaleCoinvolto: string[]; // Nomi o ID dei lavoratori assegnati
  attrezzatureUtilizzate: string[];
  opereProvvisionaliUtilizzate?: string[];
  materialiUtilizzati: string[];
  sostanzeUtilizzate: string[];
  rischi: PosRischio[];
  misurePrevenzione: string[];
  dpiNecessari: string[];
  interferenze?: string;
  note?: string;
}

export interface PosAttivitaTemplate {
  id: string;
  nome: string;
  categoria: string;
  icona: string;
  logoUrl?: string;
  immagineUrl?: string;
  descrizione: string;
  faseLavoro: string;
  rischi: PosRischio[];
  misurePrevenzione: string[];
  dpiRaccomandati: string[];
  attrezzatureTipiche: string[];
  opereProvvisionaliTipiche?: string[];
  materialiTipici: string[];
  sostanzeTipiche?: string[];
  interferenze?: string;
  note?: string;
  isCustom?: boolean;
}

export interface PosLavoratoreAssegnato {
  id: string;
  personaleId?: string;
  nome: string;
  cognome: string;
  codiceFiscale?: string;
  mansione: string;
  ruoloCantiere: string; // Capocantiere, Preposto, Addetto Primo Soccorso, Addetto Antincendio, RLS, Operaio specializzato, ecc.
  dataVisitaMedica?: string;
  idoneitaSanitaria: string;
  formazioni: string[];
}

export interface PosAttrezzaturaItem {
  id: string;
  nome: string;
  categoria?: string;
  icona?: string;
  logoUrl?: string;
  immagineUrl?: string;
  descrizione?: string;
  prescrizioniPreliminari?: string;
  prescrizioniSicurezza?: string;
  marca?: string;
  modelloMatricola?: string;
  marcaturaCeConforme: boolean;
  verifichePeriodicheRegolari: boolean;
  operatoreAbilitato?: string;
  noteSicurezza?: string;
  rischi?: PosRischio[];
  misurePrevenzione?: string[];
  dpiNecessari?: string[];
  dpiObbligatori?: string[];
}

export interface PosSostanzaItem {
  id: string;
  nomeCommerciale: string;
  descrizione?: string;
  icona?: string;
  logoUrl?: string;
  immagineUrl?: string;
  utilizzoFase: string;
  schedaSicurezzaPresente: boolean;
  pittogrammiPericolo: string[];
  dpiSpecifici: string[];
  produttore?: string;
  produttoreFornitore?: string;
  frasiH?: string;
  frasiRischio?: string;
  dpiObbligatori?: string[];
  prescrizioniSicurezza?: string;
  prescrizioniManipolazione?: string;
  rischi?: PosRischio[];
  misurePrevenzione?: string[];
}

export interface PosOperaProvvisionaleItem {
  id: string;
  tipo: string;
  categoria?: string;
  icona?: string;
  logoUrl?: string;
  immagineUrl?: string;
  descrizione: string;
  prescrizioniPreliminari?: string;
  prescrizioniSicurezza?: string;
  pimusRichiesto?: boolean;
  marca?: string;
  modello?: string;
  autorizzazioneMinisteriale?: string;
  conformitaNormativa: string;
  verifichePeriodiche: boolean;
  responsabileControllo?: string;
  noteSicurezza?: string;
  rischi?: PosRischio[];
  misurePrevenzione?: string[];
  dpiNecessari?: string[];
}

export interface PosDatiImpresa {
  ragioneSociale: string;
  sedeLegale: string;
  partitaIva: string;
  codiceFiscale: string;
  telefono: string;
  fax?: string;
  email: string;
  pec: string;
  datoreDiLavoro: string;
  direttoreTecnico?: string;
  prepostoCantiere: string;
  rspp: string;
  addettoSpp?: string;
  rls: string;
  medicoCompetente: string;
  addettoPrimoSoccorso: string;
  addettoAntincendio: string;
  altreFigure?: Array<{ ruolo: string; nominativo: string; telefono?: string }>;
  iscrizioneCciaa: string;
  posizioniAssicurative: string; // INPS, INAIL, Cassa Edile
  contrattoCollettivo: string;
}

export interface PosContestoAmbientale {
  naturaTerreno?: string;
  rischiFranamento?: string;
  faldeFossati?: string;
  sottoserviziLinee?: string;
  vegetazioneAlberi?: string;
  manufattiAdiacenti?: string;
  recinzioneAccessi?: string;
  segnaletica?: string;
  serviziLogistica?: string;
  viabilitaParcheggi?: string;
  allacciamentoImpianti?: string;
  caricoScaricoStoccaggio?: string;
  gestioneRifiuti?: string;
  fattoriEsterniRischio?: string; // Cap 4.1
  rischiTrasmessiAmbiente?: string; // Cap 4.2
  accessibilitaViabilitaEsterna?: string;
  interferenzeSottoserviziLineeAeree?: string;
  edificiAdiacentiRumorePolveri?: string;
  condizioniMeteoEventiAtmosferici?: string;
}

export interface PosFiguraCantiere {
  ruolo: string;
  nominativo: string;
  indirizzo?: string;
  codiceFiscale?: string;
  telefono?: string;
}

export interface PosDatiCantiere {
  cantiereId?: string;
  nome: string;
  indirizzo: string;
  comune: string;
  cap?: string;
  provincia: string;
  committente: string;
  committenteCfPiva: string;
  responsabileLavori: string;
  progettista?: string;
  direttoreLavori: string;
  csp: string;
  cse: string;
  altreFigureCantiere?: PosFiguraCantiere[];
  impresaAffidataria: string;
  descrizioneOpera: string;
  descrizioneLavori?: string;
  attivitaSvolteImpresa?: string;
  subappalti?: string;
  titoliAbilitativi?: string;
  dataInizio: string;
  dataFine: string;
  durataGiorniPresunti: number;
  entitaPresuntaUominiGiorno?: number;
  numeroMassimoLavoratori: number;
  importoLavoriEdili: number;
  orariLavoro: string;
  subappaltatoriDichiarati: string;
  contestoAmbientale?: PosContestoAmbientale;
}

export interface PosOrganizzazioneCantiere {
  recinzioneAccessi: string; // 7.1
  viabilitaSicurezza?: string; // 7.1
  impiantoElettricoCantiere?: string; // 7.2
  stoccaggioMateriali?: string; // 7.3
  gestioneRifiutiTerre?: string; // 7.3
  fornituraMaterialiAccesso?: string; // 7.4
  stoccaggioMaterialiLavorazioni?: string; // 7.5
  accessoMezziMeccanici?: string; // 7.6
  serviziIgieniciAssistenziali?: string;
  localiRiposoSpogliatoi?: string;
  protezioneInterferenze?: string;
  serviziIgienici?: string;
  viabilita?: string;
  impiantoElettrico?: string;
  stoccaggioRifiuti?: string;
}

export interface PosPianoEmergenza {
  numeroUnicoEmergenza: string; // 112
  ospedaleRiferimento: string;
  prontoSoccorsoIndirizzo: string;
  telefonoProntoSoccorso: string;
  puntoRaccolta: string;
  cassettaPrimoSoccorsoUbicazione: string;
  presidioSanitarioTipo?: string; // Cap 2.1
  dotazioniPrimoSoccorso?: string;
  estintoriUbicazione: string;
  comportamentoInfortunio?: string; // Cap 2
  valutazionePericolo?: string;
  modalitaIntervento?: string;
  gestioneInfortunato?: string;
  attivazioneSoccorsi?: string;
  proceduraChiamataSoccorsi: string;
  addettiSoccorsoNominati: string;
  addettiAntincendioNominati: string;
}

export interface PosDocumentoAllegato {
  id: string;
  titolo: string;
  obbligatorio: boolean;
  allegatoPresente: boolean;
  note?: string;
}

export interface PosDocument {
  id: string;
  codice: string; // es. "POS-2025-001"
  titolo: string;
  versione: string; // "00", "01", ecc.
  revisione?: string; // alias per retrocompatibilità e sincronizzazione form
  dataRedazione: string;
  dataRevisione?: string;
  stato: PosStato;
  redattore: string;
  cantiereId?: string;
  luogoRedazione?: string;
  
  datiImpresa: PosDatiImpresa;
  datiCantiere: PosDatiCantiere;
  lavoratori: PosLavoratoreAssegnato[];
  organizzazione: PosOrganizzazioneCantiere;
  attivita: PosAttivitaItem[];
  attrezzature: PosAttrezzaturaItem[];
  opereProvvisionali?: PosOperaProvvisionaleItem[];
  sostanze: PosSostanzaItem[];
  dpiRichiesti: string[];
  emergenza: PosPianoEmergenza;
  allegati: PosDocumentoAllegato[];
  notePrescrizioni: string;
  contestoAmbientale?: PosContestoAmbientale;
  organizzazioneCantiere?: PosOrganizzazioneCantiere;
  
  isModello?: boolean;
  modelloNome?: string;
  createdAt: string;
  updatedAt: string;
}

export type AppData = {
  cantieri: Cantiere[];
  personale: Personale[];
  mezzi: Mezzo[];
  documenti: Documento[];
  settings: AppSettings;
  posList?: PosDocument[];
  posTemplates?: PosAttivitaTemplate[];
};
