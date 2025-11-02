// OCR Orchestrator - Runs multiple OCR engines in parallel and combines results

import type {
  OCRResult,
  QuestionResult,
  MultiScanResult,
  MultiScanRequest,
  QuestionSegmentationOptions
} from '@/types/ocr';
import { pdfToImages } from './preprocessing/pdfToImage';
import { runPaddleOCR } from './engines/paddleocr';
import { runPix2Text } from './engines/pix2text';
import { runSuryaOCR } from './engines/surya';
import { runUnsiloedOCR } from './engines/unsiloed';
import { weightedVote, majorityVote } from './consensus/weighted';
import { clusterBySimilarity } from './consensus/clustering';
import { aiArbiter } from './consensus/arbiter';
import { segmentPageIntoQuestions, splitPageEvenly } from './preprocessing/segmentPage';

type QuestionAssignment = {
  questionNumber: number;
  imageBuffer: Buffer;
  pageIndex: number;
  segmentIndex: number;
  bbox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  segmentationScore?: number;
};

async function buildQuestionAssignments(
  images: Buffer[],
  questionNumbers: number[],
  segmentation?: QuestionSegmentationOptions
): Promise<QuestionAssignment[]> {
  const assignments: QuestionAssignment[] = [];

  if (images.length === 0 || questionNumbers.length === 0) {
    return assignments;
  }

  const evenSplitCache = new Map<string, QuestionAssignment[]>();

  const getEvenSegments = async (
    pageIndex: number,
    desiredSegments: number
  ): Promise<QuestionAssignment[]> => {
    const cacheKey = `${pageIndex}:${desiredSegments}`;
    const cached = evenSplitCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const segments = await splitPageEvenly(images[pageIndex], desiredSegments);
    const mapped = segments.map((segment, idx) => ({
      questionNumber: -1,
      imageBuffer: segment.buffer,
      pageIndex,
      segmentIndex: idx,
      bbox: segment.bbox,
      segmentationScore: segment.score
    }));

    evenSplitCache.set(cacheKey, mapped);
    return mapped;
  };

  const segmentationEnabled =
    segmentation?.enabled ?? questionNumbers.length > images.length;

  let cursor = 0;

  for (let pageIndex = 0; pageIndex < images.length && cursor < questionNumbers.length; pageIndex++) {
    const remainingQuestions = questionNumbers.length - cursor;
    const remainingPages = images.length - pageIndex;
    const desiredSegments = segmentationEnabled
      ? Math.max(1, Math.ceil(remainingQuestions / remainingPages))
      : 1;

    let segments: QuestionAssignment[] = [];

    if (segmentationEnabled) {
      const detected = await segmentPageIntoQuestions(images[pageIndex], {
        maxSegments: desiredSegments * 3,
        minSegmentHeight: segmentation?.minSegmentHeight,
        minWhitespaceHeight: segmentation?.minWhitespaceHeight,
        whitespaceThreshold: segmentation?.whitespaceThreshold,
        margin: segmentation?.margin,
        minInkDensity: segmentation?.minInkDensity
      });

      segments = detected.map((segment, idx) => ({
        questionNumber: -1,
        imageBuffer: segment.buffer,
        pageIndex,
        segmentIndex: idx,
        bbox: segment.bbox,
        segmentationScore: segment.score
      }));

      if (segments.length < desiredSegments && (segmentation?.evenSplitFallback ?? true)) {
        const evenSegments = await getEvenSegments(pageIndex, desiredSegments);
        segments = segments
          .concat(evenSegments)
          .sort((a, b) => a.bbox.y - b.bbox.y)
          .slice(0, desiredSegments);
      }
    }

    if (!segmentationEnabled || segments.length === 0) {
      segments = await getEvenSegments(pageIndex, desiredSegments);
    }

    if (segments.length === 0) {
      continue;
    }

    const segmentsNeeded = Math.min(segments.length, remainingQuestions);
    const usableSegments = segments
      .sort((a, b) => a.bbox.y - b.bbox.y)
      .slice(0, segmentsNeeded);

    for (let index = 0; index < usableSegments.length && cursor < questionNumbers.length; index++) {
      const segment = usableSegments[index];
      assignments.push({
        questionNumber: questionNumbers[cursor],
        imageBuffer: segment.imageBuffer,
        pageIndex: segment.pageIndex,
        segmentIndex: index,
        bbox: segment.bbox,
        segmentationScore: segment.segmentationScore
      });
      cursor += 1;
    }
  }

  // Fallback: if we still have remaining questions, reuse the final page evenly
  while (cursor < questionNumbers.length && images.length > 0) {
    const lastPageIndex = images.length - 1;
    const remainingQuestions = questionNumbers.length - cursor;
    const evenSegments = await getEvenSegments(lastPageIndex, remainingQuestions);
    if (evenSegments.length === 0) {
      break;
    }

    for (let i = 0; i < evenSegments.length && cursor < questionNumbers.length; i++) {
      const segment = evenSegments[i];
      assignments.push({
        questionNumber: questionNumbers[cursor],
        imageBuffer: segment.imageBuffer,
        pageIndex: segment.pageIndex,
        segmentIndex: segment.segmentIndex,
        bbox: segment.bbox,
        segmentationScore: segment.segmentationScore
      });
      cursor += 1;
    }
  }

  return assignments;
}

