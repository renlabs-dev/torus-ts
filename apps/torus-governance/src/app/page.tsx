import { createSeoMetadata } from "@torus-ts/ui/components/seo";
import { env } from "~/env";
import { StatueAnimation } from "./_components/statue-animation";

export const metadata = createSeoMetadata({
  title: "Torus Governance - Decentralized Network Governance",
  description: "Participate in Torus Network governance. Vote on proposals, manage DAO operations, and shape the future of decentralized infrastructure.",
  keywords: ["dao governance", "voting", "proposals", "decentralized governance", "network governance", "community voting"],
  ogSiteName: "Torus Governance",
  canonical: "/",
  baseUrl: env("BASE_URL"),
});

export default function HomePage() {
  return (
    <div className="animate-fade -z-10 h-screen w-full overflow-hidden">
      <StatueAnimation />
    </div>
  );
}
