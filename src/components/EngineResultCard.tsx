"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Clock, TrendingUp, Eye, EyeOff, CheckCircle2, Maximize2 } from "lucide-react"
import type { OCREngineResult } from "@/types"

interface EngineResultCardProps {
  engineResult: OCREngineResult
  isSelected: boolean
  maxPoints: number
}

// Helper function to get user-friendly engine names
const getEngineDisplayName = (engine: string) => {
  switch(engine.toLowerCase()) {
    case 'claude': return 'Claude Grading';
    case 'paddleocr': return 'OCR 1 (PaddleOCR)';
    case 'pix2text': return 'OCR 2 (Pix2Text)';
    case 'surya': return 'OCR 3 (Surya)';
    default: return engine.toUpperCase();
  }
};

export function EngineResultCard({
  engineResult,
  isSelected,
  maxPoints
}: EngineResultCardProps) {
  const [showExtractedText, setShowExtractedText] = useState(false)
  const [showFeedback, setShowFeedback] = useState(false)

  const engineName = getEngineDisplayName(engineResult.engine)
  const confidence = engineResult.confidence
    ? (engineResult.confidence * 100).toFixed(1)
    : 'N/A'
  const processingTime = engineResult.processingTime
    ? (engineResult.processingTime / 1000).toFixed(1)
    : 'N/A'

  // Points for this engine (if graded separately)
  const points = engineResult.pointsAwarded ?? null
  const hasGrade = points !== null && points !== undefined

  // Get color based on confidence
  const getConfidenceColor = (conf?: number) => {
    if (!conf) return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
    if (conf >= 0.85) return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
    if (conf >= 0.70) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
    return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
  }

  return (
    <Card className={`relative ${isSelected ? 'ring-2 ring-primary' : ''}`}>
      {isSelected && (
        <div className="absolute -top-2 -right-2">
          <Badge className="gap-1">
            <CheckCircle2 className="h-3 w-3" />
            Selected
          </Badge>
        </div>
      )}

      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center justify-between">
          <span>{engineName}</span>
          {hasGrade && (
            <span className="text-sm font-normal">
              {points}/{maxPoints}
            </span>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Metadata Badges */}
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className={getConfidenceColor(engineResult.confidence)}>
            <TrendingUp className="h-3 w-3 mr-1" />
            {confidence}%
          </Badge>
          <Badge variant="outline" className="gap-1">
            <Clock className="h-3 w-3" />
            {processingTime}s
          </Badge>
        </div>

        {/* Extracted Text Preview */}
        <div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowExtractedText(!showExtractedText)}
              className="flex-1 justify-between p-2 h-auto"
            >
              <span className="text-sm font-medium">Extracted Text</span>
              {showExtractedText ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </Button>

            {/* Full View Modal */}
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="p-2">
                  <Maximize2 className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[80vh]">
                <DialogHeader>
                  <DialogTitle>{engineName} - Extracted Text</DialogTitle>
                  <DialogDescription>
                    Full view of extracted content from {engineName} engine
                  </DialogDescription>
                </DialogHeader>
                <div className="mt-4 p-4 bg-muted rounded-md max-h-[60vh] overflow-y-auto">
                  {engineResult.extractedText ? (
                    <pre className="text-sm whitespace-pre-wrap font-mono">
                      {engineResult.extractedText}
                    </pre>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">
                      No text extracted
                    </p>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {showExtractedText && (
            <div className="mt-2 p-3 bg-muted rounded-md">
              {engineResult.extractedText ? (
                <pre className="text-xs whitespace-pre-wrap font-mono max-h-40 overflow-y-auto">
                  {engineResult.extractedText}
                </pre>
              ) : (
                <p className="text-xs text-muted-foreground italic">
                  No text extracted
                </p>
              )}
            </div>
          )}
        </div>

        {/* Feedback (if engine was graded separately) */}
        {engineResult.feedback && (
          <div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFeedback(!showFeedback)}
              className="w-full justify-between p-2 h-auto"
            >
              <span className="text-sm font-medium">Feedback</span>
              {showFeedback ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </Button>

            {showFeedback && (
              <div className="mt-2 p-3 bg-muted rounded-md">
                <p className="text-xs whitespace-pre-wrap">
                  {engineResult.feedback}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Token Usage (for Claude) */}
        {engineResult.metadata?.tokenUsage && (
          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground">
              Tokens: {engineResult.metadata.tokenUsage.inputTokens}↓ / {engineResult.metadata.tokenUsage.outputTokens}↑
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
