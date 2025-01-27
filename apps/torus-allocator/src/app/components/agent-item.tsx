"use client";

import { useEffect, useState } from "react";

import { Anvil, ArrowRight, Globe, IdCard } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { toast } from "@torus-ts/toast-provider";
import {
  Badge,
  Button,
  Card,
  CopyButton,
  Icons,
  Label,
  Separator,
} from "@torus-ts/ui";
import type { Nullish } from "@torus-ts/utils";
import { smallAddress } from "@torus-ts/utils/subspace";

import { useQueryAgentMetadata } from "~/hooks/use-agent-metadata";
import { useDelegateAgentStore } from "~/stores/delegateAgentStore";

import { DelegateModuleWeight } from "./delegate-module-weight";

interface AgentCardProps {
  id: number;
  name: string;
  agentKey: string;
  metadataUri: string | null;
  percentage?: number | null;
  isDelegated?: boolean;
  globalWeightPerc?: number;
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
    icon: <Icons.discord className="h-5 w-5 md:h-4 md:w-4" color="gray" />,
  },
  twitter: {
    name: "X",
    icon: <Icons.x className="h-5 w-5 md:h-4 md:w-4" color="gray" />,
  },
  github: {
    name: "GitHub",
    icon: <Icons.github className="h-5 w-5 md:h-4 md:w-4" color="gray" />,
  },
  telegram: {
    name: "Telegram",
    icon: <Icons.telegram className="h-5 w-5 md:h-4 md:w-4" color="gray" />,
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

const useBlobUrl = (blob: Blob | Nullish) => {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!blob) return;
    const objectUrl = URL.createObjectURL(blob);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [blob]);

  return url;
};

export function AgentItem(props: AgentCardProps) {
  const { agentKey, metadataUri } = props;

  const { delegatedAgents } = useDelegateAgentStore();

  const { data: agentMetadataResult } = useQueryAgentMetadata(metadataUri);
  const metadata = agentMetadataResult?.metadata;
  const images = agentMetadataResult?.images;

  const iconUrl = useBlobUrl(images?.icon);

  const title = metadata?.title ?? `Missing Agent Title ${props.name}`;
  const shortDescription =
    metadata?.short_description ?? "Missing Agent Short Description";

  const isAgentDelegated = delegatedAgents.some((a) => a.address === agentKey);

  const socialsList = buildSocials(metadata?.socials ?? {}, metadata?.website);

  return (
    <Card
      className={`border bg-gradient-to-t from-[#0A0B13] to-background p-6 transition duration-300 hover:scale-[101%] hover:shadow-2xl`}
    >
      <div
        className={`flex w-full flex-col items-center gap-6 md:flex-row md:gap-3`}
      >
        {iconUrl ? (
          <Image
            src={iconUrl}
            alt="agent"
            width={1000}
            height={1000}
            className={`aspect-square rounded-sm shadow-xl md:h-36 md:w-36`}
          />
        ) : (
          <div className="flex aspect-square h-full w-full items-center justify-center rounded-sm border bg-gray-500/10 shadow-xl md:h-36 md:w-36">
            <Icons.logo className="h-36 w-36 opacity-30 md:h-20 md:w-20" />
          </div>
        )}

        <div className="flex h-full w-full flex-col justify-between gap-3">
          <div className="flex w-full items-center justify-between gap-4">
            <div className="flex gap-2">
              {socialsList.map((social) => {
                return (
                  <Link key={social.name} href={social.href}>
                    {social.icon}
                  </Link>
                );
              })}
            </div>
            {isAgentDelegated && (
              <Badge className="border-blue-500 bg-blue-500/10 text-blue-500 hover:bg-blue-500/10">
                Delegated
              </Badge>
            )}
          </div>
          <h2
            className={`w-fit text-ellipsis text-base font-semibold md:max-w-fit`}
          >
            {title}
          </h2>
          <div className="flex items-center justify-between gap-3">
            <Label
              className={`flex items-center gap-1.5 text-base font-semibold`}
            >
              <Anvil size={16} />
              {props.percentage}%
            </Label>

            <CopyButton
              variant="link"
              copy={props.agentKey}
              notify={() => toast.success("Copied to clipboard")}
              className={`text-foreground-muted flex items-center gap-1.5 px-0 hover:text-muted-foreground hover:no-underline`}
            >
              <IdCard size={16} />
              <span className="hidden md:block">
                {smallAddress(props.agentKey, 10)}
              </span>
              <span className="block md:hidden">
                {smallAddress(props.agentKey, 6)}
              </span>
            </CopyButton>
          </div>
        </div>
      </div>

      <Separator className="my-4" />

      <div className="mt-4 flex flex-col gap-2">
        <p className="text-sm md:min-h-16">{shortDescription}</p>
        <div>
          <Label className="mt-2 flex items-center gap-1.5 text-sm font-semibold">
            <span className="text-blue-500">{props.globalWeightPerc}%</span>{" "}
            Current Network Allocation
          </Label>
          <div className="rounded-radius my-2 w-full bg-primary-foreground">
            <div
              className="rounded-radius bg-gradient-to-r from-blue-700 to-blue-500 py-2"
              style={{
                width: `${props.globalWeightPerc?.toFixed(0)}%`,
              }}
            />
          </div>
        </div>

        <div className="flex w-full flex-col gap-2 md:flex-row">
          <DelegateModuleWeight
            id={props.id}
            name={props.name}
            agentKey={props.agentKey}
            metadataUri={metadataUri}
            className="w-full"
          />

          <Button asChild variant="outline" className="w-full border-gray-500">
            <Link href={`agent/${props.agentKey}`}>
              View More <ArrowRight className="h-5 w-5" />
            </Link>
          </Button>
        </div>
      </div>
    </Card>
  );
}
