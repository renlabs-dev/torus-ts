import { cn } from ".";
import { Icons } from "./icons";

export function Header(): JSX.Element {
  return (
    <header
      className={cn(
        "fixed left-0 top-0 z-50 mx-auto flex animate-fade-down justify-end bg-gradient-to-b from-background via-background to-transparent px-4 pb-6 pt-3",
      )}
    >
      <a className="h-fit w-fit rounded-full bg-accent p-1.5" href="/">
        <Icons.logo className="h-6 w-6" />
      </a>
    </header>
  );
}
