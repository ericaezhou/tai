import { db } from './database';
import { generateId } from './queries';
import type {
  Course,
  Assignment,
  AssignmentQuestion,
  StudentAssignmentSubmission,
  QuestionSubmission,
  Student,
  CourseEnrollment,
  AssignmentRubric
} from '@/types';

// Seed the database with mock data
export async function seedDatabase(): Promise<void> {
  try {
    console.log('Starting database seeding...');

    // Create students
    const student1: Student = {
      id: 'student_1',
      name: 'John Doe',
      email: 'john.doe@university.edu',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    await db.saveStudent(student1);

    const student2: Student = {
      id: 'student_2',
      name: 'Alice Johnson',
      email: 'alice.johnson@university.edu',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    await db.saveStudent(student2);

    const student3: Student = {
      id: 'student_3',
      name: 'Bob Smith',
      email: 'bob.smith@university.edu',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    await db.saveStudent(student3);

    const student4: Student = {
      id: 'student_4',
      name: 'Carol White',
      email: 'carol.white@university.edu',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    await db.saveStudent(student4);

    const student5: Student = {
      id: 'student_5',
      name: 'David Brown',
      email: 'david.brown@university.edu',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    await db.saveStudent(student5);

    // Create courses
    const course1: Course = {
      id: '1',
      name: 'STAT 210: Probability Theory',
      description: 'Introduction to Probability Theory and Statistical Methods',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const course2: Course = {
      id: '2',
      name: 'Data Structures',
      description: 'Advanced Data Structures and Algorithms',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await db.saveCourse(course1);
    await db.saveCourse(course2);

    // Enroll students in courses
    const enrollment1: CourseEnrollment = {
      id: generateId('enrollment_'),
      courseId: course1.id,
      studentId: student1.id,
      enrolledAt: new Date()
    };

    const enrollment2: CourseEnrollment = {
      id: generateId('enrollment_'),
      courseId: course2.id,
      studentId: student1.id,
      enrolledAt: new Date()
    };

    const enrollment3: CourseEnrollment = {
      id: generateId('enrollment_'),
      courseId: course1.id,
      studentId: student2.id,
      enrolledAt: new Date()
    };

    const enrollment4: CourseEnrollment = {
      id: generateId('enrollment_'),
      courseId: course1.id,
      studentId: student3.id,
      enrolledAt: new Date()
    };

    const enrollment5: CourseEnrollment = {
      id: generateId('enrollment_'),
      courseId: course1.id,
      studentId: student4.id,
      enrolledAt: new Date()
    };

    const enrollment6: CourseEnrollment = {
      id: generateId('enrollment_'),
      courseId: course1.id,
      studentId: student5.id,
      enrolledAt: new Date()
    };

    await db.saveCourseEnrollment(enrollment1);
    await db.saveCourseEnrollment(enrollment2);
    await db.saveCourseEnrollment(enrollment3);
    await db.saveCourseEnrollment(enrollment4);
    await db.saveCourseEnrollment(enrollment5);
    await db.saveCourseEnrollment(enrollment6);

    // Create assignments for Course 1 (STAT 210)
    const assignment1: Assignment = {
      id: '1',
      courseId: course1.id,
      name: 'HW1 - Probability Foundations',
      description: 'Basic probability concepts, conditional probability, and Bayes theorem',
      dueDate: new Date('2025-09-15'),
      totalPoints: 75,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const assignment2: Assignment = {
      id: '2',
      courseId: course1.id,
      name: 'HW2 - Random Variables',
      description: 'Probability mass functions, expected value, variance, and distributions',
      dueDate: new Date('2025-10-15'),
      totalPoints: 75,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const assignment3: Assignment = {
      id: '3',
      courseId: course1.id,
      name: 'Midterm Exam',
      description: 'Cumulative exam covering probability theory foundations and random variables',
      dueDate: new Date('2025-11-08'),
      totalPoints: 100,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await db.saveAssignment(assignment1);
    await db.saveAssignment(assignment2);
    await db.saveAssignment(assignment3);

    // Create assignments for Course 2
    const assignment4: Assignment = {
      id: '4',
      courseId: course2.id,
      name: 'Assignment 1',
      description: 'Basic data structures implementation',
      dueDate: new Date('2025-02-10'),
      totalPoints: 100,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const assignment5: Assignment = {
      id: '5',
      courseId: course2.id,
      name: 'Assignment 2',
      description: 'Advanced algorithms',
      dueDate: new Date('2025-04-01'),
      totalPoints: 75,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await db.saveAssignment(assignment4);
    await db.saveAssignment(assignment5);

    // Create questions for Assignment 1 (HW1 - Probability Foundations)
    const questions1 = [
      {
        id: '1',
        assignmentId: assignment1.id,
        name: 'Question 1: Basic Probability',
        description: 'Calculate probability using basic counting principles and sample spaces',
        totalPoints: 20,
        orderIndex: 0,
        createdAt: new Date()
      },
      {
        id: '2',
        assignmentId: assignment1.id,
        name: 'Question 2: Conditional Probability',
        description: 'Apply conditional probability and independence concepts',
        totalPoints: 25,
        orderIndex: 1,
        createdAt: new Date()
      },
      {
        id: '3',
        assignmentId: assignment1.id,
        name: 'Question 3: Bayes Theorem',
        description: 'Use Bayes theorem to solve real-world probability problems',
        totalPoints: 30,
        orderIndex: 2,
        createdAt: new Date()
      }
    ];

    for (const question of questions1) {
      await db.saveAssignmentQuestion(question);
    }

    // Create questions for Assignment 2 (HW2 - Random Variables)
    const questions2 = [
      {
        id: '4',
        assignmentId: assignment2.id,
        name: 'Question 1: PMF Derivation',
        description: 'Derive probability mass functions for discrete random variables',
        totalPoints: 25,
        orderIndex: 0,
        createdAt: new Date()
      },
      {
        id: '5',
        assignmentId: assignment2.id,
        name: 'Question 2: Expected Value & Variance',
        description: 'Calculate expected value and variance for random variables',
        totalPoints: 30,
        orderIndex: 1,
        createdAt: new Date()
      },
      {
        id: '6',
        assignmentId: assignment2.id,
        name: 'Question 3: Probability Distributions',
        description: 'Apply common probability distributions (Binomial, Poisson, Geometric)',
        totalPoints: 20,
        orderIndex: 2,
        createdAt: new Date()
      }
    ];

    for (const question of questions2) {
      await db.saveAssignmentQuestion(question);
    }

    // Create questions for Assignment 3 (Midterm Exam)
    const questions3 = [
      {
        id: '7',
        assignmentId: assignment3.id,
        name: 'Question 1: Law of Total Probability',
        description: 'Solve complex problems using law of total probability',
        totalPoints: 20,
        orderIndex: 0,
        createdAt: new Date()
      },
      {
        id: '8',
        assignmentId: assignment3.id,
        name: 'Question 2: Joint Distributions',
        description: 'Analyze joint probability distributions and marginal distributions',
        totalPoints: 25,
        orderIndex: 1,
        createdAt: new Date()
      },
      {
        id: '9',
        assignmentId: assignment3.id,
        name: 'Question 3: Moment Generating Functions',
        description: 'Apply moment generating functions to derive distribution properties',
        totalPoints: 30,
        orderIndex: 2,
        createdAt: new Date()
      },
      {
        id: '10',
        assignmentId: assignment3.id,
        name: 'Question 4: Continuous Random Variables',
        description: 'Prove properties of continuous random variables using calculus',
        totalPoints: 25,
        orderIndex: 3,
        createdAt: new Date()
      }
    ];

    for (const question of questions3) {
      await db.saveAssignmentQuestion(question);
    }

    // Create questions for Assignment 4 (Data Structures Course)
    const questions4 = [
      {
        id: '8',
        assignmentId: assignment4.id,
        name: 'Linked Lists',
        description: 'Implement linked list operations',
        totalPoints: 50,
        orderIndex: 1,
        createdAt: new Date()
      },
      {
        id: '9',
        assignmentId: assignment4.id,
        name: 'Trees',
        description: 'Implement tree traversal algorithms',
        totalPoints: 50,
        orderIndex: 2,
        createdAt: new Date()
      }
    ];

    for (const question of questions4) {
      await db.saveAssignmentQuestion(question);
    }

    // Create rubric breakdowns for probability assignments
    const rubric1: AssignmentRubric = {
      id: generateId('rubric_'),
      assignmentId: assignment1.id,
      assignmentName: 'HW1 - Probability Foundations',
      questions: [
        {
          id: 'hw1-q1',
          questionNumber: 1,
          summary: 'Calculate probability using basic counting principles and sample spaces',
          totalPoints: 20,
          criteria: [
            { id: 'hw1-q1-c1', points: 8, description: 'Correct sample space identification' },
            { id: 'hw1-q1-c2', points: 7, description: 'Accurate probability calculation' },
            { id: 'hw1-q1-c3', points: 5, description: 'Clear explanation of reasoning' },
          ],
        },
        {
          id: 'hw1-q2',
          questionNumber: 2,
          summary: 'Apply conditional probability and independence concepts',
          totalPoints: 25,
          criteria: [
            { id: 'hw1-q2-c1', points: 12, description: 'Correct application of conditional probability formula' },
            { id: 'hw1-q2-c2', points: 8, description: 'Independence verification' },
            { id: 'hw1-q2-c3', points: 5, description: 'Work shown and justified' },
          ],
        },
        {
          id: 'hw1-q3',
          questionNumber: 3,
          summary: 'Use Bayes\' theorem to solve real-world probability problems',
          totalPoints: 30,
          criteria: [
            { id: 'hw1-q3-c1', points: 15, description: 'Correct Bayes\' theorem setup' },
            { id: 'hw1-q3-c2', points: 10, description: 'Accurate numerical computation' },
            { id: 'hw1-q3-c3', points: 5, description: 'Interpretation of results' },
          ],
        },
      ],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    await db.saveAssignmentRubric(rubric1);

    const rubric2: AssignmentRubric = {
      id: generateId('rubric_'),
      assignmentId: assignment2.id,
      assignmentName: 'HW2 - Random Variables',
      questions: [
        {
          id: 'hw2-q1',
          questionNumber: 1,
          summary: 'Derive probability mass functions for discrete random variables',
          totalPoints: 25,
          criteria: [
            { id: 'hw2-q1-c1', points: 12, description: 'Correct PMF derivation' },
            { id: 'hw2-q1-c2', points: 8, description: 'Verification that probabilities sum to 1' },
            { id: 'hw2-q1-c3', points: 5, description: 'Clear notation and presentation' },
          ],
        },
        {
          id: 'hw2-q2',
          questionNumber: 2,
          summary: 'Calculate expected value and variance for random variables',
          totalPoints: 30,
          criteria: [
            { id: 'hw2-q2-c1', points: 15, description: 'Correct expected value calculation' },
            { id: 'hw2-q2-c2', points: 12, description: 'Correct variance calculation' },
            { id: 'hw2-q2-c3', points: 3, description: 'Units and interpretation' },
          ],
        },
        {
          id: 'hw2-q3',
          questionNumber: 3,
          summary: 'Apply common probability distributions (Binomial, Poisson, Geometric)',
          totalPoints: 20,
          criteria: [
            { id: 'hw2-q3-c1', points: 10, description: 'Correct distribution identification' },
            { id: 'hw2-q3-c2', points: 10, description: 'Accurate parameter estimation and calculation' },
          ],
        },
      ],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    await db.saveAssignmentRubric(rubric2);

    const rubric3: AssignmentRubric = {
      id: generateId('rubric_'),
      assignmentId: assignment3.id,
      assignmentName: 'Midterm Exam',
      questions: [
        {
          id: 'midterm-q1',
          questionNumber: 1,
          summary: 'Solve complex problems using law of total probability',
          totalPoints: 20,
          criteria: [
            { id: 'midterm-q1-c1', points: 10, description: 'Correct partition identification' },
            { id: 'midterm-q1-c2', points: 8, description: 'Accurate application of law of total probability' },
            { id: 'midterm-q1-c3', points: 2, description: 'Final answer correctness' },
          ],
        },
        {
          id: 'midterm-q2',
          questionNumber: 2,
          summary: 'Analyze joint probability distributions and marginal distributions',
          totalPoints: 25,
          criteria: [
            { id: 'midterm-q2-c1', points: 12, description: 'Correct joint distribution calculation' },
            { id: 'midterm-q2-c2', points: 10, description: 'Accurate marginal distributions' },
            { id: 'midterm-q2-c3', points: 3, description: 'Covariance and correlation analysis' },
          ],
        },
        {
          id: 'midterm-q3',
          questionNumber: 3,
          summary: 'Apply moment generating functions to derive distribution properties',
          totalPoints: 30,
          criteria: [
            { id: 'midterm-q3-c1', points: 15, description: 'Correct MGF derivation' },
            { id: 'midterm-q3-c2', points: 10, description: 'Moments calculation from MGF' },
            { id: 'midterm-q3-c3', points: 5, description: 'Distribution identification from MGF' },
          ],
        },
        {
          id: 'midterm-q4',
          questionNumber: 4,
          summary: 'Prove properties of continuous random variables using calculus',
          totalPoints: 25,
          criteria: [
            { id: 'midterm-q4-c1', points: 12, description: 'Correct PDF/CDF relationship' },
            { id: 'midterm-q4-c2', points: 10, description: 'Rigorous proof with proper notation' },
            { id: 'midterm-q4-c3', points: 3, description: 'Conclusion and verification' },
          ],
        },
      ],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    await db.saveAssignmentRubric(rubric3);

    // Create student submissions
    // Assignment 1 - Graded for student1 (John Doe)
    const submission1: StudentAssignmentSubmission = {
      id: 'sub_1',
      assignmentId: assignment1.id,
      studentId: student1.id,
      status: 'graded',
      score: 92,
      structuredAnswer: [],
      submittedAt: new Date('2025-09-14'),
      createdAt: new Date('2025-09-14'),
      updatedAt: new Date('2025-09-16')
    };
    await db.saveStudentSubmission(submission1);

    // Create question submissions for Assignment 1
    const questionSubmissions1 = [
      {
        id: 'qs_1',
        submissionId: submission1.id,
        questionId: '1',
        pointsAwarded: 18,
        feedback: 'Great implementation! Minor issue with edge case handling for empty arrays.',
        submissionContent: '/handwritten-binary-search-algorithm.jpg',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'qs_2',
        submissionId: submission1.id,
        questionId: '2',
        pointsAwarded: 25,
        feedback: 'Perfect analysis of the algorithm\'s time complexity.',
        submissionContent: '/time-complexity-analysis-notes.jpg',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'qs_3',
        submissionId: submission1.id,
        questionId: '3',
        pointsAwarded: 22,
        feedback: 'Good understanding, but missed the space complexity discussion.',
        submissionContent: '/data-structures-diagram.png',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'qs_4',
        submissionId: submission1.id,
        questionId: '4',
        pointsAwarded: 27,
        feedback: 'Excellent recursive solution. Could be optimized with memoization.',
        submissionContent: '/recursive-function-code.jpg',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    for (const qs of questionSubmissions1) {
      await db.saveQuestionSubmission(qs);
    }

    // Assignment 2 (HW2) - Ungraded for student1
    const submission2: StudentAssignmentSubmission = {
      id: 'sub_2',
      assignmentId: assignment2.id,
      studentId: student1.id,
      status: 'ungraded',
      structuredAnswer: [],
      submittedAt: new Date('2025-10-14'),
      createdAt: new Date('2025-10-14'),
      updatedAt: new Date('2025-10-14')
    };
    await db.saveStudentSubmission(submission2);

    // Assignment 3 (Midterm) - Graded for student1
    const submission3: StudentAssignmentSubmission = {
      id: 'sub_3',
      assignmentId: assignment3.id,
      studentId: student1.id,
      status: 'graded',
      score: 88,
      structuredAnswer: [],
      submittedAt: new Date('2025-11-07'),
      createdAt: new Date('2025-11-07'),
      updatedAt: new Date('2025-11-08')
    };
    await db.saveStudentSubmission(submission3);

    // Create question submissions for Assignment 3
    const questionSubmissions3 = [
      {
        id: 'qs_5',
        submissionId: submission3.id,
        questionId: '5',
        pointsAwarded: 45,
        feedback: 'Strong implementation with good code structure.',
        submissionContent: '/project-code-implementation.jpg',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'qs_6',
        submissionId: submission3.id,
        questionId: '6',
        pointsAwarded: 20,
        feedback: 'Documentation is clear but could include more examples.',
        submissionContent: '/project-documentation.jpg',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'qs_7',
        submissionId: submission3.id,
        questionId: '7',
        pointsAwarded: 23,
        feedback: 'Comprehensive test coverage.',
        submissionContent: '/test-cases-code.jpg',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    for (const qs of questionSubmissions3) {
      await db.saveQuestionSubmission(qs);
    }

    // Assignment 4 - Graded (Data Structures course for student1)
    const submission4: StudentAssignmentSubmission = {
      id: 'sub_4',
      assignmentId: assignment4.id,
      studentId: student1.id,
      status: 'graded',
      score: 95,
      structuredAnswer: [],
      submittedAt: new Date('2025-02-09'),
      createdAt: new Date('2025-02-09'),
      updatedAt: new Date('2025-02-12')
    };
    await db.saveStudentSubmission(submission4);

    // Create question submissions for Assignment 4
    const questionSubmissions4 = [
      {
        id: 'qs_8',
        submissionId: submission4.id,
        questionId: '8',
        pointsAwarded: 48,
        feedback: 'Excellent work on linked list operations.',
        submissionContent: '/linked-list-implementation.jpg',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'qs_9',
        submissionId: submission4.id,
        questionId: '9',
        pointsAwarded: 47,
        feedback: 'Perfect tree traversal implementation.',
        submissionContent: '/tree-traversal-code.jpg',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    for (const qs of questionSubmissions4) {
      await db.saveQuestionSubmission(qs);
    }

    // Assignment 5 - Ungraded (Data Structures course for student1)
    const submission5: StudentAssignmentSubmission = {
      id: 'sub_5',
      assignmentId: assignment5.id,
      studentId: student1.id,
      status: 'ungraded',
      structuredAnswer: [],
      submittedAt: new Date('2025-03-31'),
      createdAt: new Date('2025-03-31'),
      updatedAt: new Date('2025-03-31')
    };
    await db.saveStudentSubmission(submission5);

    // Create submissions for other students in STAT 210 course
    // Student 2 (Alice Johnson) - HW1
    const submission_alice_hw1: StudentAssignmentSubmission = {
      id: generateId('sub_'),
      assignmentId: assignment1.id,
      studentId: student2.id,
      status: 'graded',
      score: 85,
      structuredAnswer: [],
      submittedAt: new Date('2025-09-14'),
      createdAt: new Date('2025-09-14'),
      updatedAt: new Date('2025-09-16')
    };
    await db.saveStudentSubmission(submission_alice_hw1);

    // Student 3 (Bob Smith) - HW1
    const submission_bob_hw1: StudentAssignmentSubmission = {
      id: generateId('sub_'),
      assignmentId: assignment1.id,
      studentId: student3.id,
      status: 'graded',
      score: 78,
      structuredAnswer: [],
      submittedAt: new Date('2025-09-15'),
      createdAt: new Date('2025-09-15'),
      updatedAt: new Date('2025-09-16')
    };
    await db.saveStudentSubmission(submission_bob_hw1);

    // Student 4 (Carol White) - HW1
    const submission_carol_hw1: StudentAssignmentSubmission = {
      id: generateId('sub_'),
      assignmentId: assignment1.id,
      studentId: student4.id,
      status: 'graded',
      score: 88,
      structuredAnswer: [],
      submittedAt: new Date('2025-09-14'),
      createdAt: new Date('2025-09-14'),
      updatedAt: new Date('2025-09-16')
    };
    await db.saveStudentSubmission(submission_carol_hw1);

    // Student 5 (David Brown) - HW1
    const submission_david_hw1: StudentAssignmentSubmission = {
      id: generateId('sub_'),
      assignmentId: assignment1.id,
      studentId: student5.id,
      status: 'graded',
      score: 95,
      structuredAnswer: [],
      submittedAt: new Date('2025-09-13'),
      createdAt: new Date('2025-09-13'),
      updatedAt: new Date('2025-09-16')
    };
    await db.saveStudentSubmission(submission_david_hw1);

    // HW2 submissions
    // Student 2 (Alice) - HW2
    const submission_alice_hw2: StudentAssignmentSubmission = {
      id: generateId('sub_'),
      assignmentId: assignment2.id,
      studentId: student2.id,
      status: 'graded',
      score: 91,
      structuredAnswer: [],
      submittedAt: new Date('2025-10-14'),
      createdAt: new Date('2025-10-14'),
      updatedAt: new Date('2025-10-16')
    };
    await db.saveStudentSubmission(submission_alice_hw2);

    // Student 3 (Bob) - HW2
    const submission_bob_hw2: StudentAssignmentSubmission = {
      id: generateId('sub_'),
      assignmentId: assignment2.id,
      studentId: student3.id,
      status: 'graded',
      score: 82,
      structuredAnswer: [],
      submittedAt: new Date('2025-10-15'),
      createdAt: new Date('2025-10-15'),
      updatedAt: new Date('2025-10-16')
    };
    await db.saveStudentSubmission(submission_bob_hw2);

    // Student 4 (Carol) - HW2
    const submission_carol_hw2: StudentAssignmentSubmission = {
      id: generateId('sub_'),
      assignmentId: assignment2.id,
      studentId: student4.id,
      status: 'graded',
      score: 79,
      structuredAnswer: [],
      submittedAt: new Date('2025-10-14'),
      createdAt: new Date('2025-10-14'),
      updatedAt: new Date('2025-10-16')
    };
    await db.saveStudentSubmission(submission_carol_hw2);

    // Student 5 (David) - HW2
    const submission_david_hw2: StudentAssignmentSubmission = {
      id: generateId('sub_'),
      assignmentId: assignment2.id,
      studentId: student5.id,
      status: 'graded',
      score: 87,
      structuredAnswer: [],
      submittedAt: new Date('2025-10-13'),
      createdAt: new Date('2025-10-13'),
      updatedAt: new Date('2025-10-16')
    };
    await db.saveStudentSubmission(submission_david_hw2);

    // Midterm submissions
    // Student 2 (Alice) - Midterm
    const submission_alice_midterm: StudentAssignmentSubmission = {
      id: generateId('sub_'),
      assignmentId: assignment3.id,
      studentId: student2.id,
      status: 'graded',
      score: 87,
      structuredAnswer: [],
      submittedAt: new Date('2025-11-07'),
      createdAt: new Date('2025-11-07'),
      updatedAt: new Date('2025-11-08')
    };
    await db.saveStudentSubmission(submission_alice_midterm);

    // Student 3 (Bob) - Midterm
    const submission_bob_midterm: StudentAssignmentSubmission = {
      id: generateId('sub_'),
      assignmentId: assignment3.id,
      studentId: student3.id,
      status: 'graded',
      score: 75,
      structuredAnswer: [],
      submittedAt: new Date('2025-11-07'),
      createdAt: new Date('2025-11-07'),
      updatedAt: new Date('2025-11-08')
    };
    await db.saveStudentSubmission(submission_bob_midterm);

    // Student 4 (Carol) - Midterm
    const submission_carol_midterm: StudentAssignmentSubmission = {
      id: generateId('sub_'),
      assignmentId: assignment3.id,
      studentId: student4.id,
      status: 'graded',
      score: 90,
      structuredAnswer: [],
      submittedAt: new Date('2025-11-07'),
      createdAt: new Date('2025-11-07'),
      updatedAt: new Date('2025-11-08')
    };
    await db.saveStudentSubmission(submission_carol_midterm);

    // Student 5 (David) - Midterm
    const submission_david_midterm: StudentAssignmentSubmission = {
      id: generateId('sub_'),
      assignmentId: assignment3.id,
      studentId: student5.id,
      status: 'graded',
      score: 94,
      structuredAnswer: [],
      submittedAt: new Date('2025-11-06'),
      createdAt: new Date('2025-11-06'),
      updatedAt: new Date('2025-11-08')
    };
    await db.saveStudentSubmission(submission_david_midterm);

    console.log('Database seeding completed successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  }
}

// Function to check if database is already seeded
export async function isDatabaseSeeded(): Promise<boolean> {
  try {
    const courses = await db.getAllCourses();
    return courses.length > 0;
  } catch (error) {
    console.error('Error checking if database is seeded:', error);
    return false;
  }
}

// Function to initialize database (seed if not already seeded)
export async function initializeDatabase(): Promise<void> {
  try {
    const isSeeded = await isDatabaseSeeded();
    if (!isSeeded) {
      await seedDatabase();
    } else {
      console.log('Database already seeded, skipping initialization.');
    }
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}
