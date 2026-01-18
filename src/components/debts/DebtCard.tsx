import React from 'react';
import { User, DollarSign, Calendar, Trash2, CheckCircle, MoreVertical } from 'lucide-react';
import { Debt } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import Button from '../ui/Button';
import Card from '../ui/Card';

interface DebtCardProps {
  debt: Debt;
  onDelete: (id: string) => void;
  onMarkAsPaid: (id: string) => void;
  onViewDetails?: (id: string) => void;
}

const DebtCard: React.FC<DebtCardProps> = ({
  debt,
  onDelete,
  onMarkAsPaid,
  onViewDetails,
}) => {
  const isOwed = debt.type === 'owed';
  const isPaid = debt.status === 'paid';
  const remaining = debt.amount - (debt.paidAmount || 0);

  return (
    <Card className={`border-l-4 ${isOwed ? 'border-l-green-500' : 'border-l-rose-500'}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <div className={`p-2 rounded-full ${isOwed ? 'bg-green-100' : 'bg-rose-100'}`}>
              <User size={18} className={isOwed ? 'text-green-600' : 'text-rose-600'} />
            </div>
            <div>
              <h4 className="font-bold text-gray-900">{debt.person}</h4>
              {debt.description && (
                <p className="text-sm text-gray-600">{debt.description}</p>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <div className="flex items-center gap-1">
              <DollarSign size={14} />
              <span className="font-medium">
                {formatCurrency(debt.amount)}
              </span>
            </div>
            
            <div className="flex items-center gap-1">
              <Calendar size={14} />
              <span>
                {new Date(debt.date).toLocaleDateString('es-ES', {
                  day: 'numeric',
                  month: 'short'
                })}
              </span>
            </div>
            
            {debt.paidAmount! > 0 && (
              <div className={`px-2 py-1 rounded text-xs font-medium ${
                debt.status === 'paid' ? 'bg-green-100 text-green-800' :
                debt.status === 'partial' ? 'bg-yellow-100 text-yellow-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {debt.status === 'paid' ? 'Pagado' : 
                 debt.status === 'partial' ? `Pagado ${formatCurrency(debt.paidAmount!)}` : 
                 'Pendiente'}
              </div>
            )}
          </div>
        </div>
        
        <div className="flex flex-col items-end gap-2">
          <div className="text-right">
            <p className={`text-lg font-bold ${isOwed ? 'text-green-600' : 'text-rose-600'}`}>
              {formatCurrency(remaining)}
            </p>
            <p className="text-xs text-gray-500">
              {isOwed ? 'Te debe' : 'Debes'}
            </p>
          </div>
        </div>
      </div>
      
      <div className="flex gap-2 mt-4">
        {!isPaid && remaining > 0 && (
          <Button
            size="sm"
            variant="ghost"
            className="flex-1"
            onClick={() => onMarkAsPaid(debt.id)}
          >
            <CheckCircle size={16} />
            Marcar como pagado
          </Button>
        )}
        
        <Button
          size="sm"
          variant="ghost"
          className="flex-1"
          onClick={() => onDelete(debt.id)}
        >
          <Trash2 size={16} />
          Eliminar
        </Button>
        
        {onViewDetails && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onViewDetails(debt.id)}
          >
            <MoreVertical size={16} />
          </Button>
        )}
      </div>
    </Card>
  );
};

export default DebtCard;