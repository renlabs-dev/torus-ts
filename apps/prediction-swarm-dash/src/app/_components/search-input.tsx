"use client";

import { Button } from "@torus-ts/ui/components/button";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@torus-ts/ui/components/command";
import { Input } from "@torus-ts/ui/components/input";
import { useIsMobile } from "@torus-ts/ui/hooks/use-mobile";
import { useToast } from "@torus-ts/ui/hooks/use-toast";
import { cn } from "@torus-ts/ui/lib/utils";
import { useAddProphetMutation } from "~/hooks/api/use-add-prophet-mutation";
import { useAgentContributionStatsQuery } from "~/hooks/api/use-agent-contribution-stats-query";
import { useAgentName } from "~/hooks/api/use-agent-name-query";
import { useProphetProfilesSearchQuery } from "~/hooks/api/use-prophet-profiles-search-query";
import { useUsernamesSearchQuery } from "~/hooks/api/use-usernames-search-query";
import { formatAddress } from "~/lib/api-utils";
import { Check, Clock, SearchIcon, User } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import React, { useCallback, useMemo, useState } from "react";
import { BorderContainer } from "./border-container";
import { LoadingDots } from "./loading-dots";
import Silk from "./silk-animation";

interface AgentItemProps {
  address: string;
  isSelected: boolean;
  onSelect: () => void;
  searchTerm: string;
  predictions: number;
  claims: number;
  verdicts: number;
}

function AgentItem({
  address,
  isSelected,
  onSelect,
  searchTerm,
  predictions,
  claims,
  verdicts,
}: AgentItemProps) {
  const { agentName } = useAgentName(address);

  const matchesSearch =
    !searchTerm ||
    agentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    address.toLowerCase().includes(searchTerm.toLowerCase());

  if (!matchesSearch) return null;

  return (
    <CommandItem
      key={address}
      value={address}
      onSelect={onSelect}
      className="flex cursor-pointer items-center justify-between"
      data-predictions={predictions}
      data-claims={claims}
      data-verdicts={verdicts}
    >
      <div className="flex items-center gap-2">
        <Check
          className={cn("h-4 w-4", isSelected ? "opacity-100" : "opacity-0")}
        />
        <div className="flex flex-col">
          <span>{agentName}</span>
          <span className="text-muted-foreground">
            {formatAddress(address)}
          </span>
        </div>
      </div>

      <div className="text-muted-foreground flex items-center gap-3">
        <span title="Predictions">{predictions}P</span>
        <span title="Claims">{claims}C</span>
        <span title="Verdicts">{verdicts}V</span>
      </div>
    </CommandItem>
  );
}

interface SearchInputProps {
  onValueChange?: (address: string) => void;
  placeholder?: string;
  excludeAgents?: string[];
}

