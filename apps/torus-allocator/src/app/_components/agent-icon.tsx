import { Icons } from "@torus-ts/ui/components/icons";
import BlobImage from "./blob-image";

interface AgentIconProps {
  icon?: Blob;
  alt?: string;
}

export function AgentIcon({ icon, alt }: AgentIconProps) {
  if (icon) {
    <BlobImage blob={icon} alt={alt ?? "Agent icon"} />;
  }

  return (
    <div
      className="flex aspect-square h-full w-full items-center justify-center rounded-sm border
        bg-gray-500/10 shadow-xl md:h-32 md:w-32 md:max-h-48 md:min-h-48 md:min-w-48
        md:max-w-48"
    >
      <Icons.Logo className="h-36 w-36 opacity-30 md:h-20 md:w-20" />
    </div>
  );
}
