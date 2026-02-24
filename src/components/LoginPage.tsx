import React, { useState, useEffect, useRef } from 'react';
import { Mail, Lock, Mic, UserPlus, Download, X, AlertCircle, Check, Heart, ChevronDown } from 'lucide-react';
import { setAuthToken } from '../services/apiClient';
import { usePWAInstall } from '../hooks/usePWAInstall';
import toast, { Toaster } from 'react-hot-toast';

interface LoginPageProps {
  onLogin: (email: string, password: string) => Promise<void>;
  onSwitchToRegister: () => void;
  onVoiceLogin: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin, onSwitchToRegister, onVoiceLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { isInstallable, installPWA } = usePWAInstall();
  const [showInstallBanner, setShowInstallBanner] = useState(true);
  const [showAdNotice, setShowAdNotice] = useState(true); // ✅ CAMBIADO: Empieza en TRUE
  const [showScrollHint, setShowScrollHint] = useState(true);
  const modalContentRef = useRef<HTMLDivElement>(null);

  // ✅ ELIMINADO TODO EL CÓDIGO QUE VERIFICA localStorage
  // El modal sale SIEMPRE al iniciar
  
  // Ocultar hint de scroll
  useEffect(() => {
    if (showAdNotice && showScrollHint) {
      const timer = setTimeout(() => {
        setShowScrollHint(false);
      }, 3000);

      const contentElement = modalContentRef.current;
      const handleScroll = () => {
        if (contentElement && contentElement.scrollTop > 50) {
          setShowScrollHint(false);
        }
      };

      if (contentElement) {
        contentElement.addEventListener('scroll', handleScroll);
        return () => {
          clearTimeout(timer);
          contentElement.removeEventListener('scroll', handleScroll);
        };
      }

      return () => clearTimeout(timer);
    }
  }, [showAdNotice, showScrollHint]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await onLogin(email, password);
    } catch (error: any) {
      setError(error?.message || 'Credenciales incorrectas');
    }
  };

  const closeInstallBanner = () => {
    setShowInstallBanner(false);
  };

  const handleInstallPWA = async () => {
    await installPWA();
    closeInstallBanner();
  };

  const handleAcceptAds = () => {
    // ✅ NO guardamos en localStorage para que salga SIEMPRE
    setShowAdNotice(false);
    
    toast.success('¡Gracias por apoyar Wallet Voice! 🎉', {
      duration: 4000,
      icon: '❤️',
      style: {
        background: '#10B981',
        color: '#fff',
      },
    });
  };

  const handleContinueWithoutSupport = () => {
    // ✅ NO guardamos en localStorage para que salga SIEMPRE
    setShowAdNotice(false);
    
    toast('Puedes cambiar tu decisión en cualquier momento en Configuración', {
      duration: 3000,
      icon: 'ℹ️',
      style: {
        background: '#3B82F6',
        color: '#fff',
      },
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#282580] to-[#3b2a91] flex items-center justify-center p-4 relative">
      <Toaster 
        position="top-center"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 4000,
            iconTheme: {
              primary: '#10B981',
              secondary: '#fff',
            },
          },
        }}
      />

      {/* ✅ Modal de Anuncios - Se muestra SIEMPRE */}
      {showAdNotice && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-[1000] animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border-2 border-blue-300 flex flex-col max-h-[85vh]">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-5 rounded-t-2xl text-center flex-shrink-0">
              <div className="w-14 h-14 mx-auto mb-3 bg-white rounded-xl p-3 shadow-lg">
                <AlertCircle className="w-8 h-8 mx-auto text-blue-600" />
              </div>
              <h2 className="text-xl font-bold text-white">Información sobre anuncios</h2>
            </div>

            {/* Contenido con scroll */}
            <div 
              ref={modalContentRef}
              className="flex-1 overflow-y-auto p-5"
              style={{ maxHeight: 'calc(85vh - 180px)' }}
            >
              {showScrollHint && (
                <div className="text-center mb-3 animate-bounce">
                  <div className="inline-flex items-center gap-1 text-blue-600 bg-blue-50 px-3 py-1 rounded-full text-xs">
                    <ChevronDown className="w-3 h-3" />
                    <span>Desliza para ver más</span>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <div className="text-center">
                  <p className="text-gray-700 mb-4">
                    Para mantener <span className="font-bold text-blue-600">Wallet Voice completamente gratuita</span>, mostramos anuncios no intrusivos.
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-gray-900">Sin costos ocultos</p>
                      <p className="text-sm text-gray-600">Nunca pagarás por funciones básicas</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-gray-900">Anuncios discretos</p>
                      <p className="text-sm text-gray-600">Solo banners que no interrumpen tu experiencia</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-gray-900">Apoyo voluntario</p>
                      <p className="text-sm text-gray-600">Puedes ver anuncios adicionales para apoyarnos</p>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 rounded-lg p-4 mt-4">
                  <p className="text-center text-blue-800 text-sm">
                    <Heart className="w-4 h-4 inline mr-1 text-red-500" />
                    ¡Tu apoyo nos ayuda a seguir mejorando!
                  </p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-5 border-t border-gray-100 bg-gray-50 rounded-b-2xl flex-shrink-0">
              <div className="space-y-3">
                <button
                  onClick={handleAcceptAds}
                  className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-3 rounded-lg font-bold hover:opacity-90 transition-opacity"
                >
                  ¡Entiendo y quiero apoyar!
                </button>

                <button
                  onClick={handleContinueWithoutSupport}
                  className="w-full border border-gray-300 text-gray-700 py-2.5 rounded-lg font-medium hover:bg-gray-50 transition-colors text-sm"
                >
                  Entiendo, continuar sin apoyar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Install Banner */}
      {isInstallable && showInstallBanner && (
        <div className="fixed top-4 left-4 right-4 bg-white rounded-xl p-4 shadow-lg border border-blue-200 z-50 animate-fade-in">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-1">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Download className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900">Instala Wallet Voice</h4>
                <p className="text-sm text-gray-600">Acceso rápido desde tu pantalla de inicio</p>
              </div>
            </div>
            <button
              onClick={handleInstallPWA}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors whitespace-nowrap"
            >
              Instalar
            </button>
            <button 
              onClick={closeInstallBanner}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors ml-2"
              aria-label="Cerrar"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>
      )}

      {/* Login Form - Visible DESPUÉS del modal */}
      <div className="bg-blue-50 rounded-2xl shadow-2xl p-8 max-w-md w-full border border-blue-100 animate-fade-in">
        {/* Logo/Brand Section */}
        <div className="text-center mb-8">
          <div className="w-28 h-28 mx-auto mb-4 shadow-lg rounded-xl overflow-hidden bg-white">
            <img
              src="/logo512.png"
              alt="Wallet Voice Logo"
              className="w-full h-full object-contain"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.parentElement!.innerHTML = '<div class="w-28 h-28 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mx-auto shadow-lg"><svg class="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"></path></svg></div>';
              }}
            />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#282580] to-[#3b2a91] bg-clip-text text-transparent mb-2">
            Wallet Voice
          </h1>
          <p className="text-gray-600 text-sm">
            Gestiona tus finanzas con voz
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-1">
            <label className="block text-sm font-semibold text-gray-700">
              Correo Electrónico
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 bg-gray-50 focus:bg-white"
                placeholder="tu@email.com"
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-semibold text-gray-700">
              Contraseña
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 bg-gray-50 focus:bg-white"
                placeholder="Tu contraseña"
                required
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3">
              <p className="text-red-600 text-sm text-center font-medium">{error}</p>
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-3 px-6 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
          >
            Iniciar Sesión
          </button>
        </form>

        {/* Alternative Login Options */}
        <div className="mt-8 space-y-3">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500 font-medium">O accede con</span>
            </div>
          </div>

          <button
            onClick={onVoiceLogin}
            className="w-full bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-white py-3 px-4 rounded-xl font-medium shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-3"
          >
            <Mic className="w-5 h-5" />
            Iniciar con Voz
          </button>

          <button
            onClick={onSwitchToRegister}
            className="w-full text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors duration-200 flex items-center justify-center gap-2 py-2"
          >
            <UserPlus className="w-4 h-4" />
            ¿No tienes cuenta? Regístrate
          </button>
        </div>

        {/* Información sobre anuncios */}
        <div className="mt-6 pt-4 border-t border-gray-100">
          <p className="text-xs text-gray-500 text-center">
            <Heart className="w-3 h-3 inline mr-1 text-red-500" />
            Wallet Voice es gratuita gracias a los anuncios. 
            <button 
              onClick={() => setShowAdNotice(true)}
              className="text-blue-600 hover:text-blue-800 ml-1 font-medium"
            >
              Más información
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
