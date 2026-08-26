import { GoogleGenAI } from "@google/genai";
import { AppData } from "../types";

/**
 * Returns the configured Gemini API key from environment or local storage.
 */
export const getGeminiApiKey = (): string => {
  const savedKey = localStorage.getItem('scadenze_gemini_api_key');
  if (savedKey && savedKey.trim().length > 0) {
    return savedKey.trim();
  }

  const envKey = 
    process.env.GEMINI_API_KEY || 
    process.env.API_KEY || 
    import.meta.env.VITE_GEMINI_API_KEY || 
    import.meta.env.GEMINI_API_KEY || 
    '';

  return envKey ? envKey.trim() : '';
};

export const saveGeminiApiKey = (key: string) => {
  if (key && key.trim().length > 0) {
    localStorage.setItem('scadenze_gemini_api_key', key.trim());
  } else {
    localStorage.removeItem('scadenze_gemini_api_key');
  }
};

/**
 * Generates smart heuristic operational advice based on current data.
 */
export const generateLocalHeuristicInsights = (data: AppData): string => {
  const today = new Date();
  const expiredCantieri: string[] = [];
  const urgentCantieri: string[] = [];
  const urgentVisite: string[] = [];
  const urgentAssicurazioni: string[] = [];
  const urgentRevisioni: string[] = [];
  const urgentDocumenti: string[] = [];

  data.cantieri?.forEach(c => {
    if (c.stato !== 'chiuso' && c.scadenza) {
      const diff = Math.ceil((new Date(c.scadenza).getTime() - today.getTime()) / (1000 * 3600 * 24));
      if (diff < 0) {
        expiredCantieri.push(c.nome);
      } else if (diff <= 15) {
        urgentCantieri.push(`${c.nome} (${diff} gg)`);
      }
    }
  });

  data.personale?.forEach(p => {
    if (p.inForza && p.scadenzaVisitaMedica) {
      const diff = Math.ceil((new Date(p.scadenzaVisitaMedica).getTime() - today.getTime()) / (1000 * 3600 * 24));
      if (diff <= 15) {
        urgentVisite.push(`${p.nome} ${p.cognome} (${diff < 0 ? 'scaduta' : `${diff} gg`})`);
      }
    }
  });

  data.mezzi?.forEach(m => {
    if (m.scadenzaAssicurazione) {
      const diff = Math.ceil((new Date(m.scadenzaAssicurazione).getTime() - today.getTime()) / (1000 * 3600 * 24));
      if (diff <= 15) {
        urgentAssicurazioni.push(`${m.targa} (${diff < 0 ? 'scaduta' : `${diff} gg`})`);
      }
    }
    if (m.prossimaRevisione) {
      const diff = Math.ceil((new Date(m.prossimaRevisione).getTime() - today.getTime()) / (1000 * 3600 * 24));
      if (diff <= 15) {
        urgentRevisioni.push(`${m.targa} (${diff < 0 ? 'scaduta' : `${diff} gg`})`);
      }
    }
  });

  data.documenti?.forEach(d => {
    if (d.scadenza) {
      const diff = Math.ceil((new Date(d.scadenza).getTime() - today.getTime()) / (1000 * 3600 * 24));
      if (diff <= 15) {
        urgentDocumenti.push(`${d.titolo} (${diff < 0 ? 'scaduto' : `${diff} gg`})`);
      }
    }
  });

  // Sintesi prioritaria
  if (expiredCantieri.length > 0) {
    return `Attenzione: ${expiredCantieri.length} cantiere/i con data di consegna superata (${expiredCantieri.slice(0, 2).join(', ')}). Verificare SAL e proroghe contrattuali.`;
  }
  if (urgentVisite.length > 0) {
    return `Priorità Sicurezza: ${urgentVisite.length} visita/e medica/e da rinnovare con urgenza (${urgentVisite.slice(0, 2).join(', ')}).`;
  }
  if (urgentAssicurazioni.length > 0 || urgentRevisioni.length > 0) {
    const totalMezzi = urgentAssicurazioni.length + urgentRevisioni.length;
    return `Gestione Flotta: ${totalMezzi} scadenza/e imminenti tra assicurazioni e revisioni dei veicoli operativi.`;
  }
  if (urgentCantieri.length > 0) {
    return `Pianificazione Lavori: Cantiere in scadenza a breve (${urgentCantieri.slice(0, 2).join(', ')}). Controllare stato avanzamento.`;
  }
  if (urgentDocumenti.length > 0) {
    return `Conformità Normativa: ${urgentDocumenti.length} documento/i aziendale/i in scadenza entro 15 giorni.`;
  }

  const activeCantieri = data.cantieri?.filter(c => c.stato === 'aperto').length || 0;
  return `Quadro operativo regolare: ${activeCantieri} cantieri aperti e personale conforme agli standard di sicurezza.`;
};

/**
 * Tests a Gemini API key.
 */
