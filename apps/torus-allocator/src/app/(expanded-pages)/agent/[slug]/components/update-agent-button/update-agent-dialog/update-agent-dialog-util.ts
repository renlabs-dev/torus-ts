"use client";

import type { UpdateAgentFormData } from "./update-agent-dialog-form-schema";
import { tryAsync } from "@torus-network/torus-utils/try-catch";

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
  const [responseErr, response] = await tryAsync(fetch(blobUrl));
  if (responseErr) {
    throw new Error(`Failed to fetch blob URL: ${responseErr.message}`);
  }

  const [blobErr, blob] = await tryAsync(response.blob());
  if (blobErr) {
    throw new Error(`Failed to fetch blob URL: ${blobErr.message}`);
  }

  const mimeType = blob.type;
  const extension = mimeType.split("/")[1] ?? "bin";
  const baseName = filename.replace(/\.[^/.]+$/, "");
  const finalFilename = `${baseName}.${extension}`;

  return new File([blob], finalFilename, { type: mimeType });
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
    title: metadata.name,
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
