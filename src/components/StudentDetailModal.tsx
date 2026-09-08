import React from 'react';
import { AppData, Student } from '../types';
import { X, User, Calendar, Award, CheckCircle2, XCircle, Shield } from 'lucide-react';

interface StudentDetailModalProps {
  student: Student;
  data: AppData;
  onClose: () => void;
  darkMode: boolean;
}

export const StudentDetailModal: React.FC<StudentDetailModalProps> = ({
  student,
  data,
  onClose,
  darkMode
}) => {
  // Normalize every stored date (YYYY-MM-DD or DD/MM/YYYY) for display.
  // Older backups use both formats, so never derive the label with split('-').
  const formatDate = (raw: string) => {
    const value = String(raw || '').trim();
    const iso = value.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    if (iso) return `${iso[3].padStart(2, '0')}/${iso[2].padStart(2, '0')}/${iso[1]}`;
    const local = value.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4})$/);
    if (local) return `${local[1].padStart(2, '0')}/${local[2].padStart(2, '0')}/${local[3]}`;
    return value;
  };

  // Find all subjects this student is enrolled in
  const studentSubjects = data.materias.filter(m => m.alumnos.some(s => s.id === student.id));

  // Compute attendance stats across subjects
  let totalClasses = 0;
  let totalPresent = 0;

  studentSubjects.forEach(m => {
    m.fechas.forEach(f => {
      const studentInMat = m.alumnos.find(s => s.id === student.id);
      const val = studentInMat?.asist?.[f];
      if (val !== undefined && val !== '') {
        totalClasses++;
        if (val === true || val === 'presente' || val === 'justificado') {
          totalPresent++;
        }
      }
    });
  });

  const overallPct = totalClasses > 0 ? Math.round((totalPresent / totalClasses) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className={`w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl p-6 shadow-2xl border relative ${
        darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800'
      }`}>
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-1.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Profile Header */}
        <div className="flex items-start space-x-4 mb-6 pb-6 border-b border-slate-200 dark:border-slate-800">
          <div className="w-14 h-14 rounded-2xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xl flex-shrink-0">
            {student.apellido ? student.apellido[0] : <User className="w-7 h-7" />}
          </div>
          <div>
            <h3 className="text-xl font-black">{student.apellido}, {student.nombre}</h3>
            <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-slate-400">
              <span className="font-mono">DNI: {student.dni || 'No registrado'}</span>
              <span>•</span>
              <span className="font-semibold text-blue-600 dark:text-blue-400">{student.pabellon || 'Sin pabellón'}</span>
              <span>•</span>
              <span>Inscripción: {student.fecha_inscripcion || 'N/A'}</span>
            </div>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
            <p className="text-xs text-slate-400 uppercase font-medium">Asistencia General</p>
            <p className="text-2xl font-bold mt-1 text-emerald-500">{overallPct}%</p>
          </div>
          <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
            <p className="text-xs text-slate-400 uppercase font-medium">Materias Inscripto</p>
            <p className="text-2xl font-bold mt-1 text-blue-500">{studentSubjects.length}</p>
          </div>
          <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
            <p className="text-xs text-slate-400 uppercase font-medium">Venc. Carnet</p>
            <p className="text-sm font-bold mt-1 truncate">{student.fecha_vencimiento_carnet || 'Sin registrar'}</p>
          </div>
        </div>

        {/* Observations */}
        {student.observaciones && (
          <div className={`p-4 rounded-2xl border mb-6 text-sm ${darkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-amber-50 border-amber-200 text-amber-900'}`}>
            <p className="text-xs font-semibold uppercase mb-1">Observaciones</p>
            <p>{student.observaciones}</p>
          </div>
        )}

        {/* Enrolled Subjects & Attendance breakdown */}
        <h4 className="font-bold text-sm mb-3">Materias y Asistencias Registradas</h4>
        <div className="space-y-3">
          {studentSubjects.length === 0 ? (
            <p className="text-xs text-slate-400">El alumno no está inscripto en ninguna materia activa.</p>
          ) : (
            studentSubjects.map(m => {
              let mClasses = 0;
              let mPres = 0;
              m.fechas.forEach(f => {
                const sInM = m.alumnos.find(s => s.id === student.id);
                const val = sInM?.asist?.[f];
                if (val !== undefined && val !== '') {
                  mClasses++;
                  if (val === true || val === 'presente' || val === 'justificado') mPres++;
                }
              });
              const mPct = mClasses > 0 ? Math.round((mPres / mClasses) * 100) : 0;

              return (
                <div key={m.id} className={`p-4 rounded-2xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="font-bold text-sm">{m.nombre}</h5>
                    <span className="text-xs font-bold text-blue-600 dark:text-blue-400">{mPct}% asistencia</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {m.fechas.map(f => {
                      const sInM = m.alumnos.find(s => s.id === student.id);
                      const val = sInM?.asist?.[f];
                      const isP = val === true || val === 'presente';
                      const isA = val === false || val === 'ausente';
                      const isJ = val === 'justificado';

                      let badgeBg = darkMode ? 'bg-slate-700 text-slate-400' : 'bg-slate-200 text-slate-600';
                      if (isP) badgeBg = 'bg-emerald-600 text-white';
                      if (isA) badgeBg = 'bg-red-600 text-white';
                      if (isJ) badgeBg = 'bg-amber-500 text-white';

                      return (
                        <span key={f} className={`text-[10px] px-2 py-0.5 rounded-md font-medium ${badgeBg}`} title={`Fecha: ${formatDate(f)}`}>
                          {formatDate(f)}
                        </span>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
