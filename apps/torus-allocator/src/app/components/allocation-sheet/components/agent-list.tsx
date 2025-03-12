import type { SS58Address } from "@torus-ts/subspace";
import { Button } from "@torus-ts/ui/components/button";
import { Input } from "@torus-ts/ui/components/input";
import { Label } from "@torus-ts/ui/components/label";
import { ScrollArea } from "@torus-ts/ui/components/scroll-area";
import { smallAddress } from "@torus-ts/utils/subspace";
import { X } from "lucide-react";
import { useState } from "react";
import { useDelegateAgentStore } from "~/stores/delegateAgentStore";

export function AgentList() {
  const { delegatedAgents, updatePercentage, getAgentPercentage, removeAgent } =
    useDelegateAgentStore();

  const [tempInputs, setTempInputs] = useState<
    Record<string, string | undefined>
  >({});

  const handleInputBlur = (agentKey: string | SS58Address) => {
    const value = tempInputs[agentKey];
    if (value !== undefined) {
      const percentage = Math.min(Math.max(Number(value), 0), 100);
      updatePercentage(agentKey, percentage);
      setTempInputs((prev) => ({ ...prev, [agentKey]: undefined }));
    }
  };

  const handlePercentageChange = (
    agentKey: string | SS58Address,
    value: string,
  ) => {
    const sanitizedValue = value.replace(/[^\d.]/g, "");
    setTempInputs((prev) => ({ ...prev, [agentKey]: sanitizedValue }));
  };

  return (
    <ScrollArea className="max-h-[calc(100vh-270px)] pr-3">
      <div className="flex flex-col gap-2">
        {delegatedAgents.length ? (
          delegatedAgents
            .slice()
            .sort((a, b) => a.address.localeCompare(b.address))
            .map((agent) => (
              <div
                key={agent.address}
                className={`border-muted-foreground/20 flex flex-col gap-1.5 border-b py-4 first:border-t last:border-b-0`}
              >
                <span className="font-medium">{agent.name}</span>

                <div className="flex items-center justify-between">
                  <span className="text-gray-400">
                    {smallAddress(agent.address, 6)}
                  </span>

                  <div className="flex items-center gap-1">
                    <Label
                      className="rounded-radius relative flex h-[36px] items-center gap-1 border bg-[#080808] px-2"
                      htmlFor={`percentage:${agent.address}`}
                    >
                      <Input
                        type="text"
                        value={
                          tempInputs[agent.address] ??
                          getAgentPercentage(agent.address)
                        }
                        onChange={(e) =>
                          handlePercentageChange(agent.address, e.target.value)
                        }
                        onBlur={() => handleInputBlur(agent.address)}
                        maxLength={3}
                        className="w-12 border-x-0 border-y px-0 py-0 focus-visible:ring-0"
                      />

                      <span className="text-muted-foreground">%</span>
                    </Label>
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => removeAgent(agent.address)}
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
        ) : (
          <p>Select a agent to allocate through the agents page.</p>
        )}
      </div>
    </ScrollArea>
  );
}
