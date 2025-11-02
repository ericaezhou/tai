import { Rubric, RubricCriteria, RubricLevel } from '@/types';

// Mock LLM service - replace with actual LLM integration (OpenAI, Anthropic, etc.)
export class LLMService {
  async generateRubric(solutionContent: string, fileName: string): Promise<Omit<Rubric, 'id' | 'solutionId' | 'generatedAt'>> {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Mock rubric generation based on solution content
    const rubricData = this.mockGenerateRubric(solutionContent, fileName);
    
    return rubricData;
  }

  private mockGenerateRubric(solutionContent: string, fileName: string): Omit<Rubric, 'id' | 'solutionId' | 'generatedAt'> {
    // Analyze solution content to determine appropriate criteria
    const isCodeSolution = fileName.match(/\.(js|ts|py|java|cpp|c|cs)$/i);
    const isPaperSolution = fileName.match(/\.(pdf|doc|docx|txt|md)$/i);
    
    let criteria: RubricCriteria[] = [];
    let title = '';
    let description = '';

    if (isCodeSolution) {
      title = 'Code Solution Rubric';
      description = 'Rubric for evaluating programming assignment solution';
      criteria = [
        {
          id: 'correctness',
          name: 'Correctness',
          description: 'Does the solution produce correct output for all test cases?',
          maxPoints: 40,
          levels: [
            { id: 'excellent', name: 'Excellent', description: 'All test cases pass, handles edge cases', points: 40 },
            { id: 'good', name: 'Good', description: 'Most test cases pass, minor issues', points: 32 },
            { id: 'satisfactory', name: 'Satisfactory', description: 'Basic functionality works', points: 24 },
            { id: 'needs-improvement', name: 'Needs Improvement', description: 'Some functionality missing or incorrect', points: 16 },
            { id: 'unsatisfactory', name: 'Unsatisfactory', description: 'Major issues or non-functional', points: 0 }
          ]
        },
        {
          id: 'code-quality',
          name: 'Code Quality',
          description: 'Is the code well-structured, readable, and maintainable?',
          maxPoints: 30,
          levels: [
            { id: 'excellent', name: 'Excellent', description: 'Clean, well-organized, follows best practices', points: 30 },
            { id: 'good', name: 'Good', description: 'Generally well-structured with minor issues', points: 24 },
            { id: 'satisfactory', name: 'Satisfactory', description: 'Acceptable structure, some improvements needed', points: 18 },
            { id: 'needs-improvement', name: 'Needs Improvement', description: 'Poor structure or readability issues', points: 12 },
            { id: 'unsatisfactory', name: 'Unsatisfactory', description: 'Very poor code quality', points: 0 }
          ]
        },
        {
          id: 'efficiency',
          name: 'Efficiency',
          description: 'Is the solution algorithmically efficient?',
          maxPoints: 20,
          levels: [
            { id: 'excellent', name: 'Excellent', description: 'Optimal time and space complexity', points: 20 },
            { id: 'good', name: 'Good', description: 'Good efficiency with minor optimizations possible', points: 16 },
            { id: 'satisfactory', name: 'Satisfactory', description: 'Acceptable efficiency', points: 12 },
            { id: 'needs-improvement', name: 'Needs Improvement', description: 'Inefficient approach', points: 8 },
            { id: 'unsatisfactory', name: 'Unsatisfactory', description: 'Very inefficient or incorrect approach', points: 0 }
          ]
        },
        {
          id: 'documentation',
          name: 'Documentation',
          description: 'Are comments and documentation adequate?',
          maxPoints: 10,
          levels: [
            { id: 'excellent', name: 'Excellent', description: 'Comprehensive and clear documentation', points: 10 },
            { id: 'good', name: 'Good', description: 'Good documentation with minor gaps', points: 8 },
            { id: 'satisfactory', name: 'Satisfactory', description: 'Basic documentation present', points: 6 },
            { id: 'needs-improvement', name: 'Needs Improvement', description: 'Minimal or unclear documentation', points: 4 },
            { id: 'unsatisfactory', name: 'Unsatisfactory', description: 'No meaningful documentation', points: 0 }
          ]
        }
      ];
    } else if (isPaperSolution) {
      title = 'Written Solution Rubric';
      description = 'Rubric for evaluating written assignment solution';
      criteria = [
        {
          id: 'content-accuracy',
          name: 'Content Accuracy',
          description: 'Is the content factually correct and complete?',
          maxPoints: 40,
          levels: [
            { id: 'excellent', name: 'Excellent', description: 'All content is accurate and comprehensive', points: 40 },
            { id: 'good', name: 'Good', description: 'Mostly accurate with minor errors', points: 32 },
            { id: 'satisfactory', name: 'Satisfactory', description: 'Generally accurate but missing some details', points: 24 },
            { id: 'needs-improvement', name: 'Needs Improvement', description: 'Some inaccuracies or significant gaps', points: 16 },
            { id: 'unsatisfactory', name: 'Unsatisfactory', description: 'Major inaccuracies or incomplete', points: 0 }
          ]
        },
        {
          id: 'organization',
          name: 'Organization',
          description: 'Is the solution well-organized and logically structured?',
          maxPoints: 25,
          levels: [
            { id: 'excellent', name: 'Excellent', description: 'Clear, logical flow with excellent organization', points: 25 },
            { id: 'good', name: 'Good', description: 'Well-organized with minor structural issues', points: 20 },
            { id: 'satisfactory', name: 'Satisfactory', description: 'Acceptable organization', points: 15 },
            { id: 'needs-improvement', name: 'Needs Improvement', description: 'Poor organization or unclear structure', points: 10 },
            { id: 'unsatisfactory', name: 'Unsatisfactory', description: 'No clear organization', points: 0 }
          ]
        },
        {
          id: 'analysis',
          name: 'Analysis & Critical Thinking',
          description: 'Does the solution demonstrate analytical and critical thinking skills?',
          maxPoints: 25,
          levels: [
            { id: 'excellent', name: 'Excellent', description: 'Exceptional analysis and insights', points: 25 },
            { id: 'good', name: 'Good', description: 'Good analysis with some insights', points: 20 },
            { id: 'satisfactory', name: 'Satisfactory', description: 'Basic analysis present', points: 15 },
            { id: 'needs-improvement', name: 'Needs Improvement', description: 'Limited analysis or shallow thinking', points: 10 },
            { id: 'unsatisfactory', name: 'Unsatisfactory', description: 'No meaningful analysis', points: 0 }
          ]
        },
        {
          id: 'presentation',
          name: 'Presentation',
          description: 'Is the solution well-presented with proper formatting and grammar?',
          maxPoints: 10,
          levels: [
            { id: 'excellent', name: 'Excellent', description: 'Professional presentation, error-free', points: 10 },
            { id: 'good', name: 'Good', description: 'Good presentation with minor issues', points: 8 },
            { id: 'satisfactory', name: 'Satisfactory', description: 'Acceptable presentation', points: 6 },
            { id: 'needs-improvement', name: 'Needs Improvement', description: 'Poor presentation or many errors', points: 4 },
            { id: 'unsatisfactory', name: 'Unsatisfactory', description: 'Very poor presentation', points: 0 }
          ]
        }
      ];
    } else {
      // Generic rubric for unknown file types
      title = 'General Solution Rubric';
      description = 'General rubric for evaluating assignment solution';
      criteria = [
        {
          id: 'completeness',
          name: 'Completeness',
          description: 'Does the solution address all requirements?',
          maxPoints: 50,
          levels: [
            { id: 'excellent', name: 'Excellent', description: 'All requirements fully addressed', points: 50 },
            { id: 'good', name: 'Good', description: 'Most requirements addressed', points: 40 },
            { id: 'satisfactory', name: 'Satisfactory', description: 'Basic requirements met', points: 30 },
            { id: 'needs-improvement', name: 'Needs Improvement', description: 'Some requirements missing', points: 20 },
            { id: 'unsatisfactory', name: 'Unsatisfactory', description: 'Major requirements missing', points: 0 }
          ]
        },
        {
          id: 'quality',
          name: 'Quality',
          description: 'Is the solution of high quality?',
          maxPoints: 30,
          levels: [
            { id: 'excellent', name: 'Excellent', description: 'Exceptional quality', points: 30 },
            { id: 'good', name: 'Good', description: 'Good quality with minor issues', points: 24 },
            { id: 'satisfactory', name: 'Satisfactory', description: 'Acceptable quality', points: 18 },
            { id: 'needs-improvement', name: 'Needs Improvement', description: 'Below average quality', points: 12 },
            { id: 'unsatisfactory', name: 'Unsatisfactory', description: 'Poor quality', points: 0 }
          ]
        },
        {
          id: 'presentation',
          name: 'Presentation',
          description: 'Is the solution well-presented?',
          maxPoints: 20,
          levels: [
            { id: 'excellent', name: 'Excellent', description: 'Professional presentation', points: 20 },
            { id: 'good', name: 'Good', description: 'Good presentation', points: 16 },
            { id: 'satisfactory', name: 'Satisfactory', description: 'Acceptable presentation', points: 12 },
            { id: 'needs-improvement', name: 'Needs Improvement', description: 'Poor presentation', points: 8 },
            { id: 'unsatisfactory', name: 'Unsatisfactory', description: 'Very poor presentation', points: 0 }
          ]
        }
      ];
    }

    const totalPoints = criteria.reduce((sum, criterion) => sum + criterion.maxPoints, 0);

    return {
      title,
      description,
      criteria,
      totalPoints
    };
  }
}

export const llmService = new LLMService();
