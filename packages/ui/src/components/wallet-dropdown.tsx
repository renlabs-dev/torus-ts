"use client"

import type { InjectedAccountWithMeta, StakeOutData } from "@torus-ts/types"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Button,
  cn,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  links,
  ScrollArea
} from "@torus-ts/ui"
import { formatToken, smallAddress } from "@torus-ts/utils"
import {
  Copy,
  CreditCard,
  LoaderCircle,
  Lock,
  LockOpen,
  LogOut,
  SquareArrowOutUpRight,
  WalletCards,
} from "lucide-react"
import type { ReactNode } from "react"
import { useMemo } from "react"
import Link from "next/link";

interface WalletFunctionsProps {
  balance: bigint | undefined;
  children: ReactNode;
  handleLogout: () => void;
  selectedAccount: InjectedAccountWithMeta | null;
  stakeOut: StakeOutData | undefined;
}

const WalletFunctions = (props: WalletFunctionsProps) => {
  const {
    balance,
    children,
    handleLogout,
    selectedAccount,
    stakeOut
  } = props;

  const userStakeWeight = useMemo(() => {
    if (stakeOut != null && selectedAccount != null) {
      const userStakeEntry = stakeOut.perAddr[selectedAccount.address];
      return userStakeEntry ?? 0n;
    }
    return 0n;
  }, [stakeOut, selectedAccount]);

  async function copyTextToClipboard(text: string): Promise<void> {
    await navigator.clipboard.writeText(text);
    return;
  }

  return (
    <>
      <DropdownMenuLabel className={cn("flex justify-between")}>
        <div className={cn("flex flex-col gap-1")}>
          <span>{selectedAccount?.meta.name}</span>
          <span className={cn("text-xs text-muted-foreground")}>{smallAddress(selectedAccount?.address ?? "")}</span>
        </div>
        <button className={cn("py-1 rounded-md")} onClick={() => copyTextToClipboard(selectedAccount?.address ?? "")}>
          <Copy className={cn("hover:text-white text-muted-foreground")} size={17} />
        </button>
      </DropdownMenuLabel>
      <DropdownMenuSeparator />
      <DropdownMenuLabel className={cn("flex justify-between w-full")}>
        <span className={cn("flex items-center gap-2")}>
          <LockOpen size={17} />
          Balance
        </span>
        <span className={cn("items-center text-xs text-muted-foreground")}>{formatToken(balance ?? 0n)} TOR</span>
      </DropdownMenuLabel>
      <DropdownMenuLabel className={cn("flex items-center justify-between w-full")}>
        <span className={cn("flex items-center gap-2")}>
          <Lock size={17} />
          Staked
        </span>
        <span className={cn("text-xs text-muted-foreground")}>{formatToken(userStakeWeight)} TOR</span>
      </DropdownMenuLabel>
      <DropdownMenuSeparator />

      {children}

      <DropdownMenuSeparator />
      <DropdownMenuItem className={cn("cursor-pointer")}>
        <Link href={links.wallet} target="_blank" className={cn("flex items-center gap-2")}>
          <SquareArrowOutUpRight size={17} />
          Wallet Actions
        </Link>
      </DropdownMenuItem>
      <DropdownMenuItem className={cn("cursor-pointer")} onClick={handleLogout}>
        <span className={cn("flex items-center gap-2")}>
          <LogOut size={17} />
          Log out
        </span>
      </DropdownMenuItem>
    </>
  )
}

interface WalletDropdownProps {
  accounts: InjectedAccountWithMeta[] | undefined;
  balance: bigint | undefined;
  handleGetWallets: () => Promise<void>;
  handleLogout: () => void;
  handleSelectWallet: (accountAddress: InjectedAccountWithMeta) => void;
  selectedAccount: InjectedAccountWithMeta | null;
  stakeOut: StakeOutData | undefined;
}

