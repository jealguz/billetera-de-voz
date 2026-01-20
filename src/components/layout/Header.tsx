import React, { useState, useEffect, useRef } from 'react';
import { RotateCcw, LogOut, Download, Volume2, Play, Zap, Sparkles, Filter, VolumeX, Volume1, Volume } from 'lucide-react';
import { useVoiceContext } from '../../context/VoiceContext';
import { userService } from '../../services/userService';
import { storageService } from '../../services/storageService';
import { enhancedVoiceService, VoiceInfo, VoicePersonality } from '../../services/enhancedVoiceService';
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
  
  const previewTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

  // FUNCIONES EXISTENTES (sin cambios)
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

  // NUEVAS FUNCIONES PARA PREVIEW DE VOCES
  const stopAllPreviews = () => {
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
    }
    setIsPreviewing(false);
    setCurrentlyPlaying(null);
  };

  const handlePreviewVoice = async (voice: VoiceInfo, customText?: string) => {
    stopAllPreviews();
    
    setIsPreviewing(true);
    setCurrentlyPlaying(voice.uri);
    
    try {
      const textToPreview = customText || previewText;
      
      // Usar el método previewVoice del servicio
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

  // FUNCIONES EXISTENTES PARA SELECCIÓN DE VOZ (actualizadas)
  const handleVoiceSelect = async (voice: VoiceInfo) => {
    stopAllPreviews();
    
    const success = enhancedVoiceService.setVoice(voice.uri);
    if (success) {
      setCurrentVoice(voice);
      
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
      
      // Reproducir confirmación automática
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
              {isListening ? '🎤 Escuchando...' : 'Billetera por voz'}
            </p>
            {currentVoice && (
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-purple-600">
                  🔊 {currentVoice.name.split('-')[0].trim()}
                </span>
                {currentVoice.isVirtual && currentVoice.personality && (
                  <span className="text-xs bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full">
                    {personalities.find(p => p.id === currentVoice.personality)?.icon}
                  </span>
                )}
                <button
                  onClick={() => handleQuickPreview(currentVoice)}
                  className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full hover:bg-blue-200 transition-colors"
                  title="Probar voz actual"
                >
                  <Play size={10} className="inline" /> Probar
                </button>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
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

        {/* Modal de backup (sin cambios) */}
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
                  className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
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
                className="w-full mt-4 bg-gray-600 text-white py-2 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        )}

        {/* Modal de reset (sin cambios) */}
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
                      className="flex-1 bg-gray-600 text-white py-2 rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={() => resetType && setConfirmStep(2)}
                      disabled={!resetType}
                      className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
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
                      className="flex-1 bg-gray-600 text-white py-2 rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      Atrás
                    </button>
                    <button
                      onClick={handleResetConfirm}
                      className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition-colors"
                    >
                      Sí, eliminar definitivamente
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Modal MEJORADO de selección de voz con sistema de preview */}
        {showVoiceModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-xl font-bold text-purple-600 flex items-center gap-2">
                    <Volume2 size={24} />
                    Sistema de Voces
                  </h3>
                  <p className="text-sm text-gray-600">
                    {realVoicesCount} bases × {personalities.length} estilos = {spanishVoicesCount} opciones
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={stopAllPreviews}
                    disabled={!isPreviewing}
                    className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-colors"
                    title="Detener reproducción"
                  >
                    <VolumeX size={18} />
                  </button>
                  <button
                    onClick={() => setShowVoiceModal(false)}
                    className="text-gray-500 hover:text-gray-700 text-2xl"
                  >
                    ✕
                  </button>
                </div>
              </div>
              
              {/* Barra de control de preview (NUEVA) */}
              <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Texto para probar voces:
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={previewText}
                        onChange={(e) => setPreviewText(e.target.value)}
                        className="flex-1 p-2 border border-gray-300 rounded-lg"
                        placeholder="Escribe texto para probar..."
                      />
                      <button
                        onClick={() => setShowPreviewOptions(!showPreviewOptions)}
                        className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200"
                        title="Opciones de preview"
                      >
                        <Volume size={18} />
                      </button>
                    </div>
                    
                    {showPreviewOptions && (
                      <div className="mt-3 grid grid-cols-2 md:grid-cols-5 gap-2">
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
                            className="text-xs p-2 bg-white border border-gray-200 rounded hover:bg-gray-50"
                          >
                            {text.substring(0, 15)}...
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">
                      {isPreviewing ? (
                        <span className="flex items-center gap-2 text-purple-600">
                          <span className="animate-pulse">🔊</span> Reproduciendo...
                        </span>
                      ) : (
                        'Listo para probar'
                      )}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Paneles de información */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {/* Voz actual */}
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-4">
                  <h4 className="font-semibold text-purple-700 mb-2 flex items-center gap-2">
                    <Sparkles size={16} />
                    Voz Actual
                  </h4>
                  {currentVoice ? (
                    <div className="space-y-2">
                      <div className="font-medium text-lg">{currentVoice.name}</div>
                      <div className="text-sm text-gray-600">{currentVoice.description}</div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handlePreviewVoice(currentVoice)}
                          disabled={isPreviewing && currentlyPlaying === currentVoice.uri}
                          className={`px-3 py-1 text-sm rounded-lg flex items-center gap-1 ${
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
                              <Play size={12} /> Probar
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
                    <p className="text-gray-500">Sin voz seleccionada</p>
                  )}
                </div>
                
                {/* Personalidades */}
                <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-700 mb-2 flex items-center gap-2">
                    <Zap size={16} />
                    Estilos Disponibles
                  </h4>
                  <div className="space-y-2">
                    {personalities.map((personality) => (
                      <div key={personality.id} className="flex items-center justify-between">
                        <button
                          onClick={() => handlePersonalitySelect(personality.id)}
                          className={`flex-1 text-left p-2 rounded transition-all ${
                            enhancedVoiceService.getVoiceSettings().voicePersonality === personality.id
                              ? 'bg-blue-100 border border-blue-300'
                              : 'hover:bg-blue-50'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-lg">{personality.icon}</span>
                              <span className="font-medium">{personality.name}</span>
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
                          className="ml-2 p-2 text-blue-600 hover:text-blue-800"
                          title="Probar este estilo"
                        >
                          <Play size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Filtros y ajustes */}
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4">
                  <h4 className="font-semibold text-green-700 mb-2">⚙️ Filtros</h4>
                  <div className="space-y-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => setFilterType('all')}
                        className={`flex-1 py-2 text-sm rounded ${
                          filterType === 'all' 
                            ? 'bg-purple-500 text-white' 
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        Todas ({spanishVoicesCount})
                      </button>
                      <button
                        onClick={() => setFilterType('real')}
                        className={`flex-1 py-2 text-sm rounded ${
                          filterType === 'real' 
                            ? 'bg-blue-500 text-white' 
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        Reales ({realVoicesCount})
                      </button>
                      <button
                        onClick={() => setFilterType('virtual')}
                        className={`flex-1 py-2 text-sm rounded ${
                          filterType === 'virtual' 
                            ? 'bg-pink-500 text-white' 
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        Virtuales ({virtualVoicesCount})
                      </button>
                    </div>
                    
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Velocidad global</span>
                        <span className="font-medium">{enhancedVoiceService.getVoiceSettings().rate.toFixed(1)}x</span>
                      </div>
                      <input
                        type="range"
                        min="0.5"
                        max="2.0"
                        step="0.1"
                        value={enhancedVoiceService.getVoiceSettings().rate}
                        onChange={(e) => {
                          enhancedVoiceService.updateVoiceSettings({ 
                            rate: parseFloat(e.target.value) 
                          });
                        }}
                        className="w-full h-2 bg-green-200 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Lista de voces CON MEJORES CONTROLES DE PREVIEW */}
              <div className="flex-1 overflow-y-auto mb-4">
                <div className="mb-3 flex items-center justify-between">
                  <h4 className="font-semibold text-gray-700">
                    <Filter size={16} className="inline mr-2" />
                    Seleccionar Voz ({filteredVoices.length})
                  </h4>
                  <div className="text-sm text-gray-500">
                    💡 Haz clic en 🔊 para probar antes de seleccionar
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {filteredVoices.map((voice, index) => (
                    <div
                      key={index}
                      className={`p-4 rounded-xl border transition-all ${
                        currentVoice?.uri === voice.uri
                          ? 'border-purple-300 bg-gradient-to-r from-purple-50 to-white shadow-sm'
                          : 'border-gray-200 hover:border-purple-200 hover:bg-purple-50'
                      } ${voice.isVirtual ? 'border-dashed' : 'border-solid'}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-start gap-3">
                            <button
                              onClick={() => handlePreviewVoice(voice)}
                              disabled={isPreviewing && currentlyPlaying === voice.uri}
                              className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
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
                              <div className="flex items-center gap-2 mb-1">
                                <div className="font-medium text-gray-800">
                                  {voice.name}
                                </div>
                                {voice.default && !voice.isVirtual && (
                                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                                    Predeterminada
                                  </span>
                                )}
                                {voice.isVirtual && voice.personality && (
                                  <span className="text-xs bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800 px-2 py-1 rounded">
                                    {personalities.find(p => p.id === voice.personality)?.icon}
                                  </span>
                                )}
                              </div>
                              <div className="text-sm text-gray-600 mb-2">
                                {voice.description}
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="text-xs text-gray-500">
                                  {voice.language}
                                </span>
                                <span className="text-yellow-500 text-sm">
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
                        
                        <div className="flex flex-col gap-2 ml-3">
                          <div className="relative group">
                            <button
                              onClick={() => handlePreviewVoice(voice, previewText)}
                              disabled={isPreviewing}
                              className={`px-3 py-2 text-sm rounded-lg flex items-center gap-1 transition-all ${
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
                                  <Play size={14} /> Probar
                                </>
                              )}
                            </button>
                            <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                              <div className="p-2">
                                <div className="text-xs font-medium text-gray-700 mb-2">Probar con:</div>
                                {[
                                  "Hola, soy esta voz",
                                  "Me gusta cómo sueno",
                                  "¿Te parece bien?",
                                  previewText.substring(0, 20) + "..."
                                ].map((text, idx) => (
                                  <button
                                    key={idx}
                                    onClick={() => handlePreviewVoice(voice, text)}
                                    className="w-full text-left p-2 text-sm hover:bg-gray-100 rounded"
                                  >
                                    "{text.substring(0, 15)}..."
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                          
                          <button
                            onClick={() => handleVoiceSelect(voice)}
                            disabled={isPreviewing && currentlyPlaying === voice.uri}
                            className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                              currentVoice?.uri === voice.uri
                                ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600'
                                : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600'
                            } ${isPreviewing && currentlyPlaying === voice.uri ? 'opacity-75' : ''}`}
                          >
                            {currentVoice?.uri === voice.uri ? '✓ Seleccionada' : 'Seleccionar'}
                          </button>
                        </div>
                      </div>
                      
                      {isPreviewing && currentlyPlaying === voice.uri && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <div className="flex items-center gap-2 text-sm text-purple-600">
                            <span className="animate-pulse">🔊</span>
                            <span>Reproduciendo muestra...</span>
                            <button
                              onClick={stopAllPreviews}
                              className="ml-auto text-xs bg-red-100 text-red-700 px-2 py-1 rounded hover:bg-red-200"
                            >
                              Detener
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Pie del modal */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">Consejos:</span>{' '}
                    • Prueba antes de seleccionar • Di "voz formal/amigable" • Personaliza el texto de prueba
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={stopAllPreviews}
                      disabled={!isPreviewing}
                      className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 transition-colors"
                    >
                      Detener Todo
                    </button>
                    <button
                      onClick={() => setShowVoiceModal(false)}
                      className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                    >
                      Cerrar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;