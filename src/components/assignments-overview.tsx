"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Plus, FileText, GraduationCap, Menu, BookOpen } from "lucide-react"
import type { Assignment, Course } from "@/app/page"

type AssignmentsOverviewProps = {
  assignments: Assignment[]
  courses: Course[]
  onCreateNew: () => void
  onSelectAssignment: (assignment: Assignment) => void
  onViewRubric?: (assignment: Assignment) => void
  mode: "ta" | "student"
  onToggleMode: () => void
}

export function AssignmentsOverview({
  assignments,
  courses,
  onCreateNew,
  onSelectAssignment,
  onViewRubric,
  mode,
  onToggleMode,
}: AssignmentsOverviewProps) {
  const [selectedCourse, setSelectedCourse] = useState<Course>(courses[0])
  const [isOpen, setIsOpen] = useState(false)

  const handleCourseSelect = (course: Course) => {
    setSelectedCourse(course)
    setIsOpen(false)
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

  // For instructor view, show all assignments since they're already filtered by course
  // The assignments prop contains assignments for the current course context
  const filteredAssignments = assignments

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
            <h1 className="text-4xl font-bold tracking-tight text-balance">Instructor Dashboard</h1>
            <p className="text-muted-foreground mt-2">{selectedCourse.name}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button onClick={onToggleMode} variant="outline" size="lg" className="gap-2 bg-transparent">
            <GraduationCap className="h-5 w-5" />
            Switch to Student
          </Button>
          <Button onClick={onCreateNew} size="lg" className="gap-2">
            <Plus className="h-5 w-5" />
            Create Assignment
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Assignments</CardTitle>
          <CardDescription>View and manage all course assignments</CardDescription>
        </CardHeader>
        <CardContent>
          {filteredAssignments.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">No assignments yet for {selectedCourse.name}</p>
              <Button onClick={onCreateNew} variant="outline">
                Create your first assignment
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Assignment Name</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAssignments.map((assignment) => (
                  <TableRow key={assignment.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium">
                      {assignment.name}
                    </TableCell>
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
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {assignment.rubricBreakdown && onViewRubric && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onViewRubric(assignment)}
                          >
                            View Rubric
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onSelectAssignment(assignment)}
                        >
                          View Details
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
