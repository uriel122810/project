import { TiffGenerator } from './tiffGenerator';
import { TiffCreator } from './tiffCreator';

// Utility functions for image processing without external dependencies
export const convertToGrayscale = (canvas: HTMLCanvasElement): HTMLCanvasElement => {
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('No se pudo obtener el contexto del canvas');

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  // Convert to grayscale using luminance formula
  for (let i = 0; i < data.length; i += 4) {
    const gray = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
    data[i] = gray;     // Red
    data[i + 1] = gray; // Green
    data[i + 2] = gray; // Blue
    // Alpha channel (data[i + 3]) remains unchanged
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas;
};

export const resizeCanvas = (canvas: HTMLCanvasElement, targetDPI: number): HTMLCanvasElement => {
  const originalDPI = 96; // Default web DPI
  const scale = targetDPI / originalDPI;
  
  const newCanvas = document.createElement('canvas');
  const ctx = newCanvas.getContext('2d');
  if (!ctx) throw new Error('No se pudo crear el nuevo canvas');

  newCanvas.width = Math.round(canvas.width * scale);
  newCanvas.height = Math.round(canvas.height * scale);

  // Use high-quality scaling
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  
  ctx.drawImage(canvas, 0, 0, newCanvas.width, newCanvas.height);
  return newCanvas;
};

export const loadImageToCanvas = (file: File): Promise<HTMLCanvasElement[]> => {
  return new Promise((resolve, reject) => {
    console.log(`Cargando archivo: ${file.name}, tipo: ${file.type}, tamaño: ${file.size} bytes`);
    
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      
      img.onload = () => {
        try {
          console.log(`Imagen cargada: ${img.width}x${img.height}`);
          
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('No se pudo obtener el contexto del canvas'));
            return;
          }

          canvas.width = img.width;
          canvas.height = img.height;
          
          // Fill with white background first
          ctx.fillStyle = 'white';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          
          // Draw the image
          ctx.drawImage(img, 0, 0);
          
          console.log(`Canvas creado exitosamente: ${canvas.width}x${canvas.height}`);
          resolve([canvas]); // Return array for consistency
        } catch (error) {
          console.error('Error creando canvas:', error);
          reject(new Error(`Error al procesar la imagen: ${error instanceof Error ? error.message : 'Error desconocido'}`));
        }
      };
      
      img.onerror = () => {
        console.error('Error cargando imagen');
        reject(new Error('Error al cargar la imagen. Verifica que el archivo sea una imagen válida.'));
      };
      
      // Set the image source to the data URL
      img.src = e.target?.result as string;
    };
    
    reader.onerror = () => {
      console.error('Error leyendo archivo');
      reject(new Error('Error al leer el archivo'));
    };
    
    // Read the file as data URL
    reader.readAsDataURL(file);
  });
};

export const canvasToBlob = (canvas: HTMLCanvasElement, quality: string, format: string = 'image/png'): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const qualityValue = quality === 'high' ? 0.95 : quality === 'medium' ? 0.8 : 0.6;
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error('Error al convertir canvas a blob'));
      }
    }, format, qualityValue);
  });
};

export const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// Simplified TIFF creation that always works
export const createTiffLikeFile = async (canvases: HTMLCanvasElement[], dpi: number = 300): Promise<Blob> => {
  try {
    console.log(`Creando archivo con ${canvases.length} página(s) a ${dpi} DPI`);
    
    if (canvases.length === 0) {
      throw new Error('No hay páginas para procesar');
    }

    // Always use PNG as it's more reliable in browsers
    if (canvases.length === 1) {
      console.log('Creando archivo PNG de una sola página');
      return canvasToBlob(canvases[0], 'high', 'image/png');
    }
    
    // Multiple pages - combine into single tall image
    console.log('Combinando múltiples páginas en una imagen');
    const maxWidth = Math.max(...canvases.map(canvas => canvas.width));
    const totalHeight = canvases.reduce((sum, canvas) => sum + canvas.height, 0);
    
    const combinedCanvas = document.createElement('canvas');
    const ctx = combinedCanvas.getContext('2d');
    if (!ctx) throw new Error('No se pudo crear el canvas combinado');

    combinedCanvas.width = maxWidth;
    combinedCanvas.height = totalHeight;

    // Fill with white background
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, combinedCanvas.width, combinedCanvas.height);

    // Draw each canvas with a small separator
    let currentY = 0;
    for (let i = 0; i < canvases.length; i++) {
      const canvas = canvases[i];
      const x = (maxWidth - canvas.width) / 2;
      
      // Draw the page
      ctx.drawImage(canvas, x, currentY);
      currentY += canvas.height;
      
      // Add separator line between pages (except for last page)
      if (i < canvases.length - 1) {
        ctx.strokeStyle = '#cccccc';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, currentY + 5);
        ctx.lineTo(maxWidth, currentY + 5);
        ctx.stroke();
        currentY += 10; // Add some space for the separator
      }
      
      console.log(`Página ${i + 1} añadida en posición Y: ${currentY - canvas.height}`);
    }

    console.log(`Imagen combinada creada: ${combinedCanvas.width}x${combinedCanvas.height}`);
    return canvasToBlob(combinedCanvas, 'high', 'image/png');
    
  } catch (error) {
    console.error('Error creando archivo:', error);
    throw new Error(`Error al crear el archivo: ${error instanceof Error ? error.message : 'Error desconocido'}`);
  }
};

// Create a multi-page file
export const createMultiPageTiffFile = async (canvases: HTMLCanvasElement[], dpi: number = 300): Promise<Blob> => {
  try {
    console.log(`Creando TIFF multipágina real con ${canvases.length} páginas`);
    const tiffData = TiffCreator.createMultiPageTiff(canvases, dpi);
    return new Blob([tiffData], { type: 'image/tiff' });
  } catch (error) {
    console.error('Error creando TIFF multipágina:', error);
    throw new Error(`Error al crear TIFF multipágina: ${error instanceof Error ? error.message : 'Error desconocido'}`);
  }
};

// Create real TIFF file
export const createRealTiffFile = async (canvases: HTMLCanvasElement[], dpi: number = 300): Promise<Blob> => {
  try {
    console.log(`Creando archivo TIFF real con ${canvases.length} página(s) a ${dpi} DPI`);
    const tiffData = TiffCreator.createMultiPageTiff(canvases, dpi);
    console.log(`TIFF creado exitosamente: ${tiffData.length} bytes`);
    return new Blob([tiffData], { type: 'image/tiff' });
  } catch (error) {
    console.error('Error creando TIFF real:', error);
    throw new Error(`Error al crear archivo TIFF: ${error instanceof Error ? error.message : 'Error desconocido'}`);
  }
};