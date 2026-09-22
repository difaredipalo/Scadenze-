import React, { useState } from 'react';
import { PosRischio } from '../../types';

// =================================================================
// 1. DATABASE ICONE E PITTOGRAMMI DPI (CONFORMI ISO 7010 & D.LGS. 81/08)
// =================================================================

export interface DpiVisualMeta {
  id: string;
  nome: string;
  norma: string;
  categoria: 'Capo' | 'Piedi' | 'Mani' | 'Occhi e Viso' | 'Vie Respiratorie' | 'Udito' | 'Anticaduta' | 'Corpo' | 'Speciale';
  descrizione: string;
  simboloSvg: string; // SVG path or SVG elements
  coloreFondo?: string;
}

export const DPI_VISUAL_REGISTRY: Record<string, DpiVisualMeta> = {
  elmetto: {
    id: 'elmetto',
    nome: 'Casco di protezione / Elmetto',
    norma: 'UNI EN 397',
    categoria: 'Capo',
    descrizione: 'Protezione del capo contro urti e caduta di oggetti dall’alto.',
    simboloSvg: 'M12 4a8 8 0 0 0-8 8v2a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-2a8 8 0 0 0-8-8zm-5 8a5 5 0 0 1 10 0H7zm2 5h6v1a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1v-1z',
  },
  scarpe: {
    id: 'scarpe',
    nome: 'Calzature di sicurezza S3',
    norma: 'UNI EN ISO 20345 (S3)',
    categoria: 'Piedi',
    descrizione: 'Puntale anti-schiacciamento 200J, lamina antiperforazione e suola antiscivolo SRC.',
    simboloSvg: 'M4 14l2-8h4l1 3h4l2 5h3a1 1 0 0 1 1 1v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2a1 1 0 0 1 1-1zm3-6l-1.5 6h11l-1.5-4h-3l-.8-2H7z',
  },
  guanti_meccanici: {
    id: 'guanti_meccanici',
    nome: 'Guanti rischio meccanico',
    norma: 'UNI EN 388',
    categoria: 'Mani',
    descrizione: 'Protezione delle mani da abrasione, taglio, strappo e perforazione.',
    simboloSvg: 'M8 3a1 1 0 0 1 2 0v7h1V4a1 1 0 0 1 2 0v6h1V5a1 1 0 0 1 2 0v6h1V8a1 1 0 0 1 2 0v8a5 5 0 0 1-5 5H11a5 5 0 0 1-5-5V11a2 2 0 0 1 2-2v-6z',
  },
  guanti_chimici: {
    id: 'guanti_chimici',
    nome: 'Guanti rischio chimico',
    norma: 'UNI EN ISO 374',
    categoria: 'Mani',
    descrizione: 'Guanti a tenuta stagna in nitrile/neoprene per contatto con sostanze aggressive e cemento.',
    simboloSvg: 'M8 2a1.5 1.5 0 0 1 3 0v6h1V3a1.5 1.5 0 0 1 3 0v5h1V4a1.5 1.5 0 0 1 3 0v10a6 6 0 0 1-6 6h-2a6 6 0 0 1-6-6V9a2 2 0 0 1 2-2V2zm-1 16h8v2H7v-2z',
  },
  occhiali: {
    id: 'occhiali',
    nome: 'Occhiali di protezione',
    norma: 'UNI EN 166',
    categoria: 'Occhi e Viso',
    descrizione: 'Lenti resistenti agli impatti e ripari laterali contro schegge e proiezioni.',
    simboloSvg: 'M3 10a4 4 0 0 1 7.8 0h2.4a4 4 0 0 1 7.8 0 4 4 0 0 1-7.8 0h-2.4a4 4 0 0 1-7.8 0zm4 2a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm10 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4z',
  },
  visiera: {
    id: 'visiera',
    nome: 'Visiera policarbonato / paraschizzi',
    norma: 'UNI EN 166 (1B)',
    categoria: 'Occhi e Viso',
    descrizione: 'Schermo integrale per il volto contro polveri ad alta velocità, frammenti e schizzi.',
    simboloSvg: 'M12 2a9 9 0 0 0-9 9v2a9 9 0 0 0 18 0v-2a9 9 0 0 0-9-9zm-7 9a7 7 0 0 1 14 0v1a7 7 0 0 1-14 0v-1zm4 1h6v4H9v-4z',
  },
  cuffie: {
    id: 'cuffie',
    nome: 'Otoprotettori (Cuffie / Inserti)',
    norma: 'UNI EN 352',
    categoria: 'Udito',
    descrizione: 'Attenuazione del rumore per esposizioni quotidiane superiori a 80 dB(A).',
    simboloSvg: 'M12 3a8 8 0 0 0-8 8v4a3 3 0 0 0 3 3h1a1 1 0 0 0 1-1v-6a1 1 0 0 0-1-1H6a6 6 0 1 1 12 0h-2a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h1a3 3 0 0 0 3-3v-4a8 8 0 0 0-8-8z',
  },
  mascherina_ffp2: {
    id: 'mascherina_ffp2',
    nome: 'Respiratore FFP2 antipolvere',
    norma: 'UNI EN 149 (FFP2)',
    categoria: 'Vie Respiratorie',
    descrizione: 'Semimaschera filtrante per polveri sottili inerti, legno e malte.',
    simboloSvg: 'M12 4l8 4v4c0 5.25-3.5 10-8 12-4.5-2-8-6.75-8-12V8l8-4zm0 3.2L6 10.2v1.8c0 3.8 2.5 7.4 6 9 3.5-1.6 6-5.2 6-9v-1.8L12 7.2zM9 12h6v2H9v-2z',
  },
  mascherina_ffp3: {
    id: 'mascherina_ffp3',
    nome: 'Respiratore FFP3 ad alta efficienza',
    norma: 'UNI EN 149 (FFP3)',
    categoria: 'Vie Respiratorie',
    descrizione: 'Massima efficienza filtrante contro polveri tossiche, fibre nocive e silice.',
    simboloSvg: 'M12 3l9 4.5v5c0 6-4 11-9 13.5-5-2.5-9-7.5-9-13.5v-5L12 3zm0 3.5L5.5 10v2.5c0 4.6 3 8.6 6.5 10.6 3.5-2 6.5-6 6.5-10.6V10L12 6.5zm-3 5h6v3H9v-3z',
  },
  imbracatura: {
    id: 'imbracatura',
    nome: 'Imbracatura completa anticaduta',
    norma: 'UNI EN 361 + EN 355',
    categoria: 'Anticaduta',
    descrizione: 'Dotata di attacchi sternale e dorsale, con cordino e assorbitore di energia cinetica.',
    simboloSvg: 'M8 3h8l1 6h-2l-1-4h-4l-1 4H7l1-6zm-1 7h10l-1 5h-8l-1-5zm-1 6h12l1 5H5l1-5zm4-13h2v18h-2V3z',
  },
  gilet_alta_visibilita: {
    id: 'gilet_alta_visibilita',
    nome: 'Gilet alta visibilità',
    norma: 'UNI EN ISO 20471',
    categoria: 'Corpo',
    descrizione: 'Indumento fluorescente con bande rifrangenti per visibilità diurna e notturna.',
    simboloSvg: 'M7 3l4 3 2-3 2 3 4-3 2 4-2 14H5L3 7l4-4zm1.5 5.5l-1 1.5 1.5 10h6l1.5-10-1-1.5L12 11l-3.5-2.5z',
  },
  tuta_protettiva: {
    id: 'tuta_protettiva',
    nome: 'Tuta protettiva monouso tipo 5/6',
    norma: 'UNI EN 13982 / EN 13034',
    categoria: 'Corpo',
    descrizione: 'Protezione integrale del corpo da polveri chimiche, fibre e schizzi liquidi.',
    simboloSvg: 'M9 2h6v2h2l3 5-2 2-2-1v12h-3v-6h-2v6H8V10l-2 1-2-2 3-5h2V2zm1 4v4h4V6h-4z',
  },
};

