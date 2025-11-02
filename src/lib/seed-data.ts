import { db } from './database';
import { generateId } from './queries';
import type {
  Course,
  Assignment,
  AssignmentQuestion,
  StudentAssignmentSubmission,
  QuestionSubmission,
  Student,
  CourseEnrollment
} from '@/types';

// Seed the database with mock data
export async function seedDatabase(): Promise<void> {
  try {
    console.log('Starting database seeding...');

    // Create a student (representing the current user)
    const student: Student = {
      id: 'student_1',
      name: 'John Doe',
      email: 'john.doe@university.edu',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    await db.saveStudent(student);

    // Create courses
    const course1: Course = {
      id: '1',
      name: 'Computer Science 101',
      description: 'Introduction to Computer Science',
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

    // Enroll student in courses
    const enrollment1: CourseEnrollment = {
      id: generateId('enrollment_'),
      courseId: course1.id,
      studentId: student.id,
      enrolledAt: new Date()
    };

    const enrollment2: CourseEnrollment = {
      id: generateId('enrollment_'),
      courseId: course2.id,
      studentId: student.id,
      enrolledAt: new Date()
    };

    await db.saveCourseEnrollment(enrollment1);
    await db.saveCourseEnrollment(enrollment2);

    // Create assignments for Course 1
    const assignment1: Assignment = {
      id: '1',
      courseId: course1.id,
      name: 'Midterm Exam',
      description: 'Midterm examination covering basic CS concepts',
      dueDate: new Date('2025-03-15'),
      totalPoints: 100,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const assignment2: Assignment = {
      id: '2',
      courseId: course1.id,
      name: 'Homework 3',
      description: 'Programming assignment on algorithms',
      dueDate: new Date('2025-03-22'),
      totalPoints: 50,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const assignment6: Assignment = {
      id: '6',
      courseId: course1.id,
      name: 'Lab Assignment 1',
      description: 'Hands-on lab work',
      dueDate: new Date('2025-04-15'),
      totalPoints: 30,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const assignment3: Assignment = {
      id: '3',
      courseId: course1.id,
      name: 'Final Project',
      description: 'Comprehensive final project',
      dueDate: new Date('2025-05-20'),
      totalPoints: 100,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await db.saveAssignment(assignment1);
    await db.saveAssignment(assignment2);
    await db.saveAssignment(assignment6);
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

    // Create questions for Assignment 1 (Midterm Exam)
    const questions1 = [
      {
        id: '1',
        assignmentId: assignment1.id,
        name: 'Question 1: Binary Search',
        description: 'Implement a binary search algorithm',
        totalPoints: 20,
        orderIndex: 1,
        createdAt: new Date()
      },
      {
        id: '2',
        assignmentId: assignment1.id,
        name: 'Question 2: Time Complexity',
        description: 'Analyze time complexity of algorithms',
        totalPoints: 25,
        orderIndex: 2,
        createdAt: new Date()
      },
      {
        id: '3',
        assignmentId: assignment1.id,
        name: 'Question 3: Data Structures',
        description: 'Design and implement data structures',
        totalPoints: 25,
        orderIndex: 3,
        createdAt: new Date()
      },
      {
        id: '4',
        assignmentId: assignment1.id,
        name: 'Question 4: Recursion',
        description: 'Write recursive solutions',
        totalPoints: 30,
        orderIndex: 4,
        createdAt: new Date()
      }
    ];

    for (const question of questions1) {
      await db.saveAssignmentQuestion(question);
    }

    // Create questions for Assignment 3 (Final Project)
    const questions3 = [
      {
        id: '5',
        assignmentId: assignment3.id,
        name: 'Implementation',
        description: 'Core project implementation',
        totalPoints: 50,
        orderIndex: 1,
        createdAt: new Date()
      },
      {
        id: '6',
        assignmentId: assignment3.id,
        name: 'Documentation',
        description: 'Project documentation and README',
        totalPoints: 25,
        orderIndex: 2,
        createdAt: new Date()
      },
      {
        id: '7',
        assignmentId: assignment3.id,
        name: 'Testing',
        description: 'Unit tests and test coverage',
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

    // Create student submissions
    // Assignment 1 - Graded
    const submission1: StudentAssignmentSubmission = {
      id: 'sub_1',
      assignmentId: assignment1.id,
      studentId: student.id,
      status: 'graded',
      score: 92,
      submittedAt: new Date('2025-03-14'),
      createdAt: new Date('2025-03-14'),
      updatedAt: new Date('2025-03-16')
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

    // Assignment 2 - Ungraded
    const submission2: StudentAssignmentSubmission = {
      id: 'sub_2',
      assignmentId: assignment2.id,
      studentId: student.id,
      status: 'ungraded',
      submittedAt: new Date('2025-03-21'),
      createdAt: new Date('2025-03-21'),
      updatedAt: new Date('2025-03-21')
    };
    await db.saveStudentSubmission(submission2);

    // Assignment 6 - Not submitted (no submission record)

    // Assignment 3 - Graded
    const submission3: StudentAssignmentSubmission = {
      id: 'sub_3',
      assignmentId: assignment3.id,
      studentId: student.id,
      status: 'graded',
      score: 88,
      submittedAt: new Date('2025-05-19'),
      createdAt: new Date('2025-05-19'),
      updatedAt: new Date('2025-05-22')
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

    // Assignment 4 - Graded (Data Structures course)
    const submission4: StudentAssignmentSubmission = {
      id: 'sub_4',
      assignmentId: assignment4.id,
      studentId: student.id,
      status: 'graded',
      score: 95,
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

    // Assignment 5 - Ungraded (Data Structures course)
    const submission5: StudentAssignmentSubmission = {
      id: 'sub_5',
      assignmentId: assignment5.id,
      studentId: student.id,
      status: 'ungraded',
      submittedAt: new Date('2025-03-31'),
      createdAt: new Date('2025-03-31'),
      updatedAt: new Date('2025-03-31')
    };
    await db.saveStudentSubmission(submission5);

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
