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
