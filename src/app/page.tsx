"use client"

import { useState } from "react"
import { AssignmentsOverview } from "@/components/assignments-overview"
import CreateAssignment from "@/components/create-assignment"
import { StudentOverview } from "@/components/student-overview"
import { StudentAssignmentDetail } from "@/components/student-assignment-detail"
import { StudentQuestionDetail } from "@/components/student-question-detail"
import { sharedAssignments } from "@/lib/assignments"
import Sidebar from "@/components/Sidebar"

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
  status: "graded" | "ungraded"
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
  const [mode, setMode] = useState<"ta" | "student">("ta")
  const [view, setView] = useState<"overview" | "create">("overview")
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

  const [studentView, setStudentView] = useState<"overview" | "assignment" | "question">("overview")
  const [selectedStudentAssignment, setSelectedStudentAssignment] = useState<StudentAssignment | null>(null)
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null)
  const [courses] = useState<Course[]>([
    {
      id: "1",
      name: "Computer Science 101",
      assignments: [
        {
          id: "1",
          name: "Midterm Exam",
          dueDate: "2025-03-15",
          score: 92,
          status: "graded",
          questions: [
            {
              id: "1",
              name: "Question 1: Binary Search",
              pointsAwarded: 18,
              totalPoints: 20,
              submission: "/handwritten-binary-search-algorithm.jpg",
              feedback: "Great implementation! Minor issue with edge case handling for empty arrays.",
            },
            {
              id: "2",
              name: "Question 2: Time Complexity",
              pointsAwarded: 25,
              totalPoints: 25,
              submission: "/time-complexity-analysis-notes.jpg",
              feedback: "Perfect analysis of the algorithm's time complexity.",
            },
            {
              id: "3",
              name: "Question 3: Data Structures",
              pointsAwarded: 22,
              totalPoints: 25,
              submission: "/data-structures-diagram.png",
              feedback: "Good understanding, but missed the space complexity discussion.",
            },
            {
              id: "4",
              name: "Question 4: Recursion",
              pointsAwarded: 27,
              totalPoints: 30,
              submission: "/recursive-function-code.jpg",
              feedback: "Excellent recursive solution. Could be optimized with memoization.",
            },
          ],
        },
        {
          id: "2",
          name: "Homework 3",
          dueDate: "2025-03-22",
          status: "ungraded",
        },
        {
          id: "3",
          name: "Final Project",
          dueDate: "2025-05-20",
          score: 88,
          status: "graded",
          questions: [
            {
              id: "1",
              name: "Implementation",
              pointsAwarded: 45,
              totalPoints: 50,
              submission: "/project-code-implementation.jpg",
              feedback: "Strong implementation with good code structure.",
            },
            {
              id: "2",
              name: "Documentation",
              pointsAwarded: 20,
              totalPoints: 25,
              submission: "/project-documentation.jpg",
              feedback: "Documentation is clear but could include more examples.",
            },
            {
              id: "3",
              name: "Testing",
              pointsAwarded: 23,
              totalPoints: 25,
              submission: "/test-cases-code.jpg",
              feedback: "Comprehensive test coverage.",
            },
          ],
        },
      ],
    },
    {
      id: "2",
      name: "Data Structures",
      assignments: [
        {
          id: "4",
          name: "Assignment 1",
          dueDate: "2025-02-10",
          score: 95,
          status: "graded",
          questions: [
            {
              id: "1",
              name: "Linked Lists",
              pointsAwarded: 48,
              totalPoints: 50,
              submission: "/linked-list-implementation.jpg",
              feedback: "Excellent work on linked list operations.",
            },
            {
              id: "2",
              name: "Trees",
              pointsAwarded: 47,
              totalPoints: 50,
              submission: "/tree-traversal-code.jpg",
              feedback: "Perfect tree traversal implementation.",
            },
          ],
        },
        {
          id: "5",
          name: "Assignment 2",
          dueDate: "2025-04-01",
          status: "ungraded",
        },
      ],
    },
  ])

  const handleCreateAssignment = (assignment: Assignment) => {
    setAssignments([...assignments, assignment])
    setView("overview")
  }

  const handleSelectStudentAssignment = (assignment: StudentAssignment) => {
    setSelectedStudentAssignment(assignment)
    setStudentView("assignment")
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
      {mode === "ta" ? (
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
                mode={mode}
                onToggleMode={toggleMode}
              />
            )}
            {view === "create" && (
              <CreateAssignment onBack={() => setView("overview")} onCreate={handleCreateAssignment} />
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
        </div>
      )}
    </>
  )
}
