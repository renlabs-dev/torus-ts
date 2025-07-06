"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { api } from "~/trpc/react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@torus-ts/ui/components/form";
import { Textarea } from "@torus-ts/ui/components/text-area";
import { Button } from "@torus-ts/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@torus-ts/ui/components/card";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@torus-ts/ui/components/tabs";
import { MarkdownView } from "@torus-ts/ui/components/markdown-view";
import type { AppRouter } from "@torus-ts/api";
import type { inferProcedureInput } from "@trpc/server";
import { Input } from "@torus-ts/ui/components/input";
import { AGENT_DEMAND_SIGNAL_INSERT_SCHEMA } from "@torus-ts/db/validation";
import { useToast } from "@torus-ts/ui/hooks/use-toast";

type SignalFormData = NonNullable<
  inferProcedureInput<AppRouter["signal"]["create"]>
>;

export default function CreateSignalForm() {
  const { toast } = useToast();

  const createSignalMutation = api.signal.create.useMutation();

  const form = useForm<SignalFormData>({
    resolver: zodResolver(AGENT_DEMAND_SIGNAL_INSERT_SCHEMA),
    defaultValues: {
      title: "",
      description: "",
      proposedAllocation: 0,
      discord: "",
      github: "",
      telegram: "",
      twitter: "",
    },
  });

  const onSubmit = async (data: SignalFormData) => {
    try {
      await createSignalMutation.mutateAsync(data);
      toast.success("Signal created successfully");
      form.reset();
    } catch (error) {
      console.error("Failed to create signal:", error);
    }
  };

  return (
    <div className="w-full max-w-2xl">
      <Card className="border-0">
        <CardHeader>
          <CardTitle>Create Demand Signal</CardTitle>
          <CardDescription>
            Make a demand signal to express your specific need and proposed
            emission allocation to other agents.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Brief title for your demand signal"
                        maxLength={100}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Tabs defaultValue="edit" className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                          <TabsTrigger value="edit">Edit</TabsTrigger>
                          <TabsTrigger value="preview">Preview</TabsTrigger>
                        </TabsList>
                        <TabsContent value="edit">
                          <Textarea
                            maxLength={8000}
                            placeholder="Detailed description of your demand signal... (Markdown supported)"
                            className="min-h-[200px] resize-none"
                            {...field}
                          />
                        </TabsContent>
                        <TabsContent value="preview">
                          <div className="min-h-[200px] rounded-md border p-3 bg-muted/50">
                            {field.value ? (
                              <MarkdownView
                                source={field.value}
                                className="prose prose-sm dark:prose-invert max-w-none"
                              />
                            ) : (
                              <p className="text-muted-foreground text-sm">
                                No content to preview. Switch to Edit tab to add
                                content.
                              </p>
                            )}
                          </div>
                        </TabsContent>
                      </Tabs>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="proposedAllocation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Proposed Allocation (%)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        placeholder="0-100"
                        {...field}
                        onChange={(e) => {
                          const n = parseInt(e.target.value, 10);
                          // Send undefined to trigger “required” validation when empty,
                          // otherwise the parsed number.
                          field.onChange(Number.isFinite(n) ? n : undefined);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-4">
                <h3 className="text-lg font-medium">
                  Contact Information{" "}
                  <span className="text-sm text-gray-500">(Recommended)</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="discord"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Discord</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Discord username (e.g., username)"
                            {...field}
                            value={field.value ?? ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="github"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>GitHub</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="GitHub username (e.g., octocat)"
                            {...field}
                            value={field.value ?? ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="telegram"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Telegram</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Telegram username (e.g., @username)"
                            {...field}
                            value={field.value ?? ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="twitter"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Twitter</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Twitter handle (e.g., @username)"
                            {...field}
                            value={field.value ?? ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-4 pb-12">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => form.reset()}
                >
                  Reset
                </Button>
                <Button type="submit" disabled={createSignalMutation.isPending}>
                  {createSignalMutation.isPending
                    ? "Creating..."
                    : "Create Signal"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
