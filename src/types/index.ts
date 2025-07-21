export interface ProcessedFile {
  id: string;
  originalName: string;
  processedName: string;
  type: 'tiff' | 'pdf';
  status: 'processing' | 'completed' | 'error';
  downloadUrl?: string;
  size: number;
}

export interface ProcessingOptions {
  dpi: number;
  grayscale: boolean;
  quality: 'high' | 'medium' | 'low';
}