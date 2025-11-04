import { NextResponse } from "next/server";
import { db } from "@/lib/database";
import type { AssignmentRubric, AssignmentQuestion } from "@/types";

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const rubricData = payload.rubric;
    const questionsData = Array.isArray(payload.questions) ? payload.questions : [];

    const rubric: AssignmentRubric = {
      ...rubricData,
      createdAt: new Date(rubricData.createdAt),
      updatedAt: new Date(rubricData.updatedAt),
    };

    await db.saveAssignmentRubric(rubric);

    for (const questionData of questionsData as Array<Record<string, any>>) {
      const question: AssignmentQuestion = {
        ...questionData,
        createdAt: new Date(questionData.createdAt),
      };
      await db.saveAssignmentQuestion(question);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Sync Rubric] Failed to persist rubric:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
