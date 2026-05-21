/** @type {import("next").NextConfig} */
const config = {
  reactStrictMode: true,
  output: "export",
  reactCompiler: true,
  transpilePackages: ["@torus-ts/ui", "@torus-network/torus-utils"],
  typescript: { ignoreBuildErrors: true },
  productionBrowserSourceMaps: false,
  experimental: {
    optimizePackageImports: [
      "viem",
      "wagmi",
      "@rainbow-me/rainbowkit",
      "lucide-react",
    ],
  },
};

export default config;
