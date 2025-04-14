import { DateTime } from "luxon";

export const formatMonth = (date: Date, withoutYear?: boolean): string => {
  const options: Intl.DateTimeFormatOptions = {
    month: "short",
    day: "2-digit",
    ...(withoutYear ? {} : { year: "2-digit" }),
  };
  return DateTime.fromJSDate(date).toLocaleString(options);
};

export const formatPercentage = (value: number): string => {
  return isNaN(value) ? "0.0" : value.toFixed(1);
};

export const calculatePercentGain = (
  current: number,
  initial: number,
): number => {
  return initial > 0 ? ((current - initial) / initial) * 100 : 0;
};

export const getInitialAmount = (
  customAmount: string,
  actualBalance: number,
): number => {
  const inputAmount = parseFloat(customAmount);
  return !isNaN(inputAmount) && inputAmount > 0
    ? inputAmount
    : actualBalance > 0
      ? actualBalance
      : 0;
};

export const calculateProjectedGrowth = (
  stake: number,
  months: number,
  apr: number,
  monthlyCompounds: number,
): number => {
  if (isNaN(stake) || stake <= 0) return 0;

  const aprRate = apr / 100;
  const timeframe = months / 12;
  return (
    stake *
    Math.pow(
      1 + (aprRate * 1.2) / monthlyCompounds,
      monthlyCompounds * timeframe,
    )
  );
};
