import React, { useState, useEffect, useRef } from 'react';
import { Mic } from 'lucide-react';
import { useVoice } from '../hooks/useVoice';
import { clientService } from '../services/clientService';
import ConfirmationDialog from '../components/voice/ConfirmationDialog';
import Card from '../components/ui/Card';

const BusinessPage: React.FC = () => {
  const {
    isListening,
    startListening,
    transcript,
    lastResponse,
    needsConfirmation,
    confirmationData,
    handleConfirmation,
    isSpeaking,
    waitingForConfirmation,
    lastMessage,
    hasError,
    data,
    parsedCommand,
    // Añadir esto del hook actualizado
  } = useVoice();

   useEffect(() => {
    console.log('=== DEBUG VOICE HOOK ===');
    console.log('needsConfirmation:', needsConfirmation);
    console.log('waitingForConfirmation:', waitingForConfirmation);
    console.log('confirmationData:', confirmationData);
    console.log('transcript:', transcript);
    console.log('lastResponse:', lastResponse);
    console.log('=====================');
  }, [needsConfirmation, waitingForConfirmation, confirmationData, transcript, lastResponse]);

  const [summary, setSummary] = useState(clientService.getBusinessSummary());
  const [isProcessing, setIsProcessing] = useState(false);
  const retryRef = useRef<NodeJS.Timeout | null>(null);

  // Efecto para manejar confirmaciones por voz
  useEffect(() => {
    const processConfirmation = async () => {
      if (!needsConfirmation || !transcript || isProcessing) return;
      
      const lowerTranscript = transcript.toLowerCase();
      
      // Detectar confirmación positiva
      const positiveWords = [
        'sí', 'si', 'sip', 'claro', 'por supuesto', 
        'ok', 'okey', 'dale', 'adelante', 'vamos',
        'confirmar', 'confirmado', 'aceptar', 'acepto'
      ];
      
      // Detectar confirmación negativa
      const negativeWords = [
        'no', 'nop', 'cancelar', 'mejor no', 'olvídalo',
        'para nada', 'nada', 'no gracias', 'no quiero'
      ];
      
      const isPositive = positiveWords.some(word => 
        lowerTranscript.includes(word)
      );
      
      const isNegative = negativeWords.some(word => 
        lowerTranscript.includes(word)
      );
      
      if (isPositive || isNegative) {
        setIsProcessing(true);
        await handleConfirmation(isPositive);
        setIsProcessing(false);
        
        // Actualizar resumen después de la confirmación
        setSummary(clientService.getBusinessSummary());
      }
    };

    processConfirmation();
  }, [transcript, needsConfirmation, handleConfirmation, isProcessing]);

  // Efecto para reactivar el micrófono después de pedir confirmación
  useEffect(() => {
    if (needsConfirmation && !isListening && !isSpeaking) {
      // Esperar un momento para que el usuario escuche la pregunta
      if (retryRef.current) {
        clearTimeout(retryRef.current);
      }
      
      retryRef.current = setTimeout(async () => {
        if (needsConfirmation && !isListening && !isSpeaking) {
          console.log('Reactivando micrófono para confirmación...');
          try {
            await startListening();
          } catch (error) {
            console.error('Error reactivando micrófono:', error);
          }
        }
      }, 1500); // 1.5 segundos para que termine de hablar
    }
    
    return () => {
      if (retryRef.current) {
        clearTimeout(retryRef.current);
      }
    };
  }, [needsConfirmation, isListening, isSpeaking, startListening]);

  const handleVoiceClick = async () => {
    if (isListening || isSpeaking) return;
    
    try {
      const result = await startListening();
      
      if (result && !result.needsConfirmation) {
        // Actualizar resumen después de comando exitoso
        setTimeout(() => {
          setSummary(clientService.getBusinessSummary());
        }, 500);
      }
    } catch (error) {
      console.error('Error en click de voz:', error);
    }
  };

  // Obtener el texto de la respuesta
  const responseText = lastResponse?.response || '';

  return (
    <div className="p-4 space-y-6">
      {/* Diálogo de confirmación */}
      {needsConfirmation && confirmationData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <span className="text-xl">🤔</span>
              </div>
              <h3 className="font-bold text-lg">Confirmación requerida</h3>
            </div>
            
            <p className="text-gray-700 mb-6">
              {confirmationData.person} no está registrado como cliente. 
              ¿Deseas crear el cliente y registrar la deuda de {confirmationData.amount} pesos
              {confirmationData.description ? ` por "${confirmationData.description}"` : ''}?
            </p>
            
            <div className="flex gap-3">
              <button
                onClick={() => handleConfirmation(false)}
                className="flex-1 py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleConfirmation(true)}
                className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                Crear y registrar
              </button>
            </div>
            
            <p className="text-sm text-gray-500 mt-4 text-center">
              También puedes decir "Sí" o "No" por voz
            </p>
          </div>
        </div>
      )}

      {/* Botón de voz */}
      <div className="fixed bottom-20 right-4 z-40">
        <button
          onClick={handleVoiceClick}
          disabled={isSpeaking}
          className={`p-5 rounded-full shadow-xl ${
            isListening 
              ? 'bg-red-500 animate-pulse' 
              : isSpeaking
              ? 'bg-purple-500'
              : waitingForConfirmation
              ? 'bg-yellow-500 animate-pulse'
              : 'bg-blue-600 hover:bg-blue-700'
          } text-white transition-all disabled:opacity-50`}
          title={waitingForConfirmation ? "Esperando confirmación... di 'Sí' o 'No'" : ""}
        >
          <Mic size={32} />
          {waitingForConfirmation && (
            <span className="absolute -top-2 -right-2 bg-yellow-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center">
              ?
            </span>
          )}
        </button>
      </div>

      {/* Estado del micrófono */}
      <Card className={`${
        isListening ? 'border-red-500 bg-red-50' :
        waitingForConfirmation ? 'border-yellow-500 bg-yellow-50' :
        ''
      }`}>
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-full ${
            isListening ? 'bg-red-100 text-red-600' :
            isSpeaking ? 'bg-purple-100 text-purple-600' :
            waitingForConfirmation ? 'bg-yellow-100 text-yellow-600' :
            'bg-blue-100 text-blue-600'
          }`}>
            <Mic size={24} />
          </div>
          <div className="flex-1">
            <p className="font-medium">
              {isListening ? 'Escuchando... Habla ahora' :
               isSpeaking ? 'Respondiendo...' :
               waitingForConfirmation ? '✅ Esperando confirmación... di "Sí" o "No"' :
               'Presiona el micrófono y habla'}
            </p>
            {transcript && transcript !== 'Escuchando...' && (
              <p className="text-sm text-gray-600 mt-1">
                <span className="font-medium">Dijiste:</span> "{transcript}"
              </p>
            )}
            {waitingForConfirmation && (
              <p className="text-sm text-yellow-600 mt-1">
                ⏳ El micrófono se reactivará automáticamente...
              </p>
            )}
          </div>
        </div>
      </Card>

      {/* Respuesta del sistema */}
      {responseText && (
        <Card className={`${
          responseText.includes('✅') ? 'border-green-500 bg-green-50' :
          responseText.includes('❌') ? 'border-red-500 bg-red-50' :
          responseText.includes('⚠️') ? 'border-yellow-500 bg-yellow-50' :
          'border-blue-500 bg-blue-50'
        }`}>
          <div className="flex items-start gap-3">
            <div className="mt-1">
              {responseText.includes('✅') ? '✅' :
               responseText.includes('❌') ? '❌' :
               responseText.includes('⚠️') ? '⚠️' :
               '💬'}
            </div>
            <p className="flex-1">{responseText}</p>
          </div>
        </Card>
      )}

      {/* Resumen del negocio */}
      <Card>
        <h3 className="font-bold text-lg mb-4">📊 Resumen del Negocio</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">Clientes</p>
            <p className="text-2xl font-bold text-blue-600">{summary.totalClients}</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">Deuda Total</p>
            <p className="text-2xl font-bold text-red-600">${summary.totalOwed.toLocaleString()}</p>
          </div>
        </div>
      </Card>

      {/* Ejemplos de comandos */}
      <Card>
        <h3 className="font-bold text-lg mb-4">🎤 Ejemplos para probar:</h3>
        <div className="space-y-3">
          <button
            onClick={async () => {
              // Simular comando de voz
              console.log('Simulando: José Castro me debe 2000');
              const mockEvent = new Event('voiceCommand');
              (mockEvent as any).command = 'add_debt';
              (mockEvent as any).person = 'José Castro';
              (mockEvent as any).amount = 2000;
              window.dispatchEvent(mockEvent);
            }}
            className="w-full p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            <div className="font-medium">"José Castro me debe 2000 pesos"</div>
            <div className="text-sm text-gray-600">Registrar deuda (creará cliente si no existe)</div>
          </button>
          
          <button
            onClick={async () => {
              console.log('Simulando: Cliente nuevo María López');
              const mockEvent = new Event('voiceCommand');
              (mockEvent as any).command = 'create_client';
              (mockEvent as any).person = 'María López';
              window.dispatchEvent(mockEvent);
            }}
            className="w-full p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            <div className="font-medium">"Cliente nuevo María López"</div>
            <div className="text-sm text-gray-600">Crear nuevo cliente</div>
          </button>
          
          <button
            onClick={async () => {
              console.log('Simulando: ¿Cuánto debe José Castro?');
              const mockEvent = new Event('voiceCommand');
              (mockEvent as any).command = 'query_debt';
              (mockEvent as any).person = 'José Castro';
              window.dispatchEvent(mockEvent);
            }}
            className="w-full p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            <div className="font-medium">"¿Cuánto debe José Castro?"</div>
            <div className="text-sm text-gray-600">Consultar saldo de cliente</div>
          </button>
        </div>
      </Card>
    </div>
  );
};

export default BusinessPage;