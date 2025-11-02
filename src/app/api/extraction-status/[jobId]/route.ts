import { NextRequest, NextResponse } from "next/server";
import {
  getJobStatus,
  getJobResult,
} from "@/lib/unsiloedClient";

const BASE = process.env.UNSILOED_BASE_URL ?? "https://prod.visionapi.unsiloed.ai";
const API_KEY = process.env.UNSILOED_API_KEY!;

function headers() {
  return {
    "api-key": API_KEY,
    "X-API-Key": API_KEY,
    accept: "application/json",
  };
}

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
      // For parse jobs, fetch status once (don't poll)
      const res = await fetch(`${BASE}/parse/${jobId}`, {
        headers: headers(),
      });

      if (!res.ok) {
        throw new Error(`Parse status check failed: ${res.status}`);
      }

      const result = await res.json();

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
        // Still processing (Starting, Processing, etc.)
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
        // Log the full status response to see what Unsiloed returns
        console.error("=== EXTRACTION JOB FAILED ===");
        console.error("Job ID:", jobId);
        console.error("Full status response:", JSON.stringify(statusResponse, null, 2));

        // Try to get additional error details from job result
        let errorDetails = null;
        try {
          errorDetails = await getJobResult(jobId);
          console.error("Job result for failed job:", JSON.stringify(errorDetails, null, 2));
        } catch (resultError) {
          console.error("Could not fetch job result (this is normal for failed jobs):",
            resultError instanceof Error ? resultError.message : String(resultError)
          );
        }

        // Extract error message from various possible fields
        const errorMessage =
          (statusResponse as any).error_message ||
          (statusResponse as any).message ||
          (statusResponse as any).error ||
          errorDetails?.error ||
          errorDetails?.message ||
          errorDetails?.error_message ||
          "Extraction failed with no error details from Unsiloed API";

        console.error("Extracted error message:", errorMessage);
        console.error("=== END ERROR LOG ===");

        return NextResponse.json({
          status: "failed",
          jobId,
          error: errorMessage,
          statusResponse: statusResponse,  // Include full status for debugging
          resultDetails: errorDetails,     // Include result if available
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
