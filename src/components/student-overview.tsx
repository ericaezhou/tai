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
                  <TableCell>{new Date(assignment.dueDate).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    {assignment.status === "graded" ? (
                      <div className="flex items-center justify-end gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        <span className="font-semibold">{assignment.score}</span>
                      </div>
                    ) : assignment.status === "ungraded" ? (
                      <Badge variant="secondary" className="gap-1">
                        <Clock className="h-3 w-3" />
                        Ungraded
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="gap-1 text-orange-600 border-orange-200">
                        <Upload className="h-3 w-3" />
                        Not Submitted
                      </Badge>
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
