"use client";

import type { Nullish } from "@torus-network/torus-utils";
import { useEffect, useState } from "react";

export const useBlobUrl = (blob: Blob | Nullish) => {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!blob) return;
    const objectUrl = URL.createObjectURL(blob);
    const timer = setTimeout(() => setUrl(objectUrl), 0);
    return () => {
      clearTimeout(timer);
      URL.revokeObjectURL(objectUrl);
    };
  }, [blob]);

  return url;
};
