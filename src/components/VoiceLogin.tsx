import React, { useState } from 'react';
import { Mic, MicOff } from 'lucide-react';
import { userService } from '../services/userService';
import { enhancedVoiceService } from '../services/enhancedVoiceService';
import { toast } from 'react-hot-toast';

interface VoiceLoginProps {
  onLogin: () => void;
  onSwitchToLogin: () => void;
}

const VoiceLogin: React.FC<VoiceLoginProps> = ({ onLogin, onSwitchToLogin }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordedVoice, setRecordedVoice] = useState<string | null>(null);

  const startRecording = async () => {
    try {
      setIsRecording(true);
      const transcript = await enhancedVoiceService.startListening();
      setIsRecording(false);

      console.log('🎤 Transcripción obtenida:', transcript);

      if (transcript) {
        const user = userService.loginByVoice(transcript.trim());

        if (user) {
          toast.success(`¡Bienvenido, ${user.name}!`);
          onLogin();
        } else {
          toast.error('Voz no reconocida. Intenta iniciar sesión normalmente.');
          onSwitchToLogin();
        }
      } else {
        toast.error('No se pudo reconocer la voz. Inténtalo de nuevo.');
      }
    } catch (error) {
      console.error('Error grabando voz:', error);
      setIsRecording(false);
      toast.error('Error al acceder al micrófono.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full text-center">
        <div className="mb-6">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mic className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            Inicio por Voz
          </h1>
          <p className="text-gray-600">
            Di tu nombre completo para acceder
          </p>
        </div>

        <div className="space-y-6">
          {!isRecording ? (
            <button
              onClick={startRecording}
              className="w-full bg-blue-600 text-white py-4 px-6 rounded-2xl font-semibold hover:bg-blue-700 transition-all duration-200"
            >
              <div className="flex items-center justify-center gap-2">
                <Mic size={20} />
                Comenzar Reconocimiento
              </div>
            </button>
          ) : (
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <div className="flex gap-1">
                  <div className="w-3 h-8 bg-blue-500 rounded animate-pulse"></div>
                  <div className="w-3 h-6 bg-blue-400 rounded animate-pulse" style={{animationDelay: '0.1s'}}></div>
                  <div className="w-3 h-10 bg-blue-500 rounded animate-pulse" style={{animationDelay: '0.2s'}}></div>
                  <div className="w-3 h-7 bg-blue-400 rounded animate-pulse" style={{animationDelay: '0.3s'}}></div>
                  <div className="w-3 h-9 bg-blue-500 rounded animate-pulse" style={{animationDelay: '0.4s'}}></div>
                </div>
              </div>
              <p className="text-gray-600">Escuchando...</p>
            </div>
          )}

          <button
            onClick={onSwitchToLogin}
            className="w-full text-blue-600 hover:text-blue-700 text-sm underline"
          >
            Iniciar con email y contraseña
          </button>
        </div>
      </div>
    </div>
  );
};

export default VoiceLogin;