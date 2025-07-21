import React, { useState } from 'react';
import { Settings, Play } from 'lucide-react';
import FileUpload from './FileUpload';
import ProcessingPanel from './ProcessingPanel';
import type { ProcessedFile, ProcessingOptions } from '../types';

export default function TiffProcessor() {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [processedFiles, setProcessedFiles] = useState<ProcessedFile[]>([]);
  const [options, setOptions] = useState<ProcessingOptions>({
    dpi: 300,
    grayscale: true,
    quality: 'high'
  });
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFilesSelected = (files: File[]) => {
    setSelectedFiles(prev => [...prev, ...files]);
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const processFiles = async () => {
    if (selectedFiles.length === 0) return;

    setIsProcessing(true);
    const newProcessedFiles: ProcessedFile[] = selectedFiles.map(file => ({
      id: crypto.randomUUID(),
      originalName: file.name,
      processedName: `processed_${file.name}`,
      type: 'tiff',
      status: 'processing',
      size: file.size
    }));

    setProcessedFiles(newProcessedFiles);

    // Simulate processing
    for (let i = 0; i < newProcessedFiles.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000));
      
      setProcessedFiles(prev => 
        prev.map(file => 
          file.id === newProcessedFiles[i].id
            ? {
                ...file,
                status: Math.random() > 0.1 ? 'completed' : 'error',
                downloadUrl: Math.random() > 0.1 ? URL.createObjectURL(selectedFiles[i]) : undefined
              }
            : file
        )
      );
    }

    setIsProcessing(false);
    setSelectedFiles([]);
  };

  const handleDownload = (file: ProcessedFile) => {
    if (file.downloadUrl) {
      const link = document.createElement('a');
      link.href = file.downloadUrl;
      link.download = file.processedName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleDownloadAll = () => {
    processedFiles
      .filter(file => file.status === 'completed' && file.downloadUrl)
      .forEach(file => handleDownload(file));
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">Procesar archivos TIFF</h1>
        <p className="text-gray-600">
          Convierte imágenes TIFF a escala de grises con alta resolución
        </p>
      </div>

      {/* Processing Options */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex items-center space-x-2 mb-4">
          <Settings className="w-5 h-5 text-gray-600" />
          <h2 className="text-xl font-semibold text-gray-800">Opciones de Procesamiento</h2>
        </div>
        
        <div className="grid md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Resolución (DPI)
            </label>
            <select
              value={options.dpi}
              onChange={(e) => setOptions(prev => ({ ...prev, dpi: Number(e.target.value) }))}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
            >
              <option value={150}>150 DPI</option>
              <option value={300}>300 DPI</option>
              <option value={600}>600 DPI</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Calidad
            </label>
            <select
              value={options.quality}
              onChange={(e) => setOptions(prev => ({ ...prev, quality: e.target.value as any }))}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
            >
              <option value="high">Alta</option>
              <option value="medium">Media</option>
              <option value="low">Baja</option>
            </select>
          </div>

          <div className="flex items-center">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={options.grayscale}
                onChange={(e) => setOptions(prev => ({ ...prev, grayscale: e.target.checked }))}
                className="w-4 h-4 text-red-600 bg-gray-100 border-gray-300 rounded focus:ring-red-500"
              />
              <span className="ml-2 text-sm font-medium text-gray-700">
                Convertir a escala de grises
              </span>
            </label>
          </div>
        </div>
      </div>

      {/* File Upload */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Seleccionar Archivos TIFF</h2>
        <FileUpload
          acceptedTypes={['.tiff', '.tif', 'image/tiff']}
          onFilesSelected={handleFilesSelected}
          selectedFiles={selectedFiles}
          onRemoveFile={handleRemoveFile}
        />
        
        {selectedFiles.length > 0 && (
          <div className="mt-6 flex justify-center">
            <button
              onClick={processFiles}
              disabled={isProcessing}
              className="flex items-center px-8 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              <Play className="w-5 h-5 mr-2" />
              {isProcessing ? 'Procesando...' : `Procesar ${selectedFiles.length} archivo(s)`}
            </button>
          </div>
        )}
      </div>

      {/* Processing Results */}
      <ProcessingPanel
        processedFiles={processedFiles}
        onDownload={handleDownload}
        onDownloadAll={handleDownloadAll}
      />
    </div>
  );
}