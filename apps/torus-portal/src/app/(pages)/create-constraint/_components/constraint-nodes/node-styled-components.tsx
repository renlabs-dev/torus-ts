"use client";

import { forwardRef } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@torus-ts/ui/components/select";
import { Input } from "@torus-ts/ui/components/input";

type ColorVariant =
  | "red"
  | "blue"
  | "green"
  | "purple"
  | "gray"
  | "emerald"
  | "orange"
  | "yellow";

interface ConstraintSelectProps {
  id?: string;
  value: string;
  onValueChange: (value: string) => void;
  children: React.ReactNode;
  colorVariant: ColorVariant;
  disabled?: boolean;
  className?: string;
  isRenderingField?: boolean;
}

export function ConstraintSelect({
  id,
  value,
  onValueChange,
  children,
  colorVariant,
  disabled = false,
  className = "",
  isRenderingField = false,
}: ConstraintSelectProps) {
  const getColorClasses = (variant: ColorVariant) => {
    switch (variant) {
      case "red":
        return "border-red-500 text-red-500 hover:bg-red-500/10";
      case "blue":
        return "border-blue-500 text-blue-500 hover:bg-blue-500/10";
      case "green":
        return "border-green-500 text-green-500 hover:bg-green-500/10";
      case "purple":
        return "border-purple-500 text-purple-500 hover:bg-purple-500/10";
      case "gray":
        return "border-gray-300 text-gray-300 hover:bg-gray-300/10";
      case "emerald":
        return "border-emerald-500 text-emerald-500 hover:bg-emerald-500/10";
      case "orange":
        return "border-orange-500 text-orange-500 hover:bg-orange-500/10";
      case "yellow":
        return "border-yellow-500 text-yellow-500 hover:bg-yellow-500/10";
      default:
        return "border-white text-white hover:bg-white-500/10";
    }
  };

  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger
        id={id}
        className={`border transition-all pr-0 duration-200 rounded-full px-3 backdrop-blur-xl
          ${getColorClasses(colorVariant)} ${className}
          ${isRenderingField ? "rounded-t-md rounded-b-none" : "rounded-md"}`}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>{children}</SelectContent>
    </Select>
  );
}

interface ConstraintSelectItemProps {
  value: string;
  children: React.ReactNode;
  colorVariant: ColorVariant;
  className?: string;
}

export function ConstraintSelectItem({
  value,
  children,
  colorVariant,
  className = "",
}: ConstraintSelectItemProps) {
  const getHoverClasses = (variant: ColorVariant) => {
    switch (variant) {
      case "red":
        return "hover:bg-red-50";
      case "blue":
        return "hover:bg-blue-50";
      case "green":
        return "hover:bg-green-50";
      case "purple":
        return "hover:bg-purple-50";
      case "gray":
        return "hover:bg-gray-50";
      case "emerald":
        return "hover:bg-emerald-50";
      case "orange":
        return "hover:bg-orange-50";
      case "yellow":
        return "hover:bg-yellow-50";
      default:
        return "hover:bg-gray-50";
    }
  };

  return (
    <SelectItem
      value={value}
      className={`${getHoverClasses(colorVariant)} ${className}`}
    >
      {children}
    </SelectItem>
  );
}

interface ConstraintInputProps {
  id?: string;
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  className?: string;
  hasError?: boolean;
  errorMessage?: string;
  disabled?: boolean;
  min?: string;
  max?: string;
  step?: string;
}

export const ConstraintInput = forwardRef<
  HTMLInputElement,
  ConstraintInputProps
>(
  (
    {
      id,
      type = "text",
      value,
      onChange,
      placeholder,
      className = "",
      hasError = false,
      errorMessage,
      disabled = false,
      ...props
    },
    ref,
  ) => {
    return (
      <div className="w-full">
        <Input
          ref={ref}
          id={id}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          className={`w-full border-t-0 pr-0 ${hasError ? "border-red-500" : ""} ${className}`}
          {...props}
        />
        {hasError && errorMessage && (
          <p className="text-red-500 text-xs mt-1">{errorMessage}</p>
        )}
      </div>
    );
  },
);

ConstraintInput.displayName = "ConstraintInput";

interface ConstraintSelectIconItemProps {
  value: string;
  icon: React.ReactNode;
  label: string;
  colorVariant: ColorVariant;
}

export function ConstraintSelectIconItem({
  value,
  icon,
  label,
  colorVariant,
}: ConstraintSelectIconItemProps) {
  return (
    <ConstraintSelectItem value={value} colorVariant={colorVariant}>
      <div className="flex items-center gap-2">
        {icon}
        <span>{label}</span>
      </div>
    </ConstraintSelectItem>
  );
}
