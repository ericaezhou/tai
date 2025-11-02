"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, Loader2, CheckCircle2, XCircle, FileText } from "lucide-react";
import { ExtractionTestResults } from "@/components/ExtractionTestResults";

type JobStatus = "idle" | "uploading" | "polling" | "completed" | "error";

export default function TestExtractionPage() {
  // Answer Key State
  const [answerKeyFile, setAnswerKeyFile] = useState<File | null>(null);
  const [answerKeyQuestionCount, setAnswerKeyQuestionCount] = useState("5");
  const [answerKeyStatus, setAnswerKeyStatus] = useState<JobStatus>("idle");
  const [answerKeyJobIds, setAnswerKeyJobIds] = useState<any>(null);
  const [answerKeyResults, setAnswerKeyResults] = useState<any>(null);
  const [answerKeyError, setAnswerKeyError] = useState<string>("");

  // Submission State
  const [submissionFile, setSubmissionFile] = useState<File | null>(null);
  const [submissionQuestions, setSubmissionQuestions] = useState("1,2,3,4");
  const [extractTables, setExtractTables] = useState(false);
  const [submissionStatus, setSubmissionStatus] = useState<JobStatus>("idle");
  const [submissionJobIds, setSubmissionJobIds] = useState<any>(null);
  const [submissionResults, setSubmissionResults] = useState<any>(null);
  const [submissionError, setSubmissionError] = useState<string>("");

  // Poll for job completion
  const pollJob = async (jobId: string, type: "extraction" | "parse") => {
    const maxAttempts = 40; // 2 minutes max (40 * 3 seconds)
    let attempts = 0;

    while (attempts < maxAttempts) {
      try {
        const res = await fetch(`/api/extraction-status/${jobId}?type=${type}`);
        const data = await res.json();

        if (data.status === "completed") {
          return data.data;
        } else if (data.status === "failed") {
          // Log full error data to console for debugging
          console.error("=== EXTRACTION JOB FAILED (Frontend) ===");
          console.error("Full error data:", data);
          console.error("Status Response:", data.statusResponse);
          console.error("Result Details:", data.resultDetails);
          console.error("=== END FRONTEND ERROR LOG ===");

          // Build comprehensive error message
          let errorMessage = data.error || "Job failed";

          // Add status response if available
          if (data.statusResponse) {
            errorMessage += `\n\nStatus Response:\n${JSON.stringify(data.statusResponse, null, 2)}`;
          }

          // Add result details if available
          if (data.resultDetails) {
            errorMessage += `\n\nResult Details:\n${JSON.stringify(data.resultDetails, null, 2)}`;
          }

          throw new Error(errorMessage);
        }

        // Still processing, wait 3 seconds
        await new Promise((resolve) => setTimeout(resolve, 3000));
        attempts++;
      } catch (error) {
        throw error;
      }
    }

    throw new Error("Job polling timed out");
  };

  // Handle Answer Key Extraction
  const handleAnswerKeyExtraction = async () => {
    if (!answerKeyFile) return;

    setAnswerKeyStatus("uploading");
    setAnswerKeyError("");
    setAnswerKeyResults(null);

    try {
      // Upload and start extraction
      const formData = new FormData();
      formData.append("pdf", answerKeyFile);
      formData.append("questionCount", answerKeyQuestionCount);

      const uploadRes = await fetch("/api/extract-answer-key", {
        method: "POST",
        body: formData,
      });

      if (!uploadRes.ok) {
        const error = await uploadRes.json();
        throw new Error(error.error || "Upload failed");
      }

      const jobData = await uploadRes.json();
      setAnswerKeyJobIds(jobData);

      // Poll for completion
      setAnswerKeyStatus("polling");

      const [extractedData, parsedDocument] = await Promise.all([
        pollJob(jobData.extractionJobId, "extraction"),
        pollJob(jobData.parseJobId, "parse"),
      ]);

      setAnswerKeyResults({
        extractedData,
        parsedDocument,
      });

      setAnswerKeyStatus("completed");
    } catch (error) {
      console.error("Answer key extraction error:", error);
      setAnswerKeyError(error instanceof Error ? error.message : String(error));
      setAnswerKeyStatus("error");
    }
  };

  // Handle Submission Extraction
  const handleSubmissionExtraction = async () => {
    if (!submissionFile) return;

    setSubmissionStatus("uploading");
    setSubmissionError("");
    setSubmissionResults(null);

    try {
      // Upload and start extraction
      const formData = new FormData();
      formData.append("pdf", submissionFile);
      formData.append("questionNumbers", submissionQuestions);
      formData.append("extractTables", String(extractTables));

      const uploadRes = await fetch("/api/extract-submission", {
        method: "POST",
        body: formData,
      });

      if (!uploadRes.ok) {
        const error = await uploadRes.json();
        throw new Error(error.error || "Upload failed");
      }

      const jobData = await uploadRes.json();
      setSubmissionJobIds(jobData);

      // Poll for completion
      setSubmissionStatus("polling");

      const jobs: Promise<any>[] = [
        pollJob(jobData.extractionJobId, "extraction"),
        pollJob(jobData.parseJobId, "parse"),
      ];

      if (jobData.tablesJobId) {
        jobs.push(pollJob(jobData.tablesJobId, "extraction"));
      }

      const [extractedData, parsedDocument, tables] = await Promise.all(jobs);

      setSubmissionResults({
        extractedData,
        parsedDocument,
        tables: tables?.results?.tables || [],
      });

      setSubmissionStatus("completed");
    } catch (error) {
      console.error("Submission extraction error:", error);
      setSubmissionError(error instanceof Error ? error.message : String(error));
      setSubmissionStatus("error");
    }
  };

  // Status indicator
  const StatusIndicator = ({ status }: { status: JobStatus }) => {
    switch (status) {
      case "uploading":
        return (
          <div className="flex items-center gap-2 text-blue-600">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Uploading PDF...</span>
          </div>
        );
      case "polling":
        return (
          <div className="flex items-center gap-2 text-blue-600">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Processing extraction (this may take 30-60 seconds)...</span>
          </div>
        );
      case "completed":
        return (
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle2 className="h-4 w-4" />
            <span className="text-sm">Extraction completed successfully</span>
          </div>
        );
      case "error":
        return (
          <div className="flex items-center gap-2 text-red-600">
            <XCircle className="h-4 w-4" />
            <span className="text-sm">Extraction failed</span>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Unsiloed AI Extraction Test
          </h1>
          <p className="text-gray-600">
            Upload PDFs to test extraction before integrating into the main application
          </p>
        </div>

        <Tabs defaultValue="answerKey" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="answerKey">Answer Key Test</TabsTrigger>
            <TabsTrigger value="submission">Student Submission Test</TabsTrigger>
          </TabsList>

          {/* Answer Key Tab */}
          <TabsContent value="answerKey" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Test Answer Key Extraction</CardTitle>
                <CardDescription>
                  Upload a TA answer key PDF to extract correct answers, problem statements, and rubric criteria
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* File Upload */}
                <div>
                  <Label htmlFor="answerKeyFile">Answer Key PDF</Label>
                  <div className="mt-2">
                    <label
                      htmlFor="answerKeyFile"
                      className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-400 transition-colors"
                    >
                      {answerKeyFile ? (
                        <>
                          <FileText className="h-5 w-5 text-blue-600" />
                          <span className="text-sm text-gray-700">{answerKeyFile.name}</span>
                        </>
                      ) : (
                        <>
                          <Upload className="h-5 w-5 text-gray-400" />
                          <span className="text-sm text-gray-500">Click to upload PDF</span>
                        </>
                      )}
                      <input
                        id="answerKeyFile"
                        type="file"
                        accept=".pdf"
                        className="sr-only"
                        onChange={(e) => setAnswerKeyFile(e.target.files?.[0] || null)}
                      />
                    </label>
                  </div>
                </div>

                {/* Question Count */}
                <div>
                  <Label htmlFor="questionCount">Number of Questions</Label>
                  <Input
                    id="questionCount"
                    type="number"
                    min="1"
                    max="50"
                    value={answerKeyQuestionCount}
                    onChange={(e) => setAnswerKeyQuestionCount(e.target.value)}
                    className="mt-2"
                  />
                </div>

                {/* Extract Button */}
                <Button
                  onClick={handleAnswerKeyExtraction}
                  disabled={!answerKeyFile || answerKeyStatus === "uploading" || answerKeyStatus === "polling"}
                  className="w-full"
                >
                  {answerKeyStatus === "uploading" || answerKeyStatus === "polling" ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    "Extract Answer Key"
                  )}
                </Button>

                {/* Status */}
                {answerKeyStatus !== "idle" && (
                  <StatusIndicator status={answerKeyStatus} />
                )}

                {/* Job IDs */}
                {answerKeyJobIds && (
                  <Alert>
                    <AlertDescription className="text-xs font-mono">
                      Extraction Job: {answerKeyJobIds.extractionJobId}<br />
                      Parse Job: {answerKeyJobIds.parseJobId}
                    </AlertDescription>
                  </Alert>
                )}

                {/* Error */}
                {answerKeyError && (
                  <Alert variant="destructive">
                    <AlertDescription>{answerKeyError}</AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* Results */}
            {answerKeyResults && (
              <ExtractionTestResults data={answerKeyResults} type="answerKey" />
            )}
          </TabsContent>

          {/* Submission Tab */}
          <TabsContent value="submission" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Test Student Submission Extraction</CardTitle>
                <CardDescription>
                  Upload a handwritten student submission PDF to extract answers and student info
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* File Upload */}
                <div>
                  <Label htmlFor="submissionFile">Student Submission PDF</Label>
                  <div className="mt-2">
                    <label
                      htmlFor="submissionFile"
                      className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-400 transition-colors"
                    >
                      {submissionFile ? (
                        <>
                          <FileText className="h-5 w-5 text-blue-600" />
                          <span className="text-sm text-gray-700">{submissionFile.name}</span>
                        </>
                      ) : (
                        <>
                          <Upload className="h-5 w-5 text-gray-400" />
                          <span className="text-sm text-gray-500">Click to upload PDF</span>
                        </>
                      )}
                      <input
                        id="submissionFile"
                        type="file"
                        accept=".pdf"
                        className="sr-only"
                        onChange={(e) => setSubmissionFile(e.target.files?.[0] || null)}
                      />
                    </label>
                  </div>
                </div>

                {/* Question Numbers */}
                <div>
                  <Label htmlFor="questionNumbers">Question Numbers (comma-separated)</Label>
                  <Input
                    id="questionNumbers"
                    placeholder="e.g., 1,2,3,4"
                    value={submissionQuestions}
                    onChange={(e) => setSubmissionQuestions(e.target.value)}
                    className="mt-2"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Enter the question numbers to extract (e.g., "1,2,3,4")
                  </p>
                </div>

                {/* Extract Tables Checkbox */}
                <div className="flex items-center space-x-2">
                  <input
                    id="extractTables"
                    type="checkbox"
                    checked={extractTables}
                    onChange={(e) => setExtractTables(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <Label htmlFor="extractTables" className="cursor-pointer">
                    Extract tables (for truth tables, matrices, etc.)
                  </Label>
                </div>

                {/* Extract Button */}
                <Button
                  onClick={handleSubmissionExtraction}
                  disabled={!submissionFile || submissionStatus === "uploading" || submissionStatus === "polling"}
                  className="w-full"
                >
                  {submissionStatus === "uploading" || submissionStatus === "polling" ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    "Extract Submission"
                  )}
                </Button>

                {/* Status */}
                {submissionStatus !== "idle" && (
                  <StatusIndicator status={submissionStatus} />
                )}

                {/* Job IDs */}
                {submissionJobIds && (
                  <Alert>
                    <AlertDescription className="text-xs font-mono">
                      Extraction Job: {submissionJobIds.extractionJobId}<br />
                      Parse Job: {submissionJobIds.parseJobId}
                      {submissionJobIds.tablesJobId && (
                        <><br />Tables Job: {submissionJobIds.tablesJobId}</>
                      )}
                    </AlertDescription>
                  </Alert>
                )}

                {/* Error */}
                {submissionError && (
                  <Alert variant="destructive">
                    <AlertDescription>{submissionError}</AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* Results */}
            {submissionResults && (
              <ExtractionTestResults data={submissionResults} type="submission" />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
