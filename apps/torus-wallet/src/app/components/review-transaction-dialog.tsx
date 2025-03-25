import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@torus-ts/ui/components/alert-dialog";
import { useToast } from "@torus-ts/ui/hooks/use-toast";
import React, { forwardRef, useImperativeHandle, useState } from "react";

export interface ReviewTransactionDialogHandle {
  openDialog: () => void;
}

interface ReviewTransactionDialogProps {
  formRef: React.RefObject<HTMLFormElement | null>;
  reviewContent: () => { label: string; content: string | React.ReactNode }[];
  triggerTitle?: string;
  title?: string;
}

export const ReviewTransactionDialog = forwardRef<
  ReviewTransactionDialogHandle,
  ReviewTransactionDialogProps
>(
  (
    {
      formRef,
      reviewContent,
      triggerTitle = "Start transaction",
      title = "Review transaction",
    },
    ref,
  ) => {
    const [open, setOpen] = useState(false);

    useImperativeHandle(ref, () => ({
      openDialog: () => setOpen(true),
    }));

    const review = reviewContent();
    const { toast } = useToast();
    return (
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{title}</AlertDialogTitle>
            <div className="flex flex-col gap-2">
              {review.map((content) => (
                <span
                  className="flex w-full flex-col items-start md:flex-row md:justify-between"
                  key={content.label}
                >
                  {content.label}:
                  <span className="text-muted-foreground break-all text-left md:text-right">
                    {content.content}
                  </span>
                </span>
              ))}
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setOpen(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                try {
                  formRef.current?.requestSubmit();
                  setOpen(false);
                } catch (error) {
                  setOpen(false);
                  toast({
                    title: "Form submission failed:",
                    description: String(error),
                  });
                }
              }}
            >
              {triggerTitle}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  },
);
