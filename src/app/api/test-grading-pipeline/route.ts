/**
 * Test API Endpoint for Complete Grading Pipeline
 *
 * POST /api/test-grading-pipeline
 *
 * Tests the end-to-end extraction and grading workflow with provided PDFs.
 */

import { NextRequest, NextResponse } from 'next/server';
import { processStudentSubmission, processSolutionKey } from '@/lib/workflows/submission-grading';
import { db } from '@/lib/database';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    // Get form inputs
    const studentPdf = formData.get('studentPdf') as File | null;
    const solutionPdf = formData.get('solutionPdf') as File | null;
    const assignmentId = (formData.get('assignmentId') as string) || `test_assignment_${Date.now()}`;
    const studentId = (formData.get('studentId') as string) || `test_student_${Date.now()}`;
    const questionNumbersStr = (formData.get('questionNumbers') as string) || '1,2,3,4,5,6';

    // Validate inputs
    if (!studentPdf) {
      return NextResponse.json(
        { success: false, error: 'Missing studentPdf file' },
        { status: 400 }
      );
    }

    // Parse question numbers
    const questionNumbers = questionNumbersStr
      .split(',')
      .map((n) => parseInt(n.trim()))
      .filter((n) => !isNaN(n));

    if (questionNumbers.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid questionNumbers format' },
        { status: 400 }
      );
    }

    console.log(`\n${'='.repeat(80)}`);
    console.log('🧪 TESTING COMPLETE GRADING PIPELINE');
    console.log('='.repeat(80));
    console.log(`Assignment ID: ${assignmentId}`);
    console.log(`Student ID: ${studentId}`);
    console.log(`Question Numbers: ${questionNumbers.join(', ')}`);
    console.log('='.repeat(80) + '\n');

    const startTime = Date.now();
    const results: any = {
      assignmentId,
      studentId,
      questionNumbers,
      timestamp: new Date().toISOString(),
    };

    // Step 1: Create test assignment if it doesn't exist
    let assignment = await db.getAssignment(assignmentId);

    if (!assignment) {
      console.log('📝 Creating test assignment...');
      assignment = {
        id: assignmentId,
        courseId: 'test_course',
        name: 'Test Assignment - Probability & Statistics',
        description: 'Auto-generated test assignment for pipeline validation',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
        totalPoints: questionNumbers.length * 10, // 10 points per question
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      await db.saveAssignment(assignment);

      // Create questions
      for (const [index, qNum] of questionNumbers.entries()) {
        const question = {
          id: `${assignmentId}_q${qNum}`,
          assignmentId,
          name: `Question ${qNum}`,
          description: `Question ${qNum} from the assignment`,
          totalPoints: 10,
          orderIndex: index,
          createdAt: new Date(),
        };
        await db.saveAssignmentQuestion(question);
      }

      console.log(`✅ Created assignment with ${questionNumbers.length} questions\n`);
    }

    // Step 2: Process solution key (if provided)
    if (solutionPdf) {
      console.log('📘 STEP 1: Processing Solution Key');
      console.log('-'.repeat(80));

      const solutionBuffer = Buffer.from(await solutionPdf.arrayBuffer());
      const solutionResult = await processSolutionKey(
        solutionBuffer,
        assignmentId,
        solutionPdf.name,
        questionNumbers
      );

      results.solutionProcessing = {
        success: solutionResult.success,
        solutionsCreated: solutionResult.solutions?.length || 0,
        warnings: solutionResult.warnings,
        error: solutionResult.error,
      };

      if (!solutionResult.success) {
        console.error(`❌ Solution processing failed: ${solutionResult.error}\n`);
      } else {
        console.log(`✅ Solution processing complete\n`);
      }
    } else {
      console.log('⚠️ No solution PDF provided, skipping solution extraction\n');
    }

    // Step 3: Process student submission
    console.log('📄 STEP 2: Processing Student Submission');
    console.log('-'.repeat(80));

    const studentBuffer = Buffer.from(await studentPdf.arrayBuffer());
    const submissionResult = await processStudentSubmission(
      studentBuffer,
      assignmentId,
      studentId,
      questionNumbers
    );

    results.submissionProcessing = {
      success: submissionResult.success,
      submissionId: submissionResult.submissionId,
      extractionResult: submissionResult.extractionResult,
      gradingResult: submissionResult.gradingResult,
      warnings: submissionResult.warnings,
      error: submissionResult.error,
    };

    const totalTime = Date.now() - startTime;
    results.performance = {
      totalPipelineTime: totalTime,
      extractionTime: submissionResult.extractionResult?.processingTime,
      avgTimePerQuestion: submissionResult.extractionResult?.processingTime
        ? submissionResult.extractionResult.processingTime / questionNumbers.length
        : undefined,
    };

    // Print summary
    console.log('\n' + '='.repeat(80));
    console.log('📊 PIPELINE TEST RESULTS');
    console.log('='.repeat(80));
    console.log(`Overall Success: ${submissionResult.success ? '✅' : '❌'}`);

    if (submissionResult.success && submissionResult.gradingResult) {
      const { totalScore, maxScore, questionGrades } = submissionResult.gradingResult;
      console.log(`\nGrading Results:`);
      console.log(`  Total Score: ${totalScore}/${maxScore} (${((totalScore / maxScore) * 100).toFixed(1)}%)`);
      console.log(`\n  Question Breakdown:`);
      questionGrades.forEach((q) => {
        console.log(`    Q${q.questionNumber}: ${q.pointsAwarded}/${q.maxPoints} points`);
        if (q.feedback) {
          console.log(`      Feedback: ${q.feedback.substring(0, 100)}${q.feedback.length > 100 ? '...' : ''}`);
        }
      });
    }

    if (submissionResult.extractionResult?.tokenUsage) {
      const { inputTokens, outputTokens } = submissionResult.extractionResult.tokenUsage;
      console.log(`\nToken Usage:`);
      console.log(`  Input: ${inputTokens.toLocaleString()}`);
      console.log(`  Output: ${outputTokens.toLocaleString()}`);
      console.log(`  Total: ${(inputTokens + outputTokens).toLocaleString()}`);

      // Estimate cost (approximate pricing for Claude Sonnet 4.5)
      const inputCost = (inputTokens / 1_000_000) * 15; // $15 per MTok
      const outputCost = (outputTokens / 1_000_000) * 75; // $75 per MTok
      const totalCost = inputCost + outputCost;
      console.log(`  Estimated Cost: $${totalCost.toFixed(4)}`);
    }

    console.log(`\nPerformance:`);
    console.log(`  Total Pipeline Time: ${(totalTime / 1000).toFixed(2)}s`);
    if (results.performance.extractionTime) {
      console.log(`  Extraction Time: ${(results.performance.extractionTime / 1000).toFixed(2)}s`);
    }
    if (results.performance.avgTimePerQuestion) {
      console.log(`  Avg Time per Question: ${(results.performance.avgTimePerQuestion / 1000).toFixed(2)}s`);
    }

    if (submissionResult.warnings && submissionResult.warnings.length > 0) {
      console.log(`\n⚠️ Warnings:`);
      submissionResult.warnings.forEach((w) => console.log(`  - ${w}`));
    }

    console.log('\n' + '='.repeat(80) + '\n');

    // Return results
    return NextResponse.json({
      success: submissionResult.success,
      results,
      message: submissionResult.success
        ? 'Pipeline test completed successfully'
        : 'Pipeline test failed',
    });
  } catch (error) {
    console.error('❌ Pipeline test error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

// GET endpoint to show usage instructions
export async function GET() {
  return NextResponse.json({
    endpoint: '/api/test-grading-pipeline',
    method: 'POST',
    description: 'Tests the complete extraction and grading pipeline',
    parameters: {
      studentPdf: {
        type: 'File',
        required: true,
        description: 'Student submission PDF',
      },
      solutionPdf: {
        type: 'File',
        required: false,
        description: 'Solution key PDF (optional, will create solutions if provided)',
      },
      assignmentId: {
        type: 'string',
        required: false,
        description: 'Assignment ID (auto-generated if not provided)',
      },
      studentId: {
        type: 'string',
        required: false,
        description: 'Student ID (auto-generated if not provided)',
      },
      questionNumbers: {
        type: 'string',
        required: false,
        default: '1,2,3,4,5,6',
        description: 'Comma-separated question numbers (e.g., "1,2,3,4,5,6")',
      },
    },
    example: {
      curl: `curl -X POST http://localhost:3000/api/test-grading-pipeline \\
  -F "studentPdf=@TEST_DATA/TAI_Answer.pdf" \\
  -F "solutionPdf=@TEST_DATA/TAI_Solution.pdf" \\
  -F "questionNumbers=1,2,3,4,5,6"`,
    },
  });
}