/**
 * Main orchestrator for multi-scan OCR
 * Runs multiple OCR engines in parallel and combines results using consensus
 */
export async function multiScanOCR(request: MultiScanRequest): Promise<MultiScanResult> {
  const {
    pdfBuffer,
    engines,
    questionNumbers,
    consensusMethod,
    preprocessing = {},
    useCache = false
  } = request;

  const jobId = `ocr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const startTime = Date.now();

  try {
    // Convert PDF to images
    console.log('Converting PDF to images...');
    const images = await pdfToImages(pdfBuffer, {
      dpi: preprocessing.dpi || 300,
      format: 'png'
    });

    console.log(`Converted PDF to ${images.length} images`);

    const assignments = await buildQuestionAssignments(
      images,
      questionNumbers,
      preprocessing.questionSegmentation
    );

    if (assignments.length === 0) {
      throw new Error('No question segments could be generated from PDF');
    }

    console.log(
      `Prepared ${assignments.length} question segment${assignments.length === 1 ? '' : 's'} from ${images.length} page${images.length === 1 ? '' : 's'}`
    );

    const results: MultiScanResult = {
      jobId,
      status: 'processing',
      questions: [],
      performance: {
        totalTime: 0,
        timePerQuestion: 0,
        engineTimes: {},
        costEstimate: 0
      }
    };

    // Process each question assignment
    for (const assignment of assignments) {
      const { questionNumber, imageBuffer, pageIndex, segmentIndex, bbox, segmentationScore } = assignment;
      console.log(
        `Processing question ${questionNumber} (page ${pageIndex + 1}, segment ${segmentIndex + 1})...`
      );

      const questionResults: OCRResult[] = [];

      // Run each engine in parallel
      const enginePromises = engines.map(async (engine) => {
        const engineStartTime = Date.now();

        try {
          let result: OCRResult;

          switch (engine) {
            case 'paddleocr':
              result = await runPaddleOCR(imageBuffer, questionNumber);
              break;
            case 'pix2text':
              result = await runPix2Text(imageBuffer, questionNumber);
              break;
            case 'surya':
              result = await runSuryaOCR(imageBuffer, questionNumber);
              break;
            case 'unsiloed':
              // For Unsiloed, we need the full PDF buffer
              result = await runUnsiloedOCR(pdfBuffer, questionNumber);
              break;
            default:
              throw new Error(`Unknown engine: ${engine}`);
          }

          const engineTime = Date.now() - engineStartTime;
          console.log(`${engine} completed in ${engineTime}ms: "${result.text.substring(0, 50)}..."`);

          result.metadata = {
            ...result.metadata,
            pageNumber: pageIndex + 1,
            pageIndex,
            segmentIndex,
            boundingBox: bbox,
            segmentationScore
          };

          // Update engine times
          results.performance.engineTimes[engine] =
            (results.performance.engineTimes[engine] || 0) + engineTime;

          return result;

        } catch (error) {
          console.error(`Engine ${engine} failed for question ${questionNumber}:`, error);
          // Return null for failed engines (will be filtered out)
          return null;
        }
      });

      // Wait for all engines to complete
      const engineResults = await Promise.all(enginePromises);

      // Filter out failed engines
      questionResults.push(...engineResults.filter((r): r is OCRResult => r !== null));

      console.log(`Got ${questionResults.length} results for question ${questionNumber}`);

      if (questionResults.length === 0) {
        console.error(`All engines failed for question ${questionNumber}`);
        continue;
      }

      // Run consensus algorithm
      let consensus;
      console.log(`Running consensus method: ${consensusMethod}`);

      switch (consensusMethod) {
        case 'majority':
          consensus = majorityVote(questionResults);
          break;
        case 'weighted':
          consensus = weightedVote(questionResults);
          break;
        case 'clustering':
          consensus = clusterBySimilarity(questionResults);
          break;
        case 'ai_arbiter':
          consensus = await aiArbiter(questionResults, `Question ${questionNumber}`);
          break;
        default:
          consensus = weightedVote(questionResults); // Default fallback
      }

      console.log(`Consensus result: "${consensus.finalText}" (confidence: ${(consensus.confidence * 100).toFixed(1)}%)`);

      results.questions.push({
        questionNumber,
        individualResults: questionResults,
        consensus,
        source: {
          pageIndex,
          segmentIndex,
          boundingBox: bbox,
          segmentationScore
        }
      });
    }

    // Calculate performance metrics
    const totalTime = Date.now() - startTime;
    results.performance.totalTime = totalTime;
    results.performance.timePerQuestion = assignments.length > 0 ? totalTime / assignments.length : 0;

    // Estimate cost (rough estimates)
    const costPerPage = 0.003; // Infrastructure cost for free engines
    const aiCalls = results.questions.filter(q => q.consensus.method === 'ai_arbiter').length;
    const aiCost = aiCalls * 0.003; // ~$0.003 per Claude API call
    results.performance.costEstimate = (images.length * costPerPage) + aiCost;

    results.status = 'completed';

    console.log(`Multi-scan OCR completed in ${totalTime}ms`);
    console.log(`Processed ${results.questions.length} questions`);
    console.log(`Estimated cost: $${results.performance.costEstimate.toFixed(4)}`);

    return results;

  } catch (error) {
    console.error('Multi-scan OCR failed:', error);

    return {
      jobId,
      status: 'failed',
      questions: [],
      performance: {
        totalTime: Date.now() - startTime,
        timePerQuestion: 0,
        engineTimes: {},
        costEstimate: 0
      },
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Simple helper for testing individual engines
 */
export async function testSingleEngine(
  pdfBuffer: Buffer,
  engine: string,
  questionNumber: number = 1
): Promise<OCRResult> {
  const images = await pdfToImages(pdfBuffer, { dpi: 300 });

  if (questionNumber > images.length) {
    throw new Error(`Question ${questionNumber} out of range (PDF has ${images.length} pages)`);
  }

  const imageBuffer = images[questionNumber - 1];

  switch (engine) {
    case 'paddleocr':
      return await runPaddleOCR(imageBuffer, questionNumber);
    case 'pix2text':
      return await runPix2Text(imageBuffer, questionNumber);
    case 'surya':
      return await runSuryaOCR(imageBuffer, questionNumber);
    case 'unsiloed':
      return await runUnsiloedOCR(pdfBuffer, questionNumber);
    default:
      throw new Error(`Unknown engine: ${engine}`);
  }
}
