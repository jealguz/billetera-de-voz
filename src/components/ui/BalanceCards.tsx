import React, { useState, useEffect } from 'react';
import { formatCurrency } from '../../utils/formatters';
import { Debt as ApiDebt } from '../../types/api';
import api from '../../services/apiClient';

const BalanceCards: React.FC = () => {
  const [debts, setDebts] = useState<ApiDebt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const loadedDebts = await api.getDebts();
        setDebts(loadedDebts);
      } catch (error) {
        console.error('Error cargando deudas:', error);
        setDebts([]);
      } finally {
        setLoading(false);
      }
    };

    loadData();

    const handleUpdate = () => loadData();

    window.addEventListener('debtsUpdated', handleUpdate);

    return () => {
      window.removeEventListener('debtsUpdated', handleUpdate);
    };
  }, []);

  const totalOwed = debts
    .filter(d => !d.isPaid)
    .reduce((sum, d) => sum + Number(d.amount), 0);

  const totalPaid = debts
    .filter(d => d.isPaid)
    .reduce((sum, d) => sum + Number(d.amount), 0);

  if (loading) {
    return (
      <div className="mb-6">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-gradient-to-br from-blue-600 to-blue-700 text-white p-6 rounded-2xl shadow-lg animate-pulse">
            <div className="h-4 bg-blue-500 rounded w-1/3 mb-2"></div>
            <div className="h-8 bg-blue-500 rounded w-2/3"></div>
          </div>
          <div className="bg-gradient-to-br from-slate-600 to-slate-700 text-white p-6 rounded-2xl shadow-lg animate-pulse">
            <div className="h-4 bg-slate-500 rounded w-1/3 mb-2"></div>
            <div className="h-8 bg-slate-500 rounded w-2/3"></div>
          </div>
        </div>
      </div>
    );
  }

  const owedToMeCount = debts.filter(d => !d.isPaid).length;

  return (
    <div className="mb-6">
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-gradient-to-br from-blue-600 to-blue-700 text-white p-6 rounded-2xl shadow-lg border border-blue-500/20">
          <p className="text-sm opacity-90">Total pendiente</p>
          <p className="text-2xl font-bold mt-1">{formatCurrency(totalOwed)}</p>
          <p className="text-xs opacity-80 mt-2">
            {owedToMeCount} {owedToMeCount === 1 ? 'deuda' : 'deudas'} pendiente{owedToMeCount !== 1 ? 's' : ''}
          </p>
        </div>

        <div className="bg-gradient-to-br from-slate-600 to-slate-700 text-white p-6 rounded-2xl shadow-lg border border-slate-500/20">
          <p className="text-sm opacity-90">Total cobrado</p>
          <p className="text-2xl font-bold mt-1">{formatCurrency(totalPaid)}</p>
          <p className="text-xs opacity-80 mt-2">
            {debts.filter(d => d.isPaid).length} pagada{debts.filter(d => d.isPaid).length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>
    </div>
  );
};

export default BalanceCards;