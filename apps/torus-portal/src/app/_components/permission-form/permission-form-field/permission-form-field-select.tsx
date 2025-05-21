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

interface SelectOption {
  value: string;
  label: string;
}

interface SelectFieldProps {
  control: Control<FormSchema>;
  path: string;
  label: string;
  placeholder: string;
  options: SelectOption[];
  showToast?: boolean;
}

export function SelectField({
  control,
  path,
  label,
  placeholder,
  options,
  showToast = false,
}: SelectFieldProps) {
  const { toast } = useToast();

  return (
    <Controller
      control={control}
      name={makeDynamicFieldPath<FormSchema>(`${path}`)}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
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
              <SelectTrigger>
                <SelectValue placeholder={placeholder} />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
