import type { ComponentType, PropsWithChildren, ReactNode } from "react";

type ProviderItem<P = unknown> =
  | ComponentType<PropsWithChildren<P>>
  | {
      component: ComponentType<PropsWithChildren<P>>;
      props: Omit<P, "children">;
    };

type ProviderArray = ProviderItem<any>[];

function isProviderWithProps<P>(provider: ProviderItem<P>): provider is {
  component: ComponentType<PropsWithChildren<P>>;
  props: Omit<P, "children">;
} {
  return (
    typeof provider === "object" &&
    "component" in provider &&
    "props" in provider
  );
}

interface ProviderRendererProps {
  providers: ProviderArray;
  children: ReactNode;
}

export function ProviderRenderer({
  providers,
  children,
}: ProviderRendererProps) {
  return providers.reduceRight((acc, provider) => {
    if (isProviderWithProps(provider)) {
      const { component: Component, props } = provider;
      return <Component {...props}>{acc}</Component>;
    }

    const Component = provider as ComponentType<{ children: ReactNode }>;
    return <Component>{acc}</Component>;
  }, children);
}

export function createProviderWithProps<T extends ComponentType<any>>(
  component: T,
  props: Omit<React.ComponentProps<T>, "children">,
): {
  component: T;
  props: Omit<React.ComponentProps<T>, "children">;
} {
  return { component, props };
}
