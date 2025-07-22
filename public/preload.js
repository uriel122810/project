const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  selectFiles: (options) => ipcRenderer.invoke('select-files', options),
  saveFile: (defaultPath) => ipcRenderer.invoke('save-file', defaultPath),
  combinePdfs: (filePaths) => ipcRenderer.invoke('combine-pdfs', filePaths),
  pdfToImages: (pdfData, dpi) => ipcRenderer.invoke('pdf-to-images', pdfData, dpi),
  createMultipageTiff: (imageBuffers, options) => ipcRenderer.invoke('create-multipage-tiff', imageBuffers, options),
  processTiffFile: (filePath, options) => ipcRenderer.invoke('process-tiff-file', filePath, options),
  writeFile: (filePath, data) => ipcRenderer.invoke('write-file', filePath, data)
});