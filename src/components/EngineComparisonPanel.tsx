"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ChevronDown, ChevronRight, Clock, TrendingUp } from "lucide-react"
import { EngineResultCard } from "./EngineResultCard"
import type { QuestionSubmission, AssignmentQuestion } from "@/types"

interface EngineComparisonPanelProps {
  questionSubmission: QuestionSubmission
  question: AssignmentQuestion
}

export function EngineComparisonPanel({
  questionSubmission,
  question
}: EngineComparisonPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const questionNumber = question.orderIndex + 1
  const maxPoints = question.totalPoints
  const earnedPoints = questionSubmission.pointsAwarded || 0
  const ocrResults = questionSubmission.ocrEngineResults || []

  // Find best performing engine (highest confidence or selected engine)
  const bestEngine = questionSubmission.selectedEngine || 'claude'

  // Get percentage score
  const scorePercentage = maxPoints > 0 ? (earnedPoints / maxPoints) * 100 : 0

  // Determine score color
  const getScoreColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600 dark:text-green-400'
    if (percentage >= 60) return 'text-yellow-600 dark:text-yellow-400'
    return 'text-red-600 dark:text-red-400'
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-0 h-auto hover:bg-transparent"
            >
              {isExpanded ? (
                <ChevronDown className="h-5 w-5" />
              ) : (
                <ChevronRight className="h-5 w-5" />
              )}
            </Button>
            <CardTitle className="text-xl">
              Question {questionNumber}
            </CardTitle>
            {question.name && (
              <span className="text-sm text-muted-foreground">
                {question.name}
              </span>
            )}
          </div>

          <div className="flex items-center gap-4">
            {/* Best Engine Indicator */}
            <Badge variant="outline" className="gap-1">
              <TrendingUp className="h-3 w-3" />
              Best: {bestEngine.toUpperCase()}
            </Badge>

            {/* Score */}
            <div className="text-right">
              <div className={`text-2xl font-bold ${getScoreColor(scorePercentage)}`}>
                {earnedPoints}/{maxPoints}
              </div>
              <div className="text-xs text-muted-foreground">
                {scorePercentage.toFixed(0)}%
              </div>
            </div>
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent>
          {/* Multi-Engine Comparison Summary */}
          {ocrResults.length > 0 && (
            <div className="mb-6 p-4 bg-muted/50 rounded-lg border">
              <h4 className="font-semibold mb-3 text-sm">Multi-Engine Comparison Summary</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {ocrResults.map((result) => {
                  const getEngineLabel = (engine: string) => {
                    switch(engine.toLowerCase()) {
                      case 'claude': return 'Claude';
                      case 'paddleocr': return 'OCR 1';
                      case 'pix2text': return 'OCR 2';
                      case 'surya': return 'OCR 3';
                      default: return engine;
                    }
                  };

                  return (
                    <div key={result.engine} className="flex flex-col gap-1 p-3 bg-background rounded-md">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm">{getEngineLabel(result.engine)}</span>
                        {result.engine === bestEngine && (
                          <Badge variant="default" className="text-xs">Best</Badge>
                        )}
                      </div>
                      <div className="text-sm">
                        <span className="font-semibold">{result.pointsAwarded ?? 0}/{maxPoints}</span>
                        <span className="text-muted-foreground ml-1">
                          ({maxPoints > 0 ? ((result.pointsAwarded ?? 0) / maxPoints * 100).toFixed(0) : 0}%)
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Confidence: {result.confidence ? `${(result.confidence * 100).toFixed(1)}%` : 'N/A'}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Engine Comparison Grid */}
          {ocrResults.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {ocrResults.map((result) => (
                <EngineResultCard
                  key={result.engine}
                  engineResult={result}
                  isSelected={result.engine === bestEngine}
                  maxPoints={maxPoints}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>No multi-engine OCR data available for this question.</p>
              <p className="text-sm mt-2">
                This submission may have been processed before multi-engine extraction was enabled.
              </p>
            </div>
          )}

          {/* Main Feedback (from best engine) */}
          {questionSubmission.feedback && (
            <div className="mt-6 pt-6 border-t">
              <h4 className="font-semibold mb-2">Grading Feedback</h4>
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <p className="whitespace-pre-wrap text-sm">
                  {questionSubmission.feedback}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  )
}
