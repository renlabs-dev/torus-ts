import Link from "next/link";

import { cn } from ".";
import { Icons } from "./icons";

export function Header(props: { appName?: string }): JSX.Element {
  const { appName } = props;
  return (
    <header
      className={cn(
        "absolute z-[75] flex animate-fade-down rounded-md bg-[#04061C] px-4 py-2 md:px-6",
      )}
    >
      <Link className="flex h-fit w-fit gap-4 p-1.5" href="/">
        <Icons.logo className="h-6 w-6" />
        {appName}
      </Link>
    </header>
  );
}
