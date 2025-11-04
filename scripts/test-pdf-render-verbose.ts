/**
 * Verbose PDF Rendering Test
 *
 * Tests PDF rendering with detailed logging to identify the issue
 */

import fs from 'fs';
import path from 'path';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import { createCanvas } from 'canvas';

async function testPdfRenderVerbose(pdfPath: string) {
  console.log(`\n${'='.repeat(80)}`);
  console.log('🔍 VERBOSE PDF RENDERING TEST');
  console.log('='.repeat(80));
  console.log(`PDF: ${pdfPath}\n`);

  try {
    const pdfBuffer = fs.readFileSync(pdfPath);
    console.log(`✅ PDF loaded: ${(pdfBuffer.length / 1024).toFixed(2)} KB\n`);

    // Load PDF with maximum verbosity
    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(pdfBuffer),
      useWorkerFetch: false,
      isEvalSupported: false,
      useSystemFonts: true,
      disableWorker: true,
      verbosity: 5,  // Maximum verbosity for debugging
    });

    const pdf = await loadingTask.promise;
    console.log(`✅ PDF loaded: ${pdf.numPages} pages\n`);

    // Get first page
    const page = await pdf.getPage(1);
    console.log(`✅ Page 1 loaded`);

    // Get page info
    const viewport = page.getViewport({ scale: 1.0 });
    console.log(`📏 Page dimensions: ${viewport.width} x ${viewport.height}`);
    console.log(`📏 Rotation: ${viewport.rotation}`);

    // Try to get text content to verify the PDF has actual content
    console.log(`\n🔍 Checking text content...`);
    const textContent = await page.getTextContent();
    console.log(`✅ Text items found: ${textContent.items.length}`);

    if (textContent.items.length > 0) {
      console.log(`📝 Sample text items (first 5):`);
      textContent.items.slice(0, 5).forEach((item: any, idx) => {
        console.log(`   ${idx + 1}. "${item.str}" at [${item.transform.slice(4, 6).join(', ')}]`);
      });
    } else {
      console.log(`⚠️  No text items found in PDF`);
    }

    // Check for annotations and other content
    const annotations = await page.getAnnotations();
    console.log(`\n📎 Annotations found: ${annotations.length}`);

    // Now try rendering with scale 300 DPI
    const scale = 300 / 72;
    const scaledViewport = page.getViewport({ scale });
    console.log(`\n🖼️  Rendering at ${scale}x scale (300 DPI)`);
    console.log(`📏 Scaled dimensions: ${scaledViewport.width} x ${scaledViewport.height}`);

    const canvas = createCanvas(scaledViewport.width, scaledViewport.height);
    const context = canvas.getContext('2d');

    // White background
    context.fillStyle = 'white';
    context.fillRect(0, 0, scaledViewport.width, scaledViewport.height);
    console.log(`✅ Canvas created with white background`);

    // Render with intent and additional options
    console.log(`🎨 Starting render operation...`);
    const renderContext = {
      canvasContext: context as any,
      viewport: scaledViewport,
      intent: 'print',  // Try print intent for better quality
      enableWebGL: false,
      renderInteractiveForms: false,
    };

    const renderTask = page.render(renderContext);

    // Listen to render progress if available
    renderTask.onContinue = () => {
      console.log(`   Render continuing...`);
    };

    await renderTask.promise;
    console.log(`✅ Render complete`);

    // Save the rendered image
    const buffer = canvas.toBuffer('image/png');
    console.log(`✅ Buffer created: ${buffer.length} bytes`);

    const outputDir = path.join(process.cwd(), 'tmp', 'debug-renders');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    const outputPath = path.join(outputDir, `${path.basename(pdfPath, '.pdf')}_verbose_test.png`);
    fs.writeFileSync(outputPath, buffer);
    console.log(`💾 Saved to: ${outputPath}`);

    // Analyze the buffer to see if it's actually blank
    console.log(`\n🔬 Analyzing image data...`);
    const pixelData = context.getImageData(0, 0, Math.min(100, scaledViewport.width), Math.min(100, scaledViewport.height));
    const uniqueColors = new Set<string>();
    for (let i = 0; i < pixelData.data.length; i += 4) {
      const color = `${pixelData.data[i]},${pixelData.data[i+1]},${pixelData.data[i+2]}`;
      uniqueColors.add(color);
      if (uniqueColors.size > 10) break; // Stop after finding some variety
    }
    console.log(`🎨 Unique colors in sample: ${uniqueColors.size}`);
    console.log(`🎨 Colors: ${Array.from(uniqueColors).slice(0, 5).join(' | ')}`);

    if (uniqueColors.size === 1) {
      console.log(`⚠️  WARNING: Image appears to be a solid color (likely blank)`);
    } else {
      console.log(`✅ Image has color variety (likely has content)`);
    }

    console.log('\n' + '='.repeat(80));
    console.log('✨ Verbose test complete!\n');

  } catch (error) {
    console.error(`\n❌ ERROR:`, error);
    if (error instanceof Error) {
      console.error(`Stack: ${error.stack}`);
    }
  }
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length < 1) {
    console.error('Usage: npx tsx scripts/test-pdf-render-verbose.ts <pdf-path>');
    console.error('Example: npx tsx scripts/test-pdf-render-verbose.ts TEST_DATA/TAI_Solution.pdf');
    process.exit(1);
  }

  const pdfPath = args[0];

  if (!fs.existsSync(pdfPath)) {
    console.error(`Error: PDF file not found: ${pdfPath}`);
    process.exit(1);
  }

  await testPdfRenderVerbose(pdfPath);
}

if (require.main === module) {
  main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { testPdfRenderVerbose };
