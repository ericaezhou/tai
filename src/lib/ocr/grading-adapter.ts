/**
 * OCR to Grading System Adapter
 *
 * Converts OCR/Claude extraction output into the StructuredAnswer[] format
 * required by the auto-grading system.
 */

import Anthropic from '@anthropic-ai/sdk';
import type { StructuredAnswer } from '@/types';

export interface ExtractionResult {
  success: boolean;
  structuredAnswers: StructuredAnswer[];
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

/**
 * Extract structured answers from PDF using Claude's direct PDF extraction
 *
 * @param pdfBuffer - The PDF file as a Buffer
 * @param questionNumbers - Array of question numbers to extract (e.g., [1, 2, 3, 4, 5, 6])
 * @returns ExtractionResult with structured answers
 */
export async function extractStructuredAnswersFromPDF(
  pdfBuffer: Buffer,
  questionNumbers: number[]
): Promise<ExtractionResult> {
  const startTime = Date.now();

  try {
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const base64Pdf = pdfBuffer.toString('base64');

    // Create prompt that requests structured JSON output
    const prompt = `Please extract the student's answers from this homework submission PDF.

This appears to be a homework assignment with ${questionNumbers.length} questions numbered ${questionNumbers.join(', ')}.

For each question, extract the complete answer including:
- All mathematical expressions and formulas (in LaTeX format when possible)
- Written explanations and reasoning
- Calculations and work shown
- Final answers

Return ONLY a valid JSON object (no markdown, no code blocks) with this exact structure:
{
  "answers": [
    {
      "questionNumber": 1,
      "content": "The complete answer for question 1, including all work shown and calculations. Use LaTeX notation for math: E[X] = \\\\sum..."
    },
    {
      "questionNumber": 2,
      "content": "The complete answer for question 2..."
    }
  ]
}

IMPORTANT:
- Extract ALL visible work and calculations for each question
- Preserve mathematical notation using LaTeX where appropriate
- If a question has multiple parts (a, b, c), include ALL parts in the content
- If you cannot find an answer for a question, include it with empty content: ""
- Ensure the questionNumber field is a number, not a string`;

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 8192, // Increased for longer submissions
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
    let parsedResponse: { answers: StructuredAnswer[] };
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
    if (!parsedResponse.answers || !Array.isArray(parsedResponse.answers)) {
      throw new Error('Invalid response format: missing "answers" array');
    }

    // Ensure all requested questions are present
    const structuredAnswers: StructuredAnswer[] = questionNumbers.map((qNum) => {
      const found = parsedResponse.answers.find((a) => a.questionNumber === qNum);
      return {
        questionNumber: qNum,
        content: found?.content || '',
      };
    });

    return {
      success: true,
      structuredAnswers,
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
      structuredAnswers: [],
      error: error instanceof Error ? error.message : String(error),
      metadata: {
        processingTime: Date.now() - startTime,
      },
    };
  }
}

/**
 * Validate that structured answers match the expected format
 *
 * @param answers - The structured answers to validate
 * @param expectedQuestionNumbers - The question numbers that should be present
 * @returns Validation result with any errors found
 */
export function validateStructuredAnswers(
  answers: StructuredAnswer[],
  expectedQuestionNumbers: number[]
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check if answers array exists
  if (!answers || !Array.isArray(answers)) {
    errors.push('Answers must be an array');
    return { valid: false, errors };
  }

  // Check for missing questions
  const presentQuestions = new Set(answers.map((a) => a.questionNumber));
  const missingQuestions = expectedQuestionNumbers.filter((q) => !presentQuestions.has(q));
  if (missingQuestions.length > 0) {
    errors.push(`Missing answers for questions: ${missingQuestions.join(', ')}`);
  }

  // Validate each answer
  answers.forEach((answer, index) => {
    if (typeof answer.questionNumber !== 'number') {
      errors.push(`Answer ${index}: questionNumber must be a number, got ${typeof answer.questionNumber}`);
    }
    if (typeof answer.content !== 'string') {
      errors.push(`Answer ${index}: content must be a string, got ${typeof answer.content}`);
    }
    if (!expectedQuestionNumbers.includes(answer.questionNumber)) {
      errors.push(`Answer ${index}: unexpected question number ${answer.questionNumber}`);
    }
  });

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Extract raw text from PDF using Claude (for debugging/comparison)
 *
 * @param pdfBuffer - The PDF file as a Buffer
 * @returns Raw extracted text
 */
export async function extractRawTextFromPDF(pdfBuffer: Buffer): Promise<string> {
  try {
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const base64Pdf = pdfBuffer.toString('base64');

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 4096,
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
              text: 'Please extract ALL text from this PDF document. Preserve mathematical notation using LaTeX format where appropriate.',
            },
          ],
        },
      ],
    });

    return response.content
      .filter((block) => block.type === 'text')
      .map((block) => (block as any).text)
      .join('\n');
  } catch (error) {
    throw new Error(`Failed to extract raw text: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Convert legacy OCR results to StructuredAnswer format
 * (In case we ever need to use traditional OCR for typed submissions)
 *
 * @param ocrResults - Array of OCR results with page numbers
 * @param questionNumbers - Expected question numbers
 * @returns Structured answers (best effort extraction)
 */
export function convertOCRToStructuredAnswers(
  ocrResults: Array<{ page: number; text: string }>,
  questionNumbers: number[]
): StructuredAnswer[] {
  // This is a fallback for traditional OCR
  // For handwritten content, use extractStructuredAnswersFromPDF instead

  const structuredAnswers: StructuredAnswer[] = [];

  // Combine all text
  const fullText = ocrResults.map((r) => r.text).join('\n\n');

  // Try to split by question numbers
  questionNumbers.forEach((qNum) => {
    // Look for patterns like "Question 1", "1.", "(1)", etc.
    const patterns = [
      new RegExp(`Question\\s+${qNum}[.:\\s]+(.*?)(?=Question\\s+\\d+|$)`, 'is'),
      new RegExp(`${qNum}\\.\\s+(.*?)(?=\\d+\\.|$)`, 'is'),
      new RegExp(`\\(${qNum}\\)\\s+(.*?)(?=\\(\\d+\\)|$)`, 'is'),
    ];

    let content = '';
    for (const pattern of patterns) {
      const match = fullText.match(pattern);
      if (match && match[1]) {
        content = match[1].trim();
        break;
      }
    }

    structuredAnswers.push({
      questionNumber: qNum,
      content,
    });
  });

  return structuredAnswers;
}
