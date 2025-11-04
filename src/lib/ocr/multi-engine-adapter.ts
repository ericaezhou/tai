/**
 * Multi-Engine OCR Extraction Adapter
 *
 * Runs Claude, PaddleOCR, and Pix2Text in parallel to extract text from PDFs.
 * Returns results from all engines for comparison dashboard.
 */

import { extractStructuredAnswersFromPDF } from './grading-adapter';
import { runPaddleOCR } from './engines/paddleocr';
import { runPix2Text } from './engines/pix2text';
import { pdfToImages } from './preprocessing/pdfToImage';
import type { StructuredAnswer, OCREngineResult } from '@/types';

export interface MultiEngineExtractionResult {
  success: boolean;
  engineResults: Array<{
    engine: 'claude' | 'paddleocr' | 'pix2text';
    structuredAnswers: StructuredAnswer[];
    confidence?: number;
    processingTime: number;
    metadata?: any;
    error?: string;
  }>;
  bestEngine: 'claude' | 'paddleocr' | 'pix2text';
  error?: string;
}

/**
 * Extract structured answers using all OCR engines in parallel
 */
export async function extractWithAllEngines(
  pdfBuffer: Buffer,
  questionNumbers: number[]
): Promise<MultiEngineExtractionResult> {
  console.log(`🔬 Starting multi-engine extraction with ${questionNumbers.length} questions`);

  const engineResults: MultiEngineExtractionResult['engineResults'] = [];

  // Run all engines in parallel
  const promises = [
    // Claude Direct PDF Extraction
    (async () => {
      const startTime = Date.now();
      try {
        console.log('📘 Running Claude extraction...');
        const result = await extractStructuredAnswersFromPDF(pdfBuffer, questionNumbers);

        if (result.success) {
          return {
            engine: 'claude' as const,
            structuredAnswers: result.structuredAnswers,
            confidence: 0.95, // Assume high confidence for Claude
            processingTime: Date.now() - startTime,
            metadata: result.metadata
          };
        } else {
          return {
            engine: 'claude' as const,
            structuredAnswers: [],
            processingTime: Date.now() - startTime,
            error: result.error
          };
        }
      } catch (error) {
        console.error('❌ Claude extraction failed:', error);
        return {
          engine: 'claude' as const,
          structuredAnswers: [],
          processingTime: Date.now() - startTime,
          error: error instanceof Error ? error.message : String(error)
        };
      }
    })(),

    // PaddleOCR
    (async () => {
      const startTime = Date.now();
      try {
        console.log('📗 Running PaddleOCR extraction...');
        const images = await pdfToImages(pdfBuffer, { dpi: 300, format: 'png' });
        const result = await runPaddleOCR(images);

        if (result.success && result.text) {
          // Parse PaddleOCR text into structured answers
          const structuredAnswers = parseToStructuredAnswers(result.text, questionNumbers);

          return {
            engine: 'paddleocr' as const,
            structuredAnswers,
            confidence: result.confidence || 0.7,
            processingTime: Date.now() - startTime,
            metadata: result.metadata
          };
        } else {
          return {
            engine: 'paddleocr' as const,
            structuredAnswers: [],
            processingTime: Date.now() - startTime,
            error: result.error || 'No text extracted'
          };
        }
      } catch (error) {
        console.error('❌ PaddleOCR extraction failed:', error);
        return {
          engine: 'paddleocr' as const,
          structuredAnswers: [],
          processingTime: Date.now() - startTime,
          error: error instanceof Error ? error.message : String(error)
        };
      }
    })(),

    // Pix2Text
    (async () => {
      const startTime = Date.now();
      try {
        console.log('📙 Running Pix2Text extraction...');
        const images = await pdfToImages(pdfBuffer, { dpi: 300, format: 'png' });
        const result = await runPix2Text(images);

        if (result.success && result.text) {
          // Parse Pix2Text output into structured answers
          const structuredAnswers = parseToStructuredAnswers(result.text, questionNumbers);

          return {
            engine: 'pix2text' as const,
            structuredAnswers,
            confidence: result.confidence || 0.85,
            processingTime: Date.now() - startTime,
            metadata: result.metadata
          };
        } else {
          return {
            engine: 'pix2text' as const,
            structuredAnswers: [],
            processingTime: Date.now() - startTime,
            error: result.error || 'No text extracted'
          };
        }
      } catch (error) {
        console.error('❌ Pix2Text extraction failed:', error);
        return {
          engine: 'pix2text' as const,
          structuredAnswers: [],
          processingTime: Date.now() - startTime,
          error: error instanceof Error ? error.message : String(error)
        };
      }
    })()
  ];

  const results = await Promise.all(promises);
  engineResults.push(...results);

  // Determine best engine (prefer Claude, then Pix2Text, then PaddleOCR)
  const successfulEngines = results.filter(r => r.structuredAnswers.length > 0);

  let bestEngine: 'claude' | 'paddleocr' | 'pix2text' = 'claude';
  if (successfulEngines.length > 0) {
    // Priority: Claude > Pix2Text > PaddleOCR
    const claudeResult = successfulEngines.find(r => r.engine === 'claude');
    const pix2textResult = successfulEngines.find(r => r.engine === 'pix2text');
    const paddleResult = successfulEngines.find(r => r.engine === 'paddleocr');

    if (claudeResult && claudeResult.structuredAnswers.length > 0) {
      bestEngine = 'claude';
    } else if (pix2textResult && pix2textResult.structuredAnswers.length > 0) {
      bestEngine = 'pix2text';
    } else if (paddleResult && paddleResult.structuredAnswers.length > 0) {
      bestEngine = 'paddleocr';
    }
  }

  console.log(`✅ Multi-engine extraction complete. Best engine: ${bestEngine}`);
  console.log(`   Claude: ${results[0].structuredAnswers.length} answers`);
  console.log(`   PaddleOCR: ${results[1].structuredAnswers.length} answers`);
  console.log(`   Pix2Text: ${results[2].structuredAnswers.length} answers`);

  return {
    success: successfulEngines.length > 0,
    engineResults,
    bestEngine,
    error: successfulEngines.length === 0 ? 'All engines failed to extract text' : undefined
  };
}

