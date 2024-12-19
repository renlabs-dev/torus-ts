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

import { useDelegateModuleStore } from "~/stores/delegateModuleStore";
import { api } from "~/trpc/react";
import { separateTopNModules } from "./components/charts/_common";
// import { CombinedAreaChart } from "./components/charts/combined-area-chart";
import { ModuleBarChart } from "./components/charts/module-bar-chart";
import { DelegatedScroll } from "./components/delegated-scroll";
import { StatsCard } from "./components/stats-card";

const TOP_MODULES_NUM = 7;

function _repeatUntil<T>(total: number, xs: T[]) {
  const result: T[] = [];
  for (let i = 0; i < total; i++) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    result.push(xs[i % xs.length]!);
  }
  return result;
}

export default function Page() {
  const pathname = usePathname();
  const { selectedAccount } = useTorus();

  // Modules Logic
  const { delegatedModules } = useDelegateModuleStore();

  const { data: modules } = api.module.all.useQuery();
  const { data: computedWeightedModules } =
    api.module.allComputedModuleWeightsLastBlock.useQuery();

  const moduleStakeData = computedWeightedModules
    ? separateTopNModules(TOP_MODULES_NUM)(computedWeightedModules)
        // .sort((a, b) => Number(b.stakeWeight - a.stakeWeight))
        .map((module) => {
          return {
            moduleName: module.moduleName ?? "",
            stakeWeight: String(module.stakeWeight),
            percWeight: module.percWeight,
            percFormat: `${(module.percWeight * 100).toFixed(1)} %`,
          };
        })
    : null;

  const delegatedModulesData = delegatedModules.map((module) => ({
    name: module.name,
    percentage: module.percentage,
  }));

  return (
    <div className="min-h-[calc(100vh-169px)]">
      <Container>
        <div className="my-20 flex w-full flex-col gap-3 pb-4 text-gray-100">
          <h3 className="inline-flex w-fit animate-fade-down border border-white/20 bg-[#898989]/5 px-2 py-0.5 animate-delay-100 md:text-xl">
            Welcome to the Community Validator
          </h3>
          <h1 className="animate-fade-down text-2xl font-semibold animate-delay-500 md:text-4xl">
            Interact with modules, validators and subnets created by the{" "}
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
              <Link href="/modules">Go to Modules view</Link>
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
              text="Total Modules"
              value={`${modules?.length ? modules.length : 0}`}
              color="green"
            />
            <StatsCard
              Icon={Grid2x2Plus}
              text="Your Modules"
              value={`${delegatedModules.length}`}
              color="green"
            />
          </div>
          <div className="mb-4 hidden border-l border-white/20 md:block" />
        </div>
        <div className="gird-cols-1 grid w-full animate-fade-down gap-3 pb-3 animate-delay-[650ms] md:grid-cols-3">
          {moduleStakeData && moduleStakeData.length > 0 ? (
            <ModuleBarChart chartData={moduleStakeData} />
          ) : (
            <Card className="h-full w-full animate-pulse" />
          )}
          <div className="p flex h-fit w-full animate-fade-down flex-col gap-3 animate-delay-700">
            <Card className="min-h-full w-full">
              <CardHeader className="flex flex-col items-end justify-between md:flex-row">
                <CardTitle>Your Selected Modules</CardTitle>
                <Link href="/modules" className="hover:text-green-500">
                  Edit Your Module List
                </Link>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                {selectedAccount && delegatedModulesData.length ? (
                  <DelegatedScroll data={delegatedModulesData} />
                ) : (
                  <p className="h-28">
                    {delegatedModulesData.length
                      ? "Connect your wallet to view your modules."
                      : "You have not selected any modules."}
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
