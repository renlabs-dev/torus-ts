"use client";

import { Badge } from "@torus-ts/ui/components/badge";
import { cn } from "@torus-ts/ui/lib/utils";
import {
  CheckCircle,
  ClipboardList,
  FileText,
  Gavel,
  Shield,
} from "lucide-react";

const permissionConfig = {
  InsertPredictions: {
    label: "Predictions",
    icon: FileText,
    color: "text-blue-400",
    description: "Can submit predictions",
  },
  InsertVerificationClaims: {
    label: "Claims",
    icon: CheckCircle,
    color: "text-green-400",
    description: "Can submit verification claims",
  },
  InsertVerificationVerdicts: {
    label: "Verdicts",
    icon: Gavel,
    color: "text-yellow-400",
    description: "Can submit verification verdicts",
  },
  InsertTasks: {
    label: "Tasks",
    icon: ClipboardList,
    color: "text-purple-400",
    description: "Can create tasks",
  },
} as const;

interface PermissionBadgesProps {
  permissions: string[];
  variant?: "default" | "compact" | "detailed" | "comma";
  className?: string;
}

export function PermissionBadges({
  permissions,
  variant = "default",
  className,
}: PermissionBadgesProps) {
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (!permissions || permissions.length === 0) {
    return (
      <div
        className={cn(
          "text-muted-foreground flex items-center gap-1",
          className,
        )}
      >
        <Shield className="h-3 w-3" />
        <span>No permissions</span>
      </div>
    );
  }

  if (variant === "compact") {
    return (
      <div className={cn("flex items-center gap-1", className)}>
        <Shield className="text-muted-foreground h-3 w-3" />
        <span className="text-muted-foreground">
          {permissions.length} permission{permissions.length !== 1 ? "s" : ""}
        </span>
      </div>
    );
  }

  if (variant === "comma") {
    const permissionLabels = permissions
      .map((permission) => {
        const config =
          permissionConfig[permission as keyof typeof permissionConfig];
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        return config ? config.label : permission;
      })
      .join(", ");

    return (
      <div className={cn("flex items-center gap-2", className)}>
        <Shield className="text-muted-foreground h-3 w-3" />
        <span>{permissionLabels}</span>
      </div>
    );
  }

  if (variant === "detailed") {
    return (
      <div className={cn("space-y-2", className)}>
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4" />
          <span>PERMISSIONS</span>
        </div>
        <div className="grid grid-cols-1 gap-2">
          {permissions.map((permission) => {
            const config =
              permissionConfig[permission as keyof typeof permissionConfig];
            // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
            if (!config) return null;

            const Icon = config.icon;
            return (
              <div key={permission} className="flex items-center gap-2 p-2">
                <Icon className={cn("h-4 w-4", config.color)} />
                <div className="flex-1">
                  <div>{config.label}</div>
                  <div className="text-muted-foreground">
                    {config.description}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Default variant
  return (
    <div className={cn("flex flex-wrap gap-1", className)}>
      {permissions.map((permission) => {
        const config =
          permissionConfig[permission as keyof typeof permissionConfig];
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        if (!config) {
          return (
            <Badge key={permission} variant="outline">
              {permission}
            </Badge>
          );
        }

        const Icon = config.icon;
        return (
          <Badge
            key={permission}
            variant="outline"
            className={cn("flex items-center gap-1", config.color)}
            title={config.description}
          >
            <Icon className="h-3 w-3" />
            {config.label}
          </Badge>
        );
      })}
    </div>
  );
}