export const testGeminiApiKey = async (apiKey: string): Promise<{ ok: boolean; message: string }> => {
  if (!apiKey || apiKey.trim().length === 0) {
    return { ok: false, message: 'Inserisci una chiave API Gemini valida.' };
  }

  try {
    const ai = new GoogleGenAI({ apiKey: apiKey.trim() });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: 'Rispondi con OK se sei operativo.',
    });

    if (response && response.text) {
      return { ok: true, message: 'Chiave API Gemini verificata con successo!' };
    }
    return { ok: false, message: 'Nessuna risposta ricevuta dal modello Gemini.' };
  } catch (error: any) {
    const errMsg = error?.message || String(error);
    if (errMsg.includes('403') || errMsg.includes('PERMISSION_DENIED') || error?.status === 'PERMISSION_DENIED') {
      return { 
        ok: false, 
        message: 'Errore 403: Permesso negato. Verifica che la Generative Language API sia attiva nel tuo account Google AI Studio / Google Cloud.' 
      };
    }
    if (errMsg.includes('API_KEY_INVALID') || errMsg.includes('API key not valid')) {
      return { ok: false, message: 'La chiave API inserita non è valida. Ricontrolla i caratteri.' };
    }
    return { ok: false, message: `Errore di connessione a Gemini: ${errMsg.slice(0, 100)}` };
  }
};

/**
 * Generates brief operational insights using Gemini, with intelligent fallback.
 */
export const getInsights = async (data: AppData): Promise<string> => {
  const apiKey = getGeminiApiKey();
  
  if (!apiKey) {
    return generateLocalHeuristicInsights(data);
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    
    // Scadenze imminenti nei prossimi 15 giorni
    const today = new Date();
    const urgentItems: string[] = [];

    data.cantieri?.forEach(c => {
      if (c.stato !== 'chiuso' && c.scadenza) {
        const diffDays = Math.ceil((new Date(c.scadenza).getTime() - today.getTime()) / (1000 * 3600 * 24));
        if (diffDays <= 15) {
          urgentItems.push(`Cantiere "${c.nome}" (scadenza: ${diffDays < 0 ? 'scaduto' : `tra ${diffDays} gg`})`);
        }
      }
    });

    data.personale?.forEach(p => {
      if (p.inForza && p.scadenzaVisitaMedica) {
        const diffDays = Math.ceil((new Date(p.scadenzaVisitaMedica).getTime() - today.getTime()) / (1000 * 3600 * 24));
        if (diffDays <= 15) {
          urgentItems.push(`Visita medica ${p.nome} ${p.cognome} (tra ${diffDays} gg)`);
        }
      }
    });

    data.mezzi?.forEach(m => {
      if (m.scadenzaAssicurazione) {
        const diffDays = Math.ceil((new Date(m.scadenzaAssicurazione).getTime() - today.getTime()) / (1000 * 3600 * 24));
        if (diffDays <= 15) {
          urgentItems.push(`Assicurazione ${m.modello} [${m.targa}] (tra ${diffDays} gg)`);
        }
      }
      if (m.prossimaRevisione) {
        const diffDays = Math.ceil((new Date(m.prossimaRevisione).getTime() - today.getTime()) / (1000 * 3600 * 24));
        if (diffDays <= 15) {
          urgentItems.push(`Revisione ${m.modello} [${m.targa}] (tra ${diffDays} gg)`);
        }
      }
    });

    const prompt = `
Sei il consulente e assistente virtuale di una prestigiosa impresa edile italiana ("${data.settings?.nomeAzienda || 'Impresa Edile'}").
Dati aziendali:
- Cantieri: ${data.cantieri?.length || 0}
- Personale: ${data.personale?.length || 0}
- Mezzi e macchine: ${data.mezzi?.length || 0}
- Documenti: ${data.documenti?.length || 0}
${urgentItems.length > 0 ? `Scadenze imminenti: ${urgentItems.slice(0, 4).join(', ')}` : 'Nessuna scadenza critica immediata.'}

Fornisci una sintesi operativa ad alto impatto (massimo 140 caratteri o 1-2 frasi incisive in italiano). Evidenzia una priorità specifica o dai un consiglio strategico per il cantiere o la sicurezza.
`;

    // Try primary model
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });
      if (response && response.text) {
        return response.text.trim();
      }
    } catch (primaryErr: any) {
      // If primary model failed due to model availability, try gemini-2.0-flash
      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: prompt,
      });
      if (response && response.text) {
        return response.text.trim();
      }
    }
    
    return generateLocalHeuristicInsights(data);
  } catch (error: any) {
    const errorStr = String(error?.message || error || '');
    // Se errore di permessi o chiave, restituisce l'analisi euristica locale senza rompere l'UI
    if (errorStr.includes('403') || errorStr.includes('PERMISSION_DENIED') || error?.status === 'PERMISSION_DENIED') {
      console.warn('Gemini API 403 (Permission Denied). Uso dell\'analisi euristica locale.');
      return generateLocalHeuristicInsights(data);
    }
    console.warn('Gemini API fallback to local heuristics:', errorStr);
    return generateLocalHeuristicInsights(data);
  }
};

