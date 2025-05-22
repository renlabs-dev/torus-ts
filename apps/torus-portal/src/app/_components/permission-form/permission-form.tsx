"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Form } from "@torus-ts/ui/components/form";

import { useToast } from "@torus-ts/ui/hooks/use-toast";
import { useForm, useWatch } from "react-hook-form";
import { formSchema } from "./permission-form-schemas";
import type { FormSchema } from "./permission-form-schemas";
import { ExampleConstraintButton } from "./permission-form-example-constraint-button";
import { PermissionFormFieldBoolean } from "./permission-form-field/permission-form-field-boolean";

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

  // Watch for form changes to update the flow visualizer
  const formData = useWatch({
    control: form.control,
  });

  console.log(formData);

  function onSubmit(data: FormSchema) {
    // TODO: fix convertBoolExpr(data.body) function
    console.log(data.body);
    toast({
      title: "Permission Created",
      description: "Your permission has been created successfully",
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="w-full" style={{ maxWidth: "none" }}>
          <PermissionFormFieldBoolean control={form.control} path="body" />
        </div>
        <div className="flex justify-between">
          <ExampleConstraintButton form={form} />
        </div>
      </form>
    </Form>
  );
}
