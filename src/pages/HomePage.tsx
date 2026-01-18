import React, { useEffect, useState } from 'react';
import VoiceAssistant from '../components/voice/VoiceAssistant';
import BalanceCards from '../components/ui/BalanceCards';
import QuickActions from '../components/ui/QuickActions';
import CommandExamples from '../components/ui/CommandExamples';
import { storageService } from '../services/storageService';
import { usePWAInstall } from '../hooks/usePWAInstall';

const HomePage: React.FC = () => {
  const [showBackupReminder, setShowBackupReminder] = useState(false);
  const { isInstallable, installPWA } = usePWAInstall();

  useEffect(() => {
    // Verificar si hay datos y no backup reciente (7 días)
    const stats = storageService.getStats();
    const lastBackup = localStorage.getItem('lastBackup');
    const hasData = stats.debtsCount > 0 || stats.paymentsCount > 0;

    if (hasData && (!lastBackup || Date.now() - parseInt(lastBackup || '0') > 7 * 24 * 60 * 60 * 1000)) {
      setShowBackupReminder(true);
    }
  }, []);

  return (
    <div className="min-h-screen p-6 animate-fade-in">
      <div className="max-w-4xl mx-auto space-y-8">
        {isInstallable && (
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl p-4 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  📱
                </div>
                <div>
                  <h3 className="font-semibold">Instala Wallet Voice</h3>
                  <p className="text-sm text-blue-100">Accede rápido desde tu pantalla de inicio</p>
                </div>
              </div>
              <button
                onClick={installPWA}
                className="bg-white text-blue-600 px-4 py-2 rounded-lg font-medium hover:bg-blue-50 transition-colors"
              >
                Instalar
              </button>
            </div>
          </div>
        )}

        {showBackupReminder && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <span className="text-yellow-600 text-xl">⚠️</span>
              <div className="flex-1">
                <h3 className="font-semibold text-yellow-800">Recordatorio de Seguridad</h3>
                <p className="text-yellow-700 text-sm mt-1">
                  Tienes datos importantes. Haz un backup regular para proteger tu información financiera.
                </p>
                <button
                  onClick={() => setShowBackupReminder(false)}
                  className="mt-2 text-yellow-600 hover:text-yellow-800 text-sm underline"
                >
                  Entendido
                </button>
              </div>
            </div>
          </div>
        )}
        <BalanceCards />
        <VoiceAssistant />
        <QuickActions />
        <CommandExamples />
      </div>
    </div>
  );
};

export default HomePage;