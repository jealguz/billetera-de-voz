import React, { useState, useEffect, useCallback } from 'react';
import { Trash2, Users } from 'lucide-react';
import api from '../../services/apiClient';
import Card from '../ui/Card';

const ClientList: React.FC = () => {
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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

  const handleDeleteClient = async (clientId: number, clientName: string) => {
    if (!confirm(`¿Estás seguro de eliminar a ${clientName}? Esto también eliminará todas sus deudas.`)) return;
    
    try {
      await api.deleteClient(clientId);
      loadClients();
    } catch (error) {
      console.error('Error eliminando cliente:', error);
    }
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
