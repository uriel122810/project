import * as pdfjsLib from 'pdfjs-dist';
import { TiffProcessor } from './tiffProcessor';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;

export const loadPDFAsImages = async (file: File, dpi: number = 150): Promise<HTMLCanvasElement[]> => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const canvases: HTMLCanvasElement[] = [];
    
    const scale = dpi / 72; // PDF default is 72 DPI
    
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const viewport = page.getViewport({ scale });
      
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('No se pudo crear el contexto del canvas');
      
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      
      const renderContext = {
        canvasContext: ctx,
        viewport: viewport
      };
      
      await page.render(renderContext).promise;
      canvases.push(canvas);
    }
    
    return canvases;
  } catch (error) {
    console.error('Error loading PDF:', error);
    throw new Error(`Error al procesar el PDF: ${error instanceof Error ? error.message : 'Error desconocido'}`);
  }
};

export const combineCanvasesToSingleImage = (canvases: HTMLCanvasElement[]): HTMLCanvasElement => {
  if (canvases.length === 0) throw new Error('No hay imágenes para combinar');
  
  if (canvases.length === 1) {
    return canvases[0];
  }

  // Calculate total dimensions
  const maxWidth = Math.max(...canvases.map(canvas => canvas.width));
  const totalHeight = canvases.reduce((sum, canvas) => sum + canvas.height, 0);
  
  // Create combined canvas
  const combinedCanvas = document.createElement('canvas');
  const ctx = combinedCanvas.getContext('2d');
  if (!ctx) throw new Error('No se pudo crear el canvas combinado');

  combinedCanvas.width = maxWidth;
  combinedCanvas.height = totalHeight;

  // Fill with white background
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, combinedCanvas.width, combinedCanvas.height);

  // Draw each canvas
  let currentY = 0;
  for (const canvas of canvases) {
    // Center the canvas horizontally if it's smaller than maxWidth
    const x = (maxWidth - canvas.width) / 2;
    ctx.drawImage(canvas, x, currentY);
    currentY += canvas.height;
  }

  return combinedCanvas;
};

export const createMultiPageTiff = async (canvases: HTMLCanvasElement[], dpi: number = 300): Promise<Blob> => {
  try {
    return await TiffProcessor.canvasesToTiff(canvases, dpi);
  } catch (error) {
    console.error('Error creating multi-page TIFF:', error);
    throw new Error('Error al crear el archivo TIFF multipágina');
  }
};