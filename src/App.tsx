import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import HomePage from './components/HomePage';
import TiffProcessorComponent from './components/TiffProcessor';
import PdfConverter from './components/PdfConverter';
import HelpPage from './components/HelpPage';
import { isElectron } from './utils/electronProcessor';

function App() {
  const [currentPage, setCurrentPage] = useState('inicio');

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'inicio':
        return <HomePage onNavigate={setCurrentPage} />;
      case 'procesar-tiff':
        return <TiffProcessorComponent />;
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
            <div className="text-right">
              <h2 className="text-lg font-semibold text-gray-700">
                Procesador de Imagenes Municipio La PAZ
              </h2>
              {isElectron() && (
                <p className="text-sm text-green-600 font-medium">
                  Aplicación de Escritorio - Procesamiento Nativo
                </p>
              )}
            </div>
          </div>
          
          {renderCurrentPage()}
        </div>
      </main>
    </div>
  );
}

export default App;