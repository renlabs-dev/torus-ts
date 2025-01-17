import React from "react";
import Link from "next/link";

import { Check } from "lucide-react";

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

export const SidebarLinks = () => {
  return (
    <>
      <Select defaultValue="wallet">
        <SelectTrigger className="w-full lg:hidden">
          <SelectValue placeholder="Select a view" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
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
              Wallet
              <Check size={16} />
            </Link>
          </Button>
          <Button
            asChild
            variant="ghost"
            className={`w-full justify-between gap-4 border-none px-3 text-base`}
          >
            <Link href="https://bridge.torus.network">Bridge</Link>
          </Button>
        </Card>
      </div>
    </>
  );
};
