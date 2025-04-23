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
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>
          <IconComponent className="h-5 w-5 mr-2 inline" /> {props.title}
        </CardTitle>
        <Link href={props.redirectPath} target="_blank" rel="noreferrer">
          <SquareArrowOutUpRight className="h-5 w-5 hover:text-muted-foreground ml-auto" />
        </Link>
      </CardHeader>
      <CardContent>{props.children}</CardContent>
    </Card>
  );
}
