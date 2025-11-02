// Pix2Text Engine Client (Math-specialized OCR)

import type { OCRResult } from '@/types/ocr';
import { bufferToBlob } from '../utils/buffer';

const PIX2TEXT_ENDPOINT = process.env.PIX2TEXT_ENDPOINT || 'http://localhost:8002';

export async function runPix2Text(
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
    const response = await fetch(`${PIX2TEXT_ENDPOINT}/ocr`, {
      method: 'POST',
      body: formData,
      signal: AbortSignal.timeout(45000) // 45s timeout (slower for math)
    });

    if (!response.ok) {
      throw new Error(`Pix2Text failed: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();

    return {
      engine: 'pix2text',
      text: result.text || '',
      confidence: result.confidence || 0.85, // Pix2Text has good default confidence
      processingTime: result.processingTime || 0,
      latex: result.latex, // Math LaTeX representation
      metadata: {
        modelVersion: 'pix2text-1.0.0'
      }
    };
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Pix2Text request timed out after 45 seconds');
    }
    throw new Error(`Pix2Text processing failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export async function checkPix2TextHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${PIX2TEXT_ENDPOINT}/health`, {
      signal: AbortSignal.timeout(5000)
    });
    return response.ok;
  } catch {
    return false;
  }
}
