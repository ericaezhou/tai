"use client"

import type React from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ArrowLeft, CheckCircle2 } from "lucide-react"

export type ScoringCriteria = {
  id: string
  points: number
  description: string
}

export type RubricQuestion = {
  id: string
  questionNumber: number
  summary: string
  totalPoints: number
  criteria: ScoringCriteria[]
}

export type RubricBreakdown = {
  assignmentName: string
  questions: RubricQuestion[]
}

interface RubricBreakdownPageProps {
  rubricData: RubricBreakdown
  onBack: () => void
  onConfirm: () => void
}

function QuestionCard({ question }: { question: RubricQuestion }) {
  return (
    <Card className="p-6 hover:shadow-lg transition-shadow duration-200">
      <div className="space-y-4">
        {/* Question Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-semibold text-sm">
                {question.questionNumber}
              </span>
              <span className="text-sm font-medium text-muted-foreground">
                Question {question.questionNumber}
              </span>
            </div>
            <h3 className="text-lg font-semibold text-foreground leading-snug">
              {question.summary}
            </h3>
          </div>
          <div className="ml-4 text-right">
            <div className="text-2xl font-bold text-indigo-700">
              {question.totalPoints}
            </div>
            <div className="text-xs text-muted-foreground">points</div>
          </div>
        </div>

        {/* Scoring Criteria */}
        <div className="pt-4 border-t border-border">
          <h4 className="text-sm font-semibold text-foreground mb-3">
            Scoring Criteria
          </h4>
          <div className="flex flex-col gap-2">
            {question.criteria.map((criterion, index) => (
              <div
                key={criterion.id}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 border border-indigo-200"
              >
                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-bold flex-shrink-0">
                  {criterion.points}
                </div>
                <span className="text-sm text-foreground font-medium">
                  {criterion.description}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  )
}

export default function RubricBreakdownPage({
  rubricData,
  onBack,
  onConfirm,
}: RubricBreakdownPageProps) {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="mb-4 -ml-2 h-8"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Rubric Breakdown
              </h1>
              <p className="text-muted-foreground">
                {rubricData.assignmentName}
              </p>
            </div>
            <div className="text-right space-y-3">
              <div>
                <div className="text-sm text-muted-foreground mb-1">
                  Total Questions
                </div>
                <div className="text-2xl font-bold text-foreground">
                  {rubricData.questions.length}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">
                  Total Points
                </div>
                <div className="text-2xl font-bold text-indigo-700">
                  {rubricData.questions.reduce((sum, q) => sum + q.totalPoints, 0)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <Card className="p-4 mb-6 bg-indigo-50 border-indigo-200">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-indigo-700 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-indigo-900">
                Review the rubric breakdown below
              </p>
              <p className="text-sm text-indigo-700 mt-1">
                Our AI has analyzed your rubric and broken it down into individual questions with their scoring criteria.
                Please review and confirm if everything looks correct.
              </p>
            </div>
          </div>
        </Card>

        {/* Questions Grid */}
        <div className="grid gap-6 md:grid-cols-2 mb-8">
          {rubricData.questions.map((question) => (
            <QuestionCard key={question.id} question={question} />
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-6 border-t border-border">
          <Button variant="outline" onClick={onBack}>
            Make Changes
          </Button>
          <Button size="lg" onClick={onConfirm} className="min-w-[160px]">
            Confirm & Continue
          </Button>
        </div>
      </div>
    </div>
  )
}
