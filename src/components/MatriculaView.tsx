import React, { useState, useMemo } from 'react';
import { AppData, Student } from '../types';
import { 
  Search, 
  Filter, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  FileSpreadsheet, 
  AlertCircle, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  UserCheck
} from 'lucide-react';
import * as XLSX from 'xlsx';

interface MatriculaViewProps {
  data: AppData;
  role: 'admin' | 'espectador';
  onUpdateData: (newData: AppData) => void;
  onViewStudentDetail: (student: Student) => void;
  onOpenDuplicateModal: () => void;
  darkMode: boolean;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const MatriculaView: React.FC<MatriculaViewProps> = ({
  data,
  role,
  onUpdateData,
  onViewStudentDetail,
  onOpenDuplicateModal,
  darkMode,
  showToast
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [pabellonFilter, setPabellonFilter] = useState('todos');
  const [materiaFilter, setMateriaFilter] = useState('todas');
  const [carnetFilter, setCarnetFilter] = useState('todos');
  const [sortBy, setSortBy] = useState<'apellido_asc' | 'apellido_desc' | 'nombre_asc' | 'nombre_desc' | 'pabellon' | 'dni'>('apellido_asc');

  // Modal states for Add / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [formData, setFormData] = useState({
    apellido: '',
    nombre: '',
    dni: '',
    pabellon: '',
    fecha_inscripcion: new Date().toISOString().split('T')[0],
    fecha_vencimiento_carnet: '',
    observaciones: '',
    selectedMaterias: [] as string[]
  });

  // Extract unique pabellones
  const pabellones = useMemo(() => {
    const set = new Set<string>();
    data.alumnos.forEach(a => { if (a.pabellon) set.add(a.pabellon); });
    return Array.from(set).sort();
  }, [data.alumnos]);

