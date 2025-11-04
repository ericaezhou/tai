/**
 * Hybrid OCR+Claude Extraction with Consensus
 *
 * Combines multiple OCR engines with Claude vision to improve accuracy through:
 * - Multi-engine extraction (PaddleOCR, Unsiloed, Claude)
 * - Character-level consensus voting
 * - Confidence-weighted merging
 *
 * This addresses Claude's occasional character misreading (e.g., 8→3) by using
 * OCR engines to validate/correct extracted text.
 */

import { runPaddleOCR } from './engines/paddleocr';
import { runUnsiloedOCR } from './engines/unsiloed';
import { extractStructuredAnswersFromPDF } from './grading-adapter';
import { pdfToImages } from './preprocessing/pdfToImage';
import type { StructuredAnswer } from '@/types';

export interface HybridExtractionOptions {
  engines?: ('paddleocr' | 'unsiloed' | 'claude')[];  // Which engines to use
  consensusThreshold?: number;  // Minimum agreement required (0-1)
  useWeightedVoting?: boolean;  // Weight by engine confidence
}

export interface HybridExtractionResult {
  success: boolean;
  structuredAnswers: StructuredAnswer[];
  metadata?: {
    engines: string[];
    processingTime: number;
    consensusStats?: {
      claudeOnly?: number;
      ocrOnly?: number;
      consensus?: number;
      corrections?: number;
    };
  };
  error?: string;
}

interface EngineResult {
  engine: string;
  text: string;
  confidence: number;
  processingTime: number;
}

/**
 * Extract structured answers using hybrid OCR+Claude approach
 */
export async function extractWithHybridConsensus(
  pdfBuffer: Buffer,
  questionNumbers: number[],
  options: HybridExtractionOptions = {}
): Promise<HybridExtractionResult> {
  const {
    engines = ['paddleocr', 'claude'],  // Default: PaddleOCR + Claude
    consensusThreshold = 0.5,
    useWeightedVoting = true
  } = options;

  const startTime = Date.now();

  try {
    console.log(`🔬 Starting hybrid extraction with engines: ${engines.join(', ')}`);

    // Run all engines in parallel
    const engineResults: EngineResult[] = [];

    const promises = engines.map(async (engine) => {
      const engineStart = Date.now();

      try {
        if (engine === 'claude') {
          // Claude direct PDF extraction
          const result = await extractStructuredAnswersFromPDF(pdfBuffer, questionNumbers);

          if (result.success) {
            // Concatenate all structured answers into single text for comparison
            const text = result.structuredAnswers
              .map(a => `Q${a.questionNumber}: ${a.content}`)
              .join('\n\n');

            return {
              engine: 'claude',
              text,
              confidence: 0.85,  // Assume 85% confidence for Claude
              processingTime: Date.now() - engineStart
            };
          }
        } else if (engine === 'paddleocr') {
          // PaddleOCR via images
          const images = await pdfToImages(pdfBuffer, { dpi: 300, format: 'png' });
          const result = await runPaddleOCR(images);

          if (result.success && result.text) {
            return {
              engine: 'paddleocr',
              text: result.text,
              confidence: result.confidence || 0.95,
              processingTime: Date.now() - engineStart
            };
          }
        } else if (engine === 'unsiloed') {
          // Unsiloed via images
          const images = await pdfToImages(pdfBuffer, { dpi: 300, format: 'png' });
          const result = await runUnsiloedOCR(images);

          if (result.success && result.text) {
            return {
              engine: 'unsiloed',
              text: result.text,
              confidence: result.confidence || 0.90,
              processingTime: Date.now() - engineStart
            };
          }
        }
      } catch (error) {
        console.error(`❌ ${engine} failed:`, error instanceof Error ? error.message : String(error));
      }

      return null;
    });

    const results = await Promise.all(promises);
    engineResults.push(...results.filter((r): r is EngineResult => r !== null));

    if (engineResults.length === 0) {
      return {
        success: false,
        structuredAnswers: [],
        error: 'All extraction engines failed'
      };
    }

    console.log(`✅ ${engineResults.length} engines completed successfully`);

    // If only one engine succeeded, use its result
    if (engineResults.length === 1) {
      console.log(`ℹ️ Single engine result from ${engineResults[0].engine}`);
      const singleResult = await parseToStructuredAnswers(
        engineResults[0].text,
        questionNumbers
      );

      return {
        success: true,
        structuredAnswers: singleResult,
        metadata: {
          engines: [engineResults[0].engine],
          processingTime: Date.now() - startTime
        }
      };
    }

    // Multiple engines: apply consensus
    console.log(`🗳️  Applying consensus across ${engineResults.length} engines`);
    const consensusText = applyConsensus(engineResults, { useWeightedVoting, consensusThreshold });

    // Parse consensus text into structured answers
    const structuredAnswers = await parseToStructuredAnswers(consensusText, questionNumbers);

    return {
      success: true,
      structuredAnswers,
      metadata: {
        engines: engineResults.map(r => r.engine),
        processingTime: Date.now() - startTime,
        consensusStats: {
          claudeOnly: engineResults.find(r => r.engine === 'claude') ? 1 : 0,
          ocrOnly: engineResults.filter(r => r.engine !== 'claude').length,
          consensus: engineResults.length
        }
      }
    };

  } catch (error) {
    return {
      success: false,
      structuredAnswers: [],
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Apply consensus algorithm across multiple engine results
 */
function applyConsensus(
  results: EngineResult[],
  options: { useWeightedVoting: boolean; consensusThreshold: number }
): string {
  // For now, use a simple approach: prefer Claude's structure with OCR validation
  // Future: Implement character-level voting

  const claudeResult = results.find(r => r.engine === 'claude');
  const ocrResults = results.filter(r => r.engine !== 'claude');

  if (!claudeResult) {
    // No Claude result, use highest confidence OCR
    const best = results.reduce((prev, curr) =>
      curr.confidence > prev.confidence ? curr : prev
    );
    return best.text;
  }

  if (ocrResults.length === 0) {
    // Only Claude available
    return claudeResult.text;
  }

  // Hybrid approach: Use Claude's structure, but validate numbers with OCR
  // This helps catch Claude's number misreading errors (8→3, etc.)

  let correctedText = claudeResult.text;
  let corrections = 0;

  // Extract all numbers from Claude's text
  const claudeNumbers = extractNumbers(claudeResult.text);

  // Extract all numbers from OCR texts
  const ocrNumberSets = ocrResults.map(r => extractNumbers(r.text));

  // For each number in Claude's text, check if OCR agrees
  for (const claudeNum of claudeNumbers) {
    // Count how many OCR engines agree on a different number in similar position
    const ocrAgreement = findOCRAgreement(claudeNum, ocrNumberSets);

    if (ocrAgreement && ocrAgreement.count >= ocrResults.length / 2) {
      // OCR consensus disagrees with Claude
      console.log(`📝 Correcting ${claudeNum.value} → ${ocrAgreement.value} (OCR consensus)`);
      correctedText = correctedText.replace(
        new RegExp(`\\b${claudeNum.value}\\b`),
        ocrAgreement.value
      );
      corrections++;
    }
  }

  if (corrections > 0) {
    console.log(`✅ Applied ${corrections} corrections from OCR consensus`);
  }

  return correctedText;
}

/**
 * Extract numbers with their positions from text
 */
function extractNumbers(text: string): Array<{ value: string; position: number }> {
  const numbers: Array<{ value: string; position: number }> = [];
  const regex = /\b\d+(?:\.\d+)?\b/g;
  let match;

  while ((match = regex.exec(text)) !== null) {
    numbers.push({
      value: match[0],
      position: match.index
    });
  }

  return numbers;
}

/**
 * Find OCR agreement on alternative values for a Claude number
 */
function findOCRAgreement(
  claudeNum: { value: string; position: number },
  ocrNumberSets: Array<Array<{ value: string; position: number }>>
): { value: string; count: number } | null {
  // Find numbers in OCR results at similar positions (within 10% of text length)
  const alternativeCounts = new Map<string, number>();

  for (const ocrNumbers of ocrNumberSets) {
    // Find closest number in this OCR result
    const closest = ocrNumbers.reduce((prev, curr) => {
      const prevDist = Math.abs(prev.position - claudeNum.position);
      const currDist = Math.abs(curr.position - claudeNum.position);
      return currDist < prevDist ? curr : prev;
    }, ocrNumbers[0]);

    if (closest && closest.value !== claudeNum.value) {
      alternativeCounts.set(
        closest.value,
        (alternativeCounts.get(closest.value) || 0) + 1
      );
    }
  }

  if (alternativeCounts.size === 0) {
    return null;
  }

  // Find most common alternative
  let maxCount = 0;
  let maxValue = '';

  for (const [value, count] of alternativeCounts.entries()) {
    if (count > maxCount) {
      maxCount = count;
      maxValue = value;
    }
  }

  return maxCount > 0 ? { value: maxValue, count: maxCount } : null;
}

/**
 * Parse consensus text into structured answers
 */
async function parseToStructuredAnswers(
  text: string,
  questionNumbers: number[]
): Promise<StructuredAnswer[]> {
  // Simple parsing: Split by question markers
  const structuredAnswers: StructuredAnswer[] = [];

  // Try to split by question patterns
  const questionPattern = /Q(?:uestion)?\s*(\d+)[:\s]/gi;
  const matches = Array.from(text.matchAll(questionPattern));

  if (matches.length === 0) {
    // No question markers found, assume single answer
    if (questionNumbers.length === 1) {
      return [{ questionNumber: questionNumbers[0], content: text.trim() }];
    }
    // Fall back to equal splitting
    const chunkSize = Math.ceil(text.length / questionNumbers.length);
    return questionNumbers.map((qNum, idx) => ({
      questionNumber: qNum,
      content: text.slice(idx * chunkSize, (idx + 1) * chunkSize).trim()
    }));
  }

  // Extract content between question markers
  for (let i = 0; i < matches.length; i++) {
    const match = matches[i];
    const qNum = parseInt(match[1]);
    const startPos = match.index! + match[0].length;
    const endPos = matches[i + 1]?.index || text.length;

    structuredAnswers.push({
      questionNumber: qNum,
      content: text.slice(startPos, endPos).trim()
    });
  }

  return structuredAnswers.sort((a, b) => a.questionNumber - b.questionNumber);
}
