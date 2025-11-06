import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@torus-ts/ui/components/card";
import { cn } from "@torus-ts/ui/lib/utils";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

interface HelpCenterCardProps {
  title: string;
  description: string;
  linkText: string;
  href: string;
  className?: string;
}

export function ListItem({
  title,
  description,
  linkText,
  href,
  className,
}: HelpCenterCardProps) {
  return (
    <Card
      className={cn(
        "bg-card/80 plus-corners border-border h-full pb-0 transition-shadow duration-200 hover:shadow-lg",
        className,
      )}
    >
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex h-full flex-col border-t py-3">
        <Link
          href={href}
          className="text-link group flex items-center justify-between font-medium transition-colors duration-200 hover:underline"
        >
          {linkText}
          <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
        </Link>
      </CardContent>
    </Card>
  );
}
