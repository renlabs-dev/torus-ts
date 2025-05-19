"use client";

import { useState, useEffect } from "react";
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@torus-ts/ui/components/tabs";
import { useToast } from "@torus-ts/ui/hooks/use-toast";
import { useForm, useWatch } from "react-hook-form";
import { formSchema } from "./permission-form-schemas";
import type { FormSchema } from "./permission-form-schemas";
import { ExampleConstraintButton } from "./permission-form-example-constraint-button";
import { PermissionFormFieldBoolean } from "./permission-form-field-boolean";
import { PermissionFlowVisualizer } from "./permission-flow-visualizer";

export function PermissionForm() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("form");
  const [formValues, setFormValues] = useState<FormSchema | null>(null);

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

  // Update the flow visualizer whenever the form data changes
  useEffect(() => {
    setFormValues(form.getValues());
  }, [formData, form]);

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
        <Tabs
          defaultValue="form"
          value={activeTab}
          onValueChange={setActiveTab}
        >
          <TabsList className="mb-4">
            <TabsTrigger value="form">Form Builder</TabsTrigger>
            <TabsTrigger value="visualizer">Flow Visualizer</TabsTrigger>
          </TabsList>

          <TabsContent value="form">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
                <PermissionFormFieldBoolean
                  control={form.control}
                  path="body"
                />

                <div className="flex justify-between">
                  <ExampleConstraintButton form={form} />
                  <div className="space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setActiveTab("visualizer")}
                    >
                      View Flow
                    </Button>
                    <Button type="submit">Create Permission</Button>
                  </div>
                </div>
              </form>
            </Form>
          </TabsContent>

          <TabsContent value="visualizer">
            <div className="space-y-4">
              {formValues && <PermissionFlowVisualizer formData={formValues} />}
              <div className="flex justify-end">
                <Button type="button" onClick={() => setActiveTab("form")}>
                  Back to Form
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
