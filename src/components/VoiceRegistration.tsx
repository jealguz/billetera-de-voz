import React, { useState } from 'react';
import { Mic, CheckCircle } from 'lucide-react';
import { enhancedVoiceService } from '../services/enhancedVoiceService';

interface VoiceRegistrationProps {
  user: { name: string; lastName: string; email: string };
  onVoiceRegistered: (voiceData: string) => void;
  onSkip: () => void;
}

const VoiceRegistration: React.FC<VoiceRegistrationProps> = ({ user, onVoiceRegistered, onSkip }) => {
  const [isListening, setIsListening] = useState(false);
  const [recordedVoice, setRecordedVoice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const startListening = async () => {
    try {
      setIsListening(true);
      setError(null);
      const transcript = await enhancedVoiceService.startListening();
      setIsListening(false);
      setRecordedVoice(transcript);
    } catch (error: any) {
      console.error('Error en reconocimiento de voz:', error);
      setIsListening(false);
      setError('Error al reconocer voz. Verifica tu conexión a internet e intenta de nuevo.');
    }
  };

  const handleConfirm = () => {
    if (recordedVoice) {
      onVoiceRegistered(recordedVoice);
    }
  };

  return (
    <div className="min-h-screen bg-[#282580] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full border border-blue-100 animate-fade-in">
        {/* Logo/Brand Section */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-4 shadow-lg rounded-xl overflow-hidden bg-white">
            <img
              src="/logo512.png"
              alt="Wallet Voice Logo"
              className="w-full h-full object-contain"
              onError={(e) => {
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

        {/* Voice Registration */}
        <div className="space-y-6">
          <div className="text-center">
            <p className="text-lg font-medium text-gray-800 mb-2">
              Di: "{user.name} {user.lastName}"
            </p>
            <p className="text-sm text-gray-600">
              El sistema convertirá tu voz en texto para registrarte.
            </p>
          </div>

          {!recordedVoice ? (
            <div className="text-center">
              {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl">
                  <p className="text-red-600 text-sm font-medium">{error}</p>
                </div>
              )}
              <button
                onClick={startListening}
                disabled={isListening}
                className={`w-full py-4 px-6 rounded-2xl font-semibold text-white transition-all duration-200 ${
                  isListening
                    ? 'bg-red-500 hover:bg-red-600 animate-pulse'
                    : 'bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-xl'
                }`}
              >
                {isListening ? (
                  <div className="flex items-center justify-center gap-2">
                    <Mic className="w-5 h-5 animate-pulse" />
                    Escuchando...
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <Mic className="w-5 h-5" />
                    Comenzar Grabación
                  </div>
                )}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-green-50 rounded-2xl border border-green-200">
                <CheckCircle className="w-6 h-6 text-green-600" />
                <div>
                  <p className="font-medium text-green-800">Voz reconocida correctamente</p>
                  <p className="text-sm text-green-600">"{recordedVoice}"</p>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setRecordedVoice(null)}
                  className="flex-1 bg-gray-600 text-white py-3 px-4 rounded-xl hover:bg-gray-700 transition-colors font-medium"
                >
                  Reintentar
                </button>
                <button
                  onClick={handleConfirm}
                  className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-xl hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  Confirmar
                </button>
              </div>
            </div>
          )}

          <button
            onClick={onSkip}
            className="w-full text-gray-500 hover:text-gray-700 py-2 text-sm underline"
          >
            Omitir por ahora
          </button>
        </div>
      </div>
    </div>
  );
};

export default VoiceRegistration;