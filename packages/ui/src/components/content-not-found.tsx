import { SearchX } from "lucide-react";

interface ContentNotFoundProps {
  message: string;
  errorNumber?: number;
}

export function ContentNotFound(props: Readonly<ContentNotFoundProps>) {
  return (
    <div className="flex h-full animate-fade flex-col items-center justify-center gap-2 py-12">
      <div className="flex items-center gap-2">
        <SearchX className="h-7 w-7 text-muted-foreground" />
        {props.errorNumber && (
          <p className="text-3xl font-medium text-muted-foreground">
            {props.errorNumber}
          </p>
        )}
      </div>
      <p className="max-w-sm text-center font-medium">{props.message}</p>
    </div>
  );
}