/**
 * Recupera i metadati visivi e la norma del DPI a partire da qualunque stringa
 */
export function getDpiVisualMeta(nameOrId: string): DpiVisualMeta {
  const clean = (nameOrId || '').toLowerCase().trim();

  // 1. Ricerca diretta per chiave ID
  if (DPI_VISUAL_REGISTRY[clean]) {
    return DPI_VISUAL_REGISTRY[clean];
  }

  // 2. Ricerca semantica per parole chiave
  if (clean.includes('elmetto') || clean.includes('casco') || clean.includes('capo')) {
    return DPI_VISUAL_REGISTRY.elmetto;
  }
  if (clean.includes('calzatur') || clean.includes('scarp') || clean.includes('s3') || clean.includes('suola')) {
    return DPI_VISUAL_REGISTRY.scarpe;
  }
  if (clean.includes('chimic') && (clean.includes('guant') || clean.includes('mani'))) {
    return DPI_VISUAL_REGISTRY.guanti_chimici;
  }
  if (clean.includes('guant') || clean.includes('meccanic') || clean.includes('mani')) {
    return DPI_VISUAL_REGISTRY.guanti_meccanici;
  }
  if (clean.includes('visiera') || clean.includes('facciale') || clean.includes('paraschizzi')) {
    return DPI_VISUAL_REGISTRY.visiera;
  }
  if (clean.includes('occhial') || clean.includes('mascherina a tenuta') || clean.includes('occhi')) {
    return DPI_VISUAL_REGISTRY.occhiali;
  }
  if (clean.includes('cuffi') || clean.includes('udito') || clean.includes('inserti') || clean.includes('otoprotett')) {
    return DPI_VISUAL_REGISTRY.cuffie;
  }
  if (clean.includes('ffp3') || clean.includes('alta efficienza')) {
    return DPI_VISUAL_REGISTRY.mascherina_ffp3;
  }
  if (clean.includes('ffp2') || clean.includes('mascherina') || clean.includes('respirator') || clean.includes('polver')) {
    return DPI_VISUAL_REGISTRY.mascherina_ffp2;
  }
  if (clean.includes('imbracatur') || clean.includes('anticaduta') || clean.includes('cordino') || clean.includes('linea vita')) {
    return DPI_VISUAL_REGISTRY.imbracatura;
  }
  if (clean.includes('gilet') || clean.includes('visibilit') || clean.includes('catarifrangente')) {
    return DPI_VISUAL_REGISTRY.gilet_alta_visibilita;
  }
  if (clean.includes('tuta') || clean.includes('monouso') || clean.includes('corpo')) {
    return DPI_VISUAL_REGISTRY.tuta_protettiva;
  }

  // Fallback generico
  return {
    id: 'dpi_generico',
    nome: nameOrId,
    norma: 'UNI EN D.Lgs. 81/08 All. VIII',
    categoria: 'Speciale',
    descrizione: 'Dispositivo di Protezione Individuale prescritto per la mansione.',
    simboloSvg: 'M12 2l8 4v6c0 5.5-3.8 10.7-8 12-4.2-1.3-8-6.5-8-12V6l8-4zm0 3.2L6 8v4c0 4.2 2.8 8.3 6 9.4 3.2-1.1 6-5.2 6-9.4V8l-6-2.8zM11 7h2v6h-2V7zm0 8h2v2h-2v-2z',
  };
}

