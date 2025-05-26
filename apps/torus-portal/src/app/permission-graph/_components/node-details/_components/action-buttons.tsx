import React from 'react';
import type { JSX } from 'react';
import { Copy, Globe, Share2  } from 'lucide-react';
import type {LucideIcon} from 'lucide-react';
import { CopyButton } from '@torus-ts/ui/components/copy-button';
import { useRouter } from "next/navigation";

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
  showTooltip = false,
  tooltipText = "Copy address"
}: AddressCopyButtonProps): JSX.Element {
  const defaultIconConfig: IconConfig = {
    size: 16,
    className: "opacity-60 hover:opacity-100 transition-opacity duration-150",
    ...iconConfig
  };

  const defaultButtonConfig: ActionButtonsConfig = {
    className: "hover:text-muted-foreground h-fit p-0",
    variant: "ghost",
    ...buttonConfig
  };

  const button = (
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
  );

  if (showTooltip) {
    return (
      <div className="relative group">
        {button}
        <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
          {tooltipText}
        </span>
      </div>
    );
  }

  return button;
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
    className: "opacity-60 hover:opacity-100 transition-opacity duration-150",
    ...iconConfig
  };

  const href = `${getBaseUrl(baseUrlOverride)}${link}`;

  return (
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
    className: "opacity-60 hover:opacity-100 transition-opacity duration-150",
    ...iconConfig
  };
  const router = useRouter();

 const handleClick = (e: React.MouseEvent) => {
    e.preventDefault(); 

    const currentPath = window.location.pathname;
    const pathParts = currentPath.split("/");
    pathParts[pathParts.length - 1] = address; 
    const newPath = pathParts.join("/");

    router.push(newPath);
  };

  return (
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
  );
}


// Unified button component that can be either type
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
          showTooltip={true}
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
