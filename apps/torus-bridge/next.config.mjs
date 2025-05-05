import { fileURLToPath } from "url";

// Import env files to validate at build time. Use jiti so we can load .ts files in here.
// WARNING: ONLY NEEDED IF NEXT_PUBLIC_* VARIABLES ARE USED IN THE APP DIRECTLY
// createJiti(fileURLToPath(import.meta.url))("./src/env");

/** @type {import("next").NextConfig} */
const config = {
  transpilePackages: [
    "@torus-ts/api",
    "@torus-ts/db",
    "@torus-ts/ui",
    "@torus-ts/env-validation",
  ],

  // Ativa os sourcemaps em produção para ajudar na depuração
  productionBrowserSourceMaps: true,

  // Ativa o modo de desenvolvimento detalhado para melhor depuração
  devIndicators: {
    position: "bottom-right",
  },

  // Configurações para melhorar o detalhamento de erros
  onDemandEntries: {
    // period (in ms) where the server will keep pages in the buffer
    maxInactiveAge: 60 * 1000,
    // number of pages that should be kept simultaneously without being disposed
    pagesBufferLength: 5,
  },

  reactStrictMode: true,

  /** We already do linting and typechecking as separate tasks in CI */
  eslint: {
    ignoreDuringBuilds: true,
    // Configuração para mostrar erro no console durante o desenvolvimento
    dirs: ["pages", "src"],
  },
  typescript: {
    ignoreBuildErrors: true,
    // Adiciona informações mais detalhadas sobre erros de TypeScript
    tsconfigPath: "./tsconfig.json",
  },

  webpack: (config, { isServer, webpack, dev }) => {
    // No custom devtool in development to avoid performance regressions
    if (dev) {
      // Adiciona definições para melhorar a depuração
      config.plugins.push(
        new webpack.DefinePlugin({
          "process.env.WEBPACK_DEV_SERVER": JSON.stringify(true),
        }),
      );
    }

    if (!isServer) {
      // Replace node: protocol imports with their browser versions
      config.plugins.push(
        new webpack.NormalModuleReplacementPlugin(/^node:/, (resource) => {
          resource.request = resource.request.replace(/^node:/, "");
        }),
      );

      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        child_process: false,
        util: fileURLToPath(new URL("util/", import.meta.url)),
        crypto: fileURLToPath(new URL("crypto-browserify", import.meta.url)),
        stream: fileURLToPath(new URL("stream-browserify", import.meta.url)),
        events: fileURLToPath(new URL("events/", import.meta.url)),
        process: fileURLToPath(new URL("process/browser", import.meta.url)),
      };
    }

    config.module.rules.push({
      test: /\.ya?ml$/,
      use: "yaml-loader",
    });

    // Adiciona estatísticas detalhadas para depuração em modo de desenvolvimento
    if (dev) {
      config.stats = {
        errors: true,
        warnings: true,
        modules: true,
        reasons: true,
      };
    }

    return config;
  },

  // Output as standalone instead of using experimental flag
  output: "standalone",
};

export default config;
