"use client";

import { FormLabel } from "@torus-ts/ui/components/form";
import type { ReactNode } from "react";
import { ArrowDown } from "lucide-react";

interface NestedFieldProps {
  label: string;
  children: ReactNode;
}

export function NestedField({ label, children }: NestedFieldProps) {
  return (
    <div className="relative mt-6 mb-2">
      <div className="flex items-center mb-2">
        <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center mr-2">
          <ArrowDown className="h-4 w-4 text-primary" />
        </div>
        <FormLabel className="text-primary font-medium">{label}</FormLabel>
      </div>
      <div className="pl-4 ml-3 border-l-2 border-primary/30 pt-2">
        {children}
      </div>
    </div>
  );
}
