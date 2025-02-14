"use client";

import {
  Button,
  Card,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@torus-ts/ui";
import { Check } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { env } from "~/env";

export const SidebarLinks = () => {
  const chainEnv = env("NEXT_PUBLIC_TORUS_CHAIN_ENV");
  const pathname = usePathname();
  const router = useRouter();

  const bridgeLink =
    chainEnv === "mainnet"
      ? "https://bridge.torus.network"
      : "https://bridge.testnet.torus.network";

  const isActive = (path: string) => pathname === path;

  const handleSelectChange = (value: string) => {
    switch (value) {
      case "wallet":
        router.push("/");
        break;
      case "staking":
        router.push("/staking");
        break;
      case "bridge":
        router.push(bridgeLink);
        break;
    }
  };

  return (
    <>
      <Select
        onValueChange={handleSelectChange}
        defaultValue={pathname === "/" ? "wallet" : pathname.slice(1)}
      >
        <SelectTrigger className="w-full lg:hidden">
          <SelectValue placeholder="Select a view" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem value="wallet">Wallet</SelectItem>
            <SelectItem value="staking">Staking</SelectItem>
            <SelectItem value="bridge">Bridge</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>

      <div className="hidden max-h-fit w-full min-w-fit flex-col gap-6 lg:flex">
        <Card className="flex flex-col gap-1.5 p-5">
          <Button
            asChild
            variant="ghost"
            className={`w-full justify-between gap-4 border-none ${isActive("/") ? "bg-accent" : ""} px-3 text-base`}
          >
            <Link href="/">
              Wallet
              {isActive("/") && <Check size={16} />}
            </Link>
          </Button>
          <Button
            asChild
            variant="ghost"
            className={`w-full justify-between gap-4 border-none ${isActive("/staking") ? "bg-accent" : ""} px-3 text-base`}
          >
            <Link href="/staking">
              Staking
              {isActive("/staking") && <Check size={16} />}
            </Link>
          </Button>
          <Button
            asChild
            variant="ghost"
            className={`w-full justify-between gap-4 border-none px-3 text-base`}
          >
            <Link href={bridgeLink}>Bridge</Link>
          </Button>
        </Card>
      </div>
    </>
  );
};