// =================================================================
// 2. COMPONENTE GRAFICO UFFICIALE: CARTELLO CIRCOLARE BLU ISO 7010 PER DPI
// =================================================================

interface DpiPictogramProps {
  name: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  customLogoUrl?: string;
  className?: string;
}

export const DpiPictogram: React.FC<DpiPictogramProps> = ({
  name,
  size = 'md',
  customLogoUrl,
  className = '',
}) => {
  const meta = getDpiVisualMeta(name);

  // Dimensioni proporzionate
  const sizeMap = {
    sm: { box: 'w-6 h-6', svg: 'w-3.5 h-3.5', font: 'text-[9px]' },
    md: { box: 'w-8 h-8', svg: 'w-5 h-5', font: 'text-xs' },
    lg: { box: 'w-11 h-11', svg: 'w-6 h-6', font: 'text-sm' },
    xl: { box: 'w-14 h-14', svg: 'w-8 h-8', font: 'text-base' },
  };
  const s = sizeMap[size] || sizeMap.md;

  if (customLogoUrl) {
    return (
      <div
        className={`${s.box} rounded-full overflow-hidden border-2 border-[#005ea6] bg-white shadow-sm flex items-center justify-center shrink-0 ${className}`}
        title={`${meta.nome} (${meta.norma})`}
      >
        <img
          src={customLogoUrl}
          alt={meta.nome}
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
      </div>
    );
  }

  return (
    <div
      className={`${s.box} rounded-full bg-[#005ea6] text-white flex items-center justify-center shrink-0 shadow-sm border-2 border-white ring-1 ring-[#005ea6]/40 print:ring-0 ${className}`}
      title={`${meta.nome} - Obbligo secondo ${meta.norma}`}
    >
      <svg
        className={`${s.svg} fill-current`}
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d={meta.simboloSvg} />
      </svg>
    </div>
  );
};

