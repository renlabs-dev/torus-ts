"use client";

import * as React from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "@torus-ts/toast-provider";
import { api } from "~/trpc/react";
import { TriangleAlert } from "lucide-react";
import {
  Button,
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogTitle,
  DialogTrigger,
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from "@torus-ts/ui";

const reportSchema = z.object({
  reason: z.enum([
    "SPAM",
    "VIOLENCE",
    "HARASSMENT",
    "HATE_SPEECH",
    "SEXUAL_CONTENT",
  ]),
  content: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .max(500, "Description cannot exceed 500 characters"),
});

type ReportFormData = z.infer<typeof reportSchema>;

interface ReportAgentProps {
  agentKey: string;
}

export function ReportAgent({ agentKey }: ReportAgentProps) {
  const reportAgentMutation = api.agentReport.create.useMutation({
    onSuccess: () => {
      reset();
      toast.success("Agent reported successfully.");
    },
    onError: (error) => {
      toast.error(
        error.message || "An unexpected error occurred. Please try again.",
      );
    },
  });

  const form = useForm<ReportFormData>({
    resolver: zodResolver(reportSchema),
    defaultValues: {
      reason: "SPAM",
      content: "",
    },
  });

  const {
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = form;

  const onSubmit = (data: ReportFormData) => {
    reportAgentMutation.mutate({
      agentKey,
      reason: data.reason,
      content: data.content,
    });
    toast.success("Agent reported successfully.");
  };

  return (
    <Dialog>
      <Button
        type="button"
        variant="outline"
        asChild
        className="flex w-full items-center gap-1.5 border-red-500 p-3 text-red-500 opacity-65 transition duration-200 hover:text-red-500 hover:opacity-100"
      >
        <DialogTrigger>
          <TriangleAlert className="h-4 w-3" /> Report Agent to DAO
        </DialogTrigger>
      </Button>
      <DialogContent className="flex w-full flex-col items-start justify-center sm:w-full">
        <DialogTitle>Report Agent</DialogTitle>
        <Form {...form}>
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex w-full flex-col gap-4 pt-4"
          >
            <FormField
              control={control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason</FormLabel>
                  <FormControl>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Select a reason" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectItem value="SPAM">Spam</SelectItem>
                          <SelectItem value="VIOLENCE">Violence</SelectItem>
                          <SelectItem value="HARASSMENT">Harassment</SelectItem>
                          <SelectItem value="HATE_SPEECH">
                            Hate Speech
                          </SelectItem>
                          <SelectItem value="SEXUAL_CONTENT">
                            Sexual Content
                          </SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage>{errors.reason?.message}</FormMessage>
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      rows={4}
                      placeholder="Enter description"
                    />
                  </FormControl>
                  <FormMessage>{errors.content?.message}</FormMessage>
                </FormItem>
              )}
            />

            <DialogFooter className="flex gap-2 sm:space-x-0">
              <Button asChild variant="destructive">
                <DialogClose>Cancel</DialogClose>
              </Button>
              <Button
                type="submit"
                variant="default"
                disabled={reportAgentMutation.isPending}
              >
                {reportAgentMutation.isPending ? "Submitting..." : "Submit"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
