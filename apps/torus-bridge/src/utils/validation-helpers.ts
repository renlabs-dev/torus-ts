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

export function getToastConfigForError(
  errorType: ValidationErrorType,
  details: string,
): ToastConfig {
  const configs: Record<
    ValidationErrorType,
    Omit<ToastConfig, "description">
  > = {
    [ValidationErrorType.INSUFFICIENT_FUNDS]: {
      title: "Insufficient Balance",
      variant: "destructive",
    },
    [ValidationErrorType.GAS_ESTIMATION]: {
      title: "Gas Estimation Failed",
      variant: "destructive",
    },
    [ValidationErrorType.BASE_ETH_INSUFFICIENT]: {
      title: "Insufficient ETH on Base",
      variant: "destructive",
    },
    [ValidationErrorType.TOKEN_ERROR]: {
      title: "Token Configuration Error",
      variant: "destructive",
    },
    [ValidationErrorType.ACCOUNT_ERROR]: {
      title: "Account Connection Error",
      variant: "destructive",
    },
    [ValidationErrorType.VALIDATION_ERROR]: {
      title: "Validation Error",
      variant: "destructive",
    },
  };

  return {
    ...configs[errorType],
    description: details,
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
