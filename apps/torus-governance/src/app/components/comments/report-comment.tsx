"use client";

import type { inferProcedureOutput } from "@trpc/server";
import { useState } from "react";
import { z } from "zod";

import type { AppRouter } from "@torus-ts/api";
import { toast } from "@torus-ts/toast-provider";

import { api } from "~/trpc/react";
import { X } from "lucide-react";
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
} from "@torus-ts/ui";

export type commentReportReason = NonNullable<
  inferProcedureOutput<AppRouter["commentReport"]["byId"]>
>["reason"];

interface ReportFormData {
  reason: commentReportReason;
  content: string;
}

interface ReportCommentProps {
  commentId: number | null;
  setCommentId: (id: number | null) => void;
}

export function ReportComment({ commentId, setCommentId }: ReportCommentProps) {
  const [formData, setFormData] = useState<ReportFormData>({
    reason: "SPAM",
    content: "",
  });

  const [errors, setErrors] = useState<Partial<ReportFormData>>({});

  const reportCommentMutation = api.commentReport.create.useMutation({
    onSuccess: () => {
      setCommentId(null);
      setFormData({ reason: formData.reason, content: "" });
      setErrors({});
    },
  });

  const handleInputChange = (type: "reason" | "content", value: string) => {
    if (type === "reason") {
      setFormData((prev) => ({
        ...prev,
        reason: value as commentReportReason,
      }));
    } else {
      setFormData((prev) => ({ ...prev, [type]: value }));
    }
  };

  const validateForm = (): boolean => {
    try {
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors = error.formErrors
          .fieldErrors as Partial<ReportFormData>;
        setErrors(fieldErrors);
      } else {
        console.error("Unexpected error during form validation:", error);
      }
      return false;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentId) return console.error("No comment id found");

    if (validateForm()) {
      reportCommentMutation.mutate({
        commentId,
        reason: formData.reason,
        content: formData.content,
      });

      toast.success("Comment reported successfully.");
    }
  };

  if (!commentId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-card/30 backdrop-blur-sm"
        onClick={() => setCommentId(null)}
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
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="mb-2 block text-sm font-bold">Reason</label>
              <Select
                value={formData.reason}
                onValueChange={(value) => handleInputChange("reason", value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a reason" />
                </SelectTrigger>
                <SelectContent className="border-muted">
                  <SelectGroup>
                    <SelectItem value="SPAM">Spam</SelectItem>
                    <SelectItem value="VIOLENCE">Violence</SelectItem>
                    <SelectItem value="HARASSMENT">Harassment</SelectItem>
                    <SelectItem value="HATE_SPEECH">Hate speech</SelectItem>
                    <SelectItem value="SEXUAL_CONTENT">
                      Sexual content
                    </SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
              {errors.reason && (
                <p className="mt-1 text-xs text-red-500">{errors.reason}</p>
              )}
            </div>
            <div>
              <label className="mb-2 block text-sm font-bold">
                Description
              </label>
              <Textarea
                name="content"
                value={formData.content}
                onChange={(value) =>
                  handleInputChange("content", value.target.value)
                }
                className="w-full border border-muted bg-card p-2"
                placeholder="Please provide a detailed description of the issue."
                rows={4}
              />

              {errors.content && (
                <p className="mt-1 text-xs text-red-500">{errors.content}</p>
              )}
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
                className="px-4 py-2 text-white transition duration-200"
                disabled={reportCommentMutation.isPending}
              >
                {reportCommentMutation.isPending ? "Submitting..." : "Submit"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
