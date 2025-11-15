"use client";

import type { SS58Address } from "@torus-network/sdk/types";
import { calculateScrapingCost } from "@torus-network/torus-utils";
import {
  formatToken,
  makeTorAmount,
  toRems,
} from "@torus-network/torus-utils/torus/token";
import { useFreeBalance } from "@torus-ts/query-provider/hooks";
import { useTorus } from "@torus-ts/torus-provider";
import { useSendTransaction } from "@torus-ts/torus-provider/use-send-transaction";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@torus-ts/ui/components/alert";
import { Button } from "@torus-ts/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@torus-ts/ui/components/card";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@torus-ts/ui/components/dialog";
import { Input } from "@torus-ts/ui/components/input";
import { Label } from "@torus-ts/ui/components/label";
import { useToast } from "@torus-ts/ui/hooks/use-toast";
import { cn } from "@torus-ts/ui/lib/utils";
import { env } from "~/env";
import { api } from "~/trpc/react";
import {
  AlertCircleIcon,
  Check,
  ChevronLeft,
  ChevronRight,
  HandCoins,
  Loader2,
  UserRoundPlus,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { WalletDropdown } from "./wallet-dropdown";

const steps = [
  {
    id: 1,
    title: "Intro",
    description: "Add accounts to the swarm",
  },
  {
    id: 2,
    title: "Add Funds",
    description: "",
  },
  {
    id: 3,
    title: "Select Account",
    description: "Add the account details",
  },
  {
    id: 4,
    title: "Scrape Account",
    description: "Scrape the account for predictions",
  },
  {
    id: 5,
    title: "Completed",
    description: "Account added to the swarm",
  },
];

function BalanceDisplay({
  creditsBalance,
  torusBalance,
  isConnected,
}: {
  creditsBalance: { balance: string } | undefined;
  torusBalance: bigint | null | undefined;
  isConnected: boolean;
}) {
  if (!isConnected || !creditsBalance) {
    return null;
  }

  return (
    <div className="flex items-center gap-1 rounded-lg py-1">
      <div className="flex items-baseline gap-1 text-xs">
        <p className="text-muted-foreground font-medium">Credit Balance: </p>
        <p className="font-bold">
          {formatToken(BigInt(creditsBalance.balance))} Credits
        </p>
      </div>
      |
      {torusBalance != null && (
        <div className="flex items-baseline gap-1 text-xs">
          <p className="text-muted-foreground font-medium">Torus Balance: </p>
          <p className="font-bold">{formatToken(torusBalance)} TORUS</p>
        </div>
      )}
    </div>
  );
}

interface AddAccountStepperDialogProps {
  /** Control dialog open state externally (optional) */
  open?: boolean;
  /** Control dialog open state changes externally (optional) */
  onOpenChange?: (open: boolean) => void;
  /** Pre-fill username (optional) */
  initialUsername?: string;
  /** Show trigger button (default: true) */
  showTrigger?: boolean;
}

export default function AddAccountStepperDialog({
  open: externalOpen,
  onOpenChange: externalOnOpenChange,
  initialUsername = "",
  showTrigger = true,
}: AddAccountStepperDialogProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [internalOpen, setInternalOpen] = useState(false);
  const [formData, setFormData] = useState({
    flowType: "add-account" as "add-funds" | "add-account",
    username: initialUsername,
    torusAmount: "",
    txHash: "",
    blockHash: "",
  });
  const [pendingAction, setPendingAction] = useState<
    "none" | "purchase-metadata" | "queue-scraping"
  >("none");

  // Use external or internal open state
  const isOpen = externalOpen ?? internalOpen;
  const setIsOpen = externalOnOpenChange ?? setInternalOpen;

  // Track processed transactions to prevent duplicate calls
  const processedTxRef = useRef<Set<string>>(new Set());

  const { toast } = useToast();
  const {
    api: torusApi,
    torusApi: torusWalletApi,
    selectedAccount,
    isAccountConnected,
    wsEndpoint,
  } = useTorus();

  const {
    sendTx,
    isPending: isTxPending,
    isFinalized,
    txHash,
    txStage,
  } = useSendTransaction({
    api: torusApi,
    selectedAccount,
    wsEndpoint,
    wallet: torusWalletApi,
    transactionType: "Purchase Credits",
  });

  const accountFreeBalance = useFreeBalance(
    torusApi,
    selectedAccount?.address as SS58Address,
  );

  // API hooks
  const { data: balance, refetch: refetchBalance } =
    api.credits.getBalance.useQuery(
      { userKey: selectedAccount?.address },
      {
        enabled: isAccountConnected && !!selectedAccount,
      },
    );

  const { data: userStatus, refetch: refetchUserStatus } =
    api.twitterUser.checkUserStatus.useQuery(
      { username: formData.username },
      {
        enabled: formData.username.length > 0 && currentStep >= 3,
      },
    );

  const purchaseCredits = api.credits.purchaseCredits.useMutation({
    onSuccess: async (data) => {
      // Wait for balance to update
      await refetchBalance();

      // Execute pending action after balance is updated
      const action = pendingAction;
      setPendingAction("none");

      if (action === "purchase-metadata") {
        purchaseMetadata.mutate({ username: formData.username });
      } else if (action === "queue-scraping" && userStatus?.user) {
        const scrapingCost = calculateScrapingCost(
          userStatus.user.tweetCount ?? 0,
        );
        suggestUser.mutate({
          username: formData.username,
          budget: BigInt(scrapingCost.toFixed(0)),
        });
      } else if (action === "none") {
        // Regular credit purchase without pending action - show success
        toast({
          title: "Credits Added",
          description: `${formatToken(Number(data.creditsGranted))} credits added to your balance`,
        });
        handleNext();
      }
    },
    onError: (error) => {
      setPendingAction("none");
      toast({
        title: "Purchase Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const purchaseMetadata = api.twitterUser.purchaseMetadata.useMutation({
    onSuccess: () => {
      toast({
        title: "Ready to Scrape",
        description: `Review the cost below and continue when ready`,
      });
      void refetchBalance();
      void refetchUserStatus();
      // Don't auto-advance - let user see the cost and manually proceed
    },
    onError: (error) => {
      toast({
        title: "Metadata Purchase Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const suggestUser = api.twitterUser.suggestUser.useMutation({
    onSuccess: () => {
      toast({
        title: "Account Queued",
        description: `@${formData.username} is now being scraped`,
      });
      void refetchBalance();
      handleNext();
    },
    onError: (error) => {
      toast({
        title: "Failed to Queue Scraping",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleNext = () => {
    if (currentStep === 1) {
      // From intro, navigate based on selected flow
      setCurrentStep(formData.flowType === "add-funds" ? 2 : 3);
    } else if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const updateFormData = (field: string, value: string) => {
    // Normalize username to lowercase (Twitter is case-insensitive)
    if (field === "username") {
      value = value.toLowerCase();
    }
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Handle Step 1 flow selection
  const handleFlowSelection = (flowType: "add-funds" | "add-account") => {
    updateFormData("flowType", flowType);
    if (flowType === "add-funds") {
      setCurrentStep(2);
    } else {
      setCurrentStep(3);
    }
  };

  // Handle credit purchase with TORUS transfer
  const handlePurchaseCredits = async () => {
    if (!torusApi || !sendTx) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet first",
        variant: "destructive",
      });
      return;
    }

    const amount = parseFloat(formData.torusAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid TORUS amount",
        variant: "destructive",
      });
      return;
    }

    // Convert TORUS to rems (18 decimals)
    const amountInRems = toRems(makeTorAmount(formData.torusAmount));

    // Create transfer transaction
    const transfer = torusApi.tx.balances.transferKeepAlive(
      env("NEXT_PUBLIC_PREDICTION_APP_ADDRESS"),
      amountInRems,
    );

    // Send transaction (hook handles signing, status updates, and toasts)
    await sendTx(transfer);
  };

  // Watch for transaction finalization to verify and grant credits
  useEffect(() => {
    if (
      isFinalized &&
      txHash &&
      "Submitted" in txStage &&
      txStage.Submitted.event.kind === "Finalized" &&
      !purchaseCredits.isPending // Don't trigger if already processing
    ) {
      // Check if we've already processed this transaction
      if (processedTxRef.current.has(txHash)) {
        return;
      }

      // Mark as processed immediately to prevent race conditions
      processedTxRef.current.add(txHash);

      const blockHash = txStage.Submitted.event.blockHash;

      // Purchase credits with the verified transaction
      purchaseCredits.mutate({
        txHash,
        blockHash,
      });
    }
  }, [isFinalized, txHash, txStage, purchaseCredits]);

  // Handle metadata purchase
  const handlePurchaseMetadata = () => {
    if (!formData.username) {
      toast({
        title: "Username Required",
        description: "Please enter a Twitter username",
        variant: "destructive",
      });
      return;
    }

    purchaseMetadata.mutate({ username: formData.username });
  };

  // Handle scraping request
  const handleRequestScraping = () => {
    if (!userStatus?.user) {
      toast({
        title: "Metadata Required",
        description: "Please purchase metadata first",
        variant: "destructive",
      });
      return;
    }

    const scrapingCost = calculateScrapingCost(userStatus.user.tweetCount ?? 0);
    // scrapingCost is already a TorAmount in rems, extract as bigint
    suggestUser.mutate({
      username: formData.username,
      budget: BigInt(scrapingCost.toFixed(0)),
    });
  };

  // Buy credits and immediately purchase metadata
  const handleBuyAndPurchaseMetadata = async () => {
    if (!torusApi || !sendTx) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet first",
        variant: "destructive",
      });
      return;
    }

    // Calculate shortfall: need 10 credits, buy only the difference
    const currentBalance = BigInt(balance?.balance ?? "0");
    const required = toRems(makeTorAmount(10));
    const shortfall = required - currentBalance;

    if (shortfall <= 0n) {
      // User already has enough, just purchase metadata directly
      handlePurchaseMetadata();
      return;
    }

    const transfer = torusApi.tx.balances.transferKeepAlive(
      env("NEXT_PUBLIC_PREDICTION_APP_ADDRESS"),
      shortfall,
    );

    setPendingAction("purchase-metadata");
    await sendTx(transfer);
  };

  // Buy credits and immediately queue scraping
  const handleBuyAndQueueScraping = async () => {
    if (!torusApi || !sendTx || !userStatus?.user) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet first",
        variant: "destructive",
      });
      return;
    }

    // Calculate shortfall: only buy the difference between current and required
    const scrapingCost = calculateScrapingCost(userStatus.user.tweetCount ?? 0);
    const currentBalance = BigInt(balance?.balance ?? "0");
    const required = BigInt(scrapingCost.toFixed(0));
    const shortfall = required - currentBalance;

    if (shortfall <= 0n) {
      // User already has enough, just queue scraping directly
      handleRequestScraping();
      return;
    }

    const transfer = torusApi.tx.balances.transferKeepAlive(
      env("NEXT_PUBLIC_PREDICTION_APP_ADDRESS"),
      shortfall,
    );

    setPendingAction("queue-scraping");
    await sendTx(transfer);
  };

  // Check if any operation is in progress (locks all buttons)
  const isAnyOperationPending =
    (isTxPending && !isFinalized) ||
    purchaseCredits.isPending ||
    purchaseMetadata.isPending ||
    suggestUser.isPending ||
    pendingAction !== "none"; // Keep locked if we have a pending action to execute

  // Check if user has sufficient balance for an operation
  const hasSufficientBalance = (requiredAmount: string) => {
    if (!balance) return false;
    return BigInt(balance.balance) >= BigInt(requiredAmount);
  };

  // Calculate shortfall for metadata (10 credits)
  const getMetadataShortfall = () => {
    const currentBalance = BigInt(balance?.balance ?? "0");
    const required = toRems(makeTorAmount(10));
    const shortfall = required - currentBalance;
    return shortfall > 0n ? shortfall : 0n;
  };

  // Calculate shortfall for scraping
  const getScrapingShortfall = () => {
    if (!userStatus?.user) return 0n;
    const currentBalance = BigInt(balance?.balance ?? "0");
    const scrapingCost = calculateScrapingCost(userStatus.user.tweetCount ?? 0);
    const required = BigInt(scrapingCost.toFixed(0));
    const shortfall = required - currentBalance;
    return shortfall > 0n ? shortfall : 0n;
  };

  // Handle dialog state change
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open && initialUsername) {
      // When opening with a username, pre-fill it and skip to step 3
      setFormData({
        flowType: "add-account",
        username: initialUsername.toLowerCase(), // Normalize to lowercase
        torusAmount: "",
        txHash: "",
        blockHash: "",
      });
      setCurrentStep(3);
      setPendingAction("none");
    } else if (!open) {
      // Reset form when dialog closes
      setCurrentStep(1);
      setFormData({
        flowType: "add-account",
        username: "",
        torusAmount: "",
        txHash: "",
        blockHash: "",
      });
      // Clear processed transactions
      processedTxRef.current.clear();
      setPendingAction("none");
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <CardHeader className="px-0 pb-2 pt-0">
              <CardTitle>Add Account to the Swarm</CardTitle>
              <CardDescription>
                Here you can add an 𝕏 account for the system to scrape. The
                process happens in two steps: We check the account and estimate
                how much scraping will cost We run the scraping once you
                confirm. You can also add credits first if you plan to scrape
                several accounts.
              </CardDescription>
              <div className="mt-2 space-y-1 text-sm">
                <p>
                  • Account metadata check:{" "}
                  <span className="font-semibold">10 credits</span>
                </p>
                <p>
                  • Scraping cost:{" "}
                  <span className="font-semibold">
                    ~60 credits per 1,000 tweets
                  </span>
                </p>
              </div>
            </CardHeader>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Card
                className={cn(
                  "cursor-pointer transition-all",
                  formData.flowType === "add-funds"
                    ? "bg-muted border-primary ring-primary ring-2"
                    : "hover:shadow-md",
                )}
                onClick={() => handleFlowSelection("add-funds")}
              >
                <CardContent className="flex items-start space-x-4 p-6">
                  <div className="flex-shrink-0">
                    <div className="bg-primary/10 flex h-12 w-12 items-center justify-center rounded-lg">
                      <HandCoins className="text-primary h-6 w-6" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-muted-foreground mb-1 font-semibold">
                      Add funds
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      Add credits to your balance before adding accounts.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card
                className={cn(
                  "cursor-pointer transition-all",
                  formData.flowType === "add-account"
                    ? "bg-muted border-primary ring-primary ring-2"
                    : "hover:shadow-md",
                )}
                onClick={() => handleFlowSelection("add-account")}
              >
                <CardContent className="flex items-start space-x-4 p-6">
                  <div className="flex-shrink-0">
                    <div className="bg-primary/10 flex h-12 w-12 items-center justify-center rounded-lg">
                      <UserRoundPlus className="text-primary h-6 w-6" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-muted-foreground mb-1 font-semibold">
                      Add account
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      (Recommended) Go straight to adding an 𝕏 account.
                      We&apos;ll estimate the cost for you.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <CardHeader className="px-0 pb-2 pt-0">
              <CardTitle>Add Funds</CardTitle>
              <CardDescription>
                Buy credits by sending TORUS tokens. You get 1 credit for every
                1 TORUS you send. Your transaction is confirmed on-chain before
                the credits appear.
              </CardDescription>
              <BalanceDisplay
                creditsBalance={balance}
                torusBalance={accountFreeBalance.data}
                isConnected={isAccountConnected}
              />
              <Alert variant="destructive">
                <AlertCircleIcon className="h-4 w-4" />
                <AlertTitle>Warning</AlertTitle>
                <AlertDescription>
                  <p>
                    Buying credits is irreversible. You will not be able to
                    convert your credits back to TORUS.
                  </p>
                </AlertDescription>
              </Alert>
            </CardHeader>

            <div className="space-y-6">
              <div>
                <Label htmlFor="wallet" className="text-base">
                  Select Torus Wallet <span className="text-red-500">*</span>
                </Label>
                <div className="border-border mt-2 border">
                  <WalletDropdown
                    variant="default"
                    torusCacheUrl={env("NEXT_PUBLIC_TORUS_CACHE_URL")}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="torusAmount" className="text-base font-medium">
                  Amount in TORUS <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="torusAmount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.torusAmount}
                  onChange={(e) =>
                    updateFormData("torusAmount", e.target.value)
                  }
                  placeholder="e.g. 500"
                  className="mt-2"
                  disabled={purchaseCredits.isPending}
                />
                <p className="text-muted-foreground mt-1 text-sm">
                  You will receive {formData.torusAmount || "0"} credits (1:1
                  rate)
                </p>
              </div>

              <Button
                onClick={handlePurchaseCredits}
                disabled={
                  !isAccountConnected ||
                  !formData.torusAmount ||
                  isAnyOperationPending
                }
                className="w-full"
              >
                {isTxPending || purchaseCredits.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isTxPending ? "Signing..." : "Processing..."}
                  </>
                ) : (
                  "Purchase Credits"
                )}
              </Button>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <CardHeader className="px-0 pb-1 pt-0">
              <CardTitle>Select Account</CardTitle>
              <CardDescription>
                Type the 𝕏 username you want to scrape. We&apos;ll check if we
                already have basic information about this account. If we
                don&apos;t, you&apos;ll need to pay 10 credits to load the basic
                info so we can calculate the scraping cost.
              </CardDescription>
              <BalanceDisplay
                creditsBalance={balance}
                torusBalance={accountFreeBalance.data}
                isConnected={isAccountConnected}
              />
            </CardHeader>

            <div className="space-y-6">
              <div>
                <Label htmlFor="wallet" className="text-base">
                  Select Torus Wallet <span className="text-red-500">*</span>
                </Label>
                <div className="border-border mt-2 border">
                  <WalletDropdown
                    variant="default"
                    torusCacheUrl={env("NEXT_PUBLIC_TORUS_CACHE_URL")}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="username" className="text-base font-medium">
                  Twitter Username <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="username"
                  value={formData.username}
                  onChange={(e) => updateFormData("username", e.target.value)}
                  placeholder="e.g. elonmusk or @elonmusk"
                  className="mt-2"
                  disabled={purchaseMetadata.isPending}
                />
              </div>

              {userStatus && (
                <div className="bg-muted/70 plus-corners relative rounded-lg border p-4">
                  <p className="text-sm font-bold">Account Status</p>
                  {userStatus.user?.tracked ? (
                    <div className="mt-2 space-y-1">
                      <p className="text-sm text-green-600">
                        ✓ Already tracked in the swarm
                      </p>
                      <p className="text-muted-foreground text-sm">
                        This account is already being scraped. You can view
                        predictions at{" "}
                        <Link
                          href={`/user/${formData.username}`}
                          className="text-primary hover:underline"
                        >
                          /user/{formData.username}
                        </Link>
                      </p>
                    </div>
                  ) : userStatus.hasMetadata ? (
                    <div className="mt-2 space-y-1">
                      <p className="text-sm text-green-600">
                        ✓ Metadata exists
                      </p>
                      {userStatus.user && (
                        <>
                          <p className="text-sm">
                            Followers:{" "}
                            {userStatus.user.followerCount?.toLocaleString()}
                          </p>
                          <p className="text-sm">
                            Tweets:{" "}
                            {userStatus.user.tweetCount?.toLocaleString()}
                          </p>
                          <p className="text-sm font-semibold">
                            Scraping Cost:{" "}
                            {
                              // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                              userStatus.scrapingCost != null
                                ? formatToken(Number(userStatus.scrapingCost))
                                : "0"
                            }{" "}
                            credits
                          </p>
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="mt-2 space-y-1">
                      <p className="text-sm text-yellow-600">
                        ⚠ Metadata not found
                      </p>
                      <p className="text-sm">
                        Cost to fetch metadata:{" "}
                        {
                          // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                          userStatus.metadataCost != null
                            ? formatToken(Number(userStatus.metadataCost))
                            : "10"
                        }{" "}
                        credits
                      </p>
                    </div>
                  )}
                </div>
              )}

              {userStatus &&
                !userStatus.user?.tracked &&
                !userStatus.hasMetadata && (
                  <>
                    {hasSufficientBalance(
                      toRems(makeTorAmount(10)).toString(),
                    ) ? (
                      <Button
                        onClick={handlePurchaseMetadata}
                        disabled={
                          !isAccountConnected ||
                          !formData.username ||
                          isAnyOperationPending
                        }
                        className="w-full"
                      >
                        {purchaseMetadata.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Purchasing Metadata...
                          </>
                        ) : (
                          "Purchase Metadata (10 credits)"
                        )}
                      </Button>
                    ) : (
                      <Button
                        onClick={handleBuyAndPurchaseMetadata}
                        disabled={
                          !isAccountConnected ||
                          !formData.username ||
                          isAnyOperationPending
                        }
                        className="w-full"
                        variant="default"
                      >
                        {isTxPending || purchaseCredits.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Buying Credits...
                          </>
                        ) : purchaseMetadata.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Purchasing Metadata...
                          </>
                        ) : (
                          `Buy ${formatToken(getMetadataShortfall())} Credits & Purchase Metadata`
                        )}
                      </Button>
                    )}
                  </>
                )}
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <CardHeader className="px-0 pb-1 pt-0">
              <CardTitle>Scrape Account</CardTitle>
              <CardDescription>
                Here you can review the scraping cost before confirming to queue
                @{formData.username} for scraping.
              </CardDescription>
              <BalanceDisplay
                creditsBalance={balance}
                torusBalance={accountFreeBalance.data}
                isConnected={isAccountConnected}
              />
            </CardHeader>

            <div className="space-y-6">
              {userStatus?.user && (
                <div className="bg-muted/80 plus-corners relative rounded-lg border p-4">
                  <p className="text-sm font-bold">Account Details</p>
                  <div className="mt-2 space-y-1">
                    <p className="text-sm">Username: @{formData.username}</p>
                    <p className="text-sm">
                      Screen Name: {userStatus.user.screenName}
                    </p>
                    <p className="text-sm">
                      Followers:{" "}
                      {userStatus.user.followerCount?.toLocaleString()}
                    </p>
                    <p className="text-sm">
                      Tweets: {userStatus.user.tweetCount?.toLocaleString()}
                    </p>
                    <p className="text-sm font-semibold">
                      Scraping Cost:{" "}
                      {formatToken(
                        Number(
                          calculateScrapingCost(
                            userStatus.user.tweetCount ?? 0,
                          ),
                        ),
                      )}{" "}
                      credits
                    </p>
                  </div>
                </div>
              )}

              {userStatus?.user &&
                (userStatus.user.tracked ? (
                  <div className="bg-muted rounded-lg p-4">
                    <p className="text-sm text-green-600">
                      ✓ This account is already tracked in the swarm
                    </p>
                    <p className="text-muted-foreground mt-2 text-sm">
                      You can view predictions at{" "}
                      <Link
                        href={`/user/${formData.username}`}
                        className="text-primary hover:underline"
                      >
                        /user/{formData.username}
                      </Link>
                    </p>
                  </div>
                ) : hasSufficientBalance(
                    calculateScrapingCost(
                      userStatus.user.tweetCount ?? 0,
                    ).toFixed(0),
                  ) ? (
                  <Button
                    onClick={handleRequestScraping}
                    disabled={!isAccountConnected || isAnyOperationPending}
                    className="w-full"
                  >
                    {suggestUser.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Queueing Scraping...
                      </>
                    ) : (
                      `Queue for Scraping (${formatToken(
                        Number(
                          calculateScrapingCost(
                            userStatus.user.tweetCount ?? 0,
                          ),
                        ),
                      )} credits)`
                    )}
                  </Button>
                ) : (
                  <Button
                    onClick={handleBuyAndQueueScraping}
                    disabled={!isAccountConnected || isAnyOperationPending}
                    className="w-full"
                    variant="default"
                  >
                    {isTxPending || purchaseCredits.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Buying Credits...
                      </>
                    ) : suggestUser.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Queueing Scraping...
                      </>
                    ) : (
                      `Buy ${formatToken(getScrapingShortfall())} Credits & Queue Scraping`
                    )}
                  </Button>
                ))}
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <CardHeader className="px-0 pb-2 pt-0">
              <CardTitle>Account Queued Successfully!</CardTitle>
              <CardDescription>
                @{formData.username} has been added to the scraping queue.
              </CardDescription>
            </CardHeader>

            <div className="space-y-6">
              <div className="bg-muted rounded-lg p-4">
                <p className="text-sm font-medium">Next Steps</p>
                <div className="mt-2 space-y-2">
                  <p className="text-sm">✓ Account metadata purchased</p>
                  <p className="text-sm">
                    ✓ Scraping queued for @{formData.username}
                  </p>
                  <p className="text-sm">
                    You can track the scraping progress{" "}
                    <Link
                      href="/scraper-queue"
                      className="text-primary hover:underline"
                    >
                      here
                    </Link>
                    .
                  </p>
                </div>
              </div>

              <Button
                onClick={() => {
                  handleOpenChange(false);
                }}
                className="w-full"
              >
                Done
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const canProceedToNextStep = () => {
    switch (currentStep) {
      case 1:
        return true; // Can proceed (add-account is pre-selected)
      case 2:
        return true; // Can skip adding funds (later steps have buy+spend options)
      case 3:
        // Can proceed if wallet connected, has metadata, and not already tracked
        return (
          isAccountConnected &&
          ((userStatus?.hasMetadata && !userStatus.user?.tracked) ?? false)
        );
      case 4:
        return false; // Must queue scraping
      case 5:
        return true;
      default:
        return false;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      {showTrigger && (
        <DialogTrigger asChild>
          <Button
            variant="outline"
            className="bg-background/80 border-border hover:bg-background/40 animate-fade-down animate-delay-500 flex h-8 w-8 items-center justify-center border text-white/80 transition"
          >
            <UserRoundPlus />
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="bg-background/80 flex items-center justify-center p-4 sm:max-w-3xl">
        <DialogTitle className="sr-only">Add Account to Swarm</DialogTitle>
        <Card className="w-full max-w-3xl border-none bg-transparent p-0 shadow-none">
          <CardHeader className="pb-0">
            {/* Step Indicator */}
            <div className="flex items-center justify-between">
              {steps.map((step) => (
                <div
                  key={step.id}
                  className="relative flex flex-1 flex-col items-center"
                >
                  <div
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold transition-colors duration-300",
                      currentStep > step.id
                        ? "bg-primary text-white"
                        : currentStep === step.id
                          ? "bg-primary text-white"
                          : "bg-gray-200 text-gray-600",
                    )}
                  >
                    {currentStep > step.id ? (
                      <Check className="h-5 w-5" />
                    ) : (
                      step.id
                    )}
                  </div>
                  <div
                    className={cn(
                      "mt-2 text-center text-sm font-medium",
                      currentStep >= step.id
                        ? "text-gray-600"
                        : "text-gray-400",
                    )}
                  >
                    {step.title}
                  </div>
                  {step.id < steps.length && (
                    <div
                      className={cn(
                        "absolute left-[calc(50%+20px)] top-5 h-0.5 w-[calc(100%-40px)] -translate-y-1/2 bg-gray-200 transition-colors duration-300",
                        currentStep > step.id && "bg-primary",
                      )}
                    />
                  )}
                </div>
              ))}
            </div>
          </CardHeader>

          <CardContent className="p-6 md:p-8">
            {renderStepContent()}

            {/* Navigation */}
            <div className="mt-8 flex items-center justify-between border-t pt-6">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentStep === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                <span>Previous</span>
              </Button>

              {currentStep < 5 && (
                <Button
                  onClick={handleNext}
                  disabled={!canProceedToNextStep()}
                >
                  <span>Continue</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
}
