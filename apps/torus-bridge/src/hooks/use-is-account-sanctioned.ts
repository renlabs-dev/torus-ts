import { useIsAccountChainalysisSanctioned } from "./use-is-account-chainalysis-sanctioned";
import { useIsAccountOfacSanctioned } from "./use-is-account-ofac-sanctioned";

export function useIsAccountSanctioned() {
  const isAccountOfacSanctioned = useIsAccountOfacSanctioned();
  const isAccountChainalysisSanctioned = useIsAccountChainalysisSanctioned();

  return isAccountOfacSanctioned || isAccountChainalysisSanctioned;
}
