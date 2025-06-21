import { ValidationErrorType } from "~/types/validation";
import type {
  ValidationField,
  ValidationError,
  ToastConfig,
} from "~/types/validation";

export const VALIDATION_REGEX = {
  INSUFFICIENT_FUNDS: /insufficient.[funds|lamports]/i,
  EMPTY_ACCOUNT: /AccountNotFound/i,
  GAS_ESTIMATION: /gas.*(estimation|required)/i,
  BASE_ETH_INSUFFICIENT: /insufficient.*eth/i,
} as const;

export function createValidationError(
  type: ValidationErrorType,
  details: string,
  field?: ValidationField,
): ValidationError {
  const error: ValidationError = { details, errorType: type };
  if (field) {
    error[field] = "Error";
  }
  return error;
}

const ERROR_TITLES: Record<ValidationErrorType, string> = {
  [ValidationErrorType.INSUFFICIENT_FUNDS]: "Insufficient Balance",
  [ValidationErrorType.GAS_ESTIMATION]: "Gas Estimation Failed",
  [ValidationErrorType.BASE_ETH_INSUFFICIENT]: "Insufficient ETH on Base",
  [ValidationErrorType.TOKEN_ERROR]: "Token Configuration Error",
  [ValidationErrorType.ACCOUNT_ERROR]: "Account Connection Error",
  [ValidationErrorType.VALIDATION_ERROR]: "Validation Error",
} as const;

export function getToastConfigForError(
  errorType: ValidationErrorType,
  details: string,
): ToastConfig {
  return {
    title: ERROR_TITLES[errorType],
    description: details,
    variant: "destructive",
  };
}

export function isValidationError(obj: unknown): obj is ValidationError {
  return (
    typeof obj === "object" &&
    obj !== null &&
    "details" in obj &&
    "errorType" in obj
  );
}

export function validateRequiredField(
  value: string | undefined,
  fieldName: string,
): string | undefined {
  if (!value || value.trim() === "") {
    return `${fieldName} is required`;
  }
  return undefined;
}

export function validatePositiveNumber(
  value: string,
  fieldName: string,
): string | undefined {
  const number = parseFloat(value);
  if (isNaN(number)) {
    return `${fieldName} must be a valid number`;
  }
  if (number <= 0) {
    return `${fieldName} must be greater than 0`;
  }
  return undefined;
}

// Utility function to format error messages consistently
export function formatErrorMessage(
  baseMessage: string,
  details?: string,
  suggestion?: string,
): string {
  let message = baseMessage;
  if (details) {
    message += `: ${details}`;
  }
  if (suggestion) {
    message += `. ${suggestion}`;
  }
  return message;
}

// Utility function to create consistent validation error messages
export function createFieldValidationError(
  fieldName: string,
  issue: string,
  suggestion?: string,
): string {
  return formatErrorMessage(
    `${fieldName} validation failed`,
    issue,
    suggestion ?? `Please check your ${fieldName.toLowerCase()} and try again.`,
  );
}
