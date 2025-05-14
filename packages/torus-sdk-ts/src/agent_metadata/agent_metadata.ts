import type { AnyJson } from "@polkadot/types/types";
import {
  assert_error,
  typed_non_null_entries,
} from "../utils";
import {
  buildIpfsGatewayUrl,
  IPFS_URI_SCHEMA,
} from "../utils/ipfs";
import { tryAsync, trySync } from "../utils/try-catch";
import { CID } from "multiformats";
import { z } from "zod";

export const AGENT_SHORT_DESCRIPTION_MAX_LENGTH = 100;

const z_url = z.string().url();

export const AGENT_METADATA_SCHEMA = z.object({
  title: z.string().nonempty("Agent title is required"),
  short_description: z
    .string()
    .nonempty("Agent short description is required")
    .max(
      AGENT_SHORT_DESCRIPTION_MAX_LENGTH,
      `Agent short description must be less than ${AGENT_SHORT_DESCRIPTION_MAX_LENGTH} characters long`,
    ),
  description: z.string().nonempty("Agent description is required"),
  website: z.string().optional(),
  images: z
    .object({
      icon: z.union([IPFS_URI_SCHEMA, z_url]),
      banner: z.union([IPFS_URI_SCHEMA, z_url]),
    })
    .partial()
    .optional(),
  socials: z
    .object({
      discord: z.string().optional(),
      github: z.string().optional(),
      telegram: z.string().optional(),
      twitter: z.string().optional(),
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
  let url: string = uri;
  const problems: Error[] = [];

  // Parse the URI to check if it's a valid IPFS URI
  const [parseError, parsedCid] = trySync(() => IPFS_URI_SCHEMA.safeParse(uri));

  if (parseError !== undefined) {
    problems.push(parseError);
  } else if (parsedCid.success) {
    url = buildIpfsGatewayUrl(parsedCid.data);
  } else {
    problems.push(parsedCid.error);
  }

  // Fetch from the determined URL
  const [fetchError, result] = await tryAsync(fetcher(url));

  if (fetchError !== undefined) {
    problems.push(fetchError);
  }

  if (result == null) {
    throw new Error("Failed to fetch agent metadata:" + problems.join("; "));
  }

  return result;
}

const fetchJson = (url: string): Promise<AnyJson> =>
  fetch(url).then((res) => res.json() as unknown as AnyJson);

const fetchBlob = (url: string): Promise<Blob> =>
  fetch(url).then((res) => res.blob());

export interface AgentMetadataResult {
  metadata: AgentMetadata;
  images: Partial<Record<AgentMetadataImageName, Blob>>;
}

export async function fetchAgentMetadata(
  uri: string,
  { fetchImages = false },
): Promise<AgentMetadataResult> {
  // fetch Agent Metadata as JSON
  const data = await fetchFromIpfsOrUrl(uri, fetchJson);

  // parse Agent Metadata
  const parsed = AGENT_METADATA_SCHEMA.safeParse(data);
  if (!parsed.success) {
    throw new Error("Failed to parse agent metadata:" + parsed.error.message);
  }
  const metadata = parsed.data;

  const fetchFile = async <Name extends string>(
    name: Name,
    pointer: CID | string,
  ): Promise<Record<Name, Blob>> => {
    const result =
      pointer instanceof CID
        ? await fetchBlob(buildIpfsGatewayUrl(pointer))
        : await fetchFromIpfsOrUrl(pointer, fetchBlob);
    return { [name]: result } as Record<Name, Blob>;
  };

  const imageUris = parsed.data.images;

  if (fetchImages && imageUris) {
    // const entries = typed_non_null_entries(imageUris);
    const jobs = typed_non_null_entries(imageUris).map(([name, pointer]) =>
      fetchFile(name, pointer),
    );
    const imageResults = await Promise.all(jobs);

    const images = imageResults.reduce((acc, curr) => ({ ...acc, ...curr }));

    return {
      metadata,
      images,
    };
  }

  return { metadata, images: {} };
}
