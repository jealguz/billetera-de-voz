import React, { useState } from 'react';
import { Mic, Volume2 } from 'lucide-react';
import { useVoice } from '../../hooks/useVoice';
import Card from '../ui/Card';

const VoiceAssistant: React.FC = () => {
   const {
     isListening,
     transcript,
     lastResponse,
     error,
     isSpeaking,
     startListening,
     stopListening,
     lastMessage,
     waitingForConfirmation,
    } = useVoice();

   const [showFeedback, setShowFeedback] = useState(false);

  // Obtener el texto de la respuesta
  const responseText = lastResponse?.response || '';
  const hasError = !!error;

  const handleVoiceButtonClick = async () => {
    if (isListening) {
      stopListening();
    } else {
      const result = await startListening();
      if (result && !result.needsConfirmation) {
        setShowFeedback(true);
        setTimeout(() => setShowFeedback(false), 3000);
      }
    }
  };

  return (
    <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="bg-white bg-opacity-20 p-2 rounded-full">
            {isSpeaking ? <Volume2 size={24} /> : <Mic size={24} />}
          </div>
          <div>
            <h3 className="font-bold text-lg">Asistente por Voz</h3>
            <p className="text-blue-100 text-sm">
              {isListening ? 'Habla ahora...' :
               isSpeaking ? 'Respondiendo...' :
               waitingForConfirmation ? 'Esperando confirmación...' :
               transcript && transcript !== 'Escuchando...' ? 'Procesando...' :
               'Presiona y habla'}
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center">
        <button
          onClick={handleVoiceButtonClick}
          disabled={isSpeaking}
          aria-label={isListening ? 'Detener escucha de voz' : 'Iniciar asistente de voz'}
          aria-pressed={isListening}
          role="button"
          className={`
            ${isListening ? 'animate-pulse bg-red-500' : 'bg-white bg-opacity-20'}
            ${isSpeaking ? 'opacity-50 cursor-not-allowed' : 'hover:bg-opacity-30'}
            p-6 rounded-full mb-4 transition-all
            disabled:opacity-50 disabled:cursor-not-allowed
          `}
        >
          {isSpeaking ? (
            <Volume2 size={40} />
          ) : (
            <Mic size={40} />
          )}
        </button>
        
        {/* Feedback visual */}
        {showFeedback && responseText && !hasError && (
          <div className="bg-green-500 bg-opacity-20 rounded-lg p-3 mb-3 w-full" aria-live="polite">
            <p className="text-sm text-center">
              ✓ {responseText}
            </p>
          </div>
        )}

        {error && (
          <div className="bg-red-500 bg-opacity-20 rounded-lg p-3 mb-3 w-full" aria-live="assertive">
            <p className="text-sm text-center">Error: {error}</p>
          </div>
        )}

        {transcript && transcript !== 'Escuchando...' && (
          <div className="bg-white bg-opacity-10 rounded-lg p-3 mb-3 w-full" aria-live="polite">
            <p className="text-sm text-center">Dijiste: "{transcript}"</p>
          </div>
        )}
        
        <p className="text-center text-blue-100 text-sm">
          Di: "José Castro me debe 2000 pesos" o "Resumen de deudas"
        </p>
      </div>
    </Card>
  );
};

export default VoiceAssistant;