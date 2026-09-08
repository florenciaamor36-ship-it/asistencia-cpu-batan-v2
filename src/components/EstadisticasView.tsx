import React, { useMemo } from 'react';
import { AppData } from '../types';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  CartesianGrid, 
  Cell 
} from 'recharts';
import { BarChart3, TrendingUp, Users, Award, AlertCircle } from 'lucide-react';

interface EstadisticasViewProps {
  data: AppData;
  darkMode: boolean;
}

export const EstadisticasView: React.FC<EstadisticasViewProps> = ({ data, darkMode }) => {
  // Compute overall stats
  const { totalPresentes, totalAusentes, totalJustificados, totalSinMarcar, subjectChartData } = useMemo(() => {
    let pres = 0;
    let aus = 0;
    let just = 0;
    let sin = 0;

    const chartData = data.materias.map(m => {
      let mPres = 0;
      let mTotal = 0;
      m.alumnos.forEach(alu => {
        if (alu.asist) {
          Object.entries(alu.asist).forEach(([d, val]) => {
            if (m.fechas.includes(d) && val !== undefined && val !== '') {
              mTotal++;
              if (val === true || val === 'presente') {
                mPres++;
                pres++;
              } else if (val === false || val === 'ausente') {
                aus++;
              } else if (val === 'justificado') {
                just++;
                mPres++; // count justified towards attendance or separate
              } else {
                sin++;
              }
            }
          });
        }
      });

      const pct = mTotal > 0 ? Math.round((mPres / mTotal) * 100) : 0;
      return {
        name: m.nombre.length > 22 ? m.nombre.substring(0, 20) + '...' : m.nombre,
        fullName: m.nombre,
        asistencia: pct,
        alumnos: m.alumnos.length
      };
    });

    return {
      totalPresentes: pres,
      totalAusentes: aus,
      totalJustificados: just,
      totalSinMarcar: sin,
      subjectChartData: chartData
    };
  }, [data]);

  // Students attendance rates
  const studentRates = useMemo(() => {
    return data.alumnos.map(alu => {
      let total = 0;
      let present = 0;
      data.materias.forEach(m => {
        if (m.alumnos.some(s => s.id === alu.id)) {
          m.fechas.forEach(f => {
            const studentInMat = m.alumnos.find(s => s.id === alu.id);
            const val = studentInMat?.asist?.[f];
            if (val !== undefined && val !== '') {
              total++;
              if (val === true || val === 'presente' || val === 'justificado') present++;
            }
          });
        }
      });
      const pct = total > 0 ? Math.round((present / total) * 100) : 0;
      return { student: alu, pct, totalClasses: total };
    });
  }, [data]);

  const lowAttendance = studentRates.filter(s => s.totalClasses >= 3 && s.pct < 60);
  const perfectAttendance = studentRates.filter(s => s.totalClasses >= 3 && s.pct === 100);

  const cardClass = `p-5 rounded-2xl border ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800'}`;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">Estadísticas y Reportes de Asistencia</h2>
        <p className={`text-xs mt-0.5 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
          Análisis consolidado de presencialidad institucional CPU Batán
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className={cardClass}>
          <p className={`text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Total Presentes</p>
          <p className="text-3xl font-bold mt-1 text-emerald-600 dark:text-emerald-400">{totalPresentes}</p>
          <span className="text-xs text-slate-400 mt-2 block">Registros positivos</span>
        </div>
        <div className={cardClass}>
          <p className={`text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Total Ausentes</p>
          <p className="text-3xl font-bold mt-1 text-red-600 dark:text-red-400">{totalAusentes}</p>
          <span className="text-xs text-slate-400 mt-2 block">Inasistencias registradas</span>
        </div>
        <div className={cardClass}>
          <p className={`text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Total Justificados</p>
          <p className="text-3xl font-bold mt-1 text-amber-500">{totalJustificados}</p>
          <span className="text-xs text-slate-400 mt-2 block">Ausencias con aviso</span>
        </div>
        <div className={cardClass}>
          <p className={`text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Alumnos Evaluados</p>
          <p className="text-3xl font-bold mt-1 text-blue-600 dark:text-blue-400">{data.alumnos.length}</p>
          <span className="text-xs text-slate-400 mt-2 block">Padrón total activo</span>
        </div>
      </div>

      {/* Bar Chart: Asistencia por Materia */}
      <div className={cardClass}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-base font-bold flex items-center">
            <BarChart3 className="w-5 h-5 mr-2 text-blue-600" />
            Porcentaje de Asistencia por Materia / Taller
          </h3>
        </div>

        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={subjectChartData} margin={{ top: 10, right: 30, left: 0, bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#334155' : '#e2e8f0'} />
              <XAxis 
                dataKey="name" 
                angle={-25} 
                textAnchor="end" 
                interval={0} 
                tick={{ fill: darkMode ? '#94a3b8' : '#64748b', fontSize: 11 }} 
              />
              <YAxis unit="%" domain={[0, 100]} tick={{ fill: darkMode ? '#94a3b8' : '#64748b', fontSize: 11 }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: darkMode ? '#1e293b' : '#ffffff', 
                  borderColor: darkMode ? '#334155' : '#e2e8f0',
                  color: darkMode ? '#fff' : '#000',
                  borderRadius: '12px'
                }} 
              />
              <Bar dataKey="asistencia" fill="#2563eb" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Alerts & Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Perfect Attendance */}
        <div className={cardClass}>
          <h3 className="text-base font-bold flex items-center mb-4 text-emerald-600 dark:text-emerald-400">
            <Award className="w-5 h-5 mr-2" />
            Alumnos con Asistencia Perfecta (100%)
          </h3>
          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {perfectAttendance.length === 0 ? (
              <p className="text-xs text-slate-400">No hay alumnos con 100% de asistencia registrada aún.</p>
            ) : (
              perfectAttendance.map((item, idx) => (
                <div key={idx} className={`p-3 rounded-xl border flex items-center justify-between ${
                  darkMode ? 'bg-slate-900 border-slate-700' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div>
                    <p className="font-bold text-sm">{item.student.apellido}, {item.student.nombre}</p>
                    <p className="text-xs text-slate-400">{item.student.pabellon || 'Sin pabellón'}</p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 text-xs font-bold">
                    100%
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Low Attendance Warning */}
        <div className={cardClass}>
          <h3 className="text-base font-bold flex items-center mb-4 text-amber-600 dark:text-amber-400">
            <AlertCircle className="w-5 h-5 mr-2" />
            Alumnos con Baja Asistencia (&lt; 60%)
          </h3>
          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {lowAttendance.length === 0 ? (
              <p className="text-xs text-slate-400">No hay alumnos por debajo del umbral de alerta.</p>
            ) : (
              lowAttendance.map((item, idx) => (
                <div key={idx} className={`p-3 rounded-xl border flex items-center justify-between ${
                  darkMode ? 'bg-slate-900 border-slate-700' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div>
                    <p className="font-bold text-sm">{item.student.apellido}, {item.student.nombre}</p>
                    <p className="text-xs text-slate-400">{item.student.pabellon || 'Sin pabellón'}</p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 text-xs font-bold">
                    {item.pct}%
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
