"use client";

import {
  ToggleGroup,
  ToggleGroupItem,
} from "@torus-ts/ui/components/toggle-group";
import { Move3d, Square } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";

export function ViewModeSwitcher() {
  const router = useRouter();
  const pathname = usePathname();

  // Determine current view mode from pathname
  const currentMode = pathname.includes("/2d-hypergraph") ? "2d" : "3d";

  const handleModeChange = (mode: string) => {
    if (!mode) return; // Prevent deselecting all options

    const newPath = mode === "2d" ? "/2d-hypergraph" : "/";
    router.push(newPath);
  };

  return (
    <ToggleGroup
      type="single"
      variant="outline"
      value={currentMode}
      onValueChange={handleModeChange}
      size="lg"
      className="bg-field-background animate-fade-up gap-0"
    >
      <ToggleGroupItem value="3d" className="px-3 py-3">
        <Move3d className="h-4 w-4" />
        3D
      </ToggleGroupItem>
      <ToggleGroupItem value="2d" className="px-3 py-3">
        <Square className="h-4 w-4" />
        2D
      </ToggleGroupItem>
    </ToggleGroup>
  );
}
