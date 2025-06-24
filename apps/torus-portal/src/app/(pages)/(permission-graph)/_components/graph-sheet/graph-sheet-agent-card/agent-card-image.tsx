"use client";

import Image from "next/image";
import { Icons } from "@torus-ts/ui/components/icons";
import { useEffect, useState } from "react";

interface AgentCardImageProps {
  iconBlob?: Blob | null;
  iconUrl?: string | null;
  alt?: string;
}

export function AgentCardImage({ iconBlob, iconUrl }: AgentCardImageProps) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);

  // Handle blob to URL conversion if blob is provided
  useEffect(() => {
    if (!iconBlob) return;

    const objectUrl = URL.createObjectURL(iconBlob);
    setBlobUrl(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [iconBlob]);

  // Use blob URL if available, otherwise use direct URL
  const imageSource = blobUrl ?? iconUrl;

  if (imageSource) {
    return (
      <Image
        src={imageSource}
        alt="Agent icon"
        width={1000}
        height={1000}
        className="aspect-square rounded-sm shadow-xl md:h-32 md:w-32"
      />
    );
  }

  // Fallback placeholder
  return (
    <div
      className="flex aspect-square items-center justify-center rounded-sm border bg-gray-500/10
        shadow-xl md:h-32 md:w-32"
    >
      <Icons.Logo className="h-36 w-36 opacity-30 md:h-20 md:w-20" />
    </div>
  );
}
