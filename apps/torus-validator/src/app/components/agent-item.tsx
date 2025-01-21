"use client";

import { Anvil, ArrowRight, Crown, Globe, IdCard } from "lucide-react";
import { Button, Card, CopyButton, Icons, Label, links } from "@torus-ts/ui";
import { DelegateModuleWeight } from "./delegate-module-weight";
import { smallAddress } from "@torus-ts/utils/subspace";
import { toast } from "@torus-ts/toast-provider";
import { useDelegateAgentStore } from "~/stores/delegateAgentStore";
import Link from "next/link";
import Image from "next/image";

interface AgentCardProps {
  id: number;
  name: string;
  agentKey: string; // SS58.1
  percentage?: number | null;
  isDelegated?: boolean;
  globalWeightPerc?: number;
}

export function AgentItem(props: AgentCardProps) {
  const { delegatedAgents } = useDelegateAgentStore();
  const isAgentDelegated = delegatedAgents.some(
    (m) => m.address === props.agentKey,
  );

  const _socialList = [
    {
      name: "Discord",
      href: links.discord,
      icon: (
        <Icons.discord className="h-4 w-4 md:h-3.5 md:w-3.5" color="gray" />
      ),
    },
    {
      name: "X",
      href: links.x,
      icon: <Icons.x className="h-4 w-4 md:h-3.5 md:w-3.5" color="gray" />,
    },
    {
      name: "GitHub",
      href: links.github,
      icon: <Icons.github className="h-4 w-4 md:h-3.5 md:w-3.5" color="gray" />,
    },
    {
      name: "Telegram",
      href: links.telegram,
      icon: (
        <Icons.telegram className="h-4 w-4 md:h-3.5 md:w-3.5" color="gray" />
      ),
    },
    {
      name: "Website",
      href: links.landing_page,
      icon: <Globe className="h-4 w-4 md:h-3.5 md:w-3.5" color="gray" />,
    },
  ];

  return (
    <Card
      className={`border p-6 ${isAgentDelegated ? "border-blue-500 bg-blue-500/5" : "text-white"}`}
    >
      <div className="flex w-full items-center gap-3">
        <Image
          src="/agent-icon-example.png"
          alt="agent"
          width={1000}
          height={1000}
          className={`h-28 w-28 ${isAgentDelegated && "border border-blue-500"}`}
        />
        <div className="flex flex-col gap-2">
          <div className="flex justify-between">
            <h2
              className={`line-clamp-1 w-full max-w-fit text-ellipsis text-base font-semibold ${isAgentDelegated ? "text-blue-500" : "text-white"}`}
            >
              {props.name}
            </h2>
            <div className="flex gap-1.5">
              {_socialList.map((social) => {
                return (
                  <Link key={social.name} href={social.href}>
                    {social.icon}
                  </Link>
                );
              })}
            </div>
          </div>
          <p className="text-sm">
            Honza, perfect junior Dev Agent Of Torus. He is a developer and a
            designer.
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-2">
        <div className="flex flex-row-reverse items-center gap-3 border px-3 sm:ml-auto sm:flex-row md:ml-0 md:flex-row-reverse lg:flex-row">
          <Label className="flex items-center gap-1.5 text-base font-semibold">
            <IdCard size={16} />
            {props.id}
          </Label>

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
            <Crown className="h-6 w-6" />
            <span>{smallAddress(props.agentKey, 11)}</span>
          </CopyButton>
        </div>
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
            className="w-full"
          />

          <Button asChild variant="outline" className="w-full">
            <Link href={`agent/${props.agentKey}`}>
              View More <ArrowRight className="h-5 w-5" />
            </Link>
          </Button>
        </div>
      </div>
    </Card>
  );
}
