import type { OCRResult } from '@/types/ocr';

const MATHPIX_ENDPOINT = process.env.MATHPIX_ENDPOINT || 'https://api.mathpix.com/v3/text';
const MATHPIX_APP_ID = process.env.MATHPIX_APP_ID;
const MATHPIX_APP_KEY = process.env.MATHPIX_APP_KEY;

function ensureCredentials(): void {
  if (!MATHPIX_APP_ID || !MATHPIX_APP_KEY) {
    throw new Error('Mathpix credentials are missing. Set MATHPIX_APP_ID and MATHPIX_APP_KEY in your environment.');
  }
}

type MathpixLine = {
  text?: string;
  latex?: string;
  confidence?: number;
  prob?: number;
  bbox?: number[];
};

type MathpixResponse = {
  text?: string;
  latex_styled?: string;
  latex_confidence?: number;
  text_confidence?: number;
  confidence?: number;
  version?: string;
  line_data?: MathpixLine[];
  warning?: string;
  error?: string;
};

export async function runMathpixOCR(imageBuffer: Buffer, questionNumber?: number): Promise<OCRResult> {
  ensureCredentials();

  const startTime = Date.now();
  const base64Image = imageBuffer.toString('base64');

  const payload = {
    src: `data:image/png;base64,${base64Image}`,
    formats: ['text', 'latex_styled'],
    data_options: {
      include_asciimath: true,
      include_latex: true,
      include_mathml: false,
      include_text: true
    },
    ocr_options: {
      math_inline_delims: ['$','$'],
      math_display_delims: ['\\[','\\]'],
      remove_dust: true
    }
  };

  const response = await fetch(MATHPIX_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      app_id: MATHPIX_APP_ID!,
      app_key: MATHPIX_APP_KEY!
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(60000)
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Mathpix OCR failed: ${response.status} ${response.statusText} - ${errorBody}`);
  }

  const result: MathpixResponse = await response.json();

  if (result.error) {
    throw new Error(`Mathpix OCR error: ${result.error}`);
  }

  const lines = Array.isArray(result.line_data) ? result.line_data : [];
  const processingTime = Date.now() - startTime;

  const textOutput = result.text || lines.map(line => line.text || '').join(' ');
  const latexOutput = result.latex_styled;
  const confidence =
    typeof result.text_confidence === 'number'
      ? result.text_confidence
      : typeof result.latex_confidence === 'number'
        ? result.latex_confidence
        : typeof result.confidence === 'number'
          ? result.confidence
          : 0.9;

  const boundingBoxes = lines
    .filter(line => Array.isArray(line.bbox))
    .map(line => ({
      bbox: line.bbox as number[],
      text: line.text || line.latex || '',
      confidence: line.prob ?? line.confidence
    }));

  return {
    engine: 'mathpix',
    text: textOutput,
    confidence,
    processingTime,
    boundingBoxes,
    latex: latexOutput,
    metadata: {
      modelVersion: result.version || 'mathpix-v3',
      questionNumber,
      lines: lines.map(line => ({
        text: line.text || line.latex || '',
        confidence: line.prob ?? line.confidence ?? 0,
        bbox: Array.isArray(line.bbox) ? line.bbox : []
      }))
    }
  };
}

export async function checkMathpixHealth(): Promise<boolean> {
  try {
    ensureCredentials();
    // Mathpix does not expose a lightweight health endpoint; checking credentials is best-effort.
    return true;
  } catch {
    return false;
  }
}
