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
