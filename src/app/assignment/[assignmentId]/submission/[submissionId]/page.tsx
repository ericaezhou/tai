"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Loader2 } from "lucide-react"
import { EngineComparisonPanel } from "@/components/EngineComparisonPanel"
import type { QuestionSubmission, AssignmentQuestion } from "@/types"

interface SubmissionDetailData {
  student: {
    id: string
    name: string
    email: string
  }
  assignment: {
    id: string
    name: string
    dueDate: Date
  }
  submission: {
    id: string
    submittedAt: Date
    status: string
    score?: number
  }
  questionSubmissions: Array<QuestionSubmission & {
    question: AssignmentQuestion
  }>
}

export default function TASubmissionDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [data, setData] = useState<SubmissionDetailData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const assignmentId = params.assignmentId as string
  const submissionId = params.submissionId as string

  useEffect(() => {
    async function fetchSubmissionDetail() {
      try {
        const response = await fetch(
          `/api/submission-detail?submissionId=${submissionId}`
        )

        if (!response.ok) {
          throw new Error('Failed to fetch submission details')
        }

        const result = await response.json()
        setData(result)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchSubmissionDetail()
  }, [submissionId])

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-7xl">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-7xl">
        <Button
          onClick={() => router.push(`/assignment/${assignmentId}`)}
          variant="ghost"
          className="mb-6 gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Assignment
        </Button>
        <div className="text-center py-12">
          <p className="text-destructive">{error || 'Submission not found'}</p>
        </div>
      </div>
    )
  }

  const totalPoints = data.questionSubmissions.reduce(
    (sum, qs) => sum + qs.question.totalPoints,
    0
  )
  const earnedPoints = data.questionSubmissions.reduce(
    (sum, qs) => sum + (qs.pointsAwarded || 0),
    0
  )

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <Button
        onClick={() => router.push(`/assignment/${assignmentId}`)}
        variant="ghost"
        className="mb-6 gap-2"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Assignment
      </Button>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">
              {data.student.name}
            </h1>
            <p className="text-muted-foreground mt-2">
              {data.assignment.name}
            </p>
            <p className="text-sm text-muted-foreground">
              Submitted: {new Date(data.submission.submittedAt).toLocaleString()}
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">
              {earnedPoints}/{totalPoints}
            </div>
            <div className="text-sm text-muted-foreground">
              {Math.round((earnedPoints / totalPoints) * 100)}%
            </div>
          </div>
        </div>
      </div>

      {/* Multi-Engine OCR Comparison */}
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold mb-2">
            Multi-Engine OCR Comparison
          </h2>
          <p className="text-muted-foreground mb-4">
            Showing extraction results from Claude, PaddleOCR, and Pix2Text for each question
          </p>
        </div>

        {data.questionSubmissions.map((qs) => (
          <EngineComparisonPanel
            key={qs.id}
            questionSubmission={qs}
            question={qs.question}
          />
        ))}
      </div>
    </div>
  )
}
