import React, { useState, useMemo } from 'react';
import { AppData, Subject, Student } from '../types';
import { 
  Calendar, 
  Clock, 
  Users, 
  Check, 
  X, 
  HelpCircle, 
  Minus, 
  Plus, 
  Trash2, 
  Search, 
  Filter, 
  Undo2, 
  FileSpreadsheet,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  CheckSquare,
  ListChecks
} from 'lucide-react';
import * as XLSX from 'xlsx';

const formatDateDisplay = (value: string) => {
  if (!value) return '';
  const ddmmyyyy = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (ddmmyyyy) return `${ddmmyyyy[1].padStart(2, '0')}/${ddmmyyyy[2].padStart(2, '0')}/${ddmmyyyy[3]}`;
  const iso = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[3]}/${iso[2]}/${iso[1]}`;
  return value;
};

interface AsistenciaViewProps {
  data: AppData;
  subjectId: string;
  role: 'admin' | 'espectador';
  onUpdateData: (newData: AppData) => void;
  darkMode: boolean;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const AsistenciaView: React.FC<AsistenciaViewProps> = ({
  data,
  subjectId,
  role,
  onUpdateData,
  darkMode,
  showToast
}) => {
  const subject = data.materias.find(m => m.id === subjectId) || data.materias[0];

  const [selectedDate, setSelectedDate] = useState<string>(
    subject && subject.fechas && subject.fechas.length > 0 
      ? subject.fechas[subject.fechas.length - 1] 
      : new Date().toISOString().split('T')[0]
  );
  
  const [searchQuery, setSearchQuery] = useState('');
  const [pabellonFilter, setPabellonFilter] = useState('todos');
  const [newDateInput, setNewDateInput] = useState('');
  const [showAddDateModal, setShowAddDateModal] = useState(false);
  const [lastAction, setLastAction] = useState<{ studentId: string; date: string; prevVal: any } | null>(null);
  const [viewModeType, setViewModeType] = useState<'diario' | 'matriz'>('diario');

  // Ensure selectedDate is valid
  React.useEffect(() => {
    if (subject && subject.fechas && !subject.fechas.includes(selectedDate) && subject.fechas.length > 0) {
      setSelectedDate(subject.fechas[subject.fechas.length - 1]);
    }
  }, [subjectId]);

  if (!subject) {
    return <div className="p-6 text-center text-slate-500">No hay materias seleccionadas.</div>;
  }

  // Extract unique pabellones in this subject
  const pabellones = useMemo(() => {
    const set = new Set<string>();
    subject.alumnos.forEach(a => { if (a.pabellon) set.add(a.pabellon); });
    return Array.from(set).sort();
  }, [subject]);

  // Filter students for attendance table
  const filteredStudents = useMemo(() => {
    return subject.alumnos.filter(alu => {
      const q = searchQuery.toLowerCase();
      const matchQ = 
        (alu.apellido && alu.apellido.toLowerCase().includes(q)) ||
        (alu.nombre && alu.nombre.toLowerCase().includes(q)) ||
        (alu.dni && alu.dni.includes(q));

      if (!matchQ) return false;
      if (pabellonFilter !== 'todos' && alu.pabellon !== pabellonFilter) return false;
      return true;
    }).sort((a, b) => (a.apellido || '').localeCompare(b.apellido || ''));
  }, [subject, searchQuery, pabellonFilter]);

  // Attendance stats for selected date
  const dateStats = useMemo(() => {
    let pres = 0;
    let aus = 0;
    let just = 0;
    let sin = 0;

    subject.alumnos.forEach(alu => {
      const val = alu.asist?.[selectedDate];
      if (val === true || val === 'presente') pres++;
      else if (val === false || val === 'ausente') aus++;
      else if (val === 'justificado') just++;
      else sin++;
    });

    const total = subject.alumnos.length;
    const marked = pres + aus + just;
    const pct = marked > 0 ? Math.round((pres / marked) * 100) : 0;
    return { pres, aus, just, sin, total, pct };
  }, [subject, selectedDate]);

  // Overall subject attendance pct
  const overallPct = useMemo(() => {
    let totalC = 0;
    let presC = 0;
    subject.alumnos.forEach(alu => {
      if (alu.asist) {
        Object.entries(alu.asist).forEach(([d, val]) => {
          if (subject.fechas.includes(d) && val !== undefined && val !== '') {
            totalC++;
            if (val === true || val === 'presente') presC++;
          }
        });
      }
    });
    return totalC > 0 ? Math.round((presC / totalC) * 100) : 0;
  }, [subject]);

  const handleSetAttendance = (studentId: string, status: boolean | string) => {
    if (role === 'espectador') {
      showToast("Modo Espectador: No tiene permisos para modificar la asistencia.", "error");
      return;
    }

    const student = subject.alumnos.find(s => s.id === studentId);
    const prevVal = student?.asist?.[selectedDate];
    setLastAction({ studentId, date: selectedDate, prevVal });

    const updatedMaterias = data.materias.map(m => {
      if (m.id !== subject.id) return m;
      const updatedAlumnos = m.alumnos.map(alu => {
        if (alu.id !== studentId) return alu;
        return {
          ...alu,
          asist: {
            ...(alu.asist || {}),
            [selectedDate]: status
          }
        };
      });
      return { ...m, alumnos: updatedAlumnos };
    });

    // Also update global alumnos list if needed
    const updatedAlumnosGlobal = data.alumnos.map(alu => {
      if (alu.id !== studentId) return alu;
      return {
        ...alu,
        asist: {
          ...(alu.asist || {}),
          [selectedDate]: status
        }
      };
    });

    onUpdateData({
      ...data,
      materias: updatedMaterias,
      alumnos: updatedAlumnosGlobal
    });
    showToast("Asistencia actualizada.", "success");
  };

  const handleToggleMatrixCell = (studentId: string, dateStr: string) => {
    if (role === 'espectador') {
      showToast("Modo Espectador: Sin permisos.", "error");
      return;
    }

    const student = subject.alumnos.find(s => s.id === studentId);
    const currentVal = student?.asist?.[dateStr];
    // Toggle: undefined/false -> true (presente), true -> false (ausente), false -> undefined
    let nextVal: boolean | string = true;
    if (currentVal === true || currentVal === 'presente') {
      nextVal = false;
    } else if (currentVal === false || currentVal === 'ausente') {
      nextVal = 'justificado';
    } else if (currentVal === 'justificado') {
      nextVal = '';
    } else {
      nextVal = true;
    }

    const updatedMaterias = data.materias.map(m => {
      if (m.id !== subject.id) return m;
      const updatedAlumnos = m.alumnos.map(alu => {
        if (alu.id !== studentId) return alu;
        const newAsist = { ...(alu.asist || {}) };
        if (nextVal === '') {
          delete newAsist[dateStr];
        } else {
          newAsist[dateStr] = nextVal;
        }
        return { ...alu, asist: newAsist };
      });
      return { ...m, alumnos: updatedAlumnos };
    });

    const updatedAlumnosGlobal = data.alumnos.map(alu => {
      if (alu.id !== studentId) return alu;
      const newAsist = { ...(alu.asist || {}) };
      if (nextVal === '') {
        delete newAsist[dateStr];
      } else {
        newAsist[dateStr] = nextVal;
      }
      return { ...alu, asist: newAsist };
    });

    onUpdateData({
      ...data,
      materias: updatedMaterias,
      alumnos: updatedAlumnosGlobal
    });
    showToast("Asistencia actualizada en planilla.", "success");
  };

  const handleMarkAll = (status: boolean | string) => {
    if (role === 'espectador') {
      showToast("Modo Espectador: Sin permisos.", "error");
      return;
    }

    const updatedMaterias = data.materias.map(m => {
      if (m.id !== subject.id) return m;
      const updatedAlumnos = m.alumnos.map(alu => ({
        ...alu,
        asist: {
          ...(alu.asist || {}),
          [selectedDate]: status
        }
      }));
      return { ...m, alumnos: updatedAlumnos };
    });

    onUpdateData({ ...data, materias: updatedMaterias });
    showToast(`Todos marcados como ${status === true || status === 'presente' ? 'Presentes' : 'Ausentes'}.`, "success");
  };

  const handleUndo = () => {
    if (!lastAction) return;
    handleSetAttendance(lastAction.studentId, lastAction.prevVal);
    setLastAction(null);
    showToast("Cambio deshecho.", "info");
  };

  const handleAddDate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDateInput) return;
    if (subject.fechas.includes(newDateInput)) {
      showToast("La fecha ya existe en esta materia.", "error");
      return;
    }

    const updatedFechas = [...subject.fechas, newDateInput].sort();
    const updatedMaterias = data.materias.map(m => {
      if (m.id !== subject.id) return m;
      return { ...m, fechas: updatedFechas };
    });

    onUpdateData({ ...data, materias: updatedMaterias });
    setSelectedDate(newDateInput);
    setNewDateInput('');
    setShowAddDateModal(false);
    showToast("Fecha de clase agregada correctamente.", "success");
  };

  const handleDeleteDate = (dateToDelete: string) => {
    if (role === 'espectador') {
      showToast("Modo Espectador: Sin permisos.", "error");
      return;
    }

    if (!window.confirm(`Esta acción eliminará o desconectará las asistencias correspondientes a la fecha ${dateToDelete}. ¿Desea continuar?`)) {
      return;
    }

    const updatedFechas = subject.fechas.filter(d => d !== dateToDelete);
    const updatedMaterias = data.materias.map(m => {
      if (m.id !== subject.id) return m;
      const updatedAlumnos = m.alumnos.map(alu => {
        const newAsist = { ...(alu.asist || {}) };
        delete newAsist[dateToDelete];
        return { ...alu, asist: newAsist };
      });
      return { ...m, fechas: updatedFechas, alumnos: updatedAlumnos };
    });

    onUpdateData({ ...data, materias: updatedMaterias });
    if (updatedFechas.length > 0) {
      setSelectedDate(updatedFechas[updatedFechas.length - 1]);
    }
    showToast("Fecha de clase eliminada.", "info");
  };

  const handleExportSubjectExcel = () => {
    const exportData = subject.alumnos.map((alu, idx) => {
      const row: any = {
        'N°': idx + 1,
        'APELLIDO': alu.apellido,
        'NOMBRE': alu.nombre,
        'DNI': alu.dni || '',
        'PABELLÓN': alu.pabellon || ''
      };
      subject.fechas.forEach(f => {
        const val = alu.asist?.[f];
        row[f] = val === true || val === 'presente' ? 'Presente' : val === false || val === 'ausente' ? 'Ausente' : val === 'justificado' ? 'Justificado' : 'Sin marcar';
      });
      return row;
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, subject.nombre.substring(0, 30));
    XLSX.writeFile(workbook, `asistencia_${subject.nombre.replace(/[^a-zA-Z0-9]/g, '_')}.xlsx`);
    showToast("Asistencia exportada a Excel.", "success");
  };

  return (
    <div className="space-y-6">
      {/* Subject Info Banner */}
      <div className={`p-6 rounded-3xl border shadow-xs ${
        darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800'
      }`}>
        <div className="flex min-w-0 flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-xs font-bold uppercase tracking-wider">
                Materia / Taller CPU Batán
              </span>
              <div className="flex bg-slate-200 dark:bg-slate-900 p-1 rounded-xl">
                <button
                  onClick={() => setViewModeType('diario')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                    viewModeType === 'diario' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-500'
                  }`}
                >
                  Pase Diario
                </button>
                <button
                  onClick={() => setViewModeType('matriz')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                    viewModeType === 'matriz' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-500'
                  }`}
                >
                  Planilla de Tildes (Matriz)
                </button>
              </div>
            </div>
            <h2 className="max-w-full break-words text-2xl font-black tracking-tight">{subject.nombre}</h2>
            <div className="flex flex-wrap items-center gap-4 mt-2 text-xs opacity-80">
              {subject.dias && subject.dias.length > 0 && (
                <span className="flex items-center"><Calendar className="w-3.5 h-3.5 mr-1" /> Días: {subject.dias.join(', ')}</span>
              )}
              {subject.horario && (
                <span className="flex items-center"><Clock className="w-3.5 h-3.5 mr-1" /> Horario: {subject.horario}</span>
              )}
              <span className="flex items-center"><Users className="w-3.5 h-3.5 mr-1" /> Alumnos: {subject.alumnos.length}</span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">Asistencia gral: {overallPct}%</span>
            </div>
          </div>

          <div className="flex max-w-full flex-wrap items-center gap-2">
            <button
              onClick={handleExportSubjectExcel}
              className="flex items-center space-x-1 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Exportar Asistencia</span>
            </button>
            {role === 'admin' && (
              <button
                onClick={() => setShowAddDateModal(true)}
                className="flex items-center space-x-1 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition"
              >
                <Plus className="w-4 h-4" />
                <span>Nueva Fecha de Clase</span>
              </button>
            )}
          </div>
        </div>

        {/* Fechas de Clase Bar (Only in Diario view) */}
        {viewModeType === 'diario' && (
          <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
            <p className="text-xs font-semibold uppercase tracking-wider mb-3 text-slate-400">Fechas de Clase Registradas ({subject.fechas.length})</p>
            <div className="flex items-center space-x-2 overflow-x-auto pb-2">
              {subject.fechas.map((f) => {
                const isSelected = f === selectedDate;
                return (
                  <div
                    key={f}
                    className={`flex items-center space-x-1 px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition border ${
                      isSelected 
                        ? 'bg-blue-600 border-blue-600 text-white shadow-md' 
                        : darkMode ? 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800' : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                    onClick={() => setSelectedDate(f)}
                  >
                    <span>{formatDateDisplay(f)}</span>
                    {role === 'admin' && subject.fechas.length > 1 && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteDate(f); }}
                        className="ml-1.5 p-0.5 rounded-full hover:bg-black/20 text-current"
                        title="Eliminar esta fecha"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Conditional Rendering: Diario vs Matriz (Tildes) */}
      {viewModeType === 'diario' ? (
        <>
          {/* Date Attendance Summary & Controls */}
          <div className={`p-4 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-4 ${
            darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
          }`}>
            <div className="flex min-w-0 flex-wrap items-center gap-3 sm:gap-4">
              <div className="min-w-0">
                <p className="text-xs font-medium text-slate-400">Fecha Seleccionada</p>
                <p className="text-lg font-bold">{formatDateDisplay(selectedDate)}</p>
              </div>
              <div className="h-8 w-px bg-slate-200 dark:bg-slate-700"></div>
              <div className="flex min-w-0 flex-wrap items-center gap-2 text-xs">
                <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 font-semibold">
                  Presentes: {dateStats.pres}
                </span>
                <span className="px-2.5 py-1 rounded-full bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300 font-semibold">
                  Ausentes: {dateStats.aus}
                </span>
                <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 font-semibold">
                  Justificados: {dateStats.just}
                </span>
                <span className="font-bold text-blue-600 dark:text-blue-400">
                  Efectiva: {dateStats.pct}%
                </span>
              </div>
            </div>

            <div className="flex max-w-full flex-wrap items-center gap-2">
              {lastAction && (
                <button
                  onClick={handleUndo}
                  className="flex items-center space-x-1 px-3 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 text-xs font-medium hover:bg-slate-300 transition"
                >
                  <Undo2 className="w-3.5 h-3.5" />
                  <span>Deshacer</span>
                </button>
              )}

              {role === 'admin' && (
                <>
                  <button
                    onClick={() => handleMarkAll(true)}
                    className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition"
                  >
                    Todos Presentes
                  </button>
                  <button
                    onClick={() => handleMarkAll(false)}
                    className="px-3 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold transition"
                  >
                    Todos Ausentes
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Search & Filter students in subject */}
          <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row gap-3 ${
            darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
          }`}>
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar alumno en esta materia..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full pl-10 pr-4 py-2 rounded-xl border text-sm ${
                  darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                }`}
              />
            </div>
            <div className="w-full sm:w-48">
              <select
                value={pabellonFilter}
                onChange={(e) => setPabellonFilter(e.target.value)}
                className={`w-full px-3 py-2 rounded-xl border text-sm ${
                  darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                }`}
              >
                <option value="todos">Todos los pabellones</option>
                {pabellones.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>

          {/* Attendance Table */}
          <div className={`rounded-2xl border overflow-hidden shadow-xs ${
            darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800'
          }`}>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className={`border-b text-xs uppercase tracking-wider ${
                    darkMode ? 'bg-slate-900/80 border-slate-700 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-500'
                  }`}>
                    <th className="py-3.5 px-4 font-semibold">Alumno</th>
                    <th className="py-3.5 px-4 font-semibold">DNI</th>
                    <th className="py-3.5 px-4 font-semibold">Pabellón</th>
                    <th className="py-3.5 px-4 font-semibold text-center">Estado de Asistencia</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700 text-sm">
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-slate-400">
                        No hay alumnos registrados en esta materia o que coincidan con la búsqueda.
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map((alu) => {
                      const status = alu.asist?.[selectedDate];
                      const isPresent = status === true || status === 'presente';
                      const isAbsent = status === false || status === 'ausente';
                      const isJustified = status === 'justificado';

                      return (
                        <tr key={alu.id} className={`transition-colors ${darkMode ? 'hover:bg-slate-750' : 'hover:bg-slate-50'}`}>
                          <td className="py-3.5 px-4 font-bold">{alu.apellido}, {alu.nombre}</td>
                          <td className="py-3.5 px-4 font-mono text-xs">{alu.dni || '—'}</td>
                          <td className="py-3.5 px-4">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                              darkMode ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-700'
                            }`}>
                              {alu.pabellon || 'Sin asignar'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="flex items-center justify-center space-x-2">
                              {/* Presente */}
                              <button
                                disabled={role === 'espectador'}
                                onClick={() => handleSetAttendance(alu.id, true)}
                                className={`flex items-center space-x-1 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                                  isPresent 
                                    ? 'bg-emerald-600 text-white shadow-md' 
                                    : darkMode ? 'bg-slate-900 text-slate-400 hover:bg-slate-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>Presente</span>
                              </button>

                              {/* Ausente */}
                              <button
                                disabled={role === 'espectador'}
                                onClick={() => handleSetAttendance(alu.id, false)}
                                className={`flex items-center space-x-1 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                                  isAbsent 
                                    ? 'bg-red-600 text-white shadow-md' 
                                    : darkMode ? 'bg-slate-900 text-slate-400 hover:bg-slate-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                              >
                                <X className="w-3.5 h-3.5" />
                                <span>Ausente</span>
                              </button>

                              {/* Justificado */}
                              <button
                                disabled={role === 'espectador'}
                                onClick={() => handleSetAttendance(alu.id, 'justificado')}
                                className={`flex items-center space-x-1 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                                  isJustified 
                                    ? 'bg-amber-500 text-white shadow-md' 
                                    : darkMode ? 'bg-slate-900 text-slate-400 hover:bg-slate-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                              >
                                <HelpCircle className="w-3.5 h-3.5" />
                                <span>Justif.</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        /* Matrix View (Planilla de Tildes por Fecha) */
        <div className={`rounded-2xl border overflow-hidden shadow-xs ${
          darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800'
        }`}>
          <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <CheckSquare className="w-5 h-5 text-blue-600" />
              <h3 className="font-bold text-sm">Planilla de Asistencia (Matriz de Tildes por Fecha)</h3>
            </div>
            <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              Haga click en cada celda para alternar el tilde (Presente / Ausente / Justificado)
            </p>
          </div>

          <div className="w-full max-w-full overflow-x-scroll overflow-y-auto max-h-[70vh]">
            <table className="w-max min-w-full text-left border-collapse">
              <thead>
                <tr className={`border-b text-xs uppercase tracking-wider sticky top-0 z-10 ${
                  darkMode ? 'bg-slate-900 border-slate-700 text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-600'
                }`}>
                  <th className={`min-w-[240px] py-3 px-4 font-semibold sticky left-0 z-20 shadow-xs ${darkMode ? 'bg-slate-900' : 'bg-slate-100'}`}>Alumno</th>
                  <th className="min-w-[90px] py-3 px-3 font-semibold">Pabellón</th>
                  {subject.fechas.map(f => (
                    <th key={f} className="min-w-[84px] py-3 px-3 font-semibold text-center whitespace-nowrap">
                      {formatDateDisplay(f)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700 text-sm">
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={2 + subject.fechas.length} className="py-8 text-center text-slate-400">
                      No hay alumnos inscriptos en esta materia.
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map(alu => (
                    <tr key={alu.id} className={`transition-colors ${darkMode ? 'hover:bg-slate-750' : 'hover:bg-slate-50'}`}>
                      <td className={`min-w-[240px] py-2.5 px-4 font-bold sticky left-0 z-10 shadow-xs whitespace-nowrap ${darkMode ? 'bg-slate-800' : 'bg-white'}`}>
                        {alu.apellido}, {alu.nombre}
                      </td>
                      <td className="min-w-[90px] py-2.5 px-3 text-xs text-slate-400 whitespace-nowrap">
                        {alu.pabellon || '—'}
                      </td>
                      {subject.fechas.map(f => {
                        const val = alu.asist?.[f];
                        const isP = val === true || val === 'presente';
                        const isA = val === false || val === 'ausente';
                        const isJ = val === 'justificado';

                        return (
                          <td key={f} className="min-w-[84px] py-2.5 px-3 text-center">
                            <button
                              disabled={role === 'espectador'}
                              onClick={() => handleToggleMatrixCell(alu.id, f)}
                              className={`w-8 h-8 rounded-xl font-bold text-xs inline-flex items-center justify-center transition shadow-xs ${
                                isP 
                                  ? 'bg-emerald-600 text-white' 
                                  : isA 
                                    ? 'bg-red-600 text-white' 
                                    : isJ 
                                      ? 'bg-amber-500 text-white' 
                                      : darkMode ? 'bg-slate-900 text-slate-600 hover:bg-slate-700' : 'bg-slate-100 text-slate-300 hover:bg-slate-200'
                              }`}
                              title={`Fecha ${f}: ${isP ? 'Presente' : isA ? 'Ausente' : isJ ? 'Justificado' : 'Sin marcar'}. Click para cambiar.`}
                            >
                              {isP ? '✓' : isA ? '✕' : isJ ? 'J' : '·'}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Date Modal */}
      {showAddDateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className={`w-full max-w-md rounded-3xl p-6 shadow-2xl border ${
            darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800'
          }`}>
            <h3 className="text-lg font-bold mb-4">Agregar Fecha de Clase</h3>
            <form onSubmit={handleAddDate} className="space-y-4">
              <div>
                <label className="block text-xs font-medium mb-1">Fecha de la clase *</label>
                <input
                  type="date"
                  required
                  value={newDateInput}
                  onChange={(e) => setNewDateInput(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl border text-sm ${
                    darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddDateModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-sm font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-md"
                >
                  Agregar Fecha
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

