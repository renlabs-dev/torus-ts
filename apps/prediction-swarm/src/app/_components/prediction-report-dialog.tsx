"use client";

import { Button } from "@torus-ts/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@torus-ts/ui/components/dialog";
import { Label } from "@torus-ts/ui/components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@torus-ts/ui/components/select";
import { Textarea } from "@torus-ts/ui/components/text-area";
import { useToast } from "@torus-ts/ui/hooks/use-toast";
import { api } from "~/trpc/react";
import { Flag, Loader2 } from "lucide-react";
import { useState } from "react";

interface PredictionReportDialogProps {
  parsedPredictionId: string;
  trigger?: React.ReactNode;
}

const REPORT_TYPES = [
  { value: "INACCURACY", label: "Inaccuracy" },
  { value: "FEEDBACK", label: "Feedback" },
  { value: "OTHER", label: "Other" },
] as const;

export function PredictionReportDialog({
  parsedPredictionId,
  trigger,
}: PredictionReportDialogProps) {
  const [open, setOpen] = useState(false);
  const [reportType, setReportType] = useState<string>("");
  const [content, setContent] = useState("");
  const { toast } = useToast();

  const createReport = api.predictionReport.create.useMutation({
    onSuccess: () => {
      toast({
        title: "Report submitted",
        description: "Thank you for your feedback. We'll review it shortly.",
      });
      setOpen(false);
      // Reset form
      setReportType("");
      setContent("");
    },
    onError: (error) => {
      toast({
        title: "Failed to submit report",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportType) {
      toast({
        title: "Report type required",
        description: "Please select a report type",
        variant: "destructive",
      });
      return;
    }

    createReport.mutate({
      parsedPredictionId,
      reportType: reportType as "INACCURACY" | "FEEDBACK" | "OTHER",
      content: content || null,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="ghost" size="sm" className="gap-2">
            <Flag className="h-4 w-4" />
            Report / Feedback
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Report / Feedback prediction</DialogTitle>
            <DialogDescription>
              Help us improve by reporting inaccuracies or providing feedback on
              this prediction.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="report-type">Report Type *</Label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger id="report-type">
                  <SelectValue placeholder="Select a report type" />
                </SelectTrigger>
                <SelectContent>
                  {REPORT_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="content">
                Details (Optional, max 400 characters)
              </Label>
              <Textarea
                id="content"
                placeholder="Provide additional details about your report..."
                value={content}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setContent(e.target.value)
                }
                rows={4}
                className="resize-none"
                maxLength={400}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={createReport.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createReport.isPending}>
              {createReport.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Submit Report
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
