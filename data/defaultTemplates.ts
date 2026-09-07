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
  { key: 'CODICEFISCALE', tag: '{{CODICEFISCALE}}', label: 'Codice Fiscale Committente', description: 'C.F. o Partita IVA del committente', source: 'cantiere' },
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
  { key: 'ALLEGATI', tag: '{{ALLEGATI}}', label: 'Elenco Allegati Contrattuali', description: 'Elenco documenti allegati (computo, POS, polizza...)', source: 'cantiere' },
  { key: 'FORO_COMPETENTE', tag: '{{FORO_COMPETENTE}}', label: 'Foro Competente', description: 'Tribunale competente per eventuali controversie', source: 'calcolato' },
  { key: 'CIG_CUP', tag: '{{CIG_CUP}}', label: 'Codici CIG / CUP', description: 'Identificativi gara o opera pubblica', source: 'cantiere' },
  { key: 'DATA_OGGI', tag: '{{DATA_OGGI}}', label: 'Data di Stipula', description: 'Data odierna di stipula del contratto', source: 'calcolato' },
  { key: 'NOTE_CANTIERE', tag: '{{NOTE_CANTIERE}}', label: 'Note e Clausole Particolari', description: 'Note specifiche o pattuizioni accessorie', source: 'cantiere' },
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
<center><u>(Ai sensi dell'art. 1656 Codice Civile e art. 26 D.Lgs. 81/2008)</u></center>

L'anno <b>{{DATA_OGGI}}</b>, tra:

<b>L'IMPRESA APPALTATRICE:</b>
<b>{{NOME_IMPRESA}}</b>, con sede in {{SEDE_IMPRESA}}, P.IVA {{PIVA_IMPRESA}}, rappresentata dal Sig. <b>{{LEGALE_RAPPRESENTANTE}}</b>
(di seguito "APPALTATRICE PRINCIPALE")

<b>E</b>

<b>L'IMPRESA SUBAPPALTATRICE:</b>
[Denominazione Subappaltatore], con sede in [Sede], P.IVA [P.IVA], C.F. [C.F.], rappresentata da [Rappresentante]
(di seguito "SUBAPPALTATORE")

<b>PREMESSO CHE</b>
- L'Appaltatrice Principale è titolare del contratto di appalto per i lavori nel cantiere denominato "<b>{{NOME_CANTIERE}}</b>", ubicato in {{INDIRIZZO_CANTIERE}} per conto del Committente <b>{{CLIENTE}}</b> (C.F.: <b>{{CODICEFISCALE}}</b>);
- L'Appaltatrice intende affidare al Subappaltatore l'esecuzione delle seguenti lavorazioni specialistiche: <b>{{ELENCO_SUBAPPALTI}}</b>;
- Il Subappaltatore è in possesso di documentata idoneità tecnico-professionale e DURC regolare.

<b>SI CONVIENE E SI STIPULA:</b>

<b>1. OGGETTO E LUOGO:</b> Esecuzione delle opere specialistiche presso il cantiere: <b>{{INDIRIZZO_CANTIERE}}</b>.
<b>2. CORRISPETTIVO:</b> Il corrispettivo forfettario o a misura è concordato in € [Importo Subappalto], oltre IVA, di cui € [Oneri Sicurezza Subappalto] per oneri di sicurezza non soggetti a ribasso.
<b>3. TEMPI E CRONOPROGRAMMA:</b> I lavori del Subappaltatore avranno inizio il <b>{{DATA_INIZIO}}</b> e dovranno terminare entro il <b>{{DATA_CONSEGNA}}</b>, coordinandosi con il Capocantiere dell'Appaltatrice.
<b>4. SICUREZZA:</b> Il Subappaltatore trasmette il proprio POS specifico prima dell'ingresso in cantiere e assicura che il proprio personale esibisca il tesserino D.Lgs. 81/08.
<b>5. PAGAMENTO:</b> Tramite bonifico a 30/60 giorni dalla presentazione di fattura vistata dall'Appaltatrice previa verifica del DURC online regolare.
<b>6. ALLEGATI CONTRATTUALI:</b>
{{ALLEGATI}}
<b>7. FORO COMPETENTE:</b> Foro di <b>{{FORO_COMPETENTE}}</b>.

L'APPALTATRICE PRINCIPALE: _________________________

IL SUBAPPALTATORE: _________________________`;

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
