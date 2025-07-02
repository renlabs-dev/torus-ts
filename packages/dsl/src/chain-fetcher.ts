import type { ApiPromise } from "@polkadot/api";
import {
  setup,
  queryStakeOut,
  checkSS58,
  queryPermission,
  isPermissionEnabled,
  queryDelegationStreamsByAccount,
  PERMISSION_ID_SCHEMA,
  H256_HEX,
} from "@torus-network/sdk";
import type { AccountId, PermId, UInt, Constraint } from "./types";
import type {
  StakeOfFact,
  PermissionExistsFact,
  PermissionEnabledFact,
  InactiveUnlessRedelegatedFact,
  BlockFact,
  SpecificFact,
} from "./facts";
import { extractFactsFromConstraint } from "./facts";
import { ReteNetwork } from "./rete";

/**
 * Chain data fetcher interface for retrieving blockchain state
 * These functions should be implemented to fetch real data from the Torus chain
 */
export interface ChainFetcher {
  // Connection management
  ensureConnected(): Promise<ApiPromise>;

  // Account-related facts
  fetchStakeOf(account: AccountId): Promise<StakeOfFact>;

  // Permission-related facts
  fetchPermissionExists(permId: PermId): Promise<PermissionExistsFact>;
  fetchPermissionEnabled(permId: PermId): Promise<PermissionEnabledFact>;
  fetchInactiveUnlessRedelegated(
    account: AccountId,
    percentage: UInt,
    permissionId: PermId,
  ): Promise<InactiveUnlessRedelegatedFact>;

  // Block-related facts
  fetchCurrentBlock(): Promise<BlockFact>;
}

/**
 * Torus chain fetcher implementation using torus-sdk-ts
 * Connects to the Torus blockchain via websocket
 */
export class TorusChainFetcher implements ChainFetcher {
  private api: ApiPromise | null = null;
  private wsEndpoint: string;

  constructor(wsEndpoint: string = "wss://api.testnet.torus.network") {
    this.wsEndpoint = wsEndpoint;
  }

  /**
   * Initialize the connection to the Torus chain
   */
  async connect(): Promise<void> {
    if (this.api) {
      return; // Already connected
    }

    try {
      this.api = await setup(this.wsEndpoint);
      console.log("Connected to Torus chain at:", this.wsEndpoint);
    } catch (error) {
      console.error("Failed to connect to Torus chain:", error);
      throw error;
    }
  }

  /**
   * Ensure API is connected before making queries
   */
  async ensureConnected(): Promise<ApiPromise> {
    if (!this.api) {
      await this.connect();
    }
    if (!this.api) {
      throw new Error("Failed to establish connection to Torus chain");
    }
    return this.api;
  }

  /**
   * Disconnect from the chain
   */
  async disconnect(): Promise<void> {
    if (this.api) {
      await this.api.disconnect();
      this.api = null;
    }
  }

  /**
   * Fetch the stake amount for an account
   */
  async fetchStakeOf(account: AccountId): Promise<StakeOfFact> {
    try {
      // Validate the SS58 address
      const validAddress = checkSS58(account);
      const api = await this.ensureConnected();

      // Query all stakes and get the amount for this specific address
      const stakeData = await queryStakeOut(api);
      const accountStake = stakeData.perAddr.get(validAddress) ?? BigInt(0);

      return {
        type: "StakeOf",
        account,
        amount: accountStake,
      };
    } catch (error) {
      console.error(`Error fetching stake for account ${account}:`, error);
      // Return zero stake on error
      return {
        type: "StakeOf",
        account,
        amount: BigInt(0),
      };
    }
  }

  /**
   * Fetch whether a permission exists
   */
  async fetchPermissionExists(permId: PermId): Promise<PermissionExistsFact> {
    const api = await this.ensureConnected();
    try {
      // Ensure permId is a hex string
      const hexPermId = H256_HEX.parse(permId);
      const permissionResult = await queryPermission(api, hexPermId);
      const [permissionError, permissionData] = permissionResult;
      const permExists =
        permissionError === undefined && permissionData !== null;
      return {
        type: "PermissionExists",
        permId,
        exists: permExists,
      };
    } catch (error) {
      console.error(`Error checking if permission ${permId} exists:`, error);
      return {
        type: "PermissionExists",
        permId,
        exists: false,
      };
    }
  }

  /**
   * Fetch whether a permission is enabled
   */
  async fetchPermissionEnabled(permId: PermId): Promise<PermissionEnabledFact> {
    const api = await this.ensureConnected();

    try {
      // Ensure permId is a hex string
      // const hexPermId = permId.startsWith('0x') ? permId as `0x${string}` : `0x${permId}`;
      const hexPermId = PERMISSION_ID_SCHEMA.parse(permId);

      // Use the new isPermissionEnabled function from the SDK
      const [error, enabled] = await isPermissionEnabled(api, hexPermId);

      if (error !== undefined) {
        console.error(
          `Error checking if permission ${permId} is enabled:`,
          error,
        );
        return {
          type: "PermissionEnabled",
          permId,
          enabled: false,
        };
      }

      return {
        type: "PermissionEnabled",
        permId,
        enabled,
      };
    } catch (error) {
      console.error(
        `Error checking if permission ${permId} is enabled:`,
        error,
      );
      return {
        type: "PermissionEnabled",
        permId,
        enabled: false,
      };
    }
  }

  /**
   * Fetch whether an account is inactive unless redelegated
   * Checks if the grantee of the specified permission has delegation streams to the target account with at least the required percentage
   */
  async fetchInactiveUnlessRedelegated(
    account: AccountId,
    percentage: UInt,
    permissionId: PermId,
  ): Promise<InactiveUnlessRedelegatedFact> {
    const api = await this.ensureConnected();

    try {
      // Validate addresses
      const validTargetAccount = checkSS58(account);
      // const hexPermId = permissionId.startsWith('0x') ? permissionId as `0x${string}` : `0x${permissionId}`;
      const hexPermId = PERMISSION_ID_SCHEMA.parse(permissionId);
      // Get the specific permission to find its grantee
      const [permissionError, permission] = await queryPermission(
        api,
        hexPermId,
      );

      if (permissionError !== undefined) {
        console.warn(
          `Error querying permission ${permissionId}:`,
          permissionError,
        );
        return {
          type: "InactiveUnlessRedelegated",
          account,
          percentage,
          isRedelegated: false,
        };
      }

      if (permission === null) {
        console.warn(`Permission ${permissionId} not found`);
        return {
          type: "InactiveUnlessRedelegated",
          account,
          percentage,
          isRedelegated: false,
        };
      }

      // Get delegation streams for the grantee of this permission
      const [delegationError, delegationStreams] =
        await queryDelegationStreamsByAccount(api, permission.grantee);

      if (delegationError !== undefined) {
        console.warn(
          `Error querying delegation streams for grantee ${permission.grantee}:`,
          delegationError,
        );
        return {
          type: "InactiveUnlessRedelegated",
          account,
          percentage,
          isRedelegated: false,
        };
      }

      // Check if any delegation stream goes to the target account with sufficient percentage
      for (const [_permId, delegationStream] of delegationStreams.entries()) {
        // Check if this delegation stream has the target account as one of its targets
        if (delegationStream.targets.has(validTargetAccount)) {
          // Check if the delegation percentage meets the requirement
          if (Number(delegationStream.percentage) >= Number(percentage)) {
            return {
              type: "InactiveUnlessRedelegated",
              account,
              percentage,
              isRedelegated: true,
            };
          }
        }
      }

      // No sufficient delegation streams to the target account found
      return {
        type: "InactiveUnlessRedelegated",
        account,
        percentage,
        isRedelegated: false,
      };
    } catch (error) {
      console.error(
        `Error checking redelegation status for account ${account}:`,
        error,
      );
      return {
        type: "InactiveUnlessRedelegated",
        account,
        percentage,
        isRedelegated: false,
      };
    }
  }

  /**
   * Fetch the current block information
   */
  async fetchCurrentBlock(): Promise<BlockFact> {
    const api = await this.ensureConnected();

    try {
      // Get current block header
      const header = await api.rpc.chain.getHeader();

      // Get current timestamp (this depends on the runtime configuration)
      const timestamp = await api.query.timestamp.now();

      return {
        type: "Block",
        number: BigInt(header.number.toString()),
        timestamp: BigInt(timestamp.toString()),
      };
    } catch (error) {
      console.error("Error fetching current block:", error);
      return {
        type: "Block",
        number: BigInt(0),
        timestamp: BigInt(Date.now()),
      };
    }
  }
}

/**
 * Enhanced Rete network that automatically fetches facts when constraints are added
 */
export class ChainAwareReteNetwork extends ReteNetwork {
  private fetcher: ChainFetcher;

  constructor(
    fetcher: ChainFetcher,
    onConstraintViolated?: (constraintId: string) => Promise<void>,
  ) {
    super(onConstraintViolated);
    this.fetcher = fetcher;
  }

  /**
   * Get the chain fetcher instance
   */
  getFetcher(): ChainFetcher {
    return this.fetcher;
  }

  /**
   * Add a constraint and automatically fetch all required facts from the chain
   * When a constraint for the same permission already exists, it will be replaced
   * @param constraint The constraint to add
   * @returns The production node ID and the facts that were fetched
   */
  async addConstraintWithFacts(constraint: Constraint): Promise<{
    productionId: string;
    fetchedFacts: SpecificFact[];
    replacedConstraints: string[];
  }> {
    const replacedConstraints: string[] = [];

    // Check if there are existing constraints for this permission
    const existingConstraintIds = this.getConstraintsByPermissionId(
      constraint.permId,
    );

    if (existingConstraintIds.length > 0) {
      console.log(
        `Found ${existingConstraintIds.length} existing constraint(s) for permission ${constraint.permId}, replacing them`,
      );

      // Remove existing constraints from the network (but keep the facts)
      for (const constraintId of existingConstraintIds) {
        if (this.removeConstraint(constraintId)) {
          replacedConstraints.push(constraintId);
          console.log(`Removed existing constraint: ${constraintId}`);
        }
      }
    }

    // Extract required facts from the constraint
    const allFacts = extractFactsFromConstraint(constraint);
    const facts = allFacts.filter((f) => f.type !== "Comparison");

    console.log(
      `Constraint requires ${facts.length} facts to be fetched from chain`,
    );

    // Add the new constraint to the network (this creates the network structure)
    const productionId = this.addConstraint(constraint);

    // THEN fetch and add facts to propagate through the network
    const fetchedFacts: SpecificFact[] = [];

    for (const fact of facts) {
      try {
        let fetchedFact: SpecificFact;

        switch (fact.type) {
          case "StakeOf":
            fetchedFact = await this.fetcher.fetchStakeOf(fact.account);
            break;

          case "PermissionExists":
            fetchedFact = await this.fetcher.fetchPermissionExists(fact.permId);
            break;

          case "PermissionEnabled":
            fetchedFact = await this.fetcher.fetchPermissionEnabled(
              fact.permId,
            );
            break;

          case "InactiveUnlessRedelegated":
            fetchedFact = await this.fetcher.fetchInactiveUnlessRedelegated(
              fact.account,
              fact.percentage,
              constraint.permId,
            );
            break;

          default:
            // Exhaustiveness check: this will cause a type error if we miss any cases
            continue;
        }

        // Add the fetched fact to the network
        await this.addFact(fetchedFact);
        fetchedFacts.push(fetchedFact);

        console.log(`Fetched and added fact: ${fetchedFact.type}`, fetchedFact);
      } catch (error) {
        console.error(`Failed to fetch fact ${fact.type}:`, error);
        // Continue with other facts even if one fails
      }
    }

    // Also fetch current block info
    try {
      const blockFact = await this.fetcher.fetchCurrentBlock();
      void this.addFact(blockFact);
      console.log("Fetched and added current block fact:", blockFact);
    } catch (error) {
      console.error("Failed to fetch current block:", error);
    }

    console.log(`Added constraint with production ID: ${productionId}`);
    console.log(
      `Constraint activated: ${this.isConstraintActivated(productionId)}`,
    );

    return {
      productionId,
      fetchedFacts,
      replacedConstraints,
    };
  }
}

/**
 * Create a chain fetcher instance connected to Torus
 * @param wsEndpoint Optional websocket endpoint (defaults to main Torus node)
 */
export function createChainFetcher(wsEndpoint?: string): ChainFetcher {
  return new TorusChainFetcher(wsEndpoint);
}

/**
 * Create a chain-aware Rete network that automatically fetches facts
 * @param wsEndpoint Optional websocket endpoint (defaults to main Torus node)
 * @param onConstraintViolated Optional callback for when constraints become violated
 */
export function createChainAwareReteNetwork(
  wsEndpoint?: string,
  onConstraintViolated?: (constraintId: string) => Promise<void>,
): ChainAwareReteNetwork {
  const fetcher = createChainFetcher(wsEndpoint);
  return new ChainAwareReteNetwork(fetcher, onConstraintViolated);
}

/**
 * Dummy implementation for testing without chain connection
 */
export class DummyChainFetcher implements ChainFetcher {
  fetchStakeOf(account: AccountId): Promise<StakeOfFact> {
    // Return different amounts based on account to test different scenarios
    const amounts: Record<string, bigint> = {
      alice: BigInt(1500), // Should satisfy > 1000
      bob: BigInt(6000), // Should satisfy >= 5000
    };
    return Promise.resolve({
      type: "StakeOf",
      account,
      amount: amounts[account] ?? BigInt(1000),
    });
  }

  fetchPermissionExists(permId: PermId): Promise<PermissionExistsFact> {
    return Promise.resolve({ type: "PermissionExists", permId, exists: true });
  }

  fetchPermissionEnabled(permId: PermId): Promise<PermissionEnabledFact> {
    return Promise.resolve({
      type: "PermissionEnabled",
      permId,
      enabled: true,
    });
  }

  fetchInactiveUnlessRedelegated(
    account: AccountId,
    percentage: UInt,
    _permissionId: PermId,
  ): Promise<InactiveUnlessRedelegatedFact> {
    return Promise.resolve({
      type: "InactiveUnlessRedelegated",
      account,
      percentage,
      isRedelegated: false,
    });
  }

  fetchCurrentBlock(): Promise<BlockFact> {
    return Promise.resolve({
      type: "Block",
      number: BigInt(1000),
      timestamp: BigInt(Date.now()),
    });
  }

  ensureConnected(): Promise<ApiPromise> {
    // Dummy implementation - just return a placeholder
    return Promise.reject(
      new Error(
        "DummyChainFetcher.ensureConnected() not implemented - use TorusChainFetcher for real connections",
      ),
    );
  }
}
