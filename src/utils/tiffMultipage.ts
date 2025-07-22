// Implementación similar al código Python para crear TIFF multipágina
import { loadPDFAsImages, combinePDFs, loadPDFBytesAsImages } from './pdfProcessor';

export class TiffMultipageCreator {
  // Convierte múltiples PDFs a un TIFF multipágina siguiendo la lógica del código Python
  static async convertPdfsToTiff(files: File[], dpi: number = 200, grayscale: boolean = false): Promise<Blob> {
    console.log(`Iniciando conversión de ${files.length} PDFs a TIFF multipágina con ${dpi} DPI`);
    
    try {
      // Paso 1: Combinar todos los PDFs en uno solo (similar al código Python)
      const combinedPdfBytes = await combinePDFs(files);
      console.log('PDFs combinados exitosamente');
      
      // Paso 2: Convertir el PDF combinado a imágenes (similar a PyMuPDF)
      const canvases = await loadPDFBytesAsImages(combinedPdfBytes, dpi);
      console.log(`PDF convertido a ${canvases.length} páginas`);
      
      // Paso 3: Convertir a escala de grises si es necesario
      const processedCanvases = canvases.map((canvas, index) => {
        console.log(`Procesando página ${index + 1}/${canvases.length}`);
        
        if (grayscale) {
          const ctx = canvas.getContext('2d');
          if (ctx) {
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;
            
            // Convertir a escala de grises usando la fórmula estándar
            for (let i = 0; i < data.length; i += 4) {
              const gray = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
              data[i] = gray;     // R
              data[i + 1] = gray; // G
              data[i + 2] = gray; // B
              // Alpha se mantiene igual
            }
            
            ctx.putImageData(imageData, 0, 0);
          }
        }
        
        return canvas;
      });
      
      // Paso 4: Crear TIFF multipágina real
      const tiffBlob = await this.createMultipageTiff(processedCanvases, dpi);
      console.log('TIFF multipágina creado exitosamente');
      
      return tiffBlob;
      
    } catch (error) {
      console.error('Error en conversión:', error);
      throw new Error(`Error al convertir PDFs a TIFF: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  }
  
  // Crea un TIFF multipágina real siguiendo la especificación TIFF
  private static async createMultipageTiff(canvases: HTMLCanvasElement[], dpi: number): Promise<Blob> {
    console.log(`Creando TIFF multipágina con ${canvases.length} páginas a ${dpi} DPI`);
    
    if (canvases.length === 0) {
      throw new Error('No hay páginas para procesar');
    }
    
    // Calcular el tamaño total del archivo TIFF
    let totalSize = 8; // Header TIFF
    const imageDataArray: Uint8Array[] = [];
    const pageInfo: Array<{width: number, height: number, dataSize: number}> = [];
    
    // Procesar cada página y calcular tamaños
    for (let i = 0; i < canvases.length; i++) {
      const canvas = canvases[i];
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error(`No se pudo obtener contexto para página ${i + 1}`);
      
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const grayscaleData = new Uint8Array(canvas.width * canvas.height);
      
      // Convertir RGBA a escala de grises
      for (let j = 0, k = 0; j < imageData.data.length; j += 4, k++) {
        const gray = Math.round(
          0.299 * imageData.data[j] + 
          0.587 * imageData.data[j + 1] + 
          0.114 * imageData.data[j + 2]
        );
        grayscaleData[k] = gray;
      }
      
      imageDataArray.push(grayscaleData);
      pageInfo.push({
        width: canvas.width,
        height: canvas.height,
        dataSize: grayscaleData.length
      });
      
      // Cada IFD: 2 bytes (count) + 12*12 bytes (tags) + 4 bytes (next IFD) + 16 bytes (resolution)
      totalSize += 2 + (12 * 12) + 4 + 16 + grayscaleData.length;
    }
    
    console.log(`Tamaño total calculado: ${totalSize} bytes`);
    
    // Crear el buffer del archivo TIFF
    const tiffBuffer = new ArrayBuffer(totalSize);
    const view = new DataView(tiffBuffer);
    const uint8View = new Uint8Array(tiffBuffer);
    
    let offset = 0;
    
    // Header TIFF
    view.setUint16(0, 0x4949, true); // "II" little endian
    view.setUint16(2, 42, true);     // TIFF magic number
    view.setUint32(4, 8, true);      // Offset al primer IFD
    offset = 8;
    
    // Escribir cada página
    for (let pageIndex = 0; pageIndex < canvases.length; pageIndex++) {
      const page = pageInfo[pageIndex];
      const imageData = imageDataArray[pageIndex];
      const isLastPage = pageIndex === canvases.length - 1;
      
      console.log(`Escribiendo página ${pageIndex + 1}: ${page.width}x${page.height}`);
      
      const ifdStart = offset;
      const imageDataOffset = offset + 2 + (12 * 12) + 4 + 16;
      const resolutionOffset = offset + 2 + (12 * 12) + 4;
      const nextIfdOffset = isLastPage ? 0 : imageDataOffset + imageData.length;
      
      // Número de entradas IFD
      view.setUint16(offset, 12, true);
      offset += 2;
      
      // Escribir entradas IFD
      const writeIFDEntry = (tag: number, type: number, count: number, value: number) => {
        view.setUint16(offset, tag, true);
        view.setUint16(offset + 2, type, true);
        view.setUint32(offset + 4, count, true);
        view.setUint32(offset + 8, value, true);
        offset += 12;
      };
      
      writeIFDEntry(0x0100, 4, 1, page.width);           // ImageWidth
      writeIFDEntry(0x0101, 4, 1, page.height);          // ImageLength
      writeIFDEntry(0x0102, 3, 1, 8);                    // BitsPerSample
      writeIFDEntry(0x0103, 3, 1, 1);                    // Compression (none)
      writeIFDEntry(0x0106, 3, 1, 1);                    // PhotometricInterpretation (BlackIsZero)
      writeIFDEntry(0x0111, 4, 1, imageDataOffset);      // StripOffsets
      writeIFDEntry(0x0115, 3, 1, 1);                    // SamplesPerPixel
      writeIFDEntry(0x0116, 4, 1, page.height);          // RowsPerStrip
      writeIFDEntry(0x0117, 4, 1, page.dataSize);        // StripByteCounts
      writeIFDEntry(0x011A, 5, 1, resolutionOffset);     // XResolution
      writeIFDEntry(0x011B, 5, 1, resolutionOffset + 8); // YResolution
      writeIFDEntry(0x0128, 3, 1, 2);                    // ResolutionUnit (inches)
      
      // Offset al siguiente IFD
      view.setUint32(offset, nextIfdOffset, true);
      offset += 4;
      
      // Valores de resolución (rational: dpi/1)
      view.setUint32(offset, dpi, true);     // XResolution numerator
      view.setUint32(offset + 4, 1, true);   // XResolution denominator
      view.setUint32(offset + 8, dpi, true); // YResolution numerator
      view.setUint32(offset + 12, 1, true);  // YResolution denominator
      offset += 16;
      
      // Datos de la imagen
      uint8View.set(imageData, offset);
      offset += imageData.length;
      
      console.log(`Página ${pageIndex + 1} escrita exitosamente`);
    }
    
    console.log(`TIFF multipágina completado: ${tiffBuffer.byteLength} bytes`);
    return new Blob([tiffBuffer], { type: 'image/tiff' });
  }
  
  // Función para descargar el archivo TIFF
  static downloadTiff(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename.endsWith('.tiff') ? filename : filename + '.tiff';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}