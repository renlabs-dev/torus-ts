import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);

import type { TimeWindowParams } from "./api-schemas";

/**
 * Formats a wallet address to show first 6 and last 6 characters
 * @param address - The full wallet address
 * @returns Formatted address like "123456...123456"
 */
export function formatAddress(address: string): string {
  if (!address || address.length < 12) {
    return address;
  }
  return `${address.slice(0, 6)}...${address.slice(-6)}`;
}

export function createRecentTimeWindow(
  lookbackMinutes: number = 30,
): TimeWindowParams {
  return {
    from: dayjs().subtract(lookbackMinutes, "minute").toISOString(),
  };
}

export function createLastHoursTimeWindow(hours: number): TimeWindowParams {
  return {
    from: dayjs().subtract(hours, "hour").toISOString(),
    to: dayjs().toISOString(),
  };
}

export function createDateRangeTimeWindow(
  startDate: Date,
  endDate: Date,
): TimeWindowParams {
  return {
    from: dayjs(startDate).startOf("day").toISOString(),
    to: dayjs(endDate).endOf("day").toISOString(),
  };
}

export function createTodayTimeWindow(): TimeWindowParams {
  const today = dayjs().utc();
  return {
    from: today.startOf("day").toISOString(),
    to: today.endOf("day").toISOString(),
  };
}

export function createLastDaysTimeWindow(days: number): TimeWindowParams {
  const today = dayjs().utc();
  const daysAgo = today.subtract(days, "day");

  return {
    from: daysAgo.startOf("day").toISOString(),
    to: today.endOf("day").toISOString(),
  };
}

export function createCurrentWeekTimeWindow(): TimeWindowParams {
  const today = dayjs().utc();
  const startOfWeek = today.startOf("week");

  return {
    from: startOfWeek.startOf("day").toISOString(),
    to: today.endOf("day").toISOString(),
  };
}

export function createCurrentMonthTimeWindow(): TimeWindowParams {
  const today = dayjs().utc();
  const startOfMonth = today.startOf("month");

  return {
    from: startOfMonth.startOf("day").toISOString(),
    to: today.endOf("day").toISOString(),
  };
}

export function createAllTimeWindow(): TimeWindowParams {
  return {
    from: dayjs("2025-01-01").utc().startOf("day").toISOString(),
  };
}

export function dateToISOStringSafe(
  date: Date | undefined,
  endOfDay: boolean = false,
): string | undefined {
  if (!date || !(date instanceof Date) || Number.isNaN(date.getTime())) {
    return undefined;
  }

  const dayjsDate = dayjs(date).utc();

  if (endOfDay) {
    return dayjsDate.endOf("day").toISOString();
  }
  return dayjsDate.startOf("day").toISOString();
}

export function formatAgentAddress(
  address: string,
  length: number = 8,
): string {
  if (address.length <= length * 2) {
    return address;
  }

  const start = address.slice(0, length);
  const end = address.slice(-length);
  return `${start}...${end}`;
}

export function formatLargeNumber(num: number): string {
  if (num >= 1_000_000_000) {
    return `${(num / 1_000_000_000).toFixed(1)}B`;
  }
  if (num >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(1)}M`;
  }
  if (num >= 1_000) {
    return `${(num / 1_000).toFixed(1)}K`;
  }
  return num.toString();
}

export function calculatePercentageChange(
  current: number,
  previous: number,
): number {
  if (previous === 0) {
    return current > 0 ? 100 : 0;
  }
  return ((current - previous) / previous) * 100;
}

export function groupBy<T, K extends string | number | symbol>(
  array: T[],
  keyFn: (item: T) => K,
): Record<K, T[]> {
  return array.reduce(
    (groups, item) => {
      const key = keyFn(item);
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(item);
      return groups;
    },
    {} as Record<K, T[]>,
  );
}

export function isValidAgentAddress(address: string): boolean {
  return address.length > 0 && address.length <= 200 && !address.includes(" ");
}

/**
 * Extracts claim ID from verdict reasoning text
 * Examples:
 * - "I agree with claim 3311" -> 3311
 * - "Disagree with claim 1234" -> 1234
 * - "Claim 5678 is incorrect" -> 5678
 */
export function extractClaimIdFromReasoning(reasoning: string): number | null {
  if (!reasoning) return null;

  // Match patterns like "claim 3311", "Claim 1234", etc.
  const claimMatch = reasoning.match(/\bclaim\s+(\d+)/i);
  if (claimMatch) {
    return parseInt(claimMatch[1], 10);
  }

  return null;
}

export function createQueryKey(
  endpoint: string,
  params?: Record<string, unknown>,
): string[] {
  const baseKey = [endpoint];
  if (params && Object.keys(params).length > 0) {
    const sortedParams = Object.keys(params)
      .sort()
      .reduce(
        (acc, key) => {
          if (params[key] !== undefined && params[key] !== null) {
            acc[key] = params[key];
          }
          return acc;
        },
        {} as Record<string, unknown>,
      );

    baseKey.push(JSON.stringify(sortedParams));
  }
  return baseKey;
}
