"use client";

import { Suspense } from "react";
import PermissionGraphContainer from "../_components/permission-graph/permission-graph-container";

export default function PermissionGraphPage() {
  return (
    <Suspense fallback={null}>
      <PermissionGraphContainer />
    </Suspense>
  );
}
