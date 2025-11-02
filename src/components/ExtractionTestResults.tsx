"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ExtractionTestResultsProps {
  data: any;
  type: "answerKey" | "submission";
}

export function ExtractionTestResults({ data, type }: ExtractionTestResultsProps) {
  // Get confidence score color
  const getConfidenceColor = (score: number) => {
    if (score >= 0.9) return "bg-green-100 text-green-800 border-green-300";
    if (score >= 0.75) return "bg-yellow-100 text-yellow-800 border-yellow-300";
    return "bg-red-100 text-red-800 border-red-300";
  };

  // Render field with confidence
  const renderField = (key: string, value: any) => {
    if (!value || typeof value !== "object") {
      return (
        <div key={key} className="mb-3">
          <div className="text-sm font-medium text-gray-700 mb-1">{key}</div>
          <div className="text-sm text-gray-900">{JSON.stringify(value, null, 2)}</div>
        </div>
      );
    }

    const confidence = value.score || value.confidence || 0;
    const displayValue = value.value !== undefined ? value.value : JSON.stringify(value, null, 2);

    return (
      <div key={key} className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm font-semibold text-gray-800">{key}</div>
          {confidence > 0 && (
            <Badge className={getConfidenceColor(confidence)}>
              Confidence: {(confidence * 100).toFixed(1)}%
            </Badge>
          )}
        </div>

        <div className="text-sm text-gray-900 mb-2 whitespace-pre-wrap">
          {typeof displayValue === "string" ? displayValue : JSON.stringify(displayValue, null, 2)}
        </div>

        {value.page_no && (
          <div className="text-xs text-gray-500">Page: {value.page_no}</div>
        )}

        {value.bboxes && value.bboxes.length > 0 && (
          <div className="text-xs text-gray-500 mt-1">
            Bounding boxes: {value.bboxes.length} found
            <details className="mt-1">
              <summary className="cursor-pointer text-blue-600 hover:text-blue-800">
                View coordinates
              </summary>
              <pre className="mt-1 p-2 bg-white rounded text-xs overflow-x-auto">
                {JSON.stringify(value.bboxes, null, 2)}
              </pre>
            </details>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Extraction Results */}
      {data.extractedData && (
        <Card>
          <CardHeader>
            <CardTitle>Extracted Data</CardTitle>
            <CardDescription>
              Schema-guided field extraction from Unsiloed AI
            </CardDescription>
          </CardHeader>
          <CardContent>
            {data.extractedData.data ? (
              <div>
                {Object.entries(data.extractedData.data).map(([key, value]) =>
                  renderField(key, value)
                )}
                {data.extractedData.data.min_confidence_score !== undefined && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="text-sm font-medium text-gray-700">
                      Minimum Confidence Score:{" "}
                      <span className={`font-bold ${
                        data.extractedData.data.min_confidence_score >= 0.85
                          ? "text-green-600"
                          : "text-yellow-600"
                      }`}>
                        {(data.extractedData.data.min_confidence_score * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <pre className="text-xs overflow-x-auto bg-gray-50 p-4 rounded">
                {JSON.stringify(data.extractedData, null, 2)}
              </pre>
            )}
          </CardContent>
        </Card>
      )}

      {/* Parse Results (OCR) */}
      {data.parsedDocument && (
        <Card>
          <CardHeader>
            <CardTitle>Parse Results (OCR)</CardTitle>
            <CardDescription>
              Full document parsing with layout detection
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-3">
              <div className="text-sm">
                <span className="font-medium">Status:</span>{" "}
                <Badge variant={data.parsedDocument.status === "Succeeded" ? "default" : "secondary"}>
                  {data.parsedDocument.status}
                </Badge>
              </div>
              {data.parsedDocument.total_chunks !== undefined && (
                <div className="text-sm mt-1">
                  <span className="font-medium">Total Chunks:</span> {data.parsedDocument.total_chunks}
                </div>
              )}
            </div>

            {data.parsedDocument.chunks && data.parsedDocument.chunks.length > 0 && (
              <details className="mt-3">
                <summary className="cursor-pointer text-blue-600 hover:text-blue-800 font-medium">
                  View parsed chunks ({data.parsedDocument.chunks.length})
                </summary>
                <div className="mt-3 space-y-2 max-h-96 overflow-y-auto">
                  {data.parsedDocument.chunks.map((chunk: any, idx: number) => (
                    <div key={idx} className="p-3 bg-gray-50 rounded border border-gray-200">
                      <div className="text-xs font-medium text-gray-500 mb-2">
                        Chunk {idx + 1}
                      </div>
                      {chunk.segments && chunk.segments.map((segment: any, segIdx: number) => (
                        <div key={segIdx} className="mb-2 pl-3 border-l-2 border-blue-200">
                          <div className="text-xs text-gray-500">
                            Type: {segment.segment_type} | Page: {segment.page_number} |
                            Confidence: {(segment.confidence * 100).toFixed(1)}%
                          </div>
                          <div className="text-sm mt-1 text-gray-800">
                            {segment.content?.substring(0, 200)}
                            {segment.content?.length > 200 && "..."}
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </details>
            )}
          </CardContent>
        </Card>
      )}

      {/* Tables (if extracted) */}
      {data.tables && data.tables.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Extracted Tables</CardTitle>
            <CardDescription>Structured table data</CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="text-xs overflow-x-auto bg-gray-50 p-4 rounded">
              {JSON.stringify(data.tables, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}

      {/* Raw Response (for debugging) */}
      <details>
        <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800 font-medium">
          View raw response data
        </summary>
        <Card className="mt-2">
          <CardContent className="pt-6">
            <pre className="text-xs overflow-x-auto bg-gray-900 text-green-400 p-4 rounded">
              {JSON.stringify(data, null, 2)}
            </pre>
          </CardContent>
        </Card>
      </details>
    </div>
  );
}
