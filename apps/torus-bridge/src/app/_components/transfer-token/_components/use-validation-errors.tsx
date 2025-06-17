"use client";

import { useToast } from "@torus-ts/ui/hooks/use-toast";
import { useEffect } from "react";

interface ValidationError {
  form?: string;
  amount?: string;
  details?: string;
  errorType?: 'insufficient_funds' | 'gas_estimation' | 'base_eth_insufficient' | 'token_error' | 'account_error' | 'validation_error';
}

export function useValidationErrors(errors: ValidationError | undefined) {
  const { toast } = useToast();

  useEffect(() => {
    if (!errors?.details || !errors.errorType) return;

    const toastConfig = getToastConfigForError(errors.errorType, errors.details);
    
    toast({
      ...toastConfig,
      duration: 8 * 1_000,
    });
  }, [errors, toast]);
}

function getToastConfigForError(errorType: ValidationError['errorType'], details: string) {
  switch (errorType) {
    case 'insufficient_funds':
      return {
        title: "Insufficient Balance",
        description: details,
        variant: "destructive" as const,
      };
    
    case 'gas_estimation':
      return {
        title: "Gas Estimation Failed",
        description: details,
        variant: "destructive" as const,
      };
    
    case 'base_eth_insufficient':
      return {
        title: "Insufficient ETH on Base",
        description: details,
        variant: "destructive" as const,
      };
    
    case 'token_error':
      return {
        title: "Token Configuration Error",
        description: details,
        variant: "destructive" as const,
      };
    
    case 'account_error':
      return {
        title: "Account Connection Error",
        description: details,
        variant: "destructive" as const,
      };
    
    case 'validation_error':
      return {
        title: "Validation Error",
        description: details,
        variant: "destructive" as const,
      };
    
    default:
      return {
        title: "Transfer Error",
        description: details,
        variant: "destructive" as const,
      };
  }
}