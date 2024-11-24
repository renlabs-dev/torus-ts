import { fileURLToPath } from "url";
import nextMDX from "@next/mdx";
import createJiti from "jiti";
import rehypePrettyCode from "rehype-pretty-code";
import { visit } from "unist-util-visit";

/** @type {import('rehype-pretty-code').Options} */
const options = {
  theme: "one-dark-pro",
  keepBackground: false,
  defaultLang: "plaintext",
};

const withMDX = nextMDX({
  extension: /\.mdx?$/,
  options: {
    rehypePlugins: [
      () => (tree) => {
        visit(tree, (node) => {
          if (node?.type === "element" && node?.tagName === "pre") {
            const [codeEl] = node.children;

            if (codeEl.tagName !== "code") return;

            node.raw = codeEl.children?.[0].value;
          }
        });
      },
      [rehypePrettyCode, options],
      () => (tree) => {
        visit(tree, (node) => {
          if (node?.type === "element" && node?.tagName === "figure") {
            if (!("data-rehype-pretty-code-figure" in node.properties)) {
              return;
            }

            for (const child of node.children) {
              if (child.tagName === "pre") {
                child.properties["raw"] = node.raw;
              }
            }
          }
        });
      },
    ],
  },
});

// Import env files to validate at build time. Use jiti so we can load .ts files in here.
createJiti(fileURLToPath(import.meta.url))("./src/env");

/** @type {import("next").NextConfig} */
const config = {
  reactStrictMode: false,
  // Configure `pageExtensions` to include MDX files
  pageExtensions: ["js", "jsx", "mdx", "ts", "tsx"],
  /** Enables hot reloading for local packages without a build step */
  transpilePackages: [
    "@torus-ts/api",
    "@torus-ts/db",
    "@torus-ts/ui",
    // "@torus-ts/validators",
  ],

  /** We already do linting and typechecking as separate tasks in CI */
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
};

export default withMDX(config);
