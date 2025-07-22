// Utility for creating real TIFF files
export class TiffGenerator {
  static createTiffHeader(width: number, height: number, dpi: number = 300): Uint8Array {
    // TIFF Header structure
    const header = new ArrayBuffer(8);
    const view = new DataView(header);
    
    // TIFF signature (little endian)
    view.setUint16(0, 0x4949, true); // "II"
    view.setUint16(2, 42, true);     // TIFF magic number
    view.setUint32(4, 8, true);      // Offset to first IFD
    
    return new Uint8Array(header);
  }

  static createIFD(width: number, height: number, dataOffset: number, dataLength: number, dpi: number = 300): Uint8Array {
    const numTags = 12;
    const ifdSize = 2 + (numTags * 12) + 4; // 2 bytes for count + tags + 4 bytes for next IFD offset
    const ifd = new ArrayBuffer(ifdSize);
    const view = new DataView(ifd);
    
    let offset = 0;
    
    // Number of directory entries
    view.setUint16(offset, numTags, true);
    offset += 2;
    
    // Helper function to write IFD entry
    const writeTag = (tag: number, type: number, count: number, value: number) => {
      view.setUint16(offset, tag, true);      // Tag
      view.setUint16(offset + 2, type, true); // Type
      view.setUint32(offset + 4, count, true); // Count
      view.setUint32(offset + 8, value, true); // Value/Offset
      offset += 12;
    };
    
    // TIFF tags
    writeTag(0x0100, 4, 1, width);           // ImageWidth
    writeTag(0x0101, 4, 1, height);          // ImageLength
    writeTag(0x0102, 3, 1, 8);               // BitsPerSample
    writeTag(0x0103, 3, 1, 1);               // Compression (none)
    writeTag(0x0106, 3, 1, 1);               // PhotometricInterpretation (BlackIsZero for grayscale)
    writeTag(0x0111, 4, 1, dataOffset);      // StripOffsets
    writeTag(0x0115, 3, 1, 1);               // SamplesPerPixel (1 for grayscale)
    writeTag(0x0116, 4, 1, height);          // RowsPerStrip
    writeTag(0x0117, 4, 1, dataLength);      // StripByteCounts
    writeTag(0x011A, 5, 1, ifdSize + 8);     // XResolution (rational)
    writeTag(0x011B, 5, 1, ifdSize + 16);    // YResolution (rational)
    writeTag(0x0128, 3, 1, 2);               // ResolutionUnit (inches)
    
    // Next IFD offset (0 = no more IFDs)
    view.setUint32(offset, 0, true);
    
    return new Uint8Array(ifd);
  }

  static createResolutionValues(dpi: number): Uint8Array {
    const buffer = new ArrayBuffer(16);
    const view = new DataView(buffer);
    
    // XResolution (dpi/1)
    view.setUint32(0, dpi, true);
    view.setUint32(4, 1, true);
    
    // YResolution (dpi/1)
    view.setUint32(8, dpi, true);
    view.setUint32(12, 1, true);
    
    return new Uint8Array(buffer);
  }

  static canvasToGrayscaleData(canvas: HTMLCanvasElement): Uint8Array {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('No se pudo obtener el contexto del canvas');
    
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    const grayscaleData = new Uint8Array(canvas.width * canvas.height);
    
    // Convert RGBA to grayscale
    for (let i = 0, j = 0; i < data.length; i += 4, j++) {
      // Use luminance formula for grayscale conversion
      const gray = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
      grayscaleData[j] = gray;
    }
    
    return grayscaleData;
  }

  static createSinglePageTiff(canvas: HTMLCanvasElement, dpi: number = 300): Uint8Array {
    const width = canvas.width;
    const height = canvas.height;
    
    // Get grayscale image data
    const imageData = this.canvasToGrayscaleData(canvas);
    
    // Calculate offsets
    const headerSize = 8;
    const ifdSize = 2 + (12 * 12) + 4; // 12 tags
    const resolutionSize = 16;
    const dataOffset = headerSize + ifdSize + resolutionSize;
    
    // Create TIFF components
    const header = this.createTiffHeader(width, height, dpi);
    const ifd = this.createIFD(width, height, dataOffset, imageData.length, dpi);
    const resolutionValues = this.createResolutionValues(dpi);
    
    // Combine all parts
    const totalSize = header.length + ifd.length + resolutionValues.length + imageData.length;
    const tiffData = new Uint8Array(totalSize);
    
    let offset = 0;
    tiffData.set(header, offset);
    offset += header.length;
    
    tiffData.set(ifd, offset);
    offset += ifd.length;
    
    tiffData.set(resolutionValues, offset);
    offset += resolutionValues.length;
    
    tiffData.set(imageData, offset);
    
    return tiffData;
  }

  static createMultiPageTiff(canvases: HTMLCanvasElement[], dpi: number = 300): Uint8Array {
    if (canvases.length === 1) {
      return this.createSinglePageTiff(canvases[0], dpi);
    }

    // For multi-page, we'll create a single tall image containing all pages
    const maxWidth = Math.max(...canvases.map(c => c.width));
    const totalHeight = canvases.reduce((sum, c) => sum + c.height, 0);
    
    // Create combined canvas
    const combinedCanvas = document.createElement('canvas');
    const ctx = combinedCanvas.getContext('2d');
    if (!ctx) throw new Error('No se pudo crear el canvas combinado');
    
    combinedCanvas.width = maxWidth;
    combinedCanvas.height = totalHeight;
    
    // Fill with white background
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, maxWidth, totalHeight);
    
    // Draw all canvases
    let currentY = 0;
    for (const canvas of canvases) {
      const x = (maxWidth - canvas.width) / 2;
      ctx.drawImage(canvas, x, currentY);
      currentY += canvas.height;
    }
    
    return this.createSinglePageTiff(combinedCanvas, dpi);
  }
}