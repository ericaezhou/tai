import { NextRequest, NextResponse } from "next/server";
import {
  extractData,
  parseDocument,
  extractTables,
  createSubmissionSchema,
} from "@/lib/unsiloedClient";

/**
 * POST /api/extract-submission
 * Extract structured data from student submission PDF
 *
 * Request: FormData with 'pdf' file and 'questionNumbers' (comma-separated, e.g., "1,2,3,4")
 * Response: { extractionJobId, parseJobId, tablesJobId, message }
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const pdfFile = formData.get("pdf") as File;
    const questionNumbersStr = formData.get("questionNumbers") as string;
    const extractTablesFlag = formData.get("extractTables") === "true";

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

    // Start extraction jobs
    const jobs: Promise<any>[] = [
      extractData(buffer, submissionSchema, pdfFile.name),
      parseDocument(buffer, pdfFile.name),
    ];

    // Optionally extract tables (for truth tables, matrices, etc.)
    if (extractTablesFlag) {
      jobs.push(extractTables(buffer, pdfFile.name));
    }

    const results = await Promise.all(jobs);
    const [extractionJobId, parseJobResponse, tablesJobId] = results;

    return NextResponse.json({
      extractionJobId,
      parseJobId: parseJobResponse.job_id,
      tablesJobId: extractTablesFlag ? tablesJobId : null,
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
