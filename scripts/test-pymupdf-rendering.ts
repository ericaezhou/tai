/**
 * Test PyMuPDF PDF Rendering via Docker
 *
 * Tests if PyMuPDF can properly render PDFs to images
 */

import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function testPyMuPDFRendering(pdfPath: string) {
  console.log(`\n${'='.repeat(80)}`);
  console.log('🐍 PYMUPDF PDF RENDERING TEST (via Docker)');
  console.log('='.repeat(80));
  console.log(`PDF: ${pdfPath}\n`);

  try {
    const pdfBuffer = fs.readFileSync(pdfPath);
    console.log(`✅ PDF loaded: ${(pdfBuffer.length / 1024).toFixed(2)} KB`);

    // Create temp directory for output
    const outputDir = path.join(process.cwd(), 'tmp', 'pymupdf-test');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const tempPdfPath = path.join(outputDir, 'test.pdf');
    fs.writeFileSync(tempPdfPath, pdfBuffer);
    console.log(`✅ Temp PDF created: ${tempPdfPath}\n`);

    // Python script for conversion
    const pythonScript = `
import fitz
import sys

try:
    doc = fitz.open('/tmp/test.pdf')
    print(f"Pages: {doc.page_count}")

    zoom = 300 / 72
    mat = fitz.Matrix(zoom, zoom)

    for page_num in range(min(2, doc.page_count)):  # Convert first 2 pages
        page = doc[page_num]
        pix = page.get_pixmap(matrix=mat, alpha=False)
        output_path = f'/tmp/test_page{page_num + 1}.png'
        pix.save(output_path)
        print(f"Saved: {output_path} ({len(pix.samples)} bytes)")

    doc.close()
    print("SUCCESS")
except Exception as e:
    print(f"ERROR: {e}", file=sys.stderr)
    sys.exit(1)
`;

    // Copy PDF into container
    console.log('📦 Copying PDF into Docker container...');
    await execAsync(`docker cp "${tempPdfPath}" ocr-paddleocr:/tmp/test.pdf`);
    console.log('✅ PDF copied to container\n');

    // Run Python conversion
    console.log('🎨 Running PyMuPDF conversion in container...');
    const { stdout, stderr } = await execAsync(
      `docker exec ocr-paddleocr python3 -c '${pythonScript.replace(/'/g, "'\\''")}' 2>&1`
    );

    console.log(stdout);
    if (stderr) {
      console.error('STDERR:', stderr);
    }

    // Copy images back from container
    console.log('\n📥 Copying images back from container...');
    try {
      await execAsync(`docker cp ocr-paddleocr:/tmp/test_page1.png "${outputDir}/"`);
      await execAsync(`docker cp ocr-paddleocr:/tmp/test_page2.png "${outputDir}/" 2>/dev/null || true`);
      console.log(`✅ Images copied to: ${outputDir}\n`);

      // Check image sizes
      const images = fs.readdirSync(outputDir).filter(f => f.startsWith('test_page'));
      console.log('📊 Image Analysis:');
      for (const img of images) {
        const imgPath = path.join(outputDir, img);
        const stats = fs.statSync(imgPath);
        console.log(`  ${img}: ${(stats.size / 1024).toFixed(2)} KB`);

        if (stats.size < 50000) {
          console.log(`    ⚠️  WARNING: Small file size`);
        } else {
          console.log(`    ✅ Good file size`);
        }
      }
    } catch (error) {
      console.error('❌ Failed to copy images:', error instanceof Error ? error.message : String(error));
    }

    // Cleanup container
    await execAsync(`docker exec ocr-paddleocr rm -f /tmp/test.pdf /tmp/test_page*.png`);

    console.log('\n' + '='.repeat(80));
    console.log('✨ PyMuPDF test complete!\n');

  } catch (error) {
    console.error(`\n❌ ERROR:`, error);
  }
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length < 1) {
    console.error('Usage: npx tsx scripts/test-pymupdf-rendering.ts <pdf-path>');
    console.error('Example: npx tsx scripts/test-pymupdf-rendering.ts TEST_DATA/TAI_Solution.pdf');
    process.exit(1);
  }

  const pdfPath = args[0];

  if (!fs.existsSync(pdfPath)) {
    console.error(`Error: PDF file not found: ${pdfPath}`);
    process.exit(1);
  }

  await testPyMuPDFRendering(pdfPath);
}

if (require.main === module) {
  main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { testPyMuPDFRendering };
