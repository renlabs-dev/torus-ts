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
import type { useForm } from "react-hook-form";
import { useWatch, Controller } from "react-hook-form";
import type { FormSchema } from "./permission-form-schemas";
import { CompOp } from "../../../utils/dsl";
import { makeDynamicFieldPath } from "./permission-form-utils";
import { PermissionFormFieldNumber } from "./permission-form-field-number";
import { PermissionFormFieldBase } from "./permission-form-field-base";
type BoolExprType = "Not" | "And" | "Or" | "CompExpr" | "Base";
export function PermissionFormFieldBoolean({
  control,
  path,
}: {
  control: ReturnType<typeof useForm<FormSchema>>["control"];
  path: string;
  onDelete?: () => void;
  showDelete?: boolean;
}) {
  // Watch the expression type
  const exprType = useWatch({
    control,
    name: makeDynamicFieldPath<FormSchema>(`${path}.type`),
  }) as BoolExprType | undefined;

  return (
    <div className="space-y-4 border p-4 rounded-md">
      <Controller
        control={control}
        name={makeDynamicFieldPath<FormSchema>(`${path}.type`)}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Expression Type</FormLabel>
            <Select
              onValueChange={field.onChange}
              value={typeof field.value === "string" ? field.value : ""}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select expression type" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="Not">Not</SelectItem>
                <SelectItem value="And">And</SelectItem>
                <SelectItem value="Or">Or</SelectItem>
                <SelectItem value="CompExpr">Comparison</SelectItem>
                <SelectItem value="Base">Base Constraint</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Render fields based on expression type */}
      {exprType === "Not" && (
        <div className="pl-4 border-l-2 border-gray-300">
          <FormLabel>Body</FormLabel>
          <PermissionFormFieldBoolean control={control} path={`${path}.body`} />
        </div>
      )}

      {(exprType === "And" || exprType === "Or") && (
        <>
          <div className="pl-4 border-l-2 border-gray-300">
            <FormLabel>Left Expression</FormLabel>
            <PermissionFormFieldBoolean
              control={control}
              path={`${path}.left`}
            />
          </div>
          <div className="pl-4 border-l-2 border-gray-300">
            <FormLabel>Right Expression</FormLabel>
            <PermissionFormFieldBoolean
              control={control}
              path={`${path}.right`}
            />
          </div>
        </>
      )}

      {exprType === "CompExpr" && (
        <>
          <Controller
            control={control}
            name={makeDynamicFieldPath<FormSchema>(`${path}.op`)}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Operator</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={typeof field.value === "string" ? field.value : ""}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select operator" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value={CompOp.Gt}>
                      Greater than (&gt;)
                    </SelectItem>
                    <SelectItem value={CompOp.Lt}>Less than (&lt;)</SelectItem>
                    <SelectItem value={CompOp.Gte}>
                      Greater than or equal (&gt;=)
                    </SelectItem>
                    <SelectItem value={CompOp.Lte}>
                      Less than or equal (&lt;=)
                    </SelectItem>
                    <SelectItem value={CompOp.Eq}>Equal (=)</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
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

      {exprType === "Base" && (
        <div className="pl-4 border-l-2 border-gray-300">
          <FormLabel>Base Constraint</FormLabel>
          <PermissionFormFieldBase control={control} path={`${path}.body`} />
        </div>
      )}
    </div>
  );
}
