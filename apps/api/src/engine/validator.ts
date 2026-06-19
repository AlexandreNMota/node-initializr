import { ConfigSchema, type GenerateConfig, type ValidationError } from '@node-initializr/shared';

import { COMPATIBILITY_ERROR_MESSAGES, VALIDATOR_MESSAGES } from './validator.messages.js';

type ValidationSuccess = {
  success: true;
  data: GenerateConfig;
  error?: never;
};

type ValidationFailure = {
  success: false;
  data?: never;
  error: ValidationError;
};

type ValidationResult = ValidationSuccess | ValidationFailure;

type ValidationIssue = {
  path: PropertyKey[];
  message: string;
};

export function validate(payload: unknown): ValidationResult {
  const result = ConfigSchema.safeParse(payload);

  if (result.success) {
    return {
      success: true,
      data: result.data,
    };
  }

  return {
    success: false,
    error: formatValidationError(result.error.issues),
  };
}

function formatValidationError(issues: ValidationIssue[]): ValidationError {
  const details = issues.map((issue) => ({
    field: getIssueField(issue),
    message: issue.message,
  }));

  const firstIssue = issues[0];

  return {
    code: hasCompatibilityError(issues) ? 'INVALID_COMBINATION' : 'VALIDATION_ERROR',
    message: firstIssue?.message || VALIDATOR_MESSAGES.invalidPayload,
    field: firstIssue ? getIssueField(firstIssue) : 'root',
    details,
  };
}

function hasCompatibilityError(issues: ValidationIssue[]): boolean {
  return issues.some((issue) => COMPATIBILITY_ERROR_MESSAGES.has(issue.message));
}

function getIssueField(issue: ValidationIssue): string {
  return issue.path.join('.') || 'root';
}
