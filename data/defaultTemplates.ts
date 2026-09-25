import { ModelloContratto } from '../types';

export interface ContractVariableDef {
  key: string;
  tag: string;
  label: string;
  description: string;
  source: 'cantiere' | 'settings' | 'calcolato' | 'subappalto';
}

export const CONTRACT_VARIABLES: ContractVariableDef[] = [
  { key: 'NOME_CANTIERE', tag: '{{NOME_CANTIERE}}', label: 'Nome Cantiere', description: 'Denominazione del cantiere', source: 'cantiere' },
  { key: 'CLIENTE', tag: '{{CLIENTE}}', label: 'Committente / Cliente', description: 'Nome o ragione sociale del committente', source: 'cantiere' },
  { key: 'CODICEFISCALE', tag: '{{CODICEFISCALE}}', label: 'Codice Fiscale Committente', description: 'C.F. o Partita IVA del committente', source: 'cantiere' },
  { key: 'INDIRIZZO_CANTIERE', tag: '{{INDIRIZZO_CANTIERE}}', label: 'Indirizzo Cantiere', description: 'Ubicazione esatta dei lavori', source: 'cantiere' },
  { key: 'IMPORTO_TOTALE', tag: '{{IMPORTO_TOTALE}}', label: 'Importo Lavori Cantiere (€)', description: 'Importo contrattuale complessivo in cifre', source: 'cantiere' },
  { key: 'IMPORTO_LETTERE', tag: '{{IMPORTO_LETTERE}}', label: 'Importo in Lettere', description: 'Importo scritto per esteso in lettere', source: 'calcolato' },
  { key: 'ONERI_SICUREZZA', tag: '{{ONERI_SICUREZZA}}', label: 'Oneri Sicurezza Cantiere (€)', description: 'Costi della sicurezza non soggetti a ribasso', source: 'cantiere' },
  { key: 'DATA_INIZIO', tag: '{{DATA_INIZIO}}', label: 'Data Inizio Lavori', description: 'Data inizio presunta o effettiva', source: 'cantiere' },
  { key: 'DATA_CONSEGNA', tag: '{{DATA_CONSEGNA}}', label: 'Data Consegna / Fine', description: 'Data ultimazione e consegna', source: 'cantiere' },
  { key: 'DURATA_GIORNI', tag: '{{DURATA_GIORNI}}', label: 'Durata Lavori (Giorni)', description: 'Numero di giorni naturali e consecutivi', source: 'calcolato' },
  { key: 'DIRETTORE_LAVORI', tag: '{{DIRETTORE_LAVORI}}', label: 'Direttore dei Lavori', description: 'Tecnico incaricato della D.L.', source: 'cantiere' },
  { key: 'COORDINATORE_SICUREZZA', tag: '{{COORDINATORE_SICUREZZA}}', label: 'Coordinatore Sicurezza (CSE)', description: 'Tecnico coordinatore sicurezza', source: 'cantiere' },
  { key: 'PROGETTISTA', tag: '{{PROGETTISTA}}', label: 'Progettista / Studio Tecnico', description: 'Nome o studio del progettista dell\'opera', source: 'cantiere' },
  { key: 'PROGETTISTA_TEL', tag: '{{PROGETTISTA_TEL}}', label: 'Telefono Progettista', description: 'Recapito telefonico del progettista', source: 'cantiere' },
  { key: 'PROGETTISTA_EMAIL', tag: '{{PROGETTISTA_EMAIL}}', label: 'Email Progettista', description: 'Indirizzo email del progettista', source: 'cantiere' },
  { key: 'PROGETTISTA_PEC', tag: '{{PROGETTISTA_PEC}}', label: 'PEC Progettista', description: 'Indirizzo PEC del progettista', source: 'cantiere' },
  { key: 'NOME_IMPRESA', tag: '{{NOME_IMPRESA}}', label: 'Ragione Sociale Impresa', description: 'Nome della propria impresa appaltatrice', source: 'settings' },
  { key: 'PIVA_IMPRESA', tag: '{{PIVA_IMPRESA}}', label: 'P.IVA / CF Impresa', description: 'Partita IVA dell\'impresa appaltatrice', source: 'settings' },
  { key: 'SEDE_IMPRESA', tag: '{{SEDE_IMPRESA}}', label: 'Sede Legale Impresa', description: 'Indirizzo della sede legale', source: 'settings' },
  { key: 'PEC_IMPRESA', tag: '{{PEC_IMPRESA}}', label: 'PEC / Mail Impresa', description: 'Indirizzo PEC o email aziendale', source: 'settings' },
  { key: 'LEGALE_RAPPRESENTANTE', tag: '{{LEGALE_RAPPRESENTANTE}}', label: 'Legale Rappresentante', description: 'Nome del titolare o amministratore', source: 'settings' },
  { key: 'MODALITA_PAGAMENTO', tag: '{{MODALITA_PAGAMENTO}}', label: 'Modalità di Pagamento', description: 'Termini di liquidazione (acconti, SAL, saldo)', source: 'cantiere' },
  { key: 'ELENCO_SAL', tag: '{{ELENCO_SAL}}', label: 'Riepilogo SAL', description: 'Elenco degli stati avanzamento lavori registrati', source: 'cantiere' },
  { key: 'ELENCO_SUBAPPALTI', tag: '{{ELENCO_SUBAPPALTI}}', label: 'Elenco Tutti i Subappalti', description: 'Elenco riassuntivo di tutte le ditte in subappalto', source: 'cantiere' },
  { key: 'ALLEGATI', tag: '{{ALLEGATI}}', label: 'Elenco Allegati Contrattuali', description: 'Elenco documenti allegati (computo, POS, polizza...)', source: 'cantiere' },
  { key: 'FORO_COMPETENTE', tag: '{{FORO_COMPETENTE}}', label: 'Foro Competente', description: 'Tribunale competente per eventuali controversie', source: 'calcolato' },
  { key: 'CIG_CUP', tag: '{{CIG_CUP}}', label: 'Codici CIG / CUP', description: 'Identificativi gara o opera pubblica', source: 'cantiere' },
  { key: 'DATA_OGGI', tag: '{{DATA_OGGI}}', label: 'Data di Stipula', description: 'Data odierna di stipula del contratto', source: 'calcolato' },
  { key: 'NOTE_CANTIERE', tag: '{{NOTE_CANTIERE}}', label: 'Note e Clausole Particolari', description: 'Note specifiche o pattuizioni accessorie', source: 'cantiere' },

  // Variabili specifiche per il Subappalto Selezionato (Autocompilazione diretta)
  { key: 'SUBAPPALTO_AZIENDA', tag: '{{SUBAPPALTO_AZIENDA}}', label: 'Subappaltatore - Ragione Sociale', description: 'Nome dell\'impresa subappaltatrice selezionata', source: 'subappalto' },
  { key: 'SUBAPPALTO_LAVORO', tag: '{{SUBAPPALTO_LAVORO}}', label: 'Subappaltatore - Opere / Lavorazione', description: 'Tipologia di lavoro affidato in subappalto', source: 'subappalto' },
  { key: 'SUBAPPALTO_PIVA', tag: '{{SUBAPPALTO_PIVA}}', label: 'Subappaltatore - P.IVA / CF', description: 'Partita IVA o Codice Fiscale del subappaltatore', source: 'subappalto' },
  { key: 'SUBAPPALTO_PEC', tag: '{{SUBAPPALTO_PEC}}', label: 'Subappaltatore - PEC', description: 'Indirizzo PEC dell\'impresa subappaltatrice', source: 'subappalto' },
  { key: 'SUBAPPALTO_EMAIL', tag: '{{SUBAPPALTO_EMAIL}}', label: 'Subappaltatore - Email', description: 'Indirizzo email del subappaltatore', source: 'subappalto' },
  { key: 'SUBAPPALTO_SEDE', tag: '{{SUBAPPALTO_SEDE}}', label: 'Subappaltatore - Sede Legale', description: 'Sede legale della ditta subappaltatrice', source: 'subappalto' },
  { key: 'SUBAPPALTO_RAPPRESENTANTE', tag: '{{SUBAPPALTO_RAPPRESENTANTE}}', label: 'Subappaltatore - Legale Rappresentante', description: 'Nominativo del rappresentante legale', source: 'subappalto' },
  { key: 'SUBAPPALTO_TELEFONO', tag: '{{SUBAPPALTO_TELEFONO}}', label: 'Subappaltatore - Telefono', description: 'Recapito telefonico del subappaltatore', source: 'subappalto' },
  { key: 'SUBAPPALTO_PREZZO', tag: '{{SUBAPPALTO_PREZZO}}', label: 'Subappaltatore - Importo Netto (€)', description: 'Importo contrattuale del subappalto in cifre', source: 'subappalto' },
  { key: 'SUBAPPALTO_PREZZO_LETTERE', tag: '{{SUBAPPALTO_PREZZO_LETTERE}}', label: 'Subappaltatore - Importo in Lettere', description: 'Importo del subappalto scritto in lettere', source: 'subappalto' },
  { key: 'SUBAPPALTO_PREZZO_MAGGIORATO', tag: '{{SUBAPPALTO_PREZZO_MAGGIORATO}}', label: 'Subappaltatore - Importo con Maggiorazione (€)', description: 'Importo comprensivo della maggiorazione', source: 'subappalto' },
  { key: 'SUBAPPALTO_MAGGIORAZIONE', tag: '{{SUBAPPALTO_MAGGIORAZIONE}}', label: 'Subappaltatore - Maggiorazione (%)', description: 'Percentuale di maggiorazione / ricarico', source: 'subappalto' },
  { key: 'SUBAPPALTO_ONERI_SICUREZZA', tag: '{{SUBAPPALTO_ONERI_SICUREZZA}}', label: 'Subappaltatore - Oneri Sicurezza (€)', description: 'Oneri di sicurezza interferenziali del subappalto', source: 'subappalto' },
];

