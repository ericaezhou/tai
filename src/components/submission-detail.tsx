"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft } from "lucide-react"
import { EngineComparisonPanel } from "./EngineComparisonPanel"
import { db } from "@/lib/database"
import type { QuestionSubmission, AssignmentQuestion } from "@/types"

interface SubmissionDetailProps {
  submissionId: string
  studentName: string
  assignmentName: string
  onBack: () => void
}

export function SubmissionDetail({
  submissionId,
  studentName,
  assignmentName,
  onBack
}: SubmissionDetailProps) {
  const [questionSubmissions, setQuestionSubmissions] = useState<QuestionSubmission[]>([])
  const [questions, setQuestions] = useState<AssignmentQuestion[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadSubmissionData = async () => {
      try {
        setIsLoading(true)

        // Get question submissions
        const submissions = await db.getQuestionSubmissions(submissionId)
        setQuestionSubmissions(submissions)

        // Get assignment questions from the first submission (they all share same assignment)
        if (submissions.length > 0) {
          const assignmentQuestions = await db.getAssignmentQuestions(submissions[0].assignmentId)
          setQuestions(assignmentQuestions)
        }
      } catch (error) {
        console.error('Error loading submission data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadSubmissionData()
  }, [submissionId])

  // Calculate total score
  const totalScore = questionSubmissions.reduce((sum, qs) => sum + (qs.pointsAwarded || 0), 0)
  const maxScore = questions.reduce((sum, q) => sum + q.totalPoints, 0)

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <Button variant="ghost" onClick={onBack} className="mb-6 gap-2">
        <ArrowLeft className="h-4 w-4" />
        Back to Assignment
      </Button>

      <div className="mb-6">
        <h1 className="text-4xl font-bold tracking-tight text-balance">{studentName}</h1>
        <p className="text-muted-foreground mt-2">{assignmentName}</p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Overall Score</CardTitle>
          <CardDescription>Total points for this submission</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold">
            {totalScore}/{maxScore}
            <span className="text-lg text-muted-foreground ml-2">
              ({maxScore > 0 ? ((totalScore / maxScore) * 100).toFixed(1) : 0}%)
            </span>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading submission details...</p>
        </div>
      ) : questionSubmissions.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <p className="text-center text-muted-foreground">
              No question submissions found for this submission.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Question-by-Question Breakdown</h2>
          <p className="text-muted-foreground mb-4">
            Click on each question to see how different OCR engines extracted and graded the answer.
          </p>

          {questionSubmissions.map((questionSub) => {
            const question = questions.find(q => q.id === questionSub.questionId)
            if (!question) return null

            return (
              <EngineComparisonPanel
                key={questionSub.id}
                questionSubmission={questionSub}
                question={question}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}