  // Filter and sort students
  const filteredStudents = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];

    return data.alumnos.filter(alu => {
      const query = searchQuery.toLowerCase();
      const matchQuery = 
        (alu.apellido && alu.apellido.toLowerCase().includes(query)) ||
        (alu.nombre && alu.nombre.toLowerCase().includes(query)) ||
        (alu.dni && alu.dni.includes(query)) ||
        (alu.pabellon && alu.pabellon.toLowerCase().includes(query));

      if (!matchQuery) return false;

      if (pabellonFilter !== 'todos' && alu.pabellon !== pabellonFilter) return false;

      if (materiaFilter !== 'todas') {
        const isInMat = data.materias.some(m => m.id === materiaFilter && m.alumnos.some(s => s.id === alu.id));
        if (!isInMat) return false;
      }

      if (carnetFilter !== 'todos') {
        if (!alu.fecha_vencimiento_carnet) {
          if (carnetFilter !== 'sin_fecha') return false;
        } else {
          const isVencido = alu.fecha_vencimiento_carnet < today;
          const diffDays = Math.ceil((new Date(alu.fecha_vencimiento_carnet).getTime() - new Date(today).getTime()) / (1000 * 60 * 60 * 24));
          const isProximo = !isVencido && diffDays <= 30;
          const isVigente = !isVencido && !isProximo;

          if (carnetFilter === 'vencido' && !isVencido) return false;
          if (carnetFilter === 'proximo' && !isProximo) return false;
          if (carnetFilter === 'vigente' && !isVigente) return false;
        }
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'apellido_asc') return (a.apellido || '').localeCompare(b.apellido || '');
      if (sortBy === 'apellido_desc') return (b.apellido || '').localeCompare(a.apellido || '');
      if (sortBy === 'nombre_asc') return (a.nombre || '').localeCompare(b.nombre || '');
      if (sortBy === 'nombre_desc') return (b.nombre || '').localeCompare(a.nombre || '');
      if (sortBy === 'pabellon') return (a.pabellon || '').localeCompare(b.pabellon || '');
      if (sortBy === 'dni') return (a.dni || '').localeCompare(b.dni || '');
      return 0;
    });
  }, [data, searchQuery, pabellonFilter, materiaFilter, carnetFilter, sortBy]);

  // Helper for carnet status badge
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

  // Get student's subjects
  const getStudentSubjects = (studentId: string) => {
    return data.materias.filter(m => m.alumnos.some(s => s.id === studentId)).map(m => m.nombre);
  };

  const handleOpenAdd = () => {
    setEditingStudent(null);
    setFormData({
      apellido: '',
      nombre: '',
      dni: '',
      pabellon: pabellones[0] || 'Pabellón 1',
      fecha_inscripcion: new Date().toISOString().split('T')[0],
      fecha_vencimiento_carnet: '',
      observaciones: '',
      selectedMaterias: []
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (student: Student) => {
    setEditingStudent(student);
    const studentSubjects = data.materias.filter(m => m.alumnos.some(s => s.id === student.id)).map(m => m.id);
    setFormData({
      apellido: student.apellido || '',
      nombre: student.nombre || '',
      dni: student.dni || '',
      pabellon: student.pabellon || '',
      fecha_inscripcion: student.fecha_inscripcion || '',
      fecha_vencimiento_carnet: student.fecha_vencimiento_carnet || '',
      observaciones: student.observaciones || '',
      selectedMaterias: studentSubjects
    });
    setIsModalOpen(true);
  };

  const handleSaveStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.apellido.trim() || !formData.nombre.trim()) {
      showToast("Apellido y nombre son obligatorios.", "error");
      return;
    }

    const targetId = editingStudent ? editingStudent.id : `alu_${Date.now()}`;
    const studentData: Student = {
      id: targetId,
      apellido: formData.apellido.toUpperCase(),
      nombre: formData.nombre.toUpperCase(),
      dni: formData.dni,
      pabellon: formData.pabellon,
      fecha_inscripcion: formData.fecha_inscripcion,
      fecha_vencimiento_carnet: formData.fecha_vencimiento_carnet,
      observaciones: formData.observaciones,
      asist: editingStudent ? editingStudent.asist : {}
    };

    const updatedAlumnos = [...data.alumnos];
    if (editingStudent) {
      const index = updatedAlumnos.findIndex(a => a.id === editingStudent.id);
      if (index !== -1) {
        updatedAlumnos[index] = { ...updatedAlumnos[index], ...studentData };
      }
      showToast("Alumno actualizado correctamente.", "success");
    } else {
      updatedAlumnos.push(studentData);
      showToast("Nuevo alumno agregado correctamente.", "success");
    }

    // Update materias enrollment based on selectedMaterias
    const updatedMaterias = data.materias.map(m => {
      const shouldBeIn = formData.selectedMaterias.includes(m.id);
      const currentlyIn = m.alumnos.some(s => s.id === targetId);

      let newAlumnos = [...m.alumnos];
      if (shouldBeIn && !currentlyIn) {
        newAlumnos.push(updatedAlumnos.find(a => a.id === targetId)!);
      } else if (!shouldBeIn && currentlyIn) {
        newAlumnos = newAlumnos.filter(s => s.id !== targetId);
      } else if (shouldBeIn && currentlyIn) {
        newAlumnos = newAlumnos.map(s => s.id === targetId ? { ...s, ...studentData } : s);
      }
      return { ...m, alumnos: newAlumnos };
    });

    onUpdateData({
      ...data,
      alumnos: updatedAlumnos,
      materias: updatedMaterias
    });
    setIsModalOpen(false);
  };

  const handleDeleteStudent = (studentId: string, name: string) => {
    if (!window.confirm(`¿Confirma que desea eliminar al alumno ${name}? Esta acción no se puede deshacer.`)) {
      return;
    }

    const updatedAlumnos = data.alumnos.filter(a => a.id !== studentId);
    const updatedMaterias = data.materias.map(m => ({
      ...m,
      alumnos: m.alumnos.filter(s => s.id !== studentId)
    }));

    onUpdateData({
      ...data,
      alumnos: updatedAlumnos,
      materias: updatedMaterias
    });
    showToast("Alumno eliminado correctamente.", "info");
  };

  const handleExportExcel = () => {
    const exportData = filteredStudents.map((alu, idx) => ({
      'N°': idx + 1,
      'APELLIDO': alu.apellido,
      'NOMBRE': alu.nombre,
      'DNI': alu.dni || 'Sin DNI',
      'PABELLÓN': alu.pabellon || 'Sin Pabellón',
      'FECHA INSCRIPCIÓN': alu.fecha_inscripcion || '',
      'VENCIMIENTO CARNET': alu.fecha_vencimiento_carnet || '',
      'MATERIAS': getStudentSubjects(alu.id).join(', '),
      'OBSERVACIONES': alu.observaciones || ''
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Matrícula Alumnos");
    XLSX.writeFile(workbook, `matricula_cpu_batan_${new Date().toISOString().split('T')[0]}.xlsx`);
    showToast("Matrícula exportada a Excel correctamente.", "success");
  };

  return (
    <div className="space-y-6">
      {/* Header controls & actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold">Matrícula Completa de Alumnos</h2>
          <p className={`text-xs mt-0.5 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            Mostrando {filteredStudents.length} de {data.alumnos.length} alumnos registrados
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onOpenDuplicateModal}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-xs transition"
          >
            <AlertCircle className="w-4 h-4" />
            <span>Detectar Duplicados</span>
          </button>

          <button
            onClick={handleExportExcel}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Exportar Excel</span>
          </button>

          {role === 'admin' && (
            <button
              onClick={handleOpenAdd}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition"
            >
              <Plus className="w-4 h-4" />
              <span>Nuevo Alumno</span>
            </button>
          )}
        </div>
      </div>

      {/* Search & Filters Bar */}
      <div className={`p-4 rounded-2xl border grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 ${
        darkMode ? 'bg-slate-800/80 border-slate-700' : 'bg-white border-slate-200'
      }`}>
        {/* Search */}
        <div className="relative sm:col-span-2">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por apellido, nombre, DNI o pabellón..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full pl-10 pr-4 py-2 rounded-xl border text-sm transition focus:outline-hidden focus:ring-2 focus:ring-blue-500 ${
              darkMode ? 'bg-slate-900 border-slate-700 text-white placeholder-slate-500' : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
            }`}
          />
        </div>

        {/* Pabellón Filter */}
        <div>
          <select
            value={pabellonFilter}
            onChange={(e) => setPabellonFilter(e.target.value)}
            className={`w-full px-3 py-2 rounded-xl border text-sm transition ${
              darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
            }`}
          >
            <option value="todos">Todos los pabellones</option>
            {pabellones.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>

        {/* Materia Filter */}
        <div>
          <select
            value={materiaFilter}
            onChange={(e) => setMateriaFilter(e.target.value)}
            className={`w-full px-3 py-2 rounded-xl border text-sm transition ${
              darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
            }`}
          >
            <option value="todas">Todas las materias</option>
            {data.materias.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
          </select>
        </div>

        {/* Carnet Filter */}
        <div>
          <select
            value={carnetFilter}
            onChange={(e) => setCarnetFilter(e.target.value)}
            className={`w-full px-3 py-2 rounded-xl border text-sm transition ${
              darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
            }`}
          >
            <option value="todos">Estado de carnet (Todos)</option>
            <option value="vigente">Vigente</option>
            <option value="proximo">Próximo a vencer</option>
            <option value="vencido">Vencido</option>
            <option value="sin_fecha">Sin carnet</option>
          </select>
        </div>
      </div>

      {/* Sorting bar */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-1 text-xs">
        <span className={`font-medium ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Ordenar por:</span>
        <button
          onClick={() => setSortBy('apellido_asc')}
          className={`shrink-0 whitespace-nowrap px-3 py-1 rounded-lg font-medium transition ${sortBy === 'apellido_asc' ? 'bg-blue-600 text-white' : darkMode ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
        >
          Apellido A-Z
        </button>
        <button
          onClick={() => setSortBy('apellido_desc')}
          className={`shrink-0 whitespace-nowrap px-3 py-1 rounded-lg font-medium transition ${sortBy === 'apellido_desc' ? 'bg-blue-600 text-white' : darkMode ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
        >
          Apellido Z-A
        </button>
        <button
          onClick={() => setSortBy('nombre_asc')}
          className={`shrink-0 whitespace-nowrap px-3 py-1 rounded-lg font-medium transition ${sortBy === 'nombre_asc' ? 'bg-blue-600 text-white' : darkMode ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
        >
          Nombre A-Z
        </button>
        <button
          onClick={() => setSortBy('pabellon')}
          className={`shrink-0 whitespace-nowrap px-3 py-1 rounded-lg font-medium transition ${sortBy === 'pabellon' ? 'bg-blue-600 text-white' : darkMode ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
        >
          Pabellón
        </button>
        <button
          onClick={() => setSortBy('dni')}
          className={`shrink-0 whitespace-nowrap px-3 py-1 rounded-lg font-medium transition ${sortBy === 'dni' ? 'bg-blue-600 text-white' : darkMode ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
        >
          DNI
        </button>
      </div>

      {/* Students Table */}
      <div className={`rounded-2xl border overflow-hidden shadow-xs ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800'}`}>
        <div className="w-full max-w-full max-h-[70vh] overflow-auto rounded-b-2xl">
          <table className="w-max min-w-full text-left border-collapse">
            <thead>
              <tr className={`border-b text-xs uppercase tracking-wider sticky top-0 z-20 ${darkMode ? 'bg-slate-900 border-slate-700 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
                <th className="py-3.5 px-4 font-semibold">Alumno</th>
                <th className="py-3.5 px-4 font-semibold whitespace-nowrap">DNI</th>
                <th className="py-3.5 px-4 font-semibold">Pabellón</th>
                <th className="py-3.5 px-4 font-semibold">Inscripción</th>
                <th className="py-3.5 px-4 font-semibold">Carnet</th>
                <th className="py-3.5 px-4 font-semibold">Materias</th>
                <th className="py-3.5 px-4 font-semibold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700 text-sm">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No se encontraron alumnos con los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((alu) => {
                  const studentSubjects = getStudentSubjects(alu.id);
                  return (
                    <tr key={alu.id} className={`transition-colors ${darkMode ? 'hover:bg-slate-750' : 'hover:bg-slate-50'}`}>
                      <td className="py-3 px-4 font-medium">
                        <div className="font-bold">{alu.apellido}, {alu.nombre}</div>
                        {alu.observaciones && (
                          <div className={`text-xs truncate max-w-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                            {alu.observaciones}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono text-xs whitespace-nowrap">{alu.dni || '—'}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                          darkMode ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {alu.pabellon || 'Sin asignar'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-xs">{alu.fecha_inscripcion || '—'}</td>
                      <td className="py-3 px-4">{getCarnetStatus(alu.fecha_vencimiento_carnet)}</td>
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {studentSubjects.length === 0 ? (
                            <span className="text-xs text-slate-400">Sin materias</span>
                          ) : (
                            studentSubjects.map((sName, i) => (
                              <span key={i} className={`text-[10px] px-2 py-0.5 rounded-md font-medium ${
                                darkMode ? 'bg-blue-950/60 text-blue-300 border border-blue-800/40' : 'bg-blue-50 text-blue-700 border border-blue-200'
                              }`}>
                                {sName}
                              </span>
                            ))
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end space-x-1">
                          <button
                            onClick={() => onViewStudentDetail(alu)}
                            className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-blue-600 dark:text-blue-400 transition"
                            title="Ver ficha e historial"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {role === 'admin' && (
                            <>
                              <button
                                onClick={() => handleOpenEdit(alu)}
                                className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-amber-600 dark:text-amber-400 transition"
                                title="Editar alumno"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteStudent(alu.id, `${alu.apellido}, ${alu.nombre}`)}
                                className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-red-600 dark:text-red-400 transition"
                                title="Eliminar alumno"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
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

      {/* Add / Edit Student Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className={`w-full max-w-lg rounded-3xl p-6 shadow-2xl border ${
            darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800'
          }`}>
            <h3 className="text-lg font-bold mb-4">
              {editingStudent ? 'Editar Alumno' : 'Nuevo Alumno'}
            </h3>

            <form onSubmit={handleSaveStudent} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium mb-1">Apellido *</label>
                  <input
                    type="text"
                    required
                    value={formData.apellido}
                    onChange={(e) => setFormData({ ...formData, apellido: e.target.value })}
                    className={`w-full px-3 py-2 rounded-xl border text-sm ${
                      darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                    placeholder="Ej. PÉREZ"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Nombre *</label>
                  <input
                    type="text"
                    required
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    className={`w-full px-3 py-2 rounded-xl border text-sm ${
                      darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                    placeholder="Ej. JUAN CARLOS"
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
                    className={`w-full px-3 py-2 rounded-xl border text-sm ${
                      darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                    placeholder="Ej. 35123456"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Pabellón</label>
                  <input
                    type="text"
                    value={formData.pabellon}
                    onChange={(e) => setFormData({ ...formData, pabellon: e.target.value })}
                    className={`w-full px-3 py-2 rounded-xl border text-sm ${
                      darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                    placeholder="Ej. Pabellón 4"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium mb-1">Fecha de Inscripción</label>
                  <input
                    type="date"
                    value={formData.fecha_inscripcion}
                    onChange={(e) => setFormData({ ...formData, fecha_inscripcion: e.target.value })}
                    className={`w-full px-3 py-2 rounded-xl border text-sm ${
                      darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Vencimiento del Carnet</label>
                  <input
                    type="date"
                    value={formData.fecha_vencimiento_carnet}
                    onChange={(e) => setFormData({ ...formData, fecha_vencimiento_carnet: e.target.value })}
                    className={`w-full px-3 py-2 rounded-xl border text-sm ${
                      darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-2">Asignar a Materias y Talleres</label>
                <div className={`grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-36 overflow-y-auto p-2.5 rounded-xl border ${
                  darkMode ? 'border-slate-700 bg-slate-800 text-slate-100' : 'border-slate-200 bg-slate-50 text-slate-800'
                }`}>
                  {data.materias.map(m => {
                    const isChecked = formData.selectedMaterias.includes(m.id);
                    return (
                      <label key={m.id} className={`flex items-center space-x-2 text-xs cursor-pointer p-1 rounded ${darkMode ? 'hover:bg-slate-700/50' : 'hover:bg-slate-200/50'}`}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            const newSel = e.target.checked
                              ? [...formData.selectedMaterias, m.id]
                              : formData.selectedMaterias.filter(id => id !== m.id);
                            setFormData({ ...formData, selectedMaterias: newSel });
                          }}
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                        />
                        <span className="font-medium truncate">{m.nombre}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium mb-1">Observaciones</label>
                <textarea
                  rows={2}
                  value={formData.observaciones}
                  onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                  className={`w-full px-3 py-2 rounded-xl border text-sm ${
                    darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                  placeholder="Notas adicionales..."
                ></textarea>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-md transition"
                >
                  Guardar Alumno
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
