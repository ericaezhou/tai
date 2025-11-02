"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, CheckCircle2, X, Plus } from "lucide-react"

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
  onConfirm: (updatedData: RubricBreakdown) => void
}

interface QuestionCardProps {
  question: RubricQuestion
  onUpdateQuestion: (updatedQuestion: RubricQuestion) => void
}

function QuestionCard({ question, onUpdateQuestion }: QuestionCardProps) {
  const updateSummary = (summary: string) => {
    onUpdateQuestion({ ...question, summary })
  }

  const updateCriterion = (criterionId: string, field: "points" | "description", value: string | number) => {
    const updatedCriteria = question.criteria.map((c) => {
      if (c.id === criterionId) {
        if (field === "points") {
          // Allow empty string or convert to number
          const pointValue = value === "" ? 0 : Number(value)
          return { ...c, points: pointValue }
        }
        return { ...c, description: value as string }
      }
      return c
    })
    const totalPoints = updatedCriteria.reduce((sum, c) => sum + c.points, 0)
    onUpdateQuestion({ ...question, criteria: updatedCriteria, totalPoints })
  }

  const deleteCriterion = (criterionId: string) => {
    const updatedCriteria = question.criteria.filter((c) => c.id !== criterionId)
    const totalPoints = updatedCriteria.reduce((sum, c) => sum + c.points, 0)
    onUpdateQuestion({ ...question, criteria: updatedCriteria, totalPoints })
  }

  const addCriterion = () => {
    const newCriterion: ScoringCriteria = {
      id: `${question.id}-${Date.now()}`,
      points: 0,
      description: "New criterion",
    }
    const updatedCriteria = [...question.criteria, newCriterion]
    onUpdateQuestion({ ...question, criteria: updatedCriteria })
  }

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
            <Textarea
              value={question.summary}
              onChange={(e) => updateSummary(e.target.value)}
              className="text-lg font-semibold leading-snug min-h-[60px] resize-none"
              placeholder="Enter question summary..."
            />
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
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-foreground">
              Scoring Criteria
            </h4>
            <Button
              size="sm"
              variant="outline"
              onClick={addCriterion}
              className="h-7 text-xs"
            >
              <Plus className="h-3 w-3 mr-1" />
              Add Criterion
            </Button>
          </div>
          <div className="flex flex-col gap-2">
            {question.criteria.map((criterion) => (
              <div
                key={criterion.id}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 border border-indigo-200 group"
              >
                <Input
                  type="number"
                  value={criterion.points === 0 ? "" : criterion.points}
                  onChange={(e) => updateCriterion(criterion.id, "points", e.target.value)}
                  className="w-14 h-6 text-center rounded-full bg-indigo-600 text-white text-xs font-bold border-0 p-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  min="0"
                  placeholder="0"
                />
                <Input
                  value={criterion.description}
                  onChange={(e) => updateCriterion(criterion.id, "description", e.target.value)}
                  className="flex-1 h-6 text-sm font-medium border-0 bg-transparent px-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                  placeholder="Criterion description..."
                />
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => deleteCriterion(criterion.id)}
                  className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-3 w-3 text-red-600" />
                </Button>
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
  const [editableData, setEditableData] = useState<RubricBreakdown>(rubricData)

  const updateQuestion = (questionId: string, updatedQuestion: RubricQuestion) => {
    setEditableData({
      ...editableData,
      questions: editableData.questions.map((q) =>
        q.id === questionId ? updatedQuestion : q
      ),
    })
  }

  const handleConfirm = () => {
    onConfirm(editableData)
  }

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
                {editableData.assignmentName}
              </p>
            </div>
            <div className="text-right space-y-3">
              <div>
                <div className="text-sm text-muted-foreground mb-1">
                  Total Questions
                </div>
                <div className="text-2xl font-bold text-foreground">
                  {editableData.questions.length}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">
                  Total Points
                </div>
                <div className="text-2xl font-bold text-indigo-700">
                  {editableData.questions.reduce((sum, q) => sum + q.totalPoints, 0)}
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
                Review and edit the rubric breakdown below
              </p>
              <p className="text-sm text-indigo-700 mt-1">
                Our AI has analyzed your rubric and broken it down into individual questions with their scoring criteria.
                You can edit question summaries, modify criteria descriptions and points, or add/remove criteria as needed.
              </p>
            </div>
          </div>
        </Card>

        {/* Questions Grid */}
        <div className="grid gap-6 md:grid-cols-2 mb-8">
          {editableData.questions.map((question) => (
            <QuestionCard
              key={question.id}
              question={question}
              onUpdateQuestion={(updated) => updateQuestion(question.id, updated)}
            />
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-6 border-t border-border">
          <Button variant="outline" onClick={onBack}>
            Back to Assignment
          </Button>
          <Button size="lg" onClick={handleConfirm} className="min-w-[160px]">
            Confirm & Continue
          </Button>
        </div>
      </div>
    </div>
  )
}
