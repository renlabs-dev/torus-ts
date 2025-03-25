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

interface ReviewContent {
  label: string;
  content: string | React.ReactNode;
}

interface ReviewTransactionDialogProps {
  formRef: React.RefObject<HTMLFormElement | null>;
  reviewContent: () => ReviewContent[];
  triggerTitle?: string;
  title?: string;
}

function RenderReviewItem({ item }: { item: ReviewContent }) {
  return (
    <span
      className="flex w-full flex-col items-start md:flex-row md:justify-between"
      key={item.label}
    >
      {item.label}:
      <span className="text-muted-foreground break-all text-left md:text-right">
        {item.content}
      </span>
    </span>
  );
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
    const [isOpen, setIsOpen] = useState(false);
    const { toast } = useToast();

    useImperativeHandle(ref, () => ({
      openDialog: () => setIsOpen(true),
    }));

    const handleSubmit = () => {
      try {
        formRef.current?.requestSubmit();
        setIsOpen(false);
      } catch (error) {
        setIsOpen(false);
        toast({
          title: "Form submission failed:",
          description: String(error),
        });
      }
    };

    const reviewItems = reviewContent();

    return (
      <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{title}</AlertDialogTitle>
            <div className="flex flex-col gap-2">
              {reviewItems.map((item) => (
                <RenderReviewItem key={item.label} item={item} />
              ))}
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsOpen(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleSubmit}>
              {triggerTitle}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  },
);
