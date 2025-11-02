"use client"

import { useState } from "react"
import { AssignmentsOverview } from "@/components/assignments-overview"
import { CreateAssignment } from "@/components/create-assignment"
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

export default function Page() {
  const [view, setView] = useState<"overview" | "create">("overview")

  // Convert shared assignments to the Assignment type expected by components
  const [assignments, setAssignments] = useState<Assignment[]>(
    sharedAssignments.map(a => ({ ...a, students: [] }))
  )

  const handleCreateAssignment = (assignment: Assignment) => {
    setAssignments([...assignments, assignment])
    setView("overview")
  }

  return (
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
          />
        )}
        {view === "create" && <CreateAssignment onBack={() => setView("overview")} onCreate={handleCreateAssignment} />}
      </div>
    </div>
  )
}
