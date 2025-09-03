"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { updateAgent } from "@torus-network/sdk/chain";
import { useTorus } from "@torus-ts/torus-provider";
import { useSendTransaction } from "@torus-ts/torus-provider/use-send-transaction";
import { Button } from "@torus-ts/ui/components/button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@torus-ts/ui/components/tabs";
import { useQueryAgentMetadata } from "~/hooks/use-agent-metadata";
import { useBlobUrl } from "~/hooks/use-blob-url";
import { api as trpcApi } from "~/trpc/react";
import {
  ArrowLeft,
  ArrowRight,
  Eye,
  LoaderCircle,
  Pencil,
  Save,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { DeregisterAgentButton } from "./deregister-agent-button";
import { UpdateAgentFormFields } from "./update-agent-form-fields";
import type { UpdateAgentFormData } from "./update-agent-form-schema";
import { updateAgentSchema } from "./update-agent-form-schema";
import { UpdateAgentPreview } from "./update-agent-preview";
import { cidToIpfsUri, uploadMetadata } from "./update-agent-util";

interface UpdateAgentFormProps {
  agentKey: string;
}

export function UpdateAgentForm({ agentKey }: UpdateAgentFormProps) {
  const router = useRouter();
  const { api, selectedAccount, torusApi, wsEndpoint } = useTorus();

  const { sendTx, isPending, isSigning } = useSendTransaction({
    api,
    selectedAccount,
    wsEndpoint,
    wallet: torusApi,
    transactionType: "Update Agent",
  });
  const [isUploading, setIsUploading] = useState(false);
  const [currentImagePreview, setCurrentImagePreview] = useState<string | null>(
    null,
  );
  const [_hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [activeTab, setActiveTab] = useState("edit");

  const { data: agent } = trpcApi.agent.byKeyLastBlock.useQuery(
    { key: agentKey },
    { enabled: !!agentKey, refetchOnWindowFocus: false },
  );

  const { data: agentMetadata } = useQueryAgentMetadata(
    agent?.metadataUri ?? "",
    {
      fetchImages: true,
      enabled: !!agent?.metadataUri,
    },
  );

  const currentImageBlobUrl = useBlobUrl(agentMetadata?.images.icon);

  useEffect(() => {
    if (currentImagePreview && currentImagePreview !== currentImageBlobUrl) {
      URL.revokeObjectURL(currentImagePreview);
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCurrentImagePreview(currentImageBlobUrl);
  }, [currentImageBlobUrl, currentImagePreview]);

  useEffect(() => {
    return () => {
      if (currentImagePreview) {
        URL.revokeObjectURL(currentImagePreview);
      }
    };
  }, [currentImagePreview]);

  const [_originalFormData, setOriginalFormData] =
    useState<UpdateAgentFormData | null>(null);

  const form = useForm<UpdateAgentFormData>({
    resolver: zodResolver(updateAgentSchema),
    mode: "onChange",
    defaultValues: {
      name: "",
      shortDescription: "",
      description: "",
      website: "",
      apiUrl: "",
      imageFile: undefined,
      socials: {
        twitter: "",
        github: "",
        telegram: "",
        discord: "",
      },
    },
  });

  useEffect(() => {
    const subscription = form.watch((_value, { type }) => {
      if (type === "change") {
        setHasUnsavedChanges(true);
      }
    });
    return () => subscription.unsubscribe();
  }, [form]);

  useEffect(() => {
    if (agent && agentMetadata) {
      const originalData = {
        name: agent.name ?? "",
        shortDescription: agentMetadata.metadata.short_description || "",
        description: agentMetadata.metadata.description || "",
        website: agentMetadata.metadata.website ?? "",
        apiUrl: agent.apiUrl ?? "",
        imageFile: undefined,
        socials: {
          twitter: agentMetadata.metadata.socials?.twitter ?? "",
          github: agentMetadata.metadata.socials?.github ?? "",
          telegram: agentMetadata.metadata.socials?.telegram ?? "",
          discord: agentMetadata.metadata.socials?.discord ?? "",
        },
      };

      // eslint-disable-next-line react-hooks/set-state-in-effect
      setOriginalFormData(originalData);
      form.reset(originalData);
      setHasUnsavedChanges(false);
    }
  }, [agent, agentMetadata, form]);

  const handleImageChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        form.setValue("imageFile", file);
        setHasUnsavedChanges(true);
      }
    },
    [form],
  );

  const updateAgentMutation = useMemo(
    () => ({
      isPending: isUploading || isPending || isSigning,
      handleImageChange,
      mutate: async (data: UpdateAgentFormData) => {
        if (!api || !sendTx) {
          return;
        }

        setIsUploading(true);
        const { apiUrl } = data;

        const cid = await uploadMetadata(
          data,
          currentImageBlobUrl ?? undefined,
        );

        const [sendErr, sendRes] = await sendTx(
          updateAgent(api, apiUrl ?? "", cidToIpfsUri(cid), null, null),
        );

        if (sendErr !== undefined) {
          return; // Error already handled by sendTx
        }

        const { tracker } = sendRes;

        tracker.on("finalized", () => {
          setIsUploading(false);
          router.refresh();
          setHasUnsavedChanges(false);
          setActiveTab("edit");
        });
      },
    }),
    [
      isUploading,
      isPending,
      isSigning,
      handleImageChange,
      api,
      sendTx,
      currentImageBlobUrl,
      router,
    ],
  );

  const handleTabChange = async (value: string) => {
    if (value === "preview") {
      const isValid = await form.trigger();

      if (!isValid) {
        goToFormItemMessage();
        return;
      }
    }

    setActiveTab(value);
  };

  const goToFormItemMessage = () =>
    document.querySelector('[id$="-form-item-message"]')?.scrollIntoView({
      behavior: "smooth",
      block: "center",
      inline: "nearest",
    });

  const handleNextClick = async () => {
    const isValid = await form.trigger();

    if (!isValid) {
      goToFormItemMessage();
      return;
    }

    setActiveTab("preview");
  };

  const handleBackClick = () => {
    setActiveTab("edit");
  };

  const handleSubmit = () => {
    void form.handleSubmit((data) => updateAgentMutation.mutate(data))();
  };

  return (
    <>
      <Tabs
        value={activeTab}
        onValueChange={handleTabChange}
        className="w-full"
      >
        <TabsList className="mb-6 grid w-full grid-cols-2">
          <TabsTrigger value="edit" disabled={updateAgentMutation.isPending}>
            <Pencil className="mr-2 h-4 w-4" />
            <span>Edit Details</span>
          </TabsTrigger>
          <TabsTrigger value="preview" disabled={updateAgentMutation.isPending}>
            <Eye className="mr-2 h-4 w-4" />
            <span>Preview</span>
          </TabsTrigger>
        </TabsList>

        <div className="relative">
          <TabsContent value="edit" className="mt-4 space-y-4">
            <div className="bg-muted/20 rounded-md border p-4">
              <UpdateAgentFormFields
                agentKey={agentKey}
                form={form}
                updateAgentMutation={updateAgentMutation}
                currentImagePreview={currentImagePreview}
              />
            </div>

            <div className="mt-6 flex items-center justify-between">
              <DeregisterAgentButton agentName={agent?.name ?? ""} />
              <Button
                type="button"
                variant="outline"
                onClick={handleNextClick}
                disabled={updateAgentMutation.isPending}
                className="flex items-center gap-2"
              >
                Preview <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="preview" className="mt-4">
            <div className="bg-muted/20 rounded-md border p-6">
              <h3 className="mb-4 text-center text-lg font-medium">
                Agent Preview
              </h3>
              <UpdateAgentPreview agentKey={agentKey} form={form} />
              <p className="text-muted-foreground mt-4 text-center text-sm">
                This is how your agent will appear to users.
              </p>
            </div>

            <div className="mt-6 flex justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={handleBackClick}
                disabled={updateAgentMutation.isPending}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" /> Edit Details
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={handleSubmit}
                disabled={updateAgentMutation.isPending}
                className="flex items-center gap-2"
              >
                {updateAgentMutation.isPending ? (
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {updateAgentMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </>
  );
}
