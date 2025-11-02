import {
  Solution,
  Rubric,
  Course,
  Assignment,
  AssignmentQuestion,
  StudentAssignmentSubmission,
  SubmissionFile,
  QuestionSubmission,
  Student,
  CourseEnrollment,
  AssignmentRubric
} from '@/types';

// Simple in-memory storage - replace with real database in production
export class InMemoryDatabase {
  private solutions: Map<string, Solution> = new Map();
  private rubrics: Map<string, Rubric> = new Map();
  private courses: Map<string, Course> = new Map();
  private assignments: Map<string, Assignment> = new Map();
  private assignmentQuestions: Map<string, AssignmentQuestion> = new Map();
  // key: submission id
  private studentSubmissions: Map<string, StudentAssignmentSubmission> = new Map();
  private submissionFiles: Map<string, SubmissionFile> = new Map();
  private questionSubmissions: Map<string, QuestionSubmission> = new Map();
  private students: Map<string, Student> = new Map();
  private courseEnrollments: Map<string, CourseEnrollment> = new Map();
  private assignmentRubrics: Map<string, AssignmentRubric> = new Map();


  async saveSolution(solution: Solution): Promise<Solution> {
    this.solutions.set(solution.id, solution);
    return solution;
  }

  async getSolution(id: string): Promise<Solution | null> {
    return this.solutions.get(id) || null;
  }

  async getSolutionsByAssignment(assignmentId: string): Promise<Solution[]> {
    return Array.from(this.solutions.values()).filter(
      solution => solution.assignmentId === assignmentId
    );
  }

  // Rubric operations (existing)
  async saveRubric(rubric: Rubric): Promise<Rubric> {
    this.rubrics.set(rubric.id, rubric);

    // Update the solution to reference this rubric
    const solution = this.solutions.get(rubric.solutionId);
    if (solution) {
      solution.rubricId = rubric.id;
      this.solutions.set(solution.id, solution);
    }

    return rubric;
  }

  async getRubric(id: string): Promise<Rubric | null> {
    return this.rubrics.get(id) || null;
  }

  async getRubricBySolution(solutionId: string): Promise<Rubric | null> {
    return Array.from(this.rubrics.values()).find(
      rubric => rubric.solutionId === solutionId
    ) || null;
  }

  // Course operations
  async saveCourse(course: Course): Promise<Course> {
    this.courses.set(course.id, course);
    return course;
  }

  async getCourse(id: string): Promise<Course | null> {
    return this.courses.get(id) || null;
  }

  async getAllCourses(): Promise<Course[]> {
    return Array.from(this.courses.values());
  }

  async getCoursesForStudent(studentId: string): Promise<Course[]> {
    const enrollments = Array.from(this.courseEnrollments.values()).filter(
      enrollment => enrollment.studentId === studentId
    );
    const courseIds = enrollments.map(enrollment => enrollment.courseId);
    return courseIds.map(id => this.courses.get(id)).filter(Boolean) as Course[];
  }

  // Assignment operations
  async saveAssignment(assignment: Assignment): Promise<Assignment> {
    this.assignments.set(assignment.id, assignment);
    return assignment;
  }

  async getAssignment(id: string): Promise<Assignment | null> {
    return this.assignments.get(id) || null;
  }

  async getAssignmentsByCourse(courseId: string): Promise<Assignment[]> {
    return Array.from(this.assignments.values()).filter(
      assignment => assignment.courseId === courseId
    );
  }

  // Assignment Question operations
  async saveAssignmentQuestion(question: AssignmentQuestion): Promise<AssignmentQuestion> {
    this.assignmentQuestions.set(question.id, question);
    return question;
  }

  async getAssignmentQuestions(assignmentId: string): Promise<AssignmentQuestion[]> {
    return Array.from(this.assignmentQuestions.values())
      .filter(question => question.assignmentId === assignmentId)
      .sort((a, b) => a.orderIndex - b.orderIndex);
  }

  // Student operations
  async saveStudent(student: Student): Promise<Student> {
    this.students.set(student.id, student);
    return student;
  }

  async getStudent(id: string): Promise<Student | null> {
    return this.students.get(id) || null;
  }

  // Course Enrollment operations
  async saveCourseEnrollment(enrollment: CourseEnrollment): Promise<CourseEnrollment> {
    this.courseEnrollments.set(enrollment.id, enrollment);
    return enrollment;
  }

  async getStudentEnrollments(studentId: string): Promise<CourseEnrollment[]> {
    return Array.from(this.courseEnrollments.values()).filter(
      enrollment => enrollment.studentId === studentId
    );
  }

  // Student Assignment Submission operations
  async saveStudentSubmission(submission: StudentAssignmentSubmission): Promise<StudentAssignmentSubmission> {
    this.studentSubmissions.set(submission.id, submission);
    return submission;
  }

  async getStudentSubmission(id: string): Promise<StudentAssignmentSubmission | null> {
    return this.studentSubmissions.get(id) || null;
  }

  async getStudentSubmissionByAssignment(assignmentId: string, studentId: string): Promise<StudentAssignmentSubmission | null> {
    return Array.from(this.studentSubmissions.values()).find(
      submission => submission.assignmentId === assignmentId && submission.studentId === studentId
    ) || null;
  }

  async getSubmissionsByAssignment(assignmentId: string): Promise<StudentAssignmentSubmission[]> {
    return Array.from(this.studentSubmissions.values()).filter(
      submission => submission.assignmentId === assignmentId
    );
  }

  async getSubmissionsByStudent(studentId: string): Promise<StudentAssignmentSubmission[]> {
    return Array.from(this.studentSubmissions.values()).filter(
      submission => submission.studentId === studentId
    );
  }

  // Submission File operations
  async saveSubmissionFile(file: SubmissionFile): Promise<SubmissionFile> {
    this.submissionFiles.set(file.id, file);
    return file;
  }

  async getSubmissionFiles(submissionId: string): Promise<SubmissionFile[]> {
    return Array.from(this.submissionFiles.values()).filter(
      file => file.submissionId === submissionId
    );
  }

  // Question Submission operations
  async saveQuestionSubmission(questionSubmission: QuestionSubmission): Promise<QuestionSubmission> {
    this.questionSubmissions.set(questionSubmission.id, questionSubmission);
    return questionSubmission;
  }

  async getQuestionSubmissions(submissionId: string): Promise<QuestionSubmission[]> {
    return Array.from(this.questionSubmissions.values()).filter(
      qs => qs.submissionId === submissionId
    );
  }

  async getQuestionSubmission(submissionId: string, questionId: string): Promise<QuestionSubmission | null> {
    return Array.from(this.questionSubmissions.values()).find(
      qs => qs.submissionId === submissionId && qs.questionId === questionId
    ) || null;
  }

  // Assignment Rubric operations
  async saveAssignmentRubric(rubric: AssignmentRubric): Promise<AssignmentRubric> {
    this.assignmentRubrics.set(rubric.id, rubric);
    return rubric;
  }

  async getAssignmentRubric(assignmentId: string): Promise<AssignmentRubric | null> {
    return Array.from(this.assignmentRubrics.values()).find(
      rubric => rubric.assignmentId === assignmentId
    ) || null;
  }

  async deleteAssignmentRubric(assignmentId: string): Promise<void> {
    const rubric = await this.getAssignmentRubric(assignmentId);
    if (rubric) {
      this.assignmentRubrics.delete(rubric.id);
    }
  }
}

export const db = new InMemoryDatabase();
