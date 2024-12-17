import React from "react";

import {
  Button,
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@torus-ts/ui";

interface WalletTransactionReviewProps {
  disabled?: boolean;
  formRef: React.RefObject<HTMLFormElement>;
  reviewContent: { label: string; content: string | React.ReactNode }[];
  transactionActionLabel?: string;
  triggerTitle?: string;
  title?: string;
}

export function WalletTransactionReview(props: WalletTransactionReviewProps) {
  const {
    disabled = false,
    formRef,
    reviewContent,
    triggerTitle = "Start transaction",
    title = "Review transaction",
  } = props;

  return (
    <Card className="flex w-full animate-fade flex-col justify-around p-6 md:w-2/5">
      <CardHeader className="px-0 pt-0">{title}</CardHeader>
      <CardContent className="px-0">
        <div className="flex flex-col gap-4 py-4">
          {reviewContent.map((content) => {
            return (
              <span className="flex w-full justify-between" key={content.label}>
                {content.label}:
                <span className="text-muted-foreground">{content.content}</span>
              </span>
            );
          })}
        </div>
      </CardContent>
      <CardFooter className="px-0 pb-0">
        <Button
          className="flex w-full place-self-end"
          disabled={disabled}
          onClick={() => formRef.current?.requestSubmit()}
        >
          {triggerTitle}
        </Button>
      </CardFooter>
    </Card>
  );
}
