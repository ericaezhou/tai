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
  onCreate: (assignment: Assignment, rubricFile: File | null, problemSetFile: File | null, solutionFile: File | null) => void
}

export default function CreateAssignmentPage({ onBack, onCreate }: CreateAssignmentPageProps) {
  const [assignmentName, setAssignmentName] = useState("")
  const [problemSetFile, setProblemSetFile] = useState<File | null>(null)
  const [rubricFile, setRubricFile] = useState<File | null>(null)
  const [solutionFile, setSolutionFile] = useState<File | null>(null)
  const [specialInstructions, setSpecialInstructions] = useState("")
  const [startDate, setStartDate] = useState("")
  const [dueDate, setDueDate] = useState("")
  const [errors, setErrors] = useState<{
    assignmentName?: string
    problemSetFile?: string
    startDate?: string
    dueDate?: string
  }>({})

  const handleProblemSetUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setProblemSetFile(e.target.files[0])
    }
  }

  const handleRubricUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setRubricFile(e.target.files[0])
    }
  }

  const handleSolutionUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSolutionFile(e.target.files[0])
    }
  }

  const handleNext = () => {
    console.log("[CreateAssignment] handleNext called")
    console.log("[CreateAssignment] Assignment name:", assignmentName)
    console.log("[CreateAssignment] Rubric file:", rubricFile ? rubricFile.name : "No file")
    console.log("[CreateAssignment] Solution file:", solutionFile ? solutionFile.name : "No file")

    // Validate required fields
    const newErrors: typeof errors = {}

    if (!assignmentName.trim()) {
      newErrors.assignmentName = "Assignment name is required"
    }

    if (!problemSetFile) {
      newErrors.problemSetFile = "Problem Set PDF is required"
    }

    if (!startDate) {
      newErrors.startDate = "Start date is required"
    }

    if (!dueDate) {
      newErrors.dueDate = "Due date is required"
    }

    // Check if there are any errors
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      console.log("[CreateAssignment] Validation failed:", newErrors)
      return
    }

    // Clear any previous errors
    setErrors({})

    // In production, this would upload files to backend and get rubric analysis
    const newAssignment: Assignment = {
      id: Date.now().toString(),
      name: assignmentName,
      dueDate: dueDate,
      students: [],
    }

    console.log("[CreateAssignment] Calling onCreate with assignment:", newAssignment)
    console.log("[CreateAssignment] Problem set file:", problemSetFile ? problemSetFile.name : "No file")
    console.log("[CreateAssignment] Solution file:", solutionFile ? solutionFile.name : "No file")
    onCreate(newAssignment, rubricFile, problemSetFile, solutionFile)
    console.log("[CreateAssignment] onCreate called successfully")
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
                Assignment Name <span className="text-red-600">*</span>
              </Label>
              <Input
                id="assignment-name"
                placeholder="Enter assignment name"
                className={`mt-2 ${errors.assignmentName ? "border-red-600" : ""}`}
                value={assignmentName}
                onChange={(e) => setAssignmentName(e.target.value)}
              />
              {errors.assignmentName && (
                <p className="text-sm text-red-600 mt-1">{errors.assignmentName}</p>
              )}
            </div>

            {/* Problem Set Section */}
            <div>
              <Label className="text-sm font-semibold">
                Problem Set PDF <span className="text-red-600">*</span>
              </Label>
              <p className="text-xs text-muted-foreground mt-1">
                The assignment questions that students will receive
              </p>
              <div className="mt-2">
                <label
                  htmlFor="problemset-upload"
                  className={`flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed ${
                    errors.problemSetFile ? "border-red-600" : "border-border"
                  } bg-muted/30 px-4 py-8 transition-colors hover:bg-muted/50`}
                >
                  <Upload className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground">
                    {problemSetFile ? problemSetFile.name : "Upload PDF"}
                  </span>
                  <input
                    id="problemset-upload"
                    type="file"
                    accept=".pdf"
                    className="sr-only"
                    onChange={handleProblemSetUpload}
                  />
                </label>
                {errors.problemSetFile && (
                  <p className="text-sm text-red-600 mt-1">{errors.problemSetFile}</p>
                )}
              </div>
            </div>

            {/* Rubric Section */}
            <div>
              <Label className="text-sm font-semibold">
                Rubric PDF <span className="font-normal text-muted-foreground">(optional)</span>
              </Label>
              <p className="text-xs text-muted-foreground mt-1">
                Upload a rubric PDF or leave blank to auto-generate one using Claude from the problem set
              </p>
              <div className="mt-2">
                <label
                  htmlFor="rubric-upload"
                  className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border bg-muted/30 px-4 py-8 transition-colors hover:bg-muted/50"
                >
                  <Upload className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground">
                    {rubricFile ? rubricFile.name : "Upload PDF (Optional)"}
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

            {/* Solution Key Section */}
            <div>
              <Label className="text-sm font-semibold">
                Solution Key PDF <span className="font-normal text-muted-foreground">(optional)</span>
              </Label>
              <p className="text-xs text-muted-foreground mt-1">
                Upload the answer key for automatic grading. If not provided, grading will be manual only.
              </p>
              <div className="mt-2">
                <label
                  htmlFor="solution-upload"
                  className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border bg-muted/30 px-4 py-8 transition-colors hover:bg-muted/50"
                >
                  <Upload className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground">
                    {solutionFile ? solutionFile.name : "Upload PDF (Optional)"}
                  </span>
                  <input
                    id="solution-upload"
                    type="file"
                    accept=".pdf"
                    className="sr-only"
                    onChange={handleSolutionUpload}
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
                  Start Date <span className="text-red-600">*</span>
                </Label>
                <Input
                  id="start-date"
                  type="date"
                  className={`mt-2 ${errors.startDate ? "border-red-600" : ""}`}
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
                {errors.startDate && (
                  <p className="text-sm text-red-600 mt-1">{errors.startDate}</p>
                )}
              </div>

              <div>
                <Label htmlFor="due-date" className="text-sm font-semibold">
                  Due Date <span className="text-red-600">*</span>
                </Label>
                <Input
                  id="due-date"
                  type="date"
                  className={`mt-2 ${errors.dueDate ? "border-red-600" : ""}`}
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
                {errors.dueDate && (
                  <p className="text-sm text-red-600 mt-1">{errors.dueDate}</p>
                )}
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
