import React, { useState, useMemo } from 'react';
import { AppData, Worker } from '../types';
import { 
  Briefcase, 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  FileSpreadsheet, 
  ShieldAlert, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle 
} from 'lucide-react';
import * as XLSX from 'xlsx';

interface TrabajadoresViewProps {
  data: AppData;
  role: 'admin' | 'espectador';
  onUpdateData: (newData: AppData) => void;
  darkMode: boolean;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const TrabajadoresView: React.FC<TrabajadoresViewProps> = ({
  data,
  role,
  onUpdateData,
  darkMode,
  showToast
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingWorker, setEditingWorker] = useState<Worker | null>(null);
  
  const [formData, setFormData] = useState({
    apellido: '',
    nombre: '',
    dni: '',
    pabellon: '',
    puesto: '',
    vencimiento_carnet: '',
    observaciones: ''
  });

  const filteredWorkers = useMemo(() => {
    return data.trabajadores.filter(t => {
      const q = searchQuery.toLowerCase();
      return (
        (t.apellido && t.apellido.toLowerCase().includes(q)) ||
        (t.nombre && t.nombre.toLowerCase().includes(q)) ||
        (t.dni && t.dni.includes(q)) ||
        (t.puesto && t.puesto.toLowerCase().includes(q)) ||
        (t.pabellon && t.pabellon.toLowerCase().includes(q))
      );
    }).sort((a, b) => (a.apellido || '').localeCompare(b.apellido || ''));
  }, [data.trabajadores, searchQuery]);

  const getCarnetStatus = (fechaVenc: string) => {
    if (!fechaVenc) return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">Sin carnet</span>;
    const today = new Date().toISOString().split('T')[0];
    if (fechaVenc < today) {
      return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300 flex items-center w-max"><XCircle className="w-3 h-3 mr-1" /> Vencido</span>;
    }
    const diffDays = Math.ceil((new Date(fechaVenc).getTime() - new Date(today).getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays <= 30) {
      return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 flex items-center w-max"><AlertTriangle className="w-3 h-3 mr-1" /> Próximo ({diffDays}d)</span>;
    }
    return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 flex items-center w-max"><CheckCircle2 className="w-3 h-3 mr-1" /> Vigente</span>;
  };

  const handleOpenAdd = () => {
    setEditingWorker(null);
    setFormData({
      apellido: '',
      nombre: '',
      dni: '',
      pabellon: 'Administración',
      puesto: '',
      vencimiento_carnet: '',
      observaciones: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (worker: Worker) => {
    setEditingWorker(worker);
    setFormData({
      apellido: worker.apellido || '',
      nombre: worker.nombre || '',
      dni: worker.dni || '',
      pabellon: worker.pabellon || '',
      puesto: worker.puesto || '',
      vencimiento_carnet: worker.vencimiento_carnet || '',
      observaciones: worker.observaciones || ''
    });
    setIsModalOpen(true);
  };

  const handleSaveWorker = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.apellido.trim() || !formData.nombre.trim()) {
      showToast("Apellido y nombre son obligatorios.", "error");
      return;
    }

    const updatedTrabajadores = [...data.trabajadores];

    if (editingWorker) {
      const index = updatedTrabajadores.findIndex(t => t.id === editingWorker.id);
      if (index !== -1) {
        updatedTrabajadores[index] = {
          ...editingWorker,
          ...formData,
          apellido: formData.apellido.toUpperCase(),
          nombre: formData.nombre.toUpperCase(),
          puesto: formData.puesto.toUpperCase()
        };
      }
      showToast("Trabajador actualizado correctamente.", "success");
    } else {
      const newWorker: Worker = {
        id: `trab_${Date.now()}`,
        apellido: formData.apellido.toUpperCase(),
        nombre: formData.nombre.toUpperCase(),
        dni: formData.dni,
        pabellon: formData.pabellon,
        puesto: formData.puesto.toUpperCase(),
        vencimiento_carnet: formData.vencimiento_carnet,
        observaciones: formData.observaciones
      };
      updatedTrabajadores.push(newWorker);
      showToast("Nuevo trabajador agregado correctamente.", "success");
    }

    onUpdateData({
      ...data,
      trabajadores: updatedTrabajadores
    });
    setIsModalOpen(false);
  };

  const handleDeleteWorker = (workerId: string, name: string) => {
    if (!window.confirm(`¿Confirma que desea eliminar al trabajador ${name}?`)) return;

    const updatedTrabajadores = data.trabajadores.filter(t => t.id !== workerId);
    onUpdateData({
      ...data,
      trabajadores: updatedTrabajadores
    });
    showToast("Trabajador eliminado.", "info");
  };

  const handleExportExcel = () => {
    const exportData = filteredWorkers.map((t, idx) => ({
      'N°': idx + 1,
      'APELLIDO': t.apellido,
      'NOMBRE': t.nombre,
      'DNI': t.dni || '',
      'PUESTO': t.puesto,
      'ÁREA / PABELLÓN': t.pabellon,
      'VENCIMIENTO CARNET': t.vencimiento_carnet || '',
      'OBSERVACIONES': t.observaciones || ''
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Trabajadores CPU");
    XLSX.writeFile(wb, `trabajadores_cpu_batan_${new Date().toISOString().split('T')[0]}.xlsx`);
    showToast("Trabajadores exportados a Excel.", "success");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold">Trabajadores y Personal de CPU Batán</h2>
          <p className={`text-xs mt-0.5 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            Registro institucional del personal y colaboradores ({filteredWorkers.length})
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleExportExcel}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Exportar Excel</span>
          </button>

          {role === 'admin' && (
            <button
              onClick={handleOpenAdd}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition"
            >
              <Plus className="w-4 h-4" />
              <span>Nuevo Trabajador</span>
            </button>
          )}
        </div>
      </div>

      {/* Search Bar */}
      <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
        <div className="relative">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por apellido, nombre, puesto o DNI..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full pl-10 pr-4 py-2 rounded-xl border text-sm ${
              darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
            }`}
          />
        </div>
      </div>

      {/* Table */}
      <div className={`rounded-2xl border overflow-hidden shadow-xs ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800'}`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className={`border-b text-xs uppercase tracking-wider ${darkMode ? 'bg-slate-900/80 border-slate-700 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
                <th className="py-3.5 px-4 font-semibold">Personal</th>
                <th className="py-3.5 px-4 font-semibold">DNI</th>
                <th className="py-3.5 px-4 font-semibold">Puesto</th>
                <th className="py-3.5 px-4 font-semibold">Área / Pabellón</th>
                <th className="py-3.5 px-4 font-semibold">Venc. Carnet</th>
                <th className="py-3.5 px-4 font-semibold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700 text-sm">
              {filteredWorkers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No se encontraron trabajadores registrados.
                  </td>
                </tr>
              ) : (
                filteredWorkers.map((t) => (
                  <tr key={t.id} className={`transition-colors ${darkMode ? 'hover:bg-slate-750' : 'hover:bg-slate-50'}`}>
                    <td className="py-3.5 px-4 font-bold">{t.apellido}, {t.nombre}</td>
                    <td className="py-3.5 px-4 font-mono text-xs">{t.dni || '—'}</td>
                    <td className="py-3.5 px-4 font-medium text-blue-600 dark:text-blue-400">{t.puesto}</td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${darkMode ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-700'}`}>
                        {t.pabellon}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">{getCarnetStatus(t.vencimiento_carnet)}</td>
                    <td className="py-3.5 px-4 text-right">
                      {role === 'admin' && (
                        <div className="flex items-center justify-end space-x-1">
                          <button
                            onClick={() => handleOpenEdit(t)}
                            className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-amber-600 dark:text-amber-400 transition"
                            title="Editar"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteWorker(t.id, `${t.apellido}, ${t.nombre}`)}
                            className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-red-600 dark:text-red-400 transition"
                            title="Eliminar"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add/Edit Worker */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className={`w-full max-w-lg rounded-3xl p-6 shadow-2xl border ${darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800'}`}>
            <h3 className="text-lg font-bold mb-4">{editingWorker ? 'Editar Trabajador' : 'Nuevo Trabajador'}</h3>
            <form onSubmit={handleSaveWorker} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium mb-1">Apellido *</label>
                  <input
                    type="text"
                    required
                    value={formData.apellido}
                    onChange={(e) => setFormData({ ...formData, apellido: e.target.value })}
                    className={`w-full px-3 py-2 rounded-xl border text-sm ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Nombre *</label>
                  <input
                    type="text"
                    required
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    className={`w-full px-3 py-2 rounded-xl border text-sm ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium mb-1">DNI</label>
                  <input
                    type="text"
                    value={formData.dni}
                    onChange={(e) => setFormData({ ...formData, dni: e.target.value })}
                    className={`w-full px-3 py-2 rounded-xl border text-sm ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Puesto / Cargo</label>
                  <input
                    type="text"
                    required
                    value={formData.puesto}
                    onChange={(e) => setFormData({ ...formData, puesto: e.target.value })}
                    className={`w-full px-3 py-2 rounded-xl border text-sm ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium mb-1">Área / Pabellón</label>
                  <input
                    type="text"
                    value={formData.pabellon}
                    onChange={(e) => setFormData({ ...formData, pabellon: e.target.value })}
                    className={`w-full px-3 py-2 rounded-xl border text-sm ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Vencimiento del Carnet</label>
                  <input
                    type="date"
                    value={formData.vencimiento_carnet}
                    onChange={(e) => setFormData({ ...formData, vencimiento_carnet: e.target.value })}
                    className={`w-full px-3 py-2 rounded-xl border text-sm ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium mb-1">Observaciones</label>
                <textarea
                  rows={2}
                  value={formData.observaciones}
                  onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                  className={`w-full px-3 py-2 rounded-xl border text-sm ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
                ></textarea>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3">
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
                  Guardar Trabajador
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
