"use client";

import type { JSX } from "react";
import React from "react";

import type { LucideIcon } from "lucide-react";
import { UserPen, UserPlus } from "lucide-react";

import { AddressWithAgent } from "~/app/_components/address-with-agent";

interface IconConfig {
  icon: LucideIcon;
  size?: number;
  color?: string;
  strokeWidth?: number;
  className?: string;
}

interface LinkButtonsProps {
  grantor_key: string | undefined;
  grantee_key: string | undefined;
  grantorIcon?: IconConfig;
  granteeIcon?: IconConfig;
  iconSize?: number;
  iconColor?: string;
}

export function GraphSheetDetailsLinkButtons({
  grantor_key,
  grantee_key,
  grantorIcon,
  granteeIcon,
  iconSize = 16,
  iconColor = "currentColor",
}: LinkButtonsProps): JSX.Element {
  if (!grantor_key || !grantee_key) {
    return (
      <div className="flex justify-center items-center gap-2 text-sm text-gray-400 font-mono">
        <span>No details available</span>
      </div>
    );
  }

  const defaultGrantorIcon: IconConfig = {
    icon: UserPlus,
    size: iconSize,
    color: iconColor,
    ...grantorIcon,
  };

  const defaultGranteeIcon: IconConfig = {
    icon: UserPen,
    size: iconSize,
    color: iconColor,
    ...granteeIcon,
  };

  const ShortenedDetailsDisplay = ({
    address,
    label,
    iconConfig,
  }: {
    iconConfig: IconConfig;
    address: string;
    label?: string;
  }) => {
    const { icon: Icon, size, color, strokeWidth, className } = iconConfig;

    return (
      <div className="flex items-center gap-1" title={address}>
        {label && <span className="sr-only">{label}:</span>}
        <Icon
          size={size}
          color={color}
          strokeWidth={strokeWidth}
          className={className}
        />
        <AddressWithAgent
          address={address}
          showCopyButton={false}
          addressLength={3}
        />
      </div>
    );
  };

  return (
    <div className="flex flex-wrap justify-between items-center gap-2 text-sm text-gray-400">
      <ShortenedDetailsDisplay
        iconConfig={defaultGrantorIcon}
        address={grantor_key}
      />
      <ShortenedDetailsDisplay
        iconConfig={defaultGranteeIcon}
        address={grantee_key}
      />
    </div>
  );
}
