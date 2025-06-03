import { createSeoMetadata } from "@torus-ts/ui/components/seo";
import { env } from "~/env";

export const metadata = () =>
  createSeoMetadata({
    title: "Torus DAO - Dashboard",
    description: "Monitor DAO performance, agent health, and review governance applications through the Torus Network DAO dashboard.",
    keywords: ["torus dashboard", "dao metrics", "agent health", "dao applications", "governance dashboard", "torus network statistics"],
    baseUrl: env("BASE_URL"),
    canonical: "/dao-dashboard",
  });