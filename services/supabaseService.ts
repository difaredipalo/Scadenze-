import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { AppData, Cantiere, Personale, Mezzo, Documento } from '../types';

export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

// Get credentials from Vite env or localStorage override
export const getSupabaseConfig = (): SupabaseConfig => {
  const envUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
  const envKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

  const savedUrl = (localStorage.getItem('scadenze_supabase_url') || '').trim();
  const savedKey = (localStorage.getItem('scadenze_supabase_key') || '').trim();

  return {
    url: savedUrl || envUrl,
    anonKey: savedKey || envKey,
  };
};

export const saveSupabaseConfig = (config: SupabaseConfig) => {
  if (config.url && config.url.trim()) {
    localStorage.setItem('scadenze_supabase_url', config.url.trim());
  } else {
    localStorage.removeItem('scadenze_supabase_url');
  }

  if (config.anonKey && config.anonKey.trim()) {
    localStorage.setItem('scadenze_supabase_key', config.anonKey.trim());
  } else {
    localStorage.removeItem('scadenze_supabase_key');
  }
};

let clientInstance: SupabaseClient | null = null;
let currentClientKey = '';

export const getSupabaseClient = (): SupabaseClient | null => {
  const config = getSupabaseConfig();
  if (!config.url || !config.anonKey) {
    return null;
  }

  const keySignature = `${config.url}_${config.anonKey}`;
  if (clientInstance && currentClientKey === keySignature) {
    return clientInstance;
  }

  try {
    clientInstance = createClient(config.url, config.anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
    currentClientKey = keySignature;
    return clientInstance;
  } catch (error) {
    console.error('Errore inizializzazione client Supabase:', error);
    return null;
  }
};

/**
 * Checks connection health with Supabase
 */
export const checkSupabaseConnection = async (): Promise<{ ok: boolean; message: string; latencyMs?: number }> => {
  const client = getSupabaseClient();
  const config = getSupabaseConfig();

  if (!config.url || !config.anonKey) {
    return { ok: false, message: 'URL o Anon Key di Supabase non configurati (.env.example o Impostazioni).' };
  }

  if (!client) {
    return { ok: false, message: 'Impossibile istanziare il client Supabase. Verifica le credenziali inserite.' };
  }

  const startTime = Date.now();

  try {
    // Prova a leggere dalla tabella app_state o cantieri
    const { data: _d1, error: err1 } = await client.from('app_data').select('id').limit(1);
    const latencyMs = Date.now() - startTime;

    if (!err1) {
      return { ok: true, message: `Connessione attiva a Supabase (${latencyMs}ms)`, latencyMs };
    }

    // Se app_data non esiste, prova cantieri
    const { data: _d2, error: err2 } = await client.from('cantieri').select('id').limit(1);
    if (!err2) {
      return { ok: true, message: `Connessione attiva alle tabelle relazionali (${Date.now() - startTime}ms)`, latencyMs: Date.now() - startTime };
    }

    // Se le tabelle non sono ancora state create ma il server risponde (errore 42P01: relation does not exist)
    if (err1?.code === '42P01' || err2?.code === '42P01') {
      return {
        ok: true,
        message: 'Connesso a Supabase! (Le tabelle devono essere create tramite lo script SQL fornito in Impostazioni).',
        latencyMs,
      };
    }

    return { ok: false, message: `Errore Supabase: ${err1?.message || err2?.message || 'Errore sconosciuto'}` };
  } catch (err: any) {
    return { ok: false, message: `Errore di rete o configurazione: ${err?.message || 'Connessione fallita'}` };
  }
};

/**
 * Pull full data from Supabase
 */
export const fetchAllDataFromSupabase = async (): Promise<{ data: Partial<AppData> | null; error: string | null }> => {
  const client = getSupabaseClient();
  if (!client) {
    return { data: null, error: 'Client Supabase non inizializzato' };
  }

  try {
    // 1. Prova prima dalla tabella centralizzata app_data
    const { data: snapshotRows, error: snapshotErr } = await client
      .from('app_data')
      .select('payload')
      .order('updated_at', { ascending: false })
      .limit(1);

    if (!snapshotErr && snapshotRows && snapshotRows.length > 0 && snapshotRows[0].payload) {
      const payload = snapshotRows[0].payload as AppData;
      return { data: payload, error: null };
    }

    // 2. Altrimenti scarica dalle singole tabelle strutturate
    const [cantieriRes, personaleRes, mezziRes, documentiRes] = await Promise.all([
      client.from('cantieri').select('*'),
      client.from('personale').select('*'),
      client.from('mezzi').select('*'),
      client.from('documenti').select('*'),
    ]);

    const partialData: Partial<AppData> = {};

    if (!cantieriRes.error && cantieriRes.data) {
      partialData.cantieri = cantieriRes.data.map(mapRowToCantiere);
    }
    if (!personaleRes.error && personaleRes.data) {
      partialData.personale = personaleRes.data.map(mapRowToPersonale);
    }
    if (!mezziRes.error && mezziRes.data) {
      partialData.mezzi = mezziRes.data.map(mapRowToMezzo);
    }
    if (!documentiRes.error && documentiRes.data) {
      partialData.documenti = documentiRes.data.map(mapRowToDocumento);
    }

    if (
      (partialData.cantieri && partialData.cantieri.length > 0) ||
      (partialData.personale && partialData.personale.length > 0) ||
      (partialData.mezzi && partialData.mezzi.length > 0) ||
      (partialData.documenti && partialData.documenti.length > 0)
    ) {
      return { data: partialData, error: null };
    }

    return { data: null, error: 'Nessun record trovato su Supabase' };
  } catch (e: any) {
    return { data: null, error: e?.message || 'Errore durante il download da Supabase' };
  }
};

/**
 * Upload & Sync entire state to Supabase
 */
export const syncAllDataToSupabase = async (appData: AppData): Promise<{ ok: boolean; message: string }> => {
  const client = getSupabaseClient();
  if (!client) {
    return { ok: false, message: 'Client Supabase non configurato' };
  }

  try {
    const now = new Date().toISOString();

    // 1. Salva snapshot centralizzato su app_data (ID fisso 'main')
    const { error: snapErr } = await client.from('app_data').upsert({
      id: 'main',
      payload: appData,
      updated_at: now,
    });

    // 2. Se possibile, sincronizza anche le tabelle strutturate singole per massima compatibilità
    try {
      if (appData.cantieri && appData.cantieri.length > 0) {
        const rows = appData.cantieri.map(c => mapCantiereToRow(c, now));
        await client.from('cantieri').upsert(rows);
      }

      if (appData.personale && appData.personale.length > 0) {
        const rows = appData.personale.map(p => mapPersonaleToRow(p, now));
        await client.from('personale').upsert(rows);
      }

      if (appData.mezzi && appData.mezzi.length > 0) {
        const rows = appData.mezzi.map(m => mapMezzoToRow(m, now));
        await client.from('mezzi').upsert(rows);
      }

      if (appData.documenti && appData.documenti.length > 0) {
        const rows = appData.documenti.map(d => mapDocumentoToRow(d, now));
        await client.from('documenti').upsert(rows);
      }
    } catch (tblErr) {
      console.warn('Avviso sincronizzazione tabelle dettagliate:', tblErr);
    }

    if (snapErr && snapErr.code !== '42P01') {
      return { ok: false, message: `Errore sincronizzazione: ${snapErr.message}` };
    }

    return { ok: true, message: 'Dati sincronizzati con successo sul database Supabase!' };
  } catch (err: any) {
    return { ok: false, message: `Errore durante il salvataggio su Supabase: ${err?.message}` };
  }
};

// SQL Schema Generator for Supabase
export const getSupabaseSQLSchema = (): string => {
  return `-- =========================================================
-- SCHEMA DATABASE SUPABASE PER SCADENZE+ (EDILIZIA & CANTIERI)
-- Esegui questo script nel SQL Editor della dashboard Supabase
-- =========================================================

-- 1. Tabella Snapshot Rapido & Backup
CREATE TABLE IF NOT EXISTS public.app_data (
    id TEXT PRIMARY KEY DEFAULT 'main',
    payload JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- 2. Tabella Cantieri
CREATE TABLE IF NOT EXISTS public.cantieri (
    id TEXT PRIMARY KEY,
    nome TEXT NOT NULL,
    cliente TEXT NOT NULL,
    indirizzo TEXT,
    direttore_lavori TEXT,
    data_inizio DATE,
    data_consegna DATE,
    scadenza DATE NOT NULL,
    scadenza_dnl DATE,
    scadenza_suolo_pubblico DATE,
    stato TEXT DEFAULT 'aperto',
    progresso INTEGER DEFAULT 0,
    importo_totale NUMERIC DEFAULT 0,
    note TEXT,
    tecnici JSONB DEFAULT '[]'::jsonb,
    checklist_documenti JSONB DEFAULT '[]'::jsonb,
    sal_list JSONB DEFAULT '[]'::jsonb,
    extra_list JSONB DEFAULT '[]'::jsonb,
    subappalti JSONB DEFAULT '[]'::jsonb,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- 3. Tabella Personale
CREATE TABLE IF NOT EXISTS public.personale (
    id TEXT PRIMARY KEY,
    nome TEXT NOT NULL,
    cognome TEXT NOT NULL,
    ruolo TEXT NOT NULL,
    categoria TEXT DEFAULT 'operaio',
    in_forza BOOLEAN DEFAULT true,
    data_assunzione DATE,
    foto TEXT,
    luogo_nascita TEXT,
    scadenza_contratto DATE,
    scadenza_visita_medica DATE NOT NULL,
    codice_fiscale TEXT,
    note TEXT,
    corsi_formazione JSONB DEFAULT '[]'::jsonb,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- Aggiorna colonne se tabella esistente
ALTER TABLE public.personale ADD COLUMN IF NOT EXISTS data_assunzione DATE;
ALTER TABLE public.personale ADD COLUMN IF NOT EXISTS foto TEXT;
ALTER TABLE public.personale ADD COLUMN IF NOT EXISTS luogo_nascita TEXT;

-- 4. Tabella Mezzi & Autocarri
CREATE TABLE IF NOT EXISTS public.mezzi (
    id TEXT PRIMARY KEY,
    modello TEXT NOT NULL,
    targa TEXT NOT NULL,
    stato TEXT DEFAULT 'disponibile',
    scadenza_assicurazione DATE NOT NULL,
    prossima_revisione DATE NOT NULL,
    scadenza_verifica_periodica DATE,
    telaio TEXT,
    note TEXT,
    storico_manutenzioni JSONB DEFAULT '[]'::jsonb,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- 5. Tabella Documenti & Scadenze Generali
CREATE TABLE IF NOT EXISTS public.documenti (
    id TEXT PRIMARY KEY,
    titolo TEXT NOT NULL,
    categoria TEXT NOT NULL,
    scadenza DATE NOT NULL,
    ente TEXT NOT NULL,
    priorita TEXT DEFAULT 'media',
    note TEXT,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- Abilitazione Row Level Security (RLS) e policy pubbliche (lettura/scrittura per anon/autenticati)
ALTER TABLE public.app_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cantieri ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personale ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mezzi ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documenti ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  CREATE POLICY "Accesso completo app_data" ON public.app_data FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ 
BEGIN
  CREATE POLICY "Accesso completo cantieri" ON public.cantieri FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ 
BEGIN
  CREATE POLICY "Accesso completo personale" ON public.personale FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ 
BEGIN
  CREATE POLICY "Accesso completo mezzi" ON public.mezzi FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ 
BEGIN
  CREATE POLICY "Accesso completo documenti" ON public.documenti FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
`;
};

// ================= UTILITIES DI MAPPATURA =================

function mapRowToCantiere(row: any): Cantiere {
  return {
    id: row.id,
    nome: row.nome,
    cliente: row.cliente,
    indirizzo: row.indirizzo,
    direttoreLavori: row.direttore_lavori,
    dataInizio: row.data_inizio,
    dataConsegna: row.data_consegna,
    scadenza: row.scadenza,
    scadenzaDNL: row.scadenza_dnl,
    scadenzaSuoloPubblico: row.scadenza_suolo_pubblico,
    stato: row.stato,
    progresso: row.progresso || 0,
    importoTotale: Number(row.importo_totale) || 0,
    note: row.note,
    tecnici: row.tecnici || [],
    checklistDocumenti: row.checklist_documenti || [],
    salList: row.sal_list || [],
    extraList: row.extra_list || [],
    subappalti: row.subappalti || [],
  };
}

function mapCantiereToRow(c: Cantiere, now: string): any {
  return {
    id: c.id,
    nome: c.nome,
    cliente: c.cliente,
    indirizzo: c.indirizzo || null,
    direttore_lavori: c.direttoreLavori || null,
    data_inizio: c.dataInizio || null,
    data_consegna: c.dataConsegna || null,
    scadenza: c.scadenza,
    scadenza_dnl: c.scadenzaDNL || null,
    scadenza_suolo_pubblico: c.scadenzaSuoloPubblico || null,
    stato: c.stato,
    progresso: c.progresso,
    importo_totale: c.importoTotale,
    note: c.note || null,
    tecnici: c.tecnici || [],
    checklist_documenti: c.checklistDocumenti || [],
    sal_list: c.salList || [],
    extra_list: c.extraList || [],
    subappalti: c.subappalti || [],
    updated_at: now,
  };
}

function mapRowToPersonale(row: any): Personale {
  return {
    id: row.id,
    nome: row.nome,
    cognome: row.cognome,
    ruolo: row.ruolo,
    categoria: row.categoria || 'operaio',
    inForza: row.in_forza !== undefined ? row.in_forza : true,
    dataAssunzione: row.data_assunzione || undefined,
    foto: row.foto || undefined,
    luogoNascita: row.luogo_nascita || undefined,
    scadenzaContratto: row.scadenza_contratto,
    scadenzaVisitaMedica: row.scadenza_visita_medica,
    codiceFiscale: row.codice_fiscale,
    note: row.note,
    corsiFormazione: row.corsi_formazione || [],
  };
}

function mapPersonaleToRow(p: Personale, now: string): any {
  return {
    id: p.id,
    nome: p.nome,
    cognome: p.cognome,
    ruolo: p.ruolo,
    categoria: p.categoria,
    in_forza: p.inForza,
    data_assunzione: p.dataAssunzione || null,
    foto: p.foto || null,
    luogo_nascita: p.luogoNascita || null,
    scadenza_contratto: p.scadenzaContratto || null,
    scadenza_visita_medica: p.scadenzaVisitaMedica,
    codice_fiscale: p.codiceFiscale || null,
    note: p.note || null,
    corsi_formazione: p.corsiFormazione || [],
    updated_at: now,
  };
}

function mapRowToMezzo(row: any): Mezzo {
  return {
    id: row.id,
    modello: row.modello,
    targa: row.targa,
    stato: row.stato,
    scadenzaAssicurazione: row.scadenza_assicurazione,
    prossimaRevisione: row.prossima_revisione,
    scadenzaVerificaPeriodica: row.scadenza_verifica_periodica,
    telaio: row.telaio,
    note: row.note,
    storicoManutenzioni: row.storico_manutenzioni || [],
  };
}

function mapMezzoToRow(m: Mezzo, now: string): any {
  return {
    id: m.id,
    modello: m.modello,
    targa: m.targa,
    stato: m.stato,
    scadenza_assicurazione: m.scadenzaAssicurazione,
    prossima_revisione: m.prossimaRevisione,
    scadenza_verifica_periodica: m.scadenzaVerificaPeriodica || null,
    telaio: m.telaio || null,
    note: m.note || null,
    storico_manutenzioni: m.storicoManutenzioni || [],
    updated_at: now,
  };
}

function mapRowToDocumento(row: any): Documento {
  return {
    id: row.id,
    titolo: row.titolo,
    categoria: row.categoria,
    scadenza: row.scadenza,
    ente: row.ente,
    priorita: row.priorita,
    note: row.note,
  };
}

function mapDocumentoToRow(d: Documento, now: string): any {
  return {
    id: d.id,
    titolo: d.titolo,
    categoria: d.categoria,
    scadenza: d.scadenza,
    ente: d.ente,
    priorita: d.priorita,
    note: d.note || null,
    updated_at: now,
  };
}
