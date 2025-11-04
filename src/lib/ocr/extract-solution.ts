/**
 * Solution Key Extraction Tool
 *
 * Extracts answer keys from solution PDFs and stores them in the format
 * expected by the auto-grading system.
 */

import Anthropic from '@anthropic-ai/sdk';
import type { Solution } from '@/types';
import { extractRawTextFromPDF } from './grading-adapter';

export interface SolutionExtractionResult {
  success: boolean;
  solutions: Solution[];
  rawText?: string;
  error?: string;
  metadata?: {
    model?: string;
    processingTime?: number;
    tokenUsage?: {
      inputTokens: number;
      outputTokens: number;
    };
  };
}

export interface QuestionSolution {
  questionNumber: number;
  solution: string;
}

/**
 * Extract solution key from PDF with per-question breakdown
 *
 * @param pdfBuffer - The solution PDF as a Buffer
 * @param assignmentId - The assignment ID this solution belongs to
 * @param fileName - Original filename of the solution PDF
 * @param questionNumbers - Array of question numbers in the assignment
 * @returns SolutionExtractionResult with individual solutions per question
 */
export async function extractSolutionKeyFromPDF(
  pdfBuffer: Buffer,
  assignmentId: string,
  fileName: string,
  questionNumbers: number[]
): Promise<SolutionExtractionResult> {
  const startTime = Date.now();

  try {
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const base64Pdf = pdfBuffer.toString('base64');

    // Create prompt for structured solution extraction
    const prompt = `Please extract the solution key from this PDF document.

This is a homework solution key with ${questionNumbers.length} questions numbered ${questionNumbers.join(', ')}.

For each question, extract:
- The complete solution including all steps
- Mathematical expressions in LaTeX format
- Final answers
- Any important notes or key concepts

Return ONLY a valid JSON object (no markdown, no code blocks) with this exact structure:
{
  "solutions": [
    {
      "questionNumber": 1,
      "solution": "Complete solution for question 1 with all steps shown. Use LaTeX: P(X = k) = \\\\frac{\\\\lambda^k e^{-\\\\lambda}}{k!}..."
    },
    {
      "questionNumber": 2,
      "solution": "Complete solution for question 2..."
    }
  ]
}

IMPORTANT:
- Extract ALL solution details, not just final answers
- Include intermediate steps and explanations
- Use LaTeX notation for mathematical content
- If a question has multiple parts (a, b, c), include ALL parts
- Ensure questionNumber is a number, not a string`;

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 8192,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'document',
              source: {
                type: 'base64',
                media_type: 'application/pdf',
                data: base64Pdf,
              },
            },
            {
              type: 'text',
              text: prompt,
            },
          ],
        },
      ],
    });

    // Extract text from response
    const responseText = response.content
      .filter((block) => block.type === 'text')
      .map((block) => (block as any).text)
      .join('\n');

    // Parse JSON response
    let parsedResponse: { solutions: QuestionSolution[] };
    try {
      parsedResponse = JSON.parse(responseText);
    } catch (parseError) {
      // Try to extract JSON from markdown code block if present
      const jsonMatch = responseText.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
      if (jsonMatch) {
        parsedResponse = JSON.parse(jsonMatch[1]);
      } else {
        throw new Error(`Failed to parse Claude response as JSON: ${responseText.substring(0, 200)}`);
      }
    }

    // Validate response structure
    if (!parsedResponse.solutions || !Array.isArray(parsedResponse.solutions)) {
      throw new Error('Invalid response format: missing "solutions" array');
    }

    // Convert to Solution objects (one per question)
    const solutions: Solution[] = questionNumbers.map((qNum) => {
      const found = parsedResponse.solutions.find((s) => s.questionNumber === qNum);

      return {
        id: `solution-${assignmentId}-q${qNum}`,
        assignmentId,
        fileName: `${fileName}-q${qNum}`,
        fileContent: found?.solution || '', // Store as text content
        uploadedAt: new Date(),
      };
    });

    return {
      success: true,
      solutions,
      rawText: responseText,
      metadata: {
        model: 'claude-sonnet-4-5-20250929',
        processingTime: Date.now() - startTime,
        tokenUsage: {
          inputTokens: response.usage.input_tokens,
          outputTokens: response.usage.output_tokens,
        },
      },
    };
  } catch (error) {
    return {
      success: false,
      solutions: [],
      error: error instanceof Error ? error.message : String(error),
      metadata: {
        processingTime: Date.now() - startTime,
      },
    };
  }
}

