import { db } from './database';
import { gradeAssignment } from '@/app/actions';
import type {
  Course,
  Assignment,
  AssignmentQuestion,
  StudentAssignmentSubmission,
  QuestionSubmission,
  Student,
  AssignmentRubric,
  RubricQuestion
} from '@/types';

// Mock grading function that generates scores aligned with the assignment rubric
async function mockGradeAssignment(assignmentId: string, studentId: string): Promise<{
  success: boolean;
  error?: string;
  gradingResults?: {
    totalScore: number;
    maxScore: number;
    questionSubmissions: QuestionSubmission[];
  };
}> {
  try {
    const assignment = await db.getAssignment(assignmentId);
    const questions = await db.getAssignmentQuestions(assignmentId);
    const submission = await db.getStudentSubmissionByAssignment(assignmentId, studentId);
    const rubric = await db.getAssignmentRubric(assignmentId);

    if (!submission) {
      return {
        success: false,
        error: 'Submission not found',
      };
    }

    // Generate mock scores for each question
    let totalScore = 0;
    const questionSubmissions: QuestionSubmission[] = [];

    for (const question of questions) {
      let pointsAwarded = 0;
      let feedback = '';

      // Check if there's a rubric for this assignment
      if (rubric && rubric.questions) {
        // Find the corresponding rubric question (match by question number)
        const rubricQuestion = rubric.questions.find(
          rq => rq.questionNumber === question.orderIndex + 1
        );

        if (rubricQuestion && rubricQuestion.criteria) {
          // Generate scores for each criterion in the rubric
          const criteriaFeedback: string[] = [];

          for (const criterion of rubricQuestion.criteria) {
            // Randomly award between 70-100% of the criterion points
            const minScore = Math.floor(criterion.points * 0.7);
            const maxScore = criterion.points;
            const criterionScore = Math.floor(Math.random() * (maxScore - minScore + 1)) + minScore;

            pointsAwarded += criterionScore;

            // Generate criterion-specific feedback
            const percentage = (criterionScore / criterion.points) * 100;
            let performanceLevel = '';
            if (percentage >= 95) {
              performanceLevel = 'Excellent';
            } else if (percentage >= 85) {
              performanceLevel = 'Very good';
            } else if (percentage >= 75) {
              performanceLevel = 'Good';
            } else {
              performanceLevel = 'Satisfactory';
            }

            criteriaFeedback.push(
              `• ${criterion.description}: ${criterionScore}/${criterion.points} - ${performanceLevel}`
            );
          }

          // Compile feedback for the question with question number
          feedback = `Question ${question.orderIndex + 1}: ${question.name}\n\nRubric Breakdown:\n${criteriaFeedback.join('\n')}\n\nTotal: ${pointsAwarded}/${rubricQuestion.totalPoints}`;
        } else {
          // Fallback if rubric question not found
          const minScore = Math.floor(question.totalPoints * 0.7);
          pointsAwarded = Math.floor(Math.random() * (question.totalPoints - minScore + 1)) + minScore;
          feedback = `Question ${question.orderIndex + 1}: ${question.name}\n\nYou demonstrated good understanding.\n\nScore: ${pointsAwarded}/${question.totalPoints}`;
        }
      } else {
        // Fallback if no rubric exists for the assignment
        const minScore = Math.floor(question.totalPoints * 0.7);
        pointsAwarded = Math.floor(Math.random() * (question.totalPoints - minScore + 1)) + minScore;
        feedback = `Question ${question.orderIndex + 1}: ${question.name}\n\nYou demonstrated good understanding.\n\nScore: ${pointsAwarded}/${question.totalPoints}`;
      }

      const questionSubmission: QuestionSubmission = {
        id: generateId('qs_'),
        submissionId: submission.id,
        questionId: question.id,
        pointsAwarded,
        feedback,
        submissionContent: submission.structuredAnswer.find(ans => ans.questionNumber === question.orderIndex + 1)?.content || '',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await db.saveQuestionSubmission(questionSubmission);
      questionSubmissions.push(questionSubmission);
      totalScore += pointsAwarded;
    }

    // Update the main submission with total score and graded status
    // Keep published as false - instructor must manually publish grades
    const updatedSubmission: StudentAssignmentSubmission = {
      ...submission,
      score: totalScore,
      status: 'graded',
      published: submission.published || false, // Preserve existing published status or default to false
      updatedAt: new Date(),
    };

    await db.saveStudentSubmission(updatedSubmission);

    return {
      success: true,
      gradingResults: {
        totalScore,
        maxScore: questions.reduce((sum, q) => sum + q.totalPoints, 0),
        questionSubmissions,
      },
    };

  } catch (error) {
    console.error('Error in mock grading:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

// Types for the page components (matching existing structure)
export type StudentAssignment = {
  id: string;
  name: string;
  dueDate: string;
  score?: number;
  status: "graded" | "ungraded" | "not_submitted";
  published?: boolean;
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
          published: submission?.published || false,
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

    // Parse structured answers from text submission
    // For now, we'll create a simple structured answer from the text submission
    // In a real implementation, you might parse this more intelligently
    const structuredAnswers = await parseTextSubmissionToStructuredAnswers(textSubmission, assignmentId);

    const submissionData: StudentAssignmentSubmission = {
      id: existingSubmission?.id || `submission_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      assignmentId,
      studentId,
      status: "ungraded",
      submittedAt: new Date(),
      textSubmission: textSubmission || undefined,
      structuredAnswer: structuredAnswers,
      published: false, // Grades not published until instructor manually publishes
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

    // Automatically grade the assignment after submission using mock grading
    console.log('Automatically grading assignment after submission (using mock grading)...');
    try {
      const gradingResult = await mockGradeAssignment(assignmentId, studentId);
      if (gradingResult.success) {
        console.log('Assignment graded successfully:', gradingResult);
      } else {
        console.error('Failed to grade assignment:', gradingResult.error);
        // Don't fail the submission if grading fails
      }
    } catch (gradingError) {
      console.error('Error during automatic grading:', gradingError);
      // Don't fail the submission if grading fails
    }

    return true;
  } catch (error) {
    console.error('Error submitting assignment:', error);
    return false;
  }
}

// Publish grades for an assignment to make them visible to students
export async function publishGrades(assignmentId: string): Promise<boolean> {
  try {
    // Get all submissions for this assignment
    const assignmentSubmissions = await db.getSubmissionsByAssignment(assignmentId);

    // Update each submission to set published = true
    for (const submission of assignmentSubmissions) {
      if (submission.status === 'graded') {
        const updatedSubmission: StudentAssignmentSubmission = {
          ...submission,
          published: true,
          updatedAt: new Date()
        };
        await db.saveStudentSubmission(updatedSubmission);
      }
    }

    console.log(`Published grades for ${assignmentSubmissions.length} submissions`);
    return true;
  } catch (error) {
    console.error('Error publishing grades:', error);
    return false;
  }
}

// Helper function to parse text submission into structured answers
async function parseTextSubmissionToStructuredAnswers(
  textSubmission: string,
  assignmentId: string
): Promise<Array<{ questionNumber: number; content: string }>> {
  try {
    // Get assignment questions to know how many questions there are
    const questions = await db.getAssignmentQuestions(assignmentId);

    if (!textSubmission || textSubmission.trim() === '') {
      // If no text submission, create empty structured answers for each question
      return questions.map((_, index) => ({
        questionNumber: index + 1,
        content: ''
      }));
    }

    // Simple parsing logic - split by question patterns
    // Look for patterns like "Question 1:", "Q1:", "1.", etc.
    const questionPattern = /(?:Question\s*(\d+)|Q(\d+)|(\d+)\.)\s*:?\s*/gi;
    const parts = textSubmission.split(questionPattern).filter(part => part && part.trim());

    const structuredAnswers: Array<{ questionNumber: number; content: string }> = [];

    // If we can parse questions from the text
    if (parts.length > 1) {
      for (let i = 0; i < parts.length; i += 2) {
        const questionNum = parseInt(parts[i]) || (i / 2) + 1;
        const content = parts[i + 1] || '';

        if (questionNum <= questions.length) {
          structuredAnswers.push({
            questionNumber: questionNum,
            content: content.trim()
          });
        }
      }
    }

    // If parsing didn't work or we don't have enough answers,
    // distribute the text across questions or put it all in question 1
    if (structuredAnswers.length === 0) {
      if (questions.length === 1) {
        structuredAnswers.push({
          questionNumber: 1,
          content: textSubmission.trim()
        });
      } else {
        // For multiple questions, put all text in question 1 and empty for others
        structuredAnswers.push({
          questionNumber: 1,
          content: textSubmission.trim()
        });

        for (let i = 2; i <= questions.length; i++) {
          structuredAnswers.push({
            questionNumber: i,
            content: ''
          });
        }
      }
    }

    // Ensure we have answers for all questions
    for (let i = 1; i <= questions.length; i++) {
      if (!structuredAnswers.find(ans => ans.questionNumber === i)) {
        structuredAnswers.push({
          questionNumber: i,
          content: ''
        });
      }
    }

    return structuredAnswers.sort((a, b) => a.questionNumber - b.questionNumber);

  } catch (error) {
    console.error('Error parsing structured answers:', error);
    // Fallback: return single answer with all text
    return [{
      questionNumber: 1,
      content: textSubmission || ''
    }];
  }
}

// Query functions for instructor/TA dashboard
export type InstructorAssignment = {
  id: string;
  name: string;
  dueDate: string;
  description?: string;
  totalPoints: number;
  questionCount: number;
};

export async function getAssignmentsForCourse(courseId: string): Promise<InstructorAssignment[]> {
  try {
    const assignments = await db.getAssignmentsByCourse(courseId);

    const instructorAssignments: InstructorAssignment[] = [];

    for (const assignment of assignments) {
      const questions = await db.getAssignmentQuestions(assignment.id);

      instructorAssignments.push({
        id: assignment.id,
        name: assignment.name,
        dueDate: assignment.dueDate.toISOString(),
        description: assignment.description,
        totalPoints: assignment.totalPoints || 0,
        questionCount: questions.length
      });
    }

    return instructorAssignments;
  } catch (error) {
    console.error('Error fetching assignments for course:', error);
    return [];
  }
}

export async function getCourseByName(courseName: string): Promise<Course | null> {
  try {
    const courses = await db.getAllCourses();
    return courses.find(c => c.name === courseName) || null;
  } catch (error) {
    console.error('Error fetching course by name:', error);
    return null;
  }
}

export async function createAssignment(
  courseId: string,
  name: string,
  dueDate: Date,
  description?: string,
  totalPoints?: number
): Promise<Assignment | null> {
  try {
    const newAssignment: Assignment = {
      id: generateId('assignment_'),
      courseId,
      name,
      description,
      dueDate,
      totalPoints,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await db.saveAssignment(newAssignment);
    return newAssignment;
  } catch (error) {
    console.error('Error creating assignment:', error);
    return null;
  }
}

export async function saveAssignmentRubric(
  assignmentId: string,
  assignmentName: string,
  questions: RubricQuestion[]
): Promise<AssignmentRubric | null> {
  try {
    const rubric: AssignmentRubric = {
      id: generateId('rubric_'),
      assignmentId,
      assignmentName,
      questions,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await db.saveAssignmentRubric(rubric);

    // Also create AssignmentQuestion entries for each question in the rubric
    // This is needed for the grading function to work properly
    console.log('[saveAssignmentRubric] Creating assignment questions from rubric...');
    for (let i = 0; i < questions.length; i++) {
      const rubricQuestion = questions[i];
      const assignmentQuestion: AssignmentQuestion = {
        id: generateId('question_'),
        assignmentId,
        name: rubricQuestion.summary,
        description: rubricQuestion.summary,
        totalPoints: rubricQuestion.totalPoints,
        orderIndex: i,
        createdAt: new Date()
      };

      await db.saveAssignmentQuestion(assignmentQuestion);
      console.log(`[saveAssignmentRubric] Created question ${i + 1}:`, assignmentQuestion.name);
    }
    console.log('[saveAssignmentRubric] All assignment questions created');

    return rubric;
  } catch (error) {
    console.error('Error saving assignment rubric:', error);
    return null;
  }
}

export async function getAssignmentRubric(assignmentId: string): Promise<AssignmentRubric | null> {
  try {
    return await db.getAssignmentRubric(assignmentId);
  } catch (error) {
    console.error('Error getting assignment rubric:', error);
    return null;
  }
}

// Get student performance data for an assignment (for instructor view)
export type StudentPerformance = {
  id: string;
  name: string;
  email: string;
  score?: number;
};

export async function getStudentPerformanceForAssignment(assignmentId: string, courseId: string): Promise<StudentPerformance[]> {
  try {
    // Get all submissions for this assignment
    const submissions = await db.getSubmissionsByAssignment(assignmentId);

    // Get all enrolled students for the course
    const assignment = await db.getAssignment(assignmentId);
    if (!assignment) return [];

    // Get all students enrolled in the course
    const allEnrollments = Array.from((db as any).courseEnrollments.values()).filter(
      (e: any) => e.courseId === courseId
    );

    const studentPerformances: StudentPerformance[] = [];

    for (const enrollment of allEnrollments) {
      const student = await db.getStudent((enrollment as any).studentId);
      if (!student) {
        console.warn(`Student ${(enrollment as any).studentId} not found in database`);
        continue;
      }

      const submission = submissions.find(s => s.studentId === student.id);

      studentPerformances.push({
        id: student.id,
        name: student.name,
        email: student.email,
        score: submission?.score
      });
    }

    return studentPerformances;
  } catch (error) {
    console.error('Error getting student performance:', error);
    return [];
  }
}

// Helper function to generate unique IDs
export function generateId(prefix: string = ''): string {
  return `${prefix}${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
