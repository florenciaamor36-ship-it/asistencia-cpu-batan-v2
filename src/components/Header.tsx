import React, { useState, useEffect } from 'react';
import { Shield, ShieldCheck, Wifi, WifiOff, Sun, Moon, LogIn, LogOut, RefreshCw } from 'lucide-react';

interface HeaderProps {
  role: 'admin' | 'espectador';
  onOpenLogin: () => void;
  onLogout: () => void;
  lastSynced: string;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onRefreshData: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  role,
  onOpenLogin,
  onLogout,
  lastSynced,
  darkMode,
  onToggleDarkMode,
  onRefreshData
}) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const formattedDate = lastSynced 
    ? new Date(lastSynced).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
    : 'Nunca';

  return (
    <header className={`sticky top-0 z-30 flex flex-wrap gap-2 items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3 border-b shadow-xs transition-colors duration-200 ${
      darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800'
    }`}>
      {/* Left: Logo & Title */}
      <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
        <div className={`w-44 h-11 sm:w-56 sm:h-12 rounded-xl flex items-center justify-center overflow-hidden shrink-0 ${darkMode ? 'bg-slate-900' : 'bg-white'}`}>
          <img src={darkMode ? '/icons/logo-cpu-dark.png' : '/icons/logo-cpu-light.png'} alt="Comunidad Pastoral Universitaria" className="w-full h-full object-contain" />
        </div>
        <div>
          <h1 className="text-sm sm:text-lg font-bold tracking-tight">CPU BATÁN</h1>
          <p className={`hidden sm:block text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Control de Asistencia Institucional</p>
        </div>
      </div>

      {/* Right: Status, Role, Actions */}
      <div className="flex min-w-0 max-w-full flex-wrap items-center justify-end gap-1 sm:gap-2 sm:space-x-2 sm:space-x-4">
        {/* Connection status */}
        <div className="hidden md:flex items-center space-x-1.5 text-xs px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
          {isOnline ? (
            <>
              <Wifi className="w-3.5 h-3.5 text-emerald-500" />
              <span>Conectado</span>
            </>
          ) : (
            <>
              <WifiOff className="w-3.5 h-3.5 text-amber-500" />
              <span>Modo Offline</span>
            </>
          )}
          <span className="text-slate-400 dark:text-slate-500">| Sinc: {formattedDate}</span>
        </div>

        {/* Refresh button */}
        <button
          onClick={onRefreshData}
          title="Actualizar datos"
          className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition text-slate-600 dark:text-slate-300"
        >
          <RefreshCw className="w-4 h-4" />
        </button>

        {/* Dark mode toggle */}
        <button
          onClick={onToggleDarkMode}
          className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition text-slate-600 dark:text-slate-300"
          title={darkMode ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
        >
          {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
        </button>

        {/* Role Badge & Auth */}
        {role === 'admin' ? (
          <div className="flex min-w-0 max-w-full flex-wrap items-center space-x-2">
            <span className="hidden sm:flex items-center space-x-1 px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 text-xs font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Admin</span>
            </span>
            <button
              onClick={onLogout}
              className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-medium transition"
              title="Cerrar sesión de Administrador"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Salir</span>
            </button>
          </div>
        ) : (
          <div className="flex min-w-0 max-w-full flex-wrap items-center space-x-2">
            <span className="hidden sm:flex items-center space-x-1 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-medium">
              <Shield className="w-3.5 h-3.5" />
              <span>Espectador</span>
            </span>
            <button
              onClick={onOpenLogin}
              className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium transition"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Ingresar</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
