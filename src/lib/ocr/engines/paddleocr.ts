// PaddleOCR Engine Client

import type { OCRResult } from '@/types/ocr';
import { bufferToBlob } from '../utils/buffer';

const PADDLEOCR_ENDPOINT = process.env.PADDLEOCR_ENDPOINT || 'http://localhost:8001';

export async function runPaddleOCR(
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
    const response = await fetch(`${PADDLEOCR_ENDPOINT}/ocr`, {
      method: 'POST',
      body: formData,
      signal: AbortSignal.timeout(30000) // 30s timeout
    });

    if (!response.ok) {
      throw new Error(`PaddleOCR failed: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();

    return {
      engine: 'paddleocr',
      text: result.text || '',
      confidence: result.confidence || 0,
      processingTime: result.processingTime || 0,
      boundingBoxes: result.lines || [],
      metadata: {
        lines: result.lines,
        modelVersion: 'paddleocr-2.7.3'
      }
    };
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('PaddleOCR request timed out after 30 seconds');
    }
    throw new Error(`PaddleOCR processing failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export async function checkPaddleOCRHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${PADDLEOCR_ENDPOINT}/health`, {
      signal: AbortSignal.timeout(5000)
    });
    return response.ok;
  } catch {
    return false;
  }
}
