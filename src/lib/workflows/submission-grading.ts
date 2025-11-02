/**
 * Complete Submission Grading Pipeline
 *
 * End-to-end workflow for extracting student submissions, matching with solutions,
 * and running auto-grading.
 */

import type { Solution, StructuredAnswer, StudentAssignmentSubmission } from '@/types';
import { extractStructuredAnswersFromPDF, validateStructuredAnswers } from '../ocr/grading-adapter';
import { extractSolutionKeyFromPDF, validateSolutionExtraction } from '../ocr/extract-solution';
import { db } from '../database';
import { gradeAssignment } from '@/app/actions';

export interface PipelineResult {
  success: boolean;
  submissionId?: string;
  extractionResult?: {
    structuredAnswers: StructuredAnswer[];
    processingTime: number;
    tokenUsage?: { inputTokens: number; outputTokens: number };
  };
  gradingResult?: {
    totalScore: number;
    maxScore: number;
    questionGrades: Array<{
      questionNumber: number;
      pointsAwarded: number;
      maxPoints: number;
      feedback: string;
    }>;
  };
  error?: string;
  warnings?: string[];
}

/**
 * Process a student PDF submission through the complete grading pipeline
 *
 * Steps:
 * 1. Extract structured answers from student PDF using Claude
 * 2. Validate extracted answers
 * 3. Create/update submission record in database
 * 4. Run auto-grading against solution keys
 * 5. Return complete grading results
 *
 * @param studentPdfBuffer - Student's submission PDF
 * @param assignmentId - The assignment ID
 * @param studentId - The student ID
 * @param questionNumbers - Array of question numbers (e.g., [1,2,3,4,5,6])
 * @returns PipelineResult with grading results
 */
export async function processStudentSubmission(
  studentPdfBuffer: Buffer,
  assignmentId: string,
  studentId: string,
  questionNumbers: number[]
): Promise<PipelineResult> {
  const warnings: string[] = [];

  try {
    console.log(`📄 Processing submission for student ${studentId}, assignment ${assignmentId}`);

    // Step 1: Extract structured answers using Claude
    console.log('🔍 Extracting answers from PDF...');
    const extractionResult = await extractStructuredAnswersFromPDF(
      studentPdfBuffer,
      questionNumbers
    );

    if (!extractionResult.success) {
      return {
        success: false,
        error: `Extraction failed: ${extractionResult.error}`,
      };
    }

    console.log(`✅ Extracted ${extractionResult.structuredAnswers.length} answers`);

    // Step 2: Validate extracted answers
    const validation = validateStructuredAnswers(
      extractionResult.structuredAnswers,
      questionNumbers
    );

    if (!validation.valid) {
      warnings.push(...validation.errors);
      console.warn('⚠️ Validation warnings:', validation.errors);
    }

    // Step 3: Get or create submission record
    let submission = await db.getStudentSubmissionByAssignment(assignmentId, studentId);

    if (!submission) {
      // Create new submission
      const submissionId = `sub_${Date.now()}_${studentId}`;
      submission = {
        id: submissionId,
        assignmentId,
        studentId,
        status: 'ungraded',
        structuredAnswer: extractionResult.structuredAnswers,
        submittedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      await db.saveStudentSubmission(submission);
      console.log(`✅ Created new submission: ${submissionId}`);
    } else {
      // Update existing submission
      submission.structuredAnswer = extractionResult.structuredAnswers;
      submission.status = 'ungraded';
      submission.submittedAt = new Date();
      submission.updatedAt = new Date();
      await db.saveStudentSubmission(submission);
      console.log(`✅ Updated existing submission: ${submission.id}`);
    }

    // Step 4: Run auto-grading
    console.log('🎯 Running auto-grading...');
    const gradingResult = await gradeAssignment(assignmentId, studentId);

    // Extract grading details
    const questionSubmissions = await db.getQuestionSubmissions(submission.id);

    const questionGrades = await Promise.all(questionSubmissions.map(async (qs) => {
      const questions = await db.getAssignmentQuestions(assignmentId);
      const question = questions.find(q => q.id === qs.questionId);
      return {
        questionNumber: question?.orderIndex! + 1, // Convert 0-indexed to 1-indexed
        pointsAwarded: qs.pointsAwarded || 0,
        maxPoints: question?.totalPoints || 0,
        feedback: qs.feedback || '',
      };
    }));

    const totalScore = questionGrades.reduce((sum, q) => sum + q.pointsAwarded, 0);
    const maxScore = questionGrades.reduce((sum, q) => sum + q.maxPoints, 0);

    console.log(`✅ Grading complete: ${totalScore}/${maxScore}`);

    return {
      success: true,
      submissionId: submission.id,
      extractionResult: {
        structuredAnswers: extractionResult.structuredAnswers,
        processingTime: extractionResult.metadata?.processingTime || 0,
        tokenUsage: extractionResult.metadata?.tokenUsage,
      },
      gradingResult: {
        totalScore,
        maxScore,
        questionGrades,
      },
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  }
}

/**
 * Process and store solution key PDF
 *
 * @param solutionPdfBuffer - Solution key PDF
 * @param assignmentId - The assignment ID
 * @param fileName - Original filename
 * @param questionNumbers - Question numbers in the assignment
 * @returns Success status and created solutions
 */
export async function processSolutionKey(
  solutionPdfBuffer: Buffer,
  assignmentId: string,
  fileName: string,
  questionNumbers: number[]
): Promise<{
  success: boolean;
  solutions?: Solution[];
  error?: string;
  warnings?: string[];
}> {
  const warnings: string[] = [];

  try {
    console.log(`📘 Processing solution key for assignment ${assignmentId}`);

    // Extract solutions using Claude
    console.log('🔍 Extracting solutions from PDF...');
    const extractionResult = await extractSolutionKeyFromPDF(
      solutionPdfBuffer,
      assignmentId,
      fileName,
      questionNumbers
    );

    if (!extractionResult.success) {
      return {
        success: false,
        error: `Solution extraction failed: ${extractionResult.error}`,
      };
    }

    console.log(`✅ Extracted ${extractionResult.solutions.length} solutions`);

    // Validate extraction
    const validation = validateSolutionExtraction(
      extractionResult.solutions,
      questionNumbers
    );

    if (!validation.valid) {
      warnings.push(...validation.errors);
      console.warn('⚠️ Validation warnings:', validation.errors);
    }

    // Store solutions in database
    for (const solution of extractionResult.solutions) {
      await db.saveSolution(solution);
      console.log(`✅ Saved solution: ${solution.id}`);
    }

    return {
      success: true,
      solutions: extractionResult.solutions,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  }
}

/**
 * Batch process multiple student submissions
 *
 * @param submissions - Array of submission PDFs with metadata
 * @param assignmentId - The assignment ID
 * @param questionNumbers - Question numbers in the assignment
 * @returns Results for each submission
 */
export async function batchProcessSubmissions(
  submissions: Array<{
    pdfBuffer: Buffer;
    studentId: string;
    studentName?: string;
  }>,
  assignmentId: string,
  questionNumbers: number[]
): Promise<{
  success: boolean;
  results: Array<PipelineResult & { studentId: string; studentName?: string }>;
  summary: {
    total: number;
    successful: number;
    failed: number;
    avgScore?: number;
    avgProcessingTime?: number;
  };
}> {
  console.log(`📦 Batch processing ${submissions.length} submissions`);

  const results: Array<PipelineResult & { studentId: string; studentName?: string }> = [];
  let totalProcessingTime = 0;
  let totalScore = 0;
  let successfulCount = 0;

  for (const submission of submissions) {
    console.log(`\n--- Processing submission for ${submission.studentName || submission.studentId} ---`);

    const result = await processStudentSubmission(
      submission.pdfBuffer,
      assignmentId,
      submission.studentId,
      questionNumbers
    );

    results.push({
      ...result,
      studentId: submission.studentId,
      studentName: submission.studentName,
    });

    if (result.success) {
      successfulCount++;
      if (result.extractionResult) {
        totalProcessingTime += result.extractionResult.processingTime;
      }
      if (result.gradingResult) {
        totalScore += result.gradingResult.totalScore;
      }
    }
  }

  const avgScore = successfulCount > 0 ? totalScore / successfulCount : undefined;
  const avgProcessingTime = successfulCount > 0 ? totalProcessingTime / successfulCount : undefined;

  console.log(`\n✨ Batch processing complete:`);
  console.log(`   Total: ${submissions.length}`);
  console.log(`   Successful: ${successfulCount}`);
  console.log(`   Failed: ${submissions.length - successfulCount}`);
  if (avgScore !== undefined) {
    console.log(`   Average Score: ${avgScore.toFixed(2)}`);
  }

  return {
    success: successfulCount === submissions.length,
    results,
    summary: {
      total: submissions.length,
      successful: successfulCount,
      failed: submissions.length - successfulCount,
      avgScore,
      avgProcessingTime,
    },
  };
}

/**
 * Re-grade a submission (useful if solution key is updated)
 *
 * @param submissionId - The submission ID to re-grade
 * @returns Grading result
 */
export async function regradeSubmission(
  submissionId: string
): Promise<{
  success: boolean;
  gradingResult?: PipelineResult['gradingResult'];
  error?: string;
}> {
  try {
    const submission = await db.getStudentSubmission(submissionId);

    if (!submission) {
      return {
        success: false,
        error: `Submission not found: ${submissionId}`,
      };
    }

    console.log(`🔄 Re-grading submission ${submissionId}`);

    // Run grading with existing structured answers
    await gradeAssignment(submission.assignmentId, submission.studentId);

    // Get updated results
    const questionSubmissions = await db.getQuestionSubmissions(submissionId);

    const questionGrades = await Promise.all(questionSubmissions.map(async (qs) => {
      const questions = await db.getAssignmentQuestions(submission.assignmentId);
      const question = questions.find(q => q.id === qs.questionId);
      return {
        questionNumber: question?.orderIndex! + 1,
        pointsAwarded: qs.pointsAwarded || 0,
        maxPoints: question?.totalPoints || 0,
        feedback: qs.feedback || '',
      };
    }));

    const totalScore = questionGrades.reduce((sum, q) => sum + q.pointsAwarded, 0);
    const maxScore = questionGrades.reduce((sum, q) => sum + q.maxPoints, 0);

    console.log(`✅ Re-grading complete: ${totalScore}/${maxScore}`);

    return {
      success: true,
      gradingResult: {
        totalScore,
        maxScore,
        questionGrades,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
