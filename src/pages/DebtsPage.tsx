import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import DebtList from '../components/debts/DebtList';

const DebtsPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Mis Deudas</h1>
        <button
          onClick={() => navigate('/add-debt')}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          + Agregar Deuda
        </button>
      </div>
      
      <DebtList />
    </div>
  );
};

export default DebtsPage;