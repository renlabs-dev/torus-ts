"use client";

import type { SS58Address } from "@torus-network/sdk/types";
import {
  BASELINE_METADATA_COST,
  calculateScrapingCost,
} from "@torus-network/torus-utils";
import {
  formatToken,
  makeTorAmount,
  toRems,
} from "@torus-network/torus-utils/torus/token";
import { useFreeBalance } from "@torus-ts/query-provider/hooks";
import { useTorus } from "@torus-ts/torus-provider";
import { useSendTransaction } from "@torus-ts/torus-provider/use-send-transaction";
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
import { useDebounce } from "@uidotdev/usehooks";
import { env } from "~/env";
import { api } from "~/trpc/react";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Info,
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
    title: "Select Account",
    description: "Add the account details",
  },
  {
    id: 3,
    title: "Scrape Account",
    description: "Scrape the account for predictions",
  },
  {
    id: 4,
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

  const hasCredits = BigInt(creditsBalance.balance) > 0n;

  return (
    <div className="flex items-center gap-1 rounded-lg py-1">
      {hasCredits && (
        <>
          <div className="flex items-baseline gap-1 text-xs">
            <p className="text-muted-foreground font-medium">APP CREDITS: </p>
            <p className="font-bold">
              {formatToken(BigInt(creditsBalance.balance))} TORUS
            </p>
          </div>
          {torusBalance != null && "|"}
        </>
      )}
      {torusBalance != null && (
        <div className="flex items-baseline gap-1 text-xs">
          <p className="text-muted-foreground font-medium">BALANCE: </p>
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
    username: initialUsername.toLowerCase(),
    txHash: "",
    blockHash: "",
  });
  const [pendingAction, setPendingAction] = useState<
    "none" | "purchase-metadata" | "queue-scraping"
  >("none");
  const debouncedUsername = useDebounce(formData.username, 500);

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
    transactionType: "Prediction Swarm Payment (TORUS)",
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
      { username: debouncedUsername },
      {
        enabled: debouncedUsername.length > 0 && currentStep >= 2,
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
        // Regular balance top-up without pending action - show success
        toast({
          title: "TORUS Added",
          description: `${formatToken(Number(data.creditsGranted))} TORUS added to your balance`,
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
        description: `Review the cost below and confirm`,
      });
      void refetchBalance();
      void refetchUserStatus();
      // Auto-advance to Step 4 to confirm scraping
      handleNext();
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
    if (currentStep < 4) {
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
      // Remove @ symbol if present
      value = value.replace(/^@/, "");
      // Remove spaces and invalid characters (only allow letters, numbers, underscores)
      value = value.replace(/[^a-zA-Z0-9_]/g, "");
      // Limit to 15 characters and convert to lowercase
      value = value.slice(0, 15).toLowerCase();
    }
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Watch for transaction finalization to verify and top up balance
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

      // Top up balance with the verified transaction
      purchaseCredits.mutate({
        txHash,
        blockHash,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFinalized, txHash, txStage]);

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

  // Top up TORUS and immediately purchase metadata
  const handleBuyAndPurchaseMetadata = async () => {
    if (!torusApi || !sendTx) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet first",
        variant: "destructive",
      });
      return;
    }

    // Use fixed 0.069 TORUS for metadata purchase
    const topUpAmount = toRems(makeTorAmount("0.069"));

    const transfer = torusApi.tx.balances.transferKeepAlive(
      env("NEXT_PUBLIC_PREDICTION_APP_ADDRESS"),
      topUpAmount,
    );

    setPendingAction("purchase-metadata");
    await sendTx(transfer);
  };

  // Top up TORUS and immediately queue scraping
  const handleBuyAndQueueScraping = async () => {
    if (!torusApi || !sendTx || !userStatus?.user) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet first",
        variant: "destructive",
      });
      return;
    }

    // Calculate required amount with minimum 0.1 TORUS
    const scrapingCost = calculateScrapingCost(userStatus.user.tweetCount ?? 0);
    const currentBalance = BigInt(balance?.balance ?? "0");
    const required = BigInt(scrapingCost.toFixed(0));
    const shortfall = required - currentBalance;

    if (shortfall <= 0n) {
      // User already has enough, just queue scraping directly
      handleRequestScraping();
      return;
    }

    // Use at least 0.069 TORUS for the transfer
    const minTopUp = toRems(makeTorAmount("0.069"));
    const topUpAmount = shortfall < minTopUp ? minTopUp : shortfall;

    const transfer = torusApi.tx.balances.transferKeepAlive(
      env("NEXT_PUBLIC_PREDICTION_APP_ADDRESS"),
      topUpAmount,
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

  // Update username when initialUsername changes while dialog is open
  useEffect(() => {
    if (isOpen && initialUsername) {
      setFormData((prev) => ({
        ...prev,
        username: initialUsername.toLowerCase(),
      }));
    }
  }, [initialUsername, isOpen]);

  // Handle dialog state change
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open && initialUsername) {
      // When opening with a username, pre-fill it and skip to step 2
      setFormData({
        username: initialUsername.toLowerCase(), // Normalize to lowercase
        txHash: "",
        blockHash: "",
      });
      setCurrentStep(2);
      setPendingAction("none");
    } else if (!open) {
      // Reset form when dialog closes
      setCurrentStep(1);
      setFormData({
        username: "",
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
                process happens in two steps: we check the account and estimate
                how much scraping will cost, then we run the scraping once you
                confirm. You&apos;ll pay in TORUS based on the account&apos;s
                tweet history.
              </CardDescription>
              <div className="mt-2 space-y-1 text-sm">
                <p>
                  • Account metadata check:{" "}
                  <span className="font-semibold">~0.069 TORUS</span>
                </p>
                <p>
                  • Scraping cost:{" "}
                  <span className="font-semibold">
                    ~0.000015 TORUS per 1,000 tweets
                  </span>
                </p>
                <p className="text-muted-foreground pt-1 text-xs">
                  Example: An account with 1,729 tweets costs ~0.026 TORUS to
                  scrape
                </p>
              </div>
              <div className="mt-2 flex items-start justify-start gap-2 text-xs text-amber-500 md:items-center">
                <Info className="w-8 sm:w-3" />
                <p>
                  Warning: Both selecting and scraping accounts may ask for
                  multiple wallet signatures.
                </p>
              </div>
            </CardHeader>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <CardHeader className="px-0 pb-1 pt-0">
              <CardTitle>Select Account</CardTitle>
              <CardDescription>
                Type the 𝕏 username you want to scrape. We&apos;ll check if we
                already have basic information about this account. If we
                don&apos;t, you&apos;ll need to pay ~0.00003 TORUS to load the
                basic info so we can calculate the scraping cost.
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
                  maxLength={15}
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
                            TORUS
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
                        <span className="font-bold">
                          {formatToken(Number(userStatus.metadataCost), 5)}{" "}
                          TORUS
                        </span>
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        );

      case 3:
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
                      TORUS
                    </p>
                  </div>
                </div>
              )}

              {userStatus?.user?.tracked && (
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
              )}
            </div>
          </div>
        );

      case 4:
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
        return true;
      case 2:
        // Can proceed if wallet connected, has metadata, and not already tracked
        return (
          isAccountConnected &&
          ((userStatus?.hasMetadata && !userStatus.user?.tracked) ?? false)
        );
      case 3:
        return false; // Must queue scraping
      case 4:
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
      <DialogContent
        className="bg-background/80 flex items-center justify-center p-4 sm:max-w-3xl"
        onInteractOutside={(e) => {
          e.preventDefault();
        }}
      >
        <DialogTitle className="sr-only">Add Account to Swarm</DialogTitle>
        <Card className="w-full max-w-3xl border-none bg-transparent p-0 shadow-none">
          <CardHeader className="pb-0">
            {/* Step Indicator */}
            <div className="flex items-start justify-between">
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
              {currentStep === 2 ? (
                <Button variant="outline" onClick={handlePrevious}>
                  <ChevronLeft className="h-4 w-4" />
                  <span>Previous</span>
                </Button>
              ) : (
                <div />
              )}

              {currentStep === 4 ? (
                <Button onClick={() => handleOpenChange(false)}>
                  <span>Done</span>
                </Button>
              ) : currentStep === 2 &&
                userStatus &&
                !userStatus.user?.tracked &&
                !userStatus.hasMetadata ? (
                // Step 2: Show metadata purchase button instead of Continue
                hasSufficientBalance(
                  toRems(BASELINE_METADATA_COST).toString(),
                ) ? (
                  <Button
                    onClick={handlePurchaseMetadata}
                    disabled={
                      !isAccountConnected ||
                      !formData.username ||
                      isAnyOperationPending
                    }
                  >
                    {purchaseMetadata.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Purchasing...
                      </>
                    ) : (
                      <>
                        <span>
                          Purchase Metadata (
                          {formatToken(Number(BASELINE_METADATA_COST))} TORUS)
                        </span>
                        <ChevronRight className="h-4 w-4" />
                      </>
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
                    variant="default"
                  >
                    {isTxPending || purchaseCredits.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Buying TORUS...
                      </>
                    ) : purchaseMetadata.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Purchasing...
                      </>
                    ) : (
                      <>
                        <span>Buy account metadata</span>
                        <ChevronRight className="h-4 w-4" />
                      </>
                    )}
                  </Button>
                )
              ) : currentStep === 3 &&
                userStatus?.user &&
                !userStatus.user.tracked ? (
                // Step 3: Show scraping action button instead of Continue
                hasSufficientBalance(
                  calculateScrapingCost(
                    userStatus.user.tweetCount ?? 0,
                  ).toFixed(0),
                ) ? (
                  <Button
                    onClick={handleRequestScraping}
                    disabled={!isAccountConnected || isAnyOperationPending}
                  >
                    {suggestUser.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Queueing...
                      </>
                    ) : (
                      <>
                        <span>
                          Queue for Scraping (
                          {formatToken(
                            Number(
                              calculateScrapingCost(
                                userStatus.user.tweetCount ?? 0,
                              ),
                            ),
                          )}{" "}
                          TORUS)
                        </span>
                        <ChevronRight className="h-4 w-4" />
                      </>
                    )}
                  </Button>
                ) : (
                  <Button
                    onClick={handleBuyAndQueueScraping}
                    disabled={!isAccountConnected || isAnyOperationPending}
                    variant="default"
                  >
                    {isTxPending || purchaseCredits.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Buying TORUS...
                      </>
                    ) : suggestUser.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Queueing...
                      </>
                    ) : (
                      <>
                        <span>Queue for Scraping</span>
                        <ChevronRight className="h-4 w-4" />
                      </>
                    )}
                  </Button>
                )
              ) : currentStep < 4 ? (
                <Button onClick={handleNext} disabled={!canProceedToNextStep()}>
                  <span>Continue</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              ) : null}
            </div>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
}
