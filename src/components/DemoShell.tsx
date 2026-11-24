import React, { useState } from 'react';
import { AppData, ViewMode } from '../types';
import {
  Activity,
  BarChart3,
  BookOpen,
  BriefcaseBusiness,
  CalendarCheck,
  ChevronRight,
  ClipboardCheck,
  GraduationCap,
  LayoutDashboard,
  Menu,
  ShieldCheck,
  Users,
  X,
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const activeView = navItems.find(item => item.view === currentView);
  const title = currentView === 'asistencia'
    ? data.materias.find(item => item.id === selectedSubjectId)?.nombre || 'Asistencia'
    : activeView?.label || 'Panel general';
  const date = new Intl.DateTimeFormat('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'America/Argentina/Buenos_Aires' }).format(new Date());

  const chooseView = (view: ViewMode) => { onSelectView(view); setMobileMenuOpen(false); };
  const sidebar = (
    <aside className={`ref-sidebar ${mobileMenuOpen ? 'ref-sidebar-open' : ''}`}>
      <div className="ref-brand">
        <span className="ref-brand-mark"><GraduationCap size={23} /></span>
        <span className="ref-brand-copy"><strong>CPU BATÁN</strong><small>Gestión de asistencia</small></span>
        <button className="ref-close-menu" type="button" onClick={() => setMobileMenuOpen(false)} aria-label="Cerrar menú"><X size={18} /></button>
      </div>
      <p className="ref-nav-heading">Panel institucional</p>
      <nav className="ref-nav" aria-label="Navegación principal">
        {navItems.map(({ label, view, icon: Icon }) => <button key={view} type="button" onClick={() => chooseView(view)} className={`ref-nav-item ${currentView === view ? 'active' : ''}`}><span className="ref-nav-icon"><Icon size={17} /></span><span>{label}</span>{currentView === view && <ChevronRight className="ref-nav-arrow" size={16} />}</button>)}
      </nav>
      <p className="ref-nav-heading ref-subject-heading">Asistencias por materia</p>
      <nav className="ref-subject-nav" aria-label="Listas de asistencia">
        {data.materias.map(subject => <button key={subject.id} type="button" onClick={() => { onSelectSubject(subject.id); chooseView('asistencia'); }} className={`ref-subject-link ${currentView === 'asistencia' && selectedSubjectId === subject.id ? 'active' : ''}`}><span className="ref-subject-dot" /><span>{subject.nombre}</span></button>)}
      </nav>
      <div className="ref-sidebar-footer"><span className="ref-online-dot" /><span>Demo con datos ficticios</span></div>
      <div className="ref-sidebar-branding"><ShieldCheck size={15} /> CPU Batán <span>·</span> vista previa</div>
    </aside>
  );

  return (
    <div className="reference-demo">
      <div className="ref-app-shell">
        {sidebar}
        {mobileMenuOpen && <button type="button" className="ref-sidebar-scrim" aria-label="Cerrar menú" onClick={() => setMobileMenuOpen(false)} />}
        <main className="ref-main-content">
          <header className="ref-topbar">
            <div className="ref-heading-group">
              <p className="ref-page-kicker">CPU BATÁN <span>/</span> Control de asistencia</p>
              <h1 className="ref-page-title">{currentView === 'dashboard' ? 'Panel general' : title}</h1>
              <p className="ref-page-subtitle">{currentView === 'dashboard' ? 'Resumen de matrícula, asistencia y actividad institucional.' : `Gestión institucional · ${date}`}</p>
            </div>
            <div className="ref-topbar-actions">
              <span className="ref-date-pill"><CalendarCheck size={15} /> {date}</span>
              <button className="ref-mobile-menu" type="button" onClick={() => setMobileMenuOpen(true)} aria-label="Abrir menú"><Menu size={19} /></button>
            </div>
          </header>
          <div className="ref-demo-notice"><span className="ref-demo-pulse" /> DEMO DE PRUEBA <span className="ref-notice-separator">·</span> Datos ficticios, aislados del sistema real</div>
          <div className="ref-main-content-inner">{children}</div>
          <footer className="ref-footer"><span><Activity size={14} /> CPU Batán · Panel de control de asistencia</span><span>Entorno de demostración</span></footer>
        </main>
      </div>
    </div>
  );
};
