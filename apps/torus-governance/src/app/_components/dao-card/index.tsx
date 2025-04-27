"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@torus-ts/ui/components/card";
import { cn } from "@torus-ts/ui/lib/utils";
import type { ReactNode } from "react";

export interface DaoCardProps {
  title?: ReactNode;
  topRightContent?: ReactNode;
  metaContent?: ReactNode;
  children?: ReactNode;
  variant?: "default" | "small";
}

export function DaoCard({
  title,
  topRightContent,
  metaContent,
  children,
  variant,
}: Readonly<DaoCardProps>) {
  return (
    <Card
      className={cn(
        "animate-fade hover:bg-accent w-full transition duration-500",
        variant === "small" ? "py-1 border-none border-b" : "p-4 lg:p-6",
      )}
    >
      <CardHeader
        className={cn(
          `flex flex-col-reverse justify-between space-y-0 px-0 pb-3 pt-0
          md:flex-col-reverse xl:flex-row`,
          variant === "small" ? "pb-0" : "pb-3",
        )}
      >
        {metaContent && (
          <div className="flex w-fit flex-col items-start gap-2 sm:flex-row sm:items-center sm:gap-5">
            {metaContent}
          </div>
        )}
        {topRightContent && (
          <div className="!mb-4 flex gap-2 xl:!mb-0">{topRightContent}</div>
        )}
      </CardHeader>

      <CardContent className="flex flex-col gap-3 px-0 py-0">
        {title && (
          <CardTitle
            className={cn(
              "line-clamp-3 text-xl font-semibold text-white lg:pb-0 xl:line-clamp-2",
              variant === "small" ? "text-sm" : "text-xl",
            )}
          >
            {title}
          </CardTitle>
        )}
        {children}
      </CardContent>
    </Card>
  );
}
