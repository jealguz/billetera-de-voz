import React, { useState } from 'react';
import { X, User, DollarSign, FileText } from 'lucide-react';
import { debtService } from '../../services/debtService';
import Button from '../ui/Button';
import Input from '../ui/Input';
import toast from 'react-hot-toast';

interface AddDebtModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDebtAdded: () => void;
}

const AddDebtModal: React.FC<AddDebtModalProps> = ({ 
  isOpen, 
  onClose, 
  onDebtAdded 
}) => {
  const [formData, setFormData] = useState({
    person: '',
    amount: '',
    type: 'owed' as 'owed' | 'owing',
    description: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.person.trim() || !formData.amount) {
      toast.error('Completa los campos obligatorios');
      return;
    }

    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Ingresa un monto válido');
      return;
    }

    setIsSubmitting(true);

    try {
      debtService.addDebt(
        formData.person,
        amount,
        formData.type,
        formData.description
      );

      toast.success(
        formData.type === 'owed'
          ? `Deuda agregada: ${formData.person} te debe $${amount}`
          : `Deuda agregada: Debes $${amount} a ${formData.person}`
      );

      // Reset form
      setFormData({
        person: '',
        amount: '',
        type: 'owed',
        description: ''
      });

      onDebtAdded();
      onClose();
    } catch (error) {
      toast.error('Error al agregar la deuda');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20">
        {/* Overlay */}
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={onClose}
        />
        
        {/* Modal */}
        <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md">
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h3 className="text-xl font-bold text-gray-900">Agregar Deuda</h3>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="p-6 space-y-4">
              <Input
                label="Persona"
                placeholder="Nombre de la persona"
                value={formData.person}
                onChange={(e) => handleChange('person', e.target.value)}
                icon={User}
                required
              />

              <Input
                label="Monto"
                placeholder="0.00"
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => handleChange('amount', e.target.value)}
                icon={DollarSign}
                required
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de deuda
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => handleChange('type', 'owed')}
                    className={`p-4 border rounded-lg text-center transition-all ${
                      formData.type === 'owed'
                        ? 'border-green-500 bg-green-50 text-green-700'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <div className="font-medium">Te deben</div>
                    <div className="text-sm text-gray-600 mt-1">Alguien te debe dinero</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleChange('type', 'owing')}
                    className={`p-4 border rounded-lg text-center transition-all ${
                      formData.type === 'owing'
                        ? 'border-rose-500 bg-rose-50 text-rose-700'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <div className="font-medium">Tú debes</div>
                    <div className="text-sm text-gray-600 mt-1">Tú debes dinero</div>
                  </button>
                </div>
              </div>

              <Input
                label="Descripción (opcional)"
                placeholder="Motivo de la deuda..."
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                icon={FileText}
              />
            </div>

            <div className="p-6 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={onClose}
                  disabled={isSubmitting}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  loading={isSubmitting}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Agregando...' : 'Agregar Deuda'}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddDebtModal;