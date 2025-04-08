import type { Result } from "@torus-network/torus-utils";
import {
  buildIpfsGatewayUrl,
  IPFS_URI_SCHEMA,
} from "@torus-network/torus-utils/ipfs";
import type { ZodSchema } from "zod";
import { z } from "zod";
import type { AgentMetadata } from "./agent_metadata/agent_metadata";
import { AGENT_METADATA_SCHEMA } from "./agent_metadata/agent_metadata";

const CUSTOM_METADATA_SCHEMA = z.object({
  title: z.string().optional(),
  body: z.string().optional(),
});
export type CustomMetadata = z.infer<typeof CUSTOM_METADATA_SCHEMA>;

export const APPLICATION_METADATA_SCHEMA = z.object({
  title: z.string(),
  body: z.string(),
  discord_id: z.string().optional(),
});
export type ApplicationMetadata = z.infer<typeof APPLICATION_METADATA_SCHEMA>;

export interface CustomDataError {
  message: string;
}

export type CustomMetadataState = Result<CustomMetadata, CustomDataError>;

export async function processMetadata<T extends CustomMetadata>(
  zodSchema: ZodSchema<T>,
  url: string,
  entryId: number,
  kind?: string,
): Promise<Result<T, CustomDataError>> {
  const response = await fetch(url);
  const obj: unknown = await response.json();

  const validated = zodSchema.safeParse(obj);
  if (!validated.success) {
    const message = `Invalid metadata for ${kind} ${entryId} at ${url}`;
    return { Err: { message } };
  }
  return { Ok: validated.data };
}

export async function processProposalMetadata(
  url: string,
  entryId: number,
): Promise<Result<CustomMetadata, CustomDataError>> {
  return await processMetadata(
    CUSTOM_METADATA_SCHEMA,
    url,
    entryId,
    "PROPOSAL",
  );
}

export async function processApplicationMetadata(
  url: string,
  entryId: number,
): Promise<Result<ApplicationMetadata, CustomDataError>> {
  return await processMetadata(
    APPLICATION_METADATA_SCHEMA,
    url,
    entryId,
    "AGENT_APPLICATION",
  );
}

export async function processAgentMetadata(
  url: string,
  entryId: number,
): Promise<Result<AgentMetadata, CustomDataError>> {
  return await processMetadata(AGENT_METADATA_SCHEMA, url, entryId, "AGENT  ");
}

export async function fetchCustomMetadata(
  kind: "proposal" | "application" | "agent",
  entryId: number,
  metadataField: string,
): Promise<Result<CustomMetadata, CustomDataError>> {
  const r = IPFS_URI_SCHEMA.safeParse(metadataField);

  if (!r.success) {
    return appendErrorInfo(
      r.error.errors.map((e) => e.message).join("\n"),
      `for ${kind} ${entryId}`,
    );
  }

  const cid = r.data;
  const url = buildIpfsGatewayUrl(cid);

  let metadata;
  if (kind === "proposal") {
    metadata = await processProposalMetadata(url, entryId);
  } else if (kind === "application") {
    metadata = await processApplicationMetadata(url, entryId);
  } else {
    metadata = await processAgentMetadata(url, entryId);
  }

  return metadata;
}

export function appendErrorInfo(
  err_msg: string,
  info: string,
  sep = " ",
): { Err: CustomDataError } {
  const message = err_msg + sep + info;
  return { Err: { message } };
}
