import { NextResponse } from "next/server";
import { db } from "@/lib/database";
import type { StudentAssignmentSubmission, SubmissionFile } from "@/types";

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const submissionData = payload.submission;
    const filesData = Array.isArray(payload.files) ? payload.files : [];

    const submission: StudentAssignmentSubmission = {
      ...submissionData,
      submittedAt: submissionData.submittedAt
        ? new Date(submissionData.submittedAt)
        : undefined,
      createdAt: new Date(submissionData.createdAt),
      updatedAt: new Date(submissionData.updatedAt),
    };

    await db.saveStudentSubmission(submission);

    for (const raw of filesData as Array<Record<string, any>>) {
      const file: SubmissionFile = {
        ...raw,
        uploadedAt: new Date(raw.uploadedAt),
      };
      await db.saveSubmissionFile(file);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Sync Submission] Failed to persist submission:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
