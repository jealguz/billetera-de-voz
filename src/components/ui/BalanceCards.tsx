import React, { useState, useEffect } from 'react';
import { formatCurrency } from '../../utils/formatters';
import { storageService } from '../../services/apiStorageService';

const BalanceCards: React.FC = () => {
  const [debts, setDebts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const loadedDebts = await storageService.getDebts();
        console.log('📦 BalanceCards - Deudas cargadas:', loadedDebts);
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

  // Deudas que ME deben (monto positivo) - usar pendingAmount
  const debtsOwedToMe = debts.filter(d => d.status !== 'paid' && Number(d.amount) > 0);
  const totalOwedToMe = debtsOwedToMe.reduce((sum, d) => sum + (Number(d.pendingAmount) || 0), 0);

  // Deudas que YO debo (monto negativo) - usar pendingAmount
  const debtsIOwe = debts.filter(d => d.status !== 'paid' && Number(d.amount) < 0);
  const totalIOwe = debtsIOwe.reduce((sum, d) => sum + (Number(d.pendingAmount) || 0), 0);

  // Total cobrado (deudas pagadas)
  const totalPaid = debts
    .filter(d => d.status === 'paid')
    .reduce((sum, d) => sum + (Number(d.paidAmount) || 0), 0);

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

  return (
    <div className="mb-6">
      <div className="grid grid-cols-2 gap-4 mb-4">
        {/* Me deben */}
        <div className="bg-gradient-to-br from-blue-600 to-blue-700 text-white p-6 rounded-2xl shadow-lg border border-blue-500/20">
          <p className="text-sm opacity-90">Me deben</p>
          <p className="text-2xl font-bold mt-1">{formatCurrency(totalOwedToMe)}</p>
          <p className="text-xs opacity-80 mt-2">
            {debtsOwedToMe.length} cliente{debtsOwedToMe.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Yo debo */}
        <div className="bg-gradient-to-br from-red-600 to-red-700 text-white p-6 rounded-2xl shadow-lg border border-red-500/20">
          <p className="text-sm opacity-90">Yo debo</p>
          <p className="text-2xl font-bold mt-1">{formatCurrency(totalIOwe)}</p>
          <p className="text-xs opacity-80 mt-2">
            {debtsIOwe.length} deuda{debtsIOwe.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Total cobrado */}
      <div className="grid grid-cols-1 gap-4">
        <div className="bg-gradient-to-br from-slate-600 to-slate-700 text-white p-4 rounded-2xl shadow-lg border border-slate-500/20">
          <p className="text-sm opacity-90">Total cobrado</p>
          <p className="text-xl font-bold mt-1">{formatCurrency(totalPaid)}</p>
          <p className="text-xs opacity-80 mt-1">
            {debts.filter(d => d.isPaid).length} pagada{debts.filter(d => d.isPaid).length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>
    </div>
  );
};

export default BalanceCards;
