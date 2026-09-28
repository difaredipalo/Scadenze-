import { SubappaltatoreRubrica, Cantiere } from '../types';

export const SETTORI_SUBAPPALTO = [
  'Opere Murarie & Strutture',
  'Impianti Elettrici & Speciali',
  'Termoidraulica & Climatizzazione',
  'Cartongesso, Isolamenti & Pitture',
  'Serramenti, Infissi & Vetrate',
  'Ponteggi & Opere Provvisionali',
  'Carpenteria Metallica & Fabbro',
  'Scavi, Demolizioni & Movimento Terra',
  'Impermeabilizzazioni & Lattoneria',
  'Pavimenti, Rivestimenti & Resine',
  'Smaltimento & Bonifiche',
  'Altro / Speciale'
] as const;

export const DEFAULT_SUBAPPALTATORI: SubappaltatoreRubrica[] = [
  {
    id: 'sub-posainfissi-1',
    ragioneSociale: 'PosaInfissi S.r.l.',
    settore: 'Serramenti, Infissi & Vetrate',
    partitaIva: '01234567890',
    codiceFiscale: '01234567890',
    sedeLegale: 'Via Privata Giusti 14',
    cap: '20154',
    citta: 'Milano',
    provincia: 'MI',
    rappresentanteLegale: 'Ing. Paolo Brambilla',
    referenteContatto: 'Marco Sala (Resp. Tecnico)',
    telefono: '+39 02 89451200',
    email: 'info@posainfissi.it',
    pec: 'posainfissi@pec.it',
    iban: 'IT60X0542811101000000123456',
    banca: 'Banca Intesa Sanpaolo',
    maggiorazioneDefault: 10,
    durcScadenza: '2026-04-30',
    visuraScadenza: '2026-12-31',
    rcTerziScadenza: '2026-10-15',
    note: 'Fornitura e posa serramenti in alluminio/PVC a taglio termico, certificazione posa PQT.',
    rating: 5,
    dataCreazione: '2025-01-10',
  },
  {
    id: 'sub-termoclima-2',
    ragioneSociale: 'Rossi TermoClima S.n.c.',
    settore: 'Termoidraulica & Climatizzazione',
    partitaIva: '09876543211',
    codiceFiscale: '09876543211',
    sedeLegale: 'Via Brianza 45',
    cap: '20900',
    citta: 'Monza',
    provincia: 'MB',
    rappresentanteLegale: 'Alberto Rossi',
    referenteContatto: 'Alberto Rossi (Titolare)',
    telefono: '+39 039 324190',
    email: 'rossitermoclima@gmail.com',
    pec: 'rossi.termoclima@pec.cna.it',
    iban: 'IT75Y0306909606100000098765',
    banca: 'Banca Popolare di Sondrio',
    maggiorazioneDefault: 12,
    durcScadenza: '2026-06-15',
    visuraScadenza: '2026-12-31',
    rcTerziScadenza: '2026-09-01',
    note: 'Impianti idrosanitari, pompe di calore, ventilazione meccanica VMC e riscaldamento a pavimento.',
    rating: 5,
    dataCreazione: '2025-02-14',
  },
  {
    id: 'sub-elettrosistemi-3',
    ragioneSociale: 'ElettroSistemi Pro S.p.A.',
    settore: 'Impianti Elettrici & Speciali',
    partitaIva: '03456789012',
    codiceFiscale: '03456789012',
    sedeLegale: 'Viale Industria 88',
    cap: '20092',
    citta: 'Cinisello Balsamo',
    provincia: 'MI',
    rappresentanteLegale: 'Dott.ssa Laura De Angelis',
    referenteContatto: 'Geom. Matteo Fontana',
    telefono: '+39 02 6128400',
    email: 'amministrazione@elettrosistemipro.it',
    pec: 'elettrosistemi@legalmail.it',
    iban: 'IT44Z0200801622000100234567',
    banca: 'UniCredit SpA',
    maggiorazioneDefault: 8,
    durcScadenza: '2025-11-20', // in scadenza ravvicinata per demo
    visuraScadenza: '2026-06-30',
    rcTerziScadenza: '2026-05-30',
    note: 'Quadri BT/MT, automazioni domotiche, fotovoltaico, cablaggio strutturato e reti dati.',
    rating: 4,
    dataCreazione: '2025-03-01',
  },
  {
    id: 'sub-edelponti-4',
    ragioneSociale: 'EdilPonti Sicurezza S.r.l.',
    settore: 'Ponteggi & Opere Provvisionali',
    partitaIva: '05678901234',
    codiceFiscale: '05678901234',
    sedeLegale: 'Via Grandi 12',
    cap: '20099',
    citta: 'Sesto San Giovanni',
    provincia: 'MI',
    rappresentanteLegale: 'Fabio Colombo',
    referenteContatto: 'Fabio Colombo',
    telefono: '+39 02 2489910',
    email: 'logistica@edilponti.com',
    pec: 'edilpontisrl@pec.it',
    iban: 'IT90A0503401755000000054321',
    banca: 'Banco BPM',
    maggiorazioneDefault: 15,
    durcScadenza: '2026-05-10',
    visuraScadenza: '2026-12-31',
    rcTerziScadenza: '2026-11-05',
    note: 'Montaggio/smontaggio ponteggi multidirezionali e a telai prefabbricati, redazione PIMUS inclusa.',
    rating: 4,
    dataCreazione: '2025-03-12',
  },
  {
    id: 'sub-colorgesso-5',
    ragioneSociale: 'ColorGesso Art & Finiture',
    settore: 'Cartongesso, Isolamenti & Pitture',
    partitaIva: '07890123456',
    codiceFiscale: 'CLRART78C12F205K',
    sedeLegale: 'Via Marconi 19',
    cap: '20093',
    citta: 'Cologno Monzese',
    provincia: 'MI',
    rappresentanteLegale: 'Carmine Esposito',
    referenteContatto: 'Carmine Esposito',
    telefono: '+39 347 8899123',
    email: 'info@colorgessoart.it',
    pec: 'colorgessoart@pec.it',
    iban: 'IT12B0301503200000000345678',
    banca: 'Banca Mediolanum',
    maggiorazioneDefault: 10,
    durcScadenza: '2025-08-30', // scaduto per test alert
    visuraScadenza: '2026-04-15',
    rcTerziScadenza: '2025-12-31',
    note: 'Controsoffitti Rei 120, pareti in cartongesso acustiche, cappotto termico esterno e rasature.',
    rating: 3,
    dataCreazione: '2025-04-05',
  }
];

export interface DurcStatusInfo {
  stato: 'valido' | 'in_scadenza' | 'scaduto' | 'mancante';
  label: string;
  giorniRimanenti: number | null;
  badgeClass: string;
  dotClass: string;
}

export function getDurcStatus(scadenza?: string): DurcStatusInfo {
  if (!scadenza) {
    return {
      stato: 'mancante',
      label: 'DURC Non Registrato',
      giorniRimanenti: null,
      badgeClass: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700',
      dotClass: 'bg-slate-400',
    };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiryDate = new Date(scadenza);
  expiryDate.setHours(0, 0, 0, 0);

  const diffTime = expiryDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    const daysAgo = Math.abs(diffDays);
    return {
      stato: 'scaduto',
      label: `DURC Scaduto da ${daysAgo} ${daysAgo === 1 ? 'giorno' : 'giorni'}`,
      giorniRimanenti: diffDays,
      badgeClass: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800',
      dotClass: 'bg-rose-500',
    };
  }

  if (diffDays <= 30) {
    return {
      stato: 'in_scadenza',
      label: `DURC In Scadenza (${diffDays} ${diffDays === 1 ? 'giorno' : 'giorni'})`,
      giorniRimanenti: diffDays,
      badgeClass: 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
      dotClass: 'bg-amber-500 animate-pulse',
    };
  }

  return {
    stato: 'valido',
    label: `DURC Regolare (${diffDays} gg)`,
    giorniRimanenti: diffDays,
    badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
    dotClass: 'bg-emerald-500',
  };
}

/**
 * Utility to extract any subcontractors declared inside cantieri
 * and convert them into rubrica entries if not already present.
 */
export function extractSubappaltatoriFromCantieri(
  cantieri: Cantiere[],
  existingRubrica: SubappaltatoreRubrica[] = []
): { updatedRubrica: SubappaltatoreRubrica[]; addedCount: number } {
  const currentList = [...existingRubrica];
  let addedCount = 0;

  cantieri.forEach(cantiere => {
    (cantiere.subappalti || []).forEach(sub => {
      if (!sub.azienda || !sub.azienda.trim()) return;

      const cleanName = sub.azienda.trim().toLowerCase();
      const cleanPiva = sub.partitaIva?.replace(/\s+/g, '') || '';

      const exists = currentList.some(item => {
        const itemClean = item.ragioneSociale.trim().toLowerCase();
        const itemPiva = item.partitaIva?.replace(/\s+/g, '') || '';
        return itemClean === cleanName || (cleanPiva && itemPiva && cleanPiva === itemPiva);
      });

      if (!exists) {
        // Create new rubrica item from cantiere subappalto
        const newRubricaItem: SubappaltatoreRubrica = {
          id: `sub-auto-${Math.random().toString(36).substr(2, 9)}`,
          ragioneSociale: sub.azienda.trim(),
          settore: sub.lavoro || 'Altro / Speciale',
          partitaIva: sub.partitaIva || '',
          codiceFiscale: sub.codiceFiscale || sub.partitaIva || '',
          sedeLegale: sub.sedeLegale || '',
          rappresentanteLegale: sub.rappresentanteLegale || '',
          telefono: sub.telefono || '',
          email: sub.email || '',
          pec: sub.pec || '',
          maggiorazioneDefault: sub.maggiorazione || 10,
          durcScadenza: sub.durcScadenza || '',
          note: `Importato automaticamente dal cantiere "${cantiere.nome}" (Lavoro: ${sub.lavoro})`,
          rating: 4,
          dataCreazione: new Date().toISOString().split('T')[0],
        };
        currentList.push(newRubricaItem);
        addedCount++;
      }
    });
  });

  return { updatedRubrica: currentList, addedCount };
}
