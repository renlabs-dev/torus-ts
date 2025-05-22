"use client";

import {
  FormControl,
  FormItem,
  FormLabel,
  FormMessage,
} from "@torus-ts/ui/components/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@torus-ts/ui/components/select";
import { useToast } from "@torus-ts/ui/hooks/use-toast";
import { Controller } from "react-hook-form";
import type { Control } from "react-hook-form";
import type { FormSchema } from "../permission-form-schemas";
import { makeDynamicFieldPath } from "../permission-form-utils";
import type { ReactNode } from "react";

interface SelectOption {
  value: string;
  label: string;
  icon?: ReactNode;
}

interface SelectFieldProps {
  control: Control<FormSchema>;
  path: string;
  label: string;
  placeholder: string;
  options: SelectOption[];
  showToast?: boolean;
  renderOption?: (option: SelectOption) => ReactNode;
}

export function SelectField({
  control,
  path,
  label,
  placeholder,
  options,
  showToast = false,
  renderOption,
}: SelectFieldProps) {
  const { toast } = useToast();

  // Find the selected option to display its icon if available
  const getSelectedOption = (value: string) => {
    return options.find((option) => option.value === value);
  };

  return (
    <Controller
      control={control}
      name={makeDynamicFieldPath<FormSchema>(`${path}`)}
      render={({ field }) => {
        const selectedOption = getSelectedOption(field.value as string);

        return (
          <FormItem>
            <FormLabel className="font-medium">{label}</FormLabel>
            <Select
              onValueChange={(value) => {
                field.onChange(value);
                if (showToast) {
                  toast({
                    title: `${label} changed`,
                    description: `Changed to ${value}`,
                  });
                }
              }}
              value={typeof field.value === "string" ? field.value : ""}
            >
              <FormControl>
                <SelectTrigger className="min-h-[2.5rem]">
                  <SelectValue placeholder={placeholder}>
                    {selectedOption && selectedOption.icon && (
                      <div className="flex items-center gap-2">
                        {selectedOption.icon}
                        {selectedOption.label}
                      </div>
                    )}
                  </SelectValue>
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {options.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {renderOption ? renderOption(option) : option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        );
      }}
    />
  );
}