export const WalletDropdown = (props: WalletDropdownProps) => {
  const {
    accounts,
    balance,
    handleGetWallets,
    handleLogout,
    handleSelectWallet,
    selectedAccount,
    stakeOut
  } = props;

  const handleGetAccounts = async () => {
    if (accounts?.length === 0) {
      await handleGetWallets()
    }
  }

  const handleWalletSelection = (accountAddress: string) => {
    const accountExists = accounts?.find((account) => account.address === accountAddress);

    if (!accountExists) {
      console.error('Account not found');
      return;
    }

    if (selectedAccount && selectedAccount.address === accountExists.address) {
      console.log('Account already selected');
      return;
    }

    handleSelectWallet(accountExists);
  }

  return (
    <div className={cn('fixed z-[100] top-3 right-8')}>
      <DropdownMenu onOpenChange={handleGetAccounts}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className={cn("px-2 py-1 rounded-md")}>
            <WalletCards />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent className={cn("w-64 mr-8 border border-muted")}>
          {selectedAccount && (
            <WalletFunctions
              balance={balance}
              handleLogout={handleLogout}
              selectedAccount={selectedAccount}
              stakeOut={stakeOut}
            >
              <Accordion type="single" collapsible className={cn("w-full m-0")}>
                <AccordionItem value="switch-wallet" className={cn("border-none")} onClick={handleGetWallets}>
                  <AccordionTrigger className={cn("px-2 py-1.5 rounded-md hover:no-underline hover:bg-accent hover:text-accent-foreground")}>
                    <span className={cn("flex items-center gap-2")}>
                      <CreditCard size={17} />
                      Switch Wallet
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className={cn("pb-0")}>
                    <DropdownMenuSeparator />
                    <ScrollArea className={cn("overflow-y-auto max-h-48")}>
                      <DropdownMenuRadioGroup value={selectedAccount.address} onValueChange={handleWalletSelection}>
                        {accounts?.map((account) => (
                          <DropdownMenuRadioItem
                            key={account.address}
                            value={account.address}
                            disabled={selectedAccount.address === account.address}
                            className={cn(`${selectedAccount.address === account.address && "bg-active"} rounded-md`)}
                          >
                            <div className={cn("flex flex-col items-center gap-2")}>
                              <span className={cn("flex flex-col items-start justify-start gap-1")}>
                                <span>{account.meta.name}</span>
                                <span className={cn("text-xs text-muted-foreground")}>
                                  {smallAddress(account.address)}
                                </span>
                              </span>
                            </div>
                          </DropdownMenuRadioItem>
                        ))}
                      </DropdownMenuRadioGroup>
                    </ScrollArea>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </WalletFunctions>
          )}

          {!selectedAccount?.address && (
            <Accordion type="single" collapsible defaultValue="select-wallet" className={cn("w-full m-0")}>
              <AccordionItem value="select-wallet" className={cn("border-none")} onClick={handleGetWallets}>
                <AccordionTrigger className={cn("px-2 py-1.5 rounded-md hover:no-underline hover:bg-accent hover:text-accent-foreground")}>
                  <span className={cn("flex items-center gap-2")}>
                    <CreditCard size={17} />
                    Select Wallet
                  </span>
                </AccordionTrigger>
                <AccordionContent className={cn("pb-0")}>
                  <DropdownMenuSeparator />
                  <DropdownMenuRadioGroup value={selectedAccount?.address ?? ""} onValueChange={handleWalletSelection}>
                    {!accounts &&
                      <span className={cn("px-1.5 py-2 flex items-center gap-1.5")}>
                        <LoaderCircle className={cn("rotate animate-spin")} />
                        Loading wallets...
                      </span>
                    }
                    {accounts?.map((account) => (
                      <DropdownMenuRadioItem
                        key={account.address}
                        value={account.address}
                      >
                        <div className={cn("flex flex-col items-center gap-2")}>
                          <span className={cn("flex flex-col items-start justify-start gap-1")}>
                            <span>{account.meta.name}</span>
                            <span className={cn("text-xs text-muted-foreground")}>
                              {smallAddress(account.address)}
                            </span>
                          </span>
                        </div>
                      </DropdownMenuRadioItem>
                    ))}
                  </DropdownMenuRadioGroup>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          )}

        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}