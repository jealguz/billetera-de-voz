import React from 'react';

const CommandExamples: React.FC = () => {

  const examples = [
    {
      category: "📝 Registrar deudas y pagos",
      commands: [
        {
          command: "José Castro me debe 2000 pesos",
          description: "Registrar deuda y crear cliente"
        },
        {
          command: "Yo le debo a José Castro 5000 pesos",
          description: "Registrar que le debes a alguien"
        },
        {
          command: "María me pagó 1000 pesos por materiales",
          description: "Registrar pago recibido"
        },
        {
          command: "Le abono a Carlos 3000 pesos",
          description: "Registrar pago realizado"
        }
      ]
    },
    {
      category: "📊 Consultar información",
      commands: [
        {
          command: "¿Cuánto me debe José Castro?",
          description: "Consulta deudas específicas"
        },
        {
          command: "¿Qué personas me deben?",
          description: "Ver quienes te deben dinero"
        },
        {
          command: "¿A qué personas les debo?",
          description: "Ver a quienes debes dinero"
        },
        {
          command: "Resumen de mis deudas",
          description: "Ver balance total"
        },
        {
          command: "Resumen de mi negocio",
          description: "Ver estadísticas de clientes"
        }
      ]
    },
    {
      category: "📅 Historial y seguimiento",
      commands: [
        {
          command: "¿Cuándo me pagó José Castro?",
          description: "Último pago con fecha"
        },
        {
          command: "Historial de pagos de María",
          description: "Ver todos los pagos de un cliente"
        },
        {
          command: "¿Cuál fue el último pago de Carlos?",
          description: "Detalles del último pago"
        },
        {
          command: "¿Quién me quedó debiendo hace tiempo?",
          description: "Ver deudas vencidas"
        },
        {
          command: "Deudas vencidas",
          description: "Clientes con pagos atrasados"
        }
      ]
    },
    {
      category: "👥 Gestión de clientes",
      commands: [
        {
          command: "Cliente nuevo: Ana García",
          description: "Agregar nuevo cliente"
        },
        {
          command: "Registrar cliente Pedro Gómez",
          description: "Crear ficha de cliente"
        }
      ]
    },
    {
      category: "🔍 Ejemplos avanzados",
      commands: [
        {
          command: "Juan Pérez me debe 500 mil pesos por construcción",
          description: "Deuda con monto en miles y descripción"
        },
        {
          command: "Le debo a Marta 2 millones por el carro",
          description: "Deuda grande con motivo"
        },
        {
          command: "Camilo Arango me pagó un millón de pesos",
          description: "Pago de gran cantidad"
        },
        {
          command: "¿Desde cuándo no paga José?",
          description: "Tiempo desde último pago"
        }
      ]
    }
  ];

  return (
    <div className="card-professional">
      <div className="card-header">
        <h3 className="font-bold text-gray-800">💡 Comandos de Voz Disponibles</h3>
        <p className="text-gray-600 text-sm mt-1">Di cualquiera de estos ejemplos:</p>
      </div>
      <div className="card-body">
        <div className="space-y-6">
          {examples.map((category, categoryIndex) => (
            <div key={categoryIndex} className="space-y-3">
              <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200 pb-2">
                {category.category}
              </h4>
              <div className="space-y-3">
                {category.commands.map((example, index) => (
                  <div
                    key={index}
                    className="w-full flex items-start gap-4 p-4 rounded-xl bg-gradient-to-r from-gray-50 to-blue-50/50 border border-gray-200 hover:shadow-md transition-all duration-200"
                  >
                    <div className="flex-shrink-0 bg-blue-600 text-white text-xs font-medium px-3 py-1 rounded-full shadow-sm">
                      Ejemplo:
                    </div>
                    <div className="text-left">
                      <p className="text-gray-900 font-medium">{example.command}</p>
                      <p className="text-gray-500 text-xs mt-1">{example.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 text-green-600">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-green-800">💡 Tip:</p>
              <p className="text-sm text-green-700 mt-1">
                Puedes decir los montos como "500 mil pesos", "2 millones", "un millón" o números directos como "5000".
                La app entenderá fechas, descripciones y nombres completos.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommandExamples;