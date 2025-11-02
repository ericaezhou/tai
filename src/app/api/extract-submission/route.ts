import { NextRequest, NextResponse } from "next/server";
import {
  extractData,
  parseDocument,
  createSubmissionSchema,
} from "@/lib/unsiloedClient";

// Note: extractTables removed due to Unsiloed API bug
// Error: "Unsupported parameter: 'max_tokens' is not supported with this model"
// This is Unsiloed's backend issue - they need to update to 'max_completion_tokens'
// Can re-enable when fixed: https://docs.unsiloed.ai/api-reference/tables

/**
 * POST /api/extract-submission
 * Extract structured data from student submission PDF
 *
 * Request: FormData with 'pdf' file and 'questionNumbers' (comma-separated, e.g., "1,2,3,4")
 * Response: { extractionJobId, parseJobId, message }
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const pdfFile = formData.get("pdf") as File;
    const questionNumbersStr = formData.get("questionNumbers") as string;

    if (!pdfFile) {
      return NextResponse.json(
        { error: "PDF file is required" },
        { status: 400 }
      );
    }

    if (!questionNumbersStr) {
      return NextResponse.json(
        { error: "questionNumbers is required (e.g., '1,2,3,4')" },
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

    // Parse question numbers
    const questionNumbers = questionNumbersStr.split(",").map((n) => n.trim());
    const submissionSchema = createSubmissionSchema(questionNumbers);

    // Start extraction jobs (table extraction disabled - see comment at top)
    const [extractionJobId, parseJobResponse] = await Promise.all([
      extractData(buffer, submissionSchema, pdfFile.name),
      parseDocument(buffer, pdfFile.name),
    ]);

    return NextResponse.json({
      extractionJobId,
      parseJobId: parseJobResponse.job_id,
      message: "Submission extraction started",
      quota_remaining: parseJobResponse.quota_remaining,
    });
  } catch (error) {
    console.error("Submission extraction error:", error);
    return NextResponse.json(
      {
        error: "Failed to extract submission",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