// Badge completo DPI con etichetta, norma e cartello grafico
interface PosDpiBadgeProps {
  name: string;
  customLogoUrl?: string;
  showNorma?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'light' | 'dark' | 'card';
  onRemove?: () => void;
}

export const PosDpiBadge: React.FC<PosDpiBadgeProps> = ({
  name,
  customLogoUrl,
  showNorma = true,
  size = 'md',
  variant = 'light',
  onRemove,
}) => {
  const meta = getDpiVisualMeta(name);

  if (variant === 'card') {
    return (
      <div className="flex items-start gap-2.5 p-2 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/60 text-slate-800 dark:text-slate-200 transition-all hover:border-blue-300">
        <DpiPictogram name={name} size="lg" customLogoUrl={customLogoUrl} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1">
            <span className="font-black text-xs text-slate-900 dark:text-white leading-tight truncate">
              {meta.nome}
            </span>
            {onRemove && (
              <button
                type="button"
                onClick={onRemove}
                className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 text-xs font-black p-0.5"
                title="Rimuovi DPI"
              >
                ✕
              </button>
            )}
          </div>
          <span className="block text-[9px] font-mono font-bold text-blue-700 dark:text-blue-300 mt-0.5">
            {meta.norma}
          </span>
          <span className="block text-[9px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
            {meta.descrizione}
          </span>
        </div>
      </div>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs text-slate-900 dark:text-white">
      <DpiPictogram name={name} size={size === 'sm' ? 'sm' : 'md'} customLogoUrl={customLogoUrl} />
      <span className="text-[11px] font-bold leading-tight">{meta.nome}</span>
      {showNorma && (
        <span className="text-[9px] font-mono font-semibold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-1 py-0.2 rounded">
          {meta.norma.replace('UNI EN ', 'EN ')}
        </span>
      )}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 text-xs font-bold pl-1"
          title="Rimuovi DPI"
        >
          ✕
        </button>
      )}
    </span>
  );
};

// =================================================================
// 3. PITTOGRAMMI DI PERICOLO GHS / CLP PER SOSTANZE CHIMICHE (SDS)
// =================================================================

export interface GhsHazardMeta {
  codice: string;
  nome: string;
  significato: string;
  simbolo: string;
}

export const GHS_PICTOGRAMS_REGISTRY: Record<string, GhsHazardMeta> = {
  GHS01: { codice: 'GHS01', nome: 'Esplosivo', significato: 'Sostanze che possono esplodere per riscaldamento o urto', simbolo: '💥' },
  GHS02: { codice: 'GHS02', nome: 'Infiammabile', significato: 'Gas, liquidi o solidi altamente infiammabili', simbolo: '🔥' },
  GHS03: { codice: 'GHS03', nome: 'Comburente', significato: 'Sostanze che facilitano o accelerano la combustione', simbolo: '⭕' },
  GHS04: { codice: 'GHS04', nome: 'Gas sotto pressione', significato: 'Bombole contenenti gas compressi, liquefatti o disciolti', simbolo: '🛢️' },
  GHS05: { codice: 'GHS05', nome: 'Corrosivo', significato: 'Provoca gravi ustioni cutanee e lesioni oculari, attacca i metalli', simbolo: '🧪' },
  GHS06: { codice: 'GHS06', nome: 'Tossico acuto', significato: 'Provoca avvelenamento grave anche a dosi minime', simbolo: '☠️' },
  GHS07: { codice: 'GHS07', nome: 'Nocivo / Irritante', significato: 'Irritazione cutanea/oculare, reazioni allergiche o sonnolenza', simbolo: '⚠️' },
  GHS08: { codice: 'GHS08', nome: 'Pericolo per la salute', significato: 'Effetti cronici, cancerogeni, mutageni o tossici per la riproduzione', simbolo: '👤' },
  GHS09: { codice: 'GHS09', nome: 'Pericoloso per l’ambiente', significato: 'Tossico per gli organismi acquatici con effetti di lunga durata', simbolo: '🐟' },
};

