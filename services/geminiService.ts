import { GoogleGenAI } from "@google/genai";
import { AppData } from "../types";

/**
 * Returns the configured Gemini API key from environment or local storage.
 */
export const getGeminiApiKey = (): string => {
  const envKey = 
    process.env.GEMINI_API_KEY || 
    process.env.API_KEY || 
    import.meta.env.VITE_GEMINI_API_KEY || 
    import.meta.env.GEMINI_API_KEY || 
    '';

  const savedKey = localStorage.getItem('scadenze_gemini_api_key') || '';
  return savedKey || envKey || '';
};

export const saveGeminiApiKey = (key: string) => {
  if (key && key.trim().length > 0) {
    localStorage.setItem('scadenze_gemini_api_key', key.trim());
  } else {
    localStorage.removeItem('scadenze_gemini_api_key');
  }
};

/**
 * Generates brief operational insights using Gemini.
 */
export const getInsights = async (data: AppData): Promise<string> => {
  const apiKey = getGeminiApiKey();
  
  if (!apiKey) {
    return "Configura la tua API Key Gemini in Impostazioni per attivare l'assistente AI.";
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    
    // Controlla scadenze critiche (entro i prossimi 15 giorni) o già scadute
    const today = new Date();
    const urgentItems: string[] = [];

    data.cantieri.forEach(c => {
      if (c.scadenza) {
        const diffDays = Math.ceil((new Date(c.scadenza).getTime() - today.getTime()) / (1000 * 3600 * 24));
        if (diffDays <= 15) {
          urgentItems.push(`Cantiere "${c.nome}" (scade tra ${diffDays} gg)`);
        }
      }
    });

    data.personale.forEach(p => {
      if (p.scadenzaVisitaMedica) {
        const diffDays = Math.ceil((new Date(p.scadenzaVisitaMedica).getTime() - today.getTime()) / (1000 * 3600 * 24));
        if (diffDays <= 15) {
          urgentItems.push(`Visita medica ${p.nome} ${p.cognome} (scade tra ${diffDays} gg)`);
        }
      }
    });

    data.mezzi.forEach(m => {
      if (m.scadenzaAssicurazione) {
        const diffDays = Math.ceil((new Date(m.scadenzaAssicurazione).getTime() - today.getTime()) / (1000 * 3600 * 24));
        if (diffDays <= 15) {
          urgentItems.push(`Assicurazione ${m.modello} [${m.targa}] (scade tra ${diffDays} gg)`);
        }
      }
      if (m.prossimaRevisione) {
        const diffDays = Math.ceil((new Date(m.prossimaRevisione).getTime() - today.getTime()) / (1000 * 3600 * 24));
        if (diffDays <= 15) {
          urgentItems.push(`Revisione ${m.modello} [${m.targa}] (scade tra ${diffDays} gg)`);
        }
      }
    });

    const prompt = `
Sei il consulente e assistente virtuale di una prestigiosa impresa edile italiana ("${data.settings.nomeAzienda || 'Impresa Edile'}").
Dati attuali:
- ${data.cantieri.length} cantieri registrati
- ${data.personale.length} dipendenti/collaboratori
- ${data.mezzi.length} mezzi e macchine operative
- ${data.documenti.length} documenti e autorizzazioni
${urgentItems.length > 0 ? `Scadenze imminenti/urgenti: ${urgentItems.slice(0, 4).join(', ')}` : 'Nessuna scadenza critica immediata nei prossimi 15 giorni.'}

Fornisci una sintesi operativa ad alto impatto (massimo 150 caratteri o 1-2 frasi incisive in italiano). Evidenzia una priorità specifica o dai un consiglio strategico per il cantiere o la conformità normativa.
`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    
    return response.text?.trim() || "Tutti i cantieri e la documentazione sono in regola.";
  } catch (error: any) {
    console.error("Gemini Insight Error:", error);
    if (error?.message?.includes('API_KEY') || error?.message?.includes('API key')) {
      return "Chiave API Gemini non valida. Verificala nella sezione Impostazioni.";
    }
    return "Controllo scadenze attivo: monitora regolarmente visite mediche e revisioni mezzi.";
  }
};
