"use client"

import { useState, useEffect } from "react"
import { AssignmentsOverview } from "@/components/assignments-overview"
import CreateAssignment from "@/components/create-assignment"
import { StudentOverview } from "@/components/student-overview"
import { StudentAssignmentDetail } from "@/components/student-assignment-detail"
import { StudentQuestionDetail } from "@/components/student-question-detail"
import { AssignmentSubmission } from "@/components/assignment-submission"
import { AssignmentDetail } from "@/components/assignment-detail"
import RubricBreakdownPage, { type RubricBreakdown } from "@/components/rubric-breakdown"
import { sharedAssignments } from "@/lib/assignments"
import Sidebar from "@/components/Sidebar"
import { initializeDatabase } from "@/lib/seed-data"
import {
  getCoursesWithAssignmentsForStudent,
  submitAssignment as submitAssignmentToDb,
  type CourseWithAssignments,
  type StudentAssignment as DbStudentAssignment,
  type Question as DbQuestion
} from "@/lib/queries"

export type Assignment = {
  id: string
  name: string
  dueDate: string
  rubric?: string
  students?: StudentScore[]
}

export type StudentScore = {
  id: string
  name: string
  score: number
}

export type Course = {
  id: string
  name: string
  assignments: StudentAssignment[]
}

export type StudentAssignment = {
  id: string
  name: string
  dueDate: string
  score?: number
  status: "graded" | "ungraded" | "not_submitted"
  questions?: Question[]
}

export type Question = {
  id: string
  name: string
  pointsAwarded: number
  totalPoints: number
  submission?: string
  feedback?: string
}

