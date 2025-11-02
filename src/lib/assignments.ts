export interface SharedAssignment {
  id: string;
  name: string;
  dueDate: string;
}

export const sharedAssignments: SharedAssignment[] = [
  {
    id: "1",
    name: "Assignment 1 - Basics",
    dueDate: "2025-02-15",
  },
  {
    id: "2",
    name: "Assignment 2 - Algorithms",
    dueDate: "2025-03-01",
  },
  {
    id: "3",
    name: "Assignment 3 - Data Structures",
    dueDate: "2025-03-20",
  },
  {
    id: "4",
    name: "Midterm Exam",
    dueDate: "2025-04-05",
  },
  {
    id: "5",
    name: "Final Project",
    dueDate: "2025-05-20",
  },
];
