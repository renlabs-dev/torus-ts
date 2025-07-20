"use client";

import { useEffect, useState } from "react";

import type { Nullish } from "@torus-network/torus-utils";

export const useBlobUrl = (blob: Blob | Nullish) => {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!blob) return;
    const objectUrl = URL.createObjectURL(blob);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [blob]);

  return url;
};