export default function Page() {
  const [mode, setMode] = useState<"ta" | "student">("student") // Start in student mode to show the new functionality
  const [view, setView] = useState<"overview" | "create" | "rubric" | "detail">("overview")
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null)
  const [rubricData, setRubricData] = useState<RubricBreakdown | null>(null)
  const [assignments, setAssignments] = useState<Assignment[]>([
    {
      id: "1",
      name: "Midterm Exam",
      dueDate: "2025-03-15",
      students: [
        { id: "1", name: "Alice Johnson", score: 92 },
        { id: "2", name: "Bob Smith", score: 85 },
        { id: "3", name: "Carol White", score: 78 },
        { id: "4", name: "David Brown", score: 88 },
        { id: "5", name: "Eve Davis", score: 95 },
        { id: "6", name: "Frank Miller", score: 72 },
        { id: "7", name: "Grace Lee", score: 90 },
        { id: "8", name: "Henry Wilson", score: 83 },
      ],
    },
    {
      id: "2",
      name: "Final Project",
      dueDate: "2025-05-20",
      students: [
        { id: "1", name: "Alice Johnson", score: 88 },
        { id: "2", name: "Bob Smith", score: 91 },
        { id: "3", name: "Carol White", score: 85 },
        { id: "4", name: "David Brown", score: 79 },
        { id: "5", name: "Eve Davis", score: 93 },
        { id: "6", name: "Frank Miller", score: 76 },
        { id: "7", name: "Grace Lee", score: 87 },
        { id: "8", name: "Henry Wilson", score: 90 },
      ],
    },
  ])

  const [studentView, setStudentView] = useState<"overview" | "assignment" | "question" | "submission">("overview")
  const [selectedStudentAssignment, setSelectedStudentAssignment] = useState<DbStudentAssignment | null>(null)
  const [selectedQuestion, setSelectedQuestion] = useState<DbQuestion | null>(null)
  const [courses, setCourses] = useState<CourseWithAssignments[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Initialize database and load courses on component mount
  useEffect(() => {
    const initializeData = async () => {
      try {
        setIsLoading(true)
        console.log('Initializing database...')
        await initializeDatabase()

        console.log('Loading courses for student...')
        const studentId = 'student_1' // In a real app, this would come from authentication
        const coursesData = await getCoursesWithAssignmentsForStudent(studentId)
        setCourses(coursesData)
        console.log('Courses loaded:', coursesData)
      } catch (error) {
        console.error('Error initializing data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    initializeData()
  }, [])

  const handleCreateAssignment = async (assignment: Assignment, rubricFile: File | null) => {
    console.log("[Page] handleCreateAssignment called")
    console.log("[Page] Assignment:", assignment)
    console.log("[Page] Rubric file:", rubricFile ? rubricFile.name : "No file")

    // Show rubric view with loading state
    console.log("[Page] Setting view to 'rubric'")
    setView("rubric")
    console.log("[Page] Setting rubricData to null (loading state)")
    setRubricData(null) // Clear previous data to show loading state

    if (!rubricFile) {
      console.log("[Page] No rubric file provided, using mock data")
      // Fallback to mock data if no file provided
      const mockRubricData: RubricBreakdown = {
        assignmentName: assignment.name || "New Assignment",
        questions: [
          {
            id: "1",
            questionNumber: 1,
            summary: "Implement a binary search algorithm with proper edge case handling",
            totalPoints: 20,
            criteria: [
              { id: "1-1", points: 10, description: "Correct implementation" },
              { id: "1-2", points: 5, description: "Edge cases handled" },
              { id: "1-3", points: 5, description: "Code quality" },
            ],
          },
          {
            id: "2",
            questionNumber: 2,
            summary: "Analyze time and space complexity of given algorithms",
            totalPoints: 25,
            criteria: [
              { id: "2-1", points: 15, description: "Time complexity analysis" },
              { id: "2-2", points: 10, description: "Space complexity analysis" },
            ],
          },
          {
            id: "3",
            questionNumber: 3,
            summary: "Design and implement a linked list data structure",
            totalPoints: 30,
            criteria: [
              { id: "3-1", points: 15, description: "Core functionality" },
              { id: "3-2", points: 10, description: "Additional operations" },
              { id: "3-3", points: 5, description: "Documentation" },
            ],
          },
          {
            id: "4",
            questionNumber: 4,
            summary: "Write a recursive solution for the Tower of Hanoi problem",
            totalPoints: 25,
            criteria: [
              { id: "4-1", points: 12, description: "Correct recursion" },
              { id: "4-2", points: 8, description: "Base case handling" },
              { id: "4-3", points: 5, description: "Optimization" },
            ],
          },
        ],
      }
      console.log("[Page] Setting mock rubric data")
      setRubricData(mockRubricData)
      console.log("[Page] Mock data set, returning")
      return
    }

    console.log("[Page] Rubric file provided, starting API call")
    // Import the API action dynamically to avoid server/client issues
    console.log("[Page] Dynamically importing parseRubricPDF")
    const { parseRubricPDF } = await import("./actions")
    console.log("[Page] parseRubricPDF imported successfully")

    try {
      console.log("[Page] Calling parseRubricPDF with file:", rubricFile.name)
      const result = await parseRubricPDF(rubricFile)
      console.log("[Page] parseRubricPDF returned:", result)

      if (result.success && result.rubricBreakdown) {
        console.log("[Page] Parse successful, creating rubric with name")
        const rubricWithName: RubricBreakdown = {
          assignmentName: assignment.name || "New Assignment",
          questions: result.rubricBreakdown.questions,
        }
        console.log("[Page] Setting rubric data:", rubricWithName)
        setRubricData(rubricWithName)
        console.log("[Page] Rubric data set successfully")
      } else {
        console.error("[Page] Failed to parse rubric:", result.error)
        alert(`Failed to parse rubric: ${result.error}`)
        setView("create")
      }
    } catch (error) {
      console.error("[Page] Error calling parseRubricPDF:", error)
      alert("An error occurred while parsing the rubric. Please try again.")
      setView("create")
    }
  }

  const handleConfirmRubric = (updatedRubricData: RubricBreakdown) => {
    // Here you would save the assignment with the confirmed rubric
    // The updatedRubricData contains all the edits made by the TA
    setRubricData(updatedRubricData)
    setView("overview")
  }

  const handleSelectStudentAssignment = (assignment: DbStudentAssignment) => {
    setSelectedStudentAssignment(assignment)
    if (assignment.status === "not_submitted") {
      setStudentView("submission")
    } else {
      setStudentView("assignment")
    }
  }

  const handleSubmitAssignment = async (files: File[], textSubmission: string) => {
    if (!selectedStudentAssignment) return

    try {
      console.log("Submitting assignment:", selectedStudentAssignment.name)
      console.log("Files:", files.map(f => f.name))
      console.log("Text submission:", textSubmission)

      // Use the database submission function
      const success = await submitAssignmentToDb(
        selectedStudentAssignment.id,
        'student_1', // In a real app, this would come from authentication
        files,
        textSubmission
      )

      if (success) {
        // Refresh the courses data to show updated status
        const studentId = 'student_1'
        const coursesData = await getCoursesWithAssignmentsForStudent(studentId)
        setCourses(coursesData)

        alert("Assignment submitted successfully!")
        setStudentView("overview")
      } else {
        alert("Failed to submit assignment. Please try again.")
      }
    } catch (error) {
      console.error("Error submitting assignment:", error)
      alert("An error occurred while submitting the assignment.")
    }
  }

  const handleSelectQuestion = (question: Question) => {
    setSelectedQuestion(question)
    setStudentView("question")
  }

  const handleBackToAssignment = () => {
    setStudentView("assignment")
  }

  const handleBackToOverview = () => {
    setSelectedStudentAssignment(null)
    setStudentView("overview")
  }

  const toggleMode = () => {
    setMode(mode === "ta" ? "student" : "ta")
    setView("overview")
    setStudentView("overview")
  }

  return (
    <>
      {isLoading ? (
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-lg text-muted-foreground">Loading courses and assignments...</p>
          </div>
        </div>
      ) : mode === "ta" ? (
        <div className="flex min-h-screen bg-gray-50">
          <Sidebar
            courseName="CS 101: Data Structures"
            assignments={sharedAssignments}
          />
          <div className="flex-1 overflow-auto">
            {view === "overview" && (
              <AssignmentsOverview
                assignments={assignments}
                onCreateNew={() => setView("create")}
                onSelectAssignment={(assignment) => {
                  setSelectedAssignment(assignment)
                  setView("detail")
                }}
                mode={mode}
                onToggleMode={toggleMode}
              />
            )}
            {view === "create" && (
              <CreateAssignment onBack={() => setView("overview")} onCreate={handleCreateAssignment} />
            )}
            {view === "rubric" && (
              <RubricBreakdownPage
                rubricData={rubricData}
                onBack={() => setView("create")}
                onConfirm={handleConfirmRubric}
              />
            )}
            {view === "detail" && selectedAssignment && (
              <AssignmentDetail assignment={selectedAssignment} onBack={() => setView("overview")} />
            )}
          </div>
        </div>
      ) : (
        <div className="min-h-screen bg-background">
          {studentView === "overview" && (
            <StudentOverview
              courses={courses}
              onSelectAssignment={handleSelectStudentAssignment}
              onToggleMode={toggleMode}
            />
          )}
          {studentView === "assignment" && selectedStudentAssignment && (
            <StudentAssignmentDetail
              assignment={selectedStudentAssignment}
              onBack={handleBackToOverview}
              onSelectQuestion={handleSelectQuestion}
            />
          )}
          {studentView === "question" && selectedQuestion && selectedStudentAssignment && (
            <StudentQuestionDetail
              question={selectedQuestion}
              assignmentName={selectedStudentAssignment.name}
              onBack={handleBackToAssignment}
            />
          )}
          {studentView === "submission" && selectedStudentAssignment && (
            <AssignmentSubmission
              assignment={selectedStudentAssignment}
              onBack={handleBackToOverview}
              onSubmit={handleSubmitAssignment}
            />
          )}
        </div>
      )}
    </>
  )
}
