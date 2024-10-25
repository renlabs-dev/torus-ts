import type { ComponentType, SVGProps } from "react";

import { Card } from "@commune-ts/ui";

interface StatsCardProps {
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
  text: string;
  value: string;
  color: string;
}

export function StatsCard({ Icon, text, value, color }: StatsCardProps) {
  return (
    <Card className="flex w-full items-center justify-between p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-full border-2 border-${color}-500 bg-${color}-500/10`}
          >
            <Icon className={`h-6 w-6 text-${color}-500`} />
          </div>
          <div className="ml-4">
            <p className="text-sm text-gray-300">{text}</p>
            <p className="text-lg font-bold">{value}</p>
          </div>
        </div>
      </div>
    </Card>
  );
}