export const GHS_PICTOGRAM_CODES = Object.keys(GHS_PICTOGRAMS_REGISTRY);

export const GhsHazardDiamond: React.FC<{
  codeOrText: string;
  size?: 'sm' | 'md' | 'lg';
}> = ({ codeOrText, size = 'md' }) => {
  // Trova il codice GHS
  const found = Object.values(GHS_PICTOGRAMS_REGISTRY).find(
    g => codeOrText.includes(g.codice) || codeOrText.toLowerCase().includes(g.nome.toLowerCase())
  ) || {
    codice: 'GHS',
    nome: codeOrText,
    significato: 'Pittogramma di pericolo conforme Regolamento CLP (CE 1272/2008)',
    simbolo: '⚠️',
  };

  const dim = size === 'sm' ? 'w-6 h-6 text-xs' : size === 'lg' ? 'w-10 h-10 text-lg' : 'w-8 h-8 text-sm';

  return (
    <div
      className="inline-flex flex-col items-center group cursor-pointer"
      title={`${found.codice}: ${found.nome} - ${found.significato}`}
    >
      <div className={`relative ${dim} flex items-center justify-center`}>
        {/* Rombo bianco con bordo rosso spesso ufficiale GHS */}
        <div className="absolute inset-1 bg-white border-2 border-rose-600 rounded-sm rotate-45 shadow-xs" />
        <span className="relative z-10 select-none">{found.simbolo}</span>
      </div>
      <span className="text-[8px] font-black uppercase text-slate-600 dark:text-slate-400 mt-0.5">
        {found.codice}
      </span>
    </div>
  );
};

// =================================================================
// 4. LOGO / IMMAGINETTA DELLA SCHEDA DI SICUREZZA (SCHEDE POS)
// =================================================================

export type PosSchedaTipo = 'lavorazione' | 'attrezzatura' | 'opera' | 'sostanza';

interface PosSchedaLogoProps {
  tipo: PosSchedaTipo;
  title: string;
  categoria?: string;
  iconaEmoji?: string;
  logoUrl?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  onEditLogo?: () => void;
  className?: string;
}

export const PosSchedaLogo: React.FC<PosSchedaLogoProps> = ({
  tipo,
  title,
  categoria,
  iconaEmoji,
  logoUrl,
  size = 'lg',
  onEditLogo,
  className = '',
}) => {
  const [imgError, setImgError] = useState(false);

  // Palette e stili tematici per ciascun tipo di scheda
  const themeConfig = {
    lavorazione: {
      bg: 'from-blue-700 to-indigo-900',
      border: 'border-blue-300 dark:border-blue-700',
      accent: 'bg-blue-600 text-white',
      tag: 'SCHEDA LAVORAZIONE',
      defaultIcon: '🔨',
    },
    attrezzatura: {
      bg: 'from-amber-600 to-orange-800',
      border: 'border-amber-300 dark:border-amber-700',
      accent: 'bg-amber-600 text-white',
      tag: 'SCHEDA MEZZO / MACCHINA',
      defaultIcon: '🚜',
    },
    opera: {
      bg: 'from-cyan-700 to-teal-900',
      border: 'border-cyan-300 dark:border-cyan-700',
      accent: 'bg-cyan-600 text-white',
      tag: 'OPERA PROVVISIONALE',
      defaultIcon: '🪜',
    },
    sostanza: {
      bg: 'from-purple-700 to-slate-900',
      border: 'border-purple-300 dark:border-purple-700',
      accent: 'bg-purple-600 text-white',
      tag: 'SCHEDA SDS CHIMICA',
      defaultIcon: '🧪',
    },
  };

  const theme = themeConfig[tipo] || themeConfig.lavorazione;

  const sizeMap = {
    sm: 'w-10 h-10 text-lg rounded-xl',
    md: 'w-14 h-14 text-2xl rounded-2xl',
    lg: 'w-20 h-20 text-3xl rounded-2xl',
    xl: 'w-24 h-24 text-4xl rounded-3xl',
  };

  const boxSize = sizeMap[size] || sizeMap.lg;

  return (
    <div className={`relative group shrink-0 ${className}`}>
      {logoUrl && !imgError ? (
        <div
          className={`${boxSize} overflow-hidden border-2 ${theme.border} bg-white dark:bg-slate-800 shadow-md flex items-center justify-center`}
        >
          <img
            src={logoUrl}
            alt={title}
            onError={() => setImgError(true)}
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>
      ) : (
        <div
          className={`${boxSize} bg-gradient-to-br ${theme.bg} text-white shadow-md border-2 border-white/80 dark:border-slate-700 flex flex-col items-center justify-center select-none`}
        >
          <span className="drop-shadow-sm">{iconaEmoji || theme.defaultIcon}</span>
          {size === 'xl' && (
            <span className="text-[8px] font-black tracking-widest uppercase opacity-80 mt-1">
              ALL. XV
            </span>
          )}
        </div>
      )}

      {/* Pulsante rapido per cambiare logo in modalità interattiva */}
      {onEditLogo && (
        <button
          type="button"
          onClick={onEditLogo}
          className="absolute -bottom-1.5 -right-1.5 w-6 h-6 rounded-full bg-slate-900 text-white hover:bg-blue-600 shadow-md flex items-center justify-center text-[10px] opacity-90 hover:opacity-100 transition-all"
          title="Modifica o carica logo della scheda"
        >
          ✏️
        </button>
      )}
    </div>
  );
};

