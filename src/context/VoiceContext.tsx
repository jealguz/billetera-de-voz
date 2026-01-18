import React, { createContext, useContext, ReactNode } from 'react';
import { useVoice } from '../hooks/useVoice';

interface VoiceContextType extends ReturnType<typeof useVoice> {
  // Podemos agregar más métodos aquí si es necesario
}

const VoiceContext = createContext<VoiceContextType | undefined>(undefined);

export const VoiceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const voice = useVoice();

  return (
    <VoiceContext.Provider value={voice}>
      {children}
    </VoiceContext.Provider>
  );
};

export const useVoiceContext = () => {
  const context = useContext(VoiceContext);
  if (!context) {
    throw new Error('useVoiceContext debe usarse dentro de VoiceProvider');
  }
  return context;
};