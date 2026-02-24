import React from 'react';
import { Mail, User, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface UserInfoProps {
  onLogout: () => void;
}

const UserInfo: React.FC<UserInfoProps> = ({ onLogout }) => {
  const { state } = useAuth();
  const currentUser = state.user;
  
  if (!currentUser) {
    return null;
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
              {currentUser.email.split('@')[0]}
            </div>
            <div className="flex items-center gap-1 text-sm text-gray-500">
              <Mail className="w-4 h-4" />
              {currentUser.email}
            </div>
            {currentUser.role === 'admin' && (
              <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">Admin</span>
            )}
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
    </div>
  );
};

export default UserInfo;
