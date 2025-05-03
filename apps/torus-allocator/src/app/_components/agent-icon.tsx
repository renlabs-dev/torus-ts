import { Icons } from "@torus-ts/ui/components/icons";
import { cn } from "@torus-ts/ui/lib/utils";
import Image from "next/image";
import BlobImage from "./blob-image";

interface AgentIconProps {
  icon?: Blob | string | null;
  alt?: string;
  className?: string;
  containerClassName?: string;
  fallbackClassName?: string;
  fallbackIconClassName?: string;
  variant?: "default" | "compact";
}

export function AgentIcon({
  icon,
  alt = "Agent icon",
  className = "",
  containerClassName = "",
  fallbackClassName = "",
  fallbackIconClassName = "",
  variant = "default",
}: AgentIconProps) {
  const variantClasses = {
    default: "md:h-48 md:w-48",
    compact: "md:h-32 w-full md:w-32",
  };

  const containerStyles = cn(
    "flex aspect-square items-center justify-center rounded-sm border bg-gray-500/10 shadow-xl",
    variantClasses[variant],
    containerClassName,
  );

  const fallbackIconStyles = cn(
    "h-36 w-36 opacity-30 md:h-20 md:w-20",
    fallbackIconClassName,
  );

  if (icon && icon instanceof Blob) {
    return (
      <div className={containerStyles}>
        <BlobImage blob={icon} alt={alt} />
      </div>
    );
  }

  if (icon && typeof icon === "string") {
    return (
      <Image
        src={icon}
        alt={alt}
        width={1000}
        height={1000}
        className={cn(
          "aspect-square rounded-sm shadow-xl",
          className,
          variantClasses[variant],
        )}
      />
    );
  }

  return (
    <div className={cn(containerStyles, fallbackClassName)}>
      <Icons.Logo className={fallbackIconStyles} />
    </div>
  );
}
