import type { MDXComponents } from "mdx/types";
import type { ClassAttributes, HTMLAttributes } from "react";

import { CopyButton } from "./src/app/components/copy-button";

type TMDXProps = ClassAttributes<HTMLPreElement> &
  HTMLAttributes<HTMLPreElement> & { raw?: string };

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    pre: (props: TMDXProps) => (
      <pre {...props} className="flex justify-between">
        <div className="p-2">{props.children}</div>
        <div style={{ width: "auto" }}>
          {/* eslint-disable-next-line @typescript-eslint/non-nullable-type-assertion-style */}
          <CopyButton code={props.raw as string} />
        </div>
      </pre>
    ),
    ...components,
  };
}
