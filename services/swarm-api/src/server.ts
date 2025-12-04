import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { cors } from "@elysiajs/cors";
import { node } from "@elysiajs/node";
import { openapi } from "@elysiajs/openapi";
import { Elysia } from "elysia";
import { Marked } from "marked";
import { zodToJsonSchema } from "zod-to-json-schema";
import { createAppContext } from "./context";
import { getEnv } from "./env";
import { authPlugin, requirePermission } from "./middleware/auth";
import { predictionsRouter } from "./routes/predictions";
import { tweetsRouter } from "./routes/tweets";
import { createSignedError, HttpError } from "./utils/errors";

const __dirname = dirname(fileURLToPath(import.meta.url));
const apiDocsMd = readFileSync(
  join(__dirname, "../docs/swarm_documentation.md"),
  "utf-8",
);
const marked = new Marked({
  async: false,
  renderer: {
    code({ text, lang }) {
      if (lang === "mermaid") {
        return `<div class="mermaid">${text}</div>`;
      }
      return `<pre><code class="language-${lang}">${text}</code></pre>`;
    },
  },
});
const apiDocsContent = marked.parse(apiDocsMd) as string;
const apiDocsHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Prediction Swarm API</title>
  <style>
    :root {
      --bg: #0d1117;
      --fg: #c9d1d9;
      --border: #30363d;
      --link: #58a6ff;
      --code-bg: #161b22;
      --heading: #f0f6fc;
    }
    * { box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
      background: var(--bg);
      color: var(--fg);
      line-height: 1.6;
      max-width: 900px;
      margin: 0 auto;
      padding: 2rem;
    }
    h1, h2, h3, h4 { color: var(--heading); margin-top: 2rem; }
    h1 { border-bottom: 1px solid var(--border); padding-bottom: 0.5rem; }
    h2 { border-bottom: 1px solid var(--border); padding-bottom: 0.3rem; }
    a { color: var(--link); text-decoration: none; }
    a:hover { text-decoration: underline; }
    code {
      background: var(--code-bg);
      padding: 0.2rem 0.4rem;
      border-radius: 4px;
      font-size: 0.9em;
    }
    pre {
      background: var(--code-bg);
      padding: 1rem;
      border-radius: 8px;
      overflow-x: auto;
      border: 1px solid var(--border);
    }
    pre code { background: none; padding: 0; }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 1rem 0;
    }
    th, td {
      border: 1px solid var(--border);
      padding: 0.75rem;
      text-align: left;
    }
    th { background: var(--code-bg); }
    blockquote {
      border-left: 4px solid var(--border);
      margin: 1rem 0;
      padding-left: 1rem;
      color: #8b949e;
    }
    hr { border: none; border-top: 1px solid var(--border); margin: 2rem 0; }
    ul, ol { padding-left: 2rem; }
    .mermaid { background: #fff; padding: 1rem; border-radius: 8px; }
  </style>
  <script type="module">
    import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.esm.min.mjs';
    mermaid.initialize({ startOnLoad: true, theme: 'default' });
  </script>
</head>
<body>
${apiDocsContent}
</body>
</html>`;

export async function createServer() {
  const env = getEnv(process.env);
  const context = await createAppContext(env);

  return new Elysia({ adapter: node() })
    .use(cors({ origin: true, methods: ["GET", "POST"] }))
    .use(
      openapi({
        mapJsonSchema: {
          zod: zodToJsonSchema,
        },
        documentation: {
          info: {
            title: "Prediction Swarm API",
            version: "1.0.0",
            description:
              "REST API for tweet prediction filtering by swarm agents",
          },
          tags: [
            { name: "tweets", description: "Tweet operations" },
            { name: "predictions", description: "Prediction operations" },
          ],
        },
      }),
    )
    .state("db", context.db)
    .state("wsAPI", context.wsAPI)
    .state("permissionCache", context.permissionCache)
    .state("serverSignHash", context.serverSignHash)
    .state("env", context.env)
    .derive(({ body, query }) => ({
      requestInput: body ?? query,
    }))
    .onError(({ code, error, set, requestInput, store }) => {
      const signHash = store.serverSignHash as (hash: string) => string;

      if (error instanceof HttpError) {
        set.status = error.status;
        return createSignedError(
          error.status,
          error.message,
          requestInput,
          signHash,
        );
      }

      if (code === "VALIDATION") {
        set.status = 400;
        return createSignedError(400, error.message, requestInput, signHash);
      }

      console.error("Unhandled error:", error);
      set.status = 500;
      return createSignedError(
        500,
        "Internal server error",
        requestInput,
        signHash,
      );
    })
    .get("/", () => {
      return new Response(apiDocsHtml, {
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    })
    .get("/health", () => ({ status: "ok" }))
    .use(authPlugin)
    .use(requirePermission(["prediction.filter"], context.permissionCache))
    .use(tweetsRouter)
    .use(predictionsRouter);
}
