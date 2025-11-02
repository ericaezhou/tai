// Mathematical Expression Validation

import type { MathValidation, OCRError } from '@/types/ocr';

/**
 * Validate mathematical expression syntax
 */
export function validateMathExpression(expr: string): MathValidation {
  const errors: string[] = [];
  const syntaxErrors: string[] = [];
  let corrected = expr.trim();

  // Check balanced parentheses
  const parenBalance = checkBalancedParentheses(corrected);
  if (!parenBalance.balanced) {
    errors.push(`Unbalanced parentheses: ${parenBalance.message}`);
    syntaxErrors.push('parentheses');
  }

  // Check for invalid operator sequences
  const invalidOperators = /[\+\-\*\/]{2,}|[\+\-\*\/]$/;
  if (invalidOperators.test(corrected)) {
    errors.push('Invalid operator sequence detected');
    syntaxErrors.push('operators');
  }

  // Check for common OCR errors in math
  const mathCorrections = applyMathCorrections(corrected);
  if (mathCorrections.corrected !== corrected) {
    errors.push(...mathCorrections.fixes);
    corrected = mathCorrections.corrected;
  }

  // Check for orphan operators (operators at start/end)
  if (/^[\+\-\*\/]/.test(corrected) || /[\+\-\*\/]$/.test(corrected)) {
    errors.push('Expression starts or ends with operator');
    syntaxErrors.push('orphan_operators');
  }

  // Check for valid variable names (if any)
  const invalidVars = /\b\d+[a-zA-Z]/g; // Number followed by letter without operator
  if (invalidVars.test(corrected)) {
    errors.push('Invalid variable notation (e.g., "2x" should be "2*x")');
    syntaxErrors.push('variables');
  }

  return {
    isValid: errors.length === 0,
    errors,
    corrected: errors.length > 0 ? corrected : undefined,
    syntaxErrors,
    balancedParentheses: parenBalance.balanced
  };
}

/**
 * Check if parentheses are balanced
 */
function checkBalancedParentheses(expr: string): { balanced: boolean; message: string } {
  let count = 0;
  let openCount = 0;
  let closeCount = 0;

  for (const char of expr) {
    if (char === '(') {
      count++;
      openCount++;
    } else if (char === ')') {
      count--;
      closeCount++;
      if (count < 0) {
        return {
          balanced: false,
          message: `Too many closing parentheses (${closeCount} close, ${openCount} open)`
        };
      }
    }
  }

  if (count > 0) {
    return {
      balanced: false,
      message: `Too many opening parentheses (${openCount} open, ${closeCount} close)`
    };
  }

  return {
    balanced: true,
    message: `Balanced (${openCount} pairs)`
  };
}

/**
 * Apply common math OCR corrections
 */
function applyMathCorrections(expr: string): { corrected: string; fixes: string[] } {
  let corrected = expr;
  const fixes: string[] = [];

  const corrections: Array<{ pattern: RegExp; replacement: string; description: string }> = [
    // Letter O -> Zero (in numeric context)
    {
      pattern: /(?<=\d)O(?=\d)/g,
      replacement: '0',
      description: 'Corrected letter O to zero'
    },
    // Lowercase L -> One (in numeric context)
    {
      pattern: /(?<=\d)l(?=\d)/g,
      replacement: '1',
      description: 'Corrected lowercase L to one'
    },
    // Uppercase I -> One (in numeric context)
    {
      pattern: /(?<=\d)I(?=\d)/g,
      replacement: '1',
      description: 'Corrected uppercase I to one'
    },
    // Letter S -> Five (in numeric context)
    {
      pattern: /(?<=\d)S(?=\d)/g,
      replacement: '5',
      description: 'Corrected letter S to five'
    },
    // Division symbol -> Slash
    {
      pattern: /÷/g,
      replacement: '/',
      description: 'Converted division symbol to slash'
    },
    // Multiplication symbol -> Asterisk
    {
      pattern: /×/g,
      replacement: '*',
      description: 'Converted multiplication symbol to asterisk'
    },
    // Whitespace around operators (normalize)
    {
      pattern: /\s*([\+\-\*\/])\s*/g,
      replacement: '$1',
      description: 'Normalized spacing around operators'
    }
  ];

  for (const { pattern, replacement, description } of corrections) {
    const before = corrected;
    corrected = corrected.replace(pattern, replacement);
    if (before !== corrected) {
      fixes.push(description);
    }
  }

  return { corrected, fixes };
}

/**
 * Detect common OCR errors specific to math
 */
export function detectMathErrors(text: string): OCRError[] {
  const errors: OCRError[] = [];

  // Check for letter O vs zero
  const letterOPattern = /(?<=\d)O(?=\d)/g;
  const letterOMatches = Array.from(text.matchAll(letterOPattern));
  letterOMatches.forEach(match => {
    errors.push({
      type: 'substitution',
      original: 'O',
      corrected: '0',
      confidence: 0.9,
      position: match.index
    });
  });

  // Check for lowercase L vs one
  const lowerLPattern = /(?<=\d)l(?=\d)/g;
  const lowerLMatches = Array.from(text.matchAll(lowerLPattern));
  lowerLMatches.forEach(match => {
    errors.push({
      type: 'substitution',
      original: 'l',
      corrected: '1',
      confidence: 0.85,
      position: match.index
    });
  });

  // Check for uppercase I vs one
  const upperIPattern = /(?<=\d)I(?=\d)/g;
  const upperIMatches = Array.from(text.matchAll(upperIPattern));
  upperIMatches.forEach(match => {
    errors.push({
      type: 'substitution',
      original: 'I',
      corrected: '1',
      confidence: 0.85,
      position: match.index
    });
  });

  return errors;
}

/**
 * Evaluate simple mathematical expression (for validation, not computation)
 */
export function canEvaluateMath(expr: string): boolean {
  try {
    // Remove whitespace
    const cleaned = expr.replace(/\s/g, '');

    // Check if expression contains only valid math characters
    const validChars = /^[\d\+\-\*\/\(\)\.]+$/;
    if (!validChars.test(cleaned)) {
      return false;
    }

    // Try to evaluate (using Function constructor as safe eval alternative)
    // Note: In production, use a proper math parser library like mathjs
    const result = Function(`'use strict'; return (${cleaned})`)();

    return typeof result === 'number' && !isNaN(result);
  } catch {
    return false;
  }
}
