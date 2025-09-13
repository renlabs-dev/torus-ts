import type { ComponentType, ReactNode } from "react";

interface ProviderRendererProps {
  providers: ComponentType<{ children: ReactNode }>[];
  children: ReactNode;
}

export function ProviderRenderer({
  providers,
  children,
}: ProviderRendererProps) {
  return providers.reduceRight(
    (acc, Component) => <Component>{acc}</Component>,
    children,
  );
}
