import { useMemo } from "react";
import { useTorus } from "@torus-ts/torus-provider";
import {
  useRecyclingPercentage,
  useTotalIssuance,
  useTotalStake,
  useTreasuryEmissionFee,
} from "@torus-ts/query-provider/hooks";
import { toNano } from "@torus-ts/utils/subspace";

const BLOCKS_IN_DAY = 10_800n;
const BLOCK_EMISSION = toNano(64_000) / BLOCKS_IN_DAY;
const HALVING_INTERVAL = toNano(144_000_000);

export function useAPR() {
  const { api } = useTorus();
  const totalStakeQuery = useTotalStake(api);
  const totalIssuanceQuery = useTotalIssuance(api);
  const recyclingPercentageQuery = useRecyclingPercentage(api);
  const treasuryEmissionFeeQuery = useTreasuryEmissionFee(api);

  const apr = useMemo(() => {
    if (
      !totalStakeQuery.data ||
      !totalIssuanceQuery.data ||
      recyclingPercentageQuery.data === undefined ||
      treasuryEmissionFeeQuery.data === undefined
    ) {
      return null;
    }

    try {
      const totalStakeBigInt = BigInt(totalStakeQuery.data.toString());
      const totalFreeBalance = BigInt(totalIssuanceQuery.data.toString());
      const totalSupply = totalStakeBigInt + totalFreeBalance;
      const recyclingRate = Number(recyclingPercentageQuery.data) / 100;
      const treasuryFee = Number(treasuryEmissionFeeQuery.data) / 100;
      const halvingCount = Number(totalSupply / HALVING_INTERVAL);

      let currentEmission = BLOCK_EMISSION >> BigInt(halvingCount);
      const notRecycled = 1.0 - recyclingRate;
      currentEmission =
        (currentEmission * BigInt(Math.floor(notRecycled * 100))) / 100n;

      const dailyRewards = (BLOCKS_IN_DAY * currentEmission) / 2n;
      const yearlyRewards = dailyRewards * 365n;
      const rewardsAfterTreasuryFee =
        (yearlyRewards * BigInt(Math.floor((1 - treasuryFee) * 100))) / 100n;

      const stakingAmount =
        totalStakeBigInt === 0n ? totalFreeBalance : totalStakeBigInt;
      const aprNumerator = rewardsAfterTreasuryFee * 100n;
      return Number(aprNumerator / stakingAmount);
    } catch (error) {
      console.error("Error calculating APR:", error);
      return null;
    }
  }, [
    totalStakeQuery.data,
    totalIssuanceQuery.data,
    recyclingPercentageQuery.data,
    treasuryEmissionFeeQuery.data,
  ]);

  return {
    apr,
    isLoading:
      totalStakeQuery.isLoading ||
      totalIssuanceQuery.isLoading ||
      recyclingPercentageQuery.isLoading ||
      treasuryEmissionFeeQuery.isLoading,
    isError:
      totalStakeQuery.isError ||
      totalIssuanceQuery.isError ||
      recyclingPercentageQuery.isError ||
      treasuryEmissionFeeQuery.isError,
    totalStake: totalStakeQuery.data,
    totalIssuance: totalIssuanceQuery.data,
  };
}
