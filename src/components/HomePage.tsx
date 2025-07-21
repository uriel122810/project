import React from 'react';
import { Image, FileText, ArrowRight } from 'lucide-react';

interface HomePageProps {
  onNavigate: (page: string) => void;
}

export default function HomePage({ onNavigate }: HomePageProps) {
  return (
    <div className="max-w-6xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">
          Bienvenido al Procesador de Imagenes
        </h1>
        <p className="text-xl text-gray-600">
          Procesa tus archivos TIFF y convierte documentos PDF con facilidad
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 mb-12">
        {/* Process TIFF Card */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
          <div className="bg-gradient-to-r from-red-600 to-red-700 p-6 text-white">
            <div className="flex items-center space-x-3 mb-4">
              <div className="bg-white bg-opacity-20 p-3 rounded-lg">
                <Image className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold">Procesar archivos TIFF</h2>
            </div>
            <p className="text-red-100">
              Convierte imágenes TIFF a color en escala de grises con 300 DPI
            </p>
          </div>
          
          <div className="p-6">
            <h3 className="font-semibold text-gray-700 mb-4">Esta herramienta te permite:</h3>
            <ul className="space-y-2 text-gray-600 mb-6">
              <li className="flex items-start">
                <span className="w-2 h-2 bg-red-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                Convertir imágenes TIFF a escala de grises
              </li>
              <li className="flex items-start">
                <span className="w-2 h-2 bg-red-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                Mantener una resolución de 300 DPI
              </li>
              <li className="flex items-start">
                <span className="w-2 h-2 bg-red-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                Procesar múltiples archivos a la vez
              </li>
              <li className="flex items-start">
                <span className="w-2 h-2 bg-red-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                Preservar metadatos importantes
              </li>
            </ul>
            
            <button
              onClick={() => onNavigate('procesar-tiff')}
              className="w-full bg-red-600 text-white py-3 px-6 rounded-lg hover:bg-red-700 transition-colors duration-200 flex items-center justify-center space-x-2"
            >
              <span>Ir a Procesar TIFF</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Convert PDF Card */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
          <div className="bg-gradient-to-r from-red-600 to-red-700 p-6 text-white">
            <div className="flex items-center space-x-3 mb-4">
              <div className="bg-white bg-opacity-20 p-3 rounded-lg">
                <FileText className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold">Convertir PDF a TIFF</h2>
            </div>
            <p className="text-red-100">
              Transforma documentos PDF en imágenes TIFF de alta calidad
            </p>
          </div>
          
          <div className="p-6">
            <h3 className="font-semibold text-gray-700 mb-4">Esta herramienta te permite:</h3>
            <ul className="space-y-2 text-gray-600 mb-6">
              <li className="flex items-start">
                <span className="w-2 h-2 bg-red-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                Convertir PDF a formato TIFF
              </li>
              <li className="flex items-start">
                <span className="w-2 h-2 bg-red-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                Mantener alta calidad de imagen
              </li>
              <li className="flex items-start">
                <span className="w-2 h-2 bg-red-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                Combinar múltiples PDF en un archivo TIFF
              </li>
              <li className="flex items-start">
                <span className="w-2 h-2 bg-red-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                Establecer DPI personalizado
              </li>
            </ul>
            
            <button
              onClick={() => onNavigate('convertir-pdf')}
              className="w-full bg-red-600 text-white py-3 px-6 rounded-lg hover:bg-red-700 transition-colors duration-200 flex items-center justify-center space-x-2"
            >
              <span>Ir a Convertir PDF</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Help Section */}
      <div className="bg-gray-50 rounded-lg p-8 text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">¿Necesitas ayuda?</h2>
        <p className="text-gray-600 mb-6">
          Visita nuestra sección de ayuda para obtener más información sobre como utilizar esta aplicación de manera efectiva
        </p>
        <button
          onClick={() => onNavigate('ayuda')}
          className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200"
        >
          Ver ayuda
        </button>
      </div>
    </div>
  );
}