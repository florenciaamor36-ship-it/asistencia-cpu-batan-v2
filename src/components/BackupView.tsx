import React, { useState } from 'react';
import { AppData } from '../types';
import { Download, Upload, Database, FileJson, AlertTriangle, CheckCircle2, ShieldCheck } from 'lucide-react';
import * as XLSX from 'xlsx';

interface BackupViewProps {
  data: AppData;
  role: 'admin' | 'espectador';
  onUpdateData: (newData: AppData) => void;
  darkMode: boolean;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const BackupView: React.FC<BackupViewProps> = ({
  data,
  role,
  onUpdateData,
  darkMode,
  showToast
}) => {
  const [importFile, setImportFile] = useState<File | null>(null);
  const [parsedImportData, setParsedImportData] = useState<AppData | null>(null);
  const [importMode, setImportMode] = useState<'replace' | 'merge'>('replace');
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  const handleExportJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `respaldo_cpu_batan_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast("Respaldo JSON exportado correctamente.", "success");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (role === 'espectador') {
      showToast("Modo Espectador: No tiene permisos para importar respaldos.", "error");
      return;
    }

    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const raw = JSON.parse(event.target?.result as string);
        const json = raw && raw.record && raw.record.materias ? raw.record : raw;
        if (!json || !json.materias || !json.alumnos) {
          showToast("El archivo JSON no tiene la estructura válida de CPU Batán.", "error");
          return;
        }
        setParsedImportData(json);
        setShowPreviewModal(true);
      } catch (err) {
        showToast("Error al leer o analizar el archivo JSON.", "error");
      }
    };
    reader.readAsText(file);
  };

  const handleConfirmImport = () => {
    if (!parsedImportData) return;

    let finalData: AppData;
    if (importMode === 'replace') {
      finalData = parsedImportData;
    } else {
      // Merge logic
      const existingAlumnosMap = new Map(data.alumnos.map(a => [a.id, a]));
      parsedImportData.alumnos.forEach(a => existingAlumnosMap.set(a.id, a));

      const existingWorkersMap = new Map(data.trabajadores.map(t => [t.id, t]));
      parsedImportData.trabajadores.forEach(t => existingWorkersMap.set(t.id, t));

      finalData = {
        materias: parsedImportData.materias,
        alumnos: Array.from(existingAlumnosMap.values()),
        trabajadores: Array.from(existingWorkersMap.values()),
        version: parsedImportData.version || 1,
        last_updated: new Date().toISOString()
      };
    }

    onUpdateData(finalData);
    setShowPreviewModal(false);
    setParsedImportData(null);
    showToast("Datos importados y respaldados correctamente.", "success");
  };

  const cardClass = `p-6 rounded-2xl border ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800'}`;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">Respaldo y Migración de Base de Datos</h2>
        <p className={`text-xs mt-0.5 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
          Exportación de respaldos completos en formato JSON y restauración segura del sistema.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Export Card */}
        <div className={cardClass}>
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-3 rounded-2xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
              <Download className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-base">Exportar Respaldo Completo</h3>
              <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Descarga el archivo JSON con toda la estructura</p>
            </div>
          </div>
          <p className={`text-sm mb-6 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
            El archivo generado contendrá todas las materias, fechas, alumnos, asistencias por fecha, trabajadores y observaciones, conservando todos los identificadores originales.
          </p>
          <button
            onClick={handleExportJson}
            className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-md transition flex items-center justify-center space-x-2"
          >
            <FileJson className="w-4 h-4" />
            <span>Descargar Respaldo JSON</span>
          </button>
        </div>

        {/* Import Card */}
        <div className={cardClass}>
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-3 rounded-2xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
              <Upload className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-base">Importar Respaldo / Migración</h3>
              <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Restaurar o actualizar desde archivo JSON</p>
            </div>
          </div>
          <p className={`text-sm mb-6 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
            {role === 'espectador' ? (
              <span className="text-amber-500 font-medium">Modo Espectador: La importación de respaldos requiere iniciar sesión como Administrador.</span>
            ) : (
              'Seleccione un archivo JSON de respaldo válido para importar materias, alumnos y asistencias.'
            )}
          </p>
          
          <label className={`w-full py-3 rounded-xl border-2 border-dashed flex items-center justify-center space-x-2 text-sm font-semibold transition cursor-pointer ${
            role === 'espectador' 
              ? 'opacity-50 cursor-not-allowed border-slate-700' 
              : darkMode ? 'border-slate-700 hover:border-blue-500 text-slate-300' : 'border-slate-300 hover:border-blue-500 text-slate-700'
          }`}>
            <Upload className="w-4 h-4" />
            <span>Seleccionar archivo JSON</span>
            <input
              type="file"
              accept=".json"
              disabled={role === 'espectador'}
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Import Preview Modal */}
      {showPreviewModal && parsedImportData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className={`w-full max-w-lg rounded-3xl p-6 shadow-2xl border ${darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800'}`}>
            <h3 className="text-lg font-bold mb-2 flex items-center">
              <CheckCircle2 className="w-5 h-5 mr-2 text-emerald-500" />
              Resumen de Datos del Respaldo
            </h3>
            <p className={`text-xs mb-4 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              Verifique la estructura antes de proceder con la importación.
            </p>

            <div className={`p-4 rounded-2xl space-y-2 text-sm mb-6 ${darkMode ? 'bg-slate-800' : 'bg-slate-50'}`}>
              <div className="flex justify-between">
                <span className="text-slate-400">Materias encontradas:</span>
                <span className="font-bold">{parsedImportData.materias?.length || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Alumnos en padrón general:</span>
                <span className="font-bold">{parsedImportData.alumnos?.length || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Trabajadores registrados:</span>
                <span className="font-bold">{parsedImportData.trabajadores?.length || 0}</span>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-xs font-semibold mb-2">Modo de importación:</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setImportMode('replace')}
                  className={`p-3 rounded-xl border text-xs font-bold transition ${
                    importMode === 'replace' ? 'bg-blue-600 border-blue-600 text-white' : darkMode ? 'border-slate-700 text-slate-300' : 'border-slate-200 text-slate-700'
                  }`}
                >
                  Reemplazar Todo
                </button>
                <button
                  type="button"
                  onClick={() => setImportMode('merge')}
                  className={`p-3 rounded-xl border text-xs font-bold transition ${
                    importMode === 'merge' ? 'bg-blue-600 border-blue-600 text-white' : darkMode ? 'border-slate-700 text-slate-300' : 'border-slate-200 text-slate-700'
                  }`}
                >
                  Combinar Datos
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={() => { setShowPreviewModal(false); setParsedImportData(null); }}
                className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-sm font-medium"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmImport}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-md"
              >
                Confirmar Importación
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
