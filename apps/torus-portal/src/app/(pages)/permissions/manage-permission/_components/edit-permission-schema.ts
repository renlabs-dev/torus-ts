import { z } from "zod";

interface AllocationItem {
  percentage: number;
  [key: string]: unknown;
}

/**
 * Validates that there are no duplicate identifiers in the array
 */
function validateNoDuplicates<T extends Record<string, unknown>>(
  items: T[] | undefined,
  getIdentifier: (item: T) => string,
  config: {
    arrayPath: string;
    identifierFieldPath: string;
    itemType: string; // e.g., "stream ID" or "target address"
  },
  ctx: z.RefinementCtx,
) {
  if (!items || items.length === 0) return;

  const identifiers = items.map(getIdentifier);
  const duplicates = new Set<string>();
  const seen = new Set<string>();

  identifiers.forEach((id) => {
    if (id && seen.has(id)) {
      duplicates.add(id);
    }
    if (id) seen.add(id);
  });

  if (duplicates.size > 0) {
    // Mark fields with duplicate identifiers
    items.forEach((item, index) => {
      const id = getIdentifier(item);
      if (duplicates.has(id)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Duplicate ${config.itemType}`,
          path: [config.arrayPath, index, config.identifierFieldPath],
        });
      }
    });
  }
}

function validateTotalAllocation<T extends AllocationItem>(
  items: T[] | undefined,
  getValue: (item: T) => number,
  config: {
    arrayPath: string;
    valueFieldPath: string;
    itemType: string;
    unit?: string;
  },
  ctx: z.RefinementCtx,
) {
  if (!items || items.length === 0) return;

  const total = items.reduce((sum, item) => sum + getValue(item), 0);

  if (total > 100) {
    const unit = config.unit ?? "";
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `Total ${config.itemType} must not exceed 100${unit} (currently ${total}${unit})`,
      path: [config.arrayPath],
    });

    // Mark individual items that contribute to the overage
    items.forEach((_, index) => {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Contributes to total over 100${unit}`,
        path: [config.arrayPath, index, config.valueFieldPath],
      });
    });
  }
}

export const TARGET_SCHEMA = z.object({
  address: z.string().min(1, "Agent address is required"),
  percentage: z
    .number()
    .min(0)
    .max(100, "Percentage must be between 0 and 100"),
});

export const STREAM_ENTRY_SCHEMA = z.object({
  streamId: z
    .string()
    .min(1, "Stream ID is required")
    .regex(
      /^0x[0-9a-fA-F]{64}$/,
      "Stream ID must be a valid hex string (0x...)",
    ),
  percentage: z
    .number()
    .min(0)
    .max(100, "Percentage must be between 0 and 100"),
});

export const DISTRIBUTION_CONTROL_SCHEMA = z.union([
  z.object({ Manual: z.null() }),
  z.object({ Automatic: z.bigint().nonnegative() }),
  z.object({ AtBlock: z.number().int().nonnegative() }),
  z.object({ Interval: z.number().int().nonnegative() }),
]);

export const EDIT_PERMISSION_SCHEMA = z
  .object({
    permissionId: z
      .string()
      .min(1, "Permission ID is required")
      .regex(
        /^0x[0-9a-fA-F]{64}$/,
        "Permission ID must be a valid hex string (0x...)",
      ),
    newTargets: z.array(TARGET_SCHEMA).optional(),
    newStreams: z.array(STREAM_ENTRY_SCHEMA).optional(),
    newDistributionControl: DISTRIBUTION_CONTROL_SCHEMA.optional(),
  })
  .superRefine((data, ctx) => {
    // Validate streams total percentage
    validateTotalAllocation(
      data.newStreams,
      (stream) => stream.percentage,
      {
        arrayPath: "newStreams",
        valueFieldPath: "percentage",
        itemType: "stream percentages",
        unit: "%",
      },
      ctx,
    );

    // Validate no duplicate stream IDs
    validateNoDuplicates(
      data.newStreams,
      (stream) => stream.streamId,
      {
        arrayPath: "newStreams",
        identifierFieldPath: "streamId",
        itemType: "stream ID",
      },
      ctx,
    );

    // Validate targets total percentage
    validateTotalAllocation(
      data.newTargets,
      (target) => target.percentage,
      {
        arrayPath: "newTargets",
        valueFieldPath: "percentage",
        itemType: "target percentages",
        unit: "%",
      },
      ctx,
    );

    // Validate no duplicate target addresses
    validateNoDuplicates(
      data.newTargets,
      (target) => target.address,
      {
        arrayPath: "newTargets",
        identifierFieldPath: "address",
        itemType: "target address",
      },
      ctx,
    );
  });

export type DistributionControlFormData = z.infer<
  typeof DISTRIBUTION_CONTROL_SCHEMA
>;
export type EditPermissionFormData = z.infer<typeof EDIT_PERMISSION_SCHEMA>;
