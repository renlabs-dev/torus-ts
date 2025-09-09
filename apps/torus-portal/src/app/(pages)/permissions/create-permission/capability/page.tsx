"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@torus-ts/ui/components/dialog";
import { useRef, useState } from "react";
import { CapabilityTutorialDialog } from "./_components/capability-tutorial-dialog";
import { CreateCapabilityFlowProvider } from "./_components/create-capability-flow/create-capability-flow";
import type {
  CapabilityFlowRef,
  PathWithPermission,
} from "./_components/create-capability-flow/create-capability-flow-types";
import { CreateCapabilityPermissionForm } from "./_components/create-capability-permission-form";

import { createSeoMetadata } from "@torus-ts/ui/components/seo";
import { env } from "~/env";

export const metadata = () =>
  createSeoMetadata({
    title: "Create Capability Permission - Torus Portal",
    description:
      "Create capability-based permissions for agents on the Torus Network. Define specific access rights and operational permissions.",
    keywords: [
      "capability permission",
      "agent capabilities",
      "permission creation",
      "access rights",
      "operational permissions",
    ],
    ogSiteName: "Torus Portal",
    canonical: "/permissions/create-permission/capability",
    baseUrl: env("BASE_URL"),
  });

export default function CapabilityV2Page() {
  const [selectedPaths, setSelectedPaths] = useState<string[]>([]);
  const [pathsWithPermissions, setPathsWithPermissions] = useState<
    PathWithPermission[]
  >([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const flowRef = useRef<CapabilityFlowRef>(null);

  const handleCreatePermission = (paths: PathWithPermission[]) => {
    setSelectedPaths(paths.map((p) => p.path));
    setPathsWithPermissions(paths);
    setIsModalOpen(true);
  };

  const handleFormSuccess = () => {
    setIsModalOpen(false);
    setSelectedPaths([]);
    setPathsWithPermissions([]);
    flowRef.current?.clearSelection();
  };

  return (
    <div className="h-screen w-full">
      <CapabilityTutorialDialog />
      <CreateCapabilityFlowProvider
        ref={flowRef}
        onCreatePermission={handleCreatePermission}
      />

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Capability Permission</DialogTitle>
          </DialogHeader>
          <CreateCapabilityPermissionForm
            selectedPaths={selectedPaths}
            pathsWithPermissions={pathsWithPermissions}
            onSuccess={handleFormSuccess}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
