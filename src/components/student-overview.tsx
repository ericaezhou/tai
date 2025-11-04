"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Menu, BookOpen, CheckCircle2, Clock, UserCog, Upload } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import type { Course, StudentAssignment } from "@/app/page"

type StudentOverviewProps = {
  courses: Course[]
  onSelectAssignment: (assignment: StudentAssignment) => void
  onToggleMode: () => void
}

export function StudentOverview({ courses, onSelectAssignment, onToggleMode }: StudentOverviewProps) {
  const [selectedCourse, setSelectedCourse] = useState<Course>(courses[0])
  const [isOpen, setIsOpen] = useState(false)

  const handleCourseSelect = (course: Course) => {
    setSelectedCourse(course)
    setIsOpen(false)
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-600"
    if (score >= 60) return "text-yellow-600"
    return "text-red-600"
  }

  const getUrgencyProgress = (dueDate: string) => {
    const now = new Date()
    const due = new Date(dueDate)
    const oneWeekBefore = new Date(due.getTime() - 7 * 24 * 60 * 60 * 1000)

    if (now < oneWeekBefore) return 0
    if (now > due) return 100

    const totalTime = due.getTime() - oneWeekBefore.getTime()
    const elapsedTime = now.getTime() - oneWeekBefore.getTime()
    return (elapsedTime / totalTime) * 100
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left">
              <SheetHeader>
                <SheetTitle>My Courses</SheetTitle>
              </SheetHeader>
              <div className="mt-6 space-y-2">
                {courses.map((course) => (
                  <Button
                    key={course.id}
                    variant={selectedCourse.id === course.id ? "secondary" : "ghost"}
                    className="w-full justify-start gap-2"
                    onClick={() => handleCourseSelect(course)}
                  >
                    <BookOpen className="h-4 w-4" />
                    {course.name}
                  </Button>
                ))}
              </div>
            </SheetContent>
          </Sheet>

          <div>
            <h1 className="text-4xl font-bold tracking-tight text-balance">Student Dashboard</h1>
            <p className="text-muted-foreground mt-2">{selectedCourse.name}</p>
          </div>
        </div>

        <Button onClick={onToggleMode} variant="outline" size="lg" className="gap-2 bg-transparent">
          <UserCog className="h-5 w-5" />
          Switch to TA
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Assignments</CardTitle>
          <CardDescription>View your assignments and grades</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Assignment Name</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-right">Score</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {selectedCourse.assignments.map((assignment) => (
                <TableRow
                  key={assignment.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => onSelectAssignment(assignment)}
                >
                  <TableCell className="font-medium">{assignment.name}</TableCell>
                  <TableCell className="relative">
                    <div className="absolute inset-0 flex">
                      <div
                        className="bg-gray-200/30"
                        style={{ width: `${getUrgencyProgress(assignment.dueDate)}%` }}
                      />
                      <div
                        className="bg-blue-500/20"
                        style={{ width: `${100 - getUrgencyProgress(assignment.dueDate)}%` }}
                      />
                    </div>
                    <div className="relative z-10">
                      {new Date(assignment.dueDate).toLocaleDateString()}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    {assignment.status === "graded" && assignment.published ? (
                      <Badge variant="default" className="gap-1 bg-green-100 text-green-800 border-green-200">
                        <CheckCircle2 className="h-3 w-3" />
                        Graded
                      </Badge>
                    ) : assignment.status === "graded" && !assignment.published ? (
                      <Badge variant="secondary" className="gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        Submitted
                      </Badge>
                    ) : assignment.status === "ungraded" ? (
                      <Badge variant="secondary" className="gap-1">
                        <Clock className="h-3 w-3" />
                        Not Yet Graded
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="gap-1 text-orange-600 border-orange-200">
                        <Upload className="h-3 w-3" />
                        Unsubmitted
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {assignment.status === "graded" && assignment.published ? (
                      <span className={getScoreColor(assignment.score || 0)}>
                        {assignment.score}
                      </span>
                    ) : (
                      "--"
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
