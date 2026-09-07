/**
 * Converte un numero in lettere in lingua italiana (standard per contratti d'appalto e atti notarili)
 * Es: 150000 -> "centocinquantamila/00"
 */

const UNITA = ['', 'uno', 'due', 'tre', 'quattro', 'cinque', 'sei', 'sette', 'otto', 'nove'];
const DA_10_A_19 = ['dieci', 'undici', 'dodici', 'tredici', 'quattordici', 'quindici', 'sedici', 'diciassette', 'diciotto', 'diciannove'];
const DECINE = ['', 'dieci', 'venti', 'trenta', 'quaranta', 'cinquanta', 'sessanta', 'settanta', 'ottanta', 'novanta'];

function convertiMinoreDi1000(n: number): string {
  let res = '';

  if (n >= 100) {
    const centinaia = Math.floor(n / 100);
    res += centinaia === 1 ? 'cento' : UNITA[centinaia] + 'cento';
    n %= 100;
  }

  if (n >= 20) {
    const decina = Math.floor(n / 10);
    const unita = n % 10;
    let nomeDecina = DECINE[decina];
    // Se l'unità è 'uno' o 'otto', si elide la vocale finale della decina (es. quarantuno, quarantotto)
    if (unita === 1 || unita === 8) {
      nomeDecina = nomeDecina.slice(0, -1);
    }
    res += nomeDecina;
    if (unita === 3) {
      res += 'tré'; // accento fonetico su ventitré
    } else {
      res += UNITA[unita];
    }
  } else if (n >= 10) {
    res += DA_10_A_19[n - 10];
  } else if (n > 0) {
    res += UNITA[n];
  }

  return res;
}

export function numeroInLettereItaliano(importo: number): string {
  if (isNaN(importo) || importo === 0) return 'zero/00';

  const isNegativo = importo < 0;
  const abs = Math.abs(importo);
  let intero = Math.floor(abs);
  const centesimi = Math.round((abs - intero) * 100);

  if (intero === 0) {
    return `zero/${centesimi.toString().padStart(2, '0')}`;
  }

  let res = '';

  // Milioni
  if (intero >= 1000000) {
    const milioni = Math.floor(intero / 1000000);
    if (milioni === 1) {
      res += 'unmilione';
    } else {
      res += convertiMinoreDi1000(milioni) + 'milioni';
    }
    intero %= 1000000;
  }

  // Mila
  if (intero >= 1000) {
    const mila = Math.floor(intero / 1000);
    if (mila === 1) {
      res += 'mille';
    } else {
      res += convertiMinoreDi1000(mila) + 'mila';
    }
    intero %= 1000;
  }

  // Centinaia, decine e unità
  if (intero > 0) {
    res += convertiMinoreDi1000(intero);
  }

  if (isNegativo) res = 'meno ' + res;

  const centStr = centesimi.toString().padStart(2, '0');
  return `${res}/${centStr}`;
}
