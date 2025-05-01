import type { ApiPromise } from "@polkadot/api";
import type { AnyJson } from "@polkadot/types/types";
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';



interface NestedRecord {
  [k: string]: AnyJson | NestedRecord;
}

interface DiffModified {
  path: string;
  oldValue: AnyJson | NestedRecord;
  newValue: AnyJson | NestedRecord;
}

interface DiffAddedRemoved {
  path: string;
  value: AnyJson | NestedRecord;
}

interface DiffResult {
  added: DiffAddedRemoved[];
  removed: DiffAddedRemoved[];
  modified: DiffModified[];
}

function isNestedRecord(value: AnyJson | NestedRecord): value is NestedRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

type OutputFormat = 'json' | 'colored';

const CONSOLE_COLORS = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
  gray: "\x1b[90m"
} as const;

function formatDiff(diff: DiffResult, format: OutputFormat = 'colored'): string | void {
  if (format === 'json') {
    return JSON.stringify(diff, null, 2);
  }

  // Colored console output
  console.log('\n📊 Diff Results:\n');

  if (diff.added.length > 0) {
    console.log(`${CONSOLE_COLORS.green}➕ Added:${CONSOLE_COLORS.reset}`);
    diff.added.forEach(item => {
      console.log(
        `   ${CONSOLE_COLORS.gray}${item.path}:${CONSOLE_COLORS.reset} ${CONSOLE_COLORS.green}${JSON.stringify(item.value, null, 2)}${CONSOLE_COLORS.reset}`
      );
    });
    console.log();
  }

  if (diff.removed.length > 0) {
    console.log(`${CONSOLE_COLORS.red}➖ Removed:${CONSOLE_COLORS.reset}`);
    diff.removed.forEach(item => {
      console.log(
        `   ${CONSOLE_COLORS.gray}${item.path}:${CONSOLE_COLORS.reset} ${CONSOLE_COLORS.red}${JSON.stringify(item.value, null, 2)}${CONSOLE_COLORS.reset}`
      );
    });
    console.log();
  }

  if (diff.modified.length > 0) {
    console.log(`${CONSOLE_COLORS.yellow}🔄 Modified:${CONSOLE_COLORS.reset}`);
    diff.modified.forEach(item => {
      console.log(`   ${CONSOLE_COLORS.gray}${item.path}:${CONSOLE_COLORS.reset}`);
      console.log(
        `     ${CONSOLE_COLORS.red}- ${JSON.stringify(item.oldValue, null, 2)}${CONSOLE_COLORS.reset}`
      );
      console.log(
        `     ${CONSOLE_COLORS.green}+ ${JSON.stringify(item.newValue, null, 2)}${CONSOLE_COLORS.reset}`
      );
    });
  }

  console.log(
    `\n📈 Summary: ${CONSOLE_COLORS.green}${diff.added.length} added${CONSOLE_COLORS.reset}, ` +
    `${CONSOLE_COLORS.red}${diff.removed.length} removed${CONSOLE_COLORS.reset}, ` +
    `${CONSOLE_COLORS.yellow}${diff.modified.length} modified${CONSOLE_COLORS.reset}\n`
  );
}

function jsonDiff(obj1: NestedRecord, obj2: NestedRecord, path: string = ''): DiffResult {
  const result: DiffResult = {
    added: [],
    removed: [],
    modified: []
  };

  // Helper function to sort arrays and stringify objects
  function normalizeValue(value: AnyJson | NestedRecord): AnyJson | NestedRecord {
    if (Array.isArray(value)) {
      return [...value].sort();
    }
    return value;
  }

  // Get all keys from both objects
  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);

  // Find added keys
  keys2.forEach(key => {
    if (!keys1.includes(key)) {
      result.added.push({
        path: path ? `${path}.${key}` : key,
        value: obj2[key]
      });
    }
  });

  // Find removed keys
  keys1.forEach(key => {
    if (!keys2.includes(key)) {
      result.removed.push({
        path: path ? `${path}.${key}` : key,
        value: obj1[key]
      });
    }
  });

  // Compare values for keys that exist in both objects
  keys1.forEach(key => {
    if (keys2.includes(key)) {
      const value1 = obj1[key];
      const value2 = obj2[key];

      if (isNestedRecord(value1) && isNestedRecord(value2)) {
        // Recursively compare nested objects
        const nestedPath = path ? `${path}.${key}` : key;
        const nestedDiff = jsonDiff(value1, value2, nestedPath);
        
        result.added = [...result.added, ...nestedDiff.added];
        result.removed = [...result.removed, ...nestedDiff.removed];
        result.modified = [...result.modified, ...nestedDiff.modified];
      } else {
        // Compare primitive values or arrays
        const normalizedValue1 = normalizeValue(value1);
        const normalizedValue2 = normalizeValue(value2);

        if (JSON.stringify(normalizedValue1) !== JSON.stringify(normalizedValue2)) {
          result.modified.push({
            path: path ? `${path}.${key}` : key,
            oldValue: normalizedValue1,
            newValue: normalizedValue2
          });
        }
      }
    }
  });

  return result;
}


