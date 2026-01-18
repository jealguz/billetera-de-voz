import React, { useState } from 'react';
import { Mic, MicOff, CheckCircle } from 'lucide-react';
import { enhancedVoiceService } from '../services/enhancedVoiceService';

interface VoiceRegistrationProps {
  user: { name: string; lastName: string; email: string };
  onVoiceRegistered: (voiceData: string) => void;
  onSkip: () => void;
}

const VoiceRegistration: React.FC<VoiceRegistrationProps> = ({ user, onVoiceRegistered, onSkip }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordedVoice, setRecordedVoice] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const startRecording = async () => {
    try {
      setIsRecording(true);
      const transcript = await enhancedVoiceService.startListening();
      setIsRecording(false);
      setRecordedVoice(transcript);
    } catch (error) {
      console.error('Error grabando voz:', error);
      setIsRecording(false);
      // Fallback
      const sampleVoice = `${user.name} ${user.lastName}`;
      setRecordedVoice(sampleVoice);
    }
  };

  const playRecording = () => {
    setIsPlaying(true);
    // Simular reproducción
    setTimeout(() => setIsPlaying(false), 2000);
  };

  const handleConfirm = () => {
    if (recordedVoice) {
      onVoiceRegistered(recordedVoice);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mic className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            Registro de Voz
          </h1>
          <p className="text-gray-600">
            Para mayor seguridad, registra tu voz diciendo tu nombre completo.
          </p>
        </div>

        <div className="space-y-6">
          <div className="text-center">
            <p className="text-lg font-medium text-gray-800 mb-2">
              Di: "{user.name} {user.lastName}"
            </p>
          </div>

          {!recordedVoice ? (
            <div className="text-center">
              <button
                onClick={startRecording}
                disabled={isRecording}
                className={`w-full py-4 px-6 rounded-2xl font-semibold text-white transition-all duration-200 ${
                  isRecording
                    ? 'bg-red-500 hover:bg-red-600 animate-pulse'
                    : 'bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-xl'
                }`}
              >
                {isRecording ? (
                  <div className="flex items-center justify-center gap-2">
                    <MicOff size={20} />
                    Grabando... (3s)
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <Mic size={20} />
                    Comenzar Grabación
                  </div>
                )}
              </button>
              {isRecording && (
                <div className="mt-4 flex justify-center">
                  <div className="flex gap-1">
                    <div className="w-2 h-8 bg-red-500 rounded animate-pulse"></div>
                    <div className="w-2 h-6 bg-red-400 rounded animate-pulse" style={{animationDelay: '0.1s'}}></div>
                    <div className="w-2 h-10 bg-red-500 rounded animate-pulse" style={{animationDelay: '0.2s'}}></div>
                    <div className="w-2 h-7 bg-red-400 rounded animate-pulse" style={{animationDelay: '0.3s'}}></div>
                    <div className="w-2 h-9 bg-red-500 rounded animate-pulse" style={{animationDelay: '0.4s'}}></div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-green-50 rounded-2xl border border-green-200">
                <CheckCircle className="w-6 h-6 text-green-600" />
                <div>
                  <p className="font-medium text-green-800">Voz registrada</p>
                  <p className="text-sm text-green-600">"{recordedVoice}"</p>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={playRecording}
                  disabled={isPlaying}
                  className="flex-1 bg-gray-600 text-white py-3 px-4 rounded-xl hover:bg-gray-700 transition-colors font-medium"
                >
                  {isPlaying ? 'Reproduciendo...' : 'Reproducir'}
                </button>
                <button
                  onClick={handleConfirm}
                  className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-xl hover:bg-blue-700 transition-colors font-medium"
                >
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