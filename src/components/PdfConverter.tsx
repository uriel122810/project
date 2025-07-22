import React, { useState } from 'react';
import { Settings, Play } from 'lucide-react';
import FileUpload from './FileUpload';
import ProcessingPanel from './ProcessingPanel';
import { isElectron, processPdfsToTiff, saveFile } from '../utils/electronProcessor';
import { loadPDFAsImages, combinePDFs, loadPDFBytesAsImages } from '../utils/pdfProcessor';
import { convertToGrayscale, createRealTiffFile, downloadBlob } from '../utils/imageProcessor';
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
    
    // Crear archivo de procesamiento
    const newProcessedFile: ProcessedFile = {
      id: crypto.randomUUID(),
      originalName: combineFiles && selectedFiles.length > 1 
        ? `${selectedFiles.length}_archivos_combinados.pdf`
        : selectedFiles[0].name,
      processedName: combineFiles && selectedFiles.length > 1
        ? `combined_${selectedFiles.length}_files_multipage.tiff`
        : selectedFiles[0].name.replace('.pdf', '.tiff'),
      type: 'pdf',
      status: 'processing',
      size: selectedFiles.reduce((sum, file) => sum + file.size, 0)
    };

    setProcessedFiles([newProcessedFile]);

    try {
      if (isElectron()) {
        // Usar procesamiento nativo de Electron
        console.log('Usando procesamiento nativo de Electron');
        const result = await processPdfsToTiff(selectedFiles, {
          dpi: options.dpi,
          grayscale: options.grayscale,
          combineFiles: combineFiles && selectedFiles.length > 1
        });

        // Crear URL para descarga
        const blob = new Blob([result.data], { type: 'image/tiff' });
        const downloadUrl = URL.createObjectURL(blob);

        setProcessedFiles(prev => 
          prev.map(file => 
            file.id === newProcessedFile.id
              ? {
                  ...file,
                  status: 'completed',
                  downloadUrl: downloadUrl,
                  processedName: result.filename
                }
              : file
          )
        );
      } else {
        // Usar procesamiento web (fallback)
        console.log('Usando procesamiento web');
        if (combineFiles && selectedFiles.length > 1) {
          const combinedPdfBytes = await combinePDFs(selectedFiles);
          const allCanvases = await loadPDFBytesAsImages(combinedPdfBytes, options.dpi);
          
          if (options.grayscale) {
            allCanvases.forEach(canvas => convertToGrayscale(canvas));
          }
          
          const combinedBlob = await createRealTiffFile(allCanvases, options.dpi);
          const downloadUrl = URL.createObjectURL(combinedBlob);
          
          setProcessedFiles(prev => 
            prev.map(file => 
              file.id === newProcessedFile.id
                ? {
                    ...file,
                    status: 'completed',
                    downloadUrl: downloadUrl
                  }
                : file
            )
          );
        } else {
          // Procesar solo el primer archivo
          const file = selectedFiles[0];
          const canvases = await loadPDFAsImages(file, options.dpi);
          
          if (options.grayscale) {
            canvases.forEach(canvas => convertToGrayscale(canvas));
          }
          
          const finalBlob = await createRealTiffFile(canvases, options.dpi);
          const downloadUrl = URL.createObjectURL(finalBlob);
          
          setProcessedFiles(prev => 
            prev.map(processedFile => 
              processedFile.id === newProcessedFile.id
                ? {
                    ...processedFile,
                    status: 'completed',
                    downloadUrl: downloadUrl
                  }
                : processedFile
            )
          );
        }
      }
    } catch (error) {
      console.error('Error in PDF processing:', error);
      setProcessedFiles(prev => 
        prev.map(file => 
          file.id === newProcessedFile.id
            ? { ...file, status: 'error' }
            : file
        )
      );
    }

    setIsProcessing(false);
    setSelectedFiles([]);
  };

  const handleDownload = (file: ProcessedFile) => {
    if (isElectron() && file.downloadUrl) {
      // En Electron, usar el diálogo de guardado nativo
      fetch(file.downloadUrl)
        .then(response => response.arrayBuffer())
        .then(buffer => saveFile(new Uint8Array(buffer), file.processedName))
        .catch(error => console.error('Error downloading file:', error));
    } else if (file.downloadUrl) {
      // En web, usar descarga normal
      fetch(file.downloadUrl)
        .then(response => response.blob())
        .then(blob => downloadBlob(blob, file.processedName))
        .catch(error => console.error('Error downloading file:', error));
    }
  };

  const handleDownloadAll = () => {
    processedFiles
      .filter(file => file.status === 'completed' && file.downloadUrl)
      .forEach(file => {
        setTimeout(() => handleDownload(file), 100); // Small delay between downloads
      });
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
              Combinar múltiples PDF en un solo TIFF multipágina
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
          fileType="pdf"
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