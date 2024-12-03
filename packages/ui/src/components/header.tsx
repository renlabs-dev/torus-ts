import Link from "next/link";

import { cn } from ".";
import { Icons } from "./icons";

export function Header(props: { appName?: string }): JSX.Element {
  const { appName } = props;
  return (
    <header className={cn("fixed left-6 top-3 z-50 flex animate-fade-down")}>
      <Link className="flex h-fit w-fit gap-4 p-1.5" href="/">
        <Icons.logo className="h-6 w-6" />
        {appName}
      </Link>
    </header>
  );
}
