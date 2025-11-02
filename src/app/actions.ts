'use server'

import { db } from '@/lib/database';
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic();

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

// Utility function to generate unique IDs
function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

