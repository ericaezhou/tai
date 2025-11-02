"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ArrowLeft, CheckCircle2 } from "lucide-react"
import type { StudentAssignment, Question } from "@/app/page"

type StudentAssignmentDetailProps = {
  assignment: StudentAssignment
  onBack: () => void
  onSelectQuestion: (question: Question) => void
}

export function StudentAssignmentDetail({ assignment, onBack, onSelectQuestion }: StudentAssignmentDetailProps) {
  if (!assignment.questions || assignment.status === "ungraded") {
    return (
      <div className="container mx-auto py-8 px-4 max-w-6xl">
        <Button onClick={onBack} variant="ghost" className="mb-6 gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Assignments
        </Button>

        <div className="text-center py-12">
          <h2 className="text-2xl font-bold mb-2">{assignment.name}</h2>
          <p className="text-muted-foreground">This assignment has not been graded yet.</p>
        </div>
      </div>
    )
  }

  const totalPoints = assignment.questions.reduce((sum, q) => sum + q.totalPoints, 0)
  const earnedPoints = assignment.questions.reduce((sum, q) => sum + q.pointsAwarded, 0)

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
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

      <Card>
        <CardHeader>
          <CardTitle>Questions</CardTitle>
          <CardDescription>Click on a question to view your submission and feedback</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Question</TableHead>
                <TableHead className="text-right">Points</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assignment.questions.map((question) => (
                <TableRow
                  key={question.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => onSelectQuestion(question)}
                >
                  <TableCell className="font-medium">{question.name}</TableCell>
                  <TableCell className="text-right">
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
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
