import React from "react";

import { Check } from "lucide-react";
import Link from "next/link";

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

import { env } from "~/env";

export const SidebarLinks = () => {
  const chainEnv = env("NEXT_PUBLIC_TORUS_CHAIN_ENV");

  const walletLink =
    chainEnv === "mainnet"
      ? "https://wallet.torus.network"
      : "https://wallet.testnet.torus.network";

  const bridgeLink =
    chainEnv === "mainnet"
      ? "https://bridge.torus.network"
      : "https://bridge.testnet.torus.network";

  return (
    <>
      <Select defaultValue="staking">
        <SelectTrigger className="w-full lg:hidden">
          <SelectValue placeholder="Select a view" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem value="staking">Staking</SelectItem>
            <SelectItem value="wallet">Wallet</SelectItem>
            <SelectItem value="bridge">Bridge</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>

      <div className="hidden max-h-fit w-full min-w-fit flex-col gap-6 lg:flex">
        <Card className="flex flex-col gap-1.5 p-5">
          <Button
            asChild
            variant="ghost"
            className={`w-full justify-between gap-4 border-none bg-accent px-3 text-base`}
          >
            <Link href="/">
              Staking
              <Check size={16} />
            </Link>
          </Button>
          <Button
            asChild
            variant="ghost"
            className={`w-full justify-between gap-4 border-none px-3 text-base`}
          >
            <Link href={walletLink}>Wallet</Link>
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
