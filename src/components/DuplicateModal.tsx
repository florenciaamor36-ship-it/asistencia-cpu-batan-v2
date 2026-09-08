import React from 'react';
import { AppData, Student } from '../types';
import { AlertTriangle, X, CheckCircle2 } from 'lucide-react';
import { StorageService } from '../services/storage';

interface DuplicateModalProps {
  data: AppData;
  onClose: () => void;
  onUpdateData: (newData: AppData) => void;
  darkMode: boolean;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const DuplicateModal: React.FC<DuplicateModalProps> = ({
  data,
  onClose,
  onUpdateData,
  darkMode,
  showToast
}) => {
  const duplicates = StorageService.findDuplicates(data.alumnos);

  const handleRemoveDuplicate = (duplicateId: string) => {
    if (!window.confirm("¿Confirma que desea eliminar este registro duplicado?")) return;

    const updatedAlumnos = data.alumnos.filter(a => a.id !== duplicateId);
    const updatedMaterias = data.materias.map(m => ({
      ...m,
      alumnos: m.alumnos.filter(s => s.id !== duplicateId)
    }));

    onUpdateData({
      ...data,
      alumnos: updatedAlumnos,
      materias: updatedMaterias
    });
    showToast("Registro duplicado eliminado.", "success");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className={`w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl p-6 shadow-2xl border relative ${
        darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800'
      }`}>
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-1.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center space-x-3 mb-6">
          <div className="p-3 rounded-2xl bg-amber-100 text-amber-600 dark:bg-amber-950/60">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold">Detección de Alumnos Duplicados</h3>
            <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              Revisión automática de registros coincidentes por DNI o Nombre y Apellido
            </p>
          </div>
        </div>

        {duplicates.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-2" />
            <p className="font-semibold text-base">¡No se encontraron alumnos duplicados!</p>
            <p className="text-xs text-slate-400 mt-1">El padrón general se encuentra limpio y sin coincidencias.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-xs text-amber-500 font-semibold">
              Se encontraron {duplicates.length} posibles duplicados. Decida manualmente cuál conservar:
            </p>
            {duplicates.map((item, idx) => (
              <div key={idx} className={`p-4 rounded-2xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-700 font-bold">
                    {item.reason}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs mb-3">
                  <div className="p-2.5 rounded-xl bg-black/5 dark:bg-white/5">
                    <p className="font-bold">Original: {item.duplicateOf.apellido}, {item.duplicateOf.nombre}</p>
                    <p className="text-slate-400">DNI: {item.duplicateOf.dni || '—'} | Pabellón: {item.duplicateOf.pabellon}</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20">
                    <p className="font-bold text-red-600 dark:text-red-400">Duplicado: {item.student.apellido}, {item.student.nombre}</p>
                    <p className="text-slate-400">DNI: {item.student.dni || '—'} | Pabellón: {item.student.pabellon}</p>
                  </div>
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={() => handleRemoveDuplicate(item.student.id)}
                    className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold transition"
                  >
                    Eliminar este duplicado
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
