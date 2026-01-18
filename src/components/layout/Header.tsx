import React, { useState } from 'react';
import { RotateCcw, LogOut, Download, Volume2 } from 'lucide-react';
import { useVoiceContext } from '../../context/VoiceContext';
import { userService } from '../../services/userService';
import { storageService } from '../../services/storageService';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { enhancedVoiceService } from '../../services/enhancedVoiceService';
import { toast } from 'react-hot-toast';

const Header: React.FC = () => {
  const { isListening } = useVoiceContext();
  const { isInstallable, installPWA } = usePWAInstall();
  const [showResetModal, setShowResetModal] = useState(false);
  const [showBackupModal, setShowBackupModal] = useState(false);
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [resetType, setResetType] = useState<'debts' | 'payments' | 'all' | null>(null);
  const [confirmStep, setConfirmStep] = useState(1);
  const [systemVoices, setSystemVoices] = useState<any[]>([]);

  // Cargar voces del sistema
  React.useEffect(() => {
    const loadSystemVoices = () => {
      const voices = enhancedVoiceService.getAvailableVoices();
      const spanishVoices = voices.filter(voice => voice.lang.startsWith('es'));
      setSystemVoices(spanishVoices);
    };

    // Cargar voces inmediatamente y cuando estén disponibles
    loadSystemVoices();
    speechSynthesis.onvoiceschanged = loadSystemVoices;

    return () => {
      speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  const handleExportData = () => {
    const data = storageService.exportData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `wallet-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    localStorage.setItem('lastBackup', Date.now().toString());
    setShowBackupModal(false);
    toast.success('Datos exportados correctamente');
  };

  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (data.debts) localStorage.setItem('wallet-voice-debts', JSON.stringify(data.debts));
        if (data.payments) localStorage.setItem('wallet-voice-payments', JSON.stringify(data.payments));
        if (data.clients) localStorage.setItem('wallet-voice-clients', JSON.stringify(data.clients));
        if (data.currentUser) localStorage.setItem('wallet-voice-current-user', data.currentUser);
        setShowBackupModal(false);
        toast.success('Datos importados correctamente. Recarga la página.');
        setTimeout(() => window.location.reload(), 2000);
      } catch (error) {
        toast.error('Error al importar datos');
      }
    };
    reader.readAsText(file);
  };

  const handleResetConfirm = () => {
    if (resetType === 'debts') {
      storageService.resetDebts();
      toast.success('Todas las deudas han sido eliminadas');
    } else if (resetType === 'payments') {
      storageService.resetPayments();
      toast.success('Todos los pagos han sido reseteados');
    } else if (resetType === 'all') {
      storageService.resetAll();
      toast.success('Todos los datos han sido eliminados');
    }
    setShowResetModal(false);
    setResetType(null);
    setConfirmStep(1);
  };

  const handleResetCancel = () => {
    setShowResetModal(false);
    setResetType(null);
    setConfirmStep(1);
  };

  const handleLogout = () => {
    userService.logout();
    window.location.reload();
  };


  

   return (
    <header className="sticky top-0 z-10 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg overflow-hidden bg-white shadow-sm">
            <img
              src="/logo192.png"
              alt="Wallet Voice Logo"
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Wallet Voice</h1>
            <p className="text-sm text-gray-600">
              {isListening ? 'Escuchando...' : 'Billetera por voz'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
            {isInstallable && (
              <button
                onClick={installPWA}
                className="p-2 hover:bg-green-100 rounded-lg"
                title="Instalar app"
              >
                <Download size={20} className="text-green-600" />
              </button>
            )}
            <button
              onClick={() => setShowBackupModal(true)}
              className="p-2 hover:bg-blue-100 rounded-lg"
              title="Backup data"
            >
              💾
            </button>
            <button
              onClick={() => setShowResetModal(true)}
              className="p-2 hover:bg-red-100 rounded-lg"
              title="Reset data"
            >
              <RotateCcw size={20} className="text-red-600" />
            </button>
            {systemVoices.length > 0 && (
              <button
                onClick={() => setShowVoiceModal(true)}
                className="p-2 hover:bg-purple-100 rounded-lg"
                title="Cambiar voz del sistema"
              >
                <Volume2 size={20} className="text-purple-600" />
              </button>
            )}

            <button
              onClick={handleLogout}
              className="p-2 hover:bg-red-100 rounded-lg"
              title="Cerrar sesión"
            >
              <LogOut size={20} className="text-red-600" />
            </button>
          </div>



          {/* Modal de backup */}
          {showBackupModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
                <h3 className="text-lg font-bold mb-4 text-blue-600">💾 Backup de Datos</h3>
                <p className="text-gray-700 mb-4">
                  Protege tu información financiera. Exporta regularmente y guarda en un lugar seguro.
                </p>
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                  <p className="text-sm text-green-800">
                    ✅ <strong>Datos seguros:</strong> Encriptados con AES-256, offline, perpetuos en tu dispositivo.
                  </p>
                </div>
                <div className="space-y-4">
                  <button
                    onClick={handleExportData}
                    className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
                  >
                    📤 Exportar Datos (Descargar JSON)
                  </button>
                  <div>
                    <label className="block text-sm text-gray-600 mb-2">📥 Importar Datos</label>
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleImportData}
                      className="w-full p-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                </div>
                <button
                  onClick={() => setShowBackupModal(false)}
                  className="w-full mt-4 bg-gray-600 text-white py-2 rounded-lg hover:bg-gray-700"
                >
                  Cerrar
                </button>
               </div>
             </div>
           )}

           {/* Modal de reset */}
          {showResetModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
                {confirmStep === 1 ? (
                  <>
                    <h3 className="text-lg font-bold mb-4 text-red-600">⚠️ Reset de Datos</h3>
                    <p className="text-gray-700 mb-4">
                      ¿Qué datos quieres eliminar? Esta acción no se puede deshacer.
                    </p>
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                      <p className="text-sm text-yellow-800">
                        💡 <strong>Recomendación:</strong> Antes de resetear, exporta un backup en "💾 Backup" para no perder tus datos.
                      </p>
                    </div>
                    <div className="space-y-3 mb-6">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="resetType"
                          value="debts"
                          onChange={(e) => setResetType(e.target.value as 'debts')}
                          className="mr-2"
                        />
                        Eliminar todas las deudas
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="resetType"
                          value="payments"
                          onChange={(e) => setResetType(e.target.value as 'payments')}
                          className="mr-2"
                        />
                        Resetear todos los pagos realizados
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="resetType"
                          value="all"
                          onChange={(e) => setResetType(e.target.value as 'all')}
                          className="mr-2"
                        />
                        <span className="text-red-600 font-medium">Eliminar TODO (deudas y pagos)</span>
                      </label>
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={handleResetCancel}
                        className="flex-1 bg-gray-600 text-white py-2 rounded-lg hover:bg-gray-700"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={() => resetType && setConfirmStep(2)}
                        disabled={!resetType}
                        className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 disabled:opacity-50"
                      >
                        Continuar
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <h3 className="text-lg font-bold mb-4 text-red-600">🚨 Confirmación Final</h3>
                    <p className="text-gray-700 mb-4">
                      ¿Estás completamente seguro de{' '}
                      {resetType === 'debts' ? 'eliminar todas las deudas' :
                       resetType === 'payments' ? 'resetear todos los pagos' :
                       'eliminar TODOS los datos (deudas y pagos)'}?
                    </p>
                    <p className="text-red-600 font-medium mb-6">
                      ⚠️ Esta acción es irreversible. Si no tienes backup, perderás toda tu información financiera.
                    </p>
                    <div className="flex gap-3">
                      <button
                        onClick={() => setConfirmStep(1)}
                        className="flex-1 bg-gray-600 text-white py-2 rounded-lg hover:bg-gray-700"
                      >
                        Atrás
                      </button>
                      <button
                        onClick={handleResetConfirm}
                        className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700"
                      >
                        Sí, eliminar definitivamente
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Modal de selección de voz */}
          {showVoiceModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
                <h3 className="text-lg font-bold mb-4 text-purple-600">🔊 Voces del Sistema</h3>
                <p className="text-gray-700 mb-4">
                  Selecciona una voz española para el asistente. Estas voces funcionan sin conexión a internet.
                </p>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {systemVoices.map((voice, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        enhancedVoiceService.setPreferredVoice(voice.voiceURI);
                        setShowVoiceModal(false);
                        toast.success(`Voz cambiada a: ${voice.name}`);
                      }}
                      className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-colors"
                    >
                      <div className="font-medium text-gray-800">{voice.name}</div>
                      <div className="text-sm text-gray-600">{voice.lang}</div>
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setShowVoiceModal(false)}
                  className="w-full mt-4 bg-gray-600 text-white py-2 rounded-lg hover:bg-gray-700"
                >
                  Cerrar
                </button>
              </div>
            </div>
          )}
       </div>
     </header>
   );
 
  }
export default Header;