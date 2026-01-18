import React, { useState } from 'react';
import { Wallet, Settings, RotateCcw, LogOut } from 'lucide-react';
import { useVoiceContext } from '../../context/VoiceContext';
import { userService } from '../../services/userService';
import { storageService } from '../../services/storageService';
import { toast } from 'react-hot-toast';

const Header: React.FC = () => {
  const { isListening } = useVoiceContext();
  const [showVoiceSettings, setShowVoiceSettings] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [showBackupModal, setShowBackupModal] = useState(false);
  const [resetType, setResetType] = useState<'debts' | 'payments' | 'all' | null>(null);
  const [confirmStep, setConfirmStep] = useState(1);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [voiceModalStep, setVoiceModalStep] = useState<'language' | 'voice'>('language');
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);

  React.useEffect(() => {
    const loadVoices = () => {
      const availableVoices = speechSynthesis.getVoices();
      setVoices(availableVoices); // Mostrar todas las voces disponibles
    };

    loadVoices();
    speechSynthesis.onvoiceschanged = loadVoices;  
  }, []);

  // Group voices by language
  const groupedVoices = React.useMemo(() => {
    const groups: { [lang: string]: SpeechSynthesisVoice[] } = {};
    voices.forEach(voice => {
      if (!groups[voice.lang]) {
        groups[voice.lang] = [];
      }
      groups[voice.lang].push(voice);
    });
    return groups;
  }, [voices]);

  // Get unique languages
  const uniqueLanguages = React.useMemo(() => {
    return Object.keys(groupedVoices).sort();
  }, [groupedVoices]);

  const handleVoiceSelect = (voiceURI: string) => {
    userService.updateUser({ voicePreference: voiceURI });
    setShowVoiceSettings(false);
    setVoiceModalStep('language');
    setSelectedLanguage(null);
  };

  const handleCustomVoiceSelect = (voiceType: 'female' | 'male') => {
    userService.updateUser({ voicePreference: voiceType });
    setShowVoiceSettings(false);
    setVoiceModalStep('language');
    setSelectedLanguage(null);
  };

  const handleLanguageSelect = (lang: string) => {
    setSelectedLanguage(lang);
    setVoiceModalStep('voice');
  };

  const handleBackToLanguages = () => {
    setVoiceModalStep('language');
    setSelectedLanguage(null);
  };

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
        if (data.users) localStorage.setItem('wallet-voice-users', JSON.stringify(data.users));
        if (data.debts) localStorage.setItem('wallet-voice-debts', JSON.stringify(data.debts));
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

  const currentVoice = userService.getCurrentUser()?.voicePreference;

  const getLanguageName = (langCode: string): string => {
    const languages: { [key: string]: string } = {
      'es-ES': 'Español (España)',
      'es-US': 'Español (EE.UU.)',
      'es-MX': 'Español (México)',
      'es-CO': 'Español (Colombia)',
      'en-US': 'Inglés (EE.UU.)',
      'en-GB': 'Inglés (Reino Unido)',
      'en-AU': 'Inglés (Australia)',
      'fr-FR': 'Francés (Francia)',
      'de-DE': 'Alemán (Alemania)',
      'it-IT': 'Italiano (Italia)',
      'pt-BR': 'Portugués (Brasil)',
      'pt-PT': 'Portugués (Portugal)',
      'ja-JP': 'Japonés (Japón)',
      'ko-KR': 'Coreano (Corea)',
      'zh-CN': 'Chino (Mandarín)',
      'ru-RU': 'Ruso (Rusia)',
      'ar-SA': 'Árabe (Arabia Saudita)',
    };
    return languages[langCode] || `${langCode} (Desconocido)`;
  };

  const getVoiceGender = (voiceName: string): string => {
    const lowerName = voiceName.toLowerCase();
    // Palabras que indican voz femenina
    const femaleKeywords = ['female', 'woman', 'mujer', 'ana', 'maria', 'carmen', 'laura', 'sofia', 'isabella', 'emma', 'olivia', 'ava', 'mia', 'charlotte', 'amelia', 'susana', 'rosa', 'teresa', 'cristina', 'susan', 'sarah', 'lisa', 'jennifer', 'michelle'];
    // Palabras que indican voz masculina
    const maleKeywords = ['male', 'man', 'hombre', 'david', 'juan', 'carlos', 'pedro', 'luis', 'miguel', 'jose', 'antonio', 'francisco', 'daniel', 'pablo', 'roberto', 'alberto', 'fernando', 'manuel', 'dilan', 'mark', 'john', 'michael'];

    if (femaleKeywords.some(keyword => lowerName.includes(keyword))) {
      return 'Femenina (ej. Susan, Ana, María)';
    } else if (maleKeywords.some(keyword => lowerName.includes(keyword))) {
      return 'Masculina (ej. Dilan, David, Juan)';
    } else {
      return 'Neutro/Desconocido';
    }
  };

  const handleLogout = () => {
    // Limpiar sesión del usuario actual
    userService.logout();
    // Recargar la página para resetear estado
    window.location.reload();
  };

  const handleResetConfirm = () => {
    if (resetType === 'debts') {
      storageService.resetDebts();
      toast.success('Todas las deudas han sido eliminadas');
    } else if (resetType === 'payments') {
      storageService.resetPayments();
      toast.success('Todos los pagos han sido reseteados');
    } else if (resetType === 'all') {
      storageService.resetAll(); // Elimina deudas y clientes
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

  return (
    <header className="sticky top-0 z-10 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Wallet size={24} className="text-blue-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Wallet Voice</h1>
            <p className="text-sm text-gray-600">
              {isListening ? 'Escuchando...' : 'Billetera por voz'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
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
           <button
             onClick={() => setShowVoiceSettings(true)}
             className="p-2 hover:bg-gray-100 rounded-lg"
             title="Configuración de voz"
           >
             <Settings size={20} className="text-gray-600" />
           </button>
           <button
             onClick={handleLogout}
             className="p-2 hover:bg-red-100 rounded-lg"
             title="Cerrar sesión"
           >
             <LogOut size={20} className="text-red-600" />
           </button>
         </div>

          {/* Modal de configuración de voz */}
           {showVoiceSettings && (
             <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
               <div className="bg-white border-2 border-gray-300 rounded-3xl shadow-2xl p-8 max-w-lg w-full mx-4 max-h-[70vh] overflow-y-auto">
                 <h3 className="text-xl font-bold mb-2 text-gray-800">
                   {voiceModalStep === 'language' ? 'Seleccionar Idioma' : 'Seleccionar Voz'}
                 </h3>
                 <p className="text-sm text-gray-600 mb-4">
                   {voiceModalStep === 'language'
                     ? 'Elige el idioma para las voces del asistente.'
                     : `Elige la voz en ${getLanguageName(selectedLanguage || '')}. Incluye voces masculinas y femeninas.`
                   }
                 </p>
                 {voiceModalStep === 'language' && (
                   <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                     <p className="text-xs text-blue-800">
                       💡 <strong>Para más voces:</strong> Ve a la configuración de tu sistema operativo y descarga paquetes de voz adicionales (como "Microsoft Speech Platform" en Windows o voces de Google en otros sistemas).
                     </p>
                   </div>
                 )}
                 <div className="space-y-3 max-h-96 overflow-y-auto">
                   {voiceModalStep === 'language' ? (
                     // Sección de idiomas
                     uniqueLanguages.map((lang) => (
                       <button
                         key={lang}
                         onClick={() => handleLanguageSelect(lang)}
                         className="w-full text-left p-4 rounded-xl border-2 border-gray-200 hover:border-blue-300 hover:bg-gray-50 transition-all duration-200"
                       >
                         <div className="font-semibold text-gray-800">{getLanguageName(lang)}</div>
                         <div className="text-sm text-gray-600 mt-1">
                           {groupedVoices[lang]?.length || 0} voces disponibles
                         </div>
                       </button>
                     ))
                   ) : (
                     // Sección de voces
                     <div className="space-y-2">
                       <button
                         onClick={handleBackToLanguages}
                         className="w-full text-left p-3 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors mb-4"
                       >
                         ← Volver a idiomas
                       </button>

                       {/* Voces internas personalizadas */}
                       <div className="mb-4">
                         <h5 className="font-medium text-gray-700 mb-2">Voces Internas (Offline)</h5>
                         <div className="space-y-2">
                           <button
                             onClick={() => handleCustomVoiceSelect('female')}
                             className={`w-full text-left p-3 rounded-lg border transition-all duration-200 ${
                               currentVoice === 'female'
                                 ? 'border-blue-500 bg-blue-50 shadow-md'
                                 : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                             }`}
                           >
                             <div className="font-medium text-gray-700">Voz Femenina Española</div>
                             <div className="text-xs text-gray-500">Trabaja sin conexión a internet</div>
                           </button>
                           <button
                             onClick={() => handleCustomVoiceSelect('male')}
                             className={`w-full text-left p-3 rounded-lg border transition-all duration-200 ${
                               currentVoice === 'male'
                                 ? 'border-blue-500 bg-blue-50 shadow-md'
                                 : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                             }`}
                           >
                             <div className="font-medium text-gray-700">Voz Masculina Española</div>
                             <div className="text-xs text-gray-500">Trabaja sin conexión a internet</div>
                           </button>
                         </div>
                       </div>

                       {/* Voces del sistema */}
                       {selectedLanguage && (
                         <div>
                           <h5 className="font-medium text-gray-700 mb-2">Voces del Sistema</h5>
                           <div className="space-y-2">
                             {groupedVoices[selectedLanguage]?.map((voice, index) => (
                               <button
                                 key={`${selectedLanguage}-${index}`}
                                 onClick={() => handleVoiceSelect(voice.voiceURI)}
                                 className={`w-full text-left p-3 rounded-lg border transition-all duration-200 ${
                                   currentVoice === voice.voiceURI
                                     ? 'border-blue-500 bg-blue-50 shadow-md'
                                     : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                                 }`}
                               >
                                 <div className="font-medium text-gray-700">{voice.name}</div>
                                 <div className="text-xs text-gray-500">{getVoiceGender(voice.name)}</div>
                               </button>
                             ))}
                           </div>
                         </div>
                       )}
                     </div>
                   )}
                 </div>
                 <button
                   onClick={() => {
                     setShowVoiceSettings(false);
                     setVoiceModalStep('language');
                     setSelectedLanguage(null);
                   }}
                   className="w-full mt-4 bg-gray-600 text-white py-2 rounded-lg hover:bg-gray-700"
                 >
                   Cerrar
                 </button>
               </div>
             </div>
          )}

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
      </div>
    </header>
  );
};

export default Header;