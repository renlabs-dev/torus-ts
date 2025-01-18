import { CID } from "multiformats";
import { z } from "zod";

import type { AnyJson } from "@polkadot/types/types";
import type { Nullish } from "@torus-ts/utils";
import { assert_error } from "@torus-ts/utils";
import { buildIpfsGatewayUrl, IPFS_URI_SCHEMA } from "@torus-ts/utils/ipfs";

export const AGENT_SHORT_DESCRIPTION_MAX_LENGTH = 64;

const z_url = z.string().url();

export const AGENT_METADATA_SCHEMA = z.object({
  title: z.string().nonempty("Agent title is required"),
  short_description: z
    .string()
    .nonempty("Agent short description is required")
    .max(
      AGENT_SHORT_DESCRIPTION_MAX_LENGTH,
      `Short description must be less than ${AGENT_SHORT_DESCRIPTION_MAX_LENGTH} characters"`,
    ),
  description: z.string().nonempty("Agent description is required"),
  icon: z.union([IPFS_URI_SCHEMA, z_url]).optional(),
  banner: z.union([IPFS_URI_SCHEMA, z_url]).optional(),
  website: z_url.optional(),
  socials: z
    .object({
      twitter: z.string(),
      discord: z.string(),
      github: z.string(),
      telegram: z.string(),
    })
    .partial(),
});

export type AgentMetadata = z.infer<typeof AGENT_METADATA_SCHEMA>;

export async function fetchFromIpfsOrUrl<T>(
  uri: string,
  fetcher: (url: string) => T,
): Promise<T> {
  let url: string = uri;

  const problems: Error[] = [];

  // If it's a valid IPFS URI, set the URL to fetch from IPFS gateway
  const parsedCid = IPFS_URI_SCHEMA.safeParse(uri);
  if (parsedCid.success) {
    const cid = parsedCid.data;
    url = buildIpfsGatewayUrl(cid);
  } else {
    problems.push(parsedCid.error);
  }

  let result;
  try {
    result = await fetcher(url);
  } catch (err) {
    assert_error(err);
    problems.push(err);
  }

  if (result == null) {
    throw new Error("Failed to fetch agent metadata:" + problems.join("; "));
  }

  return result;
}

const fetchJson = (url: string): Promise<AnyJson> =>
  fetch(url).then((res) => res.json());

const fetchBlob = (url: string): Promise<Blob> =>
  fetch(url).then((res) => res.blob());

export async function fetchAgentMetadata(
  uri: string,
  { fetchImages = false },
): Promise<{ metadata: AgentMetadata; files: Record<string, Blob | null> }> {
  // fetch Agent Metadata as JSON
  const data = await fetchFromIpfsOrUrl(uri, fetchJson);

  // parse Agent Metadata
  const parsed = AGENT_METADATA_SCHEMA.safeParse(data);
  if (!parsed.success) {
    throw new Error("Failed to parse agent metadata:" + parsed.error.message);
  }
  const metadata = parsed.data;

  const fetchFile = async (name: string, pointer: CID | string | Nullish) => {
    if (pointer == null) {
      return { [name]: null };
    }
    const result =
      pointer instanceof CID
        ? await fetchBlob(buildIpfsGatewayUrl(pointer))
        : await fetchFromIpfsOrUrl(pointer, fetchBlob);
    return { [name]: result };
  };

  if (fetchImages) {
    const { icon, banner } = parsed.data;
    const [iconResult, bannerResult] = await Promise.all([
      fetchFile("icon", icon),
      fetchFile("banner", banner),
    ]);
    return {
      metadata,
      files: {
        ...iconResult,
        ...bannerResult,
      },
    };
  }

  return { metadata, files: {} };
}
