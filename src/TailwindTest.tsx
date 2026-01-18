import React from 'react';

const TailwindTest: React.FC = () => {
  return (
    <div>
      {/* Test 1: Clases SIMPLES de Tailwind */}
      <div style={{ padding: '20px', backgroundColor: '#f0f0f0' }}>
        <h1>Prueba Tailwind - PASO A PASO</h1>
        
        {/* Elemento con ESTILOS EN LÍNEA (siempre funciona) */}
        <div style={{
          backgroundColor: 'red',
          color: 'white',
          padding: '20px',
          margin: '10px 0',
          borderRadius: '8px'
        }}>
          <strong>1. Esto es CSS en línea (deberías ver rojo)</strong>
          <p>Si ves esto rojo, React funciona</p>
        </div>
        
        {/* Elemento con CLASES TAILWIND */}
        <div className="bg-blue-500 text-white p-4 rounded-lg my-4">
          <strong>2. Esto usa Tailwind: bg-blue-500</strong>
          <p>Si esto es AZUL, Tailwind funciona</p>
          <p>Clases aplicadas: "bg-blue-500 text-white p-4 rounded-lg my-4"</p>
        </div>
        
        {/* Elemento con múltiples clases */}
        <div className="mt-6 p-6 bg-gradient-to-r from-green-400 to-blue-500 text-white rounded-xl shadow-lg">
          <strong>3. Gradiente con Tailwind</strong>
          <p>Si ves gradiente verde-azul, Tailwind funciona al 100%</p>
        </div>
        
        {/* Botón con hover */}
        <button className="mt-6 px-6 py-3 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors">
          4. Botón con hover effect
        </button>
      </div>
    </div>
  );
};

export default TailwindTest;