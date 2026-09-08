import React, { useState } from 'react';
import { AppData } from '../types';
import { Sparkles, X, Send, Bot, User } from 'lucide-react';
import Markdown from 'react-markdown';

interface AiAssistantModalProps {
  data: AppData;
  onClose: () => void;
  darkMode: boolean;
}

export const AiAssistantModal: React.FC<AiAssistantModalProps> = ({ data, onClose, darkMode }) => {
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([
    { role: 'assistant', content: '¡Hola! Soy el asistente inteligente de CPU Batán. Puedo ayudarte a analizar estadísticas de asistencia, redactar informes institucionales o buscar información en el padrón. ¿En qué te puedo colaborar?' }
  ]);
  const [inputPrompt, setInputPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputPrompt.trim() || isLoading) return;

    const userText = inputPrompt;
    setInputPrompt('');
    setMessages(prev => [...prev, { role: 'user', content: userText }]);
    setIsLoading(true);

    try {
      const res = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: userText,
          context: {
            totalAlumnos: data.alumnos.length,
            materias: data.materias.map(m => ({ nombre: m.nombre, alumnos: m.alumnos.length, fechas: m.fechas.length })),
            trabajadores: data.trabajadores.length
          }
        })
      });

      const json = await res.json();
      if (res.ok && json.answer) {
        setMessages(prev => [...prev, { role: 'assistant', content: json.answer }]);
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: 'Lo siento, ocurrió un error al procesar tu consulta con la IA.' }]);
      }
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Error de conexión con el servicio de IA.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className={`w-full max-w-xl h-[80vh] flex flex-col rounded-3xl shadow-2xl border relative ${
        darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-xl bg-indigo-600 text-white">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm">Asistente IA CPU Batán</h3>
              <p className="text-[10px] text-slate-400">Impulsado por Gemini</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Messages body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((m, idx) => (
            <div key={idx} className={`flex items-start space-x-3 ${m.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                m.role === 'user' ? 'bg-blue-600 text-white' : 'bg-indigo-600 text-white'
              }`}>
                {m.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>
              <div className={`max-w-[80%] p-4 rounded-2xl text-sm leading-relaxed ${
                m.role === 'user' 
                  ? 'bg-blue-600 text-white rounded-tr-xs' 
                  : darkMode ? 'bg-slate-800 text-slate-200 rounded-tl-xs' : 'bg-slate-100 text-slate-800 rounded-tl-xs'
              }`}>
                <Markdown>{m.content}</Markdown>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex items-center space-x-2 text-xs text-slate-400">
              <div className="w-2 h-2 rounded-full bg-indigo-600 animate-bounce"></div>
              <div className="w-2 h-2 rounded-full bg-indigo-600 animate-bounce [animation-delay:0.2s]"></div>
              <div className="w-2 h-2 rounded-full bg-indigo-600 animate-bounce [animation-delay:0.4s]"></div>
              <span>Analizando datos...</span>
            </div>
          )}
        </div>

        {/* Input footer */}
        <form onSubmit={handleSend} className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center space-x-2">
          <input
            type="text"
            placeholder="Pregunta sobre asistencia, estadísticas o alumnos..."
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            className={`flex-1 px-4 py-2.5 rounded-xl border text-sm ${
              darkMode ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500' : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
            }`}
          />
          <button
            type="submit"
            disabled={isLoading || !inputPrompt.trim()}
            className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
