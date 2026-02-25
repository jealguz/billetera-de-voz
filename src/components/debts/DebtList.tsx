import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/apiClient';
import { Debt as ApiDebt } from '../../types/api';
import Card from '../ui/Card';

const DebtList: React.FC = () => {
  const [debts, setDebts] = useState<ApiDebt[]>([]);
  const [loading, setLoading] = useState(true);

  const loadDebts = useCallback(async () => {
    setLoading(true);
    try {
      const loadedDebts = await api.getDebts();
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
        <div className="text-center py-8">
          <p className="text-gray-600 mb-4">
            Para gestionar tus deudas, usa la página de Negocio con comandos de voz.
          </p>
          <p className="text-sm text-gray-500">
            Di: "José me debe 1000 pesos" para registrar una deuda
          </p>
        </div>
      </Card>

      {debts.length > 0 && (
        <div className="mt-4">
          <h3 className="font-bold text-lg mb-2">Deudas Registradas: {debts.length}</h3>
          {debts.map((debt) => (
            <Card key={debt.id} className="mb-2">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium">{debt.clientName || 'Cliente #' + debt.clientId}</p>
                  <p className="text-sm text-gray-500">{debt.description || 'Sin descripción'}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg">${Number(debt.amount).toLocaleString()}</p>
                  <p className={`text-sm ${debt.isPaid ? 'text-green-600' : 'text-red-600'}`}>
                    {debt.isPaid ? 'Pagado' : 'Pendiente'}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default DebtList;
