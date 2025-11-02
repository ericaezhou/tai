"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft } from "lucide-react"
import type { Question } from "@/app/page"

type StudentQuestionDetailProps = {
  question: Question
  assignmentName: string
  onBack: () => void
}

export function StudentQuestionDetail({ question, assignmentName, onBack }: StudentQuestionDetailProps) {
  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-card">
        <div className="container mx-auto py-4 px-4">
          <Button onClick={onBack} variant="ghost" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to {assignmentName}
          </Button>
        </div>
      </div>

      <div className="container mx-auto py-6 px-4 max-w-7xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight text-balance">{question.name}</h1>
          <div className="flex items-center gap-4 mt-2">
            <span className="text-muted-foreground">
              Score:{" "}
              <span
                className={
                  question.pointsAwarded === question.totalPoints
                    ? "text-green-500 font-semibold"
                    : question.pointsAwarded / question.totalPoints >= 0.8
                      ? "text-blue-500 font-semibold"
                      : "text-orange-500 font-semibold"
                }
              >
                {question.pointsAwarded}/{question.totalPoints}
              </span>
            </span>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Your Submission</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-muted rounded-lg overflow-hidden">
                <img
                  src={question.submission || "/placeholder.svg"}
                  alt="Student submission"
                  className="w-full h-auto"
                  crossOrigin="anonymous"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Feedback</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none">
                <p className="text-foreground leading-relaxed">{question.feedback}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
