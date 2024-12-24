"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Grid2X2, Grid2x2Plus } from "lucide-react";

import { useTorus } from "@torus-ts/torus-provider";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Container,
  Label,
  Separator,
} from "@torus-ts/ui";

import { useDelegateAgentStore } from "~/stores/delegateAgentStore";
import { api } from "~/trpc/react";
import { separateTopNAgents } from "./components/charts/_common";
import { AgentBarChart } from "./components/charts/agent-bar-chart";
import { DelegatedScroll } from "./components/delegated-scroll";
import { StatsCard } from "./components/stats-card";

const TOP_MODULES_NUM = 7;

export default function Page() {
  const pathname = usePathname();
  const { selectedAccount } = useTorus();

  // Agents Logic
  const { delegatedAgents } = useDelegateAgentStore();

  const { data: agents } = api.agent.all.useQuery();
  const { data: computedWeightedAgents } =
    api.computedAgentWeight.all.useQuery();

  const agentStakeData = computedWeightedAgents
    ? separateTopNAgents(TOP_MODULES_NUM)(computedWeightedAgents)
        // .sort((a, b) => Number(b.computedWeight - a.computedWeight))
        .map((agent) => {
          return {
            agentName: agent.agentName ?? "",
            computedWeight: String(agent.computedWeight),
            percComputedWeight: agent.percComputedWeight,
            percFormat: `${(agent.percComputedWeight * 100).toFixed(1)} %`,
          };
        })
    : null;

  const delegatedAgentsData = delegatedAgents.map((agent) => ({
    name: agent.name,
    percentage: agent.percentage,
  }));

  return (
    <div className="min-h-[calc(100vh-169px)]">
      <Container>
        <div className="my-20 flex w-full flex-col gap-3 pb-4 text-gray-100">
          <h3 className="inline-flex w-fit animate-fade-down border border-white/20 bg-[#898989]/5 px-2 py-0.5 animate-delay-100 md:text-xl">
            Welcome to the Community Validator
          </h3>
          <h1 className="animate-fade-down text-2xl font-semibold animate-delay-500 md:text-4xl">
            Interact with agents, validators and subnets created by the{" "}
            <span
              className={`${pathname === "/subnets" || pathname === "/weighted-subnets" ? "text-cyan-500" : "text-green-500"}`}
            >
              community
            </span>
            .
          </h1>
        </div>
        <div className="mb-4 flex w-full flex-col border-b border-white/20 text-center md:flex-row md:gap-3">
          <div className="flex w-full animate-fade-down flex-col gap-4 pb-4 animate-delay-300 md:flex-row">
            <Button size="lg" className="w-full" asChild>
              <Link href="/agents">Go to Agents view</Link>
            </Button>
          </div>
          <div className="mb-4 hidden border-l border-white/20 md:block" />
          <div className="flex w-full animate-fade-down flex-col gap-4 pb-4 animate-delay-300 md:flex-row">
            <Button
              asChild
              size="lg"
              className="w-full hover:border-cyan-500 hover:bg-background-cyan hover:text-cyan-500 active:bg-cyan-500/30"
            >
              <Link href="/subnets">Go to Subnets view</Link>
            </Button>
          </div>
        </div>
        <div className="mb-4 flex w-full flex-col border-b border-white/20 md:flex-row md:gap-3">
          <div className="flex w-full animate-fade-down flex-col gap-4 pb-4 animate-delay-500 md:flex-row">
            <StatsCard
              Icon={Grid2X2}
              text="Total Agents"
              value={`${agents?.length ? agents.length : 0}`}
              color="green"
            />
            <StatsCard
              Icon={Grid2x2Plus}
              text="Your Agents"
              value={`${delegatedAgents.length}`}
              color="green"
            />
          </div>
          <div className="mb-4 hidden border-l border-white/20 md:block" />
        </div>
        <div className="gird-cols-1 grid w-full animate-fade-down gap-3 pb-3 animate-delay-[650ms] md:grid-cols-3">
          {agentStakeData && agentStakeData.length > 0 ? (
            <AgentBarChart chartData={agentStakeData} />
          ) : (
            <Card className="h-full w-full animate-pulse" />
          )}
          <div className="p flex h-fit w-full animate-fade-down flex-col gap-3 animate-delay-700">
            <Card className="min-h-full w-full">
              <CardHeader className="flex flex-col items-end justify-between md:flex-row">
                <CardTitle>Your Selected Agents</CardTitle>
                <Link href="/agents" className="hover:text-green-500">
                  Edit Your Agent List
                </Link>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                {selectedAccount && delegatedAgentsData.length ? (
                  <DelegatedScroll data={delegatedAgentsData} />
                ) : (
                  <p className="h-28">
                    {delegatedAgentsData.length
                      ? "Connect your wallet to view your agents."
                      : "You have not selected any agents."}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
        <Separator className="mb-3" />
        <Card className="mb-3 flex w-full animate-fade-down flex-col items-center justify-between gap-3 p-4 animate-delay-[650ms] md:flex-row">
          <Label>
            Feeling lost? Check out our tutorial on how to get started with the{" "}
            <Link href="/tutorial" className="text-green-500">
              Community Validator
            </Link>
            :
          </Label>
          <Button variant="link" className="w-full md:w-fit" asChild>
            <Link href="/tutorial">Get Started!</Link>
          </Button>
        </Card>
      </Container>
    </div>
  );
}
