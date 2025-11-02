"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Upload, FileText, Image, File } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import type { StudentAssignment } from "@/app/page"

type AssignmentSubmissionProps = {
  assignment: StudentAssignment
  onBack: () => void
  onSubmit: (files: File[], textSubmission: string) => void
}

export function AssignmentSubmission({ assignment, onBack, onSubmit }: AssignmentSubmissionProps) {
  const [files, setFiles] = useState<File[]>([])
  const [textSubmission, setTextSubmission] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const newFiles = Array.from(event.target.files)
      setFiles(prev => [...prev, ...newFiles])
    }
  }

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      await onSubmit(files, textSubmission)
    } finally {
      setIsSubmitting(false)
    }
  }

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return <Image className="h-4 w-4" />
    } else if (file.type === 'application/pdf' || file.type.startsWith('text/')) {
      return <FileText className="h-4 w-4" />
    } else {
      return <File className="h-4 w-4" />
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const isOverdue = new Date() > new Date(assignment.dueDate)

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="flex items-center gap-4 mb-8">
        <Button variant="outline" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{assignment.name}</h1>
          <div className="flex items-center gap-4 mt-2">
            <p className="text-muted-foreground">
              Due: {new Date(assignment.dueDate).toLocaleDateString()}
            </p>
            {isOverdue && (
              <Badge variant="destructive">Overdue</Badge>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Submit Assignment</CardTitle>
            <CardDescription>
              Upload your files and provide any additional text submission below.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* File Upload Section */}
            <div className="space-y-4">
              <Label htmlFor="file-upload" className="text-base font-medium">
                Upload Files
              </Label>
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                <Upload className="h-8 w-8 mx-auto mb-4 text-muted-foreground" />
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Drag and drop files here, or click to browse
                  </p>
                  <Input
                    id="file-upload"
                    type="file"
                    multiple
                    onChange={handleFileChange}
                    className="hidden"
                    accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif,.zip,.py,.java,.cpp,.c,.js,.html,.css"
                  />
                  <Button
                    variant="outline"
                    onClick={() => document.getElementById('file-upload')?.click()}
                  >
                    Choose Files
                  </Button>
                </div>
              </div>
              
              {/* Display uploaded files */}
              {files.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Uploaded Files:</Label>
                  <div className="space-y-2">
                    {files.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-muted rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          {getFileIcon(file)}
                          <div>
                            <p className="text-sm font-medium">{file.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatFileSize(file.size)}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(index)}
                          className="text-destructive hover:text-destructive"
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Text Submission Section */}
            <div className="space-y-4">
              <Label htmlFor="text-submission" className="text-base font-medium">
                Text Submission (Optional)
              </Label>
              <Textarea
                id="text-submission"
                placeholder="Enter any additional text, explanations, or comments for your submission..."
                value={textSubmission}
                onChange={(e) => setTextSubmission(e.target.value)}
                rows={6}
                className="resize-none"
              />
            </div>

            {/* Submit Button */}
            <div className="flex justify-end gap-4 pt-4">
              <Button variant="outline" onClick={onBack}>
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || (files.length === 0 && !textSubmission.trim())}
                className="min-w-[120px]"
              >
                {isSubmitting ? "Submitting..." : "Submit Assignment"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Assignment Instructions (if available) */}
        {assignment.questions && assignment.questions.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Assignment Questions</CardTitle>
              <CardDescription>
                Review the questions below before submitting your work.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {assignment.questions.map((question, index) => (
                  <div key={question.id} className="border-l-4 border-primary pl-4">
                    <h4 className="font-medium">
                      Question {index + 1}: {question.name}
                    </h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      Points: {question.totalPoints}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
