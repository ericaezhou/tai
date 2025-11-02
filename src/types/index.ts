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

// Unsiloed AI Types

export interface BoundingBox {
  bbox: [number, number, number, number]; // [x1, y1, x2, y2]
}

export interface UnsiloedFieldExtraction {
  value: string | number | boolean | null;
  score: number; // Confidence score (0-1)
  bboxes: BoundingBox[];
  page_no: number;
}

export interface ParseSegment {
  segment_type: string;
  content: string;
  page_number: number;
  confidence: number;
  bbox: [number, number, number, number];
  html?: string;
  markdown?: string;
  ocr?: any;
}

export interface ParseChunk {
  segments: ParseSegment[];
}

export interface ParsedDocument {
  job_id: string;
  status: "Starting" | "Processing" | "Succeeded" | "Failed";
  created_at?: string;
  started_at?: string;
  finished_at?: string;
  total_chunks?: number;
  chunks?: ParseChunk[];
}

export interface ExtractedData {
  [key: string]: UnsiloedFieldExtraction;
  min_confidence_score?: number;
}

export interface ExtractedAnswerKey {
  correct_answers: UnsiloedFieldExtraction;
  problem_statements: UnsiloedFieldExtraction;
  rubric_criteria: UnsiloedFieldExtraction;
  point_values: UnsiloedFieldExtraction;
}

export interface ExtractedSubmission {
  student_name?: UnsiloedFieldExtraction;
  student_id?: UnsiloedFieldExtraction;
  [key: string]: UnsiloedFieldExtraction | undefined; // Dynamic question answers (q1_answer, q2_answer, etc.)
}

export interface UnsiloedJobStatus {
  job_id: string;
  status: "queued" | "PROCESSING" | "COMPLETED" | "FAILED";
  type?: string;
  created_at?: string;
}

export interface UnsiloedJobResult {
  data?: ExtractedData;
  results?: {
    tables?: any[];
  };
}

export interface PdfExtractionResult {
  jobId: string;
  status: string;
  extractedData?: ExtractedData;
  parsedDocument?: ParsedDocument;
  confidence: number;
  error?: string;
}

// Rubric breakdown types for UI
export interface RubricCriterion {
  id: string;
  points: number;
  description: string;
}

export interface RubricQuestion {
  id: string;
  questionNumber: number;
  summary: string;
  totalPoints: number;
  criteria: RubricCriterion[];
}

export interface AssignmentRubric {
  id: string;
  assignmentId: string;
  assignmentName: string;
  questions: RubricQuestion[];
  createdAt: Date;
  updatedAt: Date;
}
