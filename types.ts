
export type EntityType = 'cantiere' | 'personale' | 'mezzo' | 'documento';
export type CantiereStato = 'aperto' | 'chiuso' | 'in pausa' | 'in apertura';
export type MezzoStato = 'disponibile' | 'in_uso' | 'manutenzione';

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

export interface Subappalto {
  id: string;
  azienda: string;
  lavoro: string;
  prezzoOriginale: number;
  maggiorazione: number;
}

export interface Cantiere {
  id: string;
  nome: string;
  cliente: string;
  indirizzo?: string;
  direttoreLavori?: string;
  dataInizio?: string;
  scadenza: string;
  stato: CantiereStato;
  progresso: number;
  importoTotale: number;
  note?: string;
  tecnici: Tecnico[];
  checklistDocumenti: ChecklistItem[];
  salList: SAL[];
  subappalti: Subappalto[];
}

export interface Formazione {
  corso: string;
  data: string;
  scadenza: string;
}

export interface Personale {
  id: string;
  nome: string;
  cognome: string;
  ruolo: string;
  codiceFiscale?: string;
  scadenzaContratto: string;
  scadenzaVisitaMedica: string;
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
  stato: MezzoStato;
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
}

export type AppData = {
  cantieri: Cantiere[];
  personale: Personale[];
  mezzi: Mezzo[];
  documenti: Documento[];
  settings: AppSettings;
};
