import React, { useState } from 'react';
import { Home, ListPlus, Mic, Building2, Settings } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useVoice } from '../../hooks/useVoice';
import { useAuth } from '../../context/AuthContext';

const BottomNav: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isListening, startListening, stopListening } = useVoice();
  const { state } = useAuth();
  const [showFeedback, setShowFeedback] = useState(false);

  const getCurrentPage = () => {
    if (location.pathname === '/') return 'home';
    if (location.pathname === '/debts') return 'debts';
    if (location.pathname === '/business') return 'business';
    if (location.pathname === '/admin') return 'admin';
    return 'home';
  };

  const currentPage = getCurrentPage();
  const isAdmin = state.user?.role === 'admin';

  const handleNavigate = (path: string) => {
    navigate(path);
  };

  const handleVoiceButton = async () => {
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
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
      <div className="flex justify-around items-center h-16">
        <button
          onClick={() => handleNavigate('/')}
          className={`flex flex-col items-center p-2 transition-colors ${
            currentPage === 'home' 
              ? 'text-blue-600' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Home size={24} />
          <span className="text-xs mt-1">Inicio</span>
        </button>
        
        <button
          onClick={() => handleNavigate('/business')}
          className={`flex flex-col items-center p-2 transition-colors ${
            currentPage === 'business' 
              ? 'text-blue-600' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Building2 size={24} />
          <span className="text-xs mt-1">Negocio</span>
        </button>
        
        <button
          onClick={handleVoiceButton}
          className="flex flex-col items-center p-2"
        >
          <div className={`p-3 rounded-full shadow-lg transition-colors -mt-6 ${
            isListening
              ? 'bg-red-600 text-white animate-pulse'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}>
            <Mic size={28} />
          </div>
          <span className="text-xs mt-1 text-gray-500">
            {isListening ? 'Escuchando...' : 'Hablar'}
          </span>
        </button>

        {showFeedback && (
          <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg">
            ✓ Comando procesado
          </div>
        )}
        
        <button
          onClick={() => handleNavigate('/debts')}
          className={`flex flex-col items-center p-2 transition-colors ${
            currentPage === 'debts' 
              ? 'text-blue-600' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <ListPlus size={24} />
          <span className="text-xs mt-1">Deudas</span>
        </button>

        {isAdmin && (
          <button
            onClick={() => handleNavigate('/admin')}
            className={`flex flex-col items-center p-2 transition-colors ${
              currentPage === 'admin' 
                ? 'text-purple-600' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Settings size={24} />
            <span className="text-xs mt-1">Admin</span>
          </button>
        )}
      </div>
    </nav>
  );
};

export default BottomNav;