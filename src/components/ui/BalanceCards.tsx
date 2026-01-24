import React, { useState, useEffect, useCallback } from 'react';
import { formatCurrency } from '../../utils/formatters';
import { Debt } from '../../types';
import { storageService } from '../../services/databaseService';

interface ClientBalance {
  name: string;
  balance: number; // positivo: te debe, negativo: le debes
}

const BalanceCards: React.FC = () => {
  const [debts, setDebts] = useState<Debt[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'owing' | 'owed'>('owed');
  const [showBalancesModal, setShowBalancesModal] = useState(false); // Modal para balances por persona
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const loadedDebts = await storageService.getDebts();
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
    console.log('🔍 DEBUG: Calculando balances - Total deudas:', debts.length);
    
    // Mostrar todas las deudas para debug
    debts.forEach((debt, i) => {
      console.log(`${i+1}. ${debt.person} - Tipo: ${debt.type}, Estado: ${debt.status}, Monto: ${debt.amount}, Pagado: ${debt.paidAmount || 0}, Restante: ${debt.amount - (debt.paidAmount || 0)}`);
    });

    const balances = new Map<string, number>();

    // Agregar deudas owed (te deben) - SOLO DEUDAS PENDIENTES
    debts
      .filter(d => d.type === 'owed' && d.status !== 'paid')
      .forEach(d => {
        const remaining = Math.max(0, d.amount - (d.paidAmount || 0));
        console.log(`  ➕ ${d.person}: Agregando deuda que TE DEBE: +${remaining}`);
        balances.set(d.person, (balances.get(d.person) || 0) + remaining);
      });

    // Restar deudas owing (debes) - SOLO DEUDAS PENDIENTES
    debts
      .filter(d => d.type === 'owing' && d.status !== 'paid')
      .forEach(d => {
        const remaining = Math.max(0, d.amount - (d.paidAmount || 0));
        console.log(`  ➖ ${d.person}: Restando deuda que LE DEBES: -${remaining}`);
        balances.set(d.person, (balances.get(d.person) || 0) - remaining);
      });

    const result = Array.from(balances.entries())
      .map(([name, balance]) => ({ name, balance }))
      .filter(cb => cb.balance !== 0) // Solo mostrar si hay balance
      .sort((a, b) => Math.abs(b.balance) - Math.abs(a.balance)); // Ordenar por monto absoluto

    console.log('📊 DEBUG: Resultados balances:');
    result.forEach(person => {
      console.log(`  ${person.name}: Balance neto = ${person.balance > 0 ? '+' : ''}${person.balance}`);
    });

    return result;
  }, [debts]);

  const { totalOwed, totalOwing } = calculateTotals();
  const clientBalances = calculateClientBalances();

  // Calcular totales para el modal - CORREGIDO
  const totalAFavor = clientBalances
    .filter(cb => cb.balance > 0)
    .reduce((sum, cb) => sum + cb.balance, 0);
    
  const totalADeber = Math.abs(clientBalances
    .filter(cb => cb.balance < 0)
    .reduce((sum, cb) => sum + cb.balance, 0));

  const owedToMeCount = debts.filter(d => d.type === 'owed' && d.status !== 'paid').length;
  const owedToOthersCount = debts.filter(d => d.type === 'owing' && d.status !== 'paid').length;

  const getOwedDebts = () => debts.filter(d => d.type === 'owed' && d.status !== 'paid');
  const getOwingDebts = () => debts.filter(d => d.type === 'owing' && d.status !== 'paid');

  if (loading) {
    return (
      <div className="mb-6">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-gradient-to-br from-blue-600 to-blue-700 text-white p-6 rounded-2xl shadow-lg border border-blue-500/20 animate-pulse">
            <div className="h-4 bg-blue-500 rounded w-1/3 mb-2"></div>
            <div className="h-8 bg-blue-500 rounded w-2/3 mb-2"></div>
            <div className="h-3 bg-blue-500 rounded w-1/2"></div>
          </div>
          <div className="bg-gradient-to-br from-slate-600 to-slate-700 text-white p-6 rounded-2xl shadow-lg border border-slate-500/20 animate-pulse">
            <div className="h-4 bg-slate-500 rounded w-1/3 mb-2"></div>
            <div className="h-8 bg-slate-500 rounded w-2/3 mb-2"></div>
            <div className="h-3 bg-slate-500 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6">
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-gradient-to-br from-blue-600 to-blue-700 text-white p-6 rounded-2xl shadow-lg border border-blue-500/20">
          <p className="text-sm opacity-90">Te deben</p>
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

      {/* Botón para abrir modal de balances */}
      {clientBalances.length > 0 && (
        <div className="mb-4">
          <button
            onClick={() => setShowBalancesModal(true)}
            className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-medium py-3 px-4 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center group"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 group-hover:scale-110 transition-transform" viewBox="0 0 20 20" fill="currentColor">
              <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
              <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" />
            </svg>
            Ver balances por persona ({clientBalances.length})
          </button>
        </div>
      )}

      {/* Modal de balances por persona */}
      {showBalancesModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          {/* Overlay */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
            onClick={() => setShowBalancesModal(false)}
          ></div>
          
          {/* Modal content - Cambiado para mejor centrado */}
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <div className="relative transform overflow-hidden rounded-2xl bg-white text-left shadow-xl transition-all w-full max-w-md">
              
              {/* Header */}
              <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-white">Balances por persona</h3>
                    <p className="text-indigo-100 text-sm">
                      {clientBalances.length} persona{clientBalances.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowBalancesModal(false)}
                    className="text-white hover:text-indigo-200 p-1 rounded-full hover:bg-white/20 transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Contenido desplazable - Altura ajustada */}
              <div className="px-6 py-4 max-h-[calc(80vh-120px)] overflow-y-auto">
                <div className="space-y-3">
                  {clientBalances.map((cb, index) => (
                    <div 
                      key={index} 
                      className={`flex justify-between items-center p-4 rounded-xl border ${
                        cb.balance > 0 
                          ? 'bg-emerald-50 border-emerald-200' 
                          : 'bg-rose-50 border-rose-200'
                      }`}
                    >
                      <div className="flex-1">
                        <span className="font-semibold text-gray-800 block">{cb.name}</span>
                        <span className={`text-sm font-medium ${cb.balance > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {cb.balance > 0 ? 'Te debe' : 'Le debes'}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className={`text-xl font-bold ${cb.balance > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {cb.balance > 0 ? '+' : ''}{formatCurrency(Math.abs(cb.balance))}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Resumen al final - CORREGIDO */}
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <p className="text-sm text-blue-600 font-medium">Total a favor</p>
                      <p className="text-lg font-bold text-blue-700">
                        {formatCurrency(totalAFavor)}
                      </p>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-lg">
                      <p className="text-sm text-slate-600 font-medium">Total a deber</p>
                      <p className="text-lg font-bold text-slate-700">
                        {formatCurrency(totalADeber)}
                      </p>
                    </div>
                  </div>
                  
                  {/* Saldo neto general */}
                  <div className="mt-3 bg-gradient-to-r from-indigo-50 to-purple-50 p-3 rounded-lg border border-indigo-100">
                    <p className="text-sm text-indigo-600 font-medium">Saldo neto general</p>
                    <p className={`text-xl font-bold ${totalAFavor - totalADeber > 0 ? 'text-emerald-600' : totalAFavor - totalADeber < 0 ? 'text-rose-600' : 'text-indigo-700'}`}>
                      {totalAFavor - totalADeber > 0 ? '+' : ''}{formatCurrency(Math.abs(totalAFavor - totalADeber))}
                    </p>
                    <p className="text-xs text-indigo-500 mt-1">
                      (Te deben {formatCurrency(totalOwed)} - Tú debes {formatCurrency(totalOwing)})
                    </p>
                  </div>
                </div>
              </div>

              {/* Botón de cerrar */}
              <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
                <button
                  onClick={() => setShowBalancesModal(false)}
                  className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-medium py-3 px-4 rounded-xl shadow-md hover:shadow-lg transition-all duration-200"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de resumen original */}
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