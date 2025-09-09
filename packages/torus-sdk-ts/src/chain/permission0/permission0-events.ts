import type { z } from "zod";
import {
  sb_address,
  sb_bool,
  sb_h256,
  sb_option,
  sb_struct,
} from "../../substrate-parsers/index.js";

/**
 * Schema for PermissionAccumulationToggled event data
 * Event structure: { permission_id: PermissionId, accumulating: bool, toggled_by: Option<AccountId> }
 */
export const PermissionAccumulationToggledEvent = sb_struct({
  permission_id: sb_h256,
  accumulating: sb_bool,
  toggled_by: sb_option(sb_address),
});

export type PermissionAccumulationToggledEvent = z.infer<
  typeof PermissionAccumulationToggledEvent
>;

/**
 * Schema for PermissionRevoked event data
 * Event structure: { grantor: AccountId, grantee: AccountId, permission_id: PermissionId, revoked_by: AccountId }
 */
export const PermissionRevokedEvent = sb_struct({
  grantor: sb_address,
  grantee: sb_address,
  permission_id: sb_h256,
  revoked_by: sb_address,
});

export type PermissionRevokedEvent = z.infer<typeof PermissionRevokedEvent>;

/**
 * Schema for PermissionExpired event data
 * Event structure: { grantor: AccountId, grantee: AccountId, permission_id: PermissionId }
 */
export const PermissionExpiredEvent = sb_struct({
  grantor: sb_address,
  grantee: sb_address,
  permission_id: sb_h256,
});

export type PermissionExpiredEvent = z.infer<typeof PermissionExpiredEvent>;
