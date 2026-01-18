import React, { useState, useEffect, useCallback } from 'react';
import { Search, Filter, UserPlus } from 'lucide-react';
import { Debt } from '../../types';
import { storageService } from '../../services/storageService';
import { formatCurrency } from '../../utils/formatters';
import DebtCard from './DebtCard';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Card from '../ui/Card';

const DebtList: React.FC = () => {
  const [debts, setDebts] = useState<Debt[]>([]);
  const [filteredDebts, setFilteredDebts] = useState<Debt[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'owed' | 'owing'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'paid'>('all');

  // Cargar deudas al montar el componente
  useEffect(() => {
    loadDebts();
  }, []);

  // Función para cargar deudas
  const loadDebts = useCallback(() => {
    const loadedDebts = storageService.getDebts();
    setDebts(loadedDebts);
  }, []);

  // Función para filtrar deudas
  const filterDebts = useCallback(() => {
    let filtered = [...debts];

    // Filtrar por tipo
    if (filterType !== 'all') {
      filtered = filtered.filter(debt => debt.type === filterType);
    }

    // Filtrar por estado
    if (filterStatus !== 'all') {
      filtered = filtered.filter(debt => debt.status === filterStatus);
    }

    // Filtrar por búsqueda
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(debt => 
        debt.person.toLowerCase().includes(term) ||
        debt.description?.toLowerCase().includes(term)
      );
    }

    setFilteredDebts(filtered);
  }, [debts, searchTerm, filterType, filterStatus]);

  // Aplicar filtros cuando cambien las dependencias
  useEffect(() => {
    filterDebts();
  }, [filterDebts]);

  // Calcular totales
  const calculateTotals = useCallback(() => {
    const totalOwed = debts
      .filter(d => d.type === 'owed' && d.status !== 'paid')
      .reduce((sum, d) => sum + (d.amount - (d.paidAmount || 0)), 0);
    
    const totalOwing = debts
      .filter(d => d.type === 'owing' && d.status !== 'paid')
      .reduce((sum, d) => sum + (d.amount - (d.paidAmount || 0)), 0);

    return { totalOwed, totalOwing };
  }, [debts]);

  const { totalOwed, totalOwing } = calculateTotals();

  // Manejar eliminación de deuda
  const handleDeleteDebt = useCallback((id: string) => {
    if (window.confirm('¿Estás seguro de eliminar esta deuda?')) {
      storageService.deleteDebt(id);
      loadDebts();
    }
  }, [loadDebts]);

  // Manejar marca como pagado
  const handleMarkAsPaid = useCallback((id: string) => {
    const debt = debts.find(d => d.id === id);
    if (debt) {
      storageService.updateDebt(id, { 
        status: 'paid',
        paidAmount: debt.amount 
      });
      loadDebts();
    }
  }, [debts, loadDebts]);

  // Manejar agregar nueva deuda
  const handleAddDebt = () => {
    // Aquí puedes redirigir a la página de agregar deuda
    // o abrir un modal
    console.log('Agregar nueva deuda');
    // Ejemplo: window.location.href = '/add-debt';
    // O usar tu sistema de navegación
  };

  return (
    <div className="space-y-4">
      {/* Totales */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-gradient-to-r from-green-500 to-emerald-600 text-white">
          <p className="text-sm opacity-90">T deben</p>
          <p className="text-2xl font-bold mt-1">{formatCurrency(totalOwed)}</p>
          <p className="text-xs opacity-80 mt-2">
            {debts.filter(d => d.type === 'owed' && d.status !== 'paid').length} personas
          </p>
        </Card>
        
        <Card className="bg-gradient-to-r from-rose-500 to-pink-600 text-white">
          <p className="text-sm opacity-90">Tú debes</p>
          <p className="text-2xl font-bold mt-1">{formatCurrency(totalOwing)}</p>
          <p className="text-xs opacity-80 mt-2">
            {debts.filter(d => d.type === 'owing' && d.status !== 'paid').length} personas
          </p>
        </Card>
      </div>

      {/* Filtros y búsqueda */}
      <Card>
        <div className="space-y-4">
          <Input
            placeholder="Buscar por nombre o descripción..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            icon={Search}
          />
          
          <div className="flex flex-wrap gap-2">
            <select 
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as 'all' | 'owed' | 'owing')}
            >
              <option value="all">Todos los tipos</option>
              <option value="owed">Te deben</option>
              <option value="owing">Tú debes</option>
            </select>
            
            <select 
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as 'all' | 'pending' | 'paid')}
            >
              <option value="all">Todos los estados</option>
              <option value="pending">Pendientes</option>
              <option value="paid">Pagados</option>
            </select>
            
            <Button
              variant="ghost"
              size="sm"
              icon={Filter}
              onClick={() => {
                setSearchTerm('');
                setFilterType('all');
                setFilterStatus('all');
              }}
            >
              Limpiar filtros
            </Button>
          </div>
        </div>
      </Card>

      {/* Lista de deudas */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-gray-900">
            Deudas ({filteredDebts.length})
          </h3>
          <Button 
            size="sm" 
            icon={UserPlus}
            onClick={handleAddDebt}
          >
            Agregar
          </Button>
        </div>

        {filteredDebts.length === 0 ? (
          <Card className="text-center py-8">
            <div className="text-gray-400 mb-2">📝</div>
            <p className="text-gray-500">
              {searchTerm || filterType !== 'all' || filterStatus !== 'all'
                ? 'No hay deudas con estos filtros'
                : 'No hay deudas registradas'}
            </p>
            <Button 
              variant="ghost" 
              size="sm" 
              className="mt-4"
              onClick={handleAddDebt}
            >
              Agregar primera deuda
            </Button>
          </Card>
        ) : (
          filteredDebts.map((debt) => (
            <DebtCard
              key={debt.id}
              debt={debt}
              onDelete={handleDeleteDebt}
              onMarkAsPaid={handleMarkAsPaid}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default DebtList;