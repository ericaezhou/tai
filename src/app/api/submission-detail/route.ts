import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/database";

/**
 * GET /api/submission-detail?submissionId={id}
 * Fetch detailed submission data for TA comparison dashboard
 *
 * Returns submission with multi-engine OCR results, student info, and assignment details
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const submissionId = searchParams.get("submissionId");

    if (!submissionId) {
      return NextResponse.json(
        { error: "submissionId parameter is required" },
        { status: 400 }
      );
    }

    // Fetch submission
    const submission = await db.getStudentSubmission(submissionId);
    if (!submission) {
      return NextResponse.json(
        { error: "Submission not found" },
        { status: 404 }
      );
    }

    // Fetch student
    const student = await db.getStudent(submission.studentId);
    if (!student) {
      return NextResponse.json(
        { error: "Student not found" },
        { status: 404 }
      );
    }

    // Fetch assignment
    const assignment = await db.getAssignment(submission.assignmentId);
    if (!assignment) {
      return NextResponse.json(
        { error: "Assignment not found" },
        { status: 404 }
      );
    }

    // Fetch question submissions with OCR engine results
    const questionSubmissions = await db.getQuestionSubmissions(submissionId);

    // Fetch assignment questions and join with question submissions
    const questions = await db.getAssignmentQuestions(submission.assignmentId);

    // Build response with joined data
    const questionSubmissionsWithQuestions = questionSubmissions.map((qs) => {
      const question = questions.find((q) => q.id === qs.questionId);
      return {
        ...qs,
        question: question || {
          id: qs.questionId,
          orderIndex: 0,
          totalPoints: 0,
          name: "Unknown Question",
        },
      };
    });

    // Sort by question order
    questionSubmissionsWithQuestions.sort(
      (a, b) => a.question.orderIndex - b.question.orderIndex
    );

    return NextResponse.json({
      student: {
        id: student.id,
        name: student.name,
        email: student.email,
      },
      assignment: {
        id: assignment.id,
        name: assignment.name,
        dueDate: assignment.dueDate,
      },
      submission: {
        id: submission.id,
        submittedAt: submission.submittedAt,
        status: submission.status,
        score: submission.score,
      },
      questionSubmissions: questionSubmissionsWithQuestions,
    });
  } catch (error) {
    console.error("Submission detail fetch error:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch submission details",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
