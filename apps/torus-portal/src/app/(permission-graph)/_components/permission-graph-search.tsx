"use client";

import { useState, useEffect, memo, useCallback, useMemo } from "react";
import { Input } from "@torus-ts/ui/components/input";
import { Button } from "@torus-ts/ui/components/button";
import { useRouter, useSearchParams } from "next/navigation";
import { Card } from "@torus-ts/ui/components/card";

interface PermissionGraphSearchProps {
  graphNodes?: string[];
}

const PermissionGraphSearch = memo(function PermissionGraphSearch({
  graphNodes = [],
}: PermissionGraphSearchProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const filteredNodes = useMemo(() => {
    if (searchQuery.length >= 3 && graphNodes.length > 0) {
      return graphNodes
        .filter((node) =>
          node.toLowerCase().includes(searchQuery.toLowerCase()),
        )
        .slice(0, 5);
    }
    return [];
  }, [searchQuery, graphNodes]);

  useEffect(() => {
    setSuggestions(filteredNodes);
    setShowSuggestions(filteredNodes.length > 0);
  }, [filteredNodes]);

  const handleSearch = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (searchQuery.length >= 3) {
        const matchingNode = graphNodes.find((node) =>
          node.toLowerCase().includes(searchQuery.toLowerCase()),
        );

        if (matchingNode) {
          const params = new URLSearchParams(searchParams.toString());
          params.set("agent", matchingNode);
          router.replace(`/?${params.toString()}`, { scroll: false });
        }
      }
    },
    [searchQuery, graphNodes, router, searchParams],
  );

  const handleSuggestionClick = useCallback(
    (node: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("agent", node);
      router.replace(`/?${params.toString()}`, { scroll: false });
      setShowSuggestions(false);
    },
    [router, searchParams],
  );

  return (
    <div className="relative w-full pr-4">
      <form onSubmit={handleSearch} className="flex items-center gap-2">
        <Input
          type="text"
          placeholder="Search by agent key..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-background"
        />
      </form>

      {showSuggestions && (
        <Card className="absolute top-full left-0 right-0 mt-1 z-50 max-h-60 overflow-y-auto p-1">
          <ul>
            {suggestions.map((node) => (
              <li key={node}>
                <Button
                  variant="ghost"
                  className="w-full justify-start text-left px-2 py-1 h-auto"
                  onClick={() => handleSuggestionClick(node)}
                >
                  {node.length > 20
                    ? `${node.substring(0, 10)}...${node.substring(node.length - 8)}`
                    : node}
                </Button>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
});

export default PermissionGraphSearch;
