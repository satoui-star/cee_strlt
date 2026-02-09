import os
from google import genai
from google.genai import types
from typing import List, Dict, Any, Generator

class GeminiService:
    def __init__(self):
        api_key = os.environ.get("API_KEY")
        if not api_key:
            raise ValueError("API_KEY non trouvée dans l'environnement.")
        self.client = genai.Client(api_key=api_key)
        self.model_name = 'gemini-3-flash-preview'

    def ask_expert_stream(self, query: str, context: List[Dict[str, Any]], ref_date: str) -> Generator[Any, None, None]:
        policy_ctx = "\n".join([f"[DOC] {i['title']}: {i['content']} (Source: {i['url']})" 
                               for i in context if i['type'] != 'FICHE'])
        fiche_ctx = "\n".join([f"[FICHE] {i['code']}: {i['title']}. Date: {i['versionDate']}. Contenu: {i['content']}" 
                              for i in context if i['type'] == 'FICHE'])

        sys_inst = f"""Tu es un expert du dispositif CEE pour le Ministère de la Transition Écologique.
Date de référence : {ref_date}.

INSTRUCTIONS :
1. Utilise le contexte local fourni prioritairement.
2. Utilise Google Search pour compléter si besoin.
3. Cite les fiches (ex: BAR-TH-164).

CONTEXTE LOCAL :
{policy_ctx}
{fiche_ctx}"""

        return self.client.models.generate_content_stream(
            model=self.model_name,
            contents=query,
            config=types.GenerateContentConfig(
                system_instruction=sys_inst,
                temperature=0.1,
                tools=[types.Tool(google_search=types.GoogleSearch())]
            )
        )

    @staticmethod
    def extract_sources(response: Any) -> List[Dict[str, str]]:
        sources = []
        if hasattr(response, 'candidates') and response.candidates:
            metadata = response.candidates[0].grounding_metadata
            if metadata and metadata.grounding_chunks:
                for chunk in metadata.grounding_chunks:
                    if chunk.web:
                        sources.append({
                            "title": chunk.web.title or "Source Web",
                            "url": chunk.web.uri
                        })
        return sources
