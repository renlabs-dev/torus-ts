export enum ValidationErrorType {
  INSUFFICIENT_FUNDS = "insufficient_funds",
  GAS_ESTIMATION = "gas_estimation",
  BASE_ETH_INSUFFICIENT = "base_eth_insufficient",
  TOKEN_ERROR = "token_error",
  ACCOUNT_ERROR = "account_error",
  VALIDATION_ERROR = "validation_error",
}

export enum ValidationField {
  FORM = "form",
  AMOUNT = "amount",
  RECIPIENT = "recipient",
  TOKEN_INDEX = "tokenIndex",
  ORIGIN = "origin",
  DESTINATION = "destination",
}

export interface ValidationError {
  form?: string;
  amount?: string;
  recipient?: string;
  tokenIndex?: string;
  origin?: string;
  destination?: string;
  details?: string;
  errorType?: ValidationErrorType;
}

export interface ToastConfig {
  title: string;
  description: string;
  variant: "destructive";
}

export type ValidationResult = ValidationError | Record<string, unknown>;

export interface FormValidationContext {
  errors: ValidationError | Record<string, unknown> | undefined;
  isReview: boolean;
  resetForm: () => void;
  isValidating: boolean;
  setIsReview: (value: boolean) => void;
}
