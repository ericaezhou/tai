// Claude AI Arbiter for OCR Consensus
// Uses Claude to analyze multiple OCR results and select the most likely correct answer

import type { OCRResult, ConsensusResult, AIValidationResult } from '@/types/ocr';
import Anthropic from '@anthropic-ai/sdk';
import { containsMath } from './utils';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!
});

/**
 * Use Claude as an AI arbiter to decide between conflicting OCR results
 * Especially useful for low-confidence or disagreeing results
 */
export async function aiArbiter(
  results: OCRResult[],
  context?: string
): Promise<ConsensusResult> {
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

  // Detect if content is mathematical
  const isMath = results.some(r => containsMath(r.text) || r.latex);

  // Build prompt for Claude
  const prompt = `You are an expert at evaluating OCR results for ${isMath ? 'mathematical' : 'handwritten'} content.

${context ? `Context: ${context}\n` : ''}
Multiple OCR engines produced these results:

${results.map((r, i) => `
${i + 1}. Engine: ${r.engine} (confidence: ${(r.confidence * 100).toFixed(1)}%)
   Result: "${r.text}"${r.latex ? `\n   LaTeX: ${r.latex}` : ''}
`).join('\n')}

Task:
1. Analyze all OCR results
2. Identify the most likely correct answer
3. Fix common OCR errors:
   - "O" (letter) vs "0" (zero)
   - "l" (lowercase L) vs "1" (one) vs "I" (uppercase i)
   - "S" vs "5", "Z" vs "2", "B" vs "8"
   - Missing or extra operators in math
   - Parentheses mismatches
${isMath ? `4. For mathematical expressions:
   - Validate syntax (balanced parentheses, valid operators)
   - Check for common transcription errors
   - Ensure proper mathematical notation` : ''}
5. Rate your confidence (0-100%)
6. Explain your reasoning briefly

Respond in JSON format:
{
  "correctedText": "the final corrected answer",
  "confidence": 95,
  "reasoning": "brief explanation of your decision",
  "errors": ["list of errors you fixed"],
  "mathValid": ${isMath ? 'true/false' : 'null'}
}`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1000,
      temperature: 0, // Deterministic for validation
      messages: [{
        role: 'user',
        content: prompt
      }]
    });

    // Parse Claude's response
    const textContent = response.content[0].type === 'text' ? response.content[0].text : '';
    const jsonMatch = textContent.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      throw new Error('Could not parse JSON from Claude response');
    }

    const aiResult: AIValidationResult = JSON.parse(jsonMatch[0]);

    // Calculate final confidence
    // Combine AI confidence with average OCR confidence
    const avgOCRConfidence = results.reduce((sum, r) => sum + r.confidence, 0) / results.length;
    const finalConfidence = (aiResult.confidence / 100) * 0.7 + avgOCRConfidence * 0.3;

    return {
      finalText: aiResult.correctedText,
      confidence: finalConfidence,
      method: 'ai_arbiter',
      individualResults: results,
      needsReview: finalConfidence < 0.75 || aiResult.errors.length > 3,
      aiValidation: aiResult,
      agreementRatio: results.filter(r =>
        r.text.toLowerCase() === aiResult.correctedText.toLowerCase()
      ).length / results.length
    };

  } catch (error) {
    console.error('AI arbiter failed:', error);

    // Fallback to weighted voting if AI fails
    const { weightedVote } = await import('./weighted');
    const fallbackResult = weightedVote(results);

    return {
      ...fallbackResult,
      needsReview: true // Always flag for review if AI failed
    };
  }
}

/**
 * Validate OCR result with Claude (for single result quality check)
 */
export async function validateWithClaude(
  text: string,
  contentType: 'math' | 'text' = 'text'
): Promise<AIValidationResult> {
  const prompt = `You are validating OCR output from a ${contentType === 'math' ? 'mathematical' : 'handwritten'} document.

OCR Result: "${text}"

Task:
1. Check for common OCR errors
2. Fix any mistakes you find
3. ${contentType === 'math' ? 'Validate mathematical syntax' : 'Check spelling and grammar'}
4. Rate the quality (0-100%)

Respond in JSON format:
{
  "correctedText": "corrected version if needed, otherwise same as input",
  "confidence": 95,
  "reasoning": "what you checked and found",
  "errors": ["list of errors found"],
  "mathValid": ${contentType === 'math' ? 'true/false' : 'null'}
}`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 800,
      temperature: 0,
      messages: [{
        role: 'user',
        content: prompt
      }]
    });

    const textContent = response.content[0].type === 'text' ? response.content[0].text : '';
    const jsonMatch = textContent.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      throw new Error('Could not parse JSON from Claude response');
    }

    return JSON.parse(jsonMatch[0]);

  } catch (error) {
    console.error('Claude validation failed:', error);
    // Return original text with low confidence
    return {
      correctedText: text,
      confidence: 0.5,
      reasoning: 'AI validation failed',
      errors: [],
      mathValid: undefined
    };
  }
}

/**
 * Compare two OCR results and determine which is more likely correct
 */
export async function compareResults(
  result1: OCRResult,
  result2: OCRResult,
  context?: string
): Promise<{ winner: OCRResult; confidence: number; reasoning: string }> {
  const prompt = `Compare these two OCR results and determine which is more likely correct.

${context ? `Context: ${context}\n` : ''}
Result 1 (${result1.engine}, confidence: ${(result1.confidence * 100).toFixed(1)}%):
"${result1.text}"

Result 2 (${result2.engine}, confidence: ${(result2.confidence * 100).toFixed(1)}%):
"${result2.text}"

Which result is more likely correct? Consider:
- OCR confidence scores
- Common OCR errors
- Mathematical/textual validity
- Engine reliability

Respond in JSON format:
{
  "winner": 1 or 2,
  "confidence": 0-100,
  "reasoning": "brief explanation"
}`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 500,
      temperature: 0,
      messages: [{
        role: 'user',
        content: prompt
      }]
    });

    const textContent = response.content[0].type === 'text' ? response.content[0].text : '';
    const jsonMatch = textContent.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      throw new Error('Could not parse JSON from Claude response');
    }

    const comparison = JSON.parse(jsonMatch[0]);
    const winner = comparison.winner === 1 ? result1 : result2;

    return {
      winner,
      confidence: comparison.confidence / 100,
      reasoning: comparison.reasoning
    };

  } catch (error) {
    console.error('Comparison failed:', error);
    // Default to higher confidence result
    return {
      winner: result1.confidence >= result2.confidence ? result1 : result2,
      confidence: Math.max(result1.confidence, result2.confidence),
      reasoning: 'AI comparison failed, using higher confidence result'
    };
  }
}
