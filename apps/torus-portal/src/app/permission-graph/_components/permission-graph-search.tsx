"use client";

import { useState, useEffect, memo, useCallback, useMemo } from "react";
import { Input } from "@torus-ts/ui/components/input";
import { Button } from "@torus-ts/ui/components/button";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Card } from "@torus-ts/ui/components/card";

interface PermissionGraphSearchProps {
  graphNodes?: string[];
}

const PermissionGraphSearch = memo(function PermissionGraphSearch({ graphNodes = [] }: PermissionGraphSearchProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const filteredNodes = useMemo(() => {
    if (searchQuery.length >= 3 && graphNodes.length > 0) {
      return graphNodes.filter(node => 
        node.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 5);
    }
    return [];
  }, [searchQuery, graphNodes]);

  useEffect(() => {
    setSuggestions(filteredNodes);
    setShowSuggestions(filteredNodes.length > 0);
  }, [filteredNodes]);

  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.length >= 3) {
      const matchingNode = graphNodes.find(node => 
        node.toLowerCase().includes(searchQuery.toLowerCase())
      );
      
      if (matchingNode) {
        router.push(`/permission-graph/agent/${matchingNode}`);
      }
    }
  }, [searchQuery, graphNodes, router]);

  const handleSuggestionClick = useCallback((node: string) => {
    router.push(`/permission-graph/agent/${node}`);
    setShowSuggestions(false);
  }, [router]);

  return (
    <div className="relative">
      <form onSubmit={handleSearch} className="flex items-center gap-2">
        <Input
          type="text"
          placeholder="Search by agent key..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-background"
        />
        <Button type="submit" variant="ghost" size="icon">
          <Search className="h-4 w-4" />
        </Button>
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
                  {node.length > 20 ? `${node.substring(0, 10)}...${node.substring(node.length - 8)}` : node}
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