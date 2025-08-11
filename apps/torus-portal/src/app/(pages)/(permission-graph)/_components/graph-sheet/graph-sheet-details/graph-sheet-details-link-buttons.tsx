"use client";

import type { JSX } from "react";
import React from "react";

import type { LucideIcon } from "lucide-react";
import { HandCoins, Layers, UserPlus } from "lucide-react";

import { smallAddress } from "@torus-network/torus-utils/torus";

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
  permission_id?: string | undefined;
  grantorIcon?: IconConfig;
  granteeIcon?: IconConfig;
  permissionIcon?: IconConfig;
  iconSize?: number;
  iconColor?: string;
}

export function GraphSheetDetailsLinkButtons({
  grantor_key,
  grantee_key,
  permission_id,
  grantorIcon,
  granteeIcon,
  permissionIcon,
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
    icon: HandCoins,
    size: iconSize,
    color: iconColor,
    ...granteeIcon,
  };

  const defaultPermissionIcon: IconConfig = {
    icon: Layers,
    size: iconSize,
    color: iconColor,
    ...permissionIcon,
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
        <Icon
          size={size}
          color={color}
          strokeWidth={strokeWidth}
          className={className}
        />
        {label && <span>{label}:</span>}
        <AddressWithAgent
          address={address}
          showCopyButton={false}
          addressLength={3}
        />
      </div>
    );
  };

  return (
    <div className="flex flex-wrap justify-start items-center gap-2 text-sm text-gray-400">
      <ShortenedDetailsDisplay
        iconConfig={defaultGrantorIcon}
        address={grantor_key}
      />
      <ShortenedDetailsDisplay
        iconConfig={defaultGranteeIcon}
        address={grantee_key}
      />
      {permission_id && (
        <div className="flex items-center gap-1">
          <defaultPermissionIcon.icon size={iconSize} color={iconColor} />
          <span>{smallAddress(permission_id)}</span>
        </div>
      )}
    </div>
  );
}
