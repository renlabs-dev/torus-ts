import { Button } from "@torus-ts/ui";

const buttonAmounts = [
  { label: "1/4", value: 1 / 4 },
  { label: "1/3", value: 1 / 3 },
  { label: "1/2", value: 1 / 2 },
  { label: "All", value: 1 },
];

interface AmountButtonsProps {
  setAmount: (amount: string) => void;
  availableFunds: string;
  disabled: boolean;
}

export function AmountButtons(props: AmountButtonsProps) {
  const { availableFunds, setAmount, disabled } = props;

  const handleAmountButtonClick = (divisor: number) => {
    const parsedFunds = Number(availableFunds);
    if (isNaN(parsedFunds)) return;

    setAmount((parsedFunds * divisor).toString());
  };

  return (
    <div className="flex gap-2">
      {buttonAmounts.map((amount) => (
        <Button
          variant="outline"
          size={"sm"}
          disabled={disabled}
          type="button"
          key={amount.label}
          onClick={() => handleAmountButtonClick(amount.value)}
        >
          {amount.label}
        </Button>
      ))}
    </div>
  );
}