export const DEFAULT_CONTRATTO_APPALTO = `<center><b>CONTRATTO DI APPALTO PER L'ESECUZIONE DI OPERE EDILI</b></center>
<center><u>(Ai sensi degli artt. 1655 e segg. del Codice Civile e del D.Lgs. 81/2008 s.m.i.)</u></center>

L'anno <b>{{DATA_OGGI}}</b>, in {{SEDE_IMPRESA}}, con la presente scrittura privata avente a tutti gli effetti valore di legge tra le parti:

<b>TRA</b>

Il Sig./La Società: <b>{{CLIENTE}}</b>
Residente/Con sede in: [Indirizzo Committente]
Codice Fiscale / P.IVA: <b>{{CODICEFISCALE}}</b>
(di seguito denominato per brevità "COMMITTENTE")

<b>E</b>

L'Impresa: <b>{{NOME_IMPRESA}}</b>
Con sede legale in: {{SEDE_IMPRESA}}
Codice Fiscale / Partita IVA: {{PIVA_IMPRESA}}
PEC: {{PEC_IMPRESA}}
Rappresentata legalmente dal Sig.: <b>{{LEGALE_RAPPRESENTANTE}}</b>
Iscritta regolarmente alla C.C.I.A.A. e provvista di DURC regolare
(di seguito denominata per brevità "APPALTATORE")

<b>PREMESSO CHE</b>
- Il Committente dichiara di avere la piena disponibilità e titolarità dell'immobile/area sito in {{INDIRIZZO_CANTIERE}};
- È intendimento del Committente far eseguire sull'immobile suddetto i lavori edili relativi a: "<b>{{NOME_CANTIERE}}</b>";
- L'Appaltatore dichiara di possedere l'idoneità tecnico-professionale, l'organizzazione, i mezzi d'opera, le attrezzature e le maestranze qualificate necessarie per la perfetta esecuzione a regola d'arte delle opere appaltate.

<b>SI CONVIENE E SI STIPULA QUANTO SEGUE:</b>

<b>ART. 1 - OGGETTO DELL'APPALTO</b>
Il Committente affida all'Appaltatore, che accetta senza riserve, l'esecuzione di tutte le opere edili, impiantistiche e finiture necessarie per la realizzazione dell'intervento denominato "<b>{{NOME_CANTIERE}}</b>", conformemente alle tavole progettuali, al computo metrico e alle prescrizioni fornite dalla Direzione Lavori.

<b>ART. 2 - LUOGO DI ESECUZIONE DEI LAVORI</b>
I lavori oggetto del presente contratto dovranno essere eseguiti presso il cantiere ubicato in:
<b>{{INDIRIZZO_CANTIERE}}</b>.

<b>ART. 3 - CORRISPETTIVO DELL'APPALTO E ONERI DELLA SICUREZZA</b>
1. Il corrispettivo complessivo concordato a corpo/misura per l'esecuzione a regola d'arte di tutte le opere ammonta a:
   <b>€ {{IMPORTO_TOTALE}}</b> (dicesi <i>Euro {{IMPORTO_LETTERE}}</i>), oltre ad IVA di legge nei termini e nelle aliquote vigenti.
2. Di detto importo, la somma di <b>€ {{ONERI_SICUREZZA}}</b> è specificamente destinata ai costi della sicurezza non soggetti ad alcun ribasso d'asta o sconto, ai sensi del D.Lgs. 81/2008.
3. Eventuali lavori imprevisti, modifiche o varianti dovranno essere preventivamente concordati per iscritto e sottoscritti con apposito verbale aggiuntivo di variante.

<b>ART. 4 - TERMINI DI ESECUZIONE E CRONOPROGRAMMA</b>
1. I lavori avranno inizio in data: <b>{{DATA_INIZIO}}</b>.
2. Il tempo utile per ultimare tutti i lavori e procedere alla consegna dell'opera ultimata è fissato in <b>{{DURATA_GIORNI}} giorni</b> naturali e consecutivi, con ultimazione inderogabile entro il: <b>{{DATA_CONSEGNA}}</b>.
3. In caso di ritardo imputabile all'Appaltatore non dovuto a cause di forza maggiore debitamente verbalizzate, sarà applicata una penale giornaliera pari allo 0,5 per mille dell'importo contrattuale.

<b>ART. 5 - MODALITÀ DI PAGAMENTO E STATI AVANZAMENTO LAVORI (SAL)</b>
1. I pagamenti saranno effettuati dal Committente mediante bonifico bancario su conto dedicato.
2. Piano di liquidazione concordato:
   {{MODALITA_PAGAMENTO}}
3. Riepilogo SAL previsti/registrati:
   {{ELENCO_SAL}}
4. Il saldo finale sarà corrisposto entro 30 giorni dall'avvenuta ultimazione dei lavori e dalla verifica congiunta di collaudo, previa verifica del DURC online regolare.

<b>ART. 6 - DIREZIONE DEI LAVORI E COORDINAMENTO DELLA SICUREZZA</b>
La Direzione dei Lavori è affidata a: <b>{{DIRETTORE_LAVORI}}</b>.
Il Coordinatore per la Sicurezza in fase di esecuzione (CSE) è: <b>{{COORDINATORE_SICUREZZA}}</b>.

<b>ART. 7 - SICUREZZA SUL LAVORO E PERSONALE</b>
1. L'Appaltatore si impegna a rispettare e far rispettare scrupolosamente tutte le disposizioni in materia di salute e sicurezza (D.Lgs. 81/2008).
2. Tutto il personale impiegato in cantiere dovrà essere regolarmente assunto, dotato dei prescritti DPI e munito di apposito tesserino di riconoscimento ex D.Lgs. 81/2008.

<b>ART. 8 - SUBAPPALTI</b>
Eventuali subappalti per lavorazioni specialistiche ({{ELENCO_SUBAPPALTI}}) devono essere preventivamente comunicati e autorizzati per iscritto dal Committente.

<b>ART. 9 - GARANZIE E RESPONSABILITÀ</b>
L'Appaltatore garantisce l'opera eseguita ai sensi degli artt. 1667, 1668 e 1669 del Codice Civile per difformità, vizi ed eventuali gravi difetti di costruzione ed è coperto da polizza assicurativa R.C.T./R.C.O.

<b>ART. 10 - NOTE E PATTUIZIONI ACCESSORIE</b>
{{NOTE_CANTIERE}}

<b>ART. 11 - ALLEGATI AL CONTRATTO</b>
Costituiscono parte integrante, sostanziale ed inscindibile del presente contratto i seguenti allegati:
{{ALLEGATI}}

<b>ART. 12 - FORO COMPETENTE</b>
Per ogni eventuale controversia derivante dal presente contratto, le parti convengono la competenza esclusiva del Foro di: <b>{{FORO_COMPETENTE}}</b>.

Letto, approvato e sottoscritto in duplice originale.

IL COMMITTENTE: ___________________________

L'APPALTATORE: ___________________________`;

