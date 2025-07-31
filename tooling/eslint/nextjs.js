import nextPlugin from "@next/eslint-plugin-next";

const nextPageMetadataRequirementRule = {
  files: ["src/app/**/page.tsx", "src/app/**/layout.tsx"],
  rules: {
    "no-restricted-syntax": [
      "error",
      {
        selector:
          "Program:not(:has(ExportNamedDeclaration:has(Identifier[name='metadata']):not(:has(VariableDeclarator[init.async=true])), ExportNamedDeclaration:has(FunctionDeclaration[async=true][id.name='generateMetadata'])))",
        message:
          "Files 'page.tsx' and 'layout.tsx' must export either 'metadata' or 'generateMetadata'. See packages/ui/src/components/seo.tsx for more details.",
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
