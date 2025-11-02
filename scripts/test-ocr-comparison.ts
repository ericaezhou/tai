/**
 * OCR Comparison Test Script
 *
 * Tests and compares different OCR engines on a given PDF:
 * - PaddleOCR (general-purpose)
 * - Pix2Text (math-specialized)
 * - Unsiloed (high-quality document parsing)
 * - Claude Direct (PDF vision)
 * - Multi-scan Consensus (AI arbiter)
 *
 * Usage:
 *   npx tsx scripts/test-ocr-comparison.ts <pdf-path> [question-numbers]
 *
 * Example:
 *   npx tsx scripts/test-ocr-comparison.ts TEST_DATA/TAI_Answer.pdf 1,2,3,4,5,6,7
 */

import fs from 'fs';
import path from 'path';
import Anthropic from '@anthropic-ai/sdk';
import { runPaddleOCR } from '@/lib/ocr/engines/paddleocr';
import { runPix2Text } from '@/lib/ocr/engines/pix2text';
import { runUnsiloedOCR } from '@/lib/ocr/engines/unsiloed';
import { pdfToImages } from '@/lib/ocr/preprocessing/pdfToImage';

interface ExtractionResult {
  engine: string;
  text: string;
  confidence?: number;
  processingTime: number;
  error?: string;
  metadata?: any;
}

interface ComparisonReport {
  pdfPath: string;
  timestamp: string;
  results: ExtractionResult[];
  claudeDirect?: ExtractionResult;
  multiScan?: any;
  summary: {
    totalEngines: number;
    successfulEngines: number;
    avgProcessingTime: number;
    avgConfidence: number;
    recommendedEngine?: string;
  };
}

/**
 * Extract text using Claude's direct PDF vision capability
 */
