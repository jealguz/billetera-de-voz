import React from 'react';
import { Mail, User, LogOut } from 'lucide-react';

interface UserInfoProps {
  onLogout: () => void;
}

const UserInfo: React.FC<UserInfoProps> = ({ onLogout }) => {
  // Obtener usuario del localStorage (de tu userService)
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
  
  if (!currentUser) {
    return null; // No mostrar si no hay usuario
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border p-4 mb-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
            <User className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <div className="font-medium text-gray-900">
              {currentUser.name || currentUser.email.split('@')[0]}
            </div>
            <div className="flex items-center gap-1 text-sm text-gray-500">
              <Mail className="w-4 h-4" />
              {currentUser.email}
            </div>
          </div>
        </div>
        
        <button
          onClick={onLogout}
          className="flex items-center gap-2 text-gray-600 hover:text-red-600 hover:bg-red-50 px-3 py-2 rounded-lg transition-colors"
          title="Cerrar sesión"
        >
          <LogOut className="w-4 h-4" />
          <span className="text-sm font-medium">Salir</span>
        </button>
      </div>
      
      <div className="mt-3 text-xs text-gray-400 border-t pt-3">
        <p>✨ Usuario: {currentUser.id.substring(0, 8)}...</p>
      </div>
    </div>
  );
};

export default UserInfo;