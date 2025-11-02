"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { Upload, ArrowLeft } from "lucide-react"
import type { Assignment } from "@/app/page"

interface CreateAssignmentPageProps {
  onBack: () => void
  onCreate: (assignment: Assignment) => void
}

export default function CreateAssignmentPage({ onBack, onCreate }: CreateAssignmentPageProps) {
  const [assignmentName, setAssignmentName] = useState("")
  const [questionFile, setQuestionFile] = useState<File | null>(null)
  const [rubricFile, setRubricFile] = useState<File | null>(null)
  const [specialInstructions, setSpecialInstructions] = useState("")
  const [startDate, setStartDate] = useState("")
  const [dueDate, setDueDate] = useState("")

  const handleQuestionUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setQuestionFile(e.target.files[0])
    }
  }

  const handleRubricUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setRubricFile(e.target.files[0])
    }
  }

  const handleNext = () => {
    // In production, this would upload files to backend and get rubric analysis
    const newAssignment: Assignment = {
      id: Date.now().toString(),
      name: assignmentName,
      dueDate: dueDate,
      students: [],
    }
    onCreate(newAssignment)
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <Card className="p-6 sm:p-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="mb-2 -ml-2 h-8"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <h1 className="mb-8 text-3xl font-bold text-foreground">Create Assignment</h1>

          <div className="space-y-6">
            {/* Assignment Name */}
            <div>
              <Label htmlFor="assignment-name" className="text-sm font-semibold">
                Assignment Name
              </Label>
              <Input
                id="assignment-name"
                placeholder="Enter assignment name"
                className="mt-2"
                value={assignmentName}
                onChange={(e) => setAssignmentName(e.target.value)}
              />
            </div>

            {/* Question Section */}
            <div>
              <Label className="text-sm font-semibold">Question</Label>
              <div className="mt-2">
                <label
                  htmlFor="question-upload"
                  className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border bg-muted/30 px-4 py-8 transition-colors hover:bg-muted/50"
                >
                  <Upload className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground">
                    {questionFile ? questionFile.name : "Upload PDF"}
                  </span>
                  <input
                    id="question-upload"
                    type="file"
                    accept=".pdf"
                    className="sr-only"
                    onChange={handleQuestionUpload}
                  />
                </label>
              </div>
            </div>

            {/* Rubric Section */}
            <div>
              <Label className="text-sm font-semibold">Rubric</Label>
              <div className="mt-2">
                <label
                  htmlFor="rubric-upload"
                  className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border bg-muted/30 px-4 py-8 transition-colors hover:bg-muted/50"
                >
                  <Upload className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground">
                    {rubricFile ? rubricFile.name : "Upload PDF"}
                  </span>
                  <input
                    id="rubric-upload"
                    type="file"
                    accept=".pdf"
                    className="sr-only"
                    onChange={handleRubricUpload}
                  />
                </label>
              </div>
            </div>

            {/* Special Instructions */}
            <div>
              <Label htmlFor="special-instructions" className="text-sm font-semibold">
                Special Instructions <span className="font-normal text-muted-foreground">(optional)</span>
              </Label>
              <Textarea
                id="special-instructions"
                placeholder="Enter any special instructions for this assignment..."
                className="mt-2 min-h-[120px] resize-none"
                value={specialInstructions}
                onChange={(e) => setSpecialInstructions(e.target.value)}
              />
            </div>

            {/* Date Fields */}
            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <Label htmlFor="start-date" className="text-sm font-semibold">
                  Start Date
                </Label>
                <Input
                  id="start-date"
                  type="date"
                  className="mt-2"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="due-date" className="text-sm font-semibold">
                  Due Date
                </Label>
                <Input
                  id="due-date"
                  type="date"
                  className="mt-2"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>
            </div>

            {/* Next Button */}
            <div className="flex justify-end pt-4">
              <Button size="lg" className="min-w-[120px]" onClick={handleNext}>
                Next
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
