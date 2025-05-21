"use client";

import type { ReactNode } from "react";

interface FieldWrapperProps {
  children: ReactNode;
  className?: string;
}

export function FieldWrapper({ children, className = "" }: FieldWrapperProps) {
  return (
    <div className={`space-y-4 border p-4 rounded-md ${className}`}>
      {children}
    </div>
  );
}
