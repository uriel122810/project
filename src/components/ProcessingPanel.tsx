import React from 'react';
import { Download, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import type { ProcessedFile } from '../types';

interface ProcessingPanelProps {
  processedFiles: ProcessedFile[];
  onDownload: (file: ProcessedFile) => void;
  onDownloadAll: () => void;
}

export default function ProcessingPanel({ processedFiles, onDownload, onDownloadAll }: ProcessingPanelProps) {
  const completedFiles = processedFiles.filter(file => file.status === 'completed');
  const processingFiles = processedFiles.filter(file => file.status === 'processing');
  const errorFiles = processedFiles.filter(file => file.status === 'error');

  if (processedFiles.length === 0) {
    return null;
  }

  return (
    <div className="mt-8 p-6 bg-white rounded-lg shadow-md">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-800">Resultados del Procesamiento</h3>
        {completedFiles.length > 1 && (
          <button
            onClick={onDownloadAll}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200"
          >
            <Download className="w-4 h-4 mr-2" />
            Descargar Todos
          </button>
        )}
      </div>

      <div className="space-y-3">
        {processedFiles.map((file) => (
          <div key={file.id} className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center space-x-3">
              {file.status === 'processing' && (
                <Loader className="w-5 h-5 text-blue-500 animate-spin" />
              )}
              {file.status === 'completed' && (
                <CheckCircle className="w-5 h-5 text-green-500" />
              )}
              {file.status === 'error' && (
                <AlertCircle className="w-5 h-5 text-red-500" />
              )}
              
              <div>
                <p className="font-medium text-gray-700">{file.processedName}</p>
                <p className="text-sm text-gray-500">
                  {file.status === 'processing' && 'Procesando...'}
                  {file.status === 'completed' && 'Completado'}
                  {file.status === 'error' && 'Error en el procesamiento'}
                </p>
              </div>
            </div>

            {file.status === 'completed' && (
              <button
                onClick={() => onDownload(file)}
                className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200"
              >
                <Download className="w-4 h-4 mr-2" />
                Descargar
              </button>
            )}
          </div>
        ))}
      </div>

      {processingFiles.length > 0 && (
        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-700">
            Procesando {processingFiles.length} archivo(s)... Esto puede tomar unos momentos.
          </p>
        </div>
      )}

      {errorFiles.length > 0 && (
        <div className="mt-4 p-4 bg-red-50 rounded-lg">
          <p className="text-sm text-red-700">
            {errorFiles.length} archivo(s) no se pudieron procesar. Verifica el formato y vuelve a intentar.
          </p>
        </div>
      )}
    </div>
  );
}