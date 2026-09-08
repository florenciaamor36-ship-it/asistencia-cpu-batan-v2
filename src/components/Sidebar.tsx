import React, { useState } from 'react';
import { ViewMode, Subject } from '../types';
import { 
  LayoutDashboard, 
  Users, 
  BookOpen, 
  Briefcase, 
  BarChart3, 
  Database, Info, 
  ChevronDown, 
  ChevronRight,
  CheckSquare
} from 'lucide-react';

interface SidebarProps {
  currentView: ViewMode;
  selectedSubjectId: string | null;
  onSelectView: (view: ViewMode) => void;
  onSelectSubject: (subjectId: string) => void;
  materias: Subject[];
  darkMode: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  selectedSubjectId,
  onSelectView,
  onSelectSubject,
  materias,
  darkMode
}) => {
  const [materiasOpen, setMateriasOpen] = useState(true);

  const navItemClass = (active: boolean) => `
    w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-medium transition
    ${active 
      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' 
      : darkMode 
        ? 'text-slate-300 hover:bg-slate-800 hover:text-white' 
        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}
  `;

  return (
    <aside className={`w-full md:w-64 md:flex-shrink-0 border-b md:border-b-0 md:border-r min-h-0 md:min-h-[calc(100vh-61px)] max-h-[38vh] md:max-h-none overflow-y-auto p-2 sm:p-4 flex flex-col justify-between transition-colors duration-200 ${
      darkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800'
    }`}>
      <div className="space-y-3 sm:space-y-6">
        {/* Navigation links */}
        <div className="space-y-1">
          <p className={`px-3 text-xs font-semibold uppercase tracking-wider mb-2 ${darkMode ? 'text-slate-400' : 'text-slate-400'}`}>
            Menú Principal
          </p>

          <button
            onClick={() => onSelectView('dashboard')}
            className={navItemClass(currentView === 'dashboard')}
          >
            <LayoutDashboard className="w-5 h-5" />
            <span>Panel General</span>
          </button>

          <button
            onClick={() => onSelectView('matricula')}
            className={navItemClass(currentView === 'matricula')}
          >
            <Users className="w-5 h-5" />
            <span>Matrícula Completa</span>
          </button>

          {/* Materias with collapsible submenu */}
          <div>
            <div className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition ${
              currentView === 'materias' ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' : darkMode ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-600 hover:bg-slate-100'
            }`}>
              <button
                onClick={() => onSelectView('materias')}
                className="flex items-center space-x-3 flex-1 text-left"
              >
                <BookOpen className="w-5 h-5" />
                <span>Gestión de Materias</span>
              </button>
              <button
                onClick={() => setMateriasOpen(!materiasOpen)}
                className="p-1 rounded-lg hover:bg-black/10"
              >
                {materiasOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>
            </div>

            {materiasOpen && (
              <div className="ml-4 mt-1 space-y-1 border-l-2 pl-3 border-slate-200 dark:border-slate-800">
                <p className="text-[10px] uppercase font-semibold text-slate-400 px-2 py-1">Asistencias por Materia:</p>
                {materias.map((m) => {
                  const isActive = currentView === 'asistencia' && selectedSubjectId === m.id;
                  return (
                    <button
                      key={m.id}
                      onClick={() => {
                        onSelectSubject(m.id);
                        onSelectView('asistencia');
                      }}
                      className={`w-full text-left px-2.5 py-2 rounded-lg text-xs font-medium transition truncate ${
                        isActive 
                          ? 'bg-blue-600/10 text-blue-600 dark:text-blue-400 font-semibold' 
                          : darkMode ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50' : 'text-slate-600 hover:text-slate-950 hover:bg-slate-50'
                      }`}
                      title={m.nombre}
                    >
                      • {m.nombre}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <button
            onClick={() => onSelectView('trabajadores')}
            className={navItemClass(currentView === 'trabajadores')}
          >
            <Briefcase className="w-5 h-5" />
            <span>Trabajadores</span>
          </button>

          <button
            onClick={() => onSelectView('estadisticas')}
            className={navItemClass(currentView === 'estadisticas')}
          >
            <BarChart3 className="w-5 h-5" />
            <span>Estadísticas</span>
          </button>

          <button
            onClick={() => onSelectView('respaldo')}
            className={navItemClass(currentView === 'respaldo')}
          >
            <Database className="w-5 h-5" />
            <span>Respaldo / Migración</span>
          </button>

          <button
            onClick={() => onSelectView('acerca')}
            className={navItemClass(currentView === 'acerca')}
          >
            <Info className="w-5 h-5" />
            <span>Acerca de y términos</span>
          </button>
        </div>
      </div>

      {/* Footer institutional note */}
      <div className={`hidden md:block pt-4 border-t text-xs text-center ${darkMode ? 'border-slate-800 text-slate-500' : 'border-slate-100 text-slate-400'}`}>
        <p className="font-medium">CPU Batán © 2026</p>
        <p className="mt-0.5">Control de Asistencia</p>
      </div>
    </aside>
  );
};
