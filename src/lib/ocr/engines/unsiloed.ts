// Unsiloed AI Engine Wrapper (existing integration)
// This wraps the existing Unsiloed client for use in the multi-scan system

import type { OCRResult } from '@/types/ocr';
import { parseDocument, getParseResults } from '@/lib/unsiloedClient';

export async function runUnsiloedOCR(
  pdfBuffer: Buffer,
  questionNumber?: number
): Promise<OCRResult> {
  try {
    const startTime = Date.now();

    // Start parse job
    const parseJob = await parseDocument(pdfBuffer, `question_${questionNumber || 1}.pdf`);

    // Poll for results
    const result = await getParseResults(parseJob.job_id);

    const processingTime = Date.now() - startTime;

    // Extract text from parsed document
    let extractedText = '';
    if (result.chunks && result.chunks.length > 0) {
      extractedText = result.chunks
        .map(chunk => chunk.segments.map(seg => seg.text).join(' '))
        .join('\n');
    }

    return {
      engine: 'unsiloed',
      text: extractedText,
      confidence: 0.9, // Unsiloed typically has high confidence
      processingTime,
      metadata: {
        pageNumber: questionNumber,
        modelVersion: 'unsiloed-hawk'
      }
    };
  } catch (error) {
    throw new Error(`Unsiloed OCR processing failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export async function checkUnsiloedHealth(): Promise<boolean> {
  // Unsiloed is an external API, assume available
  return true;
}
