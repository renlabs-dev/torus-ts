import type { ZodSchema } from "zod";
import { match } from "rustie";
import { z } from "zod";

import type { Result } from "@torus-ts/utils";
import { buildIpfsGatewayUrl, parseIpfsUri } from "@torus-ts/utils/ipfs";

export interface CustomDataError {
  message: string;
}

export const DAO_METADATA_SCHEMA = z.object({
  title: z.string(),
  body: z.string(),
  discord_id: z.string().optional(),
});
export type CustomMetadataState = Result<CustomMetadata, CustomDataError>;
export type CustomDaoMetadata = z.infer<typeof DAO_METADATA_SCHEMA>;

const CUSTOM_METADATA_SCHEMA = z.object({
  title: z.string().optional(),
  body: z.string().optional(),
});

export type CustomMetadata = z.infer<typeof CUSTOM_METADATA_SCHEMA>;
export function appendErrorInfo(
  err_msg: string,
  info: string,
  sep = " ",
): { Err: CustomDataError } {
  const message = err_msg + sep + info;
  return { Err: { message } };
}

export async function processMetadata(
  zodSchema: ZodSchema,
  url: string,
  entryId: number,
  kind?: string,
) {
  const response = await fetch(url);
  const obj: unknown = await response.json();

  const validated = zodSchema.safeParse(obj);
  if (!validated.success) {
    const message = `Invalid metadata for ${kind} ${entryId} at ${url}`;
    return { Err: { message } };
  }
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  return { Ok: validated.data };
}

export async function processProposalMetadata(url: string, entryId: number) {
  return await processMetadata(
    CUSTOM_METADATA_SCHEMA,
    url,
    entryId,
    "proposal",
  );
}

export async function processDaoMetadata(
  url: string,
  entryId: number,
): Promise<Result<CustomDaoMetadata, CustomDataError>> {
  return await processMetadata(CUSTOM_METADATA_SCHEMA, url, entryId, "dao");
}

export async function fetchCustomMetadata(
  kind: "proposal" | "dao",
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
          : await processDaoMetadata(url, entryId);
      return metadata;
    },
    // eslint-disable-next-line @typescript-eslint/require-await
    async Err({ message }) {
      return appendErrorInfo(message, `for ${kind} ${entryId}`);
    },
  });
}
