"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Upload, FileText } from "lucide-react"
import type { Assignment } from "@/app/page"

type CreateAssignmentProps = {
  onBack: () => void
  onCreate: (assignment: Assignment) => void
}

export function CreateAssignment({ onBack, onCreate }: CreateAssignmentProps) {
  const [name, setName] = useState("")
  const [dueDate, setDueDate] = useState("")
  const [rubric, setRubric] = useState("")
  const [fileName, setFileName] = useState<string | null>(null)

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setFileName(file.name)
      // In a real app, you would read the file content here
      const reader = new FileReader()
      reader.onload = (event) => {
        setRubric(event.target?.result as string)
      }
      reader.readAsText(file)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (name && dueDate) {
      onCreate({
        id: Date.now().toString(),
        name,
        dueDate,
        rubric,
        students: [],
      })
    }
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <Button variant="ghost" onClick={onBack} className="mb-6 gap-2">
        <ArrowLeft className="h-4 w-4" />
        Back to Overview
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Create New Assignment</CardTitle>
          <CardDescription>Set up a new assignment with grading rubric</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Assignment Name</Label>
              <Input
                id="name"
                placeholder="e.g., Midterm Exam, Final Project"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dueDate">Due Date</Label>
              <Input id="dueDate" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="rubric">Grading Rubric</Label>
              <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
                <input
                  type="file"
                  id="rubric-upload"
                  className="hidden"
                  accept=".txt,.pdf,.doc,.docx"
                  onChange={handleFileUpload}
                />
                <label htmlFor="rubric-upload" className="cursor-pointer">
                  <Upload className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm font-medium mb-1">{fileName ? fileName : "Click to upload rubric file"}</p>
                  <p className="text-xs text-muted-foreground">Supports TXT, PDF, DOC, DOCX</p>
                </label>
              </div>
              {fileName && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                  <FileText className="h-4 w-4" />
                  <span>{fileName}</span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="rubric-text">Or paste rubric text</Label>
              <Textarea
                id="rubric-text"
                placeholder="Enter grading criteria, point distribution, and evaluation guidelines..."
                value={rubric}
                onChange={(e) => setRubric(e.target.value)}
                rows={8}
                className="font-mono text-sm"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" size="lg" className="flex-1">
                Create Assignment
              </Button>
              <Button type="button" variant="outline" size="lg" onClick={onBack}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
