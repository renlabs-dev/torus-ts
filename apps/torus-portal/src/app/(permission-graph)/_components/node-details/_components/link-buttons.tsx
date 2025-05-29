"use client";

import React from "react";
import type { JSX } from "react";
import { smallAddress } from "@torus-network/torus-utils/subspace";
import { formatScope } from "../../permission-graph-utils";
import { UserPlus, UserPen, Layers } from "lucide-react";
import type { LucideIcon } from "lucide-react";

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
  scope: string | undefined;
  grantorIcon?: IconConfig;
  granteeIcon?: IconConfig;
  scopeIcon?: IconConfig;
  iconSize?: number;
  iconColor?: string;
}

export function LinkButtons({
  grantor_key,
  grantee_key,
  scope,
  grantorIcon,
  granteeIcon,
  scopeIcon,
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

  const defaultScopeIcon: IconConfig = {
    icon: Layers,
    size: iconSize,
    color: iconColor,
    ...scopeIcon,
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
        <span>{address}</span>
      </div>
    );
  };

  return (
    <div
      className="flex flex-wrap justify-between items-center gap-2 text-sm text-gray-400
        font-mono"
    >
      <ShortenedDetailsDisplay
        iconConfig={defaultGrantorIcon}
        address={smallAddress(grantor_key, 3)}
      />
      <ShortenedDetailsDisplay
        iconConfig={defaultGranteeIcon}
        address={smallAddress(grantee_key, 3)}
      />
      <ShortenedDetailsDisplay
        iconConfig={defaultScopeIcon}
        address={formatScope(scope ?? "")}
      />
    </div>
  );
}
