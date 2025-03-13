"use client";

import type { VariantProps } from "class-variance-authority";
import { useCallback } from "react";
import { useToast } from "../hooks/use-toast";
import { cn, copyToClipboard } from "../lib/utils";
import type { buttonVariants } from "./button";
import { Button } from "./button";

type ButtonVariantProps = VariantProps<typeof buttonVariants>;

interface CopyButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  copy: string;
  children: React.ReactNode;
  className?: string;
  variant?: ButtonVariantProps["variant"];
  asChild?: boolean;
}

export function CopyButton({
  children,
  className,
  variant,
  copy,
  asChild = false,
  ...rest
}: Readonly<CopyButtonProps>): JSX.Element {
  const { toast } = useToast();

  const handleCopy = useCallback(async () => {
    await copyToClipboard(copy);

    toast({
      title: "Success!",
      description: "Copied to clipboard",
    });
  }, [copy, toast]);

  const handleClick = useCallback(
    async (event: React.MouseEvent<HTMLButtonElement>) => {
      event.preventDefault();
      event.stopPropagation();
      await handleCopy();
    },
    [handleCopy],
  );

  return (
    <Button
      variant={variant}
      className={cn(className)}
      asChild={asChild}
      onClick={handleClick}
      {...rest}
    >
      {children}
    </Button>
  );
}
