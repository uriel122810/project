// Utility functions for creating multi-page TIFF files
export class TiffProcessor {
  static async createMultiPageTiff(canvases: HTMLCanvasElement[]): Promise<Blob> {
    try {
      // Convert each canvas to ImageData
      const imageDataArray = canvases.map(canvas => {
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('No se pudo obtener el contexto del canvas');
        return ctx.getImageData(0, 0, canvas.width, canvas.height);
      });

      // Create TIFF structure manually
      const tiffData = this.createTiffBuffer(imageDataArray);
      return new Blob([tiffData], { type: 'image/tiff' });
    } catch (error) {
      console.error('Error creating multi-page TIFF:', error);
      throw error;
    }
  }

  private static createTiffBuffer(imageDataArray: ImageData[]): ArrayBuffer {
    // TIFF Header
    const isLittleEndian = true;
    const headerSize = 8;
    const ifdSize = 12 + (imageDataArray.length * 12); // 12 bytes per tag + 12 bytes per IFD entry
    
    // Calculate total size needed
    let totalSize = headerSize;
    let imageDataOffsets: number[] = [];
    let imageDataSizes: number[] = [];
    
    imageDataArray.forEach((imageData, index) => {
      const imageSize = imageData.width * imageData.height * 4; // RGBA
      imageDataOffsets.push(totalSize);
      imageDataSizes.push(imageSize);
      totalSize += imageSize;
      totalSize += ifdSize; // IFD for each image
    });

    const buffer = new ArrayBuffer(totalSize);
    const view = new DataView(buffer);
    const uint8View = new Uint8Array(buffer);
    
    let offset = 0;

    // TIFF Header
    if (isLittleEndian) {
      view.setUint16(0, 0x4949, true); // "II" for little endian
    } else {
      view.setUint16(0, 0x4D4D, true); // "MM" for big endian
    }
    view.setUint16(2, 42, isLittleEndian); // TIFF magic number
    view.setUint32(4, headerSize, isLittleEndian); // Offset to first IFD
    offset = headerSize;

    // Write each image and its IFD
    imageDataArray.forEach((imageData, index) => {
      const isLastImage = index === imageDataArray.length - 1;
      
      // Write IFD
      const ifdOffset = offset;
      const numTags = 10; // Number of TIFF tags we'll write
      
      view.setUint16(offset, numTags, isLittleEndian);
      offset += 2;

      // Helper function to write IFD entry
      const writeIFDEntry = (tag: number, type: number, count: number, value: number) => {
        view.setUint16(offset, tag, isLittleEndian);
        view.setUint16(offset + 2, type, isLittleEndian);
        view.setUint32(offset + 4, count, isLittleEndian);
        view.setUint32(offset + 8, value, isLittleEndian);
        offset += 12;
      };

      // Write TIFF tags
      writeIFDEntry(0x0100, 4, 1, imageData.width); // ImageWidth
      writeIFDEntry(0x0101, 4, 1, imageData.height); // ImageLength
      writeIFDEntry(0x0102, 3, 1, 8); // BitsPerSample
      writeIFDEntry(0x0103, 3, 1, 1); // Compression (none)
      writeIFDEntry(0x0106, 3, 1, 2); // PhotometricInterpretation (RGB)
      writeIFDEntry(0x0111, 4, 1, offset + 4); // StripOffsets
      writeIFDEntry(0x0115, 3, 1, 3); // SamplesPerPixel
      writeIFDEntry(0x0116, 4, 1, imageData.height); // RowsPerStrip
      writeIFDEntry(0x0117, 4, 1, imageData.width * imageData.height * 3); // StripByteCounts (RGB, no alpha)
      writeIFDEntry(0x011A, 5, 1, offset + 4 + imageData.width * imageData.height * 3); // XResolution

      // Next IFD offset (0 if last image)
      if (isLastImage) {
        view.setUint32(offset, 0, isLittleEndian);
      } else {
        view.setUint32(offset, offset + 4 + imageData.width * imageData.height * 3 + 8, isLittleEndian);
      }
      offset += 4;

      // Write image data (convert RGBA to RGB)
      const rgbData = new Uint8Array(imageData.width * imageData.height * 3);
      for (let i = 0, j = 0; i < imageData.data.length; i += 4, j += 3) {
        rgbData[j] = imageData.data[i];     // R
        rgbData[j + 1] = imageData.data[i + 1]; // G
        rgbData[j + 2] = imageData.data[i + 2]; // B
        // Skip alpha channel
      }
      
      uint8View.set(rgbData, offset);
      offset += rgbData.length;

      // Write XResolution value (300 DPI as rational: 300/1)
      view.setUint32(offset, 300, isLittleEndian);
      view.setUint32(offset + 4, 1, isLittleEndian);
      offset += 8;
    });

    return buffer;
  }

  static async canvasesToTiff(canvases: HTMLCanvasElement[], dpi: number = 300): Promise<Blob> {
    if (canvases.length === 1) {
      // Single page TIFF
      return this.canvasToTiff(canvases[0], dpi);
    } else {
      // Multi-page TIFF
      return this.createMultiPageTiff(canvases);
    }
  }

  static async canvasToTiff(canvas: HTMLCanvasElement, dpi: number = 300): Promise<Blob> {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('No se pudo obtener el contexto del canvas');
    
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    return this.createMultiPageTiff([imageData]);
  }

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