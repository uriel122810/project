import React from 'react';
import { BookOpen, FileText, Image, Settings, Download } from 'lucide-react';

export default function HelpPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">Centro de Ayuda</h1>
        <p className="text-gray-600">
          Guía completa para utilizar el Procesador de Imágenes
        </p>
      </div>

      <div className="space-y-8">
        {/* Getting Started */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center space-x-2 mb-4">
            <BookOpen className="w-6 h-6 text-red-600" />
            <h2 className="text-2xl font-semibold text-gray-800">Primeros Pasos</h2>
          </div>
          <div className="prose max-w-none">
            <p className="text-gray-600 mb-4">
              Bienvenido al Procesador de Imágenes. Esta aplicación te permite convertir y procesar archivos TIFF y PDF de manera sencilla y eficiente.
            </p>
            <ol className="list-decimal list-inside space-y-2 text-gray-600">
              <li>Selecciona el tipo de procesamiento que deseas realizar desde el menú lateral</li>
              <li>Configura las opciones de procesamiento según tus necesidades</li>
              <li>Arrastra y suelta tus archivos o utiliza el botón de selección</li>
              <li>Inicia el procesamiento y espera a que se complete</li>
              <li>Descarga los archivos procesados individualmente o en lote</li>
            </ol>
          </div>
        </div>

        {/* TIFF Processing */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Image className="w-6 h-6 text-red-600" />
            <h2 className="text-2xl font-semibold text-gray-800">Procesamiento de Archivos TIFF</h2>
          </div>
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">¿Qué hace esta función?</h3>
              <p className="text-gray-600">
                Convierte archivos TIFF a escala de grises manteniendo la alta resolución y preservando metadatos importantes.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Formatos admitidos</h3>
              <ul className="list-disc list-inside text-gray-600">
                <li>Archivos .tiff</li>
                <li>Archivos .tif</li>
                <li>Imágenes TIFF sin comprimir y comprimidas</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Opciones disponibles</h3>
              <ul className="list-disc list-inside text-gray-600">
                <li>Resolución: 150, 300 o 600 DPI</li>
                <li>Calidad: Alta, Media o Baja</li>
                <li>Conversión a escala de grises</li>
              </ul>
            </div>
          </div>
        </div>

        {/* PDF Conversion */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center space-x-2 mb-4">
            <FileText className="w-6 h-6 text-red-600" />
            <h2 className="text-2xl font-semibold text-gray-800">Conversión de PDF a TIFF</h2>
          </div>
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">¿Qué hace esta función?</h3>
              <p className="text-gray-600">
                Transforma documentos PDF en imágenes TIFF de alta calidad, página por página o combinando múltiples archivos.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Características especiales</h3>
              <ul className="list-disc list-inside text-gray-600">
                <li>Conversión de múltiples páginas PDF</li>
                <li>Opción para combinar varios PDF en un solo archivo TIFF</li>
                <li>Resolución personalizable hasta 1200 DPI</li>
                <li>Preservación de la calidad original del texto e imágenes</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Settings */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Settings className="w-6 h-6 text-red-600" />
            <h2 className="text-2xl font-semibold text-gray-800">Configuración y Opciones</h2>
          </div>
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Resolución (DPI)</h3>
              <p className="text-gray-600 mb-2">
                Determina la calidad y el tamaño del archivo resultante:
              </p>
              <ul className="list-disc list-inside text-gray-600">
                <li><strong>150 DPI:</strong> Calidad básica, archivos más pequeños</li>
                <li><strong>300 DPI:</strong> Calidad estándar, recomendado para la mayoría de usos</li>
                <li><strong>600 DPI:</strong> Alta calidad, archivos más grandes</li>
                <li><strong>1200 DPI:</strong> Máxima calidad (solo PDF), archivos muy grandes</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Niveles de Calidad</h3>
              <ul className="list-disc list-inside text-gray-600">
                <li><strong>Alta:</strong> Mejor calidad, procesamiento más lento</li>
                <li><strong>Media:</strong> Balance entre calidad y velocidad</li>
                <li><strong>Baja:</strong> Procesamiento rápido, calidad reducida</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Downloads */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Download className="w-6 h-6 text-red-600" />
            <h2 className="text-2xl font-semibold text-gray-800">Descarga de Archivos</h2>
          </div>
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Opciones de descarga</h3>
              <ul className="list-disc list-inside text-gray-600">
                <li>Descarga individual de cada archivo procesado</li>
                <li>Descarga masiva de todos los archivos completados</li>
                <li>Nombres de archivo descriptivos que incluyen el tipo de procesamiento</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Estados de procesamiento</h3>
              <ul className="list-disc list-inside text-gray-600">
                <li><strong>Procesando:</strong> El archivo está siendo convertido</li>
                <li><strong>Completado:</strong> El archivo está listo para descargar</li>
                <li><strong>Error:</strong> Hubo un problema con el procesamiento</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Contact */}
        <div className="bg-red-50 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">¿Necesitas más ayuda?</h2>
          <p className="text-gray-600 mb-4">
            Si tienes problemas técnicos o necesitas asistencia adicional, no dudes en contactarnos.
          </p>
          <p className="text-sm text-gray-500">
            Desarrollado por Uriel Carmona para el Municipio La PAZ
          </p>
        </div>
      </div>
    </div>
  );
}