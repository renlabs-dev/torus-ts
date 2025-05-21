"use client";

import { FormLabel } from "@torus-ts/ui/components/form";
import type { ReactNode } from "react";

interface NestedFieldProps {
  label: string;
  children: ReactNode;
}

export function NestedField({ label, children }: NestedFieldProps) {
  return (
    <div className="pl-4 border-l-2 border-gray-300">
      <FormLabel>{label}</FormLabel>
      {children}
    </div>
  );
}
