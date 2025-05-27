import type { EventRecord } from '@polkadot/types/interfaces';
import type { ApiPromise } from '@polkadot/api';
import type { Header } from '@polkadot/types/interfaces';
import type { ChainAwareReteNetwork } from './chain-fetcher';
import type { PermissionExistsFact, BlockFact } from './facts';

/**
 * Chain watcher that monitors Torus blockchain events and updates RETE network facts
 */
export class TorusChainWatcher {
  private reteNetwork: ChainAwareReteNetwork;
  private isWatching = false;
  private unsubscribeFunctions: (() => void)[] = [];

  constructor(reteNetwork: ChainAwareReteNetwork) {
    this.reteNetwork = reteNetwork;
  }

  /**
   * Start watching blockchain events
   */
  async startWatching(): Promise<void> {
    if (this.isWatching) {
      console.log('[ChainWatcher] Already watching blockchain events');
      return;
    }

    try {
      // Get the WebSocket API from the network's fetcher
      const wsAPI = await this.reteNetwork.getFetcher().ensureConnected();
      
      console.log('[ChainWatcher] Starting blockchain event monitoring...');
      
      // Subscribe to all events
      const unsubEvents = await wsAPI.query.system.events((events: EventRecord[]) => {
        this.handleChainEvents(events);
      });
      this.unsubscribeFunctions.push(unsubEvents as () => void);
      
      // Subscribe to finalized heads for block updates
      const unsubBlocks = await wsAPI.rpc.chain.subscribeFinalizedHeads((header: Header) => {
        void this.handleNewBlock(header);
      });
      this.unsubscribeFunctions.push(unsubBlocks as () => void);
      
      this.isWatching = true;
      console.log('[ChainWatcher] Now monitoring Torus blockchain events');
      
    } catch (error) {
      console.error('[ChainWatcher] Failed to start blockchain monitoring:', error);
      throw error;
    }
  }

  /**
   * Stop watching blockchain events
   */
  stopWatching(): void {
    if (!this.isWatching) {
      return;
    }

    console.log('[ChainWatcher] Stopping blockchain event monitoring...');
    
    // Unsubscribe from all subscriptions
    for (const unsubscribe of this.unsubscribeFunctions) {
      unsubscribe();
    }
    this.unsubscribeFunctions = [];
    
    this.isWatching = false;
    console.log('[ChainWatcher] Stopped blockchain event monitoring');
  }

  /**
   * Get watching status
   */
  public isCurrentlyWatching(): boolean {
    return this.isWatching;
  }

  /**
   * Handle new finalized blocks
   */
  private handleNewBlock(header: Header): void {
    try {
      const blockNumber = BigInt(header.number.toString());
      const timestamp = BigInt(Date.now());
      
      console.log(`[ChainWatcher] New block finalized: ${blockNumber}`);
      
      // Update block fact in RETE network
      const blockFact: BlockFact = {
        type: 'Block',
        number: blockNumber,
        timestamp: timestamp
      };
      
      this.reteNetwork.addFact(blockFact);
      
    } catch (error) {
      console.error('[ChainWatcher] Error handling new block:', error instanceof Error ? error.message : String(error));
    }
  }

  /**
   * Handle blockchain events and update RETE network facts
   */
  private handleChainEvents(events: EventRecord[]): void {
    for (const record of events) {
      const { event } = record;
      const eventKey = `${event.section}.${event.method}`;

      try {
        switch (eventKey) {
          case 'torus0.StakeAdded':
          case 'torus0.StakeRemoved':
            void this.handleStakeEvent(event.data);
            break;
          
          case 'torus0.WeightsSet':
          case 'torus0.DelegatedWeightControl':
            void this.handleWeightEvent(event.data);
            break;
          
          case 'permission0.PermissionGranted':
            this.handlePermissionGranted(event.data);
            break;
          
          case 'permission0.PermissionRevoked':
          case 'permission0.PermissionExpired':
            this.handlePermissionRevoked(event.data);
            break;

          default:
            // Ignore other events
            break;
        }
      } catch (error) {
        console.error(`[ChainWatcher] Error handling event ${eventKey}:`, error);
      }
    }
  }

  /**
   * Handle stake-related events (StakeAdded, StakeRemoved)
   */
  private async handleStakeEvent(eventData: unknown[]): Promise<void> {
    try {
      const [account] = eventData;
      if (!account || typeof (account as { toString: () => string }).toString !== 'function') {
        console.warn('[ChainWatcher] Invalid account data in stake event');
        return;
      }
      const accountStr = (account as { toString: () => string }).toString();
      
      console.log(`[ChainWatcher] Stake changed for account: ${accountStr}`);
      
      // Fetch updated stake from chain and update RETE network
      const fetcher = this.reteNetwork.getFetcher();
      const updatedStakeFact = await fetcher.fetchStakeOf(accountStr);
      this.reteNetwork.addFact(updatedStakeFact);
      
    } catch (error) {
      console.error('[ChainWatcher] Error handling stake event:', error instanceof Error ? error.message : String(error));
    }
  }

  /**
   * Handle weight-related events (WeightsSet, DelegatedWeightControl)
   */
  private async handleWeightEvent(eventData: unknown[]): Promise<void> {
    try {
      if (eventData.length >= 2) {
        const [from, to] = eventData;
        if (!from || !to || 
            typeof (from as { toString: () => string }).toString !== 'function' ||
            typeof (to as { toString: () => string }).toString !== 'function') {
          console.warn('[ChainWatcher] Invalid data in weight event');
          return;
        }
        const fromStr = (from as { toString: () => string }).toString();
        const toStr = (to as { toString: () => string }).toString();
        
        console.log(`[ChainWatcher] Weight changed: ${fromStr} -> ${toStr}`);
        
        // Fetch updated weight facts and update RETE network
        const fetcher = this.reteNetwork.getFetcher();
        const weightSetFact = await fetcher.fetchWeightSet(fromStr, toStr);
        const weightPowerFact = await fetcher.fetchWeightPowerFrom(fromStr, toStr);
        
        this.reteNetwork.addFact(weightSetFact);
        this.reteNetwork.addFact(weightPowerFact);
      } else if (eventData.length >= 1) {
        // WeightsSet event with single account
        const [account] = eventData;
        if (account && typeof (account as { toString: () => string }).toString === 'function') {
          const accountStr = (account as { toString: () => string }).toString();
          console.log(`[ChainWatcher] Weights set by account: ${accountStr}`);
          // Note: We'd need to fetch all weight relationships for this account
          // For now, we just log the event
        }
      }
      
    } catch (error) {
      console.error('[ChainWatcher] Error handling weight event:', error instanceof Error ? error.message : String(error));
    }
  }

  /**
   * Handle permission granted events
   */
  private handlePermissionGranted(eventData: unknown[]): void {
    try {
      const [_grantor, _grantee, permissionId] = eventData;
      if (!permissionId || typeof (permissionId as { toString: () => string }).toString !== 'function') {
        console.warn('[ChainWatcher] Invalid permission ID in granted event');
        return;
      }
      const permissionIdStr = (permissionId as { toString: () => string }).toString();
      
      console.log(`[ChainWatcher] Permission granted: ${permissionIdStr}`);
      
      // Update permission existence fact
      const permissionFact: PermissionExistsFact = {
        type: 'PermissionExists',
        permId: permissionIdStr,
        exists: true
      };
      
      this.reteNetwork.addFact(permissionFact);
      
    } catch (error) {
      console.error('[ChainWatcher] Error handling permission granted:', error instanceof Error ? error.message : String(error));
    }
  }

  /**
   * Handle permission revoked/expired events
   */
  private handlePermissionRevoked(eventData: unknown[]): void {
    try {
      // For both PermissionRevoked and PermissionExpired, permissionId is the last element
      if (eventData.length === 0) {
        console.warn('[ChainWatcher] Empty event data for permission revoked');
        return;
      }
      const permissionId = eventData[eventData.length - 1];
      if (!permissionId || typeof (permissionId as { toString: () => string }).toString !== 'function') {
        console.warn('[ChainWatcher] Invalid permission ID in revoked event');
        return;
      }
      const permissionIdStr = (permissionId as { toString: () => string }).toString();
      
      console.log(`[ChainWatcher] Permission revoked/expired: ${permissionIdStr}`);
      
      // Update permission existence fact
      const permissionFact: PermissionExistsFact = {
        type: 'PermissionExists',
        permId: permissionIdStr,
        exists: false
      };
      
      this.reteNetwork.addFact(permissionFact);
      
    } catch (error) {
      console.error('[ChainWatcher] Error handling permission revoked:', error instanceof Error ? error.message : String(error));
    }
  }
}

/**
 * Create a chain watcher instance
 */
export function createChainWatcher(reteNetwork: ChainAwareReteNetwork): TorusChainWatcher {
  return new TorusChainWatcher(reteNetwork);
}