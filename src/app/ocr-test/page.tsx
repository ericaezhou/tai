"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, Upload, FileText, AlertCircle, CheckCircle2 } from 'lucide-react';
import { OCRComparisonView } from '@/components/OCRComparisonView';
import type { MultiScanResult } from '@/types/ocr';

export default function OCRTestPage() {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [selectedEngines, setSelectedEngines] = useState<string[]>(['paddleocr', 'pix2text', 'surya']);
  const [questionNumbers, setQuestionNumbers] = useState('1');
  const [consensusMethod, setConsensusMethod] = useState('weighted');
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<MultiScanResult | null>(null);
  const [error, setError] = useState<string>('');

  const engines = [
    {
      id: 'paddleocr',
      name: 'PaddleOCR',
      description: 'General handwriting (70-85% accuracy)',
      port: 8001,
      free: true
    },
    {
      id: 'pix2text',
      name: 'Pix2Text',
      description: 'Math specialist with LaTeX (75-85% accuracy)',
      port: 8002,
      free: true
    },
    {
      id: 'surya',
      name: 'Surya OCR',
      description: 'Layout-aware (70-80% accuracy)',
      port: 8003,
      free: true
    },
    {
      id: 'unsiloed',
      name: 'Unsiloed AI',
      description: 'Current production (85-95% accuracy)',
      port: null,
      free: false
    }
  ];

  const consensusMethods = [
    { id: 'weighted', name: 'Weighted Vote', description: 'Weight by engine reliability & confidence' },
    { id: 'majority', name: 'Simple Majority', description: 'Most common result wins' },
    { id: 'clustering', name: 'Edit Distance Clustering', description: 'Group similar results' },
    { id: 'ai_arbiter', name: 'AI Arbiter (Claude)', description: 'Use AI to decide best result' }
  ];

  const handleSubmit = async () => {
    if (!pdfFile) return;

    setIsProcessing(true);
    setError('');
    setResults(null);

    try {
      const formData = new FormData();
      formData.append('pdf', pdfFile);
      formData.append('engines', selectedEngines.join(','));
      formData.append('questionNumbers', questionNumbers);
      formData.append('consensusMethod', consensusMethod);
      formData.append('useCache', 'false');

      const response = await fetch('/api/ocr/multi-scan', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.details || 'OCR processing failed');
      }

      const data: MultiScanResult = await response.json();

      if (data.status === 'failed') {
        throw new Error(data.error || 'OCR processing failed');
      }

      setResults(data);

    } catch (err) {
      console.error('Error:', err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Multi-Scan OCR Testing Interface
          </h1>
          <p className="text-gray-600 text-lg">
            Test free OCR engines with consensus voting for handwritten math PDFs
          </p>
        </div>

        {/* Configuration Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Configuration</CardTitle>
            <CardDescription>
              Upload a PDF and select OCR engines to compare
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* File Upload */}
            <div>
              <Label htmlFor="pdfFile" className="text-base font-semibold">
                Upload PDF
              </Label>
              <div className="mt-2">
                <label
                  htmlFor="pdfFile"
                  className="flex items-center justify-center gap-3 px-6 py-8 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all"
                >
                  {pdfFile ? (
                    <>
                      <FileText className="h-8 w-8 text-blue-600" />
                      <div className="text-center">
                        <div className="font-medium text-gray-700">{pdfFile.name}</div>
                        <div className="text-sm text-gray-500">
                          {(pdfFile.size / 1024).toFixed(0)} KB
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <Upload className="h-8 w-8 text-gray-400" />
                      <span className="text-gray-500">Click to upload PDF (max 50MB)</span>
                    </>
                  )}
                  <input
                    id="pdfFile"
                    type="file"
                    accept=".pdf"
                    className="sr-only"
                    onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
                  />
                </label>
              </div>
            </div>

            {/* Engine Selection */}
            <div>
              <Label className="text-base font-semibold mb-3 block">
                Select OCR Engines (3+ recommended)
              </Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {engines.map(engine => (
                  <div
                    key={engine.id}
                    className={`flex items-start space-x-3 p-3 rounded-lg border-2 transition-all ${
                      selectedEngines.includes(engine.id)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Checkbox
                      id={engine.id}
                      checked={selectedEngines.includes(engine.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedEngines([...selectedEngines, engine.id]);
                        } else {
                          setSelectedEngines(selectedEngines.filter(e => e !== engine.id));
                        }
                      }}
                    />
                    <div className="flex-1">
                      <label
                        htmlFor={engine.id}
                        className="text-sm font-medium cursor-pointer flex items-center gap-2"
                      >
                        {engine.name}
                        {engine.free ? (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">FREE</span>
                        ) : (
                          <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded">PAID</span>
                        )}
                      </label>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {engine.description}
                        {engine.port && (
                          <span className="ml-2 text-gray-400">• Port {engine.port}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Question Numbers */}
            <div>
              <Label htmlFor="questionNumbers" className="text-base font-semibold">
                Question Numbers (comma-separated)
              </Label>
              <Input
                id="questionNumbers"
                value={questionNumbers}
                onChange={(e) => setQuestionNumbers(e.target.value)}
                placeholder="e.g., 1,2,3,4"
                className="mt-2"
              />
              <p className="text-sm text-gray-500 mt-1">
                Question numbers are used as labels. When more questions are provided than pages, pages are automatically split into vertical segments in reading order.
              </p>
            </div>

            {/* Consensus Method */}
            <div>
              <Label className="text-base font-semibold mb-3 block">
                Consensus Method
              </Label>
              <div className="space-y-2">
                {consensusMethods.map(method => (
                  <label
                    key={method.id}
                    className={`flex items-start p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      consensusMethod === method.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="consensusMethod"
                      value={method.id}
                      checked={consensusMethod === method.id}
                      onChange={(e) => setConsensusMethod(e.target.value)}
                      className="mt-1 mr-3"
                    />
                    <div>
                      <div className="font-medium text-sm">{method.name}</div>
                      <div className="text-xs text-gray-500">{method.description}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Submit Button */}
            <Button
              onClick={handleSubmit}
              disabled={!pdfFile || selectedEngines.length === 0 || isProcessing}
              className="w-full h-12 text-base"
              size="lg"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Processing OCR (this may take 30-60 seconds)...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-5 w-5" />
                  Run Multi-Scan OCR
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription className="whitespace-pre-wrap">{error}</AlertDescription>
          </Alert>
        )}

        {/* Results */}
        {results && results.status === 'completed' && (
          <div className="space-y-6">
            {/* Performance Metrics */}
            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <div className="text-sm text-gray-600">Total Time</div>
                    <div className="text-2xl font-bold">
                      {(results.performance.totalTime / 1000).toFixed(1)}s
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Engines Used</div>
                    <div className="text-2xl font-bold">
                      {selectedEngines.length}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Questions Processed</div>
                    <div className="text-2xl font-bold">
                      {results.questions.length}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Estimated Cost</div>
                    <div className="text-2xl font-bold">
                      ${results.performance.costEstimate.toFixed(4)}
                    </div>
                  </div>
                </div>

                {/* Engine Times */}
                <div className="mt-4 pt-4 border-t">
                  <div className="text-sm font-semibold mb-2">Engine Processing Times:</div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {Object.entries(results.performance.engineTimes).map(([engine, time]) => (
                      <div key={engine} className="text-sm">
                        <span className="font-medium">{engine}:</span> {time}ms
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Question Results */}
            {results.questions.map((question) => (
              <div key={question.questionNumber} className="space-y-3">
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-bold">
                    Question {question.questionNumber}
                  </h2>
                  {question.consensus.needsReview ? (
                    <Alert className="flex-1 py-2">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription className="ml-2">
                        Low confidence - manual review recommended
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <Alert className="flex-1 py-2 border-green-200 bg-green-50">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <AlertDescription className="ml-2 text-green-800">
                        High confidence result
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
                <OCRComparisonView result={question} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
