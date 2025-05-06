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
              <ExampleConstraintButton form={form} />
              <Button type="submit">Create Permission</Button>
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
