/**
 * Currency conversion utilities for TORUS token and USD.
 */

function isCurrencyInputValid(torusAmount: string, usdPrice: number): boolean {
  const parsedAmount = parseFloat(torusAmount);

  if (
    isNaN(parsedAmount) ||
    isNaN(usdPrice) ||
    usdPrice <= 0 ||
    parsedAmount < 0
  ) {
    return false;
  }

  return true;
}

export function convertTORUSToUSD(
  torusAmount: string,
  usdPrice: number,
  hasMaskDecimal: boolean = true,
): string {
  const parsedAmount = parseFloat(torusAmount);

  if (!isCurrencyInputValid(torusAmount, usdPrice)) {
    return "";
  }

  const formattedUsdPrice = usdPrice.toFixed(4);

  const result = parsedAmount * parseFloat(formattedUsdPrice);

  return hasMaskDecimal
    ? (Math.floor(result * 10000) / 10000).toString()
    : result.toString();
}

export function convertUSDToTorus(usdAmount: string, usdPrice: number): string {
  const parsedAmount = parseFloat(usdAmount);

  if (!isCurrencyInputValid(usdAmount, usdPrice)) {
    return "";
  }

  return (Math.floor((parsedAmount / usdPrice) * 10000) / 10000).toString();
}
