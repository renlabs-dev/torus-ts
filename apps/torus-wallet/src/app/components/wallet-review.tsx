import { Button } from "@torus-ts/ui/components/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@torus-ts/ui/components/card";
import React from "react";

interface WalletTransactionReviewProps {
  disabled?: boolean;
  formRef: React.RefObject<HTMLFormElement>;
  reviewContent: { label: string; content: string | React.ReactNode }[];
  triggerTitle?: string;
  title?: string;
}

export function WalletTransactionReview(
  props: Readonly<WalletTransactionReviewProps>,
) {
  const {
    disabled = false,
    formRef,
    reviewContent,
    triggerTitle = "Start transaction",
    title = "Review transaction",
  } = props;

  return (
    <Card className="animate-fade flex w-full flex-col justify-between p-6 md:w-2/5">
      <CardHeader className="px-0 pt-0">{title}</CardHeader>
      <CardContent className="p-0">
        <div className="flex flex-col gap-2">
          {reviewContent.map((content) => {
            return (
              <span className="flex w-full justify-between" key={content.label}>
                {content.label}:
                <span className="text-muted-foreground text-right">
                  {content.content}
                </span>
              </span>
            );
          })}
        </div>
      </CardContent>
      <CardFooter className="px-0 pb-0 pt-6">
        <Button
          className="flex w-full place-self-end"
          disabled={disabled}
          onClick={() => formRef.current.requestSubmit()}
        >
          {triggerTitle}
        </Button>
      </CardFooter>
    </Card>
  );
}
