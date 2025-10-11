"use client";

import { Button } from "@torus-ts/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@torus-ts/ui/components/card";
import { Container } from "~/app/_components/container";
import { LoadingDots } from "~/app/_components/loading-dots";
import { useAuthStore } from "~/lib/auth-store";
import { ArrowLeft, User } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import React, { Suspense } from "react";
import { ComparisonEmpty } from "./components/comparison-empty";
import { ComparisonGrid } from "./components/comparison-grid";
import { ComparisonSelector } from "./components/comparison-selector";

function ComparisonPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [selectedAgents, setSelectedAgents] = React.useState<string[]>([]);
  const [searchFilters, setSearchFilters] = React.useState({
    from: undefined as Date | undefined,
    to: undefined as Date | undefined,
    limit: 10,
    offset: 0,
  });

  React.useEffect(() => {
    const agentsParam = searchParams.get("agents");
    if (agentsParam) {
      try {
        const agents = JSON.parse(decodeURIComponent(agentsParam)) as unknown;
        if (Array.isArray(agents)) {
          setSelectedAgents(agents);
        }
      } catch (error) {
        console.error("Error parsing agents from URL:", error);
      }
    }
  }, [searchParams]);

  const handleAgentsChange = React.useCallback(
    (agents: string[]) => {
      setSelectedAgents(agents);

      const params = new URLSearchParams(searchParams.toString());
      if (agents.length > 0) {
        params.set("agents", encodeURIComponent(JSON.stringify(agents)));
      } else {
        params.delete("agents");
      }

      const newSearch = params.toString();
      router.push(newSearch ? `?${newSearch}` : "/comparison", {
        scroll: false,
      });
    },
    [router, searchParams],
  );

  const addAgent = React.useCallback(
    (agentAddress: string) => {
      if (!selectedAgents.includes(agentAddress) && selectedAgents.length < 4) {
        handleAgentsChange([...selectedAgents, agentAddress]);
      }
    },
    [selectedAgents, handleAgentsChange],
  );

  const removeAgent = React.useCallback(
    (agentAddress: string) => {
      handleAgentsChange(
        selectedAgents.filter((agent) => agent !== agentAddress),
      );
    },
    [selectedAgents, handleAgentsChange],
  );

  if (!isAuthenticated) {
    return (
      <div className="flex flex-1 flex-col">
        <div className="flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-6 p-4 md:p-6">
            <div className="flex items-center justify-center py-8">
              <LoadingDots size="lg" className="text-muted-foreground" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Card className="animate-in fade-in slide-in-from-top-10 fill-mode-both mb-12 w-full border-none p-0 delay-200 duration-1000">
      <CardHeader className="border-border flex items-center border-y pt-6">
        <div className="mx-auto flex w-full max-w-screen-xl flex-col gap-6">
          <div className="animate-in fade-in slide-in-from-bottom-10 duration-600 delay-400 fill-mode-both flex flex-col gap-4 pb-2 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="flex flex-col items-start text-2xl">
              Agent Comparison
              <div className="text-muted-foreground flex flex-row gap-2 text-sm">
                Add up to 4 agents to compare their performance metrics
              </div>
            </CardTitle>
            <div className="animate-in fade-in slide-in-from-bottom-10 duration-600 delay-600 fill-mode-both flex justify-end gap-3">
              <Link href="/agents" className="w-full">
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  className="w-full"
                >
                  <User className="h-4 w-4" />
                  <span className="max-w-[120px] truncate sm:max-w-none">
                    Agents
                  </span>
                </Button>
              </Link>
              <Link href="/dashboard" className="w-full">
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  className="w-full"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span className="max-w-[120px] truncate sm:max-w-none">
                    Dashboard
                  </span>
                </Button>
              </Link>
            </div>
          </div>
          <div className="animate-in fade-in slide-in-from-bottom-10 duration-600 delay-800 fill-mode-both">
            <ComparisonSelector
              selectedAgents={selectedAgents}
              onAddAgent={addAgent}
              onRemoveAgent={removeAgent}
              searchFilters={searchFilters}
              onFiltersChange={(filters) =>
                setSearchFilters({
                  from: filters.from,
                  to: filters.to,
                  limit: filters.limit || 10,
                  offset: filters.offset || 0,
                })
              }
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Container>
          {selectedAgents.length > 0 ? (
            <div className="animate-in fade-in slide-in-from-bottom-10 fill-mode-both delay-1000 duration-1000">
              <ComparisonGrid
                selectedAgents={selectedAgents}
                searchFilters={searchFilters}
              />
            </div>
          ) : (
            <div className="animate-in fade-in slide-in-from-bottom-10 fill-mode-both w-full delay-1000 duration-1000">
              <ComparisonEmpty />
            </div>
          )}
        </Container>
      </CardContent>
    </Card>
  );
}

function ComparisonPageFallback() {
  return (
    <div className="flex flex-1 flex-col">
      <div className="flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-6 p-4 md:p-6">
          <div className="flex items-center justify-center py-8">
            <LoadingDots size="lg" className="text-muted-foreground" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ComparisonPage() {
  return (
    <Suspense fallback={<ComparisonPageFallback />}>
      <ComparisonPageContent />
    </Suspense>
  );
}
