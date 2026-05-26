"use client";

import { decodeAddress } from "@polkadot/util-crypto";
import { tryAsync, trySync } from "@torus-network/torus-utils/try-catch";
import { Button } from "@torus-ts/ui/components/button";
import { Input } from "@torus-ts/ui/components/input";
import { useWithdraw } from "~/hooks/use-withdraw";
import { getNativeWithdrawAmount } from "~/lib/claim-amounts";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  ExternalLink,
  Loader2,
  Wallet,
} from "lucide-react";
import type { FormEvent } from "react";
import { useState } from "react";
import { formatEther } from "viem";

interface ClaimStepTwoProps {
  evmBalance: bigint;
}

const DISCORD_URL = "https://discord.gg/SS2kBerKZg";

function validateSS58(value: string): boolean {
  const [error] = trySync(() => decodeAddress(value));
  return error === undefined;
}

export function ClaimStepTwo({ evmBalance }: Readonly<ClaimStepTwoProps>) {
  const [ss58, setSs58] = useState("");
  const [inputMode, setInputMode] = useState<"paste" | "extension">("paste");
  const [extensionAccounts, setExtensionAccounts] = useState<
    { address: string; name?: string }[]
  >([]);
  const [inputError, setInputError] = useState<string | undefined>();
  const [submittedAmountFormatted, setSubmittedAmountFormatted] = useState<
    string | undefined
  >();
  const { state, submit, reset } = useWithdraw();
  const withdrawAmount = getNativeWithdrawAmount(evmBalance);
  const amountFormatted = formatEther(withdrawAmount);

  const handleConnectExtension = async () => {
    const { web3Enable, web3Accounts } =
      await import("@polkadot/extension-dapp");
    const [enableError] = await tryAsync(web3Enable("Torus Migration Claim"));
    if (enableError !== undefined) {
      setInputError("Could not connect to wallet extension.");
      return;
    }
    const [accountsError, accounts] = await tryAsync(web3Accounts());
    if (accountsError !== undefined || !accounts.length) {
      setInputError(
        "No substrate accounts found. Make sure your extension is unlocked.",
      );
      return;
    }
    setExtensionAccounts(
      accounts.map((a) => ({ address: a.address, name: a.meta.name })),
    );
    setInputMode("extension");
  };

  const handleSelectAccount = (address: string) => {
    setSs58(address);
    setInputError(undefined);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!validateSS58(ss58)) {
      setInputError("Invalid SS58 address. Check for typos.");
      return;
    }
    setInputError(undefined);
    setSubmittedAmountFormatted(amountFormatted);
    void submit(ss58, withdrawAmount);
  };

  if (state.status === "success") {
    return (
      <div className="flex flex-col items-center gap-3 py-2">
        <CheckCircle className="h-8 w-8 text-green-500" />
        <p className="text-sm font-medium">
          Withdrawn {submittedAmountFormatted ?? amountFormatted} TORUS to
          native
        </p>
        <p className="text-muted-foreground text-center text-xs">
          Your TORUS will appear in your substrate wallet.
        </p>
        <a
          href={`https://evm.torus.network/tx/${state.txHash}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-muted-foreground flex items-center gap-1 text-xs underline underline-offset-2"
        >
          View transaction <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="flex flex-col gap-3">
        <div className="text-destructive flex items-start gap-2 text-sm">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{state.error}</span>
        </div>
        <Button variant="outline" size="sm" onClick={reset}>
          Try again
        </Button>
      </div>
    );
  }

  const isBusy = state.status === "signing" || state.status === "pending";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <p className="text-muted-foreground text-sm">
        Enter your torus native to receive{" "}
        <span className="text-foreground font-medium">
          {amountFormatted} TORUS
        </span>{" "}
        on Torus mainnet.
      </p>

      {inputMode === "paste" ? (
        <div className="flex flex-col gap-1.5">
          <div className="relative">
            <Input
              value={ss58}
              onChange={(e) => {
                setSs58(e.target.value);
                if (inputError) setInputError(undefined);
              }}
              placeholder="5xxxxxx… (SS58 address)"
              className="pr-8 font-mono text-xs"
              aria-label="Substrate SS58 destination address"
            />
          </div>

          {ss58.length > 0 && !validateSS58(ss58) && !inputError && (
            <div className="flex items-center gap-1.5 text-xs text-amber-400">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
              <span>Verify your address — withdrawals are irreversible</span>
            </div>
          )}

          {ss58.length > 0 && validateSS58(ss58) && (
            <div className="flex items-center gap-1.5 text-xs text-amber-400">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
              <span>
                Double-check this address — withdrawals are irreversible
              </span>
            </div>
          )}

          {inputError !== undefined && (
            <p className="text-destructive text-xs">{inputError}</p>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-1.5">
          {extensionAccounts.map((acc) => (
            <button
              key={acc.address}
              type="button"
              onClick={() => handleSelectAccount(acc.address)}
              className={`flex items-start gap-2 rounded border px-3 py-2 text-left text-xs transition-colors ${
                ss58 === acc.address
                  ? "border-foreground bg-foreground/5"
                  : "border-border hover:border-foreground/40"
              }`}
            >
              <div className="flex flex-col gap-0.5">
                {acc.name && <span className="font-medium">{acc.name}</span>}
                <span className="text-muted-foreground max-w-[280px] truncate font-mono">
                  {acc.address}
                </span>
              </div>
            </button>
          ))}
          <button
            type="button"
            onClick={() => {
              setInputMode("paste");
              setSs58("");
            }}
            className="text-muted-foreground self-start text-xs underline underline-offset-2"
          >
            Enter address manually instead
          </button>
        </div>
      )}

      <div className="flex flex-col gap-2">
        {inputMode === "paste" && (
          <button
            type="button"
            onClick={() => {
              void handleConnectExtension();
            }}
            className="text-muted-foreground hover:text-foreground flex items-center gap-1.5 self-start text-xs transition-colors"
          >
            <Wallet className="h-3.5 w-3.5" />
            Connect Substrate wallet instead
          </button>
        )}

        <Button
          type="submit"
          disabled={isBusy || !ss58 || !validateSS58(ss58)}
          className="w-full"
        >
          {state.status === "signing" ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Confirm in wallet
            </>
          ) : state.status === "pending" ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Confirming withdrawal…
            </>
          ) : (
            `Withdraw ${amountFormatted} TORUS to native`
          )}
        </Button>
      </div>

      <p className="text-muted-foreground text-xs">
        Wrong address?{" "}
        <a
          href={DISCORD_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-foreground underline underline-offset-2 transition-colors"
        >
          Contact support on Discord
        </a>
        .
      </p>
    </form>
  );
}
