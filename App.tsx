import React, { useState, useEffect, useRef } from 'react';
import Sidebar from './components/Sidebar';
import ChatMessage from './components/ChatMessage';
import { CeeKnowledgeItem, ChatMessage as ChatMessageType, ScraperState, SearchHistoryItem } from './types';
import { mockScrapeCEE, getEffectiveKnowledge } from './services/ceeService';
import { askCeeExpertStream } from './services/geminiService';

const App: React.FC = () => {
  const [scraper, setScraper] = useState<ScraperState>({
    isScanning: false,
    isIndexed: false,
    items: [],
  });
  
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [history, setHistory] = useState<SearchHistoryItem[]>([]);
  const [messages, setMessages] = useState<ChatMessageType[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Bienvenue sur la plateforme d\'Expertise CEE.\n\nLe système est prêt pour analyser le corpus de la 5ème période. Veuillez indexer le portail ministériel pour commencer ou posez votre question directement.',
      timestamp: Date.now(),
    }
  ]);
  const [input, setInput] = useState<string>('');
  const [isTyping, setIsTyping] = useState<boolean>(false);
  
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Load history on mount
  useEffect(() => {
    const saved = localStorage.getItem('cee_search_history');
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse history", e);
      }
    }
  }, []);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleScrape = async () => {
    setScraper((prev: ScraperState) => ({ ...prev, isScanning: true }));
    try {
      const results = await mockScrapeCEE();
      setScraper({
        isScanning: false,
        isIndexed: true,
        items: results,
      });
      
      setMessages((prev: ChatMessageType[]) => [...prev, {
        id: `sys-${Date.now()}`,
        role: 'assistant',
        content: `Indexation terminée. **${results.length} documents** ont été chargés avec succès, incluant les fiches BAR, BAT, IND et TRA ainsi que les politiques de la 5ème période.`,
        timestamp: Date.now()
      }]);
    } catch (error) {
      console.error("Scraping error:", error);
      setScraper((prev: ScraperState) => ({ ...prev, isScanning: false }));
    }
  };

  const addToHistory = (query: string) => {
    const newHistory = [
      { id: Date.now().toString(), query, timestamp: Date.now() },
      ...history.filter(h => h.query !== query).slice(0, 9)
    ];
    setHistory(newHistory);
    localStorage.setItem('cee_search_history', JSON.stringify(newHistory));
  };

  const performSearch = async (queryText: string) => {
    if (!queryText.trim() || isTyping) return;

    addToHistory(queryText);

    const userMsgId = Date.now().toString();
    const userMessage: ChatMessageType = {
      id: userMsgId,
      role: 'user',
      content: queryText,
      timestamp: Date.now(),
    };

    const assistantMsgId = (Date.now() + 1).toString();
    const initialBotMessage: ChatMessageType = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      sources: [],
    };

    setMessages((prev: ChatMessageType[]) => [...prev, userMessage, initialBotMessage]);
    setInput('');
    setIsTyping(true);

    try {
      const effectiveContext = getEffectiveKnowledge(scraper.items, selectedDate);
      const { stream, getGroundingSources } = await askCeeExpertStream(queryText, effectiveContext, selectedDate);

      let fullText = '';
      let lastChunk: any = null;

      for await (const chunk of stream) {
        lastChunk = chunk;
        const chunkText = chunk.text;
        if (chunkText) {
          fullText += chunkText;
          setMessages((prev: ChatMessageType[]) => prev.map((m: ChatMessageType) => 
            m.id === assistantMsgId ? { ...m, content: fullText } : m
          ));
        }
      }

      if (lastChunk) {
        const sources = getGroundingSources(lastChunk);
        setMessages((prev: ChatMessageType[]) => prev.map((m: ChatMessageType) => 
          m.id === assistantMsgId ? { ...m, sources } : m
        ));
      }

    } catch (error: any) {
      console.error("Chat error:", error);
      const errorMsg = "Erreur de communication. Veuillez vérifier la variable d'environnement API_KEY dans Vercel.";
      setMessages((prev: ChatMessageType[]) => prev.map((m: ChatMessageType) => 
        m.id === assistantMsgId ? { ...m, content: errorMsg } : m
      ));
    } finally {
      setIsTyping(false);
    }
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch(input);
  };

  const handleClearHistory = () => {
    setHistory([]);
    localStorage.removeItem('cee_search_history');
  };

  return (
    <div className="flex h-screen brand-bg-chaux overflow-hidden font-sans">
      <Sidebar 
        onScrape={handleScrape}
        isScanning={scraper.isScanning}
        isIndexed={scraper.isIndexed}
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
        items={getEffectiveKnowledge(scraper.items, selectedDate)}
        history={history}
        onHistoryClick={performSearch}
        onClearHistory={handleClearHistory}
      />

      <main className="flex-1 flex flex-col relative">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0 z-10">
          <div className="flex items-center space-x-3">
            <div className="w-2.5 h-2.5 rounded-full bg-[#17D16E] shadow-[0_0_8px_rgba(23,209,110,0.4)]"></div>
            <h2 className="font-bold text-[#161637] tracking-tight text-sm uppercase">Expertise Réglementaire CEE</h2>
          </div>
          <div className="flex items-center space-x-3">
             <div className="flex items-center bg-[#FCFBF8] border border-slate-200 px-3 py-1.5 rounded-lg text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              <i className="fa-solid fa-calendar-day mr-2 text-[#4754FF]"></i>
              <span>{new Date(selectedDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
            </div>
            <div className="text-[10px] font-bold text-white bg-[#161637] px-3 py-1.5 rounded-lg uppercase tracking-widest flex items-center">
              <i className="fa-solid fa-bolt mr-2 text-[#FFF164]"></i> Gemini 3
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 sm:p-12 scroll-smooth bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px]">
          <div className="max-w-4xl mx-auto w-full">
            {messages.map((msg: ChatMessageType) => (
              <ChatMessage key={msg.id} message={msg} />
            ))}
            {isTyping && messages[messages.length-1].content === '' && (
              <div className="flex items-center space-x-2 text-slate-400 text-xs font-bold uppercase tracking-widest animate-pulse ml-14">
                <i className="fa-solid fa-brain"></i>
                <span>L'expert consulte le corpus...</span>
              </div>
            )}
            <div ref={chatEndRef} className="h-4" />
          </div>
        </div>

        <div className="p-6 sm:p-10 bg-white border-t border-slate-200 shadow-[0_-10px_40px_rgba(22,22,55,0.03)]">
          <form onSubmit={handleSend} className="max-w-4xl mx-auto">
            <div className="relative flex items-center group">
              <div className="absolute left-6 text-slate-300 group-focus-within:text-[#4754FF] transition-colors">
                <i className="fa-solid fa-magnifying-glass"></i>
              </div>
              <input
                type="text"
                value={input}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInput(e.target.value)}
                placeholder="Ex: Analyse de la fiche IND-BA-112..."
                className="w-full bg-[#FCFBF8] border border-slate-200 rounded-2xl py-5 pl-14 pr-24 focus:ring-4 focus:ring-[#4754FF]/5 focus:border-[#4754FF] transition-all outline-none text-[#161637] font-medium placeholder:text-slate-400 shadow-sm"
              />
              <button
                type="submit"
                disabled={!input.trim() || isTyping}
                className="absolute right-3 brand-bg-jaune brand-text-minuit p-3 px-6 rounded-xl hover:opacity-95 disabled:opacity-50 transition-all shadow-md active:scale-95 font-bold text-sm uppercase tracking-wider"
              >
                {isTyping ? <i className="fa-solid fa-spinner fa-spin"></i> : <span>Interroger</span>}
              </button>
            </div>
            <div className="mt-5 flex items-center justify-center space-x-12 text-[9px] text-slate-400 font-bold uppercase tracking-[0.2em]">
              <span className="flex items-center"><i className="fa-solid fa-shield-check text-[#17D16E] mr-2"></i> Source Officielle</span>
              <span className="flex items-center"><i className="fa-solid fa-database text-[#4754FF] mr-2"></i> RAG Augmenté</span>
              <span className="flex items-center"><i className="fa-solid fa-clock text-[#FF9538] mr-2"></i> Temporalité Active</span>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};

export default App;