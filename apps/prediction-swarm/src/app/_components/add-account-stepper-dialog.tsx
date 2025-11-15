"use client";

import { calculateScrapingCost } from "@torus-network/torus-utils";
import {
  formatTorusToken,
  fromRems,
  makeTorAmount,
  toRems,
} from "@torus-network/torus-utils/torus/token";
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
import { env } from "~/env";
import { api } from "~/trpc/react";
import {
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

  // API hooks
  const { data: balance, refetch: refetchBalance } =
    api.credits.getBalance.useQuery(undefined, {
      enabled: isAccountConnected,
    });

  const { data: userStatus, refetch: refetchUserStatus } =
    api.twitterUser.checkUserStatus.useQuery(
      { username: formData.username },
      {
        enabled: formData.username.length > 0 && currentStep >= 3,
      },
    );

  const purchaseCredits = api.credits.purchaseCredits.useMutation({
    onSuccess: (data) => {
      toast({
        title: "Credits Purchased",
        description: `Successfully added ${formatTorusToken(makeTorAmount(data.creditsGranted))} credits`,
      });
      void refetchBalance();
      handleNext();
    },
    onError: (error) => {
      toast({
        title: "Purchase Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const purchaseMetadata = api.twitterUser.purchaseMetadata.useMutation({
    onSuccess: (data) => {
      if (data.alreadyExists) {
        toast({
          title: "Metadata Already Exists",
          description: `@${formData.username} is already in the system`,
        });
      } else {
        toast({
          title: "Metadata Purchased",
          description: `Spent ${formatTorusToken(makeTorAmount(data.creditsSpent))} credits`,
        });
      }
      void refetchBalance();
      void refetchUserStatus();
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
    onSuccess: (data) => {
      toast({
        title: "Account Queued for Scraping",
        description: (
          <div>
            <p>
              @{formData.username} has been added to the queue. Spent{" "}
              {formatTorusToken(makeTorAmount(data.creditsSpent))} credits.
            </p>
            <Link
              href="/scraper-queue"
              className="text-primary mt-1 inline-block text-sm underline"
            >
              Track it here →
            </Link>
          </div>
        ),
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
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const updateFormData = (field: string, value: string) => {
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
      txStage.Submitted.event.kind === "Finalized"
    ) {
      // Check if we've already processed this transaction
      if (processedTxRef.current.has(txHash)) {
        return;
      }

      // Mark as processed
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

  // Handle dialog state change
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open && initialUsername) {
      // When opening with a username, pre-fill it and skip to step 3
      setFormData({
        flowType: "add-account",
        username: initialUsername,
        torusAmount: "",
        txHash: "",
        blockHash: "",
      });
      setCurrentStep(3);
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
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <CardHeader className="px-0 pt-0">
              <CardTitle>Add Account to the Swarm</CardTitle>
              <CardDescription>
                Here you can add accounts to be scraped. The process happens in
                two steps: first we add the account and check its scraping cost,
                then we perform the actual scrape. You can also manually add
                funds beforehand if you plan to batch-add accounts. if you need
                more info, please check out our{" "}
                <Link href="#" className="text-primary hover:underline">
                  docs
                </Link>
                .
              </CardDescription>
            </CardHeader>

            {isAccountConnected && balance && (
              <div className="bg-muted rounded-lg p-4">
                <p className="text-sm font-medium">Current Balance</p>
                <p className="text-2xl font-bold">
                  {formatTorusToken(fromRems(BigInt(balance.balance)))} Credits
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Card
                className={cn(
                  "cursor-pointer transition-all",
                  formData.flowType === "add-funds"
                    ? "bg-muted border-primary ring-primary ring-2"
                    : "border-gray-200 hover:shadow-md",
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
                      Here you can add funds beforehand if you plan to batch-add
                      accounts
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card
                className={cn(
                  "cursor-pointer transition-all",
                  formData.flowType === "add-account"
                    ? "bg-muted border-primary ring-primary ring-2"
                    : "border-gray-200 hover:shadow-md",
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
                      (Recommended) Here you can go straight to the add account
                      section
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
            <CardHeader className="px-0 pt-0">
              <CardTitle>Add Funds</CardTitle>
              <CardDescription>
                Purchase credits by transferring TORUS tokens. Credits are
                converted at a 1:1 rate (1 TORUS = 1 Credit). The transaction
                will be verified on-chain before credits are granted.
              </CardDescription>
            </CardHeader>

            <div className="space-y-6">
              {isAccountConnected && balance && (
                <div className="bg-muted rounded-lg p-4">
                  <p className="text-sm font-medium">Current Balance</p>
                  <p className="text-2xl font-bold">
                    {formatTorusToken(fromRems(BigInt(balance.balance)))}{" "}
                    Credits
                  </p>
                </div>
              )}

              <div>
                <Label htmlFor="wallet" className="text-base">
                  Select Torus Wallet
                </Label>
                <div className="mt-2">
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
                  isTxPending ||
                  purchaseCredits.isPending
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
            <CardHeader className="px-0 pt-0">
              <CardTitle>Select Account</CardTitle>
              <CardDescription>
                Enter a Twitter username to check if metadata exists. If not,
                you'll need to purchase metadata (10 credits) to see the
                scraping cost.
              </CardDescription>
            </CardHeader>

            <div className="space-y-6">
              {isAccountConnected && balance && (
                <div className="bg-muted rounded-lg p-4">
                  <p className="text-sm font-medium">Current Balance</p>
                  <p className="text-2xl font-bold">
                    {formatTorusToken(fromRems(BigInt(balance.balance)))}{" "}
                    Credits
                  </p>
                </div>
              )}

              <div>
                <Label htmlFor="wallet" className="text-base">
                  Select Torus Wallet
                </Label>
                <div className="mt-2">
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
                <div className="bg-muted rounded-lg p-4">
                  <p className="text-sm font-medium">Account Status</p>
                  {userStatus.hasMetadata ? (
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
                                ? formatTorusToken(
                                    makeTorAmount(userStatus.scrapingCost),
                                  )
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
                            ? formatTorusToken(
                                makeTorAmount(userStatus.metadataCost),
                              )
                            : "10"
                        }{" "}
                        credits
                      </p>
                    </div>
                  )}
                </div>
              )}

              {userStatus && !userStatus.hasMetadata && (
                <Button
                  onClick={handlePurchaseMetadata}
                  disabled={
                    !isAccountConnected ||
                    !formData.username ||
                    purchaseMetadata.isPending
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
              )}
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <CardHeader className="px-0 pt-0">
              <CardTitle>Scrape Account</CardTitle>
              <CardDescription>
                Queue @{formData.username} for scraping. The cost is calculated
                based on tweet count
                {userStatus?.user &&
                  `: ${formatTorusToken(
                    calculateScrapingCost(userStatus.user.tweetCount ?? 0),
                  )} credits`}
              </CardDescription>
            </CardHeader>

            <div className="space-y-6">
              {isAccountConnected && balance && (
                <div className="bg-muted rounded-lg p-4">
                  <p className="text-sm font-medium">Current Balance</p>
                  <p className="text-2xl font-bold">
                    {formatTorusToken(fromRems(BigInt(balance.balance)))}{" "}
                    Credits
                  </p>
                </div>
              )}

              {userStatus?.user && (
                <div className="bg-muted rounded-lg p-4">
                  <p className="text-sm font-medium">Account Details</p>
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
                      {formatTorusToken(
                        calculateScrapingCost(userStatus.user.tweetCount ?? 0),
                      )}{" "}
                      credits
                    </p>
                  </div>
                </div>
              )}

              <Button
                onClick={handleRequestScraping}
                disabled={
                  !isAccountConnected ||
                  !userStatus?.user ||
                  suggestUser.isPending
                }
                className="w-full"
              >
                {suggestUser.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Queueing Scraping...
                  </>
                ) : (
                  "Queue for Scraping"
                )}
              </Button>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <CardHeader className="px-0 pt-0">
              <CardTitle>Account Queued Successfully!</CardTitle>
              <CardDescription>
                @{formData.username} has been added to the scraping queue.
              </CardDescription>
            </CardHeader>

            <div className="space-y-6">
              {isAccountConnected && balance && (
                <div className="bg-muted rounded-lg p-4">
                  <p className="text-sm font-medium">Remaining Balance</p>
                  <p className="text-2xl font-bold">
                    {formatTorusToken(fromRems(BigInt(balance.balance)))}{" "}
                    Credits
                  </p>
                </div>
              )}

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
        return false; // Must choose a flow option
      case 2:
        return false; // Must complete purchase
      case 3:
        return userStatus?.hasMetadata ?? false;
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
            <div className="mb-6 flex items-center justify-between">
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

              {currentStep < 5 && canProceedToNextStep() && (
                <Button onClick={handleNext}>
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
