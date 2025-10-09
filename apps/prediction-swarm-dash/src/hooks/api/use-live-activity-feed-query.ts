import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { useMemo } from "react";
import type {
  Prediction,
  VerificationClaim,
  VerificationVerdict,
} from "~/lib/api-schemas";

import { usePredictionsQuery } from "./use-predictions-query";
import { useVerificationClaimsQuery } from "./use-verification-claims-query";
import { useVerificationVerdictsQuery } from "./use-verification-verdicts-query";

dayjs.extend(utc);

// Constants
const DEFAULT_LIMIT = 50;
const DEFAULT_RECENT_MINUTES = 30;
const DEFAULT_LIMIT_PER_QUERY = 5;
const DEFAULT_REFETCH_INTERVAL = 30_000;

type ActivityItem =
  | (Prediction & {
      type: "prediction";
      created_at: string;
      agent_address: string;
    })
  | (VerificationClaim & {
      type: "verification_claim";
      created_at: string;
      agent_address: string;
    })
  | (VerificationVerdict & {
      type: "verification_verdict";
      created_at: string;
      agent_address: string;
    });

interface LiveActivityFeed {
  activities: ActivityItem[];
  isLoading: boolean;
  error: Error | null;
}

interface UseLiveActivityFeedOptions {
  limit?: number;
  refetchInterval?: number;
  recentMinutes?: number;
  from?: string;
  to?: string;
}

interface QueryOptions {
  enabled?: boolean;
}

// Pure functions for activity mapping
const mapPredictionToActivity = (prediction: Prediction): ActivityItem => ({
  ...prediction,
  type: "prediction" as const,
  created_at: prediction.inserted_at,
  agent_address: prediction.inserted_by_address,
});

const mapClaimToActivity = (claim: VerificationClaim): ActivityItem => ({
  ...claim,
  type: "verification_claim" as const,
  created_at: claim.inserted_at,
  agent_address: claim.inserted_by_address,
});

const mapVerdictToActivity = (verdict: VerificationVerdict): ActivityItem => ({
  ...verdict,
  type: "verification_verdict" as const,
  created_at: verdict.inserted_at,
  agent_address: verdict.inserted_by_address,
});

const sortActivitiesByDate = (activities: ActivityItem[]): ActivityItem[] =>
  activities.sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );

const limitActivities = (
  activities: ActivityItem[],
  limit: number,
): ActivityItem[] => activities.slice(0, limit);

const calculateTimeWindow = (
  from?: string,
  to?: string,
  recentMinutes = DEFAULT_RECENT_MINUTES,
) => ({
  from: from
    ? dayjs(from).toISOString()
    : dayjs().subtract(recentMinutes, "minute").toISOString(),
  to: to ? dayjs(to).toISOString() : undefined,
});

const combineActivities = (
  predictions: Prediction[] = [],
  claims: VerificationClaim[] = [],
  verdicts: VerificationVerdict[] = [],
): ActivityItem[] => [
  ...predictions.map(mapPredictionToActivity),
  ...claims.map(mapClaimToActivity),
  ...verdicts.map(mapVerdictToActivity),
];

export function useLiveActivityFeed(
  options: UseLiveActivityFeedOptions = {},
  queryOptions: QueryOptions = {},
): LiveActivityFeed {
  const {
    limit = DEFAULT_LIMIT,
    recentMinutes = DEFAULT_RECENT_MINUTES,
    from,
    to,
  } = options;
  const { enabled = true } = queryOptions;

  const timeWindow = useMemo(
    () => calculateTimeWindow(from, to, recentMinutes),
    [from, to, recentMinutes],
  );

  const queryConfig = { refetchInterval: DEFAULT_REFETCH_INTERVAL, enabled };

  const {
    data: predictionsData,
    isLoading: predictionsLoading,
    error: predictionsError,
  } = usePredictionsQuery(
    { ...timeWindow, limit: DEFAULT_LIMIT_PER_QUERY },
    queryConfig,
  );

  const {
    data: claimsData,
    isLoading: claimsLoading,
    error: claimsError,
  } = useVerificationClaimsQuery(
    { ...timeWindow, limit: DEFAULT_LIMIT_PER_QUERY },
    queryConfig,
  );

  const {
    data: verdictsData,
    isLoading: verdictsLoading,
    error: verdictsError,
  } = useVerificationVerdictsQuery(
    { ...timeWindow, limit: DEFAULT_LIMIT_PER_QUERY },
    queryConfig,
  );

  const activities = useMemo(() => {
    const allActivities = combineActivities(
      predictionsData,
      claimsData,
      verdictsData,
    );
    const sortedActivities = sortActivitiesByDate(allActivities);

    return limitActivities(sortedActivities, limit);
  }, [predictionsData, claimsData, verdictsData, limit]);

  const isLoading = predictionsLoading || claimsLoading || verdictsLoading;
  const error = predictionsError || claimsError || verdictsError;

  return { activities, isLoading, error };
}
