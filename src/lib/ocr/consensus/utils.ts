// Utility functions for consensus algorithms

/**
 * Calculate Levenshtein distance between two strings
 * Used for clustering similar OCR results
 */
export function calculateEditDistance(str1: string, str2: string): number {
  const len1 = str1.length;
  const len2 = str2.length;
  const matrix: number[][] = [];

  // Initialize matrix
  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }

  // Fill matrix
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1, // deletion
        matrix[i][j - 1] + 1, // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }

  return matrix[len1][len2];
}

/**
 * Normalize text for comparison
 * - Lowercase
 * - Remove extra whitespace
 * - Remove punctuation
 */
export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim()
    .replace(/[.,;:!?]/g, ''); // Remove punctuation
}

/**
 * Calculate similarity score between two strings (0-1)
 * 1 = identical, 0 = completely different
 */
export function calculateSimilarity(str1: string, str2: string): number {
  const distance = calculateEditDistance(str1, str2);
  const maxLength = Math.max(str1.length, str2.length);
  if (maxLength === 0) return 1;
  return 1 - distance / maxLength;
}

/**
 * Detect if text contains mathematical notation
 */
export function containsMath(text: string): boolean {
  const mathSymbols = /[∫∑∏√±×÷≈≠≤≥∞∂∇∈∉⊂⊃∪∩∧∨¬∀∃]/;
  const mathOperators = /[\+\-\*\/\^\_\=\(\)\[\]\{\}]/g;

  const hasMathSymbols = mathSymbols.test(text);
  const operatorMatches = text.match(mathOperators) || [];
  const operatorRatio = operatorMatches.length / text.length;

  return hasMathSymbols || operatorRatio > 0.2;
}

/**
 * Common OCR character substitutions
 */
export const COMMON_SUBSTITUTIONS: Array<[RegExp, string]> = [
  [/(?<=\d)O(?=\d)/g, '0'],        // O -> 0 (between digits)
  [/(?<=\d)l(?=\d)/g, '1'],        // l -> 1 (between digits)
  [/(?<=\d)I(?=\d)/g, '1'],        // I -> 1 (between digits)
  [/(?<=\d)S(?=\d)/g, '5'],        // S -> 5 (between digits)
  [/(?<=\d)Z(?=\d)/g, '2'],        // Z -> 2 (between digits)
  [/(?<=\d)B(?=\d)/g, '8'],        // B -> 8 (between digits)
  [/(?<=\d)s(?=\d)/g, '5'],        // s -> 5 (between digits)
];

/**
 * Apply common OCR error corrections
 */
export function applyCommonCorrections(text: string): string {
  let corrected = text;
  for (const [pattern, replacement] of COMMON_SUBSTITUTIONS) {
    corrected = corrected.replace(pattern, replacement);
  }
  return corrected;
}
