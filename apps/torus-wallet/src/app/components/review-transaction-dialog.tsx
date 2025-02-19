import React, { forwardRef, useImperativeHandle, useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@torus-ts/ui";
import { toast } from "@torus-ts/toast-provider";

export interface ReviewTransactionDialogHandle {
  openDialog: () => void;
}

interface ReviewTransactionDialogProps {
  formRef: React.RefObject<HTMLFormElement>;
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
                  <span className="break-all text-left text-muted-foreground md:text-right">
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
                  toast.error(`Form submission failed: ${String(error)}`);
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
