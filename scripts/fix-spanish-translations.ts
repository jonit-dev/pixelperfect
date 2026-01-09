#!/usr/bin/env tsx
/**
 * Script to fix Spanish translations in format-scale.json
 * This script identifies English content and translates it to Spanish
 */

interface UseCase {
  title: string;
  description: string;
  example: string;
}

interface PageData {
  slug: string;
  title: string;
  formatDescription?: string;
  useCases?: UseCase[];
  [key: string]: any;
}

interface TranslationFile {
  pages: PageData[];
}

// Translation mappings for common English phrases to Spanish
const translations: Record<string, string> = {
  // Format descriptions
  "PNG format achieves professional-quality enhancement with 4X scaling while maintaining its lossless characteristics and transparency.":
    "El formato PNG logra mejora de calidad profesional con escalado 4X mientras mantiene sus características sin pérdida y transparencia.",

  "PNG format receives dramatic quality improvement with 4X scaling while maintaining superior compression compared to WebP.":
    "El formato PNG recibe una mejora dramática de calidad con escalado 4X mientras mantiene una compresión superior comparado con WebP.",

  "WebP format receives dramatic quality improvement with 4X scaling while maintaining superior compression compared to WebP.":
    "El formato WebP recibe una mejora dramática de calidad con escalado 4X mientras mantiene una compresión superior comparado con formatos tradicionales.",

  "WebP format achieves maximum quality enhancement with 8X scaling while maintaining superior compression compared to traditional formats.":
    "El formato WebP logra mejora máxima de calidad con escalado 8X mientras mantiene una compresión superior comparado con formatos tradicionales.",

  "WebP format at extreme limits with 16X scaling for specialized applications requiring absolute maximum resolution with web efficiency.":
    "El formato WebP en sus límites extremos con escalado 16X para aplicaciones especializadas que requieren resolución máxima absoluta con eficiencia web.",

  "HEIC is Apple's modern image format offering excellent compression. Our AI upscaler works perfectly with HEIC while preserving quality.":
    "HEIC es el formato de imagen moderno de Apple que ofrece excelente compresión. Nuestro escalador IA funciona perfectamente con HEIC mientras preserva la calidad.",

  "HEIC format receives dramatic quality improvement with 4X scaling while maintaining its excellent compression.":
    "El formato HEIC recibe una mejora dramática de calidad con escalado 4X mientras mantiene su excelente compresión.",

  "HEIC format achieves maximum quality enhancement with 8X scaling for specialized applications.":
    "El formato HEIC logra mejora máxima de calidad con escalado 8X para aplicaciones especializadas.",

  "HEIC format at extreme limits with 16X scaling for specialized applications requiring absolute maximum resolution.":
    "El formato HEIC en sus límites extremos con escalado 16X para aplicaciones especializadas que requieren resolución máxima absoluta.",

  "RAW format from professional cameras contains maximum image data. Our AI upscaler preserves this quality during 2X enhancement.":
    "El formato RAW de cámaras profesionales contiene datos de imagen máximos. Nuestro escalador IA preserva esta calidad durante la mejora 2X.",

  "RAW format achieves maximum quality enhancement with 4X scaling, utilizing complete image data from professional cameras.":
    "El formato RAW logra mejora máxima de calidad con escalado 4X, utilizando datos de imagen completos de cámaras profesionales.",

  "RAW format achieves maximum quality enhancement with 8X scaling, pushing the boundaries of professional photography.":
    "El formato RAW logra mejora máxima de calidad con escalado 8X, empujando los límites de la fotografía profesional.",

  "RAW format at extreme limits with 16X scaling for specialized applications requiring absolute maximum resolution.":
    "El formato RAW en sus límites extremos con escalado 16X para aplicaciones especializadas que requieren resolución máxima absoluta.",

  "TIFF is the industry standard for professional imaging and print workflows. Our AI upscaler maintains lossless quality during 2X scaling.":
    "TIFF es el estándar de la industria para imágenes profesionales y flujos de trabajo de impresión. Nuestro escalador IA mantiene calidad sin pérdida durante el escalado 2X.",

  "TIFF format achieves maximum quality with 4X scaling while maintaining lossless characteristics for professional applications.":
    "El formato TIFF logra calidad máxima con escalado 4X mientras mantiene características sin pérdida para aplicaciones profesionales.",

  "TIFF format pushed to maximum quality with 8X scaling while maintaining lossless characteristics for demanding professional applications.":
    "El formato TIFF llevado a calidad máxima con escalado 8X mientras mantiene características sin pérdida para aplicaciones profesionales exigentes.",

  "TIFF format at extreme limits with 16X scaling for specialized applications requiring absolute maximum resolution with lossless quality.":
    "El formato TIFF en sus límites extremos con escalado 16X para aplicaciones especializadas que requieren resolución máxima absoluta con calidad sin pérdida.",

  "BMP is the Windows bitmap format supporting uncompressed images. Our AI upscaler enhances BMP quality during 2X scaling.":
    "BMP es el formato de mapa de bits de Windows que soporta imágenes sin comprimir. Nuestro escalador IA mejora la calidad BMP durante el escalado 2X.",

  "BMP format receives significant quality improvement with 4X scaling.":
    "El formato BMP recibe una mejora significativa de calidad con escalado 4X.",

  "BMP format achieves maximum quality enhancement with 8X scaling.":
    "El formato BMP logra mejora máxima de calidad con escalado 8X.",

  "BMP format at extreme limits with 16X scaling for specialized applications.":
    "El formato BMP en sus límites extremos con escalado 16X para aplicaciones especializadas.",

  "AVIF is the next-generation image format offering superior compression and quality. Our AI upscaler works excellently with AVIF format.":
    "AVIF es el formato de imagen de próxima generación que ofrece compresión y calidad superiores. Nuestro escalador IA funciona excelentemente bien con el formato AVIF.",

  "AVIF format receives dramatic quality improvement with 4X scaling while maintaining superior compression characteristics.":
    "El formato AVIF recibe una mejora dramática de calidad con escalado 4X mientras mantiene características de compresión superiores.",

  "AVIF format achieves maximum quality enhancement with 8X scaling while maintaining superior compression.":
    "El formato AVIF logra mejora máxima de calidad con escalado 8X mientras mantiene una compresión superior.",

  "AVIF format at extreme limits with 16X scaling for specialized applications.":
    "El formato AVIF en sus límites extremos con escalado 16X para aplicaciones especializadas.",

  "GIF is ideal for simple graphics and images with limited colors. Our AI upscaler enhances GIF quality during 2X scaling.":
    "GIF es ideal para gráficos simples e imágenes con colores limitados. Nuestro escalador IA mejora la calidad GIF durante el escalado 2X.",

  "JPEG format pushed to its limits with 16X scaling for specialized applications requiring extreme enlargement.":
    "El formato JPEG llevado a sus límites con escalado 16X para aplicaciones especializadas que requieren agrandamiento extremo.",

  "PNG supports lossless compression and transparency. Our AI upscaler maintains perfect alpha channel transparency during 2X scaling.":
    "PNG soporta compresión sin pérdida y transparencia. Nuestro escalador IA mantiene una transparencia perfecta del canal alfa durante el escalado 2X.",

  "PNG format achieves professional-quality enhancement with 4X scaling while maintaining its lossless characteristics and transparency.":
    "El formato PNG logra mejora de calidad profesional con escalado 4X mientras mantiene sus características sin pérdida y transparencia.",

  "PNG format pushed to maximum quality with 8X scaling while maintaining transparency for demanding applications.":
    "El formato PNG llevado a calidad máxima con escalado 8X mientras mantiene transparencia para aplicaciones exigentes.",

  "PNG format at extreme limits with 16X scaling for specialized applications requiring absolute maximum resolution with transparency.":
    "El formato PNG en sus límites extremos con escalado 16X para aplicaciones especializadas que requieren resolución máxima absoluta con transparencia.",
};

