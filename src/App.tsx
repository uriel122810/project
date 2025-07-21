import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import HomePage from './components/HomePage';
import TiffProcessor from './components/TiffProcessor';
import PdfConverter from './components/PdfConverter';
import HelpPage from './components/HelpPage';

function App() {
  const [currentPage, setCurrentPage] = useState('inicio');

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'inicio':
        return <HomePage onNavigate={setCurrentPage} />;
      case 'procesar-tiff':
        return <TiffProcessor />;
      case 'convertir-pdf':
        return <PdfConverter />;
      case 'ayuda':
        return <HelpPage />;
      case 'configuracion':
        return (
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-800 mb-4">Configuración</h1>
            <div className="bg-white rounded-lg shadow-md p-6">
              <p className="text-gray-600">Las opciones de configuración estarán disponibles en próximas versiones.</p>
            </div>
          </div>
        );
      default:
        return <HomePage onNavigate={setCurrentPage} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar currentPage={currentPage} onPageChange={setCurrentPage} />
      
      <main className="flex-1">
        <div className="p-8">
          <div className="flex justify-between items-center mb-8">
            <div></div>
            <h2 className="text-lg font-semibold text-gray-700">
              Procesador de Imagenes Municipio La PAZ
            </h2>
          </div>
          
          {renderCurrentPage()}
        </div>
      </main>
    </div>
  );
}

export default App;