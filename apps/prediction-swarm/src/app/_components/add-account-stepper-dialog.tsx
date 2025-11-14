"use client";

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
  DialogTrigger,
} from "@torus-ts/ui/components/dialog";
import { Input } from "@torus-ts/ui/components/input";
import { Label } from "@torus-ts/ui/components/label";
import { cn } from "@torus-ts/ui/lib/utils";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  HandCoins,
  UserRoundPlus,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

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

export default function AddAccountStepperDialog() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    accountType: "corporate",
    teamSize: "10-50",
    teamName: "",
    accountPlan: "developer",
    companyName: "",
    industry: "",
    website: "",
    nameOnCard: "Max Doe",
    cardNumber: "4111 1111 1111 1111",
    expirationMonth: "",
    expirationYear: "",
    cvv: "",
    saveCard: true,
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

  const updateFormData = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
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

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Card
                className={cn(
                  "cursor-pointer transition-all",
                  formData.accountType === "personal"
                    ? "bg-muted border-primary ring-primary ring-2"
                    : "border-gray-200 hover:shadow-md",
                )}
                onClick={() => updateFormData("accountType", "personal")}
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
                  formData.accountType === "corporate"
                    ? "bg-muted border-primary ring-primary ring-2"
                    : "border-gray-200 hover:shadow-md",
                )}
                onClick={() => updateFormData("accountType", "corporate")}
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
                      (Recomended) Here you can go straight to the add account
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
                Here you can add funds beforehand if you plan to batch-add
                accounts. This process you burn the selected amount in torus for
                the equivalent amount in tokens.
              </CardDescription>
            </CardHeader>

            <div className="space-y-6">
              <div>
                <Label htmlFor="teamName" className="text-base">
                  Select Torus Wallet
                </Label>
                <Input
                  id="teamName"
                  value={formData.teamName}
                  onChange={(e) => updateFormData("teamName", e.target.value)}
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="cvv" className="text-base font-medium">
                  Type amount <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="cvv"
                  value={formData.cvv}
                  onChange={(e) => updateFormData("cvv", e.target.value)}
                  placeholder="e.g. 500 Torus"
                  className="mt-2"
                />
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <CardHeader className="px-0 pt-0">
              <CardTitle>Select Account</CardTitle>
              <CardDescription>
                Select the account you want to add to the swarm, you will pay a
                fixed fee to add the account, with it you will be able to know
                the price to scrape it.
              </CardDescription>
            </CardHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="teamName" className="text-base">
                  Select Torus Wallet
                </Label>
                <Input
                  id="teamName"
                  value={formData.teamName}
                  onChange={(e) => updateFormData("teamName", e.target.value)}
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="cvv" className="text-base font-medium">
                  Type the account to add{" "}
                  <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="cvv"
                  value={formData.cvv}
                  onChange={(e) => updateFormData("cvv", e.target.value)}
                  placeholder="e.g. @terrydavis"
                  className="mt-2"
                />
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <CardHeader className="px-0 pt-0">
              <CardTitle>Scrape Account</CardTitle>
              <CardDescription>
                Select the account you want to add to the swarm, you will pay
                the scraping cost to scrape it to view its predictions.
              </CardDescription>
            </CardHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="teamName" className="text-base">
                  Select Torus Wallet
                </Label>
                <Input
                  id="teamName"
                  value={formData.teamName}
                  onChange={(e) => updateFormData("teamName", e.target.value)}
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="cvv" className="text-base font-medium">
                  Type the account to add{" "}
                  <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="cvv"
                  value={formData.cvv}
                  onChange={(e) => updateFormData("cvv", e.target.value)}
                  placeholder="e.g. @terrydavis"
                  className="mt-2"
                />
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <CardHeader className="px-0 pt-0">
              <CardTitle>Processing the Prophet</CardTitle>
              <CardDescription>
                You can check the process{" "}
                <Link href="#" className="text-primary hover:underline">
                  here
                </Link>
                .
              </CardDescription>
            </CardHeader>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="bg-background/80 border-border hover:bg-background/40 animate-fade-down animate-delay-500 flex h-8 w-8 items-center justify-center border text-white/80 transition"
        >
          <UserRoundPlus />
        </Button>
      </DialogTrigger>
      <DialogContent className="flex items-center justify-center p-4 sm:max-w-3xl">
        <Card className="w-full max-w-3xl border-none p-0 shadow-lg">
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

              {currentStep < 5 ? (
                <Button onClick={handleNext}>
                  <span>{currentStep === 4 ? "Submit" : "Continue"}</span>
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
