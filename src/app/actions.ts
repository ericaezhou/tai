'use server'

import { db } from '@/lib/database';
import { Solution, StructuredAnswer } from '@/types';
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function uploadAndProcessSolution(solutionFile: File, assignmentId: string) {
  try {
    console.log("running upload and process solution");
    // Step 1: Process the uploaded file
    const fileContentAsArrayBuffer = await solutionFile.arrayBuffer();

    const pdfBase64 = Buffer.from(fileContentAsArrayBuffer).toString('base64');

    // Step 3: Generate rubric using LLM
    const response = await client.beta.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 4096 * 2,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'document',
            source: {
              type: 'base64',
              media_type: 'application/pdf',
              data: pdfBase64,
            },
          },
          { type: 'text', text: 'Create a rubric with the solution attached' }]
      }],
    });

    console.log(response.content);
  } catch (error) {
    console.error('Error processing solution:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

export async function getRubricBySolution(solutionId: string) {
  try {
    const rubric = await db.getRubricBySolution(solutionId);

    if (!rubric) {
      return {
        success: false,
        error: 'Rubric not found',
      };
    }

    return {
      success: true,
      rubric,
    };
  } catch (error) {
    console.error('Error fetching rubric:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

export async function getSolution(solutionId: string) {
  try {
    const solution = await db.getSolution(solutionId);

    if (!solution) {
      return {
        success: false,
        error: 'Solution not found',
      };
    }

    return {
      success: true,
      solution,
    };
  } catch (error) {
    console.error('Error fetching solution:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

export async function getSolutionsByAssignment(assignmentId: string) {
  try {
    const solutions = await db.getSolutionsByAssignment(assignmentId);

    return {
      success: true,
      solutions,
    };
  } catch (error) {
    console.error('Error fetching solutions:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

// Parse rubric PDF and extract question breakdown
export async function parseRubricPDF(rubricFile: File) {
  try {
    console.log("[Actions] parseRubricPDF called");
    console.log("[Actions] File name:", rubricFile.name);
    console.log("[Actions] File size:", rubricFile.size, "bytes");
    console.log("[Actions] File type:", rubricFile.type);

    // Convert PDF to base64
    console.log("[Actions] Converting PDF to ArrayBuffer");
    const fileContentAsArrayBuffer = await rubricFile.arrayBuffer();
    console.log("[Actions] ArrayBuffer created, size:", fileContentAsArrayBuffer.byteLength);

    console.log("[Actions] Converting to base64");
    const pdfBase64 = Buffer.from(fileContentAsArrayBuffer).toString('base64');
    console.log("[Actions] Base64 created, length:", pdfBase64.length);

    // Create prompt for structured rubric parsing
    const prompt = `Analyze this rubric PDF and extract the question breakdown in a structured format.

For each question in the rubric, identify:
1. The question number
2. A clear summary/description of what the question asks
3. The scoring criteria with individual point values

Return ONLY a valid JSON object (no markdown, no code blocks) with this exact structure:
{
  "questions": [
    {
      "questionNumber": 1,
      "summary": "Brief description of the question",
      "criteria": [
        {
          "points": 10,
          "description": "What this criterion evaluates"
        }
      ]
    }
  ]
}

Important:
- Each criterion should have a clear description and point value
- The sum of criteria points should equal the question's total points
- Be precise and extract the actual content from the rubric
- Maintain the original question numbering from the rubric`;

    console.log("[Actions] Calling Claude API");
    const response = await client.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 4096 * 2,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'document',
            source: {
              type: 'base64',
              media_type: 'application/pdf',
              data: pdfBase64,
            },
          },
          { type: 'text', text: prompt }
        ]
      }],
    });
    console.log("[Actions] Claude API call completed");
    console.log("[Actions] Response ID:", response.id);
    console.log("[Actions] Response content blocks:", response.content.length);

    // Extract the text content from response
    console.log("[Actions] Extracting text content from response");
    const textContent = response.content.find(block => block.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      console.error("[Actions] No text content in response");
      throw new Error('No text content in response');
    }
    console.log("[Actions] Text content found, length:", textContent.text.length);
    console.log("[Actions] First 200 chars:", textContent.text.substring(0, 200));

    // Parse the JSON response
    let parsedData;
    try {
      console.log("[Actions] Attempting to parse JSON");
      // Remove markdown code blocks if present
      let jsonText = textContent.text.trim();
      if (jsonText.startsWith('```')) {
        console.log("[Actions] Removing markdown code blocks");
        jsonText = jsonText.replace(/```json\n?|\n?```/g, '').trim();
      }
      console.log("[Actions] Parsing JSON text");
      parsedData = JSON.parse(jsonText);
      console.log("[Actions] JSON parsed successfully");
      console.log("[Actions] Parsed data has", parsedData.questions?.length || 0, "questions");
    } catch (parseError) {
      console.error('[Actions] Failed to parse JSON:', textContent.text);
      throw new Error('Failed to parse rubric data from Claude response');
    }

    // Transform to our RubricBreakdown format with generated IDs
    console.log("[Actions] Transforming to RubricBreakdown format");
    const rubricBreakdown = {
      questions: parsedData.questions.map((q: any, index: number) => ({
        id: generateId(),
        questionNumber: q.questionNumber || (index + 1),
        summary: q.summary || '',
        totalPoints: q.criteria.reduce((sum: number, c: any) => sum + (c.points || 0), 0),
        criteria: q.criteria.map((c: any) => ({
          id: generateId(),
          points: c.points || 0,
          description: c.description || '',
        })),
      })),
    };
    console.log("[Actions] Transformation complete");
    console.log("[Actions] Final rubric has", rubricBreakdown.questions.length, "questions");

    console.log("[Actions] Returning success result");
    return {
      success: true,
      rubricBreakdown,
    };
  } catch (error) {
    console.error('[Actions] Error parsing rubric:', error);
    console.error('[Actions] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

export async function gradeAssignment(assignmentId: string, studentId: string) {
  try {
    const assignment = await db.getAssignment(assignmentId);
    const questions = await db.getAssignmentQuestions(assignmentId);
    const submission = await db.getStudentSubmissionByAssignment(assignmentId, studentId);
    const solutions = await db.getSolutionsByAssignment(assignmentId);

    if (submission == null) {
      return {
        success: false,
        error: 'Submission not found',
      };
    }

    const structuredAnswers = submission.structuredAnswer;

    var payload: { solution: Solution, structuredAnswer: StructuredAnswer, questionId: string, maxPoints: number }[] = [];
    for (const ans of structuredAnswers) {
      const questionNumber = ans.questionNumber;
      const solution = solutions.find(s => s.id === `solution-${questionNumber}`) || solutions[questionNumber - 1];
      const question = questions.find(q => q.orderIndex === questionNumber - 1);

      if (question) {
        payload.push({
          solution,
          structuredAnswer: ans,
          questionId: question.id,
          maxPoints: question.totalPoints
        });
      }
    }

    // Create a detailed prompt for grading
    const gradingPrompt = `You are an expert grader. Grade each student answer against the provided solution and return a structured JSON response.

For each question, provide:
1. Points awarded (out of the maximum points)
2. Detailed feedback explaining the grade
3. Specific areas where the student did well or needs improvement

Return ONLY a valid JSON object (no markdown, no code blocks) with this exact structure:
{
  "grades": [
    {
      "questionNumber": 1,
      "pointsAwarded": 8,
      "maxPoints": 10,
      "feedback": "Detailed feedback explaining the grade, what was correct, what was missing, and suggestions for improvement."
    }
  ],
  "overallFeedback": "General comments about the student's performance across all questions."
}

Student answers and solutions to grade:
${JSON.stringify(payload, null, 2)}`;

    const response = await client.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 4096 * 2,
      messages: [{
        role: 'user',
        content: [
          { type: 'text', text: gradingPrompt }
        ]
      }],
    });

    // Extract and parse the response
    const textContent = response.content.find(block => block.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text content in grading response');
    }

    let gradingData;
    try {
      // Remove markdown code blocks if present
      let jsonText = textContent.text.trim();
      if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/```json\n?|\n?```/g, '').trim();
      }
      gradingData = JSON.parse(jsonText);
    } catch (parseError) {
      console.error('Failed to parse grading JSON:', textContent.text);
      throw new Error('Failed to parse grading data from Claude response');
    }

    // Store grading results in database
    let totalScore = 0;
    const questionSubmissions = [];

    for (const grade of gradingData.grades) {
      const questionNumber = grade.questionNumber;
      const question = questions.find(q => q.orderIndex === questionNumber - 1);

      if (question) {
        // Create or update question submission
        const questionSubmission = {
          id: generateId(),
          submissionId: submission.id,
          questionId: question.id,
          pointsAwarded: grade.pointsAwarded || 0,
          feedback: grade.feedback || '',
          submissionContent: structuredAnswers.find(ans => ans.questionNumber === questionNumber)?.content || '',
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        await db.saveQuestionSubmission(questionSubmission);
        questionSubmissions.push(questionSubmission);
        totalScore += grade.pointsAwarded || 0;
      }
    }

    // Update the main submission with total score and graded status
    const updatedSubmission = {
      ...submission,
      score: totalScore,
      status: 'graded' as const,
      updatedAt: new Date(),
    };

    await db.saveStudentSubmission(updatedSubmission);

    return {
      success: true,
      gradingResults: {
        totalScore,
        maxScore: questions.reduce((sum, q) => sum + q.totalPoints, 0),
        questionSubmissions,
        overallFeedback: gradingData.overallFeedback || '',
        submission: updatedSubmission,
      },
    };

  } catch (error) {
    console.error('Error grading assignment:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

// Utility function to generate unique IDs
function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

