"use client";

import { LoadingDots } from "@/components/ui/loading-dots";
import { RelativeTime } from "@/components/ui/relative-time";
import { useLiveActivityFeed } from "@/hooks/api";
import { useAgentName } from "@/hooks/api/use-agent-name-query";
import type { TimeWindowParams } from "@/lib/api-schemas";
import { useAuthStore } from "@/lib/auth-store";

interface Activity {
  id: string | number;
  type: string;
  agent_address?: string;
  created_at: string;
}

interface DashboardActivityProps {
  timeWindow?: TimeWindowParams;
}

export function DashboardActivity({ timeWindow }: DashboardActivityProps) {
  const { isAuthenticated } = useAuthStore();

  const { activities, isLoading, error } = useLiveActivityFeed(
    {
      limit: 10,
      recentMinutes: 60,
      ...timeWindow,
    },
    {
      enabled: isAuthenticated,
    }
  );

  if (error) {
    return <p>ERROR_LOADING_ACTIVITY: {error.message}</p>;
  }

  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex items-center justify-center py-8">
        <LoadingDots size="lg" className="text-muted-foreground" />
      </div>
    );
  }

  if (activities.length === 0) {
    return <p>NO_RECENT_ACTIVITY_FOUND</p>;
  }

  const getActivityColor = (type: string) => {
    switch (type) {
      case "prediction":
        return "bg-blue-500";
      case "verification_claim":
        return "bg-purple-500";
      case "verification_verdict":
        return "bg-green-500";
      default:
        return "bg-muted-foreground";
    }
  };

  const getActivityLabel = (type: string) => {
    switch (type) {
      case "prediction":
        return "PREDICTION";
      case "verification_claim":
        return "VERIFICATION CLAIM";
      case "verification_verdict":
        return "VERIFICATION VERDICT";
      default:
        return "ACTIVITY";
    }
  };

  function ActivityItem({ activity }: { activity: Activity }) {
    const { agentName } = useAgentName(activity.agent_address || "");

    return (
      <div className="flex flex-col sm:flex-row items-center gap-1.5 pb-3 hover:bg-muted/50 border-b border-border/40">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div
            className={`h-10 w-1 rounded-xl ${getActivityColor(activity.type)}`}
          />
          <div className="flex-1 min-w-0 sm:min-w-[120px]">
            <span className="font-medium text-sm sm:text-base block">
              {getActivityLabel(activity.type)}
            </span>
            <p className="text-muted-foreground truncate text-xs sm:text-sm">
              {agentName}
            </p>
          </div>
        </div>
        <div className="w-full sm:w-auto sm:ml-auto">
          <span className="text-muted-foreground text-xs sm:text-sm">
            <RelativeTime date={activity.created_at} />
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {activities.map((activity) => (
        <ActivityItem
          key={`${activity.type}-${activity.id}`}
          activity={activity}
        />
      ))}
    </div>
  );
}
