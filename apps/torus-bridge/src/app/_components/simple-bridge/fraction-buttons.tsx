import { Button } from "@torus-ts/ui/components/button";
import { cn } from "@torus-ts/ui/lib/utils";
import { useState } from "react";

export function FractionButton({
  children,
  onClick,
  disabled,
  selected,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled: boolean;
  selected: boolean;
}) {
  return (
    <Button
      type="button"
      onClick={onClick}
      variant="outline"
      disabled={disabled}
      className={cn(
        "flex items-center justify-center rounded-none border border-[#262631] bg-[#19191A] py-2 text-xs hover:bg-[#262631]",
        selected && "bg-[#262631]",
      )}
    >
      {children}
    </Button>
  );
}

export function FractionButtons({
  handleFractionClick,
  walletsReady,
  isTransferInProgress,
  handleMaxClick,
}: {
  handleFractionClick: (fraction: number) => void;
  walletsReady: boolean;
  isTransferInProgress: boolean;
  handleMaxClick: () => void;
}) {
  const [selected, setSelected] = useState<number | null>(null);

  const handleClick = (fraction: number) => {
    if (fraction === 1.0) {
      setSelected(1.0);
      handleMaxClick();
      return;
    }

    setSelected(fraction);
    handleFractionClick(fraction);
  };

  return (
    <div className="flex gap-2">
      <FractionButton
        selected={selected === 0.25}
        onClick={() => handleClick(0.25)}
        disabled={!walletsReady || isTransferInProgress}
      >
        1/4
      </FractionButton>
      <FractionButton
        selected={selected === 0.33}
        onClick={() => handleClick(0.33)}
        disabled={!walletsReady || isTransferInProgress}
      >
        1/3
      </FractionButton>
      <FractionButton
        selected={selected === 0.5}
        onClick={() => handleClick(0.5)}
        disabled={!walletsReady || isTransferInProgress}
      >
        1/2
      </FractionButton>
      <FractionButton
        selected={selected === 1.0}
        onClick={() => handleClick(1.0)}
        disabled={!walletsReady || isTransferInProgress}
      >
        All
      </FractionButton>
    </div>
  );
}
