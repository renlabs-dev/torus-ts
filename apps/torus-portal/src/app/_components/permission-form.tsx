"use client";

/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/consistent-type-imports */

import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@torus-ts/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@torus-ts/ui/components/card";
import {
  Form,
  FormControl,
  FormDescription,
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@torus-ts/ui/components/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@torus-ts/ui/components/accordion";
import { useToast } from "@torus-ts/ui/hooks/use-toast";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import * as z from "zod";
import { CompOp } from "../../utils/dsl";

// Define schema for the permission form
const numExprSchema: z.ZodType<any> = z.lazy(() =>
  z.discriminatedUnion("type", [
    z.object({
      type: z.literal("UIntLiteral"),
      value: z.string().min(1, "Value is required"),
    }),
    z.object({
      type: z.literal("BlockNumber"),
    }),
    z.object({
      type: z.literal("StakeOf"),
      account: z.string().min(1, "Account is required"),
    }),
    z.object({
      type: z.literal("Add"),
      left: numExprSchema,
      right: numExprSchema,
    }),
    z.object({
      type: z.literal("Sub"),
      left: numExprSchema,
      right: numExprSchema,
    }),
    z.object({
      type: z.literal("WeightSet"),
      from: z.string().min(1, "From account is required"),
      to: z.string().min(1, "To account is required"),
    }),
    z.object({
      type: z.literal("WeightPowerFrom"),
      from: z.string().min(1, "From account is required"),
      to: z.string().min(1, "To account is required"),
    }),
  ]),
);

const baseConstraintSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("MaxDelegationDepth"),
    depth: numExprSchema,
  }),
  z.object({
    type: z.literal("PermissionExists"),
    pid: z.string().min(1, "Permission ID is required"),
  }),
  z.object({
    type: z.literal("PermissionEnabled"),
    pid: z.string().min(1, "Permission ID is required"),
  }),
  z.object({
    type: z.literal("RateLimit"),
    maxOperations: numExprSchema,
    period: numExprSchema,
  }),
  z.object({
    type: z.literal("InactiveUnlessRedelegated"),
  }),
]);

const boolExprSchema: z.ZodType<any> = z.lazy(() =>
  z.discriminatedUnion("type", [
    z.object({
      type: z.literal("Not"),
      body: boolExprSchema,
    }),
    z.object({
      type: z.literal("And"),
      left: boolExprSchema,
      right: boolExprSchema,
    }),
    z.object({
      type: z.literal("Or"),
      left: boolExprSchema,
      right: boolExprSchema,
    }),
    z.object({
      type: z.literal("CompExpr"),
      op: z.nativeEnum(CompOp),
      left: numExprSchema,
      right: numExprSchema,
    }),
    z.object({
      type: z.literal("Base"),
      body: baseConstraintSchema,
    }),
  ]),
);

const formSchema = z.object({
  permId: z.string().min(1, "Permission ID is required"),
  body: boolExprSchema,
});

type FormSchema = z.infer<typeof formSchema>;

