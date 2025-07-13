import type { ApiPromise } from "@polkadot/api";
import type {
  InjectedExtension,
  MetadataDef,
} from "@polkadot/extension-inject/types";
import { getSpecTypes } from "@polkadot/types-known";
import { base64Encode } from "@polkadot/util-crypto";

import { tryAsync, trySync } from "@torus-network/torus-utils/try-catch";

async function getMetadata(api: ApiPromise, extension: InjectedExtension) {
  if (!extension.metadata) {
    console.warn(
      `No metadata interface found for extension: ${extension.name}`,
    );
    return null;
  }

  const [getMetadataError, metadata] = trySync(() => extension.metadata);
  if (getMetadataError !== undefined) {
    console.error(
      `Error accessing metadata for ${extension.name}:`,
      getMetadataError,
    );
    return null;
  }

  if (metadata === undefined) {
    console.error(
      `No metadata interface found for extension: ${extension.name}`,
    );
    return;
  }

  const [getKnownError, known] = await tryAsync(metadata.get());
  if (getKnownError !== undefined) {
    console.error(
      `Error getting metadata for ${extension.name}:`,
      getKnownError,
    );
    return null;
  }

  return {
    extension,
    known,
    update: async (def: MetadataDef): Promise<boolean> => {
      const [provideError, result] = await tryAsync(metadata.provide(def));
      if (provideError !== undefined) {
        console.error(
          `Failed to update metadata for ${extension.name}:`,
          provideError,
        );
        throw provideError;
      }
      return result;
    },
  };
}

/**
 * TODO: Refactor `updateMetadata`
 */
export async function updateMetadata(
  api: ApiPromise,
  extensions: InjectedExtension[],
) {
  console.log("Starting metadata update process");

  const [hashError, genesisHash] = trySync(() => api.genesisHash.toHex());
  if (hashError !== undefined) {
    console.error("Error getting genesis hash:", hashError);
    throw hashError;
  }

  const [versionError, specVersion] = trySync(() =>
    api.runtimeVersion.specVersion.toNumber(),
  );
  if (versionError !== undefined) {
    console.error("Error getting spec version:", versionError);
    throw versionError;
  }

  // First check if metadata update is needed for any extension
  const [needsUpdateError, needsUpdateResults] = await tryAsync(
    Promise.all(
      extensions.map(async (extension) => {
        const [metadataError, metadata] = trySync(() => extension.metadata);
        if (metadataError !== undefined || !metadata) return false;

        const [knownError, known] = await tryAsync(metadata.get());
        if (knownError !== undefined) {
          console.error(
            `Error getting known metadata for ${extension.name}:`,
            knownError,
          );
          return false;
        }

        const [checkError, hasCurrentMetadata] = trySync(() =>
          known.some(
            (k) =>
              k.genesisHash === genesisHash && k.specVersion === specVersion,
          ),
        );

        if (checkError !== undefined) {
          console.error(
            `Error checking metadata for ${extension.name}:`,
            checkError,
          );
          return false;
        }

        return !hasCurrentMetadata;
      }),
    ),
  );

  if (needsUpdateError !== undefined) {
    console.error(
      "Error checking if extensions need updates:",
      needsUpdateError,
    );
    throw needsUpdateError;
  }

  const needsUpdate = needsUpdateResults;

  // If no extension needs an update, return early
  const [someError, someNeedsUpdate] = trySync(() => needsUpdate.some(Boolean));
  if (someError !== undefined) {
    console.error("Error checking if any extension needs update:", someError);
    throw someError;
  }

  if (!someNeedsUpdate) {
    console.log("All extensions have current metadata, skipping update");
    return;
  }

  // Continue with metadata update for extensions that need it
  const [chainError, systemChain] = trySync(() => api.runtimeChain.toString());
  if (chainError !== undefined) {
    console.error("Error getting system chain:", chainError);
    throw chainError;
  }

  const [nameError, specName] = trySync(() =>
    api.runtimeVersion.specName.toString(),
  );
  if (nameError !== undefined) {
    console.error("Error getting spec name:", nameError);
    throw nameError;
  }

  const [registryError, registry] = trySync(() => api.registry);
  if (registryError !== undefined) {
    console.error("Error getting registry:", registryError);
    throw registryError;
  }

  const [versionNumError, currentVersion] = trySync(
    () => api.runtimeMetadata.version,
  );
  if (versionNumError !== undefined) {
    console.error("Error getting current metadata version:", versionNumError);
    throw versionNumError;
  }

  // Use the version dynamically
  const [metadataError, metadata] = await tryAsync(
    api.call.metadata.metadataAtVersion(currentVersion),
  );
  if (metadataError !== undefined) {
    console.error("Error getting metadata at version:", metadataError);
    throw metadataError;
  }

  // Handle potential undefined values with defaults
  const chainDecimals = registry.chainDecimals[0] ?? 18;
  const chainTokens = registry.chainTokens[0] ?? "TORUS";

  const [defError, metadataDef] = trySync(() => ({
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
  }));

  if (defError !== undefined) {
    console.error("Error creating metadata definition:", defError);
    throw defError;
  }

  for (const [index, extension] of extensions.entries()) {
    // Skip if this extension doesn't need an update
    if (!needsUpdate[index]) {
      continue;
    }

    const [extInfoError, extInfo] = await tryAsync(getMetadata(api, extension));
    if (extInfoError !== undefined || !extInfo) {
      console.warn(
        `Failed to get metadata info for ${extension.name}, skipping...`,
      );
      continue;
    }

    // Ensure chainType is valid before update
    if (
      metadataDef.chainType !== "substrate" &&
      metadataDef.chainType !== "ethereum"
    ) {
      console.error(`Invalid chainType: ${metadataDef.chainType}`);
      throw new Error('chainType must be either "substrate" or "ethereum"');
    }

    const [updateError] = await tryAsync(
      extInfo.update(metadataDef as MetadataDef),
    );
    if (updateError !== undefined) {
      console.error(
        `Failed to update metadata for ${extension.name}:`,
        updateError,
      );
      throw updateError;
    }

    // Verify the update
    const [getMetadataError, updatedKnown] = await tryAsync(
      extension.metadata?.get() ??
        Promise.reject(new Error("Metadata not available")),
    );
    if (getMetadataError !== undefined) {
      console.error(
        `Error verifying metadata update for ${extension.name}:`,
        getMetadataError,
      );
      throw getMetadataError;
    }

    const [verifyError, hasMatchingMetadata] = trySync(() =>
      updatedKnown.some(
        (m) => m.genesisHash === genesisHash && m.specVersion === specVersion,
      ),
    );

    if (verifyError !== undefined) {
      console.error(
        `Error verifying metadata for ${extension.name}:`,
        verifyError,
      );
      throw verifyError;
    }

    if (!hasMatchingMetadata) {
      throw new Error("Metadata verification failed after update");
    }
  }
}
