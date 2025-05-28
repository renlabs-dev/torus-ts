"use client";

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
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@torus-ts/ui/components/accordion";
import { useToast } from "@torus-ts/ui/hooks/use-toast";
import { useForm } from "react-hook-form";
import { formSchema } from "./schemas";
import type { FormSchema } from "./schemas";
import { BoolExprField } from "./bool-expr-field";
import { ExampleConstraintButton } from "./example-constraint-button";

export function PermissionForm() {
  const { toast } = useToast();

  const form = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
    mode: "onBlur",
    reValidateMode: "onChange",
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

  function onSubmit(data: FormSchema) {
    const convertedData = {
      permId: data.permId,
      // TODO: fix convertBoolExpr(data.body) function
      body: data.body,
    };
    console.log(convertedData);
    toast({
      title: "Permission Created",
      description: "Your permission has been created successfully",
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
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="permId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Permission ID</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter permission ID"
                      {...field}
                      onBlur={(e) => {
                        field.onBlur();
                      }}
                    />
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

            {/* Form-level error summary */}
            {Object.keys(form.formState.errors).length > 0 && (
              <div className="p-4 border border-red-200 bg-red-50 rounded-md">
                <h3 className="text-sm font-medium text-red-800 mb-2">
                  Please fix the following errors:
                </h3>
                <ul className="text-sm text-red-700 space-y-1">
                  {Object.entries(form.formState.errors)
                    .map(([key, error]) => {
                      if (error?.message) {
                        return (
                          <li key={key}>
                            • {key === "permId" ? "Permission ID" : key}:{" "}
                            {error.message}
                          </li>
                        );
                      }
                      // Handle nested errors
                      if (error && typeof error === "object") {
                        const flattenErrors = (
                          obj: any,
                          prefix = "",
                        ): string[] => {
                          const errors: string[] = [];
                          Object.entries(obj).forEach(([k, v]) => {
                            const path = prefix ? `${prefix}.${k}` : k;
                            if (v && typeof v === "object" && "message" in v) {
                              errors.push(`${path}: ${v.message}`);
                            } else if (v && typeof v === "object") {
                              errors.push(...flattenErrors(v, path));
                            }
                          });
                          return errors;
                        };
                        return flattenErrors(error).map((errorMsg, idx) => (
                          <li key={`${key}-${idx}`}>• {errorMsg}</li>
                        ));
                      }
                      return null;
                    })
                    .flat()
                    .filter(Boolean)}
                </ul>
              </div>
            )}

            <div className="flex justify-between">
              <ExampleConstraintButton form={form} />
              <Button
                type="submit"
                disabled={!form.formState.isValid && form.formState.isDirty}
              >
                Create Permission
              </Button>
            </div>
          </form>
        </Form>
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
