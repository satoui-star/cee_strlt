import React from 'react';
import { CeeKnowledgeItem, SearchHistoryItem } from '../types';

interface SidebarProps {
  onScrape: () => void;
  isScanning: boolean;
  isIndexed: boolean;
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  items: CeeKnowledgeItem[];
  history: SearchHistoryItem[];
  onHistoryClick: (query: string) => void;
  onClearHistory: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  onScrape, 
  isScanning, 
  isIndexed, 
  selectedDate, 
  setSelectedDate,
  items,
  history,
  onHistoryClick,
  onClearHistory
}) => {
  const fiches = items.filter(i => i.type === 'FICHE');
  const sectors = Array.from(new Set(fiches.map(f => f.sector).filter(Boolean)));

  return (
    <div className="w-80 h-full brand-bg-minuit text-white flex flex-col border-r border-white/10 overflow-hidden shrink-0">
      <div className="p-6 border-b border-white/10 flex items-center space-x-3">
        <div className="brand-bg-jaune p-2 rounded-lg">
          <i className="fa-solid fa-leaf brand-text-minuit text-xl"></i>
        </div>
        <h1 className="text-xl font-bold tracking-tight">Expert CEE</h1>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8 scroll-smooth">
        {/* SECTION MOTEUR DE DONNÉES */}
        <section className="space-y-4">
          <h2 className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em] flex items-center">
            <i className="fa-solid fa-microchip mr-2 text-[#FFF164]"></i> Engine & Context
          </h2>
          <button
            onClick={onScrape}
            disabled={isScanning}
            className={`w-full py-3 px-4 rounded-xl flex items-center justify-center space-x-2 transition-all duration-200 font-bold text-sm
              ${isScanning 
                ? 'bg-white/10 text-white/40 cursor-not-allowed' 
                : 'brand-bg-jaune brand-text-minuit hover:opacity-90 shadow-lg shadow-black/20 active:scale-95'}`}
          >
            <i className={`fa-solid ${isScanning ? 'fa-spinner fa-spin' : 'fa-arrows-rotate'}`}></i>
            <span>{isScanning ? 'Extraction...' : (isIndexed ? 'Actualiser les fiches' : 'Scanner le portail CEE')}</span>
          </button>
          
          <div className="bg-white/5 p-4 rounded-xl space-y-3 border border-white/5">
            <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider block">Référence Temporelle</label>
            <input 
              type="date" 
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full bg-white/10 border-none rounded-lg text-sm p-2 outline-none focus:ring-2 focus:ring-[#FFF164] transition-all text-white"
            />
            <p className="text-[9px] text-white/30 italic">Les fiches seront filtrées selon leur date d'application.</p>
          </div>
        </section>

        {/* HISTORIQUE DE RECHERCHE */}
        {history.length > 0 && (
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-[10px] font-bold text-white/40 uppercase tracking-wider flex items-center">
                <i className="fa-solid fa-clock-rotate-left mr-2"></i> Historique
              </h2>
              <button onClick={onClearHistory} className="text-[9px] text-white/20 hover:text-white/60 transition-colors uppercase font-bold">Effacer</button>
            </div>
            <div className="space-y-1.5">
              {history.map((h) => (
                <button
                  key={h.id}
                  onClick={() => onHistoryClick(h.query)}
                  className="w-full text-left p-2.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 text-[11px] truncate text-white/70 transition-colors group flex items-center"
                >
                  <i className="fa-solid fa-magnifying-glass mr-2 text-white/10 group-hover:text-[#FFF164]"></i>
                  {h.query}
                </button>
              ))}
            </div>
          </section>
        )}

        {/* ANALYSE DES FICHES EXTRAITES */}
        {isIndexed && (
          <div className="space-y-6">
            <section className="space-y-3">
              <h2 className="text-[10px] font-bold text-white/40 uppercase tracking-wider flex items-center">
                <i className="fa-solid fa-folder-tree mr-2"></i> Corpus Actif ({items.length})
              </h2>
              
              {sectors.map(sector => (
                <div key={sector} className="space-y-2">
                  <span className="text-[9px] font-bold text-white/30 px-1 border-l border-[#FFF164] ml-1">{sector}</span>
                  <div className="space-y-2">
                    {items.filter(f => f.sector === sector).map(item => (
                      <div key={item.id} className="p-3 rounded-xl bg-white/5 border border-white/5 text-[11px] hover:bg-white/10 transition-all cursor-default group">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-[#FFF164]">{item.code}</span>
                          <span className="text-[9px] text-white/30">{item.versionDate.split('-')[0]}</span>
                        </div>
                        <h3 className="text-white/60 line-clamp-1 leading-relaxed group-hover:text-white transition-colors">{item.title}</h3>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </section>
          </div>
        )}

        {!isIndexed && !isScanning && (
          <div className="flex flex-col items-center justify-center py-12 text-center space-y-4 opacity-10">
            <i className="fa-solid fa-database text-4xl"></i>
            <p className="text-xs font-medium tracking-tight">Veuillez lancer l'indexation<br/>pour charger le corpus CEE.</p>
          </div>
        )}
      </div>

      <div className="p-4 bg-black/30 border-t border-white/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-[10px] text-white/40 font-bold uppercase tracking-widest">
            <span className="h-1.5 w-1.5 rounded-full brand-bg-jaune animate-pulse"></span>
            <span>Expert Mode</span>
          </div>
          <span className="text-[10px] text-white/20">v2.4.0</span>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;