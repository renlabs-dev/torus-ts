"use client";

import { useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@torus-ts/ui/components/dialog";

import { CreateCapabilityFlowProvider } from "./_components/create-capability-flow/create-capability-flow";
import type { PathWithPermission } from "./_components/create-capability-flow/create-capability-flow-types";
import { CreateCapabilityPermissionForm } from "./_components/create-capability-permission-form";

export default function CapabilityV2Page() {
  const [selectedPaths, setSelectedPaths] = useState<string[]>([]);
  const [pathsWithPermissions, setPathsWithPermissions] = useState<
    PathWithPermission[]
  >([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleCreatePermission = (paths: PathWithPermission[]) => {
    setSelectedPaths(paths.map((p) => p.path));
    setPathsWithPermissions(paths);
    setIsModalOpen(true);
  };

  const handleFormSuccess = () => {
    setIsModalOpen(false);
  };

  return (
    <div className="h-screen w-full">
      <CreateCapabilityFlowProvider
        onCreatePermission={handleCreatePermission}
      />

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
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
