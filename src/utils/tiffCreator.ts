// Utilidad para crear archivos TIFF multipágina reales
export class TiffCreator {
  static createTiffHeader(): Uint8Array {
    const header = new ArrayBuffer(8);
    const view = new DataView(header);
    
    // TIFF signature (little endian)
    view.setUint16(0, 0x4949, true); // "II"
    view.setUint16(2, 42, true);     // TIFF magic number
    view.setUint32(4, 8, true);      // Offset to first IFD
    
    return new Uint8Array(header);
  }

  static createIFDEntry(tag: number, type: number, count: number, value: number): Uint8Array {
    const entry = new ArrayBuffer(12);
    const view = new DataView(entry);
    
    view.setUint16(0, tag, true);      // Tag
    view.setUint16(2, type, true);     // Type
    view.setUint32(4, count, true);    // Count
    view.setUint32(8, value, true);    // Value/Offset
    
    return new Uint8Array(entry);
  }

  static canvasToGrayscaleData(canvas: HTMLCanvasElement): Uint8Array {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('No se pudo obtener el contexto del canvas');
    
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    const grayscaleData = new Uint8Array(canvas.width * canvas.height);
    
    // Convert RGBA to grayscale
    for (let i = 0, j = 0; i < data.length; i += 4, j++) {
      const gray = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
      grayscaleData[j] = gray;
    }
    
    return grayscaleData;
  }

  static createMultiPageTiff(canvases: HTMLCanvasElement[], dpi: number = 300): Uint8Array {
    console.log(`Creando TIFF multipágina con ${canvases.length} páginas a ${dpi} DPI`);
    
    if (canvases.length === 0) {
      throw new Error('No hay páginas para procesar');
    }

    // Calculate total size needed
    let totalSize = 8; // Header size
    const imageDataArray: Uint8Array[] = [];
    const ifdOffsets: number[] = [];
    
    // Process each canvas and calculate sizes
    for (let i = 0; i < canvases.length; i++) {
      const canvas = canvases[i];
      const imageData = this.canvasToGrayscaleData(canvas);
      imageDataArray.push(imageData);
      
      // Each IFD needs: 2 bytes (count) + 12*12 bytes (tags) + 4 bytes (next IFD) + 16 bytes (resolution values)
      const ifdSize = 2 + (12 * 12) + 4 + 16;
      ifdOffsets.push(totalSize);
      totalSize += ifdSize + imageData.length;
    }

    console.log(`Tamaño total calculado: ${totalSize} bytes`);

    // Create the complete TIFF file
    const tiffData = new Uint8Array(totalSize);
    let offset = 0;

    // Write TIFF header
    const header = this.createTiffHeader();
    tiffData.set(header, offset);
    offset += header.length;

    // Write each page
    for (let pageIndex = 0; pageIndex < canvases.length; pageIndex++) {
      const canvas = canvases[pageIndex];
      const imageData = imageDataArray[pageIndex];
      const isLastPage = pageIndex === canvases.length - 1;
      
      console.log(`Escribiendo página ${pageIndex + 1}: ${canvas.width}x${canvas.height}`);

      // Calculate offsets for this page
      const ifdStart = offset;
      const imageDataOffset = offset + 2 + (12 * 12) + 4 + 16; // After IFD and resolution values
      const resolutionOffset = offset + 2 + (12 * 12) + 4; // After IFD entries and next IFD pointer
      const nextIfdOffset = isLastPage ? 0 : imageDataOffset + imageData.length;

      // Write IFD entry count
      const view = new DataView(tiffData.buffer, offset);
      view.setUint16(0, 12, true); // 12 tags
      offset += 2;

      // Write IFD entries
      const entries = [
        [0x0100, 4, 1, canvas.width],           // ImageWidth
        [0x0101, 4, 1, canvas.height],          // ImageLength  
        [0x0102, 3, 1, 8],                      // BitsPerSample
        [0x0103, 3, 1, 1],                      // Compression (none)
        [0x0106, 3, 1, 1],                      // PhotometricInterpretation (BlackIsZero)
        [0x0111, 4, 1, imageDataOffset],        // StripOffsets
        [0x0115, 3, 1, 1],                      // SamplesPerPixel
        [0x0116, 4, 1, canvas.height],          // RowsPerStrip
        [0x0117, 4, 1, imageData.length],       // StripByteCounts
        [0x011A, 5, 1, resolutionOffset],       // XResolution
        [0x011B, 5, 1, resolutionOffset + 8],   // YResolution
        [0x0128, 3, 1, 2]                       // ResolutionUnit (inches)
      ];

      for (const [tag, type, count, value] of entries) {
        const entry = this.createIFDEntry(tag, type, count, value);
        tiffData.set(entry, offset);
        offset += 12;
      }

      // Write next IFD offset
      view.setUint32(offset - ifdStart, nextIfdOffset, true);
      offset += 4;

      // Write resolution values (rational numbers: dpi/1)
      view.setUint32(offset - ifdStart, dpi, true);     // XResolution numerator
      view.setUint32(offset - ifdStart + 4, 1, true);   // XResolution denominator
      view.setUint32(offset - ifdStart + 8, dpi, true); // YResolution numerator
      view.setUint32(offset - ifdStart + 12, 1, true);  // YResolution denominator
      offset += 16;

      // Write image data
      tiffData.set(imageData, offset);
      offset += imageData.length;

      console.log(`Página ${pageIndex + 1} escrita exitosamente`);
    }

    console.log(`TIFF multipágina creado exitosamente: ${tiffData.length} bytes`);
    return tiffData;
  }

  static downloadTiff(tiffData: Uint8Array, filename: string) {
    const blob = new Blob([tiffData], { type: 'image/tiff' });
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