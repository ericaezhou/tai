import { db } from './database';
import type {
  Course,
  Assignment,
  AssignmentQuestion,
  StudentAssignmentSubmission,
  QuestionSubmission,
  Student
} from '@/types';

// Types for the page components (matching existing structure)
export type StudentAssignment = {
  id: string;
  name: string;
  dueDate: string;
  score?: number;
  status: "graded" | "ungraded" | "not_submitted";
  questions?: Question[];
};

export type Question = {
  id: string;
  name: string;
  pointsAwarded: number;
  totalPoints: number;
  submission?: string;
  feedback?: string;
};

export type CourseWithAssignments = {
  id: string;
  name: string;
  assignments: StudentAssignment[];
};

// Query functions for courses and assignments
export async function getCoursesWithAssignmentsForStudent(studentId: string): Promise<CourseWithAssignments[]> {
  try {
    // Get courses for the student
    const courses = await db.getCoursesForStudent(studentId);
    
    const coursesWithAssignments: CourseWithAssignments[] = [];
    
    for (const course of courses) {
      // Get assignments for each course
      const assignments = await db.getAssignmentsByCourse(course.id);
      
      const studentAssignments: StudentAssignment[] = [];
      
      for (const assignment of assignments) {
        // Get student's submission for this assignment
        const submission = await db.getStudentSubmissionByAssignment(assignment.id, studentId);
        
        // Get assignment questions
        const assignmentQuestions = await db.getAssignmentQuestions(assignment.id);
        
        let questions: Question[] | undefined;
        
        if (submission && assignmentQuestions.length > 0) {
          // Get question submissions for graded assignments
          const questionSubmissions = await db.getQuestionSubmissions(submission.id);
          
          questions = assignmentQuestions.map(aq => {
            const questionSubmission = questionSubmissions.find(qs => qs.questionId === aq.id);
            return {
              id: aq.id,
              name: aq.name,
              pointsAwarded: questionSubmission?.pointsAwarded || 0,
              totalPoints: aq.totalPoints,
              submission: questionSubmission?.submissionContent,
              feedback: questionSubmission?.feedback
            };
          });
        }
        
        const studentAssignment: StudentAssignment = {
          id: assignment.id,
          name: assignment.name,
          dueDate: assignment.dueDate.toISOString(),
          score: submission?.score,
          status: submission?.status || "not_submitted",
          questions
        };
        
        studentAssignments.push(studentAssignment);
      }
      
      coursesWithAssignments.push({
        id: course.id,
        name: course.name,
        assignments: studentAssignments
      });
    }
    
    return coursesWithAssignments;
  } catch (error) {
    console.error('Error fetching courses with assignments:', error);
    return [];
  }
}

export async function getAssignmentWithSubmission(assignmentId: string, studentId: string): Promise<StudentAssignment | null> {
  try {
    const assignment = await db.getAssignment(assignmentId);
    if (!assignment) return null;
    
    const submission = await db.getStudentSubmissionByAssignment(assignmentId, studentId);
    const assignmentQuestions = await db.getAssignmentQuestions(assignmentId);
    
    let questions: Question[] | undefined;
    
    if (submission && assignmentQuestions.length > 0) {
      const questionSubmissions = await db.getQuestionSubmissions(submission.id);
      
      questions = assignmentQuestions.map(aq => {
        const questionSubmission = questionSubmissions.find(qs => qs.questionId === aq.id);
        return {
          id: aq.id,
          name: aq.name,
          pointsAwarded: questionSubmission?.pointsAwarded || 0,
          totalPoints: aq.totalPoints,
          submission: questionSubmission?.submissionContent,
          feedback: questionSubmission?.feedback
        };
      });
    }
    
    return {
      id: assignment.id,
      name: assignment.name,
      dueDate: assignment.dueDate.toISOString(),
      score: submission?.score,
      status: submission?.status || "not_submitted",
      questions
    };
  } catch (error) {
    console.error('Error fetching assignment with submission:', error);
    return null;
  }
}

export async function submitAssignment(
  assignmentId: string,
  studentId: string,
  files: File[],
  textSubmission: string
): Promise<boolean> {
  try {
    // Create or update student submission
    const existingSubmission = await db.getStudentSubmissionByAssignment(assignmentId, studentId);
    
    const submissionData: StudentAssignmentSubmission = {
      id: existingSubmission?.id || `submission_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      assignmentId,
      studentId,
      status: "ungraded",
      submittedAt: new Date(),
      textSubmission: textSubmission || undefined,
      createdAt: existingSubmission?.createdAt || new Date(),
      updatedAt: new Date()
    };
    
    await db.saveStudentSubmission(submissionData);
    
    // Save files (in a real implementation, you'd upload to cloud storage)
    for (const file of files) {
      const fileData = {
        id: `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        submissionId: submissionData.id,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        filePath: `/uploads/${submissionData.id}/${file.name}`, // Mock path
        uploadedAt: new Date()
      };
      
      await db.saveSubmissionFile(fileData);
    }
    
    return true;
  } catch (error) {
    console.error('Error submitting assignment:', error);
    return false;
  }
}

// Helper function to generate unique IDs
export function generateId(prefix: string = ''): string {
  return `${prefix}${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
