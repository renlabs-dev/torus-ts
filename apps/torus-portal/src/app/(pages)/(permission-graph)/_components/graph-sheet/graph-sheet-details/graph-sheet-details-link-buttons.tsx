"use client";

import { smallAddress } from "@torus-network/torus-utils/torus";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@torus-ts/ui/components/tooltip";
import { AddressWithAgent } from "~/app/_components/address-with-agent";
import type { LucideIcon } from "lucide-react";
import { HandCoins, Layers, UserPlus } from "lucide-react";
import type { JSX } from "react";
import React from "react";

interface ShortenedDetailsDisplayProps {
  iconConfig: IconConfig;
  address: string;
  label?: string;
}

function ShortenedDetailsDisplay({
  address,
  label,
  iconConfig,
}: ShortenedDetailsDisplayProps) {
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
}

interface IconConfig {
  icon: LucideIcon;
  size?: number;
  color?: string;
  strokeWidth?: number;
  className?: string;
}

interface LinkButtonsProps {
  grantor_key: string | undefined;
  recipients?: string[] | string | null; // Handles all cases: multiple, single, or no recipients
  permission_id?: string | undefined;
  grantorIcon?: IconConfig;
  recipientIcon?: IconConfig;
  permissionIcon?: IconConfig;
  iconSize?: number;
  iconColor?: string;
}

export function GraphSheetDetailsLinkButtons({
  grantor_key,
  recipients,
  permission_id,
  grantorIcon,
  recipientIcon,
  permissionIcon,
  iconSize = 16,
  iconColor = "currentColor",
}: LinkButtonsProps): JSX.Element {
  if (!grantor_key) {
    return (
      <div className="flex items-center justify-center gap-2 font-mono text-sm text-gray-400">
        <span>No grantor available</span>
      </div>
    );
  }

  const defaultGrantorIcon: IconConfig = {
    icon: UserPlus,
    size: iconSize,
    color: iconColor,
    ...grantorIcon,
  };

  const defaultRecipientIcon: IconConfig = {
    icon: HandCoins,
    size: iconSize,
    color: iconColor,
    ...recipientIcon,
  };

  const defaultPermissionIcon: IconConfig = {
    icon: Layers,
    size: iconSize,
    color: iconColor,
    ...permissionIcon,
  };

  const shouldShowRecipient = recipients && typeof recipients === "string";
  const hasMultipleRecipients =
    Array.isArray(recipients) && recipients.length > 1;
  const hasSingleRecipientArray =
    Array.isArray(recipients) && recipients.length === 1;

  return (
    <div className="flex flex-wrap items-center justify-start gap-2 text-sm text-gray-400">
      <ShortenedDetailsDisplay
        iconConfig={defaultGrantorIcon}
        address={grantor_key}
      />
      {shouldShowRecipient && (
        <ShortenedDetailsDisplay
          iconConfig={defaultRecipientIcon}
          address={recipients}
        />
      )}
      {hasSingleRecipientArray && recipients[0] && (
        <ShortenedDetailsDisplay
          iconConfig={defaultRecipientIcon}
          address={recipients[0]}
        />
      )}
      {hasMultipleRecipients && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex cursor-help items-center gap-1">
                <HandCoins size={iconSize} color={iconColor} />
                <span>{recipients.length} Recipients</span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <div className="space-y-1">
                {recipients.map((address, index) => (
                  <div key={address} className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">#{index + 1}</span>
                    <AddressWithAgent
                      address={address}
                      showCopyButton={false}
                      addressLength={6}
                    />
                  </div>
                ))}
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
      {permission_id && (
        <div className="flex items-center gap-1">
          <defaultPermissionIcon.icon size={iconSize} color={iconColor} />
          <span>{smallAddress(permission_id)}</span>
        </div>
      )}
    </div>
  );
}
