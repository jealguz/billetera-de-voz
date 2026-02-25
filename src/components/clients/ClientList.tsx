import React, { useState, useEffect, useCallback } from 'react';
import { Trash2, Users, X, Check } from 'lucide-react';
import api from '../../services/apiClient';
import Card from '../ui/Card';

const ClientList: React.FC = () => {
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState<{show: boolean, clientId: number | null, clientName: string}>({show: false, clientId: null, clientName: ''});

  const loadClients = useCallback(async () => {
    setLoading(true);
    try {
      const loadedClients = await api.getClients();
      setClients(loadedClients);
    } catch (error) {
      console.error('Error cargando clientes:', error);
      setClients([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadClients();
  }, [loadClients]);

  const handleDeleteClient = (clientId: number, clientName: string) => {
    setDeleteConfirm({show: true, clientId, clientName});
  };

  const confirmDelete = async () => {
    if (!deleteConfirm.clientId) return;
    
    try {
      await api.deleteClient(deleteConfirm.clientId);
      setDeleteConfirm({show: false, clientId: null, clientName: ''});
      loadClients();
    } catch (error) {
      console.error('Error eliminando cliente:', error);
    }
  };

  const cancelDelete = () => {
    setDeleteConfirm({show: false, clientId: null, clientName: ''});
  };

  if (loading) {
    return (
      <div className="p-4">
        <Card>
          <p className="text-center">Cargando...</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4">
      {/* Modal de confirmación */}
      {deleteConfirm.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full">
            <h3 className="font-bold text-lg mb-2">Confirmar eliminación</h3>
            <p className="text-gray-600 mb-4">
              ¿Estás seguro de eliminar a <strong>{deleteConfirm.clientName}</strong>? 
              Esto también eliminará todas sus deudas.
            </p>
            <div className="flex gap-3">
              <button
                onClick={cancelDelete}
                className="flex-1 py-2 px-4 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
              >
                <X size={18} /> Cancelar
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 py-2 px-4 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
              >
                <Check size={18} /> Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      <Card>
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-5 h-5" />
          <h2 className="font-bold text-lg">Clientes Registrados</h2>
        </div>
        
        {clients.length > 0 ? (
          <div className="space-y-2">
            {clients.map((client) => (
              <div key={client.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">{client.name}</p>
                  <p className="text-sm text-gray-500">
                    {client.phone || 'Sin teléfono'} • {client.email || 'Sin email'}
                  </p>
                </div>
                <button
                  onClick={() => handleDeleteClient(client.id, client.name)}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  title="Eliminar cliente"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-500 py-4">No hay clientes registrados</p>
        )}
      </Card>
    </div>
  );
};

export default ClientList;
