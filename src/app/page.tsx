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
import Sidebar from "@/components/Sidebar"
import { initializeDatabase } from "@/lib/seed-data"
import {
  getCoursesWithAssignmentsForStudent,
  submitAssignment as submitAssignmentToDb,
  getAssignmentsForCourse,
  getCourseByName,
  createAssignment as createAssignmentInDb,
  saveAssignmentRubric,
  getAssignmentRubric,
  getStudentPerformanceForAssignment,
  type CourseWithAssignments,
  type StudentAssignment as DbStudentAssignment,
  type Question as DbQuestion,
  type InstructorAssignment,
  type StudentPerformance
} from "@/lib/queries"

export type Assignment = {
  id: string
  name: string
  dueDate: string
  rubric?: string
  rubricBreakdown?: RubricBreakdown
  students?: StudentScore[]
}

export type StudentScore = {
  id: string
  name: string
  email: string
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
  const [pendingAssignment, setPendingAssignment] = useState<Assignment | null>(null)
  const [courseId, setCourseId] = useState<string>('1') // Default to STAT 210 course
  const [assignments, setAssignments] = useState<Assignment[]>([])

  const [studentView, setStudentView] = useState<"overview" | "assignment" | "question" | "submission">("overview")
  const [selectedStudentAssignment, setSelectedStudentAssignment] = useState<DbStudentAssignment | null>(null)
  const [selectedQuestion, setSelectedQuestion] = useState<DbQuestion | null>(null)
  const [courses, setCourses] = useState<CourseWithAssignments[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Initialize database and load data on component mount
  useEffect(() => {
    const initializeData = async () => {
      try {
        setIsLoading(true)
        console.log('Initializing database...')
        await initializeDatabase()

        // Load student data
        console.log('Loading courses for student...')
        const studentId = 'student_1' // In a real app, this would come from authentication
        const coursesData = await getCoursesWithAssignmentsForStudent(studentId)
        setCourses(coursesData)
        console.log('Courses loaded:', coursesData)

        // Load instructor data
        console.log('Loading assignments for instructor...')
        const instructorAssignments = await getAssignmentsForCourse(courseId)

        // Load rubrics and student performance for each assignment
        const formattedAssignments: Assignment[] = await Promise.all(
          instructorAssignments.map(async (a) => {
            // Load rubric from database
            const rubric = await getAssignmentRubric(a.id)

            // Load student performance
            const studentPerformances = await getStudentPerformanceForAssignment(a.id, courseId)

            // Convert to StudentScore type (filter out students without scores)
            const students: StudentScore[] = studentPerformances
              .filter(s => s.score !== undefined)
              .map(s => ({
                id: s.id,
                name: s.name,
                email: s.email,
                score: s.score!
              }))

            return {
              id: a.id,
              name: a.name,
              dueDate: a.dueDate,
              rubricBreakdown: rubric ? {
                assignmentName: rubric.assignmentName,
                questions: rubric.questions
              } : undefined,
              students
            }
          })
        )

        setAssignments(formattedAssignments)
        console.log('Assignments loaded with rubrics and student data:', formattedAssignments)
      } catch (error) {
        console.error('Error initializing data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    initializeData()
  }, [courseId])

  // Reload student data when switching to student mode
  useEffect(() => {
    const reloadStudentData = async () => {
      if (mode === "student") {
        console.log('Reloading student data...')
        const studentId = 'student_1'
        const coursesData = await getCoursesWithAssignmentsForStudent(studentId)
        setCourses(coursesData)
        console.log('Student data reloaded:', coursesData)
      }
    }

    reloadStudentData()
  }, [mode])

  const handleCreateAssignment = async (assignment: Assignment, rubricFile: File | null) => {
    console.log("[Page] handleCreateAssignment called")
    console.log("[Page] Assignment:", assignment)
    console.log("[Page] Rubric file:", rubricFile ? rubricFile.name : "No file")

    // Store the pending assignment
    setPendingAssignment(assignment)

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
        setPendingAssignment(null)
        setView("create")
      }
    } catch (error) {
      console.error("[Page] Error calling parseRubricPDF:", error)
      alert("An error occurred while parsing the rubric. Please try again.")
      setPendingAssignment(null)
      setView("create")
    }
  }

  const handleConfirmRubric = async (updatedRubricData: RubricBreakdown) => {
    console.log("[Page] handleConfirmRubric called")
    console.log("[Page] Updated rubric data:", updatedRubricData)
    console.log("[Page] Pending assignment:", pendingAssignment)

    if (!pendingAssignment) {
      // We're viewing an existing rubric, just update it in the assignments list
      console.log("[Page] No pending assignment - updating existing assignment")
      if (selectedAssignment) {
        setAssignments((prev) =>
          prev.map((a) =>
            a.id === selectedAssignment.id
              ? { ...a, rubricBreakdown: updatedRubricData }
              : a
          )
        )
        console.log("[Page] Updated existing assignment rubric")
      }
      // Don't clear rubricData here - it will be cleared when we navigate away
      setView("overview")
      return
    }

    // Calculate total points from rubric
    const totalPoints = updatedRubricData.questions.reduce((sum, q) => sum + q.totalPoints, 0)

    // Save assignment to database
    console.log("[Page] Saving assignment to database...")
    const dbAssignment = await createAssignmentInDb(
      courseId,
      pendingAssignment.name,
      new Date(pendingAssignment.dueDate),
      undefined, // description
      totalPoints
    )

    if (!dbAssignment) {
      console.error("[Page] Failed to save assignment to database")
      alert("Failed to save assignment. Please try again.")
      return
    }

    console.log("[Page] Assignment saved to database:", dbAssignment)

    // Save rubric to database
    console.log("[Page] Saving rubric to database...")
    const savedRubric = await saveAssignmentRubric(
      dbAssignment.id,
      updatedRubricData.assignmentName,
      updatedRubricData.questions
    )

    if (!savedRubric) {
      console.error("[Page] Failed to save rubric to database")
      alert("Assignment created but rubric failed to save. Please try again.")
    }

    console.log("[Page] Rubric saved to database:", savedRubric)

    // Create the complete assignment with rubric data for UI
    const completeAssignment: Assignment = {
      id: dbAssignment.id,
      name: dbAssignment.name,
      dueDate: dbAssignment.dueDate.toISOString(),
      rubricBreakdown: updatedRubricData,
      students: [], // Start with no students
    }

    console.log("[Page] Creating complete assignment:", completeAssignment)

    // Add to assignments list
    setAssignments((prev) => [...prev, completeAssignment])
    console.log("[Page] Assignment added to list")

    // Reload student data so it shows up when switching to student mode
    console.log("[Page] Reloading student data to include new assignment...")
    const studentId = 'student_1'
    const coursesData = await getCoursesWithAssignmentsForStudent(studentId)
    setCourses(coursesData)
    console.log("[Page] Student data reloaded with new assignment")

    // Clear pending assignment
    setPendingAssignment(null)

    // Return to overview
    setView("overview")
    console.log("[Page] Returned to overview")
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
    console.log("[handleSubmitAssignment] Function called")
    console.log("[handleSubmitAssignment] Files:", files)
    console.log("[handleSubmitAssignment] Text submission:", textSubmission)
    console.log("[handleSubmitAssignment] Selected assignment:", selectedStudentAssignment)

    if (!selectedStudentAssignment) {
      console.log("[handleSubmitAssignment] No selected assignment, returning early")
      return
    }

    try {
      console.log("[handleSubmitAssignment] Submitting assignment:", selectedStudentAssignment.name)
      console.log("[handleSubmitAssignment] Files:", files.map(f => f.name))
      console.log("[handleSubmitAssignment] Text submission:", textSubmission)

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
            courseName="STAT 210: Probability Theory"
            assignments={assignments}
            currentAssignmentId={view === "detail" || view === "rubric" ? selectedAssignment?.id : undefined}
            onSelectAssignment={(assignment) => {
              setSelectedAssignment(assignment)
              setView("detail")
            }}
            onBackToOverview={() => {
              setView("overview")
              setSelectedAssignment(null)
            }}
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
                onViewRubric={(assignment) => {
                  setSelectedAssignment(assignment)
                  setRubricData(assignment.rubricBreakdown || null)
                  setView("rubric")
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
                onBack={() => {
                  // If we have a pending assignment, we're in creation mode - go back to create
                  // Otherwise, we're viewing an existing rubric - go back to overview
                  setView(pendingAssignment ? "create" : "overview")
                }}
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
