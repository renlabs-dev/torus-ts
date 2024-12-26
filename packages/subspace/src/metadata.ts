import type { ZodSchema } from "zod";
import { match } from "rustie";
import { z } from "zod";

import type { Result } from "@torus-ts/utils";
import { buildIpfsGatewayUrl, parseIpfsUri } from "@torus-ts/utils/ipfs";

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

export async function fetchCustomMetadata(
  kind: "proposal" | "application",
  entryId: number,
  metadataField: string,
): Promise<Result<CustomMetadata, CustomDataError>> {
  const r = parseIpfsUri(metadataField);

  return await match(r)({
    async Ok(cid) {
      const url = buildIpfsGatewayUrl(cid); // this is wrong
      const metadata =
        kind == "proposal"
          ? await processProposalMetadata(url, entryId)
          : await processApplicationMetadata(url, entryId);
      return metadata;
    },
    // eslint-disable-next-line @typescript-eslint/require-await
    async Err({ message }) {
      return appendErrorInfo(message, `for ${kind} ${entryId}`);
    },
  });
}

export function appendErrorInfo(
  err_msg: string,
  info: string,
  sep = " ",
): { Err: CustomDataError } {
  const message = err_msg + sep + info;
  return { Err: { message } };
}
