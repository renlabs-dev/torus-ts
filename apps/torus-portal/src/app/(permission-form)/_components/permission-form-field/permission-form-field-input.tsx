"use client";

import {
  FormControl,
  FormItem,
  FormLabel,
  FormMessage,
} from "@torus-ts/ui/components/form";
import { Input } from "@torus-ts/ui/components/input";
import { Controller } from "react-hook-form";
import type { Control } from "react-hook-form";
import type { FormSchema } from "../permission-form-schemas";
import { makeDynamicFieldPath } from "../permission-form-utils";

interface InputFieldProps {
  control: Control<FormSchema>;
  path: string;
  label: string;
  placeholder: string;
}

export function InputField({
  control,
  path,
  label,
  placeholder,
}: InputFieldProps) {
  return (
    <Controller
      control={control}
      name={makeDynamicFieldPath<FormSchema>(`${path}`)}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Input
              placeholder={placeholder}
              value={typeof field.value === "string" ? field.value : ""}
              onChange={field.onChange}
              onBlur={field.onBlur}
              name={field.name}
              ref={field.ref}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
