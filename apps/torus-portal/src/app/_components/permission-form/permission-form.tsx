"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@torus-ts/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@torus-ts/ui/components/card";
import { Form } from "@torus-ts/ui/components/form";
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
    defaultValues: {
      body: {
        type: "Base",
        body: {
          type: "InactiveUnlessRedelegated",
        },
      },
    },
  });

  function onSubmit(data: FormSchema) {
    // TODO: fix convertBoolExpr(data.body) function
    console.log(data.body);
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
            <BoolExprField control={form.control} path="body" />

            <div className="flex justify-between">
              <ExampleConstraintButton form={form} />
              <Button type="submit">Create Permission</Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
