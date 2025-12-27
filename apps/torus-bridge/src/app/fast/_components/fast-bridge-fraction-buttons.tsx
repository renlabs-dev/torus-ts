import { Button } from "@torus-ts/ui/components/button";
import { cn } from "@torus-ts/ui/lib/utils";
import { useState } from "react";

interface FractionButtonProps {
  children: React.ReactNode;
  onClick: () => void;
  disabled: boolean;
  selected: boolean;
}

export function FractionButton({
  children,
  onClick,
  disabled,
  selected,
}: FractionButtonProps) {
  return (
    <Button
      type="button"
      onClick={onClick}
      variant="outline"
      disabled={disabled}
      className={cn(
        "flex h-6 w-[35px] items-center justify-center rounded-none border border-[#262631] bg-[#19191A] text-xs hover:bg-[#262631]",
        selected && "bg-[#262631]",
      )}
    >
      {children}
    </Button>
  );
}

interface FractionButtonsProps {
  handleFractionClick: (fraction: number) => void;
  walletsReady: boolean;
  isTransferInProgress: boolean;
  handleMaxClick: () => void;
}

export function FractionButtons({
  handleFractionClick,
  walletsReady,
  isTransferInProgress,
  handleMaxClick,
}: FractionButtonsProps) {
  const [selected, setSelected] = useState<number | null>(null);

  const handleClick = (fraction: number) => {
    setSelected(fraction);

    if (fraction === 1.0) {
      handleMaxClick();
      return;
    }

    handleFractionClick(fraction);
  };

  const isDisabled = !walletsReady || isTransferInProgress;

  const fractions = [
    { value: 0.25, label: "1/4" },
    { value: 0.33, label: "1/3" },
    { value: 0.5, label: "1/2" },
    { value: 1.0, label: "All" },
  ];

  return (
    <div className="flex gap-2" data-testid="fraction-buttons-container">
      {fractions.map(({ value, label }) => (
        <FractionButton
          key={value}
          selected={selected === value}
          onClick={() => handleClick(value)}
          disabled={isDisabled}
          data-testid={`fraction-button-${value}`}
        >
          {label}
        </FractionButton>
      ))}
    </div>
  );
}
