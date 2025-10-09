"use client";

import { Badge } from "@/components/ui/badge";
import { LoadingDots } from "@/components/ui/loading-dots";
import { usePermissionsQuery } from "@/hooks/api";

export function DashboardPermissions() {
  const { data: permissionsData, isLoading, error } = usePermissionsQuery({});

  if (error) {
    return <p>ERROR_LOADING_PERMISSIONS: {error.message}</p>;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-4">
        <LoadingDots size="md" className="text-muted-foreground" />
      </div>
    );
  }

  if (!permissionsData || permissionsData.length === 0) {
    return <p>NO_PERMISSIONS_FOUND</p>;
  }

  const permissionCounts = permissionsData.reduce(
    (acc, permission) => {
      acc[permission.permission] = (acc[permission.permission] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  const sortedPermissions = Object.entries(permissionCounts).sort(
    ([, a], [, b]) => b - a,
  );

  // Enum mapping for prettier display names; falls back to formatter below
  const PERMISSION_DISPLAY: Record<string, string> = {
    InsertPredictions: "PREDICTIONS",
    InsertVerificationClaims: "VERIFICATION_CLAIMS",
    InsertVerificationVerdicts: "VERIFICATION_VERDICTS",
    InsertTasks: "TASKS",
    AddPredictionContext: "ADD_PREDICTION_CONTEXT",
  };

  const formatPermissionForDisplay = (raw: string): string => {
    if (PERMISSION_DISPLAY[raw]) return PERMISSION_DISPLAY[raw];
    // Remove common prefixes like Insert/Add
    const noPrefix = raw.replace(/^(Insert|Add)/, "");
    // Insert underscores between camelCase words and uppercase
    const withUnderscores = noPrefix.replace(/([a-z])([A-Z])/g, "$1_$2");
    return withUnderscores.toUpperCase();
  };

  return (
    <div className="space-y-2">
      {sortedPermissions.map(([permission, count], index) => (
        <div
          key={permission}
          className="flex justify-between items-center border-b border-border/40 pb-2"
        >
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="w-6 h-6 p-2">
              {index + 1}
            </Badge>
            {formatPermissionForDisplay(permission)}
          </div>
          <Badge variant="secondary">{count}</Badge>
        </div>
      ))}
    </div>
  );
}
