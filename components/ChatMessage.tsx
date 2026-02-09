import React from 'react';
import { ChatMessage as ChatMessageType } from '../types';

interface ChatMessageProps {
  message: ChatMessageType;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.role === 'user';

  /**
   * Parseur ultra-léger pour transformer le contenu texte en éléments React formatés.
   * Gère les titres (###), le gras (**), les formules ($$) et les listes (*).
   */
  const renderFormattedContent = (content: string) => {
    const lines = content.split('\n');
    const elements: React.ReactNode[] = [];

    lines.forEach((line, index) => {
      let currentLine = line.trim();

      // 1. Titres (###)
      if (currentLine.startsWith('###')) {
        const titleText = currentLine.replace(/^###\s*/, '');
        elements.push(
          <h3 key={`h3-${index}`} className="text-base font-bold mt-6 mb-3 brand-text-indigo flex items-center">
            <span className="w-1.5 h-1.5 rounded-full brand-bg-jaune mr-2"></span>
            {titleText}
          </h3>
        );
        return;
      }

      // 2. Formules Mathématiques ($$ ... $$)
      if (currentLine.startsWith('$$') && currentLine.endsWith('$$')) {
        const formula = currentLine.substring(2, currentLine.length - 2);
        elements.push(
          <div key={`math-${index}`} className="my-5 p-4 bg-slate-50 border border-slate-200 rounded-xl font-mono text-center text-[#4754FF] shadow-inner overflow-x-auto whitespace-pre-wrap italic">
            {formula}
          </div>
        );
        return;
      }

      // 3. Listes à puces (* ou -)
      if (currentLine.startsWith('* ') || currentLine.startsWith('- ')) {
        const listText = currentLine.substring(2);
        elements.push(
          <div key={`li-${index}`} className="flex items-start space-x-3 mb-2 ml-4">
            <span className="text-[#4754FF] mt-2 text-[6px] flex-shrink-0">
              <i className="fa-solid fa-circle"></i>
            </span>
            <span className="text-slate-700 leading-relaxed">{processInlineFormatting(listText)}</span>
          </div>
        );
        return;
      }

      // 4. Paragraphes normaux et gestion du gras
      if (currentLine === '') {
        elements.push(<div key={`br-${index}`} className="h-3" />);
      } else {
        elements.push(
          <p key={`p-${index}`} className="mb-3 leading-relaxed text-slate-700">
            {processInlineFormatting(currentLine)}
          </p>
        );
      }
    });

    return elements;
  };

  /**
   * Remplace les **texte** par des balises <strong>
   */
  const processInlineFormatting = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        const cleanText = part.slice(2, -2);
        return <strong key={i} className="font-extrabold text-[#161637]">{cleanText}</strong>;
      }
      return part;
    });
  };

  return (
    <div className={`flex w-full mb-10 ${isUser ? 'justify-end' : 'justify-start'} message-appear`}>
      <div className={`flex max-w-[92%] sm:max-w-[80%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        {/* Avatar */}
        <div className={`flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-xl shadow-lg
          ${isUser ? 'bg-[#4754FF] text-white ml-4' : 'bg-[#161637] text-white mr-4'}`}>
          <i className={`fa-solid ${isUser ? 'fa-user' : 'fa-shield-heart'}`}></i>
        </div>

        {/* Bubble */}
        <div className={`relative px-7 py-6 rounded-2xl shadow-sm text-[15px]
          ${isUser 
            ? 'bg-[#4754FF] text-white rounded-tr-none' 
            : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none'}`}>
          
          <div className="prose prose-slate max-w-none">
            {renderFormattedContent(message.content)}
          </div>

          {/* Sources Grounding */}
          {!isUser && message.sources && message.sources.length > 0 && (
            <div className="mt-8 pt-6 border-t border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 block">Documentation de Référence :</span>
              <div className="flex flex-wrap gap-2">
                {message.sources.map((source, idx) => (
                  <a 
                    key={idx}
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-2 bg-[#FCFBF8] border border-slate-200 hover:border-[#4754FF] hover:bg-[#4754FF]/5 text-[#4754FF] px-4 py-2 rounded-xl text-[11px] transition-all group font-semibold shadow-sm"
                  >
                    <i className="fa-solid fa-file-pdf text-[12px] opacity-40 group-hover:opacity-100"></i>
                    <span className="truncate max-w-[220px]">{source.title}</span>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Timestamp */}
          <div className={`text-[9px] mt-6 font-bold opacity-30 uppercase tracking-widest ${isUser ? 'text-right' : 'text-left'}`}>
            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;