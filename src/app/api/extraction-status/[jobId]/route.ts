import { NextRequest, NextResponse } from "next/server";
import {
  getJobStatus,
  getJobResult,
  getParseResults,
} from "@/lib/unsiloedClient";

/**
 * GET /api/extraction-status/[jobId]?type=extraction|parse
 * Check the status of an extraction or parse job
 *
 * Query params:
 * - type: 'extraction' (for /cite and /tables jobs) or 'parse' (for /parse jobs)
 *
 * Response:
 * - If still processing: { status: "processing", jobId }
 * - If completed: { status: "completed", jobId, data }
 * - If failed: { status: "failed", jobId, error }
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await params;
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get("type") || "extraction";

    if (!jobId) {
      return NextResponse.json(
        { error: "Job ID is required" },
        { status: 400 }
      );
    }

    if (type === "parse") {
      // For parse jobs, use the parse-specific endpoint
      const result = await getParseResults(jobId, 0, 1000); // Don't poll, just check once

      if (result.status === "Succeeded") {
        return NextResponse.json({
          status: "completed",
          jobId,
          data: result,
        });
      } else if (result.status === "Failed") {
        return NextResponse.json({
          status: "failed",
          jobId,
          error: "Parse job failed",
        });
      } else {
        return NextResponse.json({
          status: "processing",
          jobId,
          currentStatus: result.status,
        });
      }
    } else {
      // For extraction and table jobs, use the generic jobs endpoint
      const statusResponse = await getJobStatus(jobId);

      if (statusResponse.status === "COMPLETED") {
        // Fetch the results
        const result = await getJobResult(jobId);

        return NextResponse.json({
          status: "completed",
          jobId,
          data: result,
        });
      } else if (statusResponse.status === "FAILED") {
        return NextResponse.json({
          status: "failed",
          jobId,
          error: "Extraction job failed",
        });
      } else {
        return NextResponse.json({
          status: "processing",
          jobId,
          currentStatus: statusResponse.status,
        });
      }
    }
  } catch (error) {
    console.error("Extraction status error:", error);

    // Handle specific errors
    if (error instanceof Error && error.message.includes("timed out")) {
      return NextResponse.json(
        { status: "processing", message: "Job still processing" },
        { status: 202 }
      );
    }

    return NextResponse.json(
      {
        error: "Failed to get extraction status",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
