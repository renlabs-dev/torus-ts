import { CID } from "multiformats";
import { z } from "zod";

import { typed_non_null_entries } from "@torus-network/torus-utils";
import {
  buildIpfsGatewayUrl,
  IPFS_URI_SCHEMA,
} from "@torus-network/torus-utils/ipfs";
import { tryAsync, trySync } from "@torus-network/torus-utils/try-catch";

export const AGENT_SHORT_DESCRIPTION_MAX_LENGTH = 201;

const zUrl = z.string().url();
const zIpfsOrUrl = z.union([IPFS_URI_SCHEMA, zUrl]);

export const AGENT_METADATA_SCHEMA = z.object({
  title: z.string().nonempty("Agent title is required"),
  short_description: z
    .string()
    .nonempty("Agent short description is required")
    .max(
      AGENT_SHORT_DESCRIPTION_MAX_LENGTH,
      `Agent short description must be less than ${AGENT_SHORT_DESCRIPTION_MAX_LENGTH} characters`,
    ),
  description: z
    .string()
    .max(3000, "Agent description must be less than 3000 characters"),
  website: zUrl.optional(),
  images: z
    .object({
      icon: zIpfsOrUrl,
      banner: zIpfsOrUrl,
    })
    .partial()
    .optional()
    .transform((val) => (val && Object.keys(val).length > 0 ? val : undefined)),
  socials: z
    .object({
      discord: zUrl.optional(),
      github: zUrl.optional(),
      telegram: zUrl.optional(),
      twitter: zUrl.optional(),
    })
    .partial()
    .optional(),
});

export type AgentMetadata = z.infer<typeof AGENT_METADATA_SCHEMA>;
export type AgentMetadataImageName = keyof NonNullable<AgentMetadata["images"]>;

export async function fetchFromIpfsOrUrl<T>(
  uri: string,
  fetcher: (url: string) => Promise<T>,
): Promise<T> {
  const [parseError, parsedCid] = trySync(() => IPFS_URI_SCHEMA.parse(uri));
  const url = parseError ? uri : buildIpfsGatewayUrl(parsedCid);

  const [fetchError, result] = await tryAsync(fetcher(url));

  if (fetchError) {
    throw new Error(`Failed to fetch from ${uri}: ${fetchError.message}`);
  }

  return result;
}

const fetchJson = (url: string): Promise<AgentMetadata> =>
  fetch(url).then((res) => res.json() as unknown as AgentMetadata);

const fetchBlob = (url: string): Promise<Blob> =>
  fetch(url).then((res) => res.blob());

export interface AgentMetadataResult {
  metadata: AgentMetadata;
  images: Partial<Record<AgentMetadataImageName, Blob>>;
}

async function fetchImage(
  name: AgentMetadataImageName,
  pointer: CID | string,
): Promise<Partial<Record<AgentMetadataImageName, Blob>>> {
  const blob =
    pointer instanceof CID
      ? await fetchBlob(buildIpfsGatewayUrl(pointer))
      : await fetchFromIpfsOrUrl(pointer, fetchBlob);
  return { [name]: blob };
}

export async function fetchAgentMetadata(
  uri: string,
  { fetchImages = false }: { fetchImages?: boolean } = {},
): Promise<AgentMetadataResult> {
  const uriWithIpfs = uri.startsWith("ipfs://") ? uri : `ipfs://${uri}`;
  const data = await fetchFromIpfsOrUrl<AgentMetadata>(uriWithIpfs, fetchJson);

  const [parseError, parsed] = trySync(() =>
    AGENT_METADATA_SCHEMA.safeParse(data),
  );

  if (parseError) {
    console.error(
      `Failed to parse agent metadata: ${parseError.message}`,
      data,
    );
  }

  const metadata = parsed?.data ?? data;

  if (!fetchImages || !metadata.images) {
    return { metadata, images: {} };
  }

  const imagePromises = typed_non_null_entries(metadata.images).map(
    ([name, pointer]) => fetchImage(name, pointer),
  );

  const images = (await Promise.all(imagePromises)).reduce(
    (acc, curr) => Object.assign(acc, curr),
    {},
  );

  return { metadata, images };
}
