import type { ApiPromise } from '@polkadot/api';
import { createStorageRouter } from './storage-router';
import type { GenericAccountId } from '@polkadot/types';

export async function exampleUsage(api: ApiPromise) {
  console.log('🚀 Starting Storage Router Examples');
  
  // Create storage router (single entry point)
  const storage = createStorageRouter(api);

  console.log('\n📊 === TORUS0 PALLET EXAMPLES ===');
  
  // Simple value queries
  const totalStake = await storage.torus0.totalStake.get();
  console.log('Total stake:', totalStake);
  
  const agentUpdateCooldown = await storage.torus0.agentUpdateCooldown.get();
  console.log('Agent update cooldown:', agentUpdateCooldown);
  
  const burn = await storage.torus0.burn.get();
  console.log('Burn amount:', burn);
  
  // const maxAllowedAgents = await storage.torus0.maxAllowedAgents.get();
  // console.log('Max allowed agents:', maxAllowedAgents);
  
  // const minAllowedStake = await storage.torus0.minAllowedStake.get();
  // console.log('Min allowed stake:' minAllowedStake);

  // Map storage example - agents
  console.log('\n🔍 Agents map storage examples:');
  
  // Get all agent keys
  const agentKeys = await storage.torus0.agents.keys();
  console.log('Total agents registered:', agentKeys.length);
  if (agentKeys.length > 0) {
    // Get first agent details
    const firstAgentKey = agentKeys[0];
    if (!firstAgentKey) throw new Error('No agent keys found');
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const firstAgent = await storage.torus0.agents.get(firstAgentKey as unknown as GenericAccountId);
    console.log('First agent:', firstAgentKey, firstAgent);
    
    // Get multiple agents at once
    const multipleAgents = await storage.torus0.agents.multi(agentKeys.slice(0, 3).map(key => key as unknown as GenericAccountId));
    console.log('First 3 agents:', multipleAgents);
  }

  console.log('\n🏛️ === SYSTEM PALLET EXAMPLES ===');
  
  const blockNumber = await storage.system.number.get();
  console.log('Current block number:', blockNumber);
  
  const parentHash = await storage.system.parentHash.get();
  console.log('Parent hash:', parentHash);

  console.log('\n💰 === BALANCES PALLET EXAMPLES ===');
  
  const totalIssuance = await storage.balances.totalIssuance.get();
  console.log('Total issuance:', totalIssuance);
  
  const inactiveIssuance = await storage.balances.inactiveIssuance.get();
  console.log('Inactive issuance:', inactiveIssuance);

  // Account balance example (if we have agent addresses)
  if (agentKeys.length > 0 && agentKeys[0]) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const accountData = await storage.balances.account.get(agentKeys[0] as unknown as GenericAccountId);
    console.log('Account data for first agent:', accountData);
  }

  console.log('\n🏛️ === GOVERNANCE PALLET EXAMPLES ===');
  
  const daoTreasuryAddress = await storage.governance.daoTreasuryAddress.get();
  console.log('DAO treasury address:', daoTreasuryAddress);
  
  const treasuryEmissionFee = await storage.governance.treasuryEmissionFee.get();
  console.log('Treasury emission fee:', treasuryEmissionFee);

  // Get all proposals
  const proposalKeys = await storage.governance.proposals.keys();
  console.log('Total proposals:', proposalKeys.length);
  
  if (proposalKeys.length > 0 && proposalKeys[0] !== undefined) {
    const firstProposal: unknown = await storage.governance.proposals.get(proposalKeys[0]);
    console.log('First proposal:', proposalKeys[0], firstProposal);
  }

  // Get all whitelisted addresses
  const whitelistKeys = await storage.governance.whitelist.keys();
  console.log('Whitelisted addresses:', whitelistKeys.length);

  console.log('\n🔔 === SUBSCRIPTION EXAMPLES ===');
  
  // Subscribe to total stake changes
  console.log('Subscribing to total stake changes...');
  const unsubTotalStake = storage.torus0.totalStake.subscribe((value) => {
    console.log('🔄 Total stake updated:', value);
  });

  // Subscribe to block number changes
  console.log('Subscribing to block number changes...');
  const unsubBlockNumber = storage.system.number.subscribe((value) => {
    console.log('🔄 Block number updated:', value);
  });

  // Example of querying at a specific block (commented out since we need a real block hash)
  // const historicalStake = await storage.torus0.totalStake.at('0xSomeRealBlockHash');
  // console.log('Historical total stake:', historicalStake);

  console.log('\n✅ Storage Router Examples Complete!');
  console.log('💡 Subscriptions are active - they will show updates as the chain progresses');
  return {
    cleanup: async () => {
      console.log('🧹 Cleaning up subscriptions...');
      await unsubTotalStake;
      await unsubBlockNumber;
    }
  };
}