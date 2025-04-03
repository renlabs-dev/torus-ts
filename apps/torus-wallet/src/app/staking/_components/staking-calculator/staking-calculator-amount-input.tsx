import { Input } from "@torus-ts/ui/components/input";

interface StakingCalculatorAmountInputProps {
  customAmount: string;
  setCustomAmount: (value: string) => void;
}

function StakingCalculatorAmountInput({ customAmount, setCustomAmount }: StakingCalculatorAmountInputProps) {
  return (
    <div className="mb-4 flex items-center justify-between gap-4 border bg-[#080808] pr-4">
      <Input
        type="number"
        value={customAmount}
        onChange={(e) => setCustomAmount(e.target.value)}
        className="max-w-[200px] border-b-0 border-l-0 border-r border-t-0"
        placeholder="Enter TORUS amount"
      />
      <p className="text-muted-foreground text-sm">
        You can edit the amount to see how it affects your projected growth
      </p>
    </div>
  );
}

export { StakingCalculatorAmountInput };
