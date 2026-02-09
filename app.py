import streamlit as st
import datetime
import os
from cee_service import CeeService
from gemini_service import GeminiService

# Configuration de la page
st.set_page_config(page_title="Expert CEE - AI Advisor", page_icon="🍃", layout="wide")

# CSS Personnalisé pour le branding
st.markdown("""
<style>
    :root {
        --bleu-minuit: #161637;
        --jaune-brillant: #FFF164;
        --chaux: #FCFBF8;
        --indigo-electrique: #4754FF;
    }
    .main { background-color: var(--chaux); }
    [data-testid="stSidebar"] {
        background-color: var(--bleu-minuit);
        color: white;
    }
    .stButton>button {
        background-color: var(--jaune-brillant);
        color: var(--bleu-minuit);
        border-radius: 12px;
        font-weight: bold;
        border: none;
        width: 100%;
    }
    .stChatInputContainer { padding-bottom: 2rem; }
    .source-pill {
        display: inline-flex;
        align-items: center;
        background-color: white;
        border: 1px solid #e2e8f0;
        padding: 4px 12px;
        border-radius: 10px;
        font-size: 0.75rem;
        margin-right: 8px;
        margin-top: 8px;
        color: var(--indigo-electrique);
        text-decoration: none;
        transition: all 0.2s;
    }
    .source-pill:hover {
        border-color: var(--indigo-electrique);
        background-color: #f8f9ff;
    }
</style>
""", unsafe_allow_html=True)

# Initialisation de l'état
if "messages" not in st.session_state:
    st.session_state.messages = [{"role": "assistant", "content": "Bienvenue sur l'Expertise CEE. Scannez le portail pour charger les fiches BAR/BAT/IND."}]
if "items" not in st.session_state:
    st.session_state.items = []
if "indexed" not in st.session_state:
    st.session_state.indexed = False

# Sidebar
with st.sidebar:
    st.markdown(f"<h1 style='color:#FFF164;'>Expert CEE</h1>", unsafe_allow_html=True)
    st.divider()
    
    if st.button("🔍 Scanner le portail CEE"):
        with st.spinner("Extraction des fiches ministérielles..."):
            st.session_state.items = CeeService.mock_scrape_cee()
            st.session_state.indexed = True
            st.success(f"{len(st.session_state.items)} fiches indexées.")
            
    ref_date = st.date_input("Date de référence réglementaire", datetime.date.today())
    
    if st.session_state.indexed:
        effective_items = CeeService.get_effective_knowledge(st.session_state.items, ref_date)
        st.markdown(f"**Corpus actif :** {len(effective_items)} documents")
        for item in effective_items:
            with st.expander(f"{item.get('code', 'DOC')} - {item['title'][:20]}..."):
                st.caption(f"Applicable le : {item['versionDate']}")
                st.write(item['content'])

# Zone de Chat
st.title("🛡️ Expertise Réglementaire CEE")
st.caption(f"Mode RAG actif • Analyse basée sur la réglementation au {ref_date.strftime('%d/%m/%Y')}")

# Affichage de l'historique
for msg in st.session_state.messages:
    with st.chat_message(msg["role"]):
        st.write(msg["content"])
        if "sources" in msg and msg["sources"]:
            st.markdown("---")
            for src in msg["sources"]:
                st.markdown(f'<a href="{src["url"]}" class="source-pill" target="_blank">📄 {src["title"]}</a>', unsafe_allow_html=True)

# Input utilisateur
if prompt := st.chat_input("Ex: Quelles sont les exigences pour la BAR-TH-164 ?"):
    st.session_state.messages.append({"role": "user", "content": prompt})
    with st.chat_message("user"):
        st.write(prompt)

    with st.chat_message("assistant"):
        placeholder = st.empty()
        full_response = ""
        
        try:
            gemini = GeminiService()
            effective_context = CeeService.get_effective_knowledge(st.session_state.items, ref_date)
            
            # Appel au service (qui est maintenant un générateur propre)
            stream = gemini.ask_expert_stream(prompt, effective_context, ref_date.isoformat())
            
            last_chunk = None
            for chunk in stream:
                if chunk.text:
                    full_response += chunk.text
                    placeholder.markdown(full_response + "▌")
                last_chunk = chunk
            
            placeholder.markdown(full_response)
            
            # Extraction et affichage des sources
            sources = []
            if last_chunk:
                sources = GeminiService.extract_sources(last_chunk)
                if sources:
                    st.markdown("---")
                    for src in sources:
                        st.markdown(f'<a href="{src["url"]}" class="source-pill" target="_blank">📄 {src["title"]}</a>', unsafe_allow_html=True)
            
            # Sauvegarde dans l'historique
            st.session_state.messages.append({
                "role": "assistant", 
                "content": full_response, 
                "sources": sources
            })
            
        except Exception as e:
            st.error(f"Une erreur est survenue : {str(e)}")
            if "API_KEY" not in os.environ:
                st.warning("La clé API Gemini (API_KEY) n'est pas configurée dans les secrets de l'application.")
