import { useState, useCallback, useEffect } from 'react';
import { enhancedVoiceService } from '../services/enhancedVoiceService';
import { VoiceResponse } from '../services/enhancedVoiceService';

export const useVoice = () => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [lastResponse, setLastResponse] = useState<VoiceResponse | null>(null);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);
  const [confirmationData, setConfirmationData] = useState<any>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [waitingForConfirmation, setWaitingForConfirmation] = useState(false);

  // Efecto para escuchar confirmaciones cuando estamos esperando
  useEffect(() => {
    if (waitingForConfirmation && transcript && transcript !== 'Escuchando...') {
      const handleVoiceConfirmation = async () => {
        const lowerTranscript = transcript.toLowerCase();
        
        if (lowerTranscript.includes('sí') || lowerTranscript.includes('si') || 
            lowerTranscript.includes('confirmar') || lowerTranscript.includes('sip')) {
          await handleConfirmation(true);
        } else if (lowerTranscript.includes('no') || lowerTranscript.includes('cancelar') ||
                  lowerTranscript.includes('nop')) {
          await handleConfirmation(false);
        }
        // Si no es una confirmación válida, ignorar y seguir esperando
      };

      handleVoiceConfirmation();
    }
  }, [transcript, waitingForConfirmation]);

  const startListening = useCallback(async (): Promise<VoiceResponse | null> => {
    try {
      setIsListening(true);
      setTranscript('Escuchando...');
      setError(null);
      
      // Si ya estamos esperando confirmación, no procesar como comando normal
      if (waitingForConfirmation) {
        // Solo escuchar la confirmación
        const text = await enhancedVoiceService.startListening();
        setTranscript(text);
        setIsListening(false);
        return null;
      }
      
      // 1. Escuchar voz
      const text = await enhancedVoiceService.startListening();
      setTranscript(text);
      
      // 2. Procesar comando
      const result = await enhancedVoiceService.processNaturalCommand(text);
      setLastResponse(result);
      
      // 3. Verificar si necesita confirmación
      if (result.needsConfirmation && result.confirmationData) {
        setNeedsConfirmation(true);
        setConfirmationData(result.confirmationData);
        setWaitingForConfirmation(true);
        
        // Hablar la pregunta de confirmación
        if (result.response) {
          setIsSpeaking(true);
          await enhancedVoiceService.speak(result.response);
          setIsSpeaking(false);
          
          // Reactivar el micrófono automáticamente para escuchar la confirmación
          setTimeout(() => {
            if (waitingForConfirmation) {
              startListening();
            }
          }, 1000);
        }
        
        return result;
      }
      
      // 4. Hablar la respuesta normal
      if (result.response) {
        setIsSpeaking(true);
        await enhancedVoiceService.speak(result.response);
        setIsSpeaking(false);
      }
      
      return result;
    } catch (error: any) {
      const errorMessage = `Error: ${error.message || 'Error desconocido'}`;
      setError(errorMessage);
      
      const errorResponse: VoiceResponse = {
        success: false,
        response: errorMessage,
      };
      setLastResponse(errorResponse);
      
      return errorResponse;
    } finally {
      setIsListening(false);
    }
  }, [waitingForConfirmation]);

  const handleConfirmation = useCallback(async (confirm: boolean): Promise<VoiceResponse | null> => {
    if (!confirmationData) return null;
    
    try {
      const result = await enhancedVoiceService.handleConfirmation(confirmationData, confirm);
      setLastResponse(result);
      setNeedsConfirmation(false);
      setConfirmationData(null);
      setWaitingForConfirmation(false);
      
      // Hablar la respuesta
      if (result.response) {
        setIsSpeaking(true);
        await enhancedVoiceService.speak(result.response);
        setIsSpeaking(false);
      }
      
      return result;
    } catch (error: any) {
      const errorMessage = `Error en confirmación: ${error.message}`;
      setError(errorMessage);
      
      const errorResponse: VoiceResponse = {
        success: false,
        response: errorMessage,
      };
      setLastResponse(errorResponse);
      setWaitingForConfirmation(false);
      
      return errorResponse;
    }
  }, [confirmationData]);

  const stopListening = useCallback(() => {
    enhancedVoiceService.stopListening();
    setIsListening(false);
  }, []);

  const processTextCommand = useCallback(async (text: string): Promise<VoiceResponse> => {
    try {
      setError(null);
      const result = await enhancedVoiceService.processNaturalCommand(text);
      setLastResponse(result);
      
      // Verificar si necesita confirmación
      if (result.needsConfirmation && result.confirmationData) {
        setNeedsConfirmation(true);
        setConfirmationData(result.confirmationData);
        setWaitingForConfirmation(true);
      }
      
      return result;
    } catch (error: any) {
      const errorMessage = `Error procesando texto: ${error.message}`;
      setError(errorMessage);
      
      const errorResponse: VoiceResponse = {
        success: false,
        response: errorMessage,
      };
      setLastResponse(errorResponse);
      
      return errorResponse;
    }
  }, []);

  const speak = useCallback(async (text: string) => {
    try {
      setIsSpeaking(true);
      await enhancedVoiceService.speak(text);
    } catch (error: any) {
      setError(`Error al hablar: ${error.message}`);
      console.error('Error al hablar:', error);
    } finally {
      setIsSpeaking(false);
    }
  }, []);

  const clearState = useCallback(() => {
    setTranscript('');
    setLastResponse(null);
    setNeedsConfirmation(false);
    setConfirmationData(null);
    setError(null);
    setWaitingForConfirmation(false);
  }, []);

  // Función para manejar confirmación por botón
  const handleButtonConfirmation = useCallback(async (confirm: boolean) => {
    return handleConfirmation(confirm);
  }, [handleConfirmation]);

  return {
    // Estados
    isListening,
    transcript,
    lastResponse,
    needsConfirmation,
    confirmationData,
    isSpeaking,
    error,
    waitingForConfirmation,
    
    // Métodos
    startListening,
    stopListening,
    processTextCommand,
    handleConfirmation: handleButtonConfirmation, // Para botones
    handleVoiceConfirmation: handleConfirmation, // Para voz
    speak,
    clearState,
    
    // Getters útiles
    lastMessage: lastResponse?.response || '',
    hasError: !!error,
    data: lastResponse?.data,
    parsedCommand: lastResponse?.parsed,
  };
};