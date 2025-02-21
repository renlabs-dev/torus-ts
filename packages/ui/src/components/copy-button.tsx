"use client";

import type { VariantProps } from "class-variance-authority";
import { cn, copyToClipboard } from "../lib/utils";
import { Button, buttonVariants } from "./button";
import { useToast } from "../hooks/use-toast";

type ButtonVariantProps = VariantProps<typeof buttonVariants>;
interface CopyButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  copy: string;
  children: React.ReactNode | string;
  className?: string;
  variant?: ButtonVariantProps["variant"];
  asChild?: boolean;
}

export function CopyButton(props: Readonly<CopyButtonProps>): JSX.Element {
  const {
    children,
    className,
    variant,
    copy,
    asChild = false,
    ...rest
  } = props;
  const { toast } = useToast();

  const handleClick = async (copy: string) => {
    await copyToClipboard(copy);
    toast({
      title: "Success!",
      description: "Copied to clipboard",
    });
  };

  return (
    <Button
      variant={variant}
      className={cn(className)}
      asChild={asChild}
      onClick={() => handleClick(copy)}
      {...rest}
    >
      {children}
    </Button>
  );
}
