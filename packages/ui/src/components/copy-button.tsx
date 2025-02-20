"use client";

import type { VariantProps } from "class-variance-authority";
import { cn, copyToClipboard } from "../lib/utils";
import { Button, buttonVariants } from "./button";

type ButtonVariantProps = VariantProps<typeof buttonVariants>;
interface CopyButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  copy: string;
  children: React.ReactNode | string;
  className?: string;
  variant?: ButtonVariantProps["variant"];
  notify?: () => void;
  asChild?: boolean;
}

export function CopyButton(props: Readonly<CopyButtonProps>): JSX.Element {
  const {
    children,
    className,
    variant,
    copy,
    asChild = false,
    notify,
    ...rest
  } = props;

  const handleClick = async (copy: string) => {
    await copyToClipboard(copy);
    if (notify) return notify();
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
