import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@torus-ts/ui/components/card";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

interface HelpCenterCardProps {
  title: string;
  description: string;
  linkText: string;
  href: string;
}

const ListItem = ({
  title,
  description,
  linkText,
  href,
}: HelpCenterCardProps) => {
  return (
    <Card className="bg-card/80 plus-corners border-border h-full pb-0 backdrop-blur-lg transition-shadow duration-200 hover:shadow-lg">
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
};

export default ListItem;
