"use client";

import { Button } from "@torus-ts/ui/components/button";
import { cn } from "@torus-ts/ui/lib/utils";
import { Container } from "~/app/_components/container";
import { LoadingDots } from "~/app/_components/loading-dots";
import { usePredictionsListQuery } from "~/hooks/api/use-predictions-list-query";
import { useProphetProfileQuery } from "~/hooks/api/use-prophet-profile-query";
import { useAuthStore } from "~/lib/auth-store";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import React, { Suspense, useMemo } from "react";
import { PredictionsList } from "./components/predictions-list";
import { ProfileHeader } from "./components/profile-header";

function ProphetPageContent() {
  const searchParams = useSearchParams();
  const { isAuthenticated } = useAuthStore();
  const [username, setUsername] = React.useState<string>("");

  React.useEffect(() => {
    const usernameParam = searchParams.get("username");
    if (usernameParam) {
      // Remove @ if present
      const cleanUsername = usernameParam.startsWith("@")
        ? usernameParam.slice(1)
        : usernameParam;
      setUsername(cleanUsername);
    }
  }, [searchParams]);

  const { data: profile, isLoading: profileLoading } =
    useProphetProfileQuery(username);

  const { data: predictions, isLoading: predictionsLoading } =
    usePredictionsListQuery(
      {
        sort_by: "twitter_username",
      },
      { enabled: !!username },
    );

  console.log(predictions);

  // Calculate prediction counts
  const {
    truePredictionsCount,
    falsePredictionsCount,
    unmaturedPredictionsCount,
    totalPredictions,
  } = useMemo(() => {
    if (!predictions) {
      return {
        truePredictionsCount: 0,
        falsePredictionsCount: 0,
        unmaturedPredictionsCount: 0,
        totalPredictions: 0,
      };
    }

    // Filter by username
    const userPredictions = predictions.filter(
      (p) =>
        p.tweet?.author_twitter_username.toLowerCase() ===
        username.toLowerCase(),
    );

    return {
      truePredictionsCount: userPredictions.filter((p) =>
        p.verification_claims.some(
          (c: { outcome: string }) => c.outcome === "MaturedTrue",
        ),
      ).length,
      falsePredictionsCount: userPredictions.filter((p) =>
        p.verification_claims.some(
          (c: { outcome: string }) => c.outcome === "MaturedFalse",
        ),
      ).length,
      unmaturedPredictionsCount: userPredictions.filter(
        (p) =>
          p.verification_claims.length === 0 ||
          p.verification_claims.every(
            (c: { outcome: string }) => c.outcome === "NotMatured",
          ),
      ).length,
      totalPredictions: userPredictions.length,
    };
  }, [predictions, username]);

  if (!isAuthenticated) {
    return (
      <div className="flex flex-1 flex-col">
        <div className="flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-6 p-4 md:p-6">
            <div className="flex items-center justify-center py-8">
              <LoadingDots size="lg" className="text-muted-foreground" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!username) {
    return (
      <Container>
        <div className="text-muted-foreground flex flex-col items-center justify-center py-12 text-center">
          <p className="text-lg">No username specified</p>
          <p className="mt-2 text-sm">
            Please provide a username in the URL (?username=example)
          </p>
          <Link href="/dashboard" className="mt-6">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </Container>
    );
  }

  if (profileLoading || predictionsLoading) {
    return (
      <div className="flex flex-1 flex-col">
        <div className="flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-6 p-4 md:p-6">
            <div className="flex items-center justify-center py-8">
              <LoadingDots size="lg" className="text-muted-foreground" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <Container>
        <div className="text-muted-foreground flex flex-col items-center justify-center py-12 text-center">
          <p className="text-lg">Profile not found</p>
          <p className="mt-2 text-sm">
            The username @{username} was not found in the system
          </p>
          <Link href="/dashboard" className="mt-6">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </Container>
    );
  }

  return (
    <div className="space-y-0">
      <ProfileHeader
        profile={profile}
        truePredictionsCount={truePredictionsCount}
        falsePredictionsCount={falsePredictionsCount}
        unmaturedPredictionsCount={unmaturedPredictionsCount}
        totalPredictions={totalPredictions}
      />

      <div className={cn("animate-fade-up animate-delay-[400ms]")}>
        <PredictionsList username={username} />
      </div>
    </div>
  );
}

function ProphetPageFallback() {
  return (
    <div className="flex flex-1 flex-col">
      <div className="flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-6 p-4 md:p-6">
          <div className="flex items-center justify-center py-8">
            <LoadingDots size="lg" className="text-muted-foreground" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProphetPage() {
  return (
    <Suspense fallback={<ProphetPageFallback />}>
      <ProphetPageContent />
    </Suspense>
  );
}
