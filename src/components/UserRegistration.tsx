import React, { useState } from 'react';
import { User, Mail, Lock, UserPlus, CheckCircle, Download } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import VoiceRegistration from './VoiceRegistration';

interface NewUser {
  name: string;
  lastName: string;
  email: string;
  password: string;
  voiceData?: string;
}

interface UserRegistrationProps {
  onRegister: (email: string, password: string) => Promise<void>;
}

const UserRegistration: React.FC<UserRegistrationProps> = ({ onRegister }) => {
  const [name, setName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [showVoiceRegistration, setShowVoiceRegistration] = useState(false);
  const [userData, setUserData] = useState<NewUser | null>(null);
  const { isInstalled, installPWA } = usePWAInstall();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !lastName || !email || !password) {
      setError('Todos los campos son obligatorios');
      return;
    }
    if (!email.includes('@')) {
      setError('Correo electrónico inválido');
      return;
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }
    const user = { name, lastName, email, password };
    setUserData(user);
    setShowVoiceRegistration(true);
  };

  const handleVoiceRegistered = async (voiceData: string) => {
    if (userData) {
      await onRegister(userData.email, userData.password);
    }
  };

  const handleSkipVoice = async () => {
    if (userData) {
      await onRegister(userData.email, userData.password);
    }
  };

  if (showVoiceRegistration && userData) {
    return (
      <VoiceRegistration
        user={userData}
        onVoiceRegistered={handleVoiceRegistered}
        onSkip={handleSkipVoice}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#282580] flex items-center justify-center p-4">
      {/* Install Banner */}
      {!isInstalled && (
        <div className="fixed top-4 left-4 right-4 bg-white rounded-xl p-4 shadow-lg border border-blue-200 z-50 animate-fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Download className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Instala Wallet Voice</h4>
                <p className="text-sm text-gray-600">Acceso rápido desde tu pantalla de inicio</p>
              </div>
            </div>
            <button
              onClick={installPWA}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Instalar
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full border border-blue-100 animate-fade-in">
        {/* Logo/Brand Section */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-4 shadow-lg rounded-xl overflow-hidden bg-white">
            <img
              src="/logo512.png"
              alt="Wallet Voice Logo"
              className="w-full h-full object-contain"
              onError={(e) => {
                // Fallback si la imagen no carga
                e.currentTarget.style.display = 'none';
                e.currentTarget.parentElement!.innerHTML = '<div class="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mx-auto shadow-lg"><svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"></path></svg></div>';
              }}
            />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2 bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
            Wallet Voice
          </h1>
          <p className="text-gray-600 text-sm">
            Gestiona tus finanzas con voz
          </p>
        </div>

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-sm font-semibold text-gray-700">
                Nombre
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 bg-gray-50 focus:bg-white text-sm"
                  placeholder="Tu nombre"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-semibold text-gray-700">
                Apellido
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 bg-gray-50 focus:bg-white text-sm"
                  placeholder="Tu apellido"
                  required
                />
              </div>
            </div>
          </div>

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
                placeholder="Mínimo 6 caracteres"
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-semibold text-gray-700">
              Confirmar Contraseña
            </label>
            <div className="relative">
              <CheckCircle className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 bg-gray-50 focus:bg-white"
                placeholder="Repite tu contraseña"
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
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-3 px-6 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <UserPlus className="w-5 h-5" />
            Crear Cuenta
          </button>
        </form>

        {/* Password Requirements */}
        <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
          <h4 className="text-sm font-semibold text-blue-800 mb-2">Requisitos de contraseña:</h4>
          <ul className="text-xs text-blue-700 space-y-1">
            <li>• Mínimo 6 caracteres</li>
            <li>• Combinación de letras y números recomendada</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default UserRegistration;