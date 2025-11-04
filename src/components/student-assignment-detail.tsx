"use client"

import { useState, Fragment } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ArrowLeft, CheckCircle2, ChevronDown, ChevronRight } from "lucide-react"
import type { StudentAssignment, Question } from "@/app/page"

type StudentAssignmentDetailProps = {
  assignment: StudentAssignment
  onBack: () => void
  onSelectQuestion: (question: Question) => void
}

export function StudentAssignmentDetail({ assignment, onBack, onSelectQuestion }: StudentAssignmentDetailProps) {
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set())

  const toggleQuestion = (questionId: string) => {
    setExpandedQuestions(prev => {
      const newSet = new Set(prev)
      if (newSet.has(questionId)) {
        newSet.delete(questionId)
      } else {
        newSet.add(questionId)
      }
      return newSet
    })
  }

  const formatFeedbackText = (text: string) => {
    // Add line breaks before bullet points and format text
    return text
      .replace(/([.!?])\s*•/g, '$1\n\n•') // Add line breaks before bullet points
      .replace(/^•/gm, '• ') // Ensure proper spacing after bullet points
      .trim()
  }

  // Check if grades are released to student
  const gradesNotReleased = assignment.status === "ungraded" || (!assignment.gradesReleased && !assignment.published)

  if (!assignment.questions || gradesNotReleased) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-6xl">
        <Button onClick={onBack} variant="ghost" className="mb-6 gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Assignments
        </Button>

        <div className="text-center py-12">
          <h2 className="text-2xl font-bold mb-2">{assignment.name}</h2>
          {assignment.status === "ungraded" ? (
            <p className="text-muted-foreground">This assignment has not been graded yet.</p>
          ) : (
            <div className="space-y-2">
              <p className="text-muted-foreground">Your assignment has been graded!</p>
              <p className="text-sm text-muted-foreground">Grades will be released by your instructor soon.</p>
            </div>
          )}
        </div>
      </div>
    )
  }

  const totalPoints = assignment.questions.reduce((sum, q) => sum + q.totalPoints, 0)
  const earnedPoints = assignment.questions.reduce((sum, q) => sum + q.pointsAwarded, 0)

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <Button onClick={onBack} variant="ghost" className="mb-6 gap-2">
        <ArrowLeft className="h-4 w-4" />
        Back to Assignments
      </Button>

      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-balance">{assignment.name}</h1>
            <p className="text-muted-foreground mt-2">Due: {new Date(assignment.dueDate).toLocaleDateString()}</p>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-2 justify-end mb-1">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <span className="text-sm text-muted-foreground">Graded</span>
            </div>
            <div className="text-3xl font-bold">
              {earnedPoints}/{totalPoints}
            </div>
            <div className="text-sm text-muted-foreground">{Math.round((earnedPoints / totalPoints) * 100)}%</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Student Submissions */}
        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Your Submissions</CardTitle>
            <CardDescription>Review your answers for each question</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div key={assignment.id} className="space-y-2">
              <div className="bg-muted p-4 rounded-md">
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-10 bg-red-500 rounded flex items-center justify-center">
                      <span className="text-white text-xs font-bold">PDF</span>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      submission.pdf
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Submitted {new Date(assignment.dueDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Right Column - Feedback Table */}
        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Questions & Feedback</CardTitle>
            <CardDescription>Click on a question to view detailed feedback</CardDescription>
          </CardHeader>
          <CardContent>
            <Table className="table-fixed">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12"></TableHead>
                  <TableHead className="min-w-0">Question</TableHead>
                  <TableHead className="text-right w-20">Points</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assignment.questions.map((question, index) => (
                  <Fragment key={question.id}>
                    <TableRow
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => toggleQuestion(question.id)}
                    >
                      <TableCell className="w-12">
                        {expandedQuestions.has(question.id) ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </TableCell>
                      <TableCell className="font-medium truncate max-w-0">
                        {question.name}
                      </TableCell>
                      <TableCell className="text-right w-20">
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
                      </TableCell>
                    </TableRow>
                    {expandedQuestions.has(question.id) && (
                      <TableRow key={`${question.id}-expanded`}>
                        <TableCell colSpan={3} className="p-0">
                          <div className="bg-muted/30 p-6 border-t">
                            <div className="space-y-4">
                              <div className="flex items-center justify-between">
                                <h4 className="font-semibold text-sm">Feedback</h4>
                                <div className="text-right">
                                  <div className="text-lg font-bold">
                                    <span
                                      className={
                                        question.pointsAwarded === question.totalPoints
                                          ? "text-green-500"
                                          : question.pointsAwarded / question.totalPoints >= 0.8
                                            ? "text-blue-500"
                                            : "text-orange-500"
                                      }
                                    >
                                      {question.pointsAwarded}
                                    </span>
                                    <span className="text-muted-foreground">/{question.totalPoints}</span>
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {Math.round((question.pointsAwarded / question.totalPoints) * 100)}%
                                  </div>
                                </div>
                              </div>
                              {question.feedback ? (
                                <div className="bg-background p-4 rounded-md border">
                                  <p className="text-sm whitespace-pre-wrap">{formatFeedbackText(question.feedback)}</p>
                                </div>
                              ) : (
                                <p className="text-muted-foreground italic text-sm">No feedback provided</p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
