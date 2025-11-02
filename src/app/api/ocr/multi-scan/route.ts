import { NextRequest, NextResponse } from 'next/server';
import { multiScanOCR } from '@/lib/ocr/orchestrator';
import type { MultiScanRequest } from '@/types/ocr';

export const maxDuration = 300; // 5 minutes for Vercel

/**
 * POST /api/ocr/multi-scan
 * Run multiple OCR engines and combine results with consensus
 *
 * Request: FormData with:
 * - pdf: PDF file
 * - engines: comma-separated list (e.g., "paddleocr,pix2text,surya")
 * - questionNumbers: comma-separated numbers (e.g., "1,2,3")
 * - consensusMethod: "majority" | "weighted" | "clustering" | "ai_arbiter"
 * - useCache: "true" | "false" (optional)
 *
 * Response: MultiScanResult
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    // Extract parameters
    const pdfFile = formData.get('pdf') as File;
    const enginesStr = formData.get('engines') as string;
    const questionNumbersStr = formData.get('questionNumbers') as string;
    const consensusMethod = (formData.get('consensusMethod') as string) || 'weighted';
    const useCache = formData.get('useCache') === 'true';

    // Validation
    if (!pdfFile) {
      return NextResponse.json(
        { error: 'PDF file is required' },
        { status: 400 }
      );
    }

    if (!enginesStr) {
      return NextResponse.json(
        { error: 'Engines parameter is required (e.g., "paddleocr,pix2text,surya")' },
        { status: 400 }
      );
    }

    if (!questionNumbersStr) {
      return NextResponse.json(
        { error: 'Question numbers are required (e.g., "1,2,3")' },
        { status: 400 }
      );
    }

    // Validate file type
    if (pdfFile.type !== 'application/pdf') {
      return NextResponse.json(
        { error: 'File must be a PDF' },
        { status: 400 }
      );
    }

    // Check file size (50MB limit for testing)
    if (pdfFile.size > 50 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'PDF file size must be less than 50MB' },
        { status: 413 }
      );
    }

    // Parse parameters
    const engines = enginesStr.split(',').map(e => e.trim()).filter(e => e);
    const questionNumbers = questionNumbersStr
      .split(',')
      .map(n => parseInt(n.trim()))
      .filter(n => !isNaN(n));

    // Validate engines
    const validEngines = ['paddleocr', 'pix2text', 'surya', 'mathpix', 'unsiloed'];
    const invalidEngines = engines.filter(e => !validEngines.includes(e));

    if (invalidEngines.length > 0) {
      return NextResponse.json(
        {
          error: `Invalid engines: ${invalidEngines.join(', ')}`,
          validEngines
        },
        { status: 400 }
      );
    }

    // Validate consensus method
    const validMethods = ['majority', 'weighted', 'clustering', 'ai_arbiter'];
    if (!validMethods.includes(consensusMethod)) {
      return NextResponse.json(
        {
          error: `Invalid consensus method: ${consensusMethod}`,
          validMethods
        },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const arrayBuffer = await pdfFile.arrayBuffer();
    const pdfBuffer = Buffer.from(arrayBuffer);

    console.log('Starting multi-scan OCR...');
    console.log(`Engines: ${engines.join(', ')}`);
    console.log(`Questions: ${questionNumbers.join(', ')}`);
    console.log(`Consensus: ${consensusMethod}`);

    // Run multi-scan OCR
    const ocrRequest: MultiScanRequest = {
      pdfBuffer,
      engines,
      questionNumbers,
      consensusMethod: consensusMethod as any,
      preprocessing: {
        dpi: 300
      },
      useCache
    };

    const result = await multiScanOCR(ocrRequest);

    return NextResponse.json(result);

  } catch (error) {
    console.error('Multi-scan OCR API error:', error);

    // Provide detailed error information
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;

    // Check if this is a PDF worker error
    const isPDFWorkerError = errorMessage.includes('worker') ||
                              errorMessage.includes('GlobalWorkerOptions') ||
                              errorMessage.includes('pdf.worker');

    return NextResponse.json(
      {
        status: 'failed',
        error: 'Failed to process multi-scan OCR',
        details: errorMessage,
        type: isPDFWorkerError ? 'PDF_WORKER_ERROR' : 'OCR_PROCESSING_ERROR',
        ...(process.env.NODE_ENV === 'development' && { stack: errorStack })
      },
      { status: 500 }
    );
  }
}
