import React from 'react';
import { AppData, ViewMode } from '../types';
import {
  Users,
  BookOpen,
  Briefcase,
  TrendingUp,
  ArrowRight,
  ShieldAlert,
  CheckCircle2,
  CalendarDays,
  Clock3,
  ChevronRight,
  GraduationCap,
  CircleCheck,
  ClipboardCheck
} from 'lucide-react';
import { todayISODate } from '../utils/dates';
import { summarizeAttendance } from '../utils/attendance';

interface DashboardViewProps {
  data: AppData;
  onSelectView: (view: ViewMode) => void;
  onSelectSubject: (subjectId: string) => void;
  darkMode: boolean;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  data,
  onSelectView,
  onSelectSubject,
  darkMode
}) => {
  const totalAlumnos = data.alumnos.length;
  const totalMaterias = data.materias.length;
  const totalTrabajadores = data.trabajadores.length;
  const trabajadores = data.trabajadores || [];

  // Mantiene el mismo denominador y las mismas reglas de elegibilidad que Asistencia.
  const attendanceTotals = data.materias.reduce((all, subject) => {
    const current = summarizeAttendance(subject, trabajadores);
    all.presentes += current.presentes;
    all.posibles += current.posibles;
    return all;
  }, { presentes: 0, posibles: 0 });
  const avgAttendance = attendanceTotals.posibles > 0
    ? Math.round(attendanceTotals.presentes / attendanceTotals.posibles * 100)
    : 0;

  const today = todayISODate();
  const todayLabel = new Intl.DateTimeFormat('es-AR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    timeZone: 'America/Argentina/Buenos_Aires'
  }).format(new Date());
  let carnetsVencidos = 0;
  let carnetsVencidosInactivos = 0;
  let carnetsProximos = 0;

  data.alumnos.forEach(alu => {
    if (!alu.fecha_vencimiento_carnet) return;
    if (alu.fecha_vencimiento_carnet < today) {
      carnetsVencidos++;
      if (alu.estado === 'inactivo') carnetsVencidosInactivos++;
      return;
    }
    const diffTime = new Date(`${alu.fecha_vencimiento_carnet}T00:00:00`).getTime() - new Date(`${today}T00:00:00`).getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays <= 30) carnetsProximos++;
  });

  const panel = darkMode
    ? 'border-slate-800 bg-slate-900/80 text-slate-100 shadow-black/10'
    : 'border-slate-200 bg-white text-slate-900 shadow-slate-200/60';
  const muted = darkMode ? 'text-slate-400' : 'text-slate-500';
  const firstSubject = data.materias[0];
  const openFirstAttendance = () => {
    if (!firstSubject) return;
    onSelectSubject(firstSubject.id);
    onSelectView('asistencia');
  };

  const metrics = [
    {
      label: 'Alumnos en el padrón',
      value: totalAlumnos,
      caption: 'Matrícula completa',
      icon: Users,
      tone: 'blue',
      action: () => onSelectView('matricula')
    },
    {
      label: 'Materias y talleres',
      value: totalMaterias,
      caption: 'Con sus listas independientes',
      icon: BookOpen,
      tone: 'violet',
      action: () => onSelectView('materias')
    },
    {
      label: 'Trabajadores CPU',
      value: totalTrabajadores,
      caption: 'Personal institucional',
      icon: Briefcase,
      tone: 'amber',
      action: () => onSelectView('trabajadores')
    },
    {
      label: 'Asistencia acumulada',
      value: `${avgAttendance}%`,
      caption: attendanceTotals.posibles > 0
        ? `${attendanceTotals.presentes.toLocaleString('es-AR')} presentes de ${attendanceTotals.posibles.toLocaleString('es-AR')} registros posibles`
        : 'Se calcula al cargar fechas de clase',
      icon: TrendingUp,
      tone: 'emerald',
      action: () => onSelectView('estadisticas')
    }
  ] as const;

  const toneClasses = {
    blue: darkMode ? 'bg-blue-500/15 text-blue-300 ring-blue-400/20' : 'bg-blue-50 text-blue-700 ring-blue-100',
    violet: darkMode ? 'bg-violet-500/15 text-violet-300 ring-violet-400/20' : 'bg-violet-50 text-violet-700 ring-violet-100',
    amber: darkMode ? 'bg-amber-500/15 text-amber-300 ring-amber-400/20' : 'bg-amber-50 text-amber-700 ring-amber-100',
    emerald: darkMode ? 'bg-emerald-500/15 text-emerald-300 ring-emerald-400/20' : 'bg-emerald-50 text-emerald-700 ring-emerald-100'
  };

  return (
    <div className="space-y-6 sm:space-y-7">
      <section className={`relative isolate overflow-hidden rounded-3xl border p-5 shadow-sm sm:p-7 lg:p-8 ${darkMode ? 'border-blue-900/70 bg-gradient-to-br from-slate-900 via-slate-900 to-blue-950' : 'border-blue-100 bg-gradient-to-br from-white via-blue-50 to-indigo-100'}`}>
        <div aria-hidden="true" className="pointer-events-none absolute -right-12 -top-24 h-72 w-72 rounded-full bg-blue-500/10 blur-3xl" />
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-28 right-1/3 h-56 w-56 rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className={`mb-4 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${darkMode ? 'border-blue-800/80 bg-blue-950/60 text-blue-200' : 'border-blue-200 bg-white/80 text-blue-800'}`}>
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              CPU BATÁN <span className={darkMode ? 'text-blue-400' : 'text-blue-300'}>·</span> CONTROL DE ASISTENCIA
            </div>
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Panel general</h2>
            <p className={`mt-2 max-w-xl text-sm leading-6 sm:text-base ${muted}`}>
              Matrícula, materias y asistencias en un solo lugar. Elegí una materia para abrir su lista y registrar una clase.
            </p>
            <p className={`mt-4 flex items-center gap-2 text-xs font-medium capitalize ${muted}`}>
              <CalendarDays className="h-4 w-4" /> {todayLabel}
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={openFirstAttendance}
              disabled={!firstSubject}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-900/15 transition hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ClipboardCheck className="h-4 w-4" /> Registrar asistencia <ArrowRight className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => onSelectView('matricula')}
              className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 ${darkMode ? 'border-slate-700 bg-slate-900/70 text-slate-200 hover:bg-slate-800' : 'border-slate-200 bg-white/80 text-slate-700 hover:bg-white'}`}
            >
              <GraduationCap className="h-4 w-4" /> Abrir matrícula
            </button>
          </div>
        </div>
      </section>

      <section aria-label="Resumen institucional" className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map(({ label, value, caption, icon: Icon, tone, action }) => (
          <button
            key={label}
            type="button"
            onClick={action}
            className={`group min-w-0 rounded-2xl border p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 sm:p-5 ${panel}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className={`text-xs font-semibold uppercase tracking-wide ${muted}`}>{label}</p>
                <p className="mt-2 text-3xl font-bold tracking-tight tabular-nums">{value}</p>
              </div>
              <span className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ring-1 ${toneClasses[tone]}`}>
                <Icon className="h-5 w-5" />
              </span>
            </div>
            <div className="mt-4 flex min-h-8 items-start justify-between gap-2">
              <p className={`text-xs leading-5 ${muted}`}>{caption}</p>
              <ChevronRight className={`mt-0.5 h-4 w-4 shrink-0 transition group-hover:translate-x-0.5 ${muted}`} />
            </div>
          </button>
        ))}
      </section>

      {(carnetsVencidos > 0 || carnetsProximos > 0) && (
        <section className={`flex flex-col gap-4 rounded-2xl border p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5 ${darkMode ? 'border-amber-800/70 bg-amber-950/30 text-amber-100' : 'border-amber-200 bg-amber-50 text-amber-950'}`}>
          <div className="flex min-w-0 items-start gap-3">
            <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white shadow-sm"><ShieldAlert className="h-5 w-5" /></span>
            <div className="min-w-0">
              <h3 className="font-semibold">Atención a vencimientos de carnets</h3>
              <p className={`mt-1 text-sm leading-5 ${darkMode ? 'text-amber-200/80' : 'text-amber-800'}`}>
                {carnetsVencidosInactivos > 0
                  ? `${carnetsVencidosInactivos} carnets vencidos corresponden a titulares que figuran inactivos.`
                  : `${carnetsVencidos} carnet${carnetsVencidos === 1 ? '' : 's'} vencido${carnetsVencidos === 1 ? '' : 's'}.`}
                {carnetsProximos > 0 ? ` Además, ${carnetsProximos} próximo${carnetsProximos === 1 ? '' : 's'} a vencer dentro de 30 días.` : ''}
              </p>
              <p className={`mt-1 text-xs ${darkMode ? 'text-amber-300/70' : 'text-amber-700'}`}>
                En las fichas se conserva el detalle del estado y sus observaciones.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onSelectView('matricula')}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2"
          >
            Revisar matrícula <ArrowRight className="h-4 w-4" />
          </button>
        </section>
      )}

      <section className={`overflow-hidden rounded-2xl border shadow-sm ${panel}`}>
        <div className={`flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5 ${darkMode ? 'border-slate-800' : 'border-slate-100'}`}>
          <div>
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-blue-500" />
              <h3 className="text-base font-bold sm:text-lg">Materias y talleres</h3>
            </div>
            <p className={`mt-1 text-xs sm:text-sm ${muted}`}>Entrá a cada lista para tomar asistencia y consultar sus fechas.</p>
          </div>
          <button
            type="button"
            onClick={() => onSelectView('materias')}
            className={`inline-flex items-center gap-1.5 self-start rounded-lg px-3 py-2 text-xs font-semibold transition sm:self-auto ${darkMode ? 'text-blue-300 hover:bg-slate-800' : 'text-blue-700 hover:bg-blue-50'}`}
          >
            Gestionar materias <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {data.materias.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <span className={`mx-auto inline-flex h-12 w-12 items-center justify-center rounded-2xl ${darkMode ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-500'}`}><BookOpen className="h-6 w-6" /></span>
            <p className="mt-3 font-semibold">Todavía no hay materias cargadas</p>
            <p className={`mt-1 text-sm ${muted}`}>Cuando agregues una, va a aparecer acá para entrar directo a su asistencia.</p>
            <button type="button" onClick={() => onSelectView('materias')} className="mt-4 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500">Crear o revisar materias</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 p-3 sm:grid-cols-2 sm:p-4 xl:grid-cols-3">
            {data.materias.map(subject => {
              const summary = summarizeAttendance(subject, trabajadores);
              return (
                <button
                  key={subject.id}
                  type="button"
                  onClick={() => {
                    onSelectSubject(subject.id);
                    onSelectView('asistencia');
                  }}
                  className={`group min-w-0 rounded-xl border p-4 text-left transition hover:-translate-y-0.5 hover:border-blue-400 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-400 ${darkMode ? 'border-slate-800 bg-slate-950/60 hover:bg-slate-900' : 'border-slate-200 bg-slate-50/70 hover:bg-white'}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-start gap-3">
                      <span className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${darkMode ? 'bg-blue-500/15 text-blue-300' : 'bg-blue-100 text-blue-700'}`}><BookOpen className="h-5 w-5" /></span>
                      <div className="min-w-0">
                        <h4 className="break-words font-semibold leading-5 group-hover:text-blue-500">{subject.nombre}</h4>
                        {subject.horario ? <p className={`mt-1 flex items-center gap-1.5 text-xs ${muted}`}><Clock3 className="h-3.5 w-3.5" />{subject.horario}</p> : <p className={`mt-1 text-xs ${muted}`}>Horario no especificado</p>}
                      </div>
                    </div>
                    <ArrowRight className={`mt-1 h-4 w-4 shrink-0 transition group-hover:translate-x-0.5 ${muted}`} />
                  </div>
                  <div className={`mt-4 grid grid-cols-3 gap-2 border-t pt-3 ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>
                    <div>
                      <p className={`text-[10px] font-medium uppercase tracking-wide ${muted}`}>Registros</p>
                      <p className="mt-1 text-sm font-semibold tabular-nums">{subject.alumnos.length}</p>
                    </div>
                    <div>
                      <p className={`text-[10px] font-medium uppercase tracking-wide ${muted}`}>Clases</p>
                      <p className="mt-1 text-sm font-semibold tabular-nums">{(subject.fechas || []).length}</p>
                    </div>
                    <div>
                      <p className={`text-[10px] font-medium uppercase tracking-wide ${muted}`}>Asistencia</p>
                      <p className="mt-1 flex items-center gap-1 text-sm font-semibold tabular-nums"><CircleCheck className="h-3.5 w-3.5 text-emerald-500" />{summary.porcentaje}%</p>
                    </div>
                  </div>
                  <div className={`mt-3 h-1.5 overflow-hidden rounded-full ${darkMode ? 'bg-slate-800' : 'bg-slate-200'}`}>
                    <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${summary.porcentaje}%` }} />
                  </div>
                  <p className={`mt-2 text-[11px] ${muted}`}>{summary.presentes.toLocaleString('es-AR')} presentes de {summary.posibles.toLocaleString('es-AR')} registros posibles</p>
                </button>
              );
            })}
          </div>
        )}
      </section>

      <div className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-xs leading-5 ${darkMode ? 'border-slate-800 bg-slate-900/50 text-slate-400' : 'border-slate-200 bg-white text-slate-500'}`}>
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
        <p>Los indicadores se calculan con las materias y fechas cargadas. La asistencia de cada alumno se consulta desde su lista de materia; el panel no modifica inscripciones ni registros.</p>
      </div>
    </div>
  );
};