async function extractWithClaude(pdfBuffer: Buffer): Promise<ExtractionResult> {
  const startTime = Date.now();

  try {
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const base64Pdf = pdfBuffer.toString('base64');

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'document',
              source: {
                type: 'base64',
                media_type: 'application/pdf',
                data: base64Pdf,
              },
            },
            {
              type: 'text',
              text: `Please extract ALL text from this PDF document. This appears to be a homework submission with mathematical content.

For each question/problem you find:
1. Identify the question number
2. Extract all text, mathematical notation, and formulas
3. Preserve the structure and formatting as much as possible

Return the extracted text in a clear, organized format with question numbers clearly marked.`,
            },
          ],
        },
      ],
    });

    const extractedText = response.content
      .filter((block) => block.type === 'text')
      .map((block) => (block as any).text)
      .join('\n');

    return {
      engine: 'claude-direct',
      text: extractedText,
      processingTime: Date.now() - startTime,
      metadata: {
        model: 'claude-sonnet-4-5-20250929',
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
      },
    };
  } catch (error) {
    return {
      engine: 'claude-direct',
      text: '',
      processingTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Convert PDF to images for OCR processing
 * Using existing pdfToImages utility from the codebase
 */
async function convertPdfToImages(pdfBuffer: Buffer): Promise<Buffer[]> {
  return await pdfToImages(pdfBuffer, { dpi: 300, format: 'png' });
}

/**
 * Run single OCR engine on all pages
 */
async function runSingleEngine(
  engine: string,
  images: Buffer[]
): Promise<ExtractionResult> {
  const startTime = Date.now();

  try {
    let extractFunc: (img: Buffer, qNum?: number) => Promise<any>;

    switch (engine) {
      case 'paddleocr':
        extractFunc = runPaddleOCR;
        break;
      case 'pix2text':
        extractFunc = runPix2Text;
        break;
      case 'unsiloed':
        extractFunc = runUnsiloedOCR;
        break;
      default:
        throw new Error(`Unknown engine: ${engine}`);
    }

    const results = await Promise.all(images.map((img, idx) => extractFunc(img, idx + 1)));

    const combinedText = results.map((r) => r.text).join('\n\n--- PAGE BREAK ---\n\n');
    const avgConfidence = results.reduce((sum, r) => sum + (r.confidence || 0), 0) / results.length;

    return {
      engine,
      text: combinedText,
      confidence: avgConfidence,
      processingTime: Date.now() - startTime,
      metadata: {
        pages: results.length,
        individualResults: results,
      },
    };
  } catch (error) {
    return {
      engine,
      text: '',
      processingTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Main comparison function
 */
async function compareOcrEngines(pdfPath: string): Promise<ComparisonReport> {
  console.log(`\n📄 Loading PDF: ${pdfPath}`);
  const pdfBuffer = fs.readFileSync(pdfPath);

  console.log('🖼️  Converting PDF to images...');
  const images = await convertPdfToImages(pdfBuffer);
  console.log(`✅ Converted to ${images.length} images\n`);

  const results: ExtractionResult[] = [];

  // Test PaddleOCR
  console.log('🔍 Testing PaddleOCR...');
  const paddleResult = await runSingleEngine('paddleocr', images);
  results.push(paddleResult);
  console.log(`   ${paddleResult.error ? '❌' : '✅'} Time: ${paddleResult.processingTime}ms, Confidence: ${(paddleResult.confidence || 0).toFixed(2)}\n`);

  // Test Pix2Text
  console.log('🔍 Testing Pix2Text...');
  const pixResult = await runSingleEngine('pix2text', images);
  results.push(pixResult);
  console.log(`   ${pixResult.error ? '❌' : '✅'} Time: ${pixResult.processingTime}ms, Confidence: ${(pixResult.confidence || 0).toFixed(2)}\n`);

  // Test Unsiloed
  console.log('🔍 Testing Unsiloed...');
  const unsiloedResult = await runSingleEngine('unsiloed', images);
  results.push(unsiloedResult);
  console.log(`   ${unsiloedResult.error ? '❌' : '✅'} Time: ${unsiloedResult.processingTime}ms, Confidence: ${(unsiloedResult.confidence || 0).toFixed(2)}\n`);

  // Test Claude Direct
  console.log('🔍 Testing Claude Direct PDF Extraction...');
  const claudeResult = await extractWithClaude(pdfBuffer);
  console.log(`   ${claudeResult.error ? '❌' : '✅'} Time: ${claudeResult.processingTime}ms\n`);

  // Calculate summary statistics
  const successfulResults = results.filter((r) => !r.error);
  const avgTime = successfulResults.reduce((sum, r) => sum + r.processingTime, 0) / successfulResults.length;
  const avgConf = successfulResults.reduce((sum, r) => sum + (r.confidence || 0), 0) / successfulResults.length;

  const report: ComparisonReport = {
    pdfPath,
    timestamp: new Date().toISOString(),
    results,
    claudeDirect: claudeResult,
    summary: {
      totalEngines: results.length + 1, // +1 for Claude
      successfulEngines: successfulResults.length + (claudeResult.error ? 0 : 1),
      avgProcessingTime: avgTime,
      avgConfidence: avgConf,
      recommendedEngine: successfulResults.sort((a, b) => (b.confidence || 0) - (a.confidence || 0))[0]?.engine,
    },
  };

  return report;
}

/**
 * Save report to file
 */
function saveReport(report: ComparisonReport, outputPath: string) {
  fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));
  console.log(`\n💾 Full report saved to: ${outputPath}`);
}

/**
 * Print summary to console
 */
function printSummary(report: ComparisonReport) {
  console.log('\n' + '='.repeat(80));
  console.log('📊 OCR COMPARISON SUMMARY');
  console.log('='.repeat(80));
  console.log(`PDF: ${report.pdfPath}`);
  console.log(`Timestamp: ${report.timestamp}`);
  console.log(`\nEngines Tested: ${report.summary.totalEngines}`);
  console.log(`Successful: ${report.summary.successfulEngines}`);
  console.log(`Average Processing Time: ${report.summary.avgProcessingTime.toFixed(0)}ms`);
  console.log(`Average Confidence: ${(report.summary.avgConfidence * 100).toFixed(1)}%`);
  console.log(`Recommended Engine: ${report.summary.recommendedEngine || 'N/A'}`);

  console.log('\n' + '-'.repeat(80));
  console.log('DETAILED RESULTS:');
  console.log('-'.repeat(80));

  [...report.results, report.claudeDirect!].forEach((result) => {
    console.log(`\n${result.engine.toUpperCase()}:`);
    console.log(`  Status: ${result.error ? '❌ Failed' : '✅ Success'}`);
    console.log(`  Time: ${result.processingTime}ms`);
    if (result.confidence) {
      console.log(`  Confidence: ${(result.confidence * 100).toFixed(1)}%`);
    }
    if (result.error) {
      console.log(`  Error: ${result.error}`);
    }
    if (result.text && !result.error) {
      const preview = result.text.substring(0, 200).replace(/\n/g, ' ');
      console.log(`  Text Preview: ${preview}${result.text.length > 200 ? '...' : ''}`);
      console.log(`  Total Length: ${result.text.length} characters`);
    }
  });

  console.log('\n' + '='.repeat(80) + '\n');
}

/**
 * Main execution
 */
async function main() {
  const args = process.argv.slice(2);

  if (args.length < 1) {
    console.error('Usage: npx tsx scripts/test-ocr-comparison.ts <pdf-path>');
    console.error('Example: npx tsx scripts/test-ocr-comparison.ts TEST_DATA/TAI_Answer.pdf');
    process.exit(1);
  }

  const pdfPath = args[0];

  if (!fs.existsSync(pdfPath)) {
    console.error(`Error: PDF file not found: ${pdfPath}`);
    process.exit(1);
  }

  console.log('🚀 Starting OCR Comparison Test...\n');

  const report = await compareOcrEngines(pdfPath);

  // Save detailed JSON report
  const outputDir = path.join(process.cwd(), 'tmp');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const outputPath = path.join(outputDir, `ocr-comparison-${timestamp}.json`);
  saveReport(report, outputPath);

  // Print summary
  printSummary(report);

  console.log(`\n✨ Comparison complete! Check ${outputPath} for full details.\n`);
}

// Run if called directly
if (require.main === module) {
  main().catch((error) => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
}

export { compareOcrEngines, ComparisonReport, ExtractionResult };
