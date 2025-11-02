// Weighted Consensus Voting Algorithm

import type { OCRResult, ConsensusResult } from '@/types/ocr';
import {
  normalizeText,
  calculateEditDistance,
  applyCommonCorrections
} from './utils';

// Engine reliability weights (higher = more reliable)
const ENGINE_WEIGHTS: Record<string, number> = {
  paddleocr: 1.0,
  pix2text: 1.2,    // Higher weight for math-specialized engine
  surya: 1.0,
  easyocr: 0.8,
  trocr: 0.9,
  unsiloed: 1.5     // Highest weight for proven accuracy
};

/**
 * Perform weighted consensus voting on OCR results
 * Takes into account engine reliability and confidence scores
 */
export function weightedVote(results: OCRResult[]): ConsensusResult {
  if (results.length === 0) {
    throw new Error('No OCR results to process');
  }

  // Single result - return directly
  if (results.length === 1) {
    return {
      finalText: results[0].text,
      confidence: results[0].confidence,
      method: 'unanimous',
      individualResults: results,
      needsReview: results[0].confidence < 0.75,
      agreementRatio: 1.0
    };
  }

  // Normalize all results and apply common corrections
  const normalizedResults = results.map(r => ({
    ...r,
    normalizedText: normalizeText(applyCommonCorrections(r.text))
  }));

  // Calculate weighted scores for each unique result
  const scores = new Map<string, {
    originalText: string;
    score: number;
    count: number;
    sources: string[];
    avgConfidence: number;
  }>();

  for (const result of normalizedResults) {
    const weight = ENGINE_WEIGHTS[result.engine] || 1.0;
    const weightedScore = result.confidence * weight;

    // Try to find similar existing entry (within edit distance threshold)
    let matched = false;
    for (const [key, value] of scores.entries()) {
      const distance = calculateEditDistance(result.normalizedText, key);
      // Allow small variations (up to 2 character differences)
      if (distance <= 2) {
        value.score += weightedScore;
        value.count += 1;
        value.sources.push(result.engine);
        value.avgConfidence = (value.avgConfidence * (value.count - 1) + result.confidence) / value.count;
        matched = true;
        break;
      }
    }

    if (!matched) {
      scores.set(result.normalizedText, {
        originalText: result.text, // Keep original text, not normalized
        score: weightedScore,
        count: 1,
        sources: [result.engine],
        avgConfidence: result.confidence
      });
    }
  }

  // Find the winner (highest weighted score)
  const sorted = Array.from(scores.entries())
    .sort((a, b) => b[1].score - a[1].score);

  const winner = sorted[0];
  const agreementRatio = winner[1].count / results.length;

  // Calculate final confidence
  // Combine average confidence with agreement ratio
  const consensusConfidence = winner[1].avgConfidence * agreementRatio;

  // Determine if review is needed
  const needsReview =
    consensusConfidence < 0.75 || // Low confidence
    agreementRatio < 0.5 ||        // Less than half agree
    sorted.length > 3;              // Too many different results

  return {
    finalText: winner[1].originalText,
    confidence: consensusConfidence,
    method: winner[1].count === results.length ? 'unanimous' : 'weighted',
    individualResults: results,
    needsReview,
    agreementRatio
  };
}

/**
 * Simple majority voting (no weights)
 * Useful as a baseline comparison
 */
export function majorityVote(results: OCRResult[]): ConsensusResult {
  if (results.length === 0) {
    throw new Error('No OCR results to process');
  }

  if (results.length === 1) {
    return {
      finalText: results[0].text,
      confidence: results[0].confidence,
      method: 'unanimous',
      individualResults: results,
      needsReview: results[0].confidence < 0.75,
      agreementRatio: 1.0
    };
  }

  // Count occurrences of each result
  const votes = new Map<string, {
    originalText: string;
    count: number;
    avgConfidence: number;
  }>();

  for (const result of results) {
    const normalized = normalizeText(result.text);
    const existing = votes.get(normalized);

    if (existing) {
      existing.count += 1;
      existing.avgConfidence = (existing.avgConfidence * (existing.count - 1) + result.confidence) / existing.count;
    } else {
      votes.set(normalized, {
        originalText: result.text,
        count: 1,
        avgConfidence: result.confidence
      });
    }
  }

  // Find majority
  const sorted = Array.from(votes.entries())
    .sort((a, b) => b[1].count - a[1].count);

  const winner = sorted[0];
  const agreementRatio = winner[1].count / results.length;

  return {
    finalText: winner[1].originalText,
    confidence: winner[1].avgConfidence * agreementRatio,
    method: winner[1].count === results.length ? 'unanimous' : 'majority',
    individualResults: results,
    needsReview: agreementRatio < 0.6 || winner[1].avgConfidence < 0.75,
    agreementRatio
  };
}
