import { AGENT_METADATA_SCHEMA } from "@torus-network/sdk/metadata";
import type { CID } from "@torus-network/torus-utils/ipfs";
import { cidToIpfsUri, PIN_FILE_RESULT } from "@torus-network/torus-utils/ipfs";
import { tryAsync } from "@torus-network/torus-utils/try-catch";

import type { PinFileOnPinataResponse } from "~/app/api/files/route";

import type { RegisterAgentFormData } from "./register-agent-schema";

export const pinFile = async (file: File): Promise<PinFileOnPinataResponse> => {
  const body = new FormData();
  body.set("file", file);
  const res = await fetch("/api/files", {
    method: "POST",
    body,
  });
  if (!res.ok) {
    throw new Error(`Failed to upload file: ${res.statusText}`);
  }
  const { cid } = PIN_FILE_RESULT.parse(await res.json());
  return { cid };
};

export const parseUrl = (url: string): string => {
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  } else {
    return "https://" + url;
  }
};

export const strToFile = (
  str: string,
  filename: string,
  type: string = "text/plain",
) => {
  const file = new File([str], filename, { type });
  return file;
};

export async function doMetadataPin(
  data: RegisterAgentFormData,
  iconFile?: File,
): Promise<{ cid: CID | null; iconCid?: CID | null; error?: string }> {
  let iconCid: CID | null = null;
  
  // Pin the icon file if provided
  if (iconFile) {
    const [iconError, iconResult] = await tryAsync(pinFile(iconFile));
    if (iconError !== undefined) {
      return {
        cid: null,
        error: iconError.message || "Error uploading icon",
      };
    }
    iconCid = iconResult.cid;
  }
  
  // Use the pinned icon CID if available
  const imageObj = iconCid
    ? { images: { icon: cidToIpfsUri(iconCid) } }
    : {};

  const metadata = {
    title: data.name,
    short_description: data.shortDescription,
    description: data.body,
    website: data.website ? parseUrl(data.website) : undefined,
    ...imageObj,
    socials: {
      twitter: data.twitter ? parseUrl(data.twitter) : undefined,
      github: data.github ? parseUrl(data.github) : undefined,
      telegram: data.telegram ? parseUrl(data.telegram) : undefined,
      discord: data.discord ? parseUrl(data.discord) : undefined,
    },
  };

  const validatedMetadata = AGENT_METADATA_SCHEMA.safeParse(metadata);
  if (!validatedMetadata.success) {
    return {
      cid: null,
      error: validatedMetadata.error.errors.map((e) => e.message).join(", "),
    };
  }

  const metadataJson = JSON.stringify(metadata, null, 2);
  const file = strToFile(metadataJson, `${data.name}-agent-metadata.json`);

  const [metadataError, metadataResult] = await tryAsync(pinFile(file));

  if (metadataError !== undefined) {
    return {
      cid: null,
      error: metadataError.message || "Error uploading agent metadata",
    };
  }

  return { cid: metadataResult.cid, iconCid };
}