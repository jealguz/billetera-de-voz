import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User, DollarSign, MessageSquare, Calendar } from 'lucide-react';
import { storageService } from '../services/databaseService';
import Card from '../components/ui/Card';

const AddDebtPage: React.FC = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    type: 'owed' as 'owed' | 'owing',
    person: '',
    amount: '',
    description: '',
    dueDate: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    // Limpiar error cuando el usuario empieza a escribir
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const handleTypeChange = (type: 'owed' | 'owing') => {
    setFormData(prev => ({
      ...prev,
      type,
    }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.person.trim()) {
      newErrors.person = 'Nombre es requerido';
    } else if (formData.person.trim().length < 2) {
      newErrors.person = 'Mínimo 2 caracteres';
    }
    
    const amount = parseFloat(formData.amount);
    if (!formData.amount || isNaN(amount)) {
      newErrors.amount = 'Monto es requerido';
    } else if (amount <= 0) {
      newErrors.amount = 'Monto debe ser mayor a 0';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const amount = parseFloat(formData.amount);
      
      storageService.addDebt({
        type: formData.type,
        person: formData.person.trim(),
        amount: amount,
        description: formData.description.trim(),
        date: new Date(),
        dueDate: formData.dueDate ? new Date(formData.dueDate) : undefined,
        status: 'pending',
        paidAmount: 0,
      });
      
      alert('✅ Deuda agregada exitosamente');
      navigate('/');
    } catch (error) {
      console.error('Error al agregar deuda:', error);
      alert('❌ Error al agregar deuda');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (window.confirm('¿Estás seguro de cancelar? Los cambios no guardados se perderán.')) {
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="flex items-center gap-4 mb-6">
        <button
          type="button"
          onClick={handleCancel}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Nueva Deuda</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Tipo de deuda */}
        <Card>
          <h3 className="font-medium text-gray-700 mb-3">Tipo de deuda *</h3>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => handleTypeChange('owed')}
              className={`flex-1 p-3 rounded-lg border transition-colors ${
                formData.type === 'owed' 
                  ? 'border-green-500 bg-green-50 text-green-700' 
                  : 'border-gray-200 hover:border-gray-300 text-gray-600'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <div className={`p-2 rounded-full ${
                  formData.type === 'owed' ? 'bg-green-100' : 'bg-gray-100'
                }`}>
                  <User size={18} className={
                    formData.type === 'owed' ? 'text-green-600' : 'text-gray-500'
                  } />
                </div>
                <span className="font-medium">Te deben</span>
              </div>
            </button>
            
            <button
              type="button"
              onClick={() => handleTypeChange('owing')}
              className={`flex-1 p-3 rounded-lg border transition-colors ${
                formData.type === 'owing' 
                  ? 'border-rose-500 bg-rose-50 text-rose-700' 
                  : 'border-gray-200 hover:border-gray-300 text-gray-600'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <div className={`p-2 rounded-full ${
                  formData.type === 'owing' ? 'bg-rose-100' : 'bg-gray-100'
                }`}>
                  <User size={18} className={
                    formData.type === 'owing' ? 'text-rose-600' : 'text-gray-500'
                  } />
                </div>
                <span className="font-medium">Tú debes</span>
              </div>
            </button>
          </div>
        </Card>

        {/* Persona */}
        <Card>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Persona *
          </label>
          <div className="relative">
            <User className="absolute left-3 top-3 text-gray-400" size={20} />
            <input
              type="text"
              name="person"
              value={formData.person}
              onChange={handleChange}
              placeholder="Ej: José Castro"
              className={`w-full p-3 pl-10 border rounded-lg focus:outline-none focus:ring-2 ${
                errors.person 
                  ? 'border-red-500 focus:ring-red-500' 
                  : 'border-gray-300 focus:ring-blue-500'
              } disabled:bg-gray-100`}
              disabled={isSubmitting}
            />
          </div>
          {errors.person && (
            <p className="mt-1 text-sm text-red-600">{errors.person}</p>
          )}
        </Card>

        {/* Monto */}
        <Card>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Monto *
          </label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-3 text-gray-400" size={20} />
            <input
              type="number"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              placeholder="0.00"
              step="0.01"
              min="0"
              className={`w-full p-3 pl-10 border rounded-lg focus:outline-none focus:ring-2 ${
                errors.amount 
                  ? 'border-red-500 focus:ring-red-500' 
                  : 'border-gray-300 focus:ring-blue-500'
              } disabled:bg-gray-100`}
              disabled={isSubmitting}
            />
          </div>
          {errors.amount && (
            <p className="mt-1 text-sm text-red-600">{errors.amount}</p>
          )}
        </Card>

        {/* Descripción */}
        <Card>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Descripción (opcional)
          </label>
          <div className="relative">
            <MessageSquare className="absolute left-3 top-3 text-gray-400" size={20} />
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Ej: Préstamo para almuerzo"
              rows={3}
              className="w-full p-3 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
              disabled={isSubmitting}
            />
          </div>
        </Card>

        {/* Fecha de vencimiento */}
        <Card>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Fecha de vencimiento (opcional)
          </label>
          <div className="relative">
            <Calendar className="absolute left-3 top-3 text-gray-400" size={20} />
            <input
              type="date"
              name="dueDate"
              value={formData.dueDate}
              onChange={handleChange}
              className="w-full p-3 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
              disabled={isSubmitting}
            />
          </div>
        </Card>

        {/* Botones */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleCancel}
            disabled={isSubmitting}
            className="flex-1 py-3 bg-gray-200 text-gray-800 rounded-lg font-medium hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancelar
          </button>
          
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Guardando...' : 'Guardar Deuda'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddDebtPage;