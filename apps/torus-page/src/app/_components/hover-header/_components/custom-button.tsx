import { Button } from "@torus-ts/ui/components/button";
import Link from "next/link";

interface ButtonProps {
  href: string;
  children: React.ReactNode;
  isHidden?: boolean;
}

export function CustomButton({
  href,
  children,
  isHidden,
}: Readonly<ButtonProps>) {
  if (isHidden) {
    return (
      <Button className="invisible w-28" size="lg">
        gambiarra
      </Button>
    );
  }
  return (
    <Button
      variant="outline"
      size="lg"
      asChild
      className={"animate-fade-down bg-background animate-delay-300 w-28"}
    >
      <Link href={href} target="_blank">
        {children}
      </Link>
    </Button>
  );
}
