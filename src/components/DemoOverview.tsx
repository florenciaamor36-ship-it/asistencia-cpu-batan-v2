import React from 'react';
import { AppData, ViewMode } from '../types';
import { Activity, ArrowUpRight, BookOpen, CalendarCheck, Check, ChevronRight, Clock3, GraduationCap, Users, UserRoundCheck } from 'lucide-react';
import { summarizeAttendance } from '../utils/attendance';

interface DemoOverviewProps {
  data: AppData;
  onSelectView: (view: ViewMode) => void;
  onSelectSubject: (id: string) => void;
}

const shortName = (name: string) => name.trim().split(/\s+/).map(part => part[0]).slice(0, 2).join('').toUpperCase();

export const DemoOverview: React.FC<DemoOverviewProps> = ({ data, onSelectView, onSelectSubject }) => {
  const enrolled = data.alumnos.length;
  const workers = data.trabajadores.length;
  const totalClasses = data.materias.reduce((sum, item) => sum + (item.fechas?.length || 0), 0);
  const totals = data.materias.reduce((sum, item) => {
    const summary = summarizeAttendance(item, data.trabajadores || []);
    sum.present += summary.presentes;
    sum.possible += summary.posibles;
    return sum;
  }, { present: 0, possible: 0 });
  const attendanceRate = totals.possible ? Math.round(totals.present / totals.possible * 100) : 0;
  const today = new Intl.DateTimeFormat('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'America/Argentina/Buenos_Aires' }).format(new Date());
  const subjectSummaries = data.materias.map(subject => ({
    subject,
    summary: summarizeAttendance(subject, data.trabajadores || []),
    roster: subject.alumnos.length
  }));
  const activity = [
    ...subjectSummaries.slice(0, 2).map(({ subject, roster, summary }) => ({
      initials: 'AS', tone: 'blue', title: 'Asistencia actualizada', note: `${subject.nombre} · ${summary.presentes} presentes de ${roster} registros`,
      time: subject.horario || 'Registro de clase', kind: 'attendance' as const, subjectId: subject.id
    })),
    { initials: 'MT', tone: 'violet', title: 'Materia disponible', note: `${data.materias[0]?.nombre || 'Nueva materia'} · lista de alumnos`, time: 'Panel institucional', kind: 'subject' as const, subjectId: data.materias[0]?.id || '' },
    { initials: 'CP', tone: 'amber', title: 'Personal institucional', note: `${workers} trabajadores en la nómina`, time: 'CPU Batán', kind: 'workers' as const, subjectId: '' }
  ];
  const colors = [
    { bar: 'bg-blue-500', tint: 'bg-blue-50 text-blue-700', dot: 'bg-blue-500' },
    { bar: 'bg-violet-500', tint: 'bg-violet-50 text-violet-700', dot: 'bg-violet-500' },
    { bar: 'bg-emerald-500', tint: 'bg-emerald-50 text-emerald-700', dot: 'bg-emerald-500' },
    { bar: 'bg-amber-500', tint: 'bg-amber-50 text-amber-700', dot: 'bg-amber-500' }
  ];

  return (
    <div className="space-y-6 text-slate-800">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-600">Centro de Producción y Universitario</p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Panel general</h1>
          <p className="mt-1 text-sm capitalize text-slate-500">{today} <span className="mx-1 text-slate-300">·</span> Resumen de actividad institucional</p>
        </div>
        <button type="button" onClick={() => onSelectView('estadisticas')} className="inline-flex items-center justify-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 sm:self-auto"><Activity className="h-4 w-4" /> Ver estadísticas <ArrowUpRight className="h-4 w-4" /></button>
      </div>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-4" aria-label="Indicadores principales">
        {[
          { title: 'Alumnos registrados', value: enrolled, suffix: 'en padrón de matrícula', icon: Users, accent: 'text-blue-600', bg: 'bg-blue-50', sub: 'Matrícula vigente' },
          { title: 'Materias activas', value: data.materias.length, suffix: 'listas independientes', icon: BookOpen, accent: 'text-violet-600', bg: 'bg-violet-50', sub: 'Cursos y talleres' },
          { title: 'Presentes acumulados', value: `${attendanceRate}%`, suffix: `${totals.present} de ${totals.possible} registros`, icon: UserRoundCheck, accent: 'text-emerald-600', bg: 'bg-emerald-50', sub: 'Asistencia registrada' },
          { title: 'Clases registradas', value: totalClasses, suffix: `${workers} trabajadores institucionales`, icon: CalendarCheck, accent: 'text-amber-600', bg: 'bg-amber-50', sub: 'Fechas cargadas' }
        ].map(({ title, value, suffix, icon: Icon, accent, bg, sub }) => (
          <article key={title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/60 transition hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex items-start justify-between gap-3"><div><p className="text-xs font-semibold text-slate-500">{title}</p><p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">{value}</p></div><span className={`flex h-11 w-11 items-center justify-center rounded-xl ${bg} ${accent}`}><Icon className="h-5 w-5" /></span></div>
            <div className="mt-4 flex items-center justify-between gap-2 border-t border-slate-100 pt-3"><span className="text-[11px] font-medium text-slate-500">{sub}</span><span className="truncate text-right text-[10px] text-slate-400">{suffix}</span></div>
          </article>
        ))}
      </section>

      <section className="grid grid-cols-1 gap-5 2xl:grid-cols-[1.45fr_1fr]">
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/60 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-base font-bold text-slate-900">Asistencia por materia</h2><p className="mt-1 text-xs text-slate-500">Porcentaje de presentes sobre los registros posibles</p></div><span className="rounded-lg bg-slate-50 px-2.5 py-1.5 text-[10px] font-semibold text-slate-500">{data.materias.length} materias</span></div>
          {subjectSummaries.length ? <div className="mt-6 space-y-5">
            {subjectSummaries.map(({ subject, summary, roster }, index) => {
              const color = colors[index % colors.length];
              return <button key={subject.id} type="button" onClick={() => { onSelectSubject(subject.id); onSelectView('asistencia'); }} className="group w-full text-left">
                <div className="mb-2 flex items-center justify-between gap-3"><span className="truncate text-xs font-semibold text-slate-700 group-hover:text-blue-700">{subject.nombre}</span><span className="shrink-0 text-xs font-bold tabular-nums text-slate-700">{summary.porcentaje}%</span></div>
                <div className="h-2.5 overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full ${color.bar} transition-all`} style={{ width: `${summary.porcentaje}%` }} /></div>
                <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-400"><span>{summary.presentes} presentes · {summary.ausentes} ausentes · {summary.justificados} justificados</span><span>{roster} registros</span></div>
              </button>;
            })}
          </div> : <EmptyState title="No hay materias para mostrar" action="Abrir gestión de materias" onClick={() => onSelectView('materias')} />}
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/60 sm:p-6">
          <div className="flex items-start justify-between gap-3"><div><h2 className="text-base font-bold text-slate-900">Actividad reciente</h2><p className="mt-1 text-xs text-slate-500">Resumen de las listas de asistencia</p></div><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-50 text-slate-500"><Clock3 className="h-4 w-4" /></span></div>
          <div className="mt-4 divide-y divide-slate-100">
            {activity.map((item, index) => <button key={`${item.title}-${index}`} type="button" onClick={() => item.kind === 'workers' ? onSelectView('trabajadores') : item.subjectId ? (onSelectSubject(item.subjectId), onSelectView('asistencia')) : onSelectView('dashboard')} className="flex w-full items-start gap-3 py-3 text-left first:pt-1 last:pb-1">
              <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${item.tone === 'blue' ? 'bg-blue-50 text-blue-700' : item.tone === 'violet' ? 'bg-violet-50 text-violet-700' : 'bg-amber-50 text-amber-700'}`}>{item.initials}</span>
              <span className="min-w-0 flex-1"><span className="block text-xs font-semibold text-slate-800">{item.title}</span><span className="mt-1 block text-[11px] leading-4 text-slate-500">{item.note}</span><span className="mt-1.5 block text-[10px] text-slate-400">{item.time}</span></span>
              <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-slate-300" />
            </button>)}
          </div>
        </article>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/60 sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-3"><div><h2 className="text-base font-bold text-slate-900">Materias y talleres</h2><p className="mt-1 text-xs text-slate-500">Acceso directo a cada nómina y sus clases</p></div><button type="button" onClick={() => onSelectView('materias')} className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 hover:text-blue-900">Ver todas <ChevronRight className="h-4 w-4" /></button></div>
        {subjectSummaries.length ? <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 2xl:grid-cols-3">
          {subjectSummaries.map(({ subject, summary, roster }, index) => <button key={subject.id} type="button" onClick={() => { onSelectSubject(subject.id); onSelectView('asistencia'); }} className="rounded-xl border border-slate-200 bg-white p-4 text-left transition hover:border-blue-300 hover:bg-blue-50/40 hover:shadow-sm">
            <div className="flex items-start justify-between gap-3"><span className={`flex h-9 w-9 items-center justify-center rounded-lg ${colors[index % colors.length].tint}`}><BookOpen className="h-4 w-4" /></span><ChevronRight className="h-4 w-4 text-slate-300" /></div>
            <h3 className="mt-3 text-sm font-bold text-slate-800">{subject.nombre}</h3>
            <p className="mt-1 text-[11px] text-slate-500">{subject.dias?.join(', ') || 'Días a confirmar'}{subject.horario ? ` · ${subject.horario}` : ''}</p>
            <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 text-[10px] text-slate-500"><span className="inline-flex items-center gap-1"><Users className="h-3.5 w-3.5" />{roster} registros</span><span className="inline-flex items-center gap-1"><CalendarDaysIcon />{subject.fechas?.length || 0} clases</span><span className="font-bold text-emerald-700">{summary.porcentaje}%</span></div>
          </button>)}
        </div> : <EmptyState title="Todavía no hay materias cargadas" action="Abrir materias" onClick={() => onSelectView('materias')} />}
      </section>

      <div className="flex items-center gap-2 rounded-xl border border-blue-100 bg-blue-50/70 px-4 py-3 text-[11px] leading-5 text-blue-900"><Check className="h-4 w-4 shrink-0 text-blue-600" /><span>Datos inventados para esta demo. Los indicadores usan únicamente las listas y fechas de ejemplo; no se conectan al padrón real.</span></div>
    </div>
  );
};

const CalendarDaysIcon = () => <CalendarCheck className="h-3.5 w-3.5" />;

const EmptyState: React.FC<{ title: string; action: string; onClick: () => void }> = ({ title, action, onClick }) => <div className="py-8 text-center"><GraduationCap className="mx-auto h-8 w-8 text-slate-300" /><p className="mt-2 text-sm font-semibold text-slate-600">{title}</p><button type="button" onClick={onClick} className="mt-3 inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white">{action}<ChevronRight className="h-3.5 w-3.5" /></button></div>;
