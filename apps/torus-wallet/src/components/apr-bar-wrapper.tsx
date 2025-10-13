"use client";

import { useTorus } from "@torus-ts/torus-provider";
import { APRBarClient } from "@torus-ts/ui/components/apr";

/**
 * Renders the APRBarClient component with the Torus API obtained from context.
 *
 * @returns A JSX element that renders `APRBarClient` with the Torus `api` passed as the `api` prop.
 */
export function APRBarWrapper() {
  const { api } = useTorus();
  return <APRBarClient api={api} />;
}