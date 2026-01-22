import React from 'react';
import { Users, Bell, History } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const QuickActions: React.FC = () => {
  const navigate = useNavigate();

  const handleQuickAction = (action: 'add' | 'summary' | 'history') => {
    console.log(`Acción rápida: ${action}`);
    
    switch (action) {
      case 'add':
        navigate('/add-debt');
        break;
      
       case 'summary':
         // Abrir modal de resumen
         window.dispatchEvent(new CustomEvent('openSummaryModal'));
         break;
      
      case 'history':
        navigate('/debts');
        break;
      
      default:
        break;
    }
  };

  return (
    <div className="card-professional mb-8">
      <div className="card-header">
        <h3 className="font-bold text-gray-800">⚡ Acciones Rápidas</h3>
      </div>
      <div className="card-body">
        <div className="grid grid-cols-3 gap-4">
        <button
          onClick={() => handleQuickAction('add')}
          className="flex flex-col items-center p-4 bg-white rounded-xl border border-gray-300 hover:border-blue-400 hover:bg-blue-50 hover:shadow-md transition-all duration-200 active:scale-95"
        >
          <div className="p-2 bg-blue-100 rounded-lg mb-2">
            <Users size={20} className="text-blue-600" />
          </div>
          <span className="font-medium text-sm text-gray-900">Agregar</span>
          <span className="text-xs text-gray-500">Nueva deuda</span>
        </button>
        
        <button
          onClick={() => handleQuickAction('summary')}
          className="flex flex-col items-center p-4 bg-white rounded-xl border border-gray-300 hover:border-blue-400 hover:bg-blue-50 hover:shadow-md transition-all duration-200 active:scale-95"
        >
          <div className="p-2 bg-green-100 rounded-lg mb-2">
            <Bell size={20} className="text-green-600" />
          </div>
          <span className="font-medium text-sm text-gray-900">Resumen</span>
          <span className="text-xs text-gray-500">Ver totales</span>
        </button>
        
        <button
          onClick={() => handleQuickAction('history')}
          className="flex flex-col items-center p-4 rounded-xl border border-gray-300 hover:border-blue-400 hover:bg-blue-50 bg-white transition-all duration-200 active:scale-95"
        >
          <div className="p-2 bg-yellow-100 rounded-lg mb-2">
            <History size={20} className="text-yellow-600" />
          </div>
          <span className="font-medium text-sm text-gray-900">Historial</span>
          <span className="text-xs text-gray-500">Ver todo</span>
        </button>
        </div>
      </div>
    </div>
  );
};

export default QuickActions;