"use client";

import type { ReactNode } from "react";
import { createContext, useContext } from "react";
import type { UseFormReturn } from "react-hook-form";
import type { TransferFormValues } from "~/utils/types";

const TransferFormContext =
  createContext<UseFormReturn<TransferFormValues> | null>(null);

export function TransferFormProvider({
  children,
  form,
}: {
  children: ReactNode;
  form: UseFormReturn<TransferFormValues>;
}) {
  return (
    <TransferFormContext.Provider value={form}>
      {children}
    </TransferFormContext.Provider>
  );
}

export function useTransferForm() {
  const context = useContext(TransferFormContext);
  if (!context) {
    throw new Error("useTransferForm must be used within TransferFormProvider");
  }
  return context;
}

// Hook to get form values and methods
export function useTransferFormContext() {
  const context = useContext(TransferFormContext);
  if (!context) {
    throw new Error(
      "useTransferFormContext must be used within TransferFormProvider",
    );
  }
  return context;
}
