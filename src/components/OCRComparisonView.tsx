"use client";

import type { QuestionResult } from '@/types/ocr';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export function OCRComparisonView({ result }: { result: QuestionResult }) {
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return 'bg-green-100 text-green-800 border-green-300';
    if (confidence >= 0.75) return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    return 'bg-red-100 text-red-800 border-red-300';
  };

  const getMethodBadgeVariant = (method: string) => {
    switch (method) {
      case 'unanimous': return 'default';
      case 'majority': return 'secondary';
      case 'weighted': return 'secondary';
      case 'clustering': return 'secondary';
      case 'ai_arbiter': return 'destructive';
      default: return 'outline';
    }
  };

  return (
    <div className="space-y-4">
      {result.source && (
        <div className="text-xs text-gray-500">
          Source: page {result.source.pageIndex + 1}, segment {result.source.segmentIndex + 1}
        </div>
      )}
      {/* Individual Engine Results */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {result.individualResults.map((engineResult, idx) => (
          <Card key={idx} className="border-2">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold uppercase">
                  {engineResult.engine}
                </CardTitle>
                <Badge className={`${getConfidenceColor(engineResult.confidence)} border`}>
                  {(engineResult.confidence * 100).toFixed(0)}%
                </Badge>
              </div>
              <CardDescription className="text-xs">
                {engineResult.processingTime}ms
                {engineResult.latex && ' • LaTeX available'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="p-3 bg-gray-50 rounded-md font-mono text-sm min-h-[60px] whitespace-pre-wrap break-words">
                  {engineResult.text || '(empty result)'}
                </div>
                {engineResult.latex && (
                  <details className="text-xs">
                    <summary className="cursor-pointer text-blue-600 hover:text-blue-800">
                      Show LaTeX
                    </summary>
                    <pre className="mt-2 p-2 bg-blue-50 rounded overflow-x-auto">
                      {engineResult.latex}
                    </pre>
                  </details>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Consensus Result */}
      <Card className="border-4 border-blue-500 bg-blue-50/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg">🎯 Consensus Result</CardTitle>
              <Badge variant={getMethodBadgeVariant(result.consensus.method)}>
                {result.consensus.method.replace('_', ' ')}
              </Badge>
            </div>
            <div className="flex gap-2">
              <Badge className={`${getConfidenceColor(result.consensus.confidence)} border text-base px-3 py-1`}>
                {(result.consensus.confidence * 100).toFixed(1)}%
              </Badge>
              {result.consensus.needsReview && (
                <Badge variant="destructive">Needs Review</Badge>
              )}
            </div>
          </div>
          <CardDescription>
            Agreement: {result.consensus.agreementRatio
              ? `${(result.consensus.agreementRatio * 100).toFixed(0)}%`
              : 'N/A'}
            {' '}({result.individualResults.length} engines)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="p-4 bg-white rounded-lg border-2 border-blue-200 font-mono text-lg font-bold min-h-[80px] whitespace-pre-wrap break-words">
              {result.consensus.finalText}
            </div>

            {/* AI Validation Details */}
            {result.consensus.aiValidation && (
              <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                <div className="text-sm font-semibold text-purple-900 mb-2">
                  🤖 AI Arbiter Analysis
                </div>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium">Reasoning:</span>{' '}
                    {result.consensus.aiValidation.reasoning}
                  </div>
                  {result.consensus.aiValidation.errors.length > 0 && (
                    <div>
                      <span className="font-medium">Corrections:</span>
                      <ul className="list-disc list-inside ml-2 text-xs">
                        {result.consensus.aiValidation.errors.map((error, idx) => (
                          <li key={idx}>{error}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {result.consensus.aiValidation.mathValid !== undefined && (
                    <div>
                      <span className="font-medium">Math Valid:</span>{' '}
                      {result.consensus.aiValidation.mathValid ? '✅ Yes' : '❌ No'}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Ground Truth Comparison (if available) */}
            {result.groundTruth && (
              <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                <div className="text-sm font-semibold text-green-900 mb-1">
                  ✓ Ground Truth
                </div>
                <div className="font-mono text-sm mb-2">{result.groundTruth}</div>
                {result.accuracy !== undefined && (
                  <div className="text-sm">
                    <span className="font-medium">Match:</span>{' '}
                    <Badge className={result.accuracy === 100 ? 'bg-green-600' : 'bg-orange-500'}>
                      {result.accuracy.toFixed(1)}%
                    </Badge>
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