// =================================================================
// 5. MODALE/PICKER DI LOGO E IMMAGINE SCHEDA PER L'UTENTE
// =================================================================

interface PosSchedaLogoPickerModalProps {
  tipo: PosSchedaTipo;
  title: string;
  currentLogoUrl?: string;
  currentIcona?: string;
  onSave: (data: { logoUrl?: string; icona?: string }) => void;
  onClose: () => void;
}

export const PosSchedaLogoPickerModal: React.FC<PosSchedaLogoPickerModalProps> = ({
  tipo,
  title,
  currentLogoUrl = '',
  currentIcona = '',
  onSave,
  onClose,
}) => {
  const [logoUrl, setLogoUrl] = useState(currentLogoUrl);
  const [icona, setIcona] = useState(currentIcona);
  const [previewError, setPreviewError] = useState(false);

  // Libreria preset per tipo
  const presetsByTipo: Record<PosSchedaTipo, Array<{ icon: string; label: string; url?: string }>> = {
    lavorazione: [
      { icon: '🔨', label: 'Opere murarie edili' },
      { icon: '🚧', label: 'Allestimento cantiere' },
      { icon: '🏗️', label: 'Strutture c.a. e carpenteria' },
      { icon: '⛏️', label: 'Scavi e sbancamento' },
      { icon: '⚡', label: 'Impianti elettrici' },
      { icon: '🚰', label: 'Impianti idrotermosanitari' },
      { icon: '🎨', label: 'Tinteggiature e finiture' },
      { icon: '🧱', label: 'Tramezzature e forati' },
      { icon: '📐', label: 'Posa pavimenti e rivestimenti' },
      { icon: '🪚', label: 'Opere da falegname / tetti' },
      { icon: '🏠', label: 'Rifacimento coperture e impermeabilizzazioni' },
      { icon: '💥', label: 'Demolizioni controllate' },
    ],
    attrezzatura: [
      { icon: '🚜', label: 'Miniescavatore / Mezzi terra' },
      { icon: '🔄', label: 'Betoniera a bicchiere' },
      { icon: '🚛', label: 'Autocarro con gru idraulica' },
      { icon: '🪚', label: 'Sega circolare da cantiere' },
      { icon: '⚡', label: 'Quadro elettrico ASC' },
      { icon: '🌀', label: 'Smerigliatrice angolare (flessibile)' },
      { icon: '🔨', label: 'Martello demolitore elettrico' },
      { icon: '🏗️', label: 'Piattaforma elevabile (PLE)' },
      { icon: '🧯', label: 'Motocompressore d’aria' },
      { icon: '🔩', label: 'Vibratore per calcestruzzo' },
      { icon: '🪓', label: 'Troncatrice per ferro e laterizi' },
      { icon: '🪜', label: 'Montacarichi da cantiere' },
    ],
    opera: [
      { icon: '🏢', label: 'Ponteggio metallico a telai' },
      { icon: '🪜', label: 'Trabattello su ruote' },
      { icon: '🛡️', label: 'Parapetti provvisori anticaduta' },
      { icon: '🪵', label: 'Puntellature e banchinaggi solai' },
      { icon: '🪜', label: 'Scale portatili a pioli' },
      { icon: '🚶', label: 'Passerella pedonale di transito' },
      { icon: '🪢', label: 'Linee vita e ancoraggi EN 795' },
      { icon: '🎪', label: 'Reti di sicurezza anticaduta EN 1263' },
    ],
    sostanza: [
      { icon: '🧪', label: 'Cemento Portland e malte' },
      { icon: '🛢️', label: 'Primer bituminoso per guaine' },
      { icon: '🎨', label: 'Pittura murale e smalti sintetici' },
      { icon: '🧴', label: 'Disarmante ecologico per casseformi' },
      { icon: '🧱', label: 'Colla per piastrelle C2TE' },
      { icon: '🧼', label: 'Resina epossidica bicomponente' },
      { icon: '💨', label: 'Schiuma poliuretanica spray' },
      { icon: '💧', label: 'Antigelo e additivi per getti' },
    ],
  };

  const currentPresets = presetsByTipo[tipo] || presetsByTipo.lavorazione;

  // Gestione caricamento file immagine dal dispositivo
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Controllo dimensione max 2MB
    if (file.size > 2 * 1024 * 1024) {
      alert('Immagine troppo grande. Scegliere un file inferiore a 2 MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setLogoUrl(reader.result);
        setPreviewError(false);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-400">
              Personalizzazione Scheda di Sicurezza
            </span>
            <h3 className="text-base font-black text-slate-900 dark:text-white uppercase">
              Logo & Immagine Scheda
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center justify-center font-bold"
          >
            ✕
          </button>
        </div>

        {/* Anteprima corrente */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center gap-4">
          <PosSchedaLogo
            tipo={tipo}
            title={title}
            iconaEmoji={icona}
            logoUrl={logoUrl}
            size="lg"
          />
          <div className="flex-1 min-w-0">
            <strong className="block text-sm font-black text-slate-900 dark:text-white truncate">
              {title}
            </strong>
            <span className="text-xs text-slate-500 dark:text-slate-400 block mt-0.5">
              {logoUrl ? 'Immagine personalizzata impostata' : `Icona identificativa: ${icona || 'Predefinita'}`}
            </span>
            {logoUrl && (
              <button
                type="button"
                onClick={() => setLogoUrl('')}
                className="text-[10px] text-rose-600 dark:text-rose-400 font-bold hover:underline mt-1 block"
              >
                Rimuovi immagine personalizzata e usa icona
              </button>
            )}
          </div>
        </div>

        {/* Selezione Rapida Icone / Simboli */}
        <div className="space-y-2">
          <label className="block text-xs font-black uppercase text-slate-700 dark:text-slate-300">
            1. Scegli Icona / Simbolo Predefinito
          </label>
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-36 overflow-y-auto p-1 custom-scrollbar">
            {currentPresets.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setIcona(p.icon);
                  if (p.url) setLogoUrl(p.url);
                }}
                className={`p-2 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${
                  icona === p.icon
                    ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/40 text-blue-900 dark:text-white ring-2 ring-blue-500/30'
                    : 'border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
                title={p.label}
              >
                <span className="text-2xl">{p.icon}</span>
                <span className="text-[9px] font-bold truncate w-full text-center">{p.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Carica File o Inserisci URL */}
        <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800">
          <label className="block text-xs font-black uppercase text-slate-700 dark:text-slate-300">
            2. Oppure Carica Immagine / Logo Reale
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                Carica da file (PNG, JPG, SVG):
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="w-full text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-black file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                O incolla URL web:
              </label>
              <input
                type="url"
                value={logoUrl}
                onChange={e => setLogoUrl(e.target.value)}
                placeholder="https://..."
                className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              />
            </div>
          </div>
        </div>

        {/* Azioni */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Annulla
          </button>
          <button
            type="button"
            onClick={() => {
              onSave({ logoUrl, icona });
              onClose();
            }}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-md transition-colors"
          >
            Salva Logo Scheda
          </button>
        </div>
      </div>
    </div>
  );
};
