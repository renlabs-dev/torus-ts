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
import {
  Ban,
  CircleX,
  CircleCheck,
  ScaleIcon,
  Workflow,
  Blocks,
  Bot,
} from "lucide-react";

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
    { value: "Not", label: "Not", icon: <CircleX className="h-4 w-4 mr-2" /> },
    {
      value: "And",
      label: "And",
      icon: <CircleCheck className="h-4 w-4 mr-2" />,
    },
    { value: "Or", label: "Or", icon: <Workflow className="h-4 w-4 mr-2" /> },
    {
      value: "CompExpr",
      label: "Comparison",
      icon: <ScaleIcon className="h-4 w-4 mr-2" />,
    },
    {
      value: "Base",
      label: "Base Constraint",
      icon: <Blocks className="h-4 w-4 mr-2" />,
    },
  ];

  const operatorOptions = [
    { value: CompOp.Gt, label: "Greater than (>)" },
    { value: CompOp.Lt, label: "Less than (<)" },
    { value: CompOp.Gte, label: "Greater than or equal (>=)" },
    { value: CompOp.Lte, label: "Less than or equal (<=)" },
    { value: CompOp.Eq, label: "Equal (=)" },
  ];

  // Determine background color based on expression type
  const getNodeColor = () => {
    switch (exprType) {
      case "Not":
        return "border-red-300 bg-red-950/30";
      case "And":
        return "border-green-300 bg-green-950/30";
      case "Or":
        return "border-blue-300 bg-blue-950/30";
      case "CompExpr":
        return "border-purple-300 bg-purple-950/30";
      case "Base":
        return "border-amber-300 bg-amber-950/30";
      default:
        return "";
    }
  };

  // Get icon based on expression type
  const getNodeIcon = () => {
    switch (exprType) {
      case "Not":
        return <Ban className="h-5 w-5 text-red-600" />;
      case "And":
        return <CircleCheck className="h-5 w-5 text-green-600" />;
      case "Or":
        return <Workflow className="h-5 w-5 text-blue-600" />;
      case "CompExpr":
        return <ScaleIcon className="h-5 w-5 text-purple-600" />;
      case "Base":
        return <Blocks className="h-5 w-5 text-amber-600" />;
      default:
        return <Bot className="h-5 w-5" />;
    }
  };

  return (
    <FieldWrapper className={`${getNodeColor()} relative border-2`}>
      <div
        className="absolute -top-4 -left-4 h-8 w-8 rounded-full bg-background border-2 flex
          items-center justify-center shadow-sm"
      >
        {getNodeIcon()}
      </div>

      <SelectField
        control={control}
        path={`${path}.type`}
        label="Expression Type"
        placeholder="Select expression type"
        options={expressionOptions}
        renderOption={(option) => (
          <div className="flex items-center">
            {option.icon}
            {option.label}
          </div>
        )}
      />

      {/* Render fields based on expression type */}
      {exprType === "Not" && (
        <NestedField label="Body">
          <PermissionFormFieldBoolean control={control} path={`${path}.body`} />
        </NestedField>
      )}

      {(exprType === "And" || exprType === "Or") && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 w-full relative">
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 bg-primary/20 text-primary font-bold
              px-3 py-1 rounded-full text-xs z-10"
          >
            {exprType === "And" ? "AND" : "OR"}
          </div>
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
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
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
          </div>
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
