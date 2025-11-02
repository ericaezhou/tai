// Unsiloed AI Client Library
// Server-side only - do not use in client components

import type { ParsedDocument, UnsiloedJobStatus, UnsiloedJobResult } from "@/types";

const BASE = process.env.UNSILOED_BASE_URL ?? "https://prod.visionapi.unsiloed.ai";
const API_KEY = process.env.UNSILOED_API_KEY!;

function headers() {
  // Send both header variants for compatibility across endpoints
  return {
    "api-key": API_KEY,
    "X-API-Key": API_KEY,
    accept: "application/json",
  };
}

/**
 * Parse a PDF document with OCR and layout detection
 * Returns a job ID for polling
 */
export async function parseDocument(
  pdfBuffer: Buffer,
  fileName: string = "document.pdf",
  options: {
    use_high_resolution?: boolean;
    segmentation_method?: "smart_layout_detection" | "page_by_page";
    ocr_mode?: "auto_ocr" | "full_ocr";
    ocr_engine?: "UnsiloedHawk" | "UnsiloedStorm";
  } = {}
) {
  const {
    use_high_resolution = true,
    segmentation_method = "smart_layout_detection",
    ocr_mode = "auto_ocr",
    ocr_engine = "UnsiloedHawk", // Higher accuracy for grading
  } = options;

  const form = new FormData();
  form.set("file", new Blob([pdfBuffer], { type: "application/pdf" }), fileName);
  form.set("use_high_resolution", String(use_high_resolution));
  form.set("segmentation_method", segmentation_method);
  form.set("ocr_mode", ocr_mode);
  form.set("ocr_engine", ocr_engine);

  const res = await fetch(`${BASE}/parse`, {
    method: "POST",
    headers: headers(),
    body: form,
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Parse document failed: ${res.status} ${error}`);
  }

  return res.json(); // Contains job_id, status, message, quota_remaining
}

/**
 * Get parse job status and results
 * Polls until completion or timeout
 */
export async function getParseResults(
  jobId: string,
  pollMs: number = 5000,
  timeoutMs: number = 600000
): Promise<ParsedDocument> {
  const start = Date.now();

  while (Date.now() - start < timeoutMs) {
    const res = await fetch(`${BASE}/parse/${jobId}`, {
      headers: headers(),
    });

    if (!res.ok) {
      const error = await res.text();
      throw new Error(`Parse status failed: ${res.status} ${error}`);
    }

    const body: ParsedDocument = await res.json();

    if (body.status === "Succeeded") {
      return body; // Includes chunks with segments, bboxes, etc.
    }

    if (body.status === "Failed") {
      throw new Error(`Parse job failed: ${JSON.stringify(body)}`);
    }

    // Still processing, wait and retry
    await new Promise((resolve) => setTimeout(resolve, pollMs));
  }

  throw new Error("Parse job timed out");
}

/**
 * Extract structured data from PDF using JSON schema
 * Returns a job ID for polling via getJobStatus/getJobResult
 */
export async function extractData(
  pdfBuffer: Buffer,
  schemaJson: string,
  fileName: string = "document.pdf"
): Promise<string> {
  const form = new FormData();
  form.set("pdf_file", new Blob([pdfBuffer], { type: "application/pdf" }), fileName);
  form.set("schema_data", schemaJson);

  const res = await fetch(`${BASE}/cite`, {
    method: "POST",
    headers: headers(),
    body: form,
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Extract data failed: ${res.status} ${error}`);
  }

  const body = await res.json();
  return body.job_id as string;
}

/**
 * Extract tables from PDF
 * Returns a job ID for polling via getJobStatus/getJobResult
 */
export async function extractTables(
  pdfBuffer: Buffer,
  fileName: string = "document.pdf"
): Promise<string> {
  const form = new FormData();
  form.set("pdf_file", new Blob([pdfBuffer], { type: "application/pdf" }), fileName);

  const res = await fetch(`${BASE}/tables`, {
    method: "POST",
    headers: headers(),
    body: form,
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Extract tables failed: ${res.status} ${error}`);
  }

  const body = await res.json();
  return body.job_id as string;
}

/**
 * Get job status (for extraction and table jobs)
 */
export async function getJobStatus(jobId: string): Promise<UnsiloedJobStatus> {
  const res = await fetch(`${BASE}/jobs/${jobId}`, {
    headers: headers(),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Get job status failed: ${res.status} ${error}`);
  }

  return res.json();
}

/**
 * Get job result (extraction data or tables)
 */
export async function getJobResult(jobId: string): Promise<UnsiloedJobResult> {
  const res = await fetch(`${BASE}/jobs/${jobId}/result`, {
    headers: headers(),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Get job result failed: ${res.status} ${error}`);
  }

  return res.json();
}

/**
 * Poll extraction job until completion
 * Helper function that combines getJobStatus and getJobResult
 */
export async function pollExtractionJob(
  jobId: string,
  pollMs: number = 5000,
  timeoutMs: number = 600000
): Promise<UnsiloedJobResult> {
  const start = Date.now();

  while (Date.now() - start < timeoutMs) {
    const status = await getJobStatus(jobId);

    if (status.status === "COMPLETED") {
      return await getJobResult(jobId);
    }

    if (status.status === "FAILED") {
      throw new Error(`Extraction job failed: ${JSON.stringify(status)}`);
    }

    // Still processing, wait and retry
    await new Promise((resolve) => setTimeout(resolve, pollMs));
  }

  throw new Error("Extraction job timed out");
}

/**
 * Helper: Generate JSON schema for answer key extraction
 */
export function createAnswerKeySchema(questionCount: number): string {
  const schema = {
    type: "object",
    properties: {
      correct_answers: {
        type: "array",
        description: "Array of correct answers for each question",
        items: {
          type: "object",
          properties: {
            question_number: { type: "string" },
            answer: { type: "string" },
          },
        },
      },
      problem_statements: {
        type: "array",
        description: "Array of problem statements/questions",
        items: { type: "string" },
      },
      rubric_criteria: {
        type: "string",
        description: "Grading rubric or criteria text",
      },
      point_values: {
        type: "array",
        description: "Point values for each question",
        items: { type: "number" },
      },
    },
    required: ["correct_answers"],
    additionalProperties: false,
  };

  return JSON.stringify(schema);
}

/**
 * Helper: Generate JSON schema for student submission extraction
 */
export function createSubmissionSchema(questionNumbers: string[]): string {
  const properties: Record<string, any> = {
    student_name: {
      type: "string",
      description: "Student name from the submission",
    },
    student_id: {
      type: "string",
      description: "Student ID number from the submission",
    },
  };

  // Add dynamic question answer fields
  questionNumbers.forEach((qNum) => {
    properties[`q${qNum}_answer`] = {
      type: "string",
      description: `Answer for question ${qNum}`,
    };
  });

  const schema = {
    type: "object",
    properties,
    additionalProperties: false,
  };

  return JSON.stringify(schema);
}
