import { ApiPromise, WsProvider } from "@polkadot/api";
import type { AnyJson } from "@polkadot/types/types";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { spawnSync } from "child_process";
import fs from "fs/promises";
import path from "path";
import os from "os";

interface NestedRecord {
  [k: string]: AnyJson | NestedRecord;
}

interface FilterOptions {
  include?: string[];
  exclude?: string[];
}

async function connectToChainRpc(wsEndpoint: string) {
  const wsProvider = new WsProvider(wsEndpoint);
  const api = await ApiPromise.create({
    provider: wsProvider,
    noInitWarn: true,
  });

  if (!api.isConnected) {
    throw new Error("API not connected");
  }

  return api;
}

function wildcardToRegExp(pattern: string): RegExp {
  const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, "\\$&");
  const regexPattern = escaped.replace(/\*/g, ".*");

  return new RegExp(`^${regexPattern}$`, "i");
}

function matchesAnyPattern(storageKey: string, patterns: string[]): boolean {
  return patterns.some((pattern) => {
    const regex = wildcardToRegExp(pattern);
    return regex.test(storageKey);
  });
}

async function getChainData(
  api: ApiPromise,
  options: FilterOptions = {},
  silent = false,
) {
  const result: NestedRecord = {};
  const modules = api.query;

  for (const [moduleName, module] of Object.entries(modules)) {
    result[moduleName] = {};

    for (const [storageName, storage] of Object.entries(module)) {
      const storageKey = `${moduleName}.${storageName}`;

      if (
        options.include?.length &&
        !matchesAnyPattern(storageKey, options.include)
      ) {
        continue;
      }

      if (
        options.exclude?.length &&
        matchesAnyPattern(storageKey, options.exclude)
      ) {
        continue;
      }

      try {
        const entries = await storage.entries();

        result[moduleName][storageName] = entries.map(([key, value]) => ({
          key: key.toHuman(),
          value: value.toHuman(),
        }));
      } catch (error) {
        if (error instanceof Error) {
          if (silent) {
            continue;
          }

          console.error(
            `Error querying ${moduleName}::${storageName}:`,
            error.message,
          );
        }

        result[moduleName][storageName] = null;
      }
    }

    if (Object.keys(result[moduleName]).length === 0) {
      delete result[moduleName];
    }
  }

  return result;
}

async function diff(prodChainData: NestedRecord, chainData: NestedRecord) {
  const prodChainDataPath = path.join(os.tmpdir(), "prodChainData.json");
  const chainDataPath = path.join(os.tmpdir(), "chainData.json");

  await fs.writeFile(prodChainDataPath, JSON.stringify(prodChainData, null, 2));
  await fs.writeFile(chainDataPath, JSON.stringify(chainData, null, 2));

  const diffResult = spawnSync(
    "vimdiff",
    ["-R", prodChainDataPath, chainDataPath],
    {
      encoding: "utf-8",
      stdio: "inherit",
    },
  );

  if (diffResult.status !== 0) {
    console.error("Error running vimdiff");
    process.exit(1);
  }
}

void yargs(hideBin(process.argv))
  .usage("Usage: $0 [options] [chain1] [chain2]")
  .example(
    '$0 -F "torus0::Agents,governance::Whitelist" ws://localhost:9944 ws://localhost:9945',
    "Compare chains with specific storage filters",
  )
  .option("storage-filter", {
    alias: "F",
    type: "string",
    description:
      'Include specific storages (comma-separated, format: "pallet.storage")',
  })
  .option("storage-exclude", {
    alias: "E",
    type: "string",
    description:
      'Exclude specific storages (comma-separated, format: "pallet.storage")',
  })
  .option("silent", {
    alias: "s",
    type: "boolean",
    default: false,
    description: "Remove error/warning logs",
  })
  .check(async (argv) => {
    const positionals = argv._;
    const chain1 = positionals[0]?.toString();
    const chain2 = positionals[1]?.toString();

    if (!chain1 && !chain2) {
      return true;
    }

    if ((chain1 && !chain2) || (!chain1 && chain2)) {
      throw new Error(
        "If providing websocket endpoints, both must be provided",
      );
    }

    const isValidWsUrl = (url: string): boolean => {
      return url.startsWith("ws://") || url.startsWith("wss://");
    };

    if (chain1 && chain2 && (!isValidWsUrl(chain1) || !isValidWsUrl(chain2))) {
      throw new Error("Invalid websocket URL. Must start with ws:// or wss://");
    }

    const validateStorageFormat = (storages?: string): boolean => {
      if (!storages) {
        return true;
      }

      return storages
        .split(",")
        .every((storage) => /^[a-zA-Z0-9]+[.:][a-zA-Z0-9]+$/.exec(storage));
    };

    const storageFilter = argv["storage-filter"]?.toString();

    if (storageFilter && !validateStorageFormat(storageFilter)) {
      throw new Error(
        'Invalid storage filter format. Expected "pallet.storage"',
      );
    }

    const storageExclude = argv["storage-exclude"]?.toString();

    if (storageExclude && !validateStorageFormat(storageExclude)) {
      throw new Error(
        'Invalid storage exclude format. Expected "pallet.storage"',
      );
    }

    if (chain1 && chain2) {
      const apiChain1 = await connectToChainRpc(chain1);
      const apiChain2 = await connectToChainRpc(chain2);

      const silent = argv.silent.toString() === "true";

      const prodChainData = await getChainData(
        apiChain1,
        {
          include: storageFilter?.split(",") ?? [],
          exclude: storageExclude?.split(",") ?? ["substrate.code"],
        },
        silent,
      );

      const chainData = await getChainData(
        apiChain2,
        {
          include: storageFilter?.split(",") ?? [],
          exclude: storageExclude?.split(",") ?? ["substrate.code"],
        },
        silent,
      );

      await diff(prodChainData, chainData);
    }

    process.exit(0);
  })
  .help("h")
  .alias("h", "help").argv;
