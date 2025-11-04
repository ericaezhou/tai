/**
 * PDF to Image Conversion using PyMuPDF (via Docker)
 *
 * This module uses PyMuPDF (fitz) running in the OCR Docker container
 * to properly render PDF pages to images. This solves the pdfjs-dist
 * rendering issues in Node.js environments.
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

const execAsync = promisify(exec);

export interface PDFToImageOptions {
  dpi?: number;           // Resolution (default: 300)
  format?: 'png' | 'jpeg';
}

/**
 * Convert PDF buffer to array of image buffers using PyMuPDF in Docker
 */
export async function pdfToImagesPython(
  pdfBuffer: Buffer,
  options: PDFToImageOptions = {}
): Promise<Buffer[]> {
  const { dpi = 300, format = 'png' } = options;

  // Create temp directory for this conversion
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'pdf-convert-'));
  const pdfPath = path.join(tmpDir, 'input.pdf');
  const outputDir = path.join(tmpDir, 'output');

  try {
    // Write PDF to temp file
    await fs.writeFile(pdfPath, pdfBuffer);
    await fs.mkdir(outputDir, { recursive: true });

    // Python script for conversion
    const pythonScript = `
import sys
import fitz  # PyMuPDF
import os

def convert_pdf(pdf_path, output_dir, dpi, output_format):
    try:
        doc = fitz.open(pdf_path)
        zoom = dpi / 72
        mat = fitz.Matrix(zoom, zoom)

        for page_num in range(doc.page_count):
            page = doc[page_num]
            pix = page.get_pixmap(matrix=mat, alpha=False)

            output_file = os.path.join(output_dir, f'page_{page_num + 1}.{output_format}')

            if output_format == 'png':
                pix.save(output_file)
            elif output_format in ['jpg', 'jpeg']:
                pix.save(output_file, jpg_quality=95)

        doc.close()
        print(f'SUCCESS:{doc.page_count}')
    except Exception as e:
        print(f'ERROR:{str(e)}', file=sys.stderr)
        sys.exit(1)

if __name__ == '__main__':
    pdf_path = sys.argv[1]
    output_dir = sys.argv[2]
    dpi = int(sys.argv[3])
    output_format = sys.argv[4]
    convert_pdf(pdf_path, output_dir, dpi, output_format)
`;

    // Save Python script to temp file
    const scriptPath = path.join(tmpDir, 'convert.py');
    await fs.writeFile(scriptPath, pythonScript);

    // Run conversion in Docker container
    const dockerCommand = `docker exec ocr-paddleocr python3 - <<'EOFPYTHON'
${pythonScript}
EOFPYTHON`;

    // Execute via docker exec with mounted volume
    const containerTmpDir = `/tmp/pdf-convert-${Date.now()}`;
    const commands = [
      // Copy files into container
      `docker cp "${pdfPath}" ocr-paddleocr:${containerTmpDir}-input.pdf`,
      // Run conversion
      `docker exec ocr-paddleocr python3 -c "${pythonScript.replace(/"/g, '\\"')}" ${containerTmpDir}-input.pdf ${containerTmpDir}-output ${dpi} ${format}`,
      // Copy output back
      `docker cp ocr-paddleocr:${containerTmpDir}-output/. "${outputDir}/"`,
      // Cleanup container files
      `docker exec ocr-paddleocr rm -rf ${containerTmpDir}-input.pdf ${containerTmpDir}-output`
    ].join(' && ');

    const { stdout, stderr } = await execAsync(commands, {
      maxBuffer: 50 * 1024 * 1024, // 50MB buffer
      timeout: 120000 // 2 minute timeout
    });

    if (stderr && !stderr.includes('SUCCESS:')) {
      throw new Error(`PDF conversion failed: ${stderr}`);
    }

    // Read converted images
    const files = await fs.readdir(outputDir);
    const imageFiles = files
      .filter(f => f.startsWith('page_') && (f.endsWith('.png') || f.endsWith('.jpg') || f.endsWith('.jpeg')))
      .sort((a, b) => {
        const numA = parseInt(a.match(/\d+/)?.[0] || '0');
        const numB = parseInt(b.match(/\d+/)?.[0] || '0');
        return numA - numB;
      });

    if (imageFiles.length === 0) {
      throw new Error('No images were generated from PDF');
    }

    // Read all images into buffers
    const images: Buffer[] = [];
    for (const file of imageFiles) {
      const imagePath = path.join(outputDir, file);
      const imageBuffer = await fs.readFile(imagePath);
      images.push(imageBuffer);
    }

    return images;

  } finally {
    // Cleanup temp directory
    try {
      await fs.rm(tmpDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
      console.warn(`Failed to cleanup temp directory: ${tmpDir}`);
    }
  }
}

/**
 * Get PDF page count
 */
export async function getPDFPageCountPython(pdfBuffer: Buffer): Promise<number> {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'pdf-count-'));
  const pdfPath = path.join(tmpDir, 'input.pdf');

  try {
    await fs.writeFile(pdfPath, pdfBuffer);

    const containerTmpPath = `/tmp/pdf-count-${Date.now()}.pdf`;
    const commands = [
      `docker cp "${pdfPath}" ocr-paddleocr:${containerTmpPath}`,
      `docker exec ocr-paddleocr python3 -c "import fitz; doc = fitz.open('${containerTmpPath}'); print(doc.page_count); doc.close()"`,
      `docker exec ocr-paddleocr rm ${containerTmpPath}`
    ].join(' && ');

    const { stdout } = await execAsync(commands);
    const pageCount = parseInt(stdout.trim());

    if (isNaN(pageCount) || pageCount < 1) {
      throw new Error(`Invalid page count: ${stdout}`);
    }

    return pageCount;

  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true });
  }
}
