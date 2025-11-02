"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ArrowLeft, TrendingUp, TrendingDown, AlertTriangle, Upload } from "lucide-react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Cell } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import type { Assignment } from "@/app/page"

type AssignmentDetailProps = {
  assignment: Assignment
  onBack: () => void
  onPublishGrades?: (assignmentId: string) => void
}

export function AssignmentDetail({ assignment, onBack, onPublishGrades }: AssignmentDetailProps) {
  const students = assignment.students || []

  // Helper function to get color based on score percentage
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600"
    if (score >= 60) return "text-yellow-600"
    return "text-red-600"
  }

  // Helper function to get arrow color based on score percentage
  const getArrowColor = (score: number) => {
    if (score >= 80) return "text-green-600"
    if (score >= 60) return "text-yellow-600"
    return "text-red-600"
  }

  // Helper function to get bar fill color based on range
  const getBarFill = (range: string) => {
    if (range === "80-89" || range === "90-100") return "hsl(142, 76%, 36%)" // green
    if (range === "60-69" || range === "70-79") return "hsl(45, 93%, 47%)" // yellow
    return "hsl(0, 84%, 60%)" // red
  }

  // Calculate statistics
  const scores = students.map((s) => s.score)
  const average = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0
  const max = scores.length > 0 ? Math.max(...scores) : 0
  const min = scores.length > 0 ? Math.min(...scores) : 0
  const median = scores.length > 0 ? [...scores].sort((a, b) => a - b)[Math.floor(scores.length / 2)] : 0

  // Create distribution data with colors
  const distribution = [
    { range: "0-59", count: scores.filter((s) => s < 60).length, fill: getBarFill("0-59") },
    { range: "60-69", count: scores.filter((s) => s >= 60 && s < 70).length, fill: getBarFill("60-69") },
    { range: "70-79", count: scores.filter((s) => s >= 70 && s < 80).length, fill: getBarFill("70-79") },
    { range: "80-89", count: scores.filter((s) => s >= 80 && s < 90).length, fill: getBarFill("80-89") },
    { range: "90-100", count: scores.filter((s) => s >= 90).length, fill: getBarFill("90-100") },
  ]

  // Identify problems
  const failingCount = scores.filter((s) => s < 60).length
  const lowAverage = average < 70

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="flex items-center justify-between mb-6">
        <Button variant="ghost" onClick={onBack} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Overview
        </Button>
        {onPublishGrades && (
          <Button
            onClick={() => onPublishGrades(assignment.id)}
            className="gap-2 bg-blue-600 hover:bg-blue-700"
          >
            <Upload className="h-4 w-4" />
            Publish Scores
          </Button>
        )}
      </div>

      <div className="mb-6">
        <h1 className="text-4xl font-bold tracking-tight text-balance">{assignment.name}</h1>
        <p className="text-muted-foreground mt-2">Due: {new Date(assignment.dueDate).toLocaleDateString()}</p>
      </div>

      <div className="grid gap-6 md:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Average Score</CardDescription>
            <CardTitle className={`text-3xl ${getScoreColor(average)}`}>{average.toFixed(1)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Median Score</CardDescription>
            <CardTitle className={`text-3xl ${getScoreColor(median)}`}>{median}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Highest Score</CardDescription>
            <CardTitle className="text-3xl flex items-center gap-2">
              <span className={getScoreColor(max)}>{max}</span>
              <TrendingUp className={`h-5 w-5 ${getArrowColor(max)}`} />
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Lowest Score</CardDescription>
            <CardTitle className="text-3xl flex items-center gap-2">
              <span className={getScoreColor(min)}>{min}</span>
              <TrendingDown className={`h-5 w-5 ${getArrowColor(min)}`} />
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
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {distribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
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

            {average < 60 && (
              <div className="border-l-4 border-red-600 bg-red-50 p-4 rounded">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-red-600 mb-1">Warning: Low Performance</h4>
                    <ul className="text-sm space-y-1 text-red-600/90">
                      <li>• Class average is below 60% - immediate attention recommended</li>
                      {failingCount > 0 && (
                        <li>
                          • {failingCount} student{failingCount > 1 ? "s" : ""} scored below 60
                        </li>
                      )}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {average >= 60 && average < 80 && (
              <div className="border-l-4 border-yellow-600 bg-yellow-50 p-4 rounded">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-yellow-600 mb-1">Average Performance</h4>
                    <p className="text-sm text-yellow-600/90">
                      Class average is moderate. Consider reviewing challenging topics to help students improve.
                      {failingCount > 0 && ` ${failingCount} student${failingCount > 1 ? "s" : ""} may need additional support.`}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {average >= 80 && (
              <div className="border-l-4 border-green-600 bg-green-50 p-4 rounded">
                <div className="flex items-start gap-3">
                  <TrendingUp className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-green-600 mb-1">Strong Performance</h4>
                    <p className="text-sm text-green-600/90">
                      Excellent work! Students are performing well overall with a class average of {average.toFixed(1)}%.
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
          <CardTitle>Student Scores</CardTitle>
          <CardDescription>Individual student performance</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="text-right">Score</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.map((student) => (
                <TableRow key={student.id}>
                  <TableCell className="font-medium">{student.name}</TableCell>
                  <TableCell>{student.email}</TableCell>
                  <TableCell className="text-right">
                    <span className={`font-semibold ${getScoreColor(student.score)}`}>
                      {student.score}
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
