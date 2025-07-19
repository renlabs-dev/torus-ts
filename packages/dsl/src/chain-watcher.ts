import type { EventRecord, Header } from "@polkadot/types/interfaces";

import { queryDelegationStreamsByAccount } from "@torus-network/sdk/chain";
import {
  checkSS58,
  parsePermissionAccumulationToggledEvent,
  parsePermissionExpiredEvent,
  parsePermissionRevokedEvent,
} from "@torus-network/sdk/types";

import type { ChainAwareReteNetwork } from "./chain-fetcher";
import type {
  BlockFact,
  InactiveUnlessRedelegatedFact,
  PermissionEnabledFact,
  PermissionExistsFact,
} from "./facts";

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
      console.log("[ChainWatcher] Already watching blockchain events");
      return;
    }

    try {
      // Get the WebSocket API from the network's fetcher
      const wsAPI = await this.reteNetwork.getFetcher().ensureConnected();

      console.log("[ChainWatcher] Starting blockchain event monitoring...");

      // Subscribe to all events
      const unsubEvents = await wsAPI.query.system.events(
        (events: EventRecord[]) => {
          this.handleChainEvents(events);
        },
      );
      this.unsubscribeFunctions.push(unsubEvents as () => void);

      // Subscribe to finalized heads for block updates
      const unsubBlocks = await wsAPI.rpc.chain.subscribeFinalizedHeads(
        (header: Header) => {
          void this.handleNewBlock(header);
        },
      );
      this.unsubscribeFunctions.push(unsubBlocks as () => void);

      this.isWatching = true;
      console.log("[ChainWatcher] Now monitoring Torus blockchain events");
    } catch (error) {
      console.error(
        "[ChainWatcher] Failed to start blockchain monitoring:",
        error,
      );
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

    console.log("[ChainWatcher] Stopping blockchain event monitoring...");

    // Unsubscribe from all subscriptions
    for (const unsubscribe of this.unsubscribeFunctions) {
      unsubscribe();
    }
    this.unsubscribeFunctions = [];

    this.isWatching = false;
    console.log("[ChainWatcher] Stopped blockchain event monitoring");
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
        type: "Block",
        number: blockNumber,
        timestamp: timestamp,
      };

      void this.reteNetwork.addFact(blockFact);
    } catch (error) {
      console.error(
        "[ChainWatcher] Error handling new block:",
        error instanceof Error ? error.message : String(error),
      );
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
          case "torus0.StakeAdded":
          case "torus0.StakeRemoved":
            void this.handleStakeEvent(event.data);
            break;

          case "permission0.PermissionGranted":
            this.handlePermissionGranted(event.data);
            break;

          case "permission0.PermissionRevoked":
            void this.handlePermissionRevoked(event.data);
            break;

          case "permission0.PermissionExpired":
            void this.handlePermissionExpired(event.data);
            break;

          case "permission0.PermissionAccumulationToggled":
            void this.handlePermissionAccumulationToggled(event.data);
            break;

          default:
            // Ignore other events
            break;
        }
      } catch (error) {
        console.error(
          `[ChainWatcher] Error handling event ${eventKey}:`,
          error,
        );
      }
    }
  }

  /**
   * Handle stake-related events (StakeAdded, StakeRemoved)
   */
  private async handleStakeEvent(eventData: unknown[]): Promise<void> {
    try {
      const [account] = eventData;
      if (
        !account ||
        typeof (account as { toString: () => string }).toString !== "function"
      ) {
        console.warn("[ChainWatcher] Invalid account data in stake event");
        return;
      }
      const accountStr = (account as { toString: () => string }).toString();

      console.log(`[ChainWatcher] Stake changed for account: ${accountStr}`);

      // Fetch updated stake from chain and update RETE network
      const fetcher = this.reteNetwork.getFetcher();
      const updatedStakeFact = await fetcher.fetchStakeOf(accountStr);
      await this.reteNetwork.addFact(updatedStakeFact);
    } catch (error) {
      console.error(
        "[ChainWatcher] Error handling stake event:",
        error instanceof Error ? error.message : String(error),
      );
    }
  }

  /**
   * Handle permission granted events
   */
  private handlePermissionGranted(eventData: unknown[]): void {
    try {
      const [_grantor, _grantee, permissionId] = eventData;
      if (
        !permissionId ||
        typeof (permissionId as { toString: () => string }).toString !==
          "function"
      ) {
        console.warn("[ChainWatcher] Invalid permission ID in granted event");
        return;
      }
      const permissionIdStr = (
        permissionId as { toString: () => string }
      ).toString();

      console.log(`[ChainWatcher] Permission granted: ${permissionIdStr}`);

      // Update permission existence fact
      const permissionFact: PermissionExistsFact = {
        type: "PermissionExists",
        permId: permissionIdStr,
        exists: true,
      };

      void this.reteNetwork.addFact(permissionFact);
    } catch (error) {
      console.error(
        "[ChainWatcher] Error handling permission granted:",
        error instanceof Error ? error.message : String(error),
      );
    }
  }

  /**
   * Handle permission revoked events
   */
  private async handlePermissionRevoked(eventData: unknown): Promise<void> {
    try {
      const parseResult = parsePermissionRevokedEvent(eventData);

      if (!parseResult.success) {
        console.warn(
          "[ChainWatcher] Failed to parse PermissionRevoked event:",
          parseResult.error.message,
        );
        return;
      }

      const { grantor, grantee, permission_id } = parseResult.data;

      console.log(
        `[ChainWatcher] Permission revoked: ${permission_id}, grantor: ${grantor}, grantee: ${grantee}`,
      );

      // Check if there's already a PermissionExists fact for this permission
      const existingFacts = this.reteNetwork.getFacts();
      const hasPermissionExistsFact = existingFacts.some(
        (fact) =>
          fact.type === "PermissionExists" &&
          "permId" in fact &&
          fact.permId === permission_id,
      );

      if (hasPermissionExistsFact) {
        // Update permission existence fact
        const permissionFact: PermissionExistsFact = {
          type: "PermissionExists",
          permId: permission_id,
          exists: false,
        };

        void this.reteNetwork.addFact(permissionFact);
      }

      // Check for InactiveUnlessRedelegated implications
      await this.checkInactiveUnlessRedelegatedForGrantor(grantor);
    } catch (error) {
      console.error(
        "[ChainWatcher] Error handling permission revoked:",
        error instanceof Error ? error.message : String(error),
      );
    }
  }

  /**
   * Handle permission expired events
   */
  private async handlePermissionExpired(eventData: unknown): Promise<void> {
    try {
      const parseResult = parsePermissionExpiredEvent(eventData);

      if (!parseResult.success) {
        console.warn(
          "[ChainWatcher] Failed to parse PermissionExpired event:",
          parseResult.error.message,
        );
        return;
      }

      const { grantor, grantee, permission_id } = parseResult.data;

      console.log(
        `[ChainWatcher] Permission expired: ${permission_id}, grantor: ${grantor}, grantee: ${grantee}`,
      );

      // Check if there's already a PermissionExists fact for this permission
      const existingFacts = this.reteNetwork.getFacts();
      const hasPermissionExistsFact = existingFacts.some(
        (fact) =>
          fact.type === "PermissionExists" &&
          "permId" in fact &&
          fact.permId === permission_id,
      );

      if (hasPermissionExistsFact) {
        // Update permission existence fact
        const permissionFact: PermissionExistsFact = {
          type: "PermissionExists",
          permId: permission_id,
          exists: false,
        };

        void this.reteNetwork.addFact(permissionFact);
      }

      // Check for InactiveUnlessRedelegated implications
      await this.checkInactiveUnlessRedelegatedForGrantor(grantor);
    } catch (error) {
      console.error(
        "[ChainWatcher] Error handling permission expired:",
        error instanceof Error ? error.message : String(error),
      );
    }
  }

  /**
   * Check if a grantor losing a permission affects any InactiveUnlessRedelegated facts
   */
  private async checkInactiveUnlessRedelegatedForGrantor(
    grantor: string,
  ): Promise<void> {
    try {
      // Get existing InactiveUnlessRedelegated facts in the network
      const existingFacts = this.reteNetwork.getFacts();
      const inactiveUnlessRedelegatedFacts = existingFacts.filter(
        (fact): fact is InactiveUnlessRedelegatedFact =>
          fact.type === "InactiveUnlessRedelegated" &&
          "account" in fact &&
          fact.account === grantor,
      );

      if (inactiveUnlessRedelegatedFacts.length === 0) {
        return; // No InactiveUnlessRedelegated facts for this account
      }

      console.log(
        `[ChainWatcher] Checking InactiveUnlessRedelegated status for ${grantor} after permission loss`,
      );

      const api = await this.reteNetwork.getFetcher().ensureConnected();

      // Validate the grantor address
      const validGrantorAddress = checkSS58(grantor);

      // Check if the grantor still has active delegation streams
      const [delegationError, delegationStreams] =
        await queryDelegationStreamsByAccount(api, validGrantorAddress);

      if (delegationError !== undefined) {
        console.warn(
          `[ChainWatcher] Failed to query delegation streams for ${grantor}:`,
          delegationError,
        );
        return;
      }

      const hasActiveDelegations = delegationStreams.size > 0;

      // Update all InactiveUnlessRedelegated facts for this account
      for (const fact of inactiveUnlessRedelegatedFacts) {
        const updatedFact: InactiveUnlessRedelegatedFact = {
          type: "InactiveUnlessRedelegated",
          account: fact.account,
          percentage: fact.percentage,
          isRedelegated: hasActiveDelegations,
        };

        await this.reteNetwork.addFact(updatedFact);

        console.log(
          `[ChainWatcher] Updated InactiveUnlessRedelegated for ${grantor}: isRedelegated = ${hasActiveDelegations}`,
        );
      }
    } catch (error) {
      console.error(
        "[ChainWatcher] Error checking InactiveUnlessRedelegated implications:",
        error instanceof Error ? error.message : String(error),
      );
    }
  }

  /**
   * Handle permission accumulation toggled events
   */
  private async handlePermissionAccumulationToggled(
    eventData: unknown,
  ): Promise<void> {
    try {
      const parseResult = parsePermissionAccumulationToggledEvent(eventData);

      if (!parseResult.success) {
        console.warn(
          "[ChainWatcher] Failed to parse PermissionAccumulationToggled event:",
          parseResult.error.message,
        );
        return;
      }

      const { permission_id, accumulating } = parseResult.data;

      console.log(
        `[ChainWatcher] Permission accumulation toggled: ${permission_id}, accumulating: ${accumulating}`,
      );

      // Check if there's already a PermissionEnabled fact for this permission
      const existingFacts = this.reteNetwork.getFacts();
      const hasPermissionEnabledFact = existingFacts.some(
        (fact) =>
          fact.type === "PermissionEnabled" &&
          "permId" in fact &&
          fact.permId === permission_id,
      );

      if (!hasPermissionEnabledFact) {
        console.log(
          `[ChainWatcher] No PermissionEnabled fact found for ${permission_id}, skipping update`,
        );
        return;
      }

      // Update permission enabled fact
      const permissionEnabledFact: PermissionEnabledFact = {
        type: "PermissionEnabled",
        permId: permission_id,
        enabled: accumulating,
      };

      await this.reteNetwork.addFact(permissionEnabledFact);
    } catch (error) {
      console.error(
        "[ChainWatcher] Error handling permission accumulation toggled:",
        error instanceof Error ? error.message : String(error),
      );
    }
  }
}

/**
 * Create a chain watcher instance
 */
export function createChainWatcher(
  reteNetwork: ChainAwareReteNetwork,
): TorusChainWatcher {
  return new TorusChainWatcher(reteNetwork);
}
