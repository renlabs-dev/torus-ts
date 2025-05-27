import { ApiPromise } from '@polkadot/api';
import { setup, queryFreeBalance, queryKeyStakingTo, queryStakeOut, checkSS58, queryPermission } from '@torus-network/sdk';
import {
  AccountId,
  PermId,
  UInt,
  Constraint
} from './types';
import {
  StakeOfFact,
  WeightSetFact,
  WeightPowerFromFact,
  PermissionExistsFact,
  PermissionEnabledFact,
  MaxDelegationDepthFact,
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
  fetchWeightSet(from: AccountId, to: AccountId): Promise<WeightSetFact>;
  fetchWeightPowerFrom(from: AccountId, to: AccountId): Promise<WeightPowerFromFact>;
  
  // Permission-related facts
  fetchPermissionExists(permId: PermId): Promise<PermissionExistsFact>;
  fetchPermissionEnabled(permId: PermId): Promise<PermissionEnabledFact>;
  fetchMaxDelegationDepth(permId: PermId): Promise<MaxDelegationDepthFact>;
  fetchInactiveUnlessRedelegated(permId: PermId): Promise<InactiveUnlessRedelegatedFact>;
  
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
   * Fetch the weight set from one account to another
   */
  async fetchWeightSet(from: AccountId, to: AccountId): Promise<WeightSetFact> {
    const api = await this.ensureConnected();
    
    try {
      // Validate SS58 addresses
      const validFromAddress = checkSS58(from);
      const validToAddress = checkSS58(to);
      
      // Query the staking delegation from 'from' account
      const stakingData = await queryKeyStakingTo(api, validFromAddress);
      
      // Find the stake delegated to the 'to' account
      const delegation = stakingData.find(stake => stake.address === validToAddress);
      
      return {
        type: 'WeightSet',
        from,
        to,
        amount: delegation ? delegation.stake : BigInt(0)
      };
    } catch (error) {
      console.error(`Error fetching weight set from ${from} to ${to}:`, error);
      return {
        type: 'WeightSet',
        from,
        to,
        amount: BigInt(0)
      };
    }
  }

  /**
   * Fetch the weight power from one account to another
   */
  async fetchWeightPowerFrom(from: AccountId, to: AccountId): Promise<WeightPowerFromFact> {
    const api = await this.ensureConnected();
    
    try {
      // Validate SS58 addresses
      const validFromAddress = checkSS58(from);
      const validToAddress = checkSS58(to);
      
      // TODO: Implement weight power calculation
      // This might require querying multiple storage items and calculating
      // the effective voting power including delegations
      
      // For now, use the same logic as weight set
      const stakingData = await queryKeyStakingTo(api, validFromAddress);
      const delegation = stakingData.find(stake => stake.address === validToAddress);
      
      return {
        type: 'WeightPowerFrom',
        from,
        to,
        amount: delegation ? delegation.stake : BigInt(0)
      };
    } catch (error) {
      console.error(`Error fetching weight power from ${from} to ${to}:`, error);
      return {
        type: 'WeightPowerFrom',
        from,
        to,
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
      // TODO: Implement permission enabled check
      // This depends on how permission status is stored in the Torus runtime
      
      return {
        type: 'PermissionEnabled',
        permId,
        enabled: false // TODO: Replace with actual enabled status query
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
   * Fetch the maximum delegation depth for a permission
   */
  async fetchMaxDelegationDepth(permId: PermId): Promise<MaxDelegationDepthFact> {
    const api = await this.ensureConnected();
    
    try {
      // TODO: Implement max delegation depth query
      // This depends on how delegation depths are stored in the Torus runtime
      
      return {
        type: 'MaxDelegationDepth',
        permId,
        depth: { $: 'UIntLiteral', value: BigInt(0) }, // TODO: Replace with actual depth expression
        actualDepth: BigInt(0) // TODO: Replace with actual depth value
      };
    } catch (error) {
      console.error(`Error fetching max delegation depth for permission ${permId}:`, error);
      return {
        type: 'MaxDelegationDepth',
        permId,
        depth: { $: 'UIntLiteral', value: BigInt(0) },
        actualDepth: BigInt(0)
      };
    }
  }

  /**
   * Fetch whether a permission is inactive unless redelegated
   */
  async fetchInactiveUnlessRedelegated(permId: PermId): Promise<InactiveUnlessRedelegatedFact> {
    const api = await this.ensureConnected();
    
    try {
      // TODO: Implement redelegation status check
      // This depends on how redelegation status is tracked in the Torus runtime
      
      return {
        type: 'InactiveUnlessRedelegated',
        permId,
        isRedelegated: false // TODO: Replace with actual redelegation status
      };
    } catch (error) {
      console.error(`Error checking redelegation status for permission ${permId}:`, error);
      return {
        type: 'InactiveUnlessRedelegated',
        permId,
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
            
          case 'WeightSet':
            fetchedFact = await this.fetcher.fetchWeightSet(fact.from, fact.to);
            break;
            
          case 'WeightPowerFrom':
            fetchedFact = await this.fetcher.fetchWeightPowerFrom(fact.from, fact.to);
            break;
            
          case 'PermissionExists':
            fetchedFact = await this.fetcher.fetchPermissionExists(fact.permId);
            break;
            
          case 'PermissionEnabled':
            fetchedFact = await this.fetcher.fetchPermissionEnabled(fact.permId);
            break;
            
          case 'MaxDelegationDepth':
            fetchedFact = await this.fetcher.fetchMaxDelegationDepth(fact.permId);
            break;
            
          case 'InactiveUnlessRedelegated':
            fetchedFact = await this.fetcher.fetchInactiveUnlessRedelegated(fact.permId);
            break;
            
          default:
            console.warn(`Unknown fact type: ${(fact as any).type}`);
            continue;
        }
        
        // Add the fetched fact to the network
        this.addFact(fetchedFact);
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

  async fetchWeightSet(from: AccountId, to: AccountId): Promise<WeightSetFact> {
    return { type: 'WeightSet', from, to, amount: BigInt(500) };
  }

  async fetchWeightPowerFrom(from: AccountId, to: AccountId): Promise<WeightPowerFromFact> {
    return { type: 'WeightPowerFrom', from, to, amount: BigInt(500) };
  }

  async fetchPermissionExists(permId: PermId): Promise<PermissionExistsFact> {
    return { type: 'PermissionExists', permId, exists: true };
  }

  async fetchPermissionEnabled(permId: PermId): Promise<PermissionEnabledFact> {
    return { type: 'PermissionEnabled', permId, enabled: true };
  }

  async fetchMaxDelegationDepth(permId: PermId): Promise<MaxDelegationDepthFact> {
    return {
      type: 'MaxDelegationDepth',
      permId,
      depth: { $: 'UIntLiteral', value: BigInt(5) },
      actualDepth: BigInt(5)
    };
  }

  async fetchInactiveUnlessRedelegated(permId: PermId): Promise<InactiveUnlessRedelegatedFact> {
    return { type: 'InactiveUnlessRedelegated', permId, isRedelegated: false };
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