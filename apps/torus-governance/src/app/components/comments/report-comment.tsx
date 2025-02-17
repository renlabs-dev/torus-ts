"use client";

import type { AppRouter } from "@torus-ts/api";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "@torus-ts/toast-provider";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
  Form,
  FormField,
  FormItem,
  FormControl,
  FormMessage,
} from "@torus-ts/ui";
import type { inferProcedureOutput } from "@trpc/server";
import { X } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { api } from "~/trpc/react";

export type commentReportReason = NonNullable<
  inferProcedureOutput<AppRouter["commentReport"]["byId"]>
>["reason"];

const reportCommentSchema = z.object({
  reason: z.enum([
    "SPAM",
    "VIOLENCE",
    "HARASSMENT",
    "HATE_SPEECH",
    "SEXUAL_CONTENT",
  ]),
  content: z.string().min(1, "Description is required"),
});

type ReportFormData = z.infer<typeof reportCommentSchema>;

interface ReportCommentProps {
  commentId: number | null;
  setCommentId: (id: number | null) => void;
}

export function ReportComment({ commentId, setCommentId }: ReportCommentProps) {
  const {
    commentReport: { create: createReport },
  } = api;

  const reportCommentMutation = createReport.useMutation({
    onSuccess: () => {
      setCommentId(null);
      toast.success("Comment reported successfully.");
    },
    onError: (error) => {
      toast.error(
        error.message || "An unexpected error occurred. Please try again.",
      );
    },
  });

  const form = useForm<ReportFormData>({
    resolver: zodResolver(reportCommentSchema),
    defaultValues: {
      reason: "SPAM",
      content: "",
    },
  });

  const { control, handleSubmit } = form;

  const onSubmit = (data: ReportFormData) => {
    if (!commentId) {
      console.error("No comment id found");
      return;
    }
    reportCommentMutation.mutate({
      commentId,
      reason: data.reason,
      content: data.content,
    });
  };

  if (!commentId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <button
        className="absolute inset-0 bg-card/30 backdrop-blur-sm"
        onClick={() => setCommentId(null)}
        onKeyDown={(e) => e.key === "Escape" && setCommentId(null)}
        aria-label="Close report comment dialog"
        type="button"
      />
      <Card className="relative h-fit w-full max-w-screen-md animate-fade-in-down text-left text-white">
        <CardHeader className="flex flex-row items-center justify-between gap-3 px-6 pt-6">
          <h3 className="pl-2 text-xl font-bold leading-6">Report Comment</h3>
          <Button
            className="p-2 transition duration-200"
            onClick={() => setCommentId(null)}
            type="button"
            variant="ghost"
          >
            <X size={16} />
          </Button>
        </CardHeader>
        <CardContent className="px-6">
          <Form {...form}>
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="flex flex-col gap-4"
            >
              <div>
                <FormField
                  control={control}
                  name="reason"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select a reason" />
                          </SelectTrigger>
                          <SelectContent className="border-muted">
                            <SelectGroup>
                              <SelectItem value="SPAM">Spam</SelectItem>
                              <SelectItem value="VIOLENCE">Violence</SelectItem>
                              <SelectItem value="HARASSMENT">
                                Harassment
                              </SelectItem>
                              <SelectItem value="HATE_SPEECH">
                                Hate speech
                              </SelectItem>
                              <SelectItem value="SEXUAL_CONTENT">
                                Sexual content
                              </SelectItem>
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div>
                <FormField
                  control={control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Please provide a detailed description of the issue."
                          rows={4}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="flex w-full justify-end gap-2">
                <Button
                  type="button"
                  variant="destructive"
                  className="px-4 py-2 text-white transition duration-200"
                  disabled={reportCommentMutation.isPending}
                  onClick={() => setCommentId(null)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="default"
                  className="px-4 py-2 text-neutral-800 transition duration-200"
                  disabled={reportCommentMutation.isPending}
                >
                  {reportCommentMutation.isPending ? "Submitting..." : "Submit"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