interface FilterOptions {
  include?: string[];  // List of storage items to include (format: "pallet::storage")
  exclude?: string[];  // List of storage items to exclude (format: "pallet::storage")
}

// Helper function to convert wildcard pattern to RegExp
function wildcardToRegExp(pattern: string): RegExp {
  // Escape special RegExp characters except *
  const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&');
  // Replace * with .*
  const regexPattern = escaped.replace(/\*/g, '.*');
  // Create RegExp that matches the entire string
  return new RegExp(`^${regexPattern}$`, 'i');
}

// Helper function to check if a storage key matches any pattern in the list
function matchesAnyPattern(storageKey: string, patterns: string[]): boolean {
  return patterns.some(pattern => {
    const regex = wildcardToRegExp(pattern);
    return regex.test(storageKey);
  });
}

export async function getChainData(
  api: ApiPromise,
  options: FilterOptions = {}
) {
  // Initialize the result object
  //const result: Record<string, Record<string, unknown>> = {};
  const result: NestedRecord = {};
  // Get all modules and their storage items
  const modules = api.query;
  
  // Iterate through all modules and their storage items
  for (const [moduleName, module] of Object.entries(modules)) {
    // Initialize module object if it doesn't exist
    result[moduleName] = {};
    
    for (const [storageName, storage] of Object.entries(module)) {
      const storageKey = `${moduleName}.${storageName}`; // Changed separator to :: for consistency

      // Skip if not included when include filter is present
      if (options.include?.length && !matchesAnyPattern(storageKey, options.include)) {
        continue;
      }

      // Skip if excluded
      if (options.exclude?.length && matchesAnyPattern(storageKey, options.exclude)) {
        continue;
      }

      try {
        // Check if the storage item is a map
        if (storage.entries) {
          const entries = await storage.entries();
          result[moduleName][storageName] = entries.map(([key, value]) => ({
            key: key.toHuman(),
            value: value.toHuman()
          }));
        } else {
          // If it's a single value storage
          const value = await storage();
          result[moduleName][storageName] = value.toHuman();
        }
      } catch (error) {
        console.error(`Error querying ${moduleName}::${storageName}:`, error.message);
        result[moduleName][storageName] = null;
      }
    }

    // Clean up empty modules
    if (Object.keys(result[moduleName]).length === 0) {
      delete result[moduleName];
    }
  }

  return result;
}


export async function chainDiff(api: ApiPromise, prodApi: ApiPromise) {
  const prodChainData = await getChainData(prodApi, {exclude: ["substrate.code"]});
  const chainData = await getChainData(api, {exclude: ["substrate.code"]});
  // console.log(JSON.stringify(prodChainData, null, 2));
  // console.log(JSON.stringify(chainData, null, 2));
  const diff = jsonDiff(prodChainData, chainData);
  console.log(JSON.stringify(formatDiff(diff, "colored"), null, 2));
}

interface CliArgs {
  storageFilter?: string;
  storageExclude?: string;
  chain1: string;
  chain2: string;
}
const argv = yargs(hideBin(process.argv))
  .usage('Usage: $0 [options] <chain1> <chain2>')
  .example(
    '$0 -F "torus0::Agents,governance::Whitelist" ws://localhost:9944 ws://localhost:9945',
    'Compare chains with specific storage filters'
  )
  .option('storage-filter', {
    alias: 'F',
    type: 'string',
    description: 'Include specific storages (comma-separated, format: "pallet.storage")',
  })
  .option('storage-exclude', {
    alias: 'E',
    type: 'string',
    description: 'Exclude specific storages (comma-separated, format: "pallet.storage")',
  })
  .demandCommand(2, 'Please provide two websocket endpoints')
  .check((argv) => {
    const positionals = argv._;
    if (positionals.length !== 2) {
      throw new Error('Exactly two websocket endpoints are required');
    }
    
    // Validate websocket URLs
    const isValidWsUrl = (url: string) => 
      url.startsWith('ws://') || url.startsWith('wss://');
    
    if (!isValidWsUrl(positionals[0] as string) || !isValidWsUrl(positionals[1] as string)) {
      throw new Error('Invalid websocket URL. Must start with ws:// or wss://');
    }

    // Validate storage format if provided
    const validateStorageFormat = (storages?: string) => {
      if (!storages) return true;
      return storages.split(',').every(storage => 
        storage.match(/^[a-zA-Z0-9]+.[a-zA-Z0-9]+$/));
    };

    if (argv["storage-filter"] && !validateStorageFormat(argv["storage-filter"])) {
      throw new Error('Invalid storage filter format. Expected "pallet.storage"');
    }
    if (!validateStorageFormat(argv.storageExclude as string)) {
      throw new Error('Invalid storage exclude format. Expected "pallet.storage"');
    }

    return true;
  })
  .help('h')
  .alias('h', 'help')
  .parse();