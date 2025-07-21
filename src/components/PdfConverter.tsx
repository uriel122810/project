import React, { useState } from 'react';
import { Settings, Play } from 'lucide-react';
import FileUpload from './FileUpload';
import ProcessingPanel from './ProcessingPanel';
import { loadPDFAsImages, createMultiPageTiff } from '../utils/pdfProcessor';
import { convertToGrayscale, canvasToBlob, downloadBlob } from '../utils/imageProcessor';
import { TiffProcessor as TiffUtils } from '../utils/tiffProcessor';
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
        console.log(`Combinando ${selectedFiles.length} archivos PDF`);
        const allCanvases: HTMLCanvasElement[] = [];
        
        for (const file of selectedFiles) {
          console.log(`Procesando PDF: ${file.name}`);
          const canvases = await loadPDFAsImages(file, options.dpi);
          allCanvases.push(...canvases);
        }
        
        console.log(`Total de páginas: ${allCanvases.length}`);
        
        // Apply grayscale if enabled
        if (options.grayscale) {
          allCanvases.forEach(canvas => convertToGrayscale(canvas));
          console.log('Conversión a escala de grises aplicada');
        }
        
        // Combine all canvases into one image
        const combinedBlob = await createMultiPageTiff(allCanvases, options.dpi);
        const downloadUrl = URL.createObjectURL(combinedBlob);
        console.log('Archivos combinados exitosamente');
        
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
            console.log(`Procesando PDF individual: ${file.name}`);
            const canvases = await loadPDFAsImages(file, options.dpi);
            
            // Apply grayscale if enabled
            if (options.grayscale) {
              canvases.forEach(canvas => convertToGrayscale(canvas));
              console.log('Conversión a escala de grises aplicada');
            }
            
            // Convert to image
            let finalBlob: Blob;
            finalBlob = await TiffUtils.canvasesToTiff(canvases, options.dpi);
            
            const downloadUrl = URL.createObjectURL(finalBlob);
            console.log(`PDF procesado exitosamente: ${file.name}`);
            
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
      if (file.processedName.endsWith('.tiff')) {
        fetch(file.downloadUrl)
          .then(response => response.blob())
          .then(blob => TiffUtils.downloadTiff(blob, file.processedName))
          .catch(error => console.error('Error downloading file:', error));
      } else {
        fetch(file.downloadUrl)
          .then(response => response.blob())
          .then(blob => downloadBlob(blob, file.processedName))
          .catch(error => console.error('Error downloading file:', error));
      }
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