import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { CeeKnowledgeItem, GroundingSource } from "../types";

// Modèle recommandé pour les tâches générales
const MODEL_NAME = 'gemini-3-flash-preview';

export interface AssistantStreamResult {
  stream: AsyncIterable<GenerateContentResponse>;
  getGroundingSources: (finalResponse: GenerateContentResponse) => GroundingSource[];
}

/**
 * Fonction helper pour extraire les sources sans dépendre d'une fermeture complexe
 */
const extractSources = (finalResponse: GenerateContentResponse, contextItems: CeeKnowledgeItem[]): GroundingSource[] => {
  const sources: GroundingSource[] = [];
  
  // 1. Google Search Grounding
  const chunks = finalResponse.candidates?.[0]?.groundingMetadata?.groundingChunks;
  if (chunks && Array.isArray(chunks)) {
    chunks.forEach((chunk: any) => {
      if (chunk.web && chunk.web.uri) {
        sources.push({
          title: chunk.web.title || "Source Web",
          url: chunk.web.uri
        });
      }
    });
  }

  // 2. Cross-referencing local context
  const text = finalResponse.text || "";
  const lowerText = text.toLowerCase();
  
  contextItems.forEach((item) => {
    const identifier = (item.code || item.title).toLowerCase();
    if (lowerText.includes(identifier)) {
      sources.push({
        title: item.code || item.title,
        url: item.url
      });
    }
  });

  // 3. Deduplicate
  const uniqueMap = new Map<string, GroundingSource>();
  sources.forEach(s => uniqueMap.set(s.url, s));
  
  return Array.from(uniqueMap.values());
};

export const askCeeExpertStream = async (
  query: string,
  contextItems: CeeKnowledgeItem[],
  referenceDate: string
): Promise<AssistantStreamResult> => {
  const apiKey = process.env.API_KEY || "";
  
  if (!apiKey) {
    throw new Error("La clé API est absente des variables d'environnement.");
  }

  const ai = new GoogleGenAI({ apiKey: apiKey });

  const policyContext = contextItems
    .filter(i => i.type !== 'FICHE')
    .map(i => `[DOC] ${i.title}: ${i.content} (Source: ${i.url})`)
    .join('\n');

  const ficheContext = contextItems
    .filter(i => i.type === 'FICHE')
    .map(i => `[FICHE] ${i.code}: ${i.title}. Date: ${i.versionDate}. Contenu: ${i.content}`)
    .join('\n');

  const systemInstruction = `Tu es un expert du dispositif CEE (Certificats d'Économies d'Énergie) pour le Ministère de la Transition Écologique.
Date du jour : ${new Date(referenceDate).toLocaleDateString('fr-FR')}.

INSTRUCTIONS :
1. Utilise prioritairement le contexte local fourni.
2. Utilise Google Search pour les dernières actualités.
3. Cite systématiquement les fiches (ex: BAR-TH-164).

CONTEXTE LOCAL :
${policyContext || 'Aucun doc général.'}
${ficheContext || 'Aucune fiche technique.'}`;

  const responseStream = await ai.models.generateContentStream({
    model: MODEL_NAME,
    contents: [{ parts: [{ text: query }] }],
    config: {
      systemInstruction: systemInstruction,
      temperature: 0.1,
      tools: [{ googleSearch: {} }]
    }
  });

  return {
    stream: responseStream,
    getGroundingSources: (resp: GenerateContentResponse) => extractSources(resp, contextItems)
  };
};