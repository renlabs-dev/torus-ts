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

const getIconCid = async (
  metadata: UpdateAgentFormData,
  currentImageBlobUrl?: string,
): Promise<string | undefined> => {
  if (metadata.imageFile) {
    const { cid } = await pinFile(metadata.imageFile);
    return cidToIpfsUri(cid);
  }

  if (currentImageBlobUrl) {
    const file = await blobUrlToFile(currentImageBlobUrl, "agent-icon.png");
    const { cid } = await pinFile(file);
    return cidToIpfsUri(cid);
  }

  return undefined;
};

export const uploadMetadata = async (
  metadata: UpdateAgentFormData,
  currentImageBlobUrl?: string,
): Promise<string> => {
  const icon = await getIconCid(metadata, currentImageBlobUrl);

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