// Helper component for rendering NumExpr fields
function NumExprField({
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
                <Input placeholder="Enter a number value" {...field} />
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
                <Input placeholder="Enter account address" {...field} />
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
                  <Input placeholder="Enter from account address" {...field} />
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
                  <Input placeholder="Enter to account address" {...field} />
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

// Helper component for rendering BaseConstraint fields
function BaseConstraintField({
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
  // Watch the constraint type
  const constraintType = useWatch({
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
            <FormLabel>Constraint Type</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select constraint type" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="MaxDelegationDepth">
                  Max Delegation Depth
                </SelectItem>
                <SelectItem value="PermissionExists">
                  Permission Exists
                </SelectItem>
                <SelectItem value="PermissionEnabled">
                  Permission Enabled
                </SelectItem>
                <SelectItem value="RateLimit">Rate Limit</SelectItem>
                <SelectItem value="InactiveUnlessRedelegated">
                  Inactive Unless Redelegated
                </SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Render fields based on constraint type */}
      {constraintType === "MaxDelegationDepth" && (
        <div className="pl-4 border-l-2 border-gray-300">
          <FormLabel>Depth</FormLabel>
          <NumExprField control={control} path={`${path}.depth`} />
        </div>
      )}

      {(constraintType === "PermissionExists" ||
        constraintType === "PermissionEnabled") && (
        <FormField
          control={control}
          name={`${path}.pid` as any}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Permission ID</FormLabel>
              <FormControl>
                <Input placeholder="Enter permission ID" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      {constraintType === "RateLimit" && (
        <>
          <div className="pl-4 border-l-2 border-gray-300">
            <FormLabel>Max Operations</FormLabel>
            <NumExprField control={control} path={`${path}.maxOperations`} />
          </div>
          <div className="pl-4 border-l-2 border-gray-300">
            <FormLabel>Period</FormLabel>
            <NumExprField control={control} path={`${path}.period`} />
          </div>
        </>
      )}

      {showDelete && (
        <Button
          variant="destructive"
          size="sm"
          onClick={onDelete}
          type="button"
        >
          Remove Constraint
        </Button>
      )}
    </div>
  );
}

// Helper component for rendering BoolExpr fields
function BoolExprField({
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
                    <SelectItem value="Gt">Greater than (&gt;)</SelectItem>
                    <SelectItem value="Lt">Less than (&lt;)</SelectItem>
                    <SelectItem value="Gte">
                      Greater than or equal (&gt;=)
                    </SelectItem>
                    <SelectItem value="Lte">
                      Less than or equal (&lt;=)
                    </SelectItem>
                    <SelectItem value="Eq">Equal (=)</SelectItem>
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

// Main Permission Form component
export function PermissionForm() {
  const { toast } = useToast();
  const [permissionData, setPermissionData] = useState<string>("");
  const [activeTab, setActiveTab] = useState<string>("builder");

  // Initialize form with default values
  const form = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      permId: "",
      body: {
        type: "Base",
        body: {
          type: "InactiveUnlessRedelegated",
        },
      },
    },
  });

  // Handle form submission
  function onSubmit(data: FormSchema) {
    // Convert form data to match DSL structure
    const convertedData = {
      permId: data.permId,
      // body: convertBoolExpr(data.body),
      body: data.body,
    };

    // Display the result
    setPermissionData(JSON.stringify(convertedData, null, 2));
    toast({
      title: "Permission Created",
      description: "Your permission has been created successfully",
    });

    // Switch to JSON tab to show the result
    setActiveTab("json");
  }

  // Helper functions to convert form data to match DSL structure
  function convertNumExpr(
    expr: z.infer<typeof numExprSchema>,
  ): import("../../utils/dsl").NumExpr {
    switch (expr.type) {
      case "UIntLiteral":
        return {
          $: "UIntLiteral",
          value: BigInt(expr.value),
        };
      case "BlockNumber":
        return { $: "BlockNumber" };
      case "StakeOf":
        return { $: "StakeOf", account: expr.account };
      case "Add":
        return {
          $: "Add",
          left: convertNumExpr(expr.left),
          right: convertNumExpr(expr.right),
        };
      case "Sub":
        return {
          $: "Sub",
          left: convertNumExpr(expr.left),
          right: convertNumExpr(expr.right),
        };
      case "WeightSet":
        return {
          $: "WeightSet",
          from: expr.from,
          to: expr.to,
        };
      case "WeightPowerFrom":
        return {
          $: "WeightPowerFrom",
          from: expr.from,
          to: expr.to,
        };
      default:
        throw new Error(
          `Unknown numeric expression type: ${(expr as { type: string }).type}`,
        );
    }
  }

  function convertBaseConstraint(
    constraint: z.infer<typeof baseConstraintSchema>,
  ): import("../../utils/dsl").BaseConstraint {
    switch (constraint.type) {
      case "MaxDelegationDepth":
        return {
          $: "MaxDelegationDepth",
          depth: convertNumExpr(constraint.depth),
        };
      case "PermissionExists":
        return { $: "PermissionExists", pid: constraint.pid };
      case "PermissionEnabled":
        return { $: "PermissionEnabled", pid: constraint.pid };
      case "RateLimit":
        return {
          $: "RateLimit",
          maxOperations: convertNumExpr(constraint.maxOperations),
          period: convertNumExpr(constraint.period),
        };
      case "InactiveUnlessRedelegated":
        return { $: "InactiveUnlessRedelegated" };
      default:
        throw new Error(
          `Unknown base constraint type: ${(constraint as { type: string }).type}`,
        );
    }
  }

  function convertBoolExpr(
    expr: z.infer<typeof boolExprSchema>,
  ): import("../../utils/dsl").BoolExpr {
    switch (expr.type) {
      case "Not":
        return { $: "Not", body: convertBoolExpr(expr.body) };
      case "And":
        return {
          $: "And",
          left: convertBoolExpr(expr.left),
          right: convertBoolExpr(expr.right),
        };
      case "Or":
        return {
          $: "Or",
          left: convertBoolExpr(expr.left),
          right: convertBoolExpr(expr.right),
        };
      case "CompExpr":
        return {
          $: "CompExpr",
          op: expr.op,
          left: convertNumExpr(expr.left),
          right: convertNumExpr(expr.right),
        };
      case "Base":
        return { $: "Base", body: convertBaseConstraint(expr.body) };
      default:
        throw new Error(
          `Unknown boolean expression type: ${(expr as { type: string }).type}`,
        );
    }
  }

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
    <Card className="w-full max-w-6xl mx-auto">
      <CardHeader>
        <CardTitle>Permission Builder</CardTitle>
        <CardDescription>
          Build complex permission constraints for Torus
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="builder">Builder</TabsTrigger>
            <TabsTrigger value="json">JSON Output</TabsTrigger>
          </TabsList>
          <TabsContent value="builder">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
                <FormField
                  control={form.control}
                  name="permId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Permission ID</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter permission ID" {...field} />
                      </FormControl>
                      <FormDescription>
                        Unique identifier for this permission
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Accordion type="single" collapsible defaultValue="body">
                  <AccordionItem value="body">
                    <AccordionTrigger>Permission Constraint</AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-4">
                        <BoolExprField control={form.control} path="body" />
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>

                <div className="flex justify-between">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={loadExampleConstraint}
                  >
                    Load Example
                  </Button>
                  <Button type="submit">Create Permission</Button>
                </div>
              </form>
            </Form>
          </TabsContent>
          <TabsContent value="json">
            <div className="bg-gray-800 text-gray-100 p-4 rounded-md overflow-auto">
              <pre className="whitespace-pre-wrap">{permissionData}</pre>
            </div>
            <div className="mt-4 flex justify-end">
              <Button
                variant="outline"
                onClick={async () => {
                  await navigator.clipboard.writeText(permissionData);
                  toast({
                    title: "Copied to clipboard",
                    description: "JSON data has been copied to clipboard",
                  });
                }}
              >
                Copy to Clipboard
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={() => form.reset()}>
          Reset Form
        </Button>
        <Button onClick={() => form.handleSubmit(onSubmit)()}>Submit</Button>
      </CardFooter>
    </Card>
  );
}
