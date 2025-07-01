"use client";

import type { UpdateAgentFormData } from "./update-agent-dialog-form-schema";

export const strToFile = (
  str: string,
  filename: string,
  type = "application/json",
): File => {
  const blob = new Blob([str], { type });
  return new File([blob], filename, { type });
};

export const pinFile = async (file: File): Promise<{ cid: string }> => {
  const data = new FormData();
  data.set("file", file);
  const res = await fetch("/api/files", { method: "POST", body: data });
  if (!res.ok) throw new Error(`Failed to upload file: ${res.statusText}`);
  return res.json() as Promise<{ cid: string }>;
};

export const cidToIpfsUri = (cid: string): string => `ipfs://${cid}`;

export const blobUrlToFile = async (
  blobUrl: string,
  filename: string,
): Promise<File> => {
  const response = await fetch(blobUrl);
  const blob = await response.blob();
  return new File([blob], filename, { type: blob.type });
};

export const uploadMetadata = async (
  metadata: UpdateAgentFormData,
  currentImageBlobUrl?: string,
): Promise<string> => {
  let icon: string | undefined;

  if (metadata.imageFile) {
    // New image file selected
    const { cid } = await pinFile(metadata.imageFile);
    icon = cidToIpfsUri(cid);
  } else if (currentImageBlobUrl) {
    // Use existing image from blob URL
    const imageFile = await blobUrlToFile(
      currentImageBlobUrl,
      "agent-icon.png",
    );
    const { cid } = await pinFile(imageFile);
    icon = cidToIpfsUri(cid);
  }

  const images = icon ? { icon } : undefined;

  const finalMetadata = {
    title: metadata.title,
    short_description: metadata.shortDescription,
    description: metadata.description,
    website: metadata.website,
    socials: metadata.socials,
    ...(images && { images }),
  };

  const metadataFile = strToFile(
    JSON.stringify(finalMetadata, null, 2),
    `${metadata.name}-agent-metadata.json`,
  );

  const { cid } = await pinFile(metadataFile);

  return cid;
};
