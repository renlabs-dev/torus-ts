import { Card } from "@torus-ts/ui/components/card";
import { jacquard } from "../(pages)/page";

interface PageHeaderProps {
  title: string;
  description: string;
  children?: React.ReactNode;
  icon?: React.ReactNode;
}

export function PageHeader({
  title,
  description,
  children,
  icon,
}: PageHeaderProps) {
  return (
    <div className="relative mx-auto max-w-screen-lg px-4">
      <Card className="plus-corners bg-background/80 relative flex items-center justify-between p-6">
        <div className="flex items-center gap-4">
          {icon && <div className="shrink-0">{icon}</div>}
          <div>
            <h1
              className={`text-5xl font-thin opacity-90 ${jacquard.className}`}
            >
              {title}
            </h1>
            <p className="text-muted-foreground mt-2">{description}</p>
          </div>
        </div>
        {/* TODO: Add filters */}
        <div className="flex items-center gap-4">
          {children}
          {/* <Button variant="default">Filters</Button> */}
        </div>
      </Card>
    </div>
  );
}
