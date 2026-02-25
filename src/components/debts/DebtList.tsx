import React, { useState, useEffect, useCallback } from 'react';
import { Trash2, X, Check } from 'lucide-react';
import { storageService } from '../../services/apiStorageService';
import api from '../../services/apiClient';
import Card from '../ui/Card';

const DebtList: React.FC = () => {
  const [debts, setDebts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState<{show: boolean, debtId: number | null, debtName: string}>({show: false, debtId: null, debtName: ''});

  const loadDebts = useCallback(async () => {
    setLoading(true);
    try {
      console.log('📦 DebtList - Cargando deudas...');
      const loadedDebts = await storageService.getDebts();
      console.log('📦 DebtList - Deudas cargadas:', loadedDebts);
      setDebts(loadedDebts);
    } catch (error) {
      console.error('Error cargando deudas:', error);
      setDebts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDebts();
  }, [loadDebts]);

  const handleDeleteDebt = (debtId: number, debtName: string) => {
    setDeleteConfirm({show: true, debtId, debtName});
  };

  const confirmDelete = async () => {
    if (!deleteConfirm.debtId) return;
    
    try {
      await api.deleteDebt(deleteConfirm.debtId);
      setDeleteConfirm({show: false, debtId: null, debtName: ''});
      loadDebts();
    } catch (error) {
      console.error('Error eliminando deuda:', error);
    }
  };

  const cancelDelete = () => {
    setDeleteConfirm({show: false, debtId: null, debtName: ''});
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
              ¿Estás seguro de eliminar la deuda de <strong>{deleteConfirm.debtName}</strong>?
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
        <div className="text-center py-8">
          <p className="text-gray-600 mb-4">
            Para gestionar tus deudas, usa la página de Negocio con comandos de voz.
          </p>
          <p className="text-sm text-gray-500">
            Di: "José me debe 1000 pesos" para registrar una deuda
          </p>
        </div>
      </Card>

      {debts.length > 0 ? (
        <div className="mt-4">
          <h3 className="font-bold text-lg mb-2">Deudas Registradas: {debts.length}</h3>
          {debts.map((debt) => (
            <Card key={debt.id} className="mb-2">
              <div className="flex justify-between items-center">
                <div className="flex-1">
                  <p className="font-medium">
                    {debt.clientName || 'Cliente indefinido'} (ID: {debt.clientId})
                  </p>
                  <p className="text-sm text-gray-500">{debt.description || 'Sin descripción'}</p>
                </div>
                <div className="text-right flex items-center gap-3">
                  <div>
                    <p className="font-bold text-lg">${Number(debt.amount).toLocaleString()}</p>
                    <p className={`text-sm ${debt.isPaid ? 'text-green-600' : 'text-red-600'}`}>
                      {debt.isPaid ? 'Pagado' : 'Pendiente'}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteDebt(debt.id, debt.clientName || 'Cliente')}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title="Eliminar deuda"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="mt-4">
          <p className="text-center text-gray-500">No hay deudas registradas</p>
        </Card>
      )}
    </div>
  );
};

export default DebtList;
