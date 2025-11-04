/**
 * Multi-Engine Grading Logic
 *
 * Grades student submissions using results from multiple OCR engines
 * and stores comparison data for the dashboard.
 */

import type { StructuredAnswer, OCREngineResult } from '@/types';
import { gradeAssignment } from '@/app/actions';
import { db } from '../database';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export interface MultiEngineGradingResult {
  success: boolean;
  bestEngineGrade: {
    engine: string;
    totalScore: number;
    maxScore: number;
  };
  allEngineGrades: Array<{
    engine: string;
    totalScore: number;
    maxScore: number;
    questionResults: Array<{
      questionNumber: number;
      pointsAwarded: number;
      maxPoints: number;
      feedback: string;
    }>;
  }>;
  error?: string;
}

/**
 * Grade a student submission using multiple OCR engine extractions
 */
export async function gradeWithAllEngines(
  assignmentId: string,
  studentId: string,
  submissionId: string,
  engineResults: Array<{
    engine: 'claude' | 'paddleocr' | 'pix2text';
    structuredAnswers: StructuredAnswer[];
    confidence?: number;
    processingTime: number;
    metadata?: any;
  }>
): Promise<MultiEngineGradingResult> {
  console.log(`🎯 Grading submission with ${engineResults.length} engine results`);

  const allEngineGrades: MultiEngineGradingResult['allEngineGrades'] = [];

  // Get assignment questions and solutions for grading context
  const questions = await db.getAssignmentQuestions(assignmentId);
  const solutions = await Promise.all(
    questions.map(async (q) => {
      const qNum = q.orderIndex + 1;
      const solutionKey = await db.getSolution(`solution-${assignmentId}-q${qNum}`);
      return {
        questionNumber: qNum,
        questionId: q.id,
        solution: solutionKey?.fileContent || '',
        maxPoints: q.totalPoints,
      };
    })
  );

  // Grade each engine's extraction separately
  for (const engineResult of engineResults) {
    try {
      console.log(`   Grading ${engineResult.engine} extraction...`);

      const questionResults = await Promise.all(
        engineResult.structuredAnswers.map(async (answer) => {
          const solutionData = solutions.find(s => s.questionNumber === answer.questionNumber);

          if (!solutionData) {
            return {
              questionNumber: answer.questionNumber,
              pointsAwarded: 0,
              maxPoints: 0,
              feedback: 'Solution key not found'
            };
          }

          // Grade this specific answer using Claude
          const grading = await gradeStudentAnswer(
            answer.content,
            solutionData.solution,
            solutionData.maxPoints
          );

          return {
            questionNumber: answer.questionNumber,
            pointsAwarded: grading.points,
            maxPoints: solutionData.maxPoints,
            feedback: grading.feedback
          };
        })
      );

      const totalScore = questionResults.reduce((sum, r) => sum + r.pointsAwarded, 0);
      const maxScore = questionResults.reduce((sum, r) => sum + r.maxPoints, 0);

      allEngineGrades.push({
        engine: engineResult.engine,
        totalScore,
        maxScore,
        questionResults
      });

      console.log(`   ✅ ${engineResult.engine}: ${totalScore}/${maxScore}`);
    } catch (error) {
      console.error(`   ❌ Failed to grade ${engineResult.engine}:`, error);
      allEngineGrades.push({
        engine: engineResult.engine,
        totalScore: 0,
        maxScore: solutions.reduce((sum, s) => sum + s.maxPoints, 0),
        questionResults: solutions.map(s => ({
          questionNumber: s.questionNumber,
          pointsAwarded: 0,
          maxPoints: s.maxPoints,
          feedback: `Grading failed: ${error instanceof Error ? error.message : String(error)}`
        }))
      });
    }
  }

  // Find best engine result (highest score)
  const bestGrade = allEngineGrades.reduce((best, current) =>
    current.totalScore > best.totalScore ? current : best
  );

  return {
    success: true,
    bestEngineGrade: {
      engine: bestGrade.engine,
      totalScore: bestGrade.totalScore,
      maxScore: bestGrade.maxScore
    },
    allEngineGrades
  };
}

/**
 * Grade a single student answer against solution key using Claude
 */
async function gradeStudentAnswer(
  studentAnswer: string,
  solutionKey: string,
  maxPoints: number
): Promise<{ points: number; feedback: string }> {
  const gradingPrompt = `You are an expert grader for mathematics and probability courses.

Grade the following student answer against the solution key.

**Solution Key:**
${solutionKey}

**Student Answer:**
${studentAnswer}

**Maximum Points:** ${maxPoints}

Provide your grading in JSON format:
{
  "points": <number between 0 and ${maxPoints}>,
  "feedback": "<detailed feedback explaining the grade>"
}

Be fair and give partial credit where appropriate. Focus on mathematical correctness and methodology.`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: gradingPrompt
      }]
    });

    const content = response.content[0];

    // Better error handling for API responses
    if (!content) {
      console.error('[Grading] Empty response from Claude API');
      console.error('[Grading] Full response:', JSON.stringify(response, null, 2));
      throw new Error('Empty response from Claude - no content blocks');
    }

    if (content.type !== 'text') {
      console.error('[Grading] Unexpected content type:', content.type);
      console.error('[Grading] Full response:', JSON.stringify(response, null, 2));
      throw new Error(`Unexpected response type from Claude: ${content.type}. Expected 'text' but got '${content.type}'`);
    }

    // Extract JSON from response
    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not extract JSON from grading response');
    }

    const result = JSON.parse(jsonMatch[0]);
    return {
      points: Math.min(Math.max(0, result.points), maxPoints),
      feedback: result.feedback || 'No feedback provided'
    };
  } catch (error) {
    console.error('Grading error:', error);
    return {
      points: 0,
      feedback: `Grading failed: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

/**
 * Store multi-engine grading results in QuestionSubmission records
 */
export async function saveMultiEngineGradingResults(
  submissionId: string,
  questionSubmissions: Array<{
    questionId: string;
    questionNumber: number;
  }>,
  allEngineGrades: MultiEngineGradingResult['allEngineGrades']
): Promise<void> {
  for (const qs of questionSubmissions) {
    // Build OCR engine results array for this question
    const ocrEngineResults: OCREngineResult[] = allEngineGrades.map(engineGrade => {
      const questionResult = engineGrade.questionResults.find(
        r => r.questionNumber === qs.questionNumber
      );

      return {
        engine: engineGrade.engine as 'claude' | 'paddleocr' | 'pix2text',
        extractedText: '', // We'll need to pass this separately
        pointsAwarded: questionResult?.pointsAwarded || 0,
        feedback: questionResult?.feedback || '',
        confidence: 0, // We'll need to pass this separately
        processingTime: 0 // We'll need to pass this separately
      };
    });

    // Get existing question submission
    const existingQS = await db.getQuestionSubmission(qs.questionId, submissionId);

    if (existingQS) {
      // Update with multi-engine results
      existingQS.ocrEngineResults = ocrEngineResults;
      existingQS.selectedEngine = 'claude'; // Default to Claude as best engine
      existingQS.updatedAt = new Date();
      await db.saveQuestionSubmission(existingQS);
    }
  }
}
