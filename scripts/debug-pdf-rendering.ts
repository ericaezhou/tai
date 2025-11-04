/**
 * Debug PDF Rendering Issue
 *
 * Tests different approaches to PDF-to-image conversion
 */

import fs from 'fs';
import path from 'path';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import { createCanvas } from 'canvas';

// NodeCanvasFactory for PDF.js
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

async function debugPdfRendering(pdfPath: string) {
  console.log(`\n${'='.repeat(80)}`);
  console.log('🐛 PDF RENDERING DEBUG');
  console.log('='.repeat(80));
  console.log(`PDF: ${pdfPath}\n`);

  try {
    const pdfBuffer = fs.readFileSync(pdfPath);
    console.log(`✅ PDF loaded: ${(pdfBuffer.length / 1024).toFixed(2)} KB\n`);

    // Test 1: Load PDF with class-based CanvasFactory (current approach)
    console.log('TEST 1: Using CanvasFactory class');
    try {
      const loadingTask1 = pdfjsLib.getDocument({
        data: new Uint8Array(pdfBuffer),
        useWorkerFetch: false,
        isEvalSupported: false,
        useSystemFonts: true,
        disableWorker: true,
        verbosity: 0,
        canvasFactory: NodeCanvasFactory,
      });
      const pdf1 = await loadingTask1.promise;
      console.log(`✅ Loaded successfully with class: ${pdf1.numPages} pages`);

      const page1 = await pdf1.getPage(1);
      const scale1 = 300 / 72;
      const viewport1 = page1.getViewport({ scale: scale1 });
      const canvas1 = createCanvas(viewport1.width, viewport1.height);
      const context1 = canvas1.getContext('2d');

      context1.fillStyle = 'white';
      context1.fillRect(0, 0, viewport1.width, viewport1.height);

      await page1.render({
        canvasContext: context1 as any,
        viewport: viewport1
      }).promise;

      const buffer1 = canvas1.toBuffer('image/png');
      console.log(`✅ Rendered page 1 (class): ${buffer1.length} bytes\n`);
    } catch (error) {
      console.error(`❌ Test 1 failed:`, error instanceof Error ? error.message : String(error));
      console.log();
    }

    // Test 2: Load PDF with instance-based CanvasFactory
    console.log('TEST 2: Using CanvasFactory instance');
    try {
      const loadingTask2 = pdfjsLib.getDocument({
        data: new Uint8Array(pdfBuffer),
        useWorkerFetch: false,
        isEvalSupported: false,
        useSystemFonts: true,
        disableWorker: true,
        verbosity: 0,
        canvasFactory: new NodeCanvasFactory(),
      });
      const pdf2 = await loadingTask2.promise;
      console.log(`✅ Loaded successfully with instance: ${pdf2.numPages} pages`);

      const page2 = await pdf2.getPage(1);
      const scale2 = 300 / 72;
      const viewport2 = page2.getViewport({ scale: scale2 });
      const canvas2 = createCanvas(viewport2.width, viewport2.height);
      const context2 = canvas2.getContext('2d');

      context2.fillStyle = 'white';
      context2.fillRect(0, 0, viewport2.width, viewport2.height);

      await page2.render({
        canvasContext: context2 as any,
        viewport: viewport2
      }).promise;

      const buffer2 = canvas2.toBuffer('image/png');
      console.log(`✅ Rendered page 1 (instance): ${buffer2.length} bytes\n`);

      // Save this version
      const outputDir = path.join(process.cwd(), 'tmp', 'debug-renders');
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }
      const outputPath = path.join(outputDir, `${path.basename(pdfPath, '.pdf')}_page1_instance.png`);
      fs.writeFileSync(outputPath, buffer2);
      console.log(`💾 Saved to: ${outputPath}\n`);
    } catch (error) {
      console.error(`❌ Test 2 failed:`, error instanceof Error ? error.message : String(error));
      console.log();
    }

    // Test 3: Load PDF without CanvasFactory
    console.log('TEST 3: Without CanvasFactory');
    try {
      const loadingTask3 = pdfjsLib.getDocument({
        data: new Uint8Array(pdfBuffer),
        useWorkerFetch: false,
        isEvalSupported: false,
        useSystemFonts: true,
        disableWorker: true,
        verbosity: 0,
      });
      const pdf3 = await loadingTask3.promise;
      console.log(`✅ Loaded successfully without factory: ${pdf3.numPages} pages`);

      const page3 = await pdf3.getPage(1);
      const scale3 = 300 / 72;
      const viewport3 = page3.getViewport({ scale: scale3 });
      const canvas3 = createCanvas(viewport3.width, viewport3.height);
      const context3 = canvas3.getContext('2d');

      context3.fillStyle = 'white';
      context3.fillRect(0, 0, viewport3.width, viewport3.height);

      await page3.render({
        canvasContext: context3 as any,
        viewport: viewport3
      }).promise;

      const buffer3 = canvas3.toBuffer('image/png');
      console.log(`✅ Rendered page 1 (no factory): ${buffer3.length} bytes\n`);

      // Save this version
      const outputDir = path.join(process.cwd(), 'tmp', 'debug-renders');
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }
      const outputPath = path.join(outputDir, `${path.basename(pdfPath, '.pdf')}_page1_nofactory.png`);
      fs.writeFileSync(outputPath, buffer3);
      console.log(`💾 Saved to: ${outputPath}\n`);
    } catch (error) {
      console.error(`❌ Test 3 failed:`, error instanceof Error ? error.message : String(error));
      console.log();
    }

    console.log('='.repeat(80));
    console.log('✨ Debug complete!\n');

  } catch (error) {
    console.error(`\n❌ ERROR:`, error);
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);

  if (args.length < 1) {
    console.error('Usage: npx tsx scripts/debug-pdf-rendering.ts <pdf-path>');
    console.error('Example: npx tsx scripts/debug-pdf-rendering.ts TEST_DATA/TAI_Solution.pdf');
    process.exit(1);
  }

  const pdfPath = args[0];

  if (!fs.existsSync(pdfPath)) {
    console.error(`Error: PDF file not found: ${pdfPath}`);
    process.exit(1);
  }

  await debugPdfRendering(pdfPath);
}

if (require.main === module) {
  main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { debugPdfRendering };
