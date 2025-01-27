import { Button } from "@torus-ts/ui";
import { fromNano, toNano } from "@torus-ts/utils/subspace";

const buttonAmounts = [
  { label: "25%", value: 4n },
  { label: "50%", value: 2n },
  { label: "75%", value: 4n / 3n },
  { label: "MAX", value: 1n },
];

interface AmountButtonsProps {
  setAmount: (amount: string) => void;
  availableFunds: string;
  disabled?: boolean;
}

export function AmountButtons({
  setAmount,
  availableFunds,
  disabled = false,
}: AmountButtonsProps) {
  const handleAmountButtonClick = (divisor: bigint) => {
    const availableBigInt = toNano(availableFunds);
    const calculatedAmount = availableBigInt / divisor;
    setAmount(fromNano(calculatedAmount));
  };

  return (
    <div className="flex flex-wrap gap-2">
      {buttonAmounts.map(({ label, value }) => (
        <Button
          key={label}
          variant="outline"
          size="sm"
          disabled={disabled}
          onClick={() => handleAmountButtonClick(value)}
          className="min-w-[70px] flex-1"
        >
          {label}
        </Button>
      ))}
    </div>
  );
}
