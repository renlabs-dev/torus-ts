"use client";

import { Button } from "@torus-ts/ui/components/button";
import {
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@torus-ts/ui/components/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@torus-ts/ui/components/tabs";
import {
  ArrowLeft,
  ArrowRight,
  Eye,
  LoaderCircle,
  Pencil,
  Save,
} from "lucide-react";
import { useState } from "react";
import { UpdateAgentDialogForm } from "./update-agent-dialog-form";
import type {
  UpdateAgentForm,
  UpdateAgentMutation,
} from "./update-agent-dialog-form-schema";
import { UpdateAgentDialogPreview } from "./update-agent-dialog-preview";

interface UpdateAgentDialogTabsProps {
  agentKey: string;
  form: UpdateAgentForm;
  updateAgentMutation: UpdateAgentMutation;
  currentImagePreview?: string | null;
}

export function UpdateAgentDialogTabs({
  agentKey,
  form,
  updateAgentMutation,
  currentImagePreview,
}: UpdateAgentDialogTabsProps) {
  const [activeTab, setActiveTab] = useState("edit");

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
      <DialogHeader>
        <DialogTitle className="text-xl font-bold">
          Update Agent Information
        </DialogTitle>
        <DialogDescription className="mt-2 text-muted-foreground">
          Update your agent's details and see how they will appear to users in
          the preview tab.
        </DialogDescription>
      </DialogHeader>

      <Tabs
        value={activeTab}
        onValueChange={handleTabChange}
        className="mt-6 w-full"
      >
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="edit" disabled={updateAgentMutation.isPending}>
            <Pencil className="h-4 w-4 mr-2" />
            <span>Edit Details</span>
          </TabsTrigger>
          <TabsTrigger value="preview" disabled={updateAgentMutation.isPending}>
            <Eye className="h-4 w-4 mr-2" />
            <span>Preview</span>
          </TabsTrigger>
        </TabsList>

        <div className="relative">
          <TabsContent value="edit" className="mt-4 space-y-4">
            <div className="rounded-md border bg-muted/20 p-4">
              <UpdateAgentDialogForm
                agentKey={agentKey}
                setActiveTab={setActiveTab}
                form={form}
                updateAgentMutation={updateAgentMutation}
                currentImagePreview={currentImagePreview}
              />
            </div>

            <div className="flex justify-end space-x-2 mt-6">
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
            <div className="rounded-md border bg-muted/20 p-6">
              <h3 className="text-lg font-medium mb-4 text-center">
                Agent Preview
              </h3>
              <UpdateAgentDialogPreview agentKey={agentKey} form={form} />
              <p className="text-sm text-muted-foreground text-center mt-4">
                This is how your agent will appear to users.
              </p>
            </div>

            <div className="flex justify-between mt-6">
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
