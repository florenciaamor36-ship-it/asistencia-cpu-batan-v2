import React from 'react';
import { AppData, ViewMode } from '../types';
import {
  Activity,
  BarChart3,
  BookOpen,
  BriefcaseBusiness,
  CalendarDays,
  ChevronRight,
  ClipboardCheck,
  GraduationCap,
  LayoutDashboard,
  Search,
  ShieldCheck,
  Users,
  type LucideIcon
} from 'lucide-react';

interface DemoShellProps {
  children: React.ReactNode;
  data: AppData;
  currentView: ViewMode;
  selectedSubjectId: string | null;
  onSelectView: (view: ViewMode) => void;
  onSelectSubject: (subjectId: string) => void;
}

type NavItem = { label: string; view: ViewMode; icon: LucideIcon };
const navItems: NavItem[] = [
  { label: 'Panel general', view: 'dashboard', icon: LayoutDashboard },
  { label: 'Matrícula completa', view: 'matricula', icon: Users },
  { label: 'Materias y talleres', view: 'materias', icon: BookOpen },
  { label: 'Trabajadores', view: 'trabajadores', icon: BriefcaseBusiness },
  { label: 'Estadísticas', view: 'estadisticas', icon: BarChart3 },
  { label: 'Respaldo', view: 'respaldo', icon: ClipboardCheck }
];

export const DemoShell: React.FC<DemoShellProps> = ({ children, data, currentView, selectedSubjectId, onSelectView, onSelectSubject }) => {
  const todayLabel = new Intl.DateTimeFormat('es-AR', {
    weekday: 'long', day: 'numeric', month: 'long', timeZone: 'America/Argentina/Buenos_Aires'
  }).format(new Date());

  return (
    <div className="min-h-screen bg-[#f4f7fb] text-slate-900">
      <div className="flex min-h-screen">
        <aside className="hidden w-[258px] shrink-0 flex-col bg-[#111d35] text-slate-200 lg:flex">
          <div className="flex h-[76px] items-center gap-3 border-b border-white/10 px-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500 text-white shadow-lg shadow-blue-950/40"><GraduationCap className="h-5 w-5" /></div>
            <div className="leading-tight"><p className="text-sm font-bold tracking-wide text-white">CPU BATÁN</p><p className="mt-1 text-[10px] font-medium uppercase tracking-[0.14em] text-slate-400">Gestión académica</p></div>
          </div>
          <div className="px-4 pt-7">
            <p className="px-3 pb-3 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">Espacio de trabajo</p>
            <nav className="space-y-1" aria-label="Navegación de la demo">
              {navItems.map(({ label, view, icon: Icon }) => {
                const active = currentView === view;
                return <button key={view} type="button" onClick={() => onSelectView(view)} className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[13px] font-medium transition ${active ? 'bg-blue-500 text-white shadow-md shadow-blue-950/30' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}>
                  <Icon className="h-[17px] w-[17px] shrink-0" /><span className="flex-1">{label}</span>{active && <ChevronRight className="h-4 w-4 opacity-80" />}
                </button>;
              })}
            </nav>
          </div>
          <div className="px-4 pt-7">
            <p className="px-3 pb-3 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">Acceso a las listas</p>
            <div className="max-h-[30vh] space-y-1 overflow-y-auto">
              {data.materias.map(subject => <button key={subject.id} type="button" onClick={() => { onSelectSubject(subject.id); onSelectView('asistencia'); }} className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-xs transition ${currentView === 'asistencia' && selectedSubjectId === subject.id ? 'bg-white/10 text-white' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}><span className="h-2 w-2 shrink-0 rounded-full bg-emerald-400" /><span className="truncate">{subject.nombre}</span></button>)}
              {!data.materias.length && <p className="px-3 text-xs text-slate-500">No hay materias de ejemplo</p>}
            </div>
          </div>
          <div className="mt-auto p-4">
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3.5">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-200"><ShieldCheck className="h-4 w-4 text-emerald-400" /> Entorno de prueba</div>
              <p className="mt-2 text-[11px] leading-4 text-slate-400">Datos inventados. Los cambios no se guardan ni llegan al sistema real.</p>
            </div>
            <p className="mt-4 text-center text-[10px] text-slate-600">CPU Batán · Panel de asistencia</p>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 flex min-h-[76px] items-center justify-between gap-4 border-b border-slate-200 bg-white/95 px-4 shadow-sm shadow-slate-200/40 backdrop-blur sm:px-7 lg:px-9">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-[11px] font-medium capitalize text-slate-400"><span>CPU Batán</span><span>/</span><span className="text-slate-500">{navItems.find(item => item.view === currentView)?.label || (currentView === 'asistencia' ? 'Asistencia' : 'Sistema')}</span></div>
              <p className="mt-1 truncate text-sm font-semibold text-slate-800 sm:text-base">{todayLabel}</p>
            </div>
            <div className="flex shrink-0 items-center gap-2 sm:gap-3">
              <div className="hidden h-10 w-64 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 text-slate-400 xl:flex"><Search className="h-4 w-4" /><span className="text-xs">Vista previa del sistema</span></div>
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-[11px] font-semibold text-emerald-700"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Demo</span>
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 text-blue-700"><span className="text-xs font-bold">CPU</span></div>
            </div>
          </header>
          <div className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-center text-[11px] font-semibold text-amber-900 sm:text-xs">
            DEMO DE PRUEBA <span className="mx-1 text-amber-400">·</span> Datos ficticios, sin conexión ni cambios al sistema real
          </div>
          <div className="flex-1 p-4 sm:p-6 lg:p-9">
            <div className="mx-auto w-full max-w-[1440px]">{children}</div>
          </div>
          <nav className="sticky bottom-0 z-20 grid grid-cols-5 border-t border-slate-200 bg-white px-1 py-2 lg:hidden" aria-label="Navegación móvil de la demo">
            {navItems.slice(0, 5).map(({ label, view, icon: Icon }) => <button key={view} type="button" onClick={() => onSelectView(view)} className={`flex flex-col items-center gap-1 px-1 py-1 text-[9px] font-medium ${currentView === view ? 'text-blue-700' : 'text-slate-500'}`}><Icon className="h-4 w-4" /><span className="max-w-full truncate">{label.replace(' y talleres', '')}</span></button>)}
          </nav>
        </div>
      </div>
    </div>
  );
};
