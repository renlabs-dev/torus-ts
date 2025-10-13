"use client";

import { useTorus } from "@torus-ts/torus-provider";
import { APRBarClient } from "@torus-ts/ui/components/apr";

/**
 * Render an APRBarClient using the Torus API from context.
 *
 * @returns A React element that renders `APRBarClient` with the current Torus `api` prop.
 */
export function APRBarWrapper() {
  const { api } = useTorus();
  return <APRBarClient api={api} />;
}