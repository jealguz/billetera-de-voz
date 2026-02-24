import React, { useState, useEffect, useRef } from 'react';
import { RotateCcw, LogOut, Download, FilterIcon, Volume2, Play, Zap, Sparkles, VolumeX, Volume, Settings, Menu, X } from 'lucide-react';
import { useVoiceContext } from '../../context/VoiceContext';
import { userService } from '../../services/userService';
import { enhancedVoiceService, VoiceInfo, VoicePersonality, VoiceSettings } from '../../services/enhancedVoiceService';
import { toast } from 'react-hot-toast';

const Header: React.FC = () => {
  const { isListening } = useVoiceContext();
  const [showResetModal, setShowResetModal] = useState(false);
  const [showBackupModal, setShowBackupModal] = useState(false);
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [resetType, setResetType] = useState<'debts' | 'payments' | 'all' | null>(null);
  const [confirmStep, setConfirmStep] = useState(1);
  const [systemVoices, setSystemVoices] = useState<VoiceInfo[]>([]);
  const [currentVoice, setCurrentVoice] = useState<VoiceInfo | null>(null);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'real' | 'virtual'>('all');
  const [personalities, setPersonalities] = useState<VoicePersonality[]>([]);
  const [previewText, setPreviewText] = useState<string>('Hola, soy tu asistente de voz. ¿Te gusta cómo sueno?');
  const [showPreviewOptions, setShowPreviewOptions] = useState(false);
  const [lastBackup, setLastBackup] = useState<string | null>(null);
  const [isResetting] = useState(false);
  const [voiceSettings, setVoiceSettings] = useState<VoiceSettings>(enhancedVoiceService.getVoiceSettings());
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); // Estado para menú móvil
  
  const previewTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // ✅ MEJORADO: Escuchar cambios en la configuración de voz
  useEffect(() => {
    const handleSettingsChange = () => {
      const currentSettings = enhancedVoiceService.getVoiceSettings();
      if (JSON.stringify(currentSettings) !== JSON.stringify(voiceSettings)) {
        setVoiceSettings(currentSettings);
      }
    };

    // Crear un evento personalizado para notificar cambios
    window.addEventListener('voiceSettingsChanged', handleSettingsChange);
    
    // También verificar periódicamente por si acaso
    const interval = setInterval(handleSettingsChange, 1000);
    
    return () => {
      window.removeEventListener('voiceSettingsChanged', handleSettingsChange);
      clearInterval(interval);
    };
  }, [voiceSettings]);

  // Cargar voces del sistema, personalidades y voz actual
  useEffect(() => {
    const loadVoiceData = () => {
      const allVoices = enhancedVoiceService.getAllVoicesWithInfo();
      const spanishVoices = allVoices.filter(voice => voice.isSpanish);
      setSystemVoices(spanishVoices);
      
      const personalityList = enhancedVoiceService.getAllPersonalities();
      setPersonalities(personalityList);
      
      const currentVoiceInfo = enhancedVoiceService.getCurrentVoiceInfo();
      setCurrentVoice(currentVoiceInfo);
      
      const currentSettings = enhancedVoiceService.getVoiceSettings();
      setVoiceSettings(currentSettings);
    };

    loadVoiceData();
    
    window.speechSynthesis.onvoiceschanged = loadVoiceData;

    return () => {
      window.speechSynthesis.onvoiceschanged = null;
      
      if (previewTimeoutRef.current) {
        clearTimeout(previewTimeoutRef.current);
      }
      stopAllPreviews();
    };
  }, []);

  // ✅ FUNCIÓN SIMPLIFICADA: Manejar cambios en la velocidad
  const handleSpeedChange = (newRate: number) => {
    const updatedSettings = {
      ...voiceSettings,
      rate: newRate
    };
    
    // Actualizar en el servicio
    enhancedVoiceService.updateVoiceSettings(updatedSettings);
    
    // Actualizar estado local
    setVoiceSettings(updatedSettings);
    
    // Disparar evento para notificar cambios
    window.dispatchEvent(new CustomEvent('voiceSettingsChanged'));
    
    // Feedback inmediato
    if (Math.abs(newRate - voiceSettings.rate) >= 0.1) {
      toast.success(`Velocidad: ${newRate.toFixed(1)}x`, {
        icon: '⚡',
        duration: 800
      });
      
      // Reproducir confirmación
      if (enhancedVoiceService.getVoiceSettings().voiceURI) {
        setTimeout(() => {
          enhancedVoiceService.speak(`${newRate.toFixed(1)}`);
        }, 100);
      }
    }
  };

  // ✅ Función para resetear a velocidad normal
  const handleResetSpeed = () => {
    handleSpeedChange(1.0);
    toast.success('Velocidad restablecida a normal', {
      icon: '↺',
      duration: 1500
    });
  };

  // ✅ Control de velocidad en línea - RESPONSIVE
  const SpeedControl: React.FC = () => (
    <div className="flex items-center gap-1 sm:gap-2 bg-white border border-gray-300 rounded-lg px-2 sm:px-3 py-1 sm:py-1.5 shadow-sm hover:shadow-md transition-shadow">
      <button
        onClick={() => handleSpeedChange(Math.max(0.5, voiceSettings.rate - 0.1))}
        className="w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-full text-xs sm:text-sm font-bold transition-colors"
        title="Reducir velocidad"
        aria-label="Reducir velocidad"
      >
        −
      </button>
      
      <div className="flex flex-col items-center min-w-[50px] sm:min-w-[60px]">
        <div className="text-xs text-gray-500">Velocidad</div>
        <div className="font-bold text-blue-600 text-xs sm:text-sm">{voiceSettings.rate.toFixed(1)}x</div>
      </div>
      
      <button
        onClick={() => handleSpeedChange(Math.min(2.0, voiceSettings.rate + 0.1))}
        className="w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-full text-xs sm:text-sm font-bold transition-colors"
        title="Aumentar velocidad"
        aria-label="Aumentar velocidad"
      >
        +
      </button>
      
      <button
        onClick={handleResetSpeed}
        className="w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-full transition-colors"
        title="Restablecer a normal"
        aria-label="Restablecer velocidad a normal"
      >
        <Settings size={10} className="sm:size-12" />
      </button>
    </div>
  );

  // Cargar información del último backup
  useEffect(() => {
    const lastBackupTime = localStorage.getItem('lastBackup');
    if (lastBackupTime) {
      const date = new Date(parseInt(lastBackupTime));
      setLastBackup(date.toLocaleDateString() + ' ' + date.toLocaleTimeString());
    }
  }, []);

  // Función para detener todos los previews
  const stopAllPreviews = () => {
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
    }
    setIsPreviewing(false);
    setCurrentlyPlaying(null);
  };

  // Función para manejar preview de voces
  const handlePreviewVoice = async (voice: VoiceInfo, customText?: string) => {
    stopAllPreviews();
    
    setIsPreviewing(true);
    setCurrentlyPlaying(voice.uri);
    
    try {
      await enhancedVoiceService.previewVoice(voice);
      
      if (customText) {
        toast.success(`Probando: "${customText.substring(0, 30)}..."`, {
          icon: '🔊',
          duration: 2000
        });
      } else {
        toast.success('Escuchando muestra de voz', {
          icon: '👂',
          duration: 1500
        });
      }
      
      previewTimeoutRef.current = setTimeout(() => {
        setIsPreviewing(false);
        setCurrentlyPlaying(null);
      }, 3000);
      
    } catch (error) {
      console.error('Error al reproducir muestra:', error);
      toast.error('No se pudo reproducir la muestra');
      setIsPreviewing(false);
      setCurrentlyPlaying(null);
    }
  };

  const handleQuickPreview = (voice: VoiceInfo) => {
    const quickTexts = [
      "Hola, soy tu asistente",
      "¿Cómo estás hoy?",
      "Voz de prueba uno dos tres",
      "Me encanta ayudarte",
      "¡Excelente elección!"
    ];
    const randomText = quickTexts[Math.floor(Math.random() * quickTexts.length)];
    handlePreviewVoice(voice, randomText);
  };

  // FUNCIONES DE BACKUP/EXPORT - YA NO NECESARIO CON DATABASE EN LA NUBE
  // Los datos ahora se almacenan en el servidor
  const handleExportData = async () => {
    toast.success('✅ Tus datos están seguros en la nube');
  };

  const handleImportData = async (event: React.ChangeEvent<HTMLInputElement>) => {
    toast.success('✅ Tus datos están seguros en la nube');
  };

  // FUNCIONES DE RESET - Ya no aplican con DB en la nube
  const handleResetConfirm = async () => {
    toast.error('Para eliminar datos contacta al administrador');
    setShowResetModal(false);
    setResetType(null);
  };

  const handleResetCancel = () => {
    setShowResetModal(false);
    setResetType(null);
  };

  const handleLogout = () => {
    userService.logout();
    window.location.reload();
  };

  const handleVoiceSelect = async (voice: VoiceInfo) => {
    stopAllPreviews();
    
    const success = enhancedVoiceService.setVoice(voice.uri);
    if (success) {
      setCurrentVoice(voice);
      
      // Disparar evento para notificar cambio
      window.dispatchEvent(new CustomEvent('voiceSettingsChanged'));
      
      if (voice.isVirtual) {
        const personality = personalities.find(p => p.id === voice.personality);
        toast.success(`Voz cambiada a: ${personality?.name}`, {
          icon: personality?.icon,
          duration: 3000
        });
      } else {
        toast.success(`Voz seleccionada: ${voice.name}`, {
          icon: '✅',
          duration: 3000
        });
      }
      
      try {
        const confirmText = voice.isVirtual 
          ? `Perfecto, ahora soy tu asistente ${voice.name.split('-')[1]?.trim() || 'personalizado'}`
          : 'Voz configurada correctamente';
        
        await enhancedVoiceService.speak(confirmText);
      } catch (error) {
        console.log('Confirmación de voz omitida');
      }
    } else {
      toast.error('No se pudo cambiar la voz');
    }
  };

  const handlePersonalitySelect = async (personalityId: string) => {
    stopAllPreviews();
    
    const success = enhancedVoiceService.setVoicePersonality(personalityId);
    if (success) {
      const personality = personalities.find(p => p.id === personalityId);
      toast.success(`Estilo cambiado a: ${personality?.name}`, {
        icon: personality?.icon,
        duration: 3000
      });
      
      const currentVoiceInfo = enhancedVoiceService.getCurrentVoiceInfo();
      setCurrentVoice(currentVoiceInfo);
      
      // Disparar evento para notificar cambio
      window.dispatchEvent(new CustomEvent('voiceSettingsChanged'));
      
      const sampleVoice = systemVoices.find(v => 
        v.personality === personalityId && 
        v.baseVoiceURI === currentVoiceInfo?.baseVoiceURI
      );
      
      if (sampleVoice) {
        setTimeout(() => handleQuickPreview(sampleVoice), 500);
      }
    }
  };

  const handleVoiceSettings = () => {
    setShowVoiceModal(true);
    setIsMobileMenuOpen(false); // Cerrar menú móvil si está abierto
  };

  // Filtros y estadísticas
  const filteredVoices = systemVoices.filter(voice => {
    if (filterType === 'real') return !voice.isVirtual;
    if (filterType === 'virtual') return voice.isVirtual;
    return true;
  });

  const voiceStats = enhancedVoiceService.countVoicesByType();
  const spanishVoicesCount = systemVoices.length;
  const realVoicesCount = voiceStats.real;
  const virtualVoicesCount = voiceStats.virtual;

  return (
    <header className="sticky top-0 z-10 bg-white p-3 sm:p-4 shadow-sm">
      <div className="flex items-center justify-between">
        {/* Logo y título - Izquierda */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg overflow-hidden bg-white shadow-sm">
            <img
              src="/logo192.png"
              alt="Wallet Voice Logo"
              className="w-full h-full object-contain"
            />
          </div>
          <div className="max-w-[180px] sm:max-w-none">
            <h1 className="text-lg sm:text-xl font-bold text-gray-900 truncate">Wallet Voice</h1>
            <p className="text-xs sm:text-sm text-gray-600">
              {isListening ? '🎤 Escuchando...' : 'Billetera por voz'}
            </p>
            {currentVoice && (
              <div className="flex items-center gap-1 sm:gap-2 mt-0.5 sm:mt-1">
                <span className="text-xs text-purple-600 truncate max-w-[100px] sm:max-w-[120px]">
                  🔊 {currentVoice.name.split('-')[0].trim()}
                </span>
                {currentVoice.isVirtual && currentVoice.personality && (
                  <span className="text-xs bg-purple-100 text-purple-800 px-1 sm:px-1.5 py-0.5 rounded-full">
                    {personalities.find(p => p.id === currentVoice.personality)?.icon}
                  </span>
                )}
                <button
                  onClick={() => handleQuickPreview(currentVoice)}
                  className="text-xs bg-blue-100 text-blue-700 px-1 sm:px-1.5 py-0.5 rounded-full hover:bg-blue-200 transition-colors"
                  title="Probar voz actual"
                >
                  <Play size={8} className="inline" />
                </button>
              </div>
            )}
          </div>
        </div>
        
        {/* Botón menú hamburguesa para móvil */}
        <div className="sm:hidden">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label={isMobileMenuOpen ? "Cerrar menú" : "Abrir menú"}
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
        
        {/* Controles principales - Desktop */}
        <div className="hidden sm:flex items-center gap-3">
          {/* ✅ Control de velocidad en línea */}
          <SpeedControl />
          
          <button
            onClick={() => setShowBackupModal(true)}
            className="p-2 hover:bg-blue-100 rounded-lg transition-colors"
            title="Backup data"
          >
            💾
          </button>
          <button
            onClick={() => setShowResetModal(true)}
            className="p-2 hover:bg-red-100 rounded-lg transition-colors"
            title="Reset data"
          >
            <RotateCcw size={20} className="text-red-600" />
          </button>
          {spanishVoicesCount > 0 && (
            <button
              onClick={handleVoiceSettings}
              className="p-2 hover:bg-purple-100 rounded-lg transition-colors relative"
              title="Cambiar voz del asistente"
            >
              <Volume2 size={20} className="text-purple-600" />
              {virtualVoicesCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-green-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {virtualVoicesCount}
                </span>
              )}
            </button>
          )}
          <button
            onClick={handleLogout}
            className="p-2 hover:bg-red-100 rounded-lg transition-colors"
            title="Cerrar sesión"
          >
            <LogOut size={20} className="text-red-600" />
          </button>
        </div>
      </div>

      {/* Menú móvil desplegable */}
      {isMobileMenuOpen && (
        <div className="sm:hidden mt-4 pb-3 border-t pt-3">
          <div className="flex flex-col items-stretch gap-3">
            {/* Control de velocidad en móvil */}
            <div className="flex justify-center">
              <SpeedControl />
            </div>
            
            <div className="grid grid-cols-4 gap-2">
              <button
                onClick={() => {
                  setShowBackupModal(true);
                  setIsMobileMenuOpen(false);
                }}
                className="flex flex-col items-center p-2 hover:bg-blue-50 rounded-lg transition-colors"
                title="Backup data"
              >
                <div className="text-lg">💾</div>
                <span className="text-xs mt-1">Backup</span>
              </button>
              
              <button
                onClick={() => {
                  setShowResetModal(true);
                  setIsMobileMenuOpen(false);
                }}
                className="flex flex-col items-center p-2 hover:bg-red-50 rounded-lg transition-colors"
                title="Reset data"
              >
                <RotateCcw size={20} className="text-red-600" />
                <span className="text-xs mt-1">Reset</span>
              </button>
              
              {spanishVoicesCount > 0 && (
                <button
                  onClick={handleVoiceSettings}
                  className="flex flex-col items-center p-2 hover:bg-purple-50 rounded-lg transition-colors relative"
                  title="Cambiar voz del asistente"
                >
                  <Volume2 size={20} className="text-purple-600" />
                  {virtualVoicesCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-green-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {virtualVoicesCount}
                    </span>
                  )}
                  <span className="text-xs mt-1">Voz</span>
                </button>
              )}
              
              <button
                onClick={() => {
                  handleLogout();
                  setIsMobileMenuOpen(false);
                }}
                className="flex flex-col items-center p-2 hover:bg-red-50 rounded-lg transition-colors"
                title="Cerrar sesión"
              >
                <LogOut size={20} className="text-red-600" />
                <span className="text-xs mt-1">Salir</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modales (se mantienen igual) */}
      {showBackupModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-4 sm:p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold mb-4 text-blue-600">💾 Backup de Datos</h3>
            <p className="text-gray-700 mb-4 text-sm sm:text-base">
              Protege tu información financiera. Exporta regularmente y guarda en un lugar seguro.
            </p>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-blue-800">
                💾 <strong>Último backup:</strong> {lastBackup || 'Nunca'}
              </p>
              <p className="text-sm text-green-800 mt-1">
                ✅ <strong>Datos seguros:</strong> Encriptados con AES-256, offline, en tu dispositivo.
              </p>
            </div>
            
            <div className="space-y-4">
              <button
                onClick={handleExportData}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all flex items-center justify-center gap-2 text-sm sm:text-base"
              >
                <Download size={18} />
                📤 Exportar Datos (JSON)
              </button>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  📥 Importar Datos desde archivo
                </label>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportData}
                  className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 transition-colors text-sm"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Selecciona un archivo .json previamente exportado de Wallet Voice
                </p>
              </div>
            </div>
            
            <button
              onClick={() => setShowBackupModal(false)}
              className="w-full mt-4 bg-gray-600 text-white py-3 rounded-lg hover:bg-gray-700 transition-colors text-sm sm:text-base"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      {/* Modal de reset (responsive) */}
      {showResetModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-xl w-full max-w-md mx-2 sm:mx-4 max-h-[90vh] flex flex-col">
            <div className="p-4 sm:p-6 pb-4 flex-shrink-0">
              {confirmStep === 1 ? (
                <>
                  <h3 className="text-lg font-bold mb-4 text-red-600">⚠️ Reset de Datos</h3>
                  <p className="text-gray-700 mb-4 text-sm sm:text-base">
                    ¿Qué datos quieres eliminar? Esta acción no se puede deshacer.
                  </p>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                    <p className="text-sm text-yellow-800">
                      💡 <strong>Recomendación:</strong> Antes de resetear, exporta un backup.
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <h3 className="text-lg font-bold mb-4 text-red-600">🚨 Confirmación Final</h3>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                    <p className="text-red-700 font-bold mb-2">
                      ⚠️ ESTA ACCIÓN ES IRREVERSIBLE
                    </p>
                    <p className="text-red-600 text-sm sm:text-base">
                      {resetType === 'debts' 
                        ? 'Vas a eliminar todas las deudas registradas. Los pagos y clientes se mantendrán.'
                        : resetType === 'payments'
                        ? 'Vas a resetear todos los pagos. Las deudas volverán a estado "pendiente".'
                        : 'Vas a eliminar TODOS los datos: deudas, pagos y clientes. La aplicación quedará vacía.'
                      }
                    </p>
                  </div>
                  <p className="text-gray-700 mb-6 text-sm sm:text-base">
                    Si no tienes un backup reciente, perderás toda tu información financiera.
                  </p>
                </>
              )}
            </div>
            
            <div className="overflow-y-auto flex-1 px-4 sm:px-6">
              {confirmStep === 1 ? (
                <div className="space-y-3 mb-6">
                  <label className="flex items-start p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="radio"
                      name="resetType"
                      value="debts"
                      onChange={(e) => setResetType(e.target.value as 'debts')}
                      className="mr-3 mt-1"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-sm sm:text-base">Eliminar todas las deudas</div>
                      <div className="text-xs sm:text-sm text-gray-500 mt-1">
                        • Eliminará todas las deudas registradas<br/>
                        • Mantendrá los pagos realizados<br/>
                        • Los clientes quedarán con total en 0
                      </div>
                    </div>
                  </label>
                  
                  <label className="flex items-start p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="radio"
                      name="resetType"
                      value="payments"
                      onChange={(e) => setResetType(e.target.value as 'payments')}
                      className="mr-3 mt-1"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-sm sm:text-base">Resetear todos los pagos</div>
                      <div className="text-xs sm:text-sm text-gray-500 mt-1">
                        • Todas las deudas volverán a "pendientes"<br/>
                        • Se eliminarán los registros de pagos<br/>
                        • Los montos se mantendrán
                      </div>
                    </div>
                  </label>
                  
                  <label className="flex items-start p-3 border border-red-200 rounded-lg hover:bg-red-50 cursor-pointer">
                    <input
                      type="radio"
                      name="resetType"
                      value="all"
                      onChange={(e) => setResetType(e.target.value as 'all')}
                      className="mr-3 mt-1"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-red-600 text-sm sm:text-base">Eliminar TODO</div>
                      <div className="text-xs sm:text-sm text-red-500 mt-1">
                        • Eliminará TODAS las deudas y pagos<br/>
                        • Borrará todos los clientes<br/>
                        • Dejará la aplicación completamente vacía
                      </div>
                    </div>
                  </label>
                </div>
              ) : (
                <div className="mb-6"></div>
              )}
            </div>
            
            <div className="p-4 sm:p-6 pt-4 border-t border-gray-200 flex-shrink-0">
              {confirmStep === 1 ? (
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={handleResetCancel}
                    className="flex-1 bg-gray-600 text-white py-3 rounded-lg hover:bg-gray-700 transition-colors text-sm sm:text-base"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => resetType && setConfirmStep(2)}
                    disabled={!resetType}
                    className="flex-1 bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors text-sm sm:text-base"
                  >
                    Continuar
                  </button>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => setConfirmStep(1)}
                    className="flex-1 bg-gray-600 text-white py-3 rounded-lg hover:bg-gray-700 transition-colors text-sm sm:text-base"
                  >
                    Atrás
                  </button>
                  <button
                    onClick={handleResetConfirm}
                    disabled={isResetting}
                    className="flex-1 bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2 text-sm sm:text-base"
                  >
                    {isResetting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Eliminando...
                      </>
                    ) : (
                      'Sí, eliminar definitivamente'
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de voces (responsive) */}
      {showVoiceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 overflow-y-auto" onClick={() => setShowVoiceModal(false)}>
          <div className="min-h-screen flex items-start justify-center p-1 sm:p-2 md:p-4" onClick={(e) => e.stopPropagation()}>
            <div className="bg-white rounded-xl w-full max-w-4xl my-2 sm:my-4 md:my-8 max-h-[95vh] overflow-y-auto">
              <div className="sticky top-0 bg-white z-10 rounded-t-xl border-b p-3 sm:p-4 md:p-6">
                <div className="flex justify-between items-center">
                  <div className="max-w-[70%]">
                    <h3 className="text-lg sm:text-xl font-bold text-purple-600 flex items-center gap-2">
                      <Volume2 size={20} className="sm:size-24" />
                      <span className="truncate">Sistema de Voces</span>
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-600">
                      {realVoicesCount} bases × {personalities.length} estilos = {spanishVoicesCount} opciones
                    </p>
                  </div>
                  <div className="flex items-center gap-1 sm:gap-2">
                    <button
                      onClick={stopAllPreviews}
                      disabled={!isPreviewing}
                      className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-colors"
                      title="Detener reproducción"
                    >
                      <VolumeX size={16} className="sm:size-18" />
                    </button>
                    <button
                      onClick={() => setShowVoiceModal(false)}
                      className="text-gray-500 hover:text-gray-700 text-xl sm:text-2xl"
                    >
                      ✕
                    </button>
                  </div>
                </div>
                
                <div className="mt-3 sm:mt-4 p-3 sm:p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Texto para probar:
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={previewText}
                      onChange={(e) => setPreviewText(e.target.value)}
                      className="flex-1 p-2 border border-gray-300 rounded-lg text-sm sm:text-base"
                      placeholder="Escribe texto para probar..."
                    />
                    <button
                      onClick={() => setShowPreviewOptions(!showPreviewOptions)}
                      className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200"
                      title="Opciones de preview"
                    >
                      <Volume size={16} className="sm:size-18" />
                    </button>
                  </div>
                  
                  {showPreviewOptions && (
                    <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                      {[
                        "Hola, ¿cómo estás?",
                        "Me gusta esta voz",
                        "Probando uno dos tres",
                        "¡Excelente elección!",
                        "Voz clara y nítida"
                      ].map((text, idx) => (
                        <button
                          key={idx}
                          onClick={() => setPreviewText(text)}
                          className="text-xs p-2 bg-white border border-gray-200 rounded hover:bg-gray-50 truncate"
                        >
                          {text.substring(0, 12)}...
                        </button>
                      ))}
                    </div>
                  )}
                  
                  <div className="mt-2 text-xs sm:text-sm text-gray-600">
                    {isPreviewing ? (
                      <span className="flex items-center gap-2 text-purple-600">
                        <span className="animate-pulse">🔊</span> Reproduciendo...
                      </span>
                    ) : (
                      'Listo para probar'
                    )}
                  </div>
                </div>
              </div>

              <div className="p-3 sm:p-4 md:p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-4">
                    <h4 className="font-semibold text-purple-700 mb-2 flex items-center gap-2 text-sm sm:text-base">
                      <Sparkles size={14} className="sm:size-16" />
                      Voz Actual
                    </h4>
                    {currentVoice ? (
                      <div className="space-y-2">
                        <div className="font-medium text-sm sm:text-base">{currentVoice.name}</div>
                        <div className="text-xs sm:text-sm text-gray-600">{currentVoice.description}</div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handlePreviewVoice(currentVoice)}
                            disabled={isPreviewing && currentlyPlaying === currentVoice.uri}
                            className={`px-2 sm:px-3 py-1 text-xs sm:text-sm rounded-lg flex items-center gap-1 ${
                              isPreviewing && currentlyPlaying === currentVoice.uri
                                ? 'bg-yellow-500 text-white'
                                : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                            }`}
                          >
                            {isPreviewing && currentlyPlaying === currentVoice.uri ? (
                              <>
                                <span className="animate-pulse">▶️</span> Sonando...
                              </>
                            ) : (
                              <>
                                <Play size={10} className="sm:size-12" /> Probar
                              </>
                            )}
                          </button>
                          <span className={`px-2 py-1 rounded text-xs ${
                            currentVoice.gender === 'female' ? 'bg-pink-100 text-pink-800' :
                            currentVoice.gender === 'male' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {currentVoice.gender === 'female' ? '👩' :
                             currentVoice.gender === 'male' ? '👨' : '👤'}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm sm:text-base">Sin voz seleccionada</p>
                    )}
                  </div>
                  
                  <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-semibold text-blue-700 mb-2 flex items-center gap-2 text-sm sm:text-base">
                      <Zap size={14} className="sm:size-16" />
                      Estilos Disponibles
                    </h4>
                    <div className="space-y-2">
                      {personalities.map((personality) => (
                        <div key={personality.id} className="flex items-center justify-between">
                          <button
                            onClick={() => handlePersonalitySelect(personality.id)}
                            className={`flex-1 text-left p-2 rounded transition-all text-sm sm:text-base ${
                              enhancedVoiceService.getVoiceSettings().voicePersonality === personality.id
                                ? 'bg-blue-100 border border-blue-300'
                                : 'hover:bg-blue-50'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="text-sm sm:text-lg">{personality.icon}</span>
                                <span className="font-medium truncate">{personality.name}</span>
                              </div>
                            </div>
                          </button>
                          <button
                            onClick={() => {
                              const sampleVoice = systemVoices.find(v => 
                                v.personality === personality.id
                              );
                              if (sampleVoice) handlePreviewVoice(sampleVoice);
                            }}
                            className="ml-1 sm:ml-2 p-1 sm:p-2 text-blue-600 hover:text-blue-800"
                            title="Probar este estilo"
                          >
                            <Play size={12} className="sm:size-14" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4">
                    <h4 className="font-semibold text-green-700 mb-2 text-sm sm:text-base">⚙️ Filtros y Ajustes</h4>
                    <div className="space-y-4">
                      <div className="flex gap-1 sm:gap-2">
                        <button
                          onClick={() => setFilterType('all')}
                          className={`flex-1 py-2 text-xs sm:text-sm rounded ${
                            filterType === 'all' 
                              ? 'bg-purple-500 text-white' 
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          Todas ({spanishVoicesCount})
                        </button>
                        <button
                          onClick={() => setFilterType('real')}
                          className={`flex-1 py-2 text-xs sm:text-sm rounded ${
                            filterType === 'real' 
                              ? 'bg-blue-500 text-white' 
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          Reales ({realVoicesCount})
                        </button>
                        <button
                          onClick={() => setFilterType('virtual')}
                          className={`flex-1 py-2 text-xs sm:text-sm rounded ${
                            filterType === 'virtual' 
                              ? 'bg-pink-500 text-white' 
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          Virtuales ({virtualVoicesCount})
                        </button>
                      </div>
                      
                      <div className="pt-2 border-t border-green-200">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-xs sm:text-sm font-medium text-gray-700">Velocidad global</span>
                          <div className="flex items-center gap-1 sm:gap-2">
                            <span className="font-bold text-blue-600 text-sm sm:text-lg">{voiceSettings.rate.toFixed(1)}x</span>
                            <button
                              onClick={handleResetSpeed}
                              className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded hover:bg-blue-200 transition-colors"
                              title="Restablecer a normal"
                            >
                              1.0x
                            </button>
                          </div>
                        </div>
                        
                        <input
                          type="range"
                          min="0.5"
                          max="2.0"
                          step="0.1"
                          value={voiceSettings.rate}
                          onChange={(e) => {
                            const newRate = parseFloat(e.target.value);
                            handleSpeedChange(newRate);
                          }}
                          className="w-full h-2 bg-gradient-to-r from-green-300 to-blue-300 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 sm:[&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-4 sm:[&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-600 [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow-lg"
                        />
                        
                        <div className="flex justify-between text-xs text-gray-500 mt-2 px-1">
                          <span>0.5x<br/><span className="text-gray-400">Lento</span></span>
                          <span className="text-center">1.0x<br/><span className="text-green-600">Normal</span></span>
                          <span>2.0x<br/><span className="text-gray-400">Rápido</span></span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="mb-6">
                  <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <h4 className="font-semibold text-gray-700 text-base sm:text-lg">
                      <FilterIcon size={16} className="inline mr-2" />
                      Seleccionar Voz ({filteredVoices.length})
                    </h4>
                    <div className="text-xs sm:text-sm text-gray-500">
                      💡 Haz clic en 🔊 para probar antes de seleccionar
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredVoices.map((voice, index) => (
                      <div
                        key={index}
                        className={`p-3 sm:p-4 rounded-xl border transition-all ${
                          currentVoice?.uri === voice.uri
                            ? 'border-purple-300 bg-gradient-to-r from-purple-50 to-white shadow-sm'
                            : 'border-gray-200 hover:border-purple-200 hover:bg-purple-50'
                        } ${voice.isVirtual ? 'border-dashed' : 'border-solid'}`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-start gap-2 sm:gap-3">
                              <button
                                onClick={() => handlePreviewVoice(voice)}
                                disabled={isPreviewing && currentlyPlaying === voice.uri}
                                className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                                  isPreviewing && currentlyPlaying === voice.uri
                                    ? 'bg-yellow-500 text-white animate-pulse'
                                    : voice.gender === 'female' 
                                      ? 'bg-pink-100 text-pink-600 hover:bg-pink-200'
                                      : voice.gender === 'male'
                                        ? 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                                title={isPreviewing && currentlyPlaying === voice.uri ? "Reproduciendo..." : "Probar esta voz"}
                              >
                                {isPreviewing && currentlyPlaying === voice.uri ? '▶️' : '🔊'}
                              </button>
                              <div className="flex-1">
                                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-1">
                                  <div className="font-medium text-gray-800 text-sm sm:text-base truncate">
                                    {voice.name}
                                  </div>
                                  {voice.default && !voice.isVirtual && (
                                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded self-start sm:self-center">
                                      Predeterminada
                                    </span>
                                  )}
                                  {voice.isVirtual && voice.personality && (
                                    <span className="text-xs bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800 px-2 py-1 rounded self-start sm:self-center">
                                      {personalities.find(p => p.id === voice.personality)?.icon}
                                    </span>
                                  )}
                                </div>
                                <div className="text-xs sm:text-sm text-gray-600 mb-2">
                                  {voice.description}
                                </div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="text-xs text-gray-500">
                                    {voice.language}
                                  </span>
                                  <span className="text-yellow-500 text-xs sm:text-sm">
                                    {'★'.repeat(voice.rating)}
                                  </span>
                                  {voice.isVirtual && (
                                    <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded">
                                      Variante
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex flex-col gap-1 sm:gap-2 ml-2">
                            <button
                              onClick={() => handlePreviewVoice(voice, previewText)}
                              disabled={isPreviewing}
                              className={`px-2 sm:px-3 py-1 sm:py-2 text-xs sm:text-sm rounded-lg flex items-center gap-1 transition-all ${
                                isPreviewing && currentlyPlaying === voice.uri
                                  ? 'bg-yellow-500 text-white'
                                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              }`}
                            >
                              {isPreviewing && currentlyPlaying === voice.uri ? (
                                <>
                                  <span className="animate-pulse">▶️</span> Sonando
                                </>
                              ) : (
                                <>
                                  <Play size={12} className="sm:size-14" /> Probar
                                </>
                              )}
                            </button>
                            
                            <button
                              onClick={() => handleVoiceSelect(voice)}
                              disabled={isPreviewing && currentlyPlaying === voice.uri}
                              className={`px-2 sm:px-3 py-1 sm:py-2 text-xs sm:text-sm rounded-lg transition-colors ${
                                currentVoice?.uri === voice.uri
                                  ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600'
                                  : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600'
                              } ${isPreviewing && currentlyPlaying === voice.uri ? 'opacity-75' : ''}`}
                            >
                              {currentVoice?.uri === voice.uri ? '✓ Seleccionada' : 'Seleccionar'}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="pt-4 border-t border-gray-200">
                  <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="text-xs sm:text-sm text-gray-600">
                      <span className="font-medium">Consejos:</span>{' '}
                      • Usa los botones +/− para ajustar velocidad • Prueba antes de seleccionar
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto">
                      <button
                        onClick={stopAllPreviews}
                        disabled={!isPreviewing}
                        className="flex-1 sm:flex-none px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 transition-colors text-sm"
                      >
                        Detener Todo
                      </button>
                      <button
                        onClick={() => setShowVoiceModal(false)}
                        className="flex-1 sm:flex-none px-4 sm:px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
                      >
                        Cerrar
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;