import React, { useState } from 'react';
import { Mic, Square } from 'lucide-react';
import Button from '../ui/Button';
import Card from '../ui/Card';
import toast from 'react-hot-toast'; // Asegúrate de importar toast

interface VoiceRecorderProps {
  onRecordingComplete: (text: string) => void;
  onRecordingStart?: () => void; // Esta prop es opcional
  disabled?: boolean;
}

const VoiceRecorder: React.FC<VoiceRecorderProps> = ({
  onRecordingComplete,
  onRecordingStart,
  disabled = false
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);

  const startRecording = () => {
    if (!('webkitSpeechRecognition' in window)) {
      toast.error('Tu navegador no soporta grabación de voz');
      return;
    }

    // @ts-ignore
    const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
    const newRecognition = new SpeechRecognition();
    
    newRecognition.lang = 'es-ES';
    newRecognition.interimResults = false;
    newRecognition.continuous = false;
    
    newRecognition.onstart = () => {
      setIsRecording(true);
      if (onRecordingStart) {
        onRecordingStart(); // Llama a la callback si existe
      }
    };
    
    newRecognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      onRecordingComplete(transcript);
    };
    
    newRecognition.onerror = (event: any) => {
      console.error('Error de reconocimiento:', event.error);
      setIsRecording(false);
      toast.error('Error de micrófono');
    };
    
    newRecognition.onend = () => {
      setIsRecording(false);
    };
    
    setRecognition(newRecognition);
    newRecognition.start();
  };

  const stopRecording = () => {
    if (recognition) {
      recognition.stop();
      setIsRecording(false);
    }
  };

  return (
    <Card padding="lg" className="text-center">
      <div className="flex flex-col items-center gap-4">
        <div className={`p-6 rounded-full transition-all duration-300 ${
          isRecording 
            ? 'bg-red-100 animate-pulse' 
            : 'bg-blue-100'
        }`}>
          {isRecording ? (
            <Square className="h-12 w-12 text-red-600" />
          ) : (
            <Mic className="h-12 w-12 text-blue-600" />
          )}
        </div>
        
        <div>
          <h3 className="font-bold text-lg mb-2">
            {isRecording ? 'Grabando...' : 'Grabar voz'}
          </h3>
          <p className="text-gray-600 mb-4">
            {isRecording 
              ? 'Habla claramente. Haz clic en detener cuando termines.' 
              : 'Haz clic para grabar tu comando de voz.'}
          </p>
        </div>
        
        <div className="flex gap-3">
          <Button
            onClick={isRecording ? stopRecording : startRecording}
            disabled={disabled}
            variant={isRecording ? 'danger' : 'primary'}
            icon={isRecording ? Square : Mic}
            size="lg"
          >
            {isRecording ? 'Detener grabación' : 'Iniciar grabación'}
          </Button>
        </div>
        
        <div className="mt-6 p-3 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">
            💡 <strong>Comandos útiles:</strong>
          </p>
          <p className="text-xs text-gray-500 mt-1">
            "¿Cuánto me debe José?" • "Carlos me debe 200" • "Resumen de deudas"
          </p>
        </div>
      </div>
    </Card>
  );
};

export default VoiceRecorder;