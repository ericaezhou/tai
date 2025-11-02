export interface Question {
  id: string;
  title: string;
  maxScore: number;
}

export interface QuestionScore {
  questionId: string;
  score: number;
  feedback: string;
}

export interface StudentSubmission {
  id: string;
  studentName: string;
  studentId: string;
  email: string;
  submittedAt: Date;
  totalScore: number;
  maxScore: number;
  questionScores: QuestionScore[];
}

export interface QuestionInsights {
  questionId: string;
  questionTitle: string;
  averageScore: number;
  maxScore: number;
  insights: string;
  commonMistakes: string[];
}

export interface AssignmentData {
  title: string;
  questions: Question[];
  submissions: StudentSubmission[];
  overallInsights: string;
  questionInsights: QuestionInsights[];
}

export interface Solution {
  id: string;
  assignmentId: string;
  fileName: string;
  fileContent: string;
  uploadedAt: Date;
  rubricId?: string;
}

export interface RubricCriteria {
  id: string;
  name: string;
  description: string;
  maxPoints: number;
  levels: RubricLevel[];
}

export interface RubricLevel {
  id: string;
  name: string;
  description: string;
  points: number;
}

export interface Rubric {
  id: string;
  solutionId: string;
  title: string;
  description: string;
  criteria: RubricCriteria[];
  totalPoints: number;
  generatedAt: Date;
}

// New types for course and assignment management
export interface Course {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Assignment {
  id: string;
  courseId: string;
  name: string;
  description?: string;
  dueDate: Date;
  totalPoints?: number;
  rubric?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AssignmentQuestion {
  id: string;
  assignmentId: string;
  name: string;
  description?: string;
  totalPoints: number;
  orderIndex: number;
  createdAt: Date;
}

export interface StudentAssignmentSubmission {
  id: string;
  assignmentId: string;
  studentId: string;
  status: "graded" | "ungraded" | "not_submitted";
  score?: number;
  submittedAt?: Date;
  files?: SubmissionFile[];
  structuredAnswer: StructuredAnswer[];
  textSubmission?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface StructuredAnswer {
  questionNumber: number,
  content: string
}

export interface SubmissionFile {
  id: string;
  submissionId: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  filePath: string;
  uploadedAt: Date;
}

export interface QuestionSubmission {
  id: string;
  submissionId: string;
  questionId: string;
  pointsAwarded?: number;
  feedback?: string;
  submissionContent?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Student {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CourseEnrollment {
  id: string;
  courseId: string;
  studentId: string;
  enrolledAt: Date;
}
