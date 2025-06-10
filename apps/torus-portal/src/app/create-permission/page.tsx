"use client";

import { useState } from "react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@torus-ts/ui/components/tabs";
import PortalNavigationTabs from "../_components/portal-navigation-tabs";
import GrantEmissionPermissionForm from "./_components/grant-emission-permission-form";
import EditPermissionForm from "./_components/edit-permission-form";
import { PermissionSuccessDialog } from "./_components/permission-success-dialog";

export default function Page() {
  const [isSuccessDialogOpen, setIsSuccessDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("create");

  return (
    <main className="min-h-screen overflow-auto bg-background">
      <div className="fixed top-[3.9rem] left-2 right-96 z-10">
        <PortalNavigationTabs />
      </div>
      <div className="pt-24 pb-12">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Grant Emission Permission</h1>
          <p className="text-muted-foreground">
            Create or edit a emission permission to grant allocation and
            distribution rights
          </p>
        </div>
        <div className="max-w-4xl mx-auto p-6 space-y-8">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="create">Create Permission</TabsTrigger>
              <TabsTrigger value="edit">Edit Permission</TabsTrigger>
            </TabsList>

            <TabsContent value="create" className="mt-8">
              <GrantEmissionPermissionForm
                onSuccess={() => setIsSuccessDialogOpen(true)}
              />
            </TabsContent>

            <TabsContent value="edit" className="mt-8">
              <EditPermissionForm
                onSuccess={() => setIsSuccessDialogOpen(true)}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <PermissionSuccessDialog
        isOpen={isSuccessDialogOpen}
        onOpenChange={setIsSuccessDialogOpen}
        onClose={() => setIsSuccessDialogOpen(false)}
      />
    </main>
  );
}
