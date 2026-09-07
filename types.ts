
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
}

export type AppData = {
  cantieri: Cantiere[];
  personale: Personale[];
  mezzi: Mezzo[];
  documenti: Documento[];
  settings: AppSettings;
};
