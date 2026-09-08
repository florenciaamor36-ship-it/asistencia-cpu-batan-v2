import React, { useState } from 'react';
import { AppData, Subject, Student } from '../types';
import { BookOpen, Plus, Edit, Trash2, Users, Check, X, Calendar, Clock } from 'lucide-react';

interface MateriasViewProps {
  data: AppData;
  role: 'admin' | 'espectador';
  onUpdateData: (newData: AppData) => void;
  darkMode: boolean;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const MateriasView: React.FC<MateriasViewProps> = ({
  data,
  role,
  onUpdateData,
  darkMode,
  showToast
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [formData, setFormData] = useState({
    nombre: '',
    dias: 'Lunes y Miércoles',
    horario: '09:00 a 11:00'
  });

  // Modal for managing students in a subject
  const [managingSubject, setManagingSubject] = useState<Subject | null>(null);

  const handleOpenAdd = () => {
    if (role === 'espectador') {
      showToast("Modo Espectador: Sin permisos para agregar materias.", "error");
      return;
    }
    setEditingSubject(null);
    setFormData({ nombre: '', dias: 'Lunes', horario: '10:00' });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (subject: Subject) => {
    if (role === 'espectador') {
      showToast("Modo Espectador: Sin permisos para editar materias.", "error");
      return;
    }
    setEditingSubject(subject);
    setFormData({
      nombre: subject.nombre,
      dias: subject.dias?.join(', ') || '',
      horario: subject.horario || ''
    });
    setIsModalOpen(true);
  };

  const handleSaveSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nombre.trim()) {
      showToast("El nombre de la materia es obligatorio.", "error");
      return;
    }

    const updatedMaterias = [...data.materias];
    const diasArr = formData.dias.split(',').map(d => d.trim()).filter(Boolean);

    if (editingSubject) {
      const idx = updatedMaterias.findIndex(m => m.id === editingSubject.id);
      if (idx !== -1) {
        updatedMaterias[idx] = {
          ...editingSubject,
          nombre: formData.nombre.trim(),
          dias: diasArr,
          horario: formData.horario.trim()
        };
      }
      showToast("Materia actualizada correctamente.", "success");
    } else {
      const newSubject: Subject = {
        id: `mat_${Date.now()}`,
        nombre: formData.nombre.trim(),
        dias: diasArr,
        horario: formData.horario.trim(),
        fechas: [new Date().toISOString().split('T')[0]],
        alumnos: [...data.alumnos] // por defecto se pueden inscribir todos o ninguno; iniciamos con padrón o vacío. Vamos a iniciar con todos o vacío según criterio. Iniciar vacío o clonar padrón. Clonemos padrón vacío o con todos. Pongamos todos para facilitar.
      };
      updatedMaterias.push(newSubject);
      showToast("Nueva materia creada correctamente.", "success");
    }

    onUpdateData({
      ...data,
      materias: updatedMaterias
    });
    setIsModalOpen(false);
  };

  const handleDeleteSubject = (subjectId: string, name: string) => {
    if (role === 'espectador') {
      showToast("Modo Espectador: Sin permisos.", "error");
      return;
    }
    if (!window.confirm(`¿Confirma que desea eliminar la materia "${name}"? Se perderán sus asistencias registradas.`)) {
      return;
    }

    const updatedMaterias = data.materias.filter(m => m.id !== subjectId);
    onUpdateData({
      ...data,
      materias: updatedMaterias
    });
    showToast("Materia eliminada correctamente.", "info");
  };

  const handleToggleStudentInSubject = (studentId: string) => {
    if (!managingSubject) return;

    const isEnrolled = managingSubject.alumnos.some(s => s.id === studentId);
    let updatedSubjectAlumnos: Student[];

    if (isEnrolled) {
      updatedSubjectAlumnos = managingSubject.alumnos.filter(s => s.id !== studentId);
    } else {
      const studentObj = data.alumnos.find(s => s.id === studentId);
      if (studentObj) {
        updatedSubjectAlumnos = [...managingSubject.alumnos, studentObj];
      } else {
        updatedSubjectAlumnos = managingSubject.alumnos;
      }
    }

    const updatedMaterias = data.materias.map(m => {
      if (m.id === managingSubject.id) {
        return { ...m, alumnos: updatedSubjectAlumnos };
      }
      return m;
    });

    setManagingSubject({ ...managingSubject, alumnos: updatedSubjectAlumnos });
    onUpdateData({
      ...data,
      materias: updatedMaterias
    });
    showToast("Inscripción de alumno actualizada.", "success");
  };

  const cardClass = `p-6 rounded-2xl border ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800'}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold">Gestión de Materias y Talleres</h2>
          <p className={`text-xs mt-0.5 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            Administre las materias, horarios, días y alumnos inscriptos en CPU Batán
          </p>
        </div>
        {role === 'admin' && (
          <button
            onClick={handleOpenAdd}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-md transition"
          >
            <Plus className="w-4 h-4" />
            <span>Nueva Materia / Taller</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {data.materias.map(m => (
          <div key={m.id} className={cardClass}>
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 rounded-2xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                <BookOpen className="w-6 h-6" />
              </div>
              <div className="flex items-center space-x-1">
                {role === 'admin' && (
                  <>
                    <button
                      onClick={() => handleOpenEdit(m)}
                      className="p-2 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                      title="Editar materia"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteSubject(m.id, m.nombre)}
                      className="p-2 rounded-xl hover:bg-red-100 dark:hover:bg-red-950/60 text-red-600 transition"
                      title="Eliminar materia"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            </div>

            <h3 className="font-bold text-lg mb-2">{m.nombre}</h3>
            
            <div className="space-y-2 mb-6 text-xs text-slate-500 dark:text-slate-400">
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4" />
                <span>Días: {m.dias?.join(', ') || 'No especificados'}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4" />
                <span>Horario: {m.horario || 'No especificado'}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4" />
                <span className="font-bold text-blue-600 dark:text-blue-400">{m.alumnos.length} alumnos inscriptos</span>
              </div>
            </div>

            <button
              onClick={() => setManagingSubject(m)}
              style={{
                backgroundColor: darkMode ? '#334155' : '#f1f5f9',
                color: darkMode ? '#f1f5f9' : '#1e293b'
              }}
              className="w-full py-2.5 rounded-xl transition text-xs font-bold flex items-center justify-center space-x-2 hover:!bg-blue-600 hover:!text-white"
            >
              <Users className="w-4 h-4" />
              <span>Gestionar Alumnos Inscriptos</span>
            </button>
          </div>
        ))}
      </div>

      {/* Add / Edit Subject Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className={`w-full max-w-md rounded-3xl p-6 shadow-2xl border ${
            darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800'
          }`}>
            <h3 className="text-lg font-bold mb-4">
              {editingSubject ? 'Editar Materia / Taller' : 'Nueva Materia / Taller'}
            </h3>

            <form onSubmit={handleSaveSubject} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1">Nombre de la Materia / Taller</label>
                <input
                  type="text"
                  required
                  placeholder="ej. Taller de Carpintería, Informática..."
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  className={`w-full px-4 py-2.5 rounded-xl border text-sm ${
                    darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Días de cursada</label>
                <input
                  type="text"
                  placeholder="ej. Lunes y Miércoles"
                  value={formData.dias}
                  onChange={(e) => setFormData({ ...formData, dias: e.target.value })}
                  className={`w-full px-4 py-2.5 rounded-xl border text-sm ${
                    darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Horario</label>
                <input
                  type="text"
                  placeholder="ej. 09:00 a 11:00"
                  value={formData.horario}
                  onChange={(e) => setFormData({ ...formData, horario: e.target.value })}
                  className={`w-full px-4 py-2.5 rounded-xl border text-sm ${
                    darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                />
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-sm font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-md"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Managing Students in Subject Modal */}
      {managingSubject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className={`w-full max-w-xl max-h-[85vh] flex flex-col rounded-3xl p-6 shadow-2xl border ${
            darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800'
          }`}>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h3 className="text-lg font-bold">Inscripción a: {managingSubject.nombre}</h3>
                <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  Marque o desmarque los alumnos que cursan esta materia
                </p>
              </div>
              <button
                onClick={() => setManagingSubject(null)}
                className="p-1.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {data.alumnos.map(alu => {
                const isEnrolled = managingSubject.alumnos.some(s => s.id === alu.id);
                return (
                  <div
                    key={alu.id}
                    onClick={() => role === 'admin' && handleToggleStudentInSubject(alu.id)}
                    className={`p-3 rounded-xl border flex items-center justify-between transition cursor-pointer ${
                      isEnrolled 
                        ? darkMode ? 'bg-blue-950/40 border-blue-800 text-white' : 'bg-blue-50 border-blue-200 text-blue-900'
                        : darkMode ? 'bg-slate-800 border-slate-700 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    <div>
                      <p className="font-bold text-sm">{alu.apellido}, {alu.nombre}</p>
                      <p className="text-xs opacity-80">DNI: {alu.dni || '—'} • {alu.pabellon || 'Sin pabellón'}</p>
                    </div>
                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center border ${
                      isEnrolled ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-400'
                    }`}>
                      {isEnrolled && <Check className="w-4 h-4" />}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-4 mt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setManagingSubject(null)}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-md"
              >
                Cerrar y Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
