// PDF to Image Conversion
// Converts PDF pages to images for OCR processing
//
// Uses PyMuPDF (fitz) via Docker for reliable PDF rendering.
// The pdfjs-dist library has issues rendering text in Node.js environments.

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

const execAsync = promisify(exec);

export interface PDFToImageOptions {
  dpi?: number;           // Resolution (default: 300)
  format?: 'png' | 'jpeg';
  quality?: number;       // JPEG quality (1-100) - not used with PyMuPDF
  pages?: number[];       // Specific pages to convert (default: all)
}

/**
 * Convert PDF buffer to array of image buffers using PyMuPDF via Docker
 * Each buffer represents one page
 */
export async function pdfToImages(
  pdfBuffer: Buffer,
  options: PDFToImageOptions = {}
): Promise<Buffer[]> {
  const {
    dpi = 300,
    format = 'png',
    pages
  } = options;

  // Create temp directory for this conversion
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'pdf-convert-'));
  const pdfPath = path.join(tmpDir, 'input.pdf');
  const outputDir = path.join(tmpDir, 'output');

  try {
    // Write PDF to temp file
    await fs.writeFile(pdfPath, pdfBuffer);
    await fs.mkdir(outputDir, { recursive: true });

    // Get total page count first
    const containerPdfPath = `/tmp/pdf-${Date.now()}.pdf`;
    await execAsync(`docker cp "${pdfPath}" ocr-paddleocr:${containerPdfPath}`);

    const { stdout: pageCountOutput } = await execAsync(
      `docker exec ocr-paddleocr python3 -c "import fitz; doc = fitz.open('${containerPdfPath}'); print(doc.page_count); doc.close()"`
    );
    const totalPages = parseInt(pageCountOutput.trim());

    // Determine which pages to process
    const pagesToProcess = pages || Array.from({ length: totalPages }, (_, i) => i + 1);

    // Python script for conversion with selective page processing
    const pageList = pagesToProcess.join(',');
    const pythonScript = `
import fitz
import sys

try:
    doc = fitz.open('${containerPdfPath}')
    pages_to_convert = [${pageList}]
    zoom = ${dpi} / 72
    mat = fitz.Matrix(zoom, zoom)

    for page_num in pages_to_convert:
        if page_num < 1 or page_num > doc.page_count:
            continue
        page = doc[page_num - 1]  # 0-indexed
        pix = page.get_pixmap(matrix=mat, alpha=False)
        output_path = f'/tmp/page_{page_num}.${format}'
        pix.save(output_path)

    doc.close()
    print('SUCCESS')
except Exception as e:
    print(f'ERROR: {e}', file=sys.stderr)
    sys.exit(1)
`;

    // Run conversion in container
    const { stderr } = await execAsync(
      `docker exec ocr-paddleocr python3 -c '${pythonScript.replace(/'/g, "'\\''")}'`
    );

    if (stderr && !stderr.includes('SUCCESS')) {
      throw new Error(`PDF conversion failed: ${stderr}`);
    }

    // Copy images back from container
    const images: Buffer[] = [];
    for (const pageNum of pagesToProcess) {
      try {
        const ext = format === 'png' ? 'png' : format;
        const containerImgPath = `/tmp/page_${pageNum}.${ext}`;
        const localImgPath = path.join(outputDir, `page_${pageNum}.${ext}`);

        await execAsync(`docker cp ocr-paddleocr:${containerImgPath} "${localImgPath}"`);
        const imageBuffer = await fs.readFile(localImgPath);
        images.push(imageBuffer);

        // Cleanup container file
        await execAsync(`docker exec ocr-paddleocr rm -f ${containerImgPath}`).catch(() => {});
      } catch (error) {
        console.warn(`Failed to retrieve page ${pageNum}:`, error instanceof Error ? error.message : String(error));
      }
    }

    // Cleanup container PDF
    await execAsync(`docker exec ocr-paddleocr rm -f ${containerPdfPath}`).catch(() => {});

    if (images.length === 0) {
      throw new Error('No images were generated from PDF');
    }

    return images;

  } catch (error) {
    throw new Error(`PDF to image conversion failed: ${error instanceof Error ? error.message : String(error)}`);
  } finally {
    // Cleanup temp directory
    try {
      await fs.rm(tmpDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
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
 * Get number of pages in PDF using PyMuPDF via Docker
 */
export async function getPDFPageCount(pdfBuffer: Buffer): Promise<number> {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'pdf-count-'));
  const pdfPath = path.join(tmpDir, 'input.pdf');

  try {
    await fs.writeFile(pdfPath, pdfBuffer);

    const containerPdfPath = `/tmp/pdf-count-${Date.now()}.pdf`;
    await execAsync(`docker cp "${pdfPath}" ocr-paddleocr:${containerPdfPath}`);

    const { stdout } = await execAsync(
      `docker exec ocr-paddleocr python3 -c "import fitz; doc = fitz.open('${containerPdfPath}'); print(doc.page_count); doc.close()"`
    );

    // Cleanup
    await execAsync(`docker exec ocr-paddleocr rm -f ${containerPdfPath}`).catch(() => {});

    const pageCount = parseInt(stdout.trim());
    if (isNaN(pageCount) || pageCount < 1) {
      throw new Error(`Invalid page count: ${stdout}`);
    }

    return pageCount;
  } catch (error) {
    throw new Error(`Failed to get PDF page count: ${error instanceof Error ? error.message : String(error)}`);
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
  }
}
