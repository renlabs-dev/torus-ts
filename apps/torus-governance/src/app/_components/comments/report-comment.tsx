"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import type { AppRouter } from "@torus-ts/api";
import { Button } from "@torus-ts/ui/components/button";
import { Card, CardContent, CardHeader } from "@torus-ts/ui/components/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@torus-ts/ui/components/form";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@torus-ts/ui/components/select";
import { Textarea } from "@torus-ts/ui/components/text-area";
import { useToast } from "@torus-ts/ui/hooks/use-toast";
import type { inferProcedureOutput } from "@trpc/server";
import { api } from "~/trpc/react";
import { X } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { tryAsync } from "@torus-network/torus-utils/try-catch";

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

interface ReportCommentData {
  commentId: number;
  reason: "SPAM" | "VIOLENCE" | "HARASSMENT" | "HATE_SPEECH" | "SEXUAL_CONTENT";
  content: string | null | undefined;
}

export function ReportComment({
  commentId,
  setCommentId,
}: Readonly<ReportCommentProps>) {
  const {
    commentReport: { create: createReport },
  } = api;

  const { toast } = useToast();

  const reportCommentMutation = createReport.useMutation();

  async function handleCommentMutation(data: ReportCommentData) {
    const [error, _success] = await tryAsync(reportCommentMutation.mutateAsync(data));
    if (error !== undefined) {
      toast.error(
        error.message ||
          "An unexpected error occurred. Please try again.",
      );
      return;
    }
    setCommentId(null);
    toast.success("Comment reported successfully.");
  }

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
    void handleCommentMutation({
      commentId,
      reason: data.reason,
      content: data.content,
    });
  };

  if (!commentId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <button
        className="bg-card/30 absolute inset-0 backdrop-blur-sm"
        onClick={() => setCommentId(null)}
        onKeyDown={(e) => e.key === "Escape" && setCommentId(null)}
        aria-label="Close report comment dialog"
        type="button"
      />
      <Card className="animate-fade-in-down relative h-fit w-full max-w-screen-md text-left text-white">
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
