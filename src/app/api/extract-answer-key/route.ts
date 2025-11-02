import { NextRequest, NextResponse } from "next/server";
import {
  extractData,
  parseDocument,
  createAnswerKeySchema,
} from "@/lib/unsiloedClient";

/**
 * POST /api/extract-answer-key
 * Extract structured data from answer key PDF
 *
 * Request: FormData with 'pdf' file and optional 'questionCount'
 * Response: { extractionJobId, parseJobId, message }
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const pdfFile = formData.get("pdf") as File;
    const questionCount = parseInt(formData.get("questionCount") as string) || 10;

    if (!pdfFile) {
      return NextResponse.json(
        { error: "PDF file is required" },
        { status: 400 }
      );
    }

    // Validate file type
    if (pdfFile.type !== "application/pdf") {
      return NextResponse.json(
        { error: "File must be a PDF" },
        { status: 400 }
      );
    }

    // Check file size (100MB limit)
    if (pdfFile.size > 100 * 1024 * 1024) {
      return NextResponse.json(
        { error: "PDF file size must be less than 100MB" },
        { status: 413 }
      );
    }

    // Convert file to buffer
    const arrayBuffer = await pdfFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Start both extraction jobs in parallel
    const answerKeySchema = createAnswerKeySchema(questionCount);

    const [extractionJobId, parseJobResponse] = await Promise.all([
      extractData(buffer, answerKeySchema, pdfFile.name),
      parseDocument(buffer, pdfFile.name),
    ]);

    return NextResponse.json({
      extractionJobId,
      parseJobId: parseJobResponse.job_id,
      message: "Answer key extraction started",
      quota_remaining: parseJobResponse.quota_remaining,
    });
  } catch (error) {
    console.error("Answer key extraction error:", error);
    return NextResponse.json(
      {
        error: "Failed to extract answer key",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
