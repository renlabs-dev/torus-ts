"use client";

import { useState } from "react";
import { XMarkIcon } from "@heroicons/react/16/solid";
import { ExclamationTriangleIcon } from "@heroicons/react/20/solid";
import { z } from "zod";

import { toast } from "@torus-ts/providers/use-toast";

import { api } from "~/trpc/react";

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

interface ReportModuleProps {
  moduleId: number;
}

export function ReportModule({ moduleId }: ReportModuleProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState<ReportFormData>({
    reason: "SPAM",
    content: "",
  });
  const [errors, setErrors] = useState<Partial<ReportFormData>>({});

  const reportModuleMutation = api.module.createModuleReport.useMutation({
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
      reportModuleMutation.mutate({
        moduleId,
        reason: formData.reason,
        content: formData.content,
      });

      toast.success("Module reported successfully.");
    }
  };

  return (
    <>
      <button
        onClick={toggleModalMenu}
        type="button"
        className="flex items-center gap-1 border border-red-500 p-1 px-2 text-red-500 opacity-30 transition duration-200 hover:bg-red-500/10 hover:opacity-100"
      >
        <ExclamationTriangleIcon className="mt-0.5 h-4 w-4" /> Report Module
      </button>
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={toggleModalMenu}
          />
          <div className="z-60 w-[90%] max-w-screen-md animate-fade-in-down overflow-hidden border border-white/20 bg-[#898989]/5 text-left text-white backdrop-blur-md">
            <div className="flex items-center justify-between gap-3 border-b border-gray-500 bg-cover bg-center bg-no-repeat p-1">
              <h3 className="pl-2 text-xl font-bold leading-6" id="modal-title">
                Report Module
              </h3>
              <button
                className="p-2 transition duration-200"
                onClick={toggleModalMenu}
                type="button"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6">
              <div className="mb-4">
                <label className="mb-2 block text-sm font-bold">Reason</label>
                <select
                  name="reason"
                  value={formData.reason}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 bg-black/40 p-2"
                >
                  <option value="SPAM">Spam</option>
                  <option value="VIOLENCE">Violence</option>
                  <option value="HARASSMENT">Harassment</option>
                  <option value="HATE_SPEECH">Hate Speech</option>
                  <option value="SEXUAL_CONTENT">Sexual Content</option>
                </select>
                {errors.reason && (
                  <p className="mt-1 text-xs text-red-500">{errors.reason}</p>
                )}
              </div>
              <div className="mb-4">
                <label className="mb-2 block text-sm font-bold">
                  Description
                </label>
                <textarea
                  name="content"
                  value={formData.content}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 bg-black/40 p-2"
                  rows={4}
                ></textarea>
                {errors.content && (
                  <p className="mt-1 text-xs text-red-500">{errors.content}</p>
                )}
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="border border-red-500 bg-red-500/10 px-4 py-2 text-white transition duration-200 hover:bg-red-500/20"
                  disabled={reportModuleMutation.isPending}
                >
                  {reportModuleMutation.isPending ? "Submitting..." : "Submit"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
