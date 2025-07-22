const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const { PDFDocument } = require('pdf-lib');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, 'icon.png'),
    title: 'Procesador de Imágenes - Municipio La PAZ'
  });

  const isDev = process.env.NODE_ENV === 'development';
  
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// IPC Handlers para procesamiento de archivos
ipcMain.handle('select-files', async (event, options) => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile', 'multiSelections'],
    filters: options.filters
  });
  
  if (!result.canceled) {
    return result.filePaths.map(filePath => ({
      path: filePath,
      name: path.basename(filePath),
      size: fs.statSync(filePath).size
    }));
  }
  return [];
});

ipcMain.handle('save-file', async (event, defaultPath) => {
  const result = await dialog.showSaveDialog(mainWindow, {
    defaultPath: defaultPath,
    filters: [
      { name: 'TIFF Files', extensions: ['tiff', 'tif'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  });
  
  return result.filePath;
});

ipcMain.handle('combine-pdfs', async (event, filePaths) => {
  try {
    console.log(`Combinando ${filePaths.length} archivos PDF`);
    
    const mergedPdf = await PDFDocument.create();
    
    for (const filePath of filePaths) {
      console.log(`Procesando: ${filePath}`);
      const pdfBytes = fs.readFileSync(filePath);
      const pdf = await PDFDocument.load(pdfBytes);
      
      const pageIndices = pdf.getPageIndices();
      const pages = await mergedPdf.copyPages(pdf, pageIndices);
      
      pages.forEach((page) => mergedPdf.addPage(page));
      console.log(`Añadidas ${pageIndices.length} páginas de ${path.basename(filePath)}`);
    }
    
    const pdfBytes = await mergedPdf.save();
    console.log(`PDFs combinados exitosamente: ${pdfBytes.length} bytes`);
    
    return Array.from(pdfBytes);
  } catch (error) {
    console.error('Error combinando PDFs:', error);
    throw error;
  }
});

ipcMain.handle('pdf-to-images', async (event, pdfData, dpi = 300) => {
  try {
    console.log(`Convirtiendo PDF a imágenes con ${dpi} DPI`);
    
    // Crear archivo temporal
    const tempDir = path.join(__dirname, '../temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    const tempPdfPath = path.join(tempDir, `temp_${Date.now()}.pdf`);
    fs.writeFileSync(tempPdfPath, Buffer.from(pdfData));
    
    // Usar pdf-poppler para convertir PDF a imágenes
    const pdf2pic = require('pdf-poppler');
    const options = {
      format: 'png',
      out_dir: tempDir,
      out_prefix: `page_${Date.now()}`,
      page: null, // Convertir todas las páginas
      density: dpi
    };
    
    const pages = await pdf2pic.convert(tempPdfPath, options);
    console.log(`PDF convertido a ${pages.length} imágenes`);
    
    // Leer las imágenes generadas
    const imageBuffers = [];
    for (let i = 0; i < pages.length; i++) {
      const imagePath = pages[i].path;
      const imageBuffer = fs.readFileSync(imagePath);
      imageBuffers.push(Array.from(imageBuffer));
      
      // Limpiar archivo temporal
      fs.unlinkSync(imagePath);
    }
    
    // Limpiar PDF temporal
    fs.unlinkSync(tempPdfPath);
    
    return imageBuffers;
  } catch (error) {
    console.error('Error convirtiendo PDF a imágenes:', error);
    throw error;
  }
});

ipcMain.handle('create-multipage-tiff', async (event, imageBuffers, options) => {
  try {
    console.log(`Creando TIFF multipágina con ${imageBuffers.length} páginas`);
    
    const { dpi = 300, grayscale = false } = options;
    
    // Procesar cada imagen
    const processedImages = [];
    for (let i = 0; i < imageBuffers.length; i++) {
      console.log(`Procesando imagen ${i + 1}/${imageBuffers.length}`);
      
      let image = sharp(Buffer.from(imageBuffers[i]));
      
      // Aplicar escala de grises si está habilitado
      if (grayscale) {
        image = image.greyscale();
      }
      
      // Establecer DPI
      image = image.withMetadata({
        density: dpi
      });
      
      const processedBuffer = await image.tiff({
        compression: 'none',
        xres: dpi / 25.4, // Convertir DPI a píxeles por mm
        yres: dpi / 25.4
      }).toBuffer();
      
      processedImages.push(processedBuffer);
    }
    
    // Combinar todas las imágenes en un TIFF multipágina usando Sharp
    let combinedTiff;
    if (processedImages.length === 1) {
      combinedTiff = processedImages[0];
    } else {
      // Para múltiples páginas, crear un TIFF con todas las páginas
      // Sharp no soporta TIFF multipágina directamente, así que las combinamos verticalmente
      const images = await Promise.all(
        processedImages.map(buffer => sharp(buffer).png().toBuffer())
      );
      
      // Obtener dimensiones de todas las imágenes
      const metadata = await Promise.all(
        images.map(buffer => sharp(buffer).metadata())
      );
      
      const maxWidth = Math.max(...metadata.map(m => m.width));
      const totalHeight = metadata.reduce((sum, m) => sum + m.height, 0);
      
      console.log(`Combinando imágenes: ${maxWidth}x${totalHeight}`);
      
      // Crear imagen combinada
      const combinedImage = sharp({
        create: {
          width: maxWidth,
          height: totalHeight,
          channels: grayscale ? 1 : 3,
          background: { r: 255, g: 255, b: 255 }
        }
      });
      
      const composite = [];
      let top = 0;
      
      for (let i = 0; i < images.length; i++) {
        const left = Math.floor((maxWidth - metadata[i].width) / 2);
        composite.push({
          input: images[i],
          top: top,
          left: left
        });
        top += metadata[i].height;
      }
      
      combinedTiff = await combinedImage
        .composite(composite)
        .tiff({
          compression: 'none',
          xres: dpi / 25.4,
          yres: dpi / 25.4
        })
        .toBuffer();
    }
    
    console.log(`TIFF multipágina creado exitosamente: ${combinedTiff.length} bytes`);
    return Array.from(combinedTiff);
    
  } catch (error) {
    console.error('Error creando TIFF multipágina:', error);
    throw error;
  }
});

ipcMain.handle('process-tiff-file', async (event, filePath, options) => {
  try {
    console.log(`Procesando archivo TIFF: ${filePath}`);
    
    const { dpi = 300, grayscale = true } = options;
    
    let image = sharp(filePath);
    
    // Aplicar escala de grises si está habilitado
    if (grayscale) {
      image = image.greyscale();
    }
    
    // Establecer DPI y crear TIFF
    const processedBuffer = await image
      .withMetadata({
        density: dpi
      })
      .tiff({
        compression: 'none',
        xres: dpi / 25.4,
        yres: dpi / 25.4
      })
      .toBuffer();
    
    console.log(`TIFF procesado exitosamente: ${processedBuffer.length} bytes`);
    return Array.from(processedBuffer);
    
  } catch (error) {
    console.error('Error procesando TIFF:', error);
    throw error;
  }
});

ipcMain.handle('write-file', async (event, filePath, data) => {
  try {
    fs.writeFileSync(filePath, Buffer.from(data));
    console.log(`Archivo guardado: ${filePath}`);
    return true;
  } catch (error) {
    console.error('Error guardando archivo:', error);
    throw error;
  }
});