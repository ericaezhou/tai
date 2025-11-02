// Surya OCR Engine Client (Layout-aware OCR)

import type { OCRResult } from '@/types/ocr';
import { bufferToBlob } from '../utils/buffer';

const SURYA_ENDPOINT = process.env.SURYA_ENDPOINT || 'http://localhost:8003';

export async function runSuryaOCR(
  imageBuffer: Buffer,
  questionNumber?: number
): Promise<OCRResult> {
  const formData = new FormData();
  formData.append(
    'file',
    bufferToBlob(imageBuffer, 'image/png'),
    `question_${questionNumber || 1}.png`
  );

  try {
    const response = await fetch(`${SURYA_ENDPOINT}/ocr`, {
      method: 'POST',
      body: formData,
      signal: AbortSignal.timeout(40000) // 40s timeout
    });

    if (!response.ok) {
      throw new Error(`Surya OCR failed: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();

    return {
      engine: 'surya',
      text: result.text || '',
      confidence: result.confidence || 0,
      processingTime: result.processingTime || 0,
      boundingBoxes: result.lines || [],
      metadata: {
        lines: result.lines,
        modelVersion: 'surya-0.4.0'
      }
    };
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Surya OCR request timed out after 40 seconds');
    }
    throw new Error(`Surya OCR processing failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export async function checkSuryaHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${SURYA_ENDPOINT}/health`, {
      signal: AbortSignal.timeout(5000)
    });
    return response.ok;
  } catch {
    return false;
  }
}
