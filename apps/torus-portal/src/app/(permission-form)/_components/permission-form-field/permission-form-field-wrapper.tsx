"use client";

import type { ReactNode } from "react";

interface FieldWrapperProps {
  children: ReactNode;
  className?: string;
}

export function FieldWrapper({ children, className = "" }: FieldWrapperProps) {
  return (
    <div
      className={` space-y-4 border p-4 rounded-md shadow-md bg-background/80 backdrop-blur-sm
        min-w-[320px] transition-all hover:shadow-lg ${className} `}
    >
      {children}
    </div>
  );
}
