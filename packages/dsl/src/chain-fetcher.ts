import { ApiPromise } from '@polkadot/api';
import { setup, queryFreeBalance, queryKeyStakingTo, queryStakeOut, checkSS58, queryPermission, isPermissionEnabled } from '@torus-network/sdk';
import {
  AccountId,
  PermId,
  UInt,
  Constraint
} from './types';
import {
  StakeOfFact,
  PermissionExistsFact,
  PermissionEnabledFact,
  InactiveUnlessRedelegatedFact,
  BlockFact,
  SpecificFact,
  extractFactsFromConstraint,
  categorizeFacts
} from './facts';
import { ReteNetwork } from './rete';

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
  fetchInactiveUnlessRedelegated(account: AccountId, percentage: UInt): Promise<InactiveUnlessRedelegatedFact>;
  
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

  constructor(wsEndpoint: string = 'wss://api.testnet.torus.network'){
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
      console.log('Connected to Torus chain at:', this.wsEndpoint);
    } catch (error) {
      console.error('Failed to connect to Torus chain:', error);
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
      throw new Error('Failed to establish connection to Torus chain');
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
        type: 'StakeOf',
        account,
        amount: accountStake
      };
    } catch (error) {
      console.error(`Error fetching stake for account ${account}:`, error);
      // Return zero stake on error
      return {
        type: 'StakeOf',
        account,
        amount: BigInt(0)
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
      const hexPermId = permId.startsWith('0x') ? permId as `0x${string}` : `0x${permId}` as `0x${string}`;
      const permissionResult = await queryPermission(api, hexPermId);
      // Result is a tuple [error, value] - check if error is empty (undefined)
      const permExists = permissionResult[0] === undefined && permissionResult[1] !== null;
      return {
        type: 'PermissionExists',
        permId,
        exists: permExists
      };
    } catch (error) {
      console.error(`Error checking if permission ${permId} exists:`, error);
      return {
        type: 'PermissionExists',
        permId,
        exists: false
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
      const hexPermId = permId.startsWith('0x') ? permId as `0x${string}` : `0x${permId}` as `0x${string}`;
      
      // Use the new isPermissionEnabled function from the SDK
      const [error, enabled] = await isPermissionEnabled(api, hexPermId);
      
      if (error !== undefined) {
        console.error(`Error checking if permission ${permId} is enabled:`, error);
        return {
          type: 'PermissionEnabled',
          permId,
          enabled: false
        };
      }
      
      return {
        type: 'PermissionEnabled',
        permId,
        enabled
      };
    } catch (error) {
      console.error(`Error checking if permission ${permId} is enabled:`, error);
      return {
        type: 'PermissionEnabled',
        permId,
        enabled: false
      };
    }
  }


  /**
   * Fetch whether an account is inactive unless redelegated
   */
  async fetchInactiveUnlessRedelegated(account: AccountId, percentage: UInt): Promise<InactiveUnlessRedelegatedFact> {
    const api = await this.ensureConnected();
    
    try {
      // TODO: Implement redelegation status check
      // This depends on how redelegation status is tracked in the Torus runtime
      
      return {
        type: 'InactiveUnlessRedelegated',
        account,
        percentage,
        isRedelegated: false // TODO: Replace with actual redelegation status
      };
    } catch (error) {
      console.error(`Error checking redelegation status for account ${account}:`, error);
      return {
        type: 'InactiveUnlessRedelegated',
        account,
        percentage,
        isRedelegated: false
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
        type: 'Block',
        number: BigInt(header.number.toString()),
        timestamp: BigInt(timestamp.toString())
      };
    } catch (error) {
      console.error('Error fetching current block:', error);
      return {
        type: 'Block',
        number: BigInt(0),
        timestamp: BigInt(Date.now())
      };
    }
  }
}

/**
 * Enhanced Rete network that automatically fetches facts when constraints are added
 */
export class ChainAwareReteNetwork extends ReteNetwork {
  private fetcher: ChainFetcher;

  constructor(fetcher: ChainFetcher) {
    super();
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
   * @param constraint The constraint to add
   * @returns The production node ID and the facts that were fetched
   */
  async addConstraintWithFacts(constraint: Constraint): Promise<{
    productionId: string;
    fetchedFacts: SpecificFact[];
  }> {
    // Extract required facts from the constraint
    const allFacts = extractFactsFromConstraint(constraint);
    const facts = allFacts.filter(f => f.type !== 'Comparison') as SpecificFact[];
    
    console.log(`Constraint requires ${facts.length} facts to be fetched from chain`);
    
    // Add the constraint to the network FIRST (this creates the network structure)
    const productionId = this.addConstraint(constraint);
    
    // THEN fetch and add facts to propagate through the network
    const fetchedFacts: SpecificFact[] = [];
    
    for (const fact of facts) {
      try {
        let fetchedFact: SpecificFact;
        
        switch (fact.type) {
          case 'StakeOf':
            fetchedFact = await this.fetcher.fetchStakeOf(fact.account);
            break;
            
          case 'PermissionExists':
            fetchedFact = await this.fetcher.fetchPermissionExists(fact.permId);
            break;
            
          case 'PermissionEnabled':
            fetchedFact = await this.fetcher.fetchPermissionEnabled(fact.permId);
            break;
            
          case 'InactiveUnlessRedelegated':
            fetchedFact = await this.fetcher.fetchInactiveUnlessRedelegated(fact.account, fact.percentage);
            break;
            
          default:
            console.warn(`Unknown fact type: ${(fact as any).type}`);
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
      this.addFact(blockFact);
      console.log('Fetched and added current block fact:', blockFact);
    } catch (error) {
      console.error('Failed to fetch current block:', error);
    }
    
    console.log(`Added constraint with production ID: ${productionId}`);
    console.log(`Constraint activated: ${this.isConstraintActivated(productionId)}`);
    
    return {
      productionId,
      fetchedFacts
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
 */
export function createChainAwareReteNetwork(wsEndpoint?: string): ChainAwareReteNetwork {
  const fetcher = createChainFetcher(wsEndpoint);
  return new ChainAwareReteNetwork(fetcher);
}

/**
 * Dummy implementation for testing without chain connection
 */
export class DummyChainFetcher implements ChainFetcher {
  async fetchStakeOf(account: AccountId): Promise<StakeOfFact> {
    // Return different amounts based on account to test different scenarios
    const amounts: Record<string, bigint> = {
      'alice': BigInt(1500),  // Should satisfy > 1000
      'bob': BigInt(6000),    // Should satisfy >= 5000
    };
    return { 
      type: 'StakeOf', 
      account, 
      amount: amounts[account] || BigInt(1000) 
    };
  }

  async fetchPermissionExists(permId: PermId): Promise<PermissionExistsFact> {
    return { type: 'PermissionExists', permId, exists: true };
  }

  async fetchPermissionEnabled(permId: PermId): Promise<PermissionEnabledFact> {
    return { type: 'PermissionEnabled', permId, enabled: true };
  }

  async fetchInactiveUnlessRedelegated(account: AccountId, percentage: UInt): Promise<InactiveUnlessRedelegatedFact> {
    return { type: 'InactiveUnlessRedelegated', account, percentage, isRedelegated: false };
  }

  async fetchCurrentBlock(): Promise<BlockFact> {
    return {
      type: 'Block',
      number: BigInt(1000),
      timestamp: BigInt(Date.now())
    };
  }

  async ensureConnected(): Promise<ApiPromise> {
    // Dummy implementation - just return a placeholder
    throw new Error('DummyChainFetcher.ensureConnected() not implemented - use TorusChainFetcher for real connections');
  }
}