/**
 * Extract solution key as a single combined document
 * (Alternative approach if you want one solution for all questions)
 *
 * @param pdfBuffer - The solution PDF as a Buffer
 * @param assignmentId - The assignment ID
 * @param fileName - Original filename
 * @returns Single Solution object with all questions combined
 */
export async function extractCombinedSolutionKey(
  pdfBuffer: Buffer,
  assignmentId: string,
  fileName: string
): Promise<SolutionExtractionResult> {
  const startTime = Date.now();

  try {
    // Extract raw text using the adapter utility
    const rawText = await extractRawTextFromPDF(pdfBuffer);

    // Create single solution with base64 PDF and extracted text
    const solution: Solution = {
      id: `solution-${assignmentId}`,
      assignmentId,
      fileName,
      fileContent: pdfBuffer.toString('base64'), // Store as base64 PDF
      uploadedAt: new Date(),
    };

    return {
      success: true,
      solutions: [solution],
      rawText,
      metadata: {
        processingTime: Date.now() - startTime,
      },
    };
  } catch (error) {
    return {
      success: false,
      solutions: [],
      error: error instanceof Error ? error.message : String(error),
      metadata: {
        processingTime: Date.now() - startTime,
      },
    };
  }
}

/**
 * Compare student answer against solution for validation
 * (Helper function for quality checks)
 *
 * @param studentAnswer - The student's answer
 * @param solutionKey - The correct solution
 * @returns Similarity score and feedback
 */
export async function compareAnswerToSolution(
  studentAnswer: string,
  solutionKey: string
): Promise<{
  similarityScore: number; // 0-100
  feedback: string;
  keyDifferences: string[];
}> {
  try {
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: `Compare this student answer to the solution key and provide analysis.

**Student Answer:**
${studentAnswer}

**Solution Key:**
${solutionKey}

Return ONLY valid JSON (no markdown, no code blocks):
{
  "similarityScore": 85,
  "feedback": "Brief assessment of correctness",
  "keyDifferences": ["Difference 1", "Difference 2"]
}`,
        },
      ],
    });

    const responseText = response.content
      .filter((block) => block.type === 'text')
      .map((block) => (block as any).text)
      .join('\n');

    let parsed: { similarityScore: number; feedback: string; keyDifferences: string[] };
    try {
      parsed = JSON.parse(responseText);
    } catch {
      const jsonMatch = responseText.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[1]);
      } else {
        throw new Error('Failed to parse comparison response');
      }
    }

    return parsed;
  } catch (error) {
    return {
      similarityScore: 0,
      feedback: `Error comparing answers: ${error instanceof Error ? error.message : String(error)}`,
      keyDifferences: [],
    };
  }
}

/**
 * Validate solution extraction results
 *
 * @param solutions - The extracted solutions
 * @param expectedQuestionNumbers - Expected question numbers
 * @returns Validation result
 */
export function validateSolutionExtraction(
  solutions: Solution[],
  expectedQuestionNumbers: number[]
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!solutions || !Array.isArray(solutions)) {
    errors.push('Solutions must be an array');
    return { valid: false, errors };
  }

  // Check for missing questions
  if (solutions.length !== expectedQuestionNumbers.length) {
    errors.push(
      `Expected ${expectedQuestionNumbers.length} solutions, got ${solutions.length}`
    );
  }

  // Validate each solution
  solutions.forEach((solution, index) => {
    if (!solution.id) {
      errors.push(`Solution ${index}: missing id`);
    }
    if (!solution.assignmentId) {
      errors.push(`Solution ${index}: missing assignmentId`);
    }
    if (!solution.fileContent || solution.fileContent.length === 0) {
      errors.push(`Solution ${index}: empty fileContent`);
    }
  });

  return {
    valid: errors.length === 0,
    errors,
  };
}
