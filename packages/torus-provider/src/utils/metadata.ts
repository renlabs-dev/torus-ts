import type { ApiPromise } from "@polkadot/api";
import type {
  InjectedExtension,
  MetadataDef,
  InjectedMetadataKnown,
} from "@polkadot/extension-inject/types";
import { getSpecTypes } from "@polkadot/types-known";
import { base64Encode } from "@polkadot/util-crypto";

async function getMetadata(api: ApiPromise, extension: InjectedExtension) {
  console.log(`Attempting to get metadata for extension: ${extension.name}`);

  if (!extension.metadata) {
    console.warn(
      `No metadata interface found for extension: ${extension.name}`,
    );
    return null;
  }

  try {
    const metadata = extension.metadata;
    const known = await metadata.get();
    console.log(`Current known metadata for ${extension.name}:`, {
      knownVersions: known.map((k: InjectedMetadataKnown) => ({
        genesisHash: k.genesisHash,
        specVersion: k.specVersion,
      })),
    });

    return {
      extension,
      known,
      update: async (def: MetadataDef): Promise<boolean> => {
        try {
          console.log(`Forcing metadata update for ${extension.name} with:`, {
            chain: def.chain,
            specVersion: def.specVersion,
            genesisHash: def.genesisHash,
          });

          const result = await metadata.provide(def);
          console.log(`Metadata update result for ${extension.name}:`, result);
          return result;
        } catch (error) {
          console.error(
            `Failed to update metadata for ${extension.name}:`,
            error,
          );
          throw error;
        }
      },
    };
  } catch (error) {
    console.error(`Error getting metadata for ${extension.name}:`, error);
    return null;
  }
}

export async function updateMetadata(
  api: ApiPromise,
  extensions: InjectedExtension[],
) {
  console.log("Starting metadata update process");

  const genesisHash = api.genesisHash.toHex();
  const specVersion = api.runtimeVersion.specVersion.toNumber();

  // First check if metadata update is needed for any extension
  const needsUpdate = await Promise.all(
    extensions.map(async (extension) => {
      const metadata = extension.metadata;
      if (!metadata) return false;

      const known = await metadata.get();
      const hasCurrentMetadata = known.some(
        (k) => k.genesisHash === genesisHash && k.specVersion === specVersion,
      );

      return !hasCurrentMetadata;
    }),
  );

  // If no extension needs an update, return early
  if (!needsUpdate.some(Boolean)) {
    console.log("All extensions have current metadata, skipping update");
    return;
  }

  // Continue with metadata update for extensions that need it
  const systemChain = api.runtimeChain.toString();
  const specName = api.runtimeVersion.specName.toString();
  const registry = api.registry;

  const currentVersion = api.runtimeMetadata.version;
  // Use the version dynamically
  const metadata = await api.call.metadata.metadataAtVersion(currentVersion);

  // Handle potential undefined values with defaults
  const chainDecimals = registry.chainDecimals[0] ?? 18;
  const chainTokens = registry.chainTokens[0] ?? "TORUS";

  const metadataDef: MetadataDef = {
    chain: systemChain,
    chainType: "substrate",
    genesisHash,
    icon: "substrate",
    metaCalls: base64Encode(api.runtimeMetadata.asCallsOnly.toU8a()),
    specVersion,
    ss58Format: registry.chainSS58 ?? 42,
    tokenDecimals: chainDecimals,
    tokenSymbol: chainTokens,
    types: getSpecTypes(registry, systemChain, specName, specVersion) as Record<
      string,
      string
    >,
    rawMetadata: metadata.toHex(),
  };

  for (const [index, extension] of extensions.entries()) {
    // Skip if this extension doesn't need an update
    if (!needsUpdate[index]) {
      console.log(
        `Skipping metadata update for ${extension.name} - already up to date`,
      );
      continue;
    }

    console.log(`Processing extension: ${extension.name}`);
    const extInfo = await getMetadata(api, extension);
    if (!extInfo) {
      console.warn(
        `Failed to get metadata info for ${extension.name}, skipping...`,
      );
      continue;
    }

    try {
      console.log(`Updating metadata for ${extension.name}...`);
      const updateResult = await extInfo.update(metadataDef);
      console.log(`Update completed for ${extension.name}:`, {
        success: updateResult,
        timestamp: new Date().toISOString(),
      });

      // Verify the update
      const updatedKnown = await extension.metadata?.get();
      const hasMatchingMetadata = updatedKnown?.some(
        (m) => m.genesisHash === genesisHash && m.specVersion === specVersion,
      );

      if (!hasMatchingMetadata) {
        throw new Error("Metadata verification failed after update");
      }
    } catch (error) {
      console.error(`Failed to update metadata for ${extension.name}:`, error);
      throw error;
    }
  }

  console.log("Metadata update process completed");
}
