// Utilidades para procesamiento usando las APIs de Electron
declare global {
  interface Window {
    electronAPI: {
      selectFiles: (options: any) => Promise<any[]>;
      saveFile: (defaultPath: string) => Promise<string>;
      combinePdfs: (filePaths: string[]) => Promise<number[]>;
      pdfToImages: (pdfData: number[], dpi: number) => Promise<number[][]>;
      createMultipageTiff: (imageBuffers: number[][], options: any) => Promise<number[]>;
      processTiffFile: (filePath: string, options: any) => Promise<number[]>;
      writeFile: (filePath: string, data: number[]) => Promise<boolean>;
    };
  }
}

export const isElectron = () => {
  return typeof window !== 'undefined' && window.electronAPI;
};

export const selectPdfFiles = async (): Promise<File[]> => {
  if (!isElectron()) {
    throw new Error('Esta función solo está disponible en la aplicación de escritorio');
  }

  const files = await window.electronAPI.selectFiles({
    filters: [
      { name: 'PDF Files', extensions: ['pdf'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  });

  // Convertir a objetos File para compatibilidad
  return files.map(file => ({
    name: file.name,
    size: file.size,
    type: 'application/pdf',
    path: file.path // Propiedad adicional para Electron
  } as any));
};

export const selectTiffFiles = async (): Promise<File[]> => {
  if (!isElectron()) {
    throw new Error('Esta función solo está disponible en la aplicación de escritorio');
  }

  const files = await window.electronAPI.selectFiles({
    filters: [
      { name: 'TIFF Files', extensions: ['tiff', 'tif'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  });

  return files.map(file => ({
    name: file.name,
    size: file.size,
    type: 'image/tiff',
    path: file.path
  } as any));
};

export const processPdfsToTiff = async (
  files: File[],
  options: { dpi: number; grayscale: boolean; combineFiles: boolean }
): Promise<{ data: Uint8Array; filename: string }> => {
  if (!isElectron()) {
    throw new Error('Esta función solo está disponible en la aplicación de escritorio');
  }

  try {
    console.log(`Procesando ${files.length} archivos PDF`);

    // Obtener rutas de archivos
    const filePaths = files.map((file: any) => file.path);

    let pdfData: number[];
    let filename: string;

    if (options.combineFiles && files.length > 1) {
      // Combinar PDFs
      console.log('Combinando PDFs...');
      pdfData = await window.electronAPI.combinePdfs(filePaths);
      filename = `combined_${files.length}_files.tiff`;
    } else {
      // Procesar solo el primer archivo
      console.log('Procesando PDF individual...');
      pdfData = await window.electronAPI.combinePdfs([filePaths[0]]);
      filename = files[0].name.replace('.pdf', '.tiff');
    }

    // Convertir PDF a imágenes
    console.log('Convirtiendo PDF a imágenes...');
    const imageBuffers = await window.electronAPI.pdfToImages(pdfData, options.dpi);

    // Crear TIFF multipágina
    console.log('Creando TIFF multipágina...');
    const tiffData = await window.electronAPI.createMultipageTiff(imageBuffers, {
      dpi: options.dpi,
      grayscale: options.grayscale
    });

    return {
      data: new Uint8Array(tiffData),
      filename: filename
    };

  } catch (error) {
    console.error('Error procesando PDFs:', error);
    throw new Error(`Error al procesar PDFs: ${error instanceof Error ? error.message : 'Error desconocido'}`);
  }
};

export const processTiffFiles = async (
  files: File[],
  options: { dpi: number; grayscale: boolean }
): Promise<{ data: Uint8Array; filename: string }[]> => {
  if (!isElectron()) {
    throw new Error('Esta función solo está disponible en la aplicación de escritorio');
  }

  const results = [];

  for (const file of files) {
    try {
      console.log(`Procesando archivo TIFF: ${file.name}`);
      
      const tiffData = await window.electronAPI.processTiffFile((file as any).path, options);
      
      results.push({
        data: new Uint8Array(tiffData),
        filename: `processed_${file.name}`
      });

    } catch (error) {
      console.error(`Error procesando ${file.name}:`, error);
      throw new Error(`Error al procesar ${file.name}: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  }

  return results;
};

export const saveFile = async (data: Uint8Array, defaultFilename: string): Promise<void> => {
  if (!isElectron()) {
    throw new Error('Esta función solo está disponible en la aplicación de escritorio');
  }

  const filePath = await window.electronAPI.saveFile(defaultFilename);
  
  if (filePath) {
    await window.electronAPI.writeFile(filePath, Array.from(data));
    console.log(`Archivo guardado: ${filePath}`);
  }
};