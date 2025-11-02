// Edit-Distance Clustering Algorithm for OCR Consensus

import type { OCRResult, ConsensusResult, ClusterResult } from '@/types/ocr';
import {
  normalizeText,
  calculateEditDistance,
  calculateSimilarity
} from './utils';

/**
 * Cluster OCR results by similarity using edit distance
 * Groups similar results together and selects best representative
 */
export function clusterBySimilarity(
  results: OCRResult[],
  distanceThreshold: number = 3
): ConsensusResult {
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

  // Create clusters
  const clusters: ClusterResult[] = [];

  for (const result of results) {
    const normalized = normalizeText(result.text);
    let addedToCluster = false;

    // Try to add to existing cluster
    for (const cluster of clusters) {
      const clusterRep = normalizeText(cluster.representative);
      const distance = calculateEditDistance(normalized, clusterRep);

      if (distance <= distanceThreshold) {
        cluster.members.push(result);
        // Update average confidence
        cluster.averageConfidence =
          cluster.members.reduce((sum, r) => sum + r.confidence, 0) / cluster.members.length;
        addedToCluster = true;
        break;
      }
    }

    // Create new cluster if not added to existing
    if (!addedToCluster) {
      clusters.push({
        representative: result.text,
        members: [result],
        averageConfidence: result.confidence
      });
    }
  }

  // Find best cluster (largest size, then highest confidence)
  const bestCluster = clusters.sort((a, b) => {
    if (b.members.length !== a.members.length) {
      return b.members.length - a.members.length; // More members = better
    }
    return b.averageConfidence - a.averageConfidence; // Higher confidence = better
  })[0];

  // Find best representative from best cluster (highest confidence)
  const bestResult = bestCluster.members.sort((a, b) =>
    b.confidence - a.confidence
  )[0];

  const agreementRatio = bestCluster.members.length / results.length;

  // Determine if review is needed
  const needsReview =
    bestCluster.averageConfidence < 0.75 ||
    agreementRatio < 0.5 ||
    clusters.length > 3; // Too many different clusters

  return {
    finalText: bestResult.text,
    confidence: bestCluster.averageConfidence * agreementRatio,
    method: 'clustering',
    individualResults: results,
    needsReview,
    agreementRatio
  };
}

/**
 * Advanced clustering with hierarchical merging
 * Merges very similar clusters iteratively
 */
export function hierarchicalClustering(
  results: OCRResult[],
  initialThreshold: number = 3,
  mergeThreshold: number = 5
): ConsensusResult {
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

  // Initial clustering
  let clusters: ClusterResult[] = [];

  for (const result of results) {
    const normalized = normalizeText(result.text);
    let addedToCluster = false;

    for (const cluster of clusters) {
      const clusterRep = normalizeText(cluster.representative);
      const distance = calculateEditDistance(normalized, clusterRep);

      if (distance <= initialThreshold) {
        cluster.members.push(result);
        cluster.averageConfidence =
          cluster.members.reduce((sum, r) => sum + r.confidence, 0) / cluster.members.length;
        addedToCluster = true;
        break;
      }
    }

    if (!addedToCluster) {
      clusters.push({
        representative: result.text,
        members: [result],
        averageConfidence: result.confidence
      });
    }
  }

  // Hierarchical merging
  let merged = true;
  while (merged && clusters.length > 1) {
    merged = false;

    for (let i = 0; i < clusters.length; i++) {
      for (let j = i + 1; j < clusters.length; j++) {
        const rep1 = normalizeText(clusters[i].representative);
        const rep2 = normalizeText(clusters[j].representative);
        const distance = calculateEditDistance(rep1, rep2);

        if (distance <= mergeThreshold) {
          // Merge cluster j into cluster i
          clusters[i].members.push(...clusters[j].members);
          clusters[i].averageConfidence =
            clusters[i].members.reduce((sum, r) => sum + r.confidence, 0) / clusters[i].members.length;
          clusters.splice(j, 1);
          merged = true;
          break;
        }
      }
      if (merged) break;
    }
  }

  // Find best cluster
  const bestCluster = clusters.sort((a, b) => {
    if (b.members.length !== a.members.length) {
      return b.members.length - a.members.length;
    }
    return b.averageConfidence - a.averageConfidence;
  })[0];

  const bestResult = bestCluster.members.sort((a, b) =>
    b.confidence - a.confidence
  )[0];

  const agreementRatio = bestCluster.members.length / results.length;

  return {
    finalText: bestResult.text,
    confidence: bestCluster.averageConfidence * agreementRatio,
    method: 'clustering',
    individualResults: results,
    needsReview: bestCluster.averageConfidence < 0.75 || agreementRatio < 0.5,
    agreementRatio
  };
}
