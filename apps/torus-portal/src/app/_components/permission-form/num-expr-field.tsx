"use client";

import { Button } from "@torus-ts/ui/components/button";
import {
  FormControl,
  FormField,
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
import { useWatch } from "react-hook-form";
import type { FormSchema } from "./schemas";

export function NumExprField({
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
  const { toast } = useToast();
  // Watch the expression type
  const exprType = useWatch({
    control,
    name: `${path}.type` as any,
  });

  return (
    <div className="space-y-4 border p-4 rounded-md">
      <FormField
        control={control}
        name={`${path}.type` as any}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Expression Type</FormLabel>
            <Select
              onValueChange={(value) => {
                field.onChange(value);
                field.onBlur();
                // Reset fields when type changes
                toast({
                  title: "Expression type changed",
                  description: `Changed to ${value}`,
                });
              }}
              defaultValue={field.value}
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
        <FormField
          control={control}
          name={`${path}.value` as any}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Value</FormLabel>
              <FormControl>
                <Input
                  placeholder="Enter a number value"
                  {...field}
                  onBlur={(e) => {
                    field.onBlur();
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      {exprType === "StakeOf" && (
        <FormField
          control={control}
          name={`${path}.account` as any}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Account</FormLabel>
              <FormControl>
                <Input
                  placeholder="Enter account address"
                  {...field}
                  onBlur={(e) => {
                    field.onBlur();
                  }}
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
            <NumExprField control={control} path={`${path}.left`} />
          </div>
          <div className="pl-4 border-l-2 border-gray-300">
            <FormLabel>Right Expression</FormLabel>
            <NumExprField control={control} path={`${path}.right`} />
          </div>
        </>
      )}

      {(exprType === "WeightSet" || exprType === "WeightPowerFrom") && (
        <>
          <FormField
            control={control}
            name={`${path}.from` as any}
            render={({ field }) => (
              <FormItem>
                <FormLabel>From Account</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter from account address"
                    {...field}
                    onBlur={(e) => {
                      field.onBlur();
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name={`${path}.to` as any}
            render={({ field }) => (
              <FormItem>
                <FormLabel>To Account</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter to account address"
                    {...field}
                    onBlur={(e) => {
                      field.onBlur();
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </>
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
