"use client";

import { useState } from "react";
import { z } from "zod";

import { toast } from "@torus-ts/toast-provider";

import { api } from "~/trpc/react";
import { TriangleAlert, X } from "lucide-react";
import {
  Button,
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogTitle,
  DialogTrigger,
  Label,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
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
  ] as const),
  content: z.string().min(10).max(500),
});

type ReportFormData = z.infer<typeof reportSchema>;

interface ReportAgentProps {
  agentKey: string;
}

export function ReportAgent({ agentKey }: ReportAgentProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState<ReportFormData>({
    reason: "SPAM",
    content: "",
  });
  const [errors, setErrors] = useState<Partial<ReportFormData>>({});

  const reportAgentMutation = api.agentReport.create.useMutation({
    onSuccess: () => {
      setModalOpen(false);
      setFormData({ reason: "SPAM", content: "" });
      setErrors({});
    },
  });

  function toggleModalMenu() {
    setModalOpen(!modalOpen);
  }

  const handleInputChange = (
    e: React.ChangeEvent<HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validateForm = (): boolean => {
    try {
      reportSchema.parse(formData);
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
    if (validateForm()) {
      reportAgentMutation.mutate({
        agentKey,
        reason: formData.reason,
        content: formData.content,
      });

      toast.success("Agent reported successfully.");
    }
  };

  return (
    <Dialog>
      <Button
        onClick={toggleModalMenu}
        type="button"
        variant="outline"
        asChild
        className="flex items-center gap-1.5 border-red-500 p-1 px-2 text-red-500 opacity-65 transition duration-200 hover:opacity-100"
      >
        <DialogTrigger>
          <TriangleAlert className="h-4 w-4" />
          Report Agent
        </DialogTrigger>
      </Button>

      <DialogContent className="flex w-full flex-col items-start justify-center">
        <DialogTitle>Report Agent</DialogTitle>

        <form
          onSubmit={handleSubmit}
          className="flex w-full flex-col gap-4 pt-4"
        >
          <div>
            <Label className="mb-2 block text-sm font-bold" htmlFor="reason">
              Reason
            </Label>
            <Select
              name="reason"
              value={formData.reason}
              onValueChange={(value) =>
                handleInputChange({
                  target: { name: "reason", value },
                } as React.ChangeEvent<HTMLSelectElement>)
              }
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="SPAM">Spam</SelectItem>
                  <SelectItem value="VIOLENCE">Violence</SelectItem>
                  <SelectItem value="HARASSMENT">Harassment</SelectItem>
                  <SelectItem value="HATE_SPEECH">Hate Speech</SelectItem>
                  <SelectItem value="SEXUAL_CONTENT">Sexual Content</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
            {errors.reason && (
              <p className="mt-1 text-xs text-red-500">{errors.reason}</p>
            )}
          </div>
          <div>
            <label className="mb-2 block text-sm font-bold">Description</label>
            <Textarea
              name="content"
              value={formData.content}
              onChange={handleInputChange}
              rows={4}
            />
            {errors.content && (
              <p className="mt-1 text-xs text-red-500">{errors.content}</p>
            )}
          </div>
          <DialogFooter>
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
      </DialogContent>
    </Dialog>
  );
}
