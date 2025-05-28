"use client";

import { smallAddress } from "@torus-network/torus-utils/subspace";
import { Anvil, Globe, Cuboid, IdCard } from "lucide-react";
import Link from "next/link";
import { Icons } from "@torus-ts/ui/components//icons";
import { Card } from "@torus-ts/ui/components/card";
import { Label } from "@torus-ts/ui/components/label";
import { CopyButton } from "@torus-ts/ui/components/copy-button";
import { PortalAgentImageItem } from "./portal-agent-image-item";

interface PortalAgentCardProps {
  agentKey: string | null;
  currentBlock?: number | null;
  title: string;
  iconUrl: string | null;
  socialsList: Partial<Record<SocialKind, string>>;
  agentWeight: number;
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
    result.push({ ...SOCIALS_VALUES[kind], href: val });
  }
  return result;
}

export function PortalAgentItem(props: Readonly<PortalAgentCardProps>) {
  const { agentKey, iconUrl, currentBlock, socialsList, title, agentWeight } =
    props;

  const socialsMapped = buildSocials(socialsList, socialsList.website);
  if (!agentKey) return null;

  return (
    <Card
      className={`w-full border bg-gradient-to-t from-[#0A0B13] to-background p-6 transition
        duration-300`}
    >
      <div
        className={
          "flex w-full flex-col items-center gap-6 md:flex-row md:gap-3"
        }
      >
        <PortalAgentImageItem iconUrl={iconUrl} />

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
            className={
              "w-fit text-ellipsis text-base font-semibold md:max-w-fit"
            }
          >
            {title}
          </h2>
        </div>
      </div>

      <div className="mt-2 text-sm flex items-center justify-between gap-3 border px-4">
        <Label className={"flex items-center gap-1.5 text-sm font-semibold"}>
          <Anvil size={14} />
          {agentWeight}%
        </Label>

        <Label className={"flex items-center gap-1.5 text-sm font-semibold"}>
          <Cuboid size={14} />
          {currentBlock}
        </Label>

        <CopyButton
          variant="link"
          type="button"
          copy={agentKey}
          className={`text-foreground-muted flex items-center gap-1.5 px-0 hover:text-muted-foreground
            hover:no-underline`}
        >
          <IdCard size={16} />
          {/* <span className="hidden md:block">{smallAddress(agentKey, 5)}</span>
          <span className="block md:hidden">{smallAddress(agentKey, 4)}</span> */}
        </CopyButton>
      </div>
    </Card>
  );
}
