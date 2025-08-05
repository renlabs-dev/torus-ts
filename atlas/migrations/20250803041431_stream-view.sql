-- Add value to enum type: "permission_revocation_type"
ALTER TYPE "public"."permission_revocation_type" ADD VALUE 'revocable_by_delegator' AFTER 'revocable_by_grantor';
