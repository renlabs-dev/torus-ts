"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@torus-ts/ui/components/card";
import type { ReactNode } from "react";

export interface DaoCardProps {
  /** Main card title content */
  title?: ReactNode;
  /** Content to display in the top-right corner (labels, status indicators) */
  topRightContent?: ReactNode;
  /** Content to display below the title (author, timestamps) */
  metaContent?: ReactNode;
  /** Main card content */
  children?: ReactNode;
}

export function DaoCard({
  title,
  topRightContent,
  metaContent,
  children,
}: Readonly<DaoCardProps>) {
  return (
    <Card
      className={`animate-fade hover:bg-accent w-full p-4 transition duration-500 lg:p-6`}
    >
      <CardHeader className="flex flex-col-reverse justify-between space-y-0 px-0 pb-3 pt-0 md:flex-col-reverse xl:flex-row">
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
          <CardTitle className="line-clamp-3 text-xl font-semibold text-white lg:pb-0 xl:line-clamp-2">
            {title}
          </CardTitle>
        )}
        {children}
      </CardContent>
    </Card>
  );
}
