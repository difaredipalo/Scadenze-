
import { GoogleGenAI } from "@google/genai";
import { AppData } from "../types";

/**
 * Generates brief operational insights using Gemini.
 * Strictly follows @google/genai guidelines for client initialization and property access.
 */
export const getInsights = async (data: AppData): Promise<string> => {
  // Use the pre-configured API key directly from process.env
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `
    Analizza brevemente (max 100 caratteri) le scadenze critiche di questa impresa edile:
    - Cantieri: ${data.cantieri.length}
    - Personale: ${data.personale.length}
    - Mezzi: ${data.mezzi.length}
    - Documenti: ${data.documenti.length}
    
    Identifica una sola priorità urgente o uno stato generale positivo.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    
    // Access response.text property (not a method) as per SDK specifications
    return response.text || "Situazione sotto controllo.";
  } catch (error) {
    console.error("Gemini Insight Error:", error);
    return "Analisi AI temporaneamente non disponibile.";
  }
};
