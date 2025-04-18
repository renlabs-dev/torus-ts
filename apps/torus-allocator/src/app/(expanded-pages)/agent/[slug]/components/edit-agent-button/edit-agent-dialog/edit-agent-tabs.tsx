"use client";

import {
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@torus-ts/ui/components/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@torus-ts/ui/components/tabs";
import { useState } from "react";
import type { useForm } from "react-hook-form";
import type { UpdateAgentMutation } from "./edit-agent-form-schema";
import { EditAgentForm } from "./edit-agent-form";
import { EditAgentPreview } from "./edit-agent-preview";
import type { EditAgentFormData, MetadataType } from "./edit-agent-form-schema";
import { Button } from "@torus-ts/ui/components/button";

interface EditAgentTabsProps {
  agentKey: string;
  metadata: MetadataType;
  icon?: Blob;
  form: ReturnType<typeof useForm<EditAgentFormData>>;
  updateAgentMutation: UpdateAgentMutation;
}

export function EditAgentTabs({
  agentKey,
  metadata,
  icon,
  form,
  updateAgentMutation,
}: EditAgentTabsProps) {
  const [activeTab, setActiveTab] = useState("edit");

  return (
    <>
      <DialogHeader>
        <DialogTitle>Edit Agent</DialogTitle>

        <DialogDescription className="mt-2">
          Edit the agent's information and preview the changes before saving.
        </DialogDescription>
      </DialogHeader>

      <Tabs
        defaultValue="edit"
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="edit">Edit</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
        </TabsList>

        <TabsContent value="edit" className="mt-4">
          <EditAgentForm
            agentKey={agentKey}
            metadata={metadata}
            setActiveTab={setActiveTab}
            form={form}
            updateAgentMutation={updateAgentMutation}
          />
        </TabsContent>

        <TabsContent value="preview" className="mt-4">
          <EditAgentPreview
            agentKey={agentKey}
            setActiveTab={setActiveTab}
            form={form}
            updateAgentMutation={updateAgentMutation}
            metadata={metadata}
            icon={icon}
          />
        </TabsContent>
      </Tabs>

      <DialogFooter className="mt-6 w-full flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => setActiveTab("preview")}
          className="mr-2"
        >
          Preview
        </Button>
        <Button type="submit" disabled={updateAgentMutation.isPending}>
          {updateAgentMutation.isPending ? "Updating..." : "Submit agent edit"}
        </Button>
      </DialogFooter>
    </>
  );
}
