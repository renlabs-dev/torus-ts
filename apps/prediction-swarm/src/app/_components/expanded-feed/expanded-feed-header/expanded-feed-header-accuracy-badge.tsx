import { Badge } from "@torus-ts/ui/components/badge";
import { cn } from "@torus-ts/ui/lib/utils";

interface AccuracyBadgeProps {
  accuracy: number | null;
}

function getAccuracyStyle(accuracy: number): {
  gradient: string;
  text: string;
  border: string;
} {
  if (accuracy >= 90) {
    return {
      gradient: "bg-gradient-to-br from-purple-500 to-blue-600",
      text: "text-white",
      border: "border-purple-400/50",
    };
  } else if (accuracy >= 80) {
    return {
      gradient: "bg-gradient-to-br from-blue-500 to-cyan-600",
      text: "text-white",
      border: "border-blue-400/50",
    };
  } else if (accuracy >= 70) {
    return {
      gradient: "bg-gradient-to-br from-green-500 to-emerald-600",
      text: "text-white",
      border: "border-green-400/50",
    };
  } else if (accuracy >= 60) {
    return {
      gradient: "bg-gradient-to-br from-lime-500 to-green-600",
      text: "text-white",
      border: "border-lime-400/50",
    };
  } else if (accuracy >= 50) {
    return {
      gradient: "bg-gradient-to-br from-yellow-400 to-lime-500",
      text: "text-gray-900",
      border: "border-yellow-400/50",
    };
  } else if (accuracy >= 40) {
    return {
      gradient: "bg-gradient-to-br from-yellow-500 to-orange-500",
      text: "text-gray-900",
      border: "border-yellow-500/50",
    };
  } else if (accuracy >= 30) {
    return {
      gradient: "bg-gradient-to-br from-orange-500 to-amber-600",
      text: "text-white",
      border: "border-orange-400/50",
    };
  } else if (accuracy >= 20) {
    return {
      gradient: "bg-gradient-to-br from-orange-600 to-red-600",
      text: "text-white",
      border: "border-orange-500/50",
    };
  } else if (accuracy >= 10) {
    return {
      gradient: "bg-gradient-to-br from-red-500 to-rose-600",
      text: "text-white",
      border: "border-red-400/50",
    };
  } else {
    return {
      gradient: "bg-gradient-to-br from-red-600 to-rose-700",
      text: "text-white",
      border: "border-red-500/50",
    };
  }
}

export function ExpandedFeedHeaderAccuracyBadge({
  accuracy,
}: AccuracyBadgeProps) {
  if (accuracy === null) {
    return <Badge variant="secondary">No verdicts yet</Badge>;
  }

  const style = getAccuracyStyle(accuracy);

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors",
        style.gradient,
        style.text,
        style.border,
      )}
    >
      {accuracy}% Accuracy
    </div>
  );
}
