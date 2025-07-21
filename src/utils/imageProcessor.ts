import UTIF from 'utif2';

// Utility functions for image processing
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

export const loadTiffToCanvas = async (file: File): Promise<HTMLCanvasElement[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const arrayBuffer = e.target?.result as ArrayBuffer;
        if (!arrayBuffer) {
          reject(new Error('No se pudo leer el archivo'));
          return;
        }

        console.log('Procesando archivo TIFF:', file.name);
        
        // Parse TIFF using UTIF
        const ifds = UTIF.decode(arrayBuffer);
        console.log(`TIFF contiene ${ifds.length} página(s)`);
        
        const canvases: HTMLCanvasElement[] = [];
        
        ifds.forEach((ifd, index) => {
          console.log(`Procesando página ${index + 1}/${ifds.length}`);
          
          // Decode the image data
          UTIF.decodeImage(arrayBuffer, ifd);
          
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (!ctx) throw new Error('No se pudo crear el contexto del canvas');
          
          canvas.width = ifd.width;
          canvas.height = ifd.height;
          
          // Create ImageData from TIFF data
          const imageData = ctx.createImageData(ifd.width, ifd.height);
          const rgba = UTIF.toRGBA8(ifd);
          
          // Copy RGBA data to ImageData
          for (let i = 0; i < rgba.length; i++) {
            imageData.data[i] = rgba[i];
          }
          
          ctx.putImageData(imageData, 0, 0);
          canvases.push(canvas);
        });
        
        console.log(`TIFF procesado exitosamente: ${canvases.length} página(s)`);
        resolve(canvases);
      } catch (error) {
        console.error('Error procesando TIFF:', error);
        reject(new Error(`Error al procesar el archivo TIFF: ${error instanceof Error ? error.message : 'Error desconocido'}`));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Error al leer el archivo'));
    };
    
    reader.readAsArrayBuffer(file);
  });
};

export const loadImageToCanvas = (file: File): Promise<HTMLCanvasElement[]> => {
  // Check if it's a TIFF file
  if (file.name.toLowerCase().endsWith('.tiff') || file.name.toLowerCase().endsWith('.tif') || file.type === 'image/tiff') {
    return loadTiffToCanvas(file);
  }
  
  // Handle regular images (PNG, JPEG, etc.)
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('No se pudo obtener el contexto del canvas'));
        return;
      }

      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      
      // Clean up
      URL.revokeObjectURL(img.src);
      resolve([canvas]); // Return array for consistency
    };
    img.onerror = () => {
      URL.revokeObjectURL(img.src);
      reject(new Error('Error al cargar la imagen'));
    };
    img.src = URL.createObjectURL(file);
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