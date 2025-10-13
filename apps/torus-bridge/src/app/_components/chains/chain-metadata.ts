import type { IRegistry } from "@hyperlane-xyz/registry";
import { chainMetadata as publishedChainMetadata } from "@hyperlane-xyz/registry";
import type { ChainMap, ChainMetadata, ChainName } from "@hyperlane-xyz/sdk";
import { ChainMetadataSchema, mergeChainMetadataMap } from "@hyperlane-xyz/sdk";
import { objFilter, objMap, promiseObjAll } from "@hyperlane-xyz/utils";
import { tryAsync, trySync } from "@torus-network/torus-utils/try-catch";
import { chainsTS } from "~/consts/chains";
import chainsJson from "~/consts/chains.json";
import { config } from "~/consts/config";
import { logger } from "~/utils/logger";
import { z } from "zod";

/**
 * Builds combined chain metadata by validating filesystem data, optionally fetching registry data and logos, filtering by the provided token chains, and applying optional per-chain overrides.
 *
 * @param chainsInTokens - Array of chain names to include; any registry entries not in this list are discarded.
 * @param registry - Registry client used to obtain registry metadata and chain logo URIs.
 * @param storeMetadataOverrides - Optional map of per-chain partial overrides that are merged onto the final metadata.
 * @returns An object containing:
 *   - `chainMetadata`: the merged chain metadata from registry (with logos) and filesystem sources,
 *   - `chainMetadataWithOverrides`: `chainMetadata` after applying `storeMetadataOverrides`.
 */
export async function assembleChainMetadata(
  chainsInTokens: ChainName[],
  registry: IRegistry,
  storeMetadataOverrides?: ChainMap<Partial<ChainMetadata | undefined>>,
) {
  // Chains must include a cosmos chain or CosmosKit throws errors
  const [metadataParseError, parsedMetadata] = trySync(() =>
    z.record(z.string(), ChainMetadataSchema).safeParse({
      ...(chainsJson as ChainMap<ChainMetadata>),
      ...chainsTS,
    }),
  );

  if (metadataParseError !== undefined) {
    logger.warn("Error parsing chain metadata:", metadataParseError);
    throw metadataParseError;
  }

  if (!parsedMetadata.success) {
    logger.warn("Invalid chain metadata", parsedMetadata.error);
    throw new Error(
      `Invalid chain metadata: ${parsedMetadata.error.toString()}`,
    );
  }

  const filesystemMetadata = parsedMetadata.data as ChainMap<ChainMetadata>;
  let registryChainMetadata: ChainMap<ChainMetadata>;

  if (config.registryUrl) {
    logger.debug("Using custom registry metadata from:", config.registryUrl);
    const [registryError, metadata] = await tryAsync(
      Promise.resolve(registry.getMetadata()),
    );

    if (registryError !== undefined) {
      logger.error("Error getting registry metadata:", registryError);
      throw registryError;
    }

    registryChainMetadata = metadata;
  } else {
    logger.debug("Using default published registry");
    registryChainMetadata = publishedChainMetadata;
  }

  // Filter out chains that are not in the tokens config
  registryChainMetadata = objFilter(
    registryChainMetadata,
    (c, m): m is ChainMetadata => chainsInTokens.includes(c),
  );

  // TODO: have the registry do this automatically
  const [logoMappingError, metadataWithLogos] = await tryAsync(
    promiseObjAll(
      objMap(
        registryChainMetadata,
        async (chainName, metadata): Promise<ChainMetadata> => {
          const [logoError, logoUri] = await tryAsync(
            registry.getChainLogoUri(chainName),
          );

          if (logoError !== undefined) {
            logger.warn(
              `Error getting logo URI for chain ${chainName}:`,
              logoError,
            );
            return { ...metadata, logoURI: undefined };
          }

          return {
            ...metadata,
            logoURI: logoUri ?? undefined,
          };
        },
      ),
    ),
  );

  if (logoMappingError !== undefined) {
    logger.error("Error mapping chain logos:", logoMappingError);
    throw logoMappingError;
  }

  registryChainMetadata = metadataWithLogos;

  const chainMetadata = mergeChainMetadataMap(
    registryChainMetadata,
    filesystemMetadata,
  );

  const chainMetadataWithOverrides = mergeChainMetadataMap(
    chainMetadata,
    storeMetadataOverrides,
  );

  return { chainMetadata, chainMetadataWithOverrides };
}