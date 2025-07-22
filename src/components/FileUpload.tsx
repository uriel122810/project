import React, { useCallback } from 'react';
import { Upload, File, X } from 'lucide-react';
import { isElectron, selectPdfFiles, selectTiffFiles } from '../utils/electronProcessor';

interface FileUploadProps {
  acceptedTypes: string[];
  onFilesSelected: (files: File[]) => void;
  selectedFiles: File[];
  onRemoveFile: (index: number) => void;
  maxFiles?: number;
  fileType?: 'pdf' | 'tiff';
}

export default function FileUpload({ 
  acceptedTypes, 
  onFilesSelected, 
  selectedFiles, 
  onRemoveFile,
  maxFiles = 10,
  fileType = 'pdf'
}: FileUploadProps) {
  const handleElectronFileSelect = useCallback(async () => {
    if (!isElectron()) return;
    
    try {
      let files: File[];
      if (fileType === 'pdf') {
        files = await selectPdfFiles();
      } else {
        files = await selectTiffFiles();
      }
      onFilesSelected(files);
    } catch (error) {
      console.error('Error seleccionando archivos:', error);
    }
  }, [fileType, onFilesSelected]);

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const validFiles = files.filter(file => 
      acceptedTypes.some(type => file.type.includes(type) || file.name.toLowerCase().endsWith(type))
    );
    onFilesSelected(validFiles);
    // Reset input
    event.target.value = '';
  }, [acceptedTypes, onFilesSelected]);

  const handleDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    const files = Array.from(event.dataTransfer.files);
    const validFiles = files.filter(file => 
      acceptedTypes.some(type => file.type.includes(type) || file.name.toLowerCase().endsWith(type))
    );
    onFilesSelected(validFiles);
  }, [acceptedTypes, onFilesSelected]);

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
  }, []);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-4">
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-red-400 transition-colors duration-200"
      >
        <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-lg font-medium text-gray-700 mb-2">
          Arrastra archivos aquí o haz clic para seleccionar
        </p>
        <p className="text-sm text-gray-500 mb-4">
          Tipos admitidos: {acceptedTypes.join(', ')}
        </p>
        <input
          type="file"
          multiple
          accept={acceptedTypes.join(',')}
          onChange={handleFileSelect}
          className="hidden"
          id="file-upload"
          style={{ display: isElectron() ? 'none' : 'block' }}
        />
        {isElectron() ? (
          <button
            onClick={handleElectronFileSelect}
            className="inline-flex items-center px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200"
          >
            <Upload className="w-5 h-5 mr-2" />
            Seleccionar Archivos
          </button>
        ) : (
          <label
            htmlFor="file-upload"
            className="inline-flex items-center px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200 cursor-pointer"
          >
            <Upload className="w-5 h-5 mr-2" />
            Seleccionar Archivos
          </label>
        )}
      </div>

      {selectedFiles.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-medium text-gray-700">Archivos seleccionados:</h3>
          {selectedFiles.map((file, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <File className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="font-medium text-gray-700">{file.name}</p>
                  <p className="text-sm text-gray-500">{formatFileSize(file.size)}</p>
                </div>
              </div>
              <button
                onClick={() => onRemoveFile(index)}
                className="p-1 text-gray-400 hover:text-red-500 transition-colors duration-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}