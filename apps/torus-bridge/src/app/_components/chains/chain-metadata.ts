import type { IRegistry } from "@hyperlane-xyz/registry";
import { chainMetadata as publishedChainMetadata } from "@hyperlane-xyz/registry";
import type { ChainMap, ChainMetadata, ChainName } from "@hyperlane-xyz/sdk";
import { ChainMetadataSchema, mergeChainMetadataMap } from "@hyperlane-xyz/sdk";
import { objFilter, objMap, promiseObjAll } from "@hyperlane-xyz/utils";
import { chainsTS } from "~/consts/chains";
import chainsYaml from "~/consts/chains.yaml";
import { config } from "~/consts/config";
import { logger } from "~/utils/logger";
import { z } from "zod";
import { tryAsync, trySync } from "@torus-network/torus-utils/try-catch";

export async function assembleChainMetadata(
  chainsInTokens: ChainName[],
  registry: IRegistry,
  storeMetadataOverrides?: ChainMap<Partial<ChainMetadata | undefined>>,
) {
  // Chains must include a cosmos chain or CosmosKit throws errors
  const [metadataParseError, parsedMetadata] = trySync(() =>
    z.record(ChainMetadataSchema).safeParse({
      ...(chainsYaml as ChainMap<ChainMetadata>),
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
