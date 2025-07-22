# Procesador de Imágenes - Municipio La PAZ

Una aplicación de escritorio desarrollada con Electron para procesar archivos TIFF y convertir documentos PDF a formato TIFF multipágina.

## Características

- **Procesamiento de archivos TIFF**: Convierte imágenes TIFF a escala de grises con resolución personalizable
- **Conversión PDF a TIFF**: Transforma documentos PDF en archivos TIFF multipágina
- **Combinación de PDFs**: Combina múltiples archivos PDF antes de convertir a TIFF
- **Procesamiento nativo**: Utiliza librerías nativas de Node.js para máximo rendimiento
- **Interfaz intuitiva**: Diseño moderno y fácil de usar

## Requisitos del Sistema

- Windows 10 o superior
- 4 GB de RAM mínimo
- 500 MB de espacio libre en disco

## Instalación

### Para Usuarios

1. Descarga el instalador desde la sección de releases
2. Ejecuta el archivo `.exe` descargado
3. Sigue las instrucciones del instalador
4. La aplicación se instalará automáticamente

### Para Desarrolladores

```bash
# Clonar el repositorio
git clone [URL_DEL_REPOSITORIO]
cd procesador-imagenes

# Instalar dependencias
npm install

# Ejecutar en modo desarrollo
npm run electron-dev

# Construir la aplicación
npm run build-electron

# Crear instalador para Windows
npm run dist
```

## Uso

### Procesamiento de Archivos TIFF

1. Abre la aplicación
2. Ve a "Procesar TIFF" en el menú lateral
3. Configura las opciones de procesamiento:
   - Resolución (150, 300, 600 DPI)
   - Calidad (Alta, Media, Baja)
   - Conversión a escala de grises
4. Selecciona los archivos TIFF a procesar
5. Haz clic en "Procesar archivos"
6. Descarga los archivos procesados

### Conversión PDF a TIFF

1. Ve a "Convertir PDF" en el menú lateral
2. Configura las opciones:
   - Resolución (150, 300, 600, 1200 DPI)
   - Calidad de conversión
   - Conversión a escala de grises
   - Combinar múltiples PDF (opcional)
3. Selecciona los archivos PDF
4. Haz clic en "Convertir archivos"
5. Descarga el archivo TIFF multipágina resultante

## Tecnologías Utilizadas

- **Electron**: Framework para aplicaciones de escritorio
- **React**: Interfaz de usuario
- **TypeScript**: Lenguaje de programación
- **Tailwind CSS**: Estilos y diseño
- **Sharp**: Procesamiento de imágenes nativo
- **PDF-lib**: Manipulación de archivos PDF
- **PDF-Poppler**: Conversión de PDF a imágenes

## Estructura del Proyecto

```
procesador-imagenes/
├── public/
│   ├── electron.js          # Proceso principal de Electron
│   ├── preload.js           # Script de preload
│   └── icon.ico             # Icono de la aplicación
├── src/
│   ├── components/          # Componentes React
│   ├── utils/              # Utilidades y procesadores
│   └── types/              # Definiciones de tipos
├── package.json            # Configuración del proyecto
└── README.md              # Este archivo
```

## Scripts Disponibles

- `npm run dev`: Ejecuta la aplicación web en modo desarrollo
- `npm run electron-dev`: Ejecuta la aplicación Electron en modo desarrollo
- `npm run build`: Construye la aplicación web
- `npm run build-electron`: Construye la aplicación Electron
- `npm run dist`: Crea el instalador para Windows

## Configuración de Construcción

La aplicación está configurada para generar:
- Instalador NSIS para Windows
- Accesos directos en escritorio y menú inicio
- Instalación personalizable por el usuario

## Soporte

Para reportar problemas o solicitar nuevas características, contacta al equipo de desarrollo del Municipio La PAZ.

## Créditos

Desarrollado por Uriel Carmona para el Municipio La PAZ.

## Licencia

Este software es propiedad del Municipio La PAZ. Todos los derechos reservados.