import { Calculator } from "lucide-react";

interface StakingCalculatorHeaderProps {
  projectedApr: number;
}

export function StakingCalculatorHeader({
  projectedApr,
}: StakingCalculatorHeaderProps) {
  return (
    <div className="mb-4 flex flex-col justify-between gap-4 md:flex-row md:items-center md:gap-0">
      <div className="flex items-center gap-2">
        <Calculator className="text-muted-foreground h-5 w-5" />
        <h3 className="font-medium">Yield Projections</h3>
      </div>
      <p className="text-muted-foreground text-sm">
        Projected{" "}
        <span className="font-semibold text-violet-500">
          {projectedApr.toFixed(1)}% APR
        </span>{" "}
        • Monthly Compounding
      </p>
    </div>
  );
}
