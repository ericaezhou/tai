"use client"

import { useState } from "react"
import { AssignmentsOverview } from "@/components/assignments-overview"
import { CreateAssignment } from "@/components/create-assignment"
import { AssignmentDetail } from "@/components/assignment-detail"

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

export default function Page() {
  const [view, setView] = useState<"overview" | "create" | "detail">("overview")
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null)
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

  const handleCreateAssignment = (assignment: Assignment) => {
    setAssignments([...assignments, assignment])
    setView("overview")
  }

  const handleSelectAssignment = (assignment: Assignment) => {
    setSelectedAssignment(assignment)
    setView("detail")
  }

  return (
    <div className="min-h-screen bg-background">
      {view === "overview" && (
        <AssignmentsOverview
          assignments={assignments}
          onCreateNew={() => setView("create")}
          onSelectAssignment={handleSelectAssignment}
        />
      )}
      {view === "create" && <CreateAssignment onBack={() => setView("overview")} onCreate={handleCreateAssignment} />}
      {view === "detail" && selectedAssignment && (
        <AssignmentDetail assignment={selectedAssignment} onBack={() => setView("overview")} />
      )}
    </div>
  )
}
