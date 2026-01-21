import React from 'react';

const CommandExamples: React.FC = () => {

  const examples = [
    {
      command: "¿Cuánto me debe José Castro?",
      description: "Consulta deudas específicas"
    },
    {
      command: "José Castro me debe 2000 pesos",
      description: "Registrar deuda y crear cliente"
    },
    {
      command: "Qué personas me deben",
      description: "Ver quienes te deben dinero"
    },
    {
      command: "A qué personas les debo",
      description: "Ver a quienes debes dinero"
    },
    {
      command: "María me pagó 1000 pesos",
      description: "Registrar pago"
    }
  ];

  return (
    <div className="card-professional">
      <div className="card-header">
        <h3 className="font-bold text-gray-800">💡 Comandos de Ejemplo</h3>
        <p className="text-gray-600 text-sm mt-1">esto puedes decir </p>
      </div>
      <div className="card-body">
        <div className="space-y-4">
        {examples.map((example, index) => (
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
    </div>
  );
};

export default CommandExamples;