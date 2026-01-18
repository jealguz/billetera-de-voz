import { useState, useCallback, useEffect } from 'react';
import { enhancedVoiceService } from '../services/enhancedVoiceService';

export const useEnhancedVoice = () => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [lastResponse, setLastResponse] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conversation, setConversation] = useState<Array<{
    type: 'user' | 'system';
    text: string;
    timestamp: Date;
  }>>([]);

  const startListening = useCallback(async () => {
    try {
      setIsListening(true);
      setTranscript('Escuchando...');
      setError(null);
      
      const text = await enhancedVoiceService.startListening();
      setTranscript(text);
      
      // Agregar a conversación
      setConversation(prev => [...prev, {
        type: 'user',
        text,
        timestamp: new Date(),
      }]);
      
      // Procesar comando
      setIsProcessing(true);
      const result = await enhancedVoiceService.processNaturalCommand(text);
      setIsProcessing(false);
      
      setLastResponse(result.response);
      
      // Agregar respuesta a conversación
      setConversation(prev => [...prev, {
        type: 'system',
        text: result.response,
        timestamp: new Date(),
      }]);
      
      // Hablar la respuesta
      if (result.response) {
        await enhancedVoiceService.speak(result.response);
      }
      
      return result;
      
    } catch (error: any) {
      setIsProcessing(false);
      setError(error.message);
      setLastResponse(`Error: ${error.message}`);
      return null;
    } finally {
      setIsListening(false);
    }
  }, []);

  const stopListening = useCallback(() => {
    enhancedVoiceService.stopListening();
    setIsListening(false);
  }, []);

  const sendTextCommand = useCallback(async (text: string) => {
    try {
      setTranscript(text);
      setIsProcessing(true);
      
      // Agregar a conversación
      setConversation(prev => [...prev, {
        type: 'user',
        text,
        timestamp: new Date(),
      }]);
      
      const result = await enhancedVoiceService.processNaturalCommand(text);
      setIsProcessing(false);
      
      setLastResponse(result.response);
      
      // Agregar respuesta a conversación
      setConversation(prev => [...prev, {
        type: 'system',
        text: result.response,
        timestamp: new Date(),
      }]);
      
      return result;
    } catch (error: any) {
      setIsProcessing(false);
      setError(error.message);
      return null;
    }
  }, []);

  const clearConversation = useCallback(() => {
    setConversation([]);
    setLastResponse('');
    setTranscript('');
  }, []);

  return {
    // Estados
    isListening,
    transcript,
    lastResponse,
    isProcessing,
    error,
    conversation,
    
    // Métodos
    startListening,
    stopListening,
    sendTextCommand,
    clearConversation,
  };
};