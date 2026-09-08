import React from 'react';
import { AppData, ViewMode } from '../types';
import { Users, BookOpen, Briefcase, CalendarCheck, TrendingUp, ArrowRight, ShieldAlert, CheckCircle2 } from 'lucide-react';

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

  // Calculate overall attendance rate
  let totalRecords = 0;
  let presentRecords = 0;

  data.materias.forEach(m => {
    m.alumnos.forEach(a => {
      if (a.asist) {
        Object.values(a.asist).forEach(val => {
          if (val !== undefined && val !== '') {
            totalRecords++;
            if (val === true || val === 'presente') {
              presentRecords++;
            }
          }
        });
      }
    });
  });

  const avgAttendance = totalRecords > 0 ? Math.round((presentRecords / totalRecords) * 100) : 0;

  // Carnet status counts
  const today = new Date().toISOString().split('T')[0];
  let carnetsVencidos = 0;
  let carnetsVencidosInactivos = 0;
  let carnetsProximos = 0;

  data.alumnos.forEach(alu => {
    if (alu.fecha_vencimiento_carnet) {
      if (alu.fecha_vencimiento_carnet < today) {
        carnetsVencidos++;
        if (alu.estado === 'inactivo') carnetsVencidosInactivos++;
      } else {
        const diffTime = new Date(alu.fecha_vencimiento_carnet).getTime() - new Date(today).getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays <= 30) {
          carnetsProximos++;
        }
      }
    }
  });

  const cardClass = `p-6 rounded-2xl border shadow-xs flex items-center justify-between transition-all duration-200 ${
    darkMode ? 'bg-slate-800/80 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800'
  }`;

  return (
    <div className="space-y-6">
      {/* Welcome banner */}
      <div className={`p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-blue-700 to-indigo-800 text-white shadow-lg relative overflow-hidden`}>
        <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none"></div>
        <div className="relative z-10 max-w-3xl">
          <span className="inline-block px-3 py-1 rounded-full bg-blue-600/60 text-blue-100 text-xs font-semibold uppercase tracking-wider mb-3">
            Centro de Producción y Universitario — Batán
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Control de Asistencia y Matrícula
          </h2>
          <p className="mt-2 text-blue-100 text-sm sm:text-base leading-relaxed">
            Plataforma institucional segura para el registro de clases, gestión de alumnos, trabajadores y seguimiento estadístico en tiempo real.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={() => onSelectView('matricula')}
              className="px-4 py-2.5 rounded-xl bg-white text-blue-900 font-semibold text-sm shadow-sm hover:bg-blue-50 transition flex items-center space-x-2"
            >
              <Users className="w-4 h-4" />
              <span>Ver Matrícula ({totalAlumnos})</span>
            </button>
            <button
              onClick={() => onSelectView('estadisticas')}
              className="px-4 py-2.5 rounded-xl bg-blue-600/40 border border-blue-400/40 text-white font-semibold text-sm hover:bg-blue-600/60 transition flex items-center space-x-2"
            >
              <TrendingUp className="w-4 h-4" />
              <span>Ver Estadísticas</span>
            </button>
          </div>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div onClick={() => onSelectView('matricula')} className={`${cardClass} cursor-pointer hover:border-blue-500`}>
          <div>
            <p className={`text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Total Alumnos</p>
            <p className="text-3xl font-bold mt-1">{totalAlumnos}</p>
            <span className="inline-flex items-center text-xs text-emerald-500 mt-2 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Activos en padrón
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div onClick={() => onSelectView('dashboard')} className={cardClass}>
          <div>
            <p className={`text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Materias / Talleres</p>
            <p className="text-3xl font-bold mt-1">{totalMaterias}</p>
            <span className="inline-flex items-center text-xs text-blue-500 mt-2 font-medium">
              Activas este cuatrimestre
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <BookOpen className="w-6 h-6" />
          </div>
        </div>

        <div onClick={() => onSelectView('trabajadores')} className={`${cardClass} cursor-pointer hover:border-indigo-500`}>
          <div>
            <p className={`text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Trabajadores CPU</p>
            <p className="text-3xl font-bold mt-1">{totalTrabajadores}</p>
            <span className="inline-flex items-center text-xs text-purple-500 mt-2 font-medium">
              Personal institucional
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-950/50 flex items-center justify-center text-purple-600 dark:text-purple-400">
            <Briefcase className="w-6 h-6" />
          </div>
        </div>

        <div onClick={() => onSelectView('estadisticas')} className={`${cardClass} cursor-pointer hover:border-emerald-500`}>
          <div>
            <p className={`text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Asistencia Promedio</p>
            <p className="text-3xl font-bold mt-1">{avgAttendance}%</p>
            <span className="inline-flex items-center text-xs text-emerald-500 mt-2 font-medium">
              Presencialidad general
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <CalendarCheck className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Carnet Alerts Warning (if any) */}
      {(carnetsVencidos > 0 || carnetsProximos > 0) && (
        <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
          darkMode ? 'bg-amber-950/30 border-amber-800/60 text-amber-200' : 'bg-amber-50 border-amber-200 text-amber-800'
        }`}>
          <div className="flex min-w-0 items-start space-x-3">
            <div className="p-2 rounded-xl bg-amber-500 text-white">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-sm break-words">Alertas de Carnets Institucionales</p>
              <p className="text-xs opacity-90 mt-0.5">
                {carnetsVencidosInactivos > 0
                  ? `${carnetsVencidosInactivos} carnets están vencidos y sus titulares figuran INACTIVOS porque no tienen renovación vigente. En cada ficha se detalla si fue por asistencia insuficiente o por no registrar asistencias.`
                  : `Hay ${carnetsVencidos} carnets vencidos`}
                {carnetsProximos > 0 ? ` y ${carnetsProximos} próximos a vencer en los próximos 30 días.` : '.'}
              </p>
            </div>
          </div>
          <button
            onClick={() => onSelectView('matricula')}
            className="shrink-0 whitespace-nowrap px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-xs transition"
          >
            Revisar Matrícula
          </button>
        </div>
      )}

      {/* Quick Access Subjects */}
      <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-800/80 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800'}`}>
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <h3 className="text-lg font-bold">Materias y Talleres Activos</h3>
          <span className={`text-xs px-2.5 py-1 rounded-full ${darkMode ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-600'}`}>
            Seleccioná una materia para registrar asistencia
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.materias.map((m) => {
            const numAlumnos = m.alumnos.length;
            const numFechas = m.fechas ? m.fechas.length : 0;
            return (
              <div
                key={m.id}
                onClick={() => {
                  onSelectSubject(m.id);
                  onSelectView('asistencia');
                }}
                className={`p-4 rounded-xl border cursor-pointer transition-all duration-200 group hover:shadow-md ${
                  darkMode 
                    ? 'bg-slate-900/60 border-slate-700 hover:border-blue-500' 
                    : 'bg-slate-50 border-slate-200 hover:border-blue-400'
                }`}
              >
                <div className="flex items-start justify-between">
                  <h4 className="font-bold text-sm group-hover:text-blue-500 transition line-clamp-1">{m.nombre}</h4>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
                </div>
                <div className={`mt-3 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  <span>{numAlumnos} alumnos inscriptos</span>
                  <span>{numFechas} clases registradas</span>
                </div>
                {m.horario && (
                  <p className={`mt-1.5 text-xs font-medium ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                    Horario: {m.horario}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