export const DEFAULT_CONTRATTO_SUBAPPALTO = `<center><b>CONTRATTO DI SUBAPPALTO PER OPERE SPECIALISTICHE EDILI</b></center>
<center><u>(Ai sensi dell'art. 1656 Codice Civile e art. 26 D.Lgs. 81/2008 s.m.i.)</u></center>

L'anno <b>{{DATA_OGGI}}</b>, con la presente scrittura privata tra le parti:

<b>L'IMPRESA APPALTATRICE:</b>
<b>{{NOME_IMPRESA}}</b>, con sede legale in {{SEDE_IMPRESA}}, Codice Fiscale / P.IVA {{PIVA_IMPRESA}}, PEC: {{PEC_IMPRESA}}, rappresentata dal Sig. <b>{{LEGALE_RAPPRESENTANTE}}</b>
(di seguito denominata per brevità "APPALTATRICE PRINCIPALE")

<b>E</b>

<b>L'IMPRESA SUBAPPALTATRICE:</b>
<b>{{SUBAPPALTO_AZIENDA}}</b>, con sede in {{SUBAPPALTO_SEDE}}, Codice Fiscale / Partita IVA: <b>{{SUBAPPALTO_PIVA}}</b>, PEC: <b>{{SUBAPPALTO_PEC}}</b>, Email: {{SUBAPPALTO_EMAIL}}, Telefono: {{SUBAPPALTO_TELEFONO}}, rappresentata dal Sig. <b>{{SUBAPPALTO_RAPPRESENTANTE}}</b>
(di seguito denominata per brevità "SUBAPPALTATORE")

<b>PREMESSO CHE</b>
- L'Appaltatrice Principale è affidataria dei lavori del cantiere denominato "<b>{{NOME_CANTIERE}}</b>", ubicato in {{INDIRIZZO_CANTIERE}} per conto del Committente <b>{{CLIENTE}}</b> (C.F./P.IVA: <b>{{CODICEFISCALE}}</b>);
- L'Appaltatrice intende affidare al Subappaltatore l'esecuzione a regola d'arte delle seguenti opere specialistiche: "<b>{{SUBAPPALTO_LAVORO}}</b>";
- Il Subappaltatore dichiara di possedere piena idoneità tecnico-professionale ex All. XVII D.Lgs. 81/08, adeguata organizzazione aziendale, maestranze qualificate e DURC regolare in corso di validità.

<b>SI CONVIENE E SI STIPULA QUANTO SEGUE:</b>

<b>ART. 1 - OGGETTO DEL SUBAPPALTO E UBICAZIONE</b>
L'Appaltatrice affida al Subappaltatore, che accetta, l'esecuzione a regola d'arte di tutte le lavorazioni specialistiche consistenti in: <b>{{SUBAPPALTO_LAVORO}}</b>, da realizzarsi presso il cantiere sito in <b>{{INDIRIZZO_CANTIERE}}</b>, nel rispetto delle direttive impartite dalla D.L. (<b>{{DIRETTORE_LAVORI}}</b>) e dall'Appaltatrice.

<b>ART. 2 - CORRISPETTIVO E ONERI DI SICUREZZA</b>
1. Il corrispettivo forfettario e a corpo convenuto per le lavorazioni in subappalto ammonta a complessivi <b>€ {{SUBAPPALTO_PREZZO}}</b> (dicesi <i>Euro {{SUBAPPALTO_PREZZO_LETTERE}}</i>), oltre ad IVA di legge nei termini e nelle aliquote vigenti.
2. Di detto importo, la somma di <b>€ {{SUBAPPALTO_ONERI_SICUREZZA}}</b> corrisponde agli oneri specifici di sicurezza aziendali ed interferenziali non soggetti ad alcun ribasso.

<b>ART. 3 - TEMPI DI ESECUZIONE E CRONOPROGRAMMA</b>
1. Le lavorazioni del Subappaltatore avranno inizio in data <b>{{DATA_INIZIO}}</b> e dovranno essere ultimate entro il <b>{{DATA_CONSEGNA}}</b> (durata stimata: {{DURATA_GIORNI}} giorni naturali e consecutivi).
2. Il Subappaltatore concorderà giornalmente con il Capocantiere dell'Appaltatrice le fasi di avanzamento e gli accessi al cantiere.

<b>ART. 4 - SALUTE E SICUREZZA SUL LAVORO (D.LGS. 81/2008)</b>
1. Il Subappaltatore è tenuto a redigere e trasmettere all'Appaltatrice il proprio Piano Operativo di Sicurezza (POS) specifico per il cantiere prima dell'inizio delle attività, conformandosi al PSC e alle disposizioni del Coordinatore Sicurezza (<b>{{COORDINATORE_SICUREZZA}}</b>).
2. Tutti i lavoratori del Subappaltatore dovranno essere muniti di tesserino di riconoscimento corredato di fotografia e generalità del datore di lavoro ai sensi dell'art. 26, comma 8 del D.Lgs. 81/2008.

<b>ART. 5 - MODALITÀ DI PAGAMENTO E FATTURAZIONE</b>
Il pagamento del corrispettivo avverrà a mezzo bonifico bancario su conto dedicato a 30/60 giorni dalla presentazione di regolare fattura, previa verifica congiunta della conformità delle opere e del DURC online regolare.

<b>ART. 6 - ALLEGATI CONTRATTUALI</b>
Costituiscono parte integrante del presente contratto:
{{ALLEGATI}}

<b>ART. 7 - FORO COMPETENTE</b>
Per qualunque controversia dovesse insorgere tra le parti, sarà competente in via esclusiva il Foro di <b>{{FORO_COMPETENTE}}</b>.

Letto, approvato e sottoscritto in duplice originale.

L'APPALTATRICE PRINCIPALE: _________________________

IL SUBAPPALTATORE ({{SUBAPPALTO_AZIENDA}}): _________________________`;

