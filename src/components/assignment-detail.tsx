"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ArrowLeft, TrendingUp, TrendingDown, AlertTriangle, Eye, EyeOff } from "lucide-react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import type { Assignment } from "@/app/page"
import { releaseGradesForSubmission, releaseAllGradesForAssignment } from "@/app/actions"

type AssignmentDetailProps = {
  assignment: Assignment
  onBack: () => void
  onStudentClick?: (studentId: string, submissionId: string) => void
}

export function AssignmentDetail({ assignment, onBack, onStudentClick }: AssignmentDetailProps) {
  const students = assignment.students || []
  const [releasingGrades, setReleasingGrades] = useState<string | null>(null)
  const [releasingAll, setReleasingAll] = useState(false)

  const handleReleaseGrades = async (submissionId: string) => {
    setReleasingGrades(submissionId)
    try {
      const result = await releaseGradesForSubmission(submissionId)
      if (result.success) {
        // Refresh the page to show updated status
        window.location.reload()
      } else {
        alert(`Error: ${result.error}`)
      }
    } catch (error) {
      alert(`Error releasing grades: ${error}`)
    } finally {
      setReleasingGrades(null)
    }
  }

  const handleReleaseAllGrades = async () => {
    setReleasingAll(true)
    try {
      const result = await releaseAllGradesForAssignment(assignment.id)
      if (result.success) {
        alert(`Released grades for ${result.releasedCount} submissions`)
        // Refresh the page to show updated status
        window.location.reload()
      } else {
        alert(`Error: ${result.error}`)
      }
    } catch (error) {
      alert(`Error releasing all grades: ${error}`)
    } finally {
      setReleasingAll(false)
    }
  }

  // Calculate statistics
  const scores = students.map((s) => s.score)
  const average = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0
  const max = scores.length > 0 ? Math.max(...scores) : 0
  const min = scores.length > 0 ? Math.min(...scores) : 0
  const median = scores.length > 0 ? [...scores].sort((a, b) => a - b)[Math.floor(scores.length / 2)] : 0

  // Create distribution data
  const distribution = [
    { range: "0-59", count: scores.filter((s) => s < 60).length },
    { range: "60-69", count: scores.filter((s) => s >= 60 && s < 70).length },
    { range: "70-79", count: scores.filter((s) => s >= 70 && s < 80).length },
    { range: "80-89", count: scores.filter((s) => s >= 80 && s < 90).length },
    { range: "90-100", count: scores.filter((s) => s >= 90).length },
  ]

  // Identify problems
  const failingCount = scores.filter((s) => s < 60).length
  const lowAverage = average < 70

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <Button variant="ghost" onClick={onBack} className="mb-6 gap-2">
        <ArrowLeft className="h-4 w-4" />
        Back to Overview
      </Button>

      <div className="mb-6">
        <h1 className="text-4xl font-bold tracking-tight text-balance">{assignment.name}</h1>
        <p className="text-muted-foreground mt-2">Due: {new Date(assignment.dueDate).toLocaleDateString()}</p>
      </div>

      <div className="grid gap-6 md:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Average Score</CardDescription>
            <CardTitle className="text-3xl">{average.toFixed(1)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Median Score</CardDescription>
            <CardTitle className="text-3xl">{median}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Highest Score</CardDescription>
            <CardTitle className="text-3xl flex items-center gap-2">
              {max}
              <TrendingUp className="h-5 w-5 text-chart-4" />
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Lowest Score</CardDescription>
            <CardTitle className="text-3xl flex items-center gap-2">
              {min}
              <TrendingDown className="h-5 w-5 text-destructive" />
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Score Distribution</CardTitle>
            <CardDescription>Number of students in each score range</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                count: {
                  label: "Students",
                  color: "hsl(var(--chart-1))",
                },
              }}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={distribution}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="range" className="text-xs" />
                  <YAxis className="text-xs" />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="count" fill="var(--color-count)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Assignment Summary</CardTitle>
            <CardDescription>Key insights and potential issues</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">Statistics</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                This assignment has {students.length} submissions with an average score of {average.toFixed(1)}. The
                scores range from {min} to {max}, with a median of {median}. The standard deviation indicates{" "}
                {average > 80 ? "strong overall performance" : "moderate performance variation"}.
              </p>
            </div>

            {(failingCount > 0 || lowAverage) && (
              <div className="border-l-4 border-destructive bg-destructive/10 p-4 rounded">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-destructive mb-1">Issues Detected</h4>
                    <ul className="text-sm space-y-1 text-destructive/90">
                      {failingCount > 0 && (
                        <li>
                          • {failingCount} student{failingCount > 1 ? "s" : ""} scored below 60
                        </li>
                      )}
                      {lowAverage && <li>• Class average is below 70</li>}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {!failingCount && !lowAverage && (
              <div className="border-l-4 border-chart-4 bg-chart-4/10 p-4 rounded">
                <div className="flex items-start gap-3">
                  <TrendingUp className="h-5 w-5 text-chart-4 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-chart-4 mb-1">Strong Performance</h4>
                    <p className="text-sm text-chart-4/90">
                      No significant issues detected. Students are performing well overall.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Student Scores</CardTitle>
              <CardDescription>Individual student performance</CardDescription>
            </div>
            <Button
              onClick={handleReleaseAllGrades}
              disabled={releasingAll}
              variant="default"
              size="sm"
            >
              <Eye className="h-4 w-4 mr-2" />
              {releasingAll ? "Releasing..." : "Release All Grades"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="text-right">Score</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.map((student) => (
                <TableRow
                  key={student.id}
                  className={onStudentClick && student.submissionId ? "cursor-pointer hover:bg-muted/50" : ""}
                >
                  <TableCell
                    className="font-medium"
                    onClick={() => {
                      if (onStudentClick && student.submissionId) {
                        onStudentClick(student.id, student.submissionId)
                      }
                    }}
                  >
                    {student.name}
                  </TableCell>
                  <TableCell
                    onClick={() => {
                      if (onStudentClick && student.submissionId) {
                        onStudentClick(student.id, student.submissionId)
                      }
                    }}
                  >
                    {student.email}
                  </TableCell>
                  <TableCell
                    className="text-right"
                    onClick={() => {
                      if (onStudentClick && student.submissionId) {
                        onStudentClick(student.id, student.submissionId)
                      }
                    }}
                  >
                    <span
                      className={`font-semibold ${
                        student.score >= 90
                          ? "text-chart-4"
                          : student.score >= 80
                            ? "text-chart-2"
                            : student.score >= 70
                              ? "text-chart-3"
                              : student.score >= 60
                                ? "text-chart-5"
                                : "text-destructive"
                      }`}
                    >
                      {student.score}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    {student.gradesReleased ? (
                      <span className="inline-flex items-center gap-1 text-xs text-green-600 font-medium">
                        <Eye className="h-3 w-3" />
                        Released
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                        <EyeOff className="h-3 w-3" />
                        Hidden
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {!student.gradesReleased && student.submissionId && (
                      <Button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleReleaseGrades(student.submissionId!)
                        }}
                        disabled={releasingGrades === student.submissionId}
                        variant="outline"
                        size="sm"
                      >
                        {releasingGrades === student.submissionId ? "Releasing..." : "Release"}
                      </Button>
                    )}
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
