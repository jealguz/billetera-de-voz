import React, { useState, useEffect, useCallback } from 'react';
import { formatCurrency } from '../../utils/formatters';
import { Debt, Client } from '../../types';
import { storageService } from '../../services/storageService';

interface ClientBalance {
  name: string;
  balance: number; // positivo: te debe, negativo: le debes
}

const BalanceCards: React.FC = () => {
  const [debts, setDebts] = useState<Debt[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'owing' | 'owed'>('owed');

  useEffect(() => {
    const loadData = () => {
      setDebts(storageService.getDebts());
    };

    loadData();

    const handleUpdate = () => loadData();
    const handleOpenModal = () => setShowModal(true);

    window.addEventListener('debtsUpdated', handleUpdate);
    window.addEventListener('clientsUpdated', handleUpdate);
    window.addEventListener('openSummaryModal', handleOpenModal);

    return () => {
      window.removeEventListener('debtsUpdated', handleUpdate);
      window.removeEventListener('clientsUpdated', handleUpdate);
      window.removeEventListener('openSummaryModal', handleOpenModal);
    };
  }, []);

  const calculateTotals = useCallback(() => {
    const totalOwed = debts
      .filter(d => d.type === 'owed' && d.status !== 'paid')
      .reduce((sum, d) => sum + (d.amount - (d.paidAmount || 0)), 0);

    const totalOwing = debts
      .filter(d => d.type === 'owing' && d.status !== 'paid')
      .reduce((sum, d) => sum + (d.amount - (d.paidAmount || 0)), 0);

    return { totalOwed, totalOwing };
  }, [debts]);

  const calculateClientBalances = useCallback((): ClientBalance[] => {
    const balances = new Map<string, number>();

    // Agregar deudas owed (te deben)
    debts
      .filter(d => d.type === 'owed' && d.status !== 'paid')
      .forEach(d => {
        const remaining = d.amount - (d.paidAmount || 0);
        balances.set(d.person, (balances.get(d.person) || 0) + remaining);
      });

    // Restar deudas owing (debes)
    debts
      .filter(d => d.type === 'owing' && d.status !== 'paid')
      .forEach(d => {
        const remaining = d.amount - (d.paidAmount || 0);
        balances.set(d.person, (balances.get(d.person) || 0) - remaining);
      });

    return Array.from(balances.entries())
      .map(([name, balance]) => ({ name, balance }))
      .filter(cb => cb.balance !== 0) // Solo mostrar si hay balance
      .sort((a, b) => Math.abs(b.balance) - Math.abs(a.balance)); // Ordenar por monto absoluto
  }, [debts]);

  const { totalOwed, totalOwing } = calculateTotals();
  const clientBalances = calculateClientBalances();

  const owedToMeCount = debts.filter(d => d.type === 'owed' && d.status !== 'paid').length;
  const owedToOthersCount = debts.filter(d => d.type === 'owing' && d.status !== 'paid').length;

  const getOwedDebts = () => debts.filter(d => d.type === 'owed' && d.status !== 'paid');
  const getOwingDebts = () => debts.filter(d => d.type === 'owing' && d.status !== 'paid');

  return (
    <div className="mb-6">
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-gradient-to-br from-blue-600 to-blue-700 text-white p-6 rounded-2xl shadow-lg border border-blue-500/20">
          <p className="text-sm opacity-90">Le deben</p>
          <p className="text-2xl font-bold mt-1">{formatCurrency(totalOwed)}</p>
          <p className="text-xs opacity-80 mt-2">
            {owedToMeCount} {owedToMeCount === 1 ? 'persona' : 'personas'}
          </p>
        </div>

        <div className="bg-gradient-to-br from-slate-600 to-slate-700 text-white p-6 rounded-2xl shadow-lg border border-slate-500/20">
          <p className="text-sm opacity-90">Tú debes</p>
          <p className="text-2xl font-bold mt-1">{formatCurrency(totalOwing)}</p>
          <p className="text-xs opacity-80 mt-2">
            {owedToOthersCount} {owedToOthersCount === 1 ? 'persona' : 'personas'}
          </p>
        </div>
      </div>

      {clientBalances.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h3 className="text-lg font-semibold mb-3 text-gray-800">Balances por persona</h3>
          <div className="space-y-2">
            {clientBalances.map((cb, index) => (
              <div key={index} className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-lg">
                <span className="font-medium text-gray-700">{cb.name}</span>
                <span className={`font-bold ${cb.balance > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {cb.balance > 0 ? '+' : ''}{formatCurrency(Math.abs(cb.balance))}
                  <span className="text-xs ml-1 opacity-75">
                    ({cb.balance > 0 ? 'te debe' : 'le debes'})
                  </span>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal de resumen */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="modal-professional p-8 max-w-lg w-full mx-4 max-h-[80vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4 text-gray-800">Resumen de Deudas</h3>

            {/* Tabs */}
            <div className="flex mb-4">
              <button
                onClick={() => setActiveTab('owed')}
                className={`flex-1 py-2 px-4 rounded-l-lg font-medium transition-all duration-200 ${
                  activeTab === 'owed'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Me Deben ({owedToMeCount})
              </button>
              <button
                onClick={() => setActiveTab('owing')}
                className={`flex-1 py-2 px-4 rounded-r-lg font-medium transition-all duration-200 ${
                  activeTab === 'owing'
                    ? 'bg-blue-700 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Yo Debo ({owedToOthersCount})
              </button>
            </div>

            {/* Contenido */}
            <div className="space-y-3">
              {activeTab === 'owed' ? (
                getOwedDebts().length > 0 ? (
                  getOwedDebts().map((debt, index) => (
                    <div key={index} className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500 shadow-sm">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-gray-800">{debt.person}</p>
                          <p className="text-sm text-gray-600">{debt.description || 'Sin descripción'}</p>
                        </div>
                        <p className="font-bold text-emerald-600">{formatCurrency(debt.amount - (debt.paidAmount || 0))}</p>
                      </div>
                      {debt.paidAmount && debt.paidAmount > 0 && (
                        <p className="text-xs text-gray-500 mt-1">
                          Pagado: {formatCurrency(debt.paidAmount)}
                        </p>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-center text-gray-500 py-4">No tienes deudas pendientes a tu favor.</p>
                )
              ) : (
                getOwingDebts().length > 0 ? (
                  getOwingDebts().map((debt, index) => (
                    <div key={index} className="bg-slate-50 p-4 rounded-lg border-l-4 border-slate-500 shadow-sm">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-gray-800">{debt.person}</p>
                          <p className="text-sm text-gray-600">{debt.description || 'Sin descripción'}</p>
                        </div>
                        <p className="font-bold text-rose-600">{formatCurrency(debt.amount - (debt.paidAmount || 0))}</p>
                      </div>
                      {debt.paidAmount && debt.paidAmount > 0 && (
                        <p className="text-xs text-gray-500 mt-1">
                          Pagado: {formatCurrency(debt.paidAmount)}
                        </p>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-center text-gray-500 py-4">No tienes deudas pendientes.</p>
                )
              )}
            </div>

            <button
              onClick={() => setShowModal(false)}
              className="w-full mt-4 bg-gray-600 text-white py-2 rounded-lg hover:bg-gray-700"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BalanceCards;