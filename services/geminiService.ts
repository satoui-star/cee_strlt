import os
from google import genai
from google.genai import types
from typing import List, Dict, Any, Generator

class GeminiService:
    def __init__(self):
        api_key = os.environ.get("API_KEY")
        if not api_key:
            raise ValueError("La variable d'environnement API_KEY est manquante.")
        
        # Initialisation du client avec la nouvelle syntaxe google-genai
        self.client = genai.Client(api_key=api_key)
        self.model_name = 'gemini-3-flash-preview'

    def ask_expert_stream(self, query: str, context: List[Dict[str, Any]], ref_date: str) -> Generator[Any, None, None]:
        """Générateur stream pour les réponses de l'expert CEE."""
        
        policy_ctx = "\n".join([f"[DOC] {i['title']}: {i['content']} (Source: {i['url']})" 
                               for i in context if i['type'] != 'FICHE'])
        fiche_ctx = "\n".join([f"[FICHE] {i['code']}: {i['title']}. Date: {i['versionDate']}. Contenu: {i['content']}" 
                              for i in context if i['type'] == 'FICHE'])

        sys_inst = f"""Tu es un expert du dispositif CEE pour le Ministère de la Transition Écologique.
Date de référence réglementaire : {ref_date}.

INSTRUCTIONS :
1. Utilise le contexte local fourni prioritairement pour tes réponses.
2. Si le contexte local ne suffit pas, utilise tes connaissances et Google Search pour compléter.
3. Cite TOUJOURS les codes des fiches (ex: BAR-TH-164) quand tu les mentionnes.

CONTEXTE LOCAL :
{policy_ctx}
{fiche_ctx}"""

        # Appel au modèle en mode streaming
        # Le SDK Python attend souvent une liste pour contents
        stream = self.client.models.generate_content_stream(
            model=self.model_name,
            contents=[query],
            config=types.GenerateContentConfig(
                system_instruction=sys_inst,
                temperature=0.1,
                tools=[types.Tool(google_search=types.GoogleSearch())]
            )
        )
        
        yield from stream

    @staticmethod
    def extract_sources(response: Any) -> List[Dict[str, str]]:
        """Extrait les sources de grounding du dernier chunk de la réponse."""
        sources = []
        try:
            # En Python, on accède aux attributs en snake_case
            if hasattr(response, 'candidates') and response.candidates:
                candidate = response.candidates[0]
                if hasattr(candidate, 'grounding_metadata') and candidate.grounding_metadata:
                    metadata = candidate.grounding_metadata
                    if hasattr(metadata, 'grounding_chunks') and metadata.grounding_chunks:
                        for chunk in metadata.grounding_chunks:
                            if chunk.web:
                                sources.append({
                                    "title": chunk.web.title or "Lien Web",
                                    "url": chunk.web.uri
                                })
        except Exception as e:
            print(f"Erreur lors de l'extraction des sources : {e}")
            
        return sources
