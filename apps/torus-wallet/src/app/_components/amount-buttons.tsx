import { Button } from "@torus-ts/ui/components/button";
import { fromNano, toNano } from "@torus-ts/utils/subspace";
import { convertTORUSToUSD } from "~/utils/helpers";

const buttonAmounts = [
  { label: "1/4", value: 4n },
  { label: "1/3", value: 3n },
  { label: "1/2", value: 2n },
  { label: "All", value: 1n },
];

type InputType = "TORUS" | "USD";

interface AmountButtonsProps {
  setAmount: (amount: string) => void;
  availableFunds: string;
  disabled: boolean;
  inputType?: InputType;
  usdPrice?: number;
}

export function AmountButtons(props: Readonly<AmountButtonsProps>) {
  const {
    availableFunds,
    setAmount,
    disabled,
    inputType = "TORUS",
    usdPrice,
  } = props;

  const handleAmountButtonClick = (divisor: bigint) => {
    const parsedFunds = toNano(availableFunds);
    const torusAmount = fromNano(parsedFunds / divisor);

    if (inputType === "USD" && usdPrice) {
      const usdAmount = convertTORUSToUSD(torusAmount, usdPrice);
      setAmount(usdAmount);
    } else {
      setAmount(torusAmount);
    }
  };

  return (
    <div className="flex gap-2">
      {buttonAmounts.map((amount) => (
        <Button
          variant="outline"
          size="default"
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
