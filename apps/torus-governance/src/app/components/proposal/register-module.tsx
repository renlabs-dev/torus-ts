import { useState } from "react";
import { useRouter } from "next/navigation";
import MarkdownPreview from "@uiw/react-markdown-preview";
import { z } from "zod";

import type { TransactionResult } from "@torus-ts/ui/types";
import { useModuleBurn, useSubnetList } from "@torus-ts/providers/hooks";
import { toast } from "@torus-ts/providers/use-toast";
import { useTorus } from "@torus-ts/providers/use-torus";
import {
  Button,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
  TransactionStatus,
} from "@torus-ts/ui";
import { formatToken } from "@torus-ts/utils/subspace";

const moduleSchema = z.object({
  title: z.string().min(1, "Title is required"),
  body: z.string().min(1, "Body is required"),
});

export function RegisterModule(): JSX.Element {
  const router = useRouter();
  const { isConnected, registerModule, balance, api } = useTorus();
  const { data: subnetList, isLoading: isSubnetListLoading } =
    useSubnetList(api);

  const { data: moduleBurn } = useModuleBurn(api);

  const [subnetName, setSubnetName] = useState("");
  const [address, setAddress] = useState("");
  const [name, setName] = useState("");
  const [moduleId, setModuleId] = useState("");

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState("edit");

  const [transactionStatus, setTransactionStatus] = useState<TransactionResult>(
    {
      status: null,
      message: null,
      finalized: false,
    },
  );

  function handleCallback(callbackReturn: TransactionResult): void {
    setTransactionStatus(callbackReturn);
  }

  function getModuleBurn(subnetId: string) {
    if (!moduleBurn) {
      return 0;
    }
    if (Number(subnetId) === 0) {
      return 0;
    }

    return formatToken(Number(moduleBurn[subnetId]));
  }

  async function uploadFile(fileToUpload: File): Promise<void> {
    try {
      setUploading(true);
      const data = new FormData();
      data.set("file", fileToUpload);
      const res = await fetch("/api/files", {
        method: "POST",
        body: data,
      });
      const ipfs = (await res.json()) as { IpfsHash: string };
      setUploading(false);

      if (ipfs.IpfsHash === "undefined" || !ipfs.IpfsHash) {
        toast.error("Error uploading transfer dao treasury moduleCost");
        return;
      }

      if (!balance) {
        toast.error("Balance is still loading");
        return;
      }

      const moduleCost = 2000;

      if (Number(balance) > moduleCost) {
        void registerModule({
          subnetName,
          address,
          name,
          moduleId,
          metadata: `ipfs://${ipfs.IpfsHash}`,
          callback: handleCallback,
        });
      } else {
        toast.error(
          `Insufficient balance to create module. Required: ${moduleCost} but got ${balance}`,
        );
        setTransactionStatus({
          status: "ERROR",
          finalized: true,
          message: "Insufficient balance",
        });
      }
      router.refresh();
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (e) {
      setUploading(false);
      toast.error("Error uploading module");
    }
  }

  function HandleSubmit(event: React.FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    setTransactionStatus({
      status: "STARTING",
      finalized: false,
      message: "Starting module creation...",
    });

    const result = moduleSchema.safeParse({
      title,
      body,
    });

    if (!result.success) {
      toast.error(result.error.errors.map((e) => e.message).join(", "));
      setTransactionStatus({
        status: "ERROR",
        finalized: true,
        message: "Error on form validation",
      });
      return;
    }

    const moduleData = JSON.stringify({
      title,
      body,
    });
    const blob = new Blob([moduleData], { type: "application/json" });
    const fileToUpload = new File([blob], "proposal.json", {
      type: "application/json",
    });
    void uploadFile(fileToUpload);
  }

  return (
    <form onSubmit={HandleSubmit} className="flex flex-col gap-4">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-3">
          <TabsTrigger value="edit">Edit Content</TabsTrigger>
          <TabsTrigger value="preview">Preview Content</TabsTrigger>
        </TabsList>
        <TabsContent value="edit" className="flex flex-col gap-3">
          <Input
            onChange={(e) => setName(e.target.value)}
            placeholder="Module Name (eg. ren-labs)"
            type="text"
            value={name}
          />
          <Input
            onChange={(e) => setModuleId(e.target.value)}
            placeholder="Module ID (SS58 Address)"
            type="text"
            value={moduleId}
          />
          <Select onValueChange={setSubnetName} value={subnetName}>
            <SelectTrigger className="text-white">
              <SelectValue placeholder="Subnet Name (eg. General)" />
            </SelectTrigger>
            <SelectContent>
              {isSubnetListLoading ? (
                <SelectItem value="loading" disabled>
                  Loading...
                </SelectItem>
              ) : subnetList ? (
                Object.entries(subnetList).map(([key, value]) => (
                  <SelectItem key={key} value={value}>
                    {key} | {value} | {getModuleBurn(key)} COMAI (Current Burn)
                  </SelectItem>
                ))
              ) : (
                <SelectItem value="error" disabled>
                  Error loading subnets
                </SelectItem>
              )}
            </SelectContent>
          </Select>
          <Input
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Address (eg. 0.0.0.0:8000)"
            type="text"
            value={address}
          />
          <Separator />
          <Input
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Your Module title here..."
            type="text"
            value={title}
          />
          <Textarea
            onChange={(e) => setBody(e.target.value)}
            placeholder="Your module body here... (Markdown supported / HTML tags are not supported)"
            rows={5}
            value={body}
          />
        </TabsContent>
        <TabsContent value="preview" className="rounded-md bg-muted p-4">
          {body ? (
            <MarkdownPreview
              className="max-h-[40vh] overflow-auto"
              source={`# ${title}\n${body}`}
              style={{
                backgroundColor: "transparent",
                color: "white",
              }}
            />
          ) : (
            <Label className="text-sm text-white">
              Fill the body to preview here :)
            </Label>
          )}
        </TabsContent>
      </Tabs>
      <Button size="xl" type="submit" variant="default" disabled={!isConnected}>
        {uploading ? "Uploading..." : "Submit Module"}
      </Button>

      {transactionStatus.status && (
        <TransactionStatus
          status={transactionStatus.status}
          message={transactionStatus.message}
        />
      )}
    </form>
  );
}