// Use case translations
const useCaseTranslations: Record<string, {title: string; description: string; example: string}> = {
  "Professional Logo Scaling": {
    title: "Escalado Profesional de Logotipos",
    description: "Cuadruplica la resolución del logotipo para impresión de gran formato y pantallas.",
    example: "Cree archivos de logotipo masivos para vallas publicitarias y pancartas",
  },
  "High-End Web Graphics": {
    title: "Gráficos Web de Alta Gama",
    description: "Cree imágenes WebP de ultra alta resolución para experiencias web premium.",
    example: "Genere imágenes hero de 4X para sitios web de marcas de lujo",
  },
  "Product Photography": {
    title: "Fotografía de Productos",
    description: "Cuadruplica la resolución de la imagen del producto para zoom profundo con eficiencia WebP.",
    example: "Habilite zoom extremo en productos mientras mantiene tamaños de archivo manejables",
  },
  "Portfolio Websites": {
    title: "Sitios Web de Portafolio",
    description: "Mejora imágenes WebP a resolución 4K para portafolios de fotógrafos.",
    example: "Cree imágenes de portafolio impresionantes con optimización WebP",
  },
  "Digital Art Display": {
    title: "Visualización de Arte Digital",
    description: "Muestra arte digital a calidad máxima con la compresión eficiente de WebP.",
    example: "Muestra artwork a resolución 4X con tiempos de carga rápidos",
  },
  "Premium Web Experiences": {
    title: "Experiencias Web Premium",
    description: "Cree imágenes WebP de ultra alta resolución para sitios web de lujo.",
    example: "Genere imágenes AVIF de 4X para sitios web de marcas premium",
  },
  "iPhone Photo Enhancement": {
    title: "Mejora de Fotos iPhone",
    description: "Duplica la resolución de fotos iPhone para mejor calidad de visualización.",
    example: "Mejora fotos iPhone a 2x para pantallas retina",
  },
  "Apple Device Photos": {
    title: "Fotos de Dispositivos Apple",
    description: "Mejora la resolución de fotos de iPad y Mac con escalado 2X.",
    example: "Duplica fotos de iPad para mejor calidad",
  },
  "Web Preparation": {
    title: "Preparación Web",
    description: "Convierte y mejora HEIC a formatos amigables para web a 2X.",
    example: "Mejora fotos HEIC para uso web",
  },
  "Print iPhone Photos": {
    title: "Imprimir Fotos iPhone",
    description: "Crea versiones de calidad de impresión desde fotos HEIC de iPhone.",
    example: "Transforma fotos iPhone en impresiones de alta calidad",
  },
  "Professional Enhancement": {
    title: "Mejora Profesional",
    description: "Mejora fotos de dispositivos Apple a estándares profesionales.",
    example: "Escala fotos iPhone a 4K para uso profesional",
  },
  "Portfolio Quality": {
    title: "Calidad de Portafolio",
    description: "Mejora fotografía móvil a estándares de portafolio.",
    example: "Crea imágenes de calidad de portafolio desde fotos iPhone",
  },
  "Extreme iPhone Photo Enlargement": {
    title: "Agrandamiento Extremo de Fotos iPhone",
    description: "Cree impresiones masivas desde fotos HEIC de iPhone.",
    example: "Transforma fotos iPhone en impresiones de calidad de póster",
  },
  "Professional Mobile Photography": {
    title: "Fotografía Móvil Profesional",
    description: "Extrae calidad máxima del formato HEIC.",
    example: "Mejora fotos móviles a estándares profesionales",
  },
  "Specialized iPhone Photo Projects": {
    title: "Proyectos Especializados de Fotos iPhone",
    description: "Cree versiones de resolución extrema de fotos iPhone para aplicaciones únicas.",
    example: "Transforma fotos iPhone en resolución masiva para impresión especializada",
  },
  "Archival Mobile Photography": {
    title: "Fotografía Móvil de Archivo",
    description: "Preservación de resolución máxima de fotos HEIC de iPhone importantes.",
    example: "Cree versiones de archivo de fotos móviles significativas",
  },
  "Professional Photo Enhancement": {
    title: "Mejora de Fotos Profesionales",
    description: "Duplica la resolución de fotos RAW para aplicaciones profesionales.",
    example: "Mejora fotos RAW de DSLR a mayor resolución",
  },
  "Preparación para Impresión": {
    title: "Preparación para Impresión",
    description: "Escalado moderado de archivos RAW para impresión estándar.",
    example: "Prepara fotos RAW para impresiones de 8x10 pulgadas a 2X",
  },
  "Archive Enhancement": {
    title: "Mejora de Archivo",
    description: "Mejora archivos de fotos RAW mientras gestionas el almacenamiento.",
    example: "Duplica resolución de fotos RAW importantes",
  },
  "Impresión de Gran Formato": {
    title: "Impresión de Gran Formato",
    description: "Prepara fotos RAW para pósters e impresiones grandes.",
    example: "Transforma RAW de DSLR en impresiones de calidad de galería",
  },
  "Professional Exhibitions": {
    title: "Exposiciones Profesionales",
    description: "Mejora fotos RAW para visualización de galería y exposiciones.",
    example: "Cree impresiones de calidad de exhibición desde RAW",
  },
  "Commercial Photography": {
    title: "Fotografía Comercial",
    description: "Escala RAW para aplicaciones comerciales y de publicidad.",
    example: "Prepara fotos RAW para uso comercial de alta gama",
  },
  "Extreme Print Enlargement": {
    title: "Agrandamiento de Impresión Extremo",
    description: "Cree impresiones masivas desde fuentes RAW para aplicaciones especializadas.",
    example: "Transforma RAW de DSLR en impresiones de calidad de valla publicitaria",
  },
  "Fine Art Printing": {
    title: "Impresión de Arte Fine",
    description: "Prepara RAW para impresiones de arte fine de ultra gran tamaño.",
    example: "Cree impresiones de calidad de museo desde fuentes RAW",
  },
  "Commercial Mega-Prints": {
    title: "Mega-Impresiones Comerciales",
    description: "Genera impresiones masivas basadas en RAW para publicidad.",
    example: "Produce gráficos del tamaño de edificios desde RAW",
  },
  "Specialized Commercial Printing": {
    title: "Impresión Comercial Especializada",
    description: "Cree impresiones de resolución extrema para aplicaciones comerciales únicas.",
    example: "Genera gráficos del tamaño de edificios desde fuentes RAW",
  },
  "Fine Art Mega-Prints": {
    title: "Mega-Impresiones de Arte Fine",
    description: "Produzca impresiones de arte fine de ultra gran tamaño desde RAW.",
    example: "Cree impresiones del tamaño de galería desde RAW más pequeño",
  },
  "Archival Projects": {
    title: "Proyectos de Archivo",
    description: "Preservación de resolución máxima de fotografías RAW importantes.",
    example: "Cree versiones de archivo de imágenes RAW históricas",
  },
  "Specialized Mega-Printing": {
    title: "Mega-Impresión Especializada",
    description: "Cree TIFF de resolución extrema para aplicaciones de impresión únicas.",
    example: "Genera gráficos del tamaño de edificios desde TIFF",
  },
  "Specialized Archival": {
    title: "Archivo Especializado",
    description: "Preservación de resolución máxima de imágenes BMP importantes.",
    example: "Cree versiones de archivo BMP de resolución máxima",
  },
  "Next-Gen Web Enhancement": {
    title: "Mejora Web de Próxima Generación",
    description: "Duplica la resolución de imagen AVIF para experiencias web modernas.",
    example: "Mejora imágenes AVIF para sitios web de vanguardia",
  },
  "Progressive Enhancement": {
    title: "Mejora Progresiva",
    description: "Crea versiones AVIF 2X para orientación de navegadores modernos.",
    example: "Genera AVIF 2x para experiencias web de próxima generación",
  },
  "Future-Proof Content": {
    title: "Contenido a Prueba de Futuro",
    description: "Mejora imágenes AVIF para estándares web futuros.",
    example: "Prepara contenido AVIF para pantallas de próxima generación",
  },
  "Digital Art Portfolios": {
    title: "Portafolios de Arte Digital",
    description: "Muestra artwork a resolución extrema con eficiencia AVIF.",
    example: "Muestra arte digital a calidad 8K con compresión óptima",
  },
  "Ultra-Premium Web": {
    title: "Web Ultra Premium",
    description: "Cree AVIF de resolución máxima para experiencias web de lujo.",
    example: "Genera AVIF 8X para sitios web ultra premium",
  },
  "Specialized Digital Art": {
    title: "Arte Digital Especializado",
    description: "Cree AVIF de resolución extrema para aplicaciones únicas.",
    example: "Genera AVIF de resolución máxima para proyectos especializados",
  },
  "Graphics Enhancement": {
    title: "Mejora de Gráficos",
    description: "Duplica la resolución de gráficos GIF para mejor calidad de visualización.",
    example: "Mejora logotipos y gráficos GIF para pantallas modernas",
  },
  "Simple Image Scaling": {
    title: "Escalado Simple de Imágenes",
    description: "Mejora imágenes GIF simples con mejora 2X.",
    example: "Duplica resolución de íconos y gráficos simples",
  },
  "Legacy Graphics Modernization": {
    title: "Modernización de Gráficos Heredados",
    description: "Actualiza gráficos GIF antiguos para uso moderno.",
    example: "Moderniza gráficos GIF vintage a resolución 2X",
  },
  "Specialized Printing": {
    title: "Impresión Especializada",
    description: "Cree impresiones extremadamente grandes desde fuentes JPEG muy pequeñas.",
    example: "Transforma un JPEG de 1MP en una imagen de calidad de impresión de 16MP",
  },
  "Forensic Enhancement": {
    title: "Mejora Forense",
    description: "Extrae el máximo detalle posible de imágenes JPEG para análisis.",
    example: "Mejora JPEG de vigilancia o evidencia a resolución máxima",
  },
  "Archival Restoration": {
    title: "Restauración de Archivo",
    description: "Restaura y agrande imágenes JPEG históricas importantes.",
    example: "Cree versiones de resolución máxima de fotos JPEG de archivo",
  },
  "Research Applications": {
    title: "Aplicaciones de Investigación",
    description: "Aplicaciones especializadas que requieren mejora extrema de resolución JPEG.",
    example: "Mejora imágenes de investigación que requieren el máximo detalle posible",
  },
  "Logo Enhancement": {
    title: "Mejora de Logotipos",
    description: "Duplica la resolución del logotipo para pantallas de alto DPI mientras mantienes la transparencia.",
    example: "Transforma un logotipo de 200x200 en 400x400 para pantallas retina",
  },
  "UI Asset Scaling": {
    title: "Escalado de Activos de UI",
    description: "Aumenta la resolución de elementos de UI e íconos con transparencia.",
    example: "Escala íconos de aplicación de 64x64 a 128x128 para mejor calidad",
  },
  "Transparent Graphics": {
    title: "Gráficos Transparentes",
    description: "Mejora recortes de productos y superposiciones con resolución duplicada.",
    example: "Duplica resolución de imágenes de productos de comercio electrónico con fondos",
  },
  "Text and Icons": {
    title: "Texto e Íconos",
    description: "Duplica la resolución de gráficos con mucho texto mientras mantienes bordes nítidos.",
    example: "Mejora elementos de infografías para calidad de visualización 2x",
  },
};

console.log('Translation script initialized');
console.log('Total format description translations:', Object.keys(translations).length);
console.log('Total use case translations:', Object.keys(useCaseTranslations).length);
