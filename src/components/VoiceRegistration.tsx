import React, { useState, useEffect } from 'react';
import { Mic, MicOff, CheckCircle, Trash2, RotateCcw } from 'lucide-react';
import { enhancedVoiceService } from '../services/enhancedVoiceService';

interface VoiceRegistrationProps {
  user: { name: string; lastName: string; email: string };
  onVoiceRegistered: (voiceData: string) => void;
  onSkip: () => void;
}

const VoiceRegistration: React.FC<VoiceRegistrationProps> = ({ user, onVoiceRegistered, onSkip }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordedVoice, setRecordedVoice] = useState<string | null>(null);
  const [recordedAudio, setRecordedAudio] = useState<Blob | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      // Cleanup: stop recording if component unmounts
      if (mediaRecorder && mediaRecorder.state === 'recording') {
        mediaRecorder.stop();
      }
    };
  }, [mediaRecorder]);

  const startRecording = async () => {
    try {
      setIsRecording(true);
      setError(null);

      // Check if microphone is available
      const devices = await navigator.mediaDevices.enumerateDevices();
      const audioInputs = devices.filter(device => device.kind === 'audioinput');

      if (audioInputs.length === 0) {
        throw new Error('NoMicrophone');
      }

      // Start speech recognition first (this is more important)
      const transcriptPromise = enhancedVoiceService.startListening();

      let recorder: MediaRecorder | null = null;
      let stream: MediaStream | null = null;

      try {
        // Try to get audio stream for recording
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        recorder = new MediaRecorder(stream);
        setMediaRecorder(recorder);

        const audioChunks: Blob[] = [];

        recorder.ondataavailable = (event) => {
          audioChunks.push(event.data);
        };

        recorder.onstop = () => {
          if (audioChunks.length > 0) {
            const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
            setRecordedAudio(audioBlob);
          }

          // Stop all tracks to free microphone
          if (stream) {
            stream.getTracks().forEach(track => track.stop());
          }
        };

        // Start recording
        recorder.start();
      } catch (audioError: any) {
        console.warn('Audio recording failed, but speech recognition may work:', audioError);
        // Continue with speech recognition even if audio recording fails
      }

      // Set maximum time limit
      const maxTimeTimeout = setTimeout(() => {
        if (recorder && recorder.state === 'recording') {
          recorder.stop();
        }
        setIsRecording(false);
      }, 7000);

      try {
        // Wait for transcript
        const transcript = await transcriptPromise;
        setRecordedVoice(transcript);

        // Stop recording after transcript is received
        setTimeout(() => {
          if (recorder && recorder.state === 'recording') {
            recorder.stop();
          }
          clearTimeout(maxTimeTimeout);
          setIsRecording(false);
        }, 1000);

      } catch (transcriptError: any) {
        console.error('Speech recognition failed:', transcriptError);
        clearTimeout(maxTimeTimeout);

        if (recorder && recorder.state === 'recording') {
          recorder.stop();
        }

        setIsRecording(false);
        throw new Error('SpeechRecognitionFailed');
      }

    } catch (error: any) {
      console.error('Error grabando voz:', error);
      setIsRecording(false);

      let errorMessage = 'Error al grabar voz. Inténtalo de nuevo.';

      if (error.message === 'NoMicrophone') {
        errorMessage = 'No se detectó micrófono. Conecta un micrófono e inténtalo de nuevo.';
      } else if (error.name === 'NotFoundError') {
        errorMessage = 'Micrófono no encontrado. Verifica que esté conectado correctamente.';
      } else if (error.name === 'NotAllowedError') {
        errorMessage = 'Permiso de micrófono denegado. Haz clic en el icono del micrófono en la barra de direcciones y permite el acceso.';
      } else if (error.message === 'SpeechRecognitionFailed') {
        errorMessage = 'El reconocimiento de voz falló. Esto puede deberse a una conexión lenta o configuración del navegador.';
      }

      setError(errorMessage);
    }
  };

  const playRecording = () => {
    if (!recordedAudio) return;

    setIsPlaying(true);
    const audioUrl = URL.createObjectURL(recordedAudio);
    const audio = new Audio(audioUrl);

    audio.onended = () => {
      setIsPlaying(false);
      URL.revokeObjectURL(audioUrl);
    };

    audio.onerror = () => {
      setIsPlaying(false);
      URL.revokeObjectURL(audioUrl);
    };

    audio.play().catch(() => {
      setIsPlaying(false);
      URL.revokeObjectURL(audioUrl);
    });
  };

  const deleteRecording = () => {
    setRecordedVoice(null);
    setRecordedAudio(null);
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.stop();
    }
    setMediaRecorder(null);
  };

  const retryRecording = () => {
    deleteRecording();
    startRecording();
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
             Para mayor seguridad, registra tu voz diciendo tu nombre completo (máximo 5 segundos).
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
               {error && (
                 <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl">
                   <p className="text-red-600 text-sm font-medium">{error}</p>
                 </div>
               )}
               <button
                 onClick={() => {
                   setError(null);
                   startRecording();
                 }}
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
                     Grabando... (máx 5s)
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
                 <div className="flex-1">
                   <p className="font-medium text-green-800">Voz registrada</p>
                   <p className="text-sm text-green-600">"{recordedVoice}"</p>
                   <p className="text-xs text-green-500 mt-1">
                     {recordedAudio
                       ? 'Puedes escuchar, reintentar o eliminar la grabación'
                       : 'Grabación de audio falló, pero el texto se registró correctamente'
                     }
                   </p>
                 </div>
               </div>

               <div className="space-y-3">
                 <div className="flex gap-2">
                   <button
                     onClick={playRecording}
                     disabled={isPlaying || !recordedAudio}
                     className="flex-1 bg-gray-600 text-white py-3 px-4 rounded-xl hover:bg-gray-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center gap-2"
                   >
                     <Mic className="w-4 h-4" />
                     {isPlaying ? 'Reproduciendo...' : recordedAudio ? 'Escuchar Voz' : 'Solo Texto'}
                   </button>
                   <button
                     onClick={retryRecording}
                     disabled={isRecording}
                     className="bg-orange-600 text-white py-3 px-4 rounded-xl hover:bg-orange-700 disabled:bg-orange-400 disabled:cursor-not-allowed transition-colors font-medium"
                     title="Reintentar grabación"
                   >
                     <RotateCcw className="w-4 h-4" />
                   </button>
                   <button
                     onClick={deleteRecording}
                     className="bg-red-600 text-white py-3 px-4 rounded-xl hover:bg-red-700 transition-colors font-medium"
                     title="Eliminar grabación"
                   >
                     <Trash2 className="w-4 h-4" />
                   </button>
                 </div>
                 <button
                   onClick={handleConfirm}
                   className="w-full bg-blue-600 text-white py-3 px-4 rounded-xl hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2"
                 >
                   <CheckCircle className="w-4 h-4" />
                   Confirmar y Continuar
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