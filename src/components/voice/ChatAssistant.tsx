import React, { useState, useRef, useEffect } from 'react';
import { Mic, Send, User, Bot, Trash2 } from 'lucide-react';
import { useEnhancedVoice } from '../../hooks/useEnhancedVoice';
import Card from '../ui/Card';
import Button from '../ui/Button';

const ChatAssistant: React.FC = () => {
  const {
    isListening,
    transcript,
    lastResponse,
    isProcessing,
    conversation,
    startListening,
    sendTextCommand,
    clearConversation,
  } = useEnhancedVoice();
  
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Auto-scroll al último mensaje
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation]);
  
  const handleVoiceClick = async () => {
    if (isListening) return;
    await startListening();
  };
  
  const handleSendText = async () => {
    if (!inputText.trim()) return;
    
    await sendTextCommand(inputText);
    setInputText('');
  };
  
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendText();
    }
  };
  
  // Comandos de ejemplo inteligentes
  const exampleCommands = [
    "José Castro me debe 2000 pesos por materiales de construcción",
    "María Rodríguez pagó 500 pesos de lo que debía",
    "¿Cuánto le debo a Carlos Méndez?",
    "Hazme un resumen general de todas las deudas",
    "Cliente nuevo: Pedro López, teléfono 555-1234",
    "Ana Gómez quedó debiendo 3000 por el servicio de plomería",
    "¿Cuál es el estado de cuenta de Roberto Sánchez?",
    "Luis Fernández abonó 1000 pesos a su deuda pendiente",
  ];

  return (
    <div className="space-y-4">
      {/* Historial de conversación */}
      <Card className="h-96 overflow-hidden flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg">💬 Asistente Conversacional</h3>
          <Button
            variant="ghost"
            size="sm"
            icon={Trash2}
            onClick={clearConversation}
          >
            Limpiar
          </Button>
        </div>
        
        <div className="flex-1 overflow-y-auto space-y-4 p-2">
          {conversation.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <Bot size={48} className="mx-auto mb-3 text-gray-300" />
              <p>Di algo como "José debe 2000 pesos" para empezar</p>
            </div>
          ) : (
            conversation.map((msg, index) => (
              <div
                key={index}
                className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs md:max-w-md rounded-lg p-3 ${
                    msg.type === 'user'
                      ? 'bg-blue-100 text-blue-900 rounded-br-none'
                      : 'bg-gray-100 text-gray-900 rounded-bl-none'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    {msg.type === 'user' ? (
                      <User size={14} className="text-blue-600" />
                    ) : (
                      <Bot size={14} className="text-gray-600" />
                    )}
                    <span className="text-xs font-medium">
                      {msg.type === 'user' ? 'Tú' : 'Asistente'}
                    </span>
                    <span className="text-xs text-gray-500 ml-auto">
                      {new Date(msg.timestamp).toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </span>
                  </div>
                  <p className="text-sm">{msg.text}</p>
                </div>
              </div>
            ))
          )}
          
          {/* Indicador de procesamiento */}
          {isProcessing && (
            <div className="flex justify-start">
              <div className="bg-gray-100 rounded-lg rounded-bl-none p-3 max-w-xs">
                <div className="flex items-center gap-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                  <span className="text-sm text-gray-600">Procesando...</span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </Card>
      
      {/* Entrada de texto */}
      <Card>
        <div className="flex gap-2">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Escribe un comando o pregunta..."
            className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            rows={2}
            disabled={isProcessing}
          />
          <div className="flex flex-col gap-2">
            <Button
              onClick={handleSendText}
              disabled={!inputText.trim() || isProcessing}
              icon={Send}
              className="h-full"
            >
              Enviar
            </Button>
            <Button
              onClick={handleVoiceClick}
              disabled={isListening || isProcessing}
              variant={isListening ? 'danger' : 'primary'}
              icon={Mic}
              className="h-full"
            >
              {isListening ? 'Escuchando...' : 'Voz'}
            </Button>
          </div>
        </div>
        
        {transcript && transcript !== 'Escuchando...' && (
          <div className="mt-2 p-2 bg-blue-50 rounded text-sm">
            <span className="font-medium">Escuché:</span> "{transcript}"
          </div>
        )}
      </Card>
      
      {/* Comandos de ejemplo */}
      <Card>
        <h4 className="font-bold text-gray-900 mb-3">💡 Ejemplos para probar:</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {exampleCommands.map((cmd, index) => (
            <button
              key={index}
              onClick={() => sendTextCommand(cmd)}
              disabled={isProcessing}
              className="text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <p className="text-sm font-medium text-gray-900">"{cmd}"</p>
            </button>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default ChatAssistant;