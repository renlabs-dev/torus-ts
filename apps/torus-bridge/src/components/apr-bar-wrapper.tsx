"use client";

import { useTorus } from "@torus-ts/torus-provider";
import { APRBarClient } from "@torus-ts/ui/components/apr";

export function APRBarWrapper() {
  const { api } = useTorus();
  return <APRBarClient api={api} />;
}