export const DEFAULT_LETTERA_INCARICO = `<center><b>LETTERA DI CONFERMA D'ORDINE E INCARICO LAVORI</b></center>
<center>Cantiere: <b>{{NOME_CANTIERE}}</b> - {{INDIRIZZO_CANTIERE}}</center>

Data: <b>{{DATA_OGGI}}</b>
Spett.le: <b>{{CLIENTE}}</b> (Codice Fiscale: <b>{{CODICEFISCALE}}</b>)

Con la presente confermiamo l'affidamento dell'incarico esecutivo per le opere edili da realizzarsi presso l'immobile sito in <b>{{INDIRIZZO_CANTIERE}}</b>.

<b>SINTESI DEI DATI CONTRATTUALI:</b>
- Oggetto: Realizzazione opere edili cantiere "<b>{{NOME_CANTIERE}}</b>"
- Impresa Esecutrice: <b>{{NOME_IMPRESA}}</b> - P.IVA: {{PIVA_IMPRESA}}
- Importo Lavori Concordato: <b>€ {{IMPORTO_TOTALE}} + IVA</b> (in lettere: <i>Euro {{IMPORTO_LETTERE}}</i>)
- Oneri della Sicurezza non soggetti a ribasso: <b>€ {{ONERI_SICUREZZA}}</b>
- Data Inizio Lavori: <b>{{DATA_INIZIO}}</b>
- Data Consegna Prevista: <b>{{DATA_CONSEGNA}}</b> (durata stimata: {{DURATA_GIORNI}} gg.)
- Direttore dei Lavori: <b>{{DIRETTORE_LAVORI}}</b>
- Condizioni di Pagamento: {{MODALITA_PAGAMENTO}}
- Documenti e Allegati di Riferimento:
{{ALLEGATI}}

Tutti i lavoratori impiegati dall'impresa saranno in regola con gli adempimenti retributivi, previdenziali e assicurativi (DURC) e provvisti di tesserino di riconoscimento ai sensi del D.Lgs. 81/08.

Per accettazione integrale della presente conferma d'ordine:

IL COMMITTENTE: ___________________________

L'IMPRESA ESECUTRICE: ___________________________`;