/**
 * Parse raw OCR text into structured answers
 * Attempts to split by question markers or equal chunks
 */
function parseToStructuredAnswers(
  text: string,
  questionNumbers: number[]
): StructuredAnswer[] {
  const structuredAnswers: StructuredAnswer[] = [];

  // Remove page breaks
  text = text.replace(/--- PAGE BREAK ---/g, '\n\n');

  // Try to split by question patterns
  const questionPattern = /Q(?:uestion)?\s*(\d+)[:\s)]|^\s*(\d+)\s*[.):]/gim;
  const matches = Array.from(text.matchAll(questionPattern));

  if (matches.length >= questionNumbers.length / 2) {
    // Found enough question markers
    for (let i = 0; i < matches.length; i++) {
      const match = matches[i];
      const qNum = parseInt(match[1] || match[2]);
      const startPos = match.index! + match[0].length;
      const endPos = matches[i + 1]?.index || text.length;

      if (questionNumbers.includes(qNum)) {
        structuredAnswers.push({
          questionNumber: qNum,
          content: text.slice(startPos, endPos).trim()
        });
      }
    }
  }

  // If parsing failed or incomplete, split equally
  if (structuredAnswers.length < questionNumbers.length / 2) {
    const chunkSize = Math.ceil(text.length / questionNumbers.length);
    return questionNumbers.map((qNum, idx) => ({
      questionNumber: qNum,
      content: text.slice(idx * chunkSize, (idx + 1) * chunkSize).trim()
    }));
  }

  // Sort by question number
  return structuredAnswers.sort((a, b) => a.questionNumber - b.questionNumber);
}
