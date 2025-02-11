"use client";

import {
  Anvil,
  ArrowRight,
  ChartPie,
  Cuboid,
  Globe,
  IdCard,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { smallAddress } from "@torus-ts/utils/subspace";
import { Button, Card, CopyButton, Icons, Label } from "./";

interface AgentCardProps {
  agentKey: string;
  currentBlock?: number | null;
  shortDescription: string;
  title: string;
  iconUrl: string | null;
  socialsList: Partial<Record<SocialKind, string>>;
}

interface SocialItem {
  name: string;
  href: string;
  icon: React.ReactNode;
}

export const SOCIALS_VALUES = {
  website: {
    name: "Website",
    icon: <Globe className="h-5 w-5 md:h-4 md:w-4" color="gray" />,
  },
  discord: {
    name: "Discord",
    icon: <Icons.Discord className="h-5 w-5 md:h-4 md:w-4" color="gray" />,
  },
  twitter: {
    name: "X",
    icon: <Icons.X className="h-5 w-5 md:h-4 md:w-4" color="gray" />,
  },
  github: {
    name: "GitHub",
    icon: <Icons.Github className="h-5 w-5 md:h-4 md:w-4" color="gray" />,
  },
  telegram: {
    name: "Telegram",
    icon: <Icons.Telegram className="h-5 w-5 md:h-4 md:w-4" color="gray" />,
  },
};

type SocialKind = keyof typeof SOCIALS_VALUES;

export const SOCIALS_ORDER: SocialKind[] = [
  "website",
  "discord",
  "twitter",
  "github",
  "telegram",
];

export function buildSocials(
  socials: Partial<Record<SocialKind, string>>,
  website?: string,
): SocialItem[] {
  const result: SocialItem[] = [];
  for (const kind of SOCIALS_ORDER) {
    const val = kind === "website" ? website : socials[kind];
    if (!val) continue;
    result.push({
      ...SOCIALS_VALUES[kind],
      href: val,
    });
  }
  return result;
}

export function AllocatorAgentItem(props: Readonly<AgentCardProps>) {
  const {
    agentKey,
    iconUrl,
    currentBlock,
    shortDescription,
    socialsList,
    title,
  } = props;

  const socialsMapped = buildSocials(socialsList, socialsList.website);

  return (
    <Card
      className={"w-full border bg-gradient-to-t from-[#0A0B13] to-background p-6 transition duration-300"}
    >
      <div
        className={"flex w-full flex-col items-center gap-6 md:flex-row md:gap-3"}
      >
        {iconUrl ? (
          <Image
            src={iconUrl}
            alt="agent"
            width={1000}
            height={1000}
            className={"aspect-square rounded-sm shadow-xl md:h-32 md:w-32"}
          />
        ) : (
          <div className="flex aspect-square h-full w-full items-center justify-center rounded-sm border bg-gray-500/10 shadow-xl md:h-32 md:w-32">
            <Icons.Logo className="h-36 w-36 opacity-30 md:h-20 md:w-20" />
          </div>
        )}

        <div className="flex h-full w-full flex-col justify-between gap-3">
          <div className="justify-betweed flex w-fit items-center gap-4">
            <div className="flex gap-2">
              {socialsMapped.map((social) => {
                return (
                  <Link key={social.name} target="_blank" href={social.href}>
                    {social.icon}
                  </Link>
                );
              })}
            </div>
          </div>
          <h2
            className={"w-fit text-ellipsis text-base font-semibold md:max-w-fit"}
          >
            {title}
          </h2>
        </div>
      </div>

      <div className="mt-2 flex items-center justify-between gap-3 border px-4">
        <Label className={"flex items-center gap-1.5 text-base font-semibold"}>
          <Anvil size={16} />
          10%
        </Label>

        <Label className={"flex items-center gap-1.5 text-base font-semibold"}>
          <Cuboid size={16} />
          {currentBlock}
        </Label>

        <CopyButton
          variant="link"
          type="button"
          copy={agentKey}
          className={"text-foreground-muted flex items-center gap-1.5 px-0 hover:text-muted-foreground hover:no-underline"}
        >
          <IdCard size={16} />
          <span className="hidden md:block">{smallAddress(agentKey, 7)}</span>
          <span className="block md:hidden">{smallAddress(agentKey, 6)}</span>
        </CopyButton>
      </div>

      <div className="mt-4 flex flex-col gap-2">
        <p className="text-sm md:min-h-16">{shortDescription}</p>
        <div>
          <Label className="mt-2 flex items-center gap-1.5 text-sm font-semibold">
            <span className="text-cyan-500">10%</span> Current Network
            Allocation
          </Label>
          <div className="rounded-radius my-2 w-full bg-primary-foreground">
            <div
              className="rounded-radius bg-gradient-to-r from-blue-700 to-cyan-500 py-2"
              style={{
                width: "10%",
              }}
            />
          </div>
        </div>

        <div className="flex w-full flex-col gap-2 md:flex-row">
          <Button
            type="button"
            variant="outline"
            className={"flex w-fit items-center gap-2 border-cyan-500 bg-transparent text-cyan-500 text-white transition duration-200 hover:bg-cyan-500/10 hover:text-cyan-500"}
          >
            <ChartPie className={"h-6 w-6"} />
            Allocate
          </Button>

          <Button
            type="button"
            variant="outline"
            className="w-full border-gray-500"
          >
            View More <ArrowRight className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
