import React from 'react';
import { User, DollarSign, Check, X } from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';

interface ConfirmationDialogProps {
  data: {
    action: 'create_client' | 'add_debt' | 'add_payment';
    person: string;
    amount?: number;
    description?: string;
  };
  onConfirm: (confirm: boolean) => void;
  onClose?: () => void;
}

const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  data,
  onConfirm,
  onClose,
}) => {
  const getTitle = () => {
    switch (data.action) {
      case 'add_debt':
        return 'Crear cliente y registrar deuda';
      case 'create_client':
        return 'Crear nuevo cliente';
      case 'add_payment':
        return 'Registrar pago';
      default:
        return 'Confirmar acción';
    }
  };

  const getMessage = () => {
    switch (data.action) {
      case 'add_debt':
        return `El cliente "${data.person}" no existe. ¿Deseas crearlo y registrar una deuda de ${data.amount} pesos${data.description ? ` por "${data.description}"` : ''}?`;
      case 'create_client':
        return `¿Crear cliente "${data.person}"?`;
      case 'add_payment':
        return `¿Registrar pago de ${data.amount} pesos de ${data.person}?`;
      default:
        return '¿Confirmar esta acción?';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="max-w-md w-full">
        <div className="space-y-4">
          {/* Encabezado */}
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <User size={24} className="text-blue-600" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-gray-900">{getTitle()}</h3>
              <p className="text-sm text-gray-600">Confirma la acción antes de continuar</p>
            </div>
          </div>

          {/* Detalles */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <User size={16} className="text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Cliente</p>
                  <p className="font-medium">{data.person}</p>
                </div>
              </div>
              
              {data.amount !== undefined && (
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <DollarSign size={16} className="text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Monto</p>
                    <p className="font-medium">${data.amount.toLocaleString()} pesos</p>
                  </div>
                </div>
              )}
              
              {data.description && (
                <div>
                  <p className="text-sm text-gray-600">Descripción</p>
                  <p className="font-medium">{data.description}</p>
                </div>
              )}
            </div>
          </div>

          {/* Mensaje */}
          <p className="text-gray-700">{getMessage()}</p>

          {/* Botones */}
          <div className="flex gap-3">
            <Button
              variant="secondary"
              className="flex-1"
              icon={X}
              onClick={() => {
                onConfirm(false);
                onClose?.();
              }}
            >
              Cancelar
            </Button>
            
            <Button
              variant="primary"
              className="flex-1"
              icon={Check}
              onClick={() => {
                onConfirm(true);
                onClose?.();
              }}
            >
              Confirmar
            </Button>
          </div>

          {/* Consejo */}
          <div className="pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              💡 También puedes responder por voz diciendo "Sí" o "No"
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ConfirmationDialog;