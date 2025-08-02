"use client";

import { useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@torus-ts/ui/components/dialog";

import { CreateCapabilityPermissionForm } from "./_components/create-capability-permission-form";
import { NamespacePathSelectorFlow } from "./_components/namespace-path-selector-flow";

export default function CapabilityV2Page() {
  const [selectedPaths, setSelectedPaths] = useState<string[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleCreatePermission = (paths: string[]) => {
    setSelectedPaths(paths);
    setIsModalOpen(true);
  };

  const handleFormSuccess = () => {
    setIsModalOpen(false);
  };

  return (
    <div className="h-screen w-full">
      <NamespacePathSelectorFlow onCreatePermission={handleCreatePermission} />

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Capability Permission</DialogTitle>
          </DialogHeader>
          <CreateCapabilityPermissionForm
            selectedPaths={selectedPaths}
            onSuccess={handleFormSuccess}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
