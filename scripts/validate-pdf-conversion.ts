/**
 * PDF to Image Conversion Validation Script
 *
 * Diagnoses issues with PDF-to-image conversion by:
 * 1. Converting PDF pages to images
 * 2. Saving images to disk for visual inspection
 * 3. Reporting image metadata (dimensions, file size, etc.)
 *
 * Usage:
 *   npx tsx scripts/validate-pdf-conversion.ts <pdf-path>
 */

import fs from 'fs';
import path from 'path';
import { pdfToImages, getPDFPageCount } from '@/lib/ocr/preprocessing/pdfToImage';

async function validatePdfConversion(pdfPath: string) {
  console.log(`\n${'='.repeat(80)}`);
  console.log('🔍 PDF TO IMAGE CONVERSION VALIDATION');
  console.log('='.repeat(80));
  console.log(`PDF: ${pdfPath}\n`);

  try {
    // Read PDF
    const pdfBuffer = fs.readFileSync(pdfPath);
    console.log(`✅ PDF loaded: ${(pdfBuffer.length / 1024).toFixed(2)} KB`);

    // Get page count
    const pageCount = await getPDFPageCount(pdfBuffer);
    console.log(`✅ Page count: ${pageCount} pages\n`);

    // Convert to images
    console.log('🖼️  Converting PDF to images (300 DPI)...');
    const startTime = Date.now();
    const images = await pdfToImages(pdfBuffer, { dpi: 300, format: 'png' });
    const conversionTime = Date.now() - startTime;
    console.log(`✅ Conversion complete: ${images.length} images in ${conversionTime}ms\n`);

    // Create output directory
    const outputDir = path.join(process.cwd(), 'tmp', 'extracted-images');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Save and analyze each image
    console.log('📊 Image Analysis:\n');
    const pdfBasename = path.basename(pdfPath, '.pdf');

    for (let i = 0; i < images.length; i++) {
      const image = images[i];
      const filename = `${pdfBasename}_page${i + 1}.png`;
      const filepath = path.join(outputDir, filename);

      // Save image
      fs.writeFileSync(filepath, image);

      // Analyze
      console.log(`Page ${i + 1}:`);
      console.log(`  File: ${filename}`);
      console.log(`  Size: ${(image.length / 1024).toFixed(2)} KB`);
      console.log(`  Path: ${filepath}`);

      // Check if image is suspiciously small (likely blank)
      if (image.length < 10000) {
        console.log(`  ⚠️  WARNING: Image is very small (${image.length} bytes) - likely blank or corrupt!`);
      } else if (image.length < 50000) {
        console.log(`  ⚠️  WARNING: Image is smaller than expected - might be low quality`);
      } else {
        console.log(`  ✅ Size looks good`);
      }
      console.log();
    }

    console.log('='.repeat(80));
    console.log('📁 Images saved to:', outputDir);
    console.log('👀 Please visually inspect the images to verify they contain visible text');
    console.log('='.repeat(80));

    // Summary
    console.log(`\n📊 SUMMARY:`);
    console.log(`  PDF Pages: ${pageCount}`);
    console.log(`  Images Generated: ${images.length}`);
    console.log(`  Conversion Time: ${conversionTime}ms`);
    console.log(`  Average Time/Page: ${(conversionTime / images.length).toFixed(0)}ms`);
    console.log(`  Average Image Size: ${(images.reduce((sum, img) => sum + img.length, 0) / images.length / 1024).toFixed(2)} KB`);

    // Check for potential issues
    console.log(`\n🔍 POTENTIAL ISSUES:`);
    const smallImages = images.filter(img => img.length < 50000).length;
    if (smallImages > 0) {
      console.log(`  ⚠️  ${smallImages} image(s) are suspiciously small`);
      console.log(`  ➡️  This suggests the PDF content may not be rendering properly`);
    } else {
      console.log(`  ✅ All images are a reasonable size`);
    }

    const verySmallImages = images.filter(img => img.length < 10000).length;
    if (verySmallImages > 0) {
      console.log(`  ❌ ${verySmallImages} image(s) are extremely small (likely blank)`);
      console.log(`  ➡️  PDF rendering is definitely failing for these pages`);
    }

    console.log(`\n✨ Validation complete!\n`);

  } catch (error) {
    console.error(`\n❌ ERROR:`, error);
    if (error instanceof Error) {
      console.error(`Message: ${error.message}`);
      console.error(`Stack: ${error.stack}`);
    }
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);

  if (args.length < 1) {
    console.error('Usage: npx tsx scripts/validate-pdf-conversion.ts <pdf-path>');
    console.error('Example: npx tsx scripts/validate-pdf-conversion.ts TEST_DATA/TAI_Answer.pdf');
    process.exit(1);
  }

  const pdfPath = args[0];

  if (!fs.existsSync(pdfPath)) {
    console.error(`Error: PDF file not found: ${pdfPath}`);
    process.exit(1);
  }

  await validatePdfConversion(pdfPath);
}

if (require.main === module) {
  main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { validatePdfConversion };
