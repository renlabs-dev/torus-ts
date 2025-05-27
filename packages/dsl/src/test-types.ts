// Simple type test for chain-fetcher
import { createChainFetcher, TorusChainFetcher, DummyChainFetcher } from './chain-fetcher';

// Test instantiation
const fetcher = createChainFetcher();
const torusFetcher = new TorusChainFetcher();
const dummyFetcher = new DummyChainFetcher();

// Test method calls
async function testTypes() {
  const stake = await fetcher.fetchStakeOf("5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY");
  const weight = await fetcher.fetchWeightSet("5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY", "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY");
  const block = await fetcher.fetchCurrentBlock();
  
  console.log(stake, weight, block);
}