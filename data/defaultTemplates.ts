export interface ContractVariableDef {
  key: string;
  tag: string;
  label: string;
  description: string;
  source: 'cantiere' | 'settings' | 'calcolato';
}

export const CONTRACT_VARIABLES: ContractVariableDef[] = [
  { key: 'NOME_CANTIERE', tag: '{{NOME_CANTIERE}}', label: 'Nome Cantiere', description: 'Denominazione del cantiere', source: 'cantiere' },
  { key: 'CLIENTE', tag: '{{CLIENTE}}', label: 'Committente / Cliente', description: 'Nome o ragione sociale del committente', source: 'cantiere' },
  { key: 'INDIRIZZO_CANTIERE', tag: '{{INDIRIZZO_CANTIERE}}', label: 'Indirizzo Cantiere', description: 'Ubicazione esatta dei lavori', source: 'cantiere' },
  { key: 'IMPORTO_TOTALE', tag: '{{IMPORTO_TOTALE}}', label: 'Importo Lavori (€)', description: 'Importo contrattuale complessivo in cifre', source: 'cantiere' },
  { key: 'IMPORTO_LETTERE', tag: '{{IMPORTO_LETTERE}}', label: 'Importo in Lettere', description: 'Importo scritto per esteso in lettere', source: 'calcolato' },
  { key: 'ONERI_SICUREZZA', tag: '{{ONERI_SICUREZZA}}', label: 'Oneri Sicurezza (€)', description: 'Costi della sicurezza non soggetti a ribasso', source: 'cantiere' },
  { key: 'DATA_INIZIO', tag: '{{DATA_INIZIO}}', label: 'Data Inizio Lavori', description: 'Data inizio presunta o effettiva', source: 'cantiere' },
  { key: 'DATA_CONSEGNA', tag: '{{DATA_CONSEGNA}}', label: 'Data Consegna / Fine', description: 'Data ultimazione e consegna', source: 'cantiere' },
  { key: 'DURATA_GIORNI', tag: '{{DURATA_GIORNI}}', label: 'Durata Lavori (Giorni)', description: 'Numero di giorni naturali e consecutivi', source: 'calcolato' },
  { key: 'DIRETTORE_LAVORI', tag: '{{DIRETTORE_LAVORI}}', label: 'Direttore dei Lavori', description: 'Tecnico incaricato della D.L.', source: 'cantiere' },
  { key: 'COORDINATORE_SICUREZZA', tag: '{{COORDINATORE_SICUREZZA}}', label: 'Coordinatore Sicurezza (CSE)', description: 'Tecnico coordinatore sicurezza', source: 'cantiere' },
  { key: 'NOME_IMPRESA', tag: '{{NOME_IMPRESA}}', label: 'Ragione Sociale Impresa', description: 'Nome della propria impresa', source: 'settings' },
  { key: 'PIVA_IMPRESA', tag: '{{PIVA_IMPRESA}}', label: 'P.IVA / CF Impresa', description: 'Partita IVA dell\'impresa appaltatrice', source: 'settings' },
  { key: 'SEDE_IMPRESA', tag: '{{SEDE_IMPRESA}}', label: 'Sede Legale Impresa', description: 'Indirizzo della sede legale', source: 'settings' },
  { key: 'PEC_IMPRESA', tag: '{{PEC_IMPRESA}}', label: 'PEC / Mail Impresa', description: 'Indirizzo PEC o email aziendale', source: 'settings' },
  { key: 'LEGALE_RAPPRESENTANTE', tag: '{{LEGALE_RAPPRESENTANTE}}', label: 'Legale Rappresentante', description: 'Nome del titolare o amministratore', source: 'settings' },
  { key: 'MODALITA_PAGAMENTO', tag: '{{MODALITA_PAGAMENTO}}', label: 'Modalità di Pagamento', description: 'Termini di liquidazione (acconti, SAL, saldo)', source: 'cantiere' },
  { key: 'ELENCO_SAL', tag: '{{ELENCO_SAL}}', label: 'Riepilogo SAL', description: 'Elenco degli stati avanzamento lavori registrati', source: 'cantiere' },
  { key: 'ELENCO_SUBAPPALTI', tag: '{{ELENCO_SUBAPPALTI}}', label: 'Ditte Subappaltatrici', description: 'Elenco ditte in subappalto o fornitura e posa', source: 'cantiere' },
  { key: 'FORO_COMPETENTE', tag: '{{FORO_COMPETENTE}}', label: 'Foro Competente', description: 'Tribunale competente per eventuali controversie', source: 'calcolato' },
  { key: 'CIG_CUP', tag: '{{CIG_CUP}}', label: 'Codici CIG / CUP', description: 'Identificativi gara o opera pubblica', source: 'cantiere' },
  { key: 'DATA_OGGI', tag: '{{DATA_OGGI}}', label: 'Data di Stipula', description: 'Data odierna di stipula del contratto', source: 'calcolato' },
  { key: 'NOTE_CANTIERE', tag: '{{NOTE_CANTIERE}}', label: 'Note e Clausole Particolari', description: 'Note specifiche o pattuizioni accessorie', source: 'cantiere' },
];

export const DEFAULT_CONTRATTO_APPALTO = `CONTRATTO DI APPALTO PER L'ESECUZIONE DI OPERE EDILI
(Ai sensi degli artt. 1655 e segg. del Codice Civile e del D.Lgs. 81/2008 s.m.i.)

L'anno {{DATA_OGGI}}, in {{SEDE_IMPRESA}}, con la presente scrittura privata avente a tutti gli effetti valore di legge tra le parti:

TRA

Il Sig./La Società: {{CLIENTE}}
Residente/Con sede in: [Indirizzo Committente]
Codice Fiscale / P.IVA: [C.F. / P.IVA Committente]
(di seguito denominato per brevità "COMMITTENTE")

E

L'Impresa: {{NOME_IMPRESA}}
Con sede legale in: {{SEDE_IMPRESA}}
Codice Fiscale / Partita IVA: {{PIVA_IMPRESA}}
PEC: {{PEC_IMPRESA}}
Rappresentata legalmente dal Sig.: {{LEGALE_RAPPRESENTANTE}}
Iscritta regolarmente alla C.C.I.A.A. e provvista di DURC regolare
(di seguito denominata per brevità "APPALTATORE")

PREMESSO CHE
- Il Committente dichiara di avere la piena disponibilità e titolarità dell'immobile/area sito in {{INDIRIZZO_CANTIERE}};
- È intendimento del Committente far eseguire sull'immobile suddetto i lavori edili relativi a: "{{NOME_CANTIERE}}";
- L'Appaltatore dichiara di possedere l'idoneità tecnico-professionale, l'organizzazione, i mezzi d'opera, le attrezzature e le maestranze qualificate necessarie per la perfetta esecuzione a regola d'arte delle opere appaltate.

SI CONVIENE E SI STIPULA QUANTO SEGUE:

ART. 1 - OGGETTO DELL'APPALTO
Il Committente affida all'Appaltatore, che accetta senza riserve, l'esecuzione di tutte le opere edili, impiantistiche e finiture necessarie per la realizzazione dell'intervento denominato "{{NOME_CANTIERE}}", conformemente alle tavole progettuali, al computo metrico e alle prescrizioni fornite dalla Direzione Lavori.

ART. 2 - LUOGO DI ESECUZIONE DEI LAVORI
I lavori oggetto del presente contratto dovranno essere eseguiti presso il cantiere ubicato in:
{{INDIRIZZO_CANTIERE}}.

ART. 3 - CORRISPETTIVO DELL'APPALTO E ONERI DELLA SICUREZZA
1. Il corrispettivo complessivo concordato a corpo/misura per l'esecuzione a regola d'arte di tutte le opere ammonta a:
   € {{IMPORTO_TOTALE}} (dicesi Euro {{IMPORTO_LETTERE}}), oltre ad IVA di legge nei termini e nelle aliquote vigenti.
2. Di detto importo, la somma di € {{ONERI_SICUREZZA}} è specificamente destinata ai costi della sicurezza non soggetti ad alcun ribasso d'asta o sconto, ai sensi del D.Lgs. 81/2008.
3. Eventuali lavori imprevisti, modifiche o varianti dovranno essere preventivamente concordati per iscritto e sottoscritti con apposito verbale aggiuntivo di variante.

ART. 4 - TERMINI DI ESECUZIONE E CRONOPROGRAMMA
1. I lavori avranno inizio in data: {{DATA_INIZIO}}.
2. Il tempo utile per ultimare tutti i lavori e procedere alla consegna dell'opera ultimata è fissato in {{DURATA_GIORNI}} giorni naturali e consecutivi, con ultimazione inderogabile entro il: {{DATA_CONSEGNA}}.
3. In caso di ritardo imputabile all'Appaltatore non dovuto a cause di forza maggiore debitamente verbalizzate, sarà applicata una penale giornaliera pari allo 0,5 per mille dell'importo contrattuale.

ART. 5 - MODALITÀ DI PAGAMENTO E STATI AVANZAMENTO LAVORI (SAL)
1. I pagamenti saranno effettuati dal Committente mediante bonifico bancario su conto dedicato (nel rispetto della L. 136/2010 se applicabile).
2. Piano di liquidazione concordato:
   {{MODALITA_PAGAMENTO}}
3. Riepilogo SAL previsti/registrati:
   {{ELENCO_SAL}}
4. Il saldo finale sarà corrisposto entro 30 giorni dall'avvenuta ultimazione dei lavori e dalla verifica congiunta di collaudo. Ogni pagamento è subordinato alla verifica della regolarità contributiva dell'Appaltatore (DURC regolare in corso di validità).

ART. 6 - DIREZIONE DEI LAVORI E COORDINAMENTO DELLA SICUREZZA
La Direzione dei Lavori è affidata a: {{DIRETTORE_LAVORI}}.
Il Coordinatore per la Sicurezza in fase di esecuzione (CSE) è: {{COORDINATORE_SICUREZZA}}.
L'Appaltatore si obbliga a consentire il libero accesso al cantiere al personale incaricato dal Committente e ad ottemperare a tutte le prescrizioni fornite.

ART. 7 - SICUREZZA SUL LAVORO E DISCIPLINA DEL PERSONALE
1. L'Appaltatore si impegna a rispettare e far rispettare scrupolosamente tutte le disposizioni in materia di tutela della salute e sicurezza nei luoghi di lavoro (D.Lgs. 81/2008 e s.m.i.).
2. Prima dell'inizio dei lavori, l'Appaltatore trasmette al Committente il Piano Operativo di Sicurezza (POS) e la dichiarazione di organico medio annuo.
3. Tutto il personale impiegato in cantiere dovrà essere regolarmente assunto, dotato dei prescritti Dispositivi di Protezione Individuale (DPI) e munito di apposito tesserino di riconoscimento corredato di fotografia e data di assunzione, ai sensi dell'art. 26, comma 8 del D.Lgs. 81/2008.

ART. 8 - SUBAPPALTI E FORNITURE CON POSA
1. È fatto espresso divieto all'Appaltatore di cedere totalmente il contratto. Eventuali subappalti per lavorazioni specialistiche ({{ELENCO_SUBAPPALTI}}) devono essere preventivamente comunicati e autorizzati per iscritto dal Committente, previa esibizione dei requisiti di idoneità tecnico-professionale e del DURC della ditta subappaltatrice.
2. L'Appaltatore risponde solidalmente dell'operato dei propri subappaltatori e fornitori.

ART. 9 - GARANZIE E RESPONSABILITÀ
L'Appaltatore garantisce l'opera eseguita ai sensi degli artt. 1667, 1668 e 1669 del Codice Civile per difformità, vizi ed eventuali gravi difetti di costruzione. L'Appaltatore dichiara di essere coperto da polizza assicurativa R.C.T./R.C.O. per danni a persone o cose provocati durante l'esecuzione dei lavori.

ART. 10 - NOTE E PATTUIZIONI ACCESSORIE
{{NOTE_CANTIERE}}

ART. 11 - FORO COMPETENTE
Per ogni eventuale controversia derivante dall'interpretazione, validità, esecuzione o risoluzione del presente contratto, le parti convengono la competenza esclusiva del Foro di: {{FORO_COMPETENTE}}.

Letto, approvato e sottoscritto in duplice originale.

IL COMMITTENTE: ___________________________

L'APPALTATORE: ___________________________`;

export const DEFAULT_CONTRATTO_SUBAPPALTO = `CONTRATTO DI SUBAPPALTO PER OPERE SPECIALISTICHE EDILI
(Ai sensi dell'art. 1656 Codice Civile e art. 26 D.Lgs. 81/2008)

L'anno {{DATA_OGGI}}, tra:

L'IMPRESA APPALTATRICE:
{{NOME_IMPRESA}}, con sede in {{SEDE_IMPRESA}}, P.IVA {{PIVA_IMPRESA}}, rappresentata dal Sig. {{LEGALE_RAPPRESENTANTE}}
(di seguito "APPALTATRICE PRINCIPALE")

E

L'IMPRESA SUBAPPALTATRICE:
[Denominazione Subappaltatore], con sede in [Sede], P.IVA [P.IVA], rappresentata da [Rappresentante]
(di seguito "SUBAPPALTATORE")

PREMESSO CHE
- L'Appaltatrice Principale è titolare del contratto di appalto per i lavori nel cantiere denominato "{{NOME_CANTIERE}}", ubicato in {{INDIRIZZO_CANTIERE}} per conto del Committente {{CLIENTE}};
- L'Appaltatrice intende affidare al Subappaltatore l'esecuzione delle seguenti lavorazioni specialistiche: {{ELENCO_SUBAPPALTI}};
- Il Subappaltatore è in possesso di documentata idoneità tecnico-professionale e DURC regolare.

SI CONVIENE E SI STIPULA:

1. OGGETTO E LUOGO: Esecuzione delle opere specialistiche presso il cantiere: {{INDIRIZZO_CANTIERE}}.
2. CORRISPETTIVO: Il corrispettivo forfettario o a misura è concordato in € [Importo Subappalto], oltre IVA, di cui € [Oneri Sicurezza Subappalto] per oneri di sicurezza non soggetti a ribasso.
3. TEMPI E CRONOPROGRAMMA: I lavori del Subappaltatore avranno inizio il {{DATA_INIZIO}} e dovranno terminare entro il {{DATA_CONSEGNA}}, coordinandosi con il Capocantiere dell'Appaltatrice.
4. SICUREZZA: Il Subappaltatore trasmette il proprio POS specifico prima dell'ingresso in cantiere e assicura che il proprio personale esibisca il tesserino D.Lgs. 81/08.
5. PAGAMENTO: Tramite bonifico a 30/60 giorni dalla presentazione di fattura vistata dall'Appaltatrice previa verifica del DURC online regolare.
6. FORO COMPETENTE: Foro di {{FORO_COMPETENTE}}.

L'APPALTATRICE PRINCIPALE: _________________________

IL SUBAPPALTATORE: _________________________`;

export const DEFAULT_LETTERA_INCARICO = `LETTERA DI CONFERMA D'ORDINE E INCARICO LAVORI
Cantiere: {{NOME_CANTIERE}} - {{INDIRIZZO_CANTIERE}}

Data: {{DATA_OGGI}}
Spett.le: {{CLIENTE}}

Con la presente confermiamo l'affidamento dell'incarico esecutivo per le opere edili da realizzarsi presso l'immobile sito in {{INDIRIZZO_CANTIERE}}.

SINTESI DEI DATI CONTRATTUALI:
- Oggetto: Realizzazione opere edili cantiere "{{NOME_CANTIERE}}"
- Impresa Esecutrice: {{NOME_IMPRESA}} - P.IVA: {{PIVA_IMPRESA}}
- Importo Lavori Concordato: € {{IMPORTO_TOTALE}} + IVA (in lettere: Euro {{IMPORTO_LETTERE}})
- Oneri della Sicurezza non soggetti a ribasso: € {{ONERI_SICUREZZA}}
- Data Inizio Lavori: {{DATA_INIZIO}}
- Data Consegna Prevista: {{DATA_CONSEGNA}} (durata stimata: {{DURATA_GIORNI}} gg.)
- Direttore dei Lavori: {{DIRETTORE_LAVORI}}
- Condizioni di Pagamento: {{MODALITA_PAGAMENTO}}

Tutti i lavoratori impiegati dall'impresa saranno in regola con gli adempimenti retributivi, previdenziali e assicurativi (DURC) e provvisti di tesserino di riconoscimento ai sensi del D.Lgs. 81/08.

Per accettazione integrale della presente conferma d'ordine:

IL COMMITTENTE: ___________________________

L'IMPRESA ESECUTRICE: ___________________________`;
