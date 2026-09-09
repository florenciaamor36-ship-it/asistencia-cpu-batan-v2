import React, { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

interface Props { darkMode: boolean; }

export const InstallPrompt: React.FC<Props> = ({ darkMode }) => {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone === true;
    setInstalled(isStandalone);
    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as BeforeInstallPromptEvent);
    };
    const onInstalled = () => { setInstalled(true); setInstallEvent(null); };
    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  if (installed) return null;

  const install = async () => {
    if (installEvent) {
      await installEvent.prompt();
      const result = await installEvent.userChoice;
      if (result.outcome === 'accepted') setInstalled(true);
      setInstallEvent(null);
    } else {
      setShowHelp(true);
    }
  };

  return (
    <div className={`mx-3 mt-3 rounded-2xl border p-3 flex flex-wrap items-center justify-between gap-3 ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-800'} shadow-sm`}>
      <div className="flex items-center gap-3 min-w-0">
        <Download className="w-5 h-5 text-blue-500 shrink-0" />
        <div><p className="font-semibold text-sm">Instalá la app de CPU Batán</p><p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{showHelp ? 'Usá el menú del navegador y elegí “Instalar aplicación”.' : 'Accedé más rápido desde tu celu o PC.'}</p></div>
      </div>
      <div className="flex items-center gap-2">
        <button onClick={install} className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold">Instalar app</button>
        <button onClick={() => setInstalled(true)} aria-label="Cerrar aviso" className={`p-2 rounded-lg ${darkMode ? 'hover:bg-slate-700' : 'hover:bg-slate-100'}`}><X className="w-4 h-4" /></button>
      </div>
    </div>
  );
};
