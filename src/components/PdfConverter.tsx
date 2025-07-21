import React, { useState } from 'react';
import { Settings, Play } from 'lucide-react';
import FileUpload from './FileUpload';
import ProcessingPanel from './ProcessingPanel';
import { loadPDFAsImages, combineCanvasesToTiff } from '../utils/pdfProcessor';
import { convertToGrayscale } from '../utils/imageProcessor';
import type { ProcessedFile, ProcessingOptions } from '../types';

export default function PdfConverter() {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [processedFiles, setProcessedFiles] = useState<ProcessedFile[]>([]);
  const [options, setOptions] = useState<ProcessingOptions>({
    dpi: 300,
    grayscale: false,
    quality: 'high'
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [combineFiles, setCombineFiles] = useState(false);

  const handleFilesSelected = (files: File[]) => {
    setSelectedFiles(prev => [...prev, ...files]);
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const processFiles = async () => {
    if (selectedFiles.length === 0) return;

    setIsProcessing(true);
    
    let newProcessedFiles: ProcessedFile[];
    
    if (combineFiles && selectedFiles.length > 1) {
      // Combine all PDFs into one TIFF
      newProcessedFiles = [{
        id: crypto.randomUUID(),
        originalName: `${selectedFiles.length}_archivos_combinados.pdf`,
        processedName: `combined_${selectedFiles.length}_files.tiff`,
        type: 'pdf',
        status: 'processing',
        size: selectedFiles.reduce((sum, file) => sum + file.size, 0)
      }];
    } else {
      // Convert each PDF separately
      newProcessedFiles = selectedFiles.map(file => ({
        id: crypto.randomUUID(),
        originalName: file.name,
        processedName: file.name.replace('.pdf', '.tiff'),
        type: 'pdf',
        status: 'processing',
        size: file.size
      }));
    }

    setProcessedFiles(newProcessedFiles);

    try {
      if (combineFiles && selectedFiles.length > 1) {
        // Process combined files
        const allCanvases: HTMLCanvasElement[] = [];
        
        for (const file of selectedFiles) {
          const canvases = await loadPDFAsImages(file);
          allCanvases.push(...canvases);
        }
        
        // Apply grayscale if enabled
        if (options.grayscale) {
          allCanvases.forEach(canvas => convertToGrayscale(canvas));
        }
        
        // Combine all canvases into one TIFF
        const combinedBlob = await combineCanvasesToTiff(allCanvases, options.dpi);
        const downloadUrl = URL.createObjectURL(combinedBlob);
        
        setProcessedFiles(prev => 
          prev.map(file => 
            file.id === newProcessedFiles[0].id
              ? {
                  ...file,
                  status: 'completed',
                  downloadUrl: downloadUrl
                }
              : file
          )
        );
      } else {
        // Process each PDF separately
        for (let i = 0; i < selectedFiles.length; i++) {
          try {
            const file = selectedFiles[i];
            const canvases = await loadPDFAsImages(file);
            
            // Apply grayscale if enabled
            if (options.grayscale) {
              canvases.forEach(canvas => convertToGrayscale(canvas));
            }
            
            // Convert to TIFF
            const tiffBlob = await combineCanvasesToTiff(canvases, options.dpi);
            const downloadUrl = URL.createObjectURL(tiffBlob);
            
            setProcessedFiles(prev => 
              prev.map(processedFile => 
                processedFile.id === newProcessedFiles[i].id
                  ? {
                      ...processedFile,
                      status: 'completed',
                      downloadUrl: downloadUrl
                    }
                  : processedFile
              )
            );
          } catch (error) {
            console.error('Error processing PDF:', error);
            setProcessedFiles(prev => 
              prev.map(processedFile => 
                processedFile.id === newProcessedFiles[i].id
                  ? {
                      ...processedFile,
                      status: 'error'
                    }
                  : processedFile
              )
            );
          }
        }
      }
    } catch (error) {
      console.error('Error in PDF processing:', error);
      setProcessedFiles(prev => 
        prev.map(file => ({ ...file, status: 'error' }))
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
        <h1 className="text-3xl font-bold text-gray-800 mb-4">Convertir PDF a TIFF</h1>
        <p className="text-gray-600">
          Transforma documentos PDF en imágenes TIFF de alta calidad
        </p>
      </div>

      {/* Processing Options */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex items-center space-x-2 mb-4">
          <Settings className="w-5 h-5 text-gray-600" />
          <h2 className="text-xl font-semibold text-gray-800">Opciones de Conversión</h2>
        </div>
        
        <div className="grid md:grid-cols-2 gap-6 mb-6">
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
              <option value={1200}>1200 DPI</option>
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
        </div>

        <div className="grid md:grid-cols-2 gap-6">
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

          <label className="flex items-center">
            <input
              type="checkbox"
              checked={combineFiles}
              onChange={(e) => setCombineFiles(e.target.checked)}
              className="w-4 h-4 text-red-600 bg-gray-100 border-gray-300 rounded focus:ring-red-500"
            />
            <span className="ml-2 text-sm font-medium text-gray-700">
              Combinar múltiples PDF en un solo TIFF
            </span>
          </label>
        </div>
      </div>

      {/* File Upload */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Seleccionar Archivos PDF</h2>
        <FileUpload
          acceptedTypes={['.pdf', 'application/pdf']}
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
              {isProcessing ? 'Convirtiendo...' : `Convertir ${selectedFiles.length} archivo(s)`}
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