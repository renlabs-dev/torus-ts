import React from "react";

import { ScrollArea, Separator } from "@torus-ts/ui";

interface DelegatedScrollProps {
  data: {
    name: string;
    percentage: number;
  }[];
}

export function DelegatedScroll({ data }: DelegatedScrollProps) {
  return (
    <ScrollArea className="h-28 w-full border border-white/20">
      <div className="p-4">
        {data.map((prop, index) => (
          <React.Fragment key={prop.name}>
            <div className="flex justify-between text-sm">
              <p className="font-bold">{prop.name}</p>
              <p className="text-right">{prop.percentage}%</p>
            </div>
            {index < data.length - 1 && <Separator className="my-2" />}
          </React.Fragment>
        ))}
      </div>
    </ScrollArea>
  );
}
