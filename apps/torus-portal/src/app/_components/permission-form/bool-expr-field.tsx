"use client";

import { Button } from "@torus-ts/ui/components/button";
import {
  FormControl,
  FormField,
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
import { useWatch } from "react-hook-form";
import type { FormSchema } from "./schemas";
import { NumExprField } from "./num-expr-field";
import { BaseConstraintField } from "./base-constraint-field";
import { CompOp } from "../../../utils/dsl";

export function BoolExprField({
  control,
  path,
  onDelete,
  showDelete = false,
}: {
  control: ReturnType<typeof useForm<FormSchema>>["control"];
  path: string;
  onDelete?: () => void;
  showDelete?: boolean;
}) {
  // Watch the expression type
  const exprType = useWatch({
    control,
    name: `${path}.type`,
  });

  return (
    <div className="space-y-4 border p-4 rounded-md">
      <FormField
        control={control}
        name={`${path}.type` as any}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Expression Type</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
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
          <BoolExprField control={control} path={`${path}.body`} />
        </div>
      )}

      {(exprType === "And" || exprType === "Or") && (
        <>
          <div className="pl-4 border-l-2 border-gray-300">
            <FormLabel>Left Expression</FormLabel>
            <BoolExprField control={control} path={`${path}.left`} />
          </div>
          <div className="pl-4 border-l-2 border-gray-300">
            <FormLabel>Right Expression</FormLabel>
            <BoolExprField control={control} path={`${path}.right`} />
          </div>
        </>
      )}

      {exprType === "CompExpr" && (
        <>
          <FormField
            control={control}
            name={`${path}.op` as any}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Operator</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
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
            <NumExprField control={control} path={`${path}.left`} />
          </div>
          <div className="pl-4 border-l-2 border-gray-300">
            <FormLabel>Right Expression</FormLabel>
            <NumExprField control={control} path={`${path}.right`} />
          </div>
        </>
      )}

      {exprType === "Base" && (
        <div className="pl-4 border-l-2 border-gray-300">
          <FormLabel>Base Constraint</FormLabel>
          <BaseConstraintField control={control} path={`${path}.body`} />
        </div>
      )}

      {showDelete && (
        <Button
          variant="destructive"
          size="sm"
          onClick={onDelete}
          type="button"
        >
          Remove Expression
        </Button>
      )}
    </div>
  );
}
