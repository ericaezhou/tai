// PDF to Image Conversion
// Converts PDF pages to images for OCR processing

import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import { createCanvas, Image } from 'canvas';
import sharp from 'sharp';

// NodeCanvasFactory for PDF.js to create canvas instances in Node.js
// This is required for PDFs that contain embedded images
class NodeCanvasFactory {
  create(width: number, height: number) {
    const canvas = createCanvas(width, height);
    const context = canvas.getContext('2d');
    return { canvas, context };
  }

  reset(canvasAndContext: any, width: number, height: number) {
    canvasAndContext.canvas.width = width;
    canvasAndContext.canvas.height = height;
  }

  destroy(canvasAndContext: any) {
    canvasAndContext.canvas.width = 0;
    canvasAndContext.canvas.height = 0;
    canvasAndContext.canvas = null;
    canvasAndContext.context = null;
  }
}

// PDF.js worker configuration:
// Workers are disabled via the disableWorker: true flag in getDocument() calls below.
// This is the proper way to use PDF.js in Node.js server environments.

export interface PDFToImageOptions {
  dpi?: number;           // Resolution (default: 300)
  format?: 'png' | 'jpeg';
  quality?: number;       // JPEG quality (1-100)
  pages?: number[];       // Specific pages to convert (default: all)
}

/**
 * Convert PDF buffer to array of image buffers
 * Each buffer represents one page
 */
export async function pdfToImages(
  pdfBuffer: Buffer,
  options: PDFToImageOptions = {}
): Promise<Buffer[]> {
  const {
    dpi = 300,
    format = 'png',
    quality = 95,
    pages
  } = options;

  try {
    // Load PDF document with worker disabled and CanvasFactory
    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(pdfBuffer),
      useWorkerFetch: false,
      isEvalSupported: false,
      useSystemFonts: true,
      disableWorker: true,  // Explicitly disable worker for server-side
      verbosity: 0,  // Reduce console noise
      // Additional options to prevent worker usage
      standardFontDataUrl: undefined,
      cMapUrl: undefined,
      // Provide CanvasFactory for Node.js environment (required for PDFs with embedded images)
      CanvasFactory: NodeCanvasFactory,
    });

    const pdf = await loadingTask.promise;
    const images: Buffer[] = [];

    // Determine which pages to process
    const totalPages = pdf.numPages;
    const pagesToProcess = pages || Array.from({ length: totalPages }, (_, i) => i + 1);

    for (const pageNum of pagesToProcess) {
      if (pageNum < 1 || pageNum > totalPages) {
        console.warn(`Page ${pageNum} out of range (1-${totalPages}), skipping`);
        continue;
      }

      const page = await pdf.getPage(pageNum);

      // Calculate scale based on DPI (72 DPI is default PDF resolution)
      const scale = dpi / 72;
      const viewport = page.getViewport({ scale });

      // Create canvas
      const canvas = createCanvas(viewport.width, viewport.height);
      const context = canvas.getContext('2d');

      // Fill with white background
      context.fillStyle = 'white';
      context.fillRect(0, 0, viewport.width, viewport.height);

      // Render PDF page to canvas
      await page.render({
        canvasContext: context as any,
        viewport: viewport
      }).promise;

      // Convert canvas to buffer
      let buffer = canvas.toBuffer('image/png');

      // Process with sharp for better quality/compression
      if (format === 'jpeg') {
        buffer = await sharp(buffer)
          .jpeg({ quality, mozjpeg: true })
          .toBuffer();
      } else {
        buffer = await sharp(buffer)
          .png({ compressionLevel: 6, adaptiveFiltering: true })
          .toBuffer();
      }

      images.push(buffer);
    }

    return images;

  } catch (error) {
    throw new Error(`PDF to image conversion failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Convert single PDF page to image
 */
export async function pdfPageToImage(
  pdfBuffer: Buffer,
  pageNumber: number,
  options: PDFToImageOptions = {}
): Promise<Buffer> {
  const images = await pdfToImages(pdfBuffer, {
    ...options,
    pages: [pageNumber]
  });

  if (images.length === 0) {
    throw new Error(`Could not convert page ${pageNumber} to image`);
  }

  return images[0];
}

/**
 * Get number of pages in PDF
 */
export async function getPDFPageCount(pdfBuffer: Buffer): Promise<number> {
  try {
    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(pdfBuffer),
      useWorkerFetch: false,
      isEvalSupported: false,
      disableWorker: true,
      verbosity: 0,
      standardFontDataUrl: undefined,
      cMapUrl: undefined,
      // Provide CanvasFactory for Node.js environment (required for PDFs with embedded images)
      CanvasFactory: NodeCanvasFactory,
    });

    const pdf = await loadingTask.promise;
    return pdf.numPages;
  } catch (error) {
    throw new Error(`Failed to get PDF page count: ${error instanceof Error ? error.message : String(error)}`);
  }
}
