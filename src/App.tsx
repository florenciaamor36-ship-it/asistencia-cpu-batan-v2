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
import { AiAssistantModal } from './components/AiAssistantModal';
import { Toast } from './components/Toast';

export default function App() {
  const [data, setData] = useState<AppData | null>(null);
  const [currentView, setCurrentView] = useState<ViewMode>('dashboard');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
  const [role, setRole] = useState<'admin' | 'espectador'>(StorageService.getRole());
  const [darkMode, setDarkMode] = useState<boolean>(false);

  // Modals state
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [selectedStudentDetail, setSelectedStudentDetail] = useState<Student | null>(null);
  const [duplicateModalOpen, setDuplicateModalOpen] = useState(false);
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ msg: string; type: 'success' | 'error' | 'info' } | null>(null);

  useEffect(() => {
    // Load initial data
    StorageService.loadData().then(loaded => {
      setData(loaded);
      if (loaded.materias && loaded.materias.length > 0) {
        setSelectedSubjectId(loaded.materias[0].id);
      }
    });

    // Check dark mode preference
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setDarkMode(prefersDark);
  }, []);

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
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900 text-white">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm font-medium">Cargando CPU Batán — Control de Asistencia...</p>
        </div>
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
        onOpenAi={() => setAiModalOpen(true)}
        lastSynced={data.last_updated || ''}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode(!darkMode)}
        onRefreshData={handleRefreshData}
      />

      {/* Main Body Layout */}
      <div className="flex-1 flex overflow-hidden">
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
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
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

      {aiModalOpen && (
        <AiAssistantModal
          data={data}
          onClose={() => setAiModalOpen(false)}
          darkMode={darkMode}
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
