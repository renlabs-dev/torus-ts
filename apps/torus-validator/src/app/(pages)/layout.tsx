"use client";

import Link from "next/link";
import { Button, Container, Separator } from "@torus-ts/ui";
import { usePathname } from "next/navigation";

export default function RootLayout({ children }: { children: React.ReactNode }): JSX.Element {
  const pathname = usePathname();

  return (
    <div className="pt-4">
      <Container>
        <div className="mb-4 flex w-full gap-3 border-b border-white/20 text-center">
          <div className="flex w-full animate-fade-down flex-col gap-4 pb-4 animate-delay-300 md:flex-row">
            <Button
              size="xl"
              className={`w-full ${pathname === "/modules" && "border-green-500 bg-background-green text-green-500"}`}
              asChild
            >
              <Link href="/modules">Modules</Link>
            </Button>
            <Button
              size="xl"
              className={`w-full ${pathname === "/weighted-modules" && "border-green-500 bg-background-green text-green-500"}`}
              asChild
            >
              <Link href="/weighted-modules">Your Selected Modules</Link>
            </Button>
            <Separator orientation="vertical" />
            <Button
              size="xl"
              className={`w-full hover:border-cyan-500 hover:bg-background-cyan hover:text-cyan-500 active:bg-cyan-500/30 ${
                pathname === "/subnets" && "border-cyan-500 bg-background-cyan text-cyan-500"
              }`}
              asChild
            >
              <Link href="/subnets">Subnets</Link>
            </Button>
            <Button
              size="xl"
              className={`w-full hover:border-cyan-500 hover:bg-background-cyan hover:text-cyan-500 active:bg-cyan-500/30 ${
                pathname === "/weighted-subnets" && "border-cyan-500 bg-background-cyan text-cyan-500"
              }`}
              asChild
            >
              <Link href="/weighted-subnets">Your Selected Subnets</Link>
            </Button>
          </div>
        </div>
        {children}
      </Container>
    </div>
  );
}