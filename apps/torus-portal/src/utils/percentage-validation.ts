import { z } from "zod";

/**
 * Creates a Zod superRefine validator for arrays of items with percentage fields.
 * Validates that the total percentage across all items does not exceed 100%.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createPercentageArrayValidator<T extends Record<string, any>>(
  getPercentage: (item: T) => string | number,
  options: {
    /** Field name for error path targeting (defaults to 'percentage') */
    percentageField?: string;
    /** Custom error message for total validation */
    totalErrorMessage?: string;
    /** Custom error message for individual items */
    itemErrorMessage?: string;
  } = {},
) {
  const {
    percentageField = "percentage",
    totalErrorMessage = "Total percent must not exceed 100",
    itemErrorMessage = "Contributes to total over 100%",
  } = options;

  return (items: T[], ctx: z.RefinementCtx) => {
    const total = items.reduce((sum, item) => {
      const percentage = getPercentage(item);
      const num =
        typeof percentage === "string" ? parseFloat(percentage) : percentage;
      return sum + (isNaN(num) ? 0 : num);
    }, 0);

    if (total > 100) {
      // Add issue to the array as a whole
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `${totalErrorMessage} (got ${total})`,
        path: [],
      });

      // Tag specific items that contribute to the overage
      items.forEach((item, index) => {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: itemErrorMessage,
          path: [index, percentageField],
        });
      });
    }
  };
}

/**
 * Creates a superRefine validator specifically for stream-like objects with percentage strings.
 */
export const createStreamPercentageValidator = () =>
  createPercentageArrayValidator(
    (stream: { percentage: string }) => stream.percentage,
    {
      percentageField: "percentage",
      totalErrorMessage: "Total percent must not exceed 100",
      itemErrorMessage: "Contributes to total over 100%",
    },
  );
