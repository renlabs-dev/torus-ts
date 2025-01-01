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
        "fixed z-[75] flex w-full max-w-screen-xl animate-fade-down justify-between px-4 py-2",
      )}
    >
      <Link className="z-[80] flex gap-3 p-1.5 hover:cursor-pointer" href="/">
        <Icons.logo className="h-6 w-6" />
        {props.appName}
      </Link>
      {props.wallet}
    </header>
  );
}
