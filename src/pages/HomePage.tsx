import React, { useEffect, useState } from 'react';
import VoiceAssistant from '../components/voice/VoiceAssistant';
import BalanceCards from '../components/ui/BalanceCards';
import QuickActions from '../components/ui/QuickActions';
import CommandExamples from '../components/ui/CommandExamples';
import { storageService } from '../services/storageService';

const HomePage: React.FC = () => {
  const [showBackupReminder, setShowBackupReminder] = useState(false);

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