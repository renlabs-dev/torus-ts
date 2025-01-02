import { ErrorBoundary as ErrorBoundaryInner } from "@hyperlane-xyz/widgets";
import { links } from "@torus-ts/ui";
import type { PropsWithChildren } from "react";

export function ErrorBoundary({ children }: PropsWithChildren<unknown>) {
  return (
    <ErrorBoundaryInner supportLink={<SupportLink />}>
      {children}
    </ErrorBoundaryInner>
  );
}

function SupportLink() {
  return (
    <a
      href={links.discord}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-5 text-sm"
    >
      For support, join the{" "}
      <span className="underline underline-offset-2">Hyperlane Discord</span>{" "}
    </a>
  );
}
