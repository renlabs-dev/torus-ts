"use client";

import React from 'react';
import type { JSX } from 'react';
import { smallAddress } from '@torus-network/torus-utils/subspace';
import { formatScope } from '../../permission-graph-utils';
import { UserPlus, UserPen, Layers  } from "lucide-react";
import type {LucideIcon} from "lucide-react";
import type { PermissionDetail } from '../../permission-graph-utils';

interface IconConfig {
  icon: LucideIcon;
  size?: number;
  color?: string;
  strokeWidth?: number;
  className?: string;
}

interface LinkButtonsProps {
  details: PermissionDetail | undefined;
  grantorIcon?: IconConfig;
  granteeIcon?: IconConfig;
  scopeIcon?: IconConfig;
  iconSize?: number;
  iconColor?: string;
}

export function LinkButtons({
  details,
  grantorIcon,
  granteeIcon,
  scopeIcon,
  iconSize = 16,
  iconColor = "currentColor"
}: LinkButtonsProps): JSX.Element {
  if (!details) {
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
    ...grantorIcon
  };

  const defaultGranteeIcon: IconConfig = {
    icon: UserPen,
    size: iconSize,
    color: iconColor,
    ...granteeIcon
  };

  const defaultScopeIcon: IconConfig = {
    icon: Layers,
    size: iconSize,
    color: iconColor,
    ...scopeIcon
  };

  const AddressDisplay = ({ 
    address, 
    label,
    iconConfig
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
    <div className="flex flex-wrap justify-between items-center gap-2 text-sm text-gray-400 font-mono">
      <AddressDisplay 
        iconConfig={defaultGrantorIcon}
        address={smallAddress(details.grantor_key, 3)}
      />
      <AddressDisplay 
        iconConfig={defaultGranteeIcon}
        address={smallAddress(details.grantee_key, 3)}
      />
      <AddressDisplay
        iconConfig={defaultScopeIcon}
        address={formatScope(details.scope)}
      />
    </div>
  );
}