export const DEFAULT_MODELLI_CONTRATTO: ModelloContratto[] = [
  {
    id: 'mod-appalto-standard',
    titolo: 'Contratto di Appalto Lavori Edili (Standard)',
    descrizione: 'Scrittura privata ai sensi degli artt. 1655 e segg. c.c. e D.Lgs. 81/2008 per committenti privati.',
    categoria: 'appalto',
    isPredefinito: true,
    contenuto: DEFAULT_CONTRATTO_APPALTO,
    dataCreazione: '2025-01-01',
    dataModifica: '2025-01-01',
  },
  {
    id: 'mod-subappalto-specialistico',
    titolo: 'Contratto di Subappalto per Opere Specialistiche',
    descrizione: 'Contratto ex art. 1656 c.c. e art. 26 D.Lgs. 81/08 autocompilato per la ditta subappaltatrice selezionata.',
    categoria: 'subappalto',
    isPredefinito: true,
    contenuto: DEFAULT_CONTRATTO_SUBAPPALTO,
    dataCreazione: '2025-01-01',
    dataModifica: '2025-01-01',
  },
  {
    id: 'mod-lettera-incarico',
    titolo: 'Lettera di Conferma Incarico / Ordine Lavori',
    descrizione: 'Modulo sintetico di conferma ordine e presa in carico cantiere per clienti e committenza.',
    categoria: 'incarico',
    isPredefinito: true,
    contenuto: DEFAULT_LETTERA_INCARICO,
    dataCreazione: '2025-01-01',
    dataModifica: '2025-01-01',
  },
];
