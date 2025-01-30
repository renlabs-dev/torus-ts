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

interface NumberLike {
  toNumber: () => number;
  words?: number[];
}

interface BigIntLike {
  toBigInt: () => bigint;
}

interface StringLike {
  toString: () => string;
}

function convertToNumber(value: unknown): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === "number") return value;
  if (typeof value === "string") return parseFloat(value);

  const numberLike = value as NumberLike;
  if (typeof numberLike.toNumber === "function") {
    return numberLike.toNumber();
  }
  if (numberLike.words?.[0] !== undefined) {
    return numberLike.words[0];
  }
  return 0;
}

function convertToBigInt(value: unknown): bigint {
  if (value === null || value === undefined) return 0n;
  if (typeof value === "bigint") return value;

  const bigIntLike = value as BigIntLike;
  if (typeof bigIntLike.toBigInt === "function") {
    return bigIntLike.toBigInt();
  }
  if (typeof value === "string" || typeof value === "number") {
    return BigInt(value);
  }

  const stringLike = value as StringLike;
  if (typeof stringLike.toString === "function") {
    try {
      const str = stringLike.toString();
      return BigInt(str);
    } catch {
      return 0n;
    }
  }
  return 0n;
}

export function useAPR() {
  const { api } = useTorus();
  const totalStakeQuery = useTotalStake(api);
  const totalIssuanceQuery = useTotalIssuance(api);
  const recyclingPercentageQuery = useRecyclingPercentage(api);
  const treasuryEmissionFeeQuery = useTreasuryEmissionFee(api);

  const apr = useMemo(() => {
    // Check if all data is available
    if (
      totalStakeQuery.data === undefined ||
      totalIssuanceQuery.data === undefined ||
      recyclingPercentageQuery.data === undefined ||
      treasuryEmissionFeeQuery.data === undefined
    ) {
      return null;
    }

    try {
      // Convert input values
      const totalStakeBigInt = convertToBigInt(totalStakeQuery.data);
      const totalFreeBalance = convertToBigInt(totalIssuanceQuery.data);
      const recyclingRate =
        convertToNumber(recyclingPercentageQuery.data) / 100;
      const treasuryFee = convertToNumber(treasuryEmissionFeeQuery.data) / 100;

      // Calculate total supply and halving count
      const totalSupply = totalStakeBigInt + totalFreeBalance;
      const halvingCount = Number(totalSupply / HALVING_INTERVAL);

      // Calculate emission
      let currentEmission = BLOCK_EMISSION >> BigInt(halvingCount);
      const notRecycled = 1.0 - recyclingRate;
      currentEmission =
        (currentEmission * BigInt(Math.floor(notRecycled * 100))) / 100n;

      // Calculate rewards
      const dailyRewards = (BLOCKS_IN_DAY * currentEmission) / 2n;
      const yearlyRewards = dailyRewards * 365n;
      const rewardsAfterTreasuryFee =
        (yearlyRewards * BigInt(Math.floor((1 - treasuryFee) * 100))) / 100n;

      // Calculate APR
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
