import { NextResponse } from "next/server";
import { db } from "@/lib/database";
import type { Assignment } from "@/types";

export async function POST(request: Request) {
  try {
    const payload = await request.json();

    const assignment: Assignment = {
      ...payload,
      dueDate: new Date(payload.dueDate),
      createdAt: new Date(payload.createdAt),
      updatedAt: new Date(payload.updatedAt),
    };

    await db.saveAssignment(assignment);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Sync Assignment] Failed to persist assignment:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
