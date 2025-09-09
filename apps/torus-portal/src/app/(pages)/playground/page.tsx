"use client";

import { useTorus } from "@torus-ts/torus-provider";
import { Button } from "@torus-ts/ui/components/button";
import { Input } from "@torus-ts/ui/components/input";
import { Label } from "@torus-ts/ui/components/label";
import { createSeoMetadata } from "@torus-ts/ui/components/seo";
import { useToast } from "@torus-ts/ui/hooks/use-toast";
import { env } from "~/env";
import { useState } from "react";

export function generateMetadata() {
  return createSeoMetadata({
    title: "Playground - Torus Portal",
    description:
      "Test and experiment with Torus Network transactions. Send remarks and explore blockchain functionality in a safe environment.",
    keywords: [
      "blockchain playground",
      "test transactions",
      "remark transactions",
      "network testing",
      "blockchain experiments",
    ],
    ogSiteName: "Torus Portal",
    canonical: "/playground",
    baseUrl: env("BASE_URL"),
  });
}

export default function PlaygroundPage() {
  const { isAccountConnected } = useTorus();
  const [remarkText, setRemarkText] = useState("");
  const { toast } = useToast();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const text = remarkText.trim();
    if (!text) {
      toast.error("Please enter a remark");
      return;
    }

    // TODO: Implement actual transaction logic
    await Promise.resolve();
    toast.success("Remark submitted (placeholder)");
  }

  return (
    <div className="mx-auto mt-8 max-w-md rounded-lg border p-6">
      <h1 className="mb-6 text-2xl font-bold">Playground</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="remark">Remark Text</Label>
          <Input
            id="remark"
            type="text"
            value={remarkText}
            onChange={(e) => setRemarkText(e.target.value)}
            placeholder="Enter your remark..."
          />
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={!isAccountConnected || !remarkText.trim()}
        >
          Send Remark
        </Button>
      </form>

      {!isAccountConnected && (
        <p className="text-muted-foreground mt-4 text-sm">
          Please connect your wallet to send a remark.
        </p>
      )}
    </div>
  );
}
