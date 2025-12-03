"use client";

import { fromNano, toNano } from "@torus-network/torus-utils/torus/token";
import { Input } from "@torus-ts/ui/components/input";
import { useCallback, useState } from "react";

interface TokenAmountInputProps {
  value: string | undefined;
  onChange: (nanoValue: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function TokenAmountInput({
  value,
  onChange,
  placeholder = "0.0",
  disabled = false,
  className,
}: TokenAmountInputProps) {
  const [userInput, setUserInput] = useState<string>("");
  const [isUserInputting, setIsUserInputting] = useState(false);

  // Use user input while typing, otherwise show converted value
  const displayValue = isUserInputting
    ? userInput
    : value && value !== "0"
      ? (() => {
          try {
            return fromNano(value);
          } catch {
            return "";
          }
        })()
      : "";

  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = event.target.value;
      setUserInput(inputValue);
      setIsUserInputting(true);

      if (inputValue === "" || inputValue === "0") {
        onChange("");
        return;
      }

      try {
        // Convert human-readable value to nano format
        const nanoValue = toNano(inputValue);
        onChange(nanoValue.toString());
      } catch {
        // Invalid input, don't update the form value
      }
    },
    [onChange],
  );

  const handleBlur = useCallback(() => {
    setIsUserInputting(false);
    setUserInput("");
  }, []);

  return (
    <Input
      type="number"
      step="any"
      value={displayValue}
      onChange={handleChange}
      onBlur={handleBlur}
      placeholder={placeholder}
      disabled={disabled}
      className={className}
    />
  );
}
