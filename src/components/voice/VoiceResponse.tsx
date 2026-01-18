import React, { useState } from 'react';
import { Volume2, Copy, Check } from 'lucide-react';
import Button from '../ui/Button';
import Card from '../ui/Card';

interface VoiceResponseProps {
  text: string;
  onSpeak?: () => void;
  className?: string;
}

const VoiceResponse: React.FC<VoiceResponseProps> = ({ 
  text, 
  onSpeak,
  className = ''
}) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [copied, setCopied] = useState(false);

  const speakText = () => {
    if ('speechSynthesis' in window) {
      setIsSpeaking(true);
      
      // Cancelar cualquier habla previa
      speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'es-ES';
      utterance.rate = 1;
      utterance.pitch = 1;
      
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      
      speechSynthesis.speak(utterance);
      
      if (onSpeak) {
        onSpeak();
      }
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <Card className={`${className}`}>
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-100 rounded-lg">
              <Volume2 className="h-4 w-4 text-blue-600" />
            </div>
            <h4 className="font-medium text-gray-900">Respuesta</h4>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={copyToClipboard}
              icon={copied ? Check : Copy}
              className={copied ? 'text-green-600' : ''}
            >
              {copied ? 'Copiado' : 'Copiar'}
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={speakText}
              disabled={isSpeaking}
              icon={Volume2}
            >
              {isSpeaking ? 'Hablando...' : 'Escuchar'}
            </Button>
          </div>
        </div>
        
        <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
          <p className="text-gray-800 leading-relaxed">{text}</p>
        </div>
        
        {isSpeaking && (
          <div className="flex items-center gap-2 text-sm text-blue-600">
            <div className="h-2 w-2 bg-blue-600 rounded-full animate-pulse"></div>
            <span>Reproduciendo respuesta...</span>
          </div>
        )}
      </div>
    </Card>
  );
};

export default VoiceResponse;