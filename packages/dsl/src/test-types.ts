// Simple type test for chain-fetcher
import { createChainFetcher, TorusChainFetcher, DummyChainFetcher } from './chain-fetcher';

// Test instantiation
const fetcher = createChainFetcher();
const torusFetcher = new TorusChainFetcher();
const dummyFetcher = new DummyChainFetcher();

// Test method calls
async function testTypes() {
  const stake = await fetcher.fetchStakeOf("5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY");
  const block = await fetcher.fetchCurrentBlock();
  const inactive = await fetcher.fetchInactiveUnlessRedelegated("5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY", BigInt(75));
  
  console.log(stake, block, inactive);
}