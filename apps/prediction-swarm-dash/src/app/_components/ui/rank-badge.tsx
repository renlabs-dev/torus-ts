import { Award, Medal, Trophy } from "lucide-react";

import { Badge } from "@/components/ui/badge";

interface RankBadgeProps {
  rank: number;
  className?: string;
}

export function RankBadge({ rank, className = "" }: RankBadgeProps) {
  const rankData = {
    1: {
      icon: Trophy,
      color: "text-yellow-400",
      bg: "bg-yellow-500/20",
      label: "#1",
    },
    2: {
      icon: Medal,
      color: "text-gray-300",
      bg: "bg-gray-500/20",
      label: "#2",
    },
    3: {
      icon: Award,
      color: "text-orange-400",
      bg: "bg-orange-500/20",
      label: "#3",
    },
  }[rank] || {
    icon: Award,
    color: "text-blue-400",
    bg: "bg-blue-500/20",
    label: `#${rank}`,
  };

  const IconComponent = rankData.icon;

  return (
    <Badge className={`${rankData.color} ${rankData.bg} text-sm  ${className}`}>
      <IconComponent className="h-3 w-3" />
      {rankData.label}
    </Badge>
  );
}
