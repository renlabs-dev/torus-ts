import nextPlugin from "@next/eslint-plugin-next";

const nextPageMetadataRequirementRule = {
  files: ["src/app/**/page.tsx", "src/app/**/layout.tsx"],
  rules: {
    "no-restricted-syntax": [
      "error",
      {
        selector: [
          // Fail if neither a static export nor a generateMetadata function is present
          "Program:not(:has(ExportNamedDeclaration:has(VariableDeclaration:has(VariableDeclarator[id.name='metadata'])), ExportNamedDeclaration:has(FunctionDeclaration[id.name='generateMetadata'])))",
          // Fail if 'metadata' is exported but is assigned to an async function (invalid in Next.js)
          "ExportNamedDeclaration > VariableDeclaration > VariableDeclarator[id.name='metadata'][init.async=true]",
          // Fail if 'metadata' is exported as a function declaration (should be a variable or generateMetadata)
          "ExportNamedDeclaration > FunctionDeclaration[id.name='metadata']",
        ].join(", "),
        message:
          "Files 'page.tsx' and 'layout.tsx' must export either a static 'metadata' object (not a function/async) or a 'generateMetadata' function. See packages/ui/src/components/seo.tsx for more details.",
      },
    ],
  },
};

/** @type {Awaited<import('typescript-eslint').Config>} */
export default [
  {
    files: ["**/*.ts", "**/*.tsx"],
    plugins: {
      "@next/next": nextPlugin,
    },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs["core-web-vitals"].rules,
      // TypeError: context.getAncestors is not a function
      "@next/next/no-duplicate-head": "off",
    },
  },
  nextPageMetadataRequirementRule,
];
