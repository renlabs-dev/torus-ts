"use client";

import type { useForm } from "react-hook-form";
import { useWatch } from "react-hook-form";
import type { FormSchema } from "../permission-form-schemas";
import { CompOp } from "../../../../utils/dsl";
import { makeDynamicFieldPath } from "../permission-form-utils";
import { PermissionFormFieldNumber } from "./permission-form-field-number";
import { PermissionFormFieldBase } from "./permission-form-field-base";
import { NestedField } from "./permission-form-field-nested";
import { FieldWrapper } from "./permission-form-field-wrapper";
import { SelectField } from "./permission-form-field-select";

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

  const expressionOptions = [
    { value: "Not", label: "Not" },
    { value: "And", label: "And" },
    { value: "Or", label: "Or" },
    { value: "CompExpr", label: "Comparison" },
    { value: "Base", label: "Base Constraint" },
  ];

  const operatorOptions = [
    { value: CompOp.Gt, label: "Greater than (>)" },
    { value: CompOp.Lt, label: "Less than (<)" },
    { value: CompOp.Gte, label: "Greater than or equal (>=)" },
    { value: CompOp.Lte, label: "Less than or equal (<=)" },
    { value: CompOp.Eq, label: "Equal (=)" },
  ];

  return (
    <FieldWrapper>
      <SelectField
        control={control}
        path={`${path}.type`}
        label="Expression Type"
        placeholder="Select expression type"
        options={expressionOptions}
      />

      {/* Render fields based on expression type */}
      {exprType === "Not" && (
        <NestedField label="Body">
          <PermissionFormFieldBoolean control={control} path={`${path}.body`} />
        </NestedField>
      )}

      {(exprType === "And" || exprType === "Or") && (
        <div className="flex gap-4">
          <NestedField label="Left Expression">
            <PermissionFormFieldBoolean
              control={control}
              path={`${path}.left`}
            />
          </NestedField>
          <NestedField label="Right Expression">
            <PermissionFormFieldBoolean
              control={control}
              path={`${path}.right`}
            />
          </NestedField>
        </div>
      )}

      {exprType === "CompExpr" && (
        <>
          <SelectField
            control={control}
            path={`${path}.op`}
            label="Operator"
            placeholder="Select operator"
            options={operatorOptions}
          />
          <NestedField label="Left Expression">
            <PermissionFormFieldNumber
              control={control}
              path={`${path}.left`}
            />
          </NestedField>
          <NestedField label="Right Expression">
            <PermissionFormFieldNumber
              control={control}
              path={`${path}.right`}
            />
          </NestedField>
        </>
      )}

      {exprType === "Base" && (
        <NestedField label="Base Constraint">
          <PermissionFormFieldBase control={control} path={`${path}.body`} />
        </NestedField>
      )}
    </FieldWrapper>
  );
}
