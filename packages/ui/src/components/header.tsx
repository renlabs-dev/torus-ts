import Link from "next/link";

import { cn } from ".";
import { Icons } from "./icons";

interface HeaderProps {
  appName: string;
  wallet?: React.ReactNode;
}

export function Header(props: HeaderProps): JSX.Element {
  return (
    <header
      className={cn(
        "relative z-[60] flex w-full animate-fade-down items-center justify-between py-2",
      )}
    >
      <Link className={cn("flex gap-3 py-1.5 hover:cursor-pointer")} href="/">
        <Icons.logo className="h-6 w-6" />
        {props.appName}
      </Link>

      {props.wallet}
    </header>
  );
}
