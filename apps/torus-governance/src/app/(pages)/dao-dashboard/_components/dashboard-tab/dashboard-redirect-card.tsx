import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@torus-ts/ui/components/card";
import type { LucideIcon } from "lucide-react";
import { SquareArrowOutUpRight } from "lucide-react";
import Link from "next/link";
import React from "react";

interface DaoDashboardRedirectCardProps {
  title: string;
  redirectPath: string;
  children: React.ReactNode;
  icon: LucideIcon;
}

export default function DashboardRedirectCard(
  props: DaoDashboardRedirectCardProps,
) {
  const IconComponent = props.icon;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-sm">
          <IconComponent size={16} className="inline" /> {props.title}
        </CardTitle>
        <Link href={props.redirectPath} rel="noreferrer">
          <SquareArrowOutUpRight
            size={16}
            className="hover:text-muted-foreground ml-auto"
          />
        </Link>
      </CardHeader>
      <CardContent>{props.children}</CardContent>
    </Card>
  );
}
