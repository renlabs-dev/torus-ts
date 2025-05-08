"use client";

import {
  FormControl,
  FormItem,
  FormLabel,
  FormMessage,
} from "@torus-ts/ui/components/form";
import { Input } from "@torus-ts/ui/components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@torus-ts/ui/components/select";
import { useToast } from "@torus-ts/ui/hooks/use-toast";
import type { useForm } from "react-hook-form";
import { useWatch, Controller } from "react-hook-form";
import type { FormSchema } from "./permission-form-schemas";
import { makeDynamicFieldPath } from "./permission-form-utils";
type NumExprType =
  | "UIntLiteral"
  | "BlockNumber"
  | "StakeOf"
  | "Add"
  | "Sub"
  | "WeightSet"
  | "WeightPowerFrom";

export function PermissionFormFieldNumber({
  control,
  path,
}: {
  control: ReturnType<typeof useForm<FormSchema>>["control"];
  path: string;
}) {
  const { toast } = useToast();

  const exprType = useWatch({
    control,
    name: makeDynamicFieldPath<FormSchema>(`${path}.type`),
  }) as NumExprType | undefined;

  return (
    <div className="space-y-4 border p-4 rounded-md">
      <Controller
        control={control}
        name={makeDynamicFieldPath<FormSchema>(`${path}.type`)}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Expression Type</FormLabel>
            <Select
              onValueChange={(value) => {
                field.onChange(value);
                // Reset fields when type changes
                toast({
                  title: "Expression type changed",
                  description: `Changed to ${value}`,
                });
              }}
              value={typeof field.value === "string" ? field.value : ""}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select expression type" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="UIntLiteral">Literal Value</SelectItem>
                <SelectItem value="BlockNumber">Block Number</SelectItem>
                <SelectItem value="StakeOf">Stake Of Account</SelectItem>
                <SelectItem value="Add">Addition</SelectItem>
                <SelectItem value="Sub">Subtraction</SelectItem>
                <SelectItem value="WeightSet">Weight Set</SelectItem>
                <SelectItem value="WeightPowerFrom">
                  Weight Power From
                </SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Render fields based on expression type */}
      {exprType === "UIntLiteral" && (
        <Controller
          control={control}
          name={makeDynamicFieldPath<FormSchema>(`${path}.value`)}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Value</FormLabel>
              <FormControl>
                <Input
                  placeholder="Enter a number value"
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
      )}

      {exprType === "StakeOf" && (
        <Controller
          control={control}
          name={makeDynamicFieldPath<FormSchema>(`${path}.account`)}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Account</FormLabel>
              <FormControl>
                <Input
                  placeholder="Enter account address"
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
      )}

      {(exprType === "Add" || exprType === "Sub") && (
        <>
          <div className="pl-4 border-l-2 border-gray-300">
            <FormLabel>Left Expression</FormLabel>
            <PermissionFormFieldNumber
              control={control}
              path={`${path}.left`}
            />
          </div>
          <div className="pl-4 border-l-2 border-gray-300">
            <FormLabel>Right Expression</FormLabel>
            <PermissionFormFieldNumber
              control={control}
              path={`${path}.right`}
            />
          </div>
        </>
      )}

      {(exprType === "WeightSet" || exprType === "WeightPowerFrom") && (
        <>
          <Controller
            control={control}
            name={makeDynamicFieldPath<FormSchema>(`${path}.from`)}
            render={({ field }) => (
              <FormItem>
                <FormLabel>From Account</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter from account address"
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
          <Controller
            control={control}
            name={makeDynamicFieldPath<FormSchema>(`${path}.to`)}
            render={({ field }) => (
              <FormItem>
                <FormLabel>To Account</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter to account address"
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
        </>
      )}
    </div>
  );
}
