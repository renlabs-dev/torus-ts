"use client";

import { useTorus } from "@torus-ts/torus-provider";
import { Badge } from "@torus-ts/ui/components/badge";
import { useIsApostle } from "~/hooks/use-is-apostle";

export function UserRoleBadge() {
  const { isAccountConnected } = useTorus();
  const { isAdmin, isApostle, isLoading } = useIsApostle();

  if (!isAccountConnected || isLoading) {
    return null;
  }

  // Determine role (admin takes precedence over apostle)
  const role = isAdmin ? "admin" : isApostle ? "apostle" : null;

  if (role === null) {
    return null;
  }

  const roleConfig = {
    admin: {
      label: "Admin",
      className: "bg-red-500/20 text-red-400 border-red-500/30",
    },
    apostle: {
      label: "Apostle",
      className: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    },
  } as const;

  const config = roleConfig[role];

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Badge className={config.className}>Connected as {config.label}</Badge>
    </div>
  );
}
