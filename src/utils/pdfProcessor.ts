// PDF processing utilities
export const loadPDFAsImages = async (file: File): Promise<HTMLCanvasElement[]> => {
  return new Promise((resolve, reject) => {
    const fileReader = new FileReader();
    fileReader.onload = async (e) => {
      try {
        const typedArray = new Uint8Array(e.target?.result as ArrayBuffer);
        
        // For demo purposes, we'll create a canvas representation
        // In a real implementation, you'd use PDF.js or similar library
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('No se pudo crear el canvas');

        // Create a placeholder representation of the PDF
        canvas.width = 800;
        canvas.height = 1000;
        
        // Fill with white background
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Add some text to simulate PDF content
        ctx.fillStyle = 'black';
        ctx.font = '16px Arial';
        ctx.fillText(`Contenido del PDF: ${file.name}`, 50, 100);
        ctx.fillText('Esta es una representación simulada', 50, 130);
        ctx.fillText('del contenido del archivo PDF', 50, 160);
        
        // Add a border
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 2;
        ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);

        resolve([canvas]);
      } catch (error) {
        reject(error);
      }
    };
    fileReader.onerror = () => reject(new Error('Error al leer el archivo PDF'));
    fileReader.readAsArrayBuffer(file);
  });
};

export const combineCanvasesToTiff = async (canvases: HTMLCanvasElement[], dpi: number): Promise<Blob> => {
  if (canvases.length === 0) throw new Error('No hay imágenes para combinar');
  
  if (canvases.length === 1) {
    // Single canvas, just convert to TIFF
    return new Promise((resolve, reject) => {
      canvases[0].toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Error al convertir a TIFF'));
      }, 'image/tiff');
    });
  }

  // Multiple canvases - combine vertically
  const totalHeight = canvases.reduce((sum, canvas) => sum + canvas.height, 0);
  const maxWidth = Math.max(...canvases.map(canvas => canvas.width));
  
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
    ctx.drawImage(canvas, 0, currentY);
    currentY += canvas.height;
  }

  return new Promise((resolve, reject) => {
    combinedCanvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Error al combinar archivos'));
    }, 'image/tiff');
  });
};