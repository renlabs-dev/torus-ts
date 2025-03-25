import * as React from "react";
import { cn } from "../lib/utils";
import { Icons } from "./icons";
import Link from "next/link";

interface HeaderProps {
  appName: string;
  wallet?: React.ReactNode;
}

export function Header(props: Readonly<HeaderProps>) {
  return (
    <header
      className={cn(
        "fixed z-[70] flex w-full animate-fade-down items-center justify-between border-b border-border bg-accent py-1 pl-4 pr-2",
      )}
    >
      <Link className={cn("flex gap-3 py-1.5 hover:cursor-pointer")} href="/">
        <Icons.Logo className="h-6 w-6" />
        {props.appName}
      </Link>

      {props.wallet}
    </header>
  );
}
