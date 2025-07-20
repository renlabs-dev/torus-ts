"use client";

import { Anvil, Cuboid, Globe, IdCard, Coins, DollarSign } from "lucide-react";
import Link from "next/link";

import { smallAddress } from "@torus-network/torus-utils/subspace";

import { Card } from "@torus-ts/ui/components/card";
import { CopyButton } from "@torus-ts/ui/components/copy-button";
import { Icons } from "@torus-ts/ui/components/icons";
import { Label } from "@torus-ts/ui/components/label";

import { useWeeklyUsdCalculation } from "~/hooks/use-weekly-usd";
import { AgentCardImage } from "./agent-card-image";

// Format weight to max 3 chars
function formatWeight(weight: number): string {
  if (weight === 0) return "0";
  if (weight >= 100) return "100";
  if (weight >= 10) return Math.round(weight).toString();
  if (weight >= 1) return Math.round(weight).toString();
  if (weight < 0.1) return "0";

  // For 0.1 to 0.99, show as 0.X
  const firstDecimal = Math.floor(weight * 10) % 10;
  return "0." + firstDecimal;
}

interface PortalAgentCardProps {
  agentKey: string | null;
  currentBlock?: number | null;
  title: string;
  shortDescription?: string;
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

export function AgentCard(props: Readonly<PortalAgentCardProps>) {
  const { agentKey, iconUrl, currentBlock, socialsList, title, shortDescription, agentWeight } =
    props;

  const socialsMapped = buildSocials(socialsList, socialsList.website);
  
  const { displayTokensPerWeek, displayUsdValue, isLoading: isWeeklyUsdLoading } = useWeeklyUsdCalculation({
    agentKey: agentKey || "",
    weightFactor: 0, // No weight penalty in portal
  });
  
  if (!agentKey) return null;

  return (
    <Card
      className={`w-full border bg-gradient-to-tr from-zinc-900 to-background p-6 transition
        duration-300`}
    >
      <div
        className={
          "flex w-full flex-col items-center gap-6 md:flex-row md:gap-3"
        }
      >
        <AgentCardImage iconUrl={iconUrl} />

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
          <div className="flex flex-col gap-1">
            <h2
              className={
                "w-fit text-ellipsis text-base font-semibold md:max-w-fit"
              }
            >
              {title}
            </h2>
            {shortDescription && (
              <p className="text-sm text-muted-foreground line-clamp-2 break-all">
                {shortDescription}
              </p>
            )}
          </div>
        </div>
      </div>

      <div
        className="mt-2 text-sm flex flex-wrap items-center justify-between gap-2 border px-2
          sm:px-4 py-1"
      >
        <Label
          className={"flex items-center gap-1 text-xs sm:text-sm font-semibold"}
        >
          <Anvil size={14} />
          <span>{formatWeight(agentWeight * 100)}%</span>
        </Label>

        <Label
          className={"flex items-center gap-1 text-xs sm:text-sm font-semibold"}
        >
          <Cuboid size={14} />
          <span>{currentBlock}</span>
        </Label>

        <CopyButton
          variant="link"
          type="button"
          copy={agentKey}
          className={`text-foreground-muted flex items-center gap-1 px-0 hover:text-muted-foreground
            hover:no-underline min-w-0`}
        >
          <IdCard size={14} className="shrink-0" />
          <span className="hidden sm:block">{smallAddress(agentKey, 5)}</span>
          <span className="block sm:hidden text-xs">
            {smallAddress(agentKey, 3)}
          </span>
        </CopyButton>
      </div>

      <div
        className="mt-2 text-sm flex flex-wrap items-center justify-between gap-2 border px-2
          sm:px-4 py-1"
      >
        <Label
          className={"flex items-center gap-1 text-xs sm:text-sm font-semibold"}
        >
          <Coins size={14} />
          <span>{isWeeklyUsdLoading ? "Loading..." : displayTokensPerWeek}</span>
        </Label>

        <Label
          className={"flex items-center gap-1 text-xs sm:text-sm font-semibold"}
        >
          <DollarSign size={14} />
          <span>{isWeeklyUsdLoading ? "Loading..." : displayUsdValue}</span>
        </Label>
      </div>
    </Card>
  );
}
