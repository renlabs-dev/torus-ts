import { Button } from "@torus-ts/ui/components/button";
import { useToast } from "@torus-ts/ui/hooks/use-toast";
import { CompOp } from "~/utils/dsl";
import type { UseFormReturn } from "react-hook-form";
import type { FormSchema } from "./schemas";

interface ExampleConstraintButtonProps {
  form: UseFormReturn<FormSchema>;
}

export function ExampleConstraintButton({
  form,
}: ExampleConstraintButtonProps) {
  const { toast } = useToast();

  function loadExampleConstraint() {
    form.reset({
      permId: "0x123",
      body: {
        type: "And",
        left: {
          type: "CompExpr",
          op: CompOp.Gte,
          left: {
            type: "StakeOf",
            account: "5D5F..EBnt",
          },
          right: {
            type: "UIntLiteral",
            value: "1000",
          },
        },
        right: {
          type: "Or",
          left: {
            type: "CompExpr",
            op: CompOp.Gte,
            left: {
              type: "WeightSet",
              from: "allocator2222",
              to: "5D5F..EBnt",
            },
            right: {
              type: "UIntLiteral",
              value: "0.3",
            },
          },
          right: {
            type: "And",
            left: {
              type: "Base",
              body: {
                type: "PermissionEnabled",
                pid: "42",
              },
            },
            right: {
              type: "CompExpr",
              op: CompOp.Gt,
              left: {
                type: "BlockNumber",
              },
              right: {
                type: "UIntLiteral",
                value: "2000000",
              },
            },
          },
        },
      },
    });
    toast({
      title: "Example Loaded",
      description: "Complex example constraint has been loaded",
    });
  }

  return (
    <Button type="button" variant="outline" onClick={loadExampleConstraint}>
      Load Example
    </Button>
  );
}
