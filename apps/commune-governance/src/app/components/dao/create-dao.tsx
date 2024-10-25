import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { InformationCircleIcon } from "@heroicons/react/20/solid";
import MarkdownPreview from "@uiw/react-markdown-preview";
import { z } from "zod";

import type { TransactionResult } from "@commune-ts/types";
import { useCommune } from "@commune-ts/providers/use-commune";
import { toast } from "@commune-ts/providers/use-toast";
import {
  Button,
  Input,
  Label,
  Separator,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
  TransactionStatus,
} from "@commune-ts/ui";

import { cairo } from "~/utils/fonts";

const daoSchema = z.object({
  applicationKey: z.string().min(1, "Application Key is required"),
  discordId: z.string().min(16, "Discord ID is required"),
  title: z.string().min(1, "Title is required"),
  body: z.string().min(1, "Body is required"),
});

export function CreateDao(): JSX.Element {
  const router = useRouter();
  const { isConnected, addDaoApplication, balance } = useCommune();

  const [applicationKey, setApplicationKey] = useState("");

  const [discordId, setDiscordId] = useState("");
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

  function handleCallback(TransactionReturn: TransactionResult): void {
    setTransactionStatus(TransactionReturn);
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
        toast.error("Error uploading transfer dao treasury proposal");
        return;
      }

      if (!balance) {
        toast.error("Balance is still loading");
        return;
      }

      const daoApplicationCost = 1000;

      if (Number(balance) > daoApplicationCost) {
        void addDaoApplication({
          applicationKey,
          IpfsHash: `ipfs://${ipfs.IpfsHash}`,
          callback: handleCallback,
        });
      } else {
        toast.error(
          `Insufficient balance to create S2 Application. Required: ${daoApplicationCost} but got ${balance}`,
        );
        setTransactionStatus({
          status: "ERROR",
          finalized: true,
          message: "Insufficient balance to create S2 Application",
        });
      }
      router.refresh();
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (e) {
      setUploading(false);
      toast.error("Error uploading S2 Application");
    }
  }

  function HandleSubmit(event: React.FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    setTransactionStatus({
      status: "STARTING",
      finalized: false,
      message: "Starting S2 Application creation...",
    });

    const result = daoSchema.safeParse({
      title,
      body,
      applicationKey,
      discordId,
    });

    if (!result.success) {
      toast.error(result.error.errors.map((e) => e.message).join(", "));
      setTransactionStatus({
        status: "ERROR",
        finalized: true,
        message: "Error creating S2 Application",
      });
      return;
    }

    const daoData = JSON.stringify({
      discord_id: discordId,
      title,
      body,
    });
    const blob = new Blob([daoData], { type: "application/json" });
    const fileToUpload = new File([blob], "dao.json", {
      type: "application/json",
    });
    void uploadFile(fileToUpload);
  }

  return (
    <form
      onSubmit={HandleSubmit}
      className="flex flex-col gap-4 text-green-500"
    >
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="edit">Edit Content</TabsTrigger>
          <TabsTrigger value="preview">Preview Content</TabsTrigger>
        </TabsList>
        <TabsContent value="edit" className="flex flex-col gap-3">
          <Input
            onChange={(e) => setApplicationKey(e.target.value)}
            placeholder="Application Key (ss58)"
            type="text"
            value={applicationKey}
          />
          <Input
            onChange={(e) => setDiscordId(e.target.value)}
            placeholder="Discord ID"
            type="text"
            value={discordId}
          />
          <Separator />
          <Input
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Application title"
            type="text"
            value={title}
          />
          <Textarea
            onChange={(e) => setBody(e.target.value)}
            placeholder="Application body... (Markdown supported) / HTML tags are not supported)"
            rows={5}
            value={body}
          />
        </TabsContent>
        <TabsContent value="preview" className="bg-muted p-4">
          {body ? (
            <MarkdownPreview
              className={`${cairo.className} max-h-[40vh] overflow-auto`}
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
      <Button
        size="xl"
        type="submit"
        variant="default-green"
        disabled={!isConnected}
      >
        {uploading ? "Uploading..." : "Submit S2 Application"}
      </Button>
      {transactionStatus.status && (
        <TransactionStatus
          status={transactionStatus.status}
          message={transactionStatus.message}
        />
      )}
      <div className="flex flex-wrap items-center gap-1 text-sm text-white">
        <InformationCircleIcon className="h-4 w-4 fill-green-500" />
        <Label className="text-sm text-white">
          Please make sure, that your application meets all of the criteria
          defined in this{" "}
          <Link
            className="text-green-500 hover:underline"
            href="https://mirror.xyz/0xD80E194aBe2d8084fAecCFfd72877e63F5822Fc5/FUvj1g9rPyVm8Ii_qLNu-IbRQPiCHkfZDLAmlP00M1Q"
            target="_blank"
          >
            article
          </Link>
          , or you are at risk of getting denied by the Module Curation DAO.
        </Label>
      </div>
    </form>
  );
}
