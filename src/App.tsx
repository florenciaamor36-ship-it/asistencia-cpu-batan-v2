import React, { useState, useEffect } from 'react';
import { AppData, ViewMode, Student } from './types';
import { StorageService } from './services/storage';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { MatriculaView } from './components/MatriculaView';
import { MateriasView } from './components/MateriasView';
import { AsistenciaView } from './components/AsistenciaView';
import { TrabajadoresView } from './components/TrabajadoresView';
import { EstadisticasView } from './components/EstadisticasView';
import { BackupView } from './components/BackupView';
import { LoginModal } from './components/LoginModal';
import { StudentDetailModal } from './components/StudentDetailModal';
import { DuplicateModal } from './components/DuplicateModal';
import { Toast } from './components/Toast';
import { AboutView } from './components/AboutView';

export default function App() {
  const [data, setData] = useState<AppData | null>(null);
  const [currentView, setCurrentView] = useState<ViewMode>('dashboard');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
  const [role, setRole] = useState<'admin' | 'espectador'>(StorageService.getRole());
  const [darkMode, setDarkMode] = useState<boolean>(true);
  const [loadError, setLoadError] = useState(false);
  const [retryKey, setRetryKey] = useState(0);

  // Modals state
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [selectedStudentDetail, setSelectedStudentDetail] = useState<Student | null>(null);
  const [duplicateModalOpen, setDuplicateModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ msg: string; type: 'success' | 'error' | 'info' } | null>(null);

  useEffect(() => {
    let active = true;
    let stopRealtime = () => {};
    setData(null);
    setLoadError(false);

    // Carga inicial con timeout: si no hay red ni caché, mostramos la pantalla de conexión.
    StorageService.loadData().then(loaded => {
      if (!active) return;
      setData(loaded);
      if (loaded.materias && loaded.materias.length > 0) setSelectedSubjectId(loaded.materias[0].id);
      // Sincronización entre dispositivos: consulta Supabase cada 3 segundos.
      stopRealtime = StorageService.startRealtime((fresh) => setData(current => {
        if (!current || fresh.last_updated !== current.last_updated) return fresh;
        return current;
      }));
    }).catch(() => { if (active) setLoadError(true); });

    setDarkMode(true);
    return () => { active = false; stopRealtime(); };
  }, [retryKey]);

  const showToast = (msg: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToastMessage({ msg, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const handleUpdateData = async (newData: AppData) => {
    setData(newData);
    await StorageService.saveData(newData);
  };

  const handleRefreshData = async () => {
    const fresh = await StorageService.loadData();
    setData(fresh);
    showToast("Datos actualizados desde el servidor.", "success");
  };

  const handleLogout = () => {
    StorageService.setRole('espectador');
    setRole('espectador');
    showToast("Sesión de administrador cerrada. Cambiado a modo Espectador.", "info");
  };

  if (!data) {
    if (loadError) return (
      <div className="min-h-screen flex items-center justify-center bg-white text-slate-800 p-4">
        <div className="w-full max-w-2xl text-center">
          <img src="/offline-error.jpg" alt="Error de conexión" className="w-full max-h-[70vh] object-contain mx-auto" />
          <button onClick={() => setRetryKey(k => k + 1)} className="mt-3 px-8 py-3 rounded-full bg-slate-700 hover:bg-slate-800 text-white font-semibold transition">Reintentar</button>
        </div>
      </div>
    );
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900 text-white">
        <div className="text-center space-y-3"><div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div><p className="text-sm font-medium">Cargando CPU Batán — Control de Asistencia...</p></div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-200 ${darkMode ? 'dark bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      {/* Header */}
      <Header
        role={role}
        onOpenLogin={() => setLoginModalOpen(true)}
        onLogout={handleLogout}
        lastSynced={data.last_updated || ''}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode(!darkMode)}
        onRefreshData={handleRefreshData}
      />

      {/* Main Body Layout */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-w-0">
        {/* Sidebar */}
        <Sidebar
          currentView={currentView}
          selectedSubjectId={selectedSubjectId}
          onSelectView={setCurrentView}
          onSelectSubject={setSelectedSubjectId}
          materias={data.materias}
          darkMode={darkMode}
        />

        {/* Content Area */}
        <main className="flex-1 min-w-0 w-full max-w-full overflow-x-hidden overflow-y-auto p-3 sm:p-6 lg:p-8">
          <div className="w-full max-w-7xl mx-auto min-w-0">
            {currentView === 'dashboard' && (
              <DashboardView
                data={data}
                onSelectView={setCurrentView}
                onSelectSubject={setSelectedSubjectId}
                darkMode={darkMode}
              />
            )}

            {currentView === 'matricula' && (
              <MatriculaView
                data={data}
                role={role}
                onUpdateData={handleUpdateData}
                onViewStudentDetail={setSelectedStudentDetail}
                onOpenDuplicateModal={() => setDuplicateModalOpen(true)}
                darkMode={darkMode}
                showToast={showToast}
              />
            )}

            {currentView === 'materias' && (
              <MateriasView
                data={data}
                role={role}
                onUpdateData={handleUpdateData}
                darkMode={darkMode}
                showToast={showToast}
              />
            )}

            {currentView === 'asistencia' && selectedSubjectId && (
              <AsistenciaView
                data={data}
                subjectId={selectedSubjectId}
                role={role}
                onUpdateData={handleUpdateData}
                darkMode={darkMode}
                showToast={showToast}
              />
            )}

            {currentView === 'trabajadores' && (
              <TrabajadoresView
                data={data}
                role={role}
                onUpdateData={handleUpdateData}
                darkMode={darkMode}
                showToast={showToast}
              />
            )}

            {currentView === 'estadisticas' && (
              <EstadisticasView
                data={data}
                darkMode={darkMode}
              />
            )}

            {currentView === 'acerca' && <AboutView darkMode={darkMode} />}

            {currentView === 'respaldo' && (
              <BackupView
                data={data}
                role={role}
                onUpdateData={handleUpdateData}
                darkMode={darkMode}
                showToast={showToast}
              />
            )}
          </div>
        </main>
      </div>

      {/* Modals */}
      {loginModalOpen && (
        <LoginModal
          onClose={() => setLoginModalOpen(false)}
          onLoginSuccess={() => {
            StorageService.setRole('admin');
            setRole('admin');
          }}
          darkMode={darkMode}
          showToast={showToast}
        />
      )}

      {selectedStudentDetail && (
        <StudentDetailModal
          student={selectedStudentDetail}
          data={data}
          onClose={() => setSelectedStudentDetail(null)}
          darkMode={darkMode}
        />
      )}

      {duplicateModalOpen && (
        <DuplicateModal
          data={data}
          onClose={() => setDuplicateModalOpen(false)}
          onUpdateData={handleUpdateData}
          darkMode={darkMode}
          showToast={showToast}
        />
      )}


      {/* Toast notifications */}
      {toastMessage && (
        <Toast
          message={toastMessage.msg}
          type={toastMessage.type}
          onClose={() => setToastMessage(null)}
        />
      )}
    </div>
  );
}
