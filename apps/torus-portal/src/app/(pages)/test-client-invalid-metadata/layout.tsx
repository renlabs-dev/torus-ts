import { createSeoMetadata } from "@torus-ts/ui/components/seo";
import { env } from "~/env";

export function generateMetadata() {
  return createSeoMetadata({
    title: "Test Client Component",
    description: "This is a test client component with proper metadata",
    keywords: ["test", "client", "component"],
    ogSiteName: "Torus Portal",
    canonical: "/test-client-invalid-metadata",
    baseUrl: env("BASE_URL"),
  });
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