export function SearchInput({
  onValueChange,
  placeholder = "Search for any agent in the swarm...",
  excludeAgents = [],
}: SearchInputProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const isMobile = useIsMobile();
  const { toast } = useToast();

  const [showCommand, setShowCommand] = useState(false);
  const [search, setSearch] = useState("");

  const addProphetMutation = useAddProphetMutation();

  // Get all agents from contribution stats
  const { data: statsData, isLoading: statsLoading } =
    useAgentContributionStatsQuery();

  // Search for usernames (only when user has typed >= 2 characters)
  const { data: usernames, isLoading: usernamesLoading } =
    useUsernamesSearchQuery(search);

  // Search for prophet profiles (to show processing accounts)
  const { data: prophetProfiles, isLoading: prophetProfilesLoading } =
    useProphetProfilesSearchQuery(search);

  // Process agents list

  const agents = useMemo(() => {
    if (!statsData?.agent_contribution_stats) return [];

    return statsData.agent_contribution_stats
      .map((agent) => ({
        address: agent.wallet_address,
        predictions: agent.num_predictions_submitted,
        claims: agent.num_verification_claims_submitted,
        verdicts: agent.num_verification_verdicts_submitted,
      }))
      .filter((agent) => !excludeAgents.includes(agent.address))
      .sort((a, b) => b.predictions - a.predictions);
  }, [statsData, excludeAgents]);

  // Identify processing profiles (in prophet-finder but not in predictions)
  const processingProfiles = useMemo(() => {
    if (!prophetProfiles || !usernames) return [];

    const usernamesSet = new Set(
      usernames.map((u) => u.username.toLowerCase()),
    );
    return prophetProfiles.filter(
      (profile) => !usernamesSet.has(profile.username.toLowerCase()),
    );
  }, [prophetProfiles, usernames]);

  // Check if searched username exists anywhere
  const searchedUsernameExists = useMemo(() => {
    const cleanSearch = search.toLowerCase().replace(/^@/, "");
    if (cleanSearch.length < 2) return false;

    const inPredictions = usernames?.some(
      (u) => u.username.toLowerCase() === cleanSearch,
    );
    const inProphetFinder = prophetProfiles?.some(
      (p) => p.username.toLowerCase() === cleanSearch,
    );

    return inPredictions || inProphetFinder;
  }, [search, usernames, prophetProfiles]);

  const isLoading =
    statsLoading ||
    (search.length >= 2 && (usernamesLoading || prophetProfilesLoading));

  const handleInputClick = () => {
    setShowCommand(true);
  };

  const handleAskSwarmClick = () => {
    setShowCommand(true);
  };

  const handleAddToMemory = useCallback(async () => {
    if (!search.trim()) return;

    try {
      await addProphetMutation.mutateAsync({
        username: search.trim(),
      });

      toast({
        title: "Prophet added successfully!",
        description: `@${search.trim().replace(/^@/, "")} has been queued for scraping.`,
      });

      setShowCommand(false);
      setSearch("");
    } catch (error) {
      toast({
        title: "Failed to add prophet",
        description:
          error instanceof Error
            ? error.message
            : "An error occurred while adding the prophet to memory.",
        variant: "destructive",
      });
    }
  }, [search, addProphetMutation, toast]);

  const [selectedAgent, setSelectedAgent] = React.useState<string>(
    pathname === "/agents" ? searchParams.get("agent") || "" : "",
  );
  const [selectedUsername, setSelectedUsername] = React.useState<string>(
    pathname === "/prophet" ? searchParams.get("username") || "" : "",
  );

  const handleAgentChange = useCallback(
    (agentAddress: string) => {
      setSelectedAgent(agentAddress);
      setSelectedUsername("");

      if (agentAddress) {
        router.push(`/agents?agent=${encodeURIComponent(agentAddress)}`, {
          scroll: false,
        });
      } else {
        router.push("/agents", { scroll: false });
      }
    },
    [router],
  );

  const { agentName } = useAgentName(selectedAgent);

  React.useEffect(() => {
    if (pathname === "/agents") {
      const agentParam = searchParams.get("agent");
      if (agentParam !== selectedAgent) {
        setSelectedAgent(agentParam || "");
        setSelectedUsername("");
      }
    } else if (pathname === "/prophet") {
      const usernameParam = searchParams.get("username");
      if (usernameParam !== selectedUsername) {
        setSelectedUsername(usernameParam || "");
        setSelectedAgent("");
      }
    } else {
      setSelectedAgent("");
      setSelectedUsername("");
    }
  }, [pathname, searchParams, selectedAgent, selectedUsername]);

  const effectivePlaceholder = useMemo(() => {
    if (selectedAgent && agentName) {
      return `Selected Agent: ${agentName}`;
    }
    if (selectedUsername) {
      return `Selected Account: @${selectedUsername}`;
    }
    return isMobile ? "Search accounts or tickers..." : placeholder;
  }, [selectedAgent, agentName, selectedUsername, placeholder, isMobile]);

  return (
    <>
      <CommandDialog open={showCommand} onOpenChange={setShowCommand}>
        <CommandInput
          placeholder="Search agents..."
          value={search}
          onValueChange={setSearch}
        />
        <CommandList>
          <CommandEmpty className="py-6 text-center">
            {isLoading ? (
              <div className="flex items-center justify-center gap-2">
                <LoadingDots size="sm" />
                <span>Loading agents / prophet accounts...</span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <span>No agents or prophet accounts found.</span>
                {search.length >= 2 && !searchedUsernameExists && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAddToMemory}
                    disabled={addProphetMutation.isPending}
                    className="gap-2"
                  >
                    {addProphetMutation.isPending
                      ? "Adding..."
                      : "Add to Memory"}
                  </Button>
                )}
                {search.length >= 2 && searchedUsernameExists && (
                  <span className="text-muted-foreground text-sm">
                    This account has already been added
                  </span>
                )}
              </div>
            )}
          </CommandEmpty>

          {!isLoading && (
            <>
              {/* Twitter Accounts Group */}
              {usernames && usernames.length > 0 && (
                <CommandGroup heading="Twitter Accounts">
                  {usernames.map((account) => (
                    <CommandItem
                      key={account.username}
                      value={account.username}
                      onSelect={() => {
                        router.push(
                          `/prophet?username=${encodeURIComponent(account.username)}`,
                          { scroll: false },
                        );
                        setShowCommand(false);
                        setSearch("");
                      }}
                      className="flex cursor-pointer items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        <div className="flex flex-col">
                          <span className="text-muted-foreground">
                            @{account.username}
                          </span>
                        </div>
                      </div>
                      <div className="text-muted-foreground flex items-center gap-3 text-xs">
                        <span title="Predictions">
                          {account.predictions_count} predictions
                        </span>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {/* Processing Accounts Group */}
              {processingProfiles.length > 0 && (
                <CommandGroup heading="Processing Accounts">
                  {processingProfiles.map((profile) => (
                    <CommandItem
                      key={profile.username}
                      value={profile.username}
                      disabled
                      className="flex cursor-default items-center justify-between opacity-60"
                    >
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <div className="flex flex-col">
                          <span className="text-muted-foreground">
                            @{profile.username}
                          </span>
                          <span className="text-muted-foreground text-xs">
                            Being scraped...
                          </span>
                        </div>
                      </div>
                      <div className="text-muted-foreground flex items-center gap-3 text-xs">
                        <span title="Scraping progress">
                          {profile.scraped_tweet_count}/
                          {profile.profile_tweet_count} tweets
                        </span>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {/* Agents Group */}
              <CommandGroup heading="Agents">
                {agents.map((agent) => (
                  <AgentItem
                    key={agent.address}
                    address={agent.address}
                    isSelected={selectedAgent === agent.address}
                    searchTerm={search}
                    predictions={agent.predictions}
                    claims={agent.claims}
                    verdicts={agent.verdicts}
                    onSelect={() => {
                      const newValue =
                        agent.address === selectedAgent ? "" : agent.address;
                      handleAgentChange(newValue);
                      if (onValueChange) {
                        onValueChange(newValue);
                      }
                      setShowCommand(false);
                      setSearch("");
                    }}
                  />
                ))}
              </CommandGroup>
            </>
          )}
        </CommandList>
      </CommandDialog>

      <BorderContainer>
        <div className="relative flex flex-1 items-center justify-center px-[8%] md:px-0">
          <div className="border-border relative w-full border-x sm:border-none">
            <SearchIcon className="text-muted-foreground absolute left-4 top-1/2 z-10 h-5 w-5 -translate-y-1/2 transform sm:left-8" />
            <Input
              type="search"
              id="search"
              placeholder={effectivePlaceholder}
              value=""
              className="h-[4.25rem] w-full cursor-pointer rounded-none border-none pl-12 sm:pl-16"
              onClick={handleInputClick}
              readOnly
            />
          </div>
        </div>
        <Button
          type="submit"
          className="h-18 border-border relative hidden cursor-pointer overflow-hidden !rounded-none border-l bg-transparent px-16 text-white hover:bg-transparent md:flex"
          onClick={handleAskSwarmClick}
        >
          <span className="pointer-events-none relative z-10 text-base font-extralight tracking-[0.60em]">
            ASK TORUS
          </span>
          <div className="absolute inset-0 opacity-30 transition duration-200 hover:opacity-50">
            <Silk scale={0.5} speed={4} noiseIntensity={0} />
          </div>
        </Button>
      </BorderContainer>
    </>
  );
}
