import React, { useState } from 'react';
import { Mail, Lock, Mic, UserPlus, Download,X } from 'lucide-react';
import { userService } from '../services/userService';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { toast } from 'react-hot-toast';

interface LoginPageProps {
  onLogin: () => void;
  onSwitchToRegister: () => void;
  onVoiceLogin: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin, onSwitchToRegister, onVoiceLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { isInstallable, installPWA } = usePWAInstall();
  const [showInstallBanner, setShowInstallBanner] = useState(true); // Estado para mostrar/ocultar banner

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const user = userService.loginUser(email, password);
      if (user) {
        toast.success(`¡Bienvenido de vuelta, ${user.name}!`);
        onLogin();
      } else {
        setError('Credenciales incorrectas');
      }
    } catch (error) {
      setError('Error al iniciar sesión');
    }
  };

  // Función para cerrar el banner
  const closeInstallBanner = () => {
    setShowInstallBanner(false);
  };

  // Función para instalar y luego cerrar
  const handleInstallPWA = async () => {
    await installPWA();
    closeInstallBanner();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#282580] to-[#3b2a91] flex items-center justify-center p-4">
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
              onClick={closeInstallBanner} // ← AQUÍ ESTÁ CORREGIDO
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors ml-2"
              aria-label="Cerrar"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full border border-blue-100 animate-fade-in mt-20">
        {/* Logo/Brand Section */}
        <div className="text-center mb-8">
          <div className="w-28 h-28 mx-auto mb-4 shadow-lg rounded-xl overflow-hidden bg-white">
            <img
              src="/logo512.png"
              alt="Wallet Voice Logo"
              className="w-full h-full object-contain"
              onError={(e) => {
                // Fallback si la imagen no carga
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
      </div>
    </div>
  );
};

export default LoginPage;