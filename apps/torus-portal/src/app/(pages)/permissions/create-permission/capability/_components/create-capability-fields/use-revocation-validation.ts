import { useCallback, useMemo } from "react";

import type {
  Api,
  PermissionId,
  RevocationTerms,
} from "@torus-network/sdk/chain";
import {
  DelegationTreeManager,
  queryPermission,
} from "@torus-network/sdk/chain";

import type { PathWithPermission } from "../create-capability-flow/create-capability-flow-types";
import type { CreateCapabilityPermissionFormData } from "../create-capability-permission-form-schema";

interface UseRevocationValidationProps {
  api?: Api;
  pathsWithPermissions: PathWithPermission[];
}

export interface RevocationValidationError {
  permissionId: PermissionId;
  parentRevocation: RevocationTerms;
  childRevocation: RevocationTerms;
  message: string;
}

/**
 * Hook for validating revocation strength against parent permissions
 */
export function useRevocationValidation({
  api,
  pathsWithPermissions,
}: UseRevocationValidationProps) {
  // Get all unique parent permission IDs
  const parentPermissionIds = useMemo(() => {
    return Array.from(
      new Set(
        pathsWithPermissions
          .filter(
            (
              path,
            ): path is PathWithPermission & { permissionId: PermissionId } =>
              path.permissionId !== null,
          )
          .map((path) => path.permissionId),
      ),
    );
  }, [pathsWithPermissions]);

  /**
   * Validate if the proposed revocation terms are weaker than all parent permissions
   */
  const validateRevocationStrength = useCallback(
    async (
      formData: CreateCapabilityPermissionFormData,
    ): Promise<RevocationValidationError[]> => {
      if (!api || parentPermissionIds.length === 0) {
        return [];
      }

      const errors: RevocationValidationError[] = [];

      // Convert form data to RevocationTerms format
      const childRevocation = convertFormToRevocationTerms(formData.revocation);

      // Check each parent permission
      for (const permissionId of parentPermissionIds) {
        try {
          const [queryError, parentPermission] = await queryPermission(
            api,
            permissionId,
          );

          if (queryError || !parentPermission) {
            continue; // Skip if permission not found
          }

          const parentRevocation = parentPermission.revocation;

          // Use SDK's isWeaker method to validate
          const isValid = DelegationTreeManager.isWeaker(
            parentRevocation,
            childRevocation,
          );

          if (!isValid) {
            errors.push({
              permissionId,
              parentRevocation,
              childRevocation,
              message: `Child revocation terms are stronger than parent permission ${permissionId.slice(0, 8)}...`,
            });
          }
        } catch (error) {
          console.error(`Error validating permission ${permissionId}:`, error);
        }
      }

      return errors;
    },
    [api, parentPermissionIds],
  );

  return {
    validateRevocationStrength,
    hasParentPermissions: parentPermissionIds.length > 0,
    parentPermissionIds,
  };
}

/**
 * Convert form revocation data to SDK RevocationTerms format
 */
function convertFormToRevocationTerms(
  formRevocation: CreateCapabilityPermissionFormData["revocation"],
): RevocationTerms {
  switch (formRevocation.type) {
    case "Irrevocable":
      return { Irrevocable: null };

    case "RevocableByDelegator":
      return { RevocableByDelegator: null };

    case "RevocableByArbiters":
      return {
        RevocableByArbiters: {
          accounts: formRevocation.accounts,
          requiredVotes: BigInt(formRevocation.requiredVotes || "0"),
        },
      };

    case "RevocableAfter":
      return {
        RevocableAfter: parseInt(formRevocation.blockNumber, 10),
      };

    default:
      // Fallback to most permissive
      return { RevocableByDelegator: null };
  }
}

/**
 * Format revocation terms for display
 */
export function formatRevocationTermsForDisplay(
  revocation: RevocationTerms,
): string {
  if ("Irrevocable" in revocation) {
    return "Irrevocable";
  }
  if ("RevocableByDelegator" in revocation) {
    return "Revocable by Delegator";
  }
  if ("RevocableByArbiters" in revocation) {
    const { requiredVotes } = revocation.RevocableByArbiters;
    return `Revocable by Arbiters (${requiredVotes} votes required)`;
  }
  if ("RevocableAfter" in revocation) {
    return `Revocable after block ${revocation.RevocableAfter}`;
  }

  return "Unknown";
}
