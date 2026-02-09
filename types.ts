export type ItemType = 'FICHE' | 'POLITIQUE' | 'SECTEUR';

export interface CeeKnowledgeItem {
  id: string;
  type: ItemType;
  title: string;
  code?: string; // Only for fiches
  sector?: 'Résidentiel' | 'Tertiaire' | 'Industrie' | 'Réseaux' | 'Transport' | 'Agriculture' | 'Transversal';
  versionDate: string; // ISO date string
  url: string;
  content: string;
}

export interface GroundingSource {
  title: string;
  url: string;
}

export interface SearchHistoryItem {
  id: string;
  query: string;
  timestamp: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  sources?: GroundingSource[];
}

export interface ScraperState {
  isScanning: boolean;
  isIndexed: boolean;
  items: CeeKnowledgeItem[];
}