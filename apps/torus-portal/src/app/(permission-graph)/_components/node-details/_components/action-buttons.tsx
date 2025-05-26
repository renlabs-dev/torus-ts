import React from 'react';
import type { JSX } from 'react';
import { Copy, Globe, Share2  } from 'lucide-react';
import type {LucideIcon} from 'lucide-react';
import { CopyButton } from '@torus-ts/ui/components/copy-button';
import { useRouter, useSearchParams } from "next/navigation";
import { Tooltip, TooltipContent, TooltipTrigger } from '@torus-ts/ui/components/tooltip';

// Base icon configuration
interface IconConfig {
  size?: number;
  className?: string;
  color?: string;
  strokeWidth?: number;
}

// Base button configuration
interface ActionButtonsConfig {
  className?: string;
  variant?: 'ghost' | 'outline' | 'default'; 
  size?: 'sm' | 'md' | 'lg' | 'icon';
}

// Props for each button type
interface AddressCopyButtonProps {
  link: string;
  icon?: LucideIcon;
  iconConfig?: IconConfig;
  buttonConfig?: ActionButtonsConfig;
  showTooltip?: boolean;
  tooltipText?: string;
}

interface AddressLinkButtonProps {
  link: string;
  icon?: LucideIcon;
  iconConfig?: IconConfig;
  linkClassName?: string;
  baseUrlOverride?: string;
  showLabel?: boolean;
  label?: string;
}

interface NodeJumpButtonProps {
  address: string;
  icon?: LucideIcon;
  iconConfig?: IconConfig;
  linkClassName?: string;
  baseUrlOverride?: string;
  showLabel?: boolean;
  label?: string;
}

const getBaseUrl = (override?: string): string => {
  if (override) return override;
  
  const hostname = typeof window !== "undefined" ? window.location.hostname : '';
  const isTestnet = hostname.includes("testnet") || hostname.includes("localhost");
  
  return isTestnet
    ? "https://allocator.testnet.torus.network/agent/"
    : "https://allocator.torus.network/agent/";
};

export function AddressCopyButton({
  link,
  icon: Icon = Copy,
  iconConfig = {},
  buttonConfig = {},
}: AddressCopyButtonProps): JSX.Element {
  const defaultIconConfig: IconConfig = {
    size: 16,
    className: "hover:opacity-20 opacity-40  transition-opacity duration-150",
    ...iconConfig
  };

  const defaultButtonConfig: ActionButtonsConfig = {
    className: "hover:text-muted-foreground h-fit p-0",
    variant: "ghost",
    ...buttonConfig
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <CopyButton
          className={defaultButtonConfig.className}
          variant={defaultButtonConfig.variant}
          copy={link}
        >
          <Icon 
            className={defaultIconConfig.className}
            size={defaultIconConfig.size}
            color={defaultIconConfig.color}
            strokeWidth={defaultIconConfig.strokeWidth}
          />
        </CopyButton>
      </TooltipTrigger>
      <TooltipContent>
        {"Copy Address"}
      </TooltipContent>
    </Tooltip>
  )
}

export function AddressLinkButton({
  link,
  icon: Icon = Globe,
  iconConfig = {},
  linkClassName = "flex items-center gap-1 text-sm text-gray-400 hover:text-white transition-colors duration-200",
  baseUrlOverride,
  showLabel = false,
  label = "View in Explorer"
}: AddressLinkButtonProps): JSX.Element {
  const defaultIconConfig: IconConfig = {
    size: 16,
    className: "opacity-60 hover:opacity-30 transition-opacity duration-150",
    ...iconConfig
  };

  const href = `${getBaseUrl(baseUrlOverride)}${link}`;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className={linkClassName}
        >
          <Icon 
            className={defaultIconConfig.className}
            size={defaultIconConfig.size}
            color={defaultIconConfig.color}
            strokeWidth={defaultIconConfig.strokeWidth}
          />
          {showLabel && <span>{label}</span>}
        </a>
      </TooltipTrigger>
      <TooltipContent>
        {"View in Explorer"}
      </TooltipContent>
    </Tooltip>
  );
}

export function NodeJumpButton({
  address,
  icon: Icon = Share2,
  iconConfig = {},
  linkClassName = "flex items-center gap-1 text-sm text-gray-400 hover:text-white transition-colors duration-200",
  showLabel = false,
  label = "View in Explorer"
}: NodeJumpButtonProps): JSX.Element {
  const defaultIconConfig: IconConfig = {
    size: 16,
    className: "opacity-60 hover:opacity-30 transition-opacity duration-150",
    ...iconConfig
  };
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault(); 
    const params = new URLSearchParams(searchParams.toString());
    params.set('agent', address);
    router.replace(`/permission-graph?${params.toString()}`, { scroll: false });
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <a
          href={""}
          onClick={handleClick}
          target="_blank"
          rel="noopener noreferrer"
          className={linkClassName}
        >
          <Icon 
            className={defaultIconConfig.className}
            size={defaultIconConfig.size}
            color={defaultIconConfig.color}
            strokeWidth={defaultIconConfig.strokeWidth}
          />
          {showLabel && <span>{label}</span>}
        </a>
      </TooltipTrigger>
      <TooltipContent>
        {"Jump to Node"}
      </TooltipContent>
    </Tooltip>
  );
}

interface UnifiedAddressButtonProps {
  link?: string;
  address?: string;
  type: 'copy' | 'link' | 'go';
  icon?: LucideIcon;
  iconConfig?: IconConfig;
  copyProps?: Partial<AddressCopyButtonProps>;
  linkProps?: Partial<AddressLinkButtonProps>;
}

export function AddressActionButton({
  link,
  address,
  type,
  icon,
  iconConfig,
  copyProps,
  linkProps
}: UnifiedAddressButtonProps): JSX.Element {
  switch (type) {
    case 'copy':
      return (
        <AddressCopyButton 
          link={link ?? ""} 
          icon={icon} 
          iconConfig={iconConfig}
          {...copyProps}
        />
      );
    case 'link':
      return (
        <AddressLinkButton 
          link={link ?? ""} 
          icon={icon ?? Globe} 
          iconConfig={iconConfig}
          {...linkProps}
        />
      );
    case 'go':
      return (
        <NodeJumpButton 
          address={address ?? ""} 
          icon={icon ?? Share2} 
          iconConfig={iconConfig}
          {...linkProps}
        />
      );
    default:
      return <></>;
  }
}

// Button group component for common patterns
interface ActionButtonProps {
  connectedAddress: string;
  showCopy?: boolean;
  showExplorer?: boolean;
  showGo?: boolean;
  iconSize?: number;
  className?: string;
}

export function ActionButtons({
  connectedAddress,
  showCopy = true,
  showExplorer = true,
  showGo = true,
  iconSize = 16,
  className = "flex items-center gap-2"
}: ActionButtonProps): JSX.Element {
  return (
    <div className={className}>
      {showCopy && (
        <AddressCopyButton 
          link={connectedAddress}
          iconConfig={{ size: iconSize }}
        />
      )}
      {showExplorer && (
        <AddressLinkButton 
          link={connectedAddress}
          iconConfig={{ size: iconSize }}
        />
      )}
      {showGo && (
        <NodeJumpButton 
          address={connectedAddress}
          iconConfig={{ size: iconSize }}
        />
      )}
    </div>
  );
}