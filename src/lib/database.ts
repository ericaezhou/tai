import { Solution, Rubric } from '@/types';

// Simple in-memory storage - replace with real database in production
class InMemoryDatabase {
  private solutions: Map<string, Solution> = new Map();
  private rubrics: Map<string, Rubric> = new Map();

  // Solution operations
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

  // Rubric operations
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
}

export const db = new InMemoryDatabase();
