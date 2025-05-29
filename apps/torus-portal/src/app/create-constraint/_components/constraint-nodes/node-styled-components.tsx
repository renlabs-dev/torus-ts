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
import { Key } from "lucide-react";

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
}

export function ConstraintSelect({
  id,
  value,
  onValueChange,
  children,
  colorVariant,
  disabled = false,
  className = "",
}: ConstraintSelectProps) {
  const getColorClasses = (variant: ColorVariant) => {
    switch (variant) {
      case "red":
        return "bg-red-50 text-red-700";
      case "blue":
        return "bg-blue-50 text-blue-700";
      case "green":
        return "bg-green-50 text-green-700";
      case "purple":
        return "bg-purple-50 text-purple-700";
      case "gray":
        return "bg-gray-50 text-gray-700";
      case "emerald":
        return "bg-emerald-50 text-emerald-700";
      case "orange":
        return "bg-orange-50 text-orange-700";
      case "yellow":
        return "bg-yellow-50 text-yellow-700";
      default:
        return "bg-gray-50 text-gray-700";
    }
  };

  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger
        id={id}
        className={`border transition-all pr-0 border-[#B1B1B7] duration-200 rounded-full
          [&>svg]:invisible ${getColorClasses(colorVariant)} ${className}`}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {children}
      </SelectContent>
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
    <SelectItem value={value} className={`${getHoverClasses(colorVariant)} ${className}`}>
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
}

export const ConstraintInput = forwardRef<HTMLInputElement, ConstraintInputProps>(
  ({ 
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
  }, ref) => {
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
          className={`w-full pr-0 ${hasError ? "border-red-500" : ""} ${className}`}
          {...props}
        />
        {hasError && errorMessage && (
          <p className="text-red-500 text-xs mt-1">{errorMessage}</p>
        )}
      </div>
    );
  }
);

ConstraintInput.displayName = "ConstraintInput";

interface ConstraintSelectIconItemProps {
  value: string;
  icon: React.ReactNode;
  label: string;
  colorVariant: ColorVariant;
}

export function ConstraintSelectIconItem({ value, icon, label, colorVariant }: ConstraintSelectIconItemProps) {
  return (
    <ConstraintSelectItem value={value} colorVariant={colorVariant}>
      <div className="flex items-center gap-2">
        {icon}
        <span>{label}</span>
      </div>
    </ConstraintSelectItem>
  );
}

interface ConstraintPermissionSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  children?: React.ReactNode;
  errorMessage?: string;
}

export function ConstraintPermissionSelect({
  value,
  onValueChange,
  disabled = false,
  placeholder = "Select Permission ID",
  children,
  errorMessage,
}: ConstraintPermissionSelectProps) {
  return (
    <div className="w-full">
      <div className="flex items-center justify-center font-semibold">
        <Select
          value={value}
          onValueChange={onValueChange}
          disabled={disabled}
        >
          <SelectTrigger className="w-fit pl-[0.05em] pr-1 gap-2 bg-zinc-300 text-accent rounded-full">
            <div
              className="flex items-center gap-2 bg-accent z-50 px-3 py-[0.45em] rounded-full
                text-zinc-300 rounded-r-none"
            >
              <Key className="h-4 w-4" />
              <span className="text-nowrap font-medium">Permission ID</span>
            </div>
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>
            {children}
          </SelectContent>
        </Select>
      </div>
      
      {errorMessage && (
        <p className="text-red-500 text-xs mt-1">{errorMessage}</p>
      )}
    </div>
  );
}