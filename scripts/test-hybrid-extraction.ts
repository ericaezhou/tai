/**
 * Test Hybrid OCR+Claude Extraction
 *
 * Tests the hybrid consensus system with real PDFs
 */

import fs from 'fs';
import { extractWithHybridConsensus } from '@/lib/ocr/hybrid-extraction';

async function testHybridExtraction(pdfPath: string) {
  console.log(`\n${'='.repeat(80)}`);
  console.log('🔬 HYBRID OCR+CLAUDE EXTRACTION TEST');
  console.log('='.repeat(80));
  console.log(`PDF: ${pdfPath}\n`);

  try {
    const pdfBuffer = fs.readFileSync(pdfPath);
    console.log(`✅ PDF loaded: ${(pdfBuffer.length / 1024).toFixed(2)} KB\n`);

    const questionNumbers = [1, 2, 3, 4, 5, 6];

    // Test 1: PaddleOCR + Claude
    console.log('TEST 1: PaddleOCR + Claude');
    console.log('-'.repeat(80));
    const result1 = await extractWithHybridConsensus(pdfBuffer, questionNumbers, {
      engines: ['paddleocr', 'claude']
    });

    if (result1.success) {
      console.log(`✅ Success!`);
      console.log(`📝 Extracted ${result1.structuredAnswers.length} answers`);
      console.log(`⏱️  Processing time: ${result1.metadata?.processingTime}ms`);
      console.log(`🎯 Engines used: ${result1.metadata?.engines.join(', ')}`);

      console.log(`\n📋 Sample answers:`);
      result1.structuredAnswers.slice(0, 2).forEach(ans => {
        console.log(`\nQ${ans.questionNumber}:`);
        console.log(ans.content.substring(0, 200) + (ans.content.length > 200 ? '...' : ''));
      });
    } else {
      console.error(`❌ Failed: ${result1.error}`);
    }

    console.log('\n' + '='.repeat(80));

    // Test 2: Claude only (baseline)
    console.log('\nTEST 2: Claude Only (Baseline)');
    console.log('-'.repeat(80));
    const result2 = await extractWithHybridConsensus(pdfBuffer, questionNumbers, {
      engines: ['claude']
    });

    if (result2.success) {
      console.log(`✅ Success!`);
      console.log(`📝 Extracted ${result2.structuredAnswers.length} answers`);
      console.log(`⏱️  Processing time: ${result2.metadata?.processingTime}ms`);

      // Compare with hybrid result
      if (result1.success) {
        console.log(`\n🔍 Comparison with Hybrid:`);
        const text1 = result1.structuredAnswers.map(a => a.content).join(' ');
        const text2 = result2.structuredAnswers.map(a => a.content).join(' ');

        const numbers1 = extractAllNumbers(text1);
        const numbers2 = extractAllNumbers(text2);

        console.log(`   Claude-only numbers: ${numbers2.length}`);
        console.log(`   Hybrid numbers: ${numbers1.length}`);

        // Find differences
        const differences = [];
        for (let i = 0; i < Math.min(numbers1.length, numbers2.length); i++) {
          if (numbers1[i] !== numbers2[i]) {
            differences.push({ index: i, claude: numbers2[i], hybrid: numbers1[i] });
          }
        }

        if (differences.length > 0) {
          console.log(`\n   📝 Corrections made by hybrid system:`);
          differences.forEach(diff => {
            console.log(`      Position ${diff.index}: ${diff.claude} → ${diff.hybrid}`);
          });
        } else {
          console.log(`   ✅ No corrections needed`);
        }
      }
    } else {
      console.error(`❌ Failed: ${result2.error}`);
    }

    console.log('\n' + '='.repeat(80));
    console.log('✨ Hybrid extraction test complete!\n');

  } catch (error) {
    console.error(`\n❌ ERROR:`, error);
  }
}

function extractAllNumbers(text: string): string[] {
  const matches = text.match(/\b\d+(?:\.\d+)?\b/g);
  return matches || [];
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length < 1) {
    console.error('Usage: npx tsx scripts/test-hybrid-extraction.ts <pdf-path>');
    console.error('Example: npx tsx scripts/test-hybrid-extraction.ts TEST_DATA/TAI_Answer.pdf');
    process.exit(1);
  }

  const pdfPath = args[0];

  if (!fs.existsSync(pdfPath)) {
    console.error(`Error: PDF file not found: ${pdfPath}`);
    process.exit(1);
  }

  await testHybridExtraction(pdfPath);
}

if (require.main === module) {
  main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { testHybridExtraction